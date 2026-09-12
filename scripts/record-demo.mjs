#!/usr/bin/env node
// record-demo.mjs — record a gameplay showcase video of *Little Apartment, Big City*
// entirely locally. No capture card, no screen recorder, no human at the keyboard.
//
//   node scripts/record-demo.mjs                 # → demo/little-apartment-demo.mp4
//   node scripts/record-demo.mjs --only karaoke  # record a subset of the beats
//   node scripts/record-demo.mjs --keep-frames   # leave the raw jpegs on disk
//
// How it works
// ------------
// 1. Spawns the Vite dev server and drives the real game in headless Chromium
//    (same path as scripts/playtest.mjs — real keyboard events, ?debug snapshot).
// 2. Captures video with CDP `Page.startScreencast` rather than Playwright's
//    built-in recorder: the screencast gives one frame per *presented* frame with
//    a real timestamp, so a 60fps pixel-art game stays smooth (Playwright's
//    recorder is locked to 25fps and judders on the karaoke chart).
// 3. Only frames inside a named BEAT make the cut — the load/teleport gaps
//    between beats are dropped, so the montage hard-cuts scene to scene instead
//    of flashing the title screen every time we reseed the save.
// 4. ffmpeg crops to the canvas rect, encodes at 60fps, and lays the game's own
//    soundtrack under it: each beat gets its scene's track (SCENE_MUSIC), and the
//    karaoke beat gets "Midnight Neon" delayed to the exact frame the song starts
//    in-game, so the chart and the music line up in the video.
//
// The two minigames are *played*, not faked: the karaoke chart is replicated from
// KARAOKE_CHART + its fixed lane seed and tapped in-page on the audio clock, and
// the reel is closed-loop steered off the debug snapshot's fishing state.

import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORT = Number(process.env.DEMO_PORT || 5181);
const OUT_DIR = join(ROOT, 'demo');
const WORK = join(OUT_DIR, '.work');

const VIEW_W = 1280, VIEW_H = 800;
const FPS = 60;

// Karaoke constants mirrored from LittleApartmentGame.tsx. If the chart there
// changes, change it here too (the autoplayer taps this chart, not the game's).
const KARAOKE_BPM = 129;
const KARAOKE_BEAT = 60 / KARAOKE_BPM;
const KARAOKE_COUNTIN = 4 * KARAOKE_BEAT;
const KARAOKE_CHART = [
  1.43, 2.36, 3.29, 4.22, 5.15, 6.08, 7.01, 7.94, 8.87, 9.80, 10.73, 11.66, 12.59,
  14.45, 14.92, 15.38, 16.31, 18.64, 20.03, 21.89, 22.36, 22.82, 23.75, 26.07, 27.47,
];

// Scene → soundtrack, mirrored from SCENE_MUSIC. Beats name a scene; the encoder
// looks the track up here to build the audio bed.
const MUSIC = {
  title: 'title.mp3',
  apartment: 'apartment.mp3',
  city: 'tokyo-apt-drift.mp3',
  shore: 'fishing.mp3',
  nightclub: 'the-club.mp3',
  shrine: 'shrine.mp3',
  museum: 'museum.mp3',
  karaoke: 'karaoke-midnight-neon.mp3',
};

