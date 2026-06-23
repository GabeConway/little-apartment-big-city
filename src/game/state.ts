// Little Apartment, Big City — save state. Persists to localStorage like utils/gas.ts.
// Deliberately NOT wired into utils/achievements.ts: adding entries there would
// raise the site-wide "cake" bar. The game tracks its own progression.

import type { Dir } from './engine';
import { mulberry32 } from './engine';
import {
  FURNITURE, RARE_FURNITURE, PAWN_DISCOUNT, PAWN_STOCK_SIZE, BASE_MAX_ENERGY,
  SLEEP_RESTORE_FUTON, SKETCHY_DISCOUNT, GACHA_FIGURES, GAME_ACHIEVEMENTS,
  itemKind, MESSAGES, furnitureById,
} from './data';
import type { PhoneMessage, MsgCtx, Furniture } from './data';
import { APARTMENT_SLOTS, RARE_SLOTS, PLACEMENT_SPOTS, SCENES } from './maps';

export const WAKE_MIN = 7 * 60;       // days start at 7:00 AM
export const COLLAPSE_MIN = 26 * 60;  // 2:00 AM — you fade out and wake up at home

// The "what's your vibe?" pick on a new game. Not a gender — just which of the
// two AI-generated player looks you walk around as. See sprites.ts PC_SHEETS.
export type Vibe = 'fem' | 'masc';

export interface GameSave {
  v: number;                    // save version (v2+: placement system)
  vibe: Vibe;                   // chosen player appearance (new-game vibe pick)
  name: string;                 // player name (chosen at new game; used instead of any pronoun)
  money: number;
  day: number;
  timeMin: number;              // in-game clock, minutes since midnight (can pass 24h)
  energy: number;
  scene: string;
  px: number; py: number;       // player top-left, logical px
  dir: Dir;
  owned: string[];              // BASE furniture ids only (drives the ending)
  rares: string[];              // backrooms rare furniture ids
  placed: Record<string, { x: number; y: number }>; // furniture actually in the apartment
  gameAch: string[];            // in-game achievement ids (NOT the site system)
  shiftsWorked: number;
  vehicles: string[];           // 'car' | 'boat'
  carPos: { scene: string; x: number; y: number } | null; // where the kei car is parked
  driving: boolean;             // currently behind the wheel
  coconuts: number;             // coconuts in your bag (eat or sell at the tiki bar)
  palmDay: number;              // day the shaken-palm list belongs to
  palmsShaken: string[];        // "x,y" palms already shaken today
  gacha: Record<string, number>; // figure name -> count
  hat: boolean;                 // Tex's $67 cowboy hat (worn on the sprite)
  peepis: number;               // cans of "Diet Doctor Peepis" in your pocket
  sodas: Record<string, number>; // other vending sodas in your pocket (soda id -> count), e.g. 'doofert'
  monsterFed: boolean;          // gave The Manager a cold one; shop unlocked
  gangPaid: boolean;            // paid off the yakuza blocking the way to Downtown
  backroomsUnlocked: boolean;   // The Big Guy at Club Kaiju revealed the konbini freezer portal (after a Doofert)
  parisRevealed: boolean;       // The Manager revealed the secret Paris entrance in the backrooms (after all his furniture)
  minerals: Record<string, number>; // mineral id -> count
  wand: boolean;                // the magical girl wand
  visited: string[];            // scene ids seen (the DJ only plays places you know)
  metStores: string[];          // store ids you've interacted with (gave your number → they can text you)
  donated: number;              // total yen offered at the shrine
  minedDay: number;             // day the mined-node list belongs to
  minedNodes: string[];         // "x,y" ore nodes already mined today
  canFish: boolean;             // learned to fish from Genji at the shore
  fishInv: string[];            // fish ids, unsold
  fishLog: Record<string, number>; // fish id -> total caught
  storySeen: string[];          // story beat ids already shown
  shiftDay: number;             // last day the konbini shift was worked (0 = never)
  lotteryDay: number;           // day a konbini lottery ticket was bought (0 = none); resolves next morning
  leftKonbiniAt: number | null; // absolute in-game minute you first left the konbini (job unlocks ~1h later)
  sketchyDay: number;           // last day a deal was bought from the sketchy guy
  ended: boolean;               // ending seen (free play continues)
  today: DayLog;                // running tally for the end-of-day recap
  messages: PhoneMessage[];     // smartphone texts delivered so far
  orders: ZamaOrder[];          // ZamaZonk furniture in transit (arrives next morning)
}

