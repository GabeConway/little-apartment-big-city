// Deterministically repaint nameplate text on stubborn portraits: erase the
// AI-painted mixed-case text and redraw uniform all-caps in Press Start 2P
// (the game's font-retro), gold with dark outline, matching the set standard.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const FONT = `${root}/node_modules/@fontsource/press-start-2p/files/press-start-2p-latin-400-normal.woff2`;
const JOBS = [
  { file: 'charlie.png', text: 'CHARLIE' },
  { file: 'max.png', text: 'MAX' },
  { file: 'mr-ibu.png', text: 'MR. IBU' },
  { file: 'mr-maeda.png', text: 'MR. MAEDA' },
];

const browser = await chromium.launch();
const page = await browser.newPage();
const fontB64 = readFileSync(FONT).toString('base64');

for (const { file, text } of JOBS) {
  const imgB64 = readFileSync(`${root}/art-staging/portraits/${file}`).toString('base64');
  const out = await page.evaluate(async ({ imgB64, fontB64, text }) => {
    const font = new FontFace('PS2P', `url(data:font/woff2;base64,${fontB64})`);
    await font.load();
    document.fonts.add(font);
    const img = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + imgB64; });
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0);
    // sample bar color left of the text zone, mid-bar height
    const s = ctx.getImageData(Math.round(c.width * 0.14), Math.round(c.height * 0.90), 8, 8).data;
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < s.length; i += 4) { r += s[i]; g += s[i + 1]; b += s[i + 2]; }
    const n = s.length / 4;
    ctx.fillStyle = `rgb(${Math.round(r / n)},${Math.round(g / n)},${Math.round(b / n)})`;
    // erase the text zone (inside the frame ornaments)
    const ex = Math.round(c.width * 0.13), ew = Math.round(c.width * 0.74);
    const ey = Math.round(c.height * 0.845), eh = Math.round(c.height * 0.115);
    ctx.fillRect(ex, ey, ew, eh);
    // redraw: gold caps, dark outline via 8-way offset, hard drop shadow
    const size = Math.round(c.height * 0.045);
    ctx.font = `${size}px PS2P`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const cx = c.width / 2, cy = ey + eh / 2;
    const o = Math.max(3, Math.round(size * 0.09));
    ctx.fillStyle = '#2a1a0c';
    for (const [dx, dy] of [[-o,0],[o,0],[0,-o],[0,o],[-o,-o],[o,-o],[-o,o],[o,o],[0,o*2],[o,o*2],[-o,o*2]]) ctx.fillText(text, cx + dx, cy + dy);
    ctx.fillStyle = '#f2c14e';
    ctx.fillText(text, cx, cy);
    return c.toDataURL('image/png');
  }, { imgB64, fontB64, text });
  writeFileSync(`${root}/art-staging/portraits/${file}`, Buffer.from(out.split(',')[1], 'base64'));
  console.log(`repainted ${file} -> "${text}"`);
}
await browser.close();
