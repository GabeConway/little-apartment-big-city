# kb/testing.md — test framework

**Vitest** unit tests for the game's pure logic. No DOM/React in scope, so tests
run in the plain `node` environment (`vitest.config.ts`).

## Layout
- `tests/*.test.ts` — test files (import from `../src/game/...`). Kept **outside
  `src/game/`** so the shipping game stays React-only (the invariant); test files
  never enter the Vite bundle (bundling is entry-driven, not include-driven).
- `vitest.config.ts` — `environment: 'node'`, `include: ['tests/**/*.test.ts']`.
- `tsconfig.json` `include` now lists `tests` so `tsc --noEmit` type-checks them too.

## Commands
- `npm test` — run once (`vitest run`). Used by CI and the pre-commit hook.
- `npm run test:watch` — watch mode while developing.

## Coverage (as built)
`engine.ts` (collision/camera/input/PRNG), `state.ts` (save defaults, energy,
clock, night ramp, shop/placement/luck/gacha — deterministic via `mulberry32`),
`fishing.ts` (reel minigame; `Math.random` stubbed with `vi.spyOn` for
determinism). ~52 tests. Add a file under `tests/` per new pure module.

## Where it runs
- **CI on every PR + push to main**: `.github/workflows/ci.yml` (`check` job) runs
  `tsc --noEmit` → `npm test` → `npm run build` on ubuntu. Rust-free and fast;
  native bundling stays in `release.yml`.
- **Before any Claude commit**: `.claude/settings.json` registers a `PreToolUse`
  hook on Bash → `.claude/hooks/pre-commit-tests.mjs`. It detects `git commit`
  commands, runs `npm test`, and **exits 2 (blocks the commit) on failure**.
  Bypass with `git commit --no-verify` (or `-n`).

## Testing notes
- Game logic is deterministic given a seed — prefer asserting exact values over
  ranges. Seed-driven code (`pawnStockFor`, `oreNodesFor`, `sketchyOfferFor`)
  uses `mulberry32(day*…)`; assert same-day stability + cross-day rotation.
- `Input` takes `KeyboardEvent`s — pass plain stub objects cast to the type
  (`{ key, preventDefault, target, repeat }`); no jsdom needed.
- A future component/canvas test needs jsdom: add `// @vitest-environment jsdom`
  at the top of that file (per-file override).