// ---- the demo save ------------------------------------------------------------
// A lived-in town: a furnished apartment, a rod, friends on the phone, money to
// spend. Merged over newSave() by loadSave(), same as the playtest presets.
const DEMO_SAVE = {
  v: 2, vibe: 'fem', name: 'Neighbor',
  money: 84200, day: 12, energy: 118,
  canFish: true, fishRod: 2, greenhouseUnlocked: true, zamazonkApp: true, hat: true,
  owned: ['bed', 'tv', 'lamp', 'microwave', 'fridge', 'sofa', 'desk', 'bookshelf', 'plant', 'ac'],
  rares: ['kotatsu', 'aquarium', 'arcade', 'neon'],
  roomUnlocked: true,           // the knocked-through two-room apartment (24×10 — fills the viewport)
  // Furniture has to be *placed* to show up (owning it just boxes it). These are
  // the default slots from APARTMENT_SLOTS / RARE_SLOTS, plus the second room.
  placed: {
    bed: { x: 1, y: 1 }, tv: { x: 6, y: 1 }, lamp: { x: 9, y: 1 },
    microwave: { x: 11, y: 1 }, fridge: { x: 13, y: 1 }, sofa: { x: 5, y: 3 },
    desk: { x: 1, y: 4 }, bookshelf: { x: 1, y: 6 }, plant: { x: 14, y: 7 },
    ac: { x: 4, y: 0 }, kotatsu: { x: 7, y: 5 }, aquarium: { x: 21, y: 1 },
    arcade: { x: 18, y: 1 }, neon: { x: 19, y: 0 },
  },
  rugs: [{ id: 'rug-persian', x: 5, y: 6 }, { id: 'rug-tatami', x: 18, y: 5 }],
  visited: ['apartment', 'city', 'denden', 'konbini', 'pawn', 'shore', 'shrine', 'nightclub', 'badtown', 'museum', 'greenhouse'],
  metStores: ['denden', 'konbini', 'pawn'],
  friends: {
    granny: { pts: 34, giftDay: 2 }, charlie: { pts: 21, giftDay: 3 },
    genji: { pts: 28, giftDay: 1 }, miko: { pts: 18, giftDay: 4 },
    bingus: { pts: 12, giftDay: 5 }, tex: { pts: 9, giftDay: 6 },
    david: { pts: 41, giftDay: 7 },
  },
  fishLog: { minnow: 6, mackerel: 3, bream: 2, squid: 1, eel: 1 },
  storySeen: ['fish-howto'],   // skip the first-cast tutorial dialog
  // Already-earned trophies, so their toast doesn't re-pop at the top of every
  // beat (each beat reloads the same save). 'encore' is left off — the karaoke
  // run earns it on camera.
  gameAch: ['rich', 'furnished'],
};

// ---- beats --------------------------------------------------------------------
// Each beat: a scene to seed, a music key, and a `run` that drives the game.
// Everything recorded between beat start and beat end lands in the video.

// ---- arg parsing --------------------------------------------------------------
const argv = process.argv.slice(2);
const opts = {};
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a.startsWith('--')) opts[a.slice(2)] = argv[i + 1]?.startsWith('--') || argv[i + 1] === undefined ? true : argv[++i];
}
const ONLY = typeof opts.only === 'string' ? opts.only.split(',').map(s => s.trim()) : null;

const log = (s) => process.stderr.write(`${s}\n`);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

// ---- dev server ---------------------------------------------------------------
function startServer() {
  const proc = spawn('npx', ['vite', '--port', String(PORT), '--strictPort', '--clearScreen', 'false'], {
    cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'],
  });
  return new Promise((res, rej) => {
    const to = setTimeout(() => rej(new Error('vite did not start in 30s')), 30000);
    proc.stdout.on('data', (b) => {
      if (/Local:\s+http|ready in/.test(b.toString())) { clearTimeout(to); res(proc); }
    });
    proc.on('exit', (c) => rej(new Error(`vite exited early (${c})`)));
  });
}

function ff(args, label) {
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: ['ignore', 'inherit', 'inherit'] });
  if (r.status !== 0) throw new Error(`ffmpeg failed (${label})`);
}

await main();

