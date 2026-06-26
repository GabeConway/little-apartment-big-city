// Little Apartment, Big City — scene tilemaps, warps, interactables, furniture slots.
// Grids are strings; every row in a scene must be the same length.

import type { SceneDef, TileDef } from './engine';
import { MUSEUM_SLOTS } from './data';

const T = (sprite: string, solid?: boolean): TileDef => (solid ? { sprite, solid } : { sprite });

// Shared legend pieces
const INTERIOR = {
  '#': T('t-wall-in', true),
  'P': T('t-wall-paper', true),
  'n': T('t-window-in', true),
  'D': T('t-door'),
  'm': T('t-doormat'),
  '.': T('t-wood'),
  '=': T('t-tatami'),
};
const SHOP = {
  '#': T('t-wall-in', true),
  'D': T('t-door'),
  '.': T('t-shopfloor'),
  'S': T('t-shelf', true),
  'C': T('t-counter', true),
  'F': T('t-fridge-case', true),
};
const OUTDOOR = {
  'w': T('t-sidewalk'),
  'r': T('t-road'),
  'l': T('t-road-line'),
  'g': T('t-grass'),
  's': T('t-sand'),
  '~': T('t-water-0', true),
  'V': T('t-vending', true),
  'D': T('t-door'),
  'A': T('t-bld-a', true),
  'B': T('t-bld-b', true),
  'C': T('t-bld-c', true),
  'Q': T('t-bld-plain', true),
  'a': T('t-awning-red', true),
  'b': T('t-awning-blue', true),
  'i': T('t-torii'),
  'j': T('t-torii', true),       // solid torii leg (decorative gate post)
  'n': T('t-torii-top', true),   // torii leg-top + crossbar (solid)
  'm': T('t-torii-beam'),        // torii crossbar over the walkable path
  'h': T('t-shrine', true),
  'T': T('t-tree', true),        // tree (solid)
  'o': T('t-rock', true),        // boulder (solid)
  'f': T('t-grass-v1'),          // flowering grass tuft (walkable)
};

// ---- Apartment -----------------------------------------------------------

export interface FurnitureSlot {
  itemId: string;
  x: number; y: number;     // tile coords of the sprite's top-left
  w: number; h: number;     // tile extent
  solid: boolean;
}

// One slot per furniture item. The futon occupies the bed slot until upgraded.
export const APARTMENT_SLOTS: FurnitureSlot[] = [
  { itemId: 'bed', x: 1, y: 1, w: 2, h: 1, solid: true },
  { itemId: 'tv', x: 6, y: 1, w: 1, h: 1, solid: true },
  { itemId: 'lamp', x: 9, y: 1, w: 1, h: 1, solid: true },
  { itemId: 'microwave', x: 11, y: 1, w: 1, h: 1, solid: true },
  { itemId: 'fridge', x: 13, y: 1, w: 1, h: 1, solid: true },
  { itemId: 'sofa', x: 5, y: 3, w: 2, h: 1, solid: true },
  { itemId: 'desk', x: 1, y: 4, w: 1, h: 1, solid: true },
  { itemId: 'bookshelf', x: 1, y: 6, w: 1, h: 1, solid: true },
  { itemId: 'plant', x: 14, y: 7, w: 1, h: 1, solid: true },
  { itemId: 'ac', x: 4, y: 0, w: 1, h: 1, solid: false }, // mounted on the wall
];

// Backrooms rare furniture default spots (legacy saves / migration).
export const RARE_SLOTS: FurnitureSlot[] = [
  { itemId: 'kotatsu', x: 7, y: 5, w: 2, h: 1, solid: true },
  { itemId: 'aquarium', x: 14, y: 1, w: 1, h: 1, solid: true },
  { itemId: 'arcade', x: 8, y: 1, w: 1, h: 1, solid: true },
  { itemId: 'neon', x: 10, y: 0, w: 1, h: 1, solid: false }, // on the wall
];

// Completing the gachapon set materializes a golden maneki-neko by the desk.
export const MANEKI_SLOT = { x: 3, y: 4 };

// Wall-mounted display shelf (3 tiles) for your gachapon figures. Appears once
// you own at least one figure; drawn + populated by the apartment draw loop. The
// x range (6..8 on the top wall row) is a wall in both the small and big grids.
export const SHELF_SLOT = { x: 6, y: 0, w: 3 };

const apartment: SceneDef = {
  id: 'apartment',
  name: 'Apt. 203',
  legend: INTERIOR,
  grid: [
    'PPPnnPPPPPPnnPPP',
    '#====..........#',
    '#====..........#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#...........mm.#',
    '############DD##',
  ],
  warps: [
    { x: 12, y: 9, to: 'city', tx: 6, ty: 14, dir: 'down' },
    { x: 13, y: 9, to: 'city', tx: 7, ty: 14, dir: 'down' },
  ],
  // Sleep is dynamic — wherever the bed (or default futon) is placed.
  interactables: [
    { id: 'window', x: 3, y: 0, w: 2, h: 1, label: 'Look outside' },
    { id: 'trophy-shelf', x: 6, y: 0, w: 3, h: 1, label: 'Trophy shelf' },
  ],
  npcs: [],
};

// The expanded apartment: once you've paid the landlord to "knock through to the
// next unit", `apartment.grid` is swapped to this at load/purchase (see
// applyApartmentSize in the main file). Same bottom door + windows so the city
// warps still line up; a divider wall with a 2-tile doorway joins the two rooms.
// Placement bounds derive from grid size (width-2 / height-2), so the new room is
// fully furnishable + decoratable with no other changes.
export const APARTMENT_BIG_GRID: string[] = [
  'PPPnnPPPPPPnnPP#PPnnPPP#',
  '#====..........#.......#',
  '#====..........#.......#',
  '#..............#.......#',
  '#......................#',
  '#......................#',
  '#..............#.......#',
  '#..............#.......#',
  '#...........mm.#.......#',
  '############DD##########',
];

