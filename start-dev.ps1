# Little Apartment, Big City - dev launcher (Windows / PowerShell).
# Usage: .\start-dev.ps1 [web|desktop|android|ios]   (default: web)
#   web      -> vite dev server (browser)   - no extra toolchain
#   desktop  -> tauri dev (native window)   - needs Rust
#   android  -> tauri android dev           - needs Rust + Android Studio/SDK/NDK
#   ios      -> not supported on Windows
param([string]$Target = "web")

Set-Location -Path $PSScriptRoot

switch ($Target) {
  "web"     { Write-Host "> web dev (vite) -> http://localhost:5173"; npm run dev }
  "desktop" { Write-Host "> desktop (tauri dev) - requires Rust toolchain"; npm run desktop:dev }
  "android" { Write-Host "> android (tauri android dev) - requires Rust + Android Studio/SDK/NDK"; npm run android:dev }
  "ios"     { Write-Host "iOS builds require macOS + Xcode. Not available on Windows." }
  default   { Write-Host "Unknown target '$Target'. Use: web | desktop | android"; exit 1 }
}
