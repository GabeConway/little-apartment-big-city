#!/usr/bin/env node
// playtest.mjs — drive *Little Apartment, Big City* in a real browser so Claude
// can playtest with confidence: boot it, seed a save, send inputs, read live
// game state, and screenshot. Pure Playwright + the Vite dev server; no Rust,
// no Tauri. See kb/playtesting.md for the full guide.
//
// Quick examples:
//   node scripts/playtest.mjs shot --new                       # title → new game, screenshot
//   node scripts/playtest.mjs shot --save shore --out out.png  # teleport to the shore
//   node scripts/playtest.mjs state --save rich                # print live state JSON
//   node scripts/playtest.mjs drive --new --hold ArrowDown:900 # walk, then snapshot
//   node scripts/playtest.mjs presets                          # list save presets
//
// The game exposes window.__lab.snapshot() only when the URL carries ?debug —
// this harness always adds it, so reads work without shipping a debug surface.

import { spawn } from 'node:child_process';
import { mkdir, readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PLAYTEST_PORT || 5179);

// px = tile * 16. Coords below land the player on a walkable tile in each scene
// (taken from the warp targets in maps.ts), so a teleport never drops you in a wall.
const SCENE_SPAWN = {
  apartment: { px: 112, py: 80 },
  city: { px: 96, py: 224 },
  shore: { px: 352, py: 48 },
  denden: { px: 128, py: 128 },
  konbini: { px: 112, py: 112 },
  badtown: { px: 16, py: 80 },
  casino: { px: 112, py: 112 },
};

// Partial saves merged over newSave() by loadSave(). Keep them shape-light; the
// game fills the rest. Use `--save @file.json` for anything bespoke.
const PRESETS = {
  // start states
  new: null, // clears the save → NEW GAME path
  rich: { money: 999999, canFish: true },
  fisher: { money: 20000, canFish: true },
  explorer: {
    money: 500000, canFish: true, wand: true, hat: true,
    vehicles: ['car', 'boat'],
    visited: ['apartment', 'city', 'denden', 'konbini', 'pawn', 'shore', 'badtown', 'nightclub', 'garage', 'gacha', 'backrooms', 'mines', 'shrine', 'island', 'deepsea'],
  },
  lowenergy: { money: 5000, canFish: true, energy: 4 },
  // teleports (scene + a safe spawn tile)
  ...Object.fromEntries(Object.entries(SCENE_SPAWN).map(([scene, p]) => [
    scene, { scene, ...p, canFish: true, money: 20000 },
  ])),
};

// ---- arg parsing --------------------------------------------------------------
function parseArgs(argv) {
  const cmd = argv[0] && !argv[0].startsWith('-') ? argv[0] : 'shot';
  const opts = { _: [] };
  const rest = cmd === argv[0] ? argv.slice(1) : argv;
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a === '--new') opts.new = true;
    else if (a === '--continue') opts.continue = true;
    else if (a === '--full') opts.full = true;
    else if (a === '--show' || a === '--headed') opts.show = true;
    else if (a === '--preview') opts.preview = true;
    else if (a.startsWith('--hold')) { (opts.hold ??= []).push(rest[++i]); }
    else if (a.startsWith('--')) { opts[a.slice(2)] = rest[i + 1]?.startsWith('--') || rest[i + 1] === undefined ? true : rest[++i]; }
    else opts._.push(a);
  }
  return { cmd, opts };
}

// ---- dev server ---------------------------------------------------------------
function startServer() {
  const proc = spawn('npx', ['vite', '--port', String(PORT), '--strictPort', '--clearScreen', 'false'], {
    cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env },
  });
  return new Promise((res, rej) => {
    const to = setTimeout(() => rej(new Error('vite did not start in 30s')), 30000);
    const onData = (b) => {
      if (/Local:\s+http/.test(b.toString()) || /ready in/.test(b.toString())) {
        clearTimeout(to); res(proc);
      }
    };
    proc.stdout.on('data', onData);
    proc.stderr.on('data', (b) => { if (/error/i.test(b.toString())) process.stderr.write(b); });
    proc.on('exit', (c) => rej(new Error(`vite exited early (${c})`)));
  });
}

