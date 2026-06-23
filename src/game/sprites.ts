// Little Apartment, Big City — all art, generated in-code (CSP allows no external images).
// Characters are pixel-string art; tiles and furniture are drawn procedurally.
// buildAtlas() returns named offscreen canvases blitted by the renderer.

export type Atlas = Record<string, HTMLCanvasElement>;

const canvas = (w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  return [c, ctx];
};

// Pixel-string sprite: each char indexes the palette; '.' is transparent.
const strSprite = (rows: string[], palette: Record<string, string>): HTMLCanvasElement => {
  const [c, ctx] = canvas(rows[0].length, rows.length);
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = palette[row[x]];
      if (col) { ctx.fillStyle = col; ctx.fillRect(x, y, 1, 1); }
    }
  });
  return c;
};

const mirror = (src: HTMLCanvasElement): HTMLCanvasElement => {
  const [c, ctx] = canvas(src.width, src.height);
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  return c;
};

// ---- Characters --------------------------------------------------------

// 16x16 chibi. h hair, k hair dark, s skin, e eye, t shirt, u shirt dark, p pants, b shoes
const BODY_DOWN_0 = [
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '...hkhhhhhhkh...',
  '...hssssssssh...',
  '...hsesssseshh..',
  '...ssssssssss...',
  '....ssssssss....',
  '....utttttu.....',
  '...tttttttttt...',
  '..sttttttttts...',
  '..s.tttttttt.s..',
  '....pppppppp....',
  '....ppp..ppp....',
  '....ppp..ppp....',
  '....bbb..bbb....',
  '................',
];
const BODY_DOWN_1 = [
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '...hkhhhhhhkh...',
  '...hssssssssh...',
  '...hsesssseshh..',
  '...ssssssssss...',
  '....ssssssss....',
  '....utttttu.....',
  '...tttttttttt...',
  '..sttttttttts...',
  '..s.tttttttt.s..',
  '....pppppppp....',
  '....ppp..ppp....',
  '.....ppp.ppp....',
  '....bbb...bbb...',
  '................',
];
const BODY_UP_0 = [
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '...hhhhhhhhhh...',
  '...hhhhhhhhhh...',
  '...hhhhhhhhhh...',
  '...shhhhhhhhs...',
  '....ssssssss....',
  '....utttttu.....',
  '...tttttttttt...',
  '..sttttttttts...',
  '..s.tttttttt.s..',
  '....pppppppp....',
  '....ppp..ppp....',
  '....ppp..ppp....',
  '....bbb..bbb....',
  '................',
];
const BODY_UP_1 = [
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '...hhhhhhhhhh...',
  '...hhhhhhhhhh...',
  '...hhhhhhhhhh...',
  '...shhhhhhhhs...',
  '....ssssssss....',
  '....utttttu.....',
  '...tttttttttt...',
  '..sttttttttts...',
  '..s.tttttttt.s..',
  '....pppppppp....',
  '....ppp..ppp....',
  '....ppp.ppp.....',
  '...bbb...bbb....',
  '................',
];
const BODY_LEFT_0 = [
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '...hhhhhhhhhh...',
  '...hsssssshhh...',
  '...hessssshhh...',
  '...sssssssshh...',
  '....ssssssss....',
  '....uttttttu....',
  '....tttttttt....',
  '...stttttttt....',
  '...s.tttttt.....',
  '....pppppppp....',
  '....pppppp......',
  '....ppp.ppp.....',
  '....bbb.bbb.....',
  '................',
];
const BODY_LEFT_1 = [
  '....hhhhhhhh....',
  '...hhhhhhhhhh...',
  '...hhhhhhhhhh...',
  '...hsssssshhh...',
  '...hessssshhh...',
  '...sssssssshh...',
  '....ssssssss....',
  '....uttttttu....',
  '....tttttttt....',
  '...stttttttt....',
  '...s.tttttt.....',
  '....pppppppp....',
  '...ppp..ppp.....',
  '...ppp...ppp....',
  '...bbb...bbb....',
  '................',
];

interface CharPalette { h: string; k: string; s: string; e: string; t: string; u: string; p: string; b: string }

// Accessory overlays drawn on top of the base body. Rows are top-aligned at
// `dy`; each char keys into the accessory's own palette. Gives every NPC a
// distinct silhouette without redrawing whole bodies.
interface Accessory {
  dy?: number;
  down?: string[]; up?: string[]; left?: string[];
  pal: Record<string, string>;
}

const ACC = {
  cap: (c: string, brim: string): Accessory => ({
    pal: { c, b: brim },
    down: ['....cccccccc....', '...cccccccccc...', '..cccccccccccc..', '..bbbbbbbbbbbb..'],
    up: ['....cccccccc....', '...cccccccccc...', '...cccccccccc...', '....cccccccc....'],
    left: ['....cccccccc....', '...ccccccccc....', '.bbbbbccccccc...', '.bbb............'],
  }),
  beanie: (c: string, fold: string): Accessory => ({
    pal: { c, f: fold },
    down: ['....cccccccc....', '...cccccccccc...', '...ffffffffff...'],
    up: ['....cccccccc....', '...cccccccccc...', '...ffffffffff...'],
    left: ['....cccccccc....', '...cccccccccc...', '...ffffffffff...'],
  }),
  bucket: (c: string): Accessory => ({
    pal: { c },
    down: ['.....cccccc.....', '....cccccccc....', '..cccccccccccc..', '.cccccccccccccc.'],
    up: ['.....cccccc.....', '....cccccccc....', '..cccccccccccc..', '.cccccccccccccc.'],
    left: ['.....cccccc.....', '....cccccccc....', '..cccccccccccc..', '.cccccccccccccc.'],
  }),
  shades: (c: string): Accessory => ({
    dy: 4, pal: { x: c },
    down: ['...xxxx.xxxx....'],
    left: ['...xxxxx........'],
  }),
  glasses: (frame: string, lens: string): Accessory => ({
    dy: 4, pal: { x: frame, l: lens },
    down: ['...xllx.xllx....'],
    left: ['...xllx.........'],
  }),
  visor: (c: string): Accessory => ({
    dy: 2, pal: { c },
    down: ['..cccccccccccc..'],
    left: ['.ccccccccc......'],
  }),
  apron: (c: string, strap: string): Accessory => ({
    dy: 7, pal: { a: c, s: strap },
    down: ['......ssss......', '.....aaaaaa.....', '.....aaaaaa.....', '.....aaaaaa.....'],
    left: ['......ssss......', '.....aaaaa......', '.....aaaaa......', '.....aaaaa......'],
  }),
  headphones: (c: string): Accessory => ({
    pal: { p: c },
    down: ['...pppppppppp...', '..pp........pp..', '..............', '..pp........pp..', '..pp........pp..'],
    up: ['...pppppppppp...', '..pp........pp..', '', '..pp........pp..', '..pp........pp..'],
    left: ['...pppppppppp...', '..pp............', '', '..pp............', '..pp............'],
  }),
  mohawk: (c: string): Accessory => ({
    pal: { m: c },
    down: ['......mmmm......', '......mmmm......', '......mmmm......'],
    up: ['......mmmm......', '......mmmm......', '......mmmm......'],
    left: ['....mmmmmm......', '....mmmmmm......', '....mmmm........'],
  }),
  hood: (c: string, d: string): Accessory => ({
    pal: { c, d },
    down: ['....cccccccc....', '...cccccccccc...', '...cc......cc...', '...cc......cc...', '...cc......cc...', '...ccc....ccc...', '....cc....cc....'],
    up: ['....cccccccc....', '...cccccccccc...', '...cccccccccc...', '...cccccccccc...', '...cccccccccc...', '...dddddddddd...'],
    left: ['....cccccccc....', '...cccccccccc...', '...cc.....ccc...', '...cc.....ccc...', '...cc.....ccc...', '...ccc...cccc...', '....cc...ccc....'],
  }),
  bowtie: (c: string): Accessory => ({
    dy: 7, pal: { r: c },
    down: ['......r..r......', '......rrrr......'],
  }),
  cowboy: (c: string, band: string): Accessory => ({
    pal: { c, b: band },
    down: ['.....cccccc.....', '....cccccccc....', '....bbbbbbbb....', 'cccccccccccccccc', '.cc..........cc.'],
    up: ['.....cccccc.....', '....cccccccc....', '....bbbbbbbb....', 'cccccccccccccccc', '.cc..........cc.'],
    left: ['.....cccccc.....', '....cccccccc....', '....bbbbbbbb....', 'cccccccccccccccc', '.cc..........cc.'],
  }),
  // Shoulder-length hair framing the face + falling down the back. Reads as a
  // distinct (fem) silhouette over the shared 16px body. Hair-coloured overlay.
  longhair: (c: string, dark: string): Accessory => ({
    pal: { h: c, k: dark },
    down: [
      '................',
      '................',
      '..hh........hh..',
      '..hh........hh..',
      '..hh........hh..',
      '..hh........hh..',
      '..hh........hh..',
      '..hh........hh..',
      '..h..........h..',
    ],
    up: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '...hhhhhhhhhh...',
      '..hhhhhhhhhhhh..',
      '...hhhhhhhhhh...',
      '....hhhhhhhh....',
    ],
    left: [
      '................',
      '................',
      '................',
      '................',
      '................',
      '................',
      '..........hhh...',
      '..........hhh...',
      '..........hh....',
      '...........h....',
    ],
  }),
};

const PLAYER_PAL: CharPalette = {
  h: '#4a3322', k: '#352416', s: '#f0c8a0', e: '#222222',
  t: '#3d6e9e', u: '#2c5179', p: '#3b3b46', b: '#6e4a2f',
};

// The 'fem' new-game vibe: same in-code body, warmer brown long hair + a rose
// top so it reads as a clearly different character from the masc default.
const FEM_PAL: CharPalette = {
  h: '#6e4a2f', k: '#4a3120', s: '#f0c8a0', e: '#222222',
  t: '#cf5d8a', u: '#a8466a', p: '#3b3b46', b: '#6e4a2f',
};

// Palette + accessories per character — distinct outfits and silhouettes.
const NPC_DEFS: Record<string, { pal: CharPalette; acc: Accessory[] }> = {
  'npc-denden': { // Doki Doki Discount clerk — red staff cap + store apron
    pal: { h: '#222831', k: '#11151c', s: '#f0c8a0', e: '#222', t: '#c9a227', u: '#9b7d1c', p: '#33424e', b: '#222' },
    acc: [ACC.cap('#d05050', '#9e3a3a'), ACC.apron('#d05050', '#7a2c2c')],
  },
  'npc-konbini': { // night-shift student — visor + green apron
    pal: { h: '#6e4a86', k: '#523463', s: '#f5d3ae', e: '#222', t: '#e8e0d0', u: '#c4bcab', p: '#2f3a4a', b: '#333' },
    acc: [ACC.visor('#2c7a4f'), ACC.apron('#3da26b', '#2c7a4f')],
  },
  'npc-pawn': { // pawn broker — grey hair, permanent sunglasses
    pal: { h: '#8a8a8a', k: '#6b6b6b', s: '#e8c098', e: '#222', t: '#7a3b3b', u: '#5c2c2c', p: '#3a3a3a', b: '#222' },
    acc: [ACC.shades('#16181d')],
  },
  'npc-yakuza': { // Downtown enforcer — slicked black hair, black suit, shades
    pal: { h: '#15151a', k: '#0a0a0d', s: '#caa27c', e: '#222', t: '#23272e', u: '#15171c', p: '#1a1d24', b: '#0d0d10' },
    acc: [ACC.shades('#16181d')],
  },
  'npc-vampire': { // David — pale, dark hair, red eyes, black cloak
    pal: { h: '#1a1620', k: '#0d0a12', s: '#dcd4d0', e: '#7a1a1a', t: '#2a2030', u: '#1a1424', p: '#16121d', b: '#0d0a12' },
    acc: [],
  },
  'npc-casino': { // Kaiju Palace dealer — yakuza-sharp: black tux, gold bowtie, shades
    pal: { h: '#15151a', k: '#0a0a0d', s: '#caa27c', e: '#222', t: '#1a1d24', u: '#101218', p: '#15171c', b: '#0d0d10' },
    acc: [ACC.bowtie('#c9a227'), ACC.shades('#16181d')],
  },
  'npc-granny': { // Granny Sato — silver hair, round glasses
    pal: { h: '#dcdcdc', k: '#b8b8b8', s: '#eec6a2', e: '#222', t: '#a86b8a', u: '#82506a', p: '#5a5a6a', b: '#444' },
    acc: [ACC.glasses('#6b5d4f', '#cfe2ee')],
  },
  'npc-kid': { // neighborhood kid — blue cap
    pal: { h: '#1d2430', k: '#10151e', s: '#f0c8a0', e: '#222', t: '#d05050', u: '#a83c3c', p: '#33508a', b: '#333' },
    acc: [ACC.cap('#33508a', '#24395f')],
  },
  'npc-skater': { // Tony — skater bro: red beanie, grey hoodie, baggy jeans
    pal: { h: '#3a2a1a', k: '#241a10', s: '#e8b890', e: '#222', t: '#6e7682', u: '#54595f', p: '#2f3a4a', b: '#1a1a1a' },
    acc: [ACC.beanie('#d05050', '#9e3a3a')],
  },
  'npc-oldman': { // shore fisherman — bucket hat, waders
    pal: { h: '#9a9a9a', k: '#7a7a7a', s: '#d8b088', e: '#222', t: '#5a6a4a', u: '#46543a', p: '#3a4250', b: '#2c3038' },
    acc: [ACC.bucket('#7a6a44')],
  },
  'npc-mechanic': { // Kojima — orange beanie, oil-stained work apron
    pal: { h: '#222', k: '#111', s: '#e0b890', e: '#222', t: '#3a4250', u: '#2c323e', p: '#5a4d42', b: '#222' },
    acc: [ACC.beanie('#e07840', '#b35c2c'), ACC.apron('#6b6b6b', '#4a4a4a')],
  },
  'npc-dj': { // club DJ — headphones
    pal: { h: '#3a2a4a', k: '#281c34', s: '#caa27c', e: '#222', t: '#16181d', u: '#0c0d10', p: '#222831', b: '#111' },
    acc: [ACC.headphones('#ffd24a')],
  },
  'npc-dancer': { // pink mohawk regular
    pal: { h: '#caa27c', k: '#b08a64', s: '#caa27c', e: '#222', t: '#7a3b8a', u: '#5c2c68', p: '#222831', b: '#222' },
    acc: [ACC.mohawk('#e857a8')],
  },
  'npc-bartender': { // bowtie, slicked hair
    pal: { h: '#16181d', k: '#0c0d10', s: '#f0c8a0', e: '#222', t: '#e8e0d0', u: '#c4bcab', p: '#222831', b: '#111' },
    acc: [ACC.bowtie('#d05050')],
  },
  'npc-sketchy': { // hood up, you never see his hair
    pal: { h: '#2c3038', k: '#1d2026', s: '#d8b088', e: '#222', t: '#2c3038', u: '#1d2026', p: '#222831', b: '#111' },
    acc: [ACC.hood('#2c3038', '#1d2026')],
  },
  'npc-collector': { // gacha hall keeper — thick glasses, mustard cardigan
    pal: { h: '#4a3322', k: '#352416', s: '#f0c8a0', e: '#222', t: '#c9a227', u: '#9b7d1c', p: '#5a5a6a', b: '#444' },
    acc: [ACC.glasses('#222', '#e8f0f4')],
  },
  'npc-hatvendor': { // Tex — beach souvenir cowboy
    pal: { h: '#7a5c3e', k: '#5c4430', s: '#dca878', e: '#222', t: '#e8e0d0', u: '#c4bcab', p: '#33508a', b: '#6e4a2f' },
    acc: [ACC.cowboy('#b08a50', '#6e4a2f')],
  },
  'npc-tourist': { // Jean-Pierre — beret, breton stripes, very lost
    pal: { h: '#3a2a1a', k: '#2a1d10', s: '#f0c8a0', e: '#222', t: '#e8e0d0', u: '#3d6e9e', p: '#2f3a4a', b: '#6e4a2f' },
    acc: [ACC.beanie('#d05050', '#9e3a3a')],
  },
  'npc-miko': { // shrine maiden — white kosode, vermillion hakama
    pal: { h: '#16181d', k: '#0c0d10', s: '#f0c8a0', e: '#222', t: '#f4f0e8', u: '#d8d2c4', p: '#c0392b', b: '#fff' },
    acc: [ACC.bowtie('#c0392b')],
  },
  'npc-bingus': { // Bingus Doofelsmurt — eccentric museum curator: wild white hair, teal tweed, round glasses + a bowtie
    pal: { h: '#e8e4dc', k: '#c4c0b6', s: '#eec6a2', e: '#222', t: '#2c7a6e', u: '#1f5a52', p: '#3a3322', b: '#4a3120' },
    acc: [ACC.glasses('#c9a227', '#e8f0f4'), ACC.bowtie('#b06ad0')],
  },
};

