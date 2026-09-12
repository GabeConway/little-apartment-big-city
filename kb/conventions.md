# kb/conventions.md — code conventions & dependencies

- Functional components, explicit TypeScript `interface` for props.
- Avoid external icon libs; prefer inline SVGs (or `lucide-react` only if already present).
- Browser-only APIs (`window`, `navigator`, `document`) must guard with `useEffect` or `typeof window !== 'undefined'`.
- Static images go `public/images/`, referenced as `/images/file.png`.
- Match surrounding code comment density, naming, idiom.
- Synchronous-read-after-set: no read state value right after its setter in same handler — stale. Use `useRef` if need value now.
- Prefer stable identifiers (data attributes, refs) over matching rendered style strings when querying DOM.

## Dependencies

### Runtime
- `react` / `react-dom` 19 — only runtime deps game use.
- `@fontsource/press-start-2p`, `@fontsource/vt323` — self-hosted game fonts (offline-safe).
- `@tauri-apps/api` 2 — used by `src/tauri-gamepad.ts` (outside `src/game/`) to
  listen for the native gamepad bridge's `gamepad:state` event. Not imported by `src/game/`.
- `src/game/` pull in **nothing** beyond React — keep so.

### Native (Rust, `src-tauri/Cargo.toml`)
- `gilrs` — native gamepad reader for the controller bridge (`src-tauri/src/gamepad.rs`).
  Desktop-only `[target.'cfg(windows/macos/linux)']` dep. See [build-targets.md](build-targets.md).

### Tooling
- `vite` 6 + `@vitejs/plugin-react` 5, `tailwindcss` 3 + `postcss`/`autoprefixer`, `typescript` 5.
  - plugin-react is pinned to the **5.x** line on purpose: 6.x declares `vite: ^8.0.0`
    as a peer and cannot install on vite 6 (`npm ci` fails with ERESOLVE). 5.2.0's
    range is `vite ^4.2.0 || ^5 || ^6 || ^7 || ^8`, so it also survives the vite major
    whenever that happens. `vite.config.ts` calls `react()` with no options.
- `@tauri-apps/cli` 2 — drive desktop/mobile builds (need Rust; see [build-targets.md](build-targets.md)).
- `vitest` 2 — unit tests ([testing.md](testing.md)).
- `playwright` 1 — **dev-only** playtest harness (`scripts/playtest.mjs`; never imported by `src/`, so stay out of bundle). See [testing.md](testing.md). Chromium browser via `npx playwright install chromium` — **re-run it after every playwright bump**, or the harness dies with "Executable doesn't exist".

### Policy
- Keep deps patched for security.
- In-range / patch / minor bumps: apply freely (`npm update`).
- Major bumps (breaking): only with reason; do separately and verify. Held back:
  - tailwindcss 3 → 4 (config + class breaking changes)
  - typescript 5 → 6
  - vite 6 → 8 (7 is already superseded; plugin-react 6 needs 8)
  - **vitest 2 → 5** — see the advisory note below
- Rust crates (`tauri`, `tauri-build`) pinned to `2` in `src-tauri/Cargo.toml`.

### Dependabot
`.github/dependabot.yml` runs npm, cargo and github-actions **monthly**, grouped into
one PR per ecosystem, targeting **`DEV`** (not `main`) so its PRs merge where
everything else does. Security advisories still arrive immediately and separately.
Two things to know when reviewing its PRs:
- **CI does not compile Rust** (`ci.yml` is deliberately Rust-free; native bundling
  lives in `release.yml`). A green check on a `Cargo.lock` PR proves nothing — run
  `cd src-tauri && cargo check` against the PR's lockfile before merging.
- **`release.yml` is never exercised by CI either.** An action bump that touches
  `tauri-apps/tauri-action` is only really tested by a push to `main`, so diff the
  action's `action.yml` inputs/outputs against what the workflow passes first.

### Outstanding advisories (as of 2026-09-12)
`npm audit` reports **5 (1 critical, 1 high, 3 moderate)**, and all five are inside
the **`vitest` 2.1.9 dev tree** — `vitest`, `@vitest/mocker`, `vite-node`, and the
nested `vite` 5.4.21 / `esbuild` those pull in. **Nothing here ships**: the top-level
`vite` is 6.4.3 (patched), and it is what builds the `dist/` Tauri wraps; the test
runner is never bundled. Clearing them needs the **vitest 2 → 5 major**, which is
held back above. Re-check with `npm audit` before assuming this note is current.

**Dependabot alerts are disabled on this repo**, so nothing flags these
automatically — `npm audit` is the only signal, and the scheduled bumps in
`.github/dependabot.yml` are all Dependabot does here. Staying on vitest 2 is a
deliberate call (2026-09-12): the advisories are dev-only and unshipped, and
nothing is asking for the major. Revisit if the alerts get switched on, or if an
advisory ever lands on a dependency that actually ships.

### Validate after any dep change
`npx tsc --noEmit` clean, then `npm run build` clean. For native: `npm run desktop:build`.
