# Little Apartment, Big City - dev launcher (Windows / PowerShell).
# Usage: .\start-dev.ps1 [desktop|dev|android|ios]   (default: desktop)
#   desktop  -> tauri dev (native window)   - needs Rust
#   dev      -> vite dev server (browser preview) - fast iteration, NOT a ship target
#   android  -> tauri android dev           - needs Rust + Android Studio/SDK/NDK
#   ios      -> not supported on Windows
param([string]$Target = "desktop")

Set-Location -Path $PSScriptRoot

switch ($Target) {
  "desktop" { Write-Host "> desktop (tauri dev) - requires Rust toolchain"; npm run desktop:dev }
  "dev"     { Write-Host "> browser preview (vite) -> http://localhost:5173"; npm run dev }
  "android" { Write-Host "> android (tauri android dev) - requires Rust + Android Studio/SDK/NDK"; npm run android:dev }
  "ios"     { Write-Host "iOS builds require macOS + Xcode. Not available on Windows." }
  default   { Write-Host "Unknown target '$Target'. Use: desktop | dev | android"; exit 1 }
}
