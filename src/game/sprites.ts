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
  // Magician's top hat — tall crown + brim, a coloured band. Sits over the head.
  tophat: (c: string, band: string): Accessory => ({
    pal: { c, b: band },
    down: ['.....cccc.....', '.....cccc.....', '.....cccc.....', '....bbbbbb....', '..cccccccccc..'],
    up: ['.....cccc.....', '.....cccc.....', '.....cccc.....', '....bbbbbb....', '..cccccccccc..'],
    left: ['.....cccc.....', '.....cccc.....', '.....cccc.....', '....bbbbbb....', '..cccccccccc..'],
  }),
  // Full beard + mustache framing the lower face (mouth gap kept open).
  beard: (c: string): Accessory => ({
    dy: 5, pal: { b: c },
    down: ['...b....b...', '...bb.bb.bb.', '...bbbbbbbb.', '....bbbbbb..', '.....bbbb...'],
    left: ['...b....b...', '...bbb.bb...', '...bbbbbb...', '....bbbb....', '.....bb.....'],
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
  'npc-charlie': { // Charlie — artsy latino: dark brown hair swept back, round glasses, grey tee, warm tan skin (full beard lives on his portrait, not the 16px sprite)
    pal: { h: '#3a2a1a', k: '#241a10', s: '#c98a5e', e: '#222', t: '#9a9aa0', u: '#74747c', p: '#2f3a4a', b: '#1a1a1a' },
    acc: [ACC.glasses('#2c2c2c', '#cfe2ee')],
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
  'npc-stranger': { // the midnight stranger — a hooded indigo figure, pale lavender skin, eyes like two cold lights. Only out in the small hours.
    pal: { h: '#241a33', k: '#160f22', s: '#d6d2e2', e: '#aef4ee', t: '#2a2140', u: '#1a1430', p: '#15101f', b: '#0d0a14' },
    acc: [ACC.hood('#2e2350', '#1c1638')],
  },
  // ---- Daily street-event actors (only spawned by streetEventFor) ----
  'npc-magician': { // street magician — black tailcoat, top hat, crimson bowtie
    pal: { h: '#15151a', k: '#0a0a0d', s: '#e8c098', e: '#222', t: '#16161c', u: '#0b0b0f', p: '#26262e', b: '#0d0d10' },
    acc: [ACC.tophat('#15151a', '#c0392b'), ACC.bowtie('#c0392b')],
  },
  'npc-fortune': { // fortune teller — deep-purple hooded robe, you never quite see her face
    pal: { h: '#2a1d3a', k: '#1a1226', s: '#dcb48c', e: '#222', t: '#3a2a5a', u: '#281c40', p: '#241a36', b: '#16101f' },
    acc: [ACC.hood('#4a3470', '#2a1d44')],
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

  // Odd-jobs notice board — corkboard on two posts, pinned papers. Solid; faced.
  atlas['t-board'] = tile(ctx => {
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 51, 6); speckle(ctx, '#4d7440', 23, 4); // grass base (no black edges)
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(2, 12, 2, 4); ctx.fillRect(12, 12, 2, 4); // posts
    ctx.fillStyle = '#8a6644'; ctx.fillRect(1, 1, 14, 11);                            // frame
    ctx.fillStyle = '#c79a5a'; ctx.fillRect(2, 2, 12, 9);                             // cork
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(3, 3, 4, 4); ctx.fillRect(9, 3, 4, 5);    // papers
    ctx.fillStyle = '#e8e0cc'; ctx.fillRect(4, 8, 4, 2);
    ctx.fillStyle = '#9a9488'; ctx.fillRect(4, 4, 2, 1); ctx.fillRect(10, 4, 2, 1); ctx.fillRect(10, 6, 2, 1); // text lines
    ctx.fillStyle = '#d05050'; ctx.fillRect(4, 3, 1, 1); ctx.fillRect(11, 3, 1, 1);   // pins
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
  atlas['t-museum-front'] = tile(ctx => {                      // dark stately stone, fits the neon street
    fill(ctx, '#232a36');                                      // dark slate stone
    ctx.fillStyle = '#c9a227'; ctx.fillRect(0, 0, 16, 2);      // gold cornice
    ctx.fillStyle = '#8a6e1c'; ctx.fillRect(0, 2, 16, 1);      // cornice shadow
    ctx.fillStyle = '#2f3a48'; for (let x = 1; x < 16; x += 4) ctx.fillRect(x, 3, 2, 11);   // columns (highlight)
    ctx.fillStyle = '#161b24'; for (let x = 3; x < 16; x += 4) ctx.fillRect(x, 3, 1, 11);   // column shade (seams L-R)
    ctx.fillStyle = '#ffd24a'; for (let x = 1; x < 16; x += 4) ctx.fillRect(x, 6, 2, 2);    // warm lit windows
    ctx.fillStyle = '#1a1f28'; ctx.fillRect(0, 14, 16, 2);     // base
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
  atlas['t-torii-beam-path'] = tile(ctx => {    // crossbar where the stone path runs UNDER the gate
    fill(ctx, '#9aa0a6');
    ctx.fillStyle = '#878d93'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 5, 16, 1); ctx.fillRect(0, 10, 16, 1);
    speckle(ctx, '#a8aeb4', 71, 4);
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
  atlas['t-shrine-roof-l'] = tile(ctx => {                         // left end of the roof — eave curls up (karahafu)
    grassBg(ctx);                                                  // outer (left) edge is open sky/grass
    ctx.fillStyle = '#3a4250'; ctx.fillRect(3, 0, 13, 16);         // slate body (right 13px)
    ctx.fillStyle = '#4a5466'; for (let y = 1; y < 16; y += 3) ctx.fillRect(3, y, 13, 1);
    ctx.fillStyle = '#525e72'; ctx.fillRect(3, 0, 13, 1);          // sunlit top
    ctx.fillStyle = '#c9a227'; ctx.fillRect(3, 1, 13, 1);          // gold ridge cap
    ctx.fillStyle = '#2c3340'; ctx.fillRect(3, 13, 13, 3);         // eave shadow
    ctx.fillStyle = '#3a4250'; ctx.fillRect(1, 11, 3, 2); ctx.fillRect(0, 9, 2, 2); // upturned eave tip sweeping up-left
    ctx.fillStyle = '#2c3340'; ctx.fillRect(1, 13, 3, 1);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(0, 9, 2, 1);           // gold finial tip
  });
  atlas['t-shrine-roof-r'] = tile(ctx => {                         // right end — mirror of -l
    grassBg(ctx);
    ctx.fillStyle = '#3a4250'; ctx.fillRect(0, 0, 13, 16);
    ctx.fillStyle = '#4a5466'; for (let y = 1; y < 16; y += 3) ctx.fillRect(0, y, 13, 1);
    ctx.fillStyle = '#525e72'; ctx.fillRect(0, 0, 13, 1);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(0, 1, 13, 1);
    ctx.fillStyle = '#2c3340'; ctx.fillRect(0, 13, 13, 3);
    ctx.fillStyle = '#3a4250'; ctx.fillRect(12, 11, 3, 2); ctx.fillRect(14, 9, 2, 2);
    ctx.fillStyle = '#2c3340'; ctx.fillRect(12, 13, 3, 1);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(14, 9, 2, 1);
  });
  atlas['t-shrine-peak'] = tile(ctx => {                           // gable peak: crossed chigi finials + katsuogi billets
    grassBg(ctx);                                                  // above the roof — open sky
    ctx.fillStyle = '#3a4250'; ctx.fillRect(0, 7, 16, 9);          // slate apex
    ctx.fillStyle = '#4a5466'; for (let y = 9; y < 16; y += 3) ctx.fillRect(0, y, 16, 1);
    ctx.fillStyle = '#525e72'; ctx.fillRect(0, 7, 16, 1);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(0, 8, 16, 1);          // gold ridge
    ctx.fillStyle = '#2c3340'; ctx.fillRect(0, 14, 16, 2);
    ctx.fillStyle = '#caa14a';                                     // chigi (crossed golden finials, X at the apex)
    ctx.fillRect(4, 6, 2, 2); ctx.fillRect(5, 4, 2, 2); ctx.fillRect(6, 2, 2, 2); ctx.fillRect(7, 0, 2, 2);
    ctx.fillRect(10, 6, 2, 2); ctx.fillRect(9, 4, 2, 2); ctx.fillRect(8, 2, 2, 2);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(2, 9, 2, 2); ctx.fillRect(12, 9, 2, 2); // katsuogi billets on the ridge
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7, 0, 2, 1);           // sun glint on the cross
  });
  atlas['t-shrine-door'] = tile(ctx => {                           // honden entrance: dark doorway, shimenawa + bell rope
    fill(ctx, '#b04a3a');                                          // vermillion timber wall
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(0, 14, 16, 2);         // base shadow
    ctx.fillStyle = '#1a1410'; ctx.fillRect(3, 2, 10, 12);         // recessed doorway
    ctx.fillStyle = '#241a14'; ctx.fillRect(4, 3, 8, 10);          // inner sanctum
    ctx.fillStyle = '#3a2a1e'; ctx.fillRect(7, 3, 1, 10); ctx.fillRect(10, 3, 1, 10); // door slats
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(2, 0, 12, 2);          // shimenawa straw rope over the lintel
    ctx.fillStyle = '#b08a50'; ctx.fillRect(2, 1, 12, 1);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(5, 0, 1, 2); ctx.fillRect(10, 0, 1, 2); // shide paper zigzags
    ctx.fillStyle = '#d8584a'; ctx.fillRect(7, 2, 2, 6);          // suzu bell rope (red & white)
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(7, 3, 2, 1); ctx.fillRect(7, 5, 2, 1);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(7, 8, 2, 2);          // brass suzu bell
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(7, 8, 1, 1);
  });
  atlas['t-shrine-veranda'] = tile(ctx => {                        // engawa: wooden platform + balustrade across the hall front
    fill(ctx, '#8a6644');                                          // wood deck
    ctx.fillStyle = '#7a5638'; ctx.fillRect(1, 4, 1, 11); ctx.fillRect(4, 4, 1, 11); ctx.fillRect(7, 4, 1, 11); ctx.fillRect(10, 4, 1, 11); ctx.fillRect(13, 4, 1, 11); // balusters
    ctx.fillStyle = '#b04a3a'; ctx.fillRect(0, 0, 16, 3);          // vermillion top rail
    ctx.fillStyle = '#d8584a'; ctx.fillRect(0, 0, 16, 1);          // lit rail edge
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(0, 3, 16, 1);          // rail underside
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(0, 14, 16, 2);         // ground shadow under deck
  });
  atlas['t-saisen'] = tile(ctx => {                                // saisen-bako: offering box w/ coin grate, bell & shimenawa
    fill(ctx, '#9aa0a6');                                          // stands on the stone forecourt
    ctx.fillStyle = '#878d93'; ctx.fillRect(0, 0, 16, 1);
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(0, 0, 16, 3);          // shimenawa straw rope above the box
    ctx.fillStyle = '#b08a50'; ctx.fillRect(0, 2, 16, 1);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(3, 0, 1, 3); ctx.fillRect(8, 0, 1, 3); ctx.fillRect(12, 0, 1, 3); // shide zigzags
    ctx.fillStyle = '#c9a227'; ctx.fillRect(7, 3, 2, 2);          // brass suzu bell
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(7, 3, 1, 1);
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(2, 6, 12, 8);         // box body
    ctx.fillStyle = '#a9805a'; ctx.fillRect(3, 8, 10, 5);         // lit timber face
    ctx.fillStyle = '#c79a6e'; ctx.fillRect(3, 8, 10, 1);         // top-lit plank edge
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(2, 13, 12, 1);        // base shadow
    ctx.fillStyle = '#8a6644'; ctx.fillRect(7, 8, 2, 5);          // centre plank seam highlight
    ctx.fillStyle = '#3a2a1e'; ctx.fillRect(3, 6, 10, 2);         // slatted coin grate on top
    ctx.fillStyle = '#1a120c'; ctx.fillRect(4, 6, 1, 2); ctx.fillRect(6, 6, 1, 2); ctx.fillRect(8, 6, 1, 2); ctx.fillRect(10, 6, 1, 2); ctx.fillRect(12, 6, 1, 2); // coin slots
    ctx.fillStyle = '#4a3f36'; ctx.fillRect(2, 6, 1, 8); ctx.fillRect(13, 6, 1, 8); // iron corner braces
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7, 10, 2, 2);        // a coin glints in the slot
    ctx.fillStyle = '#c9a227'; ctx.fillRect(8, 11, 1, 1);
  });
  atlas['t-temizuya'] = tile(ctx => {                              // chozubachi: stone water basin w/ bamboo dipper
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 67, 5);
    ctx.fillStyle = '#8a8d93'; ctx.fillRect(3, 6, 10, 8);         // stone basin
    ctx.fillStyle = '#a8abb1'; ctx.fillRect(3, 6, 10, 1);         // sunlit rim
    ctx.fillStyle = '#6e7178'; ctx.fillRect(3, 12, 10, 1);
    ctx.fillStyle = '#5aa6c8'; ctx.fillRect(4, 7, 8, 4);         // water surface
    ctx.fillStyle = '#9ad8ee'; ctx.fillRect(5, 7, 3, 1);        // glint
    ctx.fillStyle = '#3a7e9e'; ctx.fillRect(4, 10, 8, 1);
    ctx.fillStyle = '#9aa84a'; ctx.fillRect(2, 4, 9, 1);         // bamboo pole laid across
    ctx.fillStyle = '#c9d27a'; ctx.fillRect(2, 4, 9, 1);
    ctx.fillStyle = '#7a8a3a'; ctx.fillRect(9, 3, 3, 2);        // ladle cup
    ctx.fillStyle = '#6e7178'; ctx.fillRect(4, 13, 8, 2);       // base
  });
  atlas['t-shrine-wall'] = tile(ctx => {
    fill(ctx, '#b04a3a'); // vermillion timber
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(0, 14, 16, 2);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 3, 5, 8); ctx.fillRect(9, 3, 5, 8); // shoji panels
    ctx.fillStyle = '#b04a3a'; ctx.fillRect(4, 3, 1, 8); ctx.fillRect(11, 3, 1, 8);
    ctx.fillRect(2, 6, 5, 1); ctx.fillRect(9, 6, 5, 1);
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(0, 11, 16, 1);
  });
  atlas['t-komainu'] = tile(ctx => {                       // guardian lion-dog seated on a stone pedestal
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 79, 5);
    ctx.fillStyle = '#8a8d93'; ctx.fillRect(3, 11, 10, 4); // pedestal
    ctx.fillStyle = '#a8abb1'; ctx.fillRect(3, 11, 10, 1); // sunlit pedestal cap
    ctx.fillStyle = '#6e7178'; ctx.fillRect(3, 14, 10, 1); // pedestal base shadow
    ctx.fillStyle = '#9498a0'; ctx.fillRect(5, 6, 6, 5);   // haunches / seated body
    ctx.fillStyle = '#7e828a'; ctx.fillRect(9, 7, 2, 4);   // shaded flank
    ctx.fillStyle = '#9498a0'; ctx.fillRect(4, 3, 5, 4);   // head
    ctx.fillStyle = '#a8abb1'; ctx.fillRect(4, 3, 3, 1);   // sunlit brow
    ctx.fillStyle = '#7e828a'; ctx.fillRect(3, 4, 1, 3); ctx.fillRect(8, 4, 1, 3); // mane curls
    ctx.fillStyle = '#9498a0'; ctx.fillRect(11, 6, 2, 3);  // curled tail
    ctx.fillStyle = '#2c2c30'; ctx.fillRect(5, 5, 1, 1); ctx.fillRect(7, 5, 1, 1); // eyes
    ctx.fillStyle = '#3a3a40'; ctx.fillRect(5, 6, 3, 1);   // open mouth (a-gyo)
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

  // ---- Kiwami Island overhaul props -------------------------------------------
  atlas['t-lagoon'] = tile(ctx => {                          // shallow turquoise lagoon (fishable)
    fill(ctx, '#5fc6c0');
    ctx.fillStyle = '#7ce8e0'; ctx.fillRect(0, 0, 16, 5); speckle(ctx, '#9af0ea', 53, 7);
    ctx.fillStyle = '#4aa8a4'; ctx.fillRect(0, 11, 16, 5);
    ctx.fillStyle = '#bdf4ee'; ctx.fillRect(2, 3, 4, 1); ctx.fillRect(9, 8, 5, 1); ctx.fillRect(4, 12, 3, 1); // glints
  });
  atlas['t-rock'] = tile(ctx => {                            // dark volcanic rock mass
    fill(ctx, '#4a4550'); speckle(ctx, '#3a3640', 29, 9);
    ctx.fillStyle = '#5a5560'; ctx.fillRect(1, 1, 6, 4); ctx.fillRect(9, 3, 5, 5); ctx.fillRect(3, 9, 6, 4); // lit faces (upper-left)
    ctx.fillStyle = '#33303a'; ctx.fillRect(0, 14, 16, 2);   // ground shadow
  });
  atlas['t-volcano'] = tile(ctx => {                         // crater peak — dark cone w/ a lava throat (glow added at draw time)
    fill(ctx, '#4a4550');
    ctx.fillStyle = '#3a3640'; ctx.fillRect(0, 0, 3, 16); ctx.fillRect(13, 0, 3, 16); // sky-side dark flanks
    ctx.fillStyle = '#5a5560'; ctx.fillRect(3, 2, 4, 12);    // upper-left lit face
    ctx.fillStyle = '#2c2832'; ctx.fillRect(9, 2, 4, 12);    // right shadow face
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(5, 1, 6, 4);     // crater rim (dark red)
    ctx.fillStyle = '#e0552e'; ctx.fillRect(6, 2, 4, 3);     // lava throat
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7, 2, 2, 2);     // bright core
  });
  atlas['t-hotspring'] = tile(ctx => {                       // onsen pool — stone rim + steamy water (steam added at draw time)
    fill(ctx, '#6f9e5e'); speckle(ctx, '#5e8a4f', 61, 5);    // grass surround
    ctx.fillStyle = '#6e7682'; ctx.fillRect(1, 2, 14, 12);   // stone rim
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(1, 2, 14, 1); ctx.fillRect(1, 2, 1, 12); // lit rim edge
    ctx.fillStyle = '#7ce8e0'; ctx.fillRect(3, 4, 10, 8);    // mineral water
    ctx.fillStyle = '#aef4ee'; ctx.fillRect(4, 5, 4, 2); ctx.fillRect(8, 9, 3, 1); // surface glints
    ctx.fillStyle = '#4aa8a4'; ctx.fillRect(3, 11, 10, 1);
  });
  atlas['t-dock'] = tile(ctx => {                            // wooden pier plank over water (walkable)
    fill(ctx, '#3d6e9e');                                    // water showing through gaps
    ctx.fillStyle = '#8a6644'; ctx.fillRect(0, 1, 16, 6); ctx.fillRect(0, 9, 16, 6); // two planks
    ctx.fillStyle = '#a07a4f'; ctx.fillRect(0, 1, 16, 1); ctx.fillRect(0, 9, 16, 1); // lit plank tops
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(0, 6, 16, 1); ctx.fillRect(0, 14, 16, 1); // plank shadow
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(2, 0, 1, 16); ctx.fillRect(13, 0, 1, 16); // nail seams
  });
  atlas['t-banana'] = tile(ctx => {                          // banana palm — fronds + a yellow bunch
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 67, 4);
    ctx.fillStyle = '#4d7440'; ctx.fillRect(1, 1, 7, 4); ctx.fillRect(9, 2, 6, 5); ctx.fillRect(2, 5, 5, 3); // broad fronds
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(2, 2, 3, 1); ctx.fillRect(10, 3, 3, 1);
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(7, 5, 2, 8);     // trunk
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(9, 7, 1, 4); ctx.fillRect(10, 8, 1, 3); ctx.fillRect(11, 7, 1, 4); // banana bunch
    ctx.fillStyle = '#c9a227'; ctx.fillRect(9, 10, 3, 1);
    ctx.fillStyle = '#2e4426'; ctx.fillRect(0, 14, 16, 2);
  });
  atlas['t-bottle'] = tile(ctx => {                          // message in a bottle, half-buried in sand (a secret)
    fill(ctx, '#cdbb8e'); speckle(ctx, '#bda979', 43, 6);    // sand
    ctx.fillStyle = '#50a0d0'; ctx.fillRect(4, 7, 9, 5);     // glass body (on its side)
    ctx.fillStyle = '#7ce8e0'; ctx.fillRect(4, 7, 9, 1);     // highlight
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(4, 11, 9, 1);    // shadow
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(12, 8, 2, 3);    // cork end
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(6, 8, 3, 3);     // rolled paper inside
    ctx.fillStyle = '#c0392b'; ctx.fillRect(6, 9, 3, 1);     // ribbon
  });
  atlas['t-cave-crack'] = tile(ctx => {                      // a hidden crack/sea-cave mouth in the volcanic rock (secret)
    fill(ctx, '#4a4550'); speckle(ctx, '#3a3640', 31, 9);    // volcanic rock, matches t-rock
    ctx.fillStyle = '#5a5560'; ctx.fillRect(1, 1, 5, 4); ctx.fillRect(11, 2, 4, 5); // upper-left lit faces
    ctx.fillStyle = '#16121d'; ctx.fillRect(6, 2, 4, 12);    // the dark crack/mouth
    ctx.fillStyle = '#080610'; ctx.fillRect(7, 4, 2, 9);     // deeper black throat
    ctx.fillStyle = '#2c2832'; ctx.fillRect(5, 2, 1, 12); ctx.fillRect(10, 2, 1, 12); // crack edges
    ctx.fillStyle = '#33303a'; ctx.fillRect(0, 14, 16, 2);   // ground shadow
  });
  atlas['t-fire-escape'] = tile(ctx => {                     // rusted fire-escape ladder bolted up a brick wall (secret)
    fill(ctx, '#6e5a4a'); speckle(ctx, '#5c4a3c', 37, 7);    // brick wall
    ctx.fillStyle = '#3a3a42'; ctx.fillRect(5, 0, 6, 16);    // steel cage shadow band
    ctx.fillStyle = '#55555f'; ctx.fillRect(5, 2, 6, 1); ctx.fillRect(5, 8, 6, 1); ctx.fillRect(5, 14, 6, 1); // landing rails
    ctx.fillStyle = '#6b6b76'; ctx.fillRect(6, 0, 1, 16); ctx.fillRect(9, 0, 1, 16); // ladder side rails
    ctx.fillStyle = '#8a8a96'; for (let y = 1; y < 16; y += 3) ctx.fillRect(6, y, 4, 1); // rungs
    ctx.fillStyle = '#b87a4a'; ctx.fillRect(6, 5, 1, 2); ctx.fillRect(9, 10, 1, 2); // rust streaks
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

  // Eiffel Tower — ONE big sprite (112×108) blitted over the Paris sky. The old
  // tile-by-tile tower read as a crane claw at this scale; this draws the whole
  // iconic concave-leg silhouette in one piece, with two platforms + the grand arch.
  {
    const eFe = '#6e4a2e', eFeL = '#8a6440', eFeD = '#43301c';
    const W = 112, H = 108, cx = W / 2;
    const [cc, cg] = canvas(W, H);
    // outer half-width of the iron at height y (0 top .. H bottom)
    const wEdge = (y: number): number => {
      if (y < 6) return 2;                                                       // antenna
      if (y < 30) { const t = (y - 6) / 24; return 3 + t * 8; }                  // upper column 3→11
      if (y < 68) { const t = (y - 30) / 38; return 11 + 19 * Math.pow(t, 1.7); } // concave legs 11→30
      const t = (y - 68) / (H - 68); return 30 + 22 * t;                          // lower legs 30→52
    };
    // 1) solid silhouette with horizontal lattice rungs (every 4th row darker)
    for (let y = 0; y < H; y++) {
      const w = wEdge(y);
      cg.fillStyle = (y % 4 === 0) ? eFeD : eFe;
      cg.fillRect(Math.round(cx - w), y, Math.round(2 * w), 1);
    }
    // 2) left-edge highlight for a little dimensional rake
    cg.fillStyle = eFeL;
    for (let y = 6; y < H; y++) cg.fillRect(Math.round(cx - wEdge(y)), y, 1, 1);
    // 3) the two observation decks
    cg.fillStyle = eFe; cg.fillRect(cx - 16, 30, 32, 4); cg.fillRect(cx - 34, 67, 68, 5);
    cg.fillStyle = eFeD; cg.fillRect(cx - 16, 33, 32, 1); cg.fillRect(cx - 34, 71, 68, 1);
    cg.fillStyle = eFeL; cg.fillRect(cx - 16, 30, 32, 1); cg.fillRect(cx - 34, 67, 68, 1);
    // 4) antenna + a red aircraft beacon
    cg.fillStyle = eFe; cg.fillRect(cx - 1, 0, 2, 8);
    cg.fillStyle = '#e0564e'; cg.fillRect(cx - 1, 0, 2, 2);
    // 5) carve the open lattice: the gap between the legs + the grand arch
    cg.globalCompositeOperation = 'destination-out';
    cg.beginPath(); cg.moveTo(cx, 38); cg.lineTo(cx - 20, 66); cg.lineTo(cx + 20, 66); cg.closePath(); cg.fill();
    cg.beginPath();
    cg.moveTo(cx - 30, H); cg.lineTo(cx - 30, 88);
    cg.quadraticCurveTo(cx, 70, cx + 30, 88);
    cg.lineTo(cx + 30, H); cg.closePath(); cg.fill();
    cg.globalCompositeOperation = 'source-over';
    atlas['eiffel-big'] = cc;
  }

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
  // Empty soil plot (raised wooden bed): tilled earth with furrows + plank frame.
  atlas['t-gh-soil'] = tile(ctx => {
    fill(ctx, '#5a3c24');
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(2, 2, 12, 2);                              // freshly turned topsoil
    ctx.fillStyle = '#4a3120'; ctx.fillRect(3, 7, 10, 1); ctx.fillRect(3, 11, 10, 1);  // furrows
    speckle(ctx, '#6e4a2f', 67, 8); speckle(ctx, '#3a2716', 71, 6);
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(0, 0, 16, 2); ctx.fillRect(0, 0, 2, 16); ctx.fillRect(14, 0, 2, 16); ctx.fillRect(0, 14, 16, 2); // raised plank frame
    ctx.fillStyle = '#a5703a'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 0, 1, 16);   // plank highlight (top-left light)
    ctx.fillStyle = '#6e4421'; ctx.fillRect(15, 0, 1, 16); ctx.fillRect(0, 15, 16, 1); // plank shadow (bottom-right)
  });
  // Glass roof / skylight (top edge): bright overhead panes, mullion grid + ridge beam.
  atlas['t-gh-roof'] = tile(ctx => {
    fill(ctx, '#bfe3d3');
    ctx.fillStyle = '#d8f1e6'; ctx.fillRect(0, 0, 16, 5);                              // sky glow up high
    ctx.fillStyle = '#e8f4ec'; ctx.fillRect(2, 1, 4, 3); ctx.fillRect(10, 1, 4, 3);    // pane glints
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(0, 7, 16, 2); ctx.fillRect(7, 0, 2, 16);   // mullions (ridge + rafter)
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(0, 11, 16, 2);                             // lit ridge beam
    ctx.fillStyle = '#c4bca8'; ctx.fillRect(0, 14, 16, 2);                             // shadow where roof meets wall
  });
  // Potted plant (decor, solid): leafy foliage in a terracotta pot.
  atlas['t-gh-plant'] = tile(ctx => {
    fill(ctx, '#d8cdb0');
    ctx.fillStyle = '#bfb18e'; ctx.fillRect(0, 13, 16, 1);                             // floor contact shadow
    ctx.fillStyle = '#3a6e3a'; ctx.fillRect(3, 2, 10, 7);                              // dense foliage
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(2, 4, 12, 4);
    ctx.fillStyle = '#6e9e3a'; ctx.fillRect(4, 2, 3, 3); ctx.fillRect(9, 3, 4, 3); ctx.fillRect(2, 6, 3, 2);
    ctx.fillStyle = '#8fc24f'; ctx.fillRect(5, 2, 1, 1); ctx.fillRect(10, 3, 1, 1);    // leaf highlights
    ctx.fillStyle = '#b5642f'; ctx.fillRect(4, 9, 8, 5);                               // terracotta pot
    ctx.fillStyle = '#c97a3e'; ctx.fillRect(4, 9, 8, 1); ctx.fillRect(5, 9, 1, 4);     // rim + left highlight
    ctx.fillStyle = '#8a4a22'; ctx.fillRect(4, 13, 8, 1); ctx.fillRect(10, 10, 2, 3);  // base + right shadow
  });
  // Hanging fern basket (decor, solid): trailing fronds on a chain from the roof.
  atlas['t-gh-vine'] = tile(ctx => {
    fill(ctx, '#d8cdb0');
    ctx.fillStyle = '#9a9488'; ctx.fillRect(7, 0, 1, 3); ctx.fillRect(8, 0, 1, 3);     // chain to the roof
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(4, 3, 8, 3);                               // woven basket
    ctx.fillStyle = '#a5703a'; ctx.fillRect(4, 3, 8, 1);                               // basket rim
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(3, 5, 10, 3);                              // fern crown
    ctx.fillStyle = '#3da26b'; ctx.fillRect(2, 6, 3, 4); ctx.fillRect(11, 6, 3, 4); ctx.fillRect(6, 7, 4, 5); // trailing fronds
    ctx.fillStyle = '#6e9e3a'; ctx.fillRect(3, 8, 2, 3); ctx.fillRect(11, 8, 2, 2); ctx.fillRect(7, 10, 2, 3);
    ctx.fillStyle = '#8fc24f'; ctx.fillRect(2, 6, 1, 1); ctx.fillRect(13, 6, 1, 1); ctx.fillRect(8, 7, 1, 1); // frond highlights
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
  // Granny's supply counter — a two-tile wooden market stall (seeds / feed /
  // upgrades). LEFT half: counter + seed packets on the shelf. The counter top,
  // front face, seam and base align across both halves so they read as one stand.
  atlas['t-gh-counter-l'] = tile(ctx => {
    fill(ctx, '#d8cdb0');                                                             // floor
    ctx.fillStyle = '#a87c52'; ctx.fillRect(1, 6, 15, 2);                             // counter top lip (lit, runs to seam)
    ctx.fillStyle = '#7a5638'; ctx.fillRect(1, 8, 15, 1);                             // under-lip shadow
    ctx.fillStyle = '#8a6440'; ctx.fillRect(1, 9, 15, 6);                             // front face (to right edge)
    ctx.fillStyle = '#9a7350'; ctx.fillRect(1, 9, 15, 1);                             // lit top of front
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(1, 12, 15, 1);                            // plank seam
    ctx.fillStyle = '#4a3320'; ctx.fillRect(1, 9, 1, 6);                              // left corner post
    ctx.fillStyle = '#3a2716'; ctx.fillRect(1, 15, 15, 1);                            // base shadow
    ctx.fillStyle = '#c9a227'; ctx.fillRect(3, 1, 4, 6);                              // seed packet
    ctx.fillStyle = '#a3801a'; ctx.fillRect(3, 1, 1, 6); ctx.fillRect(6, 1, 1, 6);    // packet edges
    ctx.fillStyle = '#e8d48a'; ctx.fillRect(4, 2, 2, 2);                              // label window
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(4, 2, 1, 1); ctx.fillStyle = '#ffd24a'; ctx.fillRect(5, 2, 1, 1);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(9, 2, 4, 5);                              // second packet
    ctx.fillStyle = '#e8d48a'; ctx.fillRect(10, 3, 2, 2);
    ctx.fillStyle = '#6e9e3a'; ctx.fillRect(10, 3, 1, 1);
  });
  // RIGHT half: counter continues, with a fertilizer sack + watering can on top.
  atlas['t-gh-counter-r'] = tile(ctx => {
    fill(ctx, '#d8cdb0');                                                             // floor
    ctx.fillStyle = '#a87c52'; ctx.fillRect(0, 6, 15, 2);                             // counter top lip (from seam)
    ctx.fillStyle = '#7a5638'; ctx.fillRect(0, 8, 15, 1);                             // under-lip shadow
    ctx.fillStyle = '#8a6440'; ctx.fillRect(0, 9, 15, 6);                             // front face (from left edge)
    ctx.fillStyle = '#9a7350'; ctx.fillRect(0, 9, 15, 1);                             // lit top of front
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(0, 12, 15, 1);                            // plank seam
    ctx.fillStyle = '#4a3320'; ctx.fillRect(14, 9, 1, 6);                             // right corner post
    ctx.fillStyle = '#3a2716'; ctx.fillRect(0, 15, 15, 1);                            // base shadow
    ctx.fillStyle = '#8a6440'; ctx.fillRect(2, 2, 6, 5);                              // fertilizer sack
    ctx.fillStyle = '#7a5638'; ctx.fillRect(7, 2, 1, 5);                              // shaded side
    ctx.fillStyle = '#9a7350'; ctx.fillRect(3, 3, 1, 4);                              // highlight
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(3, 1, 4, 1);                              // tied top
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(4, 3, 2, 2);                              // leaf label
    ctx.fillStyle = '#3d8a9e'; ctx.fillRect(10, 3, 4, 4);                             // watering can body
    ctx.fillStyle = '#56a8bc'; ctx.fillRect(10, 3, 4, 1);                             // lit rim
    ctx.fillStyle = '#3d8a9e'; ctx.fillRect(13, 2, 2, 1);                             // spout
    ctx.fillStyle = '#2c6477'; ctx.fillRect(10, 1, 3, 1); ctx.fillRect(10, 1, 1, 2);  // handle
  });
  // Exterior facade (shrine-side entrance): a little glass house.
  // Glass wall of the community greenhouse. Seamless vertically (transom at the
  // top edge) so stacked rows read as one tall glasshouse; aluminium frame,
  // sun-glints, and lush planting visible through the panes.
  atlas['t-gh-front'] = tile(ctx => {
    fill(ctx, '#bfe3d0');                                                            // glass
    ctx.fillStyle = '#d4efe2'; ctx.fillRect(1, 1, 6, 14); ctx.fillRect(9, 1, 6, 14); // two panes
    ctx.fillStyle = '#eaf6ef'; ctx.fillRect(1, 1, 2, 5); ctx.fillRect(9, 1, 2, 5);   // sun-glints (upper-left)
    ctx.fillStyle = '#4d7440'; ctx.fillRect(2, 9, 4, 5); ctx.fillRect(10, 8, 4, 6);  // foliage behind glass
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(3, 8, 2, 3); ctx.fillRect(11, 7, 2, 3);
    ctx.fillStyle = '#d05050'; ctx.fillRect(4, 11, 1, 1); ctx.fillStyle = '#ffd24a'; ctx.fillRect(12, 9, 1, 1); // tomato + bloom
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(0, 0, 1, 16); ctx.fillRect(7, 0, 2, 16); ctx.fillRect(15, 0, 1, 16); // mullions
    ctx.fillStyle = '#d8cdb0'; ctx.fillRect(0, 0, 16, 1);                            // top transom (seam line)
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(0, 14, 16, 2);                           // low cill / base
    ctx.fillStyle = '#b8a578'; ctx.fillRect(0, 15, 16, 1);
  });
  // Pitched glass roof of the greenhouse — a bright ridge up top, glazing bars,
  // and a wooden gutter along the eave. Tiles seamlessly across the roof row.
  atlas['t-gh-roof'] = tile(ctx => {
    fill(ctx, '#aed8c6');                                                            // glass roof (mid)
    ctx.fillStyle = '#cdeede'; ctx.fillRect(0, 1, 16, 4);                            // sky-reflecting upper glazing
    ctx.fillStyle = '#eaf6ef'; ctx.fillRect(0, 0, 16, 1);                            // ridge highlight
    ctx.fillStyle = '#9cc8b4'; ctx.fillRect(0, 9, 16, 4);                            // shaded lower glazing
    ctx.fillStyle = '#e8e0d0'; for (let x = 1; x < 16; x += 3) ctx.fillRect(x, 0, 1, 13); // glazing bars
    ctx.fillStyle = '#e8f4ec'; ctx.fillRect(2, 2, 2, 2);                             // condensation glint
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(0, 13, 16, 3);                           // wooden gutter / eave
    ctx.fillStyle = '#a8916a'; ctx.fillRect(0, 15, 16, 1);
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
  // "How it works" notice poster, mounted against the greenhouse wall.
  atlas['t-gh-poster'] = tile(ctx => {
    fill(ctx, '#d8cdb0');                                                             // floor/wall base
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(2, 1, 12, 13);                            // wood frame
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(3, 2, 10, 11);                            // paper
    ctx.fillStyle = '#3da26b'; ctx.fillRect(5, 3, 2, 3); ctx.fillRect(5, 3, 6, 1);    // plant sprig
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(10, 3, 2, 2);                             // little sun
    ctx.fillStyle = '#9a9488';                                                        // text lines
    ctx.fillRect(4, 7, 8, 1); ctx.fillRect(4, 9, 8, 1); ctx.fillRect(4, 11, 6, 1);
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

  // ---- Greenhouse crops (match t-crop-sun-* style: bottom-aligned over a soil
  // plot, transparent bg, lower ~2/3 of the tile). Each crop has 4 growth
  // stages keyed t-crop-<id>-<0..3>. Two shared helpers keep the early stages
  // consistent; stages 2 (budding/fruit forming) and 3 (ripe) are hand-tuned.
  // Generic seedling (stage 0): soil mound + a 2–3 leaf sprout tip.
  const seedling = (ctx: CanvasRenderingContext2D, leaf: string, hi: string) => {
    ctx.fillStyle = '#3a2716'; ctx.fillRect(6, 12, 4, 2);                             // soil mound
    ctx.fillStyle = '#2c1d10'; ctx.fillRect(7, 11, 2, 1);
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(7, 9, 1, 3);                              // tiny stem
    ctx.fillStyle = leaf; ctx.fillRect(6, 9, 1, 1); ctx.fillRect(8, 8, 1, 1); ctx.fillRect(7, 7, 1, 1);
    ctx.fillStyle = hi; ctx.fillRect(7, 7, 1, 1);
  };
  // Generic young leafy plant (stage 1): upright stem with a few side leaves.
  const youngLeafy = (ctx: CanvasRenderingContext2D, stem: string, leaf: string, hi: string) => {
    ctx.fillStyle = stem; ctx.fillRect(7, 7, 2, 7);
    ctx.fillStyle = leaf; ctx.fillRect(4, 8, 3, 2); ctx.fillRect(9, 9, 3, 2);
    ctx.fillRect(5, 6, 2, 1); ctx.fillRect(9, 6, 2, 1);
    ctx.fillStyle = hi; ctx.fillRect(4, 8, 1, 1); ctx.fillRect(11, 9, 1, 1);
  };

  // TOMATO — bushy green plant → round red tomatoes.
  atlas['t-crop-tomato-0'] = tile(ctx => seedling(ctx, '#6e9e3a', '#8fc24f'));
  atlas['t-crop-tomato-1'] = tile(ctx => youngLeafy(ctx, '#4d7a2e', '#6e9e3a', '#8fc24f'));
  atlas['t-crop-tomato-2'] = tile(ctx => {                                           // bushy, flowering / small green fruit
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(7, 6, 2, 8);
    ctx.fillStyle = '#6e9e3a'; ctx.fillRect(3, 7, 4, 3); ctx.fillRect(9, 8, 4, 3); ctx.fillRect(5, 4, 6, 3);
    ctx.fillStyle = '#8fc24f'; ctx.fillRect(3, 7, 1, 1); ctx.fillRect(12, 8, 1, 1); ctx.fillRect(6, 4, 1, 1);
    ctx.fillStyle = '#ffe87a'; ctx.fillRect(5, 6, 1, 1); ctx.fillRect(10, 6, 1, 1);   // tiny yellow flowers
    ctx.fillStyle = '#7cb84f'; ctx.fillRect(6, 9, 2, 2); ctx.fillRect(9, 10, 2, 2);   // unripe green fruit
  });
  atlas['t-crop-tomato-3'] = tile(ctx => {                                           // ripe — round red tomatoes
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(7, 5, 2, 9);
    ctx.fillStyle = '#6e9e3a'; ctx.fillRect(3, 5, 4, 3); ctx.fillRect(9, 5, 4, 3); ctx.fillRect(5, 3, 6, 2);
    ctx.fillStyle = '#8fc24f'; ctx.fillRect(3, 5, 1, 1); ctx.fillRect(12, 5, 1, 1);
    ctx.fillStyle = '#d83a2e';                                                        // tomatoes (rounded blocks)
    ctx.fillRect(3, 9, 3, 3); ctx.fillRect(8, 10, 4, 4); ctx.fillRect(8, 11, 4, 2); ctx.fillRect(6, 7, 3, 3);
    ctx.fillStyle = '#f2604a'; ctx.fillRect(3, 9, 1, 1); ctx.fillRect(9, 10, 1, 1); ctx.fillRect(6, 7, 1, 1); // sheen
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(4, 8, 1, 1); ctx.fillRect(9, 9, 1, 1);    // calyx
  });

  // CHILI — green plant → pointed red peppers hanging down.
  atlas['t-crop-chili-0'] = tile(ctx => seedling(ctx, '#6e9e3a', '#9ad05a'));
  atlas['t-crop-chili-1'] = tile(ctx => youngLeafy(ctx, '#4a7a30', '#6e9e3a', '#9ad05a'));
  atlas['t-crop-chili-2'] = tile(ctx => {                                            // white blossoms + small green peppers
    ctx.fillStyle = '#4a7a30'; ctx.fillRect(7, 5, 2, 9);
    ctx.fillStyle = '#6e9e3a'; ctx.fillRect(3, 6, 4, 2); ctx.fillRect(9, 7, 4, 2); ctx.fillRect(5, 4, 6, 2);
    ctx.fillStyle = '#9ad05a'; ctx.fillRect(3, 6, 1, 1); ctx.fillRect(12, 7, 1, 1);
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(5, 8, 1, 1); ctx.fillRect(10, 6, 1, 1);   // white blossoms
    ctx.fillStyle = '#5e9a3a'; ctx.fillRect(6, 10, 1, 3); ctx.fillRect(9, 10, 1, 2);  // green peppers forming
  });
  atlas['t-crop-chili-3'] = tile(ctx => {                                            // ripe — red pointed chilies
    ctx.fillStyle = '#4a7a30'; ctx.fillRect(7, 4, 2, 10);
    ctx.fillStyle = '#6e9e3a'; ctx.fillRect(3, 5, 4, 2); ctx.fillRect(9, 5, 4, 2); ctx.fillRect(5, 3, 6, 2);
    ctx.fillStyle = '#9ad05a'; ctx.fillRect(3, 5, 1, 1); ctx.fillRect(12, 5, 1, 1);
    // hanging chilies: 2px body tapering to a 1px point at the bottom
    ctx.fillStyle = '#cc2a22';
    ctx.fillRect(4, 8, 2, 3); ctx.fillRect(4, 11, 1, 2);                              // left chili
    ctx.fillRect(10, 9, 2, 3); ctx.fillRect(11, 12, 1, 2);                            // right chili
    ctx.fillRect(7, 10, 2, 2); ctx.fillRect(7, 12, 1, 2);                             // center chili
    ctx.fillStyle = '#ef5a4a'; ctx.fillRect(4, 8, 1, 1); ctx.fillRect(10, 9, 1, 1); ctx.fillRect(7, 10, 1, 1); // sheen
    ctx.fillStyle = '#3e6020'; ctx.fillRect(4, 7, 1, 1); ctx.fillRect(11, 8, 1, 1);   // green caps
  });

  // MELON — low sprawling vine → one big round striped green melon.
  atlas['t-crop-melon-0'] = tile(ctx => {                                            // low seedling
    ctx.fillStyle = '#3a2716'; ctx.fillRect(6, 12, 4, 2);
    ctx.fillStyle = '#5e8a3a'; ctx.fillRect(7, 11, 1, 1); ctx.fillRect(6, 10, 1, 1); ctx.fillRect(8, 10, 1, 1);
    ctx.fillStyle = '#7cb84f'; ctx.fillRect(7, 9, 1, 1);
  });
  atlas['t-crop-melon-1'] = tile(ctx => {                                            // sprawling vine, broad leaves
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(3, 12, 10, 1);                            // vine runner
    ctx.fillStyle = '#5e8a3a'; ctx.fillRect(2, 9, 4, 3); ctx.fillRect(10, 9, 4, 3); ctx.fillRect(6, 8, 4, 3);
    ctx.fillStyle = '#7cb84f'; ctx.fillRect(2, 9, 1, 1); ctx.fillRect(13, 9, 1, 1); ctx.fillRect(7, 8, 1, 1);
  });
  atlas['t-crop-melon-2'] = tile(ctx => {                                            // flower + small green melon forming
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(2, 12, 12, 1);
    ctx.fillStyle = '#5e8a3a'; ctx.fillRect(2, 9, 3, 3); ctx.fillRect(11, 9, 3, 3);
    ctx.fillStyle = '#7cb84f'; ctx.fillRect(2, 9, 1, 1); ctx.fillRect(13, 9, 1, 1);
    ctx.fillStyle = '#ffe87a'; ctx.fillRect(11, 7, 2, 2); ctx.fillStyle = '#ffd24a'; ctx.fillRect(12, 8, 1, 1); // flower
    ctx.fillStyle = '#6e9e3a'; ctx.fillRect(6, 10, 4, 3); ctx.fillRect(7, 9, 2, 1);   // small green melon
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(7, 10, 1, 3);
  });
  atlas['t-crop-melon-3'] = tile(ctx => {                                            // ripe — big round striped melon
    ctx.fillStyle = '#5e8a3a'; ctx.fillRect(5, 6, 6, 9); ctx.fillRect(4, 7, 8, 7);    // rounded body
    ctx.fillStyle = '#3e6020'; ctx.fillRect(7, 6, 1, 8); ctx.fillRect(5, 8, 1, 5); ctx.fillRect(10, 8, 1, 5); // dark stripes
    ctx.fillStyle = '#7cb84f'; ctx.fillRect(5, 7, 2, 1); ctx.fillRect(6, 8, 1, 1);    // highlight
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(8, 5, 1, 1);                              // stem nub
    ctx.fillStyle = '#5e8a3a'; ctx.fillRect(10, 4, 3, 2); ctx.fillStyle = '#7cb84f'; ctx.fillRect(12, 4, 1, 1); // side leaf
  });

  // TEA — rounded green shrub → glossy leaves with tiny white blossoms.
  atlas['t-crop-tea-0'] = tile(ctx => seedling(ctx, '#4d8a3e', '#6eae4e'));
  atlas['t-crop-tea-1'] = tile(ctx => {                                              // small rounded bush
    ctx.fillStyle = '#3e7a36'; ctx.fillRect(5, 9, 6, 5); ctx.fillRect(6, 8, 4, 1);
    ctx.fillStyle = '#4d8a3e'; ctx.fillRect(6, 9, 4, 3);
    ctx.fillStyle = '#6eae4e'; ctx.fillRect(6, 8, 2, 1); ctx.fillRect(6, 9, 1, 1);
  });
  atlas['t-crop-tea-2'] = tile(ctx => {                                              // fuller shrub
    ctx.fillStyle = '#2f5a2a'; ctx.fillRect(3, 8, 10, 6); ctx.fillRect(4, 7, 8, 1);
    ctx.fillStyle = '#3e7a36'; ctx.fillRect(4, 8, 8, 4); ctx.fillRect(5, 6, 6, 2);
    ctx.fillStyle = '#4d8a3e'; ctx.fillRect(5, 7, 3, 2); ctx.fillRect(9, 8, 2, 2);
    ctx.fillStyle = '#6eae4e'; ctx.fillRect(5, 6, 1, 1); ctx.fillRect(8, 6, 1, 1);
  });
  atlas['t-crop-tea-3'] = tile(ctx => {                                              // ripe — glossy dense shrub + blossoms
    ctx.fillStyle = '#2f5a2a'; ctx.fillRect(3, 7, 10, 7); ctx.fillRect(4, 6, 8, 1); ctx.fillRect(5, 5, 6, 1);
    ctx.fillStyle = '#3e7a36'; ctx.fillRect(4, 7, 8, 5); ctx.fillRect(5, 6, 6, 1);
    ctx.fillStyle = '#4d8a3e'; ctx.fillRect(5, 6, 3, 2); ctx.fillRect(9, 7, 2, 2); ctx.fillRect(6, 9, 2, 2);
    ctx.fillStyle = '#6eae4e'; ctx.fillRect(5, 6, 1, 1); ctx.fillRect(9, 7, 1, 1);    // glossy highlights
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(6, 7, 1, 1); ctx.fillRect(10, 9, 1, 1); ctx.fillRect(8, 11, 1, 1); // white blossoms
    ctx.fillStyle = '#ffe87a'; ctx.fillRect(6, 7, 1, 1);                              // one blossom heart
  });

  // MOON — dark slender stalk → ethereal pale glowing moonflower (rare capstone).
  atlas['t-crop-moon-0'] = tile(ctx => {                                             // dark sprout, pale tip
    ctx.fillStyle = '#3a2716'; ctx.fillRect(6, 12, 4, 2);
    ctx.fillStyle = '#2e3a4a'; ctx.fillRect(7, 9, 1, 3);
    ctx.fillStyle = '#5a7a6a'; ctx.fillRect(6, 9, 1, 1); ctx.fillRect(8, 8, 1, 1);
    ctx.fillStyle = '#cfe4ff'; ctx.fillRect(7, 7, 1, 1);
  });
  atlas['t-crop-moon-1'] = tile(ctx => {                                             // slender dark stalk
    ctx.fillStyle = '#2e3a4a'; ctx.fillRect(7, 6, 2, 8);
    ctx.fillStyle = '#3a4a5e'; ctx.fillRect(4, 9, 3, 1); ctx.fillRect(9, 10, 3, 1);
    ctx.fillStyle = '#4a6a5a'; ctx.fillRect(4, 9, 1, 1); ctx.fillRect(11, 10, 1, 1);
  });
  atlas['t-crop-moon-2'] = tile(ctx => {                                             // pale closed bud
    ctx.fillStyle = '#2e3a4a'; ctx.fillRect(7, 6, 2, 8);
    ctx.fillStyle = '#3a4a5e'; ctx.fillRect(4, 10, 3, 1); ctx.fillRect(9, 11, 3, 1);
    ctx.fillStyle = 'rgba(180,210,255,0.18)'; ctx.fillRect(5, 2, 6, 5);              // faint glow
    ctx.fillStyle = '#8aa6c8'; ctx.fillRect(6, 3, 4, 4); ctx.fillRect(7, 2, 2, 1);   // teardrop bud
    ctx.fillStyle = '#cfe4ff'; ctx.fillRect(7, 3, 1, 2);
  });
  atlas['t-crop-moon-3'] = tile(ctx => {                                             // ripe — glowing moonflower bloom
    ctx.fillStyle = '#2e3a4a'; ctx.fillRect(7, 8, 2, 6);                              // dark stalk
    ctx.fillStyle = '#3a4a5e'; ctx.fillRect(4, 10, 3, 1); ctx.fillRect(9, 11, 3, 1);  // dark leaves
    ctx.fillStyle = 'rgba(170,205,255,0.22)'; ctx.fillRect(2, 0, 12, 9);              // soft outer glow
    ctx.fillStyle = 'rgba(205,228,255,0.30)'; ctx.fillRect(4, 1, 8, 7);              // inner glow
    ctx.fillStyle = '#cfe4ff'; ctx.fillRect(5, 2, 6, 6); ctx.fillRect(4, 3, 8, 4);    // pale petals
    ctx.fillStyle = '#eaf4ff'; ctx.fillRect(6, 2, 1, 1); ctx.fillRect(9, 2, 1, 1); ctx.fillRect(4, 4, 1, 2); ctx.fillRect(11, 4, 1, 2); // petal tips
    ctx.fillStyle = '#9fd0ff'; ctx.fillRect(7, 4, 2, 2);                              // glowing center
    ctx.fillStyle = '#ffffff'; ctx.fillRect(7, 4, 1, 1);
  });

  // ---- Greenhouse props & menu icons ------------------------------------
  // Floor lamp whose shade is a glowing bloom (warm petals + a moonflower-cool core).
  atlas['f-bloomlamp'] = tile(ctx => {
    ctx.fillStyle = '#4a3f36'; ctx.fillRect(5, 14, 6, 2);                             // base
    ctx.fillStyle = '#5a4d42'; ctx.fillRect(6, 15, 4, 1);
    ctx.fillStyle = '#6e5a48'; ctx.fillRect(7, 6, 2, 9);                              // pole
    ctx.fillStyle = '#5a4738'; ctx.fillRect(9, 6, 1, 9);
    ctx.fillStyle = 'rgba(255,210,150,0.22)'; ctx.fillRect(2, 0, 12, 8);              // warm glow halo
    ctx.fillStyle = 'rgba(255,228,180,0.30)'; ctx.fillRect(3, 1, 10, 6);
    ctx.fillStyle = '#ffcf6a'; ctx.fillRect(4, 1, 8, 5); ctx.fillRect(3, 2, 10, 3);   // warm flower-shade petals
    ctx.fillStyle = '#ffe6a8'; ctx.fillRect(5, 1, 2, 1); ctx.fillRect(9, 1, 2, 1); ctx.fillRect(3, 3, 1, 1); ctx.fillRect(12, 3, 1, 1);
    ctx.fillStyle = '#cfe4ff'; ctx.fillRect(6, 4, 4, 2);                              // cool moonflower-glow core
    ctx.fillStyle = '#ffffff'; ctx.fillRect(7, 4, 2, 1);
  });
  // Open-top wooden produce crate — drop harvested crops in.
  atlas['t-gh-shipbox'] = tile(ctx => {
    ctx.fillStyle = '#7a5638'; ctx.fillRect(2, 4, 12, 11);                            // box body
    ctx.fillStyle = '#2c1d10'; ctx.fillRect(3, 4, 10, 4);                             // open dark interior
    ctx.fillStyle = '#d83a2e'; ctx.fillRect(5, 6, 2, 2);                              // tomato peeking inside
    ctx.fillStyle = '#5e8a3a'; ctx.fillRect(9, 6, 2, 2);                              // greens peeking inside
    ctx.fillStyle = '#8a6440'; ctx.fillRect(2, 8, 12, 6);                             // front face
    ctx.fillStyle = '#a87c52'; ctx.fillRect(2, 8, 12, 1);                             // lit front rim
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(2, 11, 12, 1); ctx.fillRect(7, 8, 1, 6);  // plank seams
    ctx.fillStyle = '#4a3320'; ctx.fillRect(2, 4, 1, 11); ctx.fillRect(13, 4, 1, 11); // corner posts
    ctx.fillStyle = '#3a2716'; ctx.fillRect(2, 14, 12, 1);                            // base shadow
  });
  // Seed packet menu icon.
  atlas['i-seeds'] = tile(ctx => {
    ctx.fillStyle = '#c9a227'; ctx.fillRect(4, 2, 8, 12);                             // packet paper
    ctx.fillStyle = '#a3801a'; ctx.fillRect(4, 2, 8, 1); ctx.fillRect(4, 2, 1, 12); ctx.fillRect(11, 2, 1, 12); // edges
    ctx.fillStyle = '#e8d48a'; ctx.fillRect(5, 3, 6, 4);                              // label window
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(6, 4, 2, 2); ctx.fillStyle = '#ffd24a'; ctx.fillRect(8, 4, 1, 1); // plant pic
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(6, 9, 4, 1); ctx.fillRect(6, 11, 3, 1);   // text lines
    ctx.fillStyle = '#7a5638'; ctx.fillRect(5, 14, 1, 1); ctx.fillRect(8, 15, 1, 1); ctx.fillRect(10, 14, 1, 1); // spilled seeds
  });
  // Watering can menu icon.
  atlas['i-wateringcan'] = tile(ctx => {
    ctx.fillStyle = '#3d8a9e'; ctx.fillRect(4, 6, 7, 7);                              // body
    ctx.fillStyle = '#56a8bc'; ctx.fillRect(4, 6, 7, 1); ctx.fillRect(4, 6, 1, 7);    // lit edges
    ctx.fillStyle = '#2c6477'; ctx.fillRect(10, 6, 1, 7);                             // shadow side
    ctx.fillStyle = '#3d8a9e'; ctx.fillRect(11, 4, 3, 2); ctx.fillRect(13, 3, 2, 2);  // spout
    ctx.fillStyle = '#2c6477'; ctx.fillRect(5, 3, 5, 1); ctx.fillRect(5, 3, 1, 3); ctx.fillRect(9, 3, 1, 3); // handle
    ctx.fillStyle = '#9fe0ef'; ctx.fillRect(15, 5, 1, 1); ctx.fillRect(14, 7, 1, 1);  // water drops
  });
  // Fertilizer / compost sack menu icon.
  atlas['i-fertilizer'] = tile(ctx => {
    ctx.fillStyle = '#8a6440'; ctx.fillRect(4, 3, 8, 11);                             // burlap sack
    ctx.fillStyle = '#7a5638'; ctx.fillRect(11, 3, 1, 11);                            // shaded side
    ctx.fillStyle = '#9a7350'; ctx.fillRect(5, 4, 2, 9);                              // highlight
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(5, 2, 6, 2); ctx.fillRect(6, 1, 4, 1);    // tied top
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(7, 7, 2, 3); ctx.fillStyle = '#6e9e3a'; ctx.fillRect(6, 8, 1, 1); ctx.fillRect(9, 8, 1, 1); // leaf label
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(3, 14, 3, 1); ctx.fillRect(10, 14, 3, 1); // spilled compost
    ctx.fillStyle = '#3e6020'; ctx.fillRect(4, 15, 1, 1); ctx.fillRect(11, 15, 1, 1);
  });
};

// ---- Decor + Food (procedural; dish/grocery/friendship icons, wallpaper +
// floor tiles, area rugs). Same palette + upper-left warm light as everything
// else. Icons are transparent; wall/floor tiles fill + tile seamlessly; rugs
// are 32x32 top-down with a soft contact shadow. -------------------------
const buildDecorFood = (atlas: Atlas) => {
  // Fill a 1=on mask with a flat colour (for hearts).
  const drawMask = (ctx: CanvasRenderingContext2D, rows: string[], ox: number, oy: number, col: string) => {
    ctx.fillStyle = col;
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] !== '.') ctx.fillRect(ox + x, oy + y, 1, 1); });
  };
  // Trace just the 1px outline of a mask (for the empty heart).
  const drawOutline = (ctx: CanvasRenderingContext2D, rows: string[], ox: number, oy: number, col: string) => {
    const on = (x: number, y: number) => y >= 0 && y < rows.length && x >= 0 && x < rows[y].length && rows[y][x] !== '.';
    ctx.fillStyle = col;
    rows.forEach((r, y) => {
      for (let x = 0; x < r.length; x++) {
        if (r[x] === '.') continue;
        if (!on(x - 1, y) || !on(x + 1, y) || !on(x, y - 1) || !on(x, y + 1)) ctx.fillRect(ox + x, oy + y, 1, 1);
      }
    });
  };
  // Rounded-rect field (rugs): r px clipped from each corner so it reads soft.
  const rrect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, col: string, r: number) => {
    ctx.fillStyle = col;
    ctx.fillRect(x + r, y, w - 2 * r, h);
    ctx.fillRect(x, y + r, w, h - 2 * r);
  };

  // ===== A. Cooking — dish icons (16x16, transparent) =====================
  atlas['i-dish-onigiri'] = tile(ctx => {
    // rice triangle, nori band at the base, umeboshi dot + sesame fleck.
    ctx.fillStyle = '#e8e0d0';                                                         // rice (shadow base)
    ctx.fillRect(7, 2, 2, 1); ctx.fillRect(6, 3, 4, 1); ctx.fillRect(6, 4, 5, 1);
    ctx.fillRect(5, 5, 6, 1); ctx.fillRect(5, 6, 7, 1); ctx.fillRect(4, 7, 8, 1);
    ctx.fillRect(4, 8, 9, 1); ctx.fillRect(3, 9, 10, 1); ctx.fillRect(3, 10, 11, 1);
    ctx.fillStyle = '#f4efe2';                                                         // lit upper-left
    ctx.fillRect(7, 2, 1, 1); ctx.fillRect(6, 3, 2, 1); ctx.fillRect(6, 4, 2, 1);
    ctx.fillRect(5, 5, 3, 1); ctx.fillRect(5, 6, 2, 1); ctx.fillRect(4, 7, 2, 1); ctx.fillRect(4, 8, 2, 1);
    ctx.fillStyle = '#d05050'; ctx.fillRect(8, 5, 2, 2);                               // umeboshi
    ctx.fillStyle = '#e87a6a'; ctx.fillRect(8, 5, 1, 1);
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(6, 8, 1, 1); ctx.fillRect(10, 9, 1, 1);    // sesame flecks
    ctx.fillStyle = '#3a4250'; ctx.fillRect(4, 11, 9, 1);                              // nori band lit edge
    ctx.fillStyle = '#2c3038'; ctx.fillRect(4, 12, 9, 2); ctx.fillRect(5, 14, 7, 1);   // nori band
  });
  atlas['i-dish-grillfish'] = tile(ctx => {
    // grilled fish on a small oval plate, char marks, a lemon wedge.
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(2, 12, 12, 1);                             // plate rim shadow
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 10, 12, 2); ctx.fillRect(1, 11, 14, 1); // plate
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(2, 10, 6, 1);                              // plate lit
    ctx.fillStyle = '#8a6644'; ctx.fillRect(3, 6, 9, 4); ctx.fillRect(2, 7, 1, 2);     // fish body
    ctx.fillStyle = '#a9805a'; ctx.fillRect(3, 6, 9, 1);                               // back lit
    ctx.fillStyle = '#caa27c'; ctx.fillRect(4, 8, 7, 1);                               // belly
    ctx.fillStyle = '#12110d'; ctx.fillRect(12, 6, 2, 4);                              // tail
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(5, 7, 1, 2); ctx.fillRect(8, 7, 1, 2);     // char marks
    ctx.fillStyle = '#16181d'; ctx.fillRect(3, 7, 1, 1);                               // eye
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(2, 8, 2, 2);                               // lemon wedge
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(2, 8, 1, 1);
  });
  atlas['i-dish-fishbowl'] = tile(ctx => {
    // donburi: blue bowl, white rice mound, orange fish slices.
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(5, 4, 6, 3); ctx.fillRect(4, 5, 8, 2);     // rice mound
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(4, 6, 8, 1);
    ctx.fillStyle = '#e07840'; ctx.fillRect(5, 4, 3, 2); ctx.fillRect(9, 5, 2, 2);     // fish slices
    ctx.fillStyle = '#f0a060'; ctx.fillRect(5, 4, 2, 1); ctx.fillRect(9, 5, 1, 1);
    ctx.fillStyle = '#c86030'; ctx.fillRect(6, 5, 1, 1);
    ctx.fillStyle = '#2e5e8e'; ctx.fillRect(2, 7, 12, 6); ctx.fillRect(3, 13, 10, 1);  // bowl
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(2, 7, 12, 2);                              // bowl lit
    ctx.fillStyle = '#5b8cbe'; ctx.fillRect(2, 7, 12, 1);                              // rim highlight
    ctx.fillStyle = '#27517c'; ctx.fillRect(2, 11, 12, 2);                             // bowl shadow
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(3, 8, 2, 1);                               // glaze glint
  });
  atlas['i-dish-stirfry'] = tile(ctx => {
    // plate of colourful veg stir-fry with a wisp of steam.
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(7, 1, 1, 3); ctx.fillRect(9, 2, 1, 2);     // steam
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(2, 12, 12, 1);                             // plate rim shadow
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 10, 12, 2); ctx.fillRect(1, 11, 14, 1); // plate
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(2, 10, 6, 1);
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(3, 6, 10, 4); ctx.fillRect(4, 5, 7, 1);    // greens pile
    ctx.fillStyle = '#6f9e5e'; ctx.fillRect(4, 6, 4, 1); ctx.fillRect(9, 6, 2, 1);     // lit greens
    ctx.fillStyle = '#4d7440'; ctx.fillRect(4, 9, 8, 1);                               // shaded greens
    ctx.fillStyle = '#d05050'; ctx.fillRect(5, 7, 2, 2); ctx.fillRect(10, 6, 2, 1);    // red pepper
    ctx.fillStyle = '#e87a6a'; ctx.fillRect(5, 7, 1, 1);
    ctx.fillStyle = '#e0843a'; ctx.fillRect(8, 8, 2, 1); ctx.fillRect(4, 7, 1, 1);     // carrot
  });
  atlas['i-dish-misosoup'] = tile(ctx => {
    // lacquer bowl of miso: tofu cubes, scallion, steam wisps.
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(5, 1, 1, 3); ctx.fillRect(9, 2, 1, 2);     // steam
    ctx.fillStyle = '#9e6a4a'; ctx.fillRect(3, 6, 10, 2);                              // miso surface
    ctx.fillStyle = '#b07a54'; ctx.fillRect(3, 6, 10, 1);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(5, 6, 2, 2); ctx.fillRect(9, 7, 2, 1);     // tofu cubes
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(5, 6, 1, 1);
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(8, 6, 1, 1); ctx.fillRect(4, 7, 1, 1);     // scallion bits
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(2, 8, 12, 5); ctx.fillRect(3, 13, 10, 1);  // bowl
    ctx.fillStyle = '#a83b2c'; ctx.fillRect(2, 8, 12, 1);                              // bowl lit rim
    ctx.fillStyle = '#6e1f15'; ctx.fillRect(2, 11, 12, 2);                             // bowl shadow
    ctx.fillStyle = '#c0392b'; ctx.fillRect(3, 9, 3, 1);                               // sheen
  });
  atlas['i-dish-smoothie'] = tile(ctx => {
    // tall glass of tropical smoothie, a straw, a leaf garnish.
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(4, 4, 7, 11);                              // glass (side)
    ctx.fillStyle = '#c7e0f4'; ctx.fillRect(4, 4, 2, 11);                              // glass lit edge
    ctx.fillStyle = '#e0843a'; ctx.fillRect(5, 6, 5, 8);                               // smoothie base
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(5, 6, 5, 3);                               // sunny top layer
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(6, 6, 2, 1);
    ctx.fillStyle = '#c86030'; ctx.fillRect(5, 12, 5, 2);                              // settled fruit
    ctx.fillStyle = '#e857a8'; ctx.fillRect(9, 1, 1, 6);                               // straw
    ctx.fillStyle = '#f6b4dc'; ctx.fillRect(9, 1, 1, 2);
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(5, 3, 3, 2); ctx.fillRect(4, 4, 1, 1);     // leaf garnish
    ctx.fillStyle = '#6f9e5e'; ctx.fillRect(5, 3, 1, 1);
  });
  atlas['i-dish-hotpot'] = tile(ctx => {
    // donabe nabe pot, lid + handles, bubbling, steam, a flame hint beneath.
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(5, 0, 1, 3); ctx.fillRect(9, 1, 1, 2);     // steam
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(7, 1, 1, 2);
    ctx.fillStyle = '#3a4250'; ctx.fillRect(3, 4, 10, 3);                              // lid
    ctx.fillStyle = '#566069'; ctx.fillRect(3, 4, 10, 1);                              // lid lit
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(7, 3, 2, 1);                               // lid knob
    ctx.fillStyle = '#3a4250'; ctx.fillRect(2, 7, 12, 5);                              // pot body
    ctx.fillStyle = '#4a525c'; ctx.fillRect(2, 7, 12, 1);                              // body lit
    ctx.fillStyle = '#2c3038'; ctx.fillRect(2, 11, 12, 1);                             // body shadow
    ctx.fillStyle = '#3a4250'; ctx.fillRect(0, 8, 2, 2); ctx.fillRect(14, 8, 2, 2);    // handles
    ctx.fillStyle = '#e07840'; ctx.fillRect(4, 8, 8, 2);                               // broth peeking
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(6, 8, 2, 1);                               // bubble glint
    ctx.fillStyle = '#e0552e'; ctx.fillRect(5, 13, 2, 2); ctx.fillRect(9, 13, 2, 2);   // flame hint
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(5, 14, 1, 1); ctx.fillRect(10, 14, 1, 1);
  });
  atlas['i-dish-breakfast'] = tile(ctx => {
    // breakfast set: fried egg, a rice mound, a fish piece — a full plate.
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(1, 13, 14, 1);                             // plate rim shadow
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(1, 4, 14, 9); ctx.fillRect(2, 3, 12, 1);   // plate
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(2, 4, 12, 1);                              // plate lit
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(1, 12, 14, 1);
    ctx.fillStyle = '#f4f8fb'; ctx.fillRect(2, 6, 5, 5); ctx.fillRect(3, 5, 3, 1);     // fried egg white
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(3, 7, 3, 2);                               // yolk
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(3, 7, 1, 1);
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(7, 6, 5, 3); ctx.fillRect(8, 5, 3, 1);     // rice mound
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(7, 8, 5, 1);
    ctx.fillStyle = '#8a6644'; ctx.fillRect(8, 10, 5, 2);                              // fish piece
    ctx.fillStyle = '#a9805a'; ctx.fillRect(8, 10, 5, 1);
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(10, 10, 1, 2);                             // char mark
  });
  atlas['i-cook'] = tile(ctx => {
    // chunky cooking pot with a lid + rising steam (the Kitchen button).
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(5, 0, 1, 3); ctx.fillRect(8, 1, 1, 2); ctx.fillRect(10, 0, 1, 3); // steam
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(7, 5, 2, 1);                              // lid knob shadow
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(7, 4, 2, 1);                              // lid knob
    ctx.fillStyle = '#6e7682'; ctx.fillRect(2, 6, 12, 2);                             // lid
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(2, 6, 12, 1);                             // lid lit
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(3, 6, 4, 1);                              // lid highlight
    ctx.fillStyle = '#6e7682'; ctx.fillRect(3, 8, 10, 6);                             // pot body
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(3, 8, 10, 1);                             // body lit
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(3, 8, 1, 6);                              // left highlight
    ctx.fillStyle = '#3a4250'; ctx.fillRect(3, 12, 10, 2);                            // body shadow
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(1, 9, 2, 2); ctx.fillRect(13, 9, 2, 2);   // handles
    ctx.fillStyle = '#3a4250'; ctx.fillRect(1, 10, 2, 1); ctx.fillRect(13, 10, 2, 1);
  });

  // ===== B. Cooking — grocery / pantry icons (16x16, transparent) =========
  atlas['i-rice'] = tile(ctx => {
    // burlap sack open at the top, a mound of white rice grains.
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(3, 6, 10, 9); ctx.fillRect(4, 5, 8, 1);    // sack
    ctx.fillStyle = '#ddcc9c'; ctx.fillRect(3, 6, 10, 1); ctx.fillRect(3, 6, 1, 9);    // sack lit
    ctx.fillStyle = '#b8a578'; ctx.fillRect(12, 6, 1, 9); ctx.fillRect(3, 14, 10, 1);  // sack shadow
    ctx.fillStyle = '#b8a578'; ctx.fillRect(4, 4, 8, 2);                               // rolled rim shadow
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(5, 3, 6, 3); ctx.fillRect(6, 2, 4, 1);     // rice mound
    ctx.fillStyle = '#ffffff'; ctx.fillRect(6, 3, 2, 1);                               // rice hi
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(5, 5, 6, 1);                               // rice base shade
    ctx.fillStyle = '#9a8862'; ctx.fillRect(7, 9, 3, 1); ctx.fillRect(7, 11, 2, 1);    // sack seam
  });
  atlas['i-egg'] = tile(ctx => {
    // two cream eggs nestled together, soft shadow.
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(3, 13, 11, 1);                             // contact shadow
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(3, 6, 6, 7); ctx.fillRect(4, 5, 4, 1); ctx.fillRect(4, 13, 4, 1); // egg A
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(4, 5, 3, 2);                               // egg A hi
    ctx.fillStyle = '#d8cdb2'; ctx.fillRect(7, 10, 2, 3);                              // egg A shade
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(8, 7, 6, 7); ctx.fillRect(9, 6, 4, 1); ctx.fillRect(9, 14, 4, 1); // egg B
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(9, 6, 3, 2);                               // egg B hi
    ctx.fillStyle = '#d8cdb2'; ctx.fillRect(12, 11, 2, 3);                             // egg B shade
  });
  atlas['i-veg'] = tile(ctx => {
    // leafy bok-choy bunch: dark green tops, pale stalk base.
    ctx.fillStyle = '#4d7440'; ctx.fillRect(4, 1, 3, 6); ctx.fillRect(9, 1, 3, 6);     // outer leaves
    ctx.fillRect(3, 3, 1, 4); ctx.fillRect(12, 3, 1, 4);
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(6, 2, 4, 6); ctx.fillRect(7, 1, 2, 1);     // mid leaves
    ctx.fillStyle = '#6f9e5e'; ctx.fillRect(6, 2, 2, 2); ctx.fillRect(4, 2, 1, 2);     // leaf hi
    ctx.fillStyle = '#3e5c33'; ctx.fillRect(8, 5, 1, 3); ctx.fillRect(11, 4, 1, 2);    // leaf shade
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(6, 7, 4, 7); ctx.fillRect(7, 14, 2, 1);    // pale stalk base
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(6, 7, 1, 6);                               // stalk lit
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(9, 8, 1, 5);                               // stalk shade
    ctx.fillStyle = '#9aa86b'; ctx.fillRect(7, 7, 2, 1);                               // stalk/leaf join
  });

  // ===== C. Friendship icons (16x16, transparent) =========================
  const HEART = [
    '.XXX...XXX..',
    'XXXXX.XXXXX.',
    'XXXXXXXXXXXX',
    'XXXXXXXXXXXX',
    '.XXXXXXXXXX.',
    '..XXXXXXXX..',
    '...XXXXXX...',
    '....XXXX....',
    '.....XX.....',
  ];
  atlas['i-heart'] = tile(ctx => {
    drawMask(ctx, HEART, 2, 3, '#d05050');                                             // mid
    // upper-left highlight bumps
    drawMask(ctx, ['.XX....X...', 'XXX...XX...', 'XX....X....'], 2, 3, '#e87a6a');
    // lower-right shadow + bottom edge
    drawMask(ctx, ['...........', '.........X.', '.......XXXX', '......XXXXX', '.....XXXXX.', '....XXXXX..', '....XXXX...', '.....XXX...', '......X....'], 2, 3, '#c0392b');
    drawMask(ctx, ['..........', '..........', '..........', '..........', '..........', '..........', '....XXXX..', '.....XXX..', '......X...'], 2, 3, '#8e2a1e');
  });
  atlas['i-heart-empty'] = tile(ctx => {
    drawOutline(ctx, HEART, 2, 3, '#9e3a3a');                                          // hollow outline
  });
  atlas['i-gift'] = tile(ctx => {
    // wrapped present: blue box, gold ribbon cross + bow, shallow front face.
    ctx.fillStyle = '#27517c'; ctx.fillRect(2, 6, 12, 8);                              // box front
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(2, 5, 12, 3);                              // box top face
    ctx.fillStyle = '#5b8cbe'; ctx.fillRect(2, 5, 12, 1);                              // top lit edge
    ctx.fillStyle = '#1d2a3a'; ctx.fillRect(2, 13, 12, 1);                             // base shadow
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7, 5, 2, 9);                               // ribbon vertical
    ctx.fillStyle = '#c9a227'; ctx.fillRect(8, 5, 1, 9);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(2, 8, 12, 2);                              // ribbon horizontal
    ctx.fillStyle = '#c9a227'; ctx.fillRect(2, 9, 12, 1);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(5, 2, 2, 3); ctx.fillRect(9, 2, 2, 3);     // bow loops
    ctx.fillRect(4, 3, 1, 1); ctx.fillRect(11, 3, 1, 1);
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(5, 2, 1, 1); ctx.fillRect(9, 2, 1, 1);     // bow hi
    ctx.fillStyle = '#c9a227'; ctx.fillRect(7, 3, 2, 2);                               // bow knot
  });

  // ===== D. Wallpaper tiles (16x16, fill, seamless all directions) ========
  atlas['t-wall-cream'] = tile(ctx => {
    // warm cream plaster, faint vertical pinstripe (period 4 = seamless).
    fill(ctx, '#e8e0d0');
    ctx.fillStyle = '#dcd2bb'; for (let x = 3; x < 16; x += 4) ctx.fillRect(x, 0, 1, 16);
    ctx.fillStyle = '#f0e9d8'; ctx.fillRect(1, 0, 1, 16);
    speckle(ctx, '#ddd3bd', 41, 5);
  });
  atlas['t-wall-wood'] = tile(ctx => {
    // wood-panel wainscot: vertical planks (8px = seamless), seam lines, top rail.
    fill(ctx, '#8a6644');
    ctx.fillStyle = '#7a5638'; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#8a6644'; ctx.fillRect(1, 0, 6, 16); ctx.fillRect(9, 0, 6, 16);   // plank faces
    ctx.fillStyle = '#9a7350'; ctx.fillRect(1, 0, 1, 16); ctx.fillRect(9, 0, 1, 16);   // plank lit edge
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(0, 0, 1, 16); ctx.fillRect(8, 0, 1, 16); ctx.fillRect(7, 0, 1, 16); ctx.fillRect(15, 0, 1, 16); // seams
    ctx.fillStyle = '#9a7350'; ctx.fillRect(0, 0, 16, 1);                              // top rail (lit)
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(0, 2, 16, 1);                              // rail shadow
    speckle(ctx, '#7a5638', 47, 4);
  });
  atlas['t-wall-mint'] = tile(ctx => {
    // soft sage with a faint diamond/dot motif on an 8px grid (seamless).
    fill(ctx, '#aed8c6');
    ctx.fillStyle = '#9cc8b4'; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#aed8c6'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 0, 1, 16);   // subtle lit
    ctx.fillStyle = '#88b8a4';                                                         // diamond dots
    ctx.fillRect(4, 3, 1, 1); ctx.fillRect(3, 4, 3, 1); ctx.fillRect(4, 5, 1, 1);      // diamond @ (4,4)
    ctx.fillRect(12, 11, 1, 1); ctx.fillRect(11, 12, 3, 1); ctx.fillRect(12, 13, 1, 1);// diamond @ (12,12)
    ctx.fillStyle = '#b8e0ce'; ctx.fillRect(12, 4, 1, 1); ctx.fillRect(4, 12, 1, 1);   // tiny dot highlights
  });
  atlas['t-wall-sakura'] = tile(ctx => {
    // pale pink with sparse cherry-blossom petals (interior = seamless).
    fill(ctx, '#f0cfe0');
    ctx.fillStyle = '#f6dcea'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 0, 1, 16);
    speckle(ctx, '#e8c2d8', 59, 4);
    ctx.fillStyle = '#e857a8';                                                         // petals (4-pixel blossoms)
    ctx.fillRect(4, 4, 1, 1); ctx.fillRect(3, 5, 1, 1); ctx.fillRect(5, 5, 1, 1);
    ctx.fillRect(11, 9, 1, 1); ctx.fillRect(10, 10, 1, 1); ctx.fillRect(12, 10, 1, 1);
    ctx.fillStyle = '#f6b4dc'; ctx.fillRect(4, 5, 1, 1); ctx.fillRect(11, 10, 1, 1);   // petal centers
    ctx.fillStyle = '#e857a8'; ctx.fillRect(8, 12, 1, 1);                              // stray petal
  });
  atlas['t-wall-navy'] = tile(ctx => {
    // cosy night-sky wall: deep navy with sparse warm star specks.
    fill(ctx, '#27517c');
    ctx.fillStyle = '#1d2a3a'; ctx.fillRect(0, 12, 16, 4);                             // deeper toward bottom
    ctx.fillStyle = '#2e5e8e'; ctx.fillRect(0, 0, 16, 1);                              // faint top glow
    speckle(ctx, '#1f3a55', 67, 5);
    ctx.fillStyle = '#ffd24a';                                                         // stars
    ctx.fillRect(4, 3, 1, 1); ctx.fillRect(11, 6, 1, 1); ctx.fillRect(7, 10, 1, 1); ctx.fillRect(13, 12, 1, 1);
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(4, 3, 1, 1);                               // brightest star core
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(2, 8, 1, 1); ctx.fillRect(9, 14, 1, 1);    // faint distant stars
  });

  // ===== E. Floor tiles (16x16, fill, seamless all directions) ============
  atlas['t-floor-oak'] = tile(ctx => {
    // clean warm oak planks (lighter cousin of t-wood).
    fill(ctx, '#a9805a');
    ctx.fillStyle = '#b5895f'; ctx.fillRect(0, 0, 16, 5); ctx.fillRect(0, 11, 16, 5);  // lit plank faces
    ctx.fillStyle = '#96704c'; ctx.fillRect(0, 5, 16, 1); ctx.fillRect(0, 10, 16, 1);  // plank seams
    ctx.fillStyle = '#c29a70'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 11, 16, 1);  // seam highlights
    ctx.fillStyle = '#96704c'; ctx.fillRect(4, 1, 1, 4); ctx.fillRect(11, 12, 1, 3); ctx.fillRect(8, 7, 1, 3); // grain ticks
    speckle(ctx, '#bb9268', 7, 5);
  });
  atlas['t-floor-tatami'] = tile(ctx => {
    // tatami mat: pale straw weave with darker border lines.
    fill(ctx, '#9aa86b');
    ctx.fillStyle = '#8a975d'; for (let y = 1; y < 16; y += 3) ctx.fillRect(0, y, 16, 1); // weave rows
    ctx.fillStyle = '#a8b67a'; for (let y = 2; y < 16; y += 3) ctx.fillRect(0, y, 16, 1); // weave hi
    ctx.fillStyle = '#76844c'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 15, 16, 1); ctx.fillRect(0, 0, 1, 16); ctx.fillRect(15, 0, 1, 16); // border lines
    speckle(ctx, '#8a975d', 71, 4);
  });
  atlas['t-floor-checker'] = tile(ctx => {
    // 2-colour checkerboard, 8px squares (seamless across 16px).
    fill(ctx, '#e8e0d0');
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(8, 0, 8, 8); ctx.fillRect(0, 8, 8, 8);     // off squares
    ctx.fillStyle = '#f0e9d8'; ctx.fillRect(0, 0, 8, 1); ctx.fillRect(8, 8, 8, 1);     // lit edges (cream)
    ctx.fillStyle = '#dccba0'; ctx.fillRect(8, 0, 8, 1); ctx.fillRect(0, 8, 8, 1);     // lit edges (warm)
    ctx.fillStyle = '#c0b288'; ctx.fillRect(0, 7, 16, 1); ctx.fillRect(0, 15, 16, 1);  // soft seams
  });
  atlas['t-floor-stone'] = tile(ctx => {
    // slate tiles: cool grey with grout lines, a couple of speckles.
    fill(ctx, '#8a96a0');
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(1, 1, 6, 6); ctx.fillRect(9, 9, 6, 6);     // lit tile faces
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(9, 1, 6, 6); ctx.fillRect(1, 9, 6, 6);
    ctx.fillStyle = '#aab0b6'; ctx.fillRect(1, 1, 6, 1); ctx.fillRect(9, 9, 6, 1); ctx.fillRect(9, 1, 6, 1); ctx.fillRect(1, 9, 6, 1); // tile highlights
    ctx.fillStyle = '#6e7682'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 8, 16, 1); ctx.fillRect(0, 0, 1, 16); ctx.fillRect(8, 0, 1, 16); // grout
    speckle(ctx, '#7e868e', 83, 5);
  });
  atlas['t-floor-pink'] = tile(ctx => {
    // soft plush pink carpet: fuzzy speckle texture, no hard pattern.
    fill(ctx, '#f0cfe0');
    speckle(ctx, '#e0b8cf', 89, 14);
    speckle(ctx, '#f6dcea', 97, 10);
    speckle(ctx, '#d8aac6', 103, 6);
  });

  // ===== F. Rugs (32x32, transparent, top-down, soft contact shadow) ======
  atlas['t-rug-red'] = tile(ctx => {
    rrect(ctx, 2, 4, 28, 26, 'rgba(20,22,29,0.20)', 3);                                // contact shadow
    rrect(ctx, 2, 3, 28, 26, '#9e3a3a', 3);                                            // red field (base)
    rrect(ctx, 2, 3, 28, 13, '#c0392b', 3);                                            // lit upper half
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(4, 6, 24, 1); ctx.fillRect(4, 26, 24, 1); ctx.fillRect(4, 6, 1, 21); ctx.fillRect(27, 6, 1, 21); // cream border
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(6, 8, 20, 1); ctx.fillRect(6, 24, 20, 1);  // inner stripe
    ctx.fillStyle = '#e8e0d0';                                                         // central diamond motif
    ctx.fillRect(15, 12, 2, 1); ctx.fillRect(14, 13, 4, 1); ctx.fillRect(13, 14, 6, 2); ctx.fillRect(14, 16, 4, 1); ctx.fillRect(15, 17, 2, 1);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(15, 14, 2, 1);                             // gold center
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(2, 27, 28, 1);                             // far-edge shade
    ctx.fillStyle = '#f4efe2'; for (let x = 6; x < 27; x += 3) { ctx.fillRect(x, 2, 1, 1); ctx.fillRect(x, 30, 1, 1); } // fringe ticks
  }, 32, 32);
  atlas['t-rug-blue'] = tile(ctx => {
    rrect(ctx, 3, 5, 26, 24, 'rgba(20,22,29,0.20)', 6);                               // contact shadow
    rrect(ctx, 3, 4, 26, 24, '#2e5e8e', 6);                                           // blue field (round)
    rrect(ctx, 3, 4, 26, 12, '#3d6e9e', 6);                                           // lit upper half
    ctx.fillStyle = '#5b8cbe'; ctx.fillRect(8, 5, 16, 1);                             // top sheen
    ctx.fillStyle = '#e8e0d0'; rrect(ctx, 6, 7, 20, 18, '#e8e0d0', 4);                // cream ring
    rrect(ctx, 8, 9, 16, 14, '#2e5e8e', 3);                                           // inner field
    ctx.fillStyle = '#3d6e9e'; rrect(ctx, 8, 9, 16, 7, '#3d6e9e', 3);
    ctx.fillStyle = '#e8e0d0'; rrect(ctx, 12, 13, 8, 6, '#e8e0d0', 2);                // medallion ring
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(14, 15, 4, 2);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(15, 15, 2, 2);                            // gold center
    ctx.fillStyle = '#27517c'; ctx.fillRect(8, 27, 16, 1);                            // far-edge shade
  }, 32, 32);
  atlas['t-rug-persian'] = tile(ctx => {
    rrect(ctx, 2, 4, 28, 26, 'rgba(20,22,29,0.22)', 2);                               // contact shadow
    rrect(ctx, 2, 3, 28, 26, '#8e2a1e', 2);                                           // deep red field
    ctx.fillStyle = '#27517c'; ctx.fillRect(3, 4, 26, 2); ctx.fillRect(3, 26, 26, 2); ctx.fillRect(3, 4, 2, 24); ctx.fillRect(27, 4, 2, 24); // navy border
    ctx.fillStyle = '#c9a227'; ctx.fillRect(3, 6, 26, 1); ctx.fillRect(3, 25, 26, 1); ctx.fillRect(3, 6, 1, 20); ctx.fillRect(28, 6, 1, 20); // gold inner band
    ctx.fillStyle = '#ffd24a'; for (let x = 5; x < 28; x += 4) { ctx.fillRect(x, 4, 1, 1); ctx.fillRect(x, 27, 1, 1); } // gold border dots
    ctx.fillStyle = '#6e1f15'; ctx.fillRect(6, 8, 20, 18);                            // inner field (darker)
    ctx.fillStyle = '#c9a227';                                                        // central medallion
    ctx.fillRect(15, 10, 2, 1); ctx.fillRect(13, 11, 6, 1); ctx.fillRect(11, 13, 10, 1); ctx.fillRect(10, 15, 12, 3); ctx.fillRect(11, 18, 10, 1); ctx.fillRect(13, 20, 6, 1); ctx.fillRect(15, 21, 2, 1);
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(14, 15, 4, 3);                            // medallion core
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(15, 16, 2, 1);
    ctx.fillStyle = '#27517c'; ctx.fillRect(8, 10, 2, 2); ctx.fillRect(22, 10, 2, 2); ctx.fillRect(8, 22, 2, 2); ctx.fillRect(22, 22, 2, 2); // corner motifs
  }, 32, 32);
  atlas['t-rug-tatami'] = tile(ctx => {
    rrect(ctx, 2, 4, 28, 25, 'rgba(20,22,29,0.20)', 1);                               // contact shadow
    ctx.fillStyle = '#3a4250'; ctx.fillRect(2, 3, 28, 25);                            // cloth border (dark)
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(4, 5, 24, 21);                            // straw field
    ctx.fillStyle = '#d8c79a'; ctx.fillRect(4, 5, 24, 1);                             // lit top edge
    ctx.fillStyle = '#b8a578'; for (let y = 7; y < 26; y += 2) ctx.fillRect(4, y, 24, 1); // weave lines
    ctx.fillStyle = '#c2b288'; ctx.fillRect(15, 5, 1, 21);                            // panel seam
    ctx.fillStyle = '#566069'; ctx.fillRect(2, 3, 28, 1); ctx.fillRect(2, 3, 1, 25);  // border lit edge
    ctx.fillStyle = '#2c3038'; ctx.fillRect(2, 27, 28, 1);                            // border far shade
  }, 32, 32);
};

