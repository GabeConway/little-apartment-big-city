# kb/testing.md — proving a change works

Everything this repo uses to show a change is correct: unit tests, the headless
playtest harness, and the strategy for hunting bugs without a human at the keyboard.

## The 3-command health check (run before AND after any change)

```bash
npx tsc --noEmit && npm test          # types + unit tests
npm run playtest -- smoke --wait 450  # all 22 scenes render without errors
npm run playtest -- checkup           # end-to-end mechanics battery (scripts/checkups.mjs)
```

All three are exit-code checkable. If any fails after your change, the change did it.

## Unit tests (Vitest)

**Vitest** unit tests for game pure logic. No DOM/React in scope, so tests run in plain `node` environment (`vitest.config.ts`).

### Layout
- `tests/*.test.ts` — test files (import from `../src/game/...`). Kept **outside `src/game/`** so shipping game stays React-only (invariant); test files never enter Vite bundle (bundling entry-driven, not include-driven).
- `vitest.config.ts` — `environment: 'node'`, `include: ['tests/**/*.test.ts']`.
- `tsconfig.json` `include` now lists `tests` so `tsc --noEmit` type-checks them too.

### Commands
- `npm test` — run once (`vitest run`). Used by CI + pre-commit hook.
- `npm run test:watch` — watch mode while developing.

