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
    'H': T('t-apt-wall', true),    // Nakatomi Apartments facade (home building; name plate = SCENE_SIGNS.city)
    'p': T('t-planter', true),     // flowering planter flanking the entrance
    'F': T('t-grass-v2'),          // clover/daisy grass detail (walkable)
    'E': T('t-gh-front', true),    // community greenhouse glass facade (east of home)
    'R': T('t-gh-roof', true),     // greenhouse pitched glass roof (over the facade)
    'G': T('t-gh-door'),           // greenhouse glass door (walk-in warp, gated)
    'k': T('t-boardwalk'),         // beach-access boardwalk gate at the SW shore seam (matches the shore boardwalk)
    // Torii-garden kit (SE corner — the shrine approach): stone sando trail,
    // beam-over-path, stone toro lanterns, sakura + fallen petals, koi pond.
    'x': T('t-stonepath'),         // stone sando trail (walkable)
    'X': T('t-torii-beam-path'),   // torii crossbar where the trail runs under the gate
    'O': T('t-toro', true),        // stone ishidoro lantern flanking the approach
    'Y': T('t-sakura', true),      // cherry-blossom tree shading the garden ('C' is taken by the t-bld-c storefront)
    'q': T('t-sakura-petals'),     // fallen petals beside the trail (walkable)
    'u': T('t-pond', true),        // garden koi pond (solid)
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
    'ggHHHHDDHHggggEGGEggTgggxxgYggfg',
    'sggggpwwpggggggggggfgfgOxxOggggg',
    'kwwwwwwwgggggggggggggggnXXnouuog',
    'kwwwwwwwggggggggggggggojxxjouugg',
    'ssggFgggggggggFggggggggqxxqggggg',
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
  ],
  npcs: [
    { id: 'charlie', x: 17, y: 3, sprite: 'npc-charlie', dir: 'down' },
    { id: 'granny', x: 12, y: 16, sprite: 'npc-granny', dir: 'left' },
    // The midnight stranger — only visible/interactive in the small hours (see strangerActive).
    { id: 'stranger', x: 19, y: 16, sprite: 'npc-stranger', dir: 'down' },
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
  guide?: boolean;      // municipal wayfinding: slim flat plate + baked-in pole, matte (no bevel/shadow/night bloom)
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
    // Wayfinding is municipal guide signage (slim navy enamel plate on a grey
    // pole, baked into one sprite — see the `guide` branch of the sign renderer)
    // so it reads as Tokyo street furniture. The shrine has no sign — the torii
    // gate IS the sign.
    { text: '← BEACH', x: 0, y: 13, color: '#e8f0f4', bg: '#27517c', guide: true },
    { text: 'DOWNTOWN →', x: 27, y: 8, color: '#e8f0f4', bg: '#27517c', guide: true },
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
    { text: '← MID TOWN', x: 0, y: 6, color: '#e8f0f4', bg: '#27517c', guide: true },
  ],
  museum: [
    { text: 'カワマチ びじゅつかん', x: 1, y: 9, color: '#3a3322', bg: '#e0d8c4', border: '#b08a50', font: 7 },
  ],
  nightclub: [
    { text: 'バー', x: 1, y: 0, color: '#ffd24a', bg: '#16121d', border: '#ffd24a', font: 8, blink: true },
    { text: '☄ KAIJU ☄', x: 9, y: 0, color: '#aef0a0', bg: '#0f2a14', border: '#7ce8a0', font: 7, blink: true },
  ],
  shore: [
    // Mirror of the city's '← BEACH' gate — the boardwalk at the NE corner leads back to town.
    { text: 'TOWN →', x: 18, y: 2, color: '#e8f0f4', bg: '#27517c', guide: true },
  ],
  garage: [
    { text: 'こじまモータース せいび', x: 2, y: 0, color: '#ffd24a', bg: '#33302a', border: '#c9a227', font: 8 },
    { text: 'オイル OIL', x: 14, y: 0, color: '#d05050', bg: '#e8e0d0', border: '#9e3a3a', font: 7 },
  ],
  shrine: [],
  greenhouse: [],
  island: [],
  deepsea: [
    { text: '↓ HOME / SHORE', x: 5, y: 10, color: '#9fc4e8', bg: 'rgba(0,0,0,0.5)' },
  ],
  paris: [
    // Fascia plates mounted directly over each shopfront (they hug the awning row).
    { text: 'CAFÉ DE LA LUNE', x: 1, y: 5, color: '#ffe9a0', bg: '#7a1f18', border: '#c9a227', font: 7 },
    { text: 'BOULANGERIE', x: 21, y: 5, color: '#ffe9a0', bg: '#0f2a14', border: '#c9a227', font: 7 },
    // The way home — a municipal guide plate beside the café doors.
    { text: '← RETOUR', x: 4, y: 8, color: '#e8f0f4', bg: '#27517c', guide: true },
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
  legend: { ...SHOP, 'Z': T('t-freezer', true), 'J': T('t-terminal', true) },
  grid: [
    '################',
    '#FFFZ......SSSS#',
    '#..............#',
    '#...CCC........#',
    '#..............#',
    '#SSSS......SSSS#',
    '#.............J#',
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
    { id: 'gig-terminal', x: 14, y: 6, label: 'Courier terminal' },
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
  // A real coastline reading back→front: a dune/pine back edge with a vendor stand
  // and a boardwalk in from the city, a deep beach of dry then wet sand (rocks,
  // tide pools, driftwood), an animated tide-foam line, a little pier, and the sea.
  // Scrolls vertically (24×16). 'd'/'v' dune, 'P' pine, 'k' boardwalk, 's'/'S' dry/
  // wet sand, 'f' foam, 'D' pier. Props bake their backing tile in, so each uses
  // the variant matching its row: 'o'/'O'/'W'/'w' boulder on dry sand / wet sand /
  // foam line / open sea, 'L'/'l' driftwood dry/wet. A rocky point (O/W/w col
  // 20-21) runs from the wet sand out into the water.
  legend: {
    'g': T('t-grass'),
    'd': T('t-dune'),
    'v': T('t-dunegrass'),
    'P': T('t-pine', true),
    'k': T('t-boardwalk'),
    's': T('t-sand'),
    'S': T('t-sand-wet'),
    'f': T('t-foam-0'),
    'o': T('t-beachrock', true),
    'O': T('t-beachrock-wet', true),  // same boulder, wet-sand backing
    'W': T('t-beachrock-surf', true), // boulder breaking the foam line
    'w': T('t-searock', true),        // boulder standing in the sea
    'L': T('t-driftwood', true),
    'l': T('t-driftwood-wet', true),  // washed-up log, wet-sand backing
    'D': T('t-dock'),
    '~': T('t-water-0', true),
    'b': T('t-buoy', true),
    'U': T('t-parasol', true),
    'J': T('t-crate', true),
  },
  outdoor: true,
  grid: [
    'PgdvggPddvggdPvdggPdvggP',
    'gdvddvgddvddgddvvddvgddv',
    'vddvdddddvddvddvdvddPddd',
    'ddsddsdsddsssddssdsdkkkk',
    'sssossJsssUsssssLssssskk',
    'ssssssssssssssssssssssss',
    'sssssssssssssssssUssssss',
    'ssssssssssssssssssssssss',
    'SSSSSSSSSSSSSSSSSSSSSSSS',
    'SSSSSSSSSOSSSSSlSSSSOOSS',
    'ffDfffffffffffffffffWWff',
    '~~D~~~~~~~~~~~~~~~~~~w~~',
    '~~D~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~~b~~~~~~~~~~~~~~~',
    '~~~~~~~~~~~~~~~~~b~~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~',
  ],
  warps: [
    { x: 23, y: 3, to: 'city', tx: 1, ty: 15, dir: 'right' },
    { x: 23, y: 4, to: 'city', tx: 1, ty: 16, dir: 'right' },
  ],
  // The whole waterline is fishable: stand on the foam/sand edge, face the water.
  // Deep spot (needs the skiff, moored off the pier) listed first so it wins overlap.
  interactables: [
    { id: 'boat', x: 2, y: 13, w: 1, h: 1, label: 'The skiff' },
    { id: 'fish-spot', x: 0, y: 11, w: 24, h: 1, label: 'Fish' },
    // A quiet stargazing spot up on the dune grass — only rewards a look after dark (see handler).
    { id: 'stargaze', x: 10, y: 1, w: 3, h: 1, label: 'Look up at the stars' },
  ],
  npcs: [
    { id: 'old-man', x: 4, y: 7, sprite: 'npc-oldman', dir: 'down' },
    { id: 'tex', x: 5, y: 3, sprite: 'npc-hatvendor', dir: 'up' },
    // David + his campfire only appear on even-numbered nights (gated in code).
    { id: 'campfire', x: 13, y: 6, sprite: 'prop-campfire', dir: 'down' },
    { id: 'david', x: 14, y: 6, sprite: 'npc-vampire', dir: 'left' },
    // The shadow figure — only out in the deepest hour (1:30 AM → collapse); see shadowActive.
    { id: 'shadow-shore', x: 22, y: 7, sprite: 'npc-shadow', dir: 'down' },
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
    // Bigfoot, once you've met him in the island cave — hidden until then
    // (npcHiddenNow gates on the 'bigfoot-met' story flag).
    { id: 'bigfoot-club', x: 12, y: 3, sprite: 'npc-bigfoot', dir: 'down' },
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
    'B': T('t-dispatch', true),
  },
  grid: [
    '##################',
    '#MMMMMMMM.B..TTTT#',
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
  interactables: [
    { id: 'shop-garage', x: 5, y: 5, w: 3, h: 1, label: 'Vehicles' },
    // Delivery gig can be taken either in person (talk to Kojima, the mechanic NPC)
    // or off the dispatch clipboard on the wall (t-dispatch at col 10, row 1).
    { id: 'job-dispatch', x: 10, y: 1, label: 'Delivery gig' },
  ],
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
    'x': T('t-gh-path'),             // stepping-stone path (walkable)
    'F': T('t-gh-flowers', true),    // flower bed (decor)
  },
  grid: [
    'RRRRRRRRRRRRRRRR',
    'GGGGHYHGGHGGHGGG',
    'G..o...o...o...G',
    'G.P....xx....P.G',
    'G..o...o...o...G',
    'G......xx......G',
    'G..o...o...o...G',
    'G.F....xx....P.G',
    'G.vw...xx..b.F.G',
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
    'l': T('t-lagoon', true),       // shallow turquoise lagoon — tropical fishing
    's': T('t-sand'),
    'g': T('t-grass'),
    'D': T('t-dock'),               // wooden pier (walkable, over water)
    'P': T('t-palm', true),         // coconut palms
    'B': T('t-banana', true),       // banana palms (scenery)
    'R': T('t-basalt', true),       // volcanic basalt (cone flanks)
    'V': T('t-volcano', true),      // the crater peak
    'H': T('t-hotspring-l', true),  // onsen pool, left half (steam scan keys on 'H')
    'h': T('t-hotspring-r', true),  // onsen pool, right half (the pair reads as ONE pool)
    'K': T('t-tiki', true),
    'Z': T('t-zama-poster', true),  // ZamaZonk billboard
    'b': T('t-bottle'),             // message in a bottle (secret; walkable sand)
    'c': T('t-cave-crack', true),   // hidden sea-cave crack in the volcanic rock (secret; solid, faced from the grass below)
    'I': T('t-island-sign', true),  // Kiwami Island signpost (solid; greets the player by the west dock)
  },
  outdoor: true,
  grid: [
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    '~~~~~~~ssssRRVVRRssss~~~~~~~',
    '~~~~~ssssgggRRRcgggssss~~~~~',
    '~~~~ssgggggggHhgggggssss~~~~',
    '~~~sssgggPgggggggBgggsss~~~~',
    '~~ssgggggggggggggggsslll~~~~',
    '~~sgggggPgggggggggggslllll~~',
    '~DDsgggggggggggggggslllll~~~',
    '~~sggggggggggggggggDDDll~~~~',
    '~~sIggggggBgggggggggsslll~~~',
    '~~~sssgggggggggggggsssll~~~~',
    '~~~~ssKKKssssssZsssssss~~~~~',
    '~~~~ssssssssssssssssssbs~~~~',
    '~~~~~ssssssssssssssssss~~~~~',
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
  ],
  warps: [],
  interactables: [
    { id: 'boat-island', x: 1, y: 7, w: 2, h: 1, label: 'The skiff' },
    { id: 'island-sign', x: 3, y: 9, label: 'Kiwami Island' },
    { id: 'tiki', x: 6, y: 11, w: 3, h: 1, label: 'Tiki bar' },
    { id: 'zama-poster', x: 15, y: 11, label: 'Read the poster' },
    { id: 'onsen', x: 13, y: 3, w: 2, h: 1, label: 'Hot spring' },
    { id: 'coconut', x: 9, y: 4, label: 'Coconut palm' },
    { id: 'coconut', x: 8, y: 6, label: 'Coconut palm' },
    { id: 'banana', x: 17, y: 4, label: 'Banana palm' },
    { id: 'banana', x: 10, y: 9, label: 'Banana palm' },
    { id: 'island-bottle', x: 22, y: 12, label: 'A bottle in the sand' },
    { id: 'island-cave', x: 15, y: 2, label: 'Enter the crack' },
    { id: 'fish-tropical', x: 19, y: 4, w: 7, h: 7, label: 'Fish the lagoon' },
  ],
  npcs: [{ id: 'tiki', x: 7, y: 10, sprite: 'npc-hatvendor', dir: 'down' }],
};

// ---- Sea cave (squeeze through the crack in the island's volcanic rock) ---------------
// A small hand-authored cave the island forgot it had. Reuses the mine's cave tiles
// ('#' = wall, '.' = floor). The player drops in just above the daylight crack ('X',
// the walk-on warp back out); a little alcove at the top hides the one-time nest egg
// (the 'seacave-niche' interactable, gated by storySeen 'island-cave').

const seacave: SceneDef = {
  id: 'seacave',
  name: 'Sea Cave',
  legend: {
    '#': T('t-cave-wall', true),   // reused from the mines
    '.': T('t-cave-floor'),        // reused from the mines
    'x': T('t-cave-exit-l'),       // daylight crack, left half — walkable, warps back to the island
    'X': T('t-cave-exit-r'),       // daylight crack, right half (the pair reads as ONE opening)
  },
  grid: [
    '############',
    '#..........#',
    '#...####...#',
    '#...#..#...#',
    '#...#..#...#',
    '#..........#',
    '#....xX....#',
    '############',
  ],
  warps: [
    { x: 5, y: 6, to: 'island', tx: 15, ty: 3, dir: 'down' },
    { x: 6, y: 6, to: 'island', tx: 15, ty: 3, dir: 'down' },
  ],
  interactables: [
    { id: 'seacave-niche', x: 5, y: 2, label: 'A niche in the rock' },
    { id: 'seacave-search', x: 8, y: 1, w: 3, h: 1, label: 'Sift the cave floor' },
  ],
  // Bigfoot only resolves here on a rare, luck-blessed day (bigfootInCaveToday);
  // npcHiddenNow keeps him out of the cave otherwise — and forever once you've met
  // him, by which point he's a regular at Club Kaiju instead.
  npcs: [{ id: 'bigfoot-cave', x: 2, y: 4, sprite: 'npc-bigfoot', dir: 'right' }],
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
    'C': T('t-casino-curtain'), // velvet curtain to the backroom (walkable warp, win-gated)
    'V': T('t-videopoker', true), // video-poker cabinets (the floor's 4th game)
  },
  grid: [
    '#######CC#######',
    '#SS.SS....SS.SS#',
    '#..............#',
    '#...B.....B....#',
    '#..............#',
    '#......Rr......#',
    '#SS.SS.VV.SS.SS#',
    '#..............#',
    '#..............#',
    '#######DD#######',
  ],
  warps: [
    { x: 7, y: 9, to: 'badtown', tx: 14, ty: 3, dir: 'down' },
    { x: 8, y: 9, to: 'badtown', tx: 15, ty: 3, dir: 'down' },
    // The backroom curtain: gated on BACKROOM_WINS lifetime wins (bounced in the
    // warp check like the yakuza toll — see lockedGate in the monolith).
    { x: 7, y: 0, to: 'backroom', tx: 5, ty: 5, dir: 'up' },
    { x: 8, y: 0, to: 'backroom', tx: 6, ty: 5, dir: 'up' },
  ],
  interactables: [
    { id: 'casino-slots', x: 1, y: 1, w: 5, h: 1, label: 'Slot machine' },
    { id: 'casino-slots', x: 10, y: 1, w: 5, h: 1, label: 'Slot machine' },
    { id: 'casino-slots', x: 1, y: 6, w: 5, h: 1, label: 'Slot machine' },
    { id: 'casino-slots', x: 10, y: 6, w: 5, h: 1, label: 'Slot machine' },
    { id: 'casino-blackjack', x: 4, y: 3, w: 1, h: 1, label: 'Blackjack table' },
    { id: 'casino-blackjack', x: 10, y: 3, w: 1, h: 1, label: 'Blackjack table' },
    { id: 'casino-roulette', x: 7, y: 5, w: 2, h: 1, label: 'Roulette table' },
    { id: 'casino-poker', x: 7, y: 6, w: 2, h: 1, label: 'Video poker' },
  ],
  npcs: [
    { id: 'casino-host', x: 7, y: 3, sprite: 'npc-casino', dir: 'down' },
    // The doorman: plants himself in front of the curtain until the win count
    // says otherwise, then stands aside holding the rope (two conditional
    // placements, filtered on backroomOpen like the badtown yakuza on gangPaid).
    { id: 'kinryu-doorman', x: 7, y: 1, sprite: 'npc-yakuza', dir: 'down' },
    { id: 'kinryu-doorman-aside', x: 9, y: 1, sprite: 'npc-yakuza', dir: 'left' },
  ],
};