async function loadSaveArg(saveArg) {
  if (saveArg === undefined) return undefined;  // no --save → leave existing localStorage
  if (saveArg === 'new') return null;           // explicit clear
  if (saveArg.startsWith('@')) return JSON.parse(await readFile(resolve(ROOT, saveArg.slice(1)), 'utf8'));
  if (saveArg.startsWith('{')) return JSON.parse(saveArg);
  if (saveArg in PRESETS) return PRESETS[saveArg];
  throw new Error(`unknown preset "${saveArg}". Run: node scripts/playtest.mjs presets`);
}

// ---- key driving --------------------------------------------------------------
// --keys "ArrowDown ArrowDown e i Escape"  → discrete presses
// --hold "ArrowRight:1200"                  → hold a key (walk) for ms
async function runInputs(page, opts) {
  const delay = Number(opts['key-delay'] || 140);
  for (const hold of opts.hold || []) {
    const [key, ms] = hold.split(':');
    await page.keyboard.down(key);
    await page.waitForTimeout(Number(ms || 800));
    await page.keyboard.up(key);
    await page.waitForTimeout(120);
  }
  if (opts.keys) {
    for (const k of String(opts.keys).trim().split(/\s+/)) {
      await page.keyboard.press(k.length === 1 ? k : k);
      await page.waitForTimeout(delay);
    }
  }
}

async function snapshot(page) {
  return page.evaluate(() => (window.__lab ? window.__lab.snapshot() : null));
}