// ---- City ------------------------------------------------------------------

const city: SceneDef = {
  id: 'city',
  name: 'Kawamachi St.',
  legend: {
    ...OUTDOOR,
    'H': T('t-apt-wall', true),    // Nakatomi Apartments facade (home building)
    'N': T('t-nakatomi-l', true),  // sign over the door: "NAKA"
    'K': T('t-nakatomi-r', true),  // sign over the door: "TOMI"
    'p': T('t-planter', true),     // flowering planter flanking the entrance
    'F': T('t-grass-v2'),          // clover/daisy grass detail (walkable)
    'E': T('t-gh-front', true),    // community greenhouse glass facade (east of home)
    'R': T('t-gh-roof', true),     // greenhouse pitched glass roof (over the facade)
    'G': T('t-gh-door'),           // greenhouse glass door (walk-in warp, gated)
    'J': T('t-board', true),       // odd-jobs notice board (errand giver)
  },
  outdoor: true,
  grid: [
    'BBBBBBBBBBAAAAAAAAAACCCCCCCQQQQQ',
    'BBBBBBBBBBAAAAAAAAAACCCCCCCQQQQQ',
    'bbbbDDbbbbaaaaDDaaaaCCCDDCCQDDQQ',
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwVwwwwwwwwwwwwwwwwwVwwwww',
    'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    'llllllllllllllllllllllllllllllll',
    'rrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwwwwwwwwwwwwwwwwwww',
    'gTggggwwggggggRRRRggggggggggggfg',
    'ggHHHHHHHHggggEEEEgggggggggggggg',
    'ggHHHHHHHHggggEEEEgggggggggggggg',
    'ggHHHHDDHHgJggEGGEggTgggggggggfg',
    'gggggpwwpggggggggggfgfgggggggggg',
    'wwwwwwwwgggggggggggggggnmmnggggg',
    'wwwwwwwwggggggggggggggojggjo~~gg',
    'ggggFgggggggggFggggggggggggg~~gg',
  ],
  warps: [
    { x: 4, y: 2, to: 'denden', tx: 8, ty: 8, dir: 'up' },
    { x: 5, y: 2, to: 'denden', tx: 9, ty: 8, dir: 'up' },
    { x: 14, y: 2, to: 'konbini', tx: 7, ty: 7, dir: 'up' },
    { x: 15, y: 2, to: 'konbini', tx: 8, ty: 7, dir: 'up' },
    { x: 23, y: 2, to: 'pawn', tx: 6, ty: 7, dir: 'up' },
    { x: 24, y: 2, to: 'pawn', tx: 7, ty: 7, dir: 'up' },
    { x: 28, y: 2, to: 'gacha', tx: 5, ty: 6, dir: 'up' },
    { x: 29, y: 2, to: 'gacha', tx: 6, ty: 6, dir: 'up' },
    { x: 6, y: 13, to: 'apartment', tx: 12, ty: 8, dir: 'up' },
    { x: 7, y: 13, to: 'apartment', tx: 13, ty: 8, dir: 'up' },
    // Community greenhouse (walk in — gated by greenhouseUnlocked in the warp check).
    { x: 15, y: 13, to: 'greenhouse', tx: 7, ty: 8, dir: 'up' },
    { x: 16, y: 13, to: 'greenhouse', tx: 8, ty: 8, dir: 'up' },
    { x: 0, y: 15, to: 'shore', tx: 22, ty: 3, dir: 'left' },
    { x: 0, y: 16, to: 'shore', tx: 22, ty: 4, dir: 'left' },
    { x: 31, y: 5, to: 'badtown', tx: 1, ty: 5, dir: 'right' },
    { x: 31, y: 6, to: 'badtown', tx: 1, ty: 5, dir: 'right' },
    { x: 31, y: 7, to: 'badtown', tx: 1, ty: 6, dir: 'right' },
    { x: 31, y: 8, to: 'badtown', tx: 1, ty: 8, dir: 'right' },
    { x: 31, y: 9, to: 'badtown', tx: 1, ty: 9, dir: 'right' },
    { x: 24, y: 17, to: 'shrine', tx: 9, ty: 8, dir: 'up' },
    { x: 25, y: 17, to: 'shrine', tx: 10, ty: 8, dir: 'up' },
  ],
  interactables: [
    { id: 'vending', x: 8, y: 4, label: 'Vending machine' },
    { id: 'vending', x: 26, y: 4, label: 'Vending machine' },
    { id: 'errand-board', x: 11, y: 13, label: 'Odd-jobs board' },
    { id: 'landlord', x: 9, y: 13, label: 'Lease office' },
  ],
  npcs: [
    { id: 'charlie', x: 17, y: 3, sprite: 'npc-charlie', dir: 'down' },
    { id: 'granny', x: 12, y: 16, sprite: 'npc-granny', dir: 'left' },
    // Yakuza enforcers blocking the alley to Downtown (removed once paid off).
    { id: 'yakuza', x: 30, y: 7, sprite: 'npc-yakuza', dir: 'left' },
    { id: 'yakuza', x: 30, y: 8, sprite: 'npc-yakuza', dir: 'left' },
    { id: 'yakuza', x: 30, y: 9, sprite: 'npc-yakuza', dir: 'left' },
  ],
};