async function main() {
  if (!existsSync(join(ROOT, 'public/music/title.mp3'))) throw new Error('run from the repo root');
  rmSync(WORK, { recursive: true, force: true });
  mkdirSync(WORK, { recursive: true });

  log('• starting vite…');
  const server = await startServer();
  const browser = await chromium.launch({
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--hide-scrollbars'],
  });

  const frames = [];          // { ts, file } in capture order
  let capturing = false;
  const cuts = [];            // { name, music, from, to, songAt? } — frame indices

  try {
    const ctx = await browser.newContext({
      viewport: { width: VIEW_W, height: VIEW_H },
      deviceScaleFactor: 1,
      reducedMotion: 'no-preference',
    });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => log(`  [pageerror] ${e.message}`));

    await page.goto(`http://localhost:${PORT}/?debug`, { waitUntil: 'domcontentloaded' });

    // Screencast → jpeg frames on disk. Written synchronously and acked after the
    // write so Chromium throttles to the speed we can actually drain.
    const cdp = await ctx.newCDPSession(page);
    cdp.on('Page.screencastFrame', ({ data, sessionId, metadata }) => {
      if (capturing) {
        const file = join(WORK, `f${String(frames.length).padStart(6, '0')}.jpg`);
        writeFileSync(file, Buffer.from(data, 'base64'));
        frames.push({ ts: metadata.timestamp, file });
      }
      cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    });
    await cdp.send('Page.startScreencast', {
      format: 'jpeg', quality: 92, maxWidth: VIEW_W, maxHeight: VIEW_H, everyNthFrame: 1,
    });

    const api = makeApi(page, frames, cuts, () => { capturing = true; }, () => { capturing = false; });
    await runBeats(api, page);

    await cdp.send('Page.stopScreencast').catch(() => {});
    await sleep(200);

    await ctx.close();

    log(`• captured ${frames.length} frames, ${cuts.length} beats`);
    encode(frames, cuts);
  } finally {
    await browser.close().catch(() => {});
    server.kill('SIGTERM');
    if (!opts['keep-frames']) rmSync(WORK, { recursive: true, force: true });
  }
}

