// Little Apartment, Big City — save state. Persists to localStorage like utils/gas.ts.
// Deliberately NOT wired into utils/achievements.ts: adding entries there would
// raise the site-wide "cake" bar. The game tracks its own progression.

import type { Dir } from './engine';
import { mulberry32 } from './engine';
import {
  FURNITURE, RARE_FURNITURE, PAWN_DISCOUNT, PAWN_STOCK_SIZE, BASE_MAX_ENERGY,
  SLEEP_RESTORE_FUTON, SKETCHY_DISCOUNT, GACHA_FIGURES, GAME_ACHIEVEMENTS,
  itemKind, MESSAGES, furnitureById, MUSEUM_SLOTS, CROPS, cropStage, CROP_QUALITY_MULT,
  CROP_REQUESTS, NON_MANAGER_RARES, FORAGE, ERRANDS, STREET_EVENTS,
  RECIPES, recipeById, STARTER_RECIPES, GIFT_POINTS, HEART_POINTS, MAX_HEARTS,
  friendById, decorById, STARTER_DECOR, DEFAULT_DECOR,
  FRIENDS, FRIEND_HEART_LINES, HANGOUTS, HOME_VISITS,
  SHRINE_RESTORE_PRICE, CHARLIE_PATRON_PRICE, HOME_ONSEN_PRICE,
  MISSIONS,
  fishingTournamentDay, tournamentTierFor,
} from './data';
import type { TournamentTier } from './data';
import type { Recipe, BuffId, GiftKind, GiftTier, IngredientKind, Fish, FishSky, Mission } from './data';
import type { HangoutScene, HomeVisit } from './data';
import type { CropRequest } from './data';
import type { Errand, StreetEvent } from './data';
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
  palmsShaken: string[];        // "x,y" palms/bananas already shaken today
  onsenDay: number;             // last day you soaked in the island hot spring (0 = never)
  shrineRestored: boolean;      // funded the shrine's restoration → permanent extra luck tier
  charliePatron: boolean;       // became Charlie's patron
  homeOnsen: boolean;           // bought the private home onsen (a hot spring at the apartment)
  homeOnsenDay: number;         // last day you soaked in the home onsen (0 = never)
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
  vaultsLooted: string[];       // "day:floor" treasure-vault chests already opened today
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
  caveDropDay: number;          // last day the island sea cave was searched for drops (0 = none); one per day
  deliveryDay: number;          // last day the Kojima Motors delivery race was run (0 = never); one per day
  deliveryBest: number;         // best delivery time in seconds (0 = none yet); lower is better
  streetEventDay: number;       // last day the daily random street event was completed (0 = none); one per day
  greenhouseUnlocked: boolean;  // Granny Soto handed over the greenhouse key (after the fish errand)
  ended: boolean;               // ending seen (free play continues)
  today: DayLog;                // running tally for the end-of-day recap
  messages: PhoneMessage[];     // smartphone texts delivered so far
  orders: ZamaOrder[];          // ZamaZonk furniture in transit (arrives next morning)
  forceRain: boolean;           // cheat: force rain for the current day (cleared next morning)
  rainCleared: boolean;         // a shrine offering made the rain suddenly stop today (cleared next morning)
  shrineDay: number;            // last day an offering was made at the shrine (0 = never); one per day
  wishDay: number;              // last day a meteor-shower wish was made (0 = never); one wish per shower-night
  museum: { donated: string[] }; // MUSEUM_SLOTS ids the player has donated a piece to (empty by default)
  greenhouse: GreenhouseState;  // Granny Soto's community greenhouse (crop plots + sprinklers)
  cat: { found: boolean; name: string }; // the black stray adopted from the Downtown dumpster; roams the apartment
  catPetDay: number;            // last day David was petted (0 = never); one pet per day
  catGiftDay: number;           // last day David left a morning gift by the door (0 = never)
  missionsDone: string[];       // Journal MISSIONS steps already completed + paid (data.ts)
  collectibles: string[];       // museum collectible item ids found but not yet donated (in your bag)
  keepsakes: string[];          // friendship-capstone keepsake ids held (see KEEPSAKES in data.ts)
  almanac: { minerals: string[]; forage: string[] }; // Almanac app: ever-discovered sets (ore struck / shore finds grabbed) — survives selling
  // --- Cooking / Friendship / Decor (all default-safe; see kb/games.md) ---
  friends: Record<string, { pts: number; giftDay: number }>; // npc id -> friendship points + last day gifted
  pantry: Record<string, number>;   // konbini staples held for cooking (rice/egg/veg -> count)
  produce: Record<string, number>;  // greenhouse crops KEPT (not shipped) for cooking (cropId -> count)
  dishes: Record<string, number>;   // cooked, uneaten dishes (recipeId -> count)
  recipes: string[];                // recipe ids the player knows
  cookedLog: string[];              // recipe ids EVER cooked (drives cooking achievements)
  buff: { id: BuffId; day: number } | null; // active food buff (only valid while day matches)
  decor: { wall: string; floor: string };   // applied room style (DECOR ids; 'default' = original tiles)
  ownedDecor: string[];             // DECOR ids owned (wall/floor/rug)
  rugs: { id: string; x: number; y: number }[]; // rugs placed on the apartment floor (2×2, walkable)
  roomUnlocked: boolean;            // paid the landlord to knock through to the next unit (bigger apartment)
  jukeboxUnlocked: boolean;         // bought the home jukebox from DJ Tanuki (gates the Music phone app)
  homeTrack: string | null;         // jukebox: scene id whose music plays at the apartment (null = default theme)
  skills: { fish: number; mine: number; farm: number }; // gathering XP per skill (level derived)
  casinoWins: number;               // lifetime winning casino bets (any game); opens the Kinryū backroom
  jackpotDay: number;               // day the progressive slots jackpot was last hit (0 = never; pot grows since)
}

// ---- Skills (fishing / mining / farming) -------------------------------------
// XP earned per gather action → a level 0..10 → a perk read at the roll site.
export type SkillId = 'fish' | 'mine' | 'farm';
export const SKILL_XP = [0, 60, 150, 300, 520, 820, 1200, 1700, 2350, 3200, 4300]; // cumulative for levels 0..10
export const skillLevel = (s: GameSave, k: SkillId): number => {
  const xp = s.skills[k] ?? 0; let lv = 0;
  for (let i = 0; i < SKILL_XP.length; i++) if (xp >= SKILL_XP[i]) lv = i;
  return lv;
};
// Progress within the current level (for the UI bar): {level, into, need}.
export const skillProgress = (s: GameSave, k: SkillId): { level: number; into: number; need: number } => {
  const lv = skillLevel(s, k);
  if (lv >= SKILL_XP.length - 1) return { level: lv, into: 1, need: 1 }; // maxed
  const base = SKILL_XP[lv], next = SKILL_XP[lv + 1];
  return { level: lv, into: (s.skills[k] ?? 0) - base, need: next - base };
};
// Add XP; returns the NEW level if it went up this call, else 0.
export const addSkillXp = (s: GameSave, k: SkillId, n: number): number => {
  const before = skillLevel(s, k);
  s.skills[k] = (s.skills[k] ?? 0) + n;
  const after = skillLevel(s, k);
  return after > before ? after : 0;
};

// Price to expand the apartment (paid to the nameless landlord; gated behind the
// backrooms being unlocked — you need the deep money first).
export const ROOM_PRICE = 120000;
export const JUKEBOX_PRICE = 8000; // DJ Tanuki's home jukebox (unlocks the Music app)

// A ZamaZonk order in transit. Paid for now; lands in the boxes on `dueDay`.
export interface ZamaOrder { itemId: string; dueDay: number }

// ---- Greenhouse --------------------------------------------------------------
// A single soil plot. `crop` is a CROPS id (or null = empty). `stage` runs
// 0..(crop.stages-1); the top stage is harvestable. `wateredDay` is the last day
// the sprinklers watered it (flavor + room for "missed a day" rules later).
export interface GreenhousePlot {
  crop: string | null;
  plantedDay: number;
  progress: number;     // watered mornings elapsed, 0..crop.growDays (visual stage derived)
  wateredDay: number;   // last day you hand-watered (or sprinkler/rain did)
  waterStreak: number;  // consecutive watered mornings → harvest quality
  missed: number;       // mornings the plot went dry while growing → caps quality
  fertilized: boolean;  // fertilizer applied → +quality, tolerates one missed watering
}
// A harvested crop waiting in the shipping box (paid next morning).
export interface ShippedCrop { crop: string; quality: number; value: number }
export interface GreenhouseState {
  sprinkler: boolean;   // OWNED auto-watering upgrade (replaces the old manual toggle)
  beds: number;         // tilled plots available: 3 → 6 → 9
  tier: number;         // greenhouse upgrade tier (0..2): unlocks better seeds + a quality bonus
  plots: GreenhousePlot[];
  seeds: Record<string, number>;  // crop id → seeds on hand
  fertilizer: number;             // fertilizer bags on hand
  shipped: ShippedCrop[];         // produce in the shipping box, sold next morning
  request: { id: string; progress: number } | null; // active community request + crops shipped toward it
  requestDay: number;             // day the current request was posted (rotates)
  moonSeed: boolean;              // got the Moonflower seed from the shrine yet
}