// ---- main ---------------------------------------------------------------------
async function main() {
  const { cmd, opts } = parseArgs(process.argv.slice(2));

  if (cmd === 'presets') {
    console.log('Save presets (use with --save <name>):\n');
    for (const k of Object.keys(PRESETS)) {
      console.log(`  ${k.padEnd(12)} ${k in SCENE_SPAWN ? 'teleport → ' + k : JSON.stringify(PRESETS[k])}`);
    }
    console.log('\nAlso: --save @path/to/file.json   or   --save \'{"money":50000}\'');
    return;
  }

  const ownUrl = typeof opts.url === 'string';
  let server, browser;
  try {
    const base = ownUrl ? opts.url : `http://localhost:${PORT}`;
    if (!ownUrl) { process.stderr.write('• starting vite…\n'); server = await startServer(); }

    browser = await chromium.launch({ headless: !opts.show });
    const context = await browser.newContext({
      viewport: { width: Number(opts.width || 1280), height: Number(opts.height || 800) },
      deviceScaleFactor: Number(opts.dpr || 1),
    });
    const page = await context.newPage();
    page.on('console', (m) => { if (m.type() === 'error') process.stderr.write(`  [page error] ${m.text()}\n`); });
    page.on('pageerror', (e) => process.stderr.write(`  [pageerror] ${e.message}\n`));

    // Seed localStorage before the app boots: nav once to set origin, write, reload.
    const url = `${base}/?debug`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const save = await loadSaveArg(opts.save);
    if (opts.scale) await page.evaluate((s) => localStorage.setItem('lab-scale', String(s)), opts.scale);
    if (opts.save !== undefined) {
      await page.evaluate((s) => {
        if (s === null) localStorage.removeItem('lab-save');
        else localStorage.setItem('lab-save', JSON.stringify({ v: 2, ...s }));
      }, save ?? null);
      await page.reload({ waitUntil: 'domcontentloaded' });
    }

    // Wait for the title screen to mount, then enter the game.
    await page.waitForFunction(() => !!window.__lab, null, { timeout: 10000 });
    const wantNew = opts.new || (opts.save === 'new');
    const wantContinue = opts.continue;
    if (cmd !== 'title') {
      const startBtn = wantNew ? 'NEW GAME'
        : wantContinue ? 'CONTINUE'
        : null;
      // Default: click whatever start button is present (CONTINUE if a save exists).
      const clicked = await page.evaluate((label) => {
        const btns = [...document.querySelectorAll('button')];
        const pick = label
          ? btns.find((b) => b.textContent.trim().toUpperCase().startsWith(label))
          : btns.find((b) => /^(CONTINUE|NEW GAME)$/i.test(b.textContent.trim()));
        if (pick) { pick.click(); return pick.textContent.trim(); }
        return null;
      }, startBtn);
      if (!clicked) throw new Error('no start button found on the title screen');
      process.stderr.write(`• clicked ${clicked}\n`);
      // The start transition covers ~1.4s before gameplay is interactive.
      await page.waitForFunction(() => window.__lab.snapshot().screen === 'playing', null, { timeout: 8000 });
      await page.waitForTimeout(400);

      // Arrival can pop a story letter that eats movement input. Clear any
      // opening overlay (Esc closes letters/dialog/menu) unless asked to keep it.
      if (!opts['keep-overlay']) {
        for (let i = 0; i < 4 && (await snapshot(page)).overlay; i++) {
          await page.keyboard.press('Escape');
          await page.waitForTimeout(160);
        }
      }
    }

    // --click "TEXT" (or "A,B,C" for a sequence): click the first button whose
    // label contains TEXT. Works on the title screen and in-game DOM menus.
    if (opts.click) {
      for (const t of String(opts.click).split(',')) {
        const hit = await page.evaluate((label) => {
          const b = [...document.querySelectorAll('button')].find((x) => x.textContent.toUpperCase().includes(label.toUpperCase()));
          if (b) { b.click(); return b.textContent.trim(); }
          return null;
        }, t.trim());
        if (!hit) throw new Error(`no button matching "${t.trim()}"`);
        process.stderr.write(`• clicked "${hit}"\n`);
        await page.waitForTimeout(250);
      }
    }

    await runInputs(page, opts);
    if (opts.wait) await page.waitForTimeout(Number(opts.wait));

    const snap = await snapshot(page);

    // --assert "<expr>": eval a JS boolean against the snapshot. Snapshot keys
    // (money, scene, day, energy, overlay, …) and the full `save` are in scope.
    // Exit 1 on failure so the run is CI/agent-checkable without parsing JSON.
    if (opts.assert) {
      const expr = String(opts.assert);
      let ok;
      try {
        ok = Function(...Object.keys(snap), `return (${expr});`)(...Object.values(snap));
      } catch (e) {
        process.stderr.write(`✗ assert errored: ${e.message}\n`);
        process.stdout.write(JSON.stringify(snap, null, 2) + '\n');
        process.exitCode = 1;
        return;
      }
      process.stderr.write(`${ok ? '✓' : '✗'} assert: ${expr}\n`);
      if (!ok) process.exitCode = 1;
    }

    if (cmd === 'shot' || cmd === 'title' || cmd === 'drive') {
      const out = resolve(ROOT, opts.out || `playtest/shot-${Date.now()}.png`);
      await mkdir(dirname(out), { recursive: true });
      if (opts.full) {
        await page.screenshot({ path: out, fullPage: true });
      } else {
        const canvas = page.locator('canvas');
        await canvas.screenshot({ path: out });
      }
      process.stderr.write(`• screenshot → ${out}\n`);
    }

    // Always print the live snapshot as the last line of stdout (machine-readable).
    process.stdout.write(JSON.stringify(snap, null, 2) + '\n');
  } finally {
    if (browser) await browser.close();
    if (server) server.kill('SIGTERM');
  }
}

main().catch((e) => { process.stderr.write(`✗ ${e.stack || e.message}\n`); process.exit(1); });
