# kb/future-ideas.md — parked work & ideas backlog

Check kb/games.md before picking anything up — some may be partially done or superseded.

## Casino backlog (ranked 2026-07-02 with the owner; unbuilt)
The whole 2026-07-02 casino wave is DONE (jackpot, backroom @30 wins, doorman,
boss duel w/ house rules, video poker, Shinzo Towzawa rival buildout + ledger
talk + first-loss taunt text, tea-ceremony capstone → `hanafuda` keepsake).
See kb/games.md Casino section + the four 07-02 "Recent changes" batches. Left:
- **Comp tiers** off lifetime wagered (new `save.casinoWagered` field): free
  lounge tea/soda → members-only accessory (visible on player) → gold card in
  the phone. Silver-lining for losing; fits the luxury-sink economy. (Owner
  ranked this #2 of the brainstorm.)
- **Chinchirorin dice cup** as a 5th floor game (3 dice in a bowl,
  triples/pairs/4-5-6 — most yakuza-authentic game there is). (Ranked #3.)
- **Placard mastery achievement** — win the boss duel under all 5 house rules
  ("Read the Placard"). Pure data + a per-rule-won tracking field.
- **"Kinryū Credit" flavor texts** on big losses (atmosphere only, no debt);
  pairs with the existing `towzawa-first-loss` taunt text.
- **Patrons react to you** — gambler brush-off lines vary after you've hit the
  jackpot / entered the backroom ("that's the one the curtain opens for").
- Skip (owner-aligned 2026-07-02): shrine-luck affecting casino odds, and any
  chips/second-currency indirection.

## Smaller parked ideas
- Aquarium renders tiny sprites of fish you've actually caught (`save.fishLog`).
- 2×2 tree "grove" tile-set for denser borders (round t-tree reads well solo).
- Mid-game journal mission chain (toll → Doofert → wand → floor 5) — discussed,
  never spec'd.

## Unresolved bug report
- **"Press E to talk to a sign"** — never reproduced at the guide signs. Best
  theory: granny ambling behind the city festival nobori put an NPC Talk prompt
  on it; the festival-strip relocation + wanderer pause-and-face likely killed
  it. If it recurs: get WHERE + time of day ('Talk' only comes from an NPC on
  the faced tile).

## Known bugs — found by code review 2026-09-11, each verified in code, all UNFIXED
Found during the go-public audit. These are confirmed defects, not ideas: every one
was traced through the source before being written down. Ordered worst first. They
predate the audit and are live in v1.1.1.

1. **Bailing a slots/roulette spin eats the stake.** `spinSlots`
   (LittleApartmentGame.tsx:7465) debits `s.money -= slot.bet` at :7469 and fixes the
   outcome in `slot.final` at :7471. If the player closes the overlay before the reels
   land, the `[overlay]` effect at :1561 clears the interval **and sets
   `slot.phase = 'idle'`**. The `settleSlots(true)` guard that exists for exactly this
   case is only called from `startSlots` (:2792) — i.e. the *next* time the machine is
   opened — and bails immediately at `if (slot.phase !== 'spin') return;` (:7443),
   because the effect already flipped the phase. Net: stake gone, `slot.final`
   discarded, nothing ever paid. A 7-7-7 plus the whole progressive jackpot can vanish.
   `settleRoulette` has the identical shape (:7511/:7514, called from :2799).
   *Fix:* settle inside the `[overlay]` effect, or stop resetting `phase` there.

2. **Leaving the shore locks in the derby prize for the rest of the day.**
   `enterScene` calls `settleDerby` on any exit from `TOURNAMENT_SCENE`
   (LittleApartmentGame.tsx:2089). `settleDerbyPrize` (state.ts:1659) stamps
   `storySeen['tournament-prize-<day>']` on the first settle and returns `null`
   forever after. But `derbyScoreRef` keeps accumulating all day (only reset when
   `derbyDayRef.current !== s.day`), and the derby banner + chalkboard keep
   advertising the rising tally and the next tier. *Repro:* catch one minnow (~8 pts,
   Bronze ¥200 paid), walk to the city for bait, come back and grind to 600 pts —
   Grand Marlin is displayed, ¥2,200 is never paid.
   *Fix:* let a later, higher tier top up the difference, or don't settle until the
   day actually ends.

3. **Home onsen is placed on the fridge's tile.** `HOME_ONSEN_TILE = { x: 13, y: 1 }`
   (LittleApartmentGame.tsx:41); `maps.ts:67` has
   `{ itemId: 'fridge', x: 13, y: 1, w: 1, h: 1, solid: true }`. The comment above the
   constant claims the tile is clear of the futon, maneki and trophy shelf — it does
   not account for the row-1 appliance slots. `mergeSave` (state.ts:354) auto-places
   owned items at those slots for v1 saves, so a migrated save with a fridge that buys
   the onsen gets both sprites on one solid tile, with the `home-onsen` interactable
   sitting on the fridge. The `occ` guard at :8410 only blocks *future* placement.

4. **The ¥9,000 City Bicycle does nothing.** `'bicycle'` appears exactly once in the
   whole game — its own definition at data.ts:152. `s.vehicles` is only ever read for
   `'car'` (driving, `carPos`, Kojima) and `'boat'` (deep-sea/island access, coconut
   errand gating). No movement-speed effect, no scene access, and it's explicitly
   excluded from the vehicle achievement. *Fix:* wire it to player speed, or drop it
   from `VEHICLES`.

5. **The "fully furnished" window line is unreachable.** LittleApartmentGame.tsx:3554
   still tests `n < FURNITURE.length`, which became 24 when the 14 `optional: true`
   decor pieces were appended to `FURNITURE`. Every other consumer was updated to
   filter first — `allFurnished` (state.ts:832) and `coreFurniture` (:9023) both use
   `FURNITURE.filter(f => !f.optional)`. So a player who furnishes the core set never
   sees the payoff line. *Fix:* filter `!f.optional` here too.

Two more findings from the same review are already resolved, recorded so they aren't
re-reported: the `useUiNav` key-auto-repeat hole (holding Space on the title walked
focus onto DELETE SAVE and confirmed it) and the `gemini-portraits.mjs` roster pointing
at the deleted `granny-soto.png` — both fixed in the 2026-09-11 public-prep commit. A
sixth claim, that the tea blurb's "Pricey to start" contradicts its price, is **not a
bug**: at ¥350 tea is the second-most-expensive seed (melon 400 > tea 350 > chili 160 >
tomato 140 > sunflower 80).

## Audit leftovers (accepted, watch)
- Max-luck seacave sift: 37% daily Astral Stone at caveLuck 5.
- **Accepted naming/IP risks** (go-public audit 2026-09-11 — all judged fine to ship,
  listed so the reasoning isn't re-derived, and because they'd matter more if the game
  is ever *sold* rather than given away):
  - **"Backrooms"** (52 refs) — creepypasta origin, contested trademark filings exist.
    Ubiquitous in indie games, but it's the one name most likely to draw a letter on a
    commercial storefront. Renaming is cheap now, expensive after a store page exists.
  - **ZamaZonk** — the arrow curves under the wordmark the way Amazon's does. The
    closest thing in the game to real trade dress; changing the arc de-risks it.
  - Other parody brands are standard practice and low risk: Bepsi, Diet Doctor Peepis,
    Doki Doki Discount, NAKATOMI (Die Hard wink).
  - **Name collisions, no legal issue**: the miko is named **Yoshi** and the mechanic
    **Kojima**. Both are real Japanese names; both read as jokes the game isn't making.
- **Cleared, no action** (same audit): the Shinto content is accurate and respectful
  (etiquette, omikuji, tanzaku, komainu, temizuya, saisen-bako, shimenawa; Yoshi is
  dignified and not sexualized); no slurs, sexual content or drug references anywhere
  in the script; the yakuza toll-gate is genre-standard. Jean-Pierre's phonetic
  `ze/zis/wizout` respelling was removed in the same pass — his French now reads
  through vocabulary and syntax, with the beret, breton stripes and baguette intact.
- **Dev-dependency CVEs**: `npm audit` reports 0 production vulns and ~9 dev-only
  (vitest/vite/postcss/esbuild/browserslist). None ship in the game binary. Dependabot
  (`.github/dependabot.yml`, monthly, grouped, targets DEV) now files these, so don't
  hand-patch them.

## The Hacker (fourth-wall character) — owner idea 2026-07-02
A character who can "hack" the actual game and is aware of the USER playing it
(not just the player-character). Cozy-creepy, not hostile.
- **Fiction hooks already shipped**: the ZamaZonk VOID-KERNEL terminal + "LOADING
  PARIS.EXE" hack transition and the `parisGlitchRef` datamosh materialize
  already establish the game-as-software; the Hacker walks in through that door.
- **Beats**: an unknown-sender phone thread that knows things only the SYSTEM
  could (the real day of week, that you used `motherlode`, session count); HUD
  text he briefly "edits" mid-conversation; a scanline-flickering NPC glimpsed
  in the backrooms/paris; a one-time fake "SAVE CORRUPTED" scare (cosmetic,
  resolves as his prank).
- **Guardrails**: NEVER touches the real save, no real crashes, no strobe;
  addresses `{name}` and, rarely, "the one holding the controller".
- **Endgame arc (owner spec 2026-07-02)**: the Hacker only texts you at true
  completion — everything done (all achievements / museum / keepsakes /
  friends, exact gate TBD). He asks to meet at the GACHA hall. On the meeting
  he "hacks" the gacha hall and it becomes a PERMANENT new store with NO NAME —
  a distortion in spacetime the Hacker runs. It still sells gacha, but stocks
  all kinds of crazy reality-bending stuff for the game on top. (Doc only —
  not building yet.)

---

# Sound-effects wishlist

What to download (or make) and **exactly where it plays in the game**. Drop new
files in **`public/sfx/`** as `.mp3`, then tell me the filename and I'll wire it
to the cue. **Keep them short** (≈0.1–1.5 s) and **metadata-strip** them
(`ffmpeg -i in.mp3 -map 0:a -map_metadata -1 out.mp3`) — same rule as the music.

Cozy pixel life-sim vibe: warm, soft, a little retro/chiptune-adjacent. Not harsh,
not hyper-realistic. Mute is global (music + sfx).

---

### ✅ Already in the game (no download needed)
Sampled mp3s in `public/sfx/`: `achievement-unlocked`, `backrooms-teleport`
(freezer warp), `game-start`, `phone-notification`, `ui-click` (menu/button click),
`level-up` (skill level-up), **`coin`** (earnings), **`buy`** (purchases),
**`casino-win`** (blackjack/slots/roulette win), **`heart-up`** (a friendship heart
rises), **`car-start`** (boarding the kei car). The rest below are still synthesized
WebAudio blips — fine, but a real sample would feel nicer.

---

### ⭐ High value — most-heard cues (upgrade these first)
These fire constantly; a good sample lifts the whole game.

| Suggested file | Plays when… | Wanted character |
|---|---|---|
| `catch.mp3` | you land a fish, shake a coconut/banana, adopt the cat, pick up an item | happy little "got it!" chime |
| `fish-bite.mp3` | the bobber dips during fishing (the moment to reel) | a sharp "plip"/tug, attention-grabbing |
| `fish-miss.mp3` | a cast fails / the fish gets away | soft downward "aw" tone, not punishing |
| `dialogue-blip.mp3` | per-character typewriter text reveal (very frequent, very quiet) | ultra-short soft click; **must be subtle** |

### 🍳 Activities & life-sim
| Suggested file | Plays when… | Wanted character |
|---|---|---|
| `water.mp3` | watering a greenhouse crop | soft watering-can splash |
| `plant.mp3` | planting a seed | gentle "press into soil" pat |
| `harvest.mp3` | harvesting a crop | a satisfying "pop"/pluck |
| `cook.mp3` | cooking a dish at home | a quick sizzle/ding |
| `eat.mp3` | eating a dish / drinking a soda for energy | soft munch or fizzy gulp |
| `gift.mp3` | giving a friend a gift they like | warm twinkle |
| `sleep.mp3` | going to bed / fading to the next day | slow soft "whoosh"/yawn |

### ⛏️ Mining & combat
| Suggested file | Plays when… | Wanted character |
|---|---|---|
| `pickaxe-hit.mp3` | striking ore (pitch already scales with ore value via blips) | dull rock "tink"/crack |
| `ore-break.mp3` | an ore node finally breaks | crumble + small sparkle |
| `geode-crack.mp3` | cracking a geode at the Manager | a meaty crack + reveal shimmer |
| `treasure-vault.mp3` | **NEW** — opening the rare mine Treasure Vault chest | a big celebratory fanfare/sparkle (this is a jackpot moment) |
| `wand-zap.mp3` | firing the wand at a crawler | soft magic "pew", not aggressive |
| `gun-shot.mp3` | firing the AK-67 (full-auto; currently a low blip) | punchy but small, retro |
| `crawler-hit.mp3` | a crawler takes damage / dies | squishy "blip"/splat |
| `descend.mp3` | taking the ladder down a mine floor | short descending two-tone |

### 🌊 Ambient one-shots (short only — no long beds!)
The long droning ambient bed was removed on purpose. These are the **short**
accents that remain; real samples would be lovely.
| Suggested file | Plays when… | Wanted character |
|---|---|---|
| `gull.mp3` | occasionally on the shore / island | one or two distant gull caws |
| `drip.mp3` | occasionally in the mines / backrooms | a single echoey water drip |

### ✨ Moments & discovery (NEW features, currently silent or generic)
| Suggested file | Plays when… | Wanted character |
|---|---|---|
| `onsen.mp3` | sinking into the island hot spring | a relaxed "ahh"/soft bubbling |
| `wish.mp3` | making a wish during a meteor-shower night | a magical twinkle/sparkle |
| `secret.mp3` | finding a hidden secret (sea cave, midnight stranger, stargazing, bottle) | a soft "ooh, discovery" chime |
| `casino-lose.mp3` | losing a casino bet | a soft "no luck" tone (gentle) |
| `gacha.mp3` | a gachapon capsule pops open | a mechanical crank + capsule rattle |
| `warp.mp3` | a normal door/scene transition (non-freezer) | a quiet "step through" whoosh |

---

### Notes
- **Priority:** the ⭐ section first (those play hundreds of times a session).
  `treasure-vault`, `wish`, and `secret` are the highest-impact *new-feature*
  cues if you want the recent additions to feel special.
- Filenames above are suggestions — name them whatever; just send me the list and
  I'll map each to its cue (replacing the current blip or adding it fresh).
- Free sources that fit the vibe: **Kenney.nl** (CC0 game SFX packs),
  **freesound.org** (check the license), or **sfxr/jsfxr/Bfxr** to *make* chiptune
  blips. Keep them quiet and warm.