const drawOverlay = (canvas: HTMLCanvasElement, acc: Accessory, rows?: string[]) => {
  if (!rows) return;
  const ctx = canvas.getContext('2d')!;
  const dy = acc.dy ?? 0;
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const col = acc.pal[row[x]];
      if (col) { ctx.fillStyle = col; ctx.fillRect(x, dy + y, 1, 1); }
    }
  });
};

const addCharacter = (atlas: Atlas, key: string, pal: CharPalette, accs: Accessory[] = []) => {
  const p = pal as unknown as Record<string, string>;
  const d0 = strSprite(BODY_DOWN_0, p), d1 = strSprite(BODY_DOWN_1, p);
  const u0 = strSprite(BODY_UP_0, p), u1 = strSprite(BODY_UP_1, p);
  const l0 = strSprite(BODY_LEFT_0, p), l1 = strSprite(BODY_LEFT_1, p);
  for (const acc of accs) {
    drawOverlay(d0, acc, acc.down); drawOverlay(d1, acc, acc.down);
    drawOverlay(u0, acc, acc.up); drawOverlay(u1, acc, acc.up);
    drawOverlay(l0, acc, acc.left); drawOverlay(l1, acc, acc.left);
  }
  atlas[`${key}-down-0`] = d0; atlas[`${key}-down-1`] = d1;
  atlas[`${key}-up-0`] = u0; atlas[`${key}-up-1`] = u1;
  atlas[`${key}-left-0`] = l0; atlas[`${key}-left-1`] = l1;
  atlas[`${key}-right-0`] = mirror(l0); atlas[`${key}-right-1`] = mirror(l1);
};

// The backrooms merchant — not built on the human body.
const MONSTER_ROWS = [
  '....m......m....',
  '....mm....mm....',
  '..mmmmmmmmmmmm..',
  '.mmmmmmmmmmmmmm.',
  '.mmyymmmmmmyymm.',
  '.mmyymmmmmmyymm.',
  '.mmmmmmmmmmmmmm.',
  '.mmmmmwwwwmmmmm.',
  '.mmmmw....wmmmm.',
  '.mmmmmwwwwmmmmm.',
  '.mmmmmmmmmmmmmm.',
  '..mmmmmmmmmmmm..',
  '..mmm.mmmm.mmm..',
  '..mm...mm...mm..',
  '..m....mm....m..',
  '................',
];
const addMonster = (atlas: Atlas) => {
  const c = strSprite(MONSTER_ROWS, { m: '#2a1f38', y: '#ffd24a', w: '#e8e0d0' });
  // Club Kaiju's most loyal patron — same silhouette, very different vibe
  const k = strSprite(MONSTER_ROWS, { m: '#3e6e3a', y: '#ffd24a', w: '#aef0a0' });
  for (const dir of ['down', 'up', 'left', 'right']) {
    atlas[`npc-monster-${dir}-0`] = c;
    atlas[`npc-monster-${dir}-1`] = c;
    atlas[`npc-kaiju-${dir}-0`] = k;
    atlas[`npc-kaiju-${dir}-1`] = k;
  }
};

// Mine crawlers — skittering shadows with too many eyes.
const CRAWLER_0 = [
  '................',
  '................',
  '................',
  '....cc....cc....',
  '...cccc..cccc...',
  '..cccccccccccc..',
  '..ccyccccccycc..',
  '..cccccccccccc..',
  '..ccccyccyc.cc..',
  '...cccccccccc...',
  '..c..cc..cc..c..',
  '.c...c....c...c.',
  '................',
  '................',
  '................',
  '................',
];
const CRAWLER_1 = [
  '................',
  '................',
  '................',
  '....cc....cc....',
  '...cccc..cccc...',
  '..cccccccccccc..',
  '..ccyccccccycc..',
  '..cccccccccccc..',
  '..cc.cyccycccc..',
  '...cccccccccc...',
  '..cc..cc..cc....',
  '...c...c...c....',
  '................',
  '................',
  '................',
  '................',
];
const addCrawler = (atlas: Atlas) => {
  atlas['crawler-0'] = strSprite(CRAWLER_0, { c: '#1d1924', y: '#e857a8' });
  atlas['crawler-1'] = strSprite(CRAWLER_1, { c: '#1d1924', y: '#e857a8' });
};

// Fast crawler — lean, narrow, spindly legs.
const CRAWLER_FAST_0 = [
  '................',
  '................',
  '................',
  '......cccc......',
  '.....cccccc.....',
  '....cycccyc.....',
  '....cccccccc....',
  '....cc.cc.cc....',
  '.....cccccc.....',
  '...c.c.cc.c.c...',
  '..c..........c..',
  '................',
  '................',
  '................',
  '................',
  '................',
];
const CRAWLER_FAST_1 = [
  '................',
  '................',
  '................',
  '......cccc......',
  '.....cccccc.....',
  '....cycccyc.....',
  '....cccccccc....',
  '....cc.cc.cc....',
  '.....cccccc.....',
  '..c.c.cc.c.c....',
  '...c..........c.',
  '................',
  '................',
  '................',
  '................',
  '................',
];
// Tank crawler — bulky, wide, heavy body with stubby legs.
const CRAWLER_TANK_0 = [
  '................',
  '...cc......cc...',
  '..cccc....cccc..',
  '.cccccccccccccc.',
  'cccccccccccccccc',
  'ccyccccccccyccc.',
  'cccccccccccccccc',
  '.cccccccccccccc.',
  '.cccccccccccccc.',
  '..cc.cc.cc.cc...',
  '..c..c..c..c....',
  '................',
  '................',
  '................',
  '................',
  '................',
];
const CRAWLER_TANK_1 = [
  '................',
  '...cc......cc...',
  '..cccc....cccc..',
  '.cccccccccccccc.',
  'cccccccccccccccc',
  'ccyccccccccyccc.',
  'cccccccccccccccc',
  '.cccccccccccccc.',
  '.cccccccccccccc.',
  '.cc.cc.cc.cc.cc.',
  '.c..c..c..c..c..',
  '................',
  '................',
  '................',
  '................',
  '................',
];
const addCrawlerVariants = (atlas: Atlas) => {
  atlas['crawler-fast-0'] = strSprite(CRAWLER_FAST_0, { c: '#241d2e', y: '#7ce8e0' });
  atlas['crawler-fast-1'] = strSprite(CRAWLER_FAST_1, { c: '#241d2e', y: '#7ce8e0' });
  atlas['crawler-tank-0'] = strSprite(CRAWLER_TANK_0, { c: '#1a1622', y: '#ff7cc4' });
  atlas['crawler-tank-1'] = strSprite(CRAWLER_TANK_1, { c: '#1a1622', y: '#ff7cc4' });
  atlas['crawler-gold-0'] = strSprite(CRAWLER_0, { c: '#bd9a3a', y: '#fff0b0' });
  atlas['crawler-gold-1'] = strSprite(CRAWLER_1, { c: '#bd9a3a', y: '#fff0b0' });
};

// ---- Tiles (16x16, procedural) ------------------------------------------

type Draw = (ctx: CanvasRenderingContext2D) => void;
const tile = (draw: Draw, w = 16, h = 16): HTMLCanvasElement => {
  const [c, ctx] = canvas(w, h);
  draw(ctx);
  return c;
};
const fill = (ctx: CanvasRenderingContext2D, col: string) => { ctx.fillStyle = col; ctx.fillRect(0, 0, 16, 16); };
// Deterministic per-tile speckle so tiles look identical every frame.
const speckle = (ctx: CanvasRenderingContext2D, col: string, seed: number, n: number) => {
  ctx.fillStyle = col;
  let a = seed;
  for (let i = 0; i < n; i++) {
    a = (a * 1103515245 + 12345) & 0x7fffffff;
    const x = a % 16; a = (a * 1103515245 + 12345) & 0x7fffffff;
    const y = a % 16;
    ctx.fillRect(x, y, 1, 1);
  }
};

