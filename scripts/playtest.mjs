#!/usr/bin/env node
// playtest.mjs — drive *Little Apartment, Big City* in a real browser so Claude
// can playtest with confidence: boot it, seed a save, send inputs, read live
// game state, and screenshot. Pure Playwright + the Vite dev server; no Rust,
// no Tauri. See kb/testing.md for the full guide.
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
import { CHECKS } from './checkups.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.PLAYTEST_PORT || 5179);

// px = tile * 16. Coords below land the player on a walkable tile in each scene
// (taken from the warp targets in maps.ts), so a teleport never drops you in a wall.
// Safe spawn tile per scene (px/py = warp-target tile ×16, walkable on arrival).
// Covers all 22 scenes so `--save <scene>` and the `smoke` command can reach
// every map. Tiles sourced from the `to:'<scene>'` warp targets in maps.ts.
const SCENE_SPAWN = {
  apartment: { px: 112, py: 80 },
  city: { px: 96, py: 224 },
  denden: { px: 128, py: 128 },
  konbini: { px: 112, py: 112 },
  pawn: { px: 96, py: 112 },
  gacha: { px: 80, py: 96 },
  greenhouse: { px: 112, py: 128 },
  shore: { px: 352, py: 48 },
  badtown: { px: 16, py: 80 },
  shrine: { px: 144, py: 128 },
  nightclub: { px: 112, py: 128 },
  garage: { px: 128, py: 112 },
  casino: { px: 112, py: 112 },
  backroom: { px: 80, py: 80 },
  museum: { px: 112, py: 128 },
  backrooms: { px: 128, py: 32 },
  mines: { px: 32, py: 32 },
  island: { px: 80, py: 112 },
  seacave: { px: 80, py: 80 },
  hackerlab: { px: 80, py: 112 }, // the Hacker's server closet, just inside the door (5,7)
  deepsea: { px: 128, py: 128 },
  paris: { px: 128, py: 160 },
  moon: { px: 144, py: 92 },   // shadow-figure arrival tile (9,6)
};

