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
    // proper sunglasses: dark steel frame (f), tinted lenses (x), cool glint (g)
    dy: 3, pal: { x: c, f: '#3a3f4a', g: '#9fc4e8' },
    down: ['...fffffffff....', '...xggx.xggx....', '....xx...xx.....'],
    left: ['...ffffff.......', '...xggx.........', '....xx..........'],
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
    // two pinched wings + center knot — reads as a bowtie, not a smudge
    dy: 7, pal: { r: c },
    down: ['....rr.r.rr.....', '....rrrrrrr.....', '....rr.r.rr.....'],
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
// Faceless shadow-thing: a dark looming mass, blank glowing eyes (y, no
// pupils), a recessed dark maw (d) framed by a pale rim (w) — solid, NO
// see-through gaps — and a ragged dangling underside. Only a faint side
// rim (l) / shadow (d) for form, kept mostly dark: anonymous and unsettling.
const MONSTER_ROWS = [
  '....m......m....',
  '....mm....mm....',
  '..mmmmmmmmmmmm..',
  '.lmmmmmmmmmmmmd.',
  '.lmmmmmmmmmmmmd.',
  '.lmyymmmmmmyymd.',
  '.lmyymmmmmmyymd.',
  '.lmmmmmmmmmmmmd.',
  '.lmmmwwwwwwmmmd.',
  '.lmmwddddddwmmd.',
  '.lmmmwwwwwwmmmd.',
  '..mmmmmmmmmmmm..',
  '..mmm.mmmm.mmm..',
  '..mm...mm...mm..',
  '..m....mm....m..',
  '................',
];
const addMonster = (atlas: Atlas) => {
  const c = strSprite(MONSTER_ROWS, { m: '#2a1f38', d: '#16101f', l: '#352848', y: '#ffd24a', w: '#6e5a86' });
  // Club Kaiju's most loyal patron — same silhouette, very different vibe
  const k = strSprite(MONSTER_ROWS, { m: '#3e6e3a', d: '#223c20', l: '#4e7e45', y: '#ffd24a', w: '#5a7a50' });
  for (const dir of ['down', 'up', 'left', 'right']) {
    atlas[`npc-monster-${dir}-0`] = c;
    atlas[`npc-monster-${dir}-1`] = c;
    atlas[`npc-kaiju-${dir}-0`] = k;
    atlas[`npc-kaiju-${dir}-1`] = k;
  }
};

// Bigfoot — the island cryptid that only shows in the sea cave when luck is
// with you. NOT built on the human body: a hulking shaggy ape, broad shoulders,
// a heavy brow and amber eyes that "look back in the dark" (cf. the bottle note,
// "look for the ones that look back"). f fur, k fur-shadow, s muzzle skin,
// B brow ridge, e amber eye, n nose, m mouth. Two walk frames swap the feet.
const BIGFOOT_PAL = { f: '#6b4a2e', k: '#3f2a18', s: '#c89b6e', B: '#2a1a0e', e: '#ffcf6b', n: '#2a1a0e', m: '#3f2a18' };
const BIGFOOT_DOWN_0 = [
  '....ffffffff....',
  '..ffffffffffff..',
  '..fkffffffffkf..',
  '..ffssssssssff..',
  '..ffsBBssBBsff..',
  '..ffseesseesff..',
  '..ffsssnnsssff..',
  '..fkssmmmmsskf..',
  '..ffffffffffff..',
  '.ffffffffffffff.',
  '.ffffffffffffff.',
  '.fffkffffffkfff.',
  '.ffffffffffffff.',
  '...fff....fff...',
  '..kkkk....kkkk..',
  '................',
];
const BIGFOOT_DOWN_1 = [
  '....ffffffff....',
  '..ffffffffffff..',
  '..fkffffffffkf..',
  '..ffssssssssff..',
  '..ffsBBssBBsff..',
  '..ffseesseesff..',
  '..ffsssnnsssff..',
  '..fkssmmmmsskf..',
  '..ffffffffffff..',
  '.ffffffffffffff.',
  '.ffffffffffffff.',
  '.fffkffffffkfff.',
  '.ffffffffffffff.',
  '...fff....fff...',
  '.kkkk......kkkk.',
  '................',
];
const BIGFOOT_UP_0 = [
  '....ffffffff....',
  '..ffffffffffff..',
  '..ffffffffffff..',
  '..ffffffffffff..',
  '..ffkffffffkff..',
  '..ffffffffffff..',
  '..ffffffffffff..',
  '..ffkffffffkff..',
  '..ffffffffffff..',
  '.ffffffffffffff.',
  '.ffffffffffffff.',
  '.ffffffffffffff.',
  '.ffffffffffffff.',
  '...fff....fff...',
  '..kkkk....kkkk..',
  '................',
];
const BIGFOOT_UP_1 = [
  '....ffffffff....',
  '..ffffffffffff..',
  '..ffffffffffff..',
  '..ffffffffffff..',
  '..ffkffffffkff..',
  '..ffffffffffff..',
  '..ffffffffffff..',
  '..ffkffffffkff..',
  '..ffffffffffff..',
  '.ffffffffffffff.',
  '.ffffffffffffff.',
  '.ffffffffffffff.',
  '.ffffffffffffff.',
  '...fff....fff...',
  '.kkkk......kkkk.',
  '................',
];
const BIGFOOT_SIDE_0 = [
  '....ffffff......',
  '..ffffffffff....',
  '.fffffffffkf....',
  '.fsssfffffff....',
  '.fsBsfffffff....',
  '.fsesfffffff....',
  '.fnssfffffff....',
  '.fmmsfffffff....',
  '.ffffffffffff...',
  '.ffffffffffff...',
  '.ffffffffffff...',
  '.ffffffffffff...',
  '.ffffffffffff...',
  '...ff...ff......',
  '..kkk...kkk.....',
  '................',
];
const BIGFOOT_SIDE_1 = [
  '....ffffff......',
  '..ffffffffff....',
  '.fffffffffkf....',
  '.fsssfffffff....',
  '.fsBsfffffff....',
  '.fsesfffffff....',
  '.fnssfffffff....',
  '.fmmsfffffff....',
  '.ffffffffffff...',
  '.ffffffffffff...',
  '.ffffffffffff...',
  '.ffffffffffff...',
  '.ffffffffffff...',
  '...ff...ff......',
  '.kkk.....kkk....',
  '................',
];
const addBigfoot = (atlas: Atlas) => {
  const d0 = strSprite(BIGFOOT_DOWN_0, BIGFOOT_PAL), d1 = strSprite(BIGFOOT_DOWN_1, BIGFOOT_PAL);
  const u0 = strSprite(BIGFOOT_UP_0, BIGFOOT_PAL), u1 = strSprite(BIGFOOT_UP_1, BIGFOOT_PAL);
  const l0 = strSprite(BIGFOOT_SIDE_0, BIGFOOT_PAL), l1 = strSprite(BIGFOOT_SIDE_1, BIGFOOT_PAL);
  atlas['npc-bigfoot-down-0'] = d0; atlas['npc-bigfoot-down-1'] = d1;
  atlas['npc-bigfoot-up-0'] = u0; atlas['npc-bigfoot-up-1'] = u1;
  atlas['npc-bigfoot-left-0'] = l0; atlas['npc-bigfoot-left-1'] = l1;
  atlas['npc-bigfoot-right-0'] = mirror(l0); atlas['npc-bigfoot-right-1'] = mirror(l1);
};

// Mine crawlers — skittering shadows with too many eyes.
// Crawlers: domed carapace with a top-left rim (l), belly shadow (d) and
// glowing eyes (y). Two skitter frames swap the leg positions.
const CRAWLER_0 = [
  '................',
  '................',
  '................',
  '....cc....cc....',
  '...lccc..cccl...',
  '..lccccccccccd..',
  '..lcyccccccycd..',
  '..lccccccccccd..',
  '..lcccyccycccd..',
  '...dccccccccd...',
  '..d..dd..dd..d..',
  '.d...d....d...d.',
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
  '...lccc..cccl...',
  '..lccccccccccd..',
  '..lcyccccccycd..',
  '..lccccccccccd..',
  '..lcccyccycccd..',
  '...dccccccccd...',
  '.d..dd..dd..d...',
  '..d...d..d...d..',
  '................',
  '................',
  '................',
  '................',
];
const addCrawler = (atlas: Atlas) => {
  atlas['crawler-0'] = strSprite(CRAWLER_0, { c: '#1d1924', y: '#e857a8', l: '#352b42', d: '#0e0b15' });
  atlas['crawler-1'] = strSprite(CRAWLER_1, { c: '#1d1924', y: '#e857a8', l: '#352b42', d: '#0e0b15' });
};