// ---- The Kinryū backroom (the hidden VIP room behind the casino curtain) ---------------
// Parted open only after BACKROOM_WINS lifetime winning bets (gated at the warp).
// Small and plush: one private table, one enormous boss who keeps the count.
const backroom: SceneDef = {
  id: 'backroom',
  name: 'Kinryū Backroom',
  legend: {
    '#': T('t-casino-wall', true),
    '.': T('t-vip-carpet'),        // richer crimson pile than the floor outside
    'B': T('t-blackjack-vip', true), // same table, baked on the VIP pile (no base-color box)
    'C': T('t-casino-curtain'),
    'L': T('t-vip-lantern', true), // wall lanterns flanking the mural
    '1': T('t-dragon-0', true),    // the 金龍 itself — 4-tile gold-dragon mural
    '2': T('t-dragon-1', true),
    '3': T('t-dragon-2', true),
    '4': T('t-dragon-3', true),
    'b': T('t-vip-bonsai', true),
  },
  grid: [
    '##L#1234#L##',
    '#b........b#',
    '#..........#',
    '#.....B....#',
    '#..........#',
    '#..........#',
    '#####CC#####',
  ],
  warps: [
    { x: 5, y: 6, to: 'casino', tx: 7, ty: 1, dir: 'down' },
    { x: 6, y: 6, to: 'casino', tx: 8, ty: 1, dir: 'down' },
  ],
  interactables: [
    { id: 'backroom-table', x: 6, y: 3, w: 1, h: 1, label: 'Private table' },
  ],
  npcs: [{ id: 'kinryu-boss', x: 6, y: 2, sprite: 'npc-yakuza', dir: 'down' }],
};

