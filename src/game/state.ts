// Little Apartment, Big City — save state. Persists to localStorage like utils/gas.ts.
// Deliberately NOT wired into utils/achievements.ts: adding entries there would
// raise the site-wide "cake" bar. The game tracks its own progression.

import type { Dir } from './engine';
import { mulberry32 } from './engine';
import {
  FURNITURE, RARE_FURNITURE, PAWN_DISCOUNT, PAWN_STOCK_SIZE, BASE_MAX_ENERGY,
  SLEEP_RESTORE_FUTON, SKETCHY_DISCOUNT, GACHA_FIGURES, GAME_ACHIEVEMENTS,
  itemKind, MESSAGES, furnitureById, MUSEUM_SLOTS, CROPS, FORAGE, ERRANDS,
} from './data';
import type { Errand } from './data';
import type { PhoneMessage, MsgCtx, Furniture } from './data';
import { APARTMENT_SLOTS, RARE_SLOTS, SCENES } from './maps';

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
  wand2: boolean;               // upgraded wand — bolts pierce, wider light (needs wand)
  gun: boolean;                 // the AK-67 machine gun — full-auto, unlocked deep in the mines
  god: boolean;                 // cheat: crawlers can't hurt you in the mines ("im god")
  pickaxe: number;              // pickaxe tier owned (0 = bare hands; see PICKAXES)
  geodes: number;               // uncracked geodes in your bag
  deepestFloor: number;         // deepest mine floor ever reached (milestones)
  mineStreak: number;           // consecutive days mined (resets if you skip a day)
  mineLastDay: number;          // last day you entered the mines (0 = never)
  visited: string[];            // scene ids seen (the DJ only plays places you know)
  metStores: string[];          // store ids you've interacted with (gave your number → they can text you)
  zamazonkApp: boolean;         // downloaded the ZamaZonk app (after reading the island poster)
  donated: number;              // total yen offered at the shrine
  minedDay: number;             // day the mined-node list belongs to
  minedNodes: string[];         // "x,y" ore nodes already mined today
  canFish: boolean;             // learned to fish from Genji at the shore
  fishRod: number;              // fishing-rod tier (0 = Genji's starter; 1 = his upgraded rod)
  fishInv: string[];            // fish ids, unsold
  fishLog: Record<string, number>; // fish id -> total caught
  storySeen: string[];          // story beat ids already shown
  shiftDay: number;             // last day the konbini shift was worked (0 = never)
  lotteryDay: number;           // day a konbini lottery ticket was bought (0 = none); resolves next morning
  leftKonbiniAt: number | null; // absolute in-game minute you first left the konbini (job unlocks ~1h later)
  sketchyDay: number;           // last day a deal was bought from the sketchy guy
  forageDay: number;            // day the current beach forage was seeded (0 = none); resets each morning
  foragedSpots: number[];       // indices of today's shore finds already grabbed
  errandDay: number;            // last day the odd-jobs board errand was completed (0 = none); one per day
  greenhouseUnlocked: boolean;  // Granny Soto handed over the greenhouse key (after the fish errand)
  ended: boolean;               // ending seen (free play continues)
  today: DayLog;                // running tally for the end-of-day recap
  messages: PhoneMessage[];     // smartphone texts delivered so far
  orders: ZamaOrder[];          // ZamaZonk furniture in transit (arrives next morning)
  forceRain: boolean;           // cheat: force rain for the current day (cleared next morning)
  rainCleared: boolean;         // a shrine offering made the rain suddenly stop today (cleared next morning)
  shrineDay: number;            // last day an offering was made at the shrine (0 = never); one per day
  museum: { donated: string[] }; // MUSEUM_SLOTS ids the player has donated a piece to (empty by default)
  greenhouse: GreenhouseState;  // Granny Soto's community greenhouse (crop plots + sprinklers)
  cat: { found: boolean; name: string }; // the black stray adopted from the Downtown dumpster; roams the apartment
  collectibles: string[];       // museum collectible item ids found but not yet donated (in your bag)
}

// A ZamaZonk order in transit. Paid for now; lands in the boxes on `dueDay`.
export interface ZamaOrder { itemId: string; dueDay: number }

// ---- Greenhouse --------------------------------------------------------------
// A single soil plot. `crop` is a CROPS id (or null = empty). `stage` runs
// 0..(crop.stages-1); the top stage is harvestable. `wateredDay` is the last day
// the sprinklers watered it (flavor + room for "missed a day" rules later).
export interface GreenhousePlot { crop: string | null; plantedDay: number; stage: number; wateredDay: number }
export interface GreenhouseState { sprinklerOn: boolean; plots: GreenhousePlot[] }