// Unlock flags so a teleport into a gated scene is actually usable (the gates
// only matter for *reaching* a scene by walking; begin() drops you in regardless,
// but these keep interactables/exits sane).
const SCENE_EXTRA = {
  greenhouse: { greenhouseUnlocked: true },
  backrooms: { backroomsUnlocked: true, wand: true },
  mines: { backroomsUnlocked: true, wand: true },
  casino: { gangPaid: true },
  backroom: { gangPaid: true, casinoWins: 30 },
  paris: { backroomsUnlocked: true, parisRevealed: true },
  island: { vehicles: ['boat'] },
  seacave: { vehicles: ['boat'], parisRevealed: true },   // so the hatch is cut into the back wall
  hackerlab: { vehicles: ['boat'], parisRevealed: true },
  deepsea: { vehicles: ['boat'] },
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
    scene, { scene, ...p, canFish: true, money: 20000, ...(SCENE_EXTRA[scene] || {}) },
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
  // Run vite's bin with this same node rather than going through `npx`. On
  // Windows `npx` is npx.cmd, which CreateProcess can't spawn directly (ENOENT),
  // and routing around that with shell:true leaves vite as a grandchild of
  // cmd.exe — killing the shell then orphans it holding the port, so the next
  // run dies on --strictPort. Spawning node directly makes the kill land.
  const viteBin = resolve(ROOT, 'node_modules', 'vite', 'bin', 'vite.js');
  const proc = spawn(process.execPath, [viteBin, '--port', String(PORT), '--strictPort', '--clearScreen', 'false'], {
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
    // Buffer runtime errors so the `smoke` sweep can attribute them per scene
    // (and so single runs still echo them to stderr live).
    const errBuf = [];
    page.on('console', (m) => { if (m.type() === 'error') { errBuf.push(m.text()); process.stderr.write(`  [page error] ${m.text()}\n`); } });
    page.on('pageerror', (e) => { errBuf.push(e.message); process.stderr.write(`  [pageerror] ${e.message}\n`); });

    // Seed localStorage before the app boots: nav once to set origin, write, reload.
    const url = `${base}/?debug`;
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // `smoke` — sweep every scene, teleport in, and report any runtime error +
    // the live overlay. One run covers all 19 maps. Exit 1 if any scene errored.
    if (cmd === 'smoke') {
      const only = opts.scene ? String(opts.scene).split(',') : null;
      const scenes = Object.keys(SCENE_SPAWN).filter((s) => !only || only.includes(s));
      const rows = [];
      let bad = 0;
      for (const scene of scenes) {
        errBuf.length = 0;
        const seed = { v: 2, scene, ...SCENE_SPAWN[scene], canFish: true, money: 50000, visited: [scene], ...(SCENE_EXTRA[scene] || {}) };
        await page.evaluate((s) => localStorage.setItem('lab-save', JSON.stringify(s)), seed);
        await page.reload({ waitUntil: 'domcontentloaded' });
        let landed = '?', overlay = 'none';
        try {
          await page.waitForFunction(() => !!window.__lab, null, { timeout: 10000 });
          await page.evaluate(() => {
            const b = [...document.querySelectorAll('button')].find((x) => /^CONTINUE$/i.test(x.textContent.trim()));
            if (b) b.click();
          });
          await page.waitForFunction(() => window.__lab.snapshot().screen === 'playing', null, { timeout: 8000 });
          // clear any arrival overlay so it can't mask a draw-loop error
          for (let i = 0; i < 4; i++) {
            const snap = await page.evaluate(() => window.__lab.snapshot());
            if (!snap.overlay) break;
            await page.keyboard.press('Escape');
            await page.waitForTimeout(140);
          }
          await page.waitForTimeout(Number(opts.wait || 500));
          const snap = await page.evaluate(() => window.__lab.snapshot());
          landed = snap.scene; overlay = snap.overlay || 'none';
        } catch (e) {
          errBuf.push(`reach-fail: ${e.message.split('\n')[0]}`);
        }
        const errs = [...new Set(errBuf)];
        if (errs.length || landed !== scene) bad++;
        rows.push({ scene, landed, overlay, errs });
        process.stderr.write(`  ${landed === scene && !errs.length ? '✓' : '✗'} ${scene}\n`);
      }
      process.stdout.write(JSON.stringify({ ok: bad === 0, total: scenes.length, failed: bad, scenes: rows }, null, 2) + '\n');
      if (bad) process.exitCode = 1;
      return;
    }

    // `checkup` — run the named end-to-end regression battery (scripts/checkups.mjs)
    // in one browser session. Each check seeds a save, boots, drives inputs, and
    // evals its assert against the live snapshot. `--only a,b` runs a subset.
    // Exit 1 if any check fails — one command regression-guards the mechanics.
    if (cmd === 'checkup') {
      const only = opts.only ? String(opts.only).split(',').map((s) => s.trim()) : null;
      const checks = CHECKS.filter((c) => !only || only.includes(c.name));
      if (!checks.length) throw new Error(`--only matched no checks (have: ${CHECKS.map((c) => c.name).join(', ')})`);
      const rows = [];
      let bad = 0;
      for (const check of checks) {
        errBuf.length = 0;
        let ok = false, detail = '';
        try {
          await page.evaluate((s) => {
            if (s === null) localStorage.removeItem('lab-save');
            else localStorage.setItem('lab-save', JSON.stringify({ v: 2, ...s }));
          }, check.save ?? null);
          await page.reload({ waitUntil: 'domcontentloaded' });
          await page.waitForFunction(() => !!window.__lab, null, { timeout: 10000 });
          // Enter the game: CONTINUE when a save was seeded, NEW GAME (+ vibe START) otherwise.
          const clicked = await page.evaluate(() => {
            const b = [...document.querySelectorAll('button')].find((x) => /^(CONTINUE|NEW GAME)$/i.test(x.textContent.trim()));
            if (b) { b.click(); return b.textContent.trim(); }
            return null;
          });
          if (/NEW GAME/i.test(clicked || '')) {
            await page.waitForTimeout(300);
            await page.evaluate(() => {
              const btn = [...document.querySelectorAll('button')].find((b) => /START/i.test(b.textContent.trim()));
              if (btn) btn.click();
            });
          }
          await page.waitForFunction(() => window.__lab.snapshot().screen === 'playing', null, { timeout: 8000 });
          await page.waitForTimeout(400);
          if (!check.keepOverlay) {
            for (let i = 0; i < 4 && (await snapshot(page)).overlay; i++) {
              await page.keyboard.press('Escape');
              await page.waitForTimeout(160);
            }
          }
          await runInputs(page, { hold: check.hold, keys: check.keys });
          for (const t of String(check.click || '').split(',').filter(Boolean)) {
            let hit = null;
            for (let tries = 0; tries < 20 && !hit; tries++) {
              hit = await page.evaluate((label) => {
                const b = [...document.querySelectorAll('button')].find((x) => x.textContent.toUpperCase().includes(label.toUpperCase()));
                if (b) { b.click(); return b.textContent.trim(); }
                return null;
              }, t.trim());
              if (!hit) await page.waitForTimeout(100);
            }
            if (!hit) throw new Error(`no button matching "${t.trim()}"`);
            await page.waitForTimeout(250);
          }
          if (check.wait) await page.waitForTimeout(Number(check.wait));
          const snap = await snapshot(page);
          ok = !!Function(...Object.keys(snap), `return (${check.assert});`)(...Object.values(snap));
          if (!ok) detail = `assert false: ${check.assert}`;
        } catch (e) {
          detail = e.message.split('\n')[0];
        }
        const errs = [...new Set(errBuf)];
        if (errs.length) { ok = false; detail = detail || errs.join(' | '); }
        if (!ok) bad++;
        rows.push({ name: check.name, ok, note: check.note, ...(ok ? {} : { detail, errs }) });
        process.stderr.write(`  ${ok ? '✓' : '✗'} ${check.name}${ok ? '' : ` — ${detail}`}\n`);
      }
      process.stdout.write(JSON.stringify({ ok: bad === 0, total: checks.length, failed: bad, checks: rows }, null, 2) + '\n');
      if (bad) process.exitCode = 1;
      return;
    }

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
      // NEW GAME opens the "what's your vibe?" character picker (still screen:title).
      // Click its START › so a fresh game actually reaches gameplay.
      if (/NEW GAME/i.test(clicked)) {
        const started = await page.evaluate(() => {
          const btn = [...document.querySelectorAll('button')]
            .find((b) => /START/i.test(b.textContent.trim()));
          if (btn) { btn.click(); return true; }
          return false;
        });
        if (started) process.stderr.write('• picked vibe → START\n');
      }
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

    // --keys run first (e.g. press E to open a menu), THEN --click its buttons.
    await runInputs(page, opts);

    // --click "TEXT" (or "A,B,C" for a sequence): click the first button whose
    // label contains TEXT. Works on the title screen and in-game DOM menus.
    if (opts.click) {
      for (const t of String(opts.click).split(',')) {
        // poll up to ~2s so a menu opened by a preceding --keys press has time to mount
        let hit = null;
        for (let tries = 0; tries < 20 && !hit; tries++) {
          hit = await page.evaluate((label) => {
            const b = [...document.querySelectorAll('button')].find((x) => x.textContent.toUpperCase().includes(label.toUpperCase()));
            if (b) { b.click(); return b.textContent.trim(); }
            return null;
          }, t.trim());
          if (!hit) await page.waitForTimeout(100);
        }
        if (!hit) throw new Error(`no button matching "${t.trim()}"`);
        process.stderr.write(`• clicked "${hit}"\n`);
        await page.waitForTimeout(250);
      }
    }

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