// ---- driving API --------------------------------------------------------------
function makeApi(page, frames, cuts, on, off) {
  const snap = () => page.evaluate(() => window.__lab.snapshot());
  let beat = null;

  const api = {
    page, snap, sleep,

    // Seed a save and reload into it. Nothing recorded until the next beat().
    async load(save) {
      off();
      await page.evaluate((s) => localStorage.setItem('lab-save', JSON.stringify(s)), { ...DEMO_SAVE, ...save });
      // Force 3× so the canvas is exactly 1152×672 (384×224 ×3) inside a 1280×800
      // viewport — a whole-pixel crop with no rescale in the encode.
      await page.evaluate(() => localStorage.setItem('lab-scale', '3'));
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => !!window.__lab, null, { timeout: 15000 });
      await page.evaluate(async () => {
        const m = await import('/src/game/maps.ts');
        const e = await import('/src/game/engine.ts');
        window.__demo = { maps: m, engine: e };
      });
      await sleep(250);
    },

    async enter() {
      await page.evaluate(() => {
        const b = [...document.querySelectorAll('button')].find((x) => /^CONTINUE$/i.test(x.textContent.trim()));
        if (b) b.click();
      });
      await page.waitForFunction(() => window.__lab.snapshot().screen === 'playing', null, { timeout: 15000 });
      await sleep(500);
      for (let i = 0; i < 6 && (await snap()).overlay; i++) { await page.keyboard.press('Escape'); await sleep(180); }
    },

    // Start / end a recorded beat. `music` keys into MUSIC. The canvas rect is
    // measured per beat, not once: the title screen has no HUD row above the
    // canvas, so it sits ~45px higher than it does in play — one shared crop box
    // would letterbox half the beats.
    async begin(name, music) {
      const rect = await page.evaluate(() => {
        const r = document.querySelector('canvas').getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
      });
      beat = { name, music, rect, from: frames.length };
      on();
    },
    // Guarded like markSong(): an end() with no matching begin() (or a double end(),
    // easy to introduce when adding a beat) must not abort a finished recording.
    end() { off(); if (!beat) return; beat.to = frames.length; if (beat.to > beat.from + 2) cuts.push(beat); beat = null; },
    // Mark the frame the karaoke song actually starts, for audio alignment.
    markSong() { if (beat) beat.songAt = frames.length; },

    async press(key, times = 1, gap = 260) {
      for (let i = 0; i < times; i++) { await page.keyboard.press(key); await sleep(gap); }
    },
    async click(label, wait = 700) {
      for (let t = 0; t < 25; t++) {
        const hit = await page.evaluate((l) => {
          const b = [...document.querySelectorAll('button')].find((x) => x.textContent.toUpperCase().includes(l.toUpperCase()));
          if (b) { b.click(); return true; }
          return false;
        }, label);
        if (hit) { await sleep(wait); return true; }
        await sleep(100);
      }
      log(`  ! button "${label}" never appeared`);
      return false;
    },

    // Closed-loop walk to a tile. Re-paths in-page every poll and marks any tile
    // we grind against as blocked, so unknown solids (furniture, props, wanderers)
    // route around instead of stalling.
    async walkTo(tx, ty, { timeout = 20000, until = null } = {}) {
      const blocked = [];
      let held = null, last = null, lastMove = Date.now();
      const release = async () => { if (held) { await page.keyboard.up(held); held = null; } };
      const t0 = Date.now();
      try {
        while (Date.now() - t0 < timeout) {
          const s = await snap();
          if (until && until(s)) return s;
          if (s.tile.x === tx && s.tile.y === ty) return s;
          const dir = await page.evaluate(([tx, ty, blocked]) => {
            const { SCENES } = window.__demo.maps;
            const { isSolid } = window.__demo.engine;
            const snap = window.__lab.snapshot();
            const sc = SCENES[snap.scene];
            if (!sc) return null;
            const extra = new Set(blocked);
            for (const n of sc.npcs) extra.add(`${n.x},${n.y}`);
            // Warps are one-way trapdoors — never path through one we didn't aim at.
            for (const w of sc.warps) if (!(w.x === tx && w.y === ty)) extra.add(`${w.x},${w.y}`);
            const start = `${snap.tile.x},${snap.tile.y}`;
            const goal = `${tx},${ty}`;
            const prev = new Map([[start, null]]);
            const q = [[snap.tile.x, snap.tile.y]];
            const DIRS = [['up', 0, -1], ['down', 0, 1], ['left', -1, 0], ['right', 1, 0]];
            while (q.length) {
              const [cx, cy] = q.shift();
              if (`${cx},${cy}` === goal) break;
              for (const [, dx, dy] of DIRS) {
                const nx = cx + dx, ny = cy + dy, k = `${nx},${ny}`;
                if (prev.has(k)) continue;
                if (k !== goal && isSolid(sc, nx, ny, extra)) continue;
                prev.set(k, `${cx},${cy}`);
                q.push([nx, ny]);
              }
            }
            if (!prev.has(goal)) return null;
            let cur = goal, back = prev.get(goal);
            while (back && back !== start) { cur = back; back = prev.get(back); }
            if (!back) return null;
            const [nx, ny] = cur.split(',').map(Number);
            if (nx > snap.tile.x) return 'right';
            if (nx < snap.tile.x) return 'left';
            if (ny > snap.tile.y) return 'down';
            return 'up';
          }, [tx, ty, blocked]);
          if (!dir) return s;
          // The BFS thinks in tiles but the player moves in free pixels, and the
          // hitbox is 6px tall at the feet — drift half a tile down a corridor and
          // it clips the row below, which is how you get wedged next to a solid
          // prop while the snapshot still says you're on a clear tile. So square up
          // on the perpendicular axis before committing to a direction.
          // The hitbox is px+3..px+12 wide and px+9..px+14 tall, while the
          // snapshot's tile is floor((px+4)/16) — so a tile can read "clear" while
          // the box already pokes into the next row. Walking a row needs
          // offY in [-4,+1]; walking a column needs offX in [-3,+3].
          let go = dir;
          const offX = s.pos.x - s.tile.x * 16, offY = s.pos.y - s.tile.y * 16;
          if (dir === 'left' || dir === 'right') {
            if (offY > 1) go = 'up'; else if (offY < -3) go = 'down';
          } else if (offX > 3) go = 'left';
          else if (offX < -3) go = 'right';
          const key = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[go];
          if (key !== held) { await release(); await page.keyboard.down(key); held = key; }
          // Stuck detector: no movement for 600ms → blacklist the tile ahead.
          if (last && last.x === s.pos.x && last.y === s.pos.y) {
            if (Date.now() - lastMove > 600) {
              const d = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[go];
              const k = `${s.tile.x + d[0]},${s.tile.y + d[1]}`;
              if (!blocked.includes(k)) blocked.push(k);
              lastMove = Date.now();
              await release();
            }
          } else { lastMove = Date.now(); }
          if (process.env.DEMO_TRACE) log(`      walk ${s.tile.x},${s.tile.y} px=${s.pos.x},${s.pos.y} dir=${go} blocked=${blocked.join('|')}`);
          last = { ...s.pos };
          await sleep(70);
        }
        return await snap();
      } finally { await release(); }
    },

    // Walk in a direction for N ms (b-roll strolling, no destination).
    async stroll(dir, ms) {
      const key = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }[dir];
      await page.keyboard.down(key);
      await sleep(ms);
      await page.keyboard.up(key);
      await sleep(120);
    },

    // Face a tile from an adjacent one, interact, then page through the dialog.
    // Returns whether anything actually opened, so callers can retry.
    async faceAndTalk(tx, ty, lines = 4) {
      const s = await snap();
      const dx = tx - s.tile.x, dy = ty - s.tile.y;
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      await api.stroll(dir, 120);
      await sleep(250);
      await page.keyboard.press('e');
      await sleep(900);
      const opened = Boolean((await snap()).overlay);
      for (let i = 0; i < lines; i++) {
        if (!(await snap()).overlay) break;
        await page.keyboard.press('e');
        await sleep(1500);
      }
      return opened;
    },

    // Walk up to a townsperson and talk. Townsfolk WANDER, so their map tile is
    // only a starting guess — the live position comes from the snapshot's
    // wanderer list, and we re-read it after every failed approach.
    async talkTo(id, home, lines = 4, tries = 4) {
      for (let t = 0; t < tries; t++) {
        const s = await snap();
        const w = (s.wanderers || []).find((x) => x.id === id);
        const npc = w ? { x: w.tx, y: w.ty } : home;
        let landed = false;
        for (const [dx, dy] of [[0, 1], [-1, 0], [1, 0], [0, -1]]) {
          const r = await api.walkTo(npc.x + dx, npc.y + dy, { timeout: 9000 });
          if (r.tile.x === npc.x + dx && r.tile.y === npc.y + dy) { landed = true; break; }
        }
        if (!landed) continue;
        const now = await snap();
        const w2 = (now.wanderers || []).find((x) => x.id === id);
        const at = w2 ? { x: w2.tx, y: w2.ty } : npc;
        if (await api.faceAndTalk(at.x, at.y, lines)) return true;
      }
      return false;
    },
  };
  return api;
}

