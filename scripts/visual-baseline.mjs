#!/usr/bin/env node
// visual-baseline.mjs — golden-frame screenshot regression for the canvas render.
// The unit tests cover pure logic; the playtest snapshot covers the *model*.
// Neither sees the *view*: a wrong sprite offset, z-order, an inverted day/night
// wash, or an off-canvas HUD all pass green. This catches that class by diffing a
// few deterministic frames against committed baselines — no new deps (the diff
// runs in-browser, which already decodes PNG via canvas getImageData).
//
//   node scripts/visual-baseline.mjs --update      # (re)write tests/visual/baseline/*.png
//   node scripts/visual-baseline.mjs               # compare; exit 1 on regression
//   node scripts/visual-baseline.mjs --tolerance 3 # max % of differing pixels (default 5)
//   node scripts/visual-baseline.mjs --only night-city
//
// Baselines live in tests/visual/baseline/ (commit them). On a compare run the
// current frames go to tests/visual/current/ and per-frame diff masks to
// tests/visual/diff/ so a failure is eyeball-able. Tolerance is generous on
// purpose: idle sprite bob / water frames jitter ~1-2%; a real regression moves
// 20%+, so the band cleanly separates noise from breakage.

import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PLAYTEST_PORT || 5181);
const VIS = resolve(ROOT, 'tests/visual');
const FORCE_SCALE = 2; // pin lab-scale so the canvas backing is a stable 768×448

// Each frame: a seeded save + how to grab it. `fullPage` frames screenshot the
// whole viewport (DOM overlays like the phone live outside the canvas); the rest
// shoot the canvas locator so size is deterministic. timeMin picks the wash:
// 12:00 = neutral day, 21:00 = full night wash + relit signs.
const FRAMES = [
  { name: 'day-apartment', save: { scene: 'apartment', px: 112, py: 80, timeMin: 12 * 60 } },
  { name: 'day-city', save: { scene: 'city', px: 96, py: 224, timeMin: 12 * 60 } },
  { name: 'night-city', save: { scene: 'city', px: 96, py: 224, timeMin: 21 * 60 } },
  { name: 'phone', save: { scene: 'apartment', px: 112, py: 80, timeMin: 12 * 60 }, keys: 'p', keepOverlay: true, fullPage: true },
];

function parseArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--update') opts.update = true;
    else if (a === '--show' || a === '--headed') opts.show = true;
    else if (a.startsWith('--')) opts[a.slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
  }
  return opts;
}

function startServer() {
  const proc = spawn('npx', ['vite', '--port', String(PORT), '--strictPort', '--clearScreen', 'false'], {
    cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env },
  });
  return new Promise((res, rej) => {
    const to = setTimeout(() => rej(new Error('vite did not start in 30s')), 30000);
    proc.stdout.on('data', (b) => {
      if (/Local:\s+http/.test(b.toString()) || /ready in/.test(b.toString())) { clearTimeout(to); res(proc); }
    });
    proc.stderr.on('data', (b) => { if (/error/i.test(b.toString())) process.stderr.write(b); });
    proc.on('exit', (c) => rej(new Error(`vite exited early (${c})`)));
  });
}

// Diff two PNG buffers inside the page: decode both via Image, draw to canvases,
// count pixels whose per-channel delta exceeds `thresh`. Returns {ratio,w,h} and
// a base64 diff mask (changed pixels in magenta over a dimmed base).
async function diffInPage(page, aBuf, bBuf, thresh = 24) {
  return page.evaluate(async ({ a, b, thresh }) => {
    const load = (d) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = 'data:image/png;base64,' + d; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) {
      return { mismatch: true, aw: ia.width, ah: ia.height, bw: ib.width, bh: ib.height };
    }
    const w = ia.width, h = ia.height;
    const mk = (im) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(im, 0, 0); return x; };
    const xa = mk(ia), xb = mk(ib);
    const da = xa.getImageData(0, 0, w, h).data, db = xb.getImageData(0, 0, w, h).data;
    const out = xa.createImageData(w, h), od = out.data;
    let diff = 0;
    for (let i = 0; i < da.length; i += 4) {
      const dr = Math.abs(da[i] - db[i]), dg = Math.abs(da[i + 1] - db[i + 1]), dbl = Math.abs(da[i + 2] - db[i + 2]);
      if (dr > thresh || dg > thresh || dbl > thresh) {
        diff++; od[i] = 255; od[i + 1] = 0; od[i + 2] = 255; od[i + 3] = 255;
      } else {
        od[i] = da[i]; od[i + 1] = da[i + 1]; od[i + 2] = da[i + 2]; od[i + 3] = 60;
      }
    }
    const cc = document.createElement('canvas'); cc.width = w; cc.height = h; cc.getContext('2d').putImageData(out, 0, 0);
    return { ratio: diff / (w * h), w, h, mask: cc.toDataURL('image/png').split(',')[1] };
  }, { a: aBuf.toString('base64'), b: bBuf.toString('base64'), thresh });
}

