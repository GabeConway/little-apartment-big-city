#!/usr/bin/env node
// Stage the Steam Windows depot as loose files for steamcmd (SteamPipe) upload:
//   little-apartment.exe            (portable Tauri binary, must already be built)
//   MicrosoftEdgeWebview2Setup.exe  (WebView2 Evergreen bootstrapper, downloaded here)
//   installscript.vdf               (runs the bootstrapper on first install; see steam/)
//
// Usage: node scripts/prepare-steam-depot.mjs [outDir]
// Default outDir: src-tauri/target/steam-depot (inside target/, so gitignored).
import { mkdir, copyFile, writeFile, access } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const exe = path.join(root, 'src-tauri', 'target', 'release', 'little-apartment.exe')
const vdf = path.join(root, 'steam', 'installscript.vdf')
const outDir = path.resolve(process.argv[2] ?? path.join(root, 'src-tauri', 'target', 'steam-depot'))

// Permalink to the latest WebView2 Evergreen bootstrapper (~2 MB).
const BOOTSTRAPPER_URL = 'https://go.microsoft.com/fwlink/p/?LinkId=2124703'

try {
  await access(exe)
} catch {
  console.error(`missing ${exe} — build the Windows binary first (npm run desktop:build)`)
  process.exit(1)
}

await mkdir(outDir, { recursive: true })
await copyFile(exe, path.join(outDir, 'little-apartment.exe'))
await copyFile(vdf, path.join(outDir, 'installscript.vdf'))

console.log('downloading WebView2 Evergreen bootstrapper…')
const res = await fetch(BOOTSTRAPPER_URL, { redirect: 'follow' })
if (!res.ok) {
  console.error(`bootstrapper download failed: HTTP ${res.status}`)
  process.exit(1)
}
const buf = Buffer.from(await res.arrayBuffer())
if (buf.length < 1_000_000) {
  console.error(`bootstrapper suspiciously small (${buf.length} bytes) — refusing to stage it`)
  process.exit(1)
}
await writeFile(path.join(outDir, 'MicrosoftEdgeWebview2Setup.exe'), buf)

console.log(`depot staged at ${outDir}`)