const buildTiles = (atlas: Atlas) => {
  // Apartment
  atlas['t-wood'] = tile(ctx => {
    fill(ctx, '#a9805a');
    ctx.fillStyle = '#96704c';
    ctx.fillRect(0, 5, 16, 1); ctx.fillRect(0, 11, 16, 1);
    ctx.fillStyle = '#8a6644'; ctx.fillRect(4, 0, 1, 5); ctx.fillRect(11, 6, 1, 5); ctx.fillRect(6, 12, 1, 4);
    speckle(ctx, '#b58c66', 7, 6);
  });
  atlas['t-tatami'] = tile(ctx => {
    fill(ctx, '#9aa86b');
    ctx.fillStyle = '#8a975d';
    for (let y = 1; y < 16; y += 3) ctx.fillRect(0, y, 16, 1);
    ctx.fillStyle = '#76844c'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 15, 16, 1);
  });
  atlas['t-wall-in'] = tile(ctx => {
    fill(ctx, '#5a4d42');
    ctx.fillStyle = '#6e6055'; ctx.fillRect(0, 0, 16, 3);
    ctx.fillStyle = '#4a3f36'; ctx.fillRect(0, 13, 16, 3);
  });
  atlas['t-wall-paper'] = tile(ctx => {
    fill(ctx, '#cfc4ab');
    ctx.fillStyle = '#c2b69b';
    for (let x = 2; x < 16; x += 5) ctx.fillRect(x, 0, 1, 16);
    ctx.fillStyle = '#8d8064'; ctx.fillRect(0, 14, 16, 2);
  });
  atlas['t-window-in'] = tile(ctx => {
    fill(ctx, '#cfc4ab');
    ctx.fillStyle = '#8d8064'; ctx.fillRect(0, 14, 16, 2);
    ctx.fillStyle = '#3a3f4a'; ctx.fillRect(2, 2, 12, 10);
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(3, 3, 10, 8);
    ctx.fillStyle = '#c7e0f4'; ctx.fillRect(4, 4, 3, 2);
    ctx.fillStyle = '#3a3f4a'; ctx.fillRect(7, 3, 1, 8); ctx.fillRect(3, 6, 10, 1);
  });
  atlas['t-door'] = tile(ctx => {
    fill(ctx, '#4a3f36');
    ctx.fillStyle = '#7a5c3e'; ctx.fillRect(2, 1, 12, 15);
    ctx.fillStyle = '#674c32'; ctx.fillRect(3, 2, 10, 13);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(11, 8, 2, 2);
  });
  atlas['t-doormat'] = tile(ctx => {
    fill(ctx, '#a9805a');
    ctx.fillStyle = '#7a8a96'; ctx.fillRect(2, 3, 12, 10);
    ctx.fillStyle = '#5f6e79'; ctx.fillRect(3, 4, 10, 8);
    ctx.fillStyle = '#7a8a96'; ctx.fillRect(4, 7, 8, 1);
  });

  // City
  atlas['t-road'] = tile(ctx => { fill(ctx, '#3a3a42'); speckle(ctx, '#44444d', 3, 8); });
  atlas['t-road-line'] = tile(ctx => {
    fill(ctx, '#3a3a42'); speckle(ctx, '#44444d', 5, 8);
    ctx.fillStyle = '#d8d8c8'; ctx.fillRect(2, 7, 5, 2); ctx.fillRect(10, 7, 5, 2);
  });
  atlas['t-sidewalk'] = tile(ctx => {
    fill(ctx, '#9aa0a6');
    ctx.fillStyle = '#878d93'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 8, 16, 1);
    ctx.fillRect(8, 0, 1, 8); ctx.fillRect(3, 9, 1, 7); ctx.fillRect(12, 9, 1, 7);
    speckle(ctx, '#a8aeb4', 11, 5);
  });
  atlas['t-grass'] = tile(ctx => {
    fill(ctx, '#5e8a4f');
    speckle(ctx, '#6f9e5e', 13, 10);                                                  // light blades
    speckle(ctx, '#4d7440', 17, 8);                                                   // shadow blades
    speckle(ctx, '#7cb86a', 53, 4);                                                   // sun-tip highlights
    ctx.fillStyle = '#557e46'; ctx.fillRect(3, 6, 1, 2); ctx.fillRect(12, 11, 1, 2); ctx.fillRect(8, 3, 1, 2); // short blade strokes
  });
  atlas['t-grass-v1'] = tile(ctx => {
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 13, 8); speckle(ctx, '#4d7440', 17, 5); speckle(ctx, '#7cb86a', 53, 3);
    ctx.fillStyle = '#7cb86a'; ctx.fillRect(4, 9, 1, 3); ctx.fillRect(6, 8, 1, 4); ctx.fillRect(5, 7, 1, 2); // tuft
    ctx.fillStyle = '#e8d4f4'; ctx.fillRect(11, 4, 2, 2); ctx.fillStyle = '#ffd24a'; ctx.fillRect(11, 4, 1, 1); // tiny flower
  });
  atlas['t-grass-v2'] = tile(ctx => {                                                 // clover + daisy patch (walkable detail)
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 31, 8); speckle(ctx, '#4d7440', 37, 5);
    ctx.fillStyle = '#4d7440'; ctx.fillRect(3, 10, 2, 1); ctx.fillRect(4, 9, 1, 1); ctx.fillRect(3, 9, 1, 1); // clover leaf
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(10, 5, 1, 1); ctx.fillRect(12, 5, 1, 1); ctx.fillRect(11, 4, 1, 1); ctx.fillRect(11, 6, 1, 1); // daisy petals
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(11, 5, 1, 1);                             // daisy center
    ctx.fillStyle = '#e857a8'; ctx.fillRect(6, 12, 1, 1);                             // stray bloom
  });
  atlas['t-sand'] = tile(ctx => { fill(ctx, '#cdbb8e'); speckle(ctx, '#bda979', 19, 8); speckle(ctx, '#dccb9f', 23, 6); });
  atlas['t-sand-v1'] = tile(ctx => {
    fill(ctx, '#cdbb8e'); speckle(ctx, '#bda979', 19, 6); speckle(ctx, '#dccb9f', 23, 5);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(4, 10, 3, 2); ctx.fillRect(5, 9, 1, 1); // shell
    ctx.fillStyle = '#b4a279'; ctx.fillRect(11, 5, 2, 1);
  });
  // Layered sea: stacked depth bands (kept identical between frames so the water
  // doesn't bob vertically) + drifting ripple crests / shimmer / foam that shift
  // frame-to-frame for the shimmer animation.
  const waterBase = (ctx: CanvasRenderingContext2D, m1: number, m2: number) => {
    fill(ctx, '#2e5e8e');                                    // mid sea
    ctx.fillStyle = '#27517c'; ctx.fillRect(0, 6, 16, 5);    // mid-depth band
    ctx.fillStyle = '#244c75'; ctx.fillRect(0, 11, 16, 5);   // deep band
    speckle(ctx, '#3d6e9e', m1, 10);                         // sunlit mottle
    speckle(ctx, '#244c75', m2, 8);                          // depth mottle
    ctx.fillStyle = '#1c3a5c'; ctx.fillRect(0, 15, 16, 1);   // deepest seam
  };
  atlas['t-water-0'] = tile(ctx => {
    waterBase(ctx, 101, 137);
    ctx.fillStyle = '#50a0d0'; ctx.fillRect(2, 3, 5, 1); ctx.fillRect(9, 8, 4, 1); ctx.fillRect(5, 12, 3, 1); // ripple crests
    ctx.fillStyle = '#6da3cf'; ctx.fillRect(3, 3, 2, 1); ctx.fillRect(10, 8, 2, 1);                            // shimmer
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(3, 3, 1, 1); ctx.fillRect(13, 6, 1, 1);                            // foam sparkle
  });
  atlas['t-water-1'] = tile(ctx => {
    waterBase(ctx, 113, 149);
    ctx.fillStyle = '#50a0d0'; ctx.fillRect(9, 4, 5, 1); ctx.fillRect(1, 9, 4, 1); ctx.fillRect(10, 13, 3, 1); // ripple crests
    ctx.fillStyle = '#6da3cf'; ctx.fillRect(10, 4, 2, 1); ctx.fillRect(2, 9, 2, 1);                            // shimmer
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(11, 4, 1, 1); ctx.fillRect(2, 12, 1, 1);                           // foam sparkle
  });
  // Building facades (used as solid wall rows in the city) — ledge, lit/dark
  // windows, sills, and a roofline strip for depth.
  const facade = (base: string, dark: string, win: string, lit: string, seed: number) => tile(ctx => {
    fill(ctx, base);
    ctx.fillStyle = lighten(base); ctx.fillRect(0, 0, 16, 2);          // roof ledge highlight
    ctx.fillStyle = dark; ctx.fillRect(0, 2, 16, 1);                   // ledge shadow
    ctx.fillStyle = dark; ctx.fillRect(0, 14, 16, 2);                  // floor line
    // two windows; deterministic "lights on" per tile flavor
    const litLeft = seed % 2 === 0, litRight = seed % 3 === 0;
    ctx.fillStyle = litLeft ? lit : win; ctx.fillRect(2, 4, 4, 6);
    ctx.fillStyle = litRight ? lit : win; ctx.fillRect(10, 4, 4, 6);
    ctx.fillStyle = dark; ctx.fillRect(2, 7, 4, 1); ctx.fillRect(10, 7, 4, 1); // mullions
    ctx.fillStyle = lighten(base); ctx.fillRect(2, 10, 4, 1); ctx.fillRect(10, 10, 4, 1); // sills
    ctx.fillStyle = dark; ctx.fillRect(7, 5, 1, 6);                    // drainpipe
  });
  const lighten = (hex: string) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, ((n >> 16) & 255) + 26), g = Math.min(255, ((n >> 8) & 255) + 26), b = Math.min(255, (n & 255) + 26);
    return `rgb(${r},${g},${b})`;
  };
  atlas['t-bld-a'] = facade('#7d8a99', '#5d6873', '#36404e', '#ffe9a0', 2);
  atlas['t-bld-b'] = facade('#a08a78', '#7d6a5a', '#3e4654', '#ffe9a0', 3);
  atlas['t-bld-c'] = facade('#8a7d99', '#69607a', '#36404e', '#ffe9a0', 6);
  atlas['t-bld-plain'] = tile(ctx => {
    fill(ctx, '#6e7682');
    ctx.fillStyle = '#7e8692'; ctx.fillRect(0, 0, 16, 2);
    ctx.fillStyle = '#5d6470'; ctx.fillRect(0, 2, 16, 1); ctx.fillRect(0, 14, 16, 2);
    ctx.fillStyle = '#3e4654'; ctx.fillRect(3, 5, 3, 5); ctx.fillRect(10, 5, 3, 5);
    ctx.fillStyle = '#7e8692'; ctx.fillRect(3, 10, 3, 1); ctx.fillRect(10, 10, 3, 1);
    speckle(ctx, '#7a828e', 29, 5);
  });
  atlas['t-awning-red'] = tile(ctx => {
    fill(ctx, '#c94f4f');
    ctx.fillStyle = '#e8e0d0'; for (let x = 0; x < 16; x += 4) ctx.fillRect(x, 0, 2, 16);
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(0, 13, 16, 3);
  });
  atlas['t-awning-blue'] = tile(ctx => {
    fill(ctx, '#3d6e9e');
    ctx.fillStyle = '#e8e0d0'; for (let x = 0; x < 16; x += 4) ctx.fillRect(x, 0, 2, 16);
    ctx.fillStyle = '#2c5179'; ctx.fillRect(0, 13, 16, 3);
  });
  atlas['t-vending'] = tile(ctx => {
    fill(ctx, '#c94f4f');
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 14, 16, 2);
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(2, 2, 12, 6);
    ctx.fillStyle = '#d05050'; ctx.fillRect(3, 3, 2, 3);
    ctx.fillStyle = '#50a0d0'; ctx.fillRect(6, 3, 2, 3);
    ctx.fillStyle = '#50c878'; ctx.fillRect(9, 3, 2, 3);
    ctx.fillStyle = '#222'; ctx.fillRect(2, 10, 8, 3);
  });

  // Home — Nakatomi Apartments (the player's building front in the city).
  // Warm residential facade with cozy lit windows + a lettered sign over the door.
  atlas['t-apt-wall'] = tile(ctx => {
    fill(ctx, '#b08a6a');                                          // warm plaster
    ctx.fillStyle = '#c4a07c'; ctx.fillRect(0, 0, 16, 2);          // top ledge highlight
    ctx.fillStyle = '#8a6644'; ctx.fillRect(0, 2, 16, 1);          // ledge shadow
    ctx.fillStyle = '#8a6644'; ctx.fillRect(0, 14, 16, 2);         // floor line
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(4, 5, 8, 6);           // window frame
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(5, 6, 6, 4);          // warm-lit glass
    ctx.fillStyle = '#c9a227'; ctx.fillRect(5, 6, 6, 1);           // glow top
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(8, 5, 1, 6); ctx.fillRect(5, 8, 6, 1); // mullions
    ctx.fillStyle = '#c4a07c'; ctx.fillRect(4, 11, 8, 1);          // sill
    speckle(ctx, '#a8825f', 61, 6);                                // plaster texture
  });
  // 3×5 pixel micro-font for the building sign (only the letters NAKATOMI need).
  const FONT3x5: Record<string, string[]> = {
    N: ['# #', '## ', '# #', ' ##', '# #'],
    A: ['###', '# #', '###', '# #', '# #'],
    K: ['# #', '## ', '## ', '# #', '# #'],
    T: ['###', ' # ', ' # ', ' # ', ' # '],
    O: ['###', '# #', '# #', '# #', '###'],
    M: ['# #', '###', '# #', '# #', '# #'],
    I: ['###', ' # ', ' # ', ' # ', '###'],
  };
  const drawText3x5 = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, col: string) => {
    ctx.fillStyle = col;
    let cx = x;
    for (const ch of text) {
      const g = FONT3x5[ch];
      if (g) g.forEach((row, ry) => { for (let rx = 0; rx < 3; rx++) if (row[rx] === '#') ctx.fillRect(cx + rx, y + ry, 1, 1); });
      cx += 4;
    }
  };
  const naktomiSign = (text: string) => tile(ctx => {
    fill(ctx, '#b08a6a');                                          // plaster behind the board
    ctx.fillStyle = '#2c2230'; ctx.fillRect(0, 3, 16, 9);          // dark sign board (full width → joins neighbor tile)
    ctx.fillStyle = '#c0392b'; ctx.fillRect(0, 3, 16, 1);          // red top trim
    ctx.fillStyle = '#1d1826'; ctx.fillRect(0, 11, 16, 1);         // bottom shadow
    drawText3x5(ctx, text, 1, 5, '#ffe9a0');                       // warm-gold lettering
  });
  atlas['t-nakatomi-l'] = naktomiSign('NAKA');
  atlas['t-nakatomi-r'] = naktomiSign('TOMI');
  atlas['t-planter'] = tile(ctx => {                               // flowering planter flanking the entrance
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 73, 5);
    ctx.fillStyle = '#4d7440'; ctx.fillRect(4, 4, 8, 5);          // foliage
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(5, 4, 3, 2); ctx.fillRect(9, 5, 2, 2);
    ctx.fillStyle = '#e857a8'; ctx.fillRect(6, 4, 1, 1); ctx.fillRect(10, 5, 1, 1); // blooms
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(8, 6, 1, 1);
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(4, 9, 8, 5);          // terracotta pot
    ctx.fillStyle = '#8a6644'; ctx.fillRect(4, 9, 8, 1);          // pot rim
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(4, 13, 8, 1);
  });

  // Shore foraging finds — small props drawn over the sand (transparent bg, so
  // the beach shows through). Each sits low-center on its tile.
  atlas['t-forage-shell'] = tile(ctx => {            // spiral shell
    ctx.fillStyle = '#e8d2b0'; ctx.fillRect(6, 8, 5, 5);
    ctx.fillStyle = '#d8b890'; ctx.fillRect(6, 8, 5, 2); ctx.fillRect(6, 8, 2, 5);
    ctx.fillStyle = '#c99a78'; ctx.fillRect(8, 10, 2, 2);
    ctx.fillStyle = '#fff4e4'; ctx.fillRect(7, 9, 1, 1);
  });
  atlas['t-forage-wood'] = tile(ctx => {             // driftwood stick
    ctx.fillStyle = '#a98a68'; ctx.fillRect(4, 10, 9, 3);
    ctx.fillStyle = '#c4a884'; ctx.fillRect(4, 10, 9, 1);
    ctx.fillStyle = '#856648'; ctx.fillRect(4, 12, 9, 1);
    ctx.fillStyle = '#6e5238'; ctx.fillRect(7, 11, 1, 1); ctx.fillRect(10, 11, 1, 1);
  });
  atlas['t-forage-glass'] = tile(ctx => {            // sea glass
    ctx.fillStyle = '#7ec8a0'; ctx.fillRect(6, 9, 4, 4);
    ctx.fillStyle = '#a4e4c0'; ctx.fillRect(6, 9, 4, 1); ctx.fillRect(6, 9, 1, 4);
    ctx.fillStyle = '#5aa080'; ctx.fillRect(9, 12, 1, 1);
    ctx.fillStyle = '#e8fff4'; ctx.fillRect(7, 10, 1, 1);
  });
  atlas['t-forage-coin'] = tile(ctx => {             // lost coins
    ctx.fillStyle = '#caa23a'; ctx.fillRect(5, 9, 4, 4); ctx.fillRect(8, 10, 4, 4);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(5, 9, 4, 1); ctx.fillRect(8, 10, 4, 1);
    ctx.fillStyle = '#8a6a1e'; ctx.fillRect(5, 12, 4, 1); ctx.fillRect(8, 13, 4, 1);
    ctx.fillStyle = '#fff4c4'; ctx.fillRect(6, 10, 1, 1); ctx.fillRect(9, 11, 1, 1);
  });

  // Shop interiors
  atlas['t-shopfloor'] = tile(ctx => {
    fill(ctx, '#d8d2c4');
    ctx.fillStyle = '#c8c2b2'; ctx.fillRect(0, 0, 8, 8); ctx.fillRect(8, 8, 8, 8);
  });
  atlas['t-counter'] = tile(ctx => {
    fill(ctx, '#6e4a2f');
    ctx.fillStyle = '#8a6644'; ctx.fillRect(0, 0, 16, 5);
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(0, 5, 16, 1);
  });
  atlas['t-shelf'] = tile(ctx => {
    fill(ctx, '#7a6a58');
    ctx.fillStyle = '#5f5244'; ctx.fillRect(0, 5, 16, 1); ctx.fillRect(0, 11, 16, 1); ctx.fillRect(0, 15, 16, 1);
    const goods = ['#d05050', '#50a0d0', '#c9a227', '#50c878', '#a86b8a', '#e8e0d0'];
    let g = 0;
    for (const y of [1, 7, 12]) for (let x = 1; x < 15; x += 3) {
      ctx.fillStyle = goods[g++ % goods.length]; ctx.fillRect(x, y, 2, 3);
    }
  });
  atlas['t-fridge-case'] = tile(ctx => {
    fill(ctx, '#b8c4cc');
    ctx.fillStyle = '#dce8f0'; ctx.fillRect(2, 2, 12, 10);
    ctx.fillStyle = '#50a0d0'; ctx.fillRect(3, 3, 3, 4); ctx.fillRect(7, 3, 3, 4);
    ctx.fillStyle = '#50c878'; ctx.fillRect(11, 3, 2, 4);
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(0, 13, 16, 3);
  });

  // Bad side of town
  atlas['t-sidewalk-bad'] = tile(ctx => {
    fill(ctx, '#6e7276');
    ctx.fillStyle = '#5a5e62'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 8, 16, 1); ctx.fillRect(8, 0, 1, 8);
    ctx.fillStyle = '#4a4e52'; ctx.fillRect(3, 4, 6, 1); ctx.fillRect(11, 11, 4, 1); // cracks
    speckle(ctx, '#7c8084', 31, 5);
  });
  atlas['t-asphalt'] = tile(ctx => {
    fill(ctx, '#2c2c32');
    speckle(ctx, '#36363c', 37, 8);
    ctx.fillStyle = '#222226'; ctx.fillRect(2, 9, 7, 1);
  });
  atlas['t-bld-club'] = tile(ctx => {
    fill(ctx, '#2a2333');
    ctx.fillStyle = '#1d1826'; ctx.fillRect(0, 14, 16, 2);
    ctx.fillStyle = '#e857a8'; ctx.fillRect(2, 4, 12, 2);
    ctx.fillStyle = '#7ce8e0'; ctx.fillRect(2, 8, 8, 1);
  });
  atlas['t-bld-garage'] = tile(ctx => {
    fill(ctx, '#7a7468');
    ctx.fillStyle = '#665f54';
    for (let y = 2; y < 16; y += 4) ctx.fillRect(0, y, 16, 1); // corrugation
    ctx.fillStyle = '#564f44'; ctx.fillRect(0, 14, 16, 2);
  });
  atlas['t-bld-grim'] = tile(ctx => {
    fill(ctx, '#4a4640');
    ctx.fillStyle = '#3a362f'; ctx.fillRect(0, 14, 16, 2);
    ctx.fillStyle = '#5c5850'; ctx.fillRect(2, 3, 4, 5); ctx.fillRect(10, 3, 4, 5); // boarded windows
    ctx.fillStyle = '#3a362f'; ctx.fillRect(2, 4, 4, 1); ctx.fillRect(10, 6, 4, 1);
  });
  atlas['t-graffiti'] = tile(ctx => {
    fill(ctx, '#4a4640');
    ctx.fillStyle = '#3a362f'; ctx.fillRect(0, 14, 16, 2);
    ctx.fillStyle = '#e857a8'; ctx.fillRect(2, 5, 3, 2); ctx.fillRect(6, 7, 2, 3);
    ctx.fillStyle = '#7ce8a0'; ctx.fillRect(9, 4, 4, 2); ctx.fillRect(12, 8, 2, 2);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(4, 10, 6, 1);
  });
  atlas['t-bld-neon'] = tile(ctx => { // Kabukicho wall of stacked signboards
    fill(ctx, '#1d1826');
    const blocks: [number, number, number, number, string][] = [
      [1, 1, 6, 3, '#e857a8'], [9, 1, 6, 3, '#7ce8e0'],
      [1, 5, 4, 3, '#ffd24a'], [6, 5, 9, 3, '#d05050'],
      [1, 9, 7, 3, '#7ce8a0'], [9, 9, 6, 3, '#b06ad0'],
    ];
    for (const [x, y, w, h, c] of blocks) {
      ctx.fillStyle = c; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = '#16121d'; ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
      ctx.fillStyle = c; ctx.fillRect(x + 2, y + 1, w - 4, 1);
    }
    ctx.fillStyle = '#16121d'; ctx.fillRect(0, 13, 16, 3);
  });
  atlas['t-chochin'] = tile(ctx => { // red paper lantern on the sidewalk
    fill(ctx, '#6e7276');
    ctx.fillStyle = '#5a5e62'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 8, 16, 1);
    ctx.fillStyle = '#4a3f36'; ctx.fillRect(7, 1, 2, 3);
    ctx.fillStyle = '#d05050'; ctx.fillRect(5, 4, 6, 8);
    ctx.fillStyle = '#e8746a'; ctx.fillRect(6, 5, 2, 6);
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(5, 7, 6, 1); ctx.fillRect(5, 10, 6, 1);
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(7, 6, 2, 2);
    ctx.fillStyle = '#4a3f36'; ctx.fillRect(6, 12, 4, 2);
  });
  atlas['t-vending-dead'] = tile(ctx => {
    fill(ctx, '#7a4444');
    ctx.fillStyle = '#5c3434'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 14, 16, 2);
    ctx.fillStyle = '#3c3c40'; ctx.fillRect(2, 2, 12, 6);
    ctx.fillStyle = '#2c2c30'; ctx.fillRect(2, 10, 8, 3);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(4, 4, 1, 1); // one dying light
  });

  // Nightclub
  atlas['t-club-floor'] = tile(ctx => { fill(ctx, '#1d1826'); speckle(ctx, '#2a2333', 41, 6); });
  atlas['t-dance-0'] = tile(ctx => {
    fill(ctx, '#3a2a55');
    ctx.fillStyle = '#e857a8'; ctx.fillRect(0, 0, 8, 8);
    ctx.fillStyle = '#7ce8e0'; ctx.fillRect(8, 8, 8, 8);
  });
  atlas['t-dance-1'] = tile(ctx => {
    fill(ctx, '#3a2a55');
    ctx.fillStyle = '#7ce8e0'; ctx.fillRect(0, 0, 8, 8);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(8, 8, 8, 8);
  });
  atlas['t-dance-2'] = tile(ctx => {
    fill(ctx, '#3a2a55');
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(0, 0, 8, 8);
    ctx.fillStyle = '#b06ad0'; ctx.fillRect(8, 8, 8, 8);
  });
  atlas['t-dance-3'] = tile(ctx => {
    fill(ctx, '#3a2a55');
    ctx.fillStyle = '#b06ad0'; ctx.fillRect(0, 0, 8, 8);
    ctx.fillStyle = '#e857a8'; ctx.fillRect(8, 8, 8, 8);
  });
  atlas['t-djbooth'] = tile(ctx => {
    fill(ctx, '#16181d');
    ctx.fillStyle = '#2a2333'; ctx.fillRect(0, 0, 16, 5);
    ctx.fillStyle = '#444c58'; ctx.fillRect(2, 7, 5, 5); ctx.fillRect(9, 7, 5, 5);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(4, 9, 1, 1); ctx.fillRect(11, 9, 1, 1);
  });

  // Garage
  atlas['t-garage-floor'] = tile(ctx => {
    fill(ctx, '#9a9aa0');
    ctx.fillStyle = '#8a8a90'; ctx.fillRect(0, 7, 16, 1); ctx.fillRect(7, 0, 1, 16); // expansion joints
    speckle(ctx, '#a6a6ac', 43, 6);
    speckle(ctx, '#8e8e94', 47, 4);
  });
  atlas['t-garage-stain'] = tile(ctx => {
    fill(ctx, '#9a9aa0');
    ctx.fillStyle = '#8a8a90'; ctx.fillRect(0, 7, 16, 1); ctx.fillRect(7, 0, 1, 16);
    ctx.fillStyle = '#4a4a52'; ctx.fillRect(3, 8, 7, 4); ctx.fillRect(5, 6, 4, 2);
    ctx.fillStyle = '#3a3a42'; ctx.fillRect(5, 9, 3, 2);
  });
  atlas['t-metal'] = tile(ctx => {
    fill(ctx, '#7a828e');
    ctx.fillStyle = '#69707c';
    for (let y = 1; y < 16; y += 3) ctx.fillRect(0, y, 16, 1);
    ctx.fillStyle = '#8d95a1'; for (let y = 2; y < 16; y += 3) ctx.fillRect(0, y, 16, 1);
    ctx.fillStyle = '#5a626e'; ctx.fillRect(0, 14, 16, 2);
  });
  atlas['t-toolbench'] = tile(ctx => {
    fill(ctx, '#5a4d42');
    ctx.fillStyle = '#6e6055'; ctx.fillRect(0, 0, 16, 6);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(2, 1, 3, 2);
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(7, 1, 2, 4); ctx.fillRect(11, 2, 4, 1);
    ctx.fillStyle = '#d05050'; ctx.fillRect(12, 4, 3, 1);
    ctx.fillStyle = '#4a3f36'; ctx.fillRect(0, 6, 16, 1);
  });
  atlas['t-lift'] = tile(ctx => {
    fill(ctx, '#9a9aa0');
    ctx.fillStyle = '#c9a227'; ctx.fillRect(0, 0, 16, 2); ctx.fillRect(0, 14, 16, 2); // painted bay
    ctx.fillStyle = '#6a6a72'; ctx.fillRect(1, 3, 14, 10);
    ctx.fillStyle = '#7c7c84'; ctx.fillRect(2, 4, 12, 8);
    ctx.fillStyle = '#5a5a62'; ctx.fillRect(7, 3, 2, 10); // hydraulic seam
  });
  atlas['t-tires'] = tile(ctx => {
    fill(ctx, '#9a9aa0');
    ctx.fillStyle = '#16181d'; ctx.fillRect(3, 8, 10, 7); ctx.fillRect(4, 3, 8, 6);
    ctx.fillStyle = '#2c3038'; ctx.fillRect(5, 4, 6, 1); ctx.fillRect(5, 9, 6, 1) ; ctx.fillRect(4, 12, 8, 1);
    ctx.fillStyle = '#3c424a'; ctx.fillRect(7, 5, 2, 2); ctx.fillRect(7, 10, 2, 2);
  });
  atlas['t-hazard'] = tile(ctx => {
    fill(ctx, '#9a9aa0');
    for (let i = -2; i < 5; i++) {
      ctx.fillStyle = '#ffd24a'; ctx.fillRect(i * 6 + 2, 12, 3, 4);
      ctx.fillStyle = '#16181d'; ctx.fillRect(i * 6 + 5, 12, 3, 4);
    }
    ctx.fillStyle = '#8a8a90'; ctx.fillRect(0, 11, 16, 1);
  });

  // Backrooms
  atlas['t-backwall'] = tile(ctx => {
    fill(ctx, '#b0a050');
    ctx.fillStyle = '#988a40'; ctx.fillRect(0, 5, 16, 1); ctx.fillRect(0, 11, 16, 1);
    ctx.fillStyle = '#887a36'; ctx.fillRect(0, 14, 16, 2);
    speckle(ctx, '#c4b462', 47, 4);
  });
  atlas['t-backfloor'] = tile(ctx => {
    fill(ctx, '#8a7e46');
    speckle(ctx, '#7a6e3c', 53, 9);
    speckle(ctx, '#988a50', 59, 5);
  });
  atlas['t-portal-0'] = tile(ctx => {
    fill(ctx, '#16181d');
    ctx.fillStyle = '#7a3b8a'; ctx.fillRect(3, 3, 10, 10);
    ctx.fillStyle = '#b06ad0'; ctx.fillRect(5, 5, 6, 6);
    ctx.fillStyle = '#e8d4f4'; ctx.fillRect(7, 7, 2, 2);
  });
  atlas['t-portal-1'] = tile(ctx => {
    fill(ctx, '#16181d');
    ctx.fillStyle = '#b06ad0'; ctx.fillRect(3, 3, 10, 10);
    ctx.fillStyle = '#7a3b8a'; ctx.fillRect(5, 5, 6, 6);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(7, 7, 2, 2);
  });
  // Walk-in freezer door — fits in beside the drink cases. Look closely.
  atlas['t-freezer'] = tile(ctx => {
    fill(ctx, '#aab4bc');
    ctx.fillStyle = '#c8d2d8'; ctx.fillRect(2, 1, 12, 12);
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(2, 1, 12, 1); ctx.fillRect(12, 5, 2, 4); // frame + handle
    ctx.fillStyle = '#e8f4f8'; ctx.fillRect(3, 2, 4, 3); ctx.fillRect(8, 9, 3, 2);  // frost
    ctx.fillStyle = '#6b7680'; ctx.fillRect(0, 13, 16, 3);
    ctx.fillStyle = '#b06ad0'; ctx.fillRect(5, 13, 6, 1); // faint glow under the door
  });

  // Gacha hall
  atlas['t-gacha'] = tile(ctx => {
    fill(ctx, '#d05050');
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(0, 0, 16, 2); ctx.fillRect(0, 13, 16, 3);
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(2, 3, 12, 7);
    const balls = ['#ffd24a', '#7ce8a0', '#50a0d0', '#e857a8', '#e07840'];
    balls.forEach((b, i) => { ctx.fillStyle = b; ctx.fillRect(3 + (i % 4) * 3, 4 + Math.floor(i / 4) * 3, 2, 2); });
    ctx.fillStyle = '#222'; ctx.fillRect(6, 11, 4, 2);
  });

  // Casino (Kaiju Palace) — burgundy carpet, red slot cabinets, green felt tables
  atlas['t-casino-front'] = tile(ctx => {              // exterior: one continuous gold marquee (tiles seamlessly L-R)
    fill(ctx, '#1d0d14');                                                          // dark facade
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(0, 10, 16, 6);                         // red lower wall
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(0, 10, 16, 1);
    ctx.fillStyle = '#6a1d28'; ctx.fillRect(0, 15, 16, 1);                         // wall base shadow
    // gold marquee band — drawn full-width (no per-tile centering) so a row of
    // these reads as ONE sign instead of repeated boxes.
    ctx.fillStyle = '#b08a50'; ctx.fillRect(0, 2, 16, 7);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(0, 3, 16, 5);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(0, 4, 16, 3);                          // bright face
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(0, 4, 16, 1);                          // top sheen
    ctx.fillStyle = '#c9a227'; ctx.fillRect(0, 2, 16, 1); ctx.fillRect(0, 8, 16, 1); // frame edges
    ctx.fillStyle = '#ffe9a0';                                                     // bulb rows, evenly spaced across tiles
    for (let x = 1; x < 16; x += 3) { ctx.fillRect(x, 0, 1, 1); ctx.fillRect(x, 9, 1, 1); }
  });
  // Tokyo shopping-street lamp post (sidewalk furniture). Base matches the
  // sidewalk so it blends like the chochin lantern; warm glowing head up top.
  atlas['t-streetlamp'] = tile(ctx => {
    fill(ctx, '#6e7276');
    ctx.fillStyle = '#5a5e62'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 8, 16, 1); // seam lines (match chochin)
    ctx.fillStyle = '#3a4250'; ctx.fillRect(7, 5, 2, 10);                          // pole
    ctx.fillStyle = '#6e7682'; ctx.fillRect(7, 5, 1, 10);                          // pole highlight
    ctx.fillStyle = '#2c3038'; ctx.fillRect(5, 14, 6, 1);                          // foot
    ctx.fillStyle = '#3a4250'; ctx.fillRect(4, 5, 8, 1);                           // crossarm
    ctx.fillStyle = '#2c3038'; ctx.fillRect(5, 1, 6, 4);                           // lamp housing
    ctx.fillStyle = '#3a4250'; ctx.fillRect(4, 0, 8, 1);                           // cap
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(6, 2, 4, 2);                           // warm glow
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(6, 3, 4, 1);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(7, 2, 2, 1);                           // hot center
  });
  atlas['t-casino-carpet'] = tile(ctx => {
    fill(ctx, '#7a2230');
    ctx.fillStyle = '#8e2a38'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 8, 16, 1);
    speckle(ctx, '#6a1d28', 83, 8);
    ctx.fillStyle = '#c9a227';                              // gold diamond motif
    ctx.fillRect(7, 2, 2, 1); ctx.fillRect(6, 3, 4, 1); ctx.fillRect(5, 4, 6, 1); ctx.fillRect(6, 5, 4, 1); ctx.fillRect(7, 6, 2, 1);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7, 4, 2, 1);    // lit center
  });
  atlas['t-casino-wall'] = tile(ctx => {
    fill(ctx, '#2a1822');
    ctx.fillStyle = '#3a2230'; ctx.fillRect(0, 0, 16, 3);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(0, 3, 16, 1);   // gold trim band
    ctx.fillStyle = '#1d1018'; ctx.fillRect(0, 13, 16, 3);
    ctx.fillStyle = '#e857a8'; ctx.fillRect(2, 6, 2, 4); ctx.fillRect(12, 6, 2, 4); // neon sconces
    ctx.fillStyle = '#ffd5ec'; ctx.fillRect(2, 6, 1, 4); ctx.fillRect(12, 6, 1, 4);
  });
  atlas['t-slot'] = tile(ctx => {
    fill(ctx, '#2a1822');
    ctx.fillStyle = '#c0392b'; ctx.fillRect(2, 1, 12, 14);  // red cabinet
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(2, 1, 12, 1); ctx.fillRect(2, 14, 12, 1);
    ctx.fillStyle = '#16181d'; ctx.fillRect(3, 3, 10, 5);   // reel window
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(4, 4, 2, 3);
    ctx.fillStyle = '#7ce8e0'; ctx.fillRect(7, 4, 2, 3);
    ctx.fillStyle = '#e857a8'; ctx.fillRect(10, 4, 2, 3);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(3, 9, 10, 3);   // payline panel
    ctx.fillStyle = '#16181d'; ctx.fillRect(5, 10, 6, 1);
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(14, 5, 1, 4);   // lever arm
    ctx.fillStyle = '#d05050'; ctx.fillRect(14, 4, 2, 2);   // lever knob
  });
  atlas['t-blackjack'] = tile(ctx => {
    fill(ctx, '#2a1822');
    ctx.fillStyle = '#2c6e44'; ctx.fillRect(1, 3, 14, 11);  // green felt
    ctx.fillStyle = '#368351'; ctx.fillRect(1, 3, 14, 2);   // felt highlight
    ctx.fillStyle = '#1f5233'; ctx.fillRect(1, 12, 14, 2);  // felt shadow
    ctx.fillStyle = '#c9a227'; ctx.fillRect(1, 7, 14, 1);   // gold bet arc
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(4, 8, 3, 4); ctx.fillRect(9, 8, 3, 4); // two dealt cards
    ctx.fillStyle = '#c0392b'; ctx.fillRect(5, 9, 1, 1);
    ctx.fillStyle = '#16181d'; ctx.fillRect(10, 9, 1, 1);
  });
  // Roulette table = a 2-tile prop: left tile is the wheel, right tile the felt
  // betting layout. Author neutral; the gold/green read matches the other tables.
  atlas['t-roulette'] = tile(ctx => {                       // wheel half
    fill(ctx, '#2a1822');
    ctx.fillStyle = '#1f5233'; ctx.fillRect(1, 2, 15, 12);  // felt to the right edge (meets the layout)
    ctx.fillStyle = '#2c6e44'; ctx.fillRect(1, 2, 15, 2);   // felt highlight
    // wheel disk — gold rim, drawn as stacked rows for a round silhouette
    const rim: [number, number, number][] = [[6,3,4],[5,4,6],[4,5,8],[3,6,10],[3,7,10],[3,8,10],[3,9,10],[4,10,8],[5,11,6],[6,12,4]];
    ctx.fillStyle = '#c9a227'; for (const [x,y,w] of rim) ctx.fillRect(x,y,w,1);
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(4,5,8,1);       // rim top highlight
    // pocket ring (black) inside the rim
    const ring: [number, number, number][] = [[6,4,4],[5,5,6],[4,6,8],[4,7,8],[4,8,8],[4,9,8],[5,10,6],[6,11,4]];
    ctx.fillStyle = '#16181d'; for (const [x,y,w] of ring) ctx.fillRect(x,y,w,1);
    // alternating red pockets around the ring
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(6,4,2,1); ctx.fillRect(10,5,1,1); ctx.fillRect(4,6,2,1); ctx.fillRect(11,8,1,1); ctx.fillRect(5,10,2,1); ctx.fillRect(9,11,1,1);
    // gold spokes + hub
    ctx.fillStyle = '#c9a227'; ctx.fillRect(7,5,2,6); ctx.fillRect(5,7,6,2);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7,7,2,2);       // hub
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(9,6,1,1);       // the ball
  });
  atlas['t-roulette-felt'] = tile(ctx => {                  // betting-layout half
    fill(ctx, '#2a1822');
    ctx.fillStyle = '#1f5233'; ctx.fillRect(0, 2, 15, 12);  // felt (meets the wheel on the left)
    ctx.fillStyle = '#2c6e44'; ctx.fillRect(0, 2, 15, 2);
    ctx.fillStyle = '#1a4429'; ctx.fillRect(0, 12, 15, 2);  // felt shadow
    ctx.fillStyle = '#c9a227';                              // gold grid lines
    for (let x = 1; x < 15; x += 3) ctx.fillRect(x, 4, 1, 8);
    ctx.fillRect(0, 7, 15, 1);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(2, 5, 1, 1); ctx.fillRect(8, 5, 1, 1); ctx.fillRect(5, 9, 1, 1); ctx.fillRect(11, 9, 1, 1); // red cells
    ctx.fillStyle = '#16181d'; ctx.fillRect(5, 5, 1, 1); ctx.fillRect(11, 5, 1, 1); ctx.fillRect(2, 9, 1, 1); ctx.fillRect(8, 9, 1, 1); // black cells
    ctx.fillStyle = '#e857a8'; ctx.fillRect(12, 3, 2, 1);   // stacked chips
    ctx.fillStyle = '#7ce8e0'; ctx.fillRect(12, 2, 2, 1);
  });

  // Museum (Bingus Doofelsmurt's gallery) — pale marble, cream walls, gilt frames
  atlas['t-museum-floor'] = tile(ctx => {                    // pale marble with faint veins + tile seams
    fill(ctx, '#d4ccba');
    ctx.fillStyle = '#c6bda8';                                // seams (parquet/marble grid)
    ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 8, 16, 1); ctx.fillRect(8, 0, 1, 8); ctx.fillRect(3, 9, 1, 7);
    speckle(ctx, '#e0d8c8', 29, 5);
    ctx.fillStyle = '#bcb09a'; ctx.fillRect(2, 3, 3, 1); ctx.fillRect(11, 11, 3, 1); // hairline veins
  });
  // A museum wall + its picture rail + wainscot — the gallery's bones.
  const museumWall = (ctx: CanvasRenderingContext2D) => {
    fill(ctx, '#cfc4ab');                                     // cream plaster
    ctx.fillStyle = '#bdb094'; ctx.fillRect(0, 0, 16, 3);     // top band
    ctx.fillStyle = '#c9a227'; ctx.fillRect(0, 3, 16, 1);     // gold picture rail
    ctx.fillStyle = '#a89a7c'; ctx.fillRect(0, 13, 16, 3);    // wainscot base
  };
  atlas['t-museum-wall'] = tile(museumWall);
  // A floor plinth/pedestal (empty). Solid. Sits on the marble floor.
  const plinth = (ctx: CanvasRenderingContext2D) => {
    fill(ctx, '#d4ccba');                                     // floor under it
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(3, 14, 11, 2); // contact shadow
    ctx.fillStyle = '#b8ae98'; ctx.fillRect(4, 4, 8, 11);     // column body
    ctx.fillStyle = '#8a8070'; ctx.fillRect(4, 4, 1, 11);     // side shade
    ctx.fillStyle = '#e0d8c4'; ctx.fillRect(3, 2, 10, 2);     // cap
    ctx.fillStyle = '#cfc6b0'; ctx.fillRect(4, 4, 8, 1);      // cap underline highlight
    ctx.fillStyle = '#9a907a'; ctx.fillRect(3, 14, 10, 1);    // base lip
  };
  atlas['t-pedestal'] = tile(plinth);
  atlas['t-pedestal-full'] = tile(ctx => {                    // plinth + a generic gilded artifact on top
    plinth(ctx);
    ctx.fillStyle = '#8a6a30'; ctx.fillRect(6, 0, 5, 3);      // artifact (a small urn) base
    ctx.fillStyle = '#c9a227'; ctx.fillRect(6, 0, 4, 2);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(6, 0, 2, 1);      // highlight
    ctx.fillStyle = '#ffffff'; ctx.fillRect(7, 0, 1, 1);      // sparkle
  });
  // A wall picture frame (empty), mounted on the museum wall row.
  atlas['t-frame-empty'] = tile(ctx => {
    museumWall(ctx);
    ctx.fillStyle = '#8a6a30'; ctx.fillRect(3, 4, 10, 8);     // frame body
    ctx.fillStyle = '#c9a227';                                // gilt edges
    ctx.fillRect(3, 4, 10, 1); ctx.fillRect(3, 11, 10, 1); ctx.fillRect(3, 4, 1, 8); ctx.fillRect(12, 4, 1, 8);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(4, 5, 8, 6);      // blank canvas
    ctx.fillStyle = '#b8ae98'; ctx.fillRect(7, 12, 2, 1);     // empty nameplate
  });
  atlas['t-frame-full'] = tile(ctx => {                       // frame + a little painting
    museumWall(ctx);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(2, 3, 12, 10);    // gold frame
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(2, 3, 12, 1);
    ctx.fillStyle = '#8a6a30'; ctx.fillRect(3, 4, 10, 8);     // inner lip
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(4, 5, 8, 6);      // sky
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(9, 6, 2, 2);      // sun
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(4, 9, 8, 2);      // hill
    ctx.fillStyle = '#c9a227'; ctx.fillRect(6, 12, 4, 1);     // nameplate
  });
  // Museum exterior facade — neoclassical pale stone with seamless fluting,
  // so a row of these reads as one stately storefront amid grimy Downtown.
  atlas['t-museum-front'] = tile(ctx => {
    fill(ctx, '#bcb4a4');
    ctx.fillStyle = '#c8c0b0'; ctx.fillRect(0, 0, 16, 2);     // cornice
    ctx.fillStyle = '#a89e8c'; ctx.fillRect(0, 2, 16, 1);     // cornice shadow
    ctx.fillStyle = '#a89e8c'; for (let x = 2; x < 16; x += 4) ctx.fillRect(x, 3, 1, 12);     // flute shade
    ctx.fillStyle = '#cec6b6'; for (let x = 3; x < 16; x += 4) ctx.fillRect(x, 3, 1, 12);     // flute highlight
    ctx.fillStyle = '#8a8070'; ctx.fillRect(0, 15, 16, 1);    // base shadow
  });

  // Mines
  atlas['t-cave-wall'] = tile(ctx => {
    fill(ctx, '#2a2430');
    ctx.fillStyle = '#3a3344'; ctx.fillRect(1, 2, 5, 4); ctx.fillRect(9, 7, 5, 5); ctx.fillRect(4, 11, 4, 3);
    ctx.fillStyle = '#1d1924'; ctx.fillRect(0, 14, 16, 2);
  });
  atlas['t-cave-floor'] = tile(ctx => {
    fill(ctx, '#4a4252');
    speckle(ctx, '#564d60', 61, 7);
    speckle(ctx, '#3e3746', 67, 5);
  });
  atlas['t-hole'] = tile(ctx => {
    fill(ctx, '#8a7e46'); // backrooms carpet around it
    ctx.fillStyle = '#16121d'; ctx.fillRect(2, 3, 12, 11);
    ctx.fillStyle = '#2a2430'; ctx.fillRect(3, 4, 10, 2);
    ctx.fillStyle = '#5a4d42'; ctx.fillRect(3, 5, 2, 9); ctx.fillRect(7, 5, 2, 9); ctx.fillRect(11, 5, 2, 9); // ladder rails
  });
  atlas['t-ladder-up'] = tile(ctx => {
    fill(ctx, '#4a4252');
    ctx.fillStyle = '#8a6644'; ctx.fillRect(4, 0, 2, 16); ctx.fillRect(10, 0, 2, 16);
    for (let y = 2; y < 16; y += 4) { ctx.fillStyle = '#a9805a'; ctx.fillRect(4, y, 8, 1); }
  });
  const ore = (color: string) => tile(ctx => {
    fill(ctx, '#4a4252');
    ctx.fillStyle = '#3a3344'; ctx.fillRect(2, 6, 12, 9); ctx.fillRect(4, 4, 8, 3);
    ctx.fillStyle = color; ctx.fillRect(5, 7, 3, 3); ctx.fillRect(9, 9, 3, 2); ctx.fillRect(7, 5, 2, 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(5, 7, 1, 1); ctx.fillRect(9, 9, 1, 1);
  });
  atlas['ore-shard'] = ore('#ffd24a');
  atlas['ore-crystal'] = ore('#7ce8e0');
  atlas['ore-opal'] = ore('#b06ad0');
  // Coal: lumpy dull chunks, barely any sparkle.
  atlas['ore-coal'] = tile(ctx => {
    fill(ctx, '#4a4252');
    ctx.fillStyle = '#3a3344'; ctx.fillRect(2, 6, 12, 9); ctx.fillRect(4, 4, 8, 3);
    ctx.fillStyle = '#5a5a66'; ctx.fillRect(5, 7, 3, 3); ctx.fillRect(9, 9, 3, 2); ctx.fillRect(7, 5, 2, 2);
    ctx.fillStyle = '#444450'; ctx.fillRect(6, 10, 2, 2); ctx.fillRect(10, 7, 2, 2); // dull lumps
    ctx.fillStyle = '#ffffff'; ctx.fillRect(5, 7, 1, 1); // faint single glint
  });
  atlas['ore-iron'] = ore('#c0a890');
  // Starstone: brightest pink astral gem, two white highlights (rarest).
  atlas['ore-starstone'] = tile(ctx => {
    fill(ctx, '#4a4252');
    ctx.fillStyle = '#3a3344'; ctx.fillRect(2, 6, 12, 9); ctx.fillRect(4, 4, 8, 3);
    ctx.fillStyle = '#ff7cc4'; ctx.fillRect(5, 7, 3, 3); ctx.fillRect(9, 9, 3, 2); ctx.fillRect(7, 5, 2, 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(5, 7, 1, 1); ctx.fillRect(9, 9, 1, 1); ctx.fillRect(7, 5, 1, 1);
  });
  // Geode: sealed grey rock with a sparkle peeking through a thin diagonal crack.
  atlas['ore-geode'] = tile(ctx => {
    fill(ctx, '#4a4252');
    ctx.fillStyle = '#3a3344'; ctx.fillRect(3, 5, 10, 9); ctx.fillRect(4, 4, 8, 1); ctx.fillRect(4, 14, 8, 1); // round lump
    ctx.fillStyle = '#2f2a3a'; ctx.fillRect(3, 12, 10, 2); // base shadow
    ctx.fillStyle = '#4a4358'; ctx.fillRect(4, 5, 6, 1); // top lit edge
    ctx.fillStyle = '#16121d'; ctx.fillRect(6, 6, 1, 6); ctx.fillRect(7, 7, 1, 4); // dark crack
    ctx.fillStyle = '#7ce8e0'; ctx.fillRect(6, 8, 1, 1); ctx.fillRect(7, 9, 1, 1); // inner sparkle
    ctx.fillStyle = '#ffffff'; ctx.fillRect(6, 8, 1, 1);
  });
  // Descend ladder: wood rails up top fading into a dark hole below.
  atlas['t-ladder-down'] = tile(ctx => {
    fill(ctx, '#4a4252');
    ctx.fillStyle = '#16121d'; ctx.fillRect(2, 6, 12, 10); // dark hole (lower half)
    ctx.fillStyle = '#221c2c'; ctx.fillRect(2, 6, 12, 2); // hole rim
    ctx.fillStyle = '#8a6644'; ctx.fillRect(4, 0, 2, 16); ctx.fillRect(10, 0, 2, 16); // rails into the dark
    for (let y = 2; y < 16; y += 4) { ctx.fillStyle = '#a9805a'; ctx.fillRect(4, y, 8, 1); }
  });

  // Pickaxe item icons — transparent bg (UI), wooden handle + metal head.
  const pick = (head: string, glint?: string) => tile(ctx => {
    ctx.fillStyle = '#8a6644'; for (let i = 0; i < 8; i++) ctx.fillRect(6 + i, 5 + i, 2, 2); // diagonal handle
    ctx.fillStyle = '#6e4a2f'; for (let i = 0; i < 8; i++) ctx.fillRect(7 + i, 6 + i, 1, 1); // handle shade
    ctx.fillStyle = head;
    ctx.fillRect(2, 3, 12, 2);                                  // head bar
    ctx.fillRect(2, 2, 3, 1); ctx.fillRect(11, 2, 3, 1);        // point tops
    ctx.fillRect(1, 4, 2, 1); ctx.fillRect(13, 4, 2, 1);        // point tips
    if (glint) { ctx.fillStyle = glint; ctx.fillRect(4, 3, 2, 1); }
  });
  atlas['pick-tin'] = pick('#9a9aa6');
  atlas['pick-steel'] = pick('#c4ccd6', '#e6ecf2');
  atlas['pick-diamond'] = pick('#bfeef0', '#ffffff');
  // Geode inventory icon — centered grey rock with cyan sparkle crack.
  atlas['i-geode'] = tile(ctx => {
    ctx.fillStyle = '#3a3344'; ctx.fillRect(4, 4, 8, 9); ctx.fillRect(5, 3, 6, 1); ctx.fillRect(5, 13, 6, 1);
    ctx.fillStyle = '#2f2a3a'; ctx.fillRect(4, 11, 8, 2); // base shadow
    ctx.fillStyle = '#4a4358'; ctx.fillRect(5, 4, 5, 1);  // top lit edge
    ctx.fillStyle = '#16121d'; ctx.fillRect(7, 5, 1, 6); ctx.fillRect(8, 6, 1, 4); // crack
    ctx.fillStyle = '#7ce8e0'; ctx.fillRect(7, 7, 1, 1); ctx.fillRect(8, 8, 1, 1); // sparkle
    ctx.fillStyle = '#ffffff'; ctx.fillRect(7, 7, 1, 1);
  });

  // Shrine grounds
  // Torii gate, built across a 2×2 footprint: the two LEG tiles below
  // (t-torii) and the two TOP tiles above (t-torii-top = leg + crossbar), with
  // the crossbar continuing over the walkable path tiles (t-torii-beam). All
  // share one continuous vermillion beam so the gate reads as one structure.
  const toriiBeam = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(0, 0, 16, 4);   // kasagi (top beam) body
    ctx.fillStyle = '#c0392b'; ctx.fillRect(0, 1, 16, 2);   // beam face
    ctx.fillStyle = '#d8584a'; ctx.fillRect(0, 1, 16, 1);   // top highlight
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(0, 6, 16, 2);   // nuki (second rail)
    ctx.fillStyle = '#c0392b'; ctx.fillRect(0, 6, 16, 1);
  };
  const toriiPost = (ctx: CanvasRenderingContext2D, top: number, h: number) => {
    ctx.fillStyle = '#c0392b'; ctx.fillRect(6, top, 4, h);  // post (slimmer — reads narrower)
    ctx.fillStyle = '#d8584a'; ctx.fillRect(6, top, 1, h);  // lit edge
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(9, top, 1, h);  // shadow edge
  };
  // Match t-grass exactly so the gate tiles blend seamlessly into city grass.
  const grassBg = (ctx: CanvasRenderingContext2D) => {
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 13, 10); speckle(ctx, '#4d7440', 17, 6);
  };
  atlas['t-torii'] = tile(ctx => {              // leg (lower half), solid
    grassBg(ctx);
    toriiPost(ctx, 0, 16);
    ctx.fillStyle = '#7a241a'; ctx.fillRect(5, 13, 6, 3);   // base flare (narrower)
    ctx.fillStyle = '#1d1d1d'; ctx.fillRect(5, 15, 6, 1);   // ground contact
  });
  atlas['t-torii-top'] = tile(ctx => {          // leg top + crossbar, solid
    grassBg(ctx);
    toriiPost(ctx, 4, 12);
    toriiBeam(ctx);
  });
  atlas['t-torii-beam'] = tile(ctx => {         // crossbar over the path, walkable
    grassBg(ctx);
    toriiBeam(ctx);
  });
  atlas['t-rock'] = tile(ctx => {               // mossy boulder on grass, solid
    grassBg(ctx);
    ctx.fillStyle = '#6e7682'; ctx.fillRect(3, 7, 10, 7);  // boulder body
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(4, 6, 7, 3);   // sunlit top-left
    ctx.fillStyle = '#5d6470'; ctx.fillRect(9, 9, 3, 4);   // shaded side
    ctx.fillStyle = '#3a4250'; ctx.fillRect(3, 13, 10, 1); // ground contact
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(4, 13, 2, 1); ctx.fillRect(11, 12, 1, 1); // moss
  });
  atlas['t-shrine'] = tile(ctx => {                         // saisen offering box w/ shimenawa rope + bell
    fill(ctx, '#9aa0a6'); // stands on the stone forecourt
    ctx.fillStyle = '#878d93'; ctx.fillRect(0, 0, 16, 1);
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(1, 1, 14, 2);  // shimenawa straw rope
    ctx.fillStyle = '#b08a50'; ctx.fillRect(1, 2, 14, 1);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(4, 1, 1, 2); ctx.fillRect(8, 1, 1, 2); ctx.fillRect(12, 1, 1, 2); // shide paper zigzags
    ctx.fillStyle = '#c9a227'; ctx.fillRect(7, 3, 2, 2);   // brass bell
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(7, 3, 1, 1);
    ctx.fillStyle = '#4a3f36'; ctx.fillRect(2, 5, 12, 2);  // box lid
    ctx.fillStyle = '#8a6644'; ctx.fillRect(3, 7, 10, 7);  // box body
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(3, 7, 10, 1); ctx.fillRect(3, 13, 10, 1); // grain edges
    ctx.fillStyle = '#2c2418'; ctx.fillRect(5, 8, 6, 2);   // coin slot
    ctx.fillStyle = '#a9805a'; ctx.fillRect(4, 7, 1, 6); ctx.fillRect(11, 7, 1, 6); // lit timber edges
  });
  atlas['t-tree'] = tile(ctx => {
    fill(ctx, '#3e5c33');
    ctx.fillStyle = '#4d7440'; ctx.fillRect(1, 1, 6, 5); ctx.fillRect(8, 6, 7, 6); ctx.fillRect(3, 9, 5, 5);
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(2, 2, 3, 2); ctx.fillRect(10, 7, 3, 2); ctx.fillRect(4, 10, 2, 2);
    ctx.fillStyle = '#2e4426'; ctx.fillRect(0, 14, 16, 2);
  });
  atlas['t-stonepath'] = tile(ctx => {
    fill(ctx, '#9aa0a6');
    ctx.fillStyle = '#878d93'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 5, 16, 1); ctx.fillRect(0, 10, 16, 1);
    ctx.fillRect(5, 1, 1, 4); ctx.fillRect(11, 6, 1, 4); ctx.fillRect(7, 11, 1, 5);
    speckle(ctx, '#a8aeb4', 71, 5);
    ctx.fillStyle = '#6f9e5e'; ctx.fillRect(1, 13, 2, 1); ctx.fillRect(13, 2, 2, 1); // moss
  });
  atlas['t-lantern'] = tile(ctx => {
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 73, 5);
    ctx.fillStyle = '#6e7682'; ctx.fillRect(6, 1, 4, 2);   // cap
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(6, 3, 4, 4);   // light box
    ctx.fillStyle = '#5d6470'; ctx.fillRect(5, 3, 1, 4); ctx.fillRect(10, 3, 1, 4);
    ctx.fillStyle = '#6e7682'; ctx.fillRect(7, 7, 2, 6);   // post
    ctx.fillRect(5, 13, 6, 2);                              // base
  });
  atlas['t-shrine-roof'] = tile(ctx => {
    fill(ctx, '#3a4250');                                          // dark slate tiles
    ctx.fillStyle = '#4a5466'; for (let y = 1; y < 16; y += 3) ctx.fillRect(0, y, 16, 1); // tile rows
    ctx.fillStyle = '#525e72'; ctx.fillRect(0, 0, 16, 1);          // sunlit top edge
    ctx.fillStyle = '#c9a227'; ctx.fillRect(0, 1, 16, 1);          // gold ridge cap
    ctx.fillStyle = '#2c3340'; ctx.fillRect(0, 13, 16, 3);         // deep eave shadow
  });
  atlas['t-shrine-wall'] = tile(ctx => {
    fill(ctx, '#b04a3a'); // vermillion timber
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(0, 14, 16, 2);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 3, 5, 8); ctx.fillRect(9, 3, 5, 8); // shoji panels
    ctx.fillStyle = '#b04a3a'; ctx.fillRect(4, 3, 1, 8); ctx.fillRect(11, 3, 1, 8);
    ctx.fillRect(2, 6, 5, 1); ctx.fillRect(9, 6, 5, 1);
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(0, 11, 16, 1);
  });
  atlas['t-komainu'] = tile(ctx => {
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 79, 5);
    ctx.fillStyle = '#8a8d93'; ctx.fillRect(5, 4, 6, 5);   // lion-dog body
    ctx.fillRect(4, 2, 4, 4);                               // head
    ctx.fillStyle = '#6e7178'; ctx.fillRect(5, 3, 1, 1); ctx.fillRect(9, 6, 2, 2);
    ctx.fillStyle = '#a8abb1'; ctx.fillRect(4, 9, 8, 2);   // pedestal top
    ctx.fillStyle = '#8a8d93'; ctx.fillRect(3, 11, 10, 4); // pedestal
  });
  atlas['t-sakura'] = tile(ctx => {                        // cherry-blossom tree, solid
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 83, 5);
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(7, 11, 2, 4);  // trunk
    ctx.fillStyle = '#d98ab0'; ctx.fillRect(2, 2, 12, 9); ctx.fillRect(1, 4, 14, 5); // blossom canopy
    ctx.fillStyle = '#f0b8d4'; ctx.fillRect(3, 2, 6, 3); ctx.fillRect(9, 4, 4, 3);   // sunlit blooms
    ctx.fillStyle = '#c46e96'; ctx.fillRect(3, 9, 10, 2); ctx.fillRect(11, 5, 3, 3); // shaded underside
    ctx.fillStyle = '#ffe9f2'; ctx.fillRect(4, 3, 1, 1); ctx.fillRect(7, 5, 1, 1); ctx.fillRect(10, 6, 1, 1); // petal glints
  });
  atlas['t-maple'] = tile(ctx => {                         // autumn maple, solid
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 89, 5);
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(7, 11, 2, 4);  // trunk
    ctx.fillStyle = '#c0392b'; ctx.fillRect(2, 2, 12, 9); ctx.fillRect(1, 4, 14, 5); // crimson canopy
    ctx.fillStyle = '#e07840'; ctx.fillRect(3, 2, 6, 3); ctx.fillRect(9, 4, 4, 3);   // sunlit orange
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(3, 9, 10, 2); ctx.fillRect(11, 5, 3, 3); // shaded underside
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(4, 3, 1, 1); ctx.fillRect(10, 6, 1, 1);  // gold leaf glints
  });
  atlas['t-toro'] = tile(ctx => {                          // stone ishidoro lantern w/ warm glow, solid
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 91, 5);
    ctx.fillStyle = '#8a8d93'; ctx.fillRect(4, 1, 8, 2);   // kasa (roof cap)
    ctx.fillStyle = '#a8abb1'; ctx.fillRect(4, 1, 8, 1);   // sunlit cap edge
    ctx.fillStyle = '#6e7178'; ctx.fillRect(5, 3, 6, 4);   // hibukuro (light chamber)
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(6, 4, 4, 2);   // warm glow window
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7, 4, 2, 1);
    ctx.fillStyle = '#8a8d93'; ctx.fillRect(6, 7, 4, 5);   // post
    ctx.fillStyle = '#6e7178'; ctx.fillRect(9, 7, 1, 5);   // post shadow
    ctx.fillStyle = '#a8abb1'; ctx.fillRect(4, 12, 8, 2);  // base
    ctx.fillStyle = '#6e7178'; ctx.fillRect(4, 13, 8, 1);
  });
  atlas['t-sakura-petals'] = tile(ctx => {                 // fallen blossom petals on grass (walkable)
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 97, 6); speckle(ctx, '#4d7440', 99, 4);
    ctx.fillStyle = '#f0b8d4'; ctx.fillRect(3, 4, 2, 1); ctx.fillRect(10, 7, 2, 1); ctx.fillRect(6, 11, 2, 1); ctx.fillRect(13, 3, 1, 1);
    ctx.fillStyle = '#d98ab0'; ctx.fillRect(4, 4, 1, 1); ctx.fillRect(11, 7, 1, 1); ctx.fillRect(7, 11, 1, 1);
    ctx.fillStyle = '#ffe9f2'; ctx.fillRect(8, 6, 1, 1); ctx.fillRect(2, 9, 1, 1);
  });

  // Island
  atlas['t-zama-poster'] = tile(ctx => {                    // ZamaZonk billboard on a post (sand)
    fill(ctx, '#e8d49a'); speckle(ctx, '#d8c48a', 41, 6);   // sandy ground
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(7, 9, 2, 7);    // post
    ctx.fillStyle = '#120726'; ctx.fillRect(1, 0, 14, 9);   // dark board
    ctx.fillStyle = '#6a3fb0'; ctx.fillRect(1, 0, 14, 1); ctx.fillRect(1, 8, 14, 1); ctx.fillRect(1, 0, 1, 9); ctx.fillRect(14, 0, 1, 9); // purple frame
    ctx.fillStyle = '#9a6fe0'; ctx.fillRect(4, 2, 8, 5);    // box logo body
    ctx.fillStyle = '#c9a227'; ctx.fillRect(4, 2, 8, 1); ctx.fillRect(7, 2, 2, 5); // gold tape
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(3, 7, 1, 1); ctx.fillRect(12, 7, 1, 1); // sparkle
  });
  atlas['t-tiki'] = tile(ctx => {
    fill(ctx, '#5e8a4f');
    ctx.fillStyle = '#c9a227'; ctx.fillRect(0, 0, 16, 4);   // thatch
    ctx.fillStyle = '#a8841c'; ctx.fillRect(0, 1, 16, 1); ctx.fillRect(0, 3, 16, 1);
    ctx.fillStyle = '#8a6644'; ctx.fillRect(1, 4, 14, 9);   // bamboo counter
    ctx.fillStyle = '#6e4a2f'; for (let x = 2; x < 15; x += 3) ctx.fillRect(x, 4, 1, 9);
    ctx.fillStyle = '#e857a8'; ctx.fillRect(3, 6, 2, 2);    // drink umbrella
    ctx.fillStyle = '#7ce8e0'; ctx.fillRect(10, 6, 3, 3);   // tall glass
    ctx.fillStyle = '#4a3f36'; ctx.fillRect(1, 13, 14, 2);
  });
  atlas['t-buoy'] = tile(ctx => {
    fill(ctx, '#2e5e8e');
    ctx.fillStyle = '#27517c'; ctx.fillRect(0, 8, 16, 8);
    ctx.fillStyle = '#d05050'; ctx.fillRect(6, 3, 4, 6);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(6, 5, 4, 2);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7, 1, 2, 2);    // light
    ctx.fillStyle = '#244c75'; ctx.fillRect(4, 9, 8, 2);    // ripple
  });

  // Beach stand
  atlas['t-parasol'] = tile(ctx => {
    fill(ctx, '#cdbb8e');
    ctx.fillStyle = '#d05050'; ctx.fillRect(2, 1, 12, 3);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(4, 1, 3, 3); ctx.fillRect(10, 1, 3, 3);
    ctx.fillStyle = '#5a4d42'; ctx.fillRect(7, 4, 2, 10);
  });
  atlas['t-crate'] = tile(ctx => {
    fill(ctx, '#cdbb8e');
    ctx.fillStyle = '#8a6644'; ctx.fillRect(2, 5, 12, 9);
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(2, 5, 12, 1); ctx.fillRect(2, 9, 12, 1); ctx.fillRect(7, 5, 1, 9);
    ctx.fillStyle = '#b08a50'; ctx.fillRect(4, 2, 8, 3); // hat on display
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(3, 4, 10, 1);
  });

  // ---- Paris (the secret arc) ------------------------------------------------
  // Cobblestone, Haussmann facades, café/boulangerie fronts, the Seine, and a
  // multi-tile Eiffel Tower. Authored at neutral daytime; engine tints day/night.
  atlas['t-cobble'] = tile(ctx => {
    fill(ctx, '#8b8a86');
    ctx.fillStyle = '#74726d'; // mortar grid
    ctx.fillRect(0, 5, 16, 1); ctx.fillRect(0, 11, 16, 1);
    ctx.fillRect(4, 0, 1, 5); ctx.fillRect(11, 6, 1, 5); ctx.fillRect(7, 12, 1, 4);
    ctx.fillStyle = '#9a988f'; // stone tops, lit upper-left
    ctx.fillRect(1, 1, 2, 3); ctx.fillRect(6, 1, 3, 3); ctx.fillRect(12, 1, 3, 3);
    ctx.fillRect(1, 7, 4, 3); ctx.fillRect(8, 7, 2, 3); ctx.fillRect(12, 7, 3, 3);
    ctx.fillRect(1, 12, 5, 3); ctx.fillRect(9, 12, 5, 3);
    speckle(ctx, '#7f7d77', 83, 5);
  });
  atlas['t-paris-sky'] = tile(ctx => {
    fill(ctx, '#bcd6ec');
    ctx.fillStyle = '#cbe2f2'; ctx.fillRect(0, 0, 16, 6); // brighter up high
    ctx.fillStyle = '#eef5fb'; ctx.fillRect(2, 8, 5, 2); ctx.fillRect(9, 4, 4, 2); // soft clouds
    ctx.fillStyle = '#d8eafa'; ctx.fillRect(3, 10, 4, 1); ctx.fillRect(10, 6, 3, 1);
  });
  atlas['t-paris-bld'] = tile(ctx => {       // Haussmann cream facade (solid)
    fill(ctx, '#d8c9a8');
    ctx.fillStyle = '#3a4250'; ctx.fillRect(0, 0, 16, 3);   // grey mansard roof
    ctx.fillStyle = '#4a5466'; ctx.fillRect(0, 0, 16, 1);
    ctx.fillStyle = '#c4b48f'; ctx.fillRect(0, 3, 16, 1);   // cornice shadow
    ctx.fillStyle = '#5d6470'; ctx.fillRect(2, 5, 4, 7); ctx.fillRect(10, 5, 4, 7);   // tall windows
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(3, 6, 2, 5); ctx.fillRect(11, 6, 2, 5);   // glass
    ctx.fillStyle = '#2c3038'; ctx.fillRect(2, 11, 4, 1); ctx.fillRect(10, 11, 4, 1); // juliet balconies
    ctx.fillStyle = '#b9a884'; ctx.fillRect(0, 14, 16, 2);  // base shadow
  });
  atlas['t-cafe-awning'] = tile(ctx => {     // red-striped café front (solid)
    fill(ctx, '#e8e0d0');
    ctx.fillStyle = '#c0392b'; ctx.fillRect(0, 0, 16, 6);
    ctx.fillStyle = '#e8e0d0'; for (let x = 0; x < 16; x += 4) ctx.fillRect(x, 0, 2, 6);
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(0, 6, 16, 1);
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(0, 7, 16, 9);   // café window below
    ctx.fillStyle = '#caa46a'; ctx.fillRect(2, 9, 12, 5);
    ctx.fillStyle = '#3a2c1e'; ctx.fillRect(8, 9, 1, 5);
  });
  atlas['t-boulangerie'] = tile(ctx => {     // blue/gold bakery front (solid)
    fill(ctx, '#e8e0d0');
    ctx.fillStyle = '#2e5e8e'; ctx.fillRect(0, 0, 16, 6);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(0, 5, 16, 1); for (let x = 1; x < 16; x += 4) ctx.fillRect(x, 0, 1, 6);
    ctx.fillStyle = '#27517c'; ctx.fillRect(0, 6, 16, 1);
    ctx.fillStyle = '#8a6644'; ctx.fillRect(0, 7, 16, 9);   // window with bread
    ctx.fillStyle = '#caa46a'; ctx.fillRect(2, 9, 12, 5);
    ctx.fillStyle = '#b5651d'; ctx.fillRect(3, 11, 3, 2); ctx.fillRect(7, 10, 3, 2); ctx.fillRect(10, 12, 3, 1);
  });
  atlas['t-paris-door'] = tile(ctx => {      // bistro door (walkable) on cobble
    fill(ctx, '#8b8a86');
    ctx.fillStyle = '#1f3a2a'; ctx.fillRect(2, 0, 12, 16);  // dark green frame
    ctx.fillStyle = '#2e5e44'; ctx.fillRect(3, 1, 10, 14);
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(4, 2, 8, 5);    // glass top
    ctx.fillStyle = '#234a35'; ctx.fillRect(7, 2, 1, 5);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(10, 9, 2, 2);   // brass handle
  });
  atlas['t-paris-tree'] = tile(ctx => {      // pollarded plane tree in a planter
    fill(ctx, '#8b8a86');
    ctx.fillStyle = '#4d7440'; ctx.fillRect(3, 1, 10, 8);   // canopy
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(4, 2, 4, 3); ctx.fillRect(9, 4, 3, 2);
    ctx.fillStyle = '#3e5c33'; ctx.fillRect(7, 8, 2, 3);    // trunk
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(4, 11, 8, 4);   // planter box
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(4, 11, 8, 1);
  });
  atlas['t-quay'] = tile(ctx => {            // stone embankment by the Seine
    fill(ctx, '#9a9488');
    ctx.fillStyle = '#857f73'; ctx.fillRect(0, 5, 16, 1); ctx.fillRect(0, 10, 16, 1);
    ctx.fillRect(5, 0, 1, 5); ctx.fillRect(11, 6, 1, 4);
    ctx.fillStyle = '#6e6a60'; ctx.fillRect(0, 14, 16, 2);  // edge toward the water
    speckle(ctx, '#a8a294', 89, 5);
  });
  // The faint seam in the backrooms wall that becomes the Paris entrance.
  atlas['t-paris-portal'] = tile(ctx => {
    fill(ctx, '#b0a050'); // matches t-backwall base
    ctx.fillStyle = '#988a40'; ctx.fillRect(0, 5, 16, 1); ctx.fillRect(0, 11, 16, 1);
    ctx.fillStyle = '#887a36'; ctx.fillRect(0, 14, 16, 2);
    ctx.fillStyle = '#6e6326'; ctx.fillRect(7, 1, 2, 14); // hairline vertical seam
    ctx.fillStyle = '#c9be6a'; ctx.fillRect(6, 1, 1, 14);
    speckle(ctx, '#c4b462', 47, 4);
  });

  // Eiffel Tower — a 3-wide × 4-tall block: spire '1', upper '3', mid row
  // '5','6','7', base row '8','9','0'. Authored against pale sky; legs mirror.
  const eSky = '#cbe2f2', eFe = '#5a3c24', eFeL = '#7a5638', eFeD = '#3a2616';
  atlas['t-eiffel-1'] = tile(ctx => {        // spire (top, centred)
    fill(ctx, eSky);
    ctx.fillStyle = eFeL; ctx.fillRect(7, 0, 2, 2);
    ctx.fillStyle = eFe; ctx.fillRect(7, 2, 2, 11);         // mast
    ctx.fillStyle = eFe; ctx.fillRect(4, 13, 8, 3);         // top observation deck
    ctx.fillStyle = eFeD; ctx.fillRect(4, 15, 8, 1);
  });
  atlas['t-eiffel-3'] = tile(ctx => {        // upper body, under the spire
    fill(ctx, eSky);
    ctx.fillStyle = eFe; ctx.fillRect(5, 0, 2, 16); ctx.fillRect(9, 0, 2, 16); // uprights
    ctx.fillStyle = eFeL; ctx.fillRect(5, 0, 1, 16);
    ctx.fillStyle = eFeD; for (let y = 1; y < 15; y += 4) ctx.fillRect(6, y, 4, 1); // rungs
    ctx.fillStyle = eFe; ctx.fillRect(3, 12, 10, 3);        // mid platform
    ctx.fillStyle = eFeD; ctx.fillRect(3, 14, 10, 1);
  });
  const eMidL = tile(ctx => {                // mid-left leg slanting out
    fill(ctx, eSky);
    for (let k = 0; k < 16; k++) { const x = 13 - Math.floor(k * 0.5); ctx.fillStyle = eFe; ctx.fillRect(x, k, 3, 1); }
    ctx.fillStyle = eFeD; for (let k = 2; k < 16; k += 4) { const x = 13 - Math.floor(k * 0.5); ctx.fillRect(x, k, 3, 1); }
  });
  atlas['t-eiffel-5'] = eMidL; atlas['t-eiffel-7'] = mirror(eMidL);
  atlas['t-eiffel-6'] = tile(ctx => {        // mid-centre lattice belly + decks
    fill(ctx, eSky);
    ctx.fillStyle = eFe; ctx.fillRect(0, 0, 16, 2);         // upper deck joining the legs
    ctx.fillStyle = eFeL; ctx.fillRect(0, 0, 16, 1);
    ctx.fillStyle = eFe; ctx.fillRect(6, 2, 4, 14);         // central column
    ctx.fillStyle = eFeD; ctx.fillRect(2, 7, 12, 1);        // cross rail
    ctx.fillStyle = eFe; ctx.fillRect(0, 13, 16, 3);        // lower deck
    ctx.fillStyle = eFeD; ctx.fillRect(0, 15, 16, 1);
  });
  const eLegL = tile(ctx => {                // base-left splayed leg + arch shoulder
    fill(ctx, eSky);
    for (let k = 0; k < 16; k++) { const x = 9 - Math.floor(k * 0.5); ctx.fillStyle = eFe; ctx.fillRect(Math.max(0, x), k, 4, 1); }
    ctx.fillStyle = eFeD; ctx.fillRect(0, 13, 7, 3); ctx.fillStyle = eFe; ctx.fillRect(0, 13, 7, 1); // foot
    ctx.fillStyle = eFe; ctx.fillRect(13, 0, 3, 5);         // arch shoulder (inner top)
  });
  atlas['t-eiffel-8'] = eLegL; atlas['t-eiffel-0'] = mirror(eLegL);
  atlas['t-eiffel-9'] = tile(ctx => {        // grand arch (open) under the deck
    fill(ctx, eSky);
    ctx.fillStyle = eFe; ctx.fillRect(0, 0, 16, 3);         // beam joining the legs
    ctx.fillStyle = eFeL; ctx.fillRect(0, 0, 16, 1);
    ctx.fillStyle = eFe; ctx.fillRect(0, 3, 3, 4); ctx.fillRect(13, 3, 3, 4); // arch haunches
    ctx.fillStyle = eFeD; ctx.fillRect(0, 3, 2, 1); ctx.fillRect(14, 3, 2, 1);
    // the middle/bottom stays open sky — the famous arch
  });

  // ---- Community greenhouse ------------------------------------------------
  // Interior glass wall: white frame + pale teal panes.
  atlas['t-gh-glass'] = tile(ctx => {
    fill(ctx, '#a6d4c0');
    ctx.fillStyle = '#cdeede'; ctx.fillRect(2, 2, 5, 5); ctx.fillRect(9, 2, 5, 5); ctx.fillRect(2, 9, 5, 5); ctx.fillRect(9, 9, 5, 5);
    ctx.fillStyle = '#e8f4ec'; ctx.fillRect(2, 2, 2, 2); ctx.fillRect(9, 2, 2, 2);   // pane glints
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(0, 7, 16, 2); ctx.fillRect(7, 0, 2, 16); // white mullion frame
    ctx.fillStyle = '#c4bca8'; ctx.fillRect(0, 14, 16, 2);                            // base shadow
  });
  // Floor: pale gravel flagstones with the odd stray sprout.
  atlas['t-gh-floor'] = tile(ctx => {
    fill(ctx, '#d8cdb0');
    ctx.fillStyle = '#c9bd9e'; ctx.fillRect(0, 5, 16, 1); ctx.fillRect(0, 11, 16, 1); ctx.fillRect(5, 0, 1, 5); ctx.fillRect(10, 6, 1, 5);
    speckle(ctx, '#bfb18e', 61, 7);
    ctx.fillStyle = '#7cb86a'; ctx.fillRect(2, 13, 1, 1); ctx.fillRect(13, 3, 1, 1);
  });
  // Empty soil plot (raised bed): dark tilled earth with furrows.
  atlas['t-gh-soil'] = tile(ctx => {
    fill(ctx, '#5a3c24');
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(0, 0, 16, 2);
    ctx.fillStyle = '#4a3120'; ctx.fillRect(0, 14, 16, 2); ctx.fillRect(2, 5, 12, 1); ctx.fillRect(2, 9, 12, 1); // rim + furrows
    speckle(ctx, '#6e4a2f', 67, 8); speckle(ctx, '#3a2716', 71, 6);
  });
  // Sprinkler valve: standpipe + red hand-wheel.
  atlas['t-gh-sprinkler'] = tile(ctx => {
    fill(ctx, '#d8cdb0');
    ctx.fillStyle = '#6e7682'; ctx.fillRect(7, 4, 2, 11);
    ctx.fillStyle = '#8a8d93'; ctx.fillRect(7, 4, 1, 11);
    ctx.fillStyle = '#a8abb1'; ctx.fillRect(5, 6, 6, 2);                              // valve body
    ctx.fillStyle = '#c0392b'; ctx.fillRect(4, 3, 8, 2); ctx.fillRect(7, 2, 2, 1);    // red wheel
    ctx.fillStyle = '#e07840'; ctx.fillRect(5, 3, 1, 1); ctx.fillRect(10, 3, 1, 1);
    ctx.fillStyle = '#6e7682'; ctx.fillRect(5, 14, 6, 2);                             // base flange
  });
  // Exterior facade (shrine-side entrance): a little glass house.
  atlas['t-gh-front'] = tile(ctx => {
    fill(ctx, '#a6d4c0');
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(0, 0, 16, 2);
    ctx.fillStyle = '#cdeede'; ctx.fillRect(2, 3, 5, 10); ctx.fillRect(9, 3, 5, 10);
    ctx.fillStyle = '#e8f4ec'; ctx.fillRect(2, 3, 2, 3); ctx.fillRect(9, 3, 2, 3);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(7, 2, 2, 14); ctx.fillRect(0, 8, 16, 1);
    ctx.fillStyle = '#7cb86a'; ctx.fillRect(3, 10, 2, 3); ctx.fillRect(11, 9, 2, 4);  // plants behind the glass
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(11, 9, 1, 1);
  });
  // Exterior greenhouse door (walkable).
  atlas['t-gh-door'] = tile(ctx => {
    fill(ctx, '#cdbb8e');
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 0, 12, 15);                            // white frame
    ctx.fillStyle = '#bfe3d0'; ctx.fillRect(4, 1, 8, 12);                             // glass
    ctx.fillStyle = '#cdeede'; ctx.fillRect(4, 1, 3, 5);                              // glint
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(8, 1, 1, 12);                             // center mullion
    ctx.fillStyle = '#c9a227'; ctx.fillRect(6, 7, 2, 2);                              // handle
  });
  // Sunflower growth stages (drawn over a soil plot — transparent background).
  atlas['t-crop-sun-0'] = tile(ctx => {                                              // just-planted seed
    ctx.fillStyle = '#3a2716'; ctx.fillRect(6, 11, 4, 2);
    ctx.fillStyle = '#2c1d10'; ctx.fillRect(7, 10, 2, 1);
    ctx.fillStyle = '#6e9e3a'; ctx.fillRect(7, 9, 1, 1);
  });
  atlas['t-crop-sun-1'] = tile(ctx => {                                              // sprout
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(7, 7, 2, 6);
    ctx.fillStyle = '#6e9e3a'; ctx.fillRect(4, 8, 3, 2); ctx.fillRect(9, 9, 3, 2);
    ctx.fillStyle = '#8fc24f'; ctx.fillRect(4, 8, 1, 1); ctx.fillRect(11, 9, 1, 1);
  });
  atlas['t-crop-sun-2'] = tile(ctx => {                                              // budding
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(7, 5, 2, 9);
    ctx.fillStyle = '#6e9e3a'; ctx.fillRect(3, 8, 4, 2); ctx.fillRect(9, 10, 4, 2);
    ctx.fillStyle = '#8fc24f'; ctx.fillRect(3, 8, 1, 1); ctx.fillRect(12, 10, 1, 1);
    ctx.fillStyle = '#5e8a3a'; ctx.fillRect(5, 2, 6, 4);                              // green bud
    ctx.fillStyle = '#7cb84f'; ctx.fillRect(6, 2, 4, 1);
    ctx.fillStyle = '#caa23a'; ctx.fillRect(7, 4, 2, 1);                             // hint of petal
  });
  atlas['t-crop-sun-3'] = tile(ctx => {                                              // bloom
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(7, 7, 2, 7);
    ctx.fillStyle = '#6e9e3a'; ctx.fillRect(2, 9, 4, 2); ctx.fillRect(10, 10, 4, 2);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(4, 1, 8, 8); ctx.fillRect(3, 3, 10, 4);   // petals
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(5, 1, 2, 1); ctx.fillRect(9, 1, 2, 1); ctx.fillRect(3, 4, 1, 2); ctx.fillRect(12, 4, 1, 2);
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(6, 3, 4, 4);                              // seed disc
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(7, 4, 2, 2);
  });
};

