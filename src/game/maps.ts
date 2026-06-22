// Little Apartment, Big City — scene tilemaps, warps, interactables, furniture slots.
// Grids are strings; every row in a scene must be the same length.

import type { SceneDef, TileDef } from './engine';

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

// Placement spots — any compatible item can be placed at any free spot.
export interface PlacementSpot { x: number; y: number; kind: 'wall' | 'wide' | 'single'; label: string }
export const PLACEMENT_SPOTS: PlacementSpot[] = [
  { x: 4, y: 0, kind: 'wall', label: 'wall, by the window' },
  { x: 6, y: 0, kind: 'wall', label: 'wall, center' },
  { x: 10, y: 0, kind: 'wall', label: 'wall, east side' },
  { x: 1, y: 1, kind: 'wide', label: 'the tatami nook' },
  { x: 5, y: 3, kind: 'wide', label: 'middle of the room' },
  { x: 7, y: 5, kind: 'wide', label: 'open floor, center' },
  { x: 6, y: 1, kind: 'single', label: 'north wall, left' },
  { x: 8, y: 1, kind: 'single', label: 'north wall, center' },
  { x: 9, y: 1, kind: 'single', label: 'north wall, right' },
  { x: 11, y: 1, kind: 'single', label: 'kitchen, left' },
  { x: 13, y: 1, kind: 'single', label: 'kitchen, corner' },
  { x: 14, y: 1, kind: 'single', label: 'kitchen, by the wall' },
  { x: 1, y: 4, kind: 'single', label: 'west wall nook' },
  { x: 1, y: 6, kind: 'single', label: 'southwest corner' },
  { x: 3, y: 6, kind: 'single', label: 'open floor, south' },
  { x: 11, y: 5, kind: 'single', label: 'open floor, east' },
  { x: 14, y: 7, kind: 'single', label: 'by the door' },
];

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
  ],
  npcs: [],
};

// ---- City ------------------------------------------------------------------

