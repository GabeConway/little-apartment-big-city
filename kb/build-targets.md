# kb/build-targets.md — build-only pipeline (native targets)

One Vite frontend (`src/`) ships to **native targets only** via **Tauri v2**. Tauri wraps
`dist/` build in system webview — no second codebase, **no web/hosted target**.
`npm run build` (Vite) exists only to make `dist/` Tauri bundles; never deployed.

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

`npm run dev` = browser dev preview for fast iteration — **not ship target**.
`start-dev.sh` / `start-dev.ps1` / `start-dev.cmd` = thin launchers: `./start-dev.sh [desktop|android|ios]` (default `desktop`).

## Release artifacts (per platform)
Built by `.github/workflows/release.yml` on every merge to `main`, attached to draft Release:

| Platform | Artifact(s) | Notes |
|---|---|---|
| **Windows** | NSIS installer `.exe` **+** portable `LittleApartmentBigCity-noinstall.exe` | Portable exe = raw Tauri binary (`target/release/little-apartment.exe`), uploaded by dedicated CI step. Double-click run, no install. Needs **WebView2** runtime (preinstalled Windows 11; Win10 may need Evergreen installer). |
| **macOS** (Apple Silicon) | `.dmg` | Built by `scripts/make-dmg.mjs` (see below). |
| **Linux** | `.deb` **+** `.AppImage` | **Official, supported builds.** `.deb` for Debian/Ubuntu (`sudo apt install ./Little*.deb` or `dpkg -i`); `.AppImage` portable/distro-agnostic — `chmod +x` then run. Built on `ubuntu-22.04` (its `webkit2gtk-4.1` packages match Tauri v2). AppImage needs FUSE; on hosts without it run `./App.AppImage --appimage-extract-and-run`. |

### Windows WebView2 handling
Tauri renders in the system WebView2 runtime — preinstalled on Windows 11, often missing
on Windows 10. The NSIS installer pulls it via `webviewInstallMode: downloadBootstrapper`
(`tauri.conf.json`); the **portable exe has no installer to do that**, so three pieces
cover it:
- **`src-tauri/src/webview2.rs`** — startup guard. Detects a missing runtime, re-runs the
  bundled Evergreen bootstrapper, and shows an error box if it still isn't there. This runs
  on **every** Windows build, portable or installed.
- **`steam/installscript.vdf`** — runs the bootstrapper once on first install, keyed on
  `HasRunKey` so it skips when the runtime is already present.
- **`scripts/prepare-steam-depot.mjs`** — stages a loose-file folder (exe + bootstrapper +
  vdf) into `src-tauri/target/steam-depot/`.

The last two were written for a possible Steam depot (no longer planned — the `.vdf` format
is Steam-specific). Keep `webview2.rs`: it is the only thing protecting the portable exe on
Windows 10. The other two are inert unless `prepare-steam-depot.mjs` is run by hand.

### macOS = Apple Silicon only
- Builds target **`aarch64-apple-darwin`** only (no Intel/universal). `tauri.conf.json` `bundle.macOS.minimumSystemVersion: 11.0`.
- **dmg NOT Tauri bundle target** (`bundle.targets` = `["app","deb","appimage","nsis"]`). Tauri `bundle_dmg.sh` styles image window via Finder/AppleScript, fails in headless/SSH/CI shells. Instead **`scripts/make-dmg.mjs`** builds dmg with `hdiutil` (app + `/Applications` symlink, UDZO) — same result locally and CI, no GUI.
- `npm run desktop:build:mac` = build aarch64 app → run make-dmg. `npm run dmg:mac` = make-dmg only (app must already be built). dmg lands in `src-tauri/target/aarch64-apple-darwin/release/bundle/dmg/`. Optional `node scripts/make-dmg.mjs <outDir>` to drop elsewhere (e.g. `~/Desktop`).
- **CI disk space:** the macOS runner ran out of disk in `hdiutil create` (`No space left on device`) — the Rust `release/{deps,build,incremental}` (many GB) share the disk and starve hdiutil's scratch. `make-dmg.mjs` now **prunes those intermediates when `process.env.CI`** (right after staging the `.app`, before building the image). Local builds skip the prune so rebuilds stay fast.
- **"app is damaged" on download (Apple Silicon):** the Rust linker emits only a weak `linker-signed` ad-hoc signature (`codesign -dvv` shows `Sealed Resources=none`, `Info.plist=not bound`); once quarantined by a browser download Gatekeeper reports the app as *damaged*. `make-dmg.mjs` now **deep ad-hoc re-signs the staged `.app`** (`codesign --force --deep --sign -` + `--verify --deep --strict`) so the whole bundle is sealed — the most we can do without a paid Developer ID. Users still see the unsigned prompt; the reliable fix is `xattr -dr com.apple.quarantine "/Applications/Little Apartment, Big City.app"` (documented in README). Proper notarization (signing secrets in CI) remains the real fix — see Next steps.