// Store names painted onto tiles by the renderer, per scene. Each sign has its
// own look: bg/border panel, and optional neon blink.
export interface SceneSign {
  text: string; x: number; y: number; color: string;
  bg?: string; border?: string; blink?: boolean;
  font?: number;        // px size; >6 also switches to sans-serif for CJK glyphs
  vertical?: boolean;   // stacked characters, Kabukicho-style
}
export const SCENE_SIGNS: Record<string, SceneSign[]> = {
  city: [
    { text: 'NAKATOMI', x: 2, y: 12, color: '#ffd24a', bg: '#2a211c', border: '#c9a227', font: 7 },
    { text: '♥ ドキドキ でんき ♥', x: 1, y: 0, color: '#16181d', bg: '#ffd24a', border: '#d05050', font: 8 },
    { text: 'DOKI DOKI DISCOUNT', x: 1, y: 1, color: '#ffd24a', bg: 'rgba(0,0,0,0.55)' },
    { text: 'コンビニ 24時間・酒', x: 12, y: 0, color: '#7ce8a0', bg: '#0c2a1a', border: '#3da26b', blink: true, font: 8 },
    { text: 'KONBINI', x: 13, y: 1, color: '#7ce8a0', bg: 'rgba(0,0,0,0.55)' },
    { text: 'しちや 質', x: 22, y: 0, color: '#ffd24a', bg: '#3a2a1a', border: '#8a6644', font: 8 },
    { text: 'PAWN', x: 22, y: 1, color: '#e89a7c', bg: 'rgba(0,0,0,0.55)' },
    { text: 'ガチャ', x: 27, y: 0, color: '#fff', bg: '#e857a8', border: '#ffd5ec', blink: true, font: 8 },
    { text: 'GACHA!', x: 27, y: 1, color: '#e857a8', bg: 'rgba(0,0,0,0.55)' },
    { text: '⛩ SHRINE', x: 22, y: 14, color: '#e8a0a0', bg: 'rgba(0,0,0,0.35)' },
    { text: '< SHORE', x: 1, y: 15, color: '#9fc4e8', bg: 'rgba(0,0,0,0.45)' },
    { text: 'DOWNTOWN >', x: 26, y: 8, color: '#e857a8', bg: 'rgba(0,0,0,0.55)', blink: true },
  ],
  // Signs sit over the four venue facades of the 28-wide strip:
  // club N (cols 1-4), garage G (cols 7-10), casino K (cols 13-16), museum U (cols 19-24).
  badtown: [
    { text: 'クラブかいじゅう', x: 1, y: 0, color: '#aef0a0', bg: '#0f2a14', border: '#7ce8a0', blink: true, font: 8 },
    { text: 'CLUB KAIJU', x: 1, y: 1, color: '#e857a8', bg: 'rgba(0,0,0,0.55)' },
    { text: 'こじまモータース', x: 7, y: 0, color: '#ffd24a', bg: '#33302a', border: '#7a7468', font: 8 },
    { text: 'KOJIMA', x: 7, y: 1, color: '#cfc4ab', bg: 'rgba(0,0,0,0.55)' },
    { text: 'カジノ', x: 13, y: 0, color: '#16181d', bg: '#ffd24a', border: '#c9a227', font: 8, blink: true },
    { text: 'CASINO', x: 13, y: 1, color: '#ffd24a', bg: 'rgba(0,0,0,0.55)' },
    { text: 'はくぶつかん', x: 19, y: 0, color: '#16181d', bg: '#e8d8a0', border: '#c9a227', font: 8 },
    { text: 'MUSEUM', x: 19, y: 1, color: '#ffd24a', bg: 'rgba(0,0,0,0.55)' },
    { text: '< STATION ST.', x: 1, y: 8, color: '#9fc4e8', bg: 'rgba(0,0,0,0.45)' },
  ],
  museum: [
    { text: 'カワマチ びじゅつかん', x: 1, y: 9, color: '#3a3322', bg: '#e0d8c4', border: '#b08a50', font: 7 },
  ],
  nightclub: [
    { text: 'バー', x: 1, y: 0, color: '#ffd24a', bg: '#16121d', border: '#ffd24a', font: 8, blink: true },
    { text: '☄ KAIJU ☄', x: 9, y: 0, color: '#aef0a0', bg: '#0f2a14', border: '#7ce8a0', font: 7, blink: true },
  ],
  shore: [],
  garage: [
    { text: 'こじまモータース せいび', x: 2, y: 0, color: '#ffd24a', bg: '#33302a', border: '#c9a227', font: 8 },
    { text: 'オイル OIL', x: 14, y: 0, color: '#d05050', bg: '#e8e0d0', border: '#9e3a3a', font: 7 },
  ],
  shrine: [],
  greenhouse: [],
  island: [
    { text: 'きわみじま KIWAMI', x: 7, y: 3, color: '#16181d', bg: '#ffe9a0', border: '#b08a50', font: 8 },
  ],
  deepsea: [
    { text: '↓ HOME / SHORE', x: 5, y: 10, color: '#9fc4e8', bg: 'rgba(0,0,0,0.5)' },
  ],
  paris: [
    { text: 'CAFÉ DE LA LUNE', x: 1, y: 5, color: '#ffe9a0', bg: '#7a1f18', border: '#c0392b', font: 7 },
    { text: 'BOULANGERIE', x: 16, y: 5, color: '#ffd24a', bg: '#16304a', border: '#2e5e8e', font: 7 },
    { text: '↩ RETOUR', x: 2, y: 6, color: '#e8e0d0', bg: 'rgba(0,0,0,0.5)' },
    { text: 'PARIS, FRANCE', x: 9, y: 12, color: '#e8e0d0', bg: 'rgba(0,0,0,0.4)' },
  ],
};

// ---- Den Den Electric --------------------------------------------------------

const denden: SceneDef = {
  id: 'denden', // historical id — display name is Doki Doki Discount (keep id for save compat)
  name: 'Doki Doki Discount',
  legend: SHOP,
  grid: [
    '##################',
    '#SSSSSS....SSSSSS#',
    '#................#',
    '#....CCCC........#',
    '#................#',
    '#SSSS........SSSS#',
    '#................#',
    '#................#',
    '#................#',
    '########DD########',
  ],
  warps: [
    { x: 8, y: 9, to: 'city', tx: 4, ty: 3, dir: 'down' },
    { x: 9, y: 9, to: 'city', tx: 5, ty: 3, dir: 'down' },
  ],
  interactables: [{ id: 'shop-denden', x: 5, y: 3, w: 4, h: 1, label: 'Browse appliances' }],
  npcs: [{ id: 'clerk-denden', x: 6, y: 2, sprite: 'npc-denden', dir: 'down' }],
};