const city: SceneDef = {
  id: 'city',
  name: 'Kawamachi St.',
  legend: OUTDOOR,
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
    'gTggggwwggggggggggggggggggggggfg',
    'ggQQQQQQQQgggggggggggggggggggggg',
    'ggQQQQQQQQgggggggggggggggggggggg',
    'ggQQQQDDQQggggggggggTgggggggggfg',
    'ggggggwwgggggggggggfgfgggggggggg',
    'wwwwwwwwgggggggggggggggnmmnggggg',
    'wwwwwwwwggggggggggggggojggjo~~gg',
    'gggggggggggggggggggggggggggg~~gg',
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
  ],
  npcs: [
    { id: 'tony', x: 17, y: 3, sprite: 'npc-skater', dir: 'down' },
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
    { text: '♥ ドキドキ でんき ♥', x: 1, y: 0, color: '#16181d', bg: '#ffd24a', border: '#d05050', font: 8 },
    { text: 'DOKI DOKI DISCOUNT', x: 1, y: 1, color: '#ffd24a', bg: 'rgba(0,0,0,0.55)' },
    { text: 'コンビニ 24時間・酒', x: 12, y: 0, color: '#7ce8a0', bg: '#0c2a1a', border: '#3da26b', blink: true, font: 8 },
    { text: 'KONBINI', x: 13, y: 1, color: '#7ce8a0', bg: 'rgba(0,0,0,0.55)' },
    { text: 'しちや 質', x: 22, y: 0, color: '#ffd24a', bg: '#3a2a1a', border: '#8a6644', font: 8 },
    { text: 'PAWN', x: 22, y: 1, color: '#e89a7c', bg: 'rgba(0,0,0,0.55)' },
    { text: 'ガチャ', x: 27, y: 0, color: '#fff', bg: '#e857a8', border: '#ffd5ec', blink: true, font: 8 },
    { text: 'GACHA!', x: 27, y: 1, color: '#e857a8', bg: 'rgba(0,0,0,0.55)' },
    { text: 'メゾンかわ MAISON KAWA', x: 2, y: 12, color: '#cfc4ab', bg: '#3a362f', border: '#5d6470' },
    { text: '⛩ SHRINE', x: 22, y: 14, color: '#e8a0a0', bg: 'rgba(0,0,0,0.35)' },
    { text: '< SHORE', x: 1, y: 15, color: '#9fc4e8', bg: 'rgba(0,0,0,0.45)' },
    { text: 'DOWNTOWN >', x: 26, y: 8, color: '#e857a8', bg: 'rgba(0,0,0,0.55)', blink: true },
  ],
  badtown: [
    { text: '☄ クラブかいじゅう ☄', x: 1, y: 0, color: '#aef0a0', bg: '#0f2a14', border: '#7ce8a0', blink: true, font: 8 },
    { text: 'CLUB KAIJU', x: 2, y: 1, color: '#e857a8', bg: 'rgba(0,0,0,0.55)' },
    { text: '怪', x: 8, y: 0, color: '#aef0a0', bg: '#0f2a14', border: '#7ce8a0', vertical: true, font: 9, blink: true },
    { text: 'こじまモータース', x: 11, y: 0, color: '#ffd24a', bg: '#33302a', border: '#7a7468', font: 8 },
    { text: 'KOJIMA MOTORS', x: 11, y: 1, color: '#cfc4ab', bg: 'rgba(0,0,0,0.55)' },
    { text: 'しゅうり', x: 18, y: 0, color: '#ffd24a', bg: '#33302a', border: '#7a7468', vertical: true, font: 8 },
    { text: 'カラオケ', x: 20, y: 0, color: '#7ce8e0', bg: '#16121d', border: '#7ce8e0', vertical: true, font: 8, blink: true },
    { text: 'ホテル', x: 22, y: 0, color: '#e857a8', bg: '#16121d', border: '#e857a8', vertical: true, font: 8 },
    { text: 'パチンコ', x: 24, y: 0, color: '#ffd24a', bg: '#16121d', border: '#ffd24a', vertical: true, font: 8, blink: true },
    { text: 'いざかや', x: 26, y: 0, color: '#7ce8a0', bg: '#16121d', border: '#7ce8a0', vertical: true, font: 8 },
    { text: '< STATION ST.', x: 1, y: 8, color: '#9fc4e8', bg: 'rgba(0,0,0,0.45)' },
  ],
  shore: [
    { text: "ぼうし TEX'S HATS", x: 4, y: 2, color: '#e8e0d0', bg: '#6e4a2f', border: '#b08a50', font: 7 },
  ],
  garage: [
    { text: 'こじまモータース せいび', x: 2, y: 0, color: '#ffd24a', bg: '#33302a', border: '#c9a227', font: 8 },
    { text: 'オイル OIL', x: 14, y: 0, color: '#d05050', bg: '#e8e0d0', border: '#9e3a3a', font: 7 },
  ],
  shrine: [
    { text: 'よし神社 YOSHI SHRINE', x: 6, y: 1, color: '#fff', bg: '#8e2a1e', border: '#ffd24a', font: 8 },
  ],
  island: [
    { text: 'きわみじま KIWAMI', x: 7, y: 3, color: '#16181d', bg: '#ffe9a0', border: '#b08a50', font: 8 },
  ],
  deepsea: [
    { text: '↓ HOME / SHORE', x: 5, y: 10, color: '#9fc4e8', bg: 'rgba(0,0,0,0.5)' },
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
  'T': T('t-trash', true),
  'V': T('t-vending-dead', true),
  'D': T('t-door'),
};

const badtown: SceneDef = {
  id: 'badtown', // historical id — display name Kabukicho (save compat)
  name: 'Downtown',
  legend: BADTOWN_L,
  outdoor: true,
  grid: [
    'NNNNNNNNNNGGGGGGGGGGEEXXEEXX',
    'NNNNNNNNNNGGGGGGGGGGEEXXEEXX',
    'NNNDDNNNNNGGGGDDGGGGEEXXEEXX',
    'ppqpppppppppppppppppppqppppp',
    'ppppppppppppppppppppppVppppp',
    'rrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    'rrrrrrrrrrrrrrrrrrrrrrrrrrrr',
    'pppppppppppppppppppppppppppp',
    'pppppppppppppppppppppppppppp',
    'pppppppppppppppppppppppppppp',
    'pppppppppppppppppppppppppppp',
    'TpppppppppppppppppppppppppTT',
    'pppppppppppppppppppppppppppp',
    'FFFFFFFFFFFFFFFFFFFFFFFFFFFF',
  ],
  warps: [
    { x: 0, y: 5, to: 'city', tx: 30, ty: 5, dir: 'left' },
    { x: 0, y: 6, to: 'city', tx: 30, ty: 7, dir: 'left' },
    { x: 0, y: 8, to: 'city', tx: 30, ty: 8, dir: 'left' },
    { x: 0, y: 9, to: 'city', tx: 30, ty: 9, dir: 'left' },
    { x: 3, y: 2, to: 'nightclub', tx: 7, ty: 8, dir: 'up' },
    { x: 4, y: 2, to: 'nightclub', tx: 8, ty: 8, dir: 'up' },
    { x: 14, y: 2, to: 'garage', tx: 8, ty: 7, dir: 'up' },
    { x: 15, y: 2, to: 'garage', tx: 9, ty: 7, dir: 'up' },
  ],
  interactables: [{ id: 'vending-dead', x: 22, y: 4, label: 'Vending machine?' }],
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
    { x: 7, y: 9, to: 'badtown', tx: 3, ty: 3, dir: 'down' },
    { x: 8, y: 9, to: 'badtown', tx: 4, ty: 3, dir: 'down' },
  ],
  interactables: [{ id: 'bar', x: 1, y: 2, w: 4, h: 1, label: 'Bar' }],
  npcs: [
    { id: 'bartender', x: 2, y: 1, sprite: 'npc-bartender', dir: 'down' },
    { id: 'dj', x: 12, y: 1, sprite: 'npc-dj', dir: 'down' },
    { id: 'dancer', x: 5, y: 5, sprite: 'npc-dancer', dir: 'right' },
    { id: 'dancer2', x: 9, y: 6, sprite: 'npc-dancer', dir: 'left' },
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
    { x: 8, y: 8, to: 'badtown', tx: 14, ty: 3, dir: 'down' },
    { x: 9, y: 8, to: 'badtown', tx: 15, ty: 3, dir: 'down' },
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
  },
  grid: [
    '##################',
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
  interactables: [{ id: 'ascend', x: 1, y: 1, label: 'Climb up' }],
  npcs: [],
};

