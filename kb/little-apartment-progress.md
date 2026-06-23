# Little Apartment, Big City — build progress tracker

Cross-session state. Full design/as-built: [kb/games.md](games.md). `[ ]` todo, `[x]` done.

**Status: EXTRACTED into standalone repo `lilaptbigcty` (2026-06-14)** — game lifted verbatim from `personalsite` (was on branch `fable`, latest game commit `47f877e`); now at `src/game/`, boots straight to title screen. **Build-only native game** (Tauri v2 desktop/mobile) — web/Cloudflare target removed. Pipeline: [kb/build-targets.md](build-targets.md).

> **Update (2026-06-14, post-extraction):** web/Cloudflare dropped — build-only now (`scripts/copy-404.js`, `public/_headers`, `manifest.webmanifest` deleted). Official releases: Windows (installer + portable noinstall `.exe`), macOS `.dmg` (Apple Silicon), Linux `.deb` + `.AppImage`. Added Vitest + CI + pre-commit hook ([kb/testing.md](testing.md)) and gamepad/controller support. Web-era checklist items below (PWA, CF Pages) are **historical**, no longer apply.

> History below (Parts A–v3.6) = as-built record from `personalsite` era. Part A ("Games section") portfolio-only, no longer applies to standalone repo.

## Feature pass (2026-06-23) — buildings, dialogue, fishing, art
- [x] **Nakatomi Apartments** rename (Die Hard nod): facade `t-apt-wall` + gold tile sign `t-nakatomi-l/r` (in-tile FONT3x5 micro-font) + planters; removed the old overlapping `MAISON KAWA` SCENE_SIGNS entry.
- [x] **Torii** slimmed (thinner posts/base); **shrine grounds** glow-up (sakura/maple/toro lanterns/komainu/stone path/upgraded offering box); **water** depth (layered bands + shimmer/foam); **grass** depth (extra speckle + `t-grass-v2` clover/daisy).
- [x] **Club Kaiju** stuck disco-ball light fixed — now drifts in a slow circle off the anim clock like the beams.
- [x] **Dialogue typewriter** (~83 cps, E snaps line full then advances) + **Stardew portraits** (`PORTRAIT_IMAGES`/`PORTRAITS`); Granny Sato PNG portrait `public/images/portraits/granny-soto.png`.
- [x] **Journal** phone app (📓) — live goals/next-steps, extensible.
- [x] **Fishing overhaul** (`fishing.ts`: catch-zone + lunge/stamina/tension) + **rod tiers** (`save.fishRod`, `RODS`); Genji sells the Carbon Rod (¥6,000, `genji` shop).
- [x] **Community Greenhouse** (`greenhouse` scene off shrine) — Granny Soto, sunflower MVP, sprinkler toggle, day-cycle growth (`growGreenhouse` in `finishSleep`); `CROPS`/`GREENHOUSE_PLOTS`, built to extend to a farming sim. Music `greenhouse.mp3`.
- [x] **Kawamachi Museum** (`museum` scene in Downtown) — Bingus Doofelsmurt, 12 `MUSEUM_SLOTS` Stardew-CC donation framework, `save.museum.donated`, `donateToMuseum` ready for future collectibles. Music `museum.mp3`.
- [x] Built via parallel worktree subagents + merge; all 88 tests pass, tsc/build clean, playtested each scene (shrine/greenhouse/museum/city/shore/Journal/dialogue).
- [ ] **Future**: museum collectible items (wire `donateToMuseum` to found objects); more greenhouse crops; portraits for more NPCs.

## Part A — Games section (done earlier, unchanged)
- [x] Navbar Games tab, `/games` hub (hash views), `/about-me` redirect, GabeOsDesk extraction, link repoints, InterestsPage deleted
- [x] Game logo on hub card (`public/images/game-logo.png`, downscaled 1024→512)

## Part B — Game core (v1, done)
- [x] engine/sprites/maps/data/state/fishing/component; fishing, shops, story beats, ending
- [x] Per-scene music; Retina integer scaling; 2-wide doors

