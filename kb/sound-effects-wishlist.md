# Sound-Effects Wishlist — *Little Apartment, Big City*

What to download (or make) and **exactly where it plays in the game**. Drop new
files in **`public/sfx/`** as `.mp3`, then tell me the filename and I'll wire it
to the cue. **Keep them short** (≈0.1–1.5 s) and **metadata-strip** them
(`ffmpeg -i in.mp3 -map 0:a -map_metadata -1 out.mp3`) — same rule as the music.

Cozy pixel life-sim vibe: warm, soft, a little retro/chiptune-adjacent. Not harsh,
not hyper-realistic. Mute is global (music + sfx).

---

## ✅ Already in the game (no download needed)
Sampled mp3s in `public/sfx/`: `achievement-unlocked`, `backrooms-teleport`
(freezer warp), `game-start`, `phone-notification`, `ui-click` (menu/button click),
`level-up` (skill level-up), **`coin`** (earnings), **`buy`** (purchases),
**`casino-win`** (blackjack/slots/roulette win), **`heart-up`** (a friendship heart
rises), **`car-start`** (boarding the kei car). The rest below are still synthesized
WebAudio blips — fine, but a real sample would feel nicer.

---

## ⭐ High value — most-heard cues (upgrade these first)
These fire constantly; a good sample lifts the whole game.

| Suggested file | Plays when… | Wanted character |
|---|---|---|
| `catch.mp3` | you land a fish, shake a coconut/banana, adopt the cat, pick up an item | happy little "got it!" chime |
| `fish-bite.mp3` | the bobber dips during fishing (the moment to reel) | a sharp "plip"/tug, attention-grabbing |
| `fish-miss.mp3` | a cast fails / the fish gets away | soft downward "aw" tone, not punishing |
| `dialogue-blip.mp3` | per-character typewriter text reveal (very frequent, very quiet) | ultra-short soft click; **must be subtle** |

## 🍳 Activities & life-sim
| Suggested file | Plays when… | Wanted character |
|---|---|---|
| `water.mp3` | watering a greenhouse crop | soft watering-can splash |
| `plant.mp3` | planting a seed | gentle "press into soil" pat |
| `harvest.mp3` | harvesting a crop | a satisfying "pop"/pluck |
| `cook.mp3` | cooking a dish at home | a quick sizzle/ding |
| `eat.mp3` | eating a dish / drinking a soda for energy | soft munch or fizzy gulp |
| `gift.mp3` | giving a friend a gift they like | warm twinkle |
| `sleep.mp3` | going to bed / fading to the next day | slow soft "whoosh"/yawn |

## ⛏️ Mining & combat
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

## 🌊 Ambient one-shots (short only — no long beds!)
The long droning ambient bed was removed on purpose. These are the **short**
accents that remain; real samples would be lovely.
| Suggested file | Plays when… | Wanted character |
|---|---|---|
| `gull.mp3` | occasionally on the shore / island | one or two distant gull caws |
| `drip.mp3` | occasionally in the mines / backrooms | a single echoey water drip |

## ✨ Moments & discovery (NEW features, currently silent or generic)
| Suggested file | Plays when… | Wanted character |
|---|---|---|
| `onsen.mp3` | sinking into the island hot spring | a relaxed "ahh"/soft bubbling |
| `wish.mp3` | making a wish during a meteor-shower night | a magical twinkle/sparkle |
| `secret.mp3` | finding a hidden secret (sea cave, midnight stranger, stargazing, bottle) | a soft "ooh, discovery" chime |
| `casino-lose.mp3` | losing a casino bet | a soft "no luck" tone (gentle) |
| `gacha.mp3` | a gachapon capsule pops open | a mechanical crank + capsule rattle |
| `warp.mp3` | a normal door/scene transition (non-freezer) | a quiet "step through" whoosh |

---

## Notes
- **Priority:** the ⭐ section first (those play hundreds of times a session).
  `treasure-vault`, `wish`, and `secret` are the highest-impact *new-feature*
  cues if you want the recent additions to feel special.
- Filenames above are suggestions — name them whatever; just send me the list and
  I'll map each to its cue (replacing the current blip or adding it fresh).
- Free sources that fit the vibe: **Kenney.nl** (CC0 game SFX packs),
  **freesound.org** (check the license), or **sfxr/jsfxr/Bfxr** to *make* chiptune
  blips. Keep them quiet and warm.
