# kb/build-targets.md — cross-platform build pipeline

One Vite frontend (`src/`) ships to **5 targets** via **Tauri v2** (+ Cloudflare Pages for web). The native targets wrap the exact same `dist/` web build in a system webview — there is no second codebase.

```
src/ (React + Vite)  ──vite build──►  dist/
   │                                    ├──► Cloudflare Pages   (web)
   └── src-tauri/ wraps dist/ ──────────┼──► Tauri desktop      (Windows / macOS / Linux)
                                        └──► Tauri mobile       (iOS / Android)
```

## Commands
| Target | Dev | Build |
|---|---|---|
| Web | `npm run dev` | `npm run build` → deploy `dist/` to Cloudflare Pages |
| Desktop | `npm run desktop:dev` | `npm run desktop:build` |
| Android | `npm run android:dev` | `npm run android:build` |
| iOS (macOS host) | `npm run ios:dev` | `npm run ios:build` |

`start-dev.sh` / `start-dev.ps1` / `start-dev.cmd` are thin launchers: `./start-dev.sh [web|desktop|android|ios]` (default `web`).

## Toolchain prerequisites
- **Web only**: Node + npm. Nothing else.
- **Any native target**: **Rust** via [rustup](https://rustup.rs). (Not installed in the scaffold — install before `tauri dev/build`.)
- **Android**: Android Studio + SDK + NDK; `JAVA_HOME`, `ANDROID_HOME`, `NDK_HOME` set. Run `npm run tauri android init` once.
- **iOS**: macOS + Xcode + command-line tools. Run `npm run tauri ios init` once.
- **Desktop cross-builds**: a Windows binary needs a Windows host (or CI runner); macOS binary needs macOS. Tauri does not cross-compile desktop targets from a single host.

## One-time setup (after `npm install`)
1. `npm run tauri icon public/images/game-logo.png` — generates `src-tauri/icons/*` (PNG/ICO/ICNS) used by `tauri.conf.json`. **Required before a desktop build succeeds.**
2. `npm run tauri android init` and/or `npm run tauri ios init` — scaffolds `src-tauri/gen/` platform projects (gitignored).

## Tauri config notes (`src-tauri/`)
- `tauri.conf.json`: `frontendDist: ../dist`, `devUrl: http://localhost:5173`, `beforeDevCommand: npm run dev`, `beforeBuildCommand: npm run build`. Window label `main` (matches `capabilities/default.json`). Default window 1152×672 = exactly 3× the 384×224 logical view.
- `identifier`: `com.gabeconway.lilapt`.
- `app.security.csp`: self-only + `style-src 'unsafe-inline'` (the game injects scoped `<style>` keyframes). Webview serves `dist/` at the app root, so the game's absolute asset paths (`/images`, `/music`, `/sfx`) resolve unchanged.
- `Cargo.toml` lib name `little_apartment_lib`; `src/lib.rs` holds the shared desktop+mobile `run()` entry (`#[cfg_attr(mobile, tauri::mobile_entry_point)]`).

## Web (Cloudflare Pages)
- Build command `npm run build`, output dir `dist/`. `scripts/copy-404.js` duplicates `index.html` → `404.html` for SPA fallback.
- `public/_headers` carries the production CSP (self-only; `style-src 'unsafe-inline'`; `media-src 'self'`). No external origins — fonts are self-hosted (`@fontsource`).

## Current status (2026-06-14)
- **Web: working & verified.** `tsc --noEmit` + `npm run build` clean; preview serves all assets.
- **Icons: generated** (`src-tauri/icons/` populated). Don't re-run unless the logo changes.
- **Desktop/mobile: scaffolded but never built** — Rust is **not installed** on this machine.
  Mobile platform projects (`src-tauri/gen/`) not yet init'd.
- **Not committed yet**; no Cloudflare Pages project wired yet.

### Next steps to ship native
1. Install Rust: `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`
2. `npm run desktop:dev` — first run compiles the Rust shell (slow); opens a native window.
3. `npm run tauri android init` then `npm run android:dev` (emulator/device).
4. `npm run tauri ios init` then `npm run ios:dev` (macOS only).

### Gotcha — `tsc` is a real gate here
This repo has `@types/react`, so `tsc --noEmit` type-checks React calls for real. The source
repo `personalsite` has **no `@types/react`**, so its tsc silently skips them — two latent
type bugs only surfaced after extraction (`Hud.time` initial value; `bite` FishMode dropping
`table`, which broke deep/tropical fish tables). Both fixed here. If re-syncing game code from
personalsite, re-apply them and run `tsc` here to catch any new ones.

## Invariants (don't break)
- `src/game/` stays dependency-free (React + sibling files only).
- Assets stay absolute-path; no hardcoded origins (would break in the webview).
- Persistence is `localStorage` — portable across all webviews; no native storage plugin needed.
