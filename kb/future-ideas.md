# Future ideas

Parking lot for features considered but not yet built. Each notes *why it fits*,
*what it hooks into*, and a rough effort. Read [games.md](games.md) for the
as-built systems these would extend. (Built already: Cooking, NPC friendship +
gifting, wall/floor/rug decorating, home trophy shelf, ambient soundscapes —
see games.md.)

## Strong candidates

### Seasons / calendar 🍂 — *high effort*
Spring/Summer/Autumn/Winter on a rotating day count. Frames everything else:
season-tinted day washes (reuse the cached `nightT`/`morningT` gradient system),
season-gated crops (`CROPS` already has `tier`; add `season`), season weather odds
(`isRainyDay` → snow in winter), and per-season festivals (one `dayEventFor`
variant each). Biggest cohesion win; touches greenhouse, weather, day events.

### Skill levels (fish / mine / farm) 📈 — *medium*
XP per gathering action → levels → perks (bigger catches, cheaper pickaxe swings,
better crop quality, wider forage). Data-driven: `save.skills: {fish,mine,farm}` +
a `SKILL_PERKS` table read where the rolls happen (`mineLayoutFor`, fishing bite,
`harvestCrop`, `shoreForageFor`). Pure RPG retention; surface in a phone app tab.

### Home jukebox 🎵 — *low*
Play any unlocked scene track at the apartment. The crossfade audio engine
(`playMusicFor`/`SCENE_MUSIC`) already exists — add a placed "stereo" furniture or
a phone "Music" app that overrides the apartment track from `save.visited` scenes.
Nearly free, very cozy.

### Bigger apartment upgrade 🏠 — *medium*
Pay the landlord to unlock a wider floor / second room. The room is a tight 8×8 —
more decorating canvas (now that furniture + wall/floor/rug decor shipped). Needs a
second apartment `SceneDef` (or a grown grid) + a migration for placed-furniture
coords. Pairs naturally with the decor system.

## Smaller charm
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
