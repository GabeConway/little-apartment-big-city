# CLAUDE.md

Guidance for Claude Code in this repo. Detail lives in `kb/` — read the relevant file before working in an area.

## What this is
**Little Apartment, Big City** — a cozy pixel life-sim, as a standalone cross-platform app.
Extracted from the `personalsite` portfolio repo (where it lived at `/games#apartment`); the
game source is unchanged. One Vite frontend ships to **web (Cloudflare Pages), Windows, macOS,
iOS, and Android** via **Tauri v2** wrapping the same `dist/` build. Boots straight to the
title screen — no router, no site chrome.

## Layout
- `src/main.tsx` — entry; mounts `<LittleApartmentGame/>` at the title screen.
- `src/game/` — the game (7 files). **Imports only `react` + sibling files — keep it dependency-free.**
- `src/index.css` — Tailwind + self-hosted `@fontsource` imports.
- `public/` — `images/`, `music/`, `sfx/` (assets are absolute paths: `/images/...`), `manifest.webmanifest`, `_headers` (Cloudflare CSP).
- `src-tauri/` — Tauri v2 project (Rust). See [kb/build-targets.md](kb/build-targets.md).
- `scripts/copy-404.js` — SPA 404 fallback for Cloudflare Pages (runs in `npm run build`).

## Knowledge base (`kb/`)
Read before editing the matching area:
- [kb/games.md](kb/games.md) — the game's full as-built reference (architecture, systems, hard rules, music/sfx).
- [kb/little-apartment-progress.md](kb/little-apartment-progress.md) — build-history checklist.
- [kb/build-targets.md](kb/build-targets.md) — web/desktop/mobile pipeline + toolchain prerequisites.
- [kb/conventions.md](kb/conventions.md) — coding conventions.
- [kb/dependencies.md](kb/dependencies.md) — versions, security policy.

## Commands
- `npm run dev` — web dev server (browser). No Rust needed.
- `npm run build` — production web build → `dist/` (+ `404.html`). Deploy to Cloudflare Pages.
- `npm run desktop:dev` / `:build`, `android:dev` / `:build`, `ios:dev` / `:build` — Tauri (needs Rust; see build-targets).
- `./start-dev.sh [web|desktop|android|ios]` (mac/linux) · `start-dev.ps1`/`.cmd` (Windows).

## Invariants (don't break)
- `src/game/` stays React-only (no new npm deps inside it).
- Assets stay absolute-path; never hardcode an origin (breaks in the Tauri webview).
- Persistence is `localStorage` (`lab-save` v2, `lab-music-muted`) — portable across all webviews.
- Canvas backing must be an integer multiple of 384×224 device px (Retina sharpness).
- Fonts are self-hosted (`@fontsource`), not the Google Fonts CDN — required for offline native.

## Validate every change
`npx tsc --noEmit` clean, then `npm run build` clean. Then smoke-test via `npm run preview`.