## Part C — v2 expansion (all done 2026-06-12)
- [x] **Resolution**: logical view 320×192 → 448×256 → settled **384×224** (user-tuned zoom)
- [x] **Day/night**: clock (1.8 game-min/s), HUD time, evening tint, 2 AM collapse → wake home
- [x] **Day/night polish** (`morningT`, `relightSigns`): cool blue night + sky band; lit neon signs re-light over the tint (additive bloom + repaint) so they shine; warm golden-hour morning wash 7:00→9:30
- [x] **Inventory + placement**: purchases boxed; effects + ending need PLACED; save v2 + v1 migration
- [x] **Furniture Arrange (drag-and-drop, replaces fixed spots)**: phone Bag → ARRANGE ROOM at home; pointer-capture surface + DOM tray/bin + canvas grid & ghost (`placeableAt`); drag/tap to place, move, or bin; movement frozen, Esc exits. `PLACEMENT_SPOTS` now migration-only
- [x] **Smartphone (P / 📱, replaces bag menu)**: phone-shell overlay — status bar (energy-as-battery), home app grid, apps: Bag · Messages · ZamaZonk · Trophies · Settings (wallet + Save&Quit + Developer codes/cheats); no Wallet app; ⏸ PAUSED; time frozen in overlays. Open key changed I→**P**
- [x] **Phone messages**: `MESSAGES` catalog of company/people texts delivered by milestone (`syncMessages` on scene-enter/wake/start); `pushMessage` for one-offs; unread badge + green dots; read on open; stored in `save.messages`
- [x] **ZamaZonk megacorp**: phone app orders base furniture (`price + ¥300 ZamaPrime`), arrives next morning boxed (`fulfillDeliveries` in `finishSleep`); `save.orders[]`; order+delivery receipts via `pushMessage`; welcome promo; logo `public/images/zamazonk-logo.png`
- [x] **HUD bar polish**: fixed-height (`h-12`) gradient/chip bar — also fixes the title→game jutter (no font-load reflow)
- [x] **In-game achievements**: 21, own system + toasts (site ACHIEVEMENTS untouched)
- [x] **Bad side of town** (badtown): Club Kaiju (bar, dancers, DJ requests from visited scenes), Kojima Motors (car = outdoor speed ×1.5 + parked sprite; boat = deep fishing), sketchy Jimmy (daily 35% deal, 50% breaks)
- [x] **Backrooms chain**: konbini freezer door (hidden until first E) → Manager (Peepis-gated: "parched but on a diet"), Jean-Pierre tourist → **mines**: daily ore, crawlers, Magical Girl Wand combat, mineral-only CRAFT for rare furniture + mineral selling
- [x] **Gacha hall**: ¥300 capsules, 10 figures, maneki trophy; **shrine**: donations → fishing luck tiers
- [x] **Tex's beach stand**: $67 cowboy hat → player-hat sprite
- [x] **Vending** = pocketable "Diet Doctor Peepis" cans (drink from menu / feed Manager)
- [x] **Doki Doki Discount** rename (scene id stays `denden`); unique styled signs w/ neon blink
- [x] **Sprites/personality**: accessory overlay system, 13 distinct NPCs + custom monster/crawlers, rotating state-aware dialogue every character
- [x] **Music**: 10 tracks wired (incl. pawn-shop, the-club, backrooms, garage-theme, gacha), 700ms crossfade, DJ override
- [x] **Fullscreen** ⛶ toggle

