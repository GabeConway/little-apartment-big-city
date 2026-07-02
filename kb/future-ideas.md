# kb/future-ideas.md — parked work & ideas backlog

Parked when the 2026-07-01 session was stopped. Check kb/games.md before picking
one up — some may be partially done or superseded.

## Queued next (was about to be built)
(Both items built 2026-07-01: Messages inbox grouped by sender, RUMORS mix in
`GOSSIP` NPC lines — see kb/games.md.)

## Boss duel + poker (APPROVED 2026-07-02 — BUILT 2026-07-02, see kb/games.md)
(All shipped: boss-duel blackjack once/night w/ daily house-rule placard + boss
table-talk, Jacks-or-Better video poker on the main floor, PLUS same-session
additions: `BACKROOM_WINS` 15→30, a visible doorman gating the curtain, and the
backroom VIP re-dress w/ the gold-dragon mural.)
- Later maybe: head-to-head ledger vs the boss + milestone comps (see comp-tiers below).

## Casino backlog (brainstormed, approved-ish, unbuilt)
- Chinchirorin dice cup (3 dice in a bowl, triples/pairs) as a 5th floor game.
- ~~Daily high-roller table: one ¥10k double-or-nothing hand vs the boss, seeded/day.~~
  (BUILT 2026-07-02 as the boss duel — see above.)
- Comp tiers off lifetime wagered (`save.casinoWagered`): free bar soda, a
  members-only accessory, gold card in the phone.
- "Kinryū Credit" flavor texts on big losses (atmosphere only, no debt).

(Built 2026-07-02: **hidden backroom** after 15 total wins (raised to 30 later that day) (`backroom` scene,
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
