# CLAUDE.md

Guidance for Claude Code in this repo. Detail lives in `kb/` — read the relevant file before working in an area.

## What this is
**Little Apartment, Big City** — a cozy pixel life-sim, as a standalone **build-only** native app.
Extracted from the `personalsite` portfolio repo (where it lived at `/games#apartment`); the
game source is unchanged. One Vite frontend ships to **Windows, macOS, Linux, iOS, and Android**
via **Tauri v2** wrapping the same `dist/` build. **No web/hosted target** — `npm run build`
exists only to produce the `dist/` that Tauri bundles. Boots straight to the title screen — no
router, no site chrome. Input: keyboard, touch, or game controller.

## Layout
- `src/main.tsx` — entry; mounts `<LittleApartmentGame/>` at the title screen.
- `src/game/` — the game (7 files). **Imports only `react` + sibling files — keep it dependency-free.**
- `src/index.css` — Tailwind + self-hosted `@fontsource` imports.
- `public/` — `images/`, `music/`, `sfx/` (assets are absolute paths: `/images/...`).
- `src-tauri/` — Tauri v2 project (Rust). See [kb/build-targets.md](kb/build-targets.md).
- `scripts/make-dmg.mjs` — builds the macOS dmg via `hdiutil` (see build-targets).
- `scripts/gemini-portraits.mjs` — Gemini API art generator (portraits/logos/splash; needs `GEMINI_API_KEY`), plus canvas helpers `chroma-key-logo.mjs` / `fix-nameplates.mjs`. Usage + prompt lessons: [kb/art-direction.md](kb/art-direction.md) "Gemini API pipeline".

## Knowledge base (`kb/`)
Read before editing the matching area:
- [kb/games.md](kb/games.md) — the game's full as-built reference (architecture, systems, hard rules, music/sfx).
- [kb/art-direction.md](kb/art-direction.md) — visual style law: refs (Tiny Tower/Stardew/Habbo), perspective, master palette, PNG asset pipeline. Read before generating art.
- [kb/little-apartment-progress.md](kb/little-apartment-progress.md) — build-history checklist.
- [kb/build-targets.md](kb/build-targets.md) — desktop/mobile build + release pipeline + toolchain prerequisites.
- [kb/steam.md](kb/steam.md) — Steam release plan (depots, achievements port, Deck-via-Proton; not started).
- [kb/conventions.md](kb/conventions.md) — coding conventions.
- [kb/dependencies.md](kb/dependencies.md) — versions, security policy.
- [kb/testing.md](kb/testing.md) — Vitest setup, CI, pre-commit hook.
- [kb/playtesting.md](kb/playtesting.md) — Playwright playtest harness (`npm run playtest`): seed a save, drive inputs, read live state, screenshot.
- [kb/bug-hunting.md](kb/bug-hunting.md) — agent playtesting playbook: 3-command health check (`tsc+test` / `smoke` / `checkup`), seeding tricks, blind spots, fragile areas.

## Commands
- `npm run dev` — Vite dev server in a browser (fast iteration only; not a ship target). No Rust needed.
- `npm run build` — Vite build → `dist/` (the bundle Tauri wraps; not deployed anywhere).
- `npm test` — Vitest unit tests.
- `npm run playtest -- <shot|state|drive|title|presets> [opts]` — drive the game in a headless browser (seed save, send input, read live state, screenshot). See [kb/playtesting.md](kb/playtesting.md).
- `npm run desktop:dev` / `:build` (+ `desktop:build:mac` for .app+.dmg), `android:dev` / `:build`, `ios:dev` / `:build` — Tauri (needs Rust; see build-targets).
- `./start-dev.sh [desktop|android|ios]` (mac/linux) · `start-dev.ps1`/`.cmd` (Windows).

## Git workflow
Day-to-day work is committed and pushed to the **`DEV` branch** — not `main`, no feature branches, no PRs. `main` is promoted from `DEV` when the owner decides (CI + release workflows key off `main`).

## Invariants (don't break)
- `src/game/` stays React-only (no new npm deps inside it).
- Assets stay absolute-path; never hardcode an origin (breaks in the Tauri webview).
- Persistence is `localStorage` (`lab-save` v2, `lab-music-muted`, `lab-scale`) — portable across all webviews.
- Canvas backing must be an integer multiple of 384×224 device px (Retina sharpness).
- Fonts are self-hosted (`@fontsource`, plus Naganoshi JP pixel font in `public/fonts/`), not the Google Fonts CDN — required for offline native.

## Validate every change
`npx tsc --noEmit` clean, then `npm test` (Vitest) clean, then `npm run build` clean. Then smoke-test via `npm run preview` (or `npm run desktop:dev`). CI runs all three on every PR; a Claude pre-commit hook runs `npm test` before commits (see [kb/testing.md](kb/testing.md)).
