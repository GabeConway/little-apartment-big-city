# kb/bug-hunting.md — agent playtesting playbook

How an agent (Claude/Opus session) hunts bugs in *Little Apartment, Big City*
without a human at the keyboard. Read [playtesting.md](playtesting.md) first for
harness mechanics; this file is the **strategy** on top.

## The 3-command health check (run before AND after any change)

```bash
npx tsc --noEmit && npm test          # types + 200-ish unit tests
npm run playtest -- smoke --wait 450  # all 22 scenes render without errors
npm run playtest -- checkup           # end-to-end mechanics battery (scripts/checkups.mjs)
```

All three are exit-code checkable. If any fails after your change, the change did it.

## Layered testing — put each bug guard at the right layer

1. **Vitest (`tests/*.test.ts`)** — pure logic in `state.ts`/`data.ts`/`engine.ts`/
   `fishing.ts`: math, daily seeds, save migration, calendars. Deterministic; assert
   exact values. Cheapest layer — prefer it whenever the logic is importable.
2. **`checkup`** — one named row per *wired* mechanic (UI → state): phone apps open,
   orders debit money, warps warp, collapse fires. Add a row to
   `scripts/checkups.mjs` when you fix a wiring bug so it stays fixed. Rows drive
   real keyboard/DOM-click input and assert on the live snapshot.
3. **`smoke`** — every scene renders. Catches draw-loop crashes, bad atlas keys,
   broken map legends. Extend automatically by adding new scenes to `SCENE_SPAWN`.
4. **Screenshots** (`shot --save <scene>`) — visual-only issues (sprite art, layout,
   lighting). The only layer needing eyes; capture at `--scale 3` for detail.

## Seeding tricks that unlock most tests

- Any save field can be seeded: `--save '{"scene":"mines","day":7,"money":0,...}'`
  is merged over `newSave()`. Gated content just needs its flag
  (`backroomsUnlocked`, `gangPaid`, `parisRevealed`, `zamazonkApp`, `canFish`,
  `vehicles:['boat']`, `cat:{found:true}` …).
- **Daily systems key off `day`** — festivals fire on multiples of 14
  (14=matsuri, 28=tanabata, 42=hatsumode), the fishing derby on days ≡5 (mod 10),
  pawn stock / mine layout / store sick-days / street events reseed per day.
  Seed the exact `day` to reproduce any daily roll.
- **Clock**: seed `timeMin` (minutes since 0:00; wake 420, night ramp from 1020,
  collapse at 1560). `timeMin:1556` + a few real seconds = collapse test.
  `TIME_RATE` is 3.5 game-min per real second.
- Money/energy edge cases: seed `money:0`, `energy:1` and try to spend.

## Known blind spots (can't be driven by the harness)

- **Arrange mode** — canvas pointer-drags; its DOM chips aren't `<button>`s.
  Verify data-side with unit tests (`placeableAt`, `rugPlaceableAt`), art-side
  with a `--full` screenshot.
- **Ref-mode minigames** (shift QTE, delivery drive, karaoke, fishing reel) —
  partially exposed via snapshot (`drive`, `karaoke` blocks) but timing-based
  play-through is flaky; assert the *entry* (ref becomes active) and the pure
  payout helpers in Vitest instead.
- **Audio** — mute flags are in save/localStorage but sound itself is unverifiable.
- **Gamepad** — `pollGamepad` needs a real pad; keyboard path shares the code.

## Fragile areas — check these first when something breaks

- **`LittleApartmentGame.tsx` draw loop** — per-frame allocations are the classic
  regression: `createRadialGradient`/`measureText`/canvas font-switching in the
  loop is BANNED (cache like `glowSpriteRef`/`skyGradRef`/`signSpriteRef`).
- **Save shape changes** — every new field must be default-safe through the
  `loadSave` merge; add a `tests/save-migration.test.ts` case (v1 saves + missing
  fields must still load).
- **Daily seeds** — `mulberry32(day*K)` collisions: two systems using the same
  multiplier roll identically. Grep the multiplier constant before adding one.
- **Warps** — new scenes need ≥2-tile doors, warp cooldown, and arrival tiles
  that don't sit on a return warp (bounce-back).
- **Overlay input** — a story letter/dialog on arrival eats movement; harness
  auto-dismisses, players don't. If input "dies", check `overlay` in the snapshot.

## When you find a bug

1. Reproduce with the smallest `--save`+`--keys`+`--assert` one-liner.
2. Fix it.
3. Encode the repro as a Vitest case (pure) or a `checkups.mjs` row (wired).
4. Re-run the 3-command health check.
