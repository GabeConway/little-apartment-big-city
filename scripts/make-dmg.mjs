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
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
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
  const stagedApp = join(stage, appName);

  // The Rust linker only emits a weak "linker-signed" ad-hoc signature that
  // doesn't seal the bundle's resources or bind Info.plist (`Sealed
  // Resources=none`). Once the .dmg is downloaded through a browser the
  // quarantine flag turns that incomplete signature into the dreaded
  // "<app> is damaged and can't be opened" on Apple Silicon. Re-sign the
  // staged copy with a PROPER deep ad-hoc signature so the whole bundle is
  // sealed — that's the most we can do without a paid Developer ID. (Users
  // still get the unsigned-developer prompt; see the README for `xattr`.)
  try {
    execFileSync('codesign', ['--force', '--deep', '--sign', '-', stagedApp], { stdio: 'inherit' });
    execFileSync('codesign', ['--verify', '--deep', '--strict', stagedApp], { stdio: 'inherit' });
    console.log('make-dmg: re-signed the staged .app (deep ad-hoc, resources sealed).');
  } catch (e) {
    console.warn('make-dmg: codesign step failed — the .dmg may report "damaged" on download.', e?.message ?? e);
  }

  // Drop a plain-text "how to run" note in the dmg so first-time users know how
  // to get past Gatekeeper (we have no paid Apple Developer ID, so the app is
  // ad-hoc signed only and macOS treats it as from an "unidentified developer").
  const howTo = [
    `${productName} — How to run on macOS`,
    '',
    'This game is made by an independent developer and is NOT signed with a paid',
    'Apple Developer ID, so macOS may say the app is "damaged" or block it as being',
    'from an "unidentified developer". The app is safe — this is just Gatekeeper.',
    '',
    'TO INSTALL:',
    `  1. Drag "${productName}.app" onto the Applications folder in this window.`,
    '',
    'TO RUN THE FIRST TIME, pick ONE of these:',
    '',
    '  A) Right-click (or Control-click) the app in Applications, choose "Open",',
    '     then click "Open" again in the dialog. You only need to do this once.',
    '',
    '  B) If macOS still says it is "damaged", open Terminal and run this one line',
    '     (copy/paste it exactly, including the quotes), then press Return:',
    '',
    `       xattr -dr com.apple.quarantine "/Applications/${productName}.app"`,
    '',
    '     Then open the app normally.',
    '',
    '  C) Or open  System Settings > Privacy & Security , scroll down, and click',
    '     "Open Anyway" next to the message about this app.',
    '',
    'Enjoy! 🏠🌆',
    '',
  ].join('\n');
  writeFileSync(join(stage, 'HOW TO RUN.txt'), howTo);

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