// ---- Konbini ------------------------------------------------------------------

const konbini: SceneDef = {
  id: 'konbini',
  name: 'Konbini 24h',
  legend: { ...SHOP, 'Z': T('t-freezer', true) },
  grid: [
    '################',
    '#FFFZ......SSSS#',
    '#..............#',
    '#...CCC........#',
    '#..............#',
    '#SSSS......SSSS#',
    '#..............#',
    '#..............#',
    '#######DD#######',
  ],
  warps: [
    { x: 7, y: 8, to: 'city', tx: 14, ty: 3, dir: 'down' },
    { x: 8, y: 8, to: 'city', tx: 15, ty: 3, dir: 'down' },
  ],
  interactables: [
    { id: 'shop-konbini', x: 4, y: 3, w: 3, h: 1, label: 'Counter' },
    // The walk-in freezer. No prompt until you've been through once.
    { id: 'portal', x: 4, y: 1, label: 'Walk-in freezer' },
  ],
  npcs: [{ id: 'clerk-konbini', x: 5, y: 2, sprite: 'npc-konbini', dir: 'down' }],
};

// ---- Pawn shop ------------------------------------------------------------------

const pawn: SceneDef = {
  id: 'pawn',
  name: 'Kawamachi Pawn',
  legend: { ...SHOP, '.': T('t-wood') },
  grid: [
    '#############',
    '#SS.......SS#',
    '#...........#',
    '#...CCC.....#',
    '#...........#',
    '#...........#',
    '#SS......SS.#',
    '#...........#',
    '######DD#####',
  ],
  warps: [
    { x: 6, y: 8, to: 'city', tx: 23, ty: 3, dir: 'down' },
    { x: 7, y: 8, to: 'city', tx: 24, ty: 3, dir: 'down' },
  ],
  interactables: [{ id: 'shop-pawn', x: 4, y: 3, w: 3, h: 1, label: "Today's finds" }],
  npcs: [{ id: 'clerk-pawn', x: 5, y: 2, sprite: 'npc-pawn', dir: 'down' }],
};

// ---- Shore ------------------------------------------------------------------------

const shore: SceneDef = {
  id: 'shore',
  name: 'Sumikawa Shore',
  legend: { ...OUTDOOR, 'U': T('t-parasol', true), 'J': T('t-crate', true) },
  outdoor: true,
  grid: [
    'gggggggggggggggggggggggg',
    'gggggggggggggggggggggggg',
    'gggggggggggggggggggggggg',
    'ggggggUJggggggggggggwwww',
    'ggggggggggggggggggggwwww',
    'ssssssssssssssssssssssss',
    'ssssssssssssssssssssssss',
    'ssssssssssssssssssssssss',
    'ssssssssssssssssssssssss',
    '~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~',
  ],
  warps: [
    { x: 23, y: 3, to: 'city', tx: 1, ty: 15, dir: 'right' },
    { x: 23, y: 4, to: 'city', tx: 1, ty: 16, dir: 'right' },
  ],
  // The whole waterline is fishable: stand on the sand, face the water.
  // Deep spot (needs the skiff) listed first so it wins the overlap.
  interactables: [
    { id: 'boat', x: 2, y: 9, w: 2, h: 1, label: 'The skiff' },
    { id: 'fish-spot', x: 0, y: 9, w: 24, h: 1, label: 'Fish' },
  ],
  npcs: [
    { id: 'old-man', x: 4, y: 7, sprite: 'npc-oldman', dir: 'down' },
    { id: 'tex', x: 6, y: 4, sprite: 'npc-hatvendor', dir: 'down' },
    // David + his campfire only appear on even-numbered nights (gated in code).
    { id: 'campfire', x: 13, y: 6, sprite: 'prop-campfire', dir: 'down' },
    { id: 'david', x: 14, y: 6, sprite: 'npc-vampire', dir: 'left' },
  ],
};

// ---- Bad side of town -----------------------------------------------------------

const BADTOWN_L = {
  'p': T('t-sidewalk-bad'),
  'E': T('t-bld-neon', true),
  'q': T('t-chochin', true),
  'r': T('t-asphalt'),
  'N': T('t-bld-club', true),
  'G': T('t-bld-garage', true),
  'X': T('t-bld-grim', true),
  'F': T('t-graffiti', true),
  'L': T('t-streetlamp', true),  // Tokyo street lamp post (replaced the trash piles)
  'V': T('t-vending-dead', true),
  'D': T('t-door'),
  'K': T('t-casino-front', true), // gold marquee facade over the casino entrance
  'U': T('t-museum-front', true), // neoclassical stone facade over the museum entrance
  'B': T('t-dumpster', true),     // grimy dumpster tucked in the back corner (hides a stray)
};

