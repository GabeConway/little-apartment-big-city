# Little Apartment, Big City — build progress tracker

Cross-session state. Full design/as-built: [kb/games.md](games.md). `[ ]` todo, `[x]` done.

**Status: EXTRACTED into standalone repo `lilaptbigcty` (2026-06-14)** — game lifted verbatim from `personalsite` (was on branch `fable`, latest game commit `47f877e`); now at `src/game/`, boots straight to title screen. **Build-only native game** (Tauri v2 desktop/mobile) — web/Cloudflare target removed. Pipeline: [kb/build-targets.md](build-targets.md).

> **Update (2026-06-14, post-extraction):** web/Cloudflare dropped — build-only now (`scripts/copy-404.js`, `public/_headers`, `manifest.webmanifest` deleted). Official releases: Windows (installer + portable noinstall `.exe`), macOS `.dmg` (Apple Silicon), Linux `.deb` + `.AppImage`. Added Vitest + CI + pre-commit hook ([kb/testing.md](testing.md)) and gamepad/controller support. Web-era checklist items below (PWA, CF Pages) are **historical**, no longer apply.

> History below (Parts A–v3.6) = as-built record from `personalsite` era. Part A ("Games section") portfolio-only, no longer applies to standalone repo.

## Session 2026-06-30 — economy rebalance + endgame sinks + festivals/derby/karaoke (on `DEV`)
Content + balance pass: money is harder-won, the late game has real sinks, and the town runs three new recurring live events. Full as-built detail in [games.md](games.md) (2026-06-30 block + the in-place section edits). New save fields documented in games.md ("New save fields"): `shrineRestored`, `charliePatron`, `homeOnsen`, `homeOnsenDay`, `keepsakes`.
- [x] **Economy rebalance** — ore values trimmed (Void Opal 900→750, Astral Stone 2200→1600); `oreCount` cut (fewer nodes → mining is an *event*); vaults rarer/deeper (`VAULT_MIN_FLOOR` 3→4, `VAULT_CHANCE` 0.07→0.05, chest `1800+depth*350`); geode jackpot 5000→3000. **Car** 75k→100k and **gated** (boat owned + `first-delivery` ach); new **bicycle** ¥9k entry vehicle (`v-bicycle`, in `VEHICLES`).
- [x] **Luxury money sinks** — **shrine restoration** ¥80k (`shrineRestored` → permanent +1 luck tier via `shrineLuck`), **Charlie sponsorship** ¥40k (`charliePatron`), **private home onsen** ¥70k (`homeOnsen`, bought via landlord; drawn at apt 13,1; `homeSoak` ~once/day +60% energy + warm buff). Helpers `restoreShrine`/`sponsorCharlie`/`buyHomeOnsen`/`homeSoak`.
- [x] **Lease office → phone text thread** — the `landlord` interactable opens a reply-chip text thread (expand ¥120k / onsen ¥70k), replacing the intercom shop. Adds the Nakatomi "whole town in one building" flavor (Whittier/Begich Towers nod).
- [x] **Mine combat auto-defend** — wand/gun auto-targets the nearest crawler (`autoFireRef`), freeing the action button for mining.
- [x] **14 optional furniture pieces** — Japanese decor set (shoji/chabudai/zabuton/byobu/kamidana/kakejiku/chochin/bonsai/zengarden/tansu/noren/ricecooker) + washlet toilet + sink, all `optional:true` (don't gate allFurnished).
- [x] **Mission rewards → Keepsakes** — `KEEPSAKES` catalog + `save.keepsakes`; capstones grant items (plums/demodisc/ring/omamori/badge/hatband), paired money halved; Bag "Keepsakes" section (Eat/Sell); `omamori` → passive mining luck.
- [x] **Cooking 2.0** — 6 Institute recipes (ramen/curry/tempura/okonomiyaki/mochi/bento) via a one-time Kawamachi Cooking Institute phone enrollment (fridge+microwave placed); new **Recipe Book** phone app.
- [x] **Festivals** — `FESTIVALS`/`festivalFor(day)`, every 14 days (Summer Matsuri / Tanabata / Hatsumōde): transient decor, 3 minigames (goldfish/wish/omikuji), night fireworks, morning bulletin.
- [x] **Fishing tournament** — "Sumikawa Shore Fishing Derby" on `day%10===5`; townsfolk gather on shore, live `tournamentScore`, 4 prize tiers (`tournamentTierFor`).
- [x] **Karaoke at Club Kaiju** — DJ Tanuki → SING single-lane rhythm minigame (`karaokeRef`); tips ¥50–1,600; reuses the club track (no double audio).
- [x] **NPC schedules deepened** — 9 new `ROUTINES` (3 dancers, kaiju, mechanic, bingus, tiki, casino-host, collector) + richer tex/granny; `WANDER_IDS` expanded.
- [x] **Racing rotates 4 tracks** — `DRIVE_TRACKS` (Riverside Loop / Switchback Climb / Coastal Sweep / Harbor Figure-8), daily-seeded, per-track time limits; `drivePayout(elapsed, grass, timeLimit?)`.
- [x] **Sea cave** — new scene `seacave` (**20 scenes** now): E to enter, walk-out warp back to island; one-time ¥5,000 nest-egg niche (`seacave-niche`).
- [x] **Island signpost + shore↔city seam** — real `t-island-sign` tile (was floating text); mirrored boardwalk threshold with `← BEACH`/`TOWN →` signs.
- [x] **Courier gig terminal moved into the konbini** (tile 14,6) + one-time `gig-intro` explainer (deposit-for-collection loop).
- [x] **Store sick-days** — `storeClosedToday` (~10%/day): denden/pawn/gacha randomly shut; door shows a sign + bounces you.
- [x] **Controls** — WASD+arrows move; E/Space/Enter interact (+hold to reel); P/Q open the phone; Space selects/advances in menus.

## Session 2026-06-27 — hardcore playtest + review + harness upgrades (on `dev`)
Full QA sweep: playtested every system, code+perf review (incl. parallel compressed
subagents), tooling upgrades. No softlocks, dead-ends, or economy exploits found.
- [x] **Playtest sweep** — all **19 scenes** render with zero runtime errors; all phone
  apps open (Bag/Messages/ZamaZonk/Trophies/Journal/Skills/Friends/Music/Settings; "Codes"
  is nested in Settings, not a home app); movement, warps, and the apartment→city door all sound.
- [x] **Perf fix — mines flashlight gradient cached** (`mineDarkRef`): was `createRadialGradient`
  **every frame** (the KB-banned pattern). Now built once per light-radius, `translate`d to the
  player, flicker on `globalAlpha`. Only per-frame radial-gradient regression in the draw loop;
  rest of the hot path (signs/glows/sky/sun gradients) verified still cached.
- [x] **Defensive fixes** — greenhouse `growGreenhouse` guards day 1 so a fresh plot's
  `wateredDay:0` can't read as watered (`s.day > 1 &&`); gamepad analog dead-zone now inclusive
  (`<=`/`>=`) so exactly ±0.5 registers.
- [x] **Playtest harness upgrades** (for Claude QA, see [playtesting.md](playtesting.md)):
  `--new` now clicks through the new "what's your vibe?" picker (was timing out → fresh games
  unreachable); `SCENE_SPAWN` expanded **6 → all 19 scenes** + `SCENE_EXTRA` unlock flags so
  any scene is one `--save <scene>` away; new **`smoke`** command sweeps every scene for runtime
  errors in one run (exit 1 on any failure) — fast post-draw-change regression guard.
- [x] **No-spoiler UI pass** (user-driven): phone apps no longer reveal unfound content — Friends app lists only met people (`metFriend`); Skills app shows a row only once its activity is unlocked; end-of-day recap hides Fish/Minerals/Shifts rows until that system is in play. (commit c4c2208)
- [x] **Game reframed endless + first-contact friends + trimmed pop-ups** (user-driven, see games.md): removed the furniture auto-ending (now a quiet milestone + the `furnished` achievement; `s.ended` reused as the milestone flag); first time you talk to / shop with a befriendable NPC adds them to the Friends app + a "💛 new contact" toast (`meetFriend`/`meetFriendNotify`, toast gained an icon arg); Journal reframed around discovery; light message trim (cut 'A Start'/'Almost There' letters + Doki Doki / Konbini ad texts). (commit e16a884)
- [x] **Island overhaul** (user-driven, see games.md `Island (Kiwami)`): 22×9 → 28×15, volcano + lagoon + docks + jungle + onsen + banana palms + a bottle secret; 7 new in-code sprites. Verified via smoke (19/19) + screenshot + interaction asserts (onsen/bottle/banana).
- [x] **Toolkit note**: the **sprite-ai MCP** ("new toolkit" for PNG world art per art-direction.md) was **out of budget** this session — balance **5 purchased tokens, 0 monthly** (a map tile costs 4, a prop 1). Not enough for an art overhaul, so the island was done **in-code** instead. **Top up sprite-ai tokens** to regenerate island/world art as higher-res PNGs (`loadSheets`/`SheetDef` pipeline) later.
- [x] **5-feature batch** (built via 5 parallel worktree subagents, cherry-picked onto `dev`; see games.md 2026-06-27 block): **Fishopedia** collection-log phone app; **friendship deepens** (heart-tiered lines + `allFriendsMet` capstone → `regular` achievement); **weather variety** (fog + meteor-shower nights + "make a wish" → lucky); **4 hidden secrets** (island sea cave / city rooftop+`skyline` / midnight stranger NPC / shore stargazing); **random daily street events** (6 unique city vignettes, `STREET_EVENTS`). All validated (tsc / **127 tests** / build / smoke 19/19 / per-feature playtests).
- [x] **"That's Mid"** achievement (`mid`) — harvest a normal-quality crop (the one explicit low-quality item). Playtest-confirmed via a seeded ripe plot.
- [x] **Cleanup** — removed the dead `ENDING` export (game is endless); confirmed no orphan files (Naganoshi license, font zip, README `docs/` screenshots, `visual-baseline.mjs` all in use). Agent worktrees pruned.
- [x] **Depth batch 2** (4 more parallel worktree subagents, cherry-picked onto `dev`; see games.md "depth batch 2" block): **Almanac** discovery-tracker phone app; **NPC daily routines** (`ROUTINES`/`routineTargetFor`); **mine treasure vault** (rare gold floor + chest → `vault` achievement); **relationship events** (4♥/8♥ hangouts → `heart2heart`, ≥6♥ home visits → `housewarming`). All validated (tsc / **142 tests** / build / smoke 19/19 / per-feature playtests). Removed the weak city-rooftop fire-escape secret + dropped dead `ENDING`; Warmed buff HUD chip now shows its effect.
- [x] **Backlog batch 3** (4 more parallel worktree subagents, cherry-picked onto `dev`; see games.md "backlog batch 3" block): **Kojima delivery driving minigame** (`driveRef`, dirt track, `first-delivery`/`ace-driver`); **courier gig terminal** (odd-jobs board → `t-terminal` computer, deposit items); **shore overhaul** (24×13 → 24×16 lush coastline, 11 tiles); **NPC wander polish** (`unstickDirs`, per-NPC walk cadence). All validated (tsc / **151 tests** / build / smoke 19/19 / per-feature playtests + screenshots).
- [x] **Polish/fixes** (user-driven): Enter input fix (in-world interact + menu-button activate, via `useUiNav` stopImmediatePropagation); dropped the long ambient noise bed; wired downloaded SFX (coin/buy/casino-win/heart-up/car-start/menu-click/level-up); greenhouse water-all → 🪏 Uproot (`clearPlot`); Messages Clear-all; "That's Mid" achievement; SFX wishlist at kb/sound-effects-wishlist.md.
- [x] **Docs** — logged here; games.md synced (**37 achievements**, 19 scenes, all phone apps, new-systems + batch blocks). Code review + bugtests on prior batches: clean.
- Verified: `tsc`/`npm test` (113)/`build` clean; `smoke` 19/19 green; mines re-screenshotted.
- Note: bundle is one 590 KB JS chunk (180 KB gzip). Fine for a Tauri-bundled local app (no
  network fetch) — Vite's split warning is **not** worth acting on here; left as-is.

## Session 2026-06-26 — cozy polish + interaction fixes (on `dev`)
- [x] **Ambient soundscapes** (asset-free WebAudio, `ambientSet` driven from the draw loop): shore surf swell + gull caws, mine drips, rain-on-glass at home; layered over music, honors mute.
- [x] **Home trophy shelf** — wall plank (`f-shelf`, `SHELF_SLOT`) auto-appears with ≥1 gachapon figure; renders one toy (`fig-0..9`) per owned figure; `trophy-shelf` interact lists the collection.
- [x] **Jukebox gated** — Music phone app hidden until you buy the Home Jukebox from DJ Tanuki (`JUKEBOX_PRICE` ¥8k, `save.jukeboxUnlocked`); old saves with a `homeTrack` grandfathered.
- [x] **Rainy days → rare fish** — `isRainyDay` adds a +0.8 bite boost to value≥500 fish (stacks with shrine/rod/skill).
- [x] **Cat redrawn** — David is now a side-profile sitting cat + 2-frame walk (was a front-facing blob).
- [x] **Talk-first interaction** — removed the TALK/GIFT chooser (`npcchoice` gone); E always talks, and the final dialog line offers a trailing **🎁 Give a gift** action (and Done). **Done is the default-focused button** so a normal press ends the chat; move over to gift. E activates the focused button for keyboard/pointer (gamepad via `useUiNav`).
- [x] **Tex sells directly** — removed his hat ShopFrame (`shop:'hat'` gone from `ShopId`); buys via a `Buy · ¥6,700` dialog action.
- [x] **Merchant gifting restored** — Genji/Lulu/Manager (shop-on-E friends) get a 🎁 button inside their stalls (regression fix from the talk-first change).
- [x] **Fluid greenhouse watering** — one-press water when facing a dry planted bed (no menu) + a `💧 Water all` button (`waterAllPlots`).
- [x] **Respectful Yoshi** — shrine pass-out rescue dialog reworked for genuine Shinto tone (kami, harae, care for a guest).
- [x] **Signs mounted in-world** — cached sign sprites now framed beveled plates with drop shadows + corner rivets + lit-neon boxes (no per-frame glyph walking; Naganoshi/Latin handling preserved).
- All verified: `tsc`/`npm test` (113)/`build` clean + playtest screenshots. Built partly via parallel worktree subagents (cat, signs) cherry-picked in.

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
- [x] **Follow-up fixes**: greenhouse moved out of the shrine → into the **city** (east of home); museum entrance warp fixed (was on a solid facade row — couldn't walk in); **fishing reverted to the old catch-zone minigame** (overhauled stamina/tension version scrapped) + first-cast HOW TO FISH explainer; Genji's rod now just biases rare-fish bites (no minigame change).
- [x] **Shore foraging** — ungated early-game money: 4-6 daily seeded beach finds (`FORAGE`/`shoreForageFor`, `save.forageDay`/`foragedSpots`), walk+E for instant cash, first-pickup how-to, Journal nudge while broke. Day 1, no gate.
- [x] **Odd-jobs board** (phase 2) — notice board in the city by home; one seeded fetch errand/day (`ERRANDS`/`errandFor`, `save.errandDay`), deliver a held item (soda/fish/coconut) for a premium fee. Synergy: forage → buy cheap soda → deliver → profit. Journal lists the job.
- [x] **Konbini shift minigame** — "Register Rush": replaces the time-skip with a SCAN→BAG→CHANGE QTE over 6 customers; combo tips, fumble loses the tip, pay capped ~¥2400 (`shiftRef`, module model in the component).
- [x] **Polish**: museum moved from the ugly bottom-left block to a proper far-right Downtown storefront (dark facade + gold marquee, walk-up door; badtown widened to 38 cols); odd-jobs board grass base added (killed the black-edge tile).
- [x] **Greenhouse rework + polish pass**: one Granny Soto (wanders the city, gives the greenhouse via a fish errand with a **GIVE/KEEP prompt**); greenhouse is a gated **walk-in** (no E), how-to poster inside, no signs; errands gated to reachable items + a give-prompt (quest items are never auto-taken); shore finds now bob + sparkle so they're obviously grabbable; dialogue types with a faint click-clack (`sfxType`); shrine sign removed (just "Shrine"), miko named **Yoshi**, lanterns softly glow at night; README refreshed + hero screenshots regenerated.
- [x] **Done since**: museum collectibles now LIVE (12, earned multiple ways); greenhouse 2.0 added many crops (`CROPS`); portraits added for Genji/Manager/Jean-Pierre/Yoshi/David/Charlie. Still open → more shift-minigame variety (moved to [kb/future-ideas.md](future-ideas.md)).

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
- [x] Badtown has its own theme (`badside.mp3`); gacha its own track.
- [ ] Real-device touch pass (D-pad rendered on coarse pointers; desktop-verified only)
- [ ] Cosmetic: city path north of apartment building dead-ends

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
## 2026-07-01 — Fable 5 playtester passes (on `DEV`)
Two large batches (see kb/games.md "Recent changes" for full detail):
- **Batch 1** (`cb79156`): David cat anim pass, t-tree/beachrock/cave-exit redraws, city torii garden (sando/toro/sakura/koi pond), greenhouse decor pass, club beat-sync + delivery-race juice (subagent), meteor-glow perf fix, 9 dead exports + nakatomi tiles removed, `checkup` harness command + seacave preset (smoke 20/20) + calendar tests + kb/bug-hunting.md.
- **Batch 2** (uncommitted → this commit): David full REdesign (chunky), pawn-facade legend-collision fix, seacave single-slit exit, island-sign/terminal bg fixes, onsen l/r pool, greenhouse back wall, blackjack table redraw, casino patrons/glows/ambience (subagent), cat pet/gift/nap-spots + journal missions + save codes (title MANAGE SAVE) + weather fish + toro night glow (subagent), wooden signpost wayfinding + shrine sign removed, sign blink darkens (not transparent), morning message buzz, holistic systems audit (no soft-locks; quirk list in games.md). Tests 206, checkup 12/12.
