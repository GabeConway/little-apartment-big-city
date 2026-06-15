# Little Apartment, Big City

A cozy pixel life-sim. One codebase → **Windows, macOS, Linux, iOS, Android**.

A build-only native game: one Vite frontend, wrapped by [Tauri v2](https://tauri.app)
in a system webview. No web/hosted target — distribution is the built apps.
Plays with keyboard, touch, or a **game controller**.

## Quick start (dev)
```sh
npm install
npm run dev          # http://localhost:5173 (dev preview in a browser; not a ship target)
```

## Build
```sh
npm run desktop:build      # host platform        (needs Rust)
npm run desktop:build:mac  # Apple-Silicon .app + .dmg  (macOS host)
npm run android:build      # Android              (needs Rust + Android Studio)
npm run ios:build          # iOS                  (needs Rust + Xcode, macOS host)
```
Convenience launcher: `./start-dev.sh [desktop|android|ios]`
(Windows: `start-dev.ps1` / `start-dev.cmd`).

## Releases
Every merge to `main` builds installers via GitHub Actions
([`.github/workflows/release.yml`](.github/workflows/release.yml)) and attaches
them to a draft GitHub Release:

| Platform | Artifact |
|---|---|
| **Windows** | NSIS installer (`.exe`) **and** a portable one-click `LittleApartmentBigCity-noinstall.exe` (no install; needs the WebView2 runtime, preinstalled on Windows 11) |
| **macOS** (Apple Silicon) | `.dmg` (drag-to-install) |
| **Linux** | `.deb` (Debian/Ubuntu) **and** `.AppImage` (portable, distro-agnostic) |

## Tests
```sh
npm test             # Vitest unit tests (run once)
npm run test:watch   # watch mode
```

## Native prerequisites
Native builds need the **Rust** toolchain ([rustup.rs](https://rustup.rs)); Android also needs
Android Studio + SDK/NDK; iOS needs macOS + Xcode. After `npm install`, run
`npm run tauri icon public/images/game-logo.png` once to generate app icons, and
`npm run tauri android init` / `npm run tauri ios init` to scaffold the mobile projects.
See [kb/build-targets.md](kb/build-targets.md).

## Docs
See [CLAUDE.md](CLAUDE.md) and [kb/](kb/). The game itself is documented in [kb/games.md](kb/games.md).