// The Moon — reached only through the shadow figure on the shore at 1:30 AM.
// Outside time: no warps out; the shadow figure (shadow-moon) is the only way home.
const moon: SceneDef = {
  id: 'moon',
  name: 'The Moon',
  legend: {
    'S': T('t-space', true),      // star void — the edge of everything
    '.': T('t-moon-floor'),       // pale regolith
    'c': T('t-moon-crater'),      // walkable crater dimple
    'R': T('t-moon-rock', true),  // solid boulder
    'W': T('t-moon-watch'),       // the half-buried pocket watch (secret)
  },
  grid: [
    'SSSSSSSSSSSSSSSSSSSS',
    'SSSSSSSSSSSSSSSSSSSS',
    'SS.....R......c..SSS',
    'S...c.....R.......SS',
    'S......c......R....S',
    'S..R.......c......SS',
    'S....c..R......c..SS',
    'SS..........R.....SS',
    'SS...R...c......WSSS',
    'SSS..............SSS',
    'SSSSSSSSSSSSSSSSSSSS',
  ],
  warps: [],
  interactables: [
    { id: 'moon-watch', x: 16, y: 8, label: 'Something half-buried' },
  ],
  npcs: [{ id: 'shadow-moon', x: 9, y: 3, sprite: 'npc-shadow', dir: 'down' }],
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
    'A': T('t-boul-awning', true),   // boulangerie awning (green/cream stripes)
    'v': T('t-boul-win', true),      // bakery window — the baguette rack
    'd': T('t-boul-door', true),     // bakery door
    'r': T('t-boul-rack', true),     // patisserie window
    'f': T('t-cafe-win', true),      // café front window under the awning
    't': T('t-bistro', true),        // bistro table + chairs on the cobbles
    'L': T('t-paris-lamp', true),    // wrought-iron lamppost (night glow in the draw block)
    'B': T('t-bouquiniste', true),   // Seine bookseller's box
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
    'PaaakkkkkkkkkkkkkkkkkkAAAP',
    'PfDDkkkkkkkkkkkkkkkkkkvdrP',
    'cccccccccccccccccccccccccc',
    'ctcTctccTcBBLcBBcTcccTccLc',
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
    { id: 'baguette', x: 22, y: 8, sprite: 'npc-tourist', dir: 'down' },
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
    'c': T('t-mus-carpet'),         // red runner, door -> hall (walkable)
    'r': T('t-mus-rope', true),     // velvet rope barrier flanking the hall
    'B': T('t-mus-banner', true),   // hanging gallery tapestry (wall row)
  },
  grid: [
    '#BA##A##A##A#B##',
    '#..............#',
    '#.p..p..p..p...#',
    '#..............#',
    '#.p..p..p..p...#',
    '#......cc......#',
    '#.rr...cc...rr.#',
    '#......cc......#',
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
  apartment, city, denden, konbini, pawn, shore, badtown, nightclub, garage, gacha, backrooms, mines, shrine, greenhouse, island, seacave, deepsea, casino, backroom, paris, moon, museum,
};