// ---- Furniture (procedural; bed/sofa/futon are 32x16) -------------------

const buildFurniture = (atlas: Atlas) => {
  atlas['f-futon'] = tile(ctx => {
    ctx.fillStyle = '#7a8a96'; ctx.fillRect(0, 4, 32, 10);
    ctx.fillStyle = '#8d9daa'; ctx.fillRect(1, 5, 30, 4);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 5, 6, 8);
  }, 32, 16);
  atlas['f-bed'] = tile(ctx => {
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(0, 2, 32, 13);
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(1, 3, 30, 9);
    ctx.fillStyle = '#5b8cbe'; ctx.fillRect(1, 3, 30, 3);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 4, 7, 7);
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(0, 15, 2, 1); ctx.fillRect(30, 15, 2, 1);
  }, 32, 16);
  atlas['f-sofa'] = tile(ctx => {
    ctx.fillStyle = '#7a3b3b'; ctx.fillRect(0, 3, 32, 12);
    ctx.fillStyle = '#9e4f4f'; ctx.fillRect(2, 7, 28, 6);
    ctx.fillStyle = '#8a4545'; ctx.fillRect(2, 4, 28, 3);
    ctx.fillStyle = '#5c2c2c'; ctx.fillRect(0, 3, 2, 12); ctx.fillRect(30, 3, 2, 12);
  }, 32, 16);
  atlas['f-microwave'] = tile(ctx => {
    ctx.fillStyle = '#c8ccd0'; ctx.fillRect(1, 5, 14, 9);
    ctx.fillStyle = '#222831'; ctx.fillRect(2, 6, 9, 7);
    ctx.fillStyle = '#3a4250'; ctx.fillRect(3, 7, 7, 5);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(12, 7, 2, 1);
    ctx.fillStyle = '#50c878'; ctx.fillRect(12, 9, 2, 1);
  });
  atlas['f-fridge'] = tile(ctx => {
    ctx.fillStyle = '#dce4e8'; ctx.fillRect(2, 0, 12, 16);
    ctx.fillStyle = '#b8c4cc'; ctx.fillRect(2, 6, 12, 1); ctx.fillRect(2, 15, 12, 1);
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(12, 2, 1, 3); ctx.fillRect(12, 8, 1, 4);
  });
  atlas['f-tv'] = tile(ctx => {
    ctx.fillStyle = '#222831'; ctx.fillRect(0, 2, 16, 10);
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(1, 3, 14, 8);
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(2, 4, 5, 3);
    ctx.fillStyle = '#444c58'; ctx.fillRect(6, 12, 4, 2);
    ctx.fillStyle = '#5a4d42'; ctx.fillRect(3, 14, 10, 2);
  });
  atlas['f-desk'] = tile(ctx => {
    ctx.fillStyle = '#8a6644'; ctx.fillRect(0, 4, 16, 4);
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(1, 8, 2, 8); ctx.fillRect(13, 8, 2, 8);
    ctx.fillStyle = '#c8ccd0'; ctx.fillRect(9, 1, 5, 3);
    ctx.fillStyle = '#3a4250'; ctx.fillRect(10, 2, 3, 2);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 2, 4, 2);
  });
  atlas['f-lamp'] = tile(ctx => {
    ctx.fillStyle = '#c9a227'; ctx.fillRect(4, 0, 8, 5);
    ctx.fillStyle = '#e8d48a'; ctx.fillRect(5, 1, 6, 3);
    ctx.fillStyle = '#5a4d42'; ctx.fillRect(7, 5, 2, 9);
    ctx.fillStyle = '#4a3f36'; ctx.fillRect(4, 14, 8, 2);
  });
  atlas['f-bookshelf'] = tile(ctx => {
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(1, 0, 14, 16);
    ctx.fillStyle = '#4a3320'; ctx.fillRect(2, 5, 12, 1); ctx.fillRect(2, 10, 12, 1); ctx.fillRect(2, 15, 12, 1);
    const books = ['#d05050', '#3d6e9e', '#50c878', '#c9a227', '#a86b8a'];
    let b = 0;
    for (const y of [1, 6, 11]) for (let x = 3; x < 13; x += 2) {
      ctx.fillStyle = books[b++ % books.length]; ctx.fillRect(x, y, 1, 4);
    }
  });
  atlas['f-plant'] = tile(ctx => {
    ctx.fillStyle = '#4d7440'; ctx.fillRect(5, 1, 6, 3); ctx.fillRect(3, 3, 4, 3); ctx.fillRect(9, 3, 4, 3);
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(6, 2, 4, 4); ctx.fillRect(4, 4, 2, 2); ctx.fillRect(10, 4, 2, 2);
    ctx.fillStyle = '#3e5c33'; ctx.fillRect(7, 6, 2, 4);
    ctx.fillStyle = '#b5651d'; ctx.fillRect(4, 10, 8, 5);
    ctx.fillStyle = '#8f4f17'; ctx.fillRect(4, 10, 8, 1);
  });
  atlas['f-ac'] = tile(ctx => {
    ctx.fillStyle = '#e8ecf0'; ctx.fillRect(0, 2, 16, 8);
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(0, 8, 16, 2);
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(1, 3, 14, 1);
    ctx.fillStyle = '#50c878'; ctx.fillRect(13, 6, 1, 1);
  });

  // Rare (backrooms) furniture
  atlas['f-kotatsu'] = tile(ctx => {
    ctx.fillStyle = '#d05050'; ctx.fillRect(1, 4, 30, 9); // blanket
    ctx.fillStyle = '#a83c3c'; ctx.fillRect(1, 11, 30, 2);
    ctx.fillStyle = '#8a6644'; ctx.fillRect(4, 2, 24, 4);  // tabletop
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(4, 5, 24, 1);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(13, 3, 6, 2);  // teapot? mandarin plate
    ctx.fillStyle = '#e07840'; ctx.fillRect(15, 3, 2, 1);
  }, 32, 16);
  atlas['f-aquarium'] = tile(ctx => {
    ctx.fillStyle = '#222831'; ctx.fillRect(1, 1, 14, 13);
    ctx.fillStyle = '#2e5e8e'; ctx.fillRect(2, 2, 12, 10);
    ctx.fillStyle = '#3a6fa3'; ctx.fillRect(2, 2, 12, 3);
    ctx.fillStyle = '#e07840'; ctx.fillRect(5, 6, 4, 2); // resident
    ctx.fillStyle = '#111'; ctx.fillRect(8, 6, 1, 1);
    ctx.fillStyle = '#50c878'; ctx.fillRect(11, 8, 1, 4); ctx.fillRect(3, 9, 1, 3);
    ctx.fillStyle = '#5a4d42'; ctx.fillRect(1, 14, 14, 2);
  });
  atlas['f-arcade'] = tile(ctx => {
    ctx.fillStyle = '#33424e'; ctx.fillRect(2, 0, 12, 16);
    ctx.fillStyle = '#16181d'; ctx.fillRect(3, 2, 10, 6);
    ctx.fillStyle = '#7ce8a0'; ctx.fillRect(4, 3, 4, 2); ctx.fillRect(9, 5, 3, 2);
    ctx.fillStyle = '#d05050'; ctx.fillRect(4, 10, 2, 2);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(8, 10, 2, 2);
    ctx.fillStyle = '#222831'; ctx.fillRect(2, 13, 12, 3);
  });
  atlas['f-neon'] = tile(ctx => {
    ctx.fillStyle = '#16181d'; ctx.fillRect(1, 4, 14, 8);
    ctx.fillStyle = '#e857a8';
    ctx.fillRect(3, 6, 2, 4); ctx.fillRect(5, 8, 1, 1); ctx.fillRect(6, 6, 2, 4); // H-ish O-ish glyphs
    ctx.fillRect(9, 6, 2, 4); ctx.fillRect(12, 6, 2, 4);
    ctx.fillStyle = '#ffd5ec'; ctx.fillRect(3, 6, 1, 4);
  });
  atlas['f-coffin'] = tile(ctx => {
    ctx.fillStyle = '#2a1d12'; ctx.fillRect(3, 1, 10, 14);            // coffin shadow/edge
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(4, 1, 8, 14);            // body
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(5, 2, 6, 12);            // lid
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(5, 2, 1, 12);           // lit edge
    ctx.fillStyle = '#c9a227'; ctx.fillRect(7, 4, 2, 7); ctx.fillRect(6, 6, 4, 1); // gold cross
  });
  atlas['prop-campfire'] = tile(ctx => {                            // transparent bg — overlays sand
    ctx.fillStyle = '#4a3120'; ctx.fillRect(3, 11, 10, 2); ctx.fillRect(4, 9, 9, 2); // logs
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(3, 11, 10, 1);
    ctx.fillStyle = '#e0552e'; ctx.fillRect(6, 4, 4, 7);            // flame outer
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7, 6, 2, 4);            // flame mid
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(7, 8, 1, 2);           // flame core
  });
  atlas['f-maneki'] = tile(ctx => {
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(5, 4, 8, 9); ctx.fillRect(4, 2, 3, 3); ctx.fillRect(11, 2, 3, 3);
    ctx.fillStyle = '#e8b820'; ctx.fillRect(5, 12, 8, 2);
    ctx.fillStyle = '#222'; ctx.fillRect(7, 6, 1, 1); ctx.fillRect(10, 6, 1, 1);
    ctx.fillStyle = '#d05050'; ctx.fillRect(8, 8, 2, 1);
    ctx.fillStyle = '#fff'; ctx.fillRect(12, 4, 2, 3); // waving paw
  });

  // Vehicles
  atlas['v-car'] = tile(ctx => {
    ctx.fillStyle = '#c9a227'; ctx.fillRect(2, 5, 28, 7);   // body
    ctx.fillStyle = '#e8c84a'; ctx.fillRect(2, 5, 28, 2);
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(8, 2, 14, 4);   // cabin glass
    ctx.fillStyle = '#c9a227'; ctx.fillRect(6, 2, 2, 4); ctx.fillRect(22, 2, 2, 4);
    ctx.fillStyle = '#16181d'; ctx.fillRect(14, 2, 2, 4);   // pillar
    ctx.fillStyle = '#222'; ctx.fillRect(5, 11, 6, 4); ctx.fillRect(21, 11, 6, 4); // wheels
    ctx.fillStyle = '#8a8a8e'; ctx.fillRect(7, 12, 2, 2); ctx.fillRect(23, 12, 2, 2);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(2, 7, 1, 2); ctx.fillStyle = '#d05050'; ctx.fillRect(29, 7, 1, 2);
  }, 32, 16);
  atlas['v-boat'] = tile(ctx => {
    // hull: white with blue waterline, pointed bow (right)
    ctx.fillStyle = '#e8ecf0'; ctx.fillRect(2, 7, 26, 5);
    ctx.fillRect(28, 8, 2, 3); ctx.fillRect(30, 9, 1, 1);   // bow taper
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(2, 11, 27, 2);  // waterline stripe
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(2, 7, 27, 1);   // gunwale shadow
    ctx.fillStyle = '#8a6644'; ctx.fillRect(6, 8, 18, 3);   // deck planks
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(6, 9, 18, 1);
    // little cabin
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(8, 3, 8, 5);
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(9, 4, 3, 2); ctx.fillRect(13, 4, 2, 2);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(8, 2, 8, 1);    // cabin roof
    // outboard motor (left/stern)
    ctx.fillStyle = '#2c3038'; ctx.fillRect(1, 5, 3, 5);
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(2, 10, 1, 4);
    // flag
    ctx.fillStyle = '#5a4d42'; ctx.fillRect(24, 2, 1, 5);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(25, 2, 4, 2);
  }, 32, 16);
};