// ---- the choreography ---------------------------------------------------------
async function runBeats(api, page) {
  const want = (n) => !ONLY || ONLY.includes(n);

  // 1 — Title card.
  if (want('title')) {
    await api.load({ scene: 'apartment', px: 3 * 16, py: 4 * 16 });
    log('• beat: title');
    await api.begin('title', 'title');
    await sleep(4500);
    api.end();
    await api.enter();
  } else {
    await api.load({ scene: 'apartment', px: 3 * 16, py: 4 * 16 });
    await api.enter();
  }

  // 2 — Home: a furnished apartment, wandering it.
  if (want('apartment')) {
    log('• beat: apartment');
    await api.begin('apartment', 'apartment');
    await api.walkTo(19, 4, { timeout: 14000 });   // through the knocked-through wall
    await sleep(600);
    await api.walkTo(13, 6, { timeout: 12000 });
    await sleep(900);
    api.end();
  }

  // 3 — The phone: the game's whole UI lives in it.
  if (want('phone')) {
    log('• beat: phone');
    await api.begin('phone', 'apartment');
    await page.keyboard.press('p');
    await sleep(2000);                    // hold on the home screen — it's the game's whole UI
    await api.click('Friends', 2400);
    await api.click('Home', 800);
    await api.click('Fishopedia', 2400);
    await api.click('Home', 800);
    await api.click('Trophies', 2200);
    // Esc inside an app only walks back to the phone's home screen — the phone
    // itself has to be dismissed, or every later beat types into a menu.
    await api.click('CLOSE PHONE', 700);
    for (let i = 0; i < 3 && (await api.snap()).overlay; i++) { await page.keyboard.press('p'); await sleep(400); }
    await sleep(500);
    api.end();
  }

  // 4 — Out the door and down Kawamachi St.
  if (want('street')) {
    log('• beat: street');
    await api.begin('street', 'apartment');
    await api.walkTo(12, 9, { until: (s) => s.scene === 'city', timeout: 14000 });
    await sleep(1400);           // the warp wipe
    api.end();

    await api.begin('city', 'city');
    await api.stroll('down', 1200);
    await api.stroll('right', 2600);
    await api.stroll('down', 1400);
    await sleep(600);
    api.end();
  }

  // 5 — Talk to Granny Sato on the corner.
  if (want('talk')) {
    log('• beat: talk');
    // Get within a tile of her off-camera, so a missed approach costs takes, not
    // 20 seconds of the finished video.
    await api.walkTo(12, 15, { timeout: 20000 });
    await api.begin('talk', 'city');
    if (!(await api.talkTo('granny', { x: 12, y: 16 }, 4))) log('  ! granny never answered');
    await sleep(800);
    await page.keyboard.press('Escape');
    api.end();
  }

  // 6 — Fishing off the shore: cast, strike, and steer the reel.
  if (want('fishing')) {
    log('• beat: fishing');
    await api.load({ scene: 'shore', px: 8 * 16, py: 10 * 16, dir: 'down' });
    await api.enter();
    await api.begin('fishing', 'shore');
    await api.stroll('right', 600);
    await sleep(400);
    await api.stroll('down', 400);   // face the water
    await sleep(400);
    // A fish can still shake the hook; keep casting until one is actually landed
    // so the beat never ends on an empty line.
    for (let cast = 0; cast < 4; cast++) {
      const before = (await api.snap()).save.fishInv.length;
      await page.keyboard.press('e');
      await sleep(300);
      await autoFish(api, page);
      await sleep(2100);                // let the catch card sit long enough to read
      await page.keyboard.press('e');   // dismiss the catch (or the one-that-got-away) card
      await sleep(1000);
      if ((await api.snap()).save.fishInv.length > before) break;
      for (let i = 0; i < 3 && (await api.snap()).overlay; i++) { await page.keyboard.press('e'); await sleep(500); }
    }
    api.end();
  }

  // 7 — Club Kaiju: take the mic and actually play the chart.
  if (want('karaoke')) {
    log('• beat: karaoke');
    await api.load({ scene: 'nightclub', px: 7 * 16, py: 8 * 16, timeMin: 22 * 60, dir: 'up' });
    await api.enter();
    await api.begin('karaoke', 'nightclub');
    // The booth row (y=2, 'JJJJ') is solid, so the DJ is only reachable along the
    // walkway behind it — and he himself blocks it at (12,1), so (11,1) facing
    // right is the one tile you can talk to him from.
    // Club-goers wander, so the approach can be blocked on any given take —
    // retry until the DJ panel is actually up.
    for (let i = 0; i < 3 && !(await api.snap()).overlay; i++) {
      await api.walkTo(11, 1, { timeout: 14000 });
      await api.faceAndTalk(12, 1, 0);
    }
    await api.click('SING', 400);
    await autoKaraoke(api, page);
    await sleep(2200);
    await page.keyboard.press('e');  // results → tips dialog
    await sleep(1600);
    api.end();
  }

  // 8 — Closer: the shrine steps at night.
  if (want('shrine')) {
    log('• beat: shrine');
    await api.load({ scene: 'shrine', px: 9 * 16, py: 8 * 16, timeMin: 19 * 60, dir: 'up' });
    await api.enter();
    await api.begin('shrine', 'shrine');
    await api.stroll('up', 1600);
    await sleep(800);
    await api.stroll('left', 900);
    await sleep(1400);
    api.end();
  }
}