// Candidate ore-node positions (must be floor tiles); a seeded daily subset spawns.
export const ORE_SPOTS: { x: number; y: number }[] = [
  { x: 5, y: 2 }, { x: 12, y: 2 }, { x: 17, y: 3 }, { x: 4, y: 4 }, { x: 9, y: 4 },
  { x: 14, y: 5 }, { x: 2, y: 7 }, { x: 7, y: 7 }, { x: 17, y: 8 }, { x: 5, y: 10 },
  { x: 9, y: 11 }, { x: 14, y: 11 }, { x: 17, y: 11 }, { x: 2, y: 11 },
];

// Crawler spawn points
export const CRAWLER_SPAWNS: { x: number; y: number }[] = [
  { x: 15, y: 3 }, { x: 8, y: 8 }, { x: 9, y: 10 },
];

// ---- Shrine grounds ------------------------------------------------------------------

const shrine: SceneDef = {
  id: 'shrine',
  name: 'Yoshi Shrine',
  legend: {
    'T': T('t-tree', true),
    'g': T('t-grass'),
    'p': T('t-stonepath'),
    'R': T('t-shrine-roof', true),
    'W': T('t-shrine-wall', true),
    'h': T('t-shrine', true),
    'k': T('t-komainu', true),
    'L': T('t-lantern', true),
  },
  outdoor: true,
  grid: [
    'TTTTTTTTTTTTTTTTTTTT',
    'TTTTTRRRRRRRRRRTTTTT',
    'TggggRRRRRRRRRRggggT',
    'TggggWWWWWWWWWWggggT',
    'TgggggggghhggggggggT',
    'TggggkgggppgggkggggT',
    'TgggLggggppggggLgggT',
    'TggggggggppggggggggT',
    'TggggggggppggggggggT',
    'TggggggggppggggggggT',
    'TTTTTTTTTppTTTTTTTTT',
  ],
  warps: [
    { x: 9, y: 10, to: 'city', tx: 24, ty: 13, dir: 'up' },
    { x: 10, y: 10, to: 'city', tx: 25, ty: 13, dir: 'up' },
  ],
  interactables: [{ id: 'shrine', x: 9, y: 4, w: 1, h: 1, label: 'Offer ¥500' }],
  npcs: [{ id: 'miko', x: 13, y: 5, sprite: 'npc-miko', dir: 'down' }],
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
  },
  outdoor: true,
  grid: [
    '~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~ssssssssssss~~~~~',
    '~~~ssssssssssssssss~~~',
    '~~ssgggggggggKKKggss~~',
    '~~ssgPgggggggggPggss~~',
    '~~ssggggggPgggggggss~~',
    '~~ssssssssssssssssss~~',
    '~~~~ssssssssssssss~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~',
  ],
  warps: [],
  interactables: [
    { id: 'boat-island', x: 4, y: 7, w: 2, h: 1, label: 'The skiff' },
    { id: 'tiki', x: 13, y: 3, w: 3, h: 1, label: 'Tiki bar' },
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

export const SCENES: Record<string, SceneDef> = {
  apartment, city, denden, konbini, pawn, shore, badtown, nightclub, garage, gacha, backrooms, mines, shrine, island, deepsea,
};
