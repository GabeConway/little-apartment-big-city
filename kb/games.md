# kb/games.md — *Little Apartment, Big City* (as built)

Read before touching `src/game/`. Build status/checklist: [kb/little-apartment-progress.md](little-apartment-progress.md). Cross-platform pipeline: [kb/build-targets.md](build-targets.md).

> **Origin**: extracted from `personalsite` portfolio repo (was mounted at `/games#apartment`). This repo = standalone game. Entry now `index.html → src/main.tsx → <LittleApartmentGame/>`, boots straight to title screen — **no router, no site chrome**.

## Game architecture (`src/game/`)
No npm deps (React only). All art in-code (CSP). Logical view **384×224** (24×14 tiles of 16px) — raised from 320×192 for finer look (user tuned: 448×256 felt too zoomed-out); canvas scales at integer device-pixel multiples (hard rule below).

| File | Owns |
|---|---|
| `engine.ts` | TILE/VIEW consts, SceneDef/Warp/Interactable, AABB movement, camera, `Input` (keyboard move/E/Esc/**I=menu**; virtual touch keys; **gamepad via `pollGamepad()`** — stick/d-pad move, A=interact/reel, B=cancel, Y/Start=menu; ignores INPUT/TEXTAREA), fixed-step loop, `mulberry32` |
| `sprites.ts` | `buildAtlas()`. One pixel-string body + **accessory overlay system** (cap/beanie/bucket/shades/glasses/visor/apron/headphones/mohawk/hood/bowtie/**cowboy**) → 13 distinct NPCs + `player-hat` variant; custom monster + crawler sprites; HD facades, grass/sand detail variants, water 3-tone 2-frame; furniture incl. rares (kotatsu/aquarium/arcade/neon/maneki); vehicles (`v-car`,`v-boat`); ore nodes; torii+shrine; freezer door; gacha machine; sparkle VFX |
| `maps.ts` | **15 scenes**: apartment, city, denden, konbini, pawn, shore, badtown ("Downtown"), nightclub (Club Kaiju), garage, gacha, backrooms, mines, shrine (Yoshi Shrine), island (Kiwami), deepsea (Sumikawa Bay — player IS the boat; whole south edge warps home). `PLACEMENT_SPOTS` (17 labeled spots), legacy `APARTMENT_SLOTS`/`RARE_SLOTS` (migration only), `MANEKI_SLOT`, `ORE_SPOTS`, `CRAWLER_SPAWNS`, `SCENE_SIGNS` (store signs carry Japanese + English; directional signs English-only) |
| `data.ts` | 10 base furniture, 4 rare (craft-only), 8 fish + deep table, food, vehicles, minerals + `CRAFT_RECIPES`, gacha figures, sketchy/wand/mine constants, **22 `GAME_ACHIEVEMENTS`**, story beats + ending, **phone `MESSAGES` catalog** (company/people texts; `when(MsgCtx)` predicate, no state import) |
| `state.ts` | `lab-save` v2 (versioned; v1 saves auto-place at legacy slots on load — keep `v` check), clock (`timeMin`, wake 7:00, collapse 26:00), `nightT` + `morningT` time-of-day curves, placement helpers, pawn/sketchy daily seeds, `oreNodesFor`, `shrineLuck`, `unlockGameAch`, **`syncMessages`/`unreadCount`** (deliver catalog texts to `save.messages`) |
| `fishing.ts` | reel minigame |
| `LittleApartmentGame.tsx` | everything wired: world refs + loop; HUD (money/day/clock/energy/**phone 📱 w/ unread badge**/music 🔊/fullscreen ⛶); **title screen** (bg `/images/title-bg.png`; CONTINUE default when save exists; MANAGE SAVE 2-step confirm; HOW TO PLAY; **DISPLAY** scale panel; portrait setup checklist + soft gate; PWA add-to-home); scene transitions (`runTransition`); overlays dialog/letter/sleep/ending/**phone menu**/shops; **`renderMenu` = the smartphone** (status bar w/ energy-as-battery, home app grid, Bag/Messages/Trophies/Settings/Codes apps, `PhoneApp` tab + optional message `thread`); crawler AI + wand combat + mining; achievement toasts; **time-of-day wash (cool night + relit neon signs, warm golden morning)**; per-scene crossfading music |

