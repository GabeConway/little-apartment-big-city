// shore-audio-check.mjs — regression check for the shore's one-play-a-day theme
// (SHORE_AMBIENCE / save.shoreThemeDay in LittleApartmentGame.tsx; written up in
// kb/games.md under Music).
//
//   node scripts/shore-audio-check.mjs      # exits non-zero on any failure
//
// This lives OUTSIDE the `checkup` battery on purpose: `checkup` rows assert on
// the `?debug` snapshot, and the snapshot exposes no audio state. So this spies
// on the Audio constructor before the app boots, which makes every track the
// game builds inspectable (src / loop / paused / volume / handlers).
//
// Walks six cases: day-1 first arrival, a same-day return with the play already
// burned, the handoff when the theme ends, the next day, arriving in the rain
// (must NOT burn the day), and the rain clearing mid-visit (plays out in full,
// then burns).
import { chromium } from 'playwright';
import { createServer } from 'vite';

const PORT = 5199;
const spy = () => {
  const Orig = window.Audio;
  window.__aud = [];
  function Spy(src) { const a = new Orig(src); window.__aud.push(a); return a; }
  Spy.prototype = Orig.prototype;
  window.Audio = Spy;
};
const music = (page) => page.evaluate(() =>
  window.__aud.filter(a => a.src.includes('/music/') && !a.src.includes('title.mp3')).map(a => ({
    track: decodeURIComponent(a.src.split('/').pop()),
    loop: a.loop, paused: a.paused, vol: +a.volume.toFixed(2), onended: !!a.onended,
  })));
const saved = (page) => page.evaluate(() => JSON.parse(localStorage.getItem('lab-save')).shoreThemeDay);

let fails = 0;
const check = (label, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) fails++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}: got ${JSON.stringify(got)}${ok ? '' : `, want ${JSON.stringify(want)}`}`);
};

const server = await createServer({ server: { port: PORT } });
await server.listen();
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', e => { fails++; console.log('  [pageerror]', e.message); });
await page.addInitScript(spy);
await page.goto(`http://localhost:${PORT}/?debug`, { waitUntil: 'domcontentloaded' });

const boot = async (extra) => {
  const save = { v: 2, day: 1, scene: 'shore', px: 352, py: 44, dir: 'down',
    canFish: true, money: 20000, visited: ['shore', 'city'], ...extra };
  await page.evaluate(s => localStorage.setItem('lab-save', JSON.stringify(s)), save);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__lab?.snapshot);
  await page.getByText(/CONTINUE/i).click();
  await page.waitForFunction(() => window.__lab.snapshot().screen === 'playing');
  await page.waitForTimeout(1500);
};

console.log('\n1. day 1, first arrival — theme plays once, unlooped');
await boot({});
let m = await music(page);
console.table(m);
check('shoreThemeDay burned', await saved(page), 1);
check('playing the theme', m.map(t => t.track), ['fishing.mp3']);
check('theme does not loop', m[0]?.loop, false);
check('handoff armed', m[0]?.onended, true);

console.log('\n2. same day, play already burned — straight to the surf bed');
await boot({ shoreThemeDay: 1 });
m = await music(page);
console.table(m);
check('playing the ambience', m.map(t => t.track), ['shore-ambience.mp3']);
check('ambience loops', m[0]?.loop, true);

console.log('\n3. the theme reaches its end — hands off to the surf bed');
await boot({});
await page.evaluate(async () => {
  const a = window.__aud.find(x => /fishing\.mp3/.test(x.src));
  await new Promise(r => (a.readyState >= 1 ? r() : a.addEventListener('loadedmetadata', r, { once: true })));
  a.currentTime = a.duration - 0.25;
});
await page.waitForTimeout(3000);
m = await music(page);
console.table(m);
check('surf bed created', m.some(t => t.track === 'shore-ambience.mp3' && t.loop), true);
check('theme stopped', m.find(t => t.track === 'fishing.mp3')?.paused, true);

console.log('\n4. next day — the theme comes back');
await boot({ day: 2, shoreThemeDay: 1 });
m = await music(page);
console.table(m);
check('shoreThemeDay re-burned', await saved(page), 2);
check('playing the theme again', m.map(t => t.track), ['fishing.mp3']);
check('still unlooped', m[0]?.loop, false);

console.log('\n5. arriving in the rain — rain stands in, so the day is NOT burned');
await boot({ forceRain: true });
m = await music(page);
console.table(m);
check('theme is loaded but silent', m.filter(t => t.track === 'fishing.mp3').map(t => t.paused), [true]);
check('no surf bed yet', m.some(t => t.track === 'shore-ambience.mp3'), false);
check('day still owed its play', await saved(page), 0);

console.log('\n6. the rain clears mid-visit — the theme plays out IN FULL, then burns');
// `snapshot().save` is saveRef.current by reference, so this is the shrine
// offering's effect: the draw loop sees rainCleared and calls syncRain(false),
// which swells the still-unburned theme back in.
await page.evaluate(() => { window.__lab.snapshot().save.rainCleared = true; });
await page.waitForTimeout(1200);
check('rain stopped, theme now audible', await page.evaluate(() =>
  !window.__aud.find(x => /fishing\.mp3/.test(x.src)).paused), true);
check('still not burned — it has only just started', await saved(page), 0);
await page.evaluate(() => {
  const a = window.__aud.find(x => /fishing\.mp3/.test(x.src));
  a.currentTime = a.duration - 0.25;
});
await page.waitForTimeout(3000);
check('day burned once the theme ended', await saved(page), 1);
m = await music(page);
console.table(m);
check('handed off to the surf bed', m.some(t => t.track === 'shore-ambience.mp3' && !t.paused), true);
check('theme did not restart', m.find(t => t.track === 'fishing.mp3')?.paused, true);

await browser.close();
await server.close();
console.log(fails ? `\n${fails} FAILED` : '\nall checks passed');
process.exit(fails ? 1 : 0);
