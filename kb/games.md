# kb/games.md — *Little Apartment, Big City* (as built)

Read before touching `src/game/`. Build status/checklist: [kb/little-apartment-progress.md](little-apartment-progress.md). Cross-platform pipeline: [kb/build-targets.md](build-targets.md).

> **Origin**: extracted from the `personalsite` portfolio repo (was mounted at `/games#apartment`). This repo is the standalone game. Entry is now `index.html → src/main.tsx → <LittleApartmentGame/>`, booting straight to the title screen — **no router, no site chrome**.

## Game architecture (`src/game/`)
No npm deps (React only). All art in-code (CSP). Logical view **384×224** (24×14 tiles of 16px) — raised from 320×192 for a finer look (user tuned: 448×256 felt too zoomed-out); canvas scales at integer device-pixel multiples (hard rule below).

| File | Owns |
|---|---|
| `engine.ts` | TILE/VIEW consts, SceneDef/Warp/Interactable, AABB movement, camera, `Input` (move/E/Esc/**I=menu**, virtual touch keys, ignores INPUT/TEXTAREA), fixed-step loop, `mulberry32` |
| `sprites.ts` | `buildAtlas()`. One pixel-string body + **accessory overlay system** (cap/beanie/bucket/shades/glasses/visor/apron/headphones/mohawk/hood/bowtie/**cowboy**) → 13 distinct NPCs + `player-hat` variant; custom monster + crawler sprites; HD facades, grass/sand detail variants, water 3-tone 2-frame; furniture incl. rares (kotatsu/aquarium/arcade/neon/maneki); vehicles (`v-car`,`v-boat`); ore nodes; torii+shrine; freezer door; gacha machine; sparkle VFX |
| `maps.ts` | **15 scenes**: apartment, city, denden, konbini, pawn, shore, badtown ("Downtown"), nightclub (Club Kaiju), garage, gacha, backrooms, mines, shrine (Yoshi Shrine), island (Kiwami), deepsea (Sumikawa Bay — player IS the boat; whole south edge warps home). `PLACEMENT_SPOTS` (17 labeled spots), legacy `APARTMENT_SLOTS`/`RARE_SLOTS` (migration only), `MANEKI_SLOT`, `ORE_SPOTS`, `CRAWLER_SPAWNS`, `SCENE_SIGNS` (store signs carry Japanese + English; directional signs English-only) |
| `data.ts` | 10 base furniture, 4 rare (craft-only), 8 fish + deep table, food, vehicles, minerals + `CRAFT_RECIPES`, gacha figures, sketchy/wand/mine constants, **22 `GAME_ACHIEVEMENTS`**, story beats + ending |
| `state.ts` | `lab-save` v2 (versioned; v1 saves auto-place at legacy slots on load — keep the `v` check), clock (`timeMin`, wake 7:00, collapse 26:00), `nightT` tint curve, placement helpers, pawn/sketchy daily seeds, `oreNodesFor`, `shrineLuck`, `unlockGameAch` |
| `fishing.ts` | reel minigame |
| `LittleApartmentGame.tsx` | everything wired: world refs + loop; HUD (money/day/clock/energy/menu 🎒/music 🔊/fullscreen ⛶); **title screen** (bg `/images/title-bg.png`; CONTINUE default when a save exists; MANAGE SAVE 2-step confirm; HOW TO PLAY; portrait setup checklist + soft gate; PWA add-to-home); scene transitions (`runTransition`); overlays dialog/letter/sleep/ending/menu/shops; crawler AI + wand combat + mining; achievement toasts; night tint; per-scene crossfading music |

## Systems (quick map)
- **Fishing gate**: locked until you talk to **Genji** on the shore (`save.canFish`). All casts funnel through `startCast`.
- **Economy**: fishing, shift ¥1800/day, vending ¥150 "Diet Doctor Peepis" can (+12 en), minerals, pawn daily stock, sketchy Jimmy daily deal.
- **Inventory/placement**: purchases box up; place via menu (I) at home into compatible spots; effects (bed/microwave/fridge/AC/kotatsu) only when PLACED; ending = all 10 base placed.
- **Day/night**: `TIME_RATE` 3.5 game-min/real-sec (~5.5 real-min/day); tint ramps 17:00–20:00; 2 AM collapse → wake home. HUD clock reddens past midnight.
- **Sleep / collapse flow** (3 steps via `pendingWakeRef`): `doSleep` snapshots `s.today` into `DayRecap` BEFORE `passNight` → `sleep` overlay (ordinary fade / collapse "OUT COLD" waits for click) → `finishSleep` runs passNight + opens **`endday` recap** overlay → `closeEndDay`. Per-day tally `save.today` (`DayLog`).
- **Vehicles**: car ¥75k (world entity `save.carPos`, board/drive 2.4×/park; TOW ¥500 at garage); boat ¥22k → skiff menu (Sumikawa Bay or Kiwami Island).
- **Island**: Lulu's Tiki Bar; 3 palms drop a coconut/day (`save.coconuts`); tropical fish.
- **Backrooms chain**: konbini freezer door → backrooms (Manager, Jean-Pierre) → mines: daily ore, crawlers, Magical Girl Wand combat, mineral-only CRAFT. KO at 0 energy → Jean-Pierre carries you home. Wand required to descend.
- **Nightclub (Club Kaiju)**: "The Big Guy" patron; DJ Tanuki plays requests from visited scenes (`save.visited`).
- **Gacha hall**: ¥300/roll, 10 figures, full set → maneki trophy.
- **Shrine**: own grounds; offering box; ¥5k/¥20k tiers boost rare-fish weights (`shrineLuck`).
- **Tex** (shore): cowboy hat ¥6,700 → permanent `player-hat`.
- **Achievements**: 22, own system + toast UI, menu tab. `deep` fires ONLY for `fm.table === 'deep'`; `broke` fires when `money < 100`.
- **Cheats** (menu "???" tab, `applyCheat`): `motherlode`, `redbull`, `midnight`, `country roads`, `rocks`, `gimmegimme`.

## Hard rules
- Game has its own achievement system in `lab-save` — self-contained.
- Doors ≥2 tiles wide (hitbox alignment).
- Canvas backing = integer multiple of 384×224 device px (`fit()` + `ctx.setTransform(scale)`); CSS-stretching blurs on Retina.
- **Layout fills the viewport when `filled` (= `isFullscreen || isDesktopApp`)**; otherwise it sits in a centered `max-w-[1000px]` box. `isDesktopApp` = Tauri shell detected via `'__TAURI_INTERNALS__' in window`. The desktop/native window launches OS-fullscreen (`tauri.conf.json` `fullscreen: true`), where `document.fullscreenElement` is null, so `isDesktopApp` (not `isFullscreen`) is what makes the native app fill its window and integer-upscale the canvas.
- **In-page fullscreen buttons (HUD ⛶ + title GO FULLSCREEN) are hidden when `isDesktopApp`** — the OS window owns fullscreen there. They stay for web/mobile.
- Warp targets land beside doors, not on them.
- Save shape changes: loader merges over `newSave()`; only migrations need the `v` check.
- **`src/game/` imports only `react` + sibling game files** — keep it dependency-free.
- **Assets are absolute paths** (`/images`, `/music`, `/sfx`) — resolve at app root in both Cloudflare Pages and the Tauri webview. Don't hardcode origins.
- **Persistence is `localStorage`** (`lab-save`, `lab-music-muted`) — works in every webview.

## Music (`public/music/`)
`SCENE_MUSIC`: apartment, konbini, denden→big-box-store, shore→fishing, deepsea→deep-sea, pawn→pawn-shop, nightclub→the-club, garage→garage-theme, backrooms+mines→backrooms, gacha→gacha, badtown→badside, shrine→shrine, island→island. Default (city): tokyo-apt-drift. title→title.mp3; end-of-day recap→end-of-day.mp3. **All mp3s metadata-stripped** (`ffmpeg -map 0:a -map_metadata -1`) — keep it that way. Crossfade 700ms; one cached `Audio` per track; 🔊 mute persists `lab-music-muted`. (Note: `100-band.mp3` from the source repo is unused and was not carried over.)

## SFX (`public/sfx/`)
Blip SFX (`blip()`, WebAudio) for most cues. Sampled mp3s via `playSfx(src)`: `achievement-unlocked.mp3`, `backrooms-teleport.mp3` (freezer warp), `ui-click.mp3` (delegated root-button click, skips `data-nosfx`), `game-start.mp3` (`begin()`). All metadata-stripped. **Mute is global** (music + sfx).

## Fonts
Game uses `font-retro` (Press Start 2P) + `font-pixel` (VT323), self-hosted via `@fontsource/*` and imported in `src/index.css` (NOT the Google Fonts CDN — so they work offline in native builds).

## localStorage
`lab-save` (v2), `lab-music-muted`.

## Verifying changes
`npx tsc --noEmit` + `npm run build`, then headless browser vs `npm run preview`. Tricks: inject a crafted `lab-save` (+`v:2`, include relevant `storySeen` ids or a pending story letter eats input) → reload → CONTINUE teleports anywhere; canvas `getImageData` to detect BITE; `deviceScaleFactor:2` for scaling checks. Map sanity (row widths, warp/ore/spawn walkability) via regex over `maps.ts`.
