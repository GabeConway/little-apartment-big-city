# kb/future-ideas.md — parked work & ideas backlog

Parked when the 2026-07-01 session was stopped. Check kb/games.md before picking
one up — some may be partially done or superseded.

## Queued next (was about to be built)
- **Bulletin messages → one conversation**: the phone Messages app treats every
  message id as its own thread (`ov.thread` = message id; thread view renders one
  message, `LittleApartmentGame.tsx` ~7982). Regroup the inbox by SENDER: one
  "Kawamachi Bulletin 📣" thread holding all heralds, ditto Genji/ZamaZonk.
  NOTE: the landlord thread now carries reply-chip actions (lease-office move) —
  grouping must keep those chips on his conversation.
- **RUMORS could mix in NPC gossip** (they rotate day-seeded now but only ever
  show locked-achievement hints).

## Casino backlog (brainstormed, approved-ish, unbuilt)
- Chinchirorin dice cup (3 dice in a bowl, triples/pairs) as a 4th game.
- Daily high-roller table: one ¥10k double-or-nothing hand vs the boss, seeded/day.
- Comp tiers off lifetime wagered (`save.casinoWagered`): free bar soda, a
  members-only accessory, gold card in the phone.
- Hidden backroom after N total wins (mini-scene off the casino) + achievement.
- "Kinryū Credit" flavor texts on big losses (atmosphere only, no debt).
- Progressive slots jackpot counter (seeded growth, bulletin mentions).

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
