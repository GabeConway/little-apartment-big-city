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
- `vite` 6 + `@vitejs/plugin-react`, `tailwindcss` 3 + `postcss`/`autoprefixer`, `typescript` 5.
- `@tauri-apps/cli` 2 — drive desktop/mobile builds (need Rust; see [build-targets.md](build-targets.md)).
- `vitest` 2 — unit tests ([testing.md](testing.md)).
- `playwright` 1 — **dev-only** playtest harness (`scripts/playtest.mjs`; never imported by `src/`, so stay out of bundle). See [testing.md](testing.md). Chromium browser via `npx playwright install chromium`.

### Policy
- Keep deps patched for security. `npm audit` should report 0 vulnerabilities.
- In-range / patch / minor bumps: apply freely (`npm update`).
- Major bumps (breaking): only with reason; do separately and verify. Held back:
  - tailwindcss 3 → 4 (config + class breaking changes)
  - typescript 5 → 6
  - vite 6 → 7
- Rust crates (`tauri`, `tauri-build`) pinned to `2` in `src-tauri/Cargo.toml`.

### Validate after any dep change
`npx tsc --noEmit` clean, then `npm run build` clean. For native: `npm run desktop:build`.
