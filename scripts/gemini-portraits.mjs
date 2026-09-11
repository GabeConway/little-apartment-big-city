// Generate / regenerate NPC dialog portraits via the Gemini API.
//
// Why: the shipped portraits in public/images/portraits/ were made with the
// Gemini consumer app, which stamps a visible ✦ watermark and carries
// personal-use terms. The paid Gemini API produces the same style with no
// visible watermark and commercial-use terms (SynthID invisible watermark
// remains — that's fine, and Steam's AI-content disclosure is still required).
//
// Modes:
//   regen <name|all>   Recreate an existing portrait image-to-image so the new
//                      art matches the shipped look (minus the ✦). <name> is a
//                      roster key below, or a path to any image (e.g. the
//                      title background).
//   new "<Name>" "<description>"  [--ref <roster-name>]
//                      Create a portrait for a character that has none, using
//                      an existing portrait as a style reference (default:
//                      genji) so the frame/nameplate/pixel style match.
//
// Env:     GEMINI_API_KEY  (required; paid-tier key from AI Studio)
// Options: --model <id>    default: gemini-2.5-flash-image
//          --out <dir>     default: art-staging/portraits (repo root)
//
// Outputs land in the staging dir as PNG for review — nothing is installed
// into public/ automatically. After approval, convert + install, e.g.:
//   sips -s format jpeg --resampleWidth 1024 art-staging/portraits/genji.png \
//     --out public/images/portraits/genji.jpeg
//
// Usage:
//   node scripts/gemini-portraits.mjs regen all
//   node scripts/gemini-portraits.mjs regen yoshi
//   node scripts/gemini-portraits.mjs regen public/images/title-bg.png
//   node scripts/gemini-portraits.mjs new "Tex" "a weathered cowboy with a big hat" --ref genji

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PORTRAIT_DIR = join(root, 'public', 'images', 'portraits');

// Roster of shipped portraits: key → source file.
const ROSTER = {
  'granny-sato': join(PORTRAIT_DIR, 'granny-soto.png'),
  genji: join(PORTRAIT_DIR, 'genji.jpeg'),
  'the-manager': join(PORTRAIT_DIR, 'the-manager.jpeg'),
  'jean-pierre': join(PORTRAIT_DIR, 'jean-pierre.jpeg'),
  yoshi: join(PORTRAIT_DIR, 'yoshi.jpeg'),
  charlie: join(PORTRAIT_DIR, 'charlie.jpeg'),
  david: join(PORTRAIT_DIR, 'david.jpeg'),
};

const NO_WATERMARK =
  'IMPORTANT: the source image contains a small four-pointed diamond sparkle ' +
  'in the bottom-right corner, on the frame border. That sparkle is a ' +
  'WATERMARK, not part of the artwork. The output must NOT contain it — ' +
  'render that corner of the frame as plain frame material, identical to the ' +
  'bottom-left corner. Do not add any other watermark, logo, signature, or ' +
  'text besides the nameplate.';

const REGEN_PROMPT =
  'Recreate this exact image as faithfully as possible: same character, same ' +
  'pose, same facial expression, same composition, same background, same ' +
  'color palette, same crisp pixel-art style, same wooden frame and nameplate ' +
  'with the same name text. Output a clean 1024x1024 image. ' + NO_WATERMARK;

// For non-portrait images (regen by path, e.g. the title background): no
// frame/nameplate language, keep the source aspect ratio.
const REGEN_GENERIC_PROMPT =
  'Recreate this exact image as faithfully as possible: same subjects, same ' +
  'composition, same color palette, same crisp pixel-art style, same aspect ' +
  'ratio as the source. ' + NO_WATERMARK;

const newPrompt = (name, desc) =>
  'Using the attached image ONLY as a style reference (pixel-art rendering, ' +
  'wooden frame, bottom nameplate, warm cozy palette, bust-height framing), ' +
  `create a brand new character portrait: ${desc}. ` +
  `The nameplate at the bottom reads "${name}". Same 1024x1024 format. ` +
  NO_WATERMARK;

