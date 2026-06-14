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
| Desktop | `npm run desktop:dev` | `npm run desktop:build` (host platform) · **`npm run desktop:build:mac`** (Apple-Silicon app **+ dmg**) |
| Android | `npm run android:dev` | `npm run android:build` |
| iOS (macOS host) | `npm run ios:dev` | `npm run ios:build` |

`start-dev.sh` / `start-dev.ps1` / `start-dev.cmd` are thin launchers: `./start-dev.sh [web|desktop|android|ios]` (default `web`).

### macOS = Apple Silicon only
- Builds target **`aarch64-apple-darwin`** only (no Intel/universal). `tauri.conf.json` `bundle.macOS.minimumSystemVersion: 11.0`.
- **dmg is NOT a Tauri bundle target** (`bundle.targets` = `["app","deb","appimage","nsis"]`). Tauri's `bundle_dmg.sh` styles the image window via Finder/AppleScript and fails in headless/SSH/CI shells. Instead **`scripts/make-dmg.mjs`** builds the dmg with `hdiutil` (app + `/Applications` symlink, UDZO) — same result locally and in CI, no GUI needed.
- `npm run desktop:build:mac` = build aarch64 app → run make-dmg. `npm run dmg:mac` = make-dmg only (app must already be built). dmg lands in `src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/`. Optional `node scripts/make-dmg.mjs <outDir>` to drop it elsewhere (e.g. `~/Desktop`).

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
- `tauri.conf.json`: `frontendDist: ../dist`, `devUrl: http://localhost:5173`, `beforeDevCommand: npm run dev`, `beforeBuildCommand: npm run build`. Window label `main` (matches `capabilities/default.json`). `fullscreen: true` — desktop (macOS/Windows) launches OS-fullscreen; the game detects the Tauri shell (`__TAURI_INTERNALS__`) and fills the window + hides its in-page FS buttons (see kb/games.md). The 1152×672 width/height (= 3× the 384×224 view) only applies if fullscreen is turned off.
- `identifier`: `com.gabeconway.lilapt`.
- `app.security.csp`: self-only + `style-src 'unsafe-inline'` (the game injects scoped `<style>` keyframes). Webview serves `dist/` at the app root, so the game's absolute asset paths (`/images`, `/music`, `/sfx`) resolve unchanged.
- `Cargo.toml` lib name `little_apartment_lib`; `src/lib.rs` holds the shared desktop+mobile `run()` entry (`#[cfg_attr(mobile, tauri::mobile_entry_point)]`).

## Web (Cloudflare Pages)
- Build command `npm run build`, output dir `dist/`. `scripts/copy-404.js` duplicates `index.html` → `404.html` for SPA fallback.
- `public/_headers` carries the production CSP (self-only; `style-src 'unsafe-inline'`; `media-src 'self'`). No external origins — fonts are self-hosted (`@fontsource`).

## Current status (2026-06-14)
- **Web: working & verified.** `tsc --noEmit` + `npm run build` clean; preview serves all assets.
- **Icons: generated** (`src-tauri/icons/` populated). Don't re-run unless the logo changes.
- **macOS desktop: built & verified (Apple Silicon).** Rust (cargo 1.96, Homebrew) installed; `npm run desktop:build:mac` produces an arm64 `.app` + `.dmg` (via `scripts/make-dmg.mjs`); `hdiutil verify` passes, `lipo -archs` = `arm64`. App launches OS-fullscreen and fills the window.
- **Windows/Linux desktop: not built locally** (need their own hosts) — covered by CI instead.
- **Mobile: scaffolded, not built** — platform projects (`src-tauri/gen/`) not yet init'd; needs signing secrets.
- **Committed to `main`.** CI builds desktop installers on every merge: `.github/workflows/release.yml` (matrix macOS-aarch64/Windows/Linux → draft GitHub Release). macOS dmg is built by a dedicated step (`make-dmg.mjs`) and `gh release upload`ed to the same draft. Cloudflare Pages project not wired yet; mobile not in CI (no signing secrets).

### Next steps to ship native
1. Mobile: `npm run tauri android init` then `npm run android:dev`; `npm run tauri ios init` then `npm run ios:dev` (macOS only).
2. Add code-signing/notarization secrets so CI installers aren't flagged by Gatekeeper/SmartScreen; then add a signed mobile workflow.
3. Wire the Cloudflare Pages project (`npm run build` → `dist/`).

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
