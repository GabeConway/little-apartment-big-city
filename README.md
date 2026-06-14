# Little Apartment, Big City

A cozy pixel life-sim. One codebase → **web, Windows, macOS, iOS, Android**.

Web runs on Cloudflare Pages; native targets are built with [Tauri v2](https://tauri.app),
which wraps the same web build in a system webview.

## Quick start (web)
```sh
npm install
npm run dev          # http://localhost:5173
```

## Build
```sh
npm run build        # web → dist/ (deploy to Cloudflare Pages)
npm run desktop:build  # Windows/macOS/Linux  (needs Rust)
npm run android:build  # Android              (needs Rust + Android Studio)
npm run ios:build      # iOS                  (needs Rust + Xcode, macOS host)
```
Convenience launcher: `./start-dev.sh [web|desktop|android|ios]`
(Windows: `start-dev.ps1` / `start-dev.cmd`).

## Native prerequisites
Native builds need the **Rust** toolchain ([rustup.rs](https://rustup.rs)); Android also needs
Android Studio + SDK/NDK; iOS needs macOS + Xcode. After `npm install`, run
`npm run tauri icon public/images/game-logo.png` once to generate app icons, and
`npm run tauri android init` / `npm run tauri ios init` to scaffold the mobile projects.
See [kb/build-targets.md](kb/build-targets.md).

## Docs
See [CLAUDE.md](CLAUDE.md) and [kb/](kb/). The game itself is documented in [kb/games.md](kb/games.md).