const args = process.argv.slice(2);
const opt = (flag, dflt) => {
  const i = args.indexOf(flag);
  if (i === -1) return dflt;
  const [, v] = args.splice(i, 2);
  return v;
};
const model = opt('--model', 'gemini-2.5-flash-image');
const outDir = resolve(root, opt('--out', 'art-staging/portraits'));
// Extra prompt text appended to the built-in prompt — for retry passes
// ("crisper pixels", "fix the sign text", etc.) without editing this file.
const note = opt('--note', '');
const [mode, ...rest] = args;

const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.error('GEMINI_API_KEY is not set. Export it (paid-tier key) and retry.');
  process.exit(1);
}

const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

async function generate(parts, label) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const body = JSON.stringify({
    contents: [{ parts }],
    generationConfig: { responseModalities: ['IMAGE', 'TEXT'] },
  });
  for (let attempt = 1; attempt <= 3; attempt++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'content-type': 'application/json' },
      body,
    });
    if (res.status === 429 || res.status >= 500) {
      console.warn(`${label}: HTTP ${res.status}, retry ${attempt}/3...`);
      await new Promise((r) => setTimeout(r, 4000 * attempt));
      continue;
    }
    if (!res.ok) throw new Error(`${label}: HTTP ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const outParts = json.candidates?.[0]?.content?.parts ?? [];
    const img = outParts.find((p) => p.inlineData?.data);
    if (!img) throw new Error(`${label}: no image in response: ${JSON.stringify(json).slice(0, 400)}`);
    return Buffer.from(img.inlineData.data, 'base64');
  }
  throw new Error(`${label}: gave up after 3 attempts`);
}

const imagePart = (file) => ({
  inlineData: {
    mimeType: MIME[extname(file).toLowerCase()] ?? 'image/png',
    data: readFileSync(file).toString('base64'),
  },
});

const save = (name, buf) => {
  const out = join(outDir, `${name}.png`);
  writeFileSync(out, buf);
  console.log(`wrote ${out} (${(buf.length / 1024).toFixed(0)} KB)`);
};

mkdirSync(outDir, { recursive: true });

if (mode === 'regen') {
  const target = rest[0];
  if (!target) {
    console.error(`regen needs a name (${Object.keys(ROSTER).join(', ')}), "all", or an image path.`);
    process.exit(1);
  }
  const jobs =
    target === 'all'
      ? Object.entries(ROSTER)
      : ROSTER[target]
        ? [[target, ROSTER[target]]]
        : [[basename(target, extname(target)), resolve(root, target)]];
  const isRosterJob = target === 'all' || !!ROSTER[target];
  for (const [name, file] of jobs) {
    if (!existsSync(file)) throw new Error(`missing source image: ${file}`);
    console.log(`regen ${name} <- ${file}`);
    const prompt = (isRosterJob ? REGEN_PROMPT : REGEN_GENERIC_PROMPT) + (note ? ` ${note}` : '');
    save(name, await generate([imagePart(file), { text: prompt }], name));
  }
} else if (mode === 'new') {
  const [name, desc] = rest;
  if (!name || !desc) {
    console.error('new needs: "<Name>" "<description>" [--ref <roster-name>]');
    process.exit(1);
  }
  const refName = opt('--ref', 'genji');
  const ref = ROSTER[refName];
  if (!ref) {
    console.error(`unknown --ref "${refName}" — one of: ${Object.keys(ROSTER).join(', ')}`);
    process.exit(1);
  }
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  console.log(`new ${name} (ref: ${basename(ref)})`);
  const prompt = newPrompt(name, desc) + (note ? ` ${note}` : '');
  save(slug, await generate([imagePart(ref), { text: prompt }], name));
} else if (mode === 'gen') {
  // Free-form generation (logos, capsules, splash art): gen <slug> "<prompt>" [--ref <image-path>]
  const [slug, promptText] = rest;
  if (!slug || !promptText) {
    console.error('gen needs: <output-slug> "<prompt>" [--ref <image-path>]');
    process.exit(1);
  }
  const refPath = opt('--ref', '');
  const parts = refPath ? [imagePart(resolve(root, refPath))] : [];
  parts.push({ text: promptText + (note ? ` ${note}` : '') });
  console.log(`gen ${slug}${refPath ? ` (ref: ${basename(refPath)})` : ''}`);
  save(slug, await generate(parts, slug));
} else {
  console.error('mode must be "regen", "new", or "gen" — see header comment for usage.');
  process.exit(1);
}
