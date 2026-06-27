# Future ideas

Parking lot for features considered but not yet built. Each notes *why it fits*,
*what it hooks into*, and a rough effort. Read [games.md](games.md) for the
as-built systems these would extend. (Built already, don't re-propose: Cooking,
NPC friendship + gifting, wall/floor/rug decorating, home trophy shelf, ambient
soundscapes, **skill levels** (fish/mine/farm), **home jukebox** (gated behind a
DJ Tanuki purchase), **bigger apartment** upgrade, live **museum collectibles**;
**[2026-06-27]** endless game (no ending), **Fishopedia** collection log,
**friendship-deepens** heart-tiered dialogue + all-met capstone, **weather variety**
(fog + meteor-shower nights), **hidden secrets** (island sea cave / city rooftop /
midnight stranger / shore stargazing), **random daily street events** — see games.md.)

## Strong candidates

### Seasons / calendar 🍂 — *high effort*
Spring/Summer/Autumn/Winter on a rotating day count. Frames everything else:
season-tinted day washes (reuse the cached `nightT`/`morningT` gradient system),
season-gated crops (`CROPS` already has `tier`; add `season`), season weather odds
(`isRainyDay` → snow in winter), and per-season festivals (one `dayEventFor`
variant each). Biggest cohesion win; touches greenhouse, weather, day events.

### More shift-minigame variety 🏪 — *low-medium*
The konbini "Register Rush" QTE (`shiftRef`, `makeShiftGame`) is the only job
minigame. Add customer types / a second venue shift (café, greenhouse stall) so the
income loop isn't one rhythm. Data-driven off the existing shift model.

## Smaller charm
- **Phone "Map" / fast-travel app** 🗺️ — *low-medium*. With 19 scenes the cross-map
  walk is the main friction in long sessions (surfaced in the 2026-06-27 playtest sweep).
  Add a Map app to the phone home grid (alongside Bag/Messages/…): a list/grid of
  **visited** outdoor hubs (`save.visited`) that warps there via the existing
  `runTransition`/`begin()` path. Gate it behind a cheap unlock (a bus pass, or always-on)
  and only allow travel from/to outdoor scenes so it can't skip gated content. Reuses
  the `PhoneApp` tab system + `SCENE_MUSIC`/scene-warp — no new systems.
- **Pet variety** — more strays beyond David the cat (a shore dog, a shrine fox);
  each a `catRef`-style roamer with its own lines. Reuses the cat entity system.
- **Physical mail** — letters in a home mailbox alongside phone texts; some quests
  arrive by post. Reuses the `letter` overlay + `messages` catalog pattern.
- **More achievements** — cooking/friendship/decor milestones for the `gameAch`
  system (e.g. "first 10♥", "fully restyled room", "cooked every recipe").
- **Photo / memory mode** — snapshot the decorated room to a phone "gallery".

## Research: removing the Gemini/Imagen watermark from `public/images/` (2026-06-25)
The `public/images/portraits/*.jpeg` (all 1024², EXIF `software=Picasa`) + `title-bg.png`
are the likely AI-generated assets; the PNG logos and `granny-soto.png` (256² pixel art)
probably are not — **confirm by eye**. Two separate watermarks:
- **Visible corner "sparkle"** (free/AI-Pro Gemini exports): removable + batchable —
  best via **IOPaint/LaMa** inpaint with one corner mask (portraits share 1024² so one
  mask covers all); `ffmpeg delogo` or a corner crop are cruder and risky on faces/pixel art.
- **SynthID** (invisible, embedded across all pixels): **not reliably removable** — built
  to survive crop/compress/filter/reformat; no official tool; "remover" sites are marketing
  and only ~15–30% effective with image-quality cost. Stripping it trashes the art.
- **ToS caveat**: removing provenance marks may breach Google's terms — flagged, not advised.
- **Recommendation**: don't build an auto-stripper for ~8 files. **Regenerate watermark-free**
  via the Gemini/Imagen **API** (outputs carry SynthID but **no visible sparkle**), or
  **replace with in-code/commissioned art** (sidesteps ToS + matches the project's in-code style).
