#!/usr/bin/env bash
# Little Apartment, Big City — dev launcher (mac/linux).
# Usage: ./start-dev.sh [web|desktop|android|ios]   (default: web)
#   web      → vite dev server (browser)            — no extra toolchain
#   desktop  → tauri dev (native window)            — needs Rust
#   android  → tauri android dev                    — needs Rust + Android Studio/SDK/NDK
#   ios      → tauri ios dev (macOS only)           — needs Rust + Xcode
set -e
cd "$(dirname "$0")"
TARGET="${1:-web}"
case "$TARGET" in
  web)     echo "▶ web dev (vite) → http://localhost:5173"; npm run dev ;;
  desktop) echo "▶ desktop (tauri dev) — requires Rust toolchain"; npm run desktop:dev ;;
  android) echo "▶ android (tauri android dev) — requires Rust + Android Studio/SDK/NDK"; npm run android:dev ;;
  ios)     echo "▶ ios (tauri ios dev) — requires Rust + Xcode (macOS only)"; npm run ios:dev ;;
  *) echo "Unknown target '$TARGET'. Use: web | desktop | android | ios"; exit 1 ;;
esac