// ---- Fish (16x8, recolored shape) ----------------------------------------

const FISH_ROWS = [
  '......ffff......',
  '..f..ffffff.....',
  '.fffffffffffff..',
  'ffffffeffffffff.',
  '.fffffffffffff..',
  '..f..ffffff.....',
  '......ffff......',
  '................',
];
const addFish = (atlas: Atlas, key: string, body: string) => {
  atlas[key] = strSprite(FISH_ROWS, { f: body, e: '#111' });
};

// ---- Misc ---------------------------------------------------------------

const buildMisc = (atlas: Atlas) => {
  atlas['m-shadow'] = tile(ctx => {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(4, 13, 8, 2); ctx.fillRect(3, 14, 10, 1);
  });
  atlas['m-bang'] = strSprite([
    '..rr..',
    '..rr..',
    '..rr..',
    '......',
    '..rr..',
  ], { r: '#ffd24a' });
  atlas['m-bobber'] = strSprite([
    '.rr.',
    'rrrr',
    'wwww',
    '.ww.',
  ], { r: '#d05050', w: '#e8e0d0' });
  // wand sparkle burst (combat VFX)
  atlas['m-sparkle'] = strSprite([
    '.......pp.......',
    '......pyyp......',
    '..p..pyyyyp..p..',
    '...ppyywwyypp...',
    '....pywwwwyp....',
    '...ppyywwyypp...',
    '..p..pyyyyp..p..',
    '......pyyp......',
    '.......pp.......',
  ], { p: '#e857a8', y: '#ffd24a', w: '#ffffff' });
};