// A ZamaZonk order in transit. Paid for now; lands in the boxes on `dueDay`.
export interface ZamaOrder { itemId: string; dueDay: number }

// Per-day tally, reset every morning; feeds the end-of-day recap screen.
export interface DayLog {
  startMoney: number;           // money at the day's start (for net change)
  fishCaught: number;
  mineralsMined: number;
  shifts: number;
  newFurniture: string[];       // furniture ids acquired today
}
export const freshDayLog = (money: number): DayLog => ({
  startMoney: money, fishCaught: 0, mineralsMined: 0, shifts: 0, newFurniture: [],
});

const KEY = 'lab-save';

export const newSave = (): GameSave => ({
  v: 2,
  vibe: 'fem',
  name: 'Neighbor',
  money: 3000,
  day: 1,
  timeMin: WAKE_MIN,
  energy: BASE_MAX_ENERGY,
  scene: 'apartment',
  px: 7 * 16, py: 5 * 16,
  dir: 'down',
  owned: [],
  rares: [],
  placed: {},
  gameAch: [],
  shiftsWorked: 0,
  vehicles: [],
  carPos: null,
  driving: false,
  coconuts: 0,
  palmDay: 0,
  palmsShaken: [],
  gacha: {},
  hat: false,
  peepis: 0,
  sodas: {},
  monsterFed: false,
  gangPaid: false,
  backroomsUnlocked: false,
  parisRevealed: false,
  minerals: {},
  wand: false,
  visited: ['apartment'],
  metStores: [],
  donated: 0,
  minedDay: 0,
  minedNodes: [],
  canFish: false,
  fishInv: [],
  fishLog: {},
  storySeen: [],
  shiftDay: 0,
  lotteryDay: 0,
  leftKonbiniAt: null,
  sketchyDay: 0,
  ended: false,
  today: freshDayLog(3000),
  messages: [],
  orders: [],
});

export const loadSave = (): GameSave | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<GameSave>;
    // Merge over defaults so older saves survive shape changes.
    const s = { ...newSave(), ...parsed };
    // Migration: v1 saves predate the placement system — auto-place everything
    // at the legacy fixed slots. (v2 saves may legitimately have items boxed.)
    if (parsed.v === undefined && (s.owned.length > 0 || s.rares.length > 0)) {
      s.v = 2;
      for (const slot of [...APARTMENT_SLOTS, ...RARE_SLOTS]) {
        if (s.owned.includes(slot.itemId) || s.rares.includes(slot.itemId)) {
          s.placed[slot.itemId] = { x: slot.x, y: slot.y };
        }
      }
    }
    if (s.vehicles.includes('car') && !s.carPos && !s.driving) {
      s.carPos = { scene: 'badtown', x: 17, y: 3 };
    }
    if (!s.canFish && (s.fishInv.length > 0 || Object.keys(s.fishLog).length > 0)) {
      s.canFish = true; // grandfather in anyone who already learned
    }
    if (!parsed.today) s.today = freshDayLog(s.money); // old saves: baseline today's tally
    return s;
  } catch { return null; }
};

export const persistSave = (s: GameSave): void => {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode */ }
};

export const clearSave = (): void => {
  try { localStorage.removeItem(KEY); } catch { /* private mode */ }
};

// ---- Derived stats ---------------------------------------------------------