### Coverage (as built)
`engine.ts` (collision/camera/input/PRNG), `state.ts` (save defaults, energy, clock, night ramp, shop/placement/luck/gacha — deterministic via `mulberry32`), `fishing.ts` (reel minigame; `Math.random` stubbed with `vi.spyOn` for determinism), `save-migration.ts` cases, `calendar.test.ts` (festival rotation, fishing-derby cadence + non-collision, tournament tiers, town-event attendance windows), `maps.test.ts` (the apartment's fixed tiles — home onsen, maneki, trophy shelf — must not collide with `APARTMENT_SLOTS`/`RARE_SLOTS` and must be floor in both the small and expanded grids; this is the guard for the onsen-on-the-fridge bug). ~257 tests (incl. save-code round-trips, cat-gift seeding, mission predicates, weather-fish gating). Add file under `tests/` per new pure module. End-to-end mechanics live in the playtest `checkup` battery instead (see the bug-hunting playbook below).

### Where it runs
- **CI on every PR + push to main**: `.github/workflows/ci.yml` (`check` job) runs `tsc --noEmit` → `npm test` → `npm run build` on ubuntu. Rust-free + fast; native bundling stays in `release.yml`.
- **Before any Claude commit**: `.claude/settings.json` registers `PreToolUse` hook on Bash → `.claude/hooks/pre-commit-tests.mjs`. Detects `git commit` commands, runs `npm test`, **exits 2 (blocks commit) on failure**. Bypass with `git commit --no-verify` (or `-n`).

### Testing notes
- Game logic deterministic given seed — prefer asserting exact values over ranges. Seed-driven code (`pawnStockFor`, `oreNodesFor`, `sketchyOfferFor`) uses `mulberry32(day*…)`; assert same-day stability + cross-day rotation.
- `Input` takes `KeyboardEvent`s — pass plain stub objects cast to type (`{ key, preventDefault, target, repeat }`); no jsdom needed.
- Future component/canvas test needs jsdom: add `// @vitest-environment jsdom` at top of that file (per-file override).

## Playtest harness

Drive real game in browser, playtest with confidence: boot, seed
save, send inputs, **read live game state**, screenshot. Pure Playwright +
Vite **dev** server — no Rust, no Tauri, no build step. Lives in
`scripts/playtest.mjs`; run via `npm run playtest -- <command> [opts]` (or
`node scripts/playtest.mjs <command>`).

### How it works
- Spawns `vite` on port **5179** (override `PLAYTEST_PORT`), opens Chromium,
  navigates to `/?debug`.
- Beyond the persisted save, the snapshot carries the **runtime** blocks that are
  canvas-drawn and never persisted — `drive`, `karaoke`, `fishing` and `casino`.
  Add one when a minigame needs driving or asserting from outside. `casino` exposes
  `slotPhase`/`roulPhase` (+ bet, win), which is the only way to see that bailing
  out of a spin settled the stake rather than eating it.
- `?debug` makes game publish **read-only** snapshot at `window.__lab.snapshot()`
  (see gated `useEffect` in `LittleApartmentGame.tsx`). Exists **only**
  with that flag — never in normal play or shipped builds. Dependency-free
  (window global), so `src/game/` stays React-only.
- Seeds `localStorage` (`lab-save`, `lab-scale`) **before** app boots, then
  reloads, then clicks title's start button — land exactly where want.
- Inputs are **real keyboard events** via Playwright (same path as player).
- Every run prints final `snapshot()` JSON as last stdout block; progress
  notes go to stderr. So `node scripts/playtest.mjs state ... | tail -n +1` machine-readable.

### Snapshot fields
`screen` (`title`/`playing`), `scene`, `pos` {x,y px}, `tile` {x,y}, `dir`,
`moving`, `overlay` (open overlay type or null), `overlayData` (compact on-screen
contents — dialog `{speaker,line,idx,total}`, shop, menu tab, letter beat, sleep;
null if no overlay), `scale` (live canvas integer
scale), `money`, `day`, `energy`, `timeMin`, and full `save` object.

Ref-mode minigames aren't in the save, so each publishes its own live block:
`drive` (delivery race), `karaoke` (`t`, score, combo, perfects/goods/misses, done)
and `fishing` — `{active:false}` when you're not fishing, else `{phase}` for
`wait`/`bite` (with `t`, the seconds left on that phase) and, once hooked,
`{phase:'reel', fish, fishPos, zonePos, zoneH, progress, done}`. That's enough to
*play* the reel from a script: hold the action key while `fishPos` is above
`zonePos + zoneH/2` and release below it.

### Commands
- `shot` (default) — enter game, run inputs, screenshot, print snapshot.
- `drive` — alias of `shot`; reads better when point is movement.
- `state` — same flow, **no** screenshot; print snapshot only.
- `title` — stay on title screen (don't click start). Pair with `--click`.
- `presets` — list built-in save presets.
- `smoke` — **sweep every scene** for runtime errors. Teleports into all 20 maps
  (or a `--scene a,b,c` subset), dismisses the arrival overlay, waits, and reports
  `{ok, total, failed, scenes:[{scene, landed, overlay, errs[]}]}` as JSON. **Exit 1
  if any scene errors or fails to load** — one command CI-checks that nothing crashes
  on render. Fast regression guard after touching draw/scene code:
  `node scripts/playtest.mjs smoke --wait 450`.
- `checkup` — **named end-to-end regression battery** (`scripts/checkups.mjs`).
  Each row seeds a save, boots the game, drives keys/clicks, and evals an
  `assert` against the live snapshot; reports `{ok, total, failed, checks:[…]}`
  and exits 1 on any failure. Run a subset with `--only name,name`. **Add a row
  when you fix a wired-mechanic bug** (phone apps, orders, warps, collapse…) so
  it stays fixed — see the row-shape comment at the top of `checkups.mjs` and
  the strategy guide below.

> **`--new` now reaches gameplay.** NEW GAME opens a "what's your vibe?" character
> picker (screen stays `title` until you pick + START). The harness auto-clicks its
> START › after NEW GAME, so `--new` / `--save new` land in a fresh apartment again.

### Options
| flag | meaning |
|---|---|
| `--save <preset\|@file.json\|'{json}'>` | seed `lab-save` before boot (partial, merged over `newSave()`). `--save new` clears it. |
| `--new` / `--continue` | which title button to click (default: whichever exists). |
| `--keys "ArrowDown ArrowDown e i Escape"` | discrete key presses (space-separated; single chars or named keys). |
| `--hold "ArrowLeft:700"` | hold key N ms (walking). Repeatable. |
| `--key-delay <ms>` | gap between `--keys` presses (default 140). |
| `--click "TEXT"` | click first button whose label contains TEXT (menus, panels, shops). Runs **after** `--keys`, so press E to open a menu then click its button; polls ~2s for the button to mount. **Comma = click SEQUENCE** (`"A,B"` clicks A then B) — a label containing a comma (e.g. `¥6,000`) breaks; match a comma-free substring (`¥6`). |
| `--keep-overlay` | don't auto-dismiss arrival story letter (cleared by default so it can't eat input). |
| `--scene <a,b,c>` | (`smoke` only) limit the sweep to these scenes; omit to sweep all 20. |
| `--only <a,b>` | (`checkup` only) run just these named checks from `scripts/checkups.mjs`. |
| `--scale <auto\|1..6>` | seed `lab-scale` (DISPLAY option). |
| `--wait <ms>` | settle time before snapshot/screenshot. |
| `--out <file>` | screenshot path (default `playtest/shot-<ts>.png`, gitignored). |
| `--full` | full-page screenshot (needed to capture **DOM** UI: title, menus, panels). Default captures just `<canvas>`. |
| `--width/--height/--dpr` | viewport (default 1280×800) + deviceScaleFactor. `--dpr 2` checks Retina scaling. |
| `--show` | headed browser (watch it run). |
| `--url <url>` | use already-running server instead of spawning vite. |
| `--assert "<expr>"` | eval JS boolean against snapshot (keys `money`/`scene`/`day`/`overlay`/… + full `save` in scope). Exit 1 on fail/error — CI/agent-checkable without parsing JSON. |

### Save presets (`PRESETS` in script)
`new`, `rich`, `fisher`, `explorer`, `lowenergy`, plus **teleports for all 20
scenes**: `apartment`, `city`, `denden`, `konbini`, `pawn`, `gacha`, `greenhouse`,
`shore`, `badtown`, `shrine`, `nightclub`, `garage`, `casino`, `museum`,
`backrooms`, `mines`, `island`, `seacave`, `deepsea`, `paris` (each sets `scene` + safe spawn
tile from `maps.ts` warp targets, `canFish`, cash). Gated scenes also seed the
unlock flags they need via `SCENE_EXTRA` (e.g. `mines`/`backrooms` → `backroomsUnlocked`+`wand`,
`casino` → `gangPaid`, `paris` → `parisRevealed`, `island`/`deepsea` → boat). Add
more by editing `SCENE_SPAWN`/`SCENE_EXTRA`. For one-offs use `--save @my.json` or
inline `--save '{"money":50000,"wand":true}'`.

> Teleport elsewhere: any save with `scene` + `px`/`py` works — `begin()`
> reads them. Use warp target's `tx,ty` (×16) from `maps.ts` for walkable tile.

### Examples
```bash
npm run playtest -- shot --new                          # new game, screenshot the canvas
npm run playtest -- shot --save shore                   # teleport to the shore
npm run playtest -- drive --save shore --hold ArrowLeft:700
npm run playtest -- state --save explorer               # dump live state, no image
npm run playtest -- title --click DISPLAY --full        # open + capture the DISPLAY panel
npm run playtest -- shot --save shore --scale 1 --full  # verify forced 1× scaling
npm run playtest -- shot --new --keys "p" --full        # open the phone (home screen — key is P)
npm run playtest -- shot --save city --click "PHONE,Messages" --full       # phone Messages app
npm run playtest -- shot --save city --click "PHONE,ZamaZonk" --full       # ZamaZonk store
npm run playtest -- shot --save apartment --click "PHONE,Bag,ARRANGE" --full # Arrange mode UI
## ZamaZonk order debits cash + queues delivery (clicks first ORDER button;
## needs zamazonkApp:true — the app is hidden until the island poster is read):
npm run playtest -- state --save '{"scene":"city","money":40000,"zamazonkApp":true,"visited":["city"]}' \
  --click "PHONE,ZamaZonk,ORDER" --assert "save.orders.length===1 && money<40000"

npm run playtest -- state --save rich --assert "money>500000"  # pass/fail via exit code
```

### Notes / gotchas
- **AUTO** caps canvas at 1000px box in windowed web (max scale ~2). A
  **forced** `--scale N` clamps to *viewport* instead and grows box, so
  on 1280×800 you get distinct 1×/2×/3× (4×+ clamp to 3). `snapshot().scale` is
  live integer scale — assert on it.
- DOM UI (title, menus, shops, DISPLAY panel) **not** drawn on canvas
  — use `--full` to screenshot. Gameplay art **is** on canvas (default shot).
- Determinism: seed-driven systems (pawn stock, ore, sketchy deal) key off
  `day`; set `day` in custom save to reproduce specific daily roll.
- Harness only **reads** state; never pokes refs. To reach state, seed
  save + drive inputs — same constraints as real player.
- **Arrange mode** placement is a *canvas pointer-drag* — the harness can't
  synthesize drags at tile coords, so verify the Arrange UI **visually** (`--full`
  screenshot of `PHONE,Bag,ARRANGE`) and verify the data side with unit tests
  (`tests/state.test.ts`). DOM buttons inside it (DONE / tray chips) are not
  plain `<button>`s, so `--click` won't drive them either.

## Recording a gameplay video (`scripts/record-demo.mjs`)

```bash
node scripts/record-demo.mjs                 # → demo/little-apartment-demo.mp4 (~105s, 1152×672, 60fps)
node scripts/record-demo.mjs --only karaoke   # just one beat (iterate fast)
node scripts/record-demo.mjs --keep-frames    # leave the raw jpegs in demo/.work
DEMO_TRACE=1 node scripts/record-demo.mjs …   # per-poll walker trace on stderr
```

Same harness shape as `playtest.mjs` — Vite dev server, headless Chromium, real
keyboard events, `?debug` snapshot — but it records and cuts a showcase reel.
`demo/` is gitignored.

**Capture.** CDP `Page.startScreencast`, not Playwright's built-in recorder: the
screencast hands you one jpeg per presented frame with a timestamp, so the
encode is a true 60fps (Playwright's recorder is locked to 25 and judders on the
karaoke chart). Frames land in `demo/.work`, then ffmpeg assembles them through a
concat list with each frame's real duration.

**Beats.** Only frames inside a named beat reach the video; the reload/teleport
gaps between beats are dropped, so scenes hard-cut instead of flashing the title
screen every time the save is reseeded. The canvas rect is measured **per beat** —
the title screen has no HUD row above the canvas, so it sits ~48px higher than it
does in play, and one shared crop box would letterbox half the reel. A forced
`lab-scale` of 3 makes the canvas exactly 1152×672 (384×224 ×3) in a 1280×800
viewport, so the crop is whole-pixel with no rescale.

**Audio.** Playwright/CDP capture no audio, so the bed is built from the game's own
mp3s: each beat gets its scene's `SCENE_MUSIC` track, trimmed and cross-faded to
the beat's length. The karaoke beat also notes the frame the count-in ends, and
"Midnight Neon" is `adelay`-ed by exactly that offset — the chart and the music
line up in the video because both come off the same frame timestamps.

**The minigames are played, not faked.** Karaoke replays `KARAOKE_CHART` with the
lanes regenerated from the same fixed `mulberry32(20260701)` seed the game uses,
tapped from a page-side rAF loop on the live song clock (a ±70ms PERFECT window is
tighter than a CDP round-trip, so driving it from node would land GOODs at best) —
it scores 25/25 PERFECT. Fishing strikes on the `bite` phase and bang-bang steers
the reel off the snapshot's `fishing` block.

**The walker** is closed-loop: BFS over the live `SCENES` grid (dynamically
imported in-page, so it's the same module instance the game mutates — e.g. the
knocked-through apartment), re-pathed every 70ms, with any tile it grinds against
blacklisted. Two things it has to respect that a tile-grid BFS doesn't:
- **Sub-tile alignment.** The player hitbox is `px+3..px+12` × `py+9..py+14`, but
  the snapshot's tile is `floor((px+4)/16)` — so a tile reads clear while the box
  already pokes into the next row. Walking a row needs `offY ∈ [-4,+1]`; walking a
  column needs `offX ∈ [-3,+3]`. The walker squares up on the perpendicular axis
  before committing to a direction. Without this it wedges silently: e.g. drifting
  3px low in the club's top walkway clips the solid `JJJJ` booth row and you never
  reach the DJ.
- **Wanderers.** Townsfolk move, so a map's `npcs` tile is a starting guess only —
  `talkTo(id, home)` re-reads the live position from `snapshot.wanderers` and
  retries the approach. Some NPCs also sit in a pocket: the club DJ at (12,1) is
  walled in by his own booth and blocks the walkway himself, so (11,1) facing
  right is the *only* tile you can talk to him from.

## Bug-hunting playbook

How an agent (Claude/Opus session) hunts bugs in *Little Apartment, Big City*
without a human at the keyboard. The harness mechanics are in the section above;
this is the **strategy** on top.

### The 3-command health check (run before AND after any change)

```bash
npx tsc --noEmit && npm test          # types + 200-ish unit tests
npm run playtest -- smoke --wait 450  # all 22 scenes render without errors
npm run playtest -- checkup           # end-to-end mechanics battery (scripts/checkups.mjs)
```

All three are exit-code checkable. If any fails after your change, the change did it.

### Layered testing — put each bug guard at the right layer

1. **Vitest (`tests/*.test.ts`)** — pure logic in `state.ts`/`data.ts`/`engine.ts`/
   `fishing.ts`: math, daily seeds, save migration, calendars. Deterministic; assert
   exact values. Cheapest layer — prefer it whenever the logic is importable.
2. **`checkup`** — one named row per *wired* mechanic (UI → state): phone apps open,
   orders debit money, warps warp, collapse fires. Add a row to
   `scripts/checkups.mjs` when you fix a wiring bug so it stays fixed. Rows drive
   real keyboard/DOM-click input and assert on the live snapshot.
3. **`smoke`** — every scene renders. Catches draw-loop crashes, bad atlas keys,
   broken map legends. Extend automatically by adding new scenes to `SCENE_SPAWN`.
4. **Screenshots** (`shot --save <scene>`) — visual-only issues (sprite art, layout,
   lighting). The only layer needing eyes; capture at `--scale 3` for detail.

### Seeding tricks that unlock most tests

- Any save field can be seeded: `--save '{"scene":"mines","day":7,"money":0,...}'`
  is merged over `newSave()`. Gated content just needs its flag
  (`backroomsUnlocked`, `gangPaid`, `parisRevealed`, `zamazonkApp`, `canFish`,
  `vehicles:['boat']`, `cat:{found:true}` …).
- **Daily systems key off `day`** — festivals fire on multiples of 14
  (14=matsuri, 28=tanabata, 42=hatsumode), the fishing derby on days ≡5 (mod 10),
  pawn stock / mine layout / store sick-days / street events reseed per day.
  Seed the exact `day` to reproduce any daily roll.
- **Clock**: seed `timeMin` (minutes since 0:00; wake 420, night ramp from 1020,
  collapse at 1560). `timeMin:1556` + a few real seconds = collapse test.
  `TIME_RATE` is 4.0 game-min per real second.
- Money/energy edge cases: seed `money:0`, `energy:1` and try to spend.

### Known blind spots (can't be driven by the harness)

- **Arrange mode** — canvas pointer-drags; its DOM chips aren't `<button>`s.
  Verify data-side with unit tests (`placeableAt`, `rugPlaceableAt`), art-side
  with a `--full` screenshot.
- **Ref-mode minigames** (shift QTE, delivery drive, karaoke, fishing reel) —
  partially exposed via snapshot (`drive`, `karaoke` blocks) but timing-based
  play-through is flaky; assert the *entry* (ref becomes active) and the pure
  payout helpers in Vitest instead.
- **Audio** — mute flags are in save/localStorage but sound itself is unverifiable.
- **Gamepad** — `pollGamepad` needs a real pad; keyboard path shares the code.

### Fragile areas — check these first when something breaks

- **`LittleApartmentGame.tsx` draw loop** — per-frame allocations are the classic
  regression: `createRadialGradient`/`measureText`/canvas font-switching in the
  loop is BANNED (cache like `glowSpriteRef`/`skyGradRef`/`signSpriteRef`).
- **Save shape changes** — every new field must be default-safe through the
  `loadSave` merge; add a `tests/save-migration.test.ts` case (v1 saves + missing
  fields must still load).
- **Daily seeds** — `mulberry32(day*K)` collisions: two systems using the same
  multiplier roll identically. Grep the multiplier constant before adding one.
- **Warps** — new scenes need ≥2-tile doors, warp cooldown, and arrival tiles
  that don't sit on a return warp (bounce-back).
- **Overlay input** — a story letter/dialog on arrival eats movement; harness
  auto-dismisses, players don't. If input "dies", check `overlay` in the snapshot.

### When you find a bug

1. Reproduce with the smallest `--save`+`--keys`+`--assert` one-liner.
2. Fix it.
3. Encode the repro as a Vitest case (pure) or a `checkups.mjs` row (wired).
4. Re-run the 3-command health check.