async function capture(page, base, frame) {
  const url = `${base}/?debug`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.evaluate((s) => localStorage.setItem('lab-scale', String(s)), FORCE_SCALE);
  await page.evaluate((s) => localStorage.setItem('lab-save', JSON.stringify({ v: 2, ...s })), frame.save);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!window.__lab, null, { timeout: 10000 });

  // Enter via CONTINUE (the seeded save), wait for gameplay.
  const clicked = await page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find((x) => /^(CONTINUE|NEW GAME)$/i.test(x.textContent.trim()));
    if (b) { b.click(); return true; } return false;
  });
  if (!clicked) throw new Error('no start button on title screen');
  await page.waitForFunction(() => window.__lab.snapshot().screen === 'playing', null, { timeout: 8000 });
  await page.waitForTimeout(500);

  // Always clear the opening story letter (it eats input) BEFORE pressing frame
  // keys — otherwise `p` never reaches the phone. `keepOverlay` only means the
  // frame's own keys open an overlay we then want to shoot.
  for (let i = 0; i < 4 && (await page.evaluate(() => window.__lab.snapshot().overlay)); i++) {
    await page.keyboard.press('Escape'); await page.waitForTimeout(160);
  }
  if (frame.keys) { for (const k of frame.keys.split(/\s+/)) { await page.keyboard.press(k); await page.waitForTimeout(220); } }
  await page.waitForTimeout(250);

  return frame.fullPage ? page.screenshot() : page.locator('canvas').screenshot();
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const tolerance = Number(opts.tolerance ?? 5) / 100;
  const frames = opts.only ? FRAMES.filter((f) => f.name === opts.only) : FRAMES;
  if (frames.length === 0) throw new Error(`no frame named "${opts.only}". Known: ${FRAMES.map((f) => f.name).join(', ')}`);

  let server, browser;
  const failures = [];
  try {
    process.stderr.write('• starting vite…\n');
    server = await startServer();
    const base = `http://localhost:${PORT}`;
    browser = await chromium.launch({ headless: !opts.show });
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('pageerror', (e) => process.stderr.write(`  [pageerror] ${e.message}\n`));

    if (opts.update) {
      await mkdir(resolve(VIS, 'baseline'), { recursive: true });
      for (const f of frames) {
        const buf = await capture(page, base, f);
        await writeFile(resolve(VIS, 'baseline', `${f.name}.png`), buf);
        process.stderr.write(`• baseline ${f.name}.png (${buf.length} bytes)\n`);
      }
      process.stderr.write(`\n✓ wrote ${frames.length} baseline(s). Commit tests/visual/baseline/.\n`);
      return;
    }

    await rm(resolve(VIS, 'current'), { recursive: true, force: true });
    await rm(resolve(VIS, 'diff'), { recursive: true, force: true });
    await mkdir(resolve(VIS, 'current'), { recursive: true });
    await mkdir(resolve(VIS, 'diff'), { recursive: true });

    for (const f of frames) {
      let baseline;
      try { baseline = await readFile(resolve(VIS, 'baseline', `${f.name}.png`)); }
      catch { failures.push(`${f.name}: no baseline — run with --update first`); continue; }

      const cur = await capture(page, base, f);
      await writeFile(resolve(VIS, 'current', `${f.name}.png`), cur);
      const d = await diffInPage(page, baseline, cur);

      if (d.mismatch) {
        failures.push(`${f.name}: size changed ${d.aw}×${d.ah} → ${d.bw}×${d.bh}`);
        continue;
      }
      await writeFile(resolve(VIS, 'diff', `${f.name}.png`), Buffer.from(d.mask, 'base64'));
      const pct = (d.ratio * 100).toFixed(2);
      if (d.ratio > tolerance) {
        failures.push(`${f.name}: ${pct}% changed (> ${(tolerance * 100).toFixed(0)}%) — see tests/visual/diff/${f.name}.png`);
        process.stderr.write(`✗ ${f.name}  ${pct}%\n`);
      } else {
        process.stderr.write(`✓ ${f.name}  ${pct}%\n`);
      }
    }
  } finally {
    if (browser) await browser.close();
    if (server) server.kill('SIGTERM');
  }

  if (failures.length) {
    process.stderr.write(`\n✗ visual regression:\n  ${failures.join('\n  ')}\n`);
    process.exit(1);
  }
  process.stderr.write('\n✓ all frames within tolerance\n');
}

main().catch((e) => { process.stderr.write(`✗ ${e.stack || e.message}\n`); process.exit(1); });