const freshPlot = (): GreenhousePlot => ({ crop: null, plantedDay: 0, stage: 0, wateredDay: 0 });

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
  wand2: false,
  gun: false,
  god: false,
  pickaxe: 0,
  geodes: 0,
  deepestFloor: 0,
  mineStreak: 0,
  mineLastDay: 0,
  visited: ['apartment'],
  metStores: [],
  zamazonkApp: false,
  donated: 0,
  minedDay: 0,
  minedNodes: [],
  canFish: false,
  fishRod: 0,
  fishInv: [],
  fishLog: {},
  storySeen: [],
  shiftDay: 0,
  lotteryDay: 0,
  leftKonbiniAt: null,
  sketchyDay: 0,
  forageDay: 0,
  foragedSpots: [],
  errandDay: 0,
  greenhouseUnlocked: false,
  ended: false,
  today: freshDayLog(3000),
  messages: [],
  orders: [],
  forceRain: false,
  rainCleared: false,
  shrineDay: 0,
  museum: { donated: [] },
  greenhouse: { sprinklerOn: false, plots: [freshPlot(), freshPlot(), freshPlot()] },
  cat: { found: false, name: '' },
  collectibles: [],
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
      s.carPos = { scene: 'badtown', x: 13, y: 8 };
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
  s.forceRain = false;           // a forced-rain cheat only lasts the one day
  s.rainCleared = false;         // a shrine-stopped rain only counts for that day
};

// Weather: a 20% chance of rain on any day after day 1 (never day 1). The roll
// is a per-day deterministic seed so it stays stable across reloads within a
// day. The `come again another day` cheat (forceRain) overrides the roll; a
// shrine offering that "suddenly stops" the rain (rainCleared) wins over both.
export const isRainyDay = (s: GameSave): boolean =>
  !s.rainCleared && (s.forceRain || (s.day > 1 && mulberry32(s.day * 1013904223 + 53)() < 0.2));

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

// Shore foraging: a daily-seeded scatter of beach finds on the walkable sand —
// ungated early money (instant cash on pickup). Resets each new day (cf.
// mineLayoutFor / pawnStockFor). `foragedSpots` holds the indices already grabbed
// today, so finds you skip stay put but ones you took don't respawn until morning.
export interface ForageSpot { x: number; y: number; kind: string }
export const shoreForageFor = (s: GameSave): ForageSpot[] => {
  if (s.forageDay !== s.day) { s.forageDay = s.day; s.foragedSpots = []; }
  const rand = mulberry32(s.day * 2246822519 + 71);
  // walkable beach sand on the shore map (rows 5-8, cols 1..22)
  const tiles: { x: number; y: number }[] = [];
  for (let y = 5; y <= 8; y++) for (let x = 1; x <= 22; x++) tiles.push({ x, y });
  for (let i = tiles.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [tiles[i], tiles[j]] = [tiles[j], tiles[i]]; }
  const count = 4 + Math.floor(rand() * 3); // 4-6 finds a day
  const totalW = FORAGE.reduce((a, f) => a + f.weight, 0);
  const spots: ForageSpot[] = [];
  for (let i = 0; i < count; i++) {
    let r = rand() * totalW, kind = FORAGE[0].id;
    for (const f of FORAGE) { r -= f.weight; if (r <= 0) { kind = f.id; break; } }
    spots.push({ x: tiles[i].x, y: tiles[i].y, kind });
  }
  return spots;
};

// Whether the player can actually source an errand's item yet — never post a job
// they can't fulfill (e.g. a coconut needs the skiff; a fish needs Genji's lesson).
const errandReachable = (e: Errand, s: GameSave): boolean => {
  switch (e.kind) {
    case 'peepis':
    case 'soda': return true;                          // vending machines are right in the city, day 1
    case 'fish': return s.canFish;                     // must have learned to fish from Genji
    case 'coconut': return s.vehicles.includes('boat'); // need the skiff to reach Kiwami Island
    default: return true;
  }
};
// The odd-jobs board posts ONE fetch errand per day, seeded so it's stable across
// reloads but varies day to day, drawn only from jobs the player can currently do.
// Completed once/day (save.errandDay).
export const errandFor = (s: GameSave): Errand => {
  const pool = ERRANDS.filter(e => errandReachable(e, s));
  const list = pool.length ? pool : ERRANDS.filter(e => e.kind === 'peepis' || e.kind === 'soda');
  return list[Math.floor(mulberry32(s.day * 374761393 + 31)() * list.length)];
};
export const errandDoneToday = (s: GameSave): boolean => s.errandDay === s.day;

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