## Toolchain prerequisites
- **Dev preview / Vite build**: Node + npm. Nothing else.
- **Any native target**: **Rust** via [rustup](https://rustup.rs).
- **Linux host**: system dev packages, or the Rust build fails at link/`pkg-config` time:
  ```sh
  sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev \
    librsvg2-dev patchelf libgtk-3-dev libudev-dev
  ```
  `libudev-dev` is easy to miss — it is not a Tauri requirement but a **gilrs** one
  (`gilrs` → `gilrs-core` → `libudev-sys`, whose build script shells out to
  `pkg-config --libs --cflags libudev` and panics if `libudev.pc` is absent). It broke
  the `main` Linux release build on 2026-09-11; the same list is installed by
  `release.yml`, so keep the two in sync when either changes.
- **Android**: Android Studio + SDK + NDK; `JAVA_HOME`, `ANDROID_HOME`, `NDK_HOME` set. Run `npm run tauri android init` once.
- **iOS**: macOS + Xcode + command-line tools. Run `npm run tauri ios init` once.
- **Desktop cross-builds**: Windows binary needs Windows host (or CI runner); macOS binary needs macOS. Tauri does not cross-compile desktop targets from single host.

## One-time setup (after `npm install`)
1. `npm run tauri icon public/images/game-logo.png` — generates `src-tauri/icons/*` (PNG/ICO/ICNS) used by `tauri.conf.json`. **Required before desktop build succeeds.**
2. `npm run tauri android init` and/or `npm run tauri ios init` — scaffolds `src-tauri/gen/` platform projects (gitignored).

## Tauri config notes (`src-tauri/`)
- `tauri.conf.json`: `frontendDist: ../dist`, `devUrl: http://localhost:5173`, `beforeDevCommand: npm run dev`, `beforeBuildCommand: npm run build`. Window label `main` (matches `capabilities/default.json`). `fullscreen: true` — desktop (macOS/Windows/Linux) launches OS-fullscreen; game detects Tauri shell (`__TAURI_INTERNALS__`), fills window + hides in-page FS buttons (see kb/games.md). 1152×672 width/height (= 3× 384×224 view) applies only if fullscreen off.
- `identifier`: `com.gabeconway.lilapt`.
- `app.security.csp`: self-only + `style-src 'unsafe-inline'` (game injects scoped `<style>` keyframes). Webview serves `dist/` at app root, so game absolute asset paths (`/images`, `/music`, `/sfx`) resolve unchanged.
- `Cargo.toml` lib name `little_apartment_lib`; `src/lib.rs` holds shared desktop+mobile `run()` entry (`#[cfg_attr(mobile, tauri::mobile_entry_point)]`).

## Controllers / gamepad (first-class)
- **Why a native bridge:** the webview Gamepad API is unreliable in our shells —
  WebView2 (Windows) has a focus bug where pads only register with DevTools
  focused ([WebView2Feedback #3025](https://github.com/MicrosoftEdge/WebView2Feedback/issues/3025)),
  and WebKitGTK (Linux/Steam Deck) only exposes pads if built with libmanette.
  So `navigator.getGamepads()` returns empty in a plain Tauri build → controllers
  appeared dead even though the engine code was correct.
- **Fix:** `src-tauri/src/gamepad.rs` reads pads natively with **`gilrs`** (XInput
  on Windows, evdev on Linux incl. Steam Deck, IOKit on macOS), maps them to the
  W3C standard layout, and emits `gamepad:state` ~120 Hz. `src/tauri-gamepad.ts`
  (outside `src/game/`, so the game stays React-only) listens and **polyfills
  `navigator.getGamepads()`**, so `engine.ts pollGamepad()` works unchanged.
  Started in `lib.rs` setup under `#[cfg(desktop)]`. Needs `core:event:default`
  capability (added). No-op in a plain browser (`npm run dev`/playtest keep the
  native API). gilrs is a `[target.'cfg(...)']` dep — desktop only, not mobile.
- **UI navigation:** `src/game/useUiNav.ts` (React-only) drives the DOM menus with
  gamepad/keyboard: any container tagged `data-navroot` (title + its panels,
  shops, phone) gets roving focus — dpad/stick/arrows move, A/Enter activates the
  focused button. Single-action overlays (dialog/sleep/end-of-day) are NOT
  navroots; the engine loop handles their A/B directly. Engine owns in-world
  movement; A in shop/menu is a no-op there, so no double-fire.
- **Adaptive prompts:** `useUiNav` sets `document.body[data-input]` to
  `pointer`/`keyboard`/`gamepad` based on last-used device; CSS shows the focus
  ring only for keyboard/gamepad, and a control-hint bar swaps glyphs to match.
- **Steam Deck:** the Linux `.AppImage`/`.deb` + this bridge cover it (gilrs reads
  the Deck's emulated XInput pad via evdev). For Steam Input to emit a gamepad,
  add the app as a **Non-Steam Game**, set its controller layout to a **Gamepad
  template** (not Desktop), and run in **Gaming Mode** (Desktop Mode often leaves
  the shortcut on the keyboard/mouse layout → no pad seen). Steam/QAM/back paddles
  are not exposed to the app.
- **Mapping:** W3C standard — A=0,B=1,X=2,Y=3, LB=4,RB=5,LT=6,RT=7, Back=8,Start=9,
  L3=10,R3=11, DPad U/D/L/R=12-15, Guide=16; axes 0/1=left stick, 2/3=right (gilrs
  inverts Y to match web convention).

## CI / release pipeline (`.github/workflows/`)
- **`ci.yml`** — every PR + push to `main`: `tsc --noEmit` → `npm test` → `npm run build` (Rust-free, fast).
- **`release.yml`** — every push to `main`: `prepare` job resets `app-v<version>` draft release, then matrix builds macOS-aarch64 / Windows / Linux and uploads to clean draft. macOS `.dmg` (`make-dmg.mjs`) and Windows portable `.exe` uploaded by dedicated steps via GitHub uploads API (by `releaseId`). Bump `version` in `tauri.conf.json` to keep release permanently; same-version re-runs overwrite draft.

## Current status (2026-06-14)
- **No web target.** Build-only game; Cloudflare/PWA removed (`scripts/copy-404.js`, `public/_headers`, `manifest.webmanifest` deleted).
- **Icons: generated** (`src-tauri/icons/` populated). Don't re-run unless logo changes.
- **macOS desktop: built & verified (Apple Silicon).** `npm run desktop:build:mac` → arm64 `.app` + `.dmg`; `hdiutil verify` passes, `lipo -archs` = `arm64`. Launches OS-fullscreen, fills window.
- **Windows + Linux: official CI releases.** Windows ships NSIS installer **and** portable noinstall `.exe`; Linux ships `.deb` + `.AppImage`. Verified green end-to-end (draft `app-v1.0.0` holds all assets).
- **Mobile: scaffolded, not built** — platform projects (`src-tauri/gen/`) not yet init'd; needs signing secrets.

### Next steps to ship native
1. Mobile: `npm run tauri android init` then `npm run android:dev`; `npm run tauri ios init` then `npm run ios:dev` (macOS only).
2. Add code-signing/notarization secrets so CI installers not flagged by Gatekeeper/SmartScreen; then add signed mobile workflow.

### Gotcha — `tsc` is a real gate here
Repo has `@types/react`, so `tsc --noEmit` type-checks React calls for real. Source
repo `personalsite` has **no `@types/react`**, so its tsc silently skips them — two latent
type bugs only surfaced after extraction (`Hud.time` initial value; `bite` FishMode dropping
`table`, which broke deep/tropical fish tables). Both fixed here. If re-syncing game code from
personalsite, re-apply them and run `tsc` here to catch new ones.

## Invariants (don't break)
- `src/game/` stays dependency-free (React + sibling files only).
- Assets stay absolute-path; no hardcoded origins (would break in webview).
- Persistence = `localStorage` — portable across all webviews; no native storage plugin needed.