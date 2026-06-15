# kb/playtesting.md — playtest harness

Drive real game in browser, playtest with confidence: boot, seed
save, send inputs, **read live game state**, screenshot. Pure Playwright +
Vite **dev** server — no Rust, no Tauri, no build step. Lives in
`scripts/playtest.mjs`; run via `npm run playtest -- <command> [opts]` (or
`node scripts/playtest.mjs <command>`).

## How it works
- Spawns `vite` on port **5179** (override `PLAYTEST_PORT`), opens Chromium,
  navigates to `/?debug`.
- `?debug` makes game publish **read-only** snapshot at `window.__lab.snapshot()`
  (see gated `useEffect` in `LittleApartmentGame.tsx`). Exists **only**
  with that flag — never in normal play or shipped builds. Dependency-free
  (window global), so `src/game/` stays React-only.
- Seeds `localStorage` (`lab-save`, `lab-scale`) **before** app boots, then
  reloads, then clicks title's start button — land exactly where want.
- Inputs are **real keyboard events** via Playwright (same path as player).
- Every run prints final `snapshot()` JSON as last stdout block; progress
  notes go to stderr. So `node scripts/playtest.mjs state ... | tail -n +1` machine-readable.

## Snapshot fields
`screen` (`title`/`playing`), `scene`, `pos` {x,y px}, `tile` {x,y}, `dir`,
`moving`, `overlay` (open overlay type or null), `scale` (live canvas integer
scale), `money`, `day`, `energy`, `timeMin`, and full `save` object.

## Commands
- `shot` (default) — enter game, run inputs, screenshot, print snapshot.
- `drive` — alias of `shot`; reads better when point is movement.
- `state` — same flow, **no** screenshot; print snapshot only.
- `title` — stay on title screen (don't click start). Pair with `--click`.
- `presets` — list built-in save presets.

## Options
| flag | meaning |
|---|---|
| `--save <preset\|@file.json\|'{json}'>` | seed `lab-save` before boot (partial, merged over `newSave()`). `--save new` clears it. |
| `--new` / `--continue` | which title button to click (default: whichever exists). |
| `--keys "ArrowDown ArrowDown e i Escape"` | discrete key presses (space-separated; single chars or named keys). |
| `--hold "ArrowLeft:700"` | hold key N ms (walking). Repeatable. |
| `--key-delay <ms>` | gap between `--keys` presses (default 140). |
| `--click "TEXT"` | click first button whose label contains TEXT (menus, panels, shops). |
| `--keep-overlay` | don't auto-dismiss arrival story letter (cleared by default so it can't eat input). |
| `--scale <auto\|1..6>` | seed `lab-scale` (DISPLAY option). |
| `--wait <ms>` | settle time before snapshot/screenshot. |
| `--out <file>` | screenshot path (default `playtest/shot-<ts>.png`, gitignored). |
| `--full` | full-page screenshot (needed to capture **DOM** UI: title, menus, panels). Default captures just `<canvas>`. |
| `--width/--height/--dpr` | viewport (default 1280×800) + deviceScaleFactor. `--dpr 2` checks Retina scaling. |
| `--show` | headed browser (watch it run). |
| `--url <url>` | use already-running server instead of spawning vite. |

## Save presets (`PRESETS` in script)
`new`, `rich`, `fisher`, `explorer`, `lowenergy`, plus **teleports**:
`apartment`, `city`, `shore`, `denden`, `konbini`, `badtown` (each sets `scene`
+ safe spawn tile from `maps.ts` warp targets, `canFish`, some cash). Add more
by editing `PRESETS`/`SCENE_SPAWN`. For one-offs use `--save @my.json` or inline
`--save '{"money":50000,"wand":true}'`.

> Teleport elsewhere: any save with `scene` + `px`/`py` works — `begin()`
> reads them. Use warp target's `tx,ty` (×16) from `maps.ts` for walkable tile.

## Examples
```bash
npm run playtest -- shot --new                          # new game, screenshot the canvas
npm run playtest -- shot --save shore                   # teleport to the shore
npm run playtest -- drive --save shore --hold ArrowLeft:700
npm run playtest -- state --save explorer               # dump live state, no image
npm run playtest -- title --click DISPLAY --full        # open + capture the DISPLAY panel
npm run playtest -- shot --save shore --scale 1 --full  # verify forced 1× scaling
npm run playtest -- shot --new --keys "i" --full        # open the bag menu
```

## Notes / gotchas
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