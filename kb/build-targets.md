# kb/build-targets.md — build-only pipeline (native targets)

One Vite frontend (`src/`) ships to **native targets only** via **Tauri v2**. Tauri wraps the
`dist/` build in a system webview — there is no second codebase and **no web/hosted target**.
`npm run build` (Vite) exists solely to produce the `dist/` Tauri bundles; it is never deployed.

```
src/ (React + Vite)  ──vite build──►  dist/  ──wrapped by src-tauri/──┬──► Tauri desktop  (Windows / macOS / Linux)
                                                                      └──► Tauri mobile   (iOS / Android)
```

## Commands
| Target | Dev | Build |
|---|---|---|
| Desktop | `npm run desktop:dev` | `npm run desktop:build` (host platform) · **`npm run desktop:build:mac`** (Apple-Silicon app **+ dmg**) |
| Android | `npm run android:dev` | `npm run android:build` |
| iOS (macOS host) | `npm run ios:dev` | `npm run ios:build` |

`npm run dev` is a browser dev preview for fast iteration — **not a ship target**.
`start-dev.sh` / `start-dev.ps1` / `start-dev.cmd` are thin launchers: `./start-dev.sh [desktop|android|ios]` (default `desktop`).

## Release artifacts (per platform)
Built by `.github/workflows/release.yml` on every merge to `main`, attached to the draft Release:

| Platform | Artifact(s) | Notes |
|---|---|---|
| **Windows** | NSIS installer `.exe` **+** portable `LittleApartmentBigCity-noinstall.exe` | The portable exe is the raw Tauri binary (`target/release/little-apartment.exe`), uploaded by a dedicated CI step. Double-click to run, no install. Needs the **WebView2** runtime (preinstalled on Windows 11; Win10 may need the Evergreen installer). |
| **macOS** (Apple Silicon) | `.dmg` | Built by `scripts/make-dmg.mjs` (see below). |
| **Linux** | `.deb` **+** `.AppImage` | **Official, supported builds.** `.deb` for Debian/Ubuntu (`sudo apt install ./Little*.deb` or `dpkg -i`); `.AppImage` is portable/distro-agnostic — `chmod +x` then run. Built on `ubuntu-22.04` (its `webkit2gtk-4.1` packages match Tauri v2). AppImage needs FUSE; on hosts without it run `./App.AppImage --appimage-extract-and-run`. |

### macOS = Apple Silicon only
- Builds target **`aarch64-apple-darwin`** only (no Intel/universal). `tauri.conf.json` `bundle.macOS.minimumSystemVersion: 11.0`.
- **dmg is NOT a Tauri bundle target** (`bundle.targets` = `["app","deb","appimage","nsis"]`). Tauri's `bundle_dmg.sh` styles the image window via Finder/AppleScript and fails in headless/SSH/CI shells. Instead **`scripts/make-dmg.mjs`** builds the dmg with `hdiutil` (app + `/Applications` symlink, UDZO) — same result locally and in CI, no GUI needed.
- `npm run desktop:build:mac` = build aarch64 app → run make-dmg. `npm run dmg:mac` = make-dmg only (app must already be built). dmg lands in `src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/`. Optional `node scripts/make-dmg.mjs <outDir>` to drop it elsewhere (e.g. `~/Desktop`).

## Toolchain prerequisites
- **Dev preview / Vite build**: Node + npm. Nothing else.
- **Any native target**: **Rust** via [rustup](https://rustup.rs).
- **Android**: Android Studio + SDK + NDK; `JAVA_HOME`, `ANDROID_HOME`, `NDK_HOME` set. Run `npm run tauri android init` once.
- **iOS**: macOS + Xcode + command-line tools. Run `npm run tauri ios init` once.
- **Desktop cross-builds**: a Windows binary needs a Windows host (or CI runner); macOS binary needs macOS. Tauri does not cross-compile desktop targets from a single host.

## One-time setup (after `npm install`)
1. `npm run tauri icon public/images/game-logo.png` — generates `src-tauri/icons/*` (PNG/ICO/ICNS) used by `tauri.conf.json`. **Required before a desktop build succeeds.**
2. `npm run tauri android init` and/or `npm run tauri ios init` — scaffolds `src-tauri/gen/` platform projects (gitignored).

## Tauri config notes (`src-tauri/`)
- `tauri.conf.json`: `frontendDist: ../dist`, `devUrl: http://localhost:5173`, `beforeDevCommand: npm run dev`, `beforeBuildCommand: npm run build`. Window label `main` (matches `capabilities/default.json`). `fullscreen: true` — desktop (macOS/Windows/Linux) launches OS-fullscreen; the game detects the Tauri shell (`__TAURI_INTERNALS__`) and fills the window + hides its in-page FS buttons (see kb/games.md). The 1152×672 width/height (= 3× the 384×224 view) only applies if fullscreen is turned off.
- `identifier`: `com.gabeconway.lilapt`.
- `app.security.csp`: self-only + `style-src 'unsafe-inline'` (the game injects scoped `<style>` keyframes). Webview serves `dist/` at the app root, so the game's absolute asset paths (`/images`, `/music`, `/sfx`) resolve unchanged.
- `Cargo.toml` lib name `little_apartment_lib`; `src/lib.rs` holds the shared desktop+mobile `run()` entry (`#[cfg_attr(mobile, tauri::mobile_entry_point)]`).

## CI / release pipeline (`.github/workflows/`)
- **`ci.yml`** — every PR + push to `main`: `tsc --noEmit` → `npm test` → `npm run build` (Rust-free, fast).
- **`release.yml`** — every push to `main`: a `prepare` job resets the `app-v<version>` draft release, then a matrix builds macOS-aarch64 / Windows / Linux and uploads to that clean draft. macOS `.dmg` (`make-dmg.mjs`) and the Windows portable `.exe` are uploaded by dedicated steps via the GitHub uploads API (by `releaseId`). Bump `version` in `tauri.conf.json` to keep a release permanently; same-version re-runs overwrite the draft.

## Current status (2026-06-14)
- **No web target.** Build-only game; Cloudflare/PWA removed (`scripts/copy-404.js`, `public/_headers`, `manifest.webmanifest` deleted).
- **Icons: generated** (`src-tauri/icons/` populated). Don't re-run unless the logo changes.
- **macOS desktop: built & verified (Apple Silicon).** `npm run desktop:build:mac` → arm64 `.app` + `.dmg`; `hdiutil verify` passes, `lipo -archs` = `arm64`. Launches OS-fullscreen, fills the window.
- **Windows + Linux: official CI releases.** Windows ships an NSIS installer **and** a portable noinstall `.exe`; Linux ships `.deb` + `.AppImage`. Verified green end-to-end (draft `app-v1.0.0` holds all assets).
- **Mobile: scaffolded, not built** — platform projects (`src-tauri/gen/`) not yet init'd; needs signing secrets.

### Next steps to ship native
1. Mobile: `npm run tauri android init` then `npm run android:dev`; `npm run tauri ios init` then `npm run ios:dev` (macOS only).
2. Add code-signing/notarization secrets so CI installers aren't flagged by Gatekeeper/SmartScreen; then add a signed mobile workflow.

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