// ---- PNG sprite-sheet pipeline ----------------------------------------------
// buildAtlas() below is all in-code art. This layer loads AI-generated PNG art
// (from public/, absolute paths like title-bg.png) and injects per-frame
// canvases into the SAME atlas the renderer blits — so nothing downstream
// changes. Characters use it now; world tiles/props/maps will add rows later.
export interface SheetDef {
  key: string;             // atlas key prefix; frames land at `${key}-${i}`
  src: string;             // absolute path, e.g. /images/title-bg.png
  fw: number; fh: number;  // source frame size (px)
  frames: number;          // horizontal frame count in the sheet
  out?: number;            // optional output HEIGHT px (nearest-neighbor downscale); width keeps aspect
}

// Load sheets async, slice into frame canvases, write into `atlas`. Calls
// `done` once every sheet has loaded (or errored). Safe to mutate a live atlas:
// the render loop reads each key per frame, so frames appear as they arrive.
export const loadSheets = (atlas: Atlas, defs: SheetDef[], done?: () => void): void => {
  let pending = defs.length;
  if (pending === 0) { done?.(); return; }
  for (const def of defs) {
    const img = new Image();
    const finish = () => { if (--pending === 0) done?.(); };
    img.onload = () => {
      const scale = def.out ? def.out / def.fh : 1;
      const ow = Math.max(1, Math.round(def.fw * scale));
      const oh = Math.max(1, Math.round(def.fh * scale));
      for (let i = 0; i < def.frames; i++) {
        const [c, ctx] = canvas(ow, oh);
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(img, i * def.fw, 0, def.fw, def.fh, 0, 0, ow, oh);
        atlas[`${def.key}-${i}`] = c;
      }
      finish();
    };
    img.onerror = finish;
    img.src = def.src;
  }
};