const freshPlot = (): GreenhousePlot => ({ crop: null, plantedDay: 0, progress: 0, wateredDay: 0, waterStreak: 0, missed: 0, fertilized: false });
const freshGreenhouse = (): GreenhouseState => ({
  sprinkler: false, beds: 3, tier: 0,
  plots: [freshPlot(), freshPlot(), freshPlot(), freshPlot(), freshPlot(), freshPlot(), freshPlot(), freshPlot(), freshPlot()],
  seeds: {}, fertilizer: 0, shipped: [], request: null, requestDay: 0, moonSeed: false,
});

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

// Clean a player-typed name: drop control chars, collapse runs of whitespace,
// trim, cap at 16 visible chars. Falls back to 'Neighbor' so copy + every
// '{name}' substitution always has a real, safe value.
export const sanitizeName = (raw: string): string => {
  const cleaned = (raw ?? '')
    .replace(/\s+/g, ' ')                          // tabs/newlines/runs -> one space first (so words never merge)
    .replace(/[\u0000-\u001f\u007f-\u009f]/g, '')  // then strip remaining (non-whitespace) control chars
    .trim()
    .slice(0, 16);
  return cleaned || 'Neighbor';
};

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
  onsenDay: 0,
  shrineRestored: false,
  charliePatron: false,
  homeOnsen: false,
  homeOnsenDay: 0,
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
  vaultsLooted: [],
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
  caveDropDay: 0,
  deliveryDay: 0,
  deliveryBest: 0,
  streetEventDay: 0,
  greenhouseUnlocked: false,
  ended: false,
  today: freshDayLog(3000),
  messages: [],
  orders: [],
  forceRain: false,
  rainCleared: false,
  shrineDay: 0,
  wishDay: 0,
  museum: { donated: [] },
  greenhouse: freshGreenhouse(),
  cat: { found: false, name: '' },
  catPetDay: 0,
  catGiftDay: 0,
  missionsDone: [],
  collectibles: [],
  keepsakes: [],
  almanac: { minerals: [], forage: [] },
  friends: {},
  pantry: {},
  produce: {},
  dishes: {},
  recipes: [...STARTER_RECIPES],
  cookedLog: [],
  buff: null,
  decor: { ...DEFAULT_DECOR },
  ownedDecor: [...STARTER_DECOR],
  rugs: [],
  roomUnlocked: false,
  jukeboxUnlocked: false,
  homeTrack: null,
  skills: { fish: 0, mine: 0, farm: 0 },
  casinoWins: 0,
  jackpotDay: 0,
});

// Merge a parsed (possibly older / partial) save blob over fresh defaults and run
// every migration. Shared by loadSave (localStorage) and importSaveCode (pasted
// codes) so an imported save survives shape changes exactly like a stored one.
const mergeSave = (parsed: Partial<GameSave>): GameSave => {
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
    if (parsed.jukeboxUnlocked === undefined && s.homeTrack) s.jukeboxUnlocked = true; // grandfather jukebox users
    // Greenhouse 2.0 migration: old saves stored {sprinklerOn, plots:[{stage}]}.
    // Rebuild into the new shape, carrying over any planted plots + the sprinkler.
    const g = s.greenhouse as unknown as Record<string, unknown>;
    if (g && g.beds === undefined) {
      const old = g as { sprinklerOn?: boolean; plots?: { crop: string | null; plantedDay?: number; stage?: number; wateredDay?: number }[] };
      const fresh = freshGreenhouse();
      if (old.sprinklerOn) fresh.sprinkler = true;
      (old.plots ?? []).forEach((p, i) => {
        if (i < 3 && p && p.crop) {
          const plot = fresh.plots[i];
          plot.crop = p.crop; plot.plantedDay = p.plantedDay ?? 0;
          plot.progress = p.stage ?? 0; plot.wateredDay = p.wateredDay ?? 0;
        }
      });
      s.greenhouse = fresh;
    }
    // Almanac: default-safe nested merge so older saves (and partial future ones) get both sets.
    s.almanac = { minerals: [], forage: [], ...s.almanac };
    return s;
};

export const loadSave = (): GameSave | null => {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return mergeSave(JSON.parse(raw) as Partial<GameSave>);
  } catch { return null; }
};