// ---- Furniture (procedural; bed/sofa/futon are 32x16) -------------------

const buildFurniture = (atlas: Atlas) => {
  atlas['f-futon'] = tile(ctx => {
    // rolled-out floor futon: cream mattress pad, folded quilt at the foot, a pillow.
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(2, 5, 28, 9);                              // pad (front face)
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 4, 28, 8);                              // top surface (lit)
    ctx.fillStyle = '#f2ecdf'; ctx.fillRect(3, 4, 26, 2);                              // top highlight
    ctx.fillStyle = '#bfa97e'; ctx.fillRect(2, 12, 28, 2);                             // front shadow
    ctx.fillStyle = '#7a8a96'; ctx.fillRect(19, 5, 10, 8);                             // folded quilt (foot)
    ctx.fillStyle = '#9fb0bc'; ctx.fillRect(19, 5, 10, 2);                             // quilt lit edge
    ctx.fillStyle = '#6e7d88'; ctx.fillRect(19, 11, 10, 2);                            // quilt shadow
    ctx.fillStyle = '#8d9daa'; ctx.fillRect(22, 5, 1, 8); ctx.fillRect(26, 5, 1, 8);   // quilt seams
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(3, 5, 8, 6);                               // pillow
    ctx.fillStyle = '#ffffff'; ctx.fillRect(3, 5, 8, 2);
    ctx.fillStyle = '#d8cdb2'; ctx.fillRect(3, 9, 8, 2);
    ctx.fillStyle = '#8a6644'; ctx.fillRect(2, 13, 28, 1);                             // contact line
  }, 32, 16);
  atlas['f-bed'] = tile(ctx => {
    // made bed seen 3/4 from above: wooden frame, headboard (left), blue duvet, pillow.
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(0, 2, 32, 13);                             // frame (front)
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(0, 2, 32, 2);                              // frame top rail (lit)
    ctx.fillStyle = '#7a5232'; ctx.fillRect(0, 1, 4, 13);                              // headboard
    ctx.fillStyle = '#8a6440'; ctx.fillRect(0, 1, 4, 2);
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(4, 3, 27, 10);                             // duvet
    ctx.fillStyle = '#5b8cbe'; ctx.fillRect(4, 3, 27, 3);                              // lit top
    ctx.fillStyle = '#7aa6d2'; ctx.fillRect(5, 4, 25, 1);                              // highlight
    ctx.fillStyle = '#2e5e8e'; ctx.fillRect(4, 11, 27, 2);                             // duvet front fold
    ctx.fillStyle = '#c7dcf0'; ctx.fillRect(13, 4, 17, 1);                             // turned-down sheet line
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(5, 4, 8, 7);                               // pillow
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(5, 4, 8, 2);
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(5, 9, 8, 2);
    ctx.fillStyle = '#3a2716'; ctx.fillRect(1, 14, 3, 2); ctx.fillRect(28, 14, 3, 2);  // feet
  }, 32, 16);
  atlas['f-sofa'] = tile(ctx => {
    // cosy red two-seater: backrest, padded arms, two cushions, little feet.
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(2, 2, 28, 5);                              // backrest
    ctx.fillStyle = '#b14a3e'; ctx.fillRect(2, 2, 28, 2);                              // backrest lit
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(0, 4, 4, 10); ctx.fillRect(28, 4, 4, 10);  // arms
    ctx.fillStyle = '#b85a52'; ctx.fillRect(0, 4, 4, 2); ctx.fillRect(28, 4, 4, 2);    // arm tops
    ctx.fillStyle = '#7a2a24'; ctx.fillRect(0, 12, 4, 2); ctx.fillRect(28, 12, 4, 2);  // arm shadow
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(4, 6, 24, 8);                              // seat base
    ctx.fillStyle = '#7a2a24'; ctx.fillRect(4, 12, 24, 2);                             // seat front shadow
    ctx.fillStyle = '#c0392b'; ctx.fillRect(5, 7, 11, 5); ctx.fillRect(16, 7, 11, 5);  // cushions
    ctx.fillStyle = '#d75a4a'; ctx.fillRect(5, 7, 11, 2); ctx.fillRect(16, 7, 11, 2);  // cushion tops
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(15, 7, 1, 5);                              // cushion gap
    ctx.fillStyle = '#4a3320'; ctx.fillRect(3, 14, 2, 2); ctx.fillRect(27, 14, 2, 2);  // feet
  }, 32, 16);
  atlas['f-microwave'] = tile(ctx => {
    // counter microwave: steel body, tinted door window, control panel.
    ctx.fillStyle = '#6e7682'; ctx.fillRect(1, 4, 14, 10);                             // body (front)
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(1, 4, 14, 8);                              // lit face
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(1, 4, 14, 1); ctx.fillRect(1, 4, 1, 9);    // hi top+left
    ctx.fillStyle = '#3a4250'; ctx.fillRect(14, 4, 1, 10);                             // shadow side
    ctx.fillStyle = '#16181d'; ctx.fillRect(2, 6, 8, 6);                               // door
    ctx.fillStyle = '#2e5e8e'; ctx.fillRect(3, 7, 6, 4);                               // glass tint
    ctx.fillStyle = '#5b8cbe'; ctx.fillRect(3, 7, 2, 1);                               // glass glint
    ctx.fillStyle = '#3a4250'; ctx.fillRect(11, 6, 3, 6);                              // control panel
    ctx.fillStyle = '#50c878'; ctx.fillRect(12, 7, 2, 1);                              // display
    ctx.fillStyle = '#c9a227'; ctx.fillRect(12, 9, 1, 1); ctx.fillStyle = '#d05050'; ctx.fillRect(12, 11, 1, 1);
    ctx.fillStyle = '#2c3038'; ctx.fillRect(1, 13, 14, 1);                             // base shadow
  });
  atlas['f-fridge'] = tile(ctx => {
    // tall two-door fridge, fills the tile; little magnet + note for charm.
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(2, 0, 12, 16);                             // body (front)
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(2, 0, 11, 16);                             // lit face
    ctx.fillStyle = '#f4f8fb'; ctx.fillRect(2, 0, 12, 1); ctx.fillRect(2, 0, 1, 16);   // hi
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(13, 0, 1, 16);                             // shadow side
    ctx.fillStyle = '#b8c4cc'; ctx.fillRect(2, 6, 12, 1);                              // door split
    ctx.fillStyle = '#6e7682'; ctx.fillRect(11, 2, 1, 3); ctx.fillRect(11, 8, 1, 5);   // handles
    ctx.fillStyle = '#d05050'; ctx.fillRect(4, 2, 1, 1);                               // magnet
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(4, 8, 4, 4);                               // note
    ctx.fillStyle = '#caa27c'; ctx.fillRect(4, 8, 4, 1);
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(4, 10, 3, 1);
  });
  atlas['f-tv'] = tile(ctx => {
    // flatscreen on a low stand showing a tiny sunny scene.
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(3, 13, 10, 2);                             // stand
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(6, 11, 4, 2);                              // neck
    ctx.fillStyle = '#16181d'; ctx.fillRect(0, 2, 16, 9);                              // bezel
    ctx.fillStyle = '#2c3038'; ctx.fillRect(0, 2, 16, 1);                              // bezel hi
    ctx.fillStyle = '#27517c'; ctx.fillRect(2, 4, 12, 5);                              // screen base
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(2, 4, 12, 2);                              // sky
    ctx.fillStyle = '#50c878'; ctx.fillRect(2, 7, 12, 2);                              // ground
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(11, 4, 2, 2);                              // sun
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(3, 4, 3, 1);                               // glare
  });
  atlas['f-desk'] = tile(ctx => {
    // wooden desk with a laptop, mug and a sheet of paper.
    ctx.fillStyle = '#8a6644'; ctx.fillRect(0, 5, 16, 3);                              // top
    ctx.fillStyle = '#a3825a'; ctx.fillRect(0, 5, 16, 1);                              // lit edge
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(0, 7, 16, 1);                              // front shadow
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(1, 8, 2, 7); ctx.fillRect(13, 8, 2, 7);    // legs
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(1, 8, 1, 7); ctx.fillRect(13, 8, 1, 7);
    ctx.fillStyle = '#3a4250'; ctx.fillRect(9, 1, 5, 4);                               // laptop lid
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(10, 2, 3, 2); ctx.fillStyle = '#c7e0f4'; ctx.fillRect(10, 2, 1, 1);
    ctx.fillStyle = '#6e7682'; ctx.fillRect(9, 5, 5, 1);                               // keyboard deck
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(3, 3, 4, 2);                               // paper
    ctx.fillStyle = '#d05050'; ctx.fillRect(2, 2, 2, 3); ctx.fillStyle = '#e87a6a'; ctx.fillRect(2, 2, 2, 1); // mug
  });
  atlas['f-lamp'] = tile(ctx => {
    // floor lamp with a warm glowing shade, slim pole, weighted base.
    ctx.fillStyle = 'rgba(255,210,120,0.18)'; ctx.fillRect(3, 0, 10, 7);              // glow
    ctx.fillStyle = '#c9a227'; ctx.fillRect(4, 1, 8, 4);                               // shade
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(5, 1, 6, 2);                               // lit
    ctx.fillStyle = '#b08a50'; ctx.fillRect(4, 4, 8, 1);                               // rim shadow
    ctx.fillStyle = '#6e7682'; ctx.fillRect(7, 5, 2, 8);                               // pole
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(7, 5, 1, 8);
    ctx.fillStyle = '#3a4250'; ctx.fillRect(4, 13, 8, 2);                              // base
    ctx.fillStyle = '#6e7682'; ctx.fillRect(5, 13, 6, 1);
  });
  atlas['f-bookshelf'] = tile(ctx => {
    // tall shelf packed with varied-height colourful books + a trinket plant.
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(1, 0, 14, 16);                             // carcass
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(1, 0, 14, 1); ctx.fillRect(1, 0, 1, 16);   // hi
    ctx.fillStyle = '#4a3320'; ctx.fillRect(13, 0, 1, 16);                             // shadow side
    ctx.fillStyle = '#3a2716'; for (const y of [4, 8, 12]) ctx.fillRect(2, y, 12, 1);  // shelves
    const books = ['#d05050', '#3d6e9e', '#50c878', '#c9a227', '#a86b8a', '#e07840'];
    let b = 2;
    for (const sy of [1, 5, 9]) for (let x = 2; x < 13; x += 2) {
      const h = (x % 3 === 0) ? 3 : 2;
      ctx.fillStyle = books[b++ % books.length]; ctx.fillRect(x, sy + (3 - h), 1, h);
      ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x, sy + (3 - h), 1, 1);
    }
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(11, 10, 2, 2);                             // trinket plant
    ctx.fillStyle = '#b5651d'; ctx.fillRect(11, 11, 2, 1);
  });
  atlas['f-plant'] = tile(ctx => {
    // leafy houseplant in a terracotta pot.
    ctx.fillStyle = '#4d7440'; ctx.fillRect(4, 2, 8, 6); ctx.fillRect(3, 4, 2, 3); ctx.fillRect(11, 4, 2, 3); ctx.fillRect(6, 1, 4, 2);
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(5, 2, 5, 4); ctx.fillRect(7, 1, 2, 1);
    ctx.fillStyle = '#6f9e5e'; ctx.fillRect(6, 2, 2, 2);                               // hi
    ctx.fillStyle = '#7ce8a0'; ctx.fillRect(8, 3, 1, 1);                               // leaf glint
    ctx.fillStyle = '#3e5c33'; ctx.fillRect(7, 7, 2, 3);                               // stem
    ctx.fillStyle = '#b5651d'; ctx.fillRect(4, 10, 8, 5);                              // pot
    ctx.fillStyle = '#c87a2e'; ctx.fillRect(4, 10, 8, 1); ctx.fillRect(4, 10, 1, 5);   // rim + hi
    ctx.fillStyle = '#8f4f17'; ctx.fillRect(11, 10, 1, 5); ctx.fillRect(4, 14, 8, 1);  // shadow
  });
  atlas['f-ac'] = tile(ctx => {
    // wall split-AC: white body, louvers, status LED. Mounts on the wall row.
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(0, 3, 16, 7);                              // body (front)
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(0, 3, 16, 5);                              // lit face
    ctx.fillStyle = '#f4f8fb'; ctx.fillRect(0, 3, 16, 1);                              // hi
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(0, 9, 16, 1);                              // bottom shadow
    ctx.fillStyle = '#6e7682'; ctx.fillRect(2, 7, 12, 1);                              // louver
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(2, 8, 12, 1);
    ctx.fillStyle = '#3a4250'; ctx.fillRect(3, 5, 5, 1);                              // brand strip
    ctx.fillStyle = '#50c878'; ctx.fillRect(13, 5, 1, 1);                              // LED
  });

  // Rare (backrooms) furniture
  atlas['f-kotatsu'] = tile(ctx => {
    // heated table: red blanket skirt, wooden top, a teapot + a mandarin on top.
    ctx.fillStyle = '#c0392b'; ctx.fillRect(2, 6, 28, 8);                              // blanket
    ctx.fillStyle = '#d75a4a'; ctx.fillRect(2, 6, 28, 2);                              // blanket lit
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(2, 12, 28, 2);                             // blanket shadow
    ctx.fillStyle = '#a83232'; ctx.fillRect(9, 6, 1, 8); ctx.fillRect(16, 6, 1, 8); ctx.fillRect(23, 6, 1, 8); // folds
    ctx.fillStyle = '#8a6644'; ctx.fillRect(3, 3, 26, 4);                              // tabletop
    ctx.fillStyle = '#a3825a'; ctx.fillRect(3, 3, 26, 1);                              // lit edge
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(3, 6, 26, 1);                              // top front shadow
    ctx.fillStyle = '#2c3038'; ctx.fillRect(12, 1, 5, 3); ctx.fillStyle = '#3a4250'; ctx.fillRect(12, 1, 5, 1); // teapot
    ctx.fillStyle = '#16181d'; ctx.fillRect(11, 2, 1, 1); ctx.fillRect(17, 2, 1, 1);   // spout/handle
    ctx.fillStyle = '#e07840'; ctx.fillRect(19, 2, 2, 2); ctx.fillStyle = '#ffd24a'; ctx.fillRect(19, 2, 1, 1); // mandarin
  }, 32, 16);
  atlas['f-aquarium'] = tile(ctx => {
    // glass tank on a wooden stand: lit water, two fish, plants, gravel, bubbles.
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(1, 13, 14, 3);                             // stand
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(1, 13, 14, 1);
    ctx.fillStyle = '#2c3038'; ctx.fillRect(1, 1, 14, 12);                             // tank frame
    ctx.fillStyle = '#2e5e8e'; ctx.fillRect(2, 2, 12, 10);                             // water
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(2, 2, 12, 4);                              // lighter top
    ctx.fillStyle = '#50a0d0'; ctx.fillRect(2, 2, 12, 1);                              // surface
    ctx.fillStyle = 'rgba(159,196,232,0.5)'; ctx.fillRect(3, 3, 2, 7);                 // glass glint
    ctx.fillStyle = '#8a6644'; ctx.fillRect(2, 11, 12, 1);                             // gravel
    ctx.fillStyle = '#50c878'; ctx.fillRect(11, 7, 1, 4); ctx.fillRect(12, 9, 1, 2); ctx.fillStyle = '#4d7440'; ctx.fillRect(3, 9, 1, 3); // plants
    ctx.fillStyle = '#e07840'; ctx.fillRect(5, 5, 3, 2); ctx.fillStyle = '#ffd24a'; ctx.fillRect(5, 5, 1, 1); ctx.fillStyle = '#16181d'; ctx.fillRect(7, 5, 1, 1); // orange fish
    ctx.fillStyle = '#d05050'; ctx.fillRect(8, 8, 2, 1);                               // red fish
    ctx.fillStyle = '#c7e0f4'; ctx.fillRect(10, 4, 1, 1); ctx.fillRect(9, 6, 1, 1);    // bubbles
  });
  atlas['f-arcade'] = tile(ctx => {
    // upright cabinet: pink marquee, game screen, control panel with joystick.
    ctx.fillStyle = '#27517c'; ctx.fillRect(2, 1, 12, 15);                             // cabinet
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(2, 1, 11, 15);                             // lit face
    ctx.fillStyle = '#1d2a3a'; ctx.fillRect(13, 1, 1, 15);                             // shadow side
    ctx.fillStyle = '#50a0d0'; ctx.fillRect(2, 1, 11, 1);                              // top hi
    ctx.fillStyle = '#e857a8'; ctx.fillRect(3, 2, 10, 2); ctx.fillStyle = '#ffd5ec'; ctx.fillRect(3, 2, 10, 1); // marquee
    ctx.fillStyle = '#16181d'; ctx.fillRect(3, 5, 10, 5);                              // screen
    ctx.fillStyle = '#7ce8a0'; ctx.fillRect(4, 6, 3, 2); ctx.fillStyle = '#ffd24a'; ctx.fillRect(9, 7, 2, 2); ctx.fillStyle = '#d05050'; ctx.fillRect(6, 8, 2, 1); // game art
    ctx.fillStyle = '#2c3038'; ctx.fillRect(3, 10, 10, 2);                             // control panel
    ctx.fillStyle = '#d05050'; ctx.fillRect(4, 10, 1, 1); ctx.fillStyle = '#ffd24a'; ctx.fillRect(6, 10, 1, 1); // buttons
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(10, 10, 1, 1); ctx.fillStyle = '#d05050'; ctx.fillRect(10, 9, 1, 1); // joystick
    ctx.fillStyle = '#1d2a3a'; ctx.fillRect(3, 12, 10, 3);                             // coin door base
    ctx.fillStyle = '#c9a227'; ctx.fillRect(7, 13, 2, 1);                              // coin slot
  });
  atlas['f-neon'] = tile(ctx => {
    // glowing pink "HOME" sign on a dark backer. Mounts on the wall row.
    ctx.fillStyle = 'rgba(232,87,168,0.16)'; ctx.fillRect(0, 2, 16, 11);               // glow bloom
    ctx.fillStyle = '#16181d'; ctx.fillRect(1, 4, 14, 8);                              // backer
    ctx.fillStyle = '#2c3038'; ctx.fillRect(1, 4, 14, 1);
    ctx.fillStyle = '#e857a8';
    ctx.fillRect(2, 6, 1, 4); ctx.fillRect(3, 8, 1, 1); ctx.fillRect(4, 6, 1, 4);      // H
    ctx.fillRect(6, 6, 2, 1); ctx.fillRect(6, 9, 2, 1); ctx.fillRect(6, 6, 1, 4); ctx.fillRect(7, 6, 1, 4); // O
    ctx.fillRect(9, 6, 1, 4); ctx.fillRect(10, 7, 1, 1); ctx.fillRect(11, 6, 1, 4);    // M
    ctx.fillRect(13, 6, 1, 4); ctx.fillRect(13, 6, 2, 1); ctx.fillRect(13, 8, 1, 1); ctx.fillRect(13, 9, 2, 1); // E
    ctx.fillStyle = '#ffd5ec'; ctx.fillRect(2, 6, 1, 1); ctx.fillRect(9, 6, 1, 1); ctx.fillRect(13, 6, 1, 1); // hot cores
  });
  atlas['f-coffin'] = tile(ctx => {
    // tapered oak coffin with a gold cross.
    ctx.fillStyle = '#3a2716'; ctx.fillRect(4, 1, 8, 14);                              // silhouette
    ctx.fillStyle = '#3a2716'; ctx.fillRect(4, 4, 1, 2); ctx.fillRect(11, 4, 1, 2);    // shoulder taper notch
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(5, 2, 6, 12);                              // lid
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(5, 2, 2, 12);                              // lit left
    ctx.fillStyle = '#4a3320'; ctx.fillRect(10, 2, 1, 12);                             // shadow right
    ctx.fillStyle = '#4a3320'; ctx.fillRect(5, 6, 6, 1);                               // panel seam
    ctx.fillStyle = '#c9a227'; ctx.fillRect(7, 3, 2, 5); ctx.fillRect(6, 4, 4, 1);     // gold cross
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(7, 3, 1, 1);
  });
  atlas['prop-campfire'] = tile(ctx => {                            // transparent bg — overlays sand
    ctx.fillStyle = '#4a3120'; ctx.fillRect(3, 11, 10, 2); ctx.fillRect(4, 9, 9, 2); // logs
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(3, 11, 10, 1);
    ctx.fillStyle = '#e0552e'; ctx.fillRect(6, 4, 4, 7);            // flame outer
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7, 6, 2, 4);            // flame mid
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(7, 8, 1, 2);           // flame core
  });
  // ---- Daily street-event props (transparent bg — overlay the sidewalk/grass) ----
  atlas['prop-yatai'] = tile(ctx => {                               // traveling ramen cart
    ctx.fillStyle = '#c0392b'; ctx.fillRect(1, 1, 14, 3);          // red awning
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(3, 1, 2, 3); ctx.fillRect(7, 1, 2, 3); ctx.fillRect(11, 1, 2, 3); // awning stripes
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(2, 4, 1, 4); ctx.fillRect(13, 4, 1, 4); // posts
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(2, 8, 12, 6);          // cart body
    ctx.fillStyle = '#8a6644'; ctx.fillRect(2, 8, 12, 2);          // counter top
    ctx.fillStyle = '#4a3120'; ctx.fillRect(3, 8, 1, 6); ctx.fillRect(12, 8, 1, 6); ctx.fillRect(7, 8, 1, 6); // planks
    ctx.fillStyle = '#222'; ctx.fillRect(3, 14, 3, 2); ctx.fillRect(10, 14, 3, 2); // wheels
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(5, 9, 4, 2);           // ramen bowl
    ctx.fillStyle = '#c97a3a'; ctx.fillRect(6, 9, 2, 1);           // broth
    ctx.fillStyle = '#d05050'; ctx.fillRect(11, 4, 3, 4);         // hanging lantern
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(12, 5, 1, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(6, 6, 1, 2); ctx.fillRect(8, 5, 1, 2); // steam
  });
  atlas['prop-claw'] = tile(ctx => {                               // coin-op claw machine
    ctx.fillStyle = '#d05050'; ctx.fillRect(2, 0, 12, 16);        // red cabinet
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(2, 0, 12, 1); ctx.fillRect(2, 10, 12, 1);
    ctx.fillStyle = '#16181d'; ctx.fillRect(3, 1, 10, 9);         // glass
    ctx.fillStyle = '#3a4a5a'; ctx.fillRect(4, 2, 7, 1);          // glass shine
    ctx.fillStyle = '#c4c4c4'; ctx.fillRect(7, 1, 2, 2);          // claw rail
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(7, 3, 1, 2); ctx.fillRect(8, 3, 1, 2); // claw
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(4, 7, 2, 2);          // prizes
    ctx.fillStyle = '#50c878'; ctx.fillRect(7, 8, 2, 1);
    ctx.fillStyle = '#5aa0e8'; ctx.fillRect(10, 7, 2, 2);
    ctx.fillStyle = '#7a2c2c'; ctx.fillRect(3, 11, 10, 4);        // control panel
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7, 12, 2, 2);        // joystick/button
    ctx.fillStyle = '#16181d'; ctx.fillRect(4, 12, 2, 1);        // coin slot
  });
  atlas['prop-takoyaki'] = tile(ctx => {                           // pop-up takoyaki stall
    ctx.fillStyle = '#2c7a4f'; ctx.fillRect(1, 1, 14, 3);         // green banner
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(2, 0, 1, 1); ctx.fillRect(7, 0, 1, 1); ctx.fillRect(12, 0, 1, 1); // bulbs
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(2, 4, 1, 4); ctx.fillRect(13, 4, 1, 4); // posts
    ctx.fillStyle = '#6b6b6b'; ctx.fillRect(2, 8, 12, 6);         // griddle stand
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(2, 8, 12, 2);         // hot plate
    ctx.fillStyle = '#c08038'; ctx.fillRect(3, 8, 2, 2); ctx.fillRect(6, 8, 2, 2); ctx.fillRect(9, 8, 2, 2); // takoyaki
    ctx.fillStyle = '#a8662a'; ctx.fillRect(3, 9, 2, 1); ctx.fillRect(6, 9, 2, 1); ctx.fillRect(9, 9, 2, 1);
    ctx.fillStyle = '#7ce8a0'; ctx.fillRect(11, 8, 2, 1);         // aonori garnish
    ctx.fillStyle = '#4a3120'; ctx.fillRect(3, 14, 2, 2); ctx.fillRect(11, 14, 2, 2); // legs
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(5, 6, 1, 2); ctx.fillRect(9, 6, 1, 2); // steam
  });
  atlas['prop-ferret'] = tile(ctx => {                             // a lost ferret darting in the grass
    ctx.fillStyle = '#e0d4b8'; ctx.fillRect(4, 9, 7, 3);          // cream body
    ctx.fillStyle = '#cabd9c'; ctx.fillRect(4, 11, 7, 1);
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(10, 8, 3, 2);         // brown head
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(2, 9, 3, 2);          // bushy tail
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(11, 7, 1, 1);         // ear
    ctx.fillStyle = '#222'; ctx.fillRect(12, 8, 1, 1);            // eye
    ctx.fillStyle = '#16100a'; ctx.fillRect(13, 9, 1, 1);         // nose
    ctx.fillStyle = '#cabd9c'; ctx.fillRect(5, 12, 1, 1); ctx.fillRect(8, 12, 1, 1); // little legs
  });
  atlas['f-maneki'] = tile(ctx => {
    // maneki-neko lucky cat: cream body, raised waving paw, red collar + bell, gold koban.
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(5, 5, 7, 9);                               // body
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(5, 5, 7, 2);                               // body lit
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(5, 12, 7, 2);                              // belly shadow
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(4, 3, 2, 2); ctx.fillRect(11, 3, 2, 2);    // ears
    ctx.fillStyle = '#e87a6a'; ctx.fillRect(4, 4, 1, 1); ctx.fillRect(12, 4, 1, 1);    // inner ears
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(5, 4, 7, 4);                               // head
    ctx.fillStyle = '#16181d'; ctx.fillRect(6, 5, 1, 1); ctx.fillRect(10, 5, 1, 1);    // eyes
    ctx.fillStyle = '#e07840'; ctx.fillRect(8, 6, 1, 1);                               // nose
    ctx.fillStyle = '#d05050'; ctx.fillRect(5, 8, 7, 1);                               // collar
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(8, 8, 1, 2);                               // bell
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(12, 4, 2, 3); ctx.fillStyle = '#cdbb8e'; ctx.fillRect(12, 6, 2, 1); // waving paw
    ctx.fillStyle = '#c9a227'; ctx.fillRect(6, 10, 4, 3); ctx.fillStyle = '#ffd24a'; ctx.fillRect(6, 10, 4, 1); // koban
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

  // ---- Downtown dumpster (hides a stray cat) -------------------------------
  atlas['t-dumpster'] = tile(ctx => {
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(1, 14, 14, 2);   // ground shadow
    ctx.fillStyle = '#2f5d3a'; ctx.fillRect(2, 7, 12, 8);            // body
    ctx.fillStyle = '#3a7048'; ctx.fillRect(2, 7, 12, 1);            // top highlight
    ctx.fillStyle = '#264c30'; ctx.fillRect(2, 12, 12, 3);          // lower shade
    ctx.fillStyle = '#23402b'; ctx.fillRect(6, 7, 1, 8); ctx.fillRect(10, 7, 1, 8); // ribs
    ctx.fillStyle = '#1f3a27'; ctx.fillRect(1, 5, 14, 2);           // lid
    ctx.fillStyle = '#0c160f'; ctx.fillRect(3, 4, 9, 1);            // dark gap (ajar)
    ctx.fillStyle = '#1a1a1f'; ctx.fillRect(2, 15, 2, 1); ctx.fillRect(12, 15, 2, 1); // wheels
    speckle(ctx, '#6a5a30', 7, 8);                                  // grime/rust
  });

  // ---- Black stray cat (found in the dumpster, then lives at home) ----------
  // SIDE PROFILE (not front-facing). Head on the RIGHT: one green eye + a pink nose
  // at the muzzle, two pointy ears on top, a curved back, an upright tail at the
  // rear (left), and four legs. He's black, but flat black reads as a blob — so:
  // k=body black, s=fur sheen on the top/back rim (light from upper-left),
  // d=deep shadow on the underside/feet, g=green eye, p=pink nose / inner-ear.
  const CATPAL = { k: '#16161c', s: '#26262f', d: '#0e0e13', g: '#86e06a', p: '#e0879f' };
  // Shared upper body (head + back + raised tail) reused by both walk frames; the
  // frames differ only in the legs (gather vs stride) so he visibly steps. Feet sit
  // on rows 13-14 so the drawn floor contact-shadow grounds him.
  const CAT_UP = [
    '.k..............', // 0  tail tip (curls back-left)
    '.k........k..k..', // 1  tail + ear tips
    '.kk......kkk.kk.', // 2  tail + ears (left 9-11, right 13-14)
    '..k......kpkkpk.', // 3  tail + pink inner ears
    '..kk....skkkkkk.', // 4  tail base + head top (sheen on neck)
    '..skkkkkskkkgkk.', // 5  back (sheen rim) + head + green eye
    '..skkkkkkkkkkkkp', // 6  body + head + pink nose (muzzle, right edge)
    '...kkkkkkkkkkkk.', // 7  belly / jaw
    '...kkkkkkkkkkk..', // 8  lower body
  ];
  const catR0 = strSprite([
    ...CAT_UP,
    '....kk....kk....', // 9  legs gathered (back 4-5, front 10-11)
    '....kk....kk....', // 10
    '....kk....kk....', // 11
    '....kk....kk....', // 12
    '....dd....dd....', // 13 feet (deep-shadow contact)
    '................', // 14
    '................', // 15
  ], CATPAL);
  const catR1 = strSprite([
    ...CAT_UP,
    '...kk......kk...', // 9  mid-stride (back steps left, front steps right)
    '...kk......kk...', // 10
    '...kk......kk...', // 11
    '...kk......kk...', // 12
    '...dd......dd...', // 13 feet
    '................', // 14
    '................', // 15
  ], CATPAL);
  atlas['cat-r-0'] = catR0; atlas['cat-l-0'] = mirror(catR0);
  atlas['cat-r-1'] = catR1; atlas['cat-l-1'] = mirror(catR1);
  // Aliases (frame 0) so any `cat-r` / `cat-l` reference still resolves.
  atlas['cat-r'] = catR0; atlas['cat-l'] = mirror(catR0);
  // Sitting / napping (classic curled cat): a narrow upright torso with the head
  // high on the right, wide tucked haunches forming a triangular base, front paws
  // down, and the tail sweeping up to curl around the front of the base.
  const catSitR = strSprite([
    '................', // 0
    '..........k..k..', // 1  ear tips
    '..........kkkkk.', // 2  head top + ears (10-14)
    '.........kpkkpk.', // 3  head + pink inner ears
    '.........skkkkk.', // 4  head (sheen)
    '.........skkkgk.', // 5  head + green eye (forward, toward the muzzle)
    '........skkkkkkp', // 6  head / muzzle + pink nose
    '.......skkkkkk..', // 7  neck → chest (front sheen)
    '......skkkkkkk..', // 8  chest widening
    '.....skkkkkkkk..', // 9  body
    '....skkkkkkkkk..', // 10 haunch
    '...skkkkkkkkkk..', // 11 haunch
    '..skkkkkkkkkkk..', // 12 sitting base (widest)
    '..kkkkkkkkkkkdk.', // 13 base + tail curl rising at the front
    '..dkkkkkkkkkkdk.', // 14 paws + tail wrapping the front
    '................', // 15
  ], CATPAL);
  atlas['cat-sit-r'] = catSitR; atlas['cat-sit-l'] = mirror(catSitR);

  // ---- Hidden museum collectible: a small glinting curio on the ground --------
  atlas['t-relic'] = tile(ctx => {
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(7, 5, 2, 6); ctx.fillRect(5, 7, 6, 2); // 4-point star
    ctx.fillStyle = '#fff6d6'; ctx.fillRect(7, 7, 2, 2);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(6, 10, 4, 1);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(11, 4, 1, 1); ctx.fillRect(4, 11, 1, 1); ctx.fillRect(12, 11, 1, 1);
  });
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

// ---- Home trophy shelf ---------------------------------------------------
// A wall-mounted display plank (3 tiles wide) + the 10 gachapon figures as tiny
// shelf toys (`fig-0`..`fig-9`, aligned to GACHA_FIGURES order). The figures are
// blitted onto the plank by the apartment draw loop, one per owned figure.
const buildTrophies = (atlas: Atlas) => {
  // 3-tile wooden plank with two end brackets + a thin lip + drop shadow.
  atlas['f-shelf'] = tile(ctx => {
    ctx.fillStyle = 'rgba(20,14,10,0.18)'; ctx.fillRect(2, 13, 44, 2);   // contact shadow
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(2, 11, 44, 3);               // plank
    ctx.fillStyle = '#8a6644'; ctx.fillRect(2, 11, 44, 1);               // lit top edge
    ctx.fillStyle = '#5a3a24'; ctx.fillRect(2, 13, 44, 1);               // front-lip shade
    ctx.fillStyle = '#4a3120'; ctx.fillRect(4, 14, 2, 1); ctx.fillRect(42, 14, 2, 1); // brackets
  }, 48, 16);

  // Each figure is 11x13, sitting on a shared baseline (y≈12) so they line up.
  const toy = (draw: Draw) => tile(draw, 11, 13);
  const R = (ctx: CanvasRenderingContext2D, c: string, x: number, y: number, w: number, h: number) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };

  atlas['fig-0'] = toy(ctx => { // Salaryman Cat
    R(ctx, '#8a8e96', 4, 7, 3, 5); R(ctx, '#9aa0a8', 4, 7, 3, 1);       // body
    R(ctx, '#c0392b', 5, 8, 1, 3);                                      // tie
    R(ctx, '#8a8e96', 3, 2, 5, 5); R(ctx, '#9aa0a8', 3, 2, 5, 1);       // head
    R(ctx, '#8a8e96', 2, 1, 2, 2); R(ctx, '#8a8e96', 7, 1, 2, 2);       // ears
    R(ctx, '#e8a0a0', 3, 2, 1, 1); R(ctx, '#e8a0a0', 7, 2, 1, 1);
    R(ctx, '#16181d', 4, 4, 1, 1); R(ctx, '#16181d', 6, 4, 1, 1);       // eyes
  });
  atlas['fig-1'] = toy(ctx => { // Tower Crab
    R(ctx, '#c0392b', 2, 7, 7, 4); R(ctx, '#e0594b', 2, 7, 7, 1);       // shell
    R(ctx, '#c0392b', 1, 5, 2, 2); R(ctx, '#c0392b', 8, 5, 2, 2);       // claws
    R(ctx, '#16181d', 3, 4, 1, 2); R(ctx, '#16181d', 7, 4, 1, 2);       // eye stalks
    R(ctx, '#c0392b', 2, 11, 1, 1); R(ctx, '#c0392b', 5, 11, 1, 1); R(ctx, '#c0392b', 8, 11, 1, 1); // legs
  });
  atlas['fig-2'] = toy(ctx => { // Drift King (car)
    R(ctx, '#c9a227', 1, 7, 9, 3); R(ctx, '#e8c84a', 1, 7, 9, 1);       // body
    R(ctx, '#9fc4e8', 3, 4, 5, 3);                                      // cabin
    R(ctx, '#222', 2, 10, 3, 2); R(ctx, '#222', 6, 10, 3, 2);          // wheels
  });
  atlas['fig-3'] = toy(ctx => { // Melon Soda-kun (bottle)
    R(ctx, '#3dbf6a', 3, 4, 4, 8); R(ctx, '#5ad88a', 3, 4, 1, 8);       // body + shine
    R(ctx, '#3dbf6a', 4, 2, 2, 2);                                      // neck
    R(ctx, '#c0392b', 4, 1, 2, 1);                                      // cap
    R(ctx, '#fff', 4, 7, 2, 2);                                         // label
  });
  atlas['fig-4'] = toy(ctx => { // Pixel Gabe
    R(ctx, '#e0b48a', 4, 2, 3, 3);                                      // head
    R(ctx, '#4a3120', 4, 1, 3, 1);                                      // hair
    R(ctx, '#16181d', 4, 3, 1, 1); R(ctx, '#16181d', 6, 3, 1, 1);       // eyes
    R(ctx, '#3a6ea5', 3, 5, 5, 5); R(ctx, '#4a7eb5', 3, 5, 5, 1);       // shirt
    R(ctx, '#2c3038', 3, 10, 2, 2); R(ctx, '#2c3038', 6, 10, 2, 2);     // legs
  });
  atlas['fig-5'] = toy(ctx => { // Konbini Ghost
    R(ctx, '#eef0f4', 3, 3, 5, 7); R(ctx, '#fff', 3, 3, 5, 1);          // body
    R(ctx, '#3a4452', 4, 5, 1, 2); R(ctx, '#3a4452', 6, 5, 1, 2);       // eyes
    R(ctx, '#eef0f4', 3, 10, 1, 1); R(ctx, '#eef0f4', 5, 10, 1, 1); R(ctx, '#eef0f4', 7, 10, 1, 1); // tail
  });
  atlas['fig-6'] = toy(ctx => { // Mini Golden Carp
    R(ctx, '#ffd24a', 3, 4, 4, 7); R(ctx, '#ffe9a0', 3, 4, 4, 1);       // body
    R(ctx, '#e0a000', 2, 9, 6, 2);                                      // tail fan
    R(ctx, '#16181d', 4, 5, 1, 1);                                      // eye
  });
  atlas['fig-7'] = toy(ctx => { // Robot Vacuum
    R(ctx, '#2c3038', 1, 8, 9, 3); R(ctx, '#3a4250', 1, 8, 9, 1);       // disc
    R(ctx, '#5ad8d0', 4, 9, 2, 1);                                      // sensor light
    R(ctx, '#16181d', 1, 11, 9, 1);                                     // base shade
  });
  atlas['fig-8'] = toy(ctx => { // Bonsai Buddy
    R(ctx, '#a0673a', 3, 9, 5, 3); R(ctx, '#b87a48', 3, 9, 5, 1);       // pot
    R(ctx, '#5a3a24', 5, 6, 1, 3);                                      // trunk
    R(ctx, '#3d8a4a', 2, 3, 7, 4); R(ctx, '#56a85e', 2, 3, 7, 1);       // canopy
  });
  atlas['fig-9'] = toy(ctx => { // UFO Catcher
    R(ctx, '#8a96a0', 1, 6, 9, 3); R(ctx, '#aab4bc', 1, 6, 9, 1);       // saucer
    R(ctx, '#9fc4e8', 3, 3, 5, 3);                                      // dome
    R(ctx, '#ffd24a', 2, 9, 1, 1); R(ctx, '#ffd24a', 5, 9, 1, 1); R(ctx, '#ffd24a', 8, 9, 1, 1); // lights
    R(ctx, '#8a96a0', 5, 9, 1, 3);                                      // claw stem
  });
};

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
  buildDecorFood(atlas);
  buildFurniture(atlas);
  buildTrophies(atlas);
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
