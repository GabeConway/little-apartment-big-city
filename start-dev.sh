#!/usr/bin/env bash
# Little Apartment, Big City — dev launcher (mac/linux).
# Usage: ./start-dev.sh [desktop|dev|android|ios]   (default: desktop)
#   desktop  → tauri dev (native window)            — needs Rust
#   dev      → vite dev server (browser preview)    — fast iteration, NOT a ship target
#   android  → tauri android dev                    — needs Rust + Android Studio/SDK/NDK
#   ios      → tauri ios dev (macOS only)           — needs Rust + Xcode
set -e
cd "$(dirname "$0")"
TARGET="${1:-desktop}"
case "$TARGET" in
  desktop) echo "▶ desktop (tauri dev) — requires Rust toolchain"; npm run desktop:dev ;;
  dev)     echo "▶ browser preview (vite) → http://localhost:5173"; npm run dev ;;
  android) echo "▶ android (tauri android dev) — requires Rust + Android Studio/SDK/NDK"; npm run android:dev ;;
  ios)     echo "▶ ios (tauri ios dev) — requires Rust + Xcode (macOS only)"; npm run ios:dev ;;
  *) echo "Unknown target '$TARGET'. Use: desktop | dev | android | ios"; exit 1 ;;
esac