// ---- Save export / import codes ------------------------------------------------
// A save serialized to one copy-pasteable string (phone Settings app): UTF-8 JSON
// → base64. TextEncoder handles unicode (names like "ゆき" would blow up a bare
// btoa, which only eats latin-1); encoding is chunked so a fat endgame save can't
// overflow the argument list. Dependency-free — btoa/atob + TextEncoder exist in
// every webview (and node ≥16, for the tests).
const b64encode = (str: string): string => {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const b64decode = (b64: string): string => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

export const exportSaveCode = (s: GameSave): string => b64encode(JSON.stringify(s));

// Paste-side: decode + parse, refuse anything that isn't plausibly a v2 save
// (tampered/truncated codes fail the base64/JSON step; a wrong-shaped blob fails
// the type checks), then run the SAME default-merge + migrations as loadSave.
// Returns null on any rejection — the caller shows the friendly message.
export const importSaveCode = (code: string): GameSave | null => {
  try {
    const parsed = JSON.parse(b64decode(code.trim())) as Partial<GameSave>;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    if (parsed.v !== 2) return null;
    if (typeof parsed.money !== 'number' || !Number.isFinite(parsed.money)) return null;
    if (typeof parsed.day !== 'number' || parsed.day < 1) return null;
    if (typeof parsed.name !== 'string' || typeof parsed.scene !== 'string') return null;
    if (!Array.isArray(parsed.owned)) return null;
    return mergeSave(parsed);
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
  + (s.placed['kotatsu'] ? 10 : 0)
  + (buffActive(s, 'hearty') ? 20 : 0); // a Hearty meal lifts the cap for the day

// AC (and a Warming meal) make every exertion 20% cheaper — they stack.
export const energyCost = (s: GameSave, base: number): number =>
  Math.max(1, Math.round(base
    * (s.placed['ac'] ? 0.8 : 1)
    * (buffActive(s, 'warm') ? 0.8 : 1)));

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

// Even shopkeepers take a sick day. ~10% chance a given retail shop is shut for
// the day — seeded per day + shop so it's stable across reloads but a surprise.
// The konbini (24h) and service venues never close; only the proper storefronts.
const CLOSEABLE_STORES = new Set(['denden', 'pawn', 'gacha']);
export const storeClosedToday = (day: number, sceneId: string): boolean => {
  if (day <= 1 || !CLOSEABLE_STORES.has(sceneId)) return false;
  let h = 0;
  for (let i = 0; i < sceneId.length; i++) h = (h * 31 + sceneId.charCodeAt(i)) | 0;
  return mulberry32(day * 2654435761 + h * 40503 + 17)() < 0.1;
};

// Extra outdoor weather, layered on top of (and mutually exclusive with) rain.
// Each is its own per-day seeded roll — stable across reloads, never day 1 — but
// priority is enforced by construction: rain wins over fog, and a meteor shower
// only happens on a clear (non-rainy, non-foggy) night.
//
// FOG: a calm, cozy ~13% misty day. Independent roll, but if it's already a rainy
// day there's no fog (rain takes the sky). The draw loop paints a soft grey-blue
// wash + a gentle vignette on outdoor scenes when this is true.
export const foggyDay = (s: GameSave): boolean =>
  !isRainyDay(s) && s.day > 1 && mulberry32(s.day * 2654435789 + 131)() < 0.16;

// METEOR SHOWER: a rare ~4.5% CLEAR night — only when it's neither rainy nor
// foggy. This just marks the day's sky as a shower sky; the draw loop gates the
// actual shooting-stars on `nightT` (and outdoor scenes), and the player can make
// one wish per shower-night (see `wishDay`) for a next-day `lucky` buff.
export const meteorNight = (s: GameSave): boolean =>
  !isRainyDay(s) && !foggyDay(s) && s.day > 1 && mulberry32(s.day * 374761397 + 89)() < 0.062;

// ---- Weather-gated fish --------------------------------------------------------
// The SKY snapshot a Fish.when predicate reads (see the weather-only species in
// data.ts). The Stargazer only rises to a shower sky once it's properly dark —
// past half the evening ramp — so a meteor-forecast day can't hook it at noon.
export const fishSky = (s: GameSave): FishSky => ({
  rainy: isRainyDay(s),
  meteorNight: meteorNight(s) && nightT(s) > 0.5,
});
// Filter a bite table down to the species actually biting under today's sky.
// Ungated fish always pass, so a clear day just yields the classic table.
export const biteTableFor = (s: GameSave, table: Fish[]): Fish[] => {
  const sky = fishSky(s);
  return table.filter(f => !f.when || f.when(sky));
};

// ---- Daily special events ----------------------------------------------------
// At most one "special day" rolls per day — seeded so it's stable across reloads,
// never day 1. Most days stay ordinary, which is what makes a special one feel
// special. Independent of the weather roll (a day can be rainy AND a market day).
//   'market' — the pawn shop & sketchy dealer carry more, and cheaper.
//   'lucky'  — extra shore finds + richer mine veins; the day just goes your way.
// The player is told each special morning by a phone text (see finishSleep) and
// reminded by a HUD chip + the Journal.
export type DayEvent = 'market' | 'lucky' | null;
export const dayEventFor = (s: GameSave): DayEvent => {
  if (s.day <= 1) return null;
  const r = mulberry32(s.day * 2654435761 + 97)();
  if (r < 0.12) return 'market';
  if (r < 0.24) return 'lucky';
  return null;
};
export const DAY_EVENT_LABEL: Record<'market' | 'lucky', string> = {
  market: '🏷 Market Day',
  lucky: '✨ Lucky Day',
};
// Luck today comes from EITHER a Lucky Day OR a Lucky food buff (a smoothie).
export const luckyToday = (s: GameSave): boolean => dayEventFor(s) === 'lucky' || buffActive(s, 'lucky');

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

// ---- NPC daily routines ------------------------------------------------------
// Key townsfolk amble to a different scene-local spot depending on the time of
// day, so the world feels lived-in instead of randomly drifting. The monolith's
// wander loop steers each routine NPC toward its current block's tile (reusing
// the home-leash + anti-stick movement), then lets it idle nearby once arrived.
export type RoutineBlock = 'morning' | 'midday' | 'evening' | 'night';

// Which block the clock is in. The in-game clock is linear within a day: it runs
// 7:00 (wake) straight through to 26:00 (2 AM collapse) without wrapping, so the
// small hours read as 24–26 and stay in "night".
export const timeBlock = (timeMin: number): RoutineBlock => {
  const h = timeMin / 60;
  if (h < 11) return 'morning';   // wake → late morning
  if (h < 16) return 'midday';    // lunch → afternoon
  if (h < 20) return 'evening';   // dusk
  return 'night';                  // after 8 PM (incl. the post-midnight 24–26 hours)
};

export interface RoutineStop { block: RoutineBlock; tile: { x: number; y: number } }

// Scene-local tiles (verified walkable + reachable against maps.ts: cross-checked
// each tile against the scene's grid + legend, avoiding solids/warps/props). Each
// NPC id matches its `npcs[]` entry in maps.ts, and must also be in WANDER_IDS in
// the monolith so it's spawned as a live, routine-steered wanderer. Folk with a
// clear scene + role:
//   granny      — city: greenhouse at dawn, the torii-garden pond by midday, home at night
//   charlie     — city: loiters by the konbini, drifts west then down to the garden
//   miko        — shrine: works the forecourt around the honden, gate, and lanterns
//   tex         — shore: dune grass up top, down to the waterline, then by the boardwalk
//   old-man     — shore: Genji the angler hugs the waterline, rests up on the sand
//   dancer2/3/4 — nightclub: drift the dancefloor + bar across the night
//   kaiju       — nightclub: the club mascot prowls the floor edges
//   mechanic    — garage: lifts at open, the counter midday, the bays, the toolbench
//   bingus      — museum: the curator does the rounds of the gallery floor
//   tiki        — island: the tiki host works the bar, the sands, then up among the palms
//   casino-host — casino: greets the floor, slots → roulette → blackjack side
//   collector   — gacha: browses the cabinets corner to corner
export const ROUTINES: Record<string, RoutineStop[]> = {
  granny: [
    { block: 'morning', tile: { x: 15, y: 14 } }, // outside the greenhouse door
    { block: 'midday', tile: { x: 24, y: 14 } },  // open grass by the torii garden (not the boxed-in pocket)
    { block: 'evening', tile: { x: 12, y: 16 } }, // back toward home/the planters
    { block: 'night', tile: { x: 8, y: 16 } },    // pottering the home-block grass after dark
  ],
  charlie: [
    { block: 'morning', tile: { x: 15, y: 3 } },  // sidewalk outside the konbini
    { block: 'midday', tile: { x: 5, y: 3 } },    // drifts west past Doki Doki
    { block: 'evening', tile: { x: 12, y: 14 } }, // down by the home block
    { block: 'night', tile: { x: 24, y: 16 } },   // the pond garden after dark
  ],
  miko: [
    { block: 'morning', tile: { x: 14, y: 3 } },  // tending by the honden hall
    { block: 'midday', tile: { x: 8, y: 7 } },    // the central forecourt
    { block: 'evening', tile: { x: 15, y: 7 } },  // right side of the grounds
    { block: 'night', tile: { x: 6, y: 5 } },     // by the stone lantern
  ],
  tex: [
    { block: 'morning', tile: { x: 9, y: 3 } },   // up on the dune grass
    { block: 'midday', tile: { x: 10, y: 7 } },   // down on the warm sand
    { block: 'evening', tile: { x: 16, y: 6 } },  // strolling east along the beach
    { block: 'night', tile: { x: 18, y: 3 } },    // packing the stand up by the boardwalk gate
  ],
  'old-man': [
    { block: 'morning', tile: { x: 4, y: 8 } },   // Genji at the waterline
    { block: 'midday', tile: { x: 12, y: 8 } },   // working the tide further along
    { block: 'evening', tile: { x: 6, y: 6 } },   // up on the sand
    { block: 'night', tile: { x: 4, y: 4 } },     // resting on the grass
  ],
  // --- Club Kaiju patrons (dancefloor = 'd' tiles, surrounding floor = '.') ----
  dancer2: [
    { block: 'morning', tile: { x: 11, y: 7 } },  // far corner of the floor
    { block: 'midday', tile: { x: 8, y: 4 } },    // up toward the front of the floor
    { block: 'evening', tile: { x: 5, y: 7 } },   // back-left of the floor
    { block: 'night', tile: { x: 10, y: 5 } },    // mid-floor, peak hours
  ],
  dancer3: [
    { block: 'morning', tile: { x: 6, y: 4 } },
    { block: 'midday', tile: { x: 10, y: 6 } },
    { block: 'evening', tile: { x: 4, y: 7 } },
    { block: 'night', tile: { x: 8, y: 5 } },
  ],
  dancer4: [
    { block: 'morning', tile: { x: 9, y: 7 } },
    { block: 'midday', tile: { x: 5, y: 4 } },
    { block: 'evening', tile: { x: 11, y: 4 } },
    { block: 'night', tile: { x: 7, y: 6 } },
  ],
  kaiju: [
    { block: 'morning', tile: { x: 13, y: 3 } },  // by the DJ side
    { block: 'midday', tile: { x: 6, y: 7 } },    // down across the floor
    { block: 'evening', tile: { x: 3, y: 1 } },   // prowling the back wall
    { block: 'night', tile: { x: 13, y: 5 } },    // right edge of the floor
  ],
  // --- Kojima Motors (avoids lifts P / benches T / counter C / tires Y / B) ----
  mechanic: [
    { block: 'morning', tile: { x: 3, y: 3 } },   // by the hydraulic lifts at open
    { block: 'midday', tile: { x: 4, y: 5 } },    // at the parts counter
    { block: 'evening', tile: { x: 13, y: 4 } },  // out on the oil-stained bay floor
    { block: 'night', tile: { x: 11, y: 1 } },    // tidying the toolbench wall
  ],
  // --- Kawamachi Museum (floor only; avoids pedestals 'p' + wall frames 'A') ---
  bingus: [
    { block: 'morning', tile: { x: 2, y: 1 } },   // opens up the west gallery
    { block: 'midday', tile: { x: 13, y: 3 } },   // the east wall of frames
    { block: 'evening', tile: { x: 7, y: 6 } },   // centre of the hall
    { block: 'night', tile: { x: 3, y: 7 } },     // closing rounds, south-west
  ],
  // --- Kiwami Island (sand 's' + grass 'g'; avoids water/lagoon/palms/tiki) ----
  tiki: [
    { block: 'morning', tile: { x: 7, y: 10 } },  // tending the tiki bar
    { block: 'midday', tile: { x: 15, y: 12 } },  // along the south sands
    { block: 'evening', tile: { x: 18, y: 6 } },  // up among the palm grove
    { block: 'night', tile: { x: 5, y: 9 } },     // back by the island signpost
  ],
  // --- Kinryū Lounge (carpet only; avoids slots S / blackjack B / roulette R r) -
  'casino-host': [
    { block: 'morning', tile: { x: 2, y: 4 } },   // greets near the west slots
    { block: 'midday', tile: { x: 7, y: 7 } },    // working the centre floor
    { block: 'evening', tile: { x: 13, y: 2 } },  // the east side, top
    { block: 'night', tile: { x: 7, y: 4 } },     // by the roulette, peak hours
  ],
  // --- Gacha Gacha (floor only; avoids the cabinets 'G') -----------------------
  collector: [
    { block: 'morning', tile: { x: 3, y: 2 } },   // first cabinets of the day
    { block: 'midday', tile: { x: 9, y: 3 } },    // east bank of machines
    { block: 'evening', tile: { x: 6, y: 5 } },   // the back row
    { block: 'night', tile: { x: 3, y: 6 } },     // last pulls, south-west corner
  ],
};

// The tile a routine NPC is heading for right now, or null if it has no routine
// (those keep the default wander-near-spawn behaviour). Deterministic: depends
// only on the id + the time block, so the same clock always yields the same spot.
export const routineTargetFor = (npcId: string, timeMin: number): { x: number; y: number } | null => {
  const stops = ROUTINES[npcId];
  if (!stops) return null;
  const block = timeBlock(timeMin);
  const hit = stops.find(st => st.block === block);
  return (hit ?? stops[0]).tile;
};

// ---- Pawn shop daily stock ---------------------------------------------------
// Seeded by day so the stock is stable all day and rotates overnight.

export interface PawnOffer { itemId: string; price: number }

export const pawnStockFor = (s: GameSave): PawnOffer[] => {
  const pool = FURNITURE.filter(f => f.pawnable && !s.owned.includes(f.id));
  const rand = mulberry32(s.day * 7919 + 17);
  const market = dayEventFor(s) === 'market';            // Market Day: one more slot, cheaper
  const size = PAWN_STOCK_SIZE + (market ? 1 : 0);
  const disc = PAWN_DISCOUNT * (market ? 0.85 : 1);
  const picks: PawnOffer[] = [];
  const candidates = [...pool];
  while (picks.length < size && candidates.length > 0) {
    const i = Math.floor(rand() * candidates.length);
    const f = candidates.splice(i, 1)[0];
    // small per-day price wobble so "used" prices feel haggled
    const wobble = 0.9 + rand() * 0.2;
    picks.push({ itemId: f.id, price: Math.round((f.price * disc * wobble) / 10) * 10 });
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
  const count = 4 + Math.floor(rand() * 3) + (luckyToday(s) ? 2 : 0); // 4-6/day, +2 when luck is with you
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

// ---- Kojima Motors delivery race ---------------------------------------------
// A once-a-day dirt-rally side job started from the dispatch clipboard at the
// garage (save.deliveryDay gates it). Reach every checkpoint and deliver before
// the clock runs out; the faster + cleaner the run, the bigger the same-day cash.
// The minigame physics/draw live in LittleApartmentGame.tsx (driveRef, like the
// shift game) — only the daily gate + the payout math live here so they're unit-
// testable and default-safe across saves.
export const DELIVERY_TIME_LIMIT = 60;      // seconds — the DEFAULT limit (each track sets its own; see DRIVE_TRACKS)
export const DELIVERY_BASE = 900;           // flat fee for a completed delivery
export const DELIVERY_ACE_FRAC = 0.57;      // "ace driver" = finishing under ~57% of the track's limit
// Ace threshold for a given track limit (proportional, so it's fair on long + short courses).
export const driveAceTime = (timeLimit: number = DELIVERY_TIME_LIMIT): number => Math.round(timeLimit * DELIVERY_ACE_FRAC);
export const deliveryDoneToday = (s: GameSave): boolean => s.deliveryDay === s.day;
export interface DrivePayout { total: number; base: number; timeBonus: number; cleanBonus: number; onTime: boolean }
// elapsedSec = run time; grassSec = seconds spent off the dirt (the clean-driving penalty);
// timeLimit = the active track's limit (longer courses get more seconds — see DRIVE_TRACKS).
// On-time runs earn base + a big time bonus (faster is more, capped) + a clean bonus.
// A late delivery still pays — just a smaller flat "late" fee (cozy: never fail-hard).
export const drivePayout = (elapsedSec: number, grassSec: number, timeLimit: number = DELIVERY_TIME_LIMIT): DrivePayout => {
  const onTime = elapsedSec <= timeLimit;
  if (!onTime) {
    const late = Math.round(DELIVERY_BASE * 0.4);
    return { total: late, base: late, timeBonus: 0, cleanBonus: 0, onTime: false };
  }
  const base = DELIVERY_BASE;
  const timeBonus = Math.min(2000, Math.round(Math.max(0, timeLimit - elapsedSec) * 42));
  const cleanBonus = Math.round(Math.max(0, 1 - grassSec / 8) * 450);
  return { total: base + timeBonus + cleanBonus, base, timeBonus, cleanBonus, onTime: true };
};

// ---- Random daily street event ----------------------------------------------
// Roughly one charming one-off city vignette per day. Seeded per `day` (mulberry32,
// stable across reloads, like the Market/Lucky/rain/forage rolls) so the same day
// always shows the same event; varies day to day. NEVER on day 1 (the player is
// still settling in). Some days are quiet (returns null) so it stays a surprise.
// Pure read — does not mutate the save. Completion is gated separately by
// save.streetEventDay (one per day). The actor only exists in the CITY.
export const streetEventFor = (s: GameSave): StreetEvent | null => {
  if (s.day <= 1) return null;
  const rand = mulberry32(s.day * 2654435761 + 101);
  if (rand() < 0.25) return null;                    // ~1 in 4 days nothing turns up
  return STREET_EVENTS[Math.floor(rand() * STREET_EVENTS.length)];
};
export const streetEventDoneToday = (s: GameSave): boolean => s.streetEventDay === s.day;

export const buyFurniture = (s: GameSave, itemId: string, price: number): boolean => {
  if (s.owned.includes(itemId) || s.money < price) return false;
  s.money -= price;
  s.owned.push(itemId);
  s.today.newFurniture.push(itemId);
  return true;
};

// The ending wants the furniture actually IN the apartment, not in boxes.
// Optional decor (f.optional) is ignored — only the core, non-optional set gates it.
export const allFurnished = (s: GameSave): boolean =>
  FURNITURE.filter(f => !f.optional).every(f => Boolean(s.placed[f.id]));

// True once every one of The Manager's rare furniture pieces has been acquired
// (owned, boxed or placed). Drives the Manager's Paris reveal. The coffin is
// David's gift, not the Manager's stock, so it doesn't count here.
export const allRaresOwned = (s: GameSave): boolean =>
  RARE_FURNITURE.filter(f => !NON_MANAGER_RARES.has(f.id)).every(f => s.rares.includes(f.id));

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

// ---- Kinryū Lounge: progressive jackpot + the backroom -------------------------------
// The slots' progressive jackpot grows a seeded ¥400–899 every day since it was
// last hit (s.jackpotDay; 0 = never, so it's been building since before day 1 —
// a brand-new save already sees base + day 1's growth). Deterministic — the
// slots panel, the lobby and the morning bulletin all derive the same number.
// Capped so a long-untouched pot (or a veteran save meeting the feature) can't
// balloon absurdly; the pot plateaus around day ~70 untouched. Triple-7s pay it
// out on top of the normal 50× line. The panel re-derives this every render
// (including the 80ms reel-spin ticks), so the last result is memoized — the
// value only changes when day or jackpotDay does.
export const JACKPOT_BASE = 4000;
export const JACKPOT_CAP = 50000;
let jackpotMemo = { day: -1, jackpotDay: -1, pot: JACKPOT_BASE };
export const jackpotFor = (s: Pick<GameSave, 'day' | 'jackpotDay'>): number => {
  if (s.day === jackpotMemo.day && s.jackpotDay === jackpotMemo.jackpotDay) return jackpotMemo.pot;
  let pot = JACKPOT_BASE;
  for (let d = s.jackpotDay + 1; d <= s.day && pot < JACKPOT_CAP; d++)
    pot += 400 + Math.floor(mulberry32(d * 1299709 + 43)() * 500); // +¥400..899/day
  pot = Math.min(pot, JACKPOT_CAP);
  jackpotMemo = { day: s.day, jackpotDay: s.jackpotDay, pot };
  return pot;
};
// Lifetime winning bets that part the velvet curtain at the back of the hall.
export const BACKROOM_WINS = 15;
export const backroomOpen = (s: GameSave): boolean => s.casinoWins >= BACKROOM_WINS;

// Shrine luck: tier 1 at ¥5,000 donated, tier 2 at ¥20,000. Each tier makes
// the rarer (valuable) fish noticeably more willing to bite. Funding the shrine's
// full restoration (see restoreShrine) grants a PERMANENT extra tier on top of the
// donation tiers, capped at 3.
export const SHRINE_LUCK_MAX = 3;
export const shrineLuck = (s: GameSave): number => {
  const base = s.donated >= 20000 ? 2 : s.donated >= 5000 ? 1 : 0;
  return Math.min(SHRINE_LUCK_MAX, base + (s.shrineRestored ? 1 : 0));
};

// ---- Keepsakes ---------------------------------------------------------------
// One-of-a-kind mementos earned at friendship capstones (see KEEPSAKES in
// data.ts). Held forever once granted. Pure + testable — the wiring layer reads
// reward.keepsake and calls grantKeepsake; effects (food/sell/luck/display) read
// hasKeepsake. Yoshi's omamori adds a small PASSIVE luck nudge while carried.
export const hasKeepsake = (s: GameSave, id: string): boolean => s.keepsakes.includes(id);
export const grantKeepsake = (s: GameSave, id: string): boolean => {
  if (s.keepsakes.includes(id)) return false;   // already held — no duplicate
  s.keepsakes.push(id);
  return true;
};
// The omamori charm's passive luck: a small, permanent richness/finds bump while
// it's in your bag. Deliberately gentle so it stacks with shrine luck without
// blowing the caps (the mine richness/forage paths still clamp).
export const OMAMORI_LUCK = 0.06;
export const omamoriLuck = (s: GameSave): number => hasKeepsake(s, 'omamori') ? OMAMORI_LUCK : 0;

// ---- Island sea cave: luck drops + the Bigfoot sighting -----------------------
// Squeezing into the sea cave (after the one-time nest egg) lets you search the
// dark once a day for whatever the tide left behind. What you turn up is gated by
// your luck — shrine favor, the omamori, a Lucky day/meal all push the roll toward
// the rarer ore (and away from a fistful of damp coins). Pure + testable: pass an
// rng for deterministic tests; defaults to Math.random for in-game surprise.
export const SEACAVE_SEARCH_COST = 8;   // energy to dig through the cave floor
export const seacaveSearchDoneToday = (s: GameSave): boolean => s.caveDropDay === s.day;
// Total luck the cave reads: shrine tiers (0..3) + omamori (0/1) + a Lucky glow (0/1).
export const caveLuck = (s: GameSave): number =>
  shrineLuck(s) + (hasKeepsake(s, 'omamori') ? 1 : 0) + (luckyToday(s) ? 1 : 0); // 0..5
export interface CaveDrop { money: number; mineralId: string | null; count: number }
export const seacaveDrop = (s: GameSave, rng: () => number = Math.random): CaveDrop => {
  const roll = rng() + caveLuck(s) * 0.09;   // luck nudges the roll up toward the good stuff
  if (roll >= 1.08) return { money: 0, mineralId: 'starstone', count: 1 };
  if (roll >= 0.88) return { money: 0, mineralId: 'opal',      count: 1 };
  if (roll >= 0.64) return { money: 0, mineralId: 'crystal',   count: 1 };
  if (roll >= 0.40) return { money: 0, mineralId: 'shard',     count: 1 + (rng() < 0.3 ? 1 : 0) };
  return { money: 120 + Math.floor(rng() * 240), mineralId: null, count: 0 }; // a handful of salt-blackened coins
};

// Bigfoot only shows himself in the cave on a rare, luck-blessed day — and only
// until you've actually met him (after that he's holed up at Club Kaiju). Seeded
// per-day so it's stable across reloads; the THRESHOLD scales with luck, so a
// Lucky day or a fat shrine donation genuinely improves your odds of a sighting.
export const bigfootSightChance = (s: GameSave): number =>
  Math.min(0.18, 0.02 + shrineLuck(s) * 0.015 + omamoriLuck(s) + (luckyToday(s) ? 0.05 : 0));
export const bigfootInCaveToday = (s: GameSave): boolean => {
  if (s.storySeen.includes('bigfoot-met')) return false; // already met — he's at the club now
  return mulberry32(s.day * 2654435761 + 909)() < bigfootSightChance(s);
};

// ---- One-time prestige purchases ---------------------------------------------
// Each charges once, sets its flag, and returns true on success (false if already
// owned or short on money). Pure + testable — the wiring agent just CALLs these.

// Fund the shrine's full restoration → a permanent extra shrineLuck tier.
export const restoreShrine = (s: GameSave): boolean => {
  if (s.shrineRestored || s.money < SHRINE_RESTORE_PRICE) return false;
  s.money -= SHRINE_RESTORE_PRICE;
  s.shrineRestored = true;
  return true;
};

// Become Charlie's patron.
export const sponsorCharlie = (s: GameSave): boolean => {
  if (s.charliePatron || s.money < CHARLIE_PATRON_PRICE) return false;
  s.money -= CHARLIE_PATRON_PRICE;
  s.charliePatron = true;
  return true;
};

// Install a private hot spring at the apartment (unlocks homeSoak).
export const buyHomeOnsen = (s: GameSave): boolean => {
  if (s.homeOnsen || s.money < HOME_ONSEN_PRICE) return false;
  s.money -= HOME_ONSEN_PRICE;
  s.homeOnsen = true;
  return true;
};

// Soak in the home onsen (once per day). Mirrors the island spring: restores a big
// chunk of energy (capped) and grants the day-long `warm` buff (cheaper exertions).
export const homeSoak = (s: GameSave): boolean => {
  if (!s.homeOnsen || s.homeOnsenDay === s.day) return false;
  s.homeOnsenDay = s.day;
  const max = maxEnergy(s);
  s.energy = Math.min(max, s.energy + Math.round(max * 0.6));
  s.buff = { id: 'warm', day: s.day };
  return true;
};

// ---- greenhouse (Community Garden 2.0) ---------------------------------------
// Costs for the upgrades.
export const SPRINKLER_COST = 6000;
export const FERTILIZER_COST = 250;
export const BED_COSTS: Record<number, number> = { 6: 4000, 9: 12000 }; // pay to till to the next bed count
export const TIER_COSTS: Record<number, number> = { 1: 8000, 2: 30000 }; // glass-repair tiers (quality bonus + better seeds)

// Visual growth stage (0..3) for a planted plot.
export const plotStage = (plot: GreenhousePlot): number => {
  const crop = plot.crop ? CROPS[plot.crop] : undefined;
  return crop ? cropStage(crop, plot.progress) : 0;
};
// A plot is harvestable once its progress reaches the crop's grow time.
export const plotReady = (plot: GreenhousePlot): boolean => {
  const crop = plot.crop ? CROPS[plot.crop] : undefined;
  return Boolean(crop) && plot.progress >= crop!.growDays;
};
// Seed-shop catalog: crops sold once the greenhouse tier is high enough.
// (Moonflower is never sold — its seed comes from the shrine.)
export const seedShopFor = (s: GameSave) =>
  Object.values(CROPS).filter(c => c.seedCost > 0 && c.tier <= s.greenhouse.tier + 0 && c.id !== 'moonflower' && c.tier <= s.greenhouse.tier);

export const buySeed = (s: GameSave, cropId: string, qty = 1): boolean => {
  const c = CROPS[cropId];
  if (!c || c.seedCost <= 0) return false;
  const cost = c.seedCost * qty;
  if (s.money < cost) return false;
  s.money -= cost;
  s.greenhouse.seeds[cropId] = (s.greenhouse.seeds[cropId] ?? 0) + qty;
  return true;
};

// Plant a seed you own in an empty, tilled plot.
export const plantCrop = (s: GameSave, plotIdx: number, cropId: string): boolean => {
  const plot = s.greenhouse.plots[plotIdx];
  if (!plot || plot.crop || !CROPS[cropId]) return false;
  if (plotIdx >= s.greenhouse.beds) return false;          // bed not tilled yet
  if ((s.greenhouse.seeds[cropId] ?? 0) <= 0) return false; // no seed
  s.greenhouse.seeds[cropId] -= 1;
  plot.crop = cropId;
  plot.plantedDay = s.day;
  plot.progress = 0; plot.wateredDay = 0; plot.waterStreak = 0; plot.missed = 0; plot.fertilized = false;
  return true;
};

// Hand-water a growing plot (once per day). Sprinkler owners don't need this.
export const waterPlot = (s: GameSave, plotIdx: number): boolean => {
  const plot = s.greenhouse.plots[plotIdx];
  if (!plot || !plot.crop || plotReady(plot)) return false;
  if (plot.wateredDay === s.day) return false; // already watered today
  plot.wateredDay = s.day;
  return true;
};

// Water every planted, growing, dry plot in one go (watering is free). Beds the
// sprinkler already covers are skipped (they auto-water at dawn). Returns how many
// beds actually got a drink, so the caller can toast/sfx only when something changed.
// Uproot a planted crop (no refund) so the bed is free to replant.
export const clearPlot = (s: GameSave, plotIdx: number): boolean => {
  const plot = s.greenhouse.plots[plotIdx];
  if (!plot || !plot.crop) return false;
  plot.crop = null; plot.plantedDay = 0; plot.progress = 0; plot.wateredDay = 0;
  plot.waterStreak = 0; plot.missed = 0; plot.fertilized = false;
  return true;
};

export const applyFertilizer = (s: GameSave, plotIdx: number): boolean => {
  const plot = s.greenhouse.plots[plotIdx];
  if (!plot || !plot.crop || plot.fertilized || s.greenhouse.fertilizer <= 0) return false;
  s.greenhouse.fertilizer -= 1;
  plot.fertilized = true;
  return true;
};

// Harvest quality (0 normal / 1 silver / 2 gold) from care + upgrades + shrine favor.
const harvestQuality = (s: GameSave, plot: GreenhousePlot): number => {
  let pts = 0;
  if (plot.missed === 0) pts += 2; else if (plot.missed <= 1) pts += 1; // tended it well
  if (plot.fertilized) pts += 1;
  pts += s.greenhouse.tier;     // 0..2
  pts += shrineLuck(s);         // 0..3 — the shrine's favor shows in the soil
  pts += skillLevel(s, 'farm') >= 8 ? 2 : skillLevel(s, 'farm') >= 4 ? 1 : 0; // a green thumb shows
  return pts >= 5 ? 2 : pts >= 3 ? 1 : 0;
};

// Active community request (the one Granny has posted), or null.
export const activeRequest = (s: GameSave): CropRequest | null =>
  s.greenhouse.request ? (CROP_REQUESTS.find(r => r.id === s.greenhouse.request!.id) ?? null) : null;
// Post a fresh request if none is active (seeded by day so it's stable).
export const postRequest = (s: GameSave): void => {
  if (s.greenhouse.request) return;
  const r = CROP_REQUESTS[Math.floor(mulberry32(s.day * 911 + 7)() * CROP_REQUESTS.length)];
  s.greenhouse.request = { id: r.id, progress: 0 };
  s.greenhouse.requestDay = s.day;
};
// Credit a harvested crop toward the active request; returns the bonus paid (0 if none).
const creditRequest = (s: GameSave, cropId: string): number => {
  const req = s.greenhouse.request; if (!req) return 0;
  const r = CROP_REQUESTS.find(x => x.id === req.id); if (!r || r.crop !== cropId) return 0;
  if (req.progress >= r.count) return 0;
  req.progress += 1;
  if (req.progress >= r.count) { s.money += r.reward; s.greenhouse.request = null; return r.reward; }
  return 0;
};

export interface HarvestResult { cropId: string; quality: number; value: number; requestBonus: number; capstone: boolean }
// Harvest a ready plot: produce goes to the shipping box (paid next morning).
// Regrowing crops re-ripen; others clear the plot. Returns the harvest details.
// `keep` diverts the crop into your cooking pantry (save.produce) instead of the
// shipping box — so it pays nothing now but can be cooked. (No request credit when
// kept; community requests are about what you ship.)
export const harvestCrop = (s: GameSave, plotIdx: number, keep = false): HarvestResult | null => {
  const plot = s.greenhouse.plots[plotIdx];
  if (!plot || !plot.crop || !plotReady(plot)) return null;
  const crop = CROPS[plot.crop]; const cropId = plot.crop;
  const quality = harvestQuality(s, plot);
  const value = Math.round(crop.reward * CROP_QUALITY_MULT[quality]);
  if (keep) s.produce[cropId] = (s.produce[cropId] ?? 0) + 1;
  else s.greenhouse.shipped.push({ crop: cropId, quality, value });
  const requestBonus = keep ? 0 : creditRequest(s, cropId);
  const capstone = cropId === 'moonflower' && !s.rares.includes('bloomlamp');
  if (capstone) s.rares.push('bloomlamp'); // achievement toast fired by the caller (award)
  if (crop.regrow) {
    // Multi-harvest: re-ripens in `regrow` watered days; fertilizer is consumed.
    plot.progress = Math.max(0, crop.growDays - crop.regrow);
    plot.waterStreak = 0; plot.missed = 0; plot.fertilized = false; plot.wateredDay = 0;
  } else {
    plot.crop = null; plot.plantedDay = 0; plot.progress = 0; plot.wateredDay = 0;
    plot.waterStreak = 0; plot.missed = 0; plot.fertilized = false;
  }
  return { cropId, quality, value, requestBonus, capstone };
};

// Morning: each planted plot drinks if it was watered yesterday (or the sprinkler
// runs) and climbs toward harvest; a dry morning stalls it + dents quality. Call
// once per new morning (after the day has advanced). Also pays out the shipping box.
export const growGreenhouse = (s: GameSave): void => {
  const g = s.greenhouse;
  for (let i = 0; i < g.beds; i++) {
    const plot = g.plots[i];
    if (!plot.crop || plotReady(plot)) continue;
    const crop = CROPS[plot.crop]; if (!crop) continue;
    // sprinkler auto-waters; else you watered yesterday. Guard day 1 so a fresh
    // plot's default wateredDay:0 can't read as "watered" when s.day-1 === 0.
    const watered = g.sprinkler || (s.day > 1 && plot.wateredDay === s.day - 1);
    if (watered) { plot.progress = Math.min(crop.growDays, plot.progress + 1); plot.waterStreak += 1; }
    else { plot.missed += 1; plot.waterStreak = 0; }
  }
  postRequest(s); // make sure a request is always on the board
};

// Sell everything in the shipping box (called at morning). Returns total yen.
export const sellShipping = (s: GameSave): number => {
  const total = s.greenhouse.shipped.reduce((a, sc) => a + sc.value, 0);
  if (total > 0) s.money += total;
  s.greenhouse.shipped = [];
  return total;
};

export const buySprinkler = (s: GameSave): boolean => {
  if (s.greenhouse.sprinkler || s.money < SPRINKLER_COST) return false;
  s.money -= SPRINKLER_COST; s.greenhouse.sprinkler = true; return true;
};
export const buyFertilizer = (s: GameSave, qty = 1): boolean => {
  const cost = FERTILIZER_COST * qty;
  if (s.money < cost) return false;
  s.money -= cost; s.greenhouse.fertilizer += qty; return true;
};
export const expandBeds = (s: GameSave): boolean => {
  const next = s.greenhouse.beds + 3;
  const cost = BED_COSTS[next];
  if (!cost || s.money < cost) return false;
  s.money -= cost; s.greenhouse.beds = next; return true;
};
export const upgradeGreenhouse = (s: GameSave): boolean => {
  const next = s.greenhouse.tier + 1;
  const cost = TIER_COSTS[next];
  if (!cost || s.money < cost) return false;
  s.money -= cost; s.greenhouse.tier = next; return true;
};
// The shrine gives you the Moonflower seed once you've earned its deepest favor.
export const grantMoonSeed = (s: GameSave): boolean => {
  if (s.greenhouse.moonSeed || shrineLuck(s) < 2) return false;
  s.greenhouse.moonSeed = true;
  s.greenhouse.seeds['moonflower'] = (s.greenhouse.seeds['moonflower'] ?? 0) + 1;
  return true;
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

export interface MineLayout {
  ore: OreNode[];
  crawlers: MineCrawler[];
  down: { x: number; y: number };
  vault?: boolean;                       // rare jackpot floor (warm gold glow + banner)
  chest?: { x: number; y: number };      // the vault's centerpiece treasure chest tile
}

// A treasure VAULT is a rare special floor on the descent: seeded purely by day +
// floor (stable across reloads, independent of the ore/crawler rolls), only from
// VAULT_MIN_FLOOR down, and uncommon enough to feel like a real event. It stocks
// the floor richer and drops a centerpiece chest with a one-time haul.
export const VAULT_MIN_FLOOR = 4;
export const VAULT_CHANCE = 0.05;        // ~5% per qualifying floor
export const isVaultFloor = (s: GameSave, floor: number): boolean =>
  floor >= VAULT_MIN_FLOOR && mulberry32(s.day * 999983 + floor * 7919 + 31)() < VAULT_CHANCE;

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
  if (s.minedDay !== s.day) { s.minedDay = s.day; s.minedNodes = []; s.vaultsLooted = []; }
  const ch = mineChallengeFor(s);
  const vault = isVaultFloor(s, floor);
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

  // Treasure vault: a centerpiece chest tile, away from the entry and never on the
  // descend ladder. Reserved so no ore/crawler buries it.
  let chest: { x: number; y: number } | undefined;
  if (vault) {
    chest = tiles.find(t => !reserved.has(`${t.x},${t.y}`)
      && Math.abs(t.x - MINE_ENTRY.x) + Math.abs(t.y - MINE_ENTRY.y) >= 4) ?? tiles[Math.floor(tiles.length / 2)];
    reserved.add(`${chest.x},${chest.y}`);
  }

  // richness drives BOTH how many nodes and how rare they skew. Squared so lean
  // days are the norm; depth, the shrine, and your streak push toward the jackpot.
  let richness = rand() * rand();
  const luckyOre = luckyToday(s) ? 0.2 : 0; // Lucky Day or a Lucky meal: veins run rich
  const mineSkill = skillLevel(s, 'mine') * 0.025; // a seasoned miner finds more
  richness = Math.min(1, richness + luck * 0.18 + grace + streakBonus + depth * 0.06 + luckyOre + mineSkill + omamoriLuck(s));
  if (ch.id === 'rich') richness = Math.min(1, richness + 0.2);
  if (ch.id === 'calm') richness = Math.min(1, richness + 0.05);
  if (vault) richness = Math.min(1, richness + 0.45);   // a vault floor runs rich
  const oreCount = Math.round(2 + richness * 7 + depth * 0.7 + (vault ? 5 : 0));

  // Mineral pool is gated by floor — deep ore simply isn't here until you descend.
  const pool = MINERALS.filter(m => m.minFloor <= floor);

  // Tilt toward the scarcer (valuable) ore as richness / luck / depth rise; the
  // cheap coal & iron keep base weight so the shallows never go fully barren.
  let tilt = 1 + richness * 1.4 + luck * 0.8 + depth * 0.25;
  if (ch.id === 'deep') tilt += depth * 0.4;
  if (vault) tilt += 2;                                  // vault veins skew to the good stuff
  const tiltedW = (m: Mineral) => {
    const base = (m.id === 'coal' || m.id === 'iron') ? m.weight : m.weight * tilt;
    return ch.id === 'crystal' && m.id === 'crystal' ? base * 4 : base;  // Crystal Rush
  };
  const tTotal = pool.reduce((sum, m) => sum + tiltedW(m), 0);

  // How often a node is a sealed geode instead of plain ore.
  let geodeChance = 0.05 + depth * 0.012;
  if (ch.id === 'geode') geodeChance += 0.18;
  if (vault) geodeChance += 0.12;

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
    const hi = 0.01 + richness * 0.03 + depth * 0.006;
    const mid = 0.04 + richness * 0.08 + depth * 0.02;
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

  // A vault always seals at least one geode in among the haul.
  if (vault && ore.length > 0 && !ore.some(n => n.geode)) {
    ore[0] = { x: ore[0].x, y: ore[0].y, mineral: pool[0], amount: 1, geode: true };
  }

  return {
    ore: ore.filter(n => !s.minedNodes.includes(minedKey(floor, n.x, n.y))),
    crawlers, down,
    vault, chest,
  };
};

// ---- treasure vault chest ----------------------------------------------------------
// Open the centerpiece chest on a vault floor for a one-time, generous haul (cash +
// ore + a geode, scaled by depth and honoring shrine luck / streak / lucky-day). One
// open per day+floor (tracked in s.vaultsLooted); a second look returns null so the
// caller can show "already looted" flavor.
export interface VaultHaul { cash: number; crystals: number; opals: number; starstones: number; geodes: number }
export const lootVault = (s: GameSave, floor: number): VaultHaul | null => {
  const key = `${s.day}:${floor}`;
  if (!s.vaultsLooted) s.vaultsLooted = [];
  if (s.vaultsLooted.includes(key)) return null;
  s.vaultsLooted.push(key);

  const depth = floor - 1;
  const luck = shrineLuck(s);                           // 0 / 1 / 2 shrine tiers
  const streakBonus = Math.min(0.4, s.mineStreak * 0.04);
  const lucky = luckyToday(s) ? 1 : 0;
  const mult = 1 + luck * 0.15 + streakBonus + lucky * 0.25;

  const cash = Math.round((1800 + depth * 350) * mult);
  s.money += cash;

  const add = (id: string, n: number) => { s.minerals[id] = (s.minerals[id] ?? 0) + n; };
  const crystals = 3 + Math.floor(depth / 2) + luck;
  const opals = 1 + Math.floor(depth / 3) + lucky;
  const starstones = floor >= 6 ? 1 : 0;
  add('crystal', crystals);
  add('opal', opals);
  if (starstones) add('starstone', starstones);
  const geodes = 1;
  s.geodes += geodes;

  return { cash, crystals, opals, starstones, geodes };
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
    case 'jackpot': { s.money += 3000; add('opal', 2); return { text: 'JACKPOT! ¥3,000 + 2 Void Opal!', color: '#ffd24a' }; }
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
  const disc = SKETCHY_DISCOUNT * (dayEventFor(s) === 'market' ? 0.8 : 1); // Market Day: even Jimmy cuts deals
  return { itemId: f.id, price: Math.round((f.price * disc) / 10) * 10 };
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
  gangPaid: s.gangPaid,
  friendsMet: Object.keys(s.friends),
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

// ---- Journal missions ----------------------------------------------------------
// Mark + pay any newly-completed MISSIONS steps (mirrors syncMessages: called on
// scene enter and when the Journal opens). Each step pays its reward exactly once
// (save.missionsDone dedupes); returns the fresh completions for a toast.
export const syncMissions = (s: GameSave): Mission[] => {
  const fresh: Mission[] = [];
  for (const m of MISSIONS) {
    if (s.missionsDone.includes(m.id) || !m.isDone(s)) continue;
    s.missionsDone.push(m.id);
    s.money += m.reward;
    fresh.push(m);
  }
  return fresh;
};

// Push a one-off (non-catalog) message — used for ZamaZonk order/delivery
// receipts. Deduped by id so re-running is safe.
export const pushMessage = (s: GameSave, m: Omit<PhoneMessage, 'day' | 'read'>): void => {
  if (s.messages.some(x => x.id === m.id)) return;
  s.messages.push({ ...m, day: s.day, read: false });
};

// ---- Fishing-derby payout (pure core) ---------------------------------------
// Settle a derby run: pay the tier prize for `score` points and push Genji's
// chalkboard text. Guarded so it's safe to call from EVERY path that can end a
// run (walking off the shore, sleeping/collapsing, Save&Quit) — the storySeen
// `tournament-prize-<day>` stamp pays at most once per derby day. Returns the
// tier paid, or null if nothing settled (no score / not a derby day / paid).
// The caller owns the transient bits (score ref, toast, sfx, achievement).
export function settleDerbyPrize(s: GameSave, score: number): TournamentTier | null {
  if (score <= 0 || !fishingTournamentDay(s.day) || s.storySeen.includes(`tournament-prize-${s.day}`)) return null;
  s.storySeen.push(`tournament-prize-${s.day}`);
  const tier = tournamentTierFor(score);
  s.money += tier.prize;
  pushMessage(s, { id: `tournament-prize-${s.day}`, from: 'Genji 🎣', avatar: '🎣', company: false,
    body: [`Genji chalks your name on the board: "${score} points — that's the ${tier.name}, kid." The gathered crowd gives a warm cheer as he presses ¥${tier.prize} into your hand. "Tide's turning. Same shore next derby."`] });
  return tier;
}

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

// ============================================================================
// Cooking, Friendship & Decor — logic (data tables live in data.ts).
// ============================================================================

// ---- Food buffs --------------------------------------------------------------
// One buff at a time; only valid on the day it was eaten. Fed into maxEnergy /
// energyCost / luckyToday above.
export const buffActive = (s: GameSave, id: BuffId): boolean => s.buff?.id === id && s.buff.day === s.day;

// ---- Cooking -----------------------------------------------------------------
export const canCookHere = (s: GameSave): boolean => Boolean(s.placed['fridge'] && s.placed['microwave']);

// How many of an ingredient KIND the player holds (across the right pocket).
export const ingredientCount = (s: GameSave, kind: IngredientKind): number => {
  switch (kind) {
    case 'fish': return s.fishInv.length;
    case 'crop': return Object.values(s.produce).reduce((a, b) => a + b, 0);
    case 'coconut': return s.coconuts;
    case 'peepis': return s.peepis;
    case 'soda': return Object.values(s.sodas).reduce((a, b) => a + b, 0);
    case 'rice': case 'egg': case 'veg': return s.pantry[kind] ?? 0;
  }
};
export const canCook = (s: GameSave, recipe: Recipe): boolean =>
  s.recipes.includes(recipe.id) && recipe.ingredients.every(i => ingredientCount(s, i.kind) >= i.n);

const consumeIngredient = (s: GameSave, kind: IngredientKind, n: number): void => {
  for (let k = 0; k < n; k++) {
    switch (kind) {
      case 'fish': s.fishInv.shift(); break;
      case 'crop': { const id = Object.keys(s.produce).find(c => s.produce[c] > 0); if (id) { s.produce[id]--; if (s.produce[id] <= 0) delete s.produce[id]; } break; }
      case 'coconut': s.coconuts = Math.max(0, s.coconuts - 1); break;
      case 'peepis': s.peepis = Math.max(0, s.peepis - 1); break;
      case 'soda': { const id = Object.keys(s.sodas).find(c => s.sodas[c] > 0); if (id) { s.sodas[id]--; if (s.sodas[id] <= 0) delete s.sodas[id]; } break; }
      case 'rice': case 'egg': case 'veg': { s.pantry[kind] = Math.max(0, (s.pantry[kind] ?? 0) - 1); if (!s.pantry[kind]) delete s.pantry[kind]; break; }
    }
  }
};
// Cook a known recipe whose ingredients you hold → one dish in your bag.
export const cook = (s: GameSave, recipeId: string): boolean => {
  const r = recipeById(recipeId);
  if (!r || !canCook(s, r)) return false;
  for (const i of r.ingredients) consumeIngredient(s, i.kind, i.n);
  s.dishes[recipeId] = (s.dishes[recipeId] ?? 0) + 1;
  if (!s.cookedLog.includes(recipeId)) s.cookedLog.push(recipeId); // ever-cooked log (achievements)
  persistSave(s);
  return true;
};
// Eat a cooked dish: apply its buff (so the higher cap counts), then restore energy.
export const eatDish = (s: GameSave, recipeId: string): boolean => {
  const r = recipeById(recipeId);
  if (!r || (s.dishes[recipeId] ?? 0) <= 0) return false;
  s.dishes[recipeId]--; if (s.dishes[recipeId] <= 0) delete s.dishes[recipeId];
  if (r.buff) s.buff = { id: r.buff, day: s.day };
  s.energy = Math.min(maxEnergy(s), s.energy + r.energy);
  persistSave(s);
  return true;
};
export const learnRecipe = (s: GameSave, recipeId: string): boolean => {
  if (s.recipes.includes(recipeId) || !recipeById(recipeId)) return false;
  s.recipes.push(recipeId); persistSave(s); return true;
};
export const buyGrocery = (s: GameSave, id: string, price: number): boolean => {
  if (s.money < price) return false;
  s.money -= price; s.pantry[id] = (s.pantry[id] ?? 0) + 1; persistSave(s); return true;
};
// Keep a harvested greenhouse crop for cooking instead of shipping it for cash.
export const keepProduce = (s: GameSave, cropId: string, n = 1): void => {
  s.produce[cropId] = (s.produce[cropId] ?? 0) + n; persistSave(s);
};

// ---- Friendship --------------------------------------------------------------
export const friendPts = (s: GameSave, id: string): number => s.friends[id]?.pts ?? 0;
export const friendHearts = (s: GameSave, id: string): number =>
  Math.max(0, Math.min(MAX_HEARTS, Math.floor(friendPts(s, id) / HEART_POINTS)));
export const canGiftToday = (s: GameSave, id: string): boolean => (s.friends[id]?.giftDay ?? -1) !== s.day;
export const metFriend = (s: GameSave, id: string): boolean => id in s.friends;
// True once EVERY befriendable NPC is in your phone (drives the one-time capstone).
export const allFriendsMet = (s: GameSave): boolean => FRIENDS.every(f => f.id in s.friends);
// The warmest heart-tiered greeting line the friend has unlocked, or null below
// the first threshold / for friends with no line table. Appended to a chat.
export const friendFlavorLine = (s: GameSave, id: string): string | null => {
  const tiers = FRIEND_HEART_LINES[id];
  if (!tiers) return null;
  const h = friendHearts(s, id);
  let pick: string | null = null;
  for (const t of tiers) if (h >= t.hearts) pick = t.line;
  return pick;
};
// First contact: the moment you actually talk to (or shop with) a befriendable
// NPC, they enter your Friends app at 0 pts. Returns true the first time only, so
// the caller can fire a one-time "new contact" notification.
export const meetFriend = (s: GameSave, id: string): boolean => {
  if (id in s.friends) return false;
  s.friends[id] = { pts: 0, giftDay: -1 };
  return true;
};
export const giftTier = (npcId: string, kind: GiftKind): GiftTier => {
  const f = friendById(npcId);
  if (!f) return 'neutral';
  if (f.loved.includes(kind)) return 'loved';
  if (f.liked.includes(kind)) return 'liked';
  if (f.disliked.includes(kind)) return 'disliked';
  return 'neutral';
};
// Concrete heart-threshold perks. Recipe teaches are the mechanical ones; the
// rest (Genji's rod discount, Granny's free seed) are read at their shops.
export const applyFriendPerks = (s: GameSave): void => {
  const at = (id: string, h: number) => friendHearts(s, id) >= h;
  if (at('lulu', 3)) learnRecipe(s, 'smoothie');
  if (at('granny', 3)) learnRecipe(s, 'stirfry');
  if (at('granny', 5)) learnRecipe(s, 'hotpot');
};
// Record a gift (one/NPC/day enforced by the caller). Returns reaction + hearts.
export const giftTo = (s: GameSave, npcId: string, kind: GiftKind): { tier: GiftTier; hearts: number; gainedHeart: boolean } => {
  const before = friendHearts(s, npcId);
  const tier = giftTier(npcId, kind);
  const cur = s.friends[npcId] ?? { pts: 0, giftDay: -1 };
  cur.pts = Math.max(0, Math.min(MAX_HEARTS * HEART_POINTS, cur.pts + GIFT_POINTS[tier]));
  cur.giftDay = s.day;
  s.friends[npcId] = cur;
  applyFriendPerks(s);
  persistSave(s);
  const hearts = friendHearts(s, npcId);
  return { tier, hearts, gainedHeart: hearts > before };
};

// ---- David the cat: pets & morning gifts --------------------------------------
// Pet David once a day (the dialog's "Pet David 🐾" action): a modest friendship
// bump on the FRIENDS id 'david' — smaller than any gift, but free and daily.
// Points route through the same clamp as giftTo; giftDay is untouched so a pet
// never spends the day's gift.
export const CAT_PET_PTS = 6;
export const catPetToday = (s: GameSave): boolean => s.catPetDay === s.day;
export const petCat = (s: GameSave): boolean => {
  if (!s.cat.found || s.catPetDay === s.day) return false;
  s.catPetDay = s.day;
  const cur = s.friends['david'] ?? { pts: 0, giftDay: -1 };
  cur.pts = Math.max(0, Math.min(MAX_HEARTS * HEART_POINTS, cur.pts + CAT_PET_PTS));
  s.friends['david'] = cur;
  return true;
};

// Some mornings (~8%, seeded per day like the weather rolls — stable across
// reloads, never day 1) David leaves a little something by the door. The wake
// flow checks the roll once per morning and dedupes via save.catGiftDay.
export const CAT_GIFT_CHANCE = 0.08;
export const catGiftMorning = (day: number): boolean =>
  day > 1 && mulberry32(day * 1103515245 + 61)() < CAT_GIFT_CHANCE;
// What he left: usually a small pile of coins (¥50–300), sometimes one pantry egg.
// Seeded by the same day so the haul is as deterministic as the roll.
export interface CatGift { money: number; egg: boolean }
export const catGiftFor = (day: number): CatGift => {
  const rand = mulberry32(day * 1103515245 + 62);
  if (rand() < 0.3) return { money: 0, egg: true };
  return { money: 50 + Math.floor(rand() * 251), egg: false };
};

// ---- Heart-event hangouts & home visits --------------------------------------
// The lowest-threshold hangout this friend has unlocked (hearts met) but not yet
// seen, or undefined. The talk path plays it once, then sets its storySeen flag —
// so 4 ♥ fires before 8 ♥, each exactly once. Pure (reads save state only).
export const pendingHangout = (s: GameSave, friendId: string): HangoutScene | undefined => {
  const h = friendHearts(s, friendId);
  return HANGOUTS
    .filter(x => x.friend === friendId && h >= x.hearts && !s.storySeen.includes(x.flag))
    .sort((a, b) => a.hearts - b.hearts)[0];
};
// Heart threshold a friend must reach before they'll drop by your apartment.
export const HOME_VISIT_HEARTS = 6;
export const homeVisitFlag = (friendId: string): string => `visit-${friendId}`;
// One eligible friend to visit your apartment this morning: met, at/over the
// threshold, with an authored visit they haven't made yet. First match only — the
// wake flow fires a single visit at a time, in HOME_VISITS order.
export const pendingHomeVisit = (s: GameSave): HomeVisit | undefined =>
  HOME_VISITS.find(v => metFriend(s, v.friend)
    && friendHearts(s, v.friend) >= HOME_VISIT_HEARTS
    && !s.storySeen.includes(homeVisitFlag(v.friend)));

// ---- Decor: wallpaper / flooring / rugs --------------------------------------
export const RUG_W = 2, RUG_H = 2;
export const ownsDecor = (s: GameSave, id: string): boolean => s.ownedDecor.includes(id);
export const buyDecor = (s: GameSave, id: string): boolean => {
  const d = decorById(id);
  if (!d || ownsDecor(s, id) || s.money < d.price) return false;
  s.money -= d.price; s.ownedDecor.push(id); persistSave(s); return true;
};
export const applyDecor = (s: GameSave, id: string): boolean => {
  const d = decorById(id);
  if (!d || !ownsDecor(s, id) || (d.kind !== 'wall' && d.kind !== 'floor')) return false;
  s.decor[d.kind] = id; persistSave(s); return true;
};
export const rugAt = (s: GameSave, x: number, y: number): number =>
  s.rugs.findIndex(r => x >= r.x && x < r.x + RUG_W && y >= r.y && y < r.y + RUG_H);
export const placeRug = (s: GameSave, id: string, x: number, y: number): void => { s.rugs.push({ id, x, y }); persistSave(s); };
export const removeRugAt = (s: GameSave, x: number, y: number): boolean => {
  const i = rugAt(s, x, y);
  if (i < 0) return false;
  s.rugs.splice(i, 1); persistSave(s); return true;
};
