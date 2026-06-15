// Little Apartment, Big City — save state. Persists to localStorage like utils/gas.ts.
// Deliberately NOT wired into utils/achievements.ts: adding entries there would
// raise the site-wide "cake" bar. The game tracks its own progression.

import type { Dir } from './engine';
import { mulberry32 } from './engine';
import {
  FURNITURE, PAWN_DISCOUNT, PAWN_STOCK_SIZE, BASE_MAX_ENERGY,
  SLEEP_RESTORE_FUTON, SKETCHY_DISCOUNT, GACHA_FIGURES, GAME_ACHIEVEMENTS,
  itemKind,
} from './data';
import { APARTMENT_SLOTS, RARE_SLOTS, PLACEMENT_SPOTS } from './maps';

export const WAKE_MIN = 7 * 60;       // days start at 7:00 AM
export const COLLAPSE_MIN = 26 * 60;  // 2:00 AM — you fade out and wake up at home

export interface GameSave {
  v: number;                    // save version (v2+: placement system)
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
  monsterFed: boolean;          // gave The Manager a cold one; shop unlocked
  minerals: Record<string, number>; // mineral id -> count
  wand: boolean;                // the magical girl wand
  visited: string[];            // scene ids seen (the DJ only plays places you know)
  donated: number;              // total yen offered at the shrine
  minedDay: number;             // day the mined-node list belongs to
  minedNodes: string[];         // "x,y" ore nodes already mined today
  canFish: boolean;             // learned to fish from Genji at the shore
  fishInv: string[];            // fish ids, unsold
  fishLog: Record<string, number>; // fish id -> total caught
  storySeen: string[];          // story beat ids already shown
  shiftDay: number;             // last day the konbini shift was worked (0 = never)
  sketchyDay: number;           // last day a deal was bought from the sketchy guy
  ended: boolean;               // ending seen (free play continues)
  today: DayLog;                // running tally for the end-of-day recap
}

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
  monsterFed: false,
  minerals: {},
  wand: false,
  visited: ['apartment'],
  donated: 0,
  minedDay: 0,
  minedNodes: [],
  canFish: false,
  fishInv: [],
  fishLog: {},
  storySeen: [],
  shiftDay: 0,
  sketchyDay: 0,
  ended: false,
  today: freshDayLog(3000),
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

export interface OreNode { x: number; y: number; mineral: Mineral }

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
      nodes.push({ x: c.x, y: c.y, mineral });
    }
  }
  return nodes.filter(n => !s.minedNodes.includes(`${n.x},${n.y}`));
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