const badtown: SceneDef = {
  id: 'badtown', // historical id — display name Kabukicho (save compat)
  name: 'Downtown',
  legend: BADTOWN_L,
  outdoor: true,
  // Denser 28-wide neon strip: four venues (club / garage / casino / museum)
  // packed close together, separated by neon (E) and grim (X) buildings.
  grid: [
    'ENNNNEEGGGGXEKKKKXEUUUUUUEEX',
    'ENNNNEEGGGGXEKKKKXEUUUUUUEEX',
    'ENDDNEEGDDGXEKDDKXEUUDDUUEEX',
    'qppppLppppppqppppLqpppppppLp',
    'ppppppVppppppppppppppppppppp',
    'rrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    'pppppppppppppppppppppppppppp',
    'pppppppppppppppppppppppppppp',
    'pppppppppppppppppppppppppppp',
    'pppppppppppppppppppppppppppp',
    'pBppppLpppppppLppppppLpppppp',
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFF',
  ],
  warps: [
    { x: 0, y: 5, to: 'city', tx: 30, ty: 5, dir: 'left' },
    { x: 0, y: 6, to: 'city', tx: 30, ty: 7, dir: 'left' },
    { x: 0, y: 8, to: 'city', tx: 30, ty: 8, dir: 'left' },
    { x: 0, y: 9, to: 'city', tx: 30, ty: 9, dir: 'left' },
    // Nightclub — door cols 2-3
    { x: 2, y: 2, to: 'nightclub', tx: 7, ty: 8, dir: 'up' },
    { x: 3, y: 2, to: 'nightclub', tx: 8, ty: 8, dir: 'up' },
    // Garage — door cols 8-9
    { x: 8, y: 2, to: 'garage', tx: 8, ty: 7, dir: 'up' },
    { x: 9, y: 2, to: 'garage', tx: 9, ty: 7, dir: 'up' },
    // Casino — door cols 14-15
    { x: 14, y: 2, to: 'casino', tx: 7, ty: 7, dir: 'up' },
    { x: 15, y: 2, to: 'casino', tx: 8, ty: 7, dir: 'up' },
    // Museum — door cols 21-22
    { x: 21, y: 2, to: 'museum', tx: 7, ty: 8, dir: 'up' },
    { x: 22, y: 2, to: 'museum', tx: 8, ty: 8, dir: 'up' },
  ],
  interactables: [
    { id: 'vending-dead', x: 6, y: 4, label: 'Vending machine?' },
    { id: 'cat-dumpster', x: 1, y: 11, label: 'Rummage' },
  ],
  npcs: [{ id: 'sketchy', x: 24, y: 11, sprite: 'npc-sketchy', dir: 'left' }],
};

// ---- Nightclub --------------------------------------------------------------------

const nightclub: SceneDef = {
  id: 'nightclub',
  name: 'Club Kaiju',
  legend: {
    '#': T('t-wall-in', true),
    'D': T('t-door'),
    '.': T('t-club-floor'),
    'd': T('t-dance-0'),
    'C': T('t-counter', true),
    'J': T('t-djbooth', true),
  },
  grid: [
    '################',
    '#..............#',
    '#CCCC......JJJJ#',
    '#..............#',
    '#...dddddddd...#',
    '#...dddddddd...#',
    '#...dddddddd...#',
    '#...dddddddd...#',
    '#..............#',
    '#######DD#######',
  ],
  warps: [
    { x: 7, y: 9, to: 'badtown', tx: 2, ty: 3, dir: 'down' },
    { x: 8, y: 9, to: 'badtown', tx: 3, ty: 3, dir: 'down' },
  ],
  interactables: [{ id: 'bar', x: 1, y: 2, w: 4, h: 1, label: 'Bar' }],
  npcs: [
    { id: 'bartender', x: 2, y: 1, sprite: 'npc-bartender', dir: 'down' },
    { id: 'dj', x: 12, y: 1, sprite: 'npc-dj', dir: 'down' },
    { id: 'dancer', x: 5, y: 5, sprite: 'npc-dancer', dir: 'right' },
    { id: 'dancer2', x: 9, y: 6, sprite: 'npc-dancer', dir: 'left' },
    { id: 'dancer3', x: 7, y: 4, sprite: 'npc-dancer', dir: 'down' },
    { id: 'dancer4', x: 10, y: 7, sprite: 'npc-dancer', dir: 'up' },
    { id: 'kaiju', x: 13, y: 6, sprite: 'npc-kaiju', dir: 'left' },
  ],
};

// ---- Kojima Motors -----------------------------------------------------------------

const garage: SceneDef = {
  id: 'garage',
  name: 'Kojima Motors',
  legend: {
    '#': T('t-wall-in', true),
    'D': T('t-door'),
    '.': T('t-garage-floor'),
    'o': T('t-garage-stain'),
    'M': T('t-metal', true),
    'T': T('t-toolbench', true),
    'C': T('t-counter', true),
    'P': T('t-lift', true),
    'Y': T('t-tires', true),
    'Z': T('t-hazard'),
  },
  grid: [
    '##################',
    '#MMMMMMMM....TTTT#',
    '#PP......Y......Y#',
    '#PP..o...........#',
    '#............o...#',
    '#....CCC.........#',
    '#..o.............#',
    '#.......ZZ.......#',
    '########DD########',
  ],
  warps: [
    { x: 8, y: 8, to: 'badtown', tx: 8, ty: 3, dir: 'down' },
    { x: 9, y: 8, to: 'badtown', tx: 9, ty: 3, dir: 'down' },
  ],
  interactables: [{ id: 'shop-garage', x: 5, y: 5, w: 3, h: 1, label: 'Vehicles' }],
  npcs: [{ id: 'mechanic', x: 6, y: 4, sprite: 'npc-mechanic', dir: 'down' }],
};

// ---- Gacha hall ---------------------------------------------------------------------

const gacha: SceneDef = {
  id: 'gacha',
  name: 'Gacha Gacha',
  legend: {
    '#': T('t-wall-in', true),
    'D': T('t-door'),
    '.': T('t-shopfloor'),
    'G': T('t-gacha', true),
  },
  grid: [
    '############',
    '#GG.GG.GG.G#',
    '#..........#',
    '#..........#',
    '#GG......GG#',
    '#..........#',
    '#..........#',
    '#####DD#####',
  ],
  warps: [
    { x: 5, y: 7, to: 'city', tx: 28, ty: 3, dir: 'down' },
    { x: 6, y: 7, to: 'city', tx: 29, ty: 3, dir: 'down' },
  ],
  interactables: [
    { id: 'gacha', x: 1, y: 1, w: 10, h: 1, label: 'Gachapon ¥300' },
    { id: 'gacha', x: 1, y: 4, w: 2, h: 1, label: 'Gachapon ¥300' },
    { id: 'gacha', x: 9, y: 4, w: 2, h: 1, label: 'Gachapon ¥300' },
  ],
  npcs: [{ id: 'collector', x: 8, y: 2, sprite: 'npc-collector', dir: 'down' }],
};

