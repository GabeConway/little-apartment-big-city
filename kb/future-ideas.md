# kb/future-ideas.md — parked work & ideas backlog

Parked when the 2026-07-01 session was stopped. Check kb/games.md before picking
one up — some may be partially done or superseded.

## Queued next (was about to be built)
(Both items built 2026-07-01: Messages inbox grouped by sender, RUMORS mix in
`GOSSIP` NPC lines — see kb/games.md.)

## Boss duel + poker (APPROVED 2026-07-02, next up)
- **Boss duel = BLACKJACK, once/day** at the backroom `backroom-table` (replace the
  plain `startBlackjack()` call): fixed high stake (~¥10k double-or-nothing, may
  scale with `save.casinoWins`), one hand per day, then the table closes ("he
  finishes his tea") until tomorrow.
- **House rule of the day** (seeded per day, shown on a placard line): e.g.
  blackjack pays 2:1 / dealer hits soft 17 / your hole card peeks, etc.
- **He talks during the hand**: line on deal, on your hit, on the hole-card flip;
  gracious loss line exactly once, quieter each later loss.
- **Poker on the MAIN casino floor** as a 4th game (owner is lukewarm on poker —
  keep it simple, e.g. solo 5-card-draw video-poker vs a pay table; NOT the boss game).
- Later maybe: head-to-head ledger + milestone comps (see comp-tiers item below).

## Casino backlog (brainstormed, approved-ish, unbuilt)
- Chinchirorin dice cup (3 dice in a bowl, triples/pairs) as a 4th game.
- Daily high-roller table: one ¥10k double-or-nothing hand vs the boss, seeded/day.
  (The boss + his private table now EXIST — the `backroom` scene; this would hang off him.)
- Comp tiers off lifetime wagered (`save.casinoWagered`): free bar soda, a
  members-only accessory, gold card in the phone.
- "Kinryū Credit" flavor texts on big losses (atmosphere only, no debt).

(Built 2026-07-02: **hidden backroom** after 15 total wins (`backroom` scene,
`save.casinoWins`, `inner-circle` ach) and the **progressive slots jackpot**
(`jackpotFor`, `save.jackpotDay`, bulletin heralds, `jackpot` ach) — see kb/games.md.)

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

## Audit leftovers (accepted, watch)
- Max-luck seacave sift: 37% daily Astral Stone at caveLuck 5.
