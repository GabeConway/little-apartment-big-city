# Dependencies

## Runtime
- `react` / `react-dom` 19 — only runtime deps game use.
- `@fontsource/press-start-2p`, `@fontsource/vt323` — self-hosted game fonts (offline-safe).
- `src/game/` pull in **nothing** beyond React — keep so.

## Tooling
- `vite` 6 + `@vitejs/plugin-react`, `tailwindcss` 3 + `postcss`/`autoprefixer`, `typescript` 5.
- `@tauri-apps/cli` 2 — drive desktop/mobile builds (need Rust; see [build-targets.md](build-targets.md)).
- `vitest` 2 — unit tests ([testing.md](testing.md)).
- `playwright` 1 — **dev-only** playtest harness (`scripts/playtest.mjs`; never imported by `src/`, so stay out of bundle). See [playtesting.md](playtesting.md). Chromium browser via `npx playwright install chromium`.

## Policy
- Keep deps patched for security. `npm audit` should report 0 vulnerabilities.
- In-range / patch / minor bumps: apply freely (`npm update`).
- Major bumps (breaking): only with reason; do separately and verify. Held back:
  - tailwindcss 3 → 4 (config + class breaking changes)
  - typescript 5 → 6
  - vite 6 → 7
- Rust crates (`tauri`, `tauri-build`) pinned to `2` in `src-tauri/Cargo.toml`.

## Validate after any dep change
`npx tsc --noEmit` clean, then `npm run build` clean. For native: `npm run desktop:build`.