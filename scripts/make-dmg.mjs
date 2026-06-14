// Build a macOS .dmg from the bundled .app using `hdiutil` only.
//
// Why not Tauri's built-in dmg target? Tauri runs `bundle_dmg.sh`, which drives
// Finder via AppleScript to style the disk-image window. That step needs a GUI /
// WindowServer session and fails in headless or SSH/CI shells
// ("error running bundle_dmg.sh"). `hdiutil` needs none of that, so this works
// the same locally and in CI. Drag-to-install via an /Applications symlink.
//
// Usage: node scripts/make-dmg.mjs [outputDir]
//   outputDir defaults to the .app's sibling ../dmg. macOS only (no-op elsewhere).

import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, rmSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'darwin') {
  console.log('make-dmg: not macOS — skipping.');
  process.exit(0);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const conf = JSON.parse(readFileSync(join(root, 'src-tauri', 'tauri.conf.json'), 'utf8'));
const productName = conf.productName;
const version = conf.version;

// Locate <productName>.app. The path depends on whether --target was passed:
// target/<triple>/release/... (CI, desktop:build:mac) vs target/release/...
// (a bare local `tauri build`). Check those first; only fall back to a full
// tree walk (slow) if neither exists.
const targetDir = join(root, 'src-tauri', 'target');
const appName = `${productName}.app`;
const known = [
  join(targetDir, 'aarch64-apple-darwin', 'release', 'bundle', 'macos', appName),
  join(targetDir, 'release', 'bundle', 'macos', appName),
];
let appPath = known.find(existsSync);
if (!appPath) {
  let best = null;
  const walk = (dir) => {
    let entries;
    try { entries = readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const p = join(dir, e.name);
      if (e.name === appName) {
        const m = statSync(p).mtimeMs;
        if (!best || m > best.mtime) best = { path: p, mtime: m };
      } else if (e.isDirectory() && e.name !== 'deps' && e.name !== 'incremental') {
        walk(p);
      }
    }
  };
  walk(targetDir);
  appPath = best?.path;
}

if (!appPath) {
  console.error(`make-dmg: no ${appName} found under ${targetDir}. Build the app first.`);
  process.exit(1);
}

// ASCII-safe asset name (no spaces/commas) — keeps shell globs and download
// filenames sane. The mounted volume still uses the pretty productName.
const slug = productName.replace(/[^a-zA-Z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const outDir = process.argv[2] ? resolve(process.argv[2]) : join(dirname(appPath), '..', 'dmg');
mkdirSync(outDir, { recursive: true });
const out = join(outDir, `${slug}_${version}_aarch64.dmg`);

const stage = mkdtempSync(join(tmpdir(), 'labdmg-'));
try {
  execFileSync('cp', ['-R', appPath, stage]);
  execFileSync('ln', ['-s', '/Applications', join(stage, 'Applications')]);
  execFileSync('rm', ['-f', out]);
  execFileSync('hdiutil', [
    'create', '-volname', productName,
    '-srcfolder', stage, '-ov', '-format', 'UDZO', out,
  ], { stdio: 'inherit' });
  console.log(`make-dmg: created ${out}`);
} finally {
  rmSync(stage, { recursive: true, force: true });
}