// Fast crawler — lean, narrow, spindly legs.
const CRAWLER_FAST_0 = [
  '................',
  '................',
  '................',
  '......cccc......',
  '.....lccccd.....',
  '....lcyccycd....',
  '....lccccccd....',
  '....dd.dd.dd....',
  '.....dccccd.....',
  '...d.d.dd.d.d...',
  '..d..........d..',
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
  '.....lccccd.....',
  '....lcyccycd....',
  '....lccccccd....',
  '....dd.dd.dd....',
  '.....dccccd.....',
  '..d.d.dd.d.d....',
  '...d..........d.',
  '................',
  '................',
  '................',
  '................',
  '................',
];
// Tank crawler — bulky, wide, heavy carapace with stubby legs.
const CRAWLER_TANK_0 = [
  '................',
  '...cc......cc...',
  '..lccc....cccl..',
  '.lccccccccccccd.',
  'lccccccccccccccd',
  'lcyccccccccyccd.',
  'lccccccccccccccd',
  '.lccccccccccccd.',
  '.dccccccccccccd.',
  '..dd.dd.dd.dd...',
  '..d..d..d..d....',
  '................',
  '................',
  '................',
  '................',
  '................',
];
const CRAWLER_TANK_1 = [
  '................',
  '...cc......cc...',
  '..lccc....cccl..',
  '.lccccccccccccd.',
  'lccccccccccccccd',
  'lcyccccccccyccd.',
  'lccccccccccccccd',
  '.lccccccccccccd.',
  '.dccccccccccccd.',
  '.dd.dd.dd.dd.dd.',
  '.d..d..d..d..d..',
  '................',
  '................',
  '................',
  '................',
  '................',
];
const addCrawlerVariants = (atlas: Atlas) => {
  atlas['crawler-fast-0'] = strSprite(CRAWLER_FAST_0, { c: '#241d2e', y: '#7ce8e0', l: '#3d3450', d: '#130f1c' });
  atlas['crawler-fast-1'] = strSprite(CRAWLER_FAST_1, { c: '#241d2e', y: '#7ce8e0', l: '#3d3450', d: '#130f1c' });
  atlas['crawler-tank-0'] = strSprite(CRAWLER_TANK_0, { c: '#1a1622', y: '#ff7cc4', l: '#322940', d: '#0c0913' });
  atlas['crawler-tank-1'] = strSprite(CRAWLER_TANK_1, { c: '#1a1622', y: '#ff7cc4', l: '#322940', d: '#0c0913' });
  atlas['crawler-gold-0'] = strSprite(CRAWLER_0, { c: '#bd9a3a', y: '#fff0b0', l: '#e6c866', d: '#7a5e1e' });
  atlas['crawler-gold-1'] = strSprite(CRAWLER_1, { c: '#bd9a3a', y: '#fff0b0', l: '#e6c866', d: '#7a5e1e' });
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
  atlas['t-road'] = tile(ctx => {
    fill(ctx, '#34343c');
    speckle(ctx, '#45454f', 3, 14);                                    // light aggregate
    speckle(ctx, '#2b2b32', 71, 10);                                   // dark grit
    speckle(ctx, '#525260', 89, 4);                                    // bright fleck
    ctx.fillStyle = '#2a2a31'; ctx.fillRect(0, 11, 6, 1); ctx.fillRect(9, 4, 5, 1); // hairline cracks
  });
  atlas['t-road-line'] = tile(ctx => {
    fill(ctx, '#34343c');
    speckle(ctx, '#45454f', 5, 14); speckle(ctx, '#2b2b32', 73, 10);
    ctx.fillStyle = '#c9c5a8'; ctx.fillRect(2, 7, 5, 2); ctx.fillRect(10, 7, 5, 2);  // worn paint dashes
    ctx.fillStyle = '#eae6cc'; ctx.fillRect(2, 7, 2, 1); ctx.fillRect(10, 7, 2, 1);  // dash highlight
    ctx.fillStyle = '#a39f82'; ctx.fillRect(2, 9, 5, 1); ctx.fillRect(10, 9, 5, 1);  // dash wear/shadow
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

  // Courier gig terminal — a public delivery kiosk on a post: dark casing, a
  // glowing teal screen (parcel logo + request lines + scanlines), a status LED,
  // and a bright-rimmed deposit slot you drop the wanted item into. Solid; faced.
  // Authored neutral-daytime (engine tints night; a soft screen glow is added in
  // the city draw block). Replaces the old odd-jobs corkboard.
  atlas['t-terminal'] = tile(ctx => {
    // konbini checker floor base (legend tiles REPLACE the floor — a transparent base showed a mismatched backdrop)
    fill(ctx, '#d8d2c4'); ctx.fillStyle = '#c8c2b2'; ctx.fillRect(0, 0, 8, 8); ctx.fillRect(8, 8, 8, 8);
    // brushed-metal pedestal post + foot (light from upper-left)
    ctx.fillStyle = '#6a7079'; ctx.fillRect(6, 11, 4, 4);
    ctx.fillStyle = '#878d96'; ctx.fillRect(6, 11, 1, 4);                              // post highlight
    ctx.fillStyle = '#4d525a'; ctx.fillRect(9, 11, 1, 4);                              // post shade
    ctx.fillStyle = '#787e87'; ctx.fillRect(4, 14, 8, 1);                              // splayed foot
    ctx.fillStyle = '#3a3f48'; ctx.fillRect(4, 15, 8, 1);                              // foot shadow
    // kiosk casing (dark, beveled)
    ctx.fillStyle = '#2b2f3a'; ctx.fillRect(1, 1, 14, 11);
    ctx.fillStyle = '#3a3f4c'; ctx.fillRect(1, 1, 14, 1);                              // top bevel highlight
    ctx.fillStyle = '#1d2028'; ctx.fillRect(1, 10, 14, 2);                             // casing shade under screen
    ctx.fillStyle = '#7ef06a'; ctx.fillRect(12, 1, 1, 1);                             // "online" status LED
    // glowing screen
    ctx.fillStyle = '#123c44'; ctx.fillRect(2, 2, 12, 7);                              // screen base (dark teal)
    ctx.fillStyle = '#1d6b76'; ctx.fillRect(2, 2, 12, 1);                              // top glow band
    ctx.fillStyle = '#0e3138'; ctx.fillRect(2, 4, 12, 1); ctx.fillRect(2, 6, 12, 1); ctx.fillRect(2, 8, 12, 1); // scanlines
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(3, 3, 2, 2);                               // little gold parcel logo
    ctx.fillStyle = '#caa23a'; ctx.fillRect(3, 4, 2, 1);
    ctx.fillStyle = '#5fe6d2'; ctx.fillRect(6, 3, 7, 1); ctx.fillRect(6, 5, 5, 1); ctx.fillRect(3, 7, 8, 1); // request UI lines
    ctx.fillStyle = '#9af4e6'; ctx.fillRect(6, 3, 3, 1);                               // brighter glyph
    ctx.fillStyle = '#ffe08a'; ctx.fillRect(12, 7, 1, 1);                             // reward chip
    // bright-rimmed deposit slot
    ctx.fillStyle = '#5fe6d2'; ctx.fillRect(4, 9, 8, 1);                               // glowing slot rim
    ctx.fillStyle = '#9af4e6'; ctx.fillRect(5, 9, 2, 1);                               // rim highlight
    ctx.fillStyle = '#10131a'; ctx.fillRect(4, 10, 8, 1);                              // slot mouth
  });

  // Shop interiors
  atlas['t-shopfloor'] = tile(ctx => {
    fill(ctx, '#d8d2c4');
    ctx.fillStyle = '#c8c2b2'; ctx.fillRect(0, 0, 8, 8); ctx.fillRect(8, 8, 8, 8);
  });
  atlas['t-counter'] = tile(ctx => {
    fill(ctx, '#6e4a2f');
    ctx.fillStyle = '#8a6644'; ctx.fillRect(0, 0, 16, 5);                 // lit top surface
    ctx.fillStyle = '#9a7450'; ctx.fillRect(0, 0, 16, 1);                 // top sheen (upper-left light)
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(0, 5, 16, 1);                 // top/front seam
    ctx.fillStyle = '#5f4029'; ctx.fillRect(2, 8, 10, 1); ctx.fillRect(4, 11, 8, 1); // wood grain on front face
    ctx.fillStyle = '#4a3f36'; ctx.fillRect(0, 15, 16, 1);               // base shadow
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
    ctx.fillStyle = '#7c8388'; ctx.fillRect(0, 0, 16, 1);                  // lit top
    ctx.fillStyle = '#5a5e62'; ctx.fillRect(0, 1, 16, 1); ctx.fillRect(0, 8, 16, 1); ctx.fillRect(8, 0, 1, 8); // slab joints
    ctx.fillStyle = '#3e4246'; ctx.fillRect(2, 3, 5, 1); ctx.fillRect(6, 4, 1, 2); ctx.fillRect(10, 10, 5, 1); ctx.fillRect(12, 11, 1, 3); // jagged cracks
    ctx.fillStyle = '#4a4e52'; ctx.fillRect(3, 12, 2, 2);                  // chipped pothole
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(8, 9, 1, 1); ctx.fillRect(9, 8, 1, 1); // weed in crack
    speckle(ctx, '#7c8084', 31, 6); speckle(ctx, '#56595d', 37, 4);
  });
  atlas['t-asphalt'] = tile(ctx => {
    fill(ctx, '#2c2c32');
    speckle(ctx, '#36363c', 37, 10); speckle(ctx, '#26262b', 41, 6);      // aggregate
    ctx.fillStyle = '#3a3a44'; ctx.fillRect(0, 5, 16, 1);                  // faint oily sheen band
    ctx.fillStyle = '#222226'; ctx.fillRect(2, 9, 7, 1); ctx.fillRect(9, 3, 4, 1); // cracks
    ctx.fillStyle = '#42424c'; ctx.fillRect(11, 12, 2, 1);                 // gravel fleck
  });
  atlas['t-bld-club'] = tile(ctx => {
    fill(ctx, '#2a2333');
    ctx.fillStyle = '#1d1826'; ctx.fillRect(0, 14, 16, 2);
    ctx.fillStyle = '#e857a8'; ctx.fillRect(2, 4, 12, 2);
    ctx.fillStyle = '#7ce8e0'; ctx.fillRect(2, 8, 8, 1);
  });
  atlas['t-bld-garage'] = tile(ctx => {
    fill(ctx, '#7a7468');
    for (let y = 1; y < 16; y += 4) {                          // corrugated ribs
      ctx.fillStyle = '#8a8478'; ctx.fillRect(0, y, 16, 1);    // rib highlight
      ctx.fillStyle = '#5e584d'; ctx.fillRect(0, y + 2, 16, 1);// rib shadow
    }
    ctx.fillStyle = '#9a6a4a'; ctx.fillRect(3, 4, 1, 8); ctx.fillRect(11, 2, 1, 10); // rust streaks
    ctx.fillStyle = '#564f44'; ctx.fillRect(0, 14, 16, 2);     // base
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
    fill(ctx, '#6e3e3e');
    ctx.fillStyle = '#854a4a'; ctx.fillRect(0, 0, 16, 1);      // faded top
    ctx.fillStyle = '#5c3434'; ctx.fillRect(0, 1, 16, 1); ctx.fillRect(0, 14, 16, 2);
    ctx.fillStyle = '#7a5638'; ctx.fillRect(11, 4, 2, 6); ctx.fillRect(2, 9, 1, 4); // rust streaks
    ctx.fillStyle = '#2c2c30'; ctx.fillRect(2, 2, 12, 6);      // dead display glass
    ctx.fillStyle = '#3c3c40'; ctx.fillRect(2, 2, 12, 1);      // glass top sheen
    ctx.fillStyle = '#16181d'; ctx.fillRect(4, 3, 5, 1); ctx.fillRect(8, 5, 4, 2); // cracked screen
    ctx.fillStyle = '#2c2c30'; ctx.fillRect(2, 10, 8, 3);      // dark dispenser
    ctx.fillStyle = '#c9821e'; ctx.fillRect(4, 4, 1, 1);       // one dying amber light
  });

  // Nightclub
  atlas['t-club-floor'] = tile(ctx => {
    fill(ctx, '#1d1826');
    ctx.fillStyle = '#241e30'; ctx.fillRect(0, 0, 8, 8); ctx.fillRect(8, 8, 8, 8); // polished checker sheen (8px = seamless)
    speckle(ctx, '#2a2333', 41, 6);
    ctx.fillStyle = '#3a2f4a'; ctx.fillRect(2, 2, 1, 1); ctx.fillRect(11, 5, 1, 1); ctx.fillRect(6, 12, 1, 1); // floor glints
    ctx.fillStyle = '#e857a8'; ctx.fillRect(13, 3, 1, 1);     // reflected neon (pink)
    ctx.fillStyle = '#7ce8e0'; ctx.fillRect(4, 9, 1, 1);      // reflected neon (cyan)
  });
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
    ctx.fillStyle = '#a4a4aa'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 0, 1, 16); // upper-left warm-lit slab edge
    ctx.fillStyle = '#8a8a90'; ctx.fillRect(0, 7, 16, 1); ctx.fillRect(7, 0, 1, 16); // slab expansion joints
    ctx.fillStyle = '#7a7a82'; ctx.fillRect(0, 8, 16, 1); ctx.fillRect(8, 0, 1, 16); // joint shadow lip
    ctx.fillStyle = '#90909a'; ctx.fillRect(2, 11, 4, 1); ctx.fillRect(10, 3, 3, 1); // tire scuffs
    speckle(ctx, '#a6a6ac', 43, 7);  // light aggregate
    speckle(ctx, '#8e8e94', 47, 5);  // dark aggregate
  });
  atlas['t-garage-stain'] = tile(ctx => {
    fill(ctx, '#9a9aa0');
    ctx.fillStyle = '#a4a4aa'; ctx.fillRect(0, 0, 16, 1);      // lit
    ctx.fillStyle = '#8a8a90'; ctx.fillRect(0, 7, 16, 1); ctx.fillRect(7, 0, 1, 16); // slab joints
    ctx.fillStyle = '#4a4a52'; ctx.fillRect(3, 8, 7, 4); ctx.fillRect(5, 6, 4, 2); ctx.fillRect(4, 12, 4, 1); // oil pool spread
    ctx.fillStyle = '#2a2a32'; ctx.fillRect(5, 9, 3, 2);       // oil core
    ctx.fillStyle = '#4a4258'; ctx.fillRect(6, 8, 2, 1);       // faint sheen
    speckle(ctx, '#8a8a90', 67, 4);
  });
  atlas['t-metal'] = tile(ctx => {
    fill(ctx, '#7a828e');
    ctx.fillStyle = '#838b97'; for (let y = 0; y < 16; y += 2) ctx.fillRect(0, y, 16, 1); // brushed striations (lit)
    ctx.fillStyle = '#6e7682'; for (let y = 1; y < 16; y += 2) ctx.fillRect(0, y, 16, 1); // brushed striations (low)
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 0, 1, 15);       // panel top/left highlight
    ctx.fillStyle = '#5a626e'; ctx.fillRect(0, 8, 16, 1); ctx.fillRect(8, 0, 1, 16);       // panel seams (cross)
    ctx.fillStyle = '#3a4250'; ctx.fillRect(0, 9, 16, 1);                                  // seam shadow
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(2, 2, 1, 1); ctx.fillRect(13, 2, 1, 1); ctx.fillRect(2, 12, 1, 1); ctx.fillRect(13, 12, 1, 1); // rivet heads
    ctx.fillStyle = '#3a4250'; ctx.fillRect(2, 3, 1, 1); ctx.fillRect(13, 3, 1, 1); ctx.fillRect(2, 13, 1, 1); ctx.fillRect(13, 13, 1, 1); // rivet shadows
  });
  atlas['t-toolbench'] = tile(ctx => {
    fill(ctx, '#5a4d42');
    ctx.fillStyle = '#b08a50'; ctx.fillRect(0, 0, 16, 7);                 // pegboard back panel
    ctx.fillStyle = '#c4a366'; ctx.fillRect(0, 0, 16, 1);                 // pegboard lit top
    ctx.fillStyle = '#8a6a3a'; for (let y = 2; y < 7; y += 2) for (let x = 1; x < 16; x += 2) ctx.fillRect(x, y, 1, 1); // peg holes
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(2, 1, 1, 5); ctx.fillRect(1, 1, 3, 1); // hung wrench
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(7, 2, 1, 4); ctx.fillStyle = '#9aa0a6'; ctx.fillRect(6, 1, 3, 2); // hammer
    ctx.fillStyle = '#d05050'; ctx.fillRect(12, 1, 1, 2); ctx.fillStyle = '#c9a227'; ctx.fillRect(12, 3, 1, 3); // screwdriver
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(0, 7, 16, 2);                 // steel worktop
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(0, 7, 16, 1);                 // worktop sheen
    ctx.fillStyle = '#6e7682'; ctx.fillRect(0, 9, 16, 1);                 // worktop shadow lip
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(0, 10, 16, 6);                // wood body front face
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(0, 13, 16, 1);               // drawer seam
    ctx.fillStyle = '#c9a227'; ctx.fillRect(11, 11, 3, 1);               // drawer pull
    ctx.fillStyle = '#4a3f36'; ctx.fillRect(0, 15, 16, 1);               // base shadow
  });
  atlas['t-lift'] = tile(ctx => {
    fill(ctx, '#9a9aa0');
    for (let i = -1; i < 4; i++) {                                       // hazard accent border (top/bottom)
      ctx.fillStyle = '#ffd24a'; ctx.fillRect(i * 6, 0, 3, 2); ctx.fillRect(i * 6 + 3, 14, 3, 2);
      ctx.fillStyle = '#2c3038'; ctx.fillRect(i * 6 + 3, 0, 3, 2); ctx.fillRect(i * 6, 14, 3, 2);
    }
    ctx.fillStyle = '#6e7682'; ctx.fillRect(1, 3, 14, 10);               // steel lift platform
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(1, 3, 14, 1); ctx.fillRect(1, 3, 1, 10); // lit top/left
    ctx.fillStyle = '#3a4250'; ctx.fillRect(1, 12, 14, 1); ctx.fillRect(14, 3, 1, 10); // shadow bottom/right
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(7, 3, 2, 9);                 // hydraulic cylinder
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(7, 3, 1, 9);                 // chrome highlight
    ctx.fillStyle = '#3a4250'; ctx.fillRect(9, 3, 1, 9);                 // cylinder shadow
    ctx.fillStyle = '#3a4250'; ctx.fillRect(4, 5, 1, 1); ctx.fillRect(11, 5, 1, 1); ctx.fillRect(4, 10, 1, 1); ctx.fillRect(11, 10, 1, 1); // mount bolts
  });
  atlas['t-tires'] = tile(ctx => {
    fill(ctx, '#9a9aa0');
    ctx.fillStyle = '#2c3038'; ctx.fillRect(2, 8, 12, 7); ctx.fillRect(3, 7, 10, 1); // lower tire
    ctx.fillStyle = '#16181d'; ctx.fillRect(2, 13, 12, 2);              // lower tire ground shadow
    ctx.fillStyle = '#3c424a'; ctx.fillRect(3, 8, 10, 1);              // lower rubber sheen
    ctx.fillStyle = '#3a4250'; ctx.fillRect(3, 2, 10, 6); ctx.fillRect(4, 1, 8, 1); // upper tire
    ctx.fillStyle = '#2c3038'; ctx.fillRect(3, 6, 10, 2);              // upper tire shaded underside
    ctx.fillStyle = '#4a525c'; ctx.fillRect(4, 2, 8, 1);              // upper rubber sheen (upper-left)
    ctx.fillStyle = '#16181d'; ctx.fillRect(5, 3, 1, 2); ctx.fillRect(9, 3, 1, 2); ctx.fillRect(5, 13, 1, 1); ctx.fillRect(9, 13, 1, 1); // tread ticks
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(6, 3, 4, 3);              // steel rim hint (top tire)
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(6, 3, 3, 1);              // rim lit
    ctx.fillStyle = '#3a4250'; ctx.fillRect(7, 4, 2, 1);              // hub hole
  });
  // Dispatch board: a clipboard of delivery jobs bolted to the garage wall.
  atlas['t-dispatch'] = tile(ctx => {
    fill(ctx, '#7a828e');                                                              // brushed metal wall behind
    ctx.fillStyle = '#838b97'; for (let y = 0; y < 16; y += 2) ctx.fillRect(0, y, 16, 1);
    ctx.fillStyle = '#6e7682'; ctx.fillRect(0, 9, 16, 1);                              // seam shadow
    ctx.fillStyle = '#4a3f36'; ctx.fillRect(2, 1, 12, 14);                              // clipboard board
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(2, 1, 12, 1); ctx.fillRect(2, 1, 1, 13);    // lit bevel (top/left)
    ctx.fillStyle = '#2c2620'; ctx.fillRect(13, 2, 1, 13); ctx.fillRect(3, 14, 11, 1);  // shadow bevel (right/bottom)
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(4, 3, 8, 10);                               // work-order paper
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(11, 3, 1, 10); ctx.fillRect(4, 12, 8, 1);   // paper shade (right/bottom)
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(6, 1, 4, 3);                                // metal clip
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(6, 1, 4, 1);                                // clip sheen
    ctx.fillStyle = '#6e7682'; ctx.fillRect(6, 3, 4, 1);                                // clip shadow
    ctx.fillStyle = '#6e7682'; ctx.fillRect(5, 6, 6, 1); ctx.fillRect(5, 8, 6, 1); ctx.fillRect(5, 10, 4, 1); // job lines
    ctx.fillStyle = '#c0392b'; ctx.fillRect(5, 4, 5, 1);                                // red URGENT stamp
  });
  atlas['t-hazard'] = tile(ctx => {
    fill(ctx, '#ffd24a');                                               // yellow base
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {        // diagonal hazard ramp
      const m = (x + y) & 7;
      const c = m === 0 ? '#ffe9a0' : m === 3 ? '#c9a227'
        : m === 4 ? '#3a4250' : m === 7 ? '#16181d' : (m > 4 ? '#2c3038' : null);
      if (c) { ctx.fillStyle = c; ctx.fillRect(x, y, 1, 1); }
    }
    ctx.fillStyle = '#9a9aa0'; ctx.fillRect(4, 9, 3, 1); ctx.fillRect(11, 3, 2, 1); ctx.fillRect(8, 13, 2, 1); // worn-through paint
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
  atlas['t-blackjack'] = tile(ctx => {                      // fake-3D card table: wood rail, felt, fanned cards + chip stacks
    fill(ctx, '#2a1822');                                   // casino carpet base
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(2, 13, 13, 2); // floor shadow
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(1, 2, 14, 12);  // wooden rail
    ctx.fillStyle = '#8a6644'; ctx.fillRect(1, 2, 14, 1); ctx.fillRect(1, 2, 1, 11);  // rail lit edge (upper-left)
    ctx.fillStyle = '#3a2716'; ctx.fillRect(14, 3, 1, 11); ctx.fillRect(2, 13, 13, 1); // rail shade
    ctx.fillStyle = '#2c6e44'; ctx.fillRect(3, 4, 10, 8);   // felt
    ctx.fillStyle = '#368351'; ctx.fillRect(3, 4, 10, 1); ctx.fillRect(3, 4, 1, 7);   // felt sheen
    ctx.fillStyle = '#c9a227'; ctx.fillRect(4, 9, 2, 1); ctx.fillRect(6, 10, 4, 1); ctx.fillRect(10, 9, 2, 1); // curved bet arc
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(5, 5, 2, 3); ctx.fillRect(7, 6, 2, 3);    // fanned dealt cards
    ctx.fillStyle = '#c0392b'; ctx.fillRect(5, 6, 1, 1); ctx.fillRect(8, 7, 1, 1);    // pips
    ctx.fillStyle = '#e8746a'; ctx.fillRect(10, 5, 2, 1);   // red chip stack (lit top)
    ctx.fillStyle = '#d05050'; ctx.fillRect(10, 6, 2, 1);
    ctx.fillStyle = '#50a0d0'; ctx.fillRect(11, 7, 2, 1);   // blue chip stack (lit top)
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(11, 8, 2, 1);
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
  // Gallery parquet: dark polished wood blocks + sheen glints (the old pale
  // marble read identical to the walls — the room had no depth).
  // Same recipe as the apartment's proven t-wood, one shade darker (dense seam
  // grids at this scale kept reading as masonry).
  const museumFloor = (ctx: CanvasRenderingContext2D) => {
    fill(ctx, '#8a6a4e');
    ctx.fillStyle = '#79593f';
    ctx.fillRect(0, 5, 16, 1); ctx.fillRect(0, 11, 16, 1);    // plank rows
    ctx.fillStyle = '#6e4f38'; ctx.fillRect(4, 0, 1, 5); ctx.fillRect(11, 6, 1, 5); ctx.fillRect(6, 12, 1, 4); // joints
    speckle(ctx, '#97785c', 7, 6);
  };
  atlas['t-museum-floor'] = tile(museumFloor);
  // A museum wall + its picture rail + wainscot — the gallery's bones.
  // Deep gallery navy so the gold frames + cream plinths POP.
  const museumWall = (ctx: CanvasRenderingContext2D) => {
    fill(ctx, '#232c3a');                                     // gallery navy
    ctx.fillStyle = '#2a3547'; ctx.fillRect(0, 0, 16, 3);     // top band
    ctx.fillStyle = '#c9a227'; ctx.fillRect(0, 3, 16, 1);     // gold picture rail
    ctx.fillStyle = '#7a621a'; ctx.fillRect(0, 4, 16, 1);     // rail shadow
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(0, 11, 16, 5);    // cream wainscot
    ctx.fillStyle = '#e0d5b8'; ctx.fillRect(0, 11, 16, 1);    // wainscot top light
    ctx.fillStyle = '#b3a279'; ctx.fillRect(5, 12, 1, 3); ctx.fillRect(10, 12, 1, 3); // panel joints
    ctx.fillStyle = '#8a7a5a'; ctx.fillRect(0, 15, 16, 1);    // base shadow
  };
  atlas['t-museum-wall'] = tile(museumWall);
  // A floor plinth/pedestal (empty). Solid. Sits on the parquet.
  const plinth = (ctx: CanvasRenderingContext2D) => {
    museumFloor(ctx);                                         // floor under it
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(3, 14, 11, 2); // contact shadow
    ctx.fillStyle = '#b8ae98'; ctx.fillRect(4, 4, 8, 11);     // column body
    ctx.fillStyle = '#8a8070'; ctx.fillRect(4, 4, 1, 11);     // side shade
    ctx.fillStyle = '#e0d8c4'; ctx.fillRect(3, 2, 10, 2);     // cap
    ctx.fillStyle = '#cfc6b0'; ctx.fillRect(4, 4, 8, 1);      // cap underline highlight
    ctx.fillStyle = '#9a907a'; ctx.fillRect(3, 14, 10, 1);    // base lip
  };
  atlas['t-pedestal'] = tile(plinth);
  atlas['t-mus-carpet'] = tile(ctx => {                       // red runner, gold-edged (door -> hall)
    fill(ctx, '#9e3a3a'); speckle(ctx, '#8e2a1e', 41, 6);
    ctx.fillStyle = '#b34a4a'; ctx.fillRect(2, 0, 12, 16);    // lit center  hmm keep edges
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(3, 0, 10, 16);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(0, 0, 1, 16); ctx.fillRect(15, 0, 1, 16); // gold edges
    ctx.fillStyle = '#7a2820'; ctx.fillRect(1, 0, 1, 16); ctx.fillRect(14, 0, 1, 16); // edge shadow
  });
  atlas['t-mus-rope'] = tile(ctx => {                         // velvet rope barrier (solid)
    museumFloor(ctx);
    ctx.fillStyle = 'rgba(0,0,0,0.16)'; ctx.fillRect(1, 13, 4, 1); ctx.fillRect(11, 13, 4, 1);
    ctx.fillStyle = '#c0392b';                                // red velvet swag between posts
    ctx.fillRect(4, 7, 2, 1); ctx.fillRect(6, 8, 4, 1); ctx.fillRect(10, 7, 2, 1);
    for (const px of [2, 12]) {                               // brass posts, ball tops
      ctx.fillStyle = '#c9a227'; ctx.fillRect(px, 4, 2, 9);
      ctx.fillStyle = '#ffd24a'; ctx.fillRect(px, 3, 2, 2); ctx.fillRect(px, 4, 1, 8);
      ctx.fillStyle = '#8a6a30'; ctx.fillRect(px - 1, 12, 4, 1); // foot
    }
  });
  atlas['t-mus-banner'] = tile(ctx => {                       // hanging gallery tapestry (wall row)
    museumWall(ctx);
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(3, 1, 10, 1);     // rod
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(4, 2, 8, 11);     // banner field
    ctx.fillStyle = '#b34a4a'; ctx.fillRect(4, 2, 1, 11);     // lit edge
    ctx.fillStyle = '#c9a227'; ctx.fillRect(4, 2, 8, 1); ctx.fillRect(4, 12, 8, 1); // gold trim
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7, 5, 2, 2); ctx.fillRect(6, 8, 4, 1);  // emblem
    ctx.fillStyle = '#7a2820'; ctx.fillRect(5, 13, 1, 1); ctx.fillRect(8, 13, 1, 1); ctx.fillRect(11, 13, 1, 1); // fringe
  });
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
    ctx.fillStyle = '#3a3344'; ctx.fillRect(1, 1, 6, 5); ctx.fillRect(9, 6, 5, 6); ctx.fillRect(3, 11, 5, 4); // rock facets
    ctx.fillStyle = '#473e54'; ctx.fillRect(1, 1, 6, 1); ctx.fillRect(9, 6, 5, 1); ctx.fillRect(3, 11, 5, 1); // facet top highlight
    ctx.fillStyle = '#221d2a'; ctx.fillRect(7, 2, 1, 12); ctx.fillRect(0, 7, 16, 1);                          // crevice shadows
    speckle(ctx, '#4a4256', 41, 6);                                                                            // mineral fleck
    speckle(ctx, '#1d1924', 47, 5);
    ctx.fillStyle = '#1d1924'; ctx.fillRect(0, 14, 16, 2);                                                     // base seam
  });
  atlas['t-cave-floor'] = tile(ctx => {
    fill(ctx, '#453d4e');
    speckle(ctx, '#524a5c', 61, 9);                                                                            // light grit
    speckle(ctx, '#3a3344', 67, 7);                                                                            // dark grit
    ctx.fillStyle = '#564d62'; ctx.fillRect(3, 4, 3, 2); ctx.fillRect(10, 9, 3, 2); ctx.fillRect(6, 12, 2, 2); // pebbles (lit)
    ctx.fillStyle = '#5e5468'; ctx.fillRect(3, 4, 1, 1); ctx.fillRect(10, 9, 1, 1);                            // pebble highlight
    ctx.fillStyle = '#332c3e'; ctx.fillRect(3, 6, 3, 1); ctx.fillRect(10, 11, 3, 1); ctx.fillRect(6, 14, 2, 1); // pebble shadow
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

  // Treasure-vault chest (transparent bg, sits on the cave floor). Closed: a domed
  // wooden chest with gold bands + a lock. Opened: lid flung back, gold spilling out.
  atlas['t-chest'] = tile(ctx => {
    ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(3, 14, 11, 2);          // contact shadow
    // domed lid
    ctx.fillStyle = '#7a5436'; ctx.fillRect(4, 3, 8, 1); ctx.fillRect(3, 4, 10, 4);
    ctx.fillStyle = '#9a6c44'; ctx.fillRect(4, 3, 8, 1); ctx.fillRect(3, 4, 10, 1); // top light
    // body
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(3, 8, 10, 6);
    ctx.fillStyle = '#7e552f'; ctx.fillRect(3, 8, 10, 1);                    // body top lit
    ctx.fillStyle = '#54351f'; ctx.fillRect(3, 12, 10, 2);                   // body bottom shade
    ctx.fillStyle = '#5a3a25'; ctx.fillRect(3, 10, 10, 1);                   // plank line
    // gold rim across the lid seam
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(3, 7, 10, 1);
    // gold bands
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(4, 3, 2, 11); ctx.fillRect(10, 3, 2, 11);
    ctx.fillStyle = '#c79320'; ctx.fillRect(5, 4, 1, 10); ctx.fillRect(11, 4, 1, 10); // band shade
    ctx.fillStyle = '#fff0b0'; ctx.fillRect(4, 3, 1, 1); ctx.fillRect(10, 3, 1, 1);   // band glints
    // lock
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(7, 7, 2, 3);
    ctx.fillStyle = '#7a5a10'; ctx.fillRect(7, 9, 2, 1);                     // keyhole
  });
  atlas['t-chest-open'] = tile(ctx => {
    ctx.fillStyle = 'rgba(0,0,0,0.30)'; ctx.fillRect(3, 14, 11, 2);          // contact shadow
    // lid flung back (top of tile, darker underside)
    ctx.fillStyle = '#5a3a25'; ctx.fillRect(3, 1, 10, 3);
    ctx.fillStyle = '#7a5436'; ctx.fillRect(3, 1, 10, 1);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(5, 1, 1, 3); ctx.fillRect(10, 1, 1, 3); // band undersides
    // body
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(3, 7, 10, 7);
    ctx.fillStyle = '#54351f'; ctx.fillRect(3, 12, 10, 2);
    // dark interior + gold treasure spilling over the front
    ctx.fillStyle = '#2a1c12'; ctx.fillRect(4, 6, 8, 3);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(5, 6, 6, 2); ctx.fillRect(4, 7, 8, 1);
    ctx.fillStyle = '#fff0b0'; ctx.fillRect(6, 6, 1, 1); ctx.fillRect(9, 6, 1, 1);   // glints
    // gold bands on the body
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(4, 9, 2, 5); ctx.fillRect(10, 9, 2, 5);
    ctx.fillStyle = '#c79320'; ctx.fillRect(5, 9, 1, 5); ctx.fillRect(11, 9, 1, 5);
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
  atlas['t-tree'] = tile(ctx => {                            // round leafy tree on grass (the old full-tile blob read as a moss cube)
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 13, 6);    // grass base (matches t-grass)
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(4, 13, 9, 2); // contact shadow
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(7, 10, 3, 4);    // trunk
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(7, 10, 1, 4);    // trunk lit edge
    // rounded canopy: stacked rects taper top + bottom
    ctx.fillStyle = '#4d7440';
    ctx.fillRect(2, 3, 12, 7);                               // mid mass
    ctx.fillRect(4, 1, 8, 2);                                // crown
    ctx.fillRect(3, 10, 10, 1);                              // underside taper
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(4, 2, 5, 3); ctx.fillRect(3, 5, 3, 2); // sunlit upper-left leaves
    ctx.fillStyle = '#7cb86a'; ctx.fillRect(5, 2, 2, 1); ctx.fillRect(4, 4, 1, 1); // sun-tip highlights
    ctx.fillStyle = '#3e5c33'; ctx.fillRect(10, 7, 4, 3); ctx.fillRect(5, 9, 6, 2); // shaded lower-right leaves
  });
  atlas['t-stonepath'] = tile(ctx => {
    fill(ctx, '#9aa0a6');
    ctx.fillStyle = '#878d93'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 5, 16, 1); ctx.fillRect(0, 10, 16, 1);
    ctx.fillRect(5, 1, 1, 4); ctx.fillRect(11, 6, 1, 4); ctx.fillRect(7, 11, 1, 5);
    speckle(ctx, '#a8aeb4', 71, 5);
    ctx.fillStyle = '#6f9e5e'; ctx.fillRect(1, 13, 2, 1); ctx.fillRect(13, 2, 2, 1); // moss
  });
  atlas['t-pond'] = tile(ctx => {                            // garden koi pond (city torii garden) — calm water, lily pad, a koi
    fill(ctx, '#2e5e8e');                                    // still water (uniform base so 2×2 tiles read seamless)
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(2, 4, 6, 1); ctx.fillRect(9, 12, 5, 1); // soft sky-reflection bands (interior only)
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(3, 3, 3, 1); ctx.fillRect(10, 8, 2, 1); // ripple glints
    ctx.fillStyle = '#4d7440'; ctx.fillRect(11, 3, 3, 2); ctx.fillRect(12, 2, 1, 1); // lily pad
    ctx.fillStyle = '#e0885a'; ctx.fillRect(4, 9, 2, 1); ctx.fillRect(3, 10, 1, 1);  // a koi glides by
  });
  atlas['t-lantern'] = tile(ctx => {
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 73, 5); speckle(ctx, '#4d7440', 79, 3);
    ctx.fillStyle = 'rgba(255,210,120,0.16)'; ctx.fillRect(3, 2, 10, 7);            // warm glow halo
    ctx.fillStyle = '#7a818c'; ctx.fillRect(5, 1, 6, 1);                            // stone umbrella cap
    ctx.fillStyle = '#5d6470'; ctx.fillRect(6, 2, 4, 1);                            // cap underside
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(6, 3, 4, 4);                            // fire box
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(7, 3, 2, 2);                            // hot core
    ctx.fillStyle = '#c9821e'; ctx.fillRect(6, 6, 4, 1);                            // ember base
    ctx.fillStyle = '#6e7682'; ctx.fillRect(5, 3, 1, 4); ctx.fillRect(10, 3, 1, 4); // stone frame posts
    ctx.fillStyle = '#8a929c'; ctx.fillRect(5, 3, 1, 1);                            // frame highlight
    ctx.fillStyle = '#6e7682'; ctx.fillRect(7, 7, 2, 6);                            // pillar
    ctx.fillStyle = '#8a929c'; ctx.fillRect(7, 7, 1, 6);                            // pillar lit edge
    ctx.fillStyle = '#5d6470'; ctx.fillRect(8, 7, 1, 6);                            // pillar shadow
    ctx.fillStyle = '#7a818c'; ctx.fillRect(5, 13, 6, 2);                           // base
    ctx.fillStyle = '#5d6470'; ctx.fillRect(5, 14, 6, 1);                           // base shadow
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
    ctx.fillStyle = '#4d7440'; ctx.fillRect(4, 14, 9, 1);         // contact shadow on grass
    ctx.fillStyle = '#8a8d93'; ctx.fillRect(3, 6, 10, 8);         // stone basin block
    ctx.fillStyle = '#6e7178'; ctx.fillRect(3, 12, 10, 2);        // shadowed front face (fake-3D lip)
    ctx.fillStyle = '#5d6470'; ctx.fillRect(12, 6, 1, 8);         // right-side shadow
    ctx.fillStyle = '#a8abb1'; ctx.fillRect(3, 6, 10, 1); ctx.fillRect(3, 6, 1, 6); // sunlit rim (top + left)
    // still water — 3-step blue ramp
    ctx.fillStyle = '#50a0d0'; ctx.fillRect(4, 7, 8, 4);         // water surface (mid)
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(4, 10, 8, 1); ctx.fillRect(11, 7, 1, 4); // depth shadow (bottom/right)
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(4, 7, 5, 1); ctx.fillRect(4, 7, 1, 2);   // sky reflection (upper-left)
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(8, 9, 2, 1); ctx.fillStyle = '#3d6e9e'; ctx.fillRect(8, 10, 2, 1); // faint ripple
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(5, 7, 2, 1);         // bright surface glint
    // bamboo dipper (hishaku) resting across the rim
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(2, 4, 8, 1);         // handle (lit bamboo)
    ctx.fillStyle = '#b08a50'; ctx.fillRect(2, 5, 8, 1);         // handle underside
    ctx.fillStyle = '#8a6644'; ctx.fillRect(5, 4, 1, 1);         // bamboo node
    ctx.fillStyle = '#b08a50'; ctx.fillRect(9, 3, 4, 4);         // ladle cup
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(9, 3, 4, 1);         // cup rim (lit)
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(10, 4, 2, 2);        // cup hollow
  });
  atlas['t-shrine-wall'] = tile(ctx => {
    fill(ctx, '#b04a3a');                                          // vermillion timber
    ctx.fillStyle = '#c45a48'; ctx.fillRect(0, 0, 16, 1);          // top-lit edge
    ctx.fillStyle = '#9e3a2e'; ctx.fillRect(0, 2, 16, 1);          // lintel shadow
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(0, 14, 16, 2);         // base shadow
    ctx.fillStyle = '#d8d0c0'; ctx.fillRect(2, 3, 5, 9); ctx.fillRect(9, 3, 5, 9); // shoji paper
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 3, 5, 1); ctx.fillRect(9, 3, 5, 1); // paper top highlight
    ctx.fillStyle = '#bdb39e'; ctx.fillRect(2, 11, 5, 1); ctx.fillRect(9, 11, 5, 1); // paper bottom shade
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(4, 3, 1, 9); ctx.fillRect(11, 3, 1, 9); // muntin verticals
    ctx.fillRect(2, 6, 5, 1); ctx.fillRect(9, 6, 5, 1);            // muntin horizontals
    ctx.fillRect(2, 9, 5, 1); ctx.fillRect(9, 9, 5, 1);
    ctx.fillStyle = '#7a2418'; ctx.fillRect(7, 0, 2, 14);          // centre pillar
    ctx.fillStyle = '#9e3a2e'; ctx.fillRect(7, 0, 1, 14);          // pillar lit edge
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
    const petal = (x: number, y: number) => {              // little curled petal w/ shaded fold
      ctx.fillStyle = '#f0b8d4'; ctx.fillRect(x, y, 2, 1); ctx.fillRect(x, y + 1, 1, 1);
      ctx.fillStyle = '#d98ab0'; ctx.fillRect(x + 1, y + 1, 1, 1);
    };
    petal(3, 4); petal(10, 7); petal(6, 11); petal(12, 2); petal(2, 12);
    ctx.fillStyle = '#ffe9f2'; ctx.fillRect(8, 6, 1, 1); ctx.fillRect(13, 10, 1, 1); // bright flecks
  });

  // Island
  atlas['t-zama-poster'] = tile(ctx => {                    // ZamaZonk billboard on a post (sand)
    fill(ctx, '#e8d49a'); speckle(ctx, '#d8c48a', 41, 6); speckle(ctx, '#f0e0ae', 43, 3); // sandy ground
    ctx.fillStyle = '#4a3120'; ctx.fillRect(7, 9, 2, 7);    // post
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(7, 9, 1, 7);    // post lit edge
    ctx.fillStyle = '#120726'; ctx.fillRect(1, 0, 14, 9);   // dark board
    ctx.fillStyle = '#6a3fb0'; ctx.fillRect(1, 0, 14, 1); ctx.fillRect(1, 8, 14, 1); ctx.fillRect(1, 0, 1, 9); ctx.fillRect(14, 0, 1, 9); // purple frame
    ctx.fillStyle = '#9a6fe0'; ctx.fillRect(4, 2, 8, 5);    // box logo body
    ctx.fillStyle = '#b388f0'; ctx.fillRect(4, 2, 8, 1); ctx.fillRect(4, 2, 1, 5); // logo lit
    ctx.fillStyle = '#c9a227'; ctx.fillRect(4, 2, 8, 1); ctx.fillRect(7, 2, 2, 5); // gold tape cross
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(5, 6, 6, 1);    // smile arrow
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(3, 7, 1, 1); ctx.fillRect(12, 7, 1, 1); // sparkle
  });
  atlas['t-island-sign'] = tile(ctx => {                    // weathered island signpost planted in the sand
    fill(ctx, '#cdbb8e'); speckle(ctx, '#bda979', 19, 6);   // sand base (legend tiles REPLACE the floor — transparent showed black)
    ctx.fillStyle = '#4a3f36'; ctx.fillRect(5, 15, 7, 1);   // ground contact shadow (reads as planted)
    ctx.fillStyle = '#8a6644'; ctx.fillRect(7, 9, 2, 7);    // post
    ctx.fillStyle = '#a07a4f'; ctx.fillRect(7, 9, 1, 7);    // post lit edge (upper-left)
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(8, 9, 1, 7);    // post shadow edge (rounds the pole)
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(7, 12, 2, 1);   // grain node
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(1, 0, 14, 11);  // dark wood silhouette / outline + front face
    ctx.fillStyle = '#8a6644'; ctx.fillRect(2, 1, 12, 9);   // plank frame face
    ctx.fillStyle = '#c79a6e'; ctx.fillRect(2, 1, 12, 1);   // frame lit top edge
    ctx.fillStyle = '#a07a4f'; ctx.fillRect(2, 1, 1, 8);    // frame lit left edge
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(13, 1, 1, 8); ctx.fillRect(2, 9, 12, 1); // frame shade (right + lower)
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(3, 2, 10, 6);   // sun-bleached recessed sign panel
    ctx.fillStyle = '#a8916a'; ctx.fillRect(3, 2, 10, 1); ctx.fillRect(3, 2, 1, 6); // recess shadow (upper-left walls)
    ctx.fillStyle = '#d8c48a'; ctx.fillRect(4, 7, 9, 1);    // recess catch-light (lower wall)
    ctx.fillStyle = '#bda979'; ctx.fillRect(8, 4, 4, 1); ctx.fillRect(5, 6, 2, 1); // weathered grain streaks
    ctx.fillStyle = '#5a3c24';                              // hand-painted lettering — two short lines (reads as writing)
    ctx.fillRect(4, 3, 2, 1); ctx.fillRect(7, 3, 1, 1); ctx.fillRect(9, 3, 2, 1);
    ctx.fillRect(4, 5, 1, 1); ctx.fillRect(6, 5, 2, 1); ctx.fillRect(9, 5, 1, 1); ctx.fillRect(11, 5, 1, 1);
    ctx.fillStyle = '#4d7440'; ctx.fillRect(10, 13, 1, 2); ctx.fillRect(11, 14, 2, 1); // tropical bloom at the base
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(11, 13, 1, 1);
    ctx.fillStyle = '#d05050'; ctx.fillRect(12, 12, 2, 2);
    ctx.fillStyle = '#e07a6a'; ctx.fillRect(12, 12, 1, 1);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(13, 13, 1, 1);  // flower center
  });
  atlas['t-tiki'] = tile(ctx => {
    fill(ctx, '#5e8a4f');
    ctx.fillStyle = '#b5651d'; ctx.fillRect(0, 0, 16, 4);                            // thatch roof
    ctx.fillStyle = '#c9821e'; ctx.fillRect(0, 0, 16, 1);                            // sun edge
    ctx.fillStyle = '#8a4e16'; for (let x = 1; x < 16; x += 2) ctx.fillRect(x, 1, 1, 3); // thatch strands
    ctx.fillStyle = '#a8841c'; ctx.fillRect(0, 3, 16, 1);                            // thatch fringe
    ctx.fillStyle = '#a9805a'; ctx.fillRect(1, 4, 14, 9);                            // bamboo counter
    ctx.fillStyle = '#c79a6e'; ctx.fillRect(1, 4, 14, 1);                            // counter lit top
    ctx.fillStyle = '#6e4a2f'; for (let x = 3; x < 15; x += 4) ctx.fillRect(x, 4, 1, 9); // bamboo seams
    ctx.fillStyle = '#8a6644'; for (let x = 3; x < 15; x += 4) ctx.fillRect(x, 8, 1, 1); // bamboo nodes
    ctx.fillStyle = '#e857a8'; ctx.fillRect(3, 6, 3, 1);                             // drink umbrella
    ctx.fillStyle = '#b06ad0'; ctx.fillRect(4, 7, 1, 1);                             // umbrella stick
    ctx.fillStyle = '#7ce8e0'; ctx.fillRect(10, 6, 3, 4);                            // tall glass
    ctx.fillStyle = '#c7f4f0'; ctx.fillRect(10, 6, 1, 4);                            // glass shine
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(11, 6, 1, 1);                            // garnish
    ctx.fillStyle = '#4a3f36'; ctx.fillRect(1, 13, 14, 2);                           // base shadow
  });
  atlas['t-buoy'] = tile(ctx => {
    fill(ctx, '#2e5e8e');
    ctx.fillStyle = '#27517c'; ctx.fillRect(0, 8, 16, 8);                            // deeper water below
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(3, 10, 10, 1); ctx.fillRect(2, 12, 12, 1); // ripple rings
    ctx.fillStyle = 'rgba(255,210,120,0.2)'; ctx.fillRect(6, 0, 4, 3);               // light glow
    ctx.fillStyle = '#6e7682'; ctx.fillRect(7, 1, 2, 2);                             // lamp cage
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(7, 1, 1, 1);                             // light glint
    ctx.fillStyle = '#d05050'; ctx.fillRect(6, 3, 4, 7);                             // buoy body
    ctx.fillStyle = '#e07a6a'; ctx.fillRect(6, 3, 1, 7);                             // lit side
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(9, 3, 1, 7);                             // shadow side
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(6, 6, 4, 2);                             // white band
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(6, 7, 4, 1);                             // band shadow
    ctx.fillStyle = '#244c75'; ctx.fillRect(6, 13, 4, 1);                            // water reflection
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
  atlas['t-volcano'] = tile(ctx => {                         // crater peak — the molten channel runs edge-to-edge so adjacent 'VV'
    fill(ctx, '#4a4550');                                    // tiles merge into ONE wide crater mouth (glow added at draw time)
    ctx.fillStyle = '#2c2832'; ctx.fillRect(0, 0, 16, 1);    // rim back edge against the sky
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(0, 1, 16, 2);    // far rim (heat-scorched red)
    ctx.fillStyle = '#e0552e'; ctx.fillRect(0, 3, 16, 5);    // molten lava pool (seamless across the seam)
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(2, 4, 3, 2); ctx.fillRect(8, 5, 4, 2); ctx.fillRect(13, 3, 2, 1); // hot swells
    ctx.fillStyle = '#fff0b0'; ctx.fillRect(9, 5, 2, 1); ctx.fillRect(3, 4, 1, 1);  // white-hot cores
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(0, 8, 16, 2);    // near rim lip
    ctx.fillStyle = '#c0392b'; ctx.fillRect(0, 8, 16, 1);    // lip catching the heat
    ctx.fillStyle = '#5a5560'; ctx.fillRect(0, 10, 16, 3);   // lit cone shoulder below the rim
    ctx.fillStyle = '#3a3640'; ctx.fillRect(0, 13, 16, 3);   // cone base shade
    ctx.fillStyle = '#e0552e'; ctx.fillRect(6, 10, 1, 5);    // a lava trickle escaping down the face
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(6, 10, 1, 2);
  });
  atlas['t-palm'] = tile(ctx => {                            // coconut palm (island) — ringed trunk, radiating fronds, coconuts
    fill(ctx, '#5e8a4f'); speckle(ctx, '#6f9e5e', 13, 6);    // grass base (matches t-grass)
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(5, 13, 8, 2); // contact shadow
    ctx.fillStyle = '#8a6644'; ctx.fillRect(8, 6, 2, 8);     // trunk
    ctx.fillStyle = '#a9805a'; ctx.fillRect(8, 6, 1, 8);     // trunk lit edge
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(8, 8, 2, 1); ctx.fillRect(8, 11, 2, 1); // ring notches
    ctx.fillStyle = '#4d7440';                               // radiating fronds
    ctx.fillRect(6, 1, 6, 2);                                // top
    ctx.fillRect(3, 3, 5, 2); ctx.fillRect(1, 4, 3, 2);      // left sweep
    ctx.fillRect(10, 3, 5, 2); ctx.fillRect(12, 4, 3, 2);    // right sweep
    ctx.fillRect(7, 3, 4, 3);                                // crown core
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(6, 1, 4, 1); ctx.fillRect(3, 3, 3, 1); ctx.fillRect(10, 3, 3, 1); // lit frond tops
    ctx.fillStyle = '#7cb86a'; ctx.fillRect(7, 1, 2, 1);     // sun-tip
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(6, 5, 2, 2); ctx.fillRect(10, 5, 2, 2);  // coconut pair under the crown
    ctx.fillStyle = '#8a6644'; ctx.fillRect(6, 5, 1, 1); ctx.fillRect(10, 5, 1, 1);  // nut highlights
  });
  atlas['t-basalt'] = tile(ctx => {                          // volcanic basalt shoulder (island cone flanks — city keeps t-rock)
    fill(ctx, '#4a4550'); speckle(ctx, '#3a3640', 31, 9);
    ctx.fillStyle = '#5a5560'; ctx.fillRect(1, 2, 5, 3); ctx.fillRect(9, 7, 5, 3); ctx.fillRect(3, 11, 4, 3); // lit facets
    ctx.fillStyle = '#6a6472'; ctx.fillRect(1, 2, 5, 1); ctx.fillRect(9, 7, 5, 1);   // facet top light
    ctx.fillStyle = '#2c2832'; ctx.fillRect(6, 3, 1, 8); ctx.fillRect(11, 10, 1, 5); ctx.fillRect(2, 5, 1, 5); // deep cracks
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(6, 9, 1, 2);     // an ember down a crack
  });
  // Onsen pool — tumbled-rock rim + milky mineral water (steam added at draw
  // time). Left/right PAIR: the water runs to the shared seam so the two 'Hh'
  // tiles read as ONE pool (the old single tile looked like two glass panels).
  const onsenL = tile(ctx => {
    fill(ctx, '#6f9e5e'); speckle(ctx, '#5e8a4f', 61, 5);    // grass surround
    ctx.fillStyle = '#8fd8cc'; ctx.fillRect(4, 4, 12, 8);    // milky mineral water (to the right edge)
    ctx.fillStyle = '#a9e4d8'; ctx.fillRect(6, 5, 10, 2); ctx.fillRect(8, 9, 8, 2);  // milky swirls
    ctx.fillStyle = '#d5f2ea'; ctx.fillRect(10, 6, 4, 1); ctx.fillRect(7, 10, 3, 1); // steam-white streaks
    ctx.fillStyle = '#6e7682';                               // tumbled rock rim (irregular, not a frame)
    ctx.fillRect(2, 2, 6, 2); ctx.fillRect(8, 1, 8, 2); ctx.fillRect(1, 4, 3, 4); ctx.fillRect(2, 8, 2, 4);
    ctx.fillRect(3, 12, 6, 2); ctx.fillRect(9, 13, 7, 2);
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(2, 2, 3, 1); ctx.fillRect(9, 1, 4, 1); ctx.fillRect(1, 4, 1, 3); ctx.fillRect(4, 12, 3, 1); // lit rock tops
    ctx.fillStyle = '#5a626c'; ctx.fillRect(3, 3, 4, 1); ctx.fillRect(10, 2, 5, 1); ctx.fillRect(4, 13, 4, 1); ctx.fillRect(10, 14, 5, 1); // rock undersides
  });
  atlas['t-hotspring-l'] = onsenL; atlas['t-hotspring-r'] = mirror(onsenL);
  // Legacy alias (single-tile references still resolve).
  atlas['t-hotspring'] = tile(ctx => {
    fill(ctx, '#6f9e5e'); speckle(ctx, '#5e8a4f', 61, 5);    // grass surround
    ctx.fillStyle = '#6e7682'; ctx.fillRect(1, 2, 14, 12);   // stone rim
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(1, 2, 14, 1); ctx.fillRect(1, 2, 1, 12); // lit rim edge
    ctx.fillStyle = '#8fd8cc'; ctx.fillRect(3, 4, 10, 8);    // mineral water
    ctx.fillStyle = '#a9e4d8'; ctx.fillRect(4, 5, 4, 2); ctx.fillRect(8, 9, 3, 1); // surface glints
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
  // The crack seen from INSIDE the sea cave — daylight spills in (the way out).
  // Built as a left/right PAIR whose sky regions hug the shared seam, so the two
  // exit tiles read as ONE opening (a single-tile version doubled into two slits).
  atlas['t-cave-exit-l'] = tile(ctx => {
    fill(ctx, '#4a4550'); speckle(ctx, '#3a3640', 31, 9);    // volcanic rock, matches t-cave-crack
    ctx.fillStyle = '#5a5560'; ctx.fillRect(1, 1, 4, 4); ctx.fillRect(2, 8, 3, 4); // lit rock faces
    ctx.fillStyle = '#2c2832'; ctx.fillRect(9, 1, 1, 14);    // crack edge
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(10, 1, 6, 14);   // sky through the crack (runs to the right edge)
    ctx.fillStyle = '#cfe4f4'; ctx.fillRect(12, 2, 4, 12);   // bright core toward the middle
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(13, 4, 3, 3);    // glare
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(10, 13, 6, 2);   // sun pooling on the threshold
  });
  atlas['t-cave-exit-r'] = tile(ctx => {
    fill(ctx, '#4a4550'); speckle(ctx, '#3a3640', 31, 9);
    ctx.fillStyle = '#5a5560'; ctx.fillRect(11, 2, 4, 4); ctx.fillRect(11, 9, 3, 4); // lit rock faces
    ctx.fillStyle = '#2c2832'; ctx.fillRect(6, 1, 1, 14);    // crack edge
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(0, 1, 6, 14);    // sky (runs from the left edge)
    ctx.fillStyle = '#cfe4f4'; ctx.fillRect(0, 2, 4, 12);    // bright core toward the middle
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(0, 4, 3, 3);     // glare
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(0, 13, 6, 2);    // sun pooling on the threshold
  });
  // Beach stand
  atlas['t-parasol'] = tile(ctx => {
    fill(ctx, '#cdbb8e'); speckle(ctx, '#bda979', 23, 4);
    ctx.fillStyle = '#b8a878'; ctx.fillRect(8, 6, 6, 8);      // cast shadow on sand
    ctx.fillStyle = '#d05050'; ctx.fillRect(1, 1, 14, 4);     // canopy dome
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(3, 1, 3, 4); ctx.fillRect(9, 1, 3, 4); // white stripes
    ctx.fillStyle = '#e8746a'; ctx.fillRect(1, 1, 14, 1);     // canopy sun edge
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(1, 4, 14, 1);     // canopy under-rim
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7, 0, 2, 1);      // finial
    ctx.fillStyle = '#6e7682'; ctx.fillRect(7, 5, 2, 9);      // pole
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(7, 5, 1, 9);      // pole lit edge
  });
  atlas['t-crate'] = tile(ctx => {
    fill(ctx, '#cdbb8e');
    ctx.fillStyle = '#8a6644'; ctx.fillRect(2, 5, 12, 9);
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(2, 5, 12, 1); ctx.fillRect(2, 9, 12, 1); ctx.fillRect(7, 5, 1, 9);
    ctx.fillStyle = '#b08a50'; ctx.fillRect(4, 2, 8, 3); // hat on display
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(3, 4, 10, 1);
  });

  // ---- Sumikawa Shore — coastline detail tiles -------------------------------
  // Wet/dry sand bands, an animated tide-foam line, dune grass, coastal pines,
  // beach rocks + tide pools, driftwood and a weathered boardwalk. Authored at
  // neutral daytime (engine tints day/night). Reuses t-dock (pier), t-buoy,
  // t-parasol, t-crate, t-water-0 already defined above.
  atlas['t-sand-wet'] = tile(ctx => {                        // darker, sheened sand near the tide
    fill(ctx, '#a8916a'); speckle(ctx, '#988059', 29, 9); speckle(ctx, '#b6a47c', 17, 5);
    ctx.fillStyle = '#b8b29c'; ctx.fillRect(2, 4, 5, 1); ctx.fillRect(9, 10, 5, 1); // cool wet sheen streaks
    ctx.fillStyle = '#937c57'; ctx.fillRect(0, 15, 16, 1);   // damp seam toward the water
  });
  // Tide foam — two frames, swapped by the water-alt timer in the draw loop so the
  // wash gently laps. Walkable wet sand up top, foamy crest where it meets the sea.
  const foamTile = (yo: number) => tile(ctx => {
    fill(ctx, '#9a8568'); speckle(ctx, '#8a7860', 23, 8);    // wet sand
    ctx.fillStyle = '#b0a07e'; ctx.fillRect(0, 0, 16, 3);    // drier sand band (joins wet sand above)
    ctx.fillStyle = '#7fa0a8'; ctx.fillRect(0, 13, 16, 3);   // shallow water at the foot
    ctx.fillStyle = '#cfe0e4'; ctx.fillRect(0, 8 + yo, 16, 4); // foam shadow wash
    ctx.fillStyle = '#f4efe6';                                // bright scalloped foam crest
    ctx.fillRect(1, 7 + yo, 4, 2); ctx.fillRect(7, 8 + yo, 4, 2); ctx.fillRect(12, 7 + yo, 3, 2);
    ctx.fillRect(0, 9 + yo, 16, 2);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(3, 7 + yo, 1, 1); ctx.fillRect(9, 8 + yo, 1, 1); ctx.fillRect(14, 7 + yo, 1, 1); // bubbles
  });
  atlas['t-foam-0'] = foamTile(0);
  atlas['t-foam-1'] = foamTile(1);
  atlas['t-dune'] = tile(ctx => {                            // sandy back-of-beach dune (grass + sand blend)
    fill(ctx, '#7e9460'); speckle(ctx, '#8fa46e', 31, 8); speckle(ctx, '#cdbb8e', 19, 6); // sand showing through
    ctx.fillStyle = '#6f9e5e'; ctx.fillRect(3, 5, 1, 2); ctx.fillRect(11, 9, 1, 2); ctx.fillRect(7, 3, 1, 2); // short blades
    ctx.fillStyle = '#caa27c'; ctx.fillRect(13, 12, 2, 1);   // bare sand patch
  });
  atlas['t-dunegrass'] = tile(ctx => {                       // dune with tall marram-grass tufts (walkable detail)
    fill(ctx, '#7e9460'); speckle(ctx, '#8fa46e', 41, 6); speckle(ctx, '#cdbb8e', 23, 5);
    ctx.fillStyle = '#9fb46e'; ctx.fillRect(4, 6, 1, 7); ctx.fillRect(6, 4, 1, 9); ctx.fillRect(8, 7, 1, 6); // tall straw blades
    ctx.fillStyle = '#c4c078'; ctx.fillRect(5, 3, 1, 4); ctx.fillRect(7, 5, 1, 3);                          // sun-bleached tips
    ctx.fillStyle = '#6f9e5e'; ctx.fillRect(11, 8, 1, 5); ctx.fillRect(13, 9, 1, 4);                        // second tuft
  });
  atlas['t-pine'] = tile(ctx => {                            // windswept coastal black pine (solid)
    fill(ctx, '#7e9460'); speckle(ctx, '#8fa46e', 37, 5);    // dune ground behind the trunk
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(7, 9, 2, 6);     // trunk
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(7, 9, 1, 6);     // lit trunk edge
    ctx.fillStyle = '#2e4a2c';                                // dark needle tiers (windswept, leaning right)
    ctx.fillRect(2, 6, 11, 3); ctx.fillRect(3, 3, 10, 3); ctx.fillRect(5, 1, 8, 2);
    ctx.fillStyle = '#3e5c33'; ctx.fillRect(3, 6, 5, 2); ctx.fillRect(4, 3, 4, 2); ctx.fillRect(6, 1, 4, 1); // upper-left lit foliage
    ctx.fillStyle = '#4d7440'; ctx.fillRect(4, 4, 2, 1); ctx.fillRect(5, 6, 2, 1);                           // highlights
    ctx.fillStyle = '#1f3320'; ctx.fillRect(9, 7, 4, 1); ctx.fillRect(10, 4, 3, 1);                          // shaded right underside
  });
  atlas['t-beachrock'] = tile(ctx => {                       // sandy-grey boulder on the beach (solid)
    fill(ctx, '#cdbb8e'); speckle(ctx, '#bda979', 19, 6);    // sand base
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(3, 13, 11, 2); // contact shadow
    // rounded, irregular silhouette (a square rock reads as a crate at 16px)
    ctx.fillStyle = '#8a96a0';
    ctx.fillRect(3, 7, 11, 5);                               // mid mass
    ctx.fillRect(4, 5, 8, 2);                                // shoulder
    ctx.fillRect(5, 4, 5, 1);                                // crown
    ctx.fillRect(4, 12, 9, 1);                               // tapered base
    ctx.fillStyle = '#a6b0b8'; ctx.fillRect(5, 4, 4, 1); ctx.fillRect(4, 5, 5, 3); ctx.fillRect(3, 7, 3, 2); // sunlit upper-left
    ctx.fillStyle = '#6e7682'; ctx.fillRect(10, 8, 4, 4); ctx.fillRect(6, 11, 6, 2); // shaded lower-right
    ctx.fillStyle = '#5a626c'; ctx.fillRect(9, 6, 1, 3); ctx.fillRect(10, 9, 1, 3);  // weathered seam
    ctx.fillStyle = '#4d7440'; ctx.fillRect(4, 12, 2, 1); ctx.fillRect(12, 10, 1, 1); // bit of seaweed
  });
  atlas['t-tidepool'] = tile(ctx => {                        // rocky pool with a starfish (walkable detail)
    fill(ctx, '#a8916a'); speckle(ctx, '#988059', 53, 6);    // wet sand
    ctx.fillStyle = '#7e8890'; ctx.fillRect(2, 3, 12, 10);   // ring of rock
    ctx.fillStyle = '#5fc6c0'; ctx.fillRect(4, 5, 8, 6);     // pool water
    ctx.fillStyle = '#7ce8e0'; ctx.fillRect(4, 5, 8, 1); ctx.fillRect(4, 5, 1, 6); // lit water edge
    ctx.fillStyle = '#bdf4ee'; ctx.fillRect(5, 6, 2, 1); ctx.fillRect(9, 9, 2, 1); // glints
    ctx.fillStyle = '#e0885a'; ctx.fillRect(8, 7, 3, 1); ctx.fillRect(9, 6, 1, 3); ctx.fillRect(8, 8, 1, 1); ctx.fillRect(10, 8, 1, 1); // little starfish
  });
  atlas['t-driftwood'] = tile(ctx => {                       // bleached driftwood log on the sand (solid)
    fill(ctx, '#cdbb8e'); speckle(ctx, '#bda979', 31, 6);    // sand base
    ctx.fillStyle = '#5a4d42'; ctx.fillRect(1, 12, 14, 2);   // contact shadow
    ctx.fillStyle = '#a89a82'; ctx.fillRect(1, 5, 14, 7);    // weathered log body
    ctx.fillStyle = '#c8bca2'; ctx.fillRect(1, 5, 14, 2);    // sun-bleached top
    ctx.fillStyle = '#8a7e6a'; ctx.fillRect(1, 10, 14, 2);   // underside shadow
    ctx.fillStyle = '#6e6354'; ctx.fillRect(4, 7, 1, 1); ctx.fillRect(10, 8, 1, 1); // knot holes
    ctx.fillStyle = '#766a58'; ctx.fillRect(1, 7, 14, 1);    // grain line
  });
  atlas['t-boardwalk'] = tile(ctx => {                       // weathered promenade planks (walkable)
    fill(ctx, '#9a8668');
    ctx.fillStyle = '#a8957a'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 8, 16, 1);  // lit plank tops
    ctx.fillStyle = '#6e5e48'; ctx.fillRect(0, 7, 16, 1); ctx.fillRect(0, 15, 16, 1); // plank seams
    ctx.fillStyle = '#7e6e54'; ctx.fillRect(4, 0, 1, 16); ctx.fillRect(11, 0, 1, 16); // board joins
    ctx.fillStyle = '#5a4d3a'; ctx.fillRect(2, 3, 1, 1); ctx.fillRect(9, 11, 1, 1);   // nail heads
    speckle(ctx, '#8c7a5e', 67, 5);                                                    // grain
  });

  // ---- Matsuri festival decor (transparent props; overlay any ground) --------
  atlas['t-fest-lanterns'] = tile(ctx => {                   // chōchin bunting: string of red/white paper lanterns, tiles along a top edge
    ctx.fillStyle = '#2c3038'; ctx.fillRect(0, 0, 16, 1);    // hanging cord (full width → tiles seamlessly)
    const ramps: [string, string, string][] = [['#c0392b', '#d75a4a', '#9e3a3a'], ['#e0d8c4', '#f0ebdd', '#cdbb8e']]; // red / white
    for (let i = 0; i < 4; i++) {                            // 4 lanterns alternating r,w,r,w → clean seam tiling
      const bx = i * 4, [body, lit, shade] = ramps[i % 2];
      ctx.fillStyle = '#2c3038'; ctx.fillRect(bx + 1, 1, 1, 1);   // top cap knot on the cord
      ctx.fillStyle = body; ctx.fillRect(bx, 3, 3, 4); ctx.fillRect(bx + 1, 2, 1, 1); ctx.fillRect(bx + 1, 7, 1, 1); // rounded body
      ctx.fillStyle = lit; ctx.fillRect(bx, 3, 1, 3);            // lit left
      ctx.fillStyle = shade; ctx.fillRect(bx + 2, 4, 1, 3);      // shaded right
      ctx.fillStyle = '#16121d'; ctx.fillRect(bx, 5, 3, 1);      // paper rib ring
      ctx.fillStyle = '#16121d'; ctx.fillRect(bx + 1, 8, 1, 1);  // bottom tassel cap
    }
  });
  atlas['t-fest-yatai'] = tile(ctx => {                      // matsuri game/food stall: striped awning, counter, warm bulbs
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(1, 4, 1, 10); ctx.fillRect(14, 4, 1, 10); // posts
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(1, 4, 1, 1); ctx.fillRect(14, 4, 1, 1);   // post tops lit
    ctx.fillStyle = '#d05050'; ctx.fillRect(1, 0, 14, 4);                             // red awning
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(3, 0, 2, 4); ctx.fillRect(7, 0, 2, 4); ctx.fillRect(11, 0, 2, 4); // white stripes
    ctx.fillStyle = '#e8746a'; ctx.fillRect(1, 0, 14, 1);                             // sunlit awning crest
    ctx.fillStyle = '#c0392b'; ctx.fillRect(2, 4, 2, 1); ctx.fillRect(6, 4, 2, 1); ctx.fillRect(10, 4, 2, 1); // scalloped fringe
    ctx.fillStyle = 'rgba(255,210,120,0.25)'; ctx.fillRect(4, 5, 8, 2);               // warm bulb glow
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(5, 6, 1, 1); ctx.fillRect(8, 6, 1, 1); ctx.fillRect(11, 6, 1, 1); // hanging bulbs
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(8, 6, 1, 1);                              // brightest bulb
    ctx.fillStyle = '#a9805a'; ctx.fillRect(2, 8, 12, 6);                             // counter body
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(2, 8, 12, 1);                             // lit counter top
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(2, 13, 12, 1); ctx.fillRect(7, 9, 1, 5);  // front-face shadow + plank seam
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(4, 9, 1, 1); ctx.fillRect(11, 9, 1, 1);   // candy-apple sticks
    ctx.fillStyle = '#d05050'; ctx.fillRect(3, 10, 2, 2); ctx.fillRect(10, 10, 2, 2); // candy apples
    ctx.fillStyle = '#e8746a'; ctx.fillRect(3, 10, 1, 1); ctx.fillRect(10, 10, 1, 1); // candy shine
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(6, 10, 3, 1);                             // grilled corn / skewers
    ctx.fillStyle = '#7ce8a0'; ctx.fillRect(7, 11, 1, 1);                             // garnish
  });
  atlas['t-fest-banner'] = tile(ctx => {                     // nobori: tall festival banner on a pole, kanji 祭, cloth caught in the breeze
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(2, 0, 2, 16);                             // pole
    ctx.fillStyle = '#8a6644'; ctx.fillRect(2, 0, 1, 16);                             // pole lit edge
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(3, 0, 1, 16);                             // pole shade edge
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(2, 0, 1, 1);                              // brass finial glint
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(4, 1, 4, 1);                              // crossbar holding the cloth out
    ctx.fillStyle = '#e0d8c4'; ctx.fillRect(4, 1, 8, 13);                             // cloth body
    ctx.fillStyle = '#e0d8c4'; ctx.fillRect(12, 2, 1, 3); ctx.fillRect(12, 9, 1, 3);  // breeze bulges (wavy fly edge)
    ctx.fillStyle = '#f0ebdd'; ctx.fillRect(4, 1, 1, 13);                             // lit hoist edge
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(11, 2, 1, 11);                            // shaded fly edge (cloth curve)
    ctx.fillStyle = '#c0392b'; ctx.fillRect(4, 1, 8, 2); ctx.fillRect(12, 2, 1, 1);   // red header band
    ctx.fillStyle = '#e8746a'; ctx.fillRect(4, 1, 8, 1);                              // header lit
    ctx.fillStyle = '#2c3038';                                                        // kanji 祭 (matsuri) — bold strokes
    ctx.fillRect(6, 4, 5, 1); ctx.fillRect(8, 3, 1, 2);                               // top cross
    ctx.fillRect(6, 5, 1, 1); ctx.fillRect(10, 5, 1, 1);                              // shoulders
    ctx.fillRect(5, 7, 7, 1);                                                         // middle bar
    ctx.fillRect(8, 8, 1, 4); ctx.fillRect(6, 9, 5, 1);                               // stem + lower bar
    ctx.fillRect(6, 11, 1, 1); ctx.fillRect(10, 11, 1, 1);                            // splayed feet
  });
  atlas['t-fest-tanabata'] = tile(ctx => {                   // Tanabata bamboo hung with colorful tanzaku wish strips + a streamer
    ctx.fillStyle = '#6f9e5e'; ctx.fillRect(7, 0, 2, 16);                             // bamboo stalk
    ctx.fillStyle = '#7ce8a0'; ctx.fillRect(7, 0, 1, 16);                             // lit edge
    ctx.fillStyle = '#4d7440'; ctx.fillRect(8, 0, 1, 16);                             // shade edge
    ctx.fillStyle = '#3e5c33'; ctx.fillRect(7, 4, 2, 1); ctx.fillRect(7, 10, 2, 1);   // nodes
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(3, 1, 3, 1); ctx.fillRect(2, 2, 2, 1); ctx.fillRect(10, 2, 3, 1); ctx.fillRect(12, 3, 2, 1); // leaves
    ctx.fillStyle = '#7ce8a0'; ctx.fillRect(3, 1, 1, 1); ctx.fillRect(10, 2, 1, 1);   // leaf highlights
    const strips: [number, number, string, string][] = [[3, 6, '#e857a8', '#f48fc6'], [5, 9, '#50a0d0', '#7cc4e8'], [11, 6, '#ffd24a', '#ffe9a0'], [12, 9, '#50c878', '#7ce8a0'], [4, 12, '#d05050', '#e8746a']];
    for (const [x, y, body, lit] of strips) {                // tanzaku paper strips
      ctx.fillStyle = '#2c3038'; ctx.fillRect(x, y - 1, 1, 1); // tie thread
      ctx.fillStyle = body; ctx.fillRect(x, y, 2, 4);
      ctx.fillStyle = lit; ctx.fillRect(x, y, 1, 2);          // lit edge
    }
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(9, 12, 1, 1); ctx.fillRect(10, 13, 1, 1); ctx.fillRect(9, 14, 1, 1); ctx.fillRect(10, 15, 1, 1); // wavy gold streamer
  });
  atlas['t-fest-goldfish'] = tile(ctx => {                   // kingyo-sukui: tub of water with goldfish + a paper scoop (poi) on the rim
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(2, 4, 12, 11);                            // tub rim / front face (shadowed)
    ctx.fillStyle = '#c0392b'; ctx.fillRect(2, 4, 12, 2);                             // rim top band
    ctx.fillStyle = '#e8746a'; ctx.fillRect(2, 4, 12, 1);                             // rim lit crest
    ctx.clearRect(2, 4, 1, 1); ctx.clearRect(13, 4, 1, 1); ctx.clearRect(2, 14, 1, 1); ctx.clearRect(13, 14, 1, 1); // round the corners (oval tub)
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(3, 6, 10, 7);                             // deep water
    ctx.fillStyle = '#50a0d0'; ctx.fillRect(3, 6, 10, 5);                             // lit water surface
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(4, 6, 8, 1); ctx.fillRect(4, 8, 2, 1); ctx.fillRect(8, 10, 2, 1); // ripple highlights
    const fish: [number, number][] = [[5, 8], [9, 7], [6, 11]];
    for (const [fx, fy] of fish) {                           // goldfish
      ctx.fillStyle = '#e0702a'; ctx.fillRect(fx, fy, 3, 2);
      ctx.fillStyle = '#f0a050'; ctx.fillRect(fx, fy, 2, 1);                          // lit back
      ctx.fillStyle = '#c0392b'; ctx.fillRect(fx + 3, fy, 1, 2);                      // tail fin
      ctx.fillStyle = '#2c3038'; ctx.fillRect(fx, fy, 1, 1);                          // eye
    }
    ctx.fillStyle = '#a9805a'; ctx.fillRect(11, 1, 1, 4);                             // poi handle
    ctx.fillStyle = '#c79a6e'; ctx.fillRect(11, 1, 1, 1);                             // handle lit tip
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(12, 0, 3, 3);                             // paper scoop hoop
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(12, 2, 3, 1);                             // hoop shade
    ctx.fillStyle = '#f0ebdd'; ctx.fillRect(12, 0, 1, 1);                             // hoop highlight
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
    ctx.fillStyle = '#a9c8e4'; ctx.fillRect(0, 11, 16, 5);                           // hazier near horizon
    ctx.fillStyle = '#cbe2f2'; ctx.fillRect(0, 0, 16, 5);                            // brighter zenith
    ctx.fillStyle = '#dfeefb'; ctx.fillRect(0, 0, 16, 2);                            // top glow
    ctx.fillStyle = '#f4f8fd'; ctx.fillRect(2, 7, 6, 2); ctx.fillRect(3, 6, 4, 1); ctx.fillRect(9, 3, 5, 2); ctx.fillRect(10, 2, 3, 1); // cumulus (lit)
    ctx.fillStyle = '#d4e6f6'; ctx.fillRect(2, 9, 6, 1); ctx.fillRect(9, 5, 5, 1);   // cloud shaded base
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
    fill(ctx, '#8b8a86'); speckle(ctx, '#7d7c78', 71, 3);   // cobble
    ctx.fillStyle = '#1f3a2a'; ctx.fillRect(2, 0, 12, 16);  // dark green frame
    ctx.fillStyle = '#2e5e44'; ctx.fillRect(3, 1, 10, 14);  // door face
    ctx.fillStyle = '#3a7254'; ctx.fillRect(3, 1, 10, 1); ctx.fillRect(3, 1, 1, 14); // lit edge
    ctx.fillStyle = '#234a35'; ctx.fillRect(12, 1, 1, 14);  // shadow edge
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(4, 2, 8, 5);    // glass top
    ctx.fillStyle = '#c7e0f4'; ctx.fillRect(4, 2, 3, 1);    // glass glare
    ctx.fillStyle = '#234a35'; ctx.fillRect(7, 2, 1, 5); ctx.fillRect(4, 4, 8, 1); // glass muntins
    ctx.fillStyle = '#234a35'; ctx.fillRect(4, 9, 8, 1); ctx.fillRect(4, 12, 8, 1); // lower panel lines
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(10, 9, 1, 2);   // brass handle
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(10, 9, 1, 1);   // handle shine
  });
  atlas['t-paris-tree'] = tile(ctx => {      // pollarded plane tree in a planter
    fill(ctx, '#c4b48f');                                          // pavement
    speckle(ctx, '#b4a47f', 53, 4);
    ctx.fillStyle = '#3e5c33'; ctx.fillRect(3, 1, 10, 8);          // canopy shadow base
    ctx.fillStyle = '#4d7440'; ctx.fillRect(3, 1, 9, 7);           // canopy mid
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(4, 1, 3, 3); ctx.fillRect(8, 2, 4, 3); ctx.fillRect(5, 5, 4, 2); // lit clumps
    ctx.fillStyle = '#6f9e5e'; ctx.fillRect(4, 1, 2, 1); ctx.fillRect(9, 2, 2, 1); // sun tips
    ctx.fillStyle = '#3a2716'; ctx.fillRect(7, 8, 2, 3);           // trunk shadow
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(7, 8, 1, 3);           // trunk lit
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(3, 11, 10, 4);         // planter box
    ctx.fillStyle = '#8a6644'; ctx.fillRect(3, 11, 10, 1);         // planter rim lit
    ctx.fillStyle = '#4a3320'; ctx.fillRect(3, 14, 10, 1);         // planter base shadow
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(5, 12, 1, 2); ctx.fillRect(9, 12, 1, 2); // planter slats
  });
  atlas['t-quay'] = tile(ctx => {            // stone embankment by the Seine
    fill(ctx, '#9a9488');
    speckle(ctx, '#a8a294', 89, 6); speckle(ctx, '#86806f', 91, 5);
    ctx.fillStyle = '#857f73'; ctx.fillRect(0, 5, 16, 1); ctx.fillRect(0, 10, 16, 1); // mortar courses
    ctx.fillRect(5, 0, 1, 5); ctx.fillRect(11, 6, 1, 4); ctx.fillRect(3, 11, 1, 3);   // offset vertical joints
    ctx.fillStyle = '#aaa496'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 6, 16, 1); ctx.fillRect(0, 11, 16, 1); // course top highlights
    ctx.fillStyle = '#6f9e5e'; ctx.fillRect(0, 13, 16, 1);                            // mossy waterline
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(2, 13, 2, 1); ctx.fillRect(9, 13, 3, 1);  // moss clumps
    ctx.fillStyle = '#6e6a60'; ctx.fillRect(0, 14, 16, 2);                            // wet edge toward water
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
    // Open IRON LATTICE, not a solid silhouette (the solid fill read as a plywood
    // cutout): edge chords follow the concave profile, diagonal crosshatch braces
    // span between them with sky showing through, rungs tie the chords every few
    // rows, and the two decks + antenna sit solid on top.
    const eM = '#5a4632', eL = '#7d6547', eD = '#2f261c';
    const W = 112, H = 108, cx = W / 2;
    const [cc, cg] = canvas(W, H);
    // outer half-width of the iron at height y (0 top .. H bottom)
    const wEdge = (y: number): number => {
      if (y < 6) return 2;                                                       // antenna
      if (y < 30) { const t = (y - 6) / 24; return 3 + t * 8; }                  // upper column 3→11
      if (y < 68) { const t = (y - 30) / 38; return 11 + 19 * Math.pow(t, 1.7); } // concave legs 11→30
      const t = (y - 68) / (H - 68); return 30 + 22 * t;                          // lower legs 30→52
    };
    for (let y = 6; y < H; y++) {
      const w = wEdge(y);
      const x0 = Math.round(cx - w), x1 = Math.round(cx + w);
      // edge chords: sunlit on the left, shaded on the right (upper-left light)
      cg.fillStyle = eL; cg.fillRect(x0, y, 2, 1);
      cg.fillStyle = eM; cg.fillRect(x1 - 2, y, 2, 1);
      cg.fillStyle = eD; cg.fillRect(x1 - 1, y, 1, 1);
      // rung tying the chords every 8 rows
      if (y % 8 === 0) { cg.fillStyle = eM; cg.fillRect(x0, y, x1 - x0, 1); }
      // diagonal crosshatch braces — sky stays visible between them
      cg.fillStyle = eM;
      for (let x = x0 + 2; x < x1 - 2; x++) {
        if ((x + y) % 7 === 0 || (x - y + 700) % 7 === 0) cg.fillRect(x, y, 1, 1);
      }
    }
    // carve the openings clean: the gap between the legs + the grand arch
    cg.globalCompositeOperation = 'destination-out';
    cg.beginPath(); cg.moveTo(cx, 40); cg.lineTo(cx - 19, 65); cg.lineTo(cx + 19, 65); cg.closePath(); cg.fill();
    cg.beginPath();
    cg.moveTo(cx - 29, H); cg.lineTo(cx - 29, 88);
    cg.quadraticCurveTo(cx, 70, cx + 29, 88);
    cg.lineTo(cx + 29, H); cg.closePath(); cg.fill();
    cg.globalCompositeOperation = 'source-over';
    // inner-leg chords hugging the carved arch so the legs read as closed box trusses
    for (let y = 74; y < H; y++) {
      const t = (y - 70) / (H - 70 - 2);
      const ax = Math.round(29 * Math.sqrt(Math.max(0, 1 - Math.pow(1 - t, 2))));  // approximates the arch curve
      cg.fillStyle = eM; cg.fillRect(cx - ax - 1, y, 2, 1); cg.fillRect(cx + ax - 1, y, 2, 1);
    }
    // the two observation decks (solid, over the lattice)
    cg.fillStyle = eM; cg.fillRect(cx - 16, 30, 32, 4); cg.fillRect(cx - 34, 67, 68, 5);
    cg.fillStyle = eD; cg.fillRect(cx - 16, 33, 32, 1); cg.fillRect(cx - 34, 71, 68, 1);
    cg.fillStyle = eL; cg.fillRect(cx - 16, 30, 32, 1); cg.fillRect(cx - 34, 67, 68, 1);
    // warm deck lamps (tiny, cozy)
    cg.fillStyle = '#ffd24a';
    for (let i = -30; i <= 30; i += 12) cg.fillRect(cx + i, 69, 1, 1);
    // upper column cap + antenna + a red aircraft beacon
    cg.fillStyle = eM; cg.fillRect(cx - 2, 4, 4, 4); cg.fillRect(cx - 1, 0, 2, 8);
    cg.fillStyle = eL; cg.fillRect(cx - 2, 4, 1, 4);
    cg.fillStyle = '#e0564e'; cg.fillRect(cx - 1, 0, 2, 2);
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
  // Floor: soft gravel-earth (the old flagstone joints read as brick WALL at scale).
  atlas['t-gh-floor'] = tile(ctx => {
    fill(ctx, '#d8cdb0');
    speckle(ctx, '#c9bd9e', 61, 9); speckle(ctx, '#bfb18e', 67, 7); speckle(ctx, '#e2d9c0', 71, 5);
    ctx.fillStyle = '#b3a98e'; ctx.fillRect(3, 4, 2, 1); ctx.fillRect(11, 9, 2, 1); ctx.fillRect(6, 13, 2, 1); // pebbles
    ctx.fillStyle = '#7cb86a'; ctx.fillRect(2, 13, 1, 1); ctx.fillRect(13, 3, 1, 1);  // stray sprouts
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
  // Stepping-stone path through the gravel (walkable — guides door → beds → counter).
  atlas['t-gh-path'] = tile(ctx => {
    fill(ctx, '#d8cdb0');
    speckle(ctx, '#bfb18e', 61, 7);
    ctx.fillStyle = '#b3a98e'; ctx.fillRect(2, 2, 12, 5); ctx.fillRect(3, 9, 10, 5);  // two flat stones
    ctx.fillStyle = '#c6bda2'; ctx.fillRect(2, 2, 12, 1); ctx.fillRect(3, 9, 10, 1);  // lit tops
    ctx.fillStyle = '#9a917a'; ctx.fillRect(2, 6, 12, 1); ctx.fillRect(3, 13, 10, 1); // stone undersides
    ctx.fillStyle = '#7cb86a'; ctx.fillRect(1, 7, 1, 1); ctx.fillRect(14, 8, 1, 1);   // sprouts at the edges
  });
  // Riot-of-blooms flower bed (decor, solid): pink/gold/white blossoms in a planter.
  atlas['t-gh-flowers'] = tile(ctx => {
    fill(ctx, '#d8cdb0');
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(1, 3, 14, 12);   // planter box
    ctx.fillStyle = '#a5703a'; ctx.fillRect(1, 3, 14, 1);    // rim highlight
    ctx.fillStyle = '#4d7a2e'; ctx.fillRect(2, 4, 12, 10);   // foliage
    ctx.fillStyle = '#6e9e3a'; ctx.fillRect(3, 5, 4, 3); ctx.fillRect(9, 8, 4, 3);    // lit leaf clumps
    ctx.fillStyle = '#e857a8'; ctx.fillRect(4, 5, 2, 2) ; ctx.fillRect(11, 9, 2, 2);  // pink blooms
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(8, 6, 2, 2); ctx.fillRect(3, 10, 2, 2);   // gold blooms
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(12, 5, 2, 2); ctx.fillRect(6, 11, 2, 2);  // white blooms
  });
  // Hanging fern basket (decor, solid): trailing fronds on a chain from the roof.
  atlas['t-gh-vine'] = tile(ctx => {
    fill(ctx, '#a6d4c0');                                                             // glass back-wall base (hangs on the wall row)
    ctx.fillStyle = '#cdeede'; ctx.fillRect(0, 9, 2, 5); ctx.fillRect(14, 2, 2, 5);   // pane hints at the edges
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
  // top edge) so stacked rows read as one tall glasshouse; aluminium frame and
  // clean glazing — soft upper-left glare + faint reflection, no plants in the panes.
  atlas['t-gh-front'] = tile(ctx => {
    fill(ctx, '#bfe3d0');                                                            // glass (mid)
    ctx.fillStyle = '#d4efe2'; ctx.fillRect(1, 1, 6, 14); ctx.fillRect(9, 1, 6, 14); // two panes (lit)
    ctx.fillStyle = '#a6cdbe'; ctx.fillRect(1, 10, 6, 4); ctx.fillRect(9, 10, 6, 4); // lower pane shade (3-step ramp)
    ctx.fillStyle = '#eaf6ef'; ctx.fillRect(1, 1, 2, 5); ctx.fillRect(9, 1, 2, 5);   // soft top-corner glare
    ctx.fillStyle = '#f4faf6'; ctx.fillRect(1, 1, 1, 2); ctx.fillRect(9, 1, 1, 2);   // glare hotspot
    ctx.fillStyle = '#cdeede'; ctx.fillRect(4, 3, 1, 6); ctx.fillRect(12, 3, 1, 6);  // faint diagonal reflection streak
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
    fill(ctx, '#a6d4c0');                                                             // glass back-wall base (hangs on the wall row)
    ctx.fillStyle = '#cdeede'; ctx.fillRect(0, 2, 2, 5); ctx.fillRect(14, 9, 2, 5);   // pane hints at the edges
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
  atlas['i-dish-ramen'] = tile(ctx => {
    // shoyu ramen: cream bowl, amber broth, nori, egg half, chashu, scallion, steam.
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(6, 0, 1, 3); ctx.fillRect(10, 1, 1, 2);   // steam
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(8, 1, 1, 2);
    ctx.fillStyle = '#2c3038'; ctx.fillRect(3, 2, 2, 5);                              // nori sheet (standing)
    ctx.fillStyle = '#3a4250'; ctx.fillRect(3, 2, 1, 1);                              // nori sheen
    ctx.fillStyle = '#9e6a4a'; ctx.fillRect(3, 6, 10, 2);                             // amber broth surface
    ctx.fillStyle = '#b07a54'; ctx.fillRect(3, 6, 10, 1);                             // broth lit
    ctx.fillStyle = '#a9805a'; ctx.fillRect(5, 5, 3, 2);                              // chashu slice
    ctx.fillStyle = '#caa27c'; ctx.fillRect(5, 5, 1, 1);
    ctx.fillStyle = '#8a6644'; ctx.fillRect(6, 6, 1, 1);                              // chashu marbling
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(9, 5, 3, 2);                              // egg half (ajitama)
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(10, 5, 1, 1);                             // yolk
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(8, 5, 1, 1); ctx.fillRect(4, 7, 1, 1);    // scallion
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(6, 7, 1, 1); ctx.fillRect(8, 7, 1, 1);    // noodles peeking
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 8, 12, 5); ctx.fillRect(3, 13, 10, 1); // bowl
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(2, 8, 12, 1);                             // bowl lit rim
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(2, 11, 12, 2);                            // bowl shadow
    ctx.fillStyle = '#c0392b'; ctx.fillRect(2, 9, 12, 1);                             // red rim band
  });
  atlas['i-dish-curry'] = tile(ctx => {
    // katsu curry: plate, white rice (left), brown curry + sliced golden cutlet (right).
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(1, 13, 14, 1);                            // plate rim shadow
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(1, 5, 14, 8); ctx.fillRect(2, 4, 12, 1);  // plate
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(2, 5, 12, 1);                             // plate lit
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(1, 12, 14, 1);
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(2, 6, 5, 6); ctx.fillRect(3, 5, 3, 1);    // rice mound (left)
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 10, 5, 2);                             // rice shade
    ctx.fillStyle = '#7a4a28'; ctx.fillRect(7, 6, 6, 6); ctx.fillRect(7, 5, 5, 1);    // curry pool (right)
    ctx.fillStyle = '#9e6a4a'; ctx.fillRect(7, 6, 6, 1);                              // curry lit
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(7, 11, 6, 1);                             // curry shadow
    ctx.fillStyle = '#e0843a'; ctx.fillRect(12, 10, 1, 1);                            // carrot chunk
    ctx.fillStyle = '#c98a3a'; ctx.fillRect(7, 6, 5, 4);                              // katsu crumb coat
    ctx.fillStyle = '#e8b85c'; ctx.fillRect(7, 6, 5, 1);                              // crumb lit
    ctx.fillStyle = '#d9a24a'; ctx.fillRect(7, 7, 5, 1);
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(8, 6, 1, 4); ctx.fillRect(10, 6, 1, 4);   // cut lines (slices)
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(7, 9, 1, 1);                              // pork core peek
  });
  atlas['i-dish-tempura'] = tile(ctx => {
    // golden tempura (shrimp + veg) with a little dipping dish of tentsuyu.
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(1, 12, 10, 1);                            // plate rim shadow
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(1, 10, 10, 2); ctx.fillRect(2, 9, 8, 1);  // plate
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(1, 10, 5, 1);                             // plate lit
    ctx.fillStyle = '#d05050'; ctx.fillRect(5, 2, 2, 2);                              // shrimp tail
    ctx.fillStyle = '#e87a6a'; ctx.fillRect(5, 2, 1, 1);
    ctx.fillStyle = '#d9a24a'; ctx.fillRect(2, 4, 4, 6);                              // shrimp batter
    ctx.fillStyle = '#e8b85c'; ctx.fillRect(2, 4, 4, 1); ctx.fillRect(2, 4, 1, 4);    // batter lit
    ctx.fillStyle = '#c98a3a'; ctx.fillRect(2, 8, 4, 2); ctx.fillRect(5, 6, 1, 3);    // batter shade
    ctx.fillStyle = '#d9a24a'; ctx.fillRect(6, 5, 4, 5);                              // veg tempura piece
    ctx.fillStyle = '#e8b85c'; ctx.fillRect(6, 5, 4, 1);
    ctx.fillStyle = '#c98a3a'; ctx.fillRect(6, 9, 4, 1);
    ctx.fillStyle = '#6f9e5e'; ctx.fillRect(7, 5, 1, 1);                              // veg green peek
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(11, 10, 5, 3); ctx.fillRect(12, 13, 3, 1);// dipping dish
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(11, 10, 5, 1);                            // dish lit rim
    ctx.fillStyle = '#7a4a28'; ctx.fillRect(12, 11, 3, 1);                            // tentsuyu sauce
  });
  atlas['i-dish-okonomiyaki'] = tile(ctx => {
    // okonomiyaki: round savory pancake, sauce drizzle, mayo zigzag, bonito + aonori.
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(2, 12, 12, 1);                            // plate rim shadow
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 11, 12, 1);                            // plate
    ctx.fillStyle = '#a9805a';                                                        // round pancake
    ctx.fillRect(5, 3, 6, 1); ctx.fillRect(3, 4, 10, 1); ctx.fillRect(3, 5, 10, 1);
    ctx.fillRect(2, 6, 12, 1); ctx.fillRect(2, 7, 12, 1); ctx.fillRect(2, 8, 12, 1);
    ctx.fillRect(3, 9, 10, 1); ctx.fillRect(4, 10, 8, 1);
    ctx.fillStyle = '#caa27c'; ctx.fillRect(5, 3, 5, 1); ctx.fillRect(3, 4, 3, 1);    // pancake lit
    ctx.fillStyle = '#8a6644'; ctx.fillRect(4, 9, 8, 1); ctx.fillRect(4, 10, 8, 1);   // pancake shade
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(4, 5, 7, 1); ctx.fillRect(5, 7, 6, 1); ctx.fillRect(6, 9, 4, 1); // sauce
    ctx.fillStyle = '#f4efe2';                                                        // mayo zigzag
    ctx.fillRect(4, 6, 1, 1); ctx.fillRect(6, 5, 1, 1); ctx.fillRect(8, 6, 1, 1); ctx.fillRect(10, 6, 1, 1); ctx.fillRect(7, 8, 1, 1);
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(6, 4, 2, 1); ctx.fillRect(9, 7, 2, 1);    // bonito flakes
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(5, 8, 1, 1); ctx.fillRect(10, 5, 1, 1);   // aonori flecks
  });
  atlas['i-dish-mochi'] = tile(ctx => {
    // pastel mochi on a small plate — soft pink, white, green rounds.
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(2, 12, 12, 1);                            // plate rim shadow
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 10, 12, 2); ctx.fillRect(1, 11, 14, 1);// plate
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(2, 10, 6, 1);                             // plate lit
    ctx.fillStyle = '#f6b4dc'; ctx.fillRect(2, 6, 2, 1); ctx.fillRect(1, 7, 4, 3); ctx.fillRect(2, 10, 2, 1); // pink mochi
    ctx.fillStyle = '#a86b8a'; ctx.fillRect(2, 9, 3, 1);                              // pink shade
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(7, 6, 2, 1); ctx.fillRect(6, 7, 4, 3); ctx.fillRect(7, 10, 2, 1); // white mochi
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(7, 9, 3, 1);                              // white shade
    ctx.fillStyle = '#7ce8a0'; ctx.fillRect(12, 6, 2, 1); ctx.fillRect(11, 7, 4, 3); ctx.fillRect(12, 10, 2, 1); // green mochi
    ctx.fillStyle = '#6f9e5e'; ctx.fillRect(12, 9, 3, 1);                             // green shade
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(11, 7, 1, 1); ctx.fillRect(6, 7, 1, 1); ctx.fillRect(1, 7, 1, 1); // round highlights
  });
  atlas['i-dish-bento'] = tile(ctx => {
    // bento box (capstone): rice + umeboshi | tamago, salmon, greens compartments.
    ctx.fillStyle = '#3a4250'; ctx.fillRect(1, 3, 14, 11);                            // lacquer box body
    ctx.fillStyle = '#4a525c'; ctx.fillRect(1, 3, 14, 1);                             // box lit rim
    ctx.fillStyle = '#2c3038'; ctx.fillRect(1, 12, 14, 2);                            // box shadow base
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 4, 5, 8);                              // left: rice bed
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(2, 4, 5, 1); ctx.fillRect(2, 4, 1, 7);    // rice lit
    ctx.fillStyle = '#d05050'; ctx.fillRect(3, 7, 2, 2);                              // umeboshi
    ctx.fillStyle = '#e87a6a'; ctx.fillRect(3, 7, 1, 1);
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(5, 5, 1, 1); ctx.fillRect(4, 10, 1, 1);   // sesame
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(8, 4, 6, 2);                              // tamago egg
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(8, 4, 6, 1);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(10, 4, 1, 2); ctx.fillRect(12, 4, 1, 2);  // tamago roll lines
    ctx.fillStyle = '#e07840'; ctx.fillRect(8, 7, 6, 2);                              // salmon
    ctx.fillStyle = '#f0a060'; ctx.fillRect(8, 7, 6, 1);
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(9, 8, 1, 1); ctx.fillRect(12, 8, 1, 1);   // salmon marbling
    ctx.fillStyle = '#5e8a4f'; ctx.fillRect(8, 10, 6, 2);                             // greens
    ctx.fillStyle = '#6f9e5e'; ctx.fillRect(8, 10, 6, 1);
    ctx.fillStyle = '#d05050'; ctx.fillRect(11, 10, 2, 1);                            // cherry tomato
    ctx.fillStyle = '#e87a6a'; ctx.fillRect(11, 10, 1, 1);
    ctx.fillStyle = '#2c3038'; ctx.fillRect(7, 4, 1, 8); ctx.fillRect(8, 6, 6, 1); ctx.fillRect(8, 9, 6, 1); // dividers
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

  // ===== C2. Keepsake item icons (16x16, transparent) =====================
  atlas['i-plums'] = tile(ctx => {
    // glass jar of sun-pickled plums: cloth-tied lid, reddish-purple plums in brine.
    ctx.fillStyle = '#7fb0dc'; ctx.fillRect(4, 4, 9, 10); ctx.fillRect(5, 14, 7, 1);  // glass jar
    ctx.fillStyle = '#a8cdee'; ctx.fillRect(4, 4, 1, 10);                             // lit left edge
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(12, 5, 1, 9); ctx.fillRect(5, 14, 7, 1);  // shadow side + base
    const plum = (x: number, y: number) => {                                          // one reddish-purple plum
      ctx.fillStyle = '#964a6e'; ctx.fillRect(x, y, 4, 4); ctx.fillRect(x + 1, y - 1, 2, 1); ctx.fillRect(x + 1, y + 4, 2, 1);
      ctx.fillStyle = '#b86a92'; ctx.fillRect(x, y, 2, 1); ctx.fillRect(x, y, 1, 2);   // lit
      ctx.fillStyle = '#6e3450'; ctx.fillRect(x + 3, y + 2, 1, 2); ctx.fillRect(x + 1, y + 3, 2, 1); // shade + cleft
    };
    plum(5, 6); plum(8, 8); plum(5, 10);                                              // three nestled
    ctx.fillStyle = '#cfe6fb'; ctx.fillRect(5, 5, 1, 4);                              // glass highlight streak
    ctx.fillStyle = '#e8f4ff'; ctx.fillRect(5, 5, 1, 1);
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(4, 1, 9, 3);                              // cloth cap
    ctx.fillStyle = '#ddcc9c'; ctx.fillRect(4, 1, 9, 1);                             // lid lit
    ctx.fillStyle = '#b8a578'; ctx.fillRect(4, 3, 9, 1);                             // lid shade
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(4, 2, 9, 1);                             // string tie
    ctx.fillStyle = '#c0392b'; ctx.fillRect(7, 2, 2, 1);                             // tie knot
  });
  atlas['i-demodisc'] = tile(ctx => {
    // burned demo CD: silvery disc, faint rainbow sheen, sharpie-scrawled name.
    const rows: number[][] = [[6, 9], [5, 10], [4, 11], [4, 11], [3, 12], [3, 12], [3, 12], [3, 12], [4, 11], [4, 11], [5, 10], [6, 9]];
    ctx.fillStyle = '#d8e0e6';                                                        // base disc
    rows.forEach((r, i) => ctx.fillRect(r[0], 2 + i, r[1] - r[0] + 1, 1));
    ctx.fillStyle = '#aeb6c0';                                                        // lower-right shading
    for (let i = 6; i < rows.length; i++) ctx.fillRect(rows[i][0], 2 + i, rows[i][1] - rows[i][0] + 1, 1);
    ctx.fillStyle = '#eef4f8'; ctx.fillRect(5, 3, 4, 1); ctx.fillRect(4, 4, 3, 1); ctx.fillRect(4, 5, 2, 1); // lit crescent
    ctx.fillStyle = '#e857a8'; ctx.fillRect(6, 4, 2, 1);                             // rainbow sheen
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(8, 5, 2, 1);
    ctx.fillStyle = '#7ce8a0'; ctx.fillRect(5, 6, 2, 1);
    ctx.fillStyle = '#7ce8e0'; ctx.fillRect(10, 7, 1, 1);
    ctx.fillStyle = '#2c3038'; ctx.fillRect(5, 9, 2, 1); ctx.fillRect(9, 9, 2, 1); ctx.fillRect(7, 10, 3, 1); ctx.fillRect(6, 11, 4, 1); // sharpie scrawl
    ctx.fillStyle = '#aeb6c0'; ctx.fillRect(7, 7, 3, 3);                             // center hub
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(7, 7, 3, 1);
    ctx.clearRect(8, 8, 1, 1);                                                        // spindle hole
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(6, 1, 4, 1); ctx.fillRect(6, 14, 4, 1); ctx.fillRect(2, 6, 1, 4); ctx.fillRect(13, 6, 1, 4); // rim
  });
  atlas['i-ring'] = tile(ctx => {
    // ornate dark-silver ring with a small red gem (a vampire's heirloom).
    ctx.fillStyle = '#6e7682'; ctx.fillRect(5, 8, 7, 6); ctx.fillRect(4, 9, 9, 4); ctx.fillRect(6, 7, 5, 1); ctx.fillRect(6, 14, 5, 1); // band
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(5, 8, 6, 1); ctx.fillRect(4, 9, 1, 3);   // lit upper-left
    ctx.fillStyle = '#3a4250'; ctx.fillRect(11, 9, 1, 4); ctx.fillRect(6, 13, 5, 1); // shadow lower-right
    ctx.clearRect(6, 10, 5, 3); ctx.clearRect(7, 9, 3, 1); ctx.clearRect(7, 13, 3, 1); // inner hole
    ctx.fillStyle = '#c9a227'; ctx.fillRect(5, 8, 1, 1); ctx.fillRect(11, 8, 1, 1);  // gold shoulder ornaments
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(6, 7, 1, 1);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(6, 4, 5, 3);                             // gold gem setting
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(7, 3, 3, 3);                             // gem base
    ctx.fillStyle = '#d05050'; ctx.fillRect(7, 3, 2, 2);
    ctx.fillStyle = '#e87a6a'; ctx.fillRect(7, 3, 1, 1);                             // gem glint
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(6, 4, 1, 1); ctx.fillRect(10, 4, 1, 1);  // setting glints
  });
  atlas['i-omamori'] = tile(ctx => {
    // Japanese omamori charm: brocade pouch, cord loop + knot, a gold kanji.
    ctx.fillStyle = '#ddcc9c'; ctx.fillRect(7, 1, 3, 1); ctx.fillRect(7, 1, 1, 3); ctx.fillRect(9, 1, 1, 3); // cord loop
    ctx.fillStyle = '#b8a578'; ctx.fillRect(9, 2, 1, 2);
    ctx.fillStyle = '#c0392b'; ctx.fillRect(4, 5, 9, 9); ctx.fillRect(5, 14, 7, 1);  // pouch body
    ctx.fillStyle = '#d8584a'; ctx.fillRect(4, 5, 9, 1); ctx.fillRect(4, 5, 1, 8);   // lit top/left
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(12, 6, 1, 8); ctx.fillRect(5, 13, 7, 1); // shadow
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(4, 4, 9, 1); ctx.fillRect(5, 5, 7, 1); ctx.fillRect(4, 12, 9, 1); // gold trim (neck + hem)
    ctx.fillStyle = '#c9a227'; ctx.fillRect(5, 6, 7, 1); ctx.fillRect(4, 13, 9, 1);
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(7, 3, 3, 2);                             // cord knot
    ctx.fillStyle = '#ddcc9c'; ctx.fillRect(7, 3, 1, 1);
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(6, 8, 5, 1); ctx.fillRect(8, 7, 1, 5); ctx.fillRect(7, 10, 3, 1); // gold kanji
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(9, 11, 1, 1);
  });
  atlas['i-badge'] = tile(ctx => {
    // hand-laminated "PATRON" pin badge, slightly crooked, a safety-pin glint.
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(3, 4, 10, 5); ctx.fillRect(4, 9, 10, 5);  // laminate card (leans 1px right)
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(3, 4, 10, 1); ctx.fillRect(3, 4, 1, 5); ctx.fillRect(4, 9, 1, 4); // lit
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(12, 5, 1, 4); ctx.fillRect(13, 9, 1, 5); ctx.fillRect(4, 13, 9, 1); // shade
    ctx.fillStyle = '#c0392b'; ctx.fillRect(4, 5, 8, 3);                             // red "PATRON" banner
    ctx.fillStyle = '#d8584a'; ctx.fillRect(4, 5, 8, 1);
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(4, 7, 8, 1);
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(5, 6, 6, 1);                             // banner lettering
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(6, 10, 7, 1); ctx.fillRect(6, 12, 5, 1); // sub-text lines
    ctx.fillStyle = '#ffffff'; ctx.fillRect(10, 4, 1, 4);                            // laminate gloss streak
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(2, 3, 11, 1); ctx.fillRect(2, 3, 1, 2);  // safety pin, crooked
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(4, 3, 4, 1);                             // pin glint
    ctx.fillStyle = '#6e7682'; ctx.fillRect(12, 2, 2, 2);                            // clasp head
  });
  atlas['i-hatband'] = tile(ctx => {
    // tooled leather hatband with a silver concho.
    ctx.fillStyle = '#8a6644'; ctx.fillRect(1, 6, 14, 4); ctx.fillRect(0, 7, 1, 2); ctx.fillRect(15, 7, 1, 2); // leather strip
    ctx.fillStyle = '#9a7350'; ctx.fillRect(1, 6, 14, 1);                            // lit top edge
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(1, 9, 14, 1); ctx.fillRect(0, 9, 16, 1); // shadow bottom edge
    ctx.fillStyle = '#6e4a2f'; for (let x = 2; x < 15; x += 3) { ctx.fillRect(x, 7, 1, 1); ctx.fillRect(x + 1, 8, 1, 1); } // tooled stamps
    ctx.fillStyle = '#a07a52'; for (let x = 3; x < 15; x += 3) ctx.fillRect(x, 7, 1, 1); // stamp highlights
    ctx.fillStyle = '#6e7682'; ctx.fillRect(6, 5, 5, 6); ctx.fillRect(7, 4, 3, 1); ctx.fillRect(7, 11, 3, 1); // silver concho
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(6, 5, 4, 1); ctx.fillRect(6, 5, 1, 4);   // lit
    ctx.fillStyle = '#3a4250'; ctx.fillRect(10, 6, 1, 5); ctx.fillRect(7, 10, 3, 1); // shade
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(7, 5, 1, 1);                             // glint
    ctx.fillStyle = '#3a4250'; ctx.fillRect(8, 7, 1, 2);                             // concho center dot
  });

  // ===== D. Wallpaper tiles (16x16, fill, seamless all directions) ========
  atlas['t-wall-cream'] = tile(ctx => {
    // warm cream plaster, pinstripe (period 4) + a damask sprig on the 8px grid
    // (both seamless). 16%4 and 16%8 == 0, so the wall tiles cleanly.
    fill(ctx, '#e8e0d0');
    ctx.fillStyle = '#dcd2bb'; for (let x = 3; x < 16; x += 4) ctx.fillRect(x, 0, 1, 16); // shadow pinstripe
    ctx.fillStyle = '#f0e9d8'; for (let x = 1; x < 16; x += 4) ctx.fillRect(x, 0, 1, 16); // lit pinstripe
    ctx.fillStyle = '#dccfb0';                                                            // damask sprig (8px grid)
    for (const [cx, cy] of [[2, 3], [10, 11]]) { ctx.fillRect(cx, cy - 1, 1, 1); ctx.fillRect(cx - 1, cy, 3, 1); ctx.fillRect(cx, cy + 1, 1, 1); }
    ctx.fillStyle = '#f2ecdc'; ctx.fillRect(2, 3, 1, 1); ctx.fillRect(10, 11, 1, 1);      // sprig highlight
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
    // soft sage with a diamond trellis + leaf accents on an 8px grid (seamless).
    fill(ctx, '#aed8c6');
    ctx.fillStyle = '#9cc8b4'; ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#a6d2c0'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 0, 1, 16);   // subtle lit
    ctx.fillStyle = '#88b8a4';                                                         // diamonds @ (4,4),(12,12)
    for (const [cx, cy] of [[4, 4], [12, 12]]) { ctx.fillRect(cx, cy - 1, 1, 1); ctx.fillRect(cx - 1, cy, 3, 1); ctx.fillRect(cx, cy + 1, 1, 1); }
    ctx.fillStyle = '#7aa896'; ctx.fillRect(12, 4, 1, 2); ctx.fillRect(4, 12, 1, 2);   // leaf accents (offset)
    ctx.fillStyle = '#b8e0ce'; ctx.fillRect(12, 3, 1, 1); ctx.fillRect(4, 11, 1, 1);   // dot highlights
    speckle(ctx, '#a2cebb', 53, 4);
  });
  atlas['t-wall-sakura'] = tile(ctx => {
    // pale pink with full 5-petal cherry blossoms on the 8px grid (seamless).
    fill(ctx, '#f0cfe0');
    ctx.fillStyle = '#f6dcea'; ctx.fillRect(0, 0, 16, 1); ctx.fillRect(0, 0, 1, 16);
    ctx.fillStyle = '#e6c0d6'; ctx.fillRect(0, 8, 16, 1);                              // faint tonal band
    speckle(ctx, '#e8c2d8', 59, 5);
    const bloom = (x: number, y: number) => {                                          // 5 petals + lit center
      ctx.fillStyle = '#e857a8';
      ctx.fillRect(x, y - 1, 1, 1); ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); ctx.fillRect(x, y + 1, 1, 1); ctx.fillRect(x - 1, y - 1, 1, 1);
      ctx.fillStyle = '#f6b4dc'; ctx.fillRect(x, y, 1, 1);
      ctx.fillStyle = '#ffe9a0'; ctx.fillRect(x + 1, y - 1, 1, 1);                      // stamen fleck
    };
    bloom(4, 4); bloom(12, 12);
    ctx.fillStyle = '#d98ab0'; ctx.fillRect(9, 3, 2, 1); ctx.fillRect(10, 4, 1, 1);    // bud + twig hint
    ctx.fillStyle = '#e857a8'; ctx.fillRect(0, 12, 1, 1); ctx.fillRect(15, 6, 1, 1);   // stray petals (seamless pair)
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
  atlas['f-onsen'] = tile(ctx => {
    // private hinoki hot-tub seen 3/4 from above: round wooden tub, steaming
    // mineral water, a folded towel on the rim. Transparent bg (composites in-room).
    // wooden tub silhouette (dark base)
    ctx.fillStyle = '#5a3c24';
    ctx.fillRect(4, 3, 8, 1); ctx.fillRect(3, 4, 10, 1); ctx.fillRect(2, 5, 12, 1);
    ctx.fillRect(1, 6, 14, 6); ctx.fillRect(2, 12, 12, 2); ctx.fillRect(4, 14, 8, 1);
    // staved wood front face
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(2, 11, 11, 3);
    ctx.fillStyle = '#8a6644'; ctx.fillRect(2, 11, 11, 1);                              // lit stave tops
    ctx.fillStyle = '#4a3320'; ctx.fillRect(5, 11, 1, 3); ctx.fillRect(8, 11, 1, 3); ctx.fillRect(11, 11, 1, 3); // seams
    ctx.fillStyle = '#8a6644'; ctx.fillRect(1, 6, 1, 5);                                // lit left rim
    ctx.fillStyle = '#4a3320'; ctx.fillRect(13, 6, 1, 6);                               // shadow right rim
    ctx.fillStyle = '#a3825a'; ctx.fillRect(4, 3, 3, 1); ctx.fillRect(3, 4, 2, 1); ctx.fillRect(2, 5, 2, 1); // lit top-left rim
    // mineral water surface (ellipse)
    ctx.fillStyle = '#7ce8e0';
    ctx.fillRect(5, 4, 6, 1); ctx.fillRect(4, 5, 8, 1); ctx.fillRect(3, 6, 10, 1);
    ctx.fillRect(3, 7, 10, 1); ctx.fillRect(3, 8, 10, 1); ctx.fillRect(4, 9, 8, 1); ctx.fillRect(5, 10, 6, 1);
    ctx.fillStyle = '#aef4ee'; ctx.fillRect(5, 4, 6, 1); ctx.fillRect(4, 5, 5, 1); ctx.fillRect(3, 6, 3, 1); ctx.fillRect(8, 7, 2, 1); // lit glints
    ctx.fillStyle = '#4aa8a4'; ctx.fillRect(4, 9, 8, 1); ctx.fillRect(5, 10, 6, 1); ctx.fillRect(10, 8, 2, 1); // water shadow
    // folded towel resting on the front rim
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(9, 11, 4, 2);
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(9, 11, 4, 1);
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(9, 12, 4, 1);
    // rising steam
    ctx.fillStyle = 'rgba(174,244,238,0.12)'; ctx.fillRect(3, 0, 9, 5);                 // warm bloom
    ctx.fillStyle = 'rgba(232,240,244,0.5)';
    ctx.fillRect(5, 2, 1, 1); ctx.fillRect(5, 1, 1, 1); ctx.fillRect(6, 0, 1, 1);       // left wisp
    ctx.fillRect(9, 2, 1, 1); ctx.fillRect(10, 1, 1, 1); ctx.fillRect(9, 0, 1, 1);      // right wisp
    ctx.fillRect(7, 1, 1, 1);
  });

  // Japanese-inspired furniture set + bathroom fixtures
  atlas['f-shoji'] = tile(ctx => {
    // shoji sliding screen: wood lattice frame, glowing translucent paper panes.
    ctx.fillStyle = 'rgba(255,233,160,0.10)'; ctx.fillRect(1, 0, 14, 15);              // soft paper glow
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(1, 1, 14, 14);                             // outer frame
    ctx.fillStyle = '#8a6644'; ctx.fillRect(1, 1, 14, 1); ctx.fillRect(1, 1, 1, 14);   // lit top+left
    ctx.fillStyle = '#4a3320'; ctx.fillRect(14, 1, 1, 14); ctx.fillRect(1, 14, 14, 1); // shadow right+bottom
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 2, 12, 10);                             // paper field
    ctx.fillStyle = '#f2ecdf'; ctx.fillRect(2, 2, 12, 4);                              // lit upper paper
    ctx.fillStyle = '#7a5232'; ctx.fillRect(5, 2, 1, 10); ctx.fillRect(10, 2, 1, 10); ctx.fillRect(2, 6, 12, 1); // lattice
    ctx.fillStyle = '#a3825a'; ctx.fillRect(5, 2, 1, 1); ctx.fillRect(10, 2, 1, 1); ctx.fillRect(2, 6, 6, 1);    // lattice hi
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(2, 12, 12, 2);                             // bottom rail (kamachi)
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(2, 12, 12, 1);                             // rail lit
  });
  atlas['f-chabudai'] = tile(ctx => {
    // low round wooden tea table seen 3/4 from above, a matcha cup on top.
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(3, 11, 2, 3); ctx.fillRect(11, 11, 2, 3);  // legs
    ctx.fillStyle = '#6e4a2f';                                                         // round top (edge/front)
    ctx.fillRect(5, 4, 6, 1); ctx.fillRect(3, 5, 10, 1); ctx.fillRect(2, 6, 12, 4); ctx.fillRect(3, 10, 10, 1); ctx.fillRect(5, 11, 6, 1);
    ctx.fillStyle = '#8a6644'; ctx.fillRect(5, 5, 6, 1); ctx.fillRect(3, 6, 10, 2);    // lit top surface
    ctx.fillStyle = '#a3825a'; ctx.fillRect(4, 6, 5, 1); ctx.fillRect(3, 7, 3, 1);     // sheen
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(3, 9, 10, 1); ctx.fillRect(4, 10, 8, 1);   // front rim shadow
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(7, 5, 3, 2);                               // tea cup
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(7, 5, 3, 1);
    ctx.fillStyle = '#7ce8a0'; ctx.fillRect(8, 6, 1, 1);                               // matcha
  });
  atlas['f-zabuton'] = tile(ctx => {
    // flat square floor cushion: puffy indigo, gold center tuft, corner tassel.
    ctx.fillStyle = '#27517c'; ctx.fillRect(2, 5, 12, 8);                              // cushion body (front)
    ctx.fillStyle = '#2e5e8e'; ctx.fillRect(2, 4, 12, 8);                              // top surface
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(3, 4, 10, 3);                              // lit top
    ctx.fillStyle = '#5b8cbe'; ctx.fillRect(3, 4, 9, 1);                               // highlight
    ctx.fillStyle = '#27517c'; ctx.fillRect(2, 11, 12, 2);                             // front shadow
    ctx.fillStyle = '#222831'; ctx.fillRect(2, 13, 12, 1);                             // contact line
    ctx.fillStyle = '#5b8cbe'; ctx.fillRect(2, 5, 1, 7); ctx.fillRect(13, 5, 1, 7);    // seam piping
    ctx.fillStyle = '#c9a227'; ctx.fillRect(7, 7, 2, 2); ctx.fillStyle = '#ffd24a'; ctx.fillRect(7, 7, 1, 1); // center tuft
    ctx.fillStyle = '#222831'; ctx.fillRect(5, 7, 1, 1); ctx.fillRect(10, 8, 1, 1);    // tuft dimples
    ctx.fillStyle = '#c9a227'; ctx.fillRect(13, 12, 1, 3); ctx.fillStyle = '#ffe9a0'; ctx.fillRect(13, 12, 1, 1); // tassel
  });
  atlas['f-byobu'] = tile(ctx => {
    // folding paper screen: three gold panels, ink crane + red sun, pine sprig.
    const px = [1, 11, 21];
    for (let i = 0; i < 3; i++) {
      const x = px[i];
      const lit = i % 2 === 0;                                                         // zigzag fold: alt panels catch light
      ctx.fillStyle = '#3a2716'; ctx.fillRect(x, 1, 10, 14);                           // panel frame
      ctx.fillStyle = lit ? '#cdbb8e' : '#b08a50'; ctx.fillRect(x + 1, 2, 8, 12);      // gold paper
      if (lit) { ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x + 1, 2, 8, 4); }            // lit top wash
      ctx.fillStyle = '#6e4a2f'; ctx.fillRect(x, 1, 10, 1);                            // frame lit top
      ctx.fillStyle = '#222831'; ctx.fillRect(x + 9, 2, 1, 12);                        // fold shadow seam
    }
    ctx.fillStyle = '#c0392b'; ctx.fillRect(4, 4, 4, 4); ctx.fillStyle = '#d75a4a'; ctx.fillRect(4, 4, 2, 2); // red sun
    ctx.fillStyle = '#2c3038'; ctx.fillRect(13, 9, 6, 1); ctx.fillRect(15, 8, 3, 1); ctx.fillRect(18, 7, 1, 2); ctx.fillRect(12, 9, 1, 2); // ink crane
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(14, 9, 3, 1);                              // crane underbelly
    ctx.fillStyle = '#d05050'; ctx.fillRect(18, 7, 1, 1);                              // crest
    ctx.fillStyle = '#4d7440'; ctx.fillRect(24, 10, 4, 1); ctx.fillRect(25, 9, 2, 1); ctx.fillRect(26, 8, 1, 1); // pine sprig
  }, 32, 16);
  atlas['f-kamidana'] = tile(ctx => {
    // household shrine shelf: wood plank, mini vermilion torii, offering cups + sprig.
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(2, 9, 12, 2);                              // shelf plank (front)
    ctx.fillStyle = '#8a6644'; ctx.fillRect(2, 9, 12, 1);                              // lit top edge
    ctx.fillStyle = '#4a3320'; ctx.fillRect(3, 11, 1, 2); ctx.fillRect(12, 11, 1, 2);  // brackets
    ctx.fillStyle = '#c0392b'; ctx.fillRect(4, 3, 8, 1); ctx.fillRect(5, 3, 1, 6); ctx.fillRect(10, 3, 1, 6); // torii lintel + posts
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(5, 5, 6, 1);                               // second rail (nuki)
    ctx.fillStyle = '#d75a4a'; ctx.fillRect(4, 3, 4, 1); ctx.fillRect(5, 3, 1, 2);     // lit highlights
    ctx.fillStyle = '#4d7440'; ctx.fillRect(7, 5, 1, 3); ctx.fillRect(8, 6, 1, 2);     // sakaki sprig
    ctx.fillStyle = '#6f9e5e'; ctx.fillRect(7, 5, 1, 1);
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(3, 7, 2, 2); ctx.fillRect(11, 7, 2, 2);    // offering cups
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(3, 7, 2, 1); ctx.fillRect(11, 7, 2, 1);
  });
  atlas['f-kakejiku'] = tile(ctx => {
    // hanging scroll: silk mounting, ink-wash + calligraphy, red seal, wood rollers.
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(8, 0, 1, 2);                               // hanging cord
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(4, 1, 8, 14);                              // silk mounting
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(4, 1, 8, 1);                               // lit top
    ctx.fillStyle = '#b08a50'; ctx.fillRect(11, 1, 1, 14);                             // shadow side
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(5, 3, 6, 9);                               // paper field
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(5, 3, 6, 1); ctx.fillRect(5, 3, 1, 9);     // lit
    ctx.fillStyle = '#6e7682'; ctx.fillRect(6, 8, 4, 1); ctx.fillRect(7, 7, 2, 1);     // misty hill (ink-wash)
    ctx.fillStyle = '#2c3038'; ctx.fillRect(7, 5, 1, 2); ctx.fillRect(8, 4, 1, 3);     // calligraphy strokes
    ctx.fillStyle = '#16181d'; ctx.fillRect(8, 9, 1, 1);                               // ink dot
    ctx.fillStyle = '#c0392b'; ctx.fillRect(9, 10, 1, 1);                              // red seal (hanko)
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(3, 1, 10, 1); ctx.fillRect(3, 13, 10, 2);  // wooden rollers
    ctx.fillStyle = '#8a6644'; ctx.fillRect(3, 13, 10, 1);                             // roller lit
    ctx.fillStyle = '#4a3320'; ctx.fillRect(3, 14, 1, 1); ctx.fillRect(12, 14, 1, 1);  // knob ends
  });
  atlas['f-chochin'] = tile(ctx => {
    // hanging paper lantern: glowing red body, paper ribs, a kanji, gold tassel.
    ctx.fillStyle = 'rgba(255,150,80,0.16)'; ctx.fillRect(2, 1, 12, 14);               // warm glow
    ctx.fillStyle = '#2c3038'; ctx.fillRect(6, 0, 4, 1);                               // top cap + cord
    ctx.fillStyle = '#16181d'; ctx.fillRect(7, 0, 2, 1);
    ctx.fillStyle = '#c0392b';                                                         // body (oval)
    ctx.fillRect(5, 1, 6, 1); ctx.fillRect(4, 2, 8, 1); ctx.fillRect(3, 3, 10, 9); ctx.fillRect(4, 12, 8, 1); ctx.fillRect(5, 13, 6, 1);
    ctx.fillStyle = '#d75a4a'; ctx.fillRect(4, 2, 5, 2); ctx.fillRect(3, 4, 3, 4);     // lit left
    ctx.fillStyle = '#e87a6a'; ctx.fillRect(4, 3, 2, 1);                               // glow highlight
    ctx.fillStyle = '#9e3a3a'; ctx.fillRect(9, 9, 4, 3);                               // shadow right
    ctx.fillStyle = '#8e2a1e'; ctx.fillRect(3, 5, 10, 1); ctx.fillRect(3, 8, 10, 1); ctx.fillRect(4, 11, 8, 1); // paper ribs
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(6, 6, 4, 2);                               // white center band
    ctx.fillStyle = '#2c3038'; ctx.fillRect(7, 6, 2, 1); ctx.fillRect(7, 7, 1, 1);     // kanji
    ctx.fillStyle = '#2c3038'; ctx.fillRect(6, 13, 4, 1); ctx.fillStyle = '#c9a227'; ctx.fillRect(7, 14, 2, 2); // bottom cap + tassel
  });
  atlas['f-bonsai'] = tile(ctx => {
    // bonsai in a shallow glazed pot: gnarled trunk, layered green canopy pads.
    ctx.fillStyle = '#3e5c33'; ctx.fillRect(3, 3, 6, 3); ctx.fillRect(9, 4, 4, 3); ctx.fillRect(5, 6, 7, 2); // canopy
    ctx.fillStyle = '#4d7440'; ctx.fillRect(3, 3, 5, 2); ctx.fillRect(9, 4, 3, 2); ctx.fillRect(5, 6, 5, 1);
    ctx.fillStyle = '#6f9e5e'; ctx.fillRect(3, 3, 3, 1); ctx.fillRect(9, 4, 2, 1);     // lit tops
    ctx.fillStyle = '#7ce8a0'; ctx.fillRect(4, 3, 1, 1);                               // leaf glint
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(7, 6, 2, 5); ctx.fillRect(6, 8, 1, 2);     // gnarled trunk
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(7, 6, 1, 5);                               // lit trunk side
    ctx.fillStyle = '#27517c'; ctx.fillRect(3, 11, 10, 3);                             // shallow glazed pot
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(3, 11, 10, 1);                             // glazed lit rim
    ctx.fillStyle = '#5b8cbe'; ctx.fillRect(4, 11, 4, 1);                              // glaze highlight
    ctx.fillStyle = '#222831'; ctx.fillRect(3, 13, 10, 1);                             // base shadow
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(4, 14, 2, 1); ctx.fillRect(10, 14, 2, 1);  // little feet
  });
  atlas['f-zengarden'] = tile(ctx => {
    // zen garden tray: wooden frame, raked white sand, two grey stones.
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(1, 3, 14, 11);                             // tray frame
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(1, 3, 14, 1); ctx.fillRect(1, 3, 1, 11);   // lit edges
    ctx.fillStyle = '#4a3320'; ctx.fillRect(14, 3, 1, 11); ctx.fillRect(1, 13, 14, 1); // shadow edges
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 4, 12, 9);                              // sand
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(2, 4, 12, 2);                              // lit sand
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(2, 8, 12, 1); ctx.fillRect(2, 11, 12, 1); ctx.fillRect(3, 6, 5, 1); // raked lines
    ctx.fillStyle = '#222831'; ctx.fillRect(4, 8, 3, 1); ctx.fillRect(10, 7, 2, 1);    // stone contact shadow
    ctx.fillStyle = '#6e7682'; ctx.fillRect(4, 6, 3, 2);                               // big stone
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(4, 6, 2, 1);                               // lit
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(10, 5, 2, 2);                              // small stone
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(10, 5, 1, 1);                              // lit
  });
  atlas['f-tansu'] = tile(ctx => {
    // tansu chest of drawers: warm wood, iron handle plates + pulls.
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(1, 1, 14, 14);                             // body (front)
    ctx.fillStyle = '#8a6644'; ctx.fillRect(1, 1, 14, 1); ctx.fillRect(1, 1, 1, 14);   // lit top+left
    ctx.fillStyle = '#4a3320'; ctx.fillRect(14, 1, 1, 14); ctx.fillRect(1, 14, 14, 1); // shadow side+bottom
    ctx.fillStyle = '#3a2716'; ctx.fillRect(1, 5, 14, 1); ctx.fillRect(1, 9, 14, 1); ctx.fillRect(8, 9, 1, 6); // drawer seams
    ctx.fillStyle = '#8a6644'; ctx.fillRect(2, 6, 12, 1); ctx.fillRect(2, 10, 5, 1); ctx.fillRect(9, 10, 5, 1); // drawer lit edges
    ctx.fillStyle = '#3a4250'; ctx.fillRect(7, 2, 2, 2); ctx.fillRect(7, 6, 2, 2); ctx.fillRect(4, 11, 2, 2); ctx.fillRect(10, 11, 2, 2); // iron fittings
    ctx.fillStyle = '#6e7682'; ctx.fillRect(7, 2, 2, 1); ctx.fillRect(7, 6, 2, 1); ctx.fillRect(4, 11, 2, 1); ctx.fillRect(10, 11, 2, 1); // pull hi
    ctx.fillStyle = '#a3825a'; ctx.fillRect(2, 2, 3, 1);                               // wood grain hi
  });
  atlas['f-noren'] = tile(ctx => {
    // doorway curtain: wooden rod, split indigo cloth panels, white crest, ragged hem.
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(0, 1, 16, 1);                              // rod
    ctx.fillStyle = '#8a6644'; ctx.fillRect(1, 1, 6, 1);                               // rod lit
    ctx.fillStyle = '#2e5e8e'; ctx.fillRect(1, 2, 7, 12); ctx.fillRect(9, 2, 6, 12);   // cloth panels (split)
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(1, 2, 7, 2); ctx.fillRect(9, 2, 6, 2);     // lit tops
    ctx.fillStyle = '#5b8cbe'; ctx.fillRect(1, 2, 6, 1);                               // highlight
    ctx.fillStyle = '#27517c'; ctx.fillRect(1, 12, 7, 2); ctx.fillRect(9, 12, 6, 2);   // hem shadow
    ctx.fillStyle = '#27517c'; ctx.fillRect(2, 14, 2, 1); ctx.fillRect(5, 14, 2, 1); ctx.fillRect(10, 14, 2, 1); ctx.fillRect(13, 14, 1, 1); // ragged hem
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(4, 6, 3, 3); ctx.fillRect(11, 6, 2, 3);    // white crest motif
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(4, 8, 3, 1);                               // motif shade
  });
  atlas['f-ricecooker'] = tile(ctx => {
    // retro rice cooker: domed lid, cream body, indicator lights, steam wisp.
    ctx.fillStyle = 'rgba(232,240,244,0.5)'; ctx.fillRect(7, 1, 1, 1); ctx.fillRect(8, 0, 1, 1); ctx.fillRect(7, 3, 1, 1); // steam
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(4, 4, 8, 1); ctx.fillRect(3, 5, 10, 2);    // domed lid
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(4, 4, 6, 1); ctx.fillRect(3, 5, 7, 1);     // lit
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(3, 6, 10, 1);                              // lid rim shadow
    ctx.fillStyle = '#6e7682'; ctx.fillRect(7, 3, 2, 1);                               // steam vent
    ctx.fillStyle = '#cdbb8e'; ctx.fillRect(2, 7, 12, 7);                              // body (front)
    ctx.fillStyle = '#e8e0d0'; ctx.fillRect(2, 7, 12, 4);                              // lit upper
    ctx.fillStyle = '#f4efe2'; ctx.fillRect(2, 7, 11, 1);                              // highlight
    ctx.fillStyle = '#b08a50'; ctx.fillRect(2, 13, 12, 1);                             // base shadow
    ctx.fillStyle = '#d05050'; ctx.fillRect(2, 11, 12, 1);                             // retro accent stripe
    ctx.fillStyle = '#3a4250'; ctx.fillRect(9, 8, 4, 2);                               // little display
    ctx.fillStyle = '#50c878'; ctx.fillRect(10, 8, 1, 1); ctx.fillStyle = '#ffd24a'; ctx.fillRect(12, 8, 1, 1); // indicator lights
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(1, 9, 1, 2); ctx.fillRect(14, 9, 1, 2);    // side handles
  });
  atlas['f-toilet'] = tile(ctx => {
    // washlet toilet seen 3/4: ceramic bowl + lid, tank, side control panel.
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(3, 1, 8, 4);                               // tank (back)
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(3, 1, 8, 2); ctx.fillStyle = '#f4f8fb'; ctx.fillRect(3, 1, 7, 1);
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(3, 4, 8, 1);
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(4, 5, 7, 1); ctx.fillRect(3, 6, 9, 5); ctx.fillRect(4, 11, 7, 1); // seat lid (oval)
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(4, 6, 7, 3);                               // lit lid top
    ctx.fillStyle = '#f4f8fb'; ctx.fillRect(4, 6, 6, 1);                               // highlight
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(3, 10, 9, 1);                              // lid front shadow
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(5, 11, 5, 3);                              // pedestal base
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(5, 13, 5, 1);
    ctx.fillStyle = '#6e7682'; ctx.fillRect(5, 14, 5, 1);                              // floor contact
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(11, 6, 4, 5);                              // washlet control panel
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(11, 6, 1, 5);                              // panel shadow side
    ctx.fillStyle = '#50a0d0'; ctx.fillRect(12, 7, 1, 1); ctx.fillStyle = '#50c878'; ctx.fillRect(14, 7, 1, 1); // buttons
    ctx.fillStyle = '#d05050'; ctx.fillRect(13, 9, 1, 1); ctx.fillStyle = '#3a4250'; ctx.fillRect(12, 9, 1, 1); // stop + button
  });
  atlas['f-sink'] = tile(ctx => {
    // washbasin: wall mirror, chrome faucet, white ceramic basin on a pedestal.
    ctx.fillStyle = '#6e7682'; ctx.fillRect(4, 0, 8, 5);                               // mirror frame
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(5, 1, 6, 3);                               // glass
    ctx.fillStyle = '#c7e0f4'; ctx.fillRect(5, 1, 3, 1); ctx.fillRect(5, 1, 1, 3);     // reflection glint
    ctx.fillStyle = '#5b8cbe'; ctx.fillRect(8, 2, 3, 2);                               // glass shade
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(7, 5, 2, 3); ctx.fillRect(7, 7, 3, 1);     // faucet
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(7, 5, 1, 3);                               // chrome hi
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(3, 8, 10, 1); ctx.fillRect(2, 9, 12, 3); ctx.fillRect(3, 12, 10, 1); // basin
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(3, 8, 10, 2);                              // lit rim
    ctx.fillStyle = '#f4f8fb'; ctx.fillRect(3, 8, 8, 1);                               // highlight
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(5, 10, 6, 1);                              // water sheen
    ctx.fillStyle = '#8a96a0'; ctx.fillRect(2, 11, 12, 1);                             // bowl front shadow
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(6, 12, 4, 3);                              // pedestal
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(6, 14, 4, 1);
    ctx.fillStyle = '#e857a8'; ctx.fillRect(11, 9, 2, 1);                              // soap
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
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(3, 11, 10, 1);          // log lit edge
    ctx.fillStyle = '#2c1c10'; ctx.fillRect(3, 12, 10, 1);          // log shadow
    ctx.fillStyle = 'rgba(255,150,60,0.18)'; ctx.fillRect(4, 2, 8, 9); // glow halo
    ctx.fillStyle = '#c0392b'; ctx.fillRect(6, 5, 4, 6); ctx.fillRect(7, 3, 2, 2); // flame outer (tapered tongue)
    ctx.fillStyle = '#e0552e'; ctx.fillRect(6, 6, 3, 4); ctx.fillRect(8, 5, 1, 3);  // flame body
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7, 7, 2, 3);           // flame mid
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(7, 8, 1, 2);          // flame core
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(5, 10, 1, 1); ctx.fillRect(11, 10, 1, 1); // embers
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
    ctx.fillStyle = '#f0e8d2'; ctx.fillRect(4, 9, 7, 1);         // back highlight
    ctx.fillStyle = '#cabd9c'; ctx.fillRect(4, 11, 7, 1);        // belly shade
    ctx.fillStyle = '#8a6644'; ctx.fillRect(10, 8, 3, 3);       // brown head
    ctx.fillStyle = '#a3825a'; ctx.fillRect(10, 8, 3, 1);       // head lit
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(2, 8, 3, 3);        // bushy tail
    ctx.fillStyle = '#3a2716'; ctx.fillRect(2, 8, 1, 3);        // tail tip
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(11, 7, 1, 1);       // ear
    ctx.fillStyle = '#16181d'; ctx.fillRect(12, 8, 1, 1);       // eye
    ctx.fillStyle = '#16100a'; ctx.fillRect(13, 9, 1, 1);       // nose
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
  atlas['v-bicycle'] = tile(ctx => {
    // mama-chari city bike, side profile facing left: two spoked wheels with
    // silver fenders, swoopy step-through teal frame, handlebars + front basket
    // (a leek poking out), brown saddle, crank + pedal.
    const wheel = (cx: number) => {
      const cy = 9;
      const spans: [number, number][] = [
        [-5, 1], [-4, 3], [-3, 4], [-2, 4], [-1, 5], [0, 5], [1, 5], [2, 4], [3, 4], [4, 3], [5, 1],
      ];
      ctx.fillStyle = '#2c3038';                                        // tire
      for (const [dy, hw] of spans) {
        const y = cy + dy;
        if (Math.abs(dy) >= 4) ctx.fillRect(cx - hw, y, hw * 2 + 1, 1); // top/bottom caps
        else { ctx.fillRect(cx - hw, y, 2, 1); ctx.fillRect(cx + hw - 1, y, 2, 1); } // side walls
      }
      ctx.fillStyle = '#8a96a0';                                        // spokes
      ctx.fillRect(cx, cy - 3, 1, 7); ctx.fillRect(cx - 3, cy, 7, 1);
      ctx.fillRect(cx - 2, cy - 2, 1, 1); ctx.fillRect(cx + 2, cy - 2, 1, 1);
      ctx.fillRect(cx - 2, cy + 2, 1, 1); ctx.fillRect(cx + 2, cy + 2, 1, 1);
      ctx.fillStyle = '#6e7682'; ctx.fillRect(cx - 1, cy - 1, 3, 3);    // hub
      ctx.fillStyle = '#c4ccd4'; ctx.fillRect(cx - 1, cy - 1, 1, 1);    // lit hub
      ctx.fillRect(cx - 3, cy - 6, 7, 1);                               // silver fender over top
      ctx.fillStyle = '#9aa0a6'; ctx.fillRect(cx - 3, cy - 5, 1, 1); ctx.fillRect(cx + 3, cy - 5, 1, 1);
    };
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(4, 14, 22, 1); ctx.fillRect(6, 15, 18, 1); // ground shadow
    wheel(8); wheel(24);
    // frame (teal) — drawn mid, then lit/shadow accents
    ctx.fillStyle = '#50a0d0';
    ctx.fillRect(8, 4, 1, 6);                                           // front fork
    ctx.fillRect(8, 5, 1, 1); ctx.fillRect(9, 6, 1, 1); ctx.fillRect(10, 7, 1, 1); ctx.fillRect(11, 8, 1, 1);
    ctx.fillRect(12, 9, 2, 1); ctx.fillRect(14, 10, 2, 1);             // swoop tube head -> bottom bracket
    ctx.fillRect(15, 8, 1, 2); ctx.fillRect(16, 6, 1, 2); ctx.fillRect(17, 5, 1, 1); ctx.fillRect(18, 4, 1, 1); // seat tube
    ctx.fillRect(16, 10, 4, 1); ctx.fillRect(20, 9, 4, 1);             // chainstay -> rear hub
    ctx.fillRect(22, 8, 1, 1); ctx.fillRect(21, 7, 1, 1); ctx.fillRect(20, 6, 1, 1); ctx.fillRect(19, 5, 1, 1); // seat stay
    ctx.fillStyle = '#9fc4e8'; ctx.fillRect(8, 4, 1, 1); ctx.fillRect(9, 6, 1, 1); ctx.fillRect(16, 6, 1, 1); // tube highlights
    ctx.fillStyle = '#3d6e9e'; ctx.fillRect(16, 10, 4, 1); ctx.fillRect(8, 9, 1, 1);                          // tube shadow
    // crank + pedal
    ctx.fillStyle = '#6e7682'; ctx.fillRect(14, 10, 2, 2);             // chainring
    ctx.fillStyle = '#3a4250'; ctx.fillRect(15, 12, 1, 2);            // crank arm
    ctx.fillStyle = '#2c3038'; ctx.fillRect(13, 13, 3, 1);           // pedal
    // saddle
    ctx.fillStyle = '#5a3c24'; ctx.fillRect(15, 2, 7, 2);
    ctx.fillStyle = '#6e4a2f'; ctx.fillRect(15, 2, 7, 1);
    ctx.fillStyle = '#8a6440'; ctx.fillRect(16, 2, 3, 1);            // saddle lit
    // handlebars
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(8, 2, 1, 2);            // stem
    ctx.fillStyle = '#3a4250'; ctx.fillRect(4, 2, 6, 1);            // bar
    ctx.fillStyle = '#2c3038'; ctx.fillRect(4, 2, 2, 1);          // grip
    // front basket (wire) over the front wheel
    ctx.fillStyle = '#c4ccd4'; ctx.fillRect(2, 3, 6, 1); ctx.fillRect(2, 3, 1, 5); ctx.fillRect(7, 3, 1, 5); ctx.fillRect(2, 7, 6, 1);
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(4, 4, 1, 3); ctx.fillRect(3, 5, 4, 1); // mesh
    ctx.fillStyle = '#50c878'; ctx.fillRect(3, 1, 2, 2); ctx.fillStyle = '#7ce8a0'; ctx.fillRect(3, 1, 1, 1); // leek leaves
    ctx.fillStyle = '#e8f0f4'; ctx.fillRect(4, 3, 1, 1);          // leek stalk
    // little headlight
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(6, 7, 1, 1);
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
  // at the muzzle, two pointy ears on top, an arched back, an S-curve tail at the
  // rear (left), and four slender legs. He's black, but flat black reads as a blob — so:
  // k=body black, s=fur sheen on the top/back rim (light from upper-left),
  // d=deep shadow on the underside / far-side legs, g=green eye, p=pink nose / inner-ear.
  const CATPAL = { k: '#16161c', s: '#34343f', d: '#0e0e13', g: '#8ef07a', p: '#e0879f' };
  // CHUNKY silhouette (Stardew-cat proportions): a big 6px head with tall ears,
  // a thick low-slung body, stubby 2px legs, and the tail curling up behind.
  // The earlier draft's long thin legs read as stilts. Shared upper body; the
  // two walk frames only swap the leg stubs (gathered vs shifted) — the draw
  // loop's sine bob supplies the rest of the motion.
  const CAT_UP = [
    '................', // 0
    '..........kk..kk', // 1  tall ear tips
    '..........kkkkkk', // 2  head crown
    '..........kpkkpk', // 3  pink inner ears
    '.kk......skkkgkk', // 4  raised tail tip + brow sheen + green eye
    '.kk......skkkkkp', // 5  tail + muzzle + pink nose
    '..kkskkkkkkkkkk.', // 6  tail curving into the back (sheen ridge)
    '..skkkkkkkkkkkk.', // 7  thick body, sheen on the shoulder
    '..kkkkkkkkkkkkk.', // 8  body mass
    '..kkkkkkkkkkkk..', // 9  body
    '..dkkkkkkkkkkd..', // 10 belly shadow line
    '...dkkkkkkkkd...', // 11 underside taper
  ];
  const catR0 = strSprite([
    ...CAT_UP,
    '...kk......kk...', // 12 stub legs gathered (back 3-4, front 11-12)
    '...dd......dd...', // 13 feet (deep-shadow contact)
    '................', // 14
    '................', // 15
  ], CATPAL);
  const catR1 = strSprite([
    ...CAT_UP,
    '....kk....kk....', // 12 stubs mid-step (both pairs tuck inward)
    '....dd....dd....', // 13 feet
    '................', // 14
    '................', // 15
  ], CATPAL);
  atlas['cat-r-0'] = catR0; atlas['cat-l-0'] = mirror(catR0);
  atlas['cat-r-1'] = catR1; atlas['cat-l-1'] = mirror(catR1);
  // Aliases (frame 0) so any `cat-r` / `cat-l` reference still resolves.
  atlas['cat-r'] = catR0; atlas['cat-l'] = mirror(catR0);
  // Sitting (classic upright cat): head high on the right, chest sloping down
  // into wide tucked haunches, paws together, tail lying around the front.
  // Two frames: the tail lifts and flicks (idle life without moving the body).
  const CAT_SIT_UP = [
    '................', // 0
    '..........kk..kk', // 1  tall ear tips
    '..........kkkkkk', // 2  head crown
    '..........kpkkpk', // 3  pink inner ears
    '.........skkkgkk', // 4  brow sheen + green eye
    '.........skkkkkp', // 5  muzzle + pink nose
    '.........skkkkk.', // 6  neck
    '........skkkkkk.', // 7  chest (front sheen)
    '.......skkkkkkk.', // 8  chest widening
    '......skkkkkkkk.', // 9  body
    '.....skkkkkkkkk.', // 10 haunch
    '....skkkkkkkkkk.', // 11 haunch (widest slope)
    '....kkkkkkkkkkk.', // 12 sitting base
  ];
  const catSitR0 = strSprite([
    ...CAT_SIT_UP,
    '....kkkkkkkkkkk.', // 13 base
    '...dkkkkkkkkkk..', // 14 paws + tail lying around the front-left
    '................', // 15
  ], CATPAL);
  const catSitR1 = strSprite([
    ...CAT_SIT_UP,
    '...dkkkkkkkkkkk.', // 13 tail tip lifts against the base
    '....kkkkkkkkkk..', // 14 paws
    '................', // 15
  ], CATPAL);
  atlas['cat-sit-r-0'] = catSitR0; atlas['cat-sit-l-0'] = mirror(catSitR0);
  atlas['cat-sit-r-1'] = catSitR1; atlas['cat-sit-l-1'] = mirror(catSitR1);
  // Aliases (frame 0) so any `cat-sit-r` / `cat-sit-l` reference still resolves.
  atlas['cat-sit-r'] = catSitR0; atlas['cat-sit-l'] = mirror(catSitR0);
  // Napping (curled loaf): a low mound, head tucked to the right with a closed
  // eye (sheen dash) and the tail wrapped around the front. Ears still poke up.
  const catNapR = strSprite([
    '................', // 0
    '................', // 1
    '................', // 2
    '................', // 3
    '................', // 4
    '................', // 5
    '................', // 6
    '................', // 7
    '.........kk..kk.', // 8  ear tips poking out of the loaf
    '......kkkkkkkkk.', // 9  curled back
    '....skkkkkkkkkk.', // 10 sheen rim + head side
    '...skkkkkkkskkk.', // 11 body + closed eye (sheen dash)
    '...kkkkkkkkkkpk.', // 12 body + tucked muzzle (pink nose)
    '...dkkkkkkkkkd..', // 13 tail wrapped along the floor
    '................', // 14
    '................', // 15
  ], CATPAL);
  atlas['cat-nap-r'] = catNapR; atlas['cat-nap-l'] = mirror(catNapR);

  // ---- Hidden museum collectible: a small glinting curio on the ground --------
  atlas['t-relic'] = tile(ctx => {
    ctx.fillStyle = '#ffe9a0'; ctx.fillRect(7, 5, 2, 6); ctx.fillRect(5, 7, 6, 2); // 4-point star
    ctx.fillStyle = '#fff6d6'; ctx.fillRect(7, 7, 2, 2);
    ctx.fillStyle = '#c9a227'; ctx.fillRect(6, 10, 4, 1);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(11, 4, 1, 1); ctx.fillRect(4, 11, 1, 1); ctx.fillRect(12, 11, 1, 1);
  });
  atlas['m-bobber'] = strSprite([
    '.tt.',
    'rRr.',
    'rrrr',
    'wWww',
    '.ww.',
  ], { r: '#d05050', R: '#e8746a', w: '#e8e0d0', W: '#ffffff', t: '#9e3a3a' });
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
    R(ctx, '#7a818c', 4, 7, 3, 5); R(ctx, '#9aa0a8', 4, 7, 3, 1); R(ctx, '#5d646e', 6, 7, 1, 5); // suit body ramp
    R(ctx, '#e8e0d0', 5, 7, 1, 2);                                      // dress shirt
    R(ctx, '#c0392b', 5, 8, 1, 3);                                      // tie
    R(ctx, '#8a8e96', 3, 2, 5, 5); R(ctx, '#9aa0a8', 3, 2, 5, 1); R(ctx, '#767d87', 3, 6, 5, 1); // head ramp
    R(ctx, '#8a8e96', 2, 1, 2, 2); R(ctx, '#8a8e96', 7, 1, 2, 2);       // ears
    R(ctx, '#e8a0a0', 3, 1, 1, 1); R(ctx, '#e8a0a0', 8, 1, 1, 1);       // inner ears
    R(ctx, '#16181d', 4, 4, 1, 1); R(ctx, '#16181d', 6, 4, 1, 1);       // eyes
    R(ctx, '#caa27c', 5, 5, 1, 1);                                      // muzzle
  });
  atlas['fig-1'] = toy(ctx => { // Tower Crab
    R(ctx, '#c0392b', 2, 7, 7, 4); R(ctx, '#e0594b', 2, 7, 7, 1); R(ctx, '#9e3a2e', 2, 10, 7, 1); // shell ramp
    R(ctx, '#8e2a1e', 4, 8, 3, 1);                                      // shell crease
    R(ctx, '#c0392b', 1, 5, 2, 2); R(ctx, '#c0392b', 8, 5, 2, 2);       // claws
    R(ctx, '#e0594b', 1, 5, 1, 1); R(ctx, '#e0594b', 8, 5, 1, 1);       // claw highlight
    R(ctx, '#16181d', 3, 4, 1, 2); R(ctx, '#16181d', 7, 4, 1, 2);       // eye stalks
    R(ctx, '#fff', 3, 4, 1, 1); R(ctx, '#fff', 7, 4, 1, 1);            // eye shine
    R(ctx, '#9e3a2e', 2, 11, 1, 1); R(ctx, '#9e3a2e', 5, 11, 1, 1); R(ctx, '#9e3a2e', 8, 11, 1, 1); // legs
  });
  atlas['fig-2'] = toy(ctx => { // Drift King (car)
    R(ctx, '#c9a227', 1, 7, 9, 3); R(ctx, '#e8c84a', 1, 7, 9, 1); R(ctx, '#a8841c', 1, 9, 9, 1); // body ramp
    R(ctx, '#9fc4e8', 3, 4, 5, 3); R(ctx, '#c7e0f4', 3, 4, 2, 1);       // cabin + shine
    R(ctx, '#3a4250', 3, 4, 1, 3);                                      // A-pillar
    R(ctx, '#ffe9a0', 9, 7, 1, 1);                                      // headlight
    R(ctx, '#16181d', 2, 10, 3, 2); R(ctx, '#16181d', 6, 10, 3, 2);    // wheels
    R(ctx, '#6e7682', 3, 10, 1, 1); R(ctx, '#6e7682', 7, 10, 1, 1);    // hubs
  });
  atlas['fig-3'] = toy(ctx => { // Melon Soda-kun (bottle)
    R(ctx, '#3dbf6a', 3, 4, 4, 8); R(ctx, '#5ad88a', 3, 4, 1, 8); R(ctx, '#2e9a52', 6, 4, 1, 8); // body ramp
    R(ctx, '#3dbf6a', 4, 2, 2, 2);                                      // neck
    R(ctx, '#c0392b', 4, 1, 2, 1);                                      // cap
    R(ctx, '#fff', 4, 7, 2, 2);                                         // label
    R(ctx, '#aef0c4', 4, 5, 1, 1); R(ctx, '#aef0c4', 5, 9, 1, 1);      // bubbles
  });
  atlas['fig-4'] = toy(ctx => { // Pixel Gabe
    R(ctx, '#e0b48a', 4, 2, 3, 3); R(ctx, '#f0c8a0', 4, 2, 3, 1); R(ctx, '#caa27c', 4, 4, 3, 1); // head ramp
    R(ctx, '#4a3120', 4, 1, 3, 1); R(ctx, '#3a2716', 4, 1, 1, 2);       // hair
    R(ctx, '#16181d', 4, 3, 1, 1); R(ctx, '#16181d', 6, 3, 1, 1);       // eyes
    R(ctx, '#3a6ea5', 3, 5, 5, 5); R(ctx, '#4a7eb5', 3, 5, 5, 1); R(ctx, '#2e5685', 3, 9, 5, 1); // shirt ramp
    R(ctx, '#caa27c', 3, 6, 1, 2); R(ctx, '#caa27c', 7, 6, 1, 2);       // arms
    R(ctx, '#2c3038', 3, 10, 2, 2); R(ctx, '#2c3038', 6, 10, 2, 2);     // legs
  });
  atlas['fig-5'] = toy(ctx => { // Konbini Ghost
    R(ctx, '#eef0f4', 3, 3, 5, 7); R(ctx, '#fff', 3, 3, 5, 1); R(ctx, '#d4d8e0', 3, 9, 5, 1); // body ramp
    R(ctx, '#3a4452', 4, 5, 1, 2); R(ctx, '#3a4452', 6, 5, 1, 2);       // eyes
    R(ctx, '#9fb0c4', 5, 7, 1, 1);                                      // tiny mouth
    R(ctx, '#eef0f4', 3, 10, 1, 1); R(ctx, '#eef0f4', 5, 10, 1, 1); R(ctx, '#eef0f4', 7, 10, 1, 1); // tail
  });
  atlas['fig-6'] = toy(ctx => { // Mini Golden Carp
    R(ctx, '#ffd24a', 3, 4, 4, 7); R(ctx, '#ffe9a0', 3, 4, 4, 1); R(ctx, '#e0a000', 3, 9, 4, 1); // body ramp
    R(ctx, '#e0a000', 2, 9, 6, 2); R(ctx, '#ffd24a', 3, 10, 2, 1);      // tail fan + highlight
    R(ctx, '#c98a00', 4, 7, 2, 1);                                      // scale shade
    R(ctx, '#16181d', 4, 5, 1, 1);                                      // eye
  });
  atlas['fig-7'] = toy(ctx => { // Robot Vacuum
    R(ctx, '#3a4250', 1, 8, 9, 3); R(ctx, '#4a5666', 1, 8, 9, 1); R(ctx, '#16181d', 1, 10, 9, 1); // disc ramp
    R(ctx, '#5ad8d0', 4, 9, 3, 1); R(ctx, '#aef4f0', 4, 9, 1, 1);      // sensor light + glint
    R(ctx, '#2c3038', 1, 8, 1, 3); R(ctx, '#2c3038', 9, 8, 1, 3);      // bumper edges
  });
  atlas['fig-8'] = toy(ctx => { // Bonsai Buddy
    R(ctx, '#a0673a', 3, 9, 5, 3); R(ctx, '#b87a48', 3, 9, 5, 1); R(ctx, '#7a4e2a', 3, 11, 5, 1); // pot ramp
    R(ctx, '#5a3a24', 5, 6, 1, 3);                                      // trunk
    R(ctx, '#3d8a4a', 2, 3, 7, 4); R(ctx, '#56a85e', 2, 3, 7, 1); R(ctx, '#2e6e38', 2, 6, 7, 1); // canopy ramp
    R(ctx, '#6fc070', 3, 3, 2, 1); R(ctx, '#6fc070', 6, 4, 2, 1);      // sun-lit leaves
  });
  atlas['fig-9'] = toy(ctx => { // UFO Catcher
    R(ctx, '#8a96a0', 1, 6, 9, 3); R(ctx, '#aab4bc', 1, 6, 9, 1); R(ctx, '#6e7882', 1, 8, 9, 1); // saucer ramp
    R(ctx, '#9fc4e8', 3, 3, 5, 3); R(ctx, '#c7e0f4', 3, 3, 2, 1);       // dome + shine
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
  addBigfoot(atlas);
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
  addFish(atlas, 'fish-rainkoi', '#7ca8c8');    // Rain Koi — rain-silver (rainy days only)
  addFish(atlas, 'fish-stargazer', '#b06ad0');  // Stargazer — night violet (meteor nights only)
  buildMisc(atlas);
  return atlas;
};