// Effects come from furniture actually PLACED in the apartment, not boxed in
// the inventory.
export const maxEnergy = (s: GameSave): number =>
  BASE_MAX_ENERGY
  + (s.placed['microwave'] ? 10 : 0)
  + (s.placed['fridge'] ? 10 : 0)
  + (s.placed['kotatsu'] ? 10 : 0);

// AC makes every exertion 20% cheaper.
export const energyCost = (s: GameSave, base: number): number =>
  Math.max(1, Math.round(base * (s.placed['ac'] ? 0.8 : 1)));

export const sleep = (s: GameSave): void => {
  s.day += 1;
  s.timeMin = WAKE_MIN;
  const max = maxEnergy(s);
  s.energy = s.placed['bed'] ? max : Math.round((SLEEP_RESTORE_FUTON / 100) * max);
  s.today = freshDayLog(s.money); // start a clean tally for the new day
};

export const clockLabel = (s: GameSave): string => {
  const m = Math.floor(s.timeMin) % (24 * 60);
  const h24 = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${mm} ${h24 < 12 ? 'AM' : 'PM'}`;
};

// 0 (day) → 1 (full night); ramps through the evening, holds until collapse.
export const nightT = (s: GameSave): number => {
  const h = s.timeMin / 60;
  if (h < 17) return 0;
  if (h < 20) return (h - 17) / 3;
  return 1;
};

// Golden hour: 1 right at wake (7:00), fading to 0 by ~9:30. Drives a warm
// dawn wash + low sun so mornings read distinctly from flat midday.
export const morningT = (s: GameSave): number => {
  const h = s.timeMin / 60;
  if (h < 7 || h >= 9.5) return 0;
  return 1 - (h - 7) / 2.5;
};

// ---- Pawn shop daily stock ---------------------------------------------------
// Seeded by day so the stock is stable all day and rotates overnight.

export interface PawnOffer { itemId: string; price: number }

export const pawnStockFor = (s: GameSave): PawnOffer[] => {
  const pool = FURNITURE.filter(f => f.pawnable && !s.owned.includes(f.id));
  const rand = mulberry32(s.day * 7919 + 17);
  const picks: PawnOffer[] = [];
  const candidates = [...pool];
  while (picks.length < PAWN_STOCK_SIZE && candidates.length > 0) {
    const i = Math.floor(rand() * candidates.length);
    const f = candidates.splice(i, 1)[0];
    // small per-day price wobble so "used" prices feel haggled
    const wobble = 0.9 + rand() * 0.2;
    picks.push({ itemId: f.id, price: Math.round((f.price * PAWN_DISCOUNT * wobble) / 10) * 10 });
  }
  return picks;
};

export const buyFurniture = (s: GameSave, itemId: string, price: number): boolean => {
  if (s.owned.includes(itemId) || s.money < price) return false;
  s.money -= price;
  s.owned.push(itemId);
  s.today.newFurniture.push(itemId);
  return true;
};

// The ending wants the furniture actually IN the apartment, not in boxes.
export const allFurnished = (s: GameSave): boolean =>
  FURNITURE.every(f => Boolean(s.placed[f.id]));

// True once every one of The Manager's rare furniture pieces has been acquired
// (owned, boxed or placed). Drives the Manager's Paris reveal. The coffin is
// David's gift, not the Manager's stock, so it doesn't count here.
export const allRaresOwned = (s: GameSave): boolean =>
  RARE_FURNITURE.filter(f => f.id !== 'coffin').every(f => s.rares.includes(f.id));

// ---- placement -----------------------------------------------------------------

export const itemFootprintW = (id: string): number => (itemKind(id) === 'wide' ? 2 : 1);

export const spotFree = (s: GameSave, x: number, y: number): boolean =>
  !Object.values(s.placed).some(p => p.x === x && p.y === y);

export const freeSpotsFor = (s: GameSave, itemId: string) =>
  PLACEMENT_SPOTS.filter(spot => spot.kind === itemKind(itemId) && spotFree(s, spot.x, spot.y));

export const placeItem = (s: GameSave, itemId: string, x: number, y: number): void => {
  s.placed[itemId] = { x, y };
};

export const unplaceItem = (s: GameSave, itemId: string): void => {
  delete s.placed[itemId];
};

export const spotLabelAt = (x: number, y: number): string =>
  PLACEMENT_SPOTS.find(p => p.x === x && p.y === y)?.label ?? `(${x},${y})`;

// Shrine luck: tier 1 at ¥5,000 donated, tier 2 at ¥20,000. Each tier makes
// the rarer (valuable) fish noticeably more willing to bite.
export const shrineLuck = (s: GameSave): number =>
  s.donated >= 20000 ? 2 : s.donated >= 5000 ? 1 : 0;

// ---- the mines ---------------------------------------------------------------------
// Ore nodes spawn at seeded positions each day; mined ones stay gone until sleep.

import { MINERALS } from './data';
import type { Mineral } from './data';

export interface OreNode { x: number; y: number; mineral: Mineral; amount: number }

export const oreNodesFor = (s: GameSave, candidates: { x: number; y: number }[]): OreNode[] => {
  if (s.minedDay !== s.day) { s.minedDay = s.day; s.minedNodes = []; }
  const rand = mulberry32(s.day * 31337 + 11);
  const nodes: OreNode[] = [];
  for (const c of candidates) {
    if (rand() < 0.65) {
      const total = MINERALS.reduce((sum, m) => sum + m.weight, 0);
      let r = rand() * total;
      let mineral = MINERALS[0];
      for (const m of MINERALS) { r -= m.weight; if (r <= 0) { mineral = m; break; } }
      nodes.push({ x: c.x, y: c.y, mineral, amount: 1 });
    }
  }
  return nodes.filter(n => !s.minedNodes.includes(`${n.x},${n.y}`));
};

// ---- daily mine layout ------------------------------------------------------------
// The mine is regenerated fresh every in-game DAY: ore nodes and crawlers are
// scattered across the walkable cave floor at seeded-random positions. The seed is
// the day number, so a day's layout is stable (re-entering the mine, reloading the
// save) but every day is different. High variance is intentional — some days are
// nearly barren / crawler-infested (terrible), some are loaded with rare ore
// (jackpot). Mined nodes stay gone until you sleep (cleared on day change above).
//
// SECRET: praying / donating at the shrine quietly biases the day toward MORE and
// RARER ore and FEWER crawlers (via shrineLuck + total donated). Never surfaced.

export interface MineLayout { ore: OreNode[]; crawlers: { x: number; y: number }[] }

// Walkable cave-floor tiles of the mines, derived once from the static map
// (`.` floor only — excludes walls and the climb-up ladder).
const MINE_FLOOR: { x: number; y: number }[] = (() => {
  const grid = SCENES.mines.grid;
  const tiles: { x: number; y: number }[] = [];
  for (let y = 0; y < grid.length; y++)
    for (let x = 0; x < grid[y].length; x++)
      if (grid[y][x] === '.') tiles.push({ x, y });
  return tiles;
})();

// Where you drop in from the ladder (enterScene('mines', 2, 1)). Nothing spawns
// on it, and crawlers keep a few tiles of breathing room around it.
const MINE_ENTRY = { x: 2, y: 1 };

export const mineLayoutFor = (s: GameSave): MineLayout => {
  if (s.minedDay !== s.day) { s.minedDay = s.day; s.minedNodes = []; }
  const rand = mulberry32(s.day * 2654435761 + 97);
  const luck = shrineLuck(s);                          // 0 / 1 / 2 shrine tiers
  const grace = Math.min(0.35, s.donated / 120000);    // smooth nudge from total offered

  // Seeded Fisher–Yates over the floor so picks scatter (and stay walkable),
  // skipping the entry tile entirely.
  const floor = MINE_FLOOR.filter(t => !(t.x === MINE_ENTRY.x && t.y === MINE_ENTRY.y));
  for (let i = floor.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [floor[i], floor[j]] = [floor[j], floor[i]];
  }

  // richness drives BOTH how many nodes and how rare they skew. Squared so lean
  // days are the norm; the shrine pushes it toward the jackpot end.
  let richness = rand() * rand();
  richness = Math.min(1, richness + luck * 0.22 + grace);
  const oreCount = Math.round(2 + richness * 12);       // 2..14 nodes

  // Tilt mineral weights toward the scarcer (more valuable) ore as richness/luck
  // rise; the common shard keeps its base weight so it never vanishes.
  const tilt = 1 + richness * 1.6 + luck * 0.9;
  const tiltedW = (m: Mineral) => (m.id === 'shard' ? m.weight : m.weight * tilt);
  const tTotal = MINERALS.reduce((sum, m) => sum + tiltedW(m), 0);

  const ore: OreNode[] = [];
  const used = new Set<string>();
  for (let i = 0; i < oreCount && i < floor.length; i++) {
    const c = floor[i];
    let r = rand() * tTotal;
    let mineral = MINERALS[0];
    for (const m of MINERALS) { r -= tiltedW(m); if (r <= 0) { mineral = m; break; } }
    // Occasional rich vein — a node that yields extra (value variance).
    const vein = rand();
    const amount = vein < 0.02 + richness * 0.05 ? 3 : vein < 0.07 + richness * 0.13 ? 2 : 1;
    ore.push({ x: c.x, y: c.y, mineral, amount });
    used.add(`${c.x},${c.y}`);
  }

  // Crawlers: their own roll, reduced by shrine favor. Some days infested, some
  // empty. Never on an ore tile, never crowding the ladder entry.
  let crawlerCount = Math.round(rand() * 6);
  crawlerCount = Math.max(0, crawlerCount - luck - (grace > 0.15 ? 1 : 0));
  const crawlers: { x: number; y: number }[] = [];
  for (const t of floor) {
    if (crawlers.length >= crawlerCount) break;
    const key = `${t.x},${t.y}`;
    if (used.has(key)) continue;
    if (Math.abs(t.x - MINE_ENTRY.x) + Math.abs(t.y - MINE_ENTRY.y) < 3) continue;
    used.add(key);
    crawlers.push({ x: t.x, y: t.y });
  }

  return { ore: ore.filter(n => !s.minedNodes.includes(`${n.x},${n.y}`)), crawlers };
};

// ---- in-game achievements (separate from the site's cake system) ------------------

export const unlockGameAch = (s: GameSave, id: string): boolean => {
  if (s.gameAch.includes(id) || !GAME_ACHIEVEMENTS.some(a => a.id === id)) return false;
  s.gameAch.push(id);
  return true;
};

// Sketchy guy: one daily deal, seeded like the pawn shop. Whether it survives
// the trip home is decided at purchase time by the caller.
export interface SketchyOffer { itemId: string; price: number }
export const sketchyOfferFor = (s: GameSave): SketchyOffer | null => {
  const pool = FURNITURE.filter(f => !s.owned.includes(f.id));
  if (pool.length === 0) return null;
  const rand = mulberry32(s.day * 104729 + 3);
  const f = pool[Math.floor(rand() * pool.length)];
  return { itemId: f.id, price: Math.round((f.price * SKETCHY_DISCOUNT) / 10) * 10 };
};

export const gachaComplete = (s: GameSave): boolean =>
  GACHA_FIGURES.every(name => (s.gacha[name] ?? 0) > 0);

// ---- phone messages ----------------------------------------------------------
// Deliver any catalog messages whose condition is now met and that haven't been
// delivered yet. Returns the messages newly delivered (for a HUD ping). Called
// on scene change, on waking, and at game start.
const msgCtx = (s: GameSave): MsgCtx => ({
  day: s.day,
  timeMin: s.timeMin,
  leftKonbiniAt: s.leftKonbiniAt,
  metStores: s.metStores,
  owned: s.owned,
  placedCount: Object.keys(s.placed).length,
  money: s.money,
  vehicles: s.vehicles,
  hat: s.hat,
  wand: s.wand,
  canFish: s.canFish,
  fishCount: Object.values(s.fishLog).reduce((a, b) => a + b, 0),
  visited: s.visited,
  gameAch: s.gameAch,
});

export const syncMessages = (s: GameSave): PhoneMessage[] => {
  const ctx = msgCtx(s);
  const have = new Set(s.messages.map(m => m.id));
  const fresh: PhoneMessage[] = [];
  for (const def of MESSAGES) {
    if (have.has(def.id) || !def.when(ctx)) continue;
    const msg: PhoneMessage = {
      id: def.id, from: def.from, avatar: def.avatar, company: def.company,
      body: def.body.map(line => line.replaceAll('{name}', s.name)), // address by name, never a pronoun
      day: s.day, read: false,
    };
    s.messages.push(msg);
    fresh.push(msg);
  }
  return fresh;
};

export const unreadCount = (s: GameSave): number =>
  s.messages.reduce((n, m) => n + (m.read ? 0 : 1), 0);

// Push a one-off (non-catalog) message — used for ZamaZonk order/delivery
// receipts. Deduped by id so re-running is safe.
export const pushMessage = (s: GameSave, m: Omit<PhoneMessage, 'day' | 'read'>): void => {
  if (s.messages.some(x => x.id === m.id)) return;
  s.messages.push({ ...m, day: s.day, read: false });
};

// ---- ZamaZonk (the everything store) ----------------------------------------
// An aggressively convenient megacorp. Order furniture from the phone; it pays
// up front and arrives in your boxes the next morning, minus your dignity.

export const ZAMAZONK_FEE = 300; // flat "ZamaPrime convenience fee" per order

export const zamazonkPrice = (f: Furniture): number => f.price + ZAMAZONK_FEE;

// Base furniture you don't own yet and haven't already got in transit.
export const zamazonkCatalog = (s: GameSave): Furniture[] =>
  FURNITURE.filter(f => !s.owned.includes(f.id) && !s.orders.some(o => o.itemId === f.id));

export const orderZamaZonk = (s: GameSave, itemId: string, price: number): boolean => {
  if (s.money < price || s.owned.includes(itemId) || s.orders.some(o => o.itemId === itemId)) return false;
  s.money -= price;
  s.orders.push({ itemId, dueDay: s.day + 1 });
  const name = furnitureById(itemId).name;
  pushMessage(s, {
    id: `zz-order-${itemId}-${s.day}`, from: 'ZamaZonk 📦', avatar: '📦', company: true,
    body: [
      `Order confirmed: 1× ${name}. Thank you for choosing ZamaZonk™.`,
      'A ZamaZonk associate has already been dispatched and is, frankly, sprinting.',
      'Estimated arrival: tomorrow morning. Do not attempt to outrun the driver.',
    ],
  });
  return true;
};

// Deliver every order whose day has come; returns the delivered item ids.
// Call on waking. New furniture lands boxed (place it via Arrange).
export const fulfillDeliveries = (s: GameSave): string[] => {
  const due = s.orders.filter(o => o.dueDay <= s.day);
  if (due.length === 0) return [];
  s.orders = s.orders.filter(o => o.dueDay > s.day);
  const ids: string[] = [];
  for (const o of due) {
    if (!s.owned.includes(o.itemId)) { s.owned.push(o.itemId); s.today.newFurniture.push(o.itemId); ids.push(o.itemId); }
  }
  if (ids.length > 0) {
    const names = ids.map(id => furnitureById(id).name).join(', ');
    pushMessage(s, {
      id: `zz-deliver-${s.day}`, from: 'ZamaZonk 📦', avatar: '📦', company: true,
      body: [
        `Delivered to MAISON KAWA 204: ${names}.`,
        'It is in your boxes. Open your phone → Arrange to set it down.',
        'Rate your driver 5 stars or the algorithm remembers. 🙂',
      ],
    });
  }
  return ids;
};