## Verification (Playwright headless vs vite preview, all passing, zero JS errors)
Hub logo · placement flow (box→place→put away) · v2 migration guard · freezer discovery · tourist · Manager gate/feed/craft-only/sell/wand · mines descend/mine/crawler damage · DJ gating + track swap · shrine tier + ach · gacha roll · hat · car purchase · sketchy outcome · 2 AM collapse → Day 2 home · cheats (incl. typing in input doesn't move player) · clock ticks in explore, frozen in menu · 384×224 integer backing · craft-only Manager (no yen buttons)

## Key constraints
See "Hard rules" in kb/games.md. Plus: injected test saves need `v:2` and relevant `storySeen` or queued story letter eats input.

## Future adds (documented, not built)
- [ ] Badtown street + gacha-hall… gacha now own track; badtown street still default — dedicated badtown theme welcome
- [ ] Real-device touch pass (D-pad rendered on coarse pointers; desktop-verified only)
- [ ] Cosmetic: city path north of apartment building dead-ends
- [ ] Commit + PR (user drives)

## v3 wave (2026-06-12, late)
- [x] Shrine = own grounds scene + miko; island = tiki bar + 3 coconut palms (collect/eat/sell); deepsea = sail bay, cast anywhere
- [x] Car v2: world entity, board/drive(2.4×)/park-anywhere, door-safe parking + tow service; **¥75k endgame price**
- [x] Wand fires projectile bolts; crawlers lunge; KO → Jean-Pierre rescue; tourist gates mine entry without wand; ladder-vs-wand interact bug fixed
- [x] Kabukicho-styled Downtown (rename from Kabukicho label), kana-first signage w/ EN pairs + 酒 on konbini, road-row warps fixed between city↔Downtown
- [x] New tracks wired: badside (Downtown), shrine, island, gacha; ALL mp3s metadata-stripped
- [x] Club Kaiju + The Big Guy; logo big on hub card; HD pass (facades, shading strips, NPC shadows); cheats tab; ⏸ PAUSED; zoom 384×224
- All verified headless (verify3/4/5 + spot scripts), zero JS errors

## v3.1 (2026-06-13)
- [x] deep-sea.mp3 track for bay (metadata-stripped)
- [x] Deepsea exit easier: entire south edge warps to shore (was 2-tile gap); HOME sign + prompt
- [x] Cheat `country roads` → teleport to apartment
- [x] GamesPage: ALPHA badge + "alpha release" note on apartment card and in-game title

## v3.2 (2026-06-13, later)
- [x] **Title screen redo**: painted bg (`public/images/title-bg.png`, Gemini art downscaled 2752→1280w, 1.5MB) cover+pixelated + dark gradient; title music (`public/music/title.mp3`, metadata + cover-art video stream stripped, 3MB) wired via `SCENE_MUSIC.title` w/ autoplay + gesture-kick fallback, crossfades to scene on begin
- [x] **Default to CONTINUE**: when save exists, CONTINUE = primary filled button (Day/¥ subtitle); NEW GAME shown only when no save
- [x] **Save management panel** (MANAGE SAVE on title): summary (day/money/furniture/achievements/fish) + START NEW GAME & DELETE SAVE each behind 2-step confirm so progress not wiped by stray click
- [x] **Achievement fixes**: `deep` no longer awarded for tropical/shallow (strict `fm.table === 'deep'`); `club` desc Club Zinnia→Club Kaiju; new `broke` ach "i dont have enough money for chicken nugget" at ¥0 (22 total)

## v3.3 (2026-06-13, sfx + polish)
- [x] **Sampled SFX** (`public/sfx/`, metadata-stripped, `playSfx()` cached/rewound): `achievement-unlocked.mp3` in `award()`; `backrooms-teleport.mp3` on konbini freezer-crack `portal` warp; `ui-click.mp3` via delegated root-button click (skips `data-nosfx`); `game-start.mp3` in `begin()`. `media-src 'self'` covers `/sfx`.
- [x] **Global mute**: `readMuted` hoisted; `blip()` + `playSfx()` early-return when muted; 🔊 added to title screen.
- [x] **HUD**: removed fish counter; energy bar now color-ramps (green/amber/red) + gloss + smooth transition.
- [x] **HOW TO PLAY** overlay on title screen (goal, controls, money, energy/clock, furnishing, explore).
- [x] **Scene transitions** (`runTransition` + `transTimers`, scoped `<style>` keyframes): `start` cover (title→game, all begin-buttons route through `startGame()`); `freezer` cold-flash (konbini→backrooms `portal`). Action swaps underneath while overlay opaque.
- [x] New konbini track (`konbini.mp3` replaced, metadata + cover-art stream stripped).
- [x] **Portrait nudge**: coarse-pointer + portrait orientation → "rotate to landscape" banner on title screen (`isPortrait` via `matchMedia('(orientation: portrait)')`).

## v3.4 (2026-06-14, QoL pass)
- [x] **Save & Quit to Menu** button in pause menu (`quitToMenu`)
- [x] HUD **BAG** + **FULL/EXIT** buttons made obvious (labeled, bordered/filled, drop-shadow)
- [x] Freezer transition text → "WARPING INTO THE UNKNOWN"
- [x] **Shorter days**: `TIME_RATE` 1.8 → 3.5 (~5.5 real-min/day)
- [x] **Better sleep**: futon restore 60% → 85%
- [x] **Mobile title**: `min-h-[70vh]` on coarse pointers + GO FULLSCREEN button + fullscreen guide modal (Android = element FS API; iOS = Add-to-Home-Screen steps, detected via `document.fullscreenEnabled`)
- [x] **Pass-out / sleep screen** redone: distinct "OUT COLD" (collapse, red vignette + throb) vs "💤 Goodnight" (normal), vignette + rise/fade animations

## v3.5 (2026-06-14, end-of-day)
- [x] **OUT COLD now waits for click/press** (`awaitClick`) before continuing
- [x] **End-of-Day recap** screen (`endday` overlay): net ¥, fish caught, minerals mined, shifts, new furniture; collapse warning. Flow `doSleep → sleep screen → finishSleep → endday → closeEndDay`. Per-day tally `save.today` (`DayLog`) reset each morning.
- [x] **end-of-day.mp3** plays over recap (metadata + cover-art stream stripped); resumes scene music on close
- [x] `broke` achievement now fires under ¥100 (was ≤0)
- [x] `first-fish` achievement renamed → "way down yonder"

## v3.6 (2026-06-14, mobile title)
- [x] Mobile title rebuilt: full-viewport `fixed` layer (was cramped in aspect-locked frame); modals switch to `fixed z-[60]` on coarse
- [x] Portrait **setup checklist** (rotate + one-tap fullscreen-landscape / iOS add-to-home); **soft gate** (play always available)
- [x] `goFullscreenLandscape` = requestFullscreen + `screen.orientation.lock('landscape')` (Android); iOS falls back to guide
- [x] **PWA**: `public/manifest.webmanifest` + apple meta tags + apple-touch-icon + `viewport-fit=cover` → iOS Add-to-Home-Screen = chromeless fullscreen
- [x] In-game "turn sideways" nudge if portrait mid-play
- [x] Site `<title>` "Gabe's Portfolio" → "Gabe's Website"

## Standalone extraction (2026-06-14, this repo)
Lifted game out of `personalsite` into `lilaptbigcty` as cross-platform app. Game source
copied verbatim except two type fixes (see gotcha below).

**Done & verified:**
- [x] Scaffold: Vite 6 + React 19 + Tailwind 3 + TS; `src/main.tsx` → `<LittleApartmentGame/>` at title (no router/site chrome)
- [x] `src/game/` = 7 files; assets in `public/{images,music,sfx}` (16 music — `100-band.mp3` unused, dropped); manifest + `_headers` (self-only CSP)
- [x] **Fonts self-hosted** via `@fontsource/press-start-2p` + `@fontsource/vt323` in `src/index.css` (Google CDN removed → offline-safe in native webviews)
- [x] **Tauri v2** scaffold in `src-tauri/` (Cargo.toml, tauri.conf.json, lib.rs/main.rs, capabilities); `id com.gabeconway.lilapt`; window 1152×672 (3× of 384×224)
- [x] **App icons generated** — `npm run tauri icon public/images/game-logo.png` populated `src-tauri/icons/` (desktop .icns/.ico, android mipmaps, ios). JS-only, ran without Rust.
- [x] Dev scripts: `scripts/copy-404.js` (CF Pages SPA) + `start-dev.{sh,ps1,cmd}` (target picker `web|desktop|android|ios`)
- [x] Docs migrated: `CLAUDE.md`, `README.md`, `kb/{games,little-apartment-progress,build-targets,conventions,dependencies,README}.md`
- [x] **Validated**: `npx tsc --noEmit` clean, `npm run build` clean (JS 345KB / 106KB gz, fonts bundled); `npm run preview` serves index + JS + music + images all 200. `personalsite` left untouched.

**Two source fixes (new repo only — personalsite NOT modified):**
1. `Hud` initial `useState` missing `time` → added `time: ''`.
2. `bite` `FishMode` object dropped `table` → `fm.table` was `undefined` after bite, so
   deep/tropical fish silently fell back to regular `FISH` table. Added `table: fm.table`.
   **Real runtime bugfix.** If re-sync game from personalsite, re-apply both.

**⚠ Sync gotcha**: `personalsite` has **no `@types/react`** installed, so its `tsc` never
type-checks React calls — two bugs above invisible there. This repo DOES have
`@types/react`, so `tsc --noEmit` is real gate here. Don't assume personalsite type-clean.

**Remaining (next context — see kb/build-targets.md):**
- [x] Install **Rust** (rustup/Homebrew) — done (cargo 1.96)
- [x] Committed to `main`; CI release pipeline green (Win/macOS/Linux)
- [ ] `npm run tauri android init` (needs Android Studio/SDK/NDK) · `npm run tauri ios init` (needs Xcode)
- [ ] Test `android:dev` / `ios:dev` once SDKs present; add signed mobile CI workflow
- [ ] Code-signing/notarization secrets (Gatekeeper/SmartScreen)
- [ ] (Optional) esbuild dev-only audit advisory — fix is vite 8 (major, held back)

## Last session (personalsite era)
2026-06-13 — deep-sea track + easier bay exit (whole south edge) + `country roads` cheat + ALPHA badge; Yoshi Shrine rename; trimmed JP from directional signs (stores keep it); Windows dev script (`start-dev.ps1`/`.cmd`); verified all mp3s audio-only/metadata-stripped. Everything committed on `fable` (latest `47f877e`). kb fully synced.