// ---- The backrooms (behind the konbini wall) -------------------------------------------

const backrooms: SceneDef = {
  id: 'backrooms',
  name: '???',
  legend: {
    '#': T('t-backwall', true),
    '.': T('t-backfloor'),
    'O': T('t-portal-0'),
    'H': T('t-hole'),
    'E': T('t-paris-portal', true), // the secret Paris seam (top wall); only "opens" once parisRevealed
  },
  grid: [
    '########E#########',
    '#................#',
    '#..##....##......#',
    '#..##....##......#',
    '#................#',
    '#......##........#',
    '#................#',
    '#..##........##..#',
    '#................#',
    '#.O..........H...#',
    '#................#',
    '##################',
  ],
  warps: [],
  interactables: [
    { id: 'portal-exit', x: 2, y: 9, label: 'Step back through' },
    { id: 'descend', x: 13, y: 9, label: 'Climb down' },
    // Faced from tile (8,1); the hacker transition fires only when parisRevealed.
    { id: 'paris-portal', x: 8, y: 0, label: 'A faint seam in the wall' },
  ],
  npcs: [
    { id: 'monster', x: 13, y: 3, sprite: 'npc-monster', dir: 'down' },
    { id: 'tourist', x: 6, y: 6, sprite: 'npc-tourist', dir: 'down' },
  ],
};

// ---- The mines (below the backrooms) -------------------------------------------------

const mines: SceneDef = {
  id: 'mines',
  name: 'The Down There',
  legend: {
    '#': T('t-cave-wall', true),
    '.': T('t-cave-floor'),
    'L': T('t-ladder-up'),
  },
  grid: [
    '####################',
    '#L........#####....#',
    '#......##......#...#',
    '#..#...##..........#',
    '#..#............#..#',
    '#.....####......#..#',
    '#.....#..##........#',
    '#..........#####...#',
    '#...###............#',
    '#...###....##......#',
    '#..........##...#..#',
    '#..................#',
    '####################',
  ],
  warps: [],
  // The descend ladder ('t-ladder-down') is placed at a seeded-random floor tile
  // each floor by mineLayoutFor (state.ts) and handled dynamically — NOT a static
  // interactable. Only the climb-up ladder is fixed.
  interactables: [{ id: 'ascend', x: 1, y: 1, label: 'Climb up' }],
  npcs: [],
};

// ---- Shrine grounds ------------------------------------------------------------------

const shrine: SceneDef = {
  id: 'shrine',
  name: 'Shrine',
  legend: {
    'T': T('t-tree', true),
    'g': T('t-grass'),
    'p': T('t-stonepath'),
    'q': T('t-sakura-petals'),     // fallen petals beside the path (walkable)
    'R': T('t-shrine-roof', true), // hip roof — slate tiles + gold ridge
    'r': T('t-shrine-roof-l', true), // upturned left eave (curls up)
    'e': T('t-shrine-roof-r', true), // upturned right eave
    'G': T('t-shrine-peak', true), // gable peak with crossed chigi finials
    'W': T('t-shrine-wall', true), // vermillion honden facade w/ shoji
    'D': T('t-shrine-door', true), // honden entrance: bell rope + dark doorway
    'v': T('t-shrine-veranda', true), // wooden engawa platform across the hall front
    'b': T('t-saisen', true),      // saisen-bako — the offering box (interactable)
    'k': T('t-komainu', true),     // guardian lion-dog on a pedestal
    'L': T('t-lantern', true),     // paper lantern (KEEP 'L' — main-file night glow scans it)
    'O': T('t-toro', true),        // stone ishidoro lantern (KEEP 'O' — night glow scans it)
    'z': T('t-temizuya', true),    // water purification basin (chozubachi)
    'i': T('t-torii', true),       // torii leg (lower)
    'y': T('t-torii-top', true),   // torii leg-top + kasagi crossbar
    'x': T('t-torii-beam'),        // crossbar over the path — walkable, pass under it
    'X': T('t-torii-beam-path'),   // crossbar where the stone path runs under the gate
    'C': T('t-sakura', true),      // cherry-blossom tree
    'M': T('t-maple', true),       // autumn maple
  },
  outdoor: true,
  // Procession reads bottom→top: torii gate → sando path (flanked by lanterns &
  // komainu) → temizuya → honden hall, with the saisen-bako ('b') front & centre.
  grid: [
    'TTCTMTggggggggMTTCTT',
    'TgggggrRRGGRRegggggT',
    'TgggggrRRRRRRegggggT',
    'TgggggWWWDDWWWgggggT',
    'TgggggvvvbbvvvgggggT',
    'TggggOgkgppgkgOggggT',
    'TgggggggqppqgggggggT',
    'TgCgzOgggppgggOgMggT',
    'TgggggLgyXXygLgggggT',
    'TgggggggippigggggggT',
    'TTTTTTTTTppTTTTTTTTT',
  ],
  warps: [
    { x: 9, y: 10, to: 'city', tx: 24, ty: 13, dir: 'up' },
    { x: 10, y: 10, to: 'city', tx: 25, ty: 13, dir: 'up' },
  ],
  interactables: [{ id: 'shrine', x: 9, y: 4, w: 2, h: 1, label: 'Offer ¥500 at the saisen-bako' }],
  // Yoshi paces the open forecourt (roomy on three sides) instead of the cramped
  // slot between the komainu and the stone lantern, where she used to pin herself.
  npcs: [{ id: 'miko', x: 7, y: 6, sprite: 'npc-miko', dir: 'down' }],
};