// (Player characters are the in-code pixel-art bodies built in buildAtlas:
// 'player'/'player-hat' = masc, 'player-fem'/'player-fem-hat' = fem. The earlier
// 128px AI PNG player pipeline was dropped; loadSheets above stays for future
// world/prop art.)

export const buildAtlas = (): Atlas => {
  const atlas: Atlas = {};
  // 'masc' vibe (also the legacy default 'player' key) + 'fem' vibe.
  addCharacter(atlas, 'player', PLAYER_PAL);
  addCharacter(atlas, 'player-hat', PLAYER_PAL, [ACC.cowboy('#b08a50', '#6e4a2f')]);
  addCharacter(atlas, 'player-fem', FEM_PAL, [ACC.longhair('#6e4a2f', '#4a3120')]);
  addCharacter(atlas, 'player-fem-hat', FEM_PAL, [ACC.longhair('#6e4a2f', '#4a3120'), ACC.cowboy('#b08a50', '#6e4a2f')]);
  for (const [key, def] of Object.entries(NPC_DEFS)) addCharacter(atlas, key, def.pal, def.acc);
  addMonster(atlas);
  addCrawler(atlas);
  addCrawlerVariants(atlas);
  buildTiles(atlas);
  buildFurniture(atlas);
  addFish(atlas, 'fish-minnow', '#8a9aa6');
  addFish(atlas, 'fish-mackerel', '#4a7a9e');
  addFish(atlas, 'fish-bream', '#c97a8a');
  addFish(atlas, 'fish-squid', '#c4b8d8');
  addFish(atlas, 'fish-eel', '#5a6a4a');
  addFish(atlas, 'fish-puffer', '#c9a227');
  addFish(atlas, 'fish-koi', '#e07840');
  addFish(atlas, 'fish-golden', '#ffd24a');
  addFish(atlas, 'fish-tuna', '#3a5a7a');
  addFish(atlas, 'fish-angler', '#3a3030');
  addFish(atlas, 'fish-parrot', '#3dbf8a');
  addFish(atlas, 'fish-marlin', '#2a6ad0');
  buildMisc(atlas);
  return atlas;
};
