# Future ideas

Parking lot for features considered but not yet built. Each notes *why it fits*,
*what it hooks into*, and a rough effort. Read [games.md](games.md) for the
as-built systems these would extend. (Built already: Cooking, NPC friendship +
gifting, wall/floor/rug decorating — see games.md.)

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
- **Home trophy shelf** — display gacha dupes / museum-adjacent curios at home
  (a placed shelf that renders owned `gacha` figures). Reuses `SpriteIcon` draw.
- **Pet variety** — more strays beyond David the cat (a shore dog, a shrine fox);
  each a `catRef`-style roamer with its own lines. Reuses the cat entity system.
- **Physical mail** — letters in a home mailbox alongside phone texts; some quests
  arrive by post. Reuses the `letter` overlay + `messages` catalog pattern.
- **Ambient SFX** — rain-on-glass at home during rain, mine drips, shore gulls,
  café murmur. Reuses `playSfx` + the per-scene/weather hooks.
- **More achievements** — cooking/friendship/decor milestones for the `gameAch`
  system (e.g. "first 10♥", "fully restyled room", "cooked every recipe").
- **Photo / memory mode** — snapshot the decorated room to a phone "gallery".
