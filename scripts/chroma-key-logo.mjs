// Chroma-key the magenta logo to transparent, auto-crop, and build a title-screen mock.
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';

const root = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
const logoB64 = readFileSync(`${root}/art-staging/logo/game-logo-wordmark.png`).toString('base64');
const bgB64 = readFileSync(`${root}/art-staging/portraits/title-bg.png`).toString('base64');

const browser = await chromium.launch();
const page = await browser.newPage();
const out = await page.evaluate(async ({ logoB64, bgB64 }) => {
  const load = (b64) => new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = 'data:image/png;base64,' + b64; });
  const logo = await load(logoB64);
  const c = document.createElement('canvas');
  c.width = logo.width; c.height = logo.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(logo, 0, 0);
  const im = ctx.getImageData(0, 0, c.width, c.height);
  const d = im.data;
  // key color = top-left corner pixel
  const [kr, kg, kb] = [d[0], d[1], d[2]];
  let minX = c.width, minY = c.height, maxX = 0, maxY = 0;
  for (let i = 0; i < d.length; i += 4) {
    const dr = d[i] - kr, dg = d[i + 1] - kg, db = d[i + 2] - kb;
    const dist = Math.sqrt(dr * dr + dg * dg + db * db);
    if (dist < 70) { d[i + 3] = 0; continue; }
    // de-fringe: magenta-ish leftovers (pink halo) → pull toward dark brown outline
    const r = d[i], g = d[i + 1], b = d[i + 2];
    if (r > 120 && b > 60 && g < r * 0.55 && b > g && dist < 160) { d[i] = 58; d[i + 1] = 36; d[i + 2] = 16; }
    const x = (i / 4) % c.width, y = Math.floor(i / 4 / c.width);
    if (x < minX) minX = x; if (x > maxX) maxX = x;
    if (y < minY) minY = y; if (y > maxY) maxY = y;
  }
  ctx.putImageData(im, 0, 0);
  // crop with 8px pad
  const pad = 8;
  const cx = Math.max(0, minX - pad), cy = Math.max(0, minY - pad);
  const cw = Math.min(c.width, maxX + pad) - cx, ch = Math.min(c.height, maxY + pad) - cy;
  const crop = document.createElement('canvas');
  crop.width = cw; crop.height = ch;
  crop.getContext('2d').drawImage(c, cx, cy, cw, ch, 0, 0, cw, ch);

  // mock: new title-bg + dark gradient + logo, 1280x714-ish
  const bg = await load(bgB64);
  const m = document.createElement('canvas');
  m.width = 1280; m.height = 714;
  const mc = m.getContext('2d');
  mc.imageSmoothingEnabled = false;
  const s = Math.max(m.width / bg.width, m.height / bg.height);
  mc.drawImage(bg, (m.width - bg.width * s) / 2, (m.height - bg.height * s) / 2, bg.width * s, bg.height * s);
  const grad = mc.createLinearGradient(0, 0, 0, m.height);
  grad.addColorStop(0, 'rgba(0,0,0,0.7)'); grad.addColorStop(0.5, 'rgba(0,0,0,0.4)'); grad.addColorStop(1, 'rgba(0,0,0,0.8)');
  mc.fillStyle = grad; mc.fillRect(0, 0, m.width, m.height);
  const lw = 560, lh = lw * ch / cw;
  mc.drawImage(crop, (m.width - lw) / 2, m.height * 0.30 - lh / 2, lw, lh);
  return { logo: crop.toDataURL('image/png'), mock: m.toDataURL('image/png') };
}, { logoB64, bgB64 });
await browser.close();

writeFileSync(`${root}/art-staging/logo/game-logo-title.png`, Buffer.from(out.logo.split(',')[1], 'base64'));
writeFileSync(`${root}/art-staging/logo/title-mock.png`, Buffer.from(out.mock.split(',')[1], 'base64'));
console.log('wrote game-logo-title.png + title-mock.png');