export const placeItem = (s: GameSave, itemId: string, x: number, y: number): void => {
  s.placed[itemId] = { x, y };
};

export const unplaceItem = (s: GameSave, itemId: string): void => {
  delete s.placed[itemId];
};

// ---- the museum --------------------------------------------------------------------
// The player donates found objects to fill Bingus Doofelsmurt's display slots.
// Collectible items get wired later; this helper is ready for them now. Donating
// records the SLOT id (must be a real MUSEUM_SLOTS slot), dedupes, and persists.
// Returns true if it was a fresh donation.
export const donateToMuseum = (s: GameSave, slotId: string): boolean => {
  if (!MUSEUM_SLOTS.some(sl => sl.id === slotId)) return false;
  if (s.museum.donated.includes(slotId)) return false;
  s.museum.donated.push(slotId);
  persistSave(s);
  return true;
};

export const museumComplete = (s: GameSave): boolean =>
  MUSEUM_SLOTS.every(sl => s.museum.donated.includes(sl.id));

// Shrine luck: tier 1 at ¥5,000 donated, tier 2 at ¥20,000. Each tier makes
// the rarer (valuable) fish noticeably more willing to bite.
export const shrineLuck = (s: GameSave): number =>
  s.donated >= 20000 ? 2 : s.donated >= 5000 ? 1 : 0;

// ---- greenhouse --------------------------------------------------------------
// Plant a crop in an empty plot. Returns false if the plot is taken or the crop
// is unknown.
export const plantCrop = (s: GameSave, plotIdx: number, cropId: string): boolean => {
  const plot = s.greenhouse.plots[plotIdx];
  if (!plot || plot.crop || !CROPS[cropId]) return false;
  plot.crop = cropId;
  plot.plantedDay = s.day;
  plot.stage = 0;
  plot.wateredDay = 0;
  return true;
};

// A plot is harvestable once it has reached its crop's final stage.
export const plotReady = (plot: GreenhousePlot): boolean => {
  if (!plot.crop) return false;
  const crop = CROPS[plot.crop];
  return Boolean(crop) && plot.stage >= crop.stages - 1;
};

// Harvest a fully-grown plot: pay the reward, clear the plot. Returns the yen
// paid out, or null if the plot wasn't ready.
export const harvestCrop = (s: GameSave, plotIdx: number): number | null => {
  const plot = s.greenhouse.plots[plotIdx];
  if (!plot || !plotReady(plot)) return null;
  const reward = CROPS[plot.crop!].reward;
  s.money += reward;
  plot.crop = null;
  plot.plantedDay = 0;
  plot.stage = 0;
  plot.wateredDay = 0;
  return reward;
};

// Morning growth: if the sprinklers ran, every planted plot drinks for the day
// and climbs one growth stage toward bloom (capped at its final stage). Call once
// per new morning (after the day has advanced). No sprinklers → no growth.
export const growGreenhouse = (s: GameSave): void => {
  if (!s.greenhouse.sprinklerOn) return;
  for (const plot of s.greenhouse.plots) {
    if (!plot.crop) continue;
    const crop = CROPS[plot.crop];
    if (!crop) continue;
    plot.wateredDay = s.day;
    if (plot.stage < crop.stages - 1) plot.stage += 1;
  }
};

// ---- the mines ---------------------------------------------------------------------
// A multi-floor descent. Each floor reseeds richer + deadlier; you ascend all the
// way back to the surface in one go. Mined nodes stay gone until you sleep.

import { MINERALS, MINE_CHALLENGES, GEODE_REWARDS, GACHA_FIGURES as GEODE_FIGURES } from './data';
import type { Mineral, MineChallenge } from './data';

export type CrawlerKind = 'normal' | 'fast' | 'tank' | 'gold';
export interface OreNode { x: number; y: number; mineral: Mineral; amount: number; geode?: boolean }
export interface MineCrawler { x: number; y: number; kind: CrawlerKind }