// ---- Community Greenhouse (off the shrine grounds) -----------------------------------
// Granny Soto's glass house. Plant a sunflower in a soil plot, flip the sprinklers
// on, and it climbs a stage each watered morning until it blooms — then harvest it.
// Built to extend toward a small farming sim (see CROPS in data.ts + GREENHOUSE_PLOTS).

// Plot tile coords inside the greenhouse, indexed to save.greenhouse.plots[i].
// Three rows of three; save.greenhouse.beds (3/6/9) decides how many are tilled.
export const GREENHOUSE_PLOTS: { x: number; y: number }[] = [
  { x: 3, y: 2 }, { x: 7, y: 2 }, { x: 11, y: 2 },
  { x: 3, y: 4 }, { x: 7, y: 4 }, { x: 11, y: 4 },
  { x: 3, y: 6 }, { x: 7, y: 6 }, { x: 11, y: 6 },
];

const greenhouse: SceneDef = {
  id: 'greenhouse',
  name: 'Community Greenhouse',
  legend: {
    'R': T('t-gh-roof', true),
    'G': T('t-gh-glass', true),
    'H': T('t-gh-vine', true),
    'P': T('t-gh-plant', true),
    '.': T('t-gh-floor'),
    'o': T('t-gh-soil', true),
    'v': T('t-gh-counter-l', true),  // Granny's supply counter — left half (seeds / fertilizer / upgrades)
    'w': T('t-gh-counter-r', true),  // supply counter — right half
    'b': T('t-gh-shipbox', true),    // shipping box — harvest sells here at dawn
    'Y': T('t-gh-poster', true),
    'D': T('t-door'),
  },
  grid: [
    'RRRRRRRRRRRRRRRR',
    'G...HYH........G',
    'G..o...o...o...G',
    'G..............G',
    'G..o...o...o...G',
    'G..............G',
    'G..o...o...o...G',
    'G..............G',
    'G.vw.......b...G',
    'GGGGGGGDDGGGGGGG',
  ],
  warps: [
    { x: 7, y: 9, to: 'city', tx: 16, ty: 14, dir: 'down' },
    { x: 8, y: 9, to: 'city', tx: 17, ty: 14, dir: 'down' },
  ],
  interactables: [
    ...GREENHOUSE_PLOTS.map(p => ({ id: 'gh-plot', x: p.x, y: p.y, label: 'Soil plot' })),
    { id: 'gh-supply', x: 2, y: 8, label: 'Granny\'s supply counter' },
    { id: 'gh-supply', x: 3, y: 8, label: 'Granny\'s supply counter' },
    { id: 'gh-shipbox', x: 11, y: 8, label: 'Shipping box' },
    { id: 'gh-poster', x: 5, y: 1, label: 'Notice' },
  ],
  npcs: [],
};

// ---- Kiwami Island (by skiff from the shore) --------------------------------------------

const island: SceneDef = {
  id: 'island',
  name: 'Kiwami Island',
  legend: {
    '~': T('t-water-0', true),
    's': T('t-sand'),
    'g': T('t-grass'),
    'P': T('t-tree', true), // coconut palms
    'K': T('t-tiki', true),
    'Z': T('t-zama-poster', true), // ZamaZonk billboard
  },
  outdoor: true,
  grid: [
    '~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~ssssssssssss~~~~~',
    '~~~ssssssssssssssss~~~',
    '~~ssgggggggggKKKggss~~',
    '~~ssgPgggggggggPggss~~',
    '~~ssggggggPgggggggss~~',
    '~~ssssssssZsssssssss~~',
    '~~~~ssssssssssssss~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~',
  ],
  warps: [],
  interactables: [
    { id: 'boat-island', x: 4, y: 7, w: 2, h: 1, label: 'The skiff' },
    { id: 'tiki', x: 13, y: 3, w: 3, h: 1, label: 'Tiki bar' },
    { id: 'zama-poster', x: 10, y: 6, label: 'Read the poster' },
    { id: 'coconut', x: 5, y: 4, label: 'Coconut palm' },
    { id: 'coconut', x: 15, y: 4, label: 'Coconut palm' },
    { id: 'coconut', x: 10, y: 5, label: 'Coconut palm' },
    { id: 'fish-tropical', x: 4, y: 8, w: 14, h: 1, label: 'Fish' },
  ],
  npcs: [{ id: 'tiki', x: 14, y: 2, sprite: 'npc-hatvendor', dir: 'down' }],
};

// ---- Open water (take the skiff out from the shore) -----------------------------------

const deepsea: SceneDef = {
  id: 'deepsea',
  name: 'Sumikawa Bay',
  legend: {
    '~': T('t-water-0', true),  // border swell — keeps the skiff in the bay
    'o': T('t-water-0'),        // open water, sail freely
    'b': T('t-buoy', true),
  },
  outdoor: true,
  grid: [
    '~~~~~~~~~~~~~~~~~~~~',
    '~oooooooooooooooooo~',
    '~oooooooooooooooooo~',
    '~oooboooooooooooooo~',
    '~oooooooooooooooooo~',
    '~oooooooooooooooooo~',
    '~oooooooooooooobooo~',
    '~oooooooooooooooooo~',
    '~oooooooooooooooooo~',
    '~oooobooooooooooooo~',
    '~oooooooooooooooooo~',
    '~oooooooooooooooooo~',
  ],
  // The whole bottom edge is the way home — sail south from anywhere.
  warps: Array.from({ length: 18 }, (_, i) => ({
    x: i + 1, y: 11, to: 'shore', tx: 3, ty: 8, dir: 'down' as const,
  })),
  interactables: [],
  npcs: [],
};

// ---- Kinryū Lounge — yakuza casino (off the Downtown neon strip) ----------------------