## Systems (quick map)
- **Fishing gate**: locked until talk to **Genji** on shore (`save.canFish`). All casts funnel through `startCast`.
- **Economy**: fishing, shift ¥1800/day, vending ¥150 "Diet Doctor Peepis" can (+12 en), minerals, pawn daily stock, sketchy Jimmy daily deal.
- **Phone (replaces the old bag menu)**: open with **I** / 📱 HUD button / Y·Start; `overlay {type:'menu', tab: PhoneApp, thread?}`. Phone-shaped shell: status bar (clock/day/**energy-as-battery**), home screen (clock widget + app grid), apps = **Bag** (the inventory/placement/fish/pocket UI, unchanged logic), **Messages**, **Trophies** (achievements), **Settings** (wallet + Save&Quit + Developer codes), **Codes** (cheat input). Esc/B steps back to home then closes; I/Y closes outright. Tap home-bar to pocket.
- **Messages**: `MESSAGES` catalog (data.ts) of company/people texts; each delivered once when its `when(MsgCtx)` predicate is met. `syncMessages(s)` runs on **scene enter, waking, and game start**; appends to `save.messages` (deduped by id). Unread → green dots + HUD badge (`unreadCount`); opening a thread marks it read. Triggers: welcome/landlord, Grandma (by furnishing progress), shop promos (by `visited`), Tex (hat), Kojima (car), Lulu (boat), Manager (wand), Genji (canFish), DJ Tanuki (nightclub).
- **Inventory/placement**: purchases box up; place via the phone **Bag app** (I) at home into compatible spots; effects (bed/microwave/fridge/AC/kotatsu) only when PLACED; ending = all 10 base placed.
- **Day/night** (`nightT`+`morningT`, applied in the draw loop after entities): `TIME_RATE` 3.5 game-min/real-sec (~5.5 real-min/day). **Night** ramps 17:00–20:00 → cool blue wash (outdoor 0.5α) + cyan sky band; **lit signs re-light over the tint** (`relightSigns`: additive bloom + repaint, so neon shines instead of dimming — a sign is "lit" if it blinks / has a border / sits on a solid `#` panel). **Morning** 7:00→9:30 = warm golden `soft-light` wash + low-sun rake (outdoor only). 2 AM collapse → wake home. HUD clock reddens past midnight.
- **Sleep / collapse flow** (3 steps via `pendingWakeRef`): `doSleep` snapshots `s.today` into `DayRecap` BEFORE `passNight` → `sleep` overlay (ordinary fade / collapse "OUT COLD" waits for click) → `finishSleep` runs passNight + opens **`endday` recap** overlay → `closeEndDay`. Per-day tally `save.today` (`DayLog`).
- **Vehicles**: car ¥75k (world entity `save.carPos`, board/drive 2.4×/park; TOW ¥500 at garage); boat ¥22k → skiff menu (Sumikawa Bay or Kiwami Island).
- **Island**: Lulu's Tiki Bar; 3 palms drop coconut/day (`save.coconuts`); tropical fish.
- **Backrooms chain**: konbini freezer door → backrooms (Manager, Jean-Pierre) → mines: daily ore, crawlers, Magical Girl Wand combat, mineral-only CRAFT. KO at 0 energy → Jean-Pierre carries you home. Wand required to descend.
- **Nightclub (Club Kaiju)**: "The Big Guy" patron; DJ Tanuki plays requests from visited scenes (`save.visited`).
- **Gacha hall**: ¥300/roll, 10 figures, full set → maneki trophy.
- **Shrine**: own grounds; offering box; ¥5k/¥20k tiers boost rare-fish weights (`shrineLuck`).
- **Tex** (shore): cowboy hat ¥6,700 → permanent `player-hat`.
- **Achievements**: 22, own system + toast UI, phone **Trophies** app. `deep` fires ONLY for `fm.table === 'deep'`; `broke` fires when `money < 100`.
- **Cheats** (phone Settings → **Developer codes** = `cheats` tab, `applyCheat`): `motherlode`, `redbull`, `midnight`, `country roads`, `rocks`, `gimmegimme`.

## Hard rules
- Game has own achievement system in `lab-save` — self-contained.
- Doors ≥2 tiles wide (hitbox alignment).
- Canvas backing = integer multiple of 384×224 device px (`fit()` + `ctx.setTransform(scale)`); CSS-stretching blurs on Retina.
- **Layout fills viewport when `filled` (= `isFullscreen || isDesktopApp`)**; else sits in centered `max-w-[1000px]` box. `isDesktopApp` = Tauri shell detected via `'__TAURI_INTERNALS__' in window`. Desktop/native window launches OS-fullscreen (`tauri.conf.json` `fullscreen: true`), where `document.fullscreenElement` is null, so `isDesktopApp` (not `isFullscreen`) makes native app fill its window and integer-upscale canvas.
- **In-page fullscreen buttons (HUD ⛶ + title GO FULLSCREEN) hidden when `isDesktopApp`** — OS window owns fullscreen there. Stay for web/mobile.
- **Title screen shows ✕ QUIT GAME only when `isDesktopApp`** — closes window via `__TAURI_INTERNALS__.invoke('plugin:window|close', {label:'main'})` (dependency-free; keeps `src/game/` React-only). Needs `core:window:allow-close` in `src-tauri/capabilities/default.json`.
- Warp targets land beside doors, not on them.
- Save shape changes: loader merges over `newSave()`; only migrations need `v` check.
- **`src/game/` imports only `react` + sibling game files** — keep dependency-free.
- **Assets are absolute paths** (`/images`, `/music`, `/sfx`) — resolve at app root in Tauri webview. Don't hardcode origins.
- **Controller**: `Input.pollGamepad()` called once per update tick (top of `update` in `LittleApartmentGame.tsx`). Standard Gamepad mapping, edge-detected; reuses virtual-dir path so shares keyboard's "most recent wins" ordering. Dependency-free (Gamepad API = webview global).
- **Persistence is `localStorage`** (`lab-save`, `lab-music-muted`) — works in every webview.

## Music (`public/music/`)
`SCENE_MUSIC`: apartment, konbini, denden→big-box-store, shore→fishing, deepsea→deep-sea, pawn→pawn-shop, nightclub→the-club, garage→garage-theme, backrooms+mines→backrooms, gacha→gacha, badtown→badside, shrine→shrine, island→island. Default (city): tokyo-apt-drift. title→title.mp3; end-of-day recap→end-of-day.mp3. **All mp3s metadata-stripped** (`ffmpeg -map 0:a -map_metadata -1`) — keep it that way. Crossfade 700ms; one cached `Audio` per track; 🔊 mute persists `lab-music-muted`. (Note: `100-band.mp3` from source repo unused, not carried over.)

## SFX (`public/sfx/`)
Blip SFX (`blip()`, WebAudio) for most cues. Sampled mp3s via `playSfx(src)`: `achievement-unlocked.mp3`, `backrooms-teleport.mp3` (freezer warp), `ui-click.mp3` (delegated root-button click, skips `data-nosfx`), `game-start.mp3` (`begin()`). All metadata-stripped. **Mute is global** (music + sfx).

## Fonts
Game uses `font-retro` (Press Start 2P) + `font-pixel` (VT323), self-hosted via `@fontsource/*` and imported in `src/index.css` (NOT Google Fonts CDN — so work offline in native builds).
**Naganoshi** — Japanese pixel font (OFL 1.1, GGBotNet) — self-hosted in `public/fonts/` (`@font-face` in `src/index.css`; `font-jp` Tailwind family; license bundled as `public/fonts/Naganoshi-License.txt`). Source archive (not bundled): `assets/fonts/Naganoshi_Font_0_4.zip`. Canvas store signs render **per character**: kana/kanji in Naganoshi, Latin/digits/punctuation in bold monospace (Naganoshi has no Latin glyphs, so whole-string switch would tofu English parts). See `measureRun`/`drawRun`/`charFont` in sign-drawing block of `LittleApartmentGame.tsx`. Canvas text doesn't auto-fetch webfont — `document.fonts.load("16px 'Naganoshi'")` kicked in play-loop effect.

## localStorage
`lab-save` (v2), `lab-music-muted`, `lab-scale` (`'auto'` or forced integer canvas scale 1–8; title screen **DISPLAY** panel).

## Display / scaling
Title screen **DISPLAY** button → panel of scale options (AUTO / 1×–6×), persisted as `lab-scale`. The `fit()` effect: **AUTO** = biggest integer multiple of 384×224 fitting frame (layout box). **N×** = forced scale, clamped so can't exceed screen — in **filled** layout (fullscreen/native) frame *is* viewport so it's cap; in **windowed** web box capped at 1000px, so forced scale clamped to *viewport* (`window.innerWidth/innerHeight`) instead and `boxW` grows box past 1000 to fit (never shrinks below 1000 — would crowd HUD). Without this, every scale above 2× clamped to box, looked identical. (No separate "resolution" axis — logical viewport fixed at 384×224 by map design; output res = scale × that.)

## Verifying changes
`npx tsc --noEmit` + `npm test` + `npm run build`, then **`npm run playtest`** (Playwright harness — seed save, drive input, read `window.__lab.snapshot()`, screenshot; see [kb/playtesting.md](playtesting.md)). Tricks: inject crafted `lab-save` (+`v:2`, include relevant `storySeen` ids or pending story letter eats input — harness auto-dismisses unless `--keep-overlay`) → reload → CONTINUE teleports anywhere; `--dpr 2` for Retina scaling checks; `--save '{scene,px,py}'` teleports via `begin()`. Map sanity (row widths, warp/ore/spawn walkability) via regex over `maps.ts`.