// ---- daily mine layout ------------------------------------------------------------
// Regenerated per in-game DAY and per FLOOR. Seed = day + floor, so a given day's
// given floor is stable (re-enter / reload safe) but every day and every depth is
// different. Variance is intentional — lean days, jackpot days. Deeper floors push
// toward MORE ore, RARER ore, and MORE / TOUGHER crawlers.
//
// A daily CHALLENGE (mineChallengeFor) nudges the whole day. The shrine secretly
// biases toward more/rarer ore and fewer crawlers (shrineLuck + total donated), and
// a mining STREAK adds a small luck bonus. Mined-node keys are floor-scoped so the
// same tile on different floors is tracked separately.

export interface MineLayout { ore: OreNode[]; crawlers: MineCrawler[]; down: { x: number; y: number } }

// Floor-scoped key for the mined-node set (so floor 1 and floor 2 don't collide).
export const minedKey = (floor: number, x: number, y: number): string => `${floor}:${x},${y}`;

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

// The day's modifier — seeded by the day so it's stable, surfaced on the HUD.
export const mineChallengeFor = (s: GameSave): MineChallenge => {
  const rand = mulberry32(s.day * 6700417 + 11);
  return MINE_CHALLENGES[Math.floor(rand() * MINE_CHALLENGES.length)];
};

// Mark today's dive for the streak (call once when you enter from the surface).
export const enterMineStreak = (s: GameSave): void => {
  if (s.mineLastDay === s.day) return;            // already counted today
  s.mineStreak = s.mineLastDay === s.day - 1 ? s.mineStreak + 1 : 1;
  s.mineLastDay = s.day;
};

export const mineLayoutFor = (s: GameSave, floor = 1): MineLayout => {
  if (s.minedDay !== s.day) { s.minedDay = s.day; s.minedNodes = []; }
  const ch = mineChallengeFor(s);
  const rand = mulberry32(s.day * 2654435761 + floor * 40503 + 97);
  const luck = shrineLuck(s);                          // 0 / 1 / 2 shrine tiers
  const grace = Math.min(0.35, s.donated / 120000);    // smooth nudge from total offered
  const streakBonus = Math.min(0.2, s.mineStreak * 0.02);
  const depth = floor - 1;                              // 0 on the first floor

  // Seeded Fisher–Yates over the floor so picks scatter (and stay walkable),
  // skipping the entry tile entirely.
  const tiles = MINE_FLOOR.filter(t => !(t.x === MINE_ENTRY.x && t.y === MINE_ENTRY.y));
  for (let i = tiles.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
  }

  // The descend ladder: a seeded floor tile, well away from the entry so you have
  // to cross the floor to reach it. Different spot every floor / day. Reserved so
  // no ore or crawler spawns on top of it.
  const down = tiles.find(t => Math.abs(t.x - MINE_ENTRY.x) + Math.abs(t.y - MINE_ENTRY.y) >= 7) ?? tiles[tiles.length - 1];
  const reserved = new Set<string>([`${down.x},${down.y}`]);

  // richness drives BOTH how many nodes and how rare they skew. Squared so lean
  // days are the norm; depth, the shrine, and your streak push toward the jackpot.
  let richness = rand() * rand();
  richness = Math.min(1, richness + luck * 0.18 + grace + streakBonus + depth * 0.06);
  if (ch.id === 'rich') richness = Math.min(1, richness + 0.2);
  if (ch.id === 'calm') richness = Math.min(1, richness + 0.05);
  const oreCount = Math.round(3 + richness * 12 + depth);

  // Mineral pool is gated by floor — deep ore simply isn't here until you descend.
  const pool = MINERALS.filter(m => m.minFloor <= floor);

  // Tilt toward the scarcer (valuable) ore as richness / luck / depth rise; the
  // cheap coal & iron keep base weight so the shallows never go fully barren.
  let tilt = 1 + richness * 1.4 + luck * 0.8 + depth * 0.25;
  if (ch.id === 'deep') tilt += depth * 0.4;
  const tiltedW = (m: Mineral) => {
    const base = (m.id === 'coal' || m.id === 'iron') ? m.weight : m.weight * tilt;
    return ch.id === 'crystal' && m.id === 'crystal' ? base * 4 : base;  // Crystal Rush
  };
  const tTotal = pool.reduce((sum, m) => sum + tiltedW(m), 0);

  // How often a node is a sealed geode instead of plain ore.
  let geodeChance = 0.05 + depth * 0.012;
  if (ch.id === 'geode') geodeChance += 0.18;

  const ore: OreNode[] = [];
  const used = new Set<string>(reserved);   // the descend ladder tile stays clear
  for (let i = 0, placed = 0; placed < oreCount && i < tiles.length; i++) {
    const c = tiles[i];
    const key = `${c.x},${c.y}`;
    if (reserved.has(key)) continue;         // never bury the ladder under ore
    used.add(key);
    placed++;
    if (rand() < geodeChance) { ore.push({ x: c.x, y: c.y, mineral: pool[0], amount: 1, geode: true }); continue; }
    let r = rand() * tTotal;
    let mineral = pool[0];
    for (const m of pool) { r -= tiltedW(m); if (r <= 0) { mineral = m; break; } }
    // Rich veins yield extra; deeper floors hit them more often.
    const vein = rand();
    const hi = 0.02 + richness * 0.05 + depth * 0.01;
    const mid = 0.07 + richness * 0.13 + depth * 0.03;
    const amount = vein < hi ? 3 : vein < mid ? 2 : 1;
    ore.push({ x: c.x, y: c.y, mineral, amount });
  }

  // Crawlers: scale with depth and the challenge, reduced by shrine favor.
  let crawlerCount = Math.round(rand() * 4 + depth * 0.8);
  crawlerCount = Math.max(0, crawlerCount - luck - (grace > 0.15 ? 1 : 0));
  if (ch.id === 'infested') crawlerCount += 3;
  if (ch.id === 'calm') crawlerCount = Math.max(0, crawlerCount - 2);

  const crawlers: MineCrawler[] = [];
  for (const t of tiles) {
    if (crawlers.length >= crawlerCount) break;
    const key = `${t.x},${t.y}`;
    if (used.has(key)) continue;
    if (Math.abs(t.x - MINE_ENTRY.x) + Math.abs(t.y - MINE_ENTRY.y) < 3) continue;
    used.add(key);
    // Kind skews tougher with depth; a rare gold crawler can show up anywhere.
    const k = rand();
    let kind: CrawlerKind = 'normal';
    if (k < 0.05 + depth * 0.005) kind = 'gold';
    else if (depth >= 2 && k < 0.3) kind = 'tank';
    else if (depth >= 1 && k < 0.55) kind = 'fast';
    crawlers.push({ x: t.x, y: t.y, kind });
  }

  return { ore: ore.filter(n => !s.minedNodes.includes(minedKey(floor, n.x, n.y))), crawlers, down };
};