const casino: SceneDef = {
  id: 'casino',
  name: 'Kinryū Lounge',
  legend: {
    '#': T('t-casino-wall', true),
    '.': T('t-casino-carpet'),
    'S': T('t-slot', true),
    'B': T('t-blackjack', true),
    'R': T('t-roulette', true),
    'r': T('t-roulette-felt', true),
    'D': T('t-door'),
  },
  grid: [
    '################',
    '#SS.SS.SS.SS.SS#',
    '#..............#',
    '#...B.....B....#',
    '#..............#',
    '#......Rr......#',
    '#SS.SS....SS.SS#',
    '#..............#',
    '#..............#',
    '#######DD#######',
  ],
  warps: [
    { x: 7, y: 9, to: 'badtown', tx: 14, ty: 3, dir: 'down' },
    { x: 8, y: 9, to: 'badtown', tx: 15, ty: 3, dir: 'down' },
  ],
  interactables: [
    { id: 'casino-slots', x: 1, y: 1, w: 14, h: 1, label: 'Slot machine' },
    { id: 'casino-slots', x: 1, y: 6, w: 5, h: 1, label: 'Slot machine' },
    { id: 'casino-slots', x: 10, y: 6, w: 5, h: 1, label: 'Slot machine' },
    { id: 'casino-blackjack', x: 4, y: 3, w: 1, h: 1, label: 'Blackjack table' },
    { id: 'casino-blackjack', x: 10, y: 3, w: 1, h: 1, label: 'Blackjack table' },
    { id: 'casino-roulette', x: 7, y: 5, w: 2, h: 1, label: 'Roulette table' },
  ],
  npcs: [{ id: 'casino-host', x: 7, y: 3, sprite: 'npc-casino', dir: 'down' }],
};

// ---- Paris (the secret entrance behind the backrooms) ---------------------------------
// Reached only via the hacker transition from the backrooms seam (parisRevealed).
// Eiffel Tower against the sky, café + boulangerie awnings, cobble plaza, the Seine.

const paris: SceneDef = {
  id: 'paris',
  name: 'Paris, France',
  legend: {
    'P': T('t-paris-bld', true),
    'k': T('t-paris-sky', true),
    'c': T('t-cobble'),
    'a': T('t-cafe-awning', true),
    'b': T('t-boulangerie', true),
    'D': T('t-paris-door'),
    'T': T('t-paris-tree', true),
    'q': T('t-quay'),
    'w': T('t-water-0', true),
    // The Eiffel Tower is no longer tiles — it's one big sprite blitted over the
    // sky in the paris draw block (see LittleApartmentGame.tsx).
  },
  outdoor: true,
  // Big open sky (rows 0-7) for the Eiffel to rise into; cafe + boulangerie stand
  // on the horizon; the cobble quay + Seine are the walkable foreground.
  grid: [
    'PPkkkkkkkkkkkkkkkkkkkkkkPP',
    'PPkkkkkkkkkkkkkkkkkkkkkkPP',
    'PPkkkkkkkkkkkkkkkkkkkkkkPP',
    'PPkkkkkkkkkkkkkkkkkkkkkkPP',
    'PPkkkkkkkkkkkkkkkkkkkkkkPP',
    'PPkkkkkkkkkkkkkkkkkkkkkkPP',
    'PaaakkkkkkkkkkkkkkkkkkbbbP',
    'PaDDkkkkkkkkkkkkkkkkkkbbbP',
    'cccccccccccccccccccccccccc',
    'cccTccccTccccccccTccccTccc',
    'qqqqqqqqqqqqqqqqqqqqqqqqqq',
    'wwwwwwwwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwwwwwwwwwwwww',
    'wwwwwwwwwwwwwwwwwwwwwwwwww',
  ],
  warps: [
    { x: 2, y: 7, to: 'backrooms', tx: 8, ty: 2, dir: 'down' },
    { x: 3, y: 7, to: 'backrooms', tx: 8, ty: 2, dir: 'down' },
  ],
  interactables: [
    { id: 'seine', x: 0, y: 10, w: 26, h: 2, label: 'The Seine' },
  ],
  npcs: [
    { id: 'baguette', x: 16, y: 8, sprite: 'npc-tourist', dir: 'down' },
  ],
};

// ---- The Museum (off the Downtown plaza) ----------------------------------------------
// Bingus Doofelsmurt's gallery. Pedestals ('p') and wall frames ('A') are the
// empty display slots (positions mirror MUSEUM_SLOTS in data.ts); the player
// donates found objects to fill them. One generic 'museum-display' interactable
// is generated per slot from MUSEUM_SLOTS so the data table is the single source.

const museum: SceneDef = {
  id: 'museum',
  name: 'Kawamachi Museum',
  legend: {
    '#': T('t-museum-wall', true),
    '.': T('t-museum-floor'),
    'p': T('t-pedestal', true),     // empty display plinth (objects of interest)
    'A': T('t-frame-empty', true),  // empty wall art frame
    'D': T('t-door'),
    'm': T('t-doormat'),
  },
  grid: [
    '##A##A##A##A####',
    '#..............#',
    '#.p..p..p..p...#',
    '#..............#',
    '#.p..p..p..p...#',
    '#..............#',
    '#..............#',
    '#..............#',
    '#......mm......#',
    '#######DD#######',
  ],
  warps: [
    { x: 7, y: 9, to: 'badtown', tx: 21, ty: 3, dir: 'down' },
    { x: 8, y: 9, to: 'badtown', tx: 22, ty: 3, dir: 'down' },
  ],
  // One interactable per display slot — id 'museum-display', resolved by tile.
  interactables: MUSEUM_SLOTS.map(sl => ({ id: 'museum-display', x: sl.x, y: sl.y, label: sl.label })),
  npcs: [{ id: 'bingus', x: 8, y: 6, sprite: 'npc-bingus', dir: 'down' }],
};

export const SCENES: Record<string, SceneDef> = {
  apartment, city, denden, konbini, pawn, shore, badtown, nightclub, garage, gacha, backrooms, mines, shrine, greenhouse, island, deepsea, casino, paris, museum,
};