// ---- fishing autopilot --------------------------------------------------------
// Waits out the bite, strikes, then holds/releases the action key to keep the
// catch zone on the fish. Run in-page off the debug snapshot's reel state: the
// zone accelerates at 2.6 u/s² up and falls at 2.0, so simple bang-bang control
// (hold while the fish is above the zone's middle) hovers it right on the fish —
// but only if the samples are frame-tight, which a CDP round-trip per tick is not.
async function autoFish(api, page) {
  return page.evaluate(async () => {
    const key = (type, k) => window.dispatchEvent(new KeyboardEvent(type, { key: k, bubbles: true }));
    let held = false, struck = false;
    const t0 = performance.now();
    return new Promise((done) => {
      const tick = () => {
        const f = window.__lab.snapshot().fishing;
        if (performance.now() - t0 > 60000) { if (held) key('keyup', ' '); return done('timeout'); }
        if (!f.active) { if (held) key('keyup', ' '); return done(struck ? 'reeled' : 'nothing'); }
        if (f.phase === 'bite' && !struck) {
          struck = true;
          key('keydown', 'e');
          setTimeout(() => key('keyup', 'e'), 60);
        } else if (f.phase === 'reel') {
          const want = f.fishPos > f.zonePos + f.zoneH / 2;
          if (want !== held) { key(want ? 'keydown' : 'keyup', ' '); held = want; }
        }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  });
}

// ---- karaoke autopilot --------------------------------------------------------
// Replays the chart from inside the page: a rAF loop reads the live song clock
// off the debug snapshot and dispatches the matching arrow key as each note
// reaches its receptor. Done in-page because a ±70ms PERFECT window is tighter
// than a CDP round-trip — driving it from node would land GOODs at best.
async function autoKaraoke(api, page) {
  const notes = buildChart();
  const playing = page.evaluate(async ({ notes }) => {
    const KEY = { left: 'ArrowLeft', down: 'ArrowDown', up: 'ArrowUp', right: 'ArrowRight' };
    const tap = (dir) => {
      const key = KEY[dir];
      window.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
      setTimeout(() => window.dispatchEvent(new KeyboardEvent('keyup', { key, bubbles: true })), 70);
    };
    let i = 0;
    const t0 = performance.now();
    await new Promise((done) => {
      const tick = () => {
        const k = window.__lab.snapshot().karaoke;
        if (!k.active) return done();
        if (k.done) return done();
        // Bail like autoFish does. Without this, a song that never advances
        // (blocked autoplay, stalled audio element) leaves k.active true
        // forever, and the node side blocks on this promise while the
        // screencast keeps writing frames into demo/.work.
        if (performance.now() - t0 > 180000) return done();
        // Aim a hair early: the game samples the key on its next update tick.
        while (i < notes.length && k.t >= notes[i].t - 0.012) { tap(notes[i].dir); i++; }
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { notes });

  // Note the frame the count-in ends and the song actually starts — the encoder
  // delays "Midnight Neon" by exactly that much so the video's audio lands on the
  // same beats the chart does.
  const t0 = Date.now();
  while (Date.now() - t0 < 12000) {
    const k = (await api.snap()).karaoke;
    if (k.active && k.t >= KARAOKE_COUNTIN) { api.markSong(); break; }
    await sleep(25);
  }
  await playing;
}

// Lane assignment mirrors makeKaraokeGame(): a FIXED mulberry32 seed, so the
// same song always steps the same way.
function buildChart() {
  const mulberry32 = (seed) => {
    let a = seed >>> 0;
    return () => {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const DIRS = ['left', 'down', 'up', 'right'];
  const rnd = mulberry32(20260701);
  return KARAOKE_CHART.map((t) => ({ t: t + KARAOKE_COUNTIN, dir: DIRS[Math.floor(rnd() * 4)] }));
}

// ---- encode -------------------------------------------------------------------
// Each beat is encoded on its own (its own crop box), then the beats are
// concatenated — a hard cut per boundary, with the reload/teleport gaps between
// them never entering the timeline at all.
function encode(frames, cuts) {
  if (!cuts.length) throw new Error('no beats were recorded');
  mkdirSync(OUT_DIR, { recursive: true });

  const segs = [];
  let clock = 0;
  cuts.forEach((c, i) => {
    const r = c.rect;
    const crop = {
      x: r.x - (r.x % 2), y: r.y - (r.y % 2),
      w: r.w - (r.w % 2), h: r.h - (r.h % 2),
    };
    const lines = [];
    let dur = 0;
    for (let k = c.from; k < c.to; k++) {
      const f = frames[k];
      // Clamp a stalled frame so one hitch can't freeze the video for a second.
      const d = k + 1 < c.to ? Math.min(0.25, Math.max(1 / 240, frames[k + 1].ts - f.ts)) : 1 / FPS;
      lines.push(`file '${f.file}'`, `duration ${d.toFixed(6)}`);
      dur += d;
    }
    lines.push(`file '${frames[c.to - 1].file}'`);   // concat needs the tail repeated
    const listPath = join(WORK, `seg${i}.txt`);
    writeFileSync(listPath, lines.join('\n') + '\n');

    const out = join(WORK, `seg${i}.mp4`);
    log(`  ${c.name.padEnd(10)} ${dur.toFixed(1)}s  crop ${crop.w}×${crop.h} @ ${crop.x},${crop.y}`);
    ff(['-f', 'concat', '-safe', '0', '-i', listPath,
      '-vf', `crop=${crop.w}:${crop.h}:${crop.x}:${crop.y},fps=${FPS}`,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
      '-an', out], `video ${i}`);

    segs.push({
      ...c, file: out, start: clock, dur,
      songOffset: c.songAt != null ? frames[c.songAt].ts - frames[c.from].ts : null,
    });
    if (c.songAt != null) log(`             song starts ${(frames[c.songAt].ts - frames[c.from].ts).toFixed(2)}s into the beat`);
    clock += dur;
  });

  log('• joining beats…');
  const vlist = join(WORK, 'video.txt');
  writeFileSync(vlist, segs.map(s => `file '${s.file}'`).join('\n') + '\n');
  const silent = join(WORK, 'video.mp4');
  ff(['-f', 'concat', '-safe', '0', '-i', vlist, '-c', 'copy', silent], 'join');

  log('• building the audio bed…');
  const parts = [];
  segs.forEach((s, i) => {
    const out = join(WORK, `a${i}.wav`);
    const track = join(ROOT, 'public/music', MUSIC[s.music] || MUSIC.city);
    const fade = Math.min(0.8, s.dur / 3);
    if (s.songOffset != null) {
      // Karaoke: the club track under the walk-up, then "Midnight Neon" dropped in
      // at the exact offset the game started it, so the chart matches the music.
      const song = join(ROOT, 'public/music', MUSIC.karaoke);
      const d = s.songOffset;
      ff(['-stream_loop', '-1', '-i', track, '-i', song, '-filter_complex',
        `[0:a]atrim=0:${d.toFixed(3)},asetpts=N/SR/TB,afade=t=in:st=0:d=0.5,afade=t=out:st=${Math.max(0, d - 0.5).toFixed(3)}:d=0.5,volume=0.5[a];` +
        `[1:a]adelay=${Math.round(d * 1000)}|${Math.round(d * 1000)},atrim=0:${s.dur.toFixed(3)},asetpts=N/SR/TB,afade=t=out:st=${Math.max(0, s.dur - 1.2).toFixed(3)}:d=1.2[b];` +
        `[a][b]amix=inputs=2:duration=longest:normalize=0,apad,atrim=0:${s.dur.toFixed(3)},asetpts=N/SR/TB[o]`,
        '-map', '[o]', '-ar', '48000', '-ac', '2', out], `audio ${i}`);
    } else {
      ff(['-stream_loop', '-1', '-i', track, '-filter_complex',
        `[0:a]atrim=0:${s.dur.toFixed(3)},asetpts=N/SR/TB,afade=t=in:st=0:d=${fade.toFixed(2)},afade=t=out:st=${Math.max(0, s.dur - fade).toFixed(3)}:d=${fade.toFixed(2)},volume=0.7[o]`,
        '-map', '[o]', '-ar', '48000', '-ac', '2', out], `audio ${i}`);
    }
    parts.push(out);
  });
  const alist = join(WORK, 'audio.txt');
  writeFileSync(alist, parts.map(p => `file '${p}'`).join('\n') + '\n');
  const audio = join(WORK, 'audio.wav');
  ff(['-f', 'concat', '-safe', '0', '-i', alist, '-c', 'copy', audio], 'audio concat');

  const final = join(OUT_DIR, 'little-apartment-demo.mp4');
  ff(['-i', silent, '-i', audio, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', final], 'mux');

  const total = segs.reduce((a, s) => a + s.dur, 0);
  log('');
  log(`✓ ${final}`);
  log(`  ${total.toFixed(1)}s · ${frames.length} frames captured`);
  for (const s of segs) log(`  ${s.name.padEnd(10)} ${s.start.toFixed(1)}s → ${(s.start + s.dur).toFixed(1)}s`);
}