// ---- geodes ------------------------------------------------------------------------
// Crack one for a weighted random reward. Mutates the save and returns a short blurb
// (text + accent color) for the popup, or null if you have none.
export const crackGeode = (s: GameSave): { text: string; color: string } | null => {
  if (s.geodes <= 0) return null;
  s.geodes -= 1;
  const total = GEODE_REWARDS.reduce((a, r) => a + r.weight, 0);
  let r = Math.random() * total;
  let pick = GEODE_REWARDS[0];
  for (const g of GEODE_REWARDS) { r -= g.weight; if (r <= 0) { pick = g; break; } }
  const add = (id: string, n: number) => { s.minerals[id] = (s.minerals[id] ?? 0) + n; };
  switch (pick.id) {
    case 'cash': { const amt = 300 + Math.floor(Math.random() * 1200); s.money += amt; return { text: `¥${amt.toLocaleString()} spills out!`, color: '#ffd24a' }; }
    case 'crystal': { const n = 2 + Math.floor(Math.random() * 3); add('crystal', n); return { text: `${n}× Hum Crystal!`, color: '#7ce8e0' }; }
    case 'opal': { const n = 1 + Math.floor(Math.random() * 2); add('opal', n); return { text: `${n}× Void Opal!`, color: '#b06ad0' }; }
    case 'starstone': { add('starstone', 1); return { text: 'An Astral Stone!', color: '#ff7cc4' }; }
    case 'gacha': { const fig = GEODE_FIGURES[Math.floor(Math.random() * GEODE_FIGURES.length)]; s.gacha[fig] = (s.gacha[fig] ?? 0) + 1; return { text: `A figure: ${fig}!`, color: '#ff7cc4' }; }
    case 'jackpot': { s.money += 5000; add('opal', 2); return { text: 'JACKPOT! ¥5,000 + 2 Void Opal!', color: '#ffd24a' }; }
  }
  return null;
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
  zamazonkApp: s.zamazonkApp,
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
        `Delivered to NAKATOMI APARTMENTS 204: ${names}.`,
        'It is in your boxes. Open your phone → Arrange to set it down.',
        'Rate your driver 5 stars or the algorithm remembers. 🙂',
      ],
    });
  }
  return ids;
};
