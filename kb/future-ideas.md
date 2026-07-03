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

## Audit leftovers (accepted, watch)
- Max-luck seacave sift: 37% daily Astral Stone at caveLuck 5.

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
