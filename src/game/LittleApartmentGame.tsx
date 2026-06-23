// Little Apartment, Big City — main game component.
// World simulation lives in refs and a fixed-timestep loop; React renders the
// HUD and modal overlays (title, dialogue, shops, letters, sleep, ending).

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  TILE, VIEW_PW, VIEW_PH, RR, Input, startLoop, tryMove, feetTile, facedTile,
  cameraFor, sceneSize, isSolid, tileAt,
} from './engine';
import type { Dir, Vec, SceneDef, Interactable } from './engine';
import { buildAtlas } from './sprites';
import type { Atlas } from './sprites';

// Lazily-built atlas just for the "what's your vibe?" picker thumbnails, so the
// choices show the real in-code player sprites (not a PNG). Built once on first
// thumbnail draw; pure offscreen-canvas work, safe to call on the title screen.
let _thumbAtlas: Atlas | null = null;
const drawVibeThumb = (el: HTMLCanvasElement | null, vibe: 'fem' | 'masc') => {
  if (!el) return;
  if (!_thumbAtlas) _thumbAtlas = buildAtlas();
  const spr = _thumbAtlas[`${vibe === 'fem' ? 'player-fem' : 'player'}-down-0`];
  const cx = el.getContext('2d');
  if (!cx || !spr) return;
  cx.imageSmoothingEnabled = false;
  cx.clearRect(0, 0, el.width, el.height);
  cx.drawImage(spr, 0, 0, el.width, el.height);
};
import { SCENES, SCENE_SIGNS, MANEKI_SLOT } from './maps';
import {
  FISH, FURNITURE, RARE_FURNITURE, VEHICLES, furnitureById, vehicleById, KONBINI_FOOD,
  fishById, rollFish, DEEP_FISH, TROPICAL_FISH, CAST_COST, SHIFT_COST, SHIFT_PAY, STORY_BEATS, ENDING,
  GACHA_PRICE, GACHA_FIGURES, SKETCHY_BREAK_CHANCE, GAME_ACHIEVEMENTS,
  MINERALS, mineralById, MINE_COST, WAND_PRICE, CRAWLER_HIT_ENERGY, CRAFT_RECIPES,
  itemKind,
} from './data';
import type { StoryBeat, Fish } from './data';
import {
  newSave, loadSave, persistSave, clearSave,
  maxEnergy, energyCost, sleep as passNight, pawnStockFor, buyFurniture, allFurnished,
  allRaresOwned, sketchyOfferFor, gachaComplete,
  clockLabel, nightT, morningT, COLLAPSE_MIN,
  placeItem, unplaceItem, unlockGameAch, itemFootprintW,
  mineLayoutFor, shrineLuck, syncMessages, unreadCount,
  fulfillDeliveries, zamazonkCatalog, zamazonkPrice, orderZamaZonk, pushMessage,
} from './state';
import type { OreNode } from './state';
import type { GameSave, Vibe } from './state';
import { startFishing, updateFishing, ZONE_H } from './fishing';
import type { FishingState } from './fishing';

// ---- tiny sfx -------------------------------------------------------------

// One mute switch for the whole game — music AND sfx. Read at call time so the
// 🔊 toggle takes effect immediately, no React state threading required.
const MUSIC_MUTE_KEY = 'lab-music-muted';
const readMuted = (): boolean => {
  try { return localStorage.getItem(MUSIC_MUTE_KEY) === '1'; } catch { return false; }
};

let audioCtx: AudioContext | null = null;
const blip = (freqs: number[], dur = 0.09, vol = 0.05) => {
  if (readMuted()) return;
  try {
    audioCtx = audioCtx || new AudioContext();
    const ctx = audioCtx;
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.value = f;
      osc.connect(gain); gain.connect(ctx.destination);
      const t = ctx.currentTime + i * dur;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t); osc.stop(t + dur + 0.02);
    });
  } catch { /* no audio */ }
};
const sfxCoin = () => blip([880, 1320], 0.07);
const sfxBuy = () => blip([523, 659, 784], 0.08);
const sfxCatch = () => blip([659, 880, 1175], 0.09);
const sfxMiss = () => blip([330, 220], 0.12);
const sfxBite = () => blip([1175, 1175], 0.06, 0.07);
const sfxLetter = () => blip([784, 988], 0.12, 0.04);
// Mining chime — brighter, fuller arpeggio for the rarer (more valuable) ore.
const sfxMine = (value: number) =>
  value >= 900 ? blip([784, 1175, 1568], 0.09, 0.06)
    : value >= 400 ? blip([659, 988, 1319], 0.075, 0.055)
      : blip([880, 1320], 0.06, 0.05);

// One-shot sampled SFX (mp3). Cached + rewound so they can re-fire rapidly.
// Independent of the music mute toggle, matching the blip SFX above.
const sfxCache = new Map<string, HTMLAudioElement>();
const playSfx = (src: string, vol = 0.5) => {
  if (readMuted()) return;
  try {
    let a = sfxCache.get(src);
    if (!a) { a = new Audio(src); sfxCache.set(src, a); }
    a.volume = vol;
    a.currentTime = 0;
    a.play().catch(() => { /* autoplay blocked or file missing */ });
  } catch { /* private mode / no Audio */ }
};
const sfxAchievement = () => playSfx('/sfx/achievement-unlocked.mp3');
const sfxBackroomsWarp = () => playSfx('/sfx/backrooms-teleport.mp3');
const sfxUiClick = () => playSfx('/sfx/ui-click.mp3', 0.4);
const sfxGameStart = () => playSfx('/sfx/game-start.mp3');
const sfxPhone = () => playSfx('/sfx/phone-notification.mp3');

// ---- background music -------------------------------------------------------
// Per-scene tracks; everywhere unlisted (city, badtown, gacha) falls back to the
// default street theme. Each track keeps its own Audio element so it resumes
// where it left off when the player ducks in and out of a shop. Scene changes
// crossfade rather than hard-cut.

const DEFAULT_MUSIC = '/music/tokyo-apt-drift.mp3';
const TITLE_BG = '/images/title-bg.png';
const ZAMAZONK_LOGO = '/images/zamazonk-logo.png';
const SCENE_MUSIC: Record<string, string> = {
  title: '/music/title.mp3',
  endofday: '/music/end-of-day.mp3',
  apartment: '/music/apartment.mp3',
  konbini: '/music/konbini.mp3',
  denden: '/music/big-box-store.mp3',
  shore: '/music/fishing.mp3',
  pawn: '/music/pawn-shop.mp3',
  nightclub: '/music/the-club.mp3',
  garage: '/music/garage-theme.mp3',
  badtown: '/music/badside.mp3',
  casino: '/music/casino.mp3',
  backrooms: '/music/backrooms.mp3',
  mines: '/music/mines.mp3',
  gacha: '/music/gacha.mp3',
  island: '/music/island.mp3',
  deepsea: '/music/deep-sea.mp3',
  shrine: '/music/shrine.mp3',
  paris: '/music/paris.mp3',
  // the "loading Paris" hacker transition score (played manually over the hack screen)
  'paris-transition': '/music/paris-transition.mp3',
};

// What the DJ can spin — places you've actually been.
const DJ_SETLIST: { scene: string; label: string }[] = [
  { scene: 'nightclub', label: "the tanuki's own set" },
  { scene: 'apartment', label: 'home (apartment theme)' },
  { scene: 'city', label: 'Kawamachi St. (city theme)' },
  { scene: 'konbini', label: 'konbini muzak' },
  { scene: 'denden', label: 'Doki Doki Discount jingle' },
  { scene: 'shore', label: 'Sumikawa Shore' },
  { scene: 'pawn', label: 'pawn shop pixels' },
  { scene: 'garage', label: 'Kojima Motors theme' },
  { scene: 'badtown', label: 'Downtown neon (badside)' },
  { scene: 'shrine', label: 'Yoshi Shrine bells' },
  { scene: 'island', label: 'Kiwami Island breeze' },
  { scene: 'gacha', label: 'Gacha Gacha hall' },
  { scene: 'backrooms', label: 'the yellow hum (???)' },
  { scene: 'paris', label: 'un café à Paris' },
];
const MUSIC_VOL = 0.35;
const MUSIC_FADE_MS = 700;

// Fake-hacker terminal lines for the backrooms→Paris "the game got hacked"
// transition. Purely cosmetic; scrolls past while Paris "loads". (Feature #21.)
const HACK_LINES = [
  '$ ./void_kernel --breach --target=GEO',
  'mounting /dev/seam ... ok',
  'bypassing konbini firewall ............ BYPASSED',
  'decrypting tourist.manifest [Jean-Pierre] ... ok',
  '! WARNING: reality checksum mismatch (0xC0FFEE)',
  'resolving coordinates: 48.8584° N, 2.2945° E',
  'rerouting through ZAMAZONK backbone .........',
  '  >> node tokyo-204   [OK]',
  '  >> node liminal-09  [OK]',
  '  >> node PARIS-FR    [HANDSHAKE...]',
  'streaming geometry: eiffel.mesh .... 41% .. 88% .. 100%',
  'loading textures: cobblestone, seine, awning ... ok',
  'spawning baguette_vendor.npc ... ok',
  '! injecting accordion.wav into ambience',
  'patching sky shader -> #bcd6ec ... ok',
  'flushing yellow.hum from audio bus ... ok',
  'rebuilding world tree ............... done',
  'PARIS.EXE ready. dropping player in 3.. 2.. 1..',
];

// ---- overlay model ----------------------------------------------------------

type ShopId = 'denden' | 'konbini' | 'pawn' | 'garage' | 'monster' | 'sketchy' | 'hat' | 'dj' | 'boat' | 'boat-island' | 'tiki' | 'vending' | 'yakuza'
  | 'casino' | 'blackjack' | 'slots';

// Vending-machine sodas. You buy a can into your pocket and drink it from the
// bag for energy (Peepis can also be fed to The Manager / given to David).
type Soda = { id: string; name: string; price: number; energy: number; blurb: string };
const SODAS: Soda[] = [
  { id: 'peepis',  name: '"Diet Doctor Peepis"',   price: 150, energy: 12, blurb: 'Legally distinct, the can insists. Pocket it and drink it later for energy.' },
  { id: 'doofert', name: '"Diet Mountain Doofert"', price: 150, energy: 12, blurb: 'EXTREME citrus. Tastes faintly of cleaning product.' },
  { id: 'conk',    name: '"Conk"',                  price: 120, energy: 8,  blurb: "It's a cola. It's just a cola. We're pretty sure." },
  { id: 'bepsi',   name: '"Bepsi"',                 price: 130, energy: 10, blurb: 'The other other cola. Tastes like a trademark dispute.' },
  { id: 'zonked',  name: '"Zonked! Energy Drink"',  price: 250, energy: 25, blurb: 'Wings sold separately. A genuinely irresponsible jolt.' },
];

interface Crawler { x: number; y: number; hp: number; stepT: number; hurtT: number; dir: Dir }

// ---- Casino games -----------------------------------------------------------
// Self-contained blackjack + slots, betting s.money. Pure helpers live here; the
// live hand/reel state hangs off a ref in the component (no save-shape changes).
interface Card { rank: number; suit: number } // rank 1..13 (1=A), suit 0..3
const CARD_SUITS = ['♠', '♥', '♦', '♣']; // ♠ ♥ ♦ ♣
const CARD_RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const makeDeck = (): Card[] => {
  const d: Card[] = [];
  for (let suit = 0; suit < 4; suit++) for (let rank = 1; rank <= 13; rank++) d.push({ rank, suit });
  for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; }
  return d;
};
const cardValue = (c: Card) => (c.rank > 10 ? 10 : c.rank);
// Best hand total: aces count 11 unless that busts, then 1.
const handValue = (cards: Card[]): number => {
  let total = 0, aces = 0;
  for (const c of cards) { total += cardValue(c); if (c.rank === 1) aces++; }
  while (aces > 0 && total + 10 <= 21) { total += 10; aces--; }
  return total;
};
const isBlackjack = (cards: Card[]) => cards.length === 2 && handValue(cards) === 21;

type BJPhase = 'bet' | 'player' | 'done';
interface BlackjackState {
  bet: number; deck: Card[]; player: Card[]; dealer: Card[];
  phase: BJPhase; hideHole: boolean; result: '' | 'win' | 'lose' | 'push' | 'blackjack'; payout: number;
}
const freshBlackjack = (): BlackjackState =>
  ({ bet: 1000, deck: [], player: [], dealer: [], phase: 'bet', hideHole: true, result: '', payout: 0 });

// Slots: 3 reels of weighted symbols. Index → emoji + rarity (lower = commoner).
const SLOT_SYMBOLS = ['\u{1F352}', '\u{1F514}', '\u{1F34B}', '⭐', '\u{1F48E}', '7️⃣']; // 🍒 🔔 🍋 ⭐ 💎 7️⃣
const SLOT_POOL = [0, 0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3, 4, 5]; // weighted draw pool
const pickSlot = () => SLOT_POOL[Math.floor(Math.random() * SLOT_POOL.length)];
// Payout in yen for a settled spin (bet already debited; this is the credit).
const slotPayout = (reels: number[], bet: number): number => {
  const [a, b, c] = reels;
  if (a === b && b === c) {
    if (a === 5) return bet * 50;   // 7️⃣ jackpot
    if (a === 4) return bet * 20;   // 💎
    if (a === 3) return bet * 10;   // ⭐
    return bet * 5;                 // any other three-of-a-kind
  }
  if (a === b || b === c || a === c) return bet * 2; // any pair — small
  return 0;
};
type SlotPhase = 'idle' | 'spin' | 'done';
interface SlotState {
  bet: number; reels: number[]; final: number[]; stopped: boolean[];
  phase: SlotPhase; win: number; timer: number | null;
}
const freshSlots = (): SlotState =>
  ({ bet: 500, reels: [0, 1, 2], final: [0, 1, 2], stopped: [true, true, true], phase: 'idle', win: 0, timer: null });

interface CasinoState { bj: BlackjackState; slot: SlotState }

interface DayRecap {
  day: number;            // the day that just ended
  net: number;            // money change over the day
  fish: number;
  minerals: number;
  shifts: number;
  furniture: string[];    // furniture ids acquired today
  collapsed: boolean;     // ended by passing out
}

type Overlay =
  | { type: 'dialog'; lines: string[]; idx: number; speaker?: string }
  | { type: 'shop'; shop: ShopId }
  | { type: 'letter'; beat: StoryBeat }
  | { type: 'sleep'; day: number; collapsed?: boolean; awaitClick?: boolean }
  | { type: 'endday'; recap: DayRecap }
  | { type: 'menu'; tab: PhoneApp; thread?: string }
  | { type: 'ending' };

type PhoneApp = 'home' | 'inventory' | 'messages' | 'achievements' | 'settings' | 'cheats' | 'zamazonk';

const TIME_RATE = 3.5; // in-game minutes per real second (~5.5 real min per day)

type FishTable = 'shallow' | 'deep' | 'tropical';
type FishMode =
  | { phase: 'wait'; t: number; tile: Vec; table: FishTable }
  | { phase: 'bite'; t: number; tile: Vec; table: FishTable }
  | { phase: 'reel'; st: FishingState; tile: Vec; table: FishTable };

interface Projectile { x: number; y: number; dx: number; dy: number; t: number }

interface Hud {
  money: number; day: number; time: string; energy: number; max: number;
  sceneName: string; fish: number; ownedCount: number;
  late: boolean; // past midnight — 2 AM collapse looms
  unread: number; // unread phone messages (badge on the 📱 button)
}

// Every named character has a voice: several line-sets, picked at random per
// chat, plus state-aware lines layered in by getNpcTalk().
const NPC_VOICES: Record<string, { speaker: string; sets: string[][] }> = {
  tony: {
    speaker: 'Tony',
    sets: [
      ['yooo. Tony. i basically live on this curb.', 'konbini\'s always hiring if you need cash, dude. tell em i sent you. or don\'t. whatever\'s chill.'],
      ['ate it HARD on that rail yesterday. worth it though. the rail respects me now.', 'pawn shop flips fresh stuff every morning. early bird gets the discount fridge, my guy.'],
      ['do NOT skate behind the konbini. my boy Kenta tried it. now he just draws yellow hallways. tragic.'],
    ],
  },
  granny: {
    speaker: 'Granny Sato',
    sets: [
      ['Maison Kawa? I have lived there forty years. Thin walls, good light.', 'A home is not bought in a day, dear. It is bought one small thing at a time.'],
      ['The man at the pawn shop was a jazz pianist, you know. Ask him about it. Watch his face.'],
      ['Downtown used to be even louder, if you can believe it. The club is still there. So is everything else, in its way.'],
    ],
  },
  'old-man': {
    speaker: 'Genji',
    sets: [
      ['Hold steady when the fish runs deep. Let the little ones tire themselves out.'],
      ['They say a golden carp lives off this shore. Forty years, I have never caught it.', 'Sometimes I think it has caught me.'],
      ['The konbini buys whatever you pull out. City people will eat anything fresh.'],
    ],
  },
  'clerk-denden': {
    speaker: 'Mimi (Doki Doki Discount)',
    sets: [
      ['WELCOME welcome WELCOME to Doki Doki Discount!! Every appliance is my favorite appliance!!'],
      ['This microwave? 500 watts. FIVE HUNDRED. I get chills. The counter is right there when your heart is ready.'],
      ['Our slogan is "your heart goes doki doki, our prices go down down." I wrote it. They pay me in enthusiasm.'],
    ],
  },
  'clerk-konbini': {
    speaker: 'Yuki (night shift)',
    sets: [
      ['Irasshaimase. Hot food, cold drinks. We buy fish. We are always hiring. I am always tired.'],
      ['Third year of a philosophy degree. The register and I have reached an understanding.'],
      ['Do not ask about the back wall. Corporate says there is no back wall.'],
    ],
  },
  'clerk-pawn': {
    speaker: 'Mr. Ibu',
    sets: [
      ['Everything here had a life before you. Stock changes every morning — early bird gets the bargain.'],
      ['People think a pawn shop is where things end up. Wrong. It is where they wait.'],
      ['Jazz? Who told you that. ...Tuesdays, after close. Bring nothing. Tell no one.'],
    ],
  },
  mechanic: {
    speaker: 'Kojima',
    sets: [
      ['Yeah? Counter is there. Car runs, boat floats. That is the whole pitch.'],
      ['Thirty years fixing engines in Old Town. The neighborhood got quiet. Engines did not.'],
      ['The kei car is a good machine. Do not let the cigarette smell fool you. That is character.'],
    ],
  },
  dj: {
    speaker: 'DJ Tanuki',
    sets: [
      ['CAN. NOT. TALK. THE DROP IS IN SIXTEEN BARS.'],
      ['You want a request? The answer is no. The tanuki plays what the tanuki plays.'],
    ],
  },
  dancer: {
    speaker: 'Mei',
    sets: [
      ['I have been dancing since Tuesday. Which Tuesday? Exactly.'],
      ['The floor lights are off-brand but the vibes are authentic.'],
    ],
  },
  dancer2: {
    speaker: 'Riko',
    sets: [
      ['Mei says she has been here since Tuesday. I AM the Tuesday.'],
      ['You live near the konbini? The drinks are cheaper there. The lighting is worse. Everything costs something.'],
    ],
  },
  bartender: {
    speaker: 'Saito',
    sets: [
      ['Welcome to Club Kaiju. Highball is ¥500. The bowtie is non-negotiable.'],
      ['I have poured drinks here for eleven years. The DJ has played the same set for nine of them. It grows on you.'],
      ['The big guy by the dance floor? Regular. Tips in scales. We frame them.'],
    ],
  },
  kaiju: {
    speaker: 'The Big Guy',
    sets: [
      ['RRRGH. ...Sorry. Inside voice. I am just here to dance, not destroy.'],
      ['I stepped on a city ONE time. Thirty years ago. You flatten one ward and nobody lets you forget it.'],
      ['This club is the only place with a ceiling I can almost stand under. Saito waters down nothing. Five stars.'],
    ],
  },
  tourist: {
    speaker: 'Jean-Pierre (tourist)',
    sets: [
      ['Ah! Bonjour! You also find ze... immersive exhibition? Magnifique. Very conceptual. Very yellow.', 'Ze guidebook said "authentic local konbini experience". Five stars. I have been here three days.'],
      ['I ask ze big monsieur for directions. He is very polite. He sells me a table that whispers. C\'est la vie.'],
      ['Do not worry for me! In France we also have liminal spaces. We call them "Charles de Gaulle Airport".'],
    ],
  },
  miko: {
    speaker: 'Aya (shrine maiden)',
    sets: [
      ['Welcome to Yoshi Shrine. Bow twice, clap twice, wish once. The order matters more than people think.'],
      ['The kami here is small but diligent. Fond of fishermen, crows, and exact change.'],
      ['I sweep the same leaves every morning. The tree drops them again every night. We have an understanding.'],
    ],
  },
  collector: {
    speaker: 'Mr. Maeda',
    sets: [
      ['Ten figures in the series. TEN. I have nine. I have had nine for three years. Do not talk to me about the UFO Catcher.'],
      ['Each capsule is ¥300 of pure possibility. That is ¥30 per gram of hope. Excellent value.'],
    ],
  },
};

// State-aware extra lines layered onto the random set.
const npcDynamicLines = (id: string, s: GameSave): string[] => {
  switch (id) {
    case 'mechanic':
      return s.vehicles.includes('car') ? ['...How is she running? Good. Do not thank me. Thank the engine.'] : [];
    case 'old-man':
      if (s.fishLog['golden']) return ['You... caught it? The golden carp? Forty years. Ha! HA! Kid, you have made an old man very confused.'];
      return s.vehicles.includes('boat') ? ['Taking the skiff out? The deep ones fight different. Respect them.'] : [];
    case 'granny':
      return allFurnished(s) ? ['I saw your window from the street, dear. It finally looks lived-in. It looks loved.'] : [];
    case 'collector':
      return gachaComplete(s) ? ['You... completed the set? All ten? I must sit down. I AM sitting down. I must sit down further.'] : [];
    case 'tony':
      return s.hat ? ["whoa, the cowboy hat. that's actually kinda sick on you, not gonna lie."] : [];
    default:
      return [];
  }
};

const PLAYER_SPEED = 72; // px/s

// NPCs that gently pace around their home tile instead of standing still.
const WANDER_IDS = new Set(['granny']);
// NPCs (David the vampire + his campfire) that only appear on even-numbered nights.
const NIGHT_EVEN_IDS = new Set(['david', 'campfire']);
const davidActive = (s: GameSave): boolean => s.day % 2 === 0 && nightT(s) > 0.45;
type Wanderer = { id: string; sprite: string; x: number; y: number; homeX: number; homeY: number; dir: Dir; moving: boolean; stepT: number };
const makeWanderers = (scene: SceneDef): Wanderer[] =>
  scene.npcs.filter(n => WANDER_IDS.has(n.id)).map(n => ({
    id: n.id, sprite: n.sprite, x: n.x * TILE, y: n.y * TILE, homeX: n.x * TILE, homeY: n.y * TILE, dir: n.dir, moving: false, stepT: Math.random() * 1.5,
  }));

const LittleApartmentGame: React.FC = () => {
  const [screen, setScreen] = useState<'title' | 'playing'>('title');
  const [vibePick, setVibePick] = useState(false);   // "what's your vibe?" new-game step
  const [pickedVibe, setPickedVibe] = useState<Vibe>('fem'); // highlighted model in the picker (applied on START)
  const [pcName, setPcName] = useState('');           // name input on the vibe screen
  const pendingVibeRef = useRef<Vibe>('fem');         // chosen vibe, applied in begin()
  const pendingNameRef = useRef('Neighbor');          // chosen name, applied in begin()
  const [manageOpen, setManageOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  const [fsGuideOpen, setFsGuideOpen] = useState(false);
  const [displayOpen, setDisplayOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  // Canvas scale preference: 'auto' = max integer fit (default), or a forced
  // integer multiple of 384×224 (clamped to what fits). Persisted in localStorage.
  const [scalePref, setScalePref] = useState<'auto' | number>(() => {
    try {
      const v = localStorage.getItem('lab-scale');
      if (!v || v === 'auto') return 'auto';
      const n = parseInt(v, 10);
      return Number.isFinite(n) && n >= 1 && n <= 8 ? n : 'auto';
    } catch { return 'auto'; }
  });
  const setScale = useCallback((p: 'auto' | number) => {
    setScalePref(p);
    try { localStorage.setItem('lab-scale', String(p)); } catch { /* ignore */ }
  }, []);
  // Windowed + forced scale: CSS width to size the layout box to the canvas
  // (so a forced scale isn't clipped at the 1000px cap). null = AUTO/filled.
  const [boxW, setBoxW] = useState<number | null>(null);
  const [transition, setTransition] = useState<null | 'start' | 'freezer' | 'fade' | 'hack'>(null);
  const transTimers = useRef<number[]>([]);
  // Element fullscreen API exists on Android/desktop but NOT iOS Safari, which
  // only goes fullscreen via "Add to Home Screen". Used to pick the right CTA.
  const [fsSupported] = useState(() => typeof document !== 'undefined' && Boolean(document.fullscreenEnabled));
  // Launched from a home-screen icon (iOS) or installed PWA — already chromeless.
  const [isStandalone] = useState(() => typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  ));
  // Running inside the Tauri desktop/native shell (not a browser tab). The OS
  // window already owns fullscreen, so we fill it and drop the in-page FS UI.
  const [isDesktopApp] = useState(() => typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window);
  const [confirmMode, setConfirmMode] = useState<null | 'delete'>(null);
  const [saveTick, setSaveTick] = useState(0); // bump to re-read the save after new/delete
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const [hud, setHud] = useState<Hud>({ money: 0, day: 1, time: '', energy: 0, max: 100, sceneName: '', fish: 0, ownedCount: 0, late: false, unread: 0 });
  const [shopTick, setShopTick] = useState(0); // re-render shop lists after purchases
  const casinoRef = useRef<CasinoState>({ bj: freshBlackjack(), slot: freshSlots() }); // live casino game state
  // Stop the slot reels spinning if the player leaves the slots overlay (Esc, etc.).
  useEffect(() => {
    const slot = casinoRef.current.slot;
    const onSlots = overlay?.type === 'shop' && overlay.shop === 'slots';
    if (!onSlots && slot.timer != null) {
      window.clearInterval(slot.timer);
      slot.timer = null;
      if (slot.phase === 'spin') slot.phase = 'idle';
    }
  }, [overlay]);
  useEffect(() => () => { const t = casinoRef.current.slot.timer; if (t != null) window.clearInterval(t); }, []);
  const [isCoarse] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
  const [isPortrait, setIsPortrait] = useState(() => typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches);
  const [musicMuted, setMusicMuted] = useState(readMuted);
  const tracksRef = useRef(new Map<string, HTMLAudioElement>());
  const currentTrackRef = useRef<string | null>(null);
  const fadeTimersRef = useRef(new Map<HTMLAudioElement, number>());

  // Gradual volume ramp; pauses the element when faded fully out.
  const fadeAudio = useCallback((audio: HTMLAudioElement, target: number) => {
    const timers = fadeTimersRef.current;
    const existing = timers.get(audio);
    if (existing) window.clearInterval(existing);
    const STEP_MS = 35;
    const steps = Math.max(1, Math.round(MUSIC_FADE_MS / STEP_MS));
    const delta = (target - audio.volume) / steps;
    let n = 0;
    const id = window.setInterval(() => {
      n++;
      audio.volume = Math.min(1, Math.max(0, audio.volume + delta));
      if (n >= steps) {
        audio.volume = target;
        if (target === 0) audio.pause();
        window.clearInterval(id);
        timers.delete(audio);
      }
    }, STEP_MS);
    timers.set(audio, id);
  }, []);

  const playMusicFor = useCallback((sceneId: string) => {
    // honor a standing DJ request while in the club
    const djSrc = sceneId === 'nightclub' && djPickRef.current
      ? (SCENE_MUSIC[djPickRef.current] ?? DEFAULT_MUSIC)
      : null;
    const src = djSrc ?? SCENE_MUSIC[sceneId] ?? DEFAULT_MUSIC;
    const tracks = tracksRef.current;
    const prevSrc = currentTrackRef.current;
    if (prevSrc === src) {
      const cur = tracks.get(src);
      if (cur) { cur.muted = readMuted(); cur.play().catch(() => {}); fadeAudio(cur, MUSIC_VOL); }
    }
    if (prevSrc && prevSrc !== src) {
      const old = tracks.get(prevSrc);
      if (old) fadeAudio(old, 0); // fades out, then pauses
    }
    let audio = tracks.get(src);
    if (!audio) {
      audio = new Audio(src);
      audio.loop = true;
      audio.volume = 0;
      tracks.set(src, audio);
    }
    audio.muted = readMuted();
    currentTrackRef.current = src;
    audio.play().catch(() => { /* autoplay blocked or file missing */ });
    fadeAudio(audio, MUSIC_VOL);
  }, [fadeAudio]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const scaleRef = useRef(1);
  const atlasRef = useRef<Atlas | null>(null);
  const saveRef = useRef<GameSave>(newSave());
  const sceneRef = useRef<SceneDef>(SCENES.apartment);
  const posRef = useRef<Vec>({ x: 0, y: 0 });
  const dirRef = useRef<Dir>('down');
  const movingRef = useRef(false);
  const animRef = useRef(0);
  const inputRef = useRef(new Input());
  const solidsRef = useRef(new Set<string>());
  const overlayRef = useRef<Overlay | null>(null);
  const fishModeRef = useRef<FishMode | null>(null);
  const pendingBeatsRef = useRef<StoryBeat[]>([]);
  const sleepTimerRef = useRef<number | null>(null);
  const oreNodesRef = useRef<OreNode[]>([]);
  const crawlersRef = useRef<Crawler[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const nursedRef = useRef(false);
  const pendingWakeRef = useRef<{ collapsed: boolean; nursed: boolean; recap: DayRecap } | null>(null);
  const sparkleRef = useRef<{ x: number; y: number; t: number } | null>(null);
  // Floating "+N Mineral" pickup text that rises and fades over a mined node.
  const mineTextRef = useRef<{ x: number; y: number; text: string; color: string; t: number } | null>(null);
  const hurtCooldownRef = useRef(0);
  const lastSafeTileRef = useRef<Vec | null>(null);
  const warpCooldownRef = useRef(0); // grace after a warp so you don't bounce back through an adjacent return warp
  const shrineHealRef = useRef(0);   // accumulates real seconds for the very-slow shrine energy heal
  const signGlowRef = useRef(new Map<object, HTMLCanvasElement>()); // cached neon-bloom sprites per sign (built once, not per frame)
  const wanderersRef = useRef<Wanderer[]>([]); // live positions of gently-pacing NPCs in the current scene
  const djPickRef = useRef<string | null>(null);

  // ---- furniture Arrange mode (drag-and-drop placement) ----------------------
  const arrangeRef = useRef(false);                 // loop reads this to freeze/render
  const [arrangeOpen, setArrangeOpen] = useState(false); // drives the DOM overlay
  const [arrangeTick, setArrangeTick] = useState(0);     // re-render tray on change
  const heldRef = useRef<{ id: string; from: 'box' | 'placed' } | null>(null);
  const ghostRef = useRef<{ tx: number; ty: number; valid: boolean } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const exitArrangeRef = useRef<() => void>(() => {}); // late-bound (update runs before the handler is defined)

  const setOverlayBoth = useCallback((o: Overlay | null) => {
    overlayRef.current = o;
    setOverlay(o);
  }, []);

  const [achToast, setAchToast] = useState<{ title: string; desc: string } | null>(null);
  const achTimerRef = useRef<number | null>(null);

  // Phone-message toast (mirrors the achievement toast). Fired by checkMessages
  // when a new text is delivered, with the notification sound.
  const [msgToast, setMsgToast] = useState<{ from: string; count: number; preview: string; id: string } | null>(null);
  const msgTimerRef = useRef<number | null>(null);

  // Tapping the toast opens that text in the phone Messages app (marks it read).
  const openToastMessage = useCallback((id: string) => {
    if (msgTimerRef.current) window.clearTimeout(msgTimerRef.current);
    setMsgToast(null);
    const s = saveRef.current;
    const m = s.messages.find(x => x.id === id);
    if (m && !m.read) { m.read = true; persistSave(s); refreshHud(); }
    setOverlayBoth({ type: 'menu', tab: 'messages', thread: id });
  }, []);

  // Deliver any newly-eligible phone messages; if any arrived, buzz + toast
  // ("check your phone") and refresh the unread badge. Returns fresh count.
  const checkMessages = useCallback((): number => {
    const s = saveRef.current;
    const fresh = syncMessages(s);
    if (fresh.length === 0) return 0;
    persistSave(s);
    refreshHud();
    sfxPhone();
    const latest = fresh[fresh.length - 1];
    const preview = latest.body[0].length > 48 ? latest.body[0].slice(0, 47) + '…' : latest.body[0];
    setMsgToast({ from: latest.from, count: fresh.length, preview, id: latest.id });
    if (msgTimerRef.current) window.clearTimeout(msgTimerRef.current);
    msgTimerRef.current = window.setTimeout(() => setMsgToast(null), 6000);
    return fresh.length;
  }, []);

  // Cover the screen with a transition overlay, swap underneath while it's
  // opaque (coverMs), then uncover (totalMs). Timers cleared on unmount.
  const runTransition = useCallback((kind: 'start' | 'freezer' | 'fade' | 'hack', action: () => void, coverMs: number, totalMs: number) => {
    transTimers.current.forEach(id => window.clearTimeout(id));
    transTimers.current = [];
    setTransition(kind);
    transTimers.current.push(window.setTimeout(action, coverMs));
    transTimers.current.push(window.setTimeout(() => setTransition(null), totalMs));
  }, []);

  const award = useCallback((id: string) => {
    const s = saveRef.current;
    if (!unlockGameAch(s, id)) return;
    persistSave(s);
    sfxAchievement();
    const a = GAME_ACHIEVEMENTS.find(x => x.id === id)!;
    setAchToast({ title: a.title, desc: a.desc });
    if (achTimerRef.current) window.clearTimeout(achTimerRef.current);
    achTimerRef.current = window.setTimeout(() => setAchToast(null), 3500);
  }, []);

  const refreshHud = useCallback(() => {
    const s = saveRef.current;
    if (s.money >= 50000) award('rich');
    if (s.money < 100) award('broke');
    setHud({
      money: s.money, day: s.day, time: clockLabel(s), energy: s.energy, max: maxEnergy(s),
      sceneName: sceneRef.current.name, fish: s.fishInv.length, ownedCount: s.owned.length,
      late: s.timeMin >= 24 * 60, // midnight or later
      unread: unreadCount(s),
    });
  }, [award]);

  const showDialog = useCallback((lines: string[], speaker?: string) => {
    setOverlayBoth({ type: 'dialog', lines, idx: 0, speaker });
  }, [setOverlayBoth]);

  const computeSolids = useCallback(() => {
    const set = new Set<string>();
    const scene = sceneRef.current;
    const s = saveRef.current;
    for (const npc of scene.npcs) {
      if (npc.id === 'yakuza' && s.gangPaid) continue; // paid off — no longer blocks
      if (WANDER_IDS.has(npc.id)) continue; // wanderers move; not part of the static solid set
      if (NIGHT_EVEN_IDS.has(npc.id) && !davidActive(s)) continue; // David's only here on even nights
      set.add(`${npc.x},${npc.y}`);
    }
    if (scene.id === 'apartment') {
      for (const itemId of Object.keys(s.placed)) {
        if (itemId === 'ac' || itemId === 'neon') continue; // wall mounts don't block
        const pos = s.placed[itemId];
        const w = itemId === 'bed' || itemId === 'sofa' || itemId === 'kotatsu' ? 2 : 1;
        for (let dx = 0; dx < w; dx++) set.add(`${pos.x + dx},${pos.y}`);
      }
    }
    if (s.carPos && s.carPos.scene === scene.id) {
      set.add(`${s.carPos.x},${s.carPos.y}`);
      set.add(`${s.carPos.x + 1},${s.carPos.y}`);
    }
    solidsRef.current = set;
  }, []);

  const checkStory = useCallback(() => {
    const s = saveRef.current;
    for (const beat of STORY_BEATS) {
      if (s.storySeen.includes(beat.id)) continue;
      if (beat.when(s.owned)) {
        s.storySeen.push(beat.id);
        pendingBeatsRef.current.push(beat);
      }
    }
  }, []);

  const enterScene = useCallback((id: string, tx: number, ty: number, dir: Dir) => {
    const s = saveRef.current;
    // First time you LEAVE the konbini: timestamp it so the job offer can text
    // you about an hour later (see the 'konbini-job' message).
    if (sceneRef.current.id === 'konbini' && id !== 'konbini' && s.leftKonbiniAt == null) {
      s.leftKonbiniAt = s.day * 1440 + s.timeMin;
    }
    sceneRef.current = SCENES[id];
    wanderersRef.current = makeWanderers(SCENES[id]);
    posRef.current = { x: tx * TILE, y: ty * TILE - 4 };
    dirRef.current = dir;
    warpCooldownRef.current = 0.6; // don't re-trigger a nearby warp for a beat after arriving
    s.scene = id; s.px = posRef.current.x; s.py = posRef.current.y; s.dir = dir;
    if (!s.visited.includes(id)) s.visited.push(id);
    checkMessages(); // visiting a place can unlock its texts (buzz if so)
    if (id !== 'nightclub') djPickRef.current = null; // the set ends when you leave
    if (id === 'mines') {
      const layout = mineLayoutFor(s);
      oreNodesRef.current = layout.ore;
      crawlersRef.current = layout.crawlers.map(c => ({
        x: c.x * TILE, y: c.y * TILE - 4, hp: 2, stepT: Math.random(), hurtT: 0, dir: 'down' as Dir,
      }));
    } else {
      crawlersRef.current = [];
    }
    computeSolids();
    persistSave(s);
    refreshHud();
    playMusicFor(id);
    if (id === 'nightclub') award('club');
  }, [computeSolids, refreshHud, playMusicFor, award]);

  // ---- interactions ----------------------------------------------------------

  // Sleep / collapse → end-of-day recap → wake. Three steps so the player can
  // read the recap (and so an "out cold" screen waits for a click first).
  const finishSleep = useCallback(() => {
    const pending = pendingWakeRef.current;
    if (!pending) return;
    const s = saveRef.current;
    if (sleepTimerRef.current) { window.clearTimeout(sleepTimerRef.current); sleepTimerRef.current = null; }
    passNight(s); // day+1, restore energy, reset today's tally
    if (pending.collapsed || pending.nursed) {
      // You wake up next to the bed, however you got there.
      sceneRef.current = SCENES.apartment;
      posRef.current = { x: 2 * TILE, y: 2 * TILE - 4 };
      dirRef.current = 'down';
      s.scene = 'apartment';
      computeSolids();
      if (!pending.nursed) award('night-owl');
    }
    fulfillDeliveries(s); // ZamaZonk orders land in the boxes this morning
    // Konbini lottery resolves the morning after you buy a ticket. SECRET: shrine
    // donations quietly raise your odds (more offered = luckier draw).
    if (s.lotteryDay > 0 && s.lotteryDay < s.day) {
      const odds = 0.05 + Math.min(0.30, s.donated / 15000);
      if (Math.random() < odds) {
        const prize = 20000;
        s.money += prize;
        pushMessage(s, { id: `lottery-${s.day}`, from: 'Konbini 24h 🏪', avatar: '🏪', company: true,
          body: [`🎉 KONBINI LOTTERY: your ticket WON! ¥${prize.toLocaleString()} credited. The clerk seems almost suspicious of your luck. 🍀`] });
      } else {
        pushMessage(s, { id: `lottery-${s.day}`, from: 'Konbini 24h 🏪', avatar: '🏪', company: true,
          body: ['KONBINI LOTTERY: not a winner this time. A fresh ticket is waiting at the counter. 🎫'] });
      }
      s.lotteryDay = 0;
    }
    checkStory();
    checkMessages(); // new day can trigger date-gated texts (buzz if so)
    persistSave(s);
    refreshHud();
    setOverlayBoth({ type: 'endday', recap: pending.recap });
    playMusicFor('endofday'); // dedicated end-of-day theme over the recap
  }, [setOverlayBoth, checkStory, refreshHud, computeSolids, playMusicFor, award]);

  const closeEndDay = useCallback(() => {
    const pending = pendingWakeRef.current;
    pendingWakeRef.current = null;
    setOverlayBoth(null);
    playMusicFor(sceneRef.current.id); // back to the world's music
    if (pending?.nursed) {
      nursedRef.current = false;
      showDialog([
        'You wake in your own bed. There is a damp towel on your forehead, folded with surprising precision.',
        'Jean-Pierre is sitting backwards on your desk chair. "Bonjour. You were face-down in ze yellow place. Very dramatique."',
        '"I carry you up ze ladder, through ze freezer, past ze nice monster. He says hello, by ze way."',
        '"In France we have a saying: do not fight ze crawling things on an empty battery." He pats your head exactly once, and leaves.',
      ], 'Jean-Pierre');
    }
  }, [setOverlayBoth, playMusicFor, showDialog]);

  const doSleep = useCallback((collapsed = false, nursed = false) => {
    const s = saveRef.current;
    fishModeRef.current = null;
    projectilesRef.current = [];
    // if you go down behind the wheel, the car stays where you left it
    if (s.driving) {
      const ft = feetTile(posRef.current);
      s.carPos = { scene: sceneRef.current.id, x: ft.x, y: ft.y };
      s.driving = false;
    }
    // Snapshot the day's tally BEFORE passNight resets it.
    const recap: DayRecap = {
      day: s.day,
      net: s.money - s.today.startMoney,
      fish: s.today.fishCaught,
      minerals: s.today.mineralsMined,
      shifts: s.today.shifts,
      furniture: [...s.today.newFurniture],
      collapsed: collapsed || nursed,
    };
    pendingWakeRef.current = { collapsed, nursed, recap };
    if (collapsed || nursed) {
      // Passed out — hold on the "out cold" screen until the player clicks.
      setOverlayBoth({ type: 'sleep', day: s.day + 1, collapsed: true, awaitClick: true });
    } else {
      // Ordinary sleep: a brief fade, then the recap.
      setOverlayBoth({ type: 'sleep', day: s.day + 1, collapsed: false });
      sleepTimerRef.current = window.setTimeout(() => { sleepTimerRef.current = null; finishSleep(); }, 1500);
    }
  }, [setOverlayBoth, finishSleep]);

  // Where can you sleep? Wherever the bed is placed; the default futon until then.
  const sleepRect = useCallback((): { x: number; y: number; w: number; h: number } => {
    const bed = saveRef.current.placed['bed'];
    return bed ? { x: bed.x, y: bed.y, w: 2, h: 1 } : { x: 1, y: 1, w: 2, h: 1 };
  }, []);

  // The vending machine offers a couple of legally-distinct sodas; cans go in
  // your pocket (drink from the phone, or share one with someone parched).
  const useVending = useCallback(() => {
    setOverlayBoth({ type: 'shop', shop: 'vending' });
  }, [setOverlayBoth]);

  // Buy a can — it always goes in your pocket (drink it later from the bag).
  const buySoda = (soda: Soda) => {
    const s = saveRef.current;
    if (s.money < soda.price) return;
    s.money -= soda.price;
    if (soda.id === 'peepis') s.peepis += 1;
    else s.sodas[soda.id] = (s.sodas[soda.id] ?? 0) + 1;
    sfxCoin();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  // Drink a pocketed soda for its energy (from the bag).
  const drinkSoda = (soda: Soda) => {
    const s = saveRef.current;
    if ((s.sodas[soda.id] ?? 0) <= 0 || s.energy >= maxEnergy(s)) return;
    s.sodas[soda.id] -= 1;
    s.energy = Math.min(maxEnergy(s), s.energy + (soda.energy ?? 0));
    sfxCoin();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  const eatCoconut = () => {
    const s = saveRef.current;
    if (s.coconuts <= 0 || s.energy >= maxEnergy(s)) return;
    s.coconuts -= 1;
    s.energy = Math.min(maxEnergy(s), s.energy + 15);
    sfxCoin();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  const drinkPeepis = () => {
    const s = saveRef.current;
    if (s.peepis <= 0 || s.energy >= maxEnergy(s)) return;
    s.peepis -= 1;
    s.energy = Math.min(maxEnergy(s), s.energy + 12);
    sfxCoin();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  const feedMonster = () => {
    const s = saveRef.current;
    if (s.peepis <= 0 || s.monsterFed) return;
    s.peepis -= 1;
    s.monsterFed = true;
    sfxCatch();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  const startCast = useCallback((waterTile: Vec, table: FishTable) => {
    const s = saveRef.current;
    if (!s.canFish) {
      showDialog(["You stare at the water. You have a rod somewhere, probably, but no idea how to use it.", 'Genji — the old fisherman on Sumikawa Shore — looks like the type who could teach you.']);
      return;
    }
    const cost = energyCost(s, CAST_COST);
    if (s.energy < cost) { showDialog(['You are too tired to cast. Eat something, or sleep.']); return; }
    s.energy -= cost;
    persistSave(s); refreshHud();
    fishModeRef.current = { phase: 'wait', t: 1 + Math.random() * 2.2, tile: waterTile, table };
  }, [showDialog, refreshHud]);

  const catchFish = useCallback((fish: Fish, deep: boolean) => {
    const s = saveRef.current;
    s.fishInv.push(fish.id);
    s.fishLog[fish.id] = (s.fishLog[fish.id] || 0) + 1;
    s.today.fishCaught += 1;
    persistSave(s); refreshHud();
    sfxCatch();
    award('first-fish');
    if (deep) award('deep');
    if (fish.id === 'golden') award('golden');
    const flair = fish.id === 'golden' ? ' Genji will not believe this.' : fish.id === 'koi' ? ' Someone must miss it.' : '';
    showDialog([`You caught a ${fish.name}! (worth ¥${fish.value})${flair}`]);
  }, [refreshHud, showDialog, award]);

  const rollGacha = useCallback(() => {
    const s = saveRef.current;
    if (s.money < GACHA_PRICE) { showDialog(['¥300 a turn. The machine does not do credit. Mr. Maeda checked.']); return; }
    s.money -= GACHA_PRICE;
    const wasComplete = gachaComplete(s);
    const fig = GACHA_FIGURES[Math.floor(Math.random() * GACHA_FIGURES.length)];
    s.gacha[fig] = (s.gacha[fig] ?? 0) + 1;
    sfxCoin();
    const have = GACHA_FIGURES.filter(n => (s.gacha[n] ?? 0) > 0).length;
    const lines = [
      `KA-CHUNK. The capsule pops open: "${fig}"${s.gacha[fig] > 1 ? ` (×${s.gacha[fig]} — the shelf grows)` : ' — NEW!'}`,
      `Collection: ${have}/${GACHA_FIGURES.length}`,
    ];
    if (!wasComplete && gachaComplete(s)) {
      lines.push('That... was the last one. The machine hums approvingly. Something golden has appeared in your apartment.');
      award('gacha-set');
    }
    persistSave(s); refreshHud();
    showDialog(lines);
  }, [showDialog, refreshHud]);

  // Open the casino game UIs (reset to a fresh hand / idle reels first).
  const startBlackjack = useCallback(() => {
    const prev = casinoRef.current.bj.bet;
    casinoRef.current.bj = { ...freshBlackjack(), bet: prev };
    setOverlayBoth({ type: 'shop', shop: 'blackjack' });
    setShopTick(v => v + 1);
  }, [setOverlayBoth]);
  const startSlots = useCallback(() => {
    const slot = casinoRef.current.slot;
    if (slot.timer != null) { window.clearInterval(slot.timer); }
    casinoRef.current.slot = { ...freshSlots(), bet: slot.bet };
    setOverlayBoth({ type: 'shop', shop: 'slots' });
    setShopTick(v => v + 1);
  }, [setOverlayBoth]);

  // A legal parking spot: two walkable tiles, neither of them a warp (doors stay clear).
  const findParkSpot = (scene: typeof SCENES[string], feet: Vec): Vec | null => {
    const isWarpAt = (x: number, y: number) => scene.warps.some(w => w.x === x && w.y === y);
    const ok = (x: number, y: number) => {
      for (const cx of [x, x + 1]) {
        if (isWarpAt(cx, y)) return false;
        const row = scene.grid[y];
        if (!row) return false;
        const def = scene.legend[row[cx]];
        if (!def || def.solid) return false;
      }
      return true;
    };
    const tries: [number, number][] = [[0, 0], [-1, 0], [1, 0], [0, 1], [0, -1], [-2, 0], [2, 0]];
    for (const [dx, dy] of tries) {
      if (ok(feet.x + dx, feet.y + dy)) return { x: feet.x + dx, y: feet.y + dy };
    }
    return null;
  };

  const handleInteract = useCallback(() => {
    const scene = sceneRef.current;
    const faced = facedTile(posRef.current, dirRef.current);
    const feet = feetTile(posRef.current);
    const s = saveRef.current;

    // Behind the wheel, E means one thing: park.
    if (s.driving) {
      const spot = findParkSpot(scene, feet);
      if (!spot) { showDialog(["No room to park here — and Kojima's voice in your head says never block a doorway."]); return; }
      s.carPos = { scene: scene.id, x: spot.x, y: spot.y };
      s.driving = false;
      computeSolids();
      persistSave(s); refreshHud();
      sfxCoin();
      // step out beside the car
      for (const [dx, dy] of [[0, 18], [0, -18], [-18, 0], [18, 0]]) {
        const cand = tryMove(scene, posRef.current, dx, dy, solidsRef.current);
        if (cand.x !== posRef.current.x || cand.y !== posRef.current.y) { posRef.current = cand; break; }
      }
      return;
    }

    // Hop into the parked car
    if (s.carPos && s.carPos.scene === scene.id) {
      const onCar = (tt: Vec) => tt.y === s.carPos!.y && (tt.x === s.carPos!.x || tt.x === s.carPos!.x + 1);
      if (onCar(faced) || onCar(feet)) {
        posRef.current = { x: s.carPos.x * TILE, y: s.carPos.y * TILE - 4 };
        s.carPos = null;
        s.driving = true;
        computeSolids();
        persistSave(s); refreshHud();
        sfxBuy();
        return;
      }
    }

    // Sleeping spot is dynamic: the placed bed, or the default futon.
    if (scene.id === 'apartment') {
      const r = sleepRect();
      const inRect = (tt: Vec) => tt.x >= r.x && tt.x < r.x + r.w && tt.y >= r.y && tt.y < r.y + r.h;
      if (inRect(faced) || inRect(feet)) { doSleep(); return; }
      const arc = s.placed['arcade'];
      if (arc && faced.x === arc.x && faced.y === arc.y) {
        showDialog(['You play VOID PATROL until your eyes hum pleasantly.', 'New high score: still not yours. The cabinet purrs. Somewhere, The Manager is proud.']);
        return;
      }
    }

    // Mines: mine ore, or let the wand do the talking
    if (scene.id === 'mines') {
      const node = oreNodesRef.current.find(n => n.x === faced.x && n.y === faced.y);
      if (node) {
        const cost = energyCost(s, MINE_COST);
        if (s.energy < cost) { showDialog(['Too tired to swing. The rock hums smugly.']); return; }
        // Remove the node up front so a second swing can't re-hit it mid-frame.
        oreNodesRef.current = oreNodesRef.current.filter(n => n !== node);
        s.minedNodes.push(`${node.x},${node.y}`);
        const amount = node.amount ?? 1;
        s.energy -= cost;
        s.minerals[node.mineral.id] = (s.minerals[node.mineral.id] ?? 0) + amount;
        s.today.mineralsMined += amount;
        // Satisfying pop: a sparkle burst + a floating "+N Mineral" pickup label.
        sparkleRef.current = { x: node.x * TILE, y: node.y * TILE, t: 0.45 };
        mineTextRef.current = {
          x: node.x * TILE, y: node.y * TILE,
          text: amount > 1 ? `+${amount} ${node.mineral.name}` : node.mineral.name,
          color: node.mineral.color, t: 1.1,
        };
        sfxMine(node.mineral.value);
        award('miner');
        persistSave(s); refreshHud();
        return;
      }
    }

    // Prefer a wanderer at the faced tile (they move; their static tile is stale).
    const wanderHit = wanderersRef.current.find(w => Math.round(w.x / TILE) === faced.x && Math.round(w.y / TILE) === faced.y);
    const npc = wanderHit
      ? { id: wanderHit.id, x: faced.x, y: faced.y, sprite: wanderHit.sprite, dir: wanderHit.dir }
      : scene.npcs.find(n => n.x === faced.x && n.y === faced.y && !WANDER_IDS.has(n.id)
          && !(NIGHT_EVEN_IDS.has(n.id) && !davidActive(s)));
    if (npc) {
      // Merchants open their stalls; everyone else just talks.
      if (npc.id === 'yakuza') {
        if (s.gangPaid) return; // already paid; he's on his way out
        setOverlayBoth({ type: 'shop', shop: 'yakuza' });
        return;
      }
      if (npc.id === 'campfire') { showDialog(['Driftwood crackles, though no one gathered it. The fire smells of the sea — and something older.']); return; }
      if (npc.id === 'david') {
        if (s.rares.includes('coffin')) {
          showDialog(['David smiles, firelight catching his teeth. "Sleep well in your new bed, friend. I always do."'], 'David');
          return;
        }
        if ((s.sodas['conk'] ?? 0) > 0) {
          s.sodas['conk'] -= 1;
          s.rares.push('coffin');
          sfxCatch();
          persistSave(s); refreshHud();
          showDialog([
            'David takes the Conk, drinks, and lets out a long sigh. "...You know, don\'t you."',
            '"Fine. Yes. A vampire. Three hundred and twelve years — the sea air helps with the cravings."',
            '"You kept a stranger company and asked nothing. Take this; an old friend built it. It\'s yours." (Got a rare COFFIN — a new bed for your apartment!)',
          ], 'David');
          return;
        }
        showDialog([
          'A pale man tends a driftwood fire, though the night is not cold. "Lovely evening. Care to sit?"',
          'His smile is all teeth. "You wouldn\'t happen to have a Conk on you? I have such a... thirst."',
        ], 'David');
        return;
      }
      if (npc.id === 'sketchy') { setOverlayBoth({ type: 'shop', shop: 'sketchy' }); return; }
      if (npc.id === 'casino-host') { setOverlayBoth({ type: 'shop', shop: 'casino' }); return; }
      if (npc.id === 'monster') {
        // Once you own every one of his rares, The Manager lets you in on the
        // secret: there's a way to Paris hidden in the backrooms. (Feature #19.)
        if (s.monsterFed && allRaresOwned(s) && !s.parisRevealed) {
          s.parisRevealed = true;
          sfxCatch();
          persistSave(s); refreshHud();
          showDialog([
            'The Manager goes still. "You have taken everything I had to sell. Every piece. Hm. Hmmm."',
            '"Then I will tell you a secret, customer. That little tourist? Jean-Pierre? He did not come from your city at all."',
            '"There is a SEAM in the wall — the top of this room. It opens to Paris. Real Paris. France. That is where he slipped in from."',
            '"Go and see. Press yourself to the seam. It will... load." Its smile does something a smile should not do.',
          ], 'The Manager');
          return;
        }
        setOverlayBoth({ type: 'shop', shop: 'monster' });
        return;
      }
      if (npc.id === 'tex') { setOverlayBoth({ type: 'shop', shop: 'hat' }); return; }
      if (npc.id === 'dj') { setOverlayBoth({ type: 'shop', shop: 'dj' }); return; }
      if (npc.id === 'tiki') { setOverlayBoth({ type: 'shop', shop: 'tiki' }); return; }
      if (npc.id === 'old-man' && !s.canFish) {
        s.canFish = true;
        persistSave(s); refreshHud();
        sfxCatch();
        showDialog([
          'The old man squints at you. "You have the look of someone who has never caught a thing in their life."',
          'He presses a worn fishing rod into your hands. "Take it. I have spares, and you have time."',
          'HOW TO FISH: face the water and press E to cast. Wait for the bobber to dip, then press E to hook it.',
          'Then a bar appears — HOLD E to raise the green zone, release to drop it. Keep the fish inside the zone until the catch meter fills.',
          '"The konbini buys whatever you pull out. Now go on. The water is not getting any younger, and neither am I."',
        ], 'Genji');
        return;
      }
      // The Paris baguette vendor: hands you a baguette that heals a big chunk
      // of energy (bigger than konbini food). (Feature #20.)
      if (npc.id === 'baguette') {
        if (s.money < 400) { showDialog(['"Une baguette, four hundred yen — oui, we take yen here, do not ask." He shrugs, very French.', 'You count your coins. Not today.'], 'Baguette Vendor'); return; }
        if (s.energy >= maxEnergy(s)) { showDialog(['"You are already full of life, mon ami! Come back when ze city has tired you out."'], 'Baguette Vendor'); return; }
        s.money -= 400;
        s.energy = Math.min(maxEnergy(s), s.energy + 70);
        sfxCatch();
        persistSave(s); refreshHud();
        showDialog(['He tears a baguette from the rack, still warm, and presses it into your arms.', 'You eat it on the spot, like a barbarian. It is the best thing you have ever tasted. (+70 energy)'], 'Baguette Vendor');
        return;
      }
      // The Big Guy at Club Kaiju: brushes you off until you bring him a "Diet
      // Mountain Doofert", then reveals the konbini freezer portal. (Feature #18.)
      if (npc.id === 'kaiju' && !s.backroomsUnlocked) {
        if ((s.sodas.doofert ?? 0) > 0) {
          s.sodas.doofert -= 1;
          s.backroomsUnlocked = true;
          sfxCatch();
          persistSave(s); refreshHud();
          showDialog([
            'You hold up the "Diet Mountain Doofert". The Big Guy\'s eyes go wide as manhole covers.',
            'He drains the whole can in one pull, lets out a belch that resets the DJ\'s playlist, and finally crouches down to your level.',
            '"...Okay. You\'re alright, little one. Listen — that konbini on Kawamachi St.? The walk-in freezer in back? It is not a freezer."',
            '"Step through the cold. There is a whole place behind the city. The yellow place. Tell them the Big Guy sent you."',
          ], 'The Big Guy');
        } else {
          showDialog([
            'The Big Guy barely glances down from the dance floor. "Mnh. Busy. Dancing."',
            'He sniffs the air, disappointed. "...You don\'t even have a Doofert. Diet Mountain. The good stuff. Bring me one, then we talk."',
          ], 'The Big Guy');
        }
        return;
      }
      const voice = NPC_VOICES[npc.id];
      if (voice) {
        const set = voice.sets[Math.floor(Math.random() * voice.sets.length)];
        showDialog([...set, ...npcDynamicLines(npc.id, s)], voice.speaker);
      }
      return;
    }

    const hit = (it: Interactable, t: Vec) =>
      t.x >= it.x && t.x < it.x + (it.w ?? 1) && t.y >= it.y && t.y < it.y + (it.h ?? 1);
    let target = scene.interactables.find(it => hit(it, faced) || hit(it, feet));
    // The skiff's mooring is plain shoreline until you own the skiff
    if (target?.id === 'boat' && !s.vehicles.includes('boat')) {
      target = scene.interactables.find(it => it.id === 'fish-spot');
    }
    if (!target) {
      // Open water: every direction is a fishing spot
      if (scene.id === 'deepsea') { startCast(faced, 'deep'); return; }
      // Mines: no ladder, no ore, nobody — the wand speaks
      if (scene.id === 'mines') {
        if (s.wand) {
          const d = dirRef.current;
          const SPD = 190;
          projectilesRef.current.push({
            x: posRef.current.x + 4, y: posRef.current.y + 4,
            dx: d === 'left' ? -SPD : d === 'right' ? SPD : 0,
            dy: d === 'up' ? -SPD : d === 'down' ? SPD : 0,
            t: 0.8,
          });
          sfxBite();
          return;
        }
        const crNear = crawlersRef.current.some(c => Math.abs(c.x - posRef.current.x) + Math.abs(c.y - posRef.current.y) < 3 * TILE);
        if (crNear) { showDialog(['You wave your empty hand at it. It waves several of its hands back. This is not working.']); return; }
      }
      return;
    }

    switch (target.id) {
      case 'window': {
        const n = s.owned.length;
        showDialog([
          n === 0
            ? 'The city goes on forever out there. Behind you, the apartment is an empty box. For now.'
            : n < FURNITURE.length
              ? `Trains, neon, ten million strangers. Behind you: ${n} ${n === 1 ? 'thing' : 'things'} that are yours.`
              : 'The city glitters. You turn around, and home glitters back.',
        ]);
        break;
      }
      case 'vending': useVending(); break;
      case 'vending-dead':
        showDialog(['OUT OF ORDER, says the sign. Behind the glass, one light still blinks.', 'Something inside hisses softly. You decide you were never thirsty.']);
        break;
      case 'bar': {
        if (s.money < 500) { showDialog(['"Highball is ¥500," Saito says, kindly not looking at your wallet.'], 'Saito'); break; }
        if (s.energy >= maxEnergy(s)) { showDialog(['"You look plenty awake already," Saito says. "Come back when the city has had its way with you."'], 'Saito'); break; }
        s.money -= 500;
        s.energy = Math.min(maxEnergy(s), s.energy + 15);
        sfxCoin();
        persistSave(s); refreshHud();
        showDialog(['One perfect highball, exactly as cold as the glass can bear. (+15 energy)'], 'Saito');
        break;
      }
      case 'gacha': rollGacha(); break;
      case 'shrine': {
        if (s.money < 500) { showDialog(['The offering box waits patiently. It has waited longer than you have been broke.']); break; }
        s.money -= 500;
        const prevTier = shrineLuck(s);
        s.donated += 500;
        const tier = shrineLuck(s);
        sfxCoin();
        if (tier === 1) award('blessed');
        persistSave(s); refreshHud();
        if (tier > prevTier) {
          sfxCatch();
          showDialog([
            tier === 1
              ? 'The coin drops. The wind shifts. Somewhere, the water feels friendlier. (Fishing luck up!)'
              : 'The whole shrine seems to lean toward you approvingly. (Fishing luck way up!)',
          ]);
        } else {
          const lines = [
            'Clink. You bow twice, clap twice, and ask for nothing in particular.',
            `Clink. (Total offered: ¥${s.donated.toLocaleString()})`,
            'Clink. A crow watches you with what might be respect.',
          ];
          showDialog([lines[Math.floor(Math.random() * lines.length)]]);
        }
        break;
      }
      case 'portal': {
        // Sealed until the Big Guy at Club Kaiju lets you in on the secret.
        if (!s.backroomsUnlocked) {
          showDialog([
            'You haul the walk-in freezer open. Cold air, frost, stacked drink crates — and a solid back wall behind them.',
            'There is nothing here. Just a wall, and the hum of the compressors. Not yet, anyway.',
          ]);
          break;
        }
        sfxBackroomsWarp();
        // Cold-flash teleport: swap to the backrooms while the screen is covered.
        runTransition('freezer', () => {
          enterScene('backrooms', 4, 9, 'right');
          award('backrooms');
          if (!s.storySeen.includes('backrooms-intro')) {
            s.storySeen.push('backrooms-intro');
            persistSave(s);
            showDialog([
              'The freezer door sticks, then gives. The cold lasts exactly three steps.',
              'Then there is no freezer, no cold, no konbini. Just yellow walls and a hum that is not the drink fridges.',
              'Something large and polite clears its throat in the distance.',
            ]);
          }
        }, 850, 1750);
        break;
      }
      case 'portal-exit':
        enterScene('konbini', 4, 2, 'down');
        break;
      case 'paris-portal': {
        // The secret entrance only "loads" once The Manager has revealed it.
        if (!s.parisRevealed) {
          showDialog(['Just a hairline seam in the endless yellow wall. You press it. It does not give. Not yet.']);
          break;
        }
        // The game gets "hacked": a long fake-terminal screen loads Paris while
        // the transition score plays, then drops you into the map. (Feature #21.)
        playMusicFor('paris-transition');
        runTransition('hack', () => {
          enterScene('paris', 12, 8, 'down');
          if (!s.storySeen.includes('paris-intro')) {
            s.storySeen.push('paris-intro');
            persistSave(s);
            showDialog([
              'The terminal blinks out. The yellow hum is gone.',
              'Cobblestones. A café. The smell of bread and river water. Above it all, impossibly, the Eiffel Tower.',
              'Somewhere a long way from your little apartment, you are standing in Paris.',
            ]);
          }
        }, 6000, 6600);
        break;
      }
      case 'seine':
        showDialog(['The Seine slides past, brown and unhurried, carrying the lights of the bridges.', 'You could stand here a while. You are, technically, very far from home.']);
        break;
      case 'descend':
        if (!s.wand) {
          showDialog([
            'A hand on your shoulder. Jean-Pierre, suddenly very serious.',
            '"Non non non, mon ami. Down zere? Wizout ze sparkle stick? Zey will EAT you. Conceptually AND literally."',
            '"Ze big monsieur sells ze magical girl wand. Buy first. Descend second. Zis is ze order of operations."',
          ], 'Jean-Pierre');
          break;
        }
        enterScene('mines', 2, 1, 'down');
        if (!s.storySeen.includes('mines-intro')) {
          s.storySeen.push('mines-intro');
          persistSave(s);
          showDialog([
            'The ladder goes down further than ladders should.',
            'The walls glitter with something that is not quite mineral and not quite awake.',
            'Things skitter at the edge of the lamplight. Best to have something sparkly to wave at them.',
          ]);
        }
        break;
      case 'ascend':
        enterScene('backrooms', 12, 9, 'down');
        break;
      case 'shop-denden':
        if (!s.metStores.includes('denden')) {
          s.metStores.push('denden'); persistSave(s); refreshHud();
          showDialog([
            '"Irasshaimase! Welcome to DOKI DOKI DISCOUNT — your home electronics superstore!"',
            '"TVs, fridges, ACs, microwaves. Everything to make 19 square meters feel like 20."',
            '"Mind if we take your number? For deals. Definitely just deals. 🛒"',
          ], 'Doki Doki Discount');
          break;
        }
        setOverlayBoth({ type: 'shop', shop: 'denden' });
        break;
      case 'shop-konbini':
        if (!s.metStores.includes('konbini')) {
          s.metStores.push('konbini'); persistSave(s); refreshHud();
          showDialog([
            '"Welcome to KONBINI 24H! Hot food, cold drinks, and we buy fresh fish at the counter."',
            '"The back freezer is staff-only. Do not mind the humming."',
            '"We will text you the good stuff — what is your number? 🏪"',
          ], 'Konbini 24h');
          break;
        }
        setOverlayBoth({ type: 'shop', shop: 'konbini' });
        break;
      case 'shop-pawn': setOverlayBoth({ type: 'shop', shop: 'pawn' }); break;
      case 'shop-garage': setOverlayBoth({ type: 'shop', shop: 'garage' }); break;
      case 'boat': setOverlayBoth({ type: 'shop', shop: 'boat' }); break;
      case 'boat-island': setOverlayBoth({ type: 'shop', shop: 'boat-island' }); break;
      case 'coconut': {
        if (s.palmDay !== s.day) { s.palmDay = s.day; s.palmsShaken = []; }
        const key = `${target.x},${target.y}`;
        if (s.palmsShaken.includes(key)) { showDialog(['This palm has given all it intends to give today. It sways, unbothered.']); break; }
        s.palmsShaken.push(key);
        s.coconuts += 1;
        sfxCoin();
        persistSave(s); refreshHud();
        showDialog([`THUNK. A coconut rolls to your feet. You bag it. (×${s.coconuts} — eat it from the menu, or sell it at the tiki bar)`]);
        break;
      }
      case 'tiki': setOverlayBoth({ type: 'shop', shop: 'tiki' }); break;
      case 'casino-slots': startSlots(); break;
      case 'casino-blackjack': startBlackjack(); break;
      case 'fish-tropical': startCast(faced, 'tropical'); break;
      case 'fish-spot': startCast(faced, 'shallow'); break;
    }
  }, [doSleep, sleepRect, showDialog, useVending, setOverlayBoth, startCast, rollGacha, startSlots, startBlackjack, enterScene, refreshHud, runTransition, award, playMusicFor]);

  // ---- update -----------------------------------------------------------------

  const advanceDialog = useCallback(() => {
    const ov = overlayRef.current;
    if (!ov || ov.type !== 'dialog') return;
    if (ov.idx + 1 < ov.lines.length) setOverlayBoth({ ...ov, idx: ov.idx + 1 });
    else setOverlayBoth(null);
  }, [setOverlayBoth]);

  const update = useCallback((dt: number) => {
    const input = inputRef.current;
    input.pollGamepad(); // fold controller state in before reading input
    const ov = overlayRef.current;

    if (ov) {
      if (ov.type === 'dialog') {
        if (input.consumeInteract() || input.consumeCancel()) advanceDialog();
        input.consumeInventory();
      } else if (ov.type === 'letter') {
        if (input.consumeInteract() || input.consumeCancel()) setOverlayBoth(null);
        input.consumeInventory();
      } else if (ov.type === 'shop') {
        input.consumeInteract();
        if (input.consumeCancel()) setOverlayBoth(null);
        input.consumeInventory();
      } else if (ov.type === 'menu') {
        input.consumeInteract();
        // I / Y closes the phone outright; Esc / B steps back to the home screen
        // first (like a phone's back gesture), then closes from there.
        if (input.consumeInventory()) setOverlayBoth(null);
        else if (input.consumeCancel()) {
          if (ov.tab === 'home') setOverlayBoth(null);
          else setOverlayBoth({ type: 'menu', tab: ov.tab !== 'messages' || !ov.thread ? 'home' : 'messages', thread: undefined });
        }
      } else if (ov.type === 'sleep') {
        // "Out cold" waits for a press; the plain fade advances on its own timer.
        if (ov.awaitClick && (input.consumeInteract() || input.consumeCancel())) finishSleep();
        input.consumeInventory();
      } else if (ov.type === 'endday') {
        if (input.consumeInteract() || input.consumeCancel()) closeEndDay();
        input.consumeInventory();
      } else {
        input.consumeInteract(); input.consumeCancel(); input.consumeInventory();
      }
      movingRef.current = false;
      return;
    }

    // Arrange mode: pointer drives placement; freeze the avatar, let Esc/B leave.
    if (arrangeRef.current) {
      input.consumeInteract();
      input.consumeInventory();
      if (input.consumeCancel()) exitArrangeRef.current();
      movingRef.current = false;
      return;
    }

    // The day rolls on whenever you're out in the world (incl. fishing).
    {
      const s2 = saveRef.current;
      const beforeChunk = Math.floor(s2.timeMin / 10);
      s2.timeMin += dt * TIME_RATE;
      if (Math.floor(s2.timeMin / 10) !== beforeChunk) { refreshHud(); checkMessages(); } // every 10 game-min: fire any time-gated texts
      // The shrine grounds restore energy very slowly (+1 every few real seconds).
      if (sceneRef.current.id === 'shrine') {
        if (s2.energy < maxEnergy(s2)) {
          shrineHealRef.current += dt;
          if (shrineHealRef.current >= 3) { shrineHealRef.current = 0; s2.energy = Math.min(maxEnergy(s2), s2.energy + 1); refreshHud(); }
        }
      } else if (shrineHealRef.current !== 0) {
        shrineHealRef.current = 0;
      }
      if (s2.timeMin >= COLLAPSE_MIN) {
        doSleep(true); // 2 AM: you fade out, the city carries you home
        return;
      }
    }

    // Gentle NPC wandering (e.g. Granny pacing her block — never far from home).
    for (const w of wanderersRef.current) {
      w.stepT -= dt;
      if (w.stepT <= 0) {
        w.stepT = 1.2 + Math.random() * 2.8;
        const dx = w.homeX - w.x, dy = w.homeY - w.y;
        if (Math.abs(dx) + Math.abs(dy) > 2.2 * TILE) { // wandered too far — head back
          w.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
          w.moving = true;
        } else {
          w.moving = Math.random() < 0.6;
          if (w.moving) w.dir = (['up', 'down', 'left', 'right'] as Dir[])[Math.floor(Math.random() * 4)];
        }
      }
      if (w.moving) {
        const sp = 20 * dt; // slow shuffle
        const ndx = w.dir === 'left' ? -sp : w.dir === 'right' ? sp : 0;
        const ndy = w.dir === 'up' ? -sp : w.dir === 'down' ? sp : 0;
        const nx = tryMove(sceneRef.current, { x: w.x, y: w.y }, ndx, ndy, solidsRef.current);
        w.x = nx.x; w.y = nx.y;
      }
    }

    if (pendingBeatsRef.current.length > 0) {
      const beat = pendingBeatsRef.current.shift()!;
      persistSave(saveRef.current);
      sfxLetter();
      setOverlayBoth({ type: 'letter', beat });
      return;
    }

    const fm = fishModeRef.current;
    if (fm) {
      if (input.consumeCancel()) { fishModeRef.current = null; return; }
      if (fm.phase === 'wait') {
        if (input.consumeInteract()) { fishModeRef.current = null; showDialog(['You reel in early. Nothing yet.']); return; }
        fm.t -= dt;
        if (fm.t <= 0) { sfxBite(); fishModeRef.current = { phase: 'bite', t: 0.9, tile: fm.tile, table: fm.table }; }
      } else if (fm.phase === 'bite') {
        fm.t -= dt;
        if (input.consumeInteract()) {
          // shrine favor: the valuable fish bite more often
          const luck = shrineLuck(saveRef.current);
          const base = fm.table === 'deep' ? DEEP_FISH : fm.table === 'tropical' ? TROPICAL_FISH : FISH;
          const table = luck === 0 ? base : base.map(f => (f.value >= 500 ? { ...f, weight: f.weight * (1 + 0.5 * luck) } : f));
          fishModeRef.current = { phase: 'reel', st: startFishing(rollFish(Math.random, table)), tile: fm.tile, table: fm.table };
        } else if (fm.t <= 0) {
          fishModeRef.current = null;
          sfxMiss();
          showDialog(['Too slow — it spat the hook and vanished.']);
        }
      } else {
        input.consumeInteract();
        updateFishing(fm.st, dt, input.actionHeld);
        if (fm.st.done === 'caught') { fishModeRef.current = null; catchFish(fm.st.fish, fm.table === 'deep'); }
        else if (fm.st.done === 'escaped') {
          fishModeRef.current = null;
          sfxMiss();
          showDialog([`The ${fm.st.fish.name} fought free. The old man saw everything.`]);
        }
      }
      return;
    }

    const s = saveRef.current;
    if (sceneRef.current.id === 'apartment' && allFurnished(s) && !s.ended) {
      setOverlayBoth({ type: 'ending' });
      return;
    }

    // explore
    if (warpCooldownRef.current > 0) warpCooldownRef.current = Math.max(0, warpCooldownRef.current - dt);
    const dir = input.currentDir();
    if (dir) {
      dirRef.current = dir;
      movingRef.current = true;
      animRef.current += dt;
      // Behind the wheel the city flies by; the skiff glides
      const speed = s.driving ? PLAYER_SPEED * 2.4 : sceneRef.current.id === 'deepsea' ? PLAYER_SPEED * 1.3 : PLAYER_SPEED;
      const dist = speed * dt;
      const dx = dir === 'left' ? -dist : dir === 'right' ? dist : 0;
      const dy = dir === 'up' ? -dist : dir === 'down' ? dist : 0;
      posRef.current = tryMove(sceneRef.current, posRef.current, dx, dy, solidsRef.current);

      const ft = feetTile(posRef.current);
      const warp = sceneRef.current.warps.find(w => w.x === ft.x && w.y === ft.y);
      if (warp && warp.to === 'badtown' && !s.gangPaid) {
        // The yakuza wall the alley off until you pay the toll.
        warpCooldownRef.current = 0.4; // don't spam the line as you bump the edge
        showDialog(['A yakuza enforcer steps into your path, gold watch glinting. "Private district."', 'Face one of them and press E to pay the ¥5,000 toll.'], 'Enforcer');
        return;
      }
      if (warp && warpCooldownRef.current <= 0) {
        // Can't drive indoors: the car auto-parks beside the door, never on it
        if (s.driving && !SCENES[warp.to].outdoor) {
          const spot = findParkSpot(sceneRef.current, lastSafeTileRef.current ?? ft);
          s.carPos = spot
            ? { scene: sceneRef.current.id, x: spot.x, y: spot.y }
            : { scene: 'badtown', x: 17, y: 3 }; // worst case: Kojima holds it
          s.driving = false;
        }
        enterScene(warp.to, warp.tx, warp.ty, warp.dir);
        return;
      }
      if (!sceneRef.current.warps.some(w => w.x === ft.x && w.y === ft.y)) lastSafeTileRef.current = ft;
    } else {
      movingRef.current = false;
    }

    // The Down There has residents
    if (sceneRef.current.id === 'mines' && crawlersRef.current.length > 0) {
      hurtCooldownRef.current = Math.max(0, hurtCooldownRef.current - dt);
      const p = posRef.current;
      for (const c of crawlersRef.current) {
        c.hurtT = Math.max(0, c.hurtT - dt);
        c.stepT -= dt;
        if (c.stepT <= 0) {
          c.stepT = 0.4 + Math.random() * 0.4;
          const distX = p.x - c.x, distY = p.y - c.y;
          const near = Math.abs(distX) + Math.abs(distY) < 6 * TILE;
          if (near) c.dir = Math.abs(distX) > Math.abs(distY) ? (distX > 0 ? 'right' : 'left') : (distY > 0 ? 'down' : 'up');
          else c.dir = (['up', 'down', 'left', 'right'] as Dir[])[Math.floor(Math.random() * 4)];
        }
        const near2 = Math.abs(p.x - c.x) + Math.abs(p.y - c.y) < 2.5 * TILE;
        const sp = (near2 ? 70 : 40) * dt; // lunges harder when it's right on you
        const dx = c.dir === 'left' ? -sp : c.dir === 'right' ? sp : 0;
        const dy = c.dir === 'up' ? -sp : c.dir === 'down' ? sp : 0;
        const next = tryMove(sceneRef.current, { x: c.x, y: c.y }, dx, dy, solidsRef.current);
        c.x = next.x; c.y = next.y;
        // bite check
        if (hurtCooldownRef.current <= 0 && Math.abs(c.x - p.x) < 10 && Math.abs(c.y - p.y) < 10) {
          hurtCooldownRef.current = 1;
          s.energy = Math.max(0, s.energy - CRAWLER_HIT_ENERGY);
          sfxMiss();
          // knockback away from the crawler
          const kb = tryMove(sceneRef.current, p, Math.sign(p.x - c.x) * 14, Math.sign(p.y - c.y) * 14, solidsRef.current);
          posRef.current = kb;
          persistSave(s); refreshHud();
          if (s.energy <= 0) {
            nursedRef.current = true;
            doSleep(false, true); // grandma protocol
            return;
          }
        }
      }
    }
    if (sparkleRef.current) {
      sparkleRef.current.t -= dt;
      if (sparkleRef.current.t <= 0) sparkleRef.current = null;
    }
    if (mineTextRef.current) {
      mineTextRef.current.t -= dt;
      if (mineTextRef.current.t <= 0) mineTextRef.current = null;
    }
    // sparkle bolts
    if (projectilesRef.current.length > 0) {
      const scene2 = sceneRef.current;
      projectilesRef.current = projectilesRef.current.filter(pr => {
        pr.t -= dt;
        if (pr.t <= 0) return false;
        pr.x += pr.dx * dt; pr.y += pr.dy * dt;
        const tx = Math.floor((pr.x + 4) / TILE), ty = Math.floor((pr.y + 4) / TILE);
        if (isSolid(scene2, tx, ty, new Set())) {
          sparkleRef.current = { x: pr.x - 4, y: pr.y - 4, t: 0.2 };
          return false;
        }
        const hitC = crawlersRef.current.find(c => Math.abs(c.x + 8 - (pr.x + 4)) < 10 && Math.abs(c.y + 8 - (pr.y + 4)) < 10);
        if (hitC) {
          hitC.hp -= 1;
          hitC.hurtT = 0.3;
          // knock the crawler back along the bolt's path
          hitC.x += Math.sign(pr.dx) * 10; hitC.y += Math.sign(pr.dy) * 10;
          sparkleRef.current = { x: hitC.x, y: hitC.y, t: 0.35 };
          if (hitC.hp <= 0) {
            crawlersRef.current = crawlersRef.current.filter(c => c !== hitC);
            award('slayer');
            sfxCatch();
            if (Math.random() < 0.6) {
              const m = MINERALS[Math.floor(Math.random() * MINERALS.length)];
              s.minerals[m.id] = (s.minerals[m.id] ?? 0) + 1;
              s.today.mineralsMined += 1;
              persistSave(s); refreshHud();
            }
          }
          return false;
        }
        return true;
      });
    }

    if (input.consumeInteract()) handleInteract();
    if (input.consumeInventory()) setOverlayBoth({ type: 'menu', tab: 'home' });
    input.consumeCancel();
  }, [advanceDialog, setOverlayBoth, showDialog, catchFish, enterScene, handleInteract, refreshHud, doSleep, finishSleep, closeEndDay]);

  // ---- render ------------------------------------------------------------------

  const render = useCallback((t: number) => {
    const ctx = canvasRef.current?.getContext('2d');
    const atlas = atlasRef.current;
    if (!ctx || !atlas) return;
    // Backing store is (scale·RR)× the 384×224 logical space: `scale` is the
    // crisp integer device-pixel multiple, RR is the supersample for hi-res art.
    // All draw code below stays in logical 16px-tile coords; the transform maps
    // it into the denser buffer (CSS scales the canvas back down — see fit()).
    ctx.setTransform(scaleRef.current * RR, 0, 0, scaleRef.current * RR, 0, 0);
    ctx.imageSmoothingEnabled = false;

    const scene = sceneRef.current;
    const cam = cameraFor(scene, posRef.current);
    ctx.fillStyle = '#0a0a0c';
    ctx.fillRect(0, 0, VIEW_PW, VIEW_PH);

    // tiles
    const size = sceneSize(scene);
    const tx0 = Math.max(0, Math.floor(cam.x / TILE)), ty0 = Math.max(0, Math.floor(cam.y / TILE));
    const tx1 = Math.min(size.x - 1, Math.ceil((cam.x + VIEW_PW) / TILE)), ty1 = Math.min(size.y - 1, Math.ceil((cam.y + VIEW_PH) / TILE));
    const waterAlt = Math.floor(t * 1.6) % 2 === 1;
    const danceAlt = Math.floor(t * 3.2) % 2 === 1;
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const def = scene.legend[scene.grid[ty][tx]];
        if (!def) continue;
        let key = def.sprite;
        if (key === 't-water-0' && waterAlt) key = 't-water-1';
        else if (key === 't-dance-0' && danceAlt) key = 't-dance-1';
        else if (key === 't-portal-0' && danceAlt) key = 't-portal-1';
        // scatter detail variants through large grass/sand fields
        else if ((key === 't-grass' || key === 't-sand') && (tx * 7 + ty * 13) % 5 === 0) key = `${key}-v1`;
        ctx.drawImage(atlas[key], tx * TILE - cam.x, ty * TILE - cam.y);
      }
    }

    // soft shadows where walls meet walkable ground (cheap ambient occlusion)
    ctx.fillStyle = 'rgba(0,0,0,0.22)';
    for (let ty = ty0; ty <= ty1; ty++) {
      for (let tx = tx0; tx <= tx1; tx++) {
        const def = scene.legend[scene.grid[ty][tx]];
        const above = ty > 0 ? scene.legend[scene.grid[ty - 1][tx]] : undefined;
        if (def && !def.solid && above?.solid) {
          ctx.fillRect(tx * TILE - cam.x, ty * TILE - cam.y, TILE, 4);
        }
      }
    }

    // painted store signs — kanji, neon blink, vertical Kabukicho banners.
    // Drawn once now (the daytime look); when night falls a second pass below
    // re-lights the neon ones over the tint so they glow instead of going dark.
    const signs = SCENE_SIGNS[scene.id];
    let relightSigns: ((amt: number) => void) | null = null;
    if (signs) {
      ctx.textBaseline = 'top';
      const neonOn = Math.floor(t * 1.3) % 4 !== 0; // long on, short off
      // Per-character font: kana/kanji paint in Naganoshi (a Japanese pixel font
      // that matches the bitmap look); Latin/digits/punctuation stay bold
      // monospace — Naganoshi has no Latin glyphs, so a whole-string switch would
      // render the English parts as tofu. measureRun/drawRun walk char by char.
      const jpRe = /[　-ヿ㐀-鿿＀-￯]/;
      const charFont = (ch: string, size: number) => jpRe.test(ch) ? `${size}px 'Naganoshi', sans-serif` : `bold ${size}px monospace`;
      const measureRun = (txt: string, size: number) => {
        let w = 0;
        for (const ch of txt) { ctx.font = charFont(ch, size); w += ctx.measureText(ch).width; }
        return w;
      };
      const drawRun = (txt: string, x: number, y: number, size: number) => {
        let cx = x;
        for (const ch of txt) { ctx.font = charFont(ch, size); ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width; }
      };
      // hex → "r,g,b" + luminance, to colour the neon bloom by the sign's
      // brightest swatch (the glowing tube, usually the text or border colour).
      const hex2rgb = (h: string): [number, number, number] => {
        let c = h.slice(1); if (c.length === 3) c = c.split('').map(x => x + x).join('');
        const n = parseInt(c, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      };
      const lum = (h: string) => { const [r, g, b] = hex2rgb(h); return r * 0.299 + g * 0.587 + b * 0.114; };
      // A sign reads as "lit" (back-lit neon) if it blinks, has a tube border,
      // or sits on a solid panel — plain wayfinding placards stay matte.
      const isLit = (sg: typeof signs[number]) => Boolean(sg.blink || sg.border || (sg.bg && sg.bg[0] === '#'));
      const glowRgb = (sg: typeof signs[number]) => {
        const cands = [sg.color, sg.border, sg.bg].filter((c): c is string => Boolean(c && c[0] === '#'));
        const best = cands.sort((a, b) => lum(b) - lum(a))[0] ?? sg.color;
        return hex2rgb(best).join(',');
      };
      const dims = (sg: typeof signs[number]) => {
        const size = sg.font ?? 6;
        if (sg.vertical) return { size, w: size + 5, h: [...sg.text].length * (size + 1) + 4 };
        return { size, w: Math.ceil(measureRun(sg.text, size)) + 5, h: size + 4 };
      };
      const paintText = (sg: typeof signs[number], sx: number, sy: number, size: number, color: string) => {
        ctx.fillStyle = color;
        if (sg.vertical) {
          [...sg.text].forEach((ch, i) => { ctx.font = charFont(ch, size); ctx.fillText(ch, sx, sy + i * (size + 1)); });
        } else {
          drawRun(sg.text, sx, sy, size);
        }
      };
      const paint = (sg: typeof signs[number]) => {
        const { size, w, h } = dims(sg);
        const sx = sg.x * TILE - cam.x, sy = sg.y * TILE - cam.y + 4;
        const color = sg.blink && !neonOn ? 'rgba(255,255,255,0.25)' : sg.color;
        ctx.fillStyle = sg.bg ?? 'rgba(0,0,0,0.45)';
        ctx.fillRect(sx - 2, sy - 2, w, h);
        if (sg.border) { ctx.strokeStyle = sg.border; ctx.lineWidth = 1; ctx.strokeRect(sx - 1.5, sy - 1.5, w - 1, h - 1); }
        paintText(sg, sx, sy, size, color);
      };
      for (const sign of signs) paint(sign);

      // Night re-light pass: for each lit sign, lay an additive bloom halo over
      // the darkened world, then repaint the panel + a brightened glyph so the
      // neon punches through. amt = night strength (0..1).
      relightSigns = (amt: number) => {
        for (const sg of signs) {
          if (!isLit(sg)) continue;
          const off = sg.blink && !neonOn; // mid-blink: stay dark
          const { w, h } = dims(sg);
          const sx = sg.x * TILE - cam.x, sy = sg.y * TILE - cam.y + 4;
          const cx = sx - 2 + w / 2, cy = sy - 2 + h / 2;
          if (!off) {
            const r = Math.max(w, h) * 0.85 + 9;
            // Cached glow sprite per sign — built once, then blitted. Rebuilding a
            // radial gradient every frame for every sign was the night FPS sink.
            let glow = signGlowRef.current.get(sg);
            if (!glow) {
              const gs = Math.ceil(r * 2);
              glow = document.createElement('canvas'); glow.width = gs; glow.height = gs;
              const gctx = glow.getContext('2d')!;
              const grd = gctx.createRadialGradient(gs / 2, gs / 2, 1, gs / 2, gs / 2, r);
              grd.addColorStop(0, `rgba(${glowRgb(sg)},1)`);
              grd.addColorStop(1, `rgba(${glowRgb(sg)},0)`);
              gctx.fillStyle = grd; gctx.fillRect(0, 0, gs, gs);
              signGlowRef.current.set(sg, glow);
            }
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.18 * amt; // softer bloom (was a heavy 0.36 + an extra additive text pass)
            ctx.drawImage(glow, cx - r, cy - r);
            ctx.restore();
          }
          // repaint the panel over the night tint so the sign isn't dimmed
          paint(sg);
        }
      };
    }

    // apartment furniture: whatever the player has placed, where they placed it
    if (scene.id === 'apartment') {
      const s = saveRef.current;
      if (!s.placed['bed']) {
        ctx.drawImage(atlas['f-futon'], 1 * TILE - cam.x, 1 * TILE - cam.y);
      }
      for (const itemId of Object.keys(s.placed)) {
        const pos = s.placed[itemId];
        ctx.drawImage(atlas[furnitureById(itemId).sprite], pos.x * TILE - cam.x, pos.y * TILE - cam.y);
      }
      if (gachaComplete(s)) {
        ctx.drawImage(atlas['f-maneki'], MANEKI_SLOT.x * TILE - cam.x, MANEKI_SLOT.y * TILE - cam.y);
      }
    }

    // the mines: ore nodes, crawlers, sparkle VFX
    if (scene.id === 'mines') {
      for (const node of oreNodesRef.current) {
        ctx.drawImage(atlas[`ore-${node.mineral.id}`], node.x * TILE - cam.x, node.y * TILE - cam.y);
      }
      const cFrame = Math.floor(t * 6) % 2;
      for (const c of crawlersRef.current) {
        if (c.hurtT > 0 && Math.floor(t * 20) % 2 === 0) continue; // hit flicker
        ctx.drawImage(atlas['m-shadow'], Math.round(c.x) - cam.x, Math.round(c.y) - cam.y + 2);
        ctx.drawImage(atlas[`crawler-${cFrame}`], Math.round(c.x) - cam.x, Math.round(c.y) - cam.y);
      }
      for (const pr of projectilesRef.current) {
        ctx.drawImage(atlas['m-sparkle'], Math.round(pr.x) - cam.x, Math.round(pr.y) - cam.y, 9, 9);
      }
    }
    if (sparkleRef.current) {
      ctx.drawImage(atlas['m-sparkle'], Math.round(sparkleRef.current.x) - cam.x, Math.round(sparkleRef.current.y) - cam.y + 2);
    }
    if (mineTextRef.current) {
      const mt = mineTextRef.current;
      const rise = (1.1 - mt.t) * 14;            // drifts upward as it fades
      ctx.save();
      ctx.globalAlpha = Math.max(0, Math.min(1, mt.t * 2.4));
      ctx.font = 'bold 7px monospace';
      ctx.textAlign = 'center';
      const tx = Math.round(mt.x) - cam.x + 8;
      const ty = Math.round(mt.y) - cam.y - Math.round(rise);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.9)';
      ctx.strokeText(mt.text, tx, ty);
      ctx.fillStyle = mt.color;
      ctx.fillText(mt.text, tx, ty);
      ctx.restore();
    }

    // vehicles in the world
    {
      const s = saveRef.current;
      if (s.carPos && s.carPos.scene === scene.id) {
        ctx.drawImage(atlas['v-car'], s.carPos.x * TILE - cam.x, s.carPos.y * TILE - cam.y);
      }
      const bob = Math.round(Math.sin(t * 1.5) * 1.5);
      if (scene.id === 'shore' && s.vehicles.includes('boat')) {
        ctx.drawImage(atlas['v-boat'], 2 * TILE - cam.x, 9 * TILE - cam.y + bob);
      }
      if (scene.id === 'island') {
        ctx.drawImage(atlas['v-boat'], 4 * TILE - cam.x, 7 * TILE - cam.y + bob);
      }
      if (scene.id === 'garage') { // showroom stock
        ctx.drawImage(atlas['v-car'], 2 * TILE - cam.x, 2 * TILE - cam.y);
        ctx.drawImage(atlas['v-boat'], 12 * TILE - cam.x, 3 * TILE - cam.y);
      }
    }

    // fishing bobber
    const fm = fishModeRef.current;
    if (fm) {
      const bx = fm.tile.x * TILE - cam.x + 6, by = fm.tile.y * TILE - cam.y + 5 + Math.round(Math.sin(t * 4) * 1.5);
      ctx.drawImage(atlas['m-bobber'], bx, by);
      if (fm.phase === 'bite') ctx.drawImage(atlas['m-bang'], bx - 1, by - 9);
    }

    // entities, y-sorted
    const ents: { y: number; draw: () => void }[] = [];
    for (const npc of scene.npcs) {
      if (npc.id === 'yakuza' && saveRef.current.gangPaid) continue; // paid off — gone
      if (WANDER_IDS.has(npc.id)) continue; // wanderers are drawn from their live positions below
      if (NIGHT_EVEN_IDS.has(npc.id) && !davidActive(saveRef.current)) continue; // David only on even nights
      ents.push({
        y: npc.y * TILE,
        draw: () => {
          if (npc.id === 'campfire') { ctx.drawImage(atlas['prop-campfire'], npc.x * TILE - cam.x, npc.y * TILE - cam.y); return; }
          ctx.drawImage(atlas['m-shadow'], npc.x * TILE - cam.x, npc.y * TILE - cam.y + 2);
          ctx.drawImage(atlas[`${npc.sprite}-${npc.dir}-0`], npc.x * TILE - cam.x, npc.y * TILE - cam.y);
        },
      });
    }
    for (const w of wanderersRef.current) {
      ents.push({
        y: w.y,
        draw: () => {
          ctx.drawImage(atlas['m-shadow'], Math.round(w.x) - cam.x, Math.round(w.y) - cam.y + 2);
          const frame = w.moving ? (Math.floor(animRef.current * 7) % 2) : 0;
          ctx.drawImage(atlas[`${w.sprite}-${w.dir}-${frame}`], Math.round(w.x) - cam.x, Math.round(w.y) - cam.y);
        },
      });
    }
    const p = posRef.current;
    const moving = movingRef.current;
    // In-code 16px player art (buildAtlas). True 4-direction (up/down/left art,
    // right = mirrored left) with a 2-frame walk bob. 'masc' vibe = 'player',
    // 'fem' vibe = 'player-fem'; '-hat' variants when a hat is on.
    const vibe = saveRef.current.vibe ?? 'fem';
    const pcBase = vibe === 'fem' ? 'player-fem' : 'player';
    ents.push({
      y: p.y,
      draw: () => {
        if (sceneRef.current.id === 'deepsea') {
          const bob2 = Math.round(Math.sin(t * 2.2) * 1.5);
          ctx.drawImage(atlas['v-boat'], Math.round(p.x) - cam.x - 8, Math.round(p.y) - cam.y + bob2);
          return;
        }
        if (saveRef.current.driving) {
          ctx.drawImage(atlas['m-shadow'], Math.round(p.x) - cam.x - 8, Math.round(p.y) - cam.y + 2);
          ctx.drawImage(atlas['m-shadow'], Math.round(p.x) - cam.x + 8, Math.round(p.y) - cam.y + 2);
          ctx.drawImage(atlas['v-car'], Math.round(p.x) - cam.x - 8, Math.round(p.y) - cam.y);
          return;
        }
        ctx.drawImage(atlas['m-shadow'], Math.round(p.x) - cam.x, Math.round(p.y) - cam.y + 2);
        const frame = moving ? (Math.floor(animRef.current * 7) % 2) : 0;
        const playerKey = saveRef.current.hat ? `${pcBase}-hat` : pcBase;
        ctx.drawImage(atlas[`${playerKey}-${dirRef.current}-${frame}`], Math.round(p.x) - cam.x, Math.round(p.y) - cam.y);
      },
    });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.draw());

    // Arrange mode: dim the room, light up placeable floor, draw the drag ghost.
    if (arrangeRef.current && scene.id === 'apartment') {
      ctx.fillStyle = 'rgba(8, 10, 24, 0.45)';
      ctx.fillRect(0, 0, VIEW_PW, VIEW_PH);
      const held = heldRef.current;
      // grid + valid-cell wash over the interior floor (y 1..8, x 1..14)
      ctx.lineWidth = 1;
      for (let ty = 0; ty <= 8; ty++) {
        for (let tx = 1; tx <= 14; tx++) {
          const ok = held ? placeableAt(held.id, tx, ty) : (tileAt(scene, tx, ty) && !tileAt(scene, tx, ty)!.solid && ty >= 1);
          if (ty === 0 && (!held || itemKind(held.id) !== 'wall')) continue;
          const px = tx * TILE - cam.x, py = ty * TILE - cam.y;
          ctx.fillStyle = ok ? 'rgba(124, 232, 160, 0.14)' : 'rgba(255,255,255,0.03)';
          ctx.fillRect(px, py, TILE, TILE);
          ctx.strokeStyle = 'rgba(255,255,255,0.10)';
          ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
        }
      }
      // ghost sprite at the hovered tile
      const g = ghostRef.current;
      if (held && g) {
        const spr = atlas[furnitureById(held.id).sprite];
        const gx = g.tx * TILE - cam.x, gy = g.ty * TILE - cam.y;
        ctx.globalAlpha = 0.75;
        if (spr) ctx.drawImage(spr, gx, gy);
        ctx.globalAlpha = 1;
        const w = itemFootprintW(held.id) * TILE;
        ctx.strokeStyle = g.valid ? '#7ce8a0' : '#e0552e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(gx + 0.5, gy + 0.5, w - 1, TILE - 1);
      }
    }

    // time-of-day wash: cool night fall, warm golden morning. Interiors keep
    // their own lights, so they barely shift; the street takes the full swing.
    {
      const s = saveRef.current;
      const night = nightT(s);
      const morn = morningT(s);
      const sceneFactor = scene.outdoor ? 1 : (scene.id === 'nightclub' || scene.id === 'backrooms' ? 0 : 0.36);
      if (night > 0) {
        // Two-layer dusk: a deep blue body + a fainter cyan top band so the sky
        // half of the frame reads cooler/darker than the lit street.
        const alpha = night * (scene.outdoor ? 0.5 : 0.16);
        if (alpha > 0) {
          ctx.fillStyle = `rgba(10, 16, 42, ${alpha})`;
          ctx.fillRect(0, 0, VIEW_PW, VIEW_PH);
          if (scene.outdoor) {
            const sky = ctx.createLinearGradient(0, 0, 0, VIEW_PH);
            sky.addColorStop(0, `rgba(6, 10, 30, ${0.28 * night})`);
            sky.addColorStop(0.55, 'rgba(6, 10, 30, 0)');
            ctx.fillStyle = sky;
            ctx.fillRect(0, 0, VIEW_PW, VIEW_PH);
          }
        }
        // re-light the neon over the darkness
        if (relightSigns && sceneFactor > 0) relightSigns(night * Math.min(1, sceneFactor + 0.4));
      } else if (morn > 0 && scene.outdoor) {
        // Low golden sun: warm multiply-ish wash + a brighter band raking in
        // from the upper-left, fading by mid-morning.
        ctx.save();
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = `rgba(255, 176, 92, ${0.55 * morn})`;
        ctx.fillRect(0, 0, VIEW_PW, VIEW_PH);
        ctx.restore();
        const sun = ctx.createLinearGradient(0, 0, VIEW_PW, VIEW_PH);
        sun.addColorStop(0, `rgba(255, 214, 140, ${0.22 * morn})`);
        sun.addColorStop(0.5, 'rgba(255, 214, 140, 0)');
        ctx.fillStyle = sun;
        ctx.fillRect(0, 0, VIEW_PW, VIEW_PH);
      }
    }

    // Mines: claustrophobic dark — you only see a few tiles around you (the wand
    // lights a little further). Makes the crawlers genuinely scary.
    if (scene.id === 'mines') {
      const pcx = Math.round(p.x) - cam.x + 8, pcy = Math.round(p.y) - cam.y + 8;
      const lr = saveRef.current.wand ? 104 : 70;
      const flick = 1 + Math.sin(t * 11) * 0.03; // faint lantern flicker
      const dark = ctx.createRadialGradient(pcx, pcy, lr * 0.34, pcx, pcy, lr * flick);
      dark.addColorStop(0, 'rgba(6,6,10,0)');
      dark.addColorStop(0.7, 'rgba(6,6,10,0.55)');
      dark.addColorStop(1, 'rgba(3,3,7,0.95)');
      ctx.fillStyle = dark;
      ctx.fillRect(0, 0, VIEW_PW, VIEW_PH);
    }

    // interact prompt
    if (!overlayRef.current && !fm) {
      const faced = facedTile(p, dirRef.current);
      const feet = feetTile(p);
      const npcT = wanderersRef.current.some(w => Math.round(w.x / TILE) === faced.x && Math.round(w.y / TILE) === faced.y)
        || scene.npcs.find(n => n.x === faced.x && n.y === faced.y && !WANDER_IDS.has(n.id)
          && !(NIGHT_EVEN_IDS.has(n.id) && !davidActive(saveRef.current)));
      const hit = (it: Interactable, tt: Vec) =>
        tt.x >= it.x && tt.x < it.x + (it.w ?? 1) && tt.y >= it.y && tt.y < it.y + (it.h ?? 1);
      const it = scene.interactables.find(i => hit(i, faced) || hit(i, feet));
      let label = npcT ? 'Talk' : it?.label;
      const sv = saveRef.current;
      if (sv.driving) label = 'Park here';
      else if (sv.carPos && sv.carPos.scene === scene.id) {
        const onCar = (tt: Vec) => tt.y === sv.carPos!.y && (tt.x === sv.carPos!.x || tt.x === sv.carPos!.x + 1);
        if (onCar(faced) || onCar(feet)) label = 'Drive';
      }
      if (it?.id === 'boat' && !sv.vehicles.includes('boat')) label = 'Fish';
      if (scene.id === 'mines' && sv.wand && !label) label = 'Sparkle!';
      if (!sv.canFish && (label === 'Fish' || label === 'Drop a line')) label = 'Fish? (ask Genji)';
      if (scene.id === 'deepsea' && !label) label = (feet.y >= 10 || faced.y >= 11) ? 'Sail south to go home' : 'Drop a line';
      // the freezer keeps its secret until you've been through once
      if (it?.id === 'portal' && !saveRef.current.storySeen.includes('backrooms-intro')) label = npcT ? 'Talk' : undefined;
      // the Paris seam looks like a blank wall until The Manager reveals it
      if (it?.id === 'paris-portal' && !saveRef.current.parisRevealed) label = npcT ? 'Talk' : undefined;
      if (scene.id === 'mines') {
        const node = oreNodesRef.current.find(n => n.x === faced.x && n.y === faced.y);
        if (node) label = `Mine ${node.mineral.name}`;
        else {
          const cr = crawlersRef.current.find(c => {
            const ct = feetTile({ x: c.x, y: c.y });
            return ct.x === faced.x && ct.y === faced.y;
          });
          if (cr) label = saveRef.current.wand ? 'Sparkle!' : 'Shoo...?';
        }
      }
      if (scene.id === 'apartment') {
        const s = saveRef.current;
        const bed = s.placed['bed'];
        const r = bed ? { x: bed.x, y: bed.y, w: 2, h: 1 } : { x: 1, y: 1, w: 2, h: 1 };
        const inRect = (tt: Vec) => tt.x >= r.x && tt.x < r.x + r.w && tt.y >= r.y && tt.y < r.y + r.h;
        if (inRect(faced) || inRect(feet)) label = 'Sleep';
      }
      if (label) {
        ctx.font = 'bold 6px monospace';
        const text = `[E] ${label}`;
        const w = text.length * 4 + 4;
        const lx = Math.min(VIEW_PW - w - 2, Math.max(2, Math.round(p.x) - cam.x + 8 - w / 2));
        const ly = Math.max(2, Math.round(p.y) - cam.y - 10);
        ctx.fillStyle = 'rgba(10,10,12,0.8)';
        ctx.fillRect(lx, ly, w, 9);
        ctx.fillStyle = '#ffd24a';
        ctx.fillText(text, lx + 2, ly + 2);
      }
    }

    // fishing reel UI
    if (fm && fm.phase === 'reel') {
      const barX = VIEW_PW - 26, barY = 12, barH = VIEW_PH - 36, barW = 8;
      ctx.fillStyle = 'rgba(10,10,12,0.85)';
      ctx.fillRect(barX - 14, barY - 6, 36, barH + 22);
      ctx.fillStyle = '#1d2430';
      ctx.fillRect(barX, barY, barW, barH);
      // catch zone (zonePos is the bottom edge in 0..1, bar is drawn top-down)
      const zoneTopPx = barY + (1 - (fm.st.zonePos + ZONE_H)) * barH;
      ctx.fillStyle = '#3da26b';
      ctx.fillRect(barX, zoneTopPx, barW, ZONE_H * barH);
      // fish marker
      const fy = barY + (1 - fm.st.fishPos) * barH - 3;
      ctx.drawImage(atlas[fm.st.fish.sprite], barX - 12, fy, 12, 6);
      // progress
      const progH = Math.round(fm.st.progress * barH);
      ctx.fillStyle = '#2a3340';
      ctx.fillRect(barX + barW + 3, barY, 4, barH);
      ctx.fillStyle = fm.st.progress > 0.6 ? '#ffd24a' : '#c97a4a';
      ctx.fillRect(barX + barW + 3, barY + (barH - progH), 4, progH);
      ctx.font = 'bold 6px monospace';
      ctx.fillStyle = '#e8e0d0';
      ctx.fillText('HOLD E', barX - 12, barY + barH + 9);
    } else if (fm) {
      ctx.font = 'bold 6px monospace';
      ctx.fillStyle = 'rgba(10,10,12,0.8)';
      const msg = fm.phase === 'wait' ? 'waiting for a bite...' : 'BITE! PRESS E!';
      ctx.fillRect(VIEW_PW / 2 - msg.length * 2 - 3, 8, msg.length * 4 + 6, 10);
      ctx.fillStyle = fm.phase === 'bite' ? '#ffd24a' : '#9fc4e8';
      ctx.fillText(msg, VIEW_PW / 2 - msg.length * 2, 10);
    }
  }, []);

  // ---- lifecycle --------------------------------------------------------------

  const begin = useCallback((fresh: boolean) => {
    const s = fresh ? newSave() : (loadSave() ?? newSave());
    if (fresh) { s.vibe = pendingVibeRef.current; s.name = pendingNameRef.current; } // apply the new-game pick
    saveRef.current = s;
    sceneRef.current = SCENES[s.scene] ?? SCENES.apartment;
    wanderersRef.current = makeWanderers(sceneRef.current);
    posRef.current = { x: s.px, y: s.py };
    dirRef.current = s.dir;
    pendingBeatsRef.current = [];
    fishModeRef.current = null;
    setOverlayBoth(null);
    if (!s.visited.includes(s.scene)) s.visited.push(s.scene);
    if (s.scene === 'mines') {
      const layout = mineLayoutFor(s);
      oreNodesRef.current = layout.ore;
      crawlersRef.current = layout.crawlers.map(c => ({
        x: c.x * TILE, y: c.y * TILE - 4, hp: 2, stepT: Math.random(), hurtT: 0, dir: 'down' as Dir,
      }));
    } else {
      crawlersRef.current = [];
    }
    computeSolids();
    checkStory(); // queues the day-one journal entry on a fresh save
    syncMessages(s); // seed the welcome texts / any already-earned threads
    persistSave(s);
    refreshHud();
    setScreen('playing');
    // Start music here — the New Game / Continue click is the user gesture
    // browsers require before audio can play.
    playMusicFor(s.scene);
  }, [computeSolids, checkStory, refreshHud, setOverlayBoth, playMusicFor]);

  // Title → game with a cover transition (the "game has started" moment).
  const startGame = useCallback((fresh: boolean) => {
    sfxGameStart();
    setManageOpen(false);
    runTransition('start', () => begin(fresh), 600, 1400);
  }, [begin, runTransition]);

  // New-game "what's your vibe?" pick → start with that appearance + name.
  // Picker click only SELECTS a model (highlights it) — the player still presses START.
  const chooseVibe = useCallback((v: Vibe) => {
    pendingVibeRef.current = v;
    setPickedVibe(v);
  }, []);

  // START button on the picker: lock in the highlighted model + name, then begin.
  const startWithVibe = useCallback(() => {
    pendingVibeRef.current = pickedVibe;
    pendingNameRef.current = pcName.trim() || 'Neighbor';
    setVibePick(false);
    startGame(true);
  }, [pickedVibe, pcName, startGame]);

  const toggleMusic = useCallback(() => {
    setMusicMuted(prev => {
      const next = !prev;
      try { localStorage.setItem(MUSIC_MUTE_KEY, next ? '1' : '0'); } catch { /* private mode */ }
      tracksRef.current.forEach(a => { a.muted = next; });
      return next;
    });
  }, []);

  // Wipe the save from the management panel (guarded by a confirm step).
  const wipeSave = useCallback(() => {
    clearSave();
    setConfirmMode(null);
    setManageOpen(false);
    setSaveTick(t => t + 1);
  }, []);

  const toggleFullscreen = useCallback(() => {
    // iOS can't fullscreen an element — show the home-screen guide instead.
    if (!fsSupported) { setFsGuideOpen(true); return; }
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      rootRef.current?.requestFullscreen().catch(() => {});
    }
  }, [fsSupported]);

  // Desktop app only: close the Tauri window. Dependency-free (the game stays
  // React-only) — call the core window plugin through the injected internals.
  const quitDesktopApp = useCallback(() => {
    const internals = (window as unknown as {
      __TAURI_INTERNALS__?: { invoke?: (cmd: string, args?: unknown) => Promise<unknown> };
    }).__TAURI_INTERNALS__;
    internals?.invoke?.('plugin:window|close', { label: 'main' }).catch(() => {});
  }, []);

  // One tap: go fullscreen, then try to lock landscape (Android Chrome only).
  const goFullscreenLandscape = useCallback(async () => {
    if (!fsSupported) { setFsGuideOpen(true); return; }
    try { if (!document.fullscreenElement) await rootRef.current?.requestFullscreen(); } catch { /* denied */ }
    try {
      const orient = (screen as unknown as { orientation?: { lock?: (o: string) => Promise<void> } }).orientation;
      await orient?.lock?.('landscape');
    } catch { /* lock unsupported / not allowed */ }
  }, [fsSupported]);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  // Track portrait/landscape so we can nudge phone players to rotate.
  useEffect(() => {
    const mq = window.matchMedia('(orientation: portrait)');
    const onChange = () => setIsPortrait(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Stop all music when the game unmounts (navigating away from the page)
  useEffect(() => () => {
    fadeTimersRef.current.forEach(id => window.clearInterval(id));
    fadeTimersRef.current.clear();
    tracksRef.current.forEach(a => a.pause());
    tracksRef.current.clear();
    currentTrackRef.current = null;
    transTimers.current.forEach(id => window.clearTimeout(id));
    transTimers.current = [];
  }, []);

  // Title-screen theme. Autoplay is usually blocked until a user gesture, so
  // try immediately and also arm a one-shot listener for the first input.
  useEffect(() => {
    if (screen !== 'title') return;
    playMusicFor('title');
    const kick = () => playMusicFor('title');
    window.addEventListener('pointerdown', kick, { once: true });
    window.addEventListener('keydown', kick, { once: true });
    return () => {
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('keydown', kick);
    };
  }, [screen, playMusicFor]);

  // The saved game (or null), re-read whenever a new game starts or it's wiped.
  const saved = useMemo(() => loadSave(), [saveTick]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fit the canvas at an integer device-pixel scale. Fractional scales blur the
  // art on Retina even with image-rendering: pixelated.
  //   AUTO  → biggest integer scale that fits the frame (the layout box).
  //   N×    → forced scale N, clamped so it can't exceed the screen. In windowed
  //           web the box is capped at 1000px, so a forced scale is clamped to
  //           the *viewport* (not the box) and `boxW` grows the box to match —
  //           otherwise every scale above 2× would clamp to the box and look
  //           identical. In the filled (fullscreen/native) layout the frame already
  //           is the viewport, so it's the cap there.
  const filled = isFullscreen || isDesktopApp;
  useEffect(() => {
    const fit = () => {
      const canvas = canvasRef.current, frame = frameRef.current;
      if (!canvas || !frame) return;
      const dpr = window.devicePixelRatio || 1;
      const frameMax = Math.max(1, Math.floor(Math.min(
        (frame.clientWidth * dpr) / VIEW_PW,
        (frame.clientHeight * dpr) / VIEW_PH,
      )));
      let scale;
      if (scalePref === 'auto') {
        scale = frameMax;
      } else if (filled) {
        scale = Math.max(1, Math.min(scalePref, frameMax));
      } else {
        // Windowed: clamp the forced scale to the viewport (minus a little for the
        // HUD row), independent of the 1000px box, so 2×–6× actually differ.
        const viewMax = Math.max(1, Math.floor(Math.min(
          (window.innerWidth * dpr) / VIEW_PW,
          ((window.innerHeight - 72) * dpr) / VIEW_PH,
        )));
        scale = Math.max(1, Math.min(scalePref, viewMax));
      }
      // Backing store is RR× denser than the displayed size (supersampling): the
      // canvas element is scale·RR× the logical buffer in device px, but CSS sizes
      // it to scale× — the browser downsamples, so hi-res art stays sharp while
      // on-screen size/FOV are unchanged.
      if (canvas.width !== VIEW_PW * scale * RR) {
        canvas.width = VIEW_PW * scale * RR;
        canvas.height = VIEW_PH * scale * RR;
      }
      const cssW = (VIEW_PW * scale) / dpr;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${(VIEW_PH * scale) / dpr}px`;
      scaleRef.current = scale;
      // Windowed + forced: only *grow* the box past the 1000px cap (so a large
      // scale isn't clipped). Smaller scales just center the canvas in the
      // default box — shrinking the box would crowd the HUD row.
      setBoxW(!filled && scalePref !== 'auto' && cssW > 1000 ? cssW : null);
    };
    fit();
    const ro = new ResizeObserver(fit);
    if (frameRef.current) ro.observe(frameRef.current);
    window.addEventListener('resize', fit); // catches devicePixelRatio changes too
    return () => { ro.disconnect(); window.removeEventListener('resize', fit); };
  }, [scalePref, filled]);

  // Playtest hook — only when the URL carries ?debug. Exposes a read-only
  // snapshot of live game state on window.__lab for the Playwright harness
  // (scripts/playtest.mjs). Gated by the flag so it never exists in normal play.
  // Dependency-free (just a window global) — keeps src/game/ React-only.
  useEffect(() => {
    if (typeof window === 'undefined' || !/[?&]debug\b/.test(window.location.search)) return;
    (window as unknown as { __lab: unknown }).__lab = {
      snapshot: () => ({
        screen,
        scene: sceneRef.current.id,
        pos: { x: Math.round(posRef.current.x), y: Math.round(posRef.current.y) },
        tile: { x: Math.floor((posRef.current.x + 4) / TILE), y: Math.floor((posRef.current.y + 4) / TILE) },
        dir: dirRef.current,
        moving: movingRef.current,
        overlay: overlayRef.current?.type ?? null,
        // Compact, serializable view of the open overlay's contents — lets the
        // playtest harness read on-screen text/options without a screenshot.
        overlayData: (() => {
          const ov = overlayRef.current;
          if (!ov) return null;
          switch (ov.type) {
            case 'dialog':
              return { speaker: ov.speaker ?? null, line: ov.lines[ov.idx] ?? null, idx: ov.idx, total: ov.lines.length };
            case 'shop': return { shop: ov.shop };
            case 'menu': return { tab: ov.tab, thread: ov.thread ?? null, unread: unreadCount(saveRef.current) };
            case 'letter': return { beat: ov.beat?.id ?? null };
            case 'sleep': return { day: ov.day, collapsed: !!ov.collapsed };
            default: return null;
          }
        })(),
        scale: scaleRef.current,
        money: saveRef.current.money,
        day: saveRef.current.day,
        energy: saveRef.current.energy,
        timeMin: saveRef.current.timeMin,
        save: saveRef.current,
      }),
    };
  });

  useEffect(() => {
    if (screen !== 'playing') return;
    if (!atlasRef.current) { atlasRef.current = buildAtlas(); }
    // Canvas text doesn't trigger a webfont fetch on its own — kick the load so
    // the kanji/kana signs render in Naganoshi. The render loop redraws every
    // frame, so it swaps in as soon as the face is ready.
    document.fonts?.load("16px 'Naganoshi'");
    const input = inputRef.current;
    window.addEventListener('keydown', input.onKeyDown);
    window.addEventListener('keyup', input.onKeyUp);
    const stop = startLoop(update, render);
    return () => {
      stop();
      window.removeEventListener('keydown', input.onKeyDown);
      window.removeEventListener('keyup', input.onKeyUp);
      input.clear();
      if (sleepTimerRef.current) window.clearTimeout(sleepTimerRef.current);
      // persist the latest position on the way out
      const s = saveRef.current;
      s.px = posRef.current.x; s.py = posRef.current.y; s.dir = dirRef.current; s.scene = sceneRef.current.id;
      persistSave(s);
    };
  }, [screen, update, render]);

  // ---- casino game actions --------------------------------------------------

  const setBjBet = (bet: number) => {
    const bj = casinoRef.current.bj;
    if (bj.phase !== 'bet') return;
    bj.bet = bet;
    setShopTick(v => v + 1);
  };
  const resolveBlackjack = () => {
    const s = saveRef.current;
    const bj = casinoRef.current.bj;
    const pv = handValue(bj.player), dv = handValue(bj.dealer);
    const pBJ = isBlackjack(bj.player), dBJ = isBlackjack(bj.dealer);
    bj.hideHole = false;
    let payout = 0;
    if (pBJ && !dBJ) { bj.result = 'blackjack'; payout = Math.floor(bj.bet * 2.5); } // 3:2
    else if (pv > 21) { bj.result = 'lose'; }
    else if (dv > 21) { bj.result = 'win'; payout = bj.bet * 2; }
    else if (pv > dv) { bj.result = 'win'; payout = bj.bet * 2; }
    else if (pv < dv) { bj.result = 'lose'; }
    else { bj.result = 'push'; payout = bj.bet; } // includes BJ vs BJ
    bj.payout = payout;
    bj.phase = 'done';
    if (payout > 0) { s.money += payout; sfxCoin(); }
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };
  const dealBlackjack = () => {
    const s = saveRef.current;
    const bj = casinoRef.current.bj;
    if (bj.phase !== 'bet' || bj.bet <= 0 || s.money < bj.bet) return;
    s.money -= bj.bet; sfxBuy();
    bj.deck = makeDeck();
    bj.player = [bj.deck.pop()!, bj.deck.pop()!];
    bj.dealer = [bj.deck.pop()!, bj.deck.pop()!];
    bj.hideHole = true; bj.result = ''; bj.payout = 0; bj.phase = 'player';
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
    if (isBlackjack(bj.player) || isBlackjack(bj.dealer)) resolveBlackjack(); // naturals resolve at once
  };
  const hitBlackjack = () => {
    const bj = casinoRef.current.bj;
    if (bj.phase !== 'player') return;
    bj.player.push(bj.deck.pop()!);
    if (handValue(bj.player) >= 21) {
      while (handValue(bj.dealer) < 17) bj.dealer.push(bj.deck.pop()!);
      resolveBlackjack();
    } else { setShopTick(v => v + 1); }
  };
  const standBlackjack = () => {
    const bj = casinoRef.current.bj;
    if (bj.phase !== 'player') return;
    while (handValue(bj.dealer) < 17) bj.dealer.push(bj.deck.pop()!);
    resolveBlackjack();
  };

  const setSlotBet = (bet: number) => {
    const slot = casinoRef.current.slot;
    if (slot.phase === 'spin') return;
    slot.bet = bet;
    setShopTick(v => v + 1);
  };
  const spinSlots = () => {
    const s = saveRef.current;
    const slot = casinoRef.current.slot;
    if (slot.phase === 'spin' || slot.bet <= 0 || s.money < slot.bet) return;
    s.money -= slot.bet; sfxBuy();
    slot.phase = 'spin'; slot.win = 0;
    slot.final = [pickSlot(), pickSlot(), pickSlot()];
    slot.stopped = [false, false, false];
    persistSave(s); refreshHud();
    const start = performance.now();
    const stopAt = [550, 850, 1150];
    if (slot.timer != null) window.clearInterval(slot.timer);
    slot.timer = window.setInterval(() => {
      const el = performance.now() - start;
      for (let i = 0; i < 3; i++) {
        if (slot.stopped[i]) continue;
        if (el >= stopAt[i]) { slot.stopped[i] = true; slot.reels[i] = slot.final[i]; }
        else slot.reels[i] = Math.floor(Math.random() * SLOT_SYMBOLS.length);
      }
      setShopTick(v => v + 1);
      if (slot.stopped[2]) {
        if (slot.timer != null) window.clearInterval(slot.timer);
        slot.timer = null;
        slot.phase = 'done';
        const win = slotPayout(slot.final, slot.bet);
        slot.win = win;
        if (win > 0) { const s2 = saveRef.current; s2.money += win; sfxCoin(); persistSave(s2); refreshHud(); }
        setShopTick(v => v + 1);
      }
    }, 80);
  };

  // ---- shop actions ---------------------------------------------------------

  const buyAtPrice = (itemId: string, price: number) => {
    const s = saveRef.current;
    if (!buyFurniture(s, itemId, price)) return;
    sfxBuy();
    computeSolids();
    checkStory();
    persistSave(s);
    refreshHud();
    setShopTick(v => v + 1);
  };

  const buyVehicle = (vehicleId: string) => {
    const s = saveRef.current;
    const v = vehicleById(vehicleId);
    if (s.vehicles.includes(vehicleId) || s.money < v.price) return;
    s.money -= v.price;
    s.vehicles.push(vehicleId);
    if (vehicleId === 'car') s.carPos = { scene: 'badtown', x: 17, y: 3 };
    sfxBuy();
    award(vehicleId === 'car' ? 'wheels' : 'captain');
    computeSolids();
    persistSave(s);
    refreshHud();
    setShopTick(v2 => v2 + 1);
    setOverlayBoth(null);
    showDialog(
      vehicleId === 'car'
        ? ['Kojima slides the keys across the counter. "Treat her right."', 'She is parked out front. Walk up, press E, and drive. Press E again anywhere outdoors to park.']
        : ['"She is moored down at the shore," Kojima says. "Deep water, and if you trust the hull — there is an island out there."'],
      'Kojima',
    );
  };

  const towCar = () => {
    const s = saveRef.current;
    if (!s.vehicles.includes('car') || s.money < 500) return;
    s.money -= 500;
    s.carPos = { scene: 'badtown', x: 17, y: 3 };
    s.driving = false;
    sfxCoin();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
    setOverlayBoth(null);
    showDialog(['Kojima makes one phone call, in a dialect of grunts.', 'Twenty minutes later the kei car is parked out front, looking sheepish. "Stop losing her," he does not say, loudly.'], 'Kojima');
  };

  const buySketchyDeal = (itemId: string, price: number) => {
    const s = saveRef.current;
    if (s.sketchyDay === s.day || s.money < price || s.owned.includes(itemId)) return;
    s.money -= price;
    s.sketchyDay = s.day;
    const broke = Math.random() < SKETCHY_BREAK_CHANCE;
    if (!broke) {
      s.owned.push(itemId);
      sfxBuy();
      award('bargain');
      computeSolids();
      checkStory();
    } else {
      sfxMiss();
      award('scammed');
    }
    persistSave(s);
    refreshHud();
    setShopTick(v => v + 1);
    setOverlayBoth(null);
    const name = furnitureById(itemId).name;
    showDialog(
      broke
        ? [`Halfway home, the ${name} makes a sound furniture should not make.`, 'By your door it is mostly tape and regret. It was never real. Jimmy is, somehow, already gone.', `(−¥${price.toLocaleString()}, nothing gained. The street always wins eventually.)`]
        : [`Against all odds, the ${name} survives the trip home. It is real. It works.`, `Jimmy's voice echoes: "TOLD you. Quality. Tell your friends. Don't tell the cops."`],
    );
  };

  const buyWand = () => {
    const s = saveRef.current;
    if (s.wand || s.money < WAND_PRICE) return;
    s.money -= WAND_PRICE;
    s.wand = true;
    sfxBuy();
    award('wand');
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  const craftRare = (itemId: string) => {
    const s = saveRef.current;
    const recipe = CRAFT_RECIPES[itemId];
    if (!recipe || s.rares.includes(itemId)) return;
    if (!Object.entries(recipe).every(([m, n]) => (s.minerals[m] ?? 0) >= n)) return;
    for (const [m, n] of Object.entries(recipe)) s.minerals[m] -= n;
    s.rares.push(itemId);
    s.today.newFurniture.push(itemId);
    sfxBuy();
    award('crafted');
    award('rare-one');
    computeSolids();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  const sellMinerals = () => {
    const s = saveRef.current;
    const total = MINERALS.reduce((sum, m) => sum + (s.minerals[m.id] ?? 0) * m.value, 0);
    if (total === 0) return;
    s.money += total;
    s.minerals = {};
    sfxCoin();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  const buyTikiDrink = () => {
    const s = saveRef.current;
    if (s.money < 800 || s.energy >= maxEnergy(s)) return;
    s.money -= 800;
    s.energy = Math.min(maxEnergy(s), s.energy + 25);
    sfxCoin();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  const sellCoconuts = () => {
    const s = saveRef.current;
    if (s.coconuts === 0) return;
    s.money += s.coconuts * 120;
    s.coconuts = 0;
    sfxCoin();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  const requestTrack = (sceneId: string) => {
    djPickRef.current = sceneId === 'nightclub' ? null : sceneId;
    playMusicFor('nightclub');
    sfxCoin();
    setShopTick(v => v + 1);
  };

  const buyHat = () => {
    const s = saveRef.current;
    if (s.hat || s.money < 6700) return;
    s.money -= 6700;
    s.hat = true;
    sfxBuy();
    award('hat');
    persistSave(s);
    refreshHud();
    setShopTick(v => v + 1);
    setOverlayBoth(null);
    showDialog(
      ['"Sixty-seven dollars," Tex says, accepting your yen without counting it.', 'The hat settles onto your head like it was always meant to be there. Yee-haw, quietly.'],
      'Tex',
    );
  };

  const buyFood = (foodId: string) => {
    const s = saveRef.current;
    const food = KONBINI_FOOD.find(f => f.id === foodId)!;
    if (s.money < food.price || s.energy >= maxEnergy(s)) return;
    s.money -= food.price;
    s.energy = Math.min(maxEnergy(s), s.energy + food.energy);
    sfxCoin();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  const sellAllFish = () => {
    const s = saveRef.current;
    if (s.fishInv.length === 0) return;
    const total = s.fishInv.reduce((sum, id) => sum + fishById(id).value, 0);
    s.money += total;
    s.fishInv = [];
    sfxCoin();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  const workShift = () => {
    const s = saveRef.current;
    const cost = energyCost(s, SHIFT_COST);
    if (s.shiftDay === s.day || s.energy < cost) return;
    s.energy -= cost;
    s.money += SHIFT_PAY;
    s.shiftDay = s.day;
    s.shiftsWorked += 1;
    s.today.shifts += 1;
    if (s.shiftsWorked >= 5) award('shift-5');
    sfxCoin();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
    setOverlayBoth(null);
    showDialog([`You stock shelves and work the register for a few hours. (+¥${SHIFT_PAY})`]);
  };

  // Pay off the yakuza: they stay put while the screen blacks out, then they're
  // gone when it fades back. (gangPaid set during the black.)
  const payYakuza = () => {
    const s = saveRef.current;
    if (s.gangPaid || s.money < 5000) return;
    s.money -= 5000;
    sfxCoin();
    persistSave(s); refreshHud();
    setOverlayBoth(null);
    runTransition('fade', () => {
      s.gangPaid = true;
      computeSolids();
      persistSave(s); refreshHud();
    }, 550, 1100);
  };

  // Buy a konbini lottery ticket (one in play at a time); resolves next morning.
  const buyLottery = () => {
    const s = saveRef.current;
    if (s.day < 3 || s.lotteryDay !== 0 || s.money < 500) return;
    s.money -= 500;
    s.lotteryDay = s.day;
    sfxCoin();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  const finishEnding = () => {
    const s = saveRef.current;
    s.ended = true;
    persistSave(s);
    award('furnished');
    refreshHud();
    setOverlayBoth(null);
  };

  // ---- menu (inventory + achievements + cheats) ----------------------------------

  const [placingItem, setPlacingItem] = useState<string | null>(null);
  const [cheatInput, setCheatInput] = useState('');
  const [cheatMsg, setCheatMsg] = useState('');

  // Save and bail back to the title screen mid-game.
  const quitToMenu = useCallback(() => {
    persistSave(saveRef.current);
    setPlacingItem(null);
    setOverlayBoth(null);
    fishModeRef.current = null;
    setSaveTick(t => t + 1); // refresh the title's save summary
    setScreen('title');      // the title effect handles swapping music
  }, [setOverlayBoth]);

  const applyCheat = () => {
    const s = saveRef.current;
    const code = cheatInput.trim().toLowerCase();
    setCheatInput('');
    switch (code) {
      case 'motherlode':
        s.money += 50000;
        sfxCoin();
        setCheatMsg('+¥50,000. The economy quietly weeps.');
        break;
      case 'redbull':
        s.energy = maxEnergy(s);
        setCheatMsg('Energy refilled. Wings not included.');
        break;
      case 'midnight':
        s.timeMin = 25 * 60 + 30;
        setCheatMsg('1:30 AM. Tick tock.');
        break;
      case 'sunrise':
        s.timeMin = 7 * 60;        // 7:00 AM
        setCheatMsg('7:00 AM. Rise and shine, sleepyhead.');
        break;
      case 'nightfall':
        s.timeMin = 22 * 60;       // 10:00 PM
        setCheatMsg('10:00 PM. The city lights come on.');
        break;
      case 'country roads': {
        // Take me home — to the apartment, right by the futon.
        if (s.driving) { s.carPos = { scene: 'badtown', x: 17, y: 3 }; s.driving = false; }
        sceneRef.current = SCENES.apartment;
        posRef.current = { x: 2 * TILE, y: 2 * TILE - 4 };
        dirRef.current = 'down';
        s.scene = 'apartment';
        oreNodesRef.current = []; crawlersRef.current = []; projectilesRef.current = [];
        computeSolids();
        playMusicFor('apartment');
        setOverlayBoth(null);
        setCheatMsg('Take me home. Almost heaven.');
        persistSave(s); refreshHud();
        return;
      }
      case 'rocks':
        for (const m of MINERALS) s.minerals[m.id] = (s.minerals[m.id] ?? 0) + 10;
        setCheatMsg('+10 of every mineral. The Manager raises whatever it has instead of eyebrows.');
        break;
      case 'gimmegimme':
        for (const f of FURNITURE) if (!s.owned.includes(f.id)) s.owned.push(f.id);
        setCheatMsg('All base furniture delivered to your boxes. Place it yourself, slacker.');
        break;
      default:
        setCheatMsg(code ? `"${code}"? Never heard of it.` : '');
        return;
    }
    persistSave(s);
    refreshHud();
    setShopTick(v => v + 1);
  };

  const doPlace = (itemId: string, x: number, y: number) => {
    const s = saveRef.current;
    placeItem(s, itemId, x, y);
    sfxBuy();
    computeSolids();
    persistSave(s);
    refreshHud(); // max energy / effects may change
    setPlacingItem(null);
    setShopTick(v => v + 1);
  };

  const doPutAway = (itemId: string) => {
    const s = saveRef.current;
    unplaceItem(s, itemId);
    computeSolids();
    persistSave(s);
    refreshHud();
    setShopTick(v => v + 1);
  };

  // ---- Arrange mode: free drag-and-drop furniture placement ------------------
  // Cells the apartment floor can't take a new item (other furniture, the
  // default futon, the maneki trophy). `ignoreId` lets the held item vacate its
  // own footprint while it's being moved.
  const apartmentOccupied = (s: GameSave, ignoreId?: string) => {
    const occ = new Set<string>();
    if (!s.placed['bed'] && ignoreId !== 'bed') { occ.add('1,1'); occ.add('2,1'); } // floor futon
    for (const id of Object.keys(s.placed)) {
      if (id === ignoreId) continue;
      const p = s.placed[id], w = itemFootprintW(id);
      for (let dx = 0; dx < w; dx++) occ.add(`${p.x + dx},${p.y}`);
    }
    if (gachaComplete(s)) occ.add(`${MANEKI_SLOT.x},${MANEKI_SLOT.y}`);
    return occ;
  };

  const placeableAt = (id: string, tx: number, ty: number): boolean => {
    const scene = sceneRef.current;
    if (scene.id !== 'apartment') return false;
    const s = saveRef.current;
    const occ = apartmentOccupied(s, heldRef.current?.id ?? id);
    if (itemKind(id) === 'wall') {
      // wall mounts cling to the top wall row on a solid (non-window) tile
      if (ty !== 0 || tx < 1 || tx > 14) return false;
      const t = tileAt(scene, tx, ty);
      return Boolean(t && t.solid) && !occ.has(`${tx},${ty}`);
    }
    const w = itemFootprintW(id);
    for (let dx = 0; dx < w; dx++) {
      const cx = tx + dx;
      if (cx < 1 || cx > 14 || ty < 1 || ty > 8) return false;
      const t = tileAt(scene, cx, ty);
      if (!t || t.solid) return false;
      if (occ.has(`${cx},${ty}`)) return false;
    }
    return true;
  };

  const findPlacedAt = (tx: number, ty: number): string | null => {
    const s = saveRef.current;
    for (const id of Object.keys(s.placed)) {
      const p = s.placed[id], w = itemFootprintW(id);
      if (ty === p.y && tx >= p.x && tx < p.x + w) return id;
    }
    return null;
  };

  const eventTile = (e: React.PointerEvent) => {
    const cv = canvasRef.current;
    if (!cv) return null;
    const r = cv.getBoundingClientRect();
    const lx = ((e.clientX - r.left) / r.width) * VIEW_PW;
    const ly = ((e.clientY - r.top) / r.height) * VIEW_PH;
    const cam = cameraFor(sceneRef.current, posRef.current);
    return { tx: Math.floor((lx + cam.x) / TILE), ty: Math.floor((ly + cam.y) / TILE) };
  };

  const setHeld = (h: { id: string; from: 'box' | 'placed' } | null) => {
    heldRef.current = h;
    if (!h) ghostRef.current = null;
    setArrangeTick(t => t + 1);
  };

  const pickUpPlaced = (id: string) => {
    const s = saveRef.current;
    unplaceItem(s, id);
    computeSolids();
    setHeld({ id, from: 'placed' });
    blip([520, 392], 0.05);
  };

  const commitPlace = (tx: number, ty: number) => {
    const h = heldRef.current;
    if (!h) return;
    const s = saveRef.current;
    placeItem(s, h.id, tx, ty);
    sfxBuy();
    computeSolids();
    persistSave(s);
    refreshHud();
    heldRef.current = null;
    ghostRef.current = null;
    setArrangeTick(t => t + 1);
  };

  // Send the held item back to the boxes (drag-to-trash / cancel of a placed item).
  const boxHeld = () => {
    const h = heldRef.current;
    if (!h) return;
    const s = saveRef.current;
    if (s.placed[h.id]) { unplaceItem(s, h.id); computeSolids(); }
    persistSave(s);
    refreshHud();
    heldRef.current = null;
    ghostRef.current = null;
    setArrangeTick(t => t + 1);
  };

  const enterArrange = () => {
    setOverlayBoth(null);
    heldRef.current = null;
    ghostRef.current = null;
    arrangeRef.current = true;
    setArrangeOpen(true);
    setArrangeTick(t => t + 1);
  };

  const exitArrange = () => {
    arrangeRef.current = false;
    heldRef.current = null;
    ghostRef.current = null;
    setArrangeOpen(false);
    persistSave(saveRef.current);
    refreshHud();
  };
  exitArrangeRef.current = exitArrange;

  const isArrangeUI = (el: EventTarget | null) =>
    el instanceof HTMLElement && Boolean(el.closest('[data-zz-ui]'));

  const arrangeDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    dragStartRef.current = { x: e.clientX, y: e.clientY, moved: false };
    const el = e.target as HTMLElement;
    if (el.closest('[data-zz-done]')) { exitArrange(); return; }
    const chip = el.closest('[data-zz-item]');
    if (chip) { setHeld({ id: chip.getAttribute('data-zz-item')!, from: 'box' }); return; }
    if (el.closest('[data-zz-trash]')) { if (heldRef.current) boxHeld(); return; }
    if (isArrangeUI(el)) return; // a button handles its own click
    const tt = eventTile(e);
    if (!tt) return;
    if (heldRef.current) {
      if (placeableAt(heldRef.current.id, tt.tx, tt.ty)) commitPlace(tt.tx, tt.ty);
      return;
    }
    const hit = findPlacedAt(tt.tx, tt.ty);
    if (hit) { pickUpPlaced(hit); ghostRef.current = { tx: tt.tx, ty: tt.ty, valid: placeableAt(hit, tt.tx, tt.ty) }; }
  };

  const arrangeMove = (e: React.PointerEvent) => {
    if (dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x, dy = e.clientY - dragStartRef.current.y;
      if (Math.hypot(dx, dy) > 6) dragStartRef.current.moved = true;
    }
    if (!heldRef.current) return;
    if (isArrangeUI(e.target)) { ghostRef.current = null; return; }
    const tt = eventTile(e);
    if (!tt) return;
    ghostRef.current = { tx: tt.tx, ty: tt.ty, valid: placeableAt(heldRef.current.id, tt.tx, tt.ty) };
  };

  const arrangeUp = (e: React.PointerEvent) => {
    const moved = dragStartRef.current?.moved ?? false;
    dragStartRef.current = null;
    const el = e.target as HTMLElement;
    if (!heldRef.current) return;
    if (el.closest('[data-zz-trash]')) { boxHeld(); return; }
    if (!moved) return; // a tap: keep the item held for tap-to-place
    if (isArrangeUI(el) || el.closest('[data-zz-item]')) { boxHeld(); return; } // dropped back on the tray
    const tt = eventTile(e);
    if (tt && placeableAt(heldRef.current.id, tt.tx, tt.ty)) commitPlace(tt.tx, tt.ty);
    // otherwise (invalid floor): keep holding so they can try again
  };

  // The smartphone. Replaces the old bag menu: a phone-shaped shell with a
  // status bar, a home screen of app icons, and one screen per "app"
  // (Bag/Inventory, Messages, Trophies, Settings, Codes).
  const renderMenu = (ov: Extract<Overlay, { type: 'menu' }>) => {
    void shopTick;
    const s = saveRef.current;
    const atHome = sceneRef.current.id === 'apartment';
    const allItems = [...s.owned, ...s.rares];
    const boxed = allItems.filter(id => !s.placed[id]);
    const placed = allItems.filter(id => Boolean(s.placed[id]));
    const unread = unreadCount(s);
    const open = (tab: PhoneApp, thread?: string) => { setPlacingItem(null); setOverlayBoth({ type: 'menu', tab, thread }); };
    const openThread = (id: string) => {
      const m = s.messages.find(x => x.id === id);
      if (m && !m.read) { m.read = true; persistSave(s); refreshHud(); }
      open('messages', id);
    };

    const battPct = Math.max(0, Math.min(1, s.energy / maxEnergy(s)));
    const battFill = battPct > 0.5 ? '#7ce8a0' : battPct > 0.25 ? '#ffd24a' : '#e0552e';

    // ---- per-app screen bodies -----------------------------------------------
    const inventoryApp = (
      <div className="px-3 py-2">
        {/* Arrange is the new placement UI — drag & drop in the room itself. */}
        <div className="mb-2">
          {atHome
            ? <button
                className="w-full font-pixel text-base bg-[#ffd24a] text-black px-3 py-2 rounded-lg shadow-[2px_2px_0_#000] hover:bg-[#ffe27a] transition-colors"
                onClick={enterArrange}
              >🛋 ARRANGE ROOM — drag furniture around</button>
            : <p className="text-xs opacity-50 italic">Go home to arrange furniture (drag & drop).</p>}
        </div>

        <p className="text-sm text-[#ffd24a]/80 tracking-wide">FURNITURE — BOXED ({boxed.length})</p>
        {boxed.length === 0 && <p className="py-1 text-base opacity-50">Nothing boxed up.</p>}
        {boxed.map(id => (
          <div key={id} className="flex items-center gap-2 py-1 border-b border-white/10">
            <SpriteIcon atlas={atlasRef.current} sprite={furnitureById(id).sprite} size={22} />
            <p className="flex-grow text-base">{furnitureById(id).name}</p>
            {atHome && <span className="text-xs opacity-40">drag in Arrange</span>}
          </div>
        ))}

        <p className="text-sm text-[#ffd24a]/80 tracking-wide mt-3">FURNITURE — PLACED ({placed.length})</p>
        {placed.length === 0 && <p className="py-1 text-base opacity-50">The apartment is bare.</p>}
        {placed.map(id => (
          <div key={id} className="flex items-center gap-2 py-1 border-b border-white/10">
            <SpriteIcon atlas={atlasRef.current} sprite={furnitureById(id).sprite} size={22} />
            <p className="flex-grow text-base">{furnitureById(id).name}</p>
            {atHome && <button className={`${btnCls} text-sm px-2 py-0.5`} onClick={() => doPutAway(id)}>BOX IT</button>}
          </div>
        ))}

        <p className="text-sm text-[#ffd24a]/80 tracking-wide mt-3">FISH BAG ({s.fishInv.length})</p>
        {s.fishInv.length === 0
          ? <p className="py-1 text-base opacity-50">Empty. The shore is west of Kawamachi St.</p>
          : (() => {
              const counts: Record<string, number> = {};
              for (const id of s.fishInv) counts[id] = (counts[id] || 0) + 1;
              return Object.entries(counts).map(([id, n]) => (
                <p key={id} className="text-base py-0.5 opacity-80">{fishById(id).name} ×{n} <span className="opacity-50">(¥{fishById(id).value} ea)</span></p>
              ));
            })()}

        {(s.peepis > 0 || s.coconuts > 0 || Object.values(s.sodas).some(n => n > 0)) && (
          <>
            <p className="text-sm text-[#ffd24a]/80 tracking-wide mt-3">POCKET</p>
            {s.coconuts > 0 && (
              <div className="flex items-center gap-2 py-1">
                <p className="flex-grow text-base opacity-80">Coconut ×{s.coconuts} <span className="opacity-50">(+15 en)</span></p>
                <button className={`${btnCls} text-sm px-2 py-0.5`} disabled={s.energy >= maxEnergy(s)} onClick={eatCoconut}>EAT</button>
              </div>
            )}
            {s.peepis > 0 && (
              <div className="flex items-center gap-2 py-1">
                <p className="flex-grow text-base opacity-80">"Diet Doctor Peepis" ×{s.peepis} <span className="opacity-50">(+12 en)</span></p>
                <button className={`${btnCls} text-sm px-2 py-0.5`} disabled={s.energy >= maxEnergy(s)} onClick={drinkPeepis}>DRINK</button>
              </div>
            )}
            {SODAS.filter(soda => soda.id !== 'peepis' && (s.sodas[soda.id] ?? 0) > 0).map(soda => (
              <div key={soda.id} className="flex items-center gap-2 py-1">
                <p className="flex-grow text-base opacity-80">{soda.name} ×{s.sodas[soda.id]} <span className="opacity-50">(+{soda.energy ?? 0} en)</span></p>
                <button className={`${btnCls} text-sm px-2 py-0.5`} disabled={s.energy >= maxEnergy(s)} onClick={() => drinkSoda(soda)}>DRINK</button>
              </div>
            ))}
          </>
        )}
      </div>
    );

    const threadMsg = ov.thread ? s.messages.find(m => m.id === ov.thread) : undefined;
    const messagesApp = threadMsg ? (
      // one conversation: chat bubbles
      <div className="px-3 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <span className="text-2xl">{threadMsg.avatar}</span>
          <div className="leading-tight">
            <p className="text-base">{threadMsg.from}</p>
            <p className="text-xs opacity-50">{threadMsg.company ? 'Business account' : 'Contact'} · Day {threadMsg.day}</p>
          </div>
        </div>
        {threadMsg.body.map((line, i) => (
          <div key={i} className="self-start max-w-[85%] bg-[#2b2f3a] text-[#e8e0d0] rounded-2xl rounded-tl-sm px-3 py-1.5 text-base leading-snug shadow">
            {line}
          </div>
        ))}
        <p className="self-center text-xs opacity-40 mt-1">— delivered —</p>
      </div>
    ) : (
      // thread list, newest first
      <div className="py-1">
        {s.messages.length === 0 && <p className="px-3 py-6 text-center text-base opacity-50">No messages yet.<br/>Get out there and meet the city.</p>}
        {[...s.messages].reverse().map(m => (
          <button
            key={m.id}
            onClick={() => openThread(m.id)}
            className="w-full flex items-center gap-3 px-3 py-2 text-left border-b border-white/10 hover:bg-white/5 transition-colors"
          >
            <span className="text-2xl shrink-0">{m.avatar}</span>
            <span className="flex-grow min-w-0">
              <span className="flex items-center gap-2">
                <span className={`text-base truncate ${m.read ? '' : 'text-[#ffd24a]'}`}>{m.from}</span>
                <span className="ml-auto text-xs opacity-40 shrink-0">Day {m.day}</span>
              </span>
              <span className={`block text-sm truncate ${m.read ? 'opacity-50' : 'opacity-80'}`}>{m.body[0]}</span>
            </span>
            {!m.read && <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-[#3da26b]" />}
          </button>
        ))}
      </div>
    );

    const trophiesApp = (
      <div className="px-3 py-2">
        <p className="text-sm text-[#ffd24a]/80 tracking-wide mb-1">{s.gameAch.length}/{GAME_ACHIEVEMENTS.length} EARNED</p>
        {GAME_ACHIEVEMENTS.map(a => {
          const got = s.gameAch.includes(a.id);
          return (
            <div key={a.id} className={`py-1.5 border-b border-white/10 ${got ? '' : 'opacity-50'}`}>
              <p className="text-base leading-tight">{got ? '🏆' : '🔒'} {got ? a.title : '???'}</p>
              <p className="text-xs opacity-70 leading-tight">{got ? a.desc : a.hint}</p>
            </div>
          );
        })}
      </div>
    );

    const settingsApp = (
      <div className="px-3 py-3 flex flex-col gap-3">
        <div className="bg-white/5 rounded-lg px-3 py-2">
          <p className="text-sm opacity-60">Wallet</p>
          <p className="text-xl text-[#ffd24a]">¥{s.money.toLocaleString()}</p>
        </div>
        <div className="bg-white/5 rounded-lg px-3 py-2">
          <p className="text-sm opacity-60">Day {s.day} · {clockLabel(s)}</p>
          <p className="text-base">Battery (energy): {s.energy}/{maxEnergy(s)}</p>
        </div>
        <button
          className="w-full font-pixel text-base border border-[#9fc4e8]/60 text-[#9fc4e8] px-3 py-2 rounded-lg hover:bg-[#9fc4e8] hover:text-black transition-colors"
          onClick={quitToMenu}
        >
          💾 SAVE &amp; QUIT TO MENU
        </button>
        <button
          className="w-full font-pixel text-sm border border-white/20 text-[#e8e0d0]/70 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
          onClick={() => open('cheats')}
        >
          🐛 Developer codes
        </button>
      </div>
    );

    const isDev = (import.meta as { env?: { DEV?: boolean } }).env?.DEV === true
      || (typeof window !== 'undefined' && /[?&]debug\b/.test(window.location.search));
    const codesApp = (
      <div className="px-3 py-3">
        <p className="text-base opacity-70 mb-2">Whisper a word to the void. (For testing. The void doesn't judge. Much.)</p>
        <div className="flex gap-2">
          <input
            value={cheatInput}
            onChange={e => setCheatInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') applyCheat(); e.stopPropagation(); }}
            className="flex-grow bg-black/60 border border-[#ffd24a]/40 px-2 py-1 text-base text-[#e8e0d0] outline-none focus:border-[#ffd24a] rounded"
            placeholder="enter code…"
            autoFocus
          />
          <button className={`${btnCls} text-sm`} onClick={applyCheat}>APPLY</button>
        </div>
        {cheatMsg && <p className="text-sm text-[#7ce8a0] mt-2">{cheatMsg}</p>}
        {isDev && (
          <div className="mt-3 border-t border-[#ffd24a]/20 pt-2">
            <p className="text-xs text-[#ffd24a]/70 mb-1">DEV — known codes</p>
            {[
              ['motherlode', '+¥50,000'],
              ['redbull', 'Refill energy'],
              ['rocks', '+10 of every mineral'],
              ['gimmegimme', 'Unlock all base furniture'],
              ['country roads', 'Teleport home'],
              ['sunrise', 'Time → 7:00 AM'],
              ['nightfall', 'Time → 10:00 PM'],
              ['midnight', 'Time → 1:30 AM'],
            ].map(([code, desc]) => (
              <p key={code} className="text-sm flex justify-between gap-3 py-px"><span className="text-[#7ce8a0]">{code}</span><span className="opacity-55">{desc}</span></p>
            ))}
          </div>
        )}
      </div>
    );

    const order = (id: string, price: number) => {
      if (orderZamaZonk(s, id, price)) { sfxCoin(); persistSave(s); refreshHud(); setShopTick(v => v + 1); }
    };
    const zamaCatalog = zamazonkCatalog(s);
    const zamazonkApp = (
      <div className="px-3 py-3">
        <div className="flex items-center gap-2.5 mb-3 rounded-lg bg-[#120726] px-2.5 py-1.5">
          <img src={ZAMAZONK_LOGO} alt="ZamaZonk" className="h-12 w-12 object-contain shrink-0" style={{ imageRendering: 'auto' }} />
          <p className="text-xs opacity-70 leading-tight">The Everything Store.<br/>Delivered by morning.</p>
        </div>
        {s.orders.length > 0 && (
          <div className="mb-2 rounded-lg bg-[#6a3fb0]/20 border border-[#9a6fe0]/40 px-2.5 py-1.5">
            <p className="text-xs text-[#c9a9ff]">📦 ARRIVING TOMORROW</p>
            {s.orders.map(o => <p key={o.itemId} className="text-sm opacity-80">{furnitureById(o.itemId).name}</p>)}
          </div>
        )}
        {zamaCatalog.length === 0
          ? <p className="py-2 text-base opacity-50">You own (or have ordered) every base item. ZamaZonk is mildly disappointed in your restraint.</p>
          : zamaCatalog.map(f => {
              const price = zamazonkPrice(f);
              return (
                <div key={f.id} className="flex items-center gap-2 py-1.5 border-b border-white/10">
                  <SpriteIcon atlas={atlasRef.current} sprite={f.sprite} size={26} />
                  <span className="flex-grow min-w-0">
                    <span className="block text-base leading-tight">{f.name}</span>
                    <span className="block text-xs opacity-50 leading-tight">¥{price.toLocaleString()} <span className="opacity-60">(incl. ¥300 ZamaPrime)</span></span>
                  </span>
                  <button
                    className="shrink-0 font-pixel text-sm bg-[#7a4fd0] text-white px-2.5 py-1 rounded-md shadow-[2px_2px_0_#000] disabled:opacity-30 disabled:shadow-none hover:bg-[#8a5fe0] transition-colors"
                    disabled={s.money < price}
                    onClick={() => order(f.id, price)}
                  >ORDER</button>
                </div>
              );
            })}
      </div>
    );

    // ---- app icon grid (home screen) -----------------------------------------
    const AppIcon = ({ icon, label, bg, badge, onClick }: { icon: React.ReactNode; label: string; bg: string; badge?: number; onClick: () => void }) => (
      <button onClick={onClick} className="flex flex-col items-center gap-1 group">
        {/* outer wrapper is NOT clipped, so the badge can overhang; the inner
            tile clips the icon/logo to the rounded square. */}
        <span className="relative w-14 h-14 group-hover:brightness-110 group-active:scale-95 transition">
          <span className="absolute inset-0 rounded-2xl overflow-hidden flex items-center justify-center text-3xl shadow-[0_2px_6px_rgba(0,0,0,0.5)]" style={{ background: bg }}>
            {icon}
          </span>
          {badge ? <span className="absolute -top-1.5 -right-1.5 z-10 min-w-[20px] h-5 px-1 rounded-full bg-[#e0552e] text-white text-xs font-bold flex items-center justify-center border-2 border-[#0e0f14]">{badge}</span> : null}
        </span>
        <span className="font-pixel text-xs text-white/90 drop-shadow">{label}</span>
      </button>
    );

    const titles: Record<Exclude<PhoneApp, 'home'>, string> = {
      inventory: 'Bag', messages: 'Messages', achievements: 'Trophies', settings: 'Settings', cheats: 'Codes', zamazonk: 'ZamaZonk',
    };

    return (
      // phone shell
      <div
        className="relative flex flex-col w-[330px] max-w-[94vw] h-[580px] max-h-full rounded-[34px] border-[3px] border-[#33363f] bg-[#0e0f14] shadow-[0_10px_40px_rgba(0,0,0,0.7)] overflow-hidden font-pixel text-[#e8e0d0] select-none"
        style={{ boxShadow: '0 0 0 2px #000, 0 12px 40px rgba(0,0,0,0.7)' }}
      >
        {/* status bar */}
        <div className="relative z-10 flex items-center gap-2 px-5 pt-2 pb-1 text-sm shrink-0 bg-black/30">
          <span className="tabular-nums">{clockLabel(s)}</span>
          <span className="opacity-50">Day {s.day}</span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="opacity-60 text-xs">{s.energy}%</span>
            {/* battery glyph filled by energy */}
            <span className="relative inline-block w-6 h-3 rounded-[3px] border border-white/50">
              <span className="absolute inset-[1.5px] rounded-[1px]" style={{ width: `calc(${battPct * 100}% - 3px)`, backgroundColor: battFill }} />
              <span className="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-1.5 rounded-r bg-white/50" />
            </span>
          </span>
        </div>

        {/* notch */}
        <span className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-[#0e0f14] rounded-b-2xl z-20" />

        {ov.tab === 'home' ? (
          // home screen: wallpaper + clock widget + app grid
          <div className="relative flex-1 min-h-0 overflow-y-auto" style={{ background: 'linear-gradient(160deg,#1b2350 0%,#3a2350 45%,#7a2f5e 100%)' }}>
            <div className="px-5 pt-5 pb-2 text-center">
              <p className="font-retro text-[#ffe9a0] text-3xl drop-shadow-[2px_2px_0_rgba(0,0,0,0.5)] tabular-nums">{clockLabel(s).replace(/ (AM|PM)$/, '')}</p>
              <p className="text-sm text-white/80 drop-shadow">Day {s.day} in the big city</p>
            </div>
            <div className="grid grid-cols-3 gap-y-5 gap-x-2 px-4 pt-3 pb-6 justify-items-center">
              <AppIcon icon="🧳" label="Bag" bg="linear-gradient(160deg,#c9952f,#8a5a1f)" onClick={() => open('inventory')} />
              <AppIcon icon="💬" label="Messages" bg="linear-gradient(160deg,#3da26b,#1f6e45)" badge={unread || undefined} onClick={() => open('messages')} />
              <AppIcon
                icon={<img src={ZAMAZONK_LOGO} alt="" className="w-full h-full object-contain p-0.5" />}
                label="ZamaZonk" bg="#120726" badge={s.orders.length || undefined} onClick={() => open('zamazonk')}
              />
              <AppIcon icon="🏆" label="Trophies" bg="linear-gradient(160deg,#e0a32e,#9e6e16)" onClick={() => open('achievements')} />
              <AppIcon icon="⚙️" label="Settings" bg="linear-gradient(160deg,#5a5f6e,#33363f)" onClick={() => open('settings')} />
            </div>
            <p className="text-center text-xs text-white/50 pb-4">Press <span className="text-white/80">P</span> or Esc to pocket the phone</p>
          </div>
        ) : (
          // an app: header bar + scrollable body
          <div className="flex-1 min-h-0 flex flex-col bg-[#16181d]">
            <div className="flex items-center gap-2 px-2 py-1.5 border-b border-white/10 shrink-0 bg-[#0e0f14]">
              <button
                className="px-2 py-0.5 text-[#9fc4e8] text-base hover:text-white transition-colors"
                onClick={() => (ov.tab === 'messages' && ov.thread) ? open('messages') : open('home')}
              >
                ‹ {(ov.tab === 'messages' && ov.thread) ? 'Inbox' : 'Home'}
              </button>
              <span className="mx-auto text-base">
                {ov.tab === 'messages' && threadMsg ? threadMsg.from : titles[ov.tab as Exclude<PhoneApp, 'home'>]}
              </span>
              <span className="px-2 text-xs text-[#9fc4e8]/70 animate-pulse">⏸</span>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0">
              {ov.tab === 'inventory' && inventoryApp}
              {ov.tab === 'messages' && messagesApp}
              {ov.tab === 'zamazonk' && zamazonkApp}
              {ov.tab === 'achievements' && trophiesApp}
              {ov.tab === 'settings' && settingsApp}
              {ov.tab === 'cheats' && codesApp}
            </div>
          </div>
        )}

        {/* home indicator bar — go home, or pocket the phone if already home */}
        <button
          aria-label={ov.tab === 'home' ? 'Close phone' : 'Home'}
          onClick={() => { if (ov.tab === 'home') { setPlacingItem(null); setOverlayBoth(null); } else open('home'); }}
          className="shrink-0 flex items-center justify-center py-2 bg-[#0e0f14] hover:bg-[#1a1c22] transition-colors"
        >
          <span className="w-28 h-1.5 rounded-full bg-white/40" />
        </button>
      </div>
    );
  };

  // ---- UI pieces --------------------------------------------------------------

  const panelCls = 'bg-[#16181d] border-2 border-[#ffd24a]/60 text-[#e8e0d0] font-pixel shadow-[4px_4px_0px_#000]';
  const btnCls = 'border border-[#ffd24a]/60 px-3 py-1 text-[#ffd24a] hover:bg-[#ffd24a] hover:text-black transition-colors disabled:opacity-30 disabled:pointer-events-none text-lg';

  const renderShop = (ov: Extract<Overlay, { type: 'shop' }>) => {
    void shopTick;
    const s = saveRef.current;
    const close = () => setOverlayBoth(null);

    if (ov.shop === 'yakuza') {
      return (
        <ShopFrame title="DOWNTOWN — PRIVATE" subtitle={'"This block\'s spoken for, friend."'} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          <p className="text-lg opacity-85 py-1 leading-snug">A yakuza enforcer plants himself in the alley mouth, gold watch glinting. His friends don't move. Neither does he.</p>
          <p className="text-base opacity-60 py-1 leading-snug">"Five grand and the district's yours for the night. Or turn around. Your call."</p>
          <div className="flex items-center gap-3 mt-3">
            <button className={`${btnCls} flex-grow`} disabled={s.money < 5000} onClick={payYakuza}>
              {s.money < 5000 ? "CAN'T AFFORD · ¥5,000" : 'PAY THE TOLL · ¥5,000'}
            </button>
            <button className={btnCls} onClick={close}>WALK AWAY</button>
          </div>
        </ShopFrame>
      );
    }

    if (ov.shop === 'casino') {
      return (
        <ShopFrame title="KINRYŪ LOUNGE" subtitle={'"The house likes company. And the house always wins."'} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          <p className="text-lg opacity-85 py-1 leading-snug">
            The dealer — pressed black tux, gold bowtie, the same cold courtesy as the boys who run the Downtown toll — fans a deck one-handed. "Welcome to the Lounge. Pick your poison."
          </p>
          <div className="flex flex-col gap-2 mt-3">
            <button className={`${btnCls} w-full`} onClick={startBlackjack}>🃏 BLACKJACK — beat the dealer to 21</button>
            <button className={`${btnCls} w-full`} onClick={startSlots}>🎰 SLOT MACHINES — pull for the jackpot</button>
          </div>
          <p className="text-xs opacity-40 mt-3">Bet responsibly. The maneki-neko is watching.</p>
        </ShopFrame>
      );
    }

    if (ov.shop === 'vending') {
      return (
        <ShopFrame title="VENDING MACHINE" subtitle="Ice cold. Mostly legal. Buy a can, drink it from your bag." money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          {SODAS.map(soda => {
            const held = soda.id === 'peepis' ? s.peepis : (s.sodas[soda.id] ?? 0);
            return (
              <div key={soda.id} className="flex items-center gap-3 py-1.5 border-b border-[#ffd24a]/15">
                <div className="flex-grow">
                  <p className="text-base text-[#ffd24a]">{soda.name}{held > 0 ? ` ×${held}` : ''} <span className="text-xs opacity-50">+{soda.energy ?? 12} en</span></p>
                  <p className="text-sm opacity-60 leading-tight">{soda.blurb}</p>
                </div>
                <button
                  className={`${btnCls} text-sm whitespace-nowrap`}
                  disabled={s.money < soda.price}
                  onClick={() => buySoda(soda)}
                >
                  BUY · ¥{soda.price}
                </button>
              </div>
            );
          })}
        </ShopFrame>
      );
    }

    if (ov.shop === 'blackjack') {
      const bj = casinoRef.current.bj;
      const chips = [500, 1000, 2500, 5000];
      const pv = handValue(bj.player), dv = handValue(bj.dealer);
      const red = (c: Card) => c.suit === 1 || c.suit === 2;
      const cardChip = (c: Card, hidden: boolean, key: number) => (
        <span key={key} className={`inline-flex flex-col items-center justify-center w-9 h-12 rounded-sm border-2 mr-1 text-base font-bold leading-none ${hidden ? 'bg-[#3d2030] border-[#c9a227] text-[#c9a227]' : 'bg-[#e8e0d0] border-[#7a7468]'}`}>
          {hidden ? '?' : (<>
            <span className={red(c) ? 'text-[#c0392b]' : 'text-[#16181d]'}>{CARD_RANKS[c.rank]}</span>
            <span className={red(c) ? 'text-[#c0392b]' : 'text-[#16181d]'}>{CARD_SUITS[c.suit]}</span>
          </>)}
        </span>
      );
      const profit = bj.payout - bj.bet;
      const resultText =
        bj.result === 'blackjack' ? `BLACKJACK! +¥${profit.toLocaleString()}` :
        bj.result === 'win' ? `YOU WIN  +¥${profit.toLocaleString()}` :
        bj.result === 'push' ? 'PUSH — your bet is returned' :
        bj.result === 'lose' ? `DEALER WINS  −¥${bj.bet.toLocaleString()}` : '';
      return (
        <ShopFrame title="BLACKJACK" subtitle="Dealer stands on 17 · Blackjack pays 3:2" money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          {bj.phase === 'bet' ? (
            <div className="py-2">
              <p className="text-base opacity-70 mb-2">Place your bet, then deal.</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {chips.map(c => (
                  <button key={c} className={`${btnCls} ${bj.bet === c ? 'bg-[#ffd24a] text-black' : ''}`} disabled={s.money < c} onClick={() => setBjBet(c)}>¥{c.toLocaleString()}</button>
                ))}
              </div>
              <button className={`${btnCls} w-full`} disabled={s.money < bj.bet} onClick={dealBlackjack}>DEAL · bet ¥{bj.bet.toLocaleString()}</button>
              <button className={`${btnCls} w-full mt-2 text-sm`} onClick={() => setOverlayBoth({ type: 'shop', shop: 'casino' })}>← BACK TO LOBBY</button>
            </div>
          ) : (
            <div className="py-2">
              <p className="text-sm opacity-60 mb-1">DEALER{bj.hideHole ? '' : ` · ${dv}${dv > 21 ? ' BUST' : ''}`}</p>
              <div className="mb-3">{bj.dealer.map((c, i) => cardChip(c, bj.hideHole && i === 1, i))}</div>
              <p className="text-sm opacity-60 mb-1">YOU · {pv}{pv > 21 ? ' BUST' : ''}</p>
              <div className="mb-3">{bj.player.map((c, i) => cardChip(c, false, i))}</div>
              {bj.phase === 'player' ? (
                <div className="flex gap-2">
                  <button className={`${btnCls} flex-grow`} onClick={hitBlackjack}>HIT</button>
                  <button className={`${btnCls} flex-grow`} onClick={standBlackjack}>STAND</button>
                </div>
              ) : (
                <div>
                  <p className={`text-xl mb-2 ${bj.result === 'lose' ? 'text-[#d05050]' : 'text-[#7ce8a0]'}`}>{resultText}</p>
                  <div className="flex gap-2">
                    <button className={`${btnCls} flex-grow`} disabled={s.money < bj.bet} onClick={() => { casinoRef.current.bj = { ...freshBlackjack(), bet: bj.bet }; setShopTick(v => v + 1); }}>NEW HAND</button>
                    <button className={btnCls} onClick={() => setOverlayBoth({ type: 'shop', shop: 'casino' })}>LOBBY</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </ShopFrame>
      );
    }

    if (ov.shop === 'slots') {
      const slot = casinoRef.current.slot;
      const chips = [100, 500, 1000, 2500];
      const spinning = slot.phase === 'spin';
      const reelBox = (i: number) => (
        <span key={i} className={`inline-flex items-center justify-center w-16 h-16 mx-1 rounded border-2 text-4xl ${spinning && !slot.stopped[i] ? 'border-[#ffd24a] bg-[#1d1018]' : 'border-[#c9a227] bg-[#2a1822]'}`}>
          {SLOT_SYMBOLS[slot.reels[i]]}
        </span>
      );
      const winText = slot.phase === 'done' ? (slot.win > 0 ? `WIN  +¥${slot.win.toLocaleString()}!` : 'No match. Spin again.') : (spinning ? '…' : ' ');
      return (
        <ShopFrame title="SLOT MACHINES" subtitle="Line up three · 7️⃣7️⃣7️⃣ = 50× your bet" money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          <div className="flex justify-center py-3">{[0, 1, 2].map(reelBox)}</div>
          <p className={`text-center text-xl h-7 ${slot.win > 0 ? 'text-[#7ce8a0]' : 'opacity-60'}`}>{winText}</p>
          <div className="flex flex-wrap gap-2 justify-center my-2">
            {chips.map(c => (
              <button key={c} className={`${btnCls} ${slot.bet === c ? 'bg-[#ffd24a] text-black' : ''}`} disabled={spinning || s.money < c} onClick={() => setSlotBet(c)}>¥{c.toLocaleString()}</button>
            ))}
          </div>
          <button className={`${btnCls} w-full text-xl`} disabled={spinning || s.money < slot.bet} onClick={spinSlots}>{spinning ? 'SPINNING…' : `PULL · bet ¥${slot.bet.toLocaleString()}`}</button>
          <button className={`${btnCls} w-full mt-2 text-sm`} disabled={spinning} onClick={() => setOverlayBoth({ type: 'shop', shop: 'casino' })}>← BACK TO LOBBY</button>
          <p className="text-xs opacity-40 mt-2 text-center">7️⃣×3 = 50× · 💎×3 = 20× · ⭐×3 = 10× · any 3 = 5× · any pair = 2×</p>
        </ShopFrame>
      );
    }

    if (ov.shop === 'denden') {
      return (
        <ShopFrame title="DOKI DOKI DISCOUNT" subtitle="Your heart goes doki doki, our prices go down down!!" money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          {FURNITURE.map(f => {
            const owned = s.owned.includes(f.id);
            return (
              <div key={f.id} className="flex items-center gap-3 py-1.5 border-b border-white/10">
                <div className="flex-grow min-w-0">
                  <p className="text-xl leading-tight">{f.name}</p>
                  <p className="text-sm opacity-60 leading-tight">{f.blurb}</p>
                </div>
                {owned
                  ? <span className="text-[#3da26b] text-base shrink-0">OWNED</span>
                  : <button className={`${btnCls} shrink-0`} disabled={s.money < f.price} onClick={() => buyAtPrice(f.id, f.price)}>¥{f.price.toLocaleString()}</button>}
              </div>
            );
          })}
        </ShopFrame>
      );
    }

    if (ov.shop === 'pawn') {
      const offers = pawnStockFor(s).filter(o => !s.owned.includes(o.itemId));
      return (
        <ShopFrame title="KAWAMACHI PAWN" subtitle={`Day ${s.day} stock — different every morning`} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          {offers.length === 0 && <p className="py-4 text-lg opacity-60">Nothing left today that you need. Come back tomorrow.</p>}
          {offers.map(o => {
            const f = furnitureById(o.itemId);
            return (
              <div key={o.itemId} className="flex items-center gap-3 py-1.5 border-b border-white/10">
                <div className="flex-grow min-w-0">
                  <p className="text-xl leading-tight">{f.name} <span className="text-sm opacity-50">(used)</span></p>
                  <p className="text-sm opacity-60 leading-tight">{f.blurb}</p>
                </div>
                <span className="text-sm opacity-40 line-through shrink-0">¥{f.price.toLocaleString()}</span>
                <button className={`${btnCls} shrink-0`} disabled={s.money < o.price} onClick={() => buyAtPrice(o.itemId, o.price)}>¥{o.price.toLocaleString()}</button>
              </div>
            );
          })}
        </ShopFrame>
      );
    }

    if (ov.shop === 'garage') {
      return (
        <ShopFrame title="KOJIMA MOTORS" subtitle={'"Car runs, boat floats. That is the whole pitch."'} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          {VEHICLES.map(v => {
            const owned = s.vehicles.includes(v.id);
            return (
              <div key={v.id} className="flex items-center gap-3 py-1.5 border-b border-white/10">
                <div className="flex-grow min-w-0">
                  <p className="text-xl leading-tight">{v.name}</p>
                  <p className="text-sm opacity-60 leading-tight">{v.blurb}</p>
                </div>
                {owned
                  ? <span className="text-[#3da26b] text-base shrink-0">YOURS</span>
                  : <button className={`${btnCls} shrink-0`} disabled={s.money < v.price} onClick={() => buyVehicle(v.id)}>¥{v.price.toLocaleString()}</button>}
              </div>
            );
          })}
          {s.vehicles.includes('car') && (
            <div className="flex items-center gap-3 py-1.5">
              <p className="flex-grow text-lg opacity-80">Lost the car? Kojima will tow it back out front.</p>
              <button className={btnCls} disabled={s.money < 500} onClick={towCar}>TOW ¥500</button>
            </div>
          )}
        </ShopFrame>
      );
    }

    if (ov.shop === 'monster') {
      if (!s.monsterFed) {
        return (
          <ShopFrame title="THE MANAGER" subtitle={'"A customer! How wonderful. How rare. How... hm."'} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
            <p className="py-2 text-lg leading-snug opacity-90">
              "Forgive me — I would show you the inventory, truly, but I am simply <span className="text-[#b06ad0]">parched</span>.
              Absolutely parched. Centuries of dust in the throat."
            </p>
            <p className="py-1 text-lg leading-snug opacity-90">
              "And before you offer — I am on a <span className="text-[#b06ad0]">diet</span>. Doctor's orders. It must be the diet kind.
              You would not believe my doctor."
            </p>
            {s.peepis > 0
              ? <button className={`${btnCls} mt-2`} onClick={feedMonster}>OFFER A COLD "DIET DOCTOR PEEPIS" (×{s.peepis})</button>
              : <p className="text-sm opacity-50 mt-2">You have nothing cold, diet, or doctor-adjacent on you.</p>}
          </ShopFrame>
        );
      }
      const mineralCount = (id: string) => s.minerals[id] ?? 0;
      const canCraft = (itemId: string) =>
        Object.entries(CRAFT_RECIPES[itemId] ?? {}).every(([m, n]) => mineralCount(m) >= (n as number));
      const recipeText = (itemId: string) =>
        Object.entries(CRAFT_RECIPES[itemId] ?? {}).map(([m, n]) => `${n}× ${mineralById(m).name}`).join(' + ');
      const sellableTotal = MINERALS.reduce((sum, m) => sum + mineralCount(m.id) * m.value, 0);
      return (
        <ShopFrame title="THE MANAGER" subtitle={'"Ahh. Crisp. Legally distinct. You are my favorite customer in nine hundred years."'} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          {!s.wand && (
            <div className="flex items-center gap-3 py-1.5 border-b border-white/10">
              <div className="flex-grow min-w-0">
                <p className="text-xl leading-tight">Magical Girl Wand ✨</p>
                <p className="text-sm opacity-60 leading-tight">"For the crawlers downstairs. Point the sparkly end away from yourself."</p>
              </div>
              <button className={`${btnCls} shrink-0`} disabled={s.money < WAND_PRICE} onClick={buyWand}>¥{WAND_PRICE.toLocaleString()}</button>
            </div>
          )}
          <p className="text-base text-[#b06ad0]/80 mt-1">FURNITURE — "Money? Quaint. Down here we work in minerals."</p>
          {RARE_FURNITURE.filter(f => f.id !== 'coffin').map(f => {
            const owned = s.rares.includes(f.id);
            return (
              <div key={f.id} className="py-1.5 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex-grow min-w-0">
                    <p className="text-xl leading-tight">{f.name}</p>
                    <p className="text-sm opacity-60 leading-tight">{f.blurb}</p>
                    {!owned && <p className="text-sm text-[#b06ad0]/70 leading-tight mt-0.5">needs: {recipeText(f.id)}</p>}
                  </div>
                  {owned
                    ? <span className="text-[#b06ad0] text-base shrink-0">ACQUIRED</span>
                    : <button className={`${btnCls} shrink-0`} disabled={!canCraft(f.id)} onClick={() => craftRare(f.id)}>CRAFT</button>}
                </div>
              </div>
            );
          })}
          <p className="text-base text-[#b06ad0]/80 mt-2">MINERALS — "I buy. I do not ask where from. I know where from."</p>
          {MINERALS.map(m => (
            <p key={m.id} className="text-lg py-0.5 opacity-80">{m.name} ×{mineralCount(m.id)} <span className="opacity-50">(¥{m.value} ea)</span></p>
          ))}
          <button className={`${btnCls} mt-1`} disabled={sellableTotal === 0} onClick={sellMinerals}>SELL ALL — ¥{sellableTotal.toLocaleString()}</button>
          <p className="text-sm opacity-50 mt-2">It bows politely as you browse. Its shadow does not.</p>
        </ShopFrame>
      );
    }

    if (ov.shop === 'dj') {
      const options = DJ_SETLIST.filter(t => t.scene === 'nightclub' || s.visited.includes(t.scene));
      const locked = DJ_SETLIST.length - options.length;
      return (
        <ShopFrame title="DJ TANUKI" subtitle={'"Requests?! ...Fine. But ONLY places you have actually been. Authenticity matters."'} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          {options.map(t => (
            <div key={t.scene} className="flex items-center gap-3 py-1 border-b border-white/10">
              <p className="flex-grow text-lg">{t.label}</p>
              <button
                className={`${btnCls} text-sm px-2 py-0.5`}
                disabled={(djPickRef.current ?? 'nightclub') === t.scene}
                onClick={() => requestTrack(t.scene)}
              >
                {(djPickRef.current ?? 'nightclub') === t.scene ? 'SPINNING' : 'PLAY'}
              </button>
            </div>
          ))}
          {locked > 0 && <p className="text-sm opacity-50 mt-2">{locked} more in the crate — go see more of the city first.</p>}
        </ShopFrame>
      );
    }

    if (ov.shop === 'sketchy') {
      const offer = sketchyOfferFor(s);
      const doneToday = s.sketchyDay === s.day;
      return (
        <ShopFrame title="JIMMY'S 'WAREHOUSE'" subtitle={'"Fell off a truck. The truck is fine. Don\'t worry about the truck."'} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          {!offer && <p className="py-3 text-lg opacity-60">"You bought EVERYTHING? Respect. Come back when you own less."</p>}
          {offer && doneToday && <p className="py-3 text-lg opacity-60">"One deal a day, friend. Scarcity. It's economics. Look it up."</p>}
          {offer && !doneToday && (() => {
            const f = furnitureById(offer.itemId);
            return (
              <div className="flex items-center gap-3 py-1.5">
                <div className="flex-grow min-w-0">
                  <p className="text-xl leading-tight">{f.name} <span className="text-sm opacity-50">("new")</span></p>
                  <p className="text-sm opacity-60 leading-tight">"Genuine. Probably. No refunds. DEFINITELY no refunds."</p>
                </div>
                <span className="text-sm opacity-40 line-through shrink-0">¥{f.price.toLocaleString()}</span>
                <button className={`${btnCls} shrink-0`} disabled={s.money < offer.price} onClick={() => buySketchyDeal(offer.itemId, offer.price)}>¥{offer.price.toLocaleString()}</button>
              </div>
            );
          })()}
          <p className="text-sm text-[#e89a7c]/80 mt-2">⚠ Half the time Jimmy's stuff doesn't survive the walk home. The discount knows why.</p>
        </ShopFrame>
      );
    }

    if (ov.shop === 'boat') {
      return (
        <ShopFrame title="THE SKIFF" subtitle="She creaks in a way Kojima swears is normal" money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          <div className="flex flex-col gap-2 py-1">
            <button className={btnCls} onClick={() => { setOverlayBoth(null); enterScene('deepsea', 9, 9, 'up'); showDialog(['The motor coughs twice, then commits. Sumikawa Bay opens up around you.', 'Sail anywhere. Press E to drop a line. The way home is the gap in the south swell.']); }}>HEAD OUT INTO THE BAY 🌊</button>
            <button className={btnCls} onClick={() => { setOverlayBoth(null); enterScene('island', 5, 6, 'down'); showDialog(['The skiff puts the city behind you, tower by tower, until it is a postcard.', 'Ahead: a green smudge becomes palms. Kiwami Island.']); }}>SAIL TO KIWAMI ISLAND ⛵</button>
            <button className={`${btnCls} opacity-60`} onClick={close}>NEVER MIND</button>
          </div>
        </ShopFrame>
      );
    }

    if (ov.shop === 'boat-island') {
      return (
        <ShopFrame title="THE SKIFF" subtitle="The tide will hold. Probably." money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          <div className="flex flex-col gap-2 py-1">
            <button className={btnCls} onClick={() => { setOverlayBoth(null); enterScene('shore', 3, 8, 'down'); showDialog(['The city rises back out of the haze to meet you. Home water.']); }}>SAIL BACK TO SUMIKAWA SHORE</button>
            <button className={`${btnCls} opacity-60`} onClick={close}>STAY A LITTLE LONGER</button>
          </div>
        </ShopFrame>
      );
    }


    if (ov.shop === 'tiki') {
      const cocoVal = s.coconuts * 120;
      return (
        <ShopFrame title="LULU'S TIKI BAR" subtitle={'"No shirt, no shoes, no problem. The blender runs on vibes."'} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          <div className="flex items-center gap-3 py-1.5 border-b border-white/10">
            <div className="flex-grow min-w-0">
              <p className="text-xl leading-tight">Blue Kiwami 🍹</p>
              <p className="text-sm opacity-60 leading-tight">Frozen, electric blue, aggressively refreshing. +25 energy.</p>
            </div>
            <button className={btnCls} disabled={s.money < 800 || s.energy >= maxEnergy(s)} onClick={buyTikiDrink}>¥800</button>
          </div>
          <div className="flex items-center gap-3 py-1.5">
            <p className="flex-grow text-lg opacity-80">Coconuts ×{s.coconuts} <span className="opacity-50">(¥120 ea — "the blender is hungry")</span></p>
            <button className={btnCls} disabled={s.coconuts === 0} onClick={sellCoconuts}>SELL ALL — ¥{cocoVal.toLocaleString()}</button>
          </div>
        </ShopFrame>
      );
    }

    if (ov.shop === 'hat') {
      return (
        <ShopFrame title="TEX'S BEACH GOODS" subtitle={'"One hat. One price. One dream."'} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          <div className="flex items-center gap-3 py-1.5">
            <div className="flex-grow min-w-0">
              <p className="text-xl leading-tight">Cowboy Hat</p>
              <p className="text-sm opacity-60 leading-tight">The tag says $67. Tex says that's ¥6,700. Tex does not negotiate. You will wear it forever.</p>
            </div>
            {s.hat
              ? <span className="text-[#3da26b] text-base shrink-0">ON YOUR HEAD</span>
              : <button className={`${btnCls} shrink-0`} disabled={s.money < 6700} onClick={buyHat}>¥6,700</button>}
          </div>
        </ShopFrame>
      );
    }

    // konbini
    const counts: Record<string, number> = {};
    for (const id of s.fishInv) counts[id] = (counts[id] || 0) + 1;
    const sellTotal = s.fishInv.reduce((sum, id) => sum + fishById(id).value, 0);
    const shiftDone = s.shiftDay === s.day;
    const shiftCost = energyCost(s, SHIFT_COST);
    return (
      <ShopFrame title="KONBINI 24h" subtitle="Hot food, cold drinks, honest prices" money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
        <p className="text-base text-[#ffd24a]/80 mt-1">EAT (energy {s.energy}/{maxEnergy(s)})</p>
        {KONBINI_FOOD.map(f => (
          <div key={f.id} className="flex items-center gap-3 py-1 border-b border-white/10">
            <p className="flex-grow text-xl">{f.name} <span className="text-sm opacity-60">+{f.energy} energy</span></p>
            <button className={btnCls} disabled={s.money < f.price || s.energy >= maxEnergy(s)} onClick={() => buyFood(f.id)}>¥{f.price}</button>
          </div>
        ))}
        <p className="text-base text-[#ffd24a]/80 mt-3">SELL FISH</p>
        {s.fishInv.length === 0
          ? <p className="py-1 text-lg opacity-60">No fish in your bag. The shore is west of the street.</p>
          : (
            <>
              {Object.entries(counts).map(([id, n]) => (
                <p key={id} className="text-lg py-0.5 opacity-80">{fishById(id).name} ×{n} <span className="opacity-60">(¥{fishById(id).value} ea)</span></p>
              ))}
              <button className={`${btnCls} mt-1`} onClick={sellAllFish}>SELL ALL — ¥{sellTotal.toLocaleString()}</button>
            </>
          )}
        <p className="text-base text-[#ffd24a]/80 mt-3">WORK</p>
        {s.messages.some(m => m.id === 'konbini-job') ? (
          <div className="flex items-center gap-3 py-1">
            <p className="flex-grow text-lg opacity-80">One shift per day. Costs {shiftCost} energy.</p>
            <button className={btnCls} disabled={shiftDone || s.energy < shiftCost} onClick={workShift}>
              {shiftDone ? 'DONE TODAY' : `SHIFT +¥${SHIFT_PAY}`}
            </button>
          </div>
        ) : (
          <p className="py-1 text-lg opacity-60">Not hiring walk-ins just yet. (They have your number — keep an eye on your phone.)</p>
        )}
        {s.day >= 3 && (
          <>
            <p className="text-base text-[#ffd24a]/80 mt-3">LOTTERY</p>
            <div className="flex items-center gap-3 py-1">
              <p className="flex-grow text-lg opacity-80">{s.lotteryDay !== 0 ? 'Ticket in play — results land in the morning.' : 'One ticket per draw. Winners are texted next morning.'}</p>
              <button className={btnCls} disabled={s.lotteryDay !== 0 || s.money < 500} onClick={buyLottery}>
                {s.lotteryDay !== 0 ? 'PENDING' : 'TICKET ¥500'}
              </button>
            </div>
          </>
        )}
      </ShopFrame>
    );
  };

  // ---- render tree --------------------------------------------------------------

  // Fill the whole viewport when in browser fullscreen OR in the desktop app
  // shell (its OS window is already fullscreen). The canvas fit() effect then
  // integer-upscales the art to fill the frame instead of sitting in a 1000px box.
  // (`filled` is declared above, by the fit effect.)

  return (
    <div
      ref={rootRef}
      // General UI click feedback: any <button> tap chirps, except those marked
      // data-nosfx (the touch d-pad — movement shouldn't click).
      onClick={e => {
        const btn = (e.target as HTMLElement).closest('button');
        if (btn && !btn.hasAttribute('data-nosfx')) sfxUiClick();
      }}
      // Windowed + forced scale: cap the box at the canvas width (boxW) instead
      // of 1000px so the chosen scale isn't clipped.
      style={filled ? undefined : boxW != null ? { maxWidth: `${boxW}px` } : undefined}
      className={filled
        ? 'w-full h-full flex flex-col bg-black select-none'
        : 'w-full max-w-[1000px] mx-auto select-none'}
    >
      {/* HUD — fixed height (h-12) so it never reflows as fonts/icons settle,
          which removes the one-frame jump when arriving from the title. */}
      {screen === 'playing' && (
        <div className="relative z-10 flex items-center gap-2 sm:gap-3 px-2 sm:px-3 h-12 shrink-0 overflow-hidden font-pixel text-[#e8e0d0] bg-gradient-to-b from-[#222732] to-[#11131a] border-b-2 border-[#ffd24a]/50 shadow-[0_2px_10px_rgba(0,0,0,0.55)]">
          {/* thin gold sheen along the top edge */}
          <span className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#ffd24a]/40" />

          {/* money */}
          <span className="flex items-baseline gap-1 leading-none">
            <span className="text-[#ffd24a]/60 text-sm">¥</span>
            <span className="text-[#ffd24a] text-base sm:text-xl tabular-nums">{hud.money.toLocaleString()}</span>
          </span>
          <span className="w-px h-6 bg-white/10 shrink-0" />

          {/* day + clock */}
          <span className="flex items-baseline gap-1 leading-none">
            <span className="opacity-45 text-xs sm:text-sm">DAY</span>
            <span className="text-base sm:text-xl tabular-nums">{hud.day}</span>
          </span>
          <span
            className={`flex items-center gap-1 leading-none tabular-nums text-base sm:text-xl ${hud.late ? 'text-[#e0552e]' : 'text-[#9fc4e8]'}`}
            title={hud.late ? 'At 2:00 AM you pass out and wake up at home' : undefined}
          >
            {hud.late && <span className="text-[10px] animate-pulse">●</span>}
            {hud.time}
          </span>

          {/* energy meter */}
          {(() => {
            const pct = Math.max(0, Math.min(1, hud.energy / hud.max));
            const fill = pct > 0.5 ? '#3da26b' : pct > 0.25 ? '#e0a32e' : '#d2452e';
            return (
              <span className="flex items-center gap-1.5 leading-none">
                <span className="text-xs opacity-50">EN</span>
                <span className="relative inline-block w-16 sm:w-28 h-3.5 rounded-full bg-black/70 border border-white/15 overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.7)]">
                  <span className="block h-full rounded-full transition-[width,background-color] duration-300" style={{ width: `${pct * 100}%`, backgroundColor: fill }} />
                  <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-white/20 rounded-full" />
                </span>
                <span className="hidden sm:inline text-xs opacity-50 tabular-nums">{hud.energy}/{hud.max}</span>
              </span>
            );
          })()}

          {/* scene name */}
          <span className="ml-auto hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-black/25 text-sm text-[#e8e0d0]/80 leading-none truncate max-w-[34%]">
            <span className="opacity-50">📍</span>{hud.sceneName}
          </span>

          {/* phone */}
          <button
            onClick={() => setOverlayBoth(overlay?.type === 'menu' ? null : { type: 'menu', tab: 'home' })}
            title="Phone — bag, messages, ZamaZonk (P)"
            aria-label="Phone"
            className="relative shrink-0 sm:ml-1 flex items-center gap-1 h-8 bg-[#ffd24a] text-black rounded-md px-2 text-sm sm:text-base shadow-[0_2px_0_#9a7d1e] hover:bg-[#ffe27a] active:translate-y-px active:shadow-none transition"
          >
            📱 <span className="hidden sm:inline">PHONE</span>
            {!isCoarse && <kbd className="hidden sm:inline ml-0.5 text-xs bg-black/20 border border-black/30 rounded px-1 leading-none">P</kbd>}
            {hud.unread > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#e0552e] text-white text-xs font-bold flex items-center justify-center border-2 border-[#11131a]">{hud.unread}</span>
            )}
          </button>

          {/* mute */}
          <button
            onClick={toggleMusic}
            title={musicMuted ? 'Unmute' : 'Mute'}
            aria-label={musicMuted ? 'Unmute' : 'Mute'}
            className="shrink-0 h-8 w-8 flex items-center justify-center text-lg rounded-md border border-white/15 bg-white/5 opacity-80 hover:opacity-100 hover:bg-white/10 transition"
          >
            {musicMuted ? '🔇' : '🔊'}
          </button>

          {/* fullscreen (web/mobile only — native window owns FS) */}
          {!isDesktopApp && (
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              className="shrink-0 h-8 flex items-center gap-1 px-2 rounded-md border border-[#ffd24a]/60 text-[#ffd24a] text-sm sm:text-base hover:bg-[#ffd24a] hover:text-black transition"
            >
              {isFullscreen ? '🗗' : '⛶'} <span className="hidden sm:inline">{isFullscreen ? 'EXIT' : 'FULL'}</span>
            </button>
          )}
        </div>
      )}

      {/* Canvas + overlays */}
      <div
        ref={frameRef}
        className={`relative bg-black flex items-center justify-center ${filled ? 'flex-1 min-h-0 border-0' : 'border-2 border-[#ffd24a]/40'}`}
        style={filled ? undefined : { aspectRatio: `${VIEW_PW} / ${VIEW_PH}` }}
      >
        <canvas
          ref={canvasRef}
          width={VIEW_PW}
          height={VIEW_PH}
          className="block"
          style={{ imageRendering: 'pixelated' }}
        />

        {screen === 'title' && (() => {
          // Mobile setup steps (soft gate — play stays available either way).
          const wantFsBtn = isCoarse && fsSupported && !isFullscreen && !isStandalone; // Android: tap to FS
          const wantInstall = isCoarse && !fsSupported && !isStandalone;               // iOS: add to home
          const showSetup = isCoarse && (isPortrait || wantFsBtn || wantInstall);
          const dot = (done: boolean) => (
            <span className={`shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-bold ${done ? 'bg-[#3da26b] border-[#3da26b] text-black' : 'border-[#ffd24a]/60 text-[#ffd24a]'}`}>{done ? '✓' : '!'}</span>
          );
          return (
          <div className={`${isCoarse ? 'fixed' : 'absolute'} inset-0 z-50 flex flex-col items-center justify-center text-center p-4 overflow-y-auto`}>
            {/* painted background + dark gradient so text stays legible */}
            <img
              src={TITLE_BG}
              alt=""
              aria-hidden
              className="absolute inset-0 w-full h-full object-cover"
              style={{ imageRendering: 'pixelated' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

            <button
              onClick={toggleMusic}
              title={musicMuted ? 'Unmute' : 'Mute'}
              aria-label={musicMuted ? 'Unmute' : 'Mute'}
              className="absolute top-3 right-3 text-2xl opacity-80 hover:opacity-100 transition-opacity drop-shadow-[1px_1px_0_#000]"
            >
              {musicMuted ? '🔇' : '🔊'}
            </button>

            <div className="relative flex flex-col items-center gap-4 w-full max-w-sm">
              <div className="relative leading-none">
                <p className="font-pixel text-[#9fc4e8] text-lg sm:text-2xl mb-1.5 drop-shadow-[2px_2px_0_#000]">a tiny life sim</p>
                <h2 className="font-retro text-[#ffd24a] text-xl sm:text-3xl leading-relaxed drop-shadow-[2px_2px_0_#000]">LITTLE APARTMENT,</h2>
                <h2 className="font-retro text-[#ffd24a] text-xl sm:text-3xl leading-relaxed drop-shadow-[2px_2px_0_#000]">BIG CITY</h2>
                {/* Minecraft-style splash, tucked at the logo's lower-right corner */}
                <div className="absolute -bottom-3 -right-2 sm:-bottom-4 sm:-right-6 pointer-events-none z-10">
                  <p className="origin-center font-pixel text-[#ffd24a] text-xs sm:text-sm animate-splash drop-shadow-[1px_1px_0_#000] whitespace-nowrap">
                    Made by TechProGabe!
                  </p>
                </div>
              </div>

              {/* phone setup checklist */}
              {showSetup && (
                <div className="w-full bg-black/60 border-2 border-[#ffd24a]/50 rounded-sm px-3 py-2.5 space-y-2.5 shadow-[3px_3px_0_#000]">
                  <p className="font-pixel text-[#ffd24a] text-sm">PLAYS BEST FULLSCREEN + SIDEWAYS</p>
                  <div className="flex items-center gap-2.5 text-left">
                    {dot(!isPortrait)}
                    <span className="font-pixel text-sm flex-1">{isPortrait ? 'Turn your phone sideways' : 'Landscape — nice.'}</span>
                  </div>
                  {fsSupported ? (
                    <button
                      data-nosfx
                      onClick={goFullscreenLandscape}
                      className="w-full flex items-center gap-2.5 text-left"
                    >
                      {dot(isFullscreen)}
                      <span className="font-pixel text-sm flex-1 underline decoration-dotted underline-offset-2">{isFullscreen ? 'Fullscreen on.' : 'Tap here to go fullscreen'}</span>
                    </button>
                  ) : wantInstall ? (
                    <button
                      data-nosfx
                      onClick={() => setFsGuideOpen(true)}
                      className="w-full flex items-center gap-2.5 text-left"
                    >
                      {dot(false)}
                      <span className="font-pixel text-sm flex-1 underline decoration-dotted underline-offset-2">Add to Home Screen for fullscreen ›</span>
                    </button>
                  ) : null}
                </div>
              )}

              {/* play — soft gate, always available */}
              {saved ? (
                <div className="flex flex-col items-center gap-1.5">
                  <button
                    data-nosfx
                    className="font-pixel text-2xl px-10 py-3 bg-[#ffd24a] text-black border-2 border-[#ffd24a] shadow-[4px_4px_0px_#000] hover:bg-[#ffe27a] transition-colors"
                    onClick={() => startGame(false)}
                  >
                    CONTINUE
                  </button>
                  <p className="font-pixel text-[#e8e0d0]/80 text-base drop-shadow-[1px_1px_0_#000]">Day {saved.day} · ¥{saved.money.toLocaleString()}</p>
                </div>
              ) : (
                <button
                  data-nosfx
                  className="font-pixel text-2xl px-10 py-3 bg-[#ffd24a] text-black border-2 border-[#ffd24a] shadow-[4px_4px_0px_#000] hover:bg-[#ffe27a] transition-colors"
                  onClick={() => setVibePick(true)}
                >
                  NEW GAME
                </button>
              )}

              {/* secondary actions — single vertical column */}
              <div className="flex flex-col items-stretch w-full gap-2">
                <button
                  className={`${btnCls} font-pixel text-base px-5 py-1.5 bg-black/40 w-full`}
                  onClick={() => setHowToOpen(true)}
                >
                  HOW TO PLAY
                </button>
                <button
                  className={`${btnCls} font-pixel text-base px-5 py-1.5 bg-black/40 w-full`}
                  onClick={() => setSettingsOpen(true)}
                >
                  ⚙ SETTINGS
                </button>
                {/* desktop / mobile-landscape get the fullscreen button here; portrait uses the checklist above. Native app is already fullscreen. */}
                {!isDesktopApp && (!isCoarse || !isPortrait) && (
                  <button
                    className="font-pixel text-base px-5 py-1.5 border-2 border-[#9fc4e8]/70 text-[#9fc4e8] bg-black/40 hover:bg-[#9fc4e8] hover:text-black transition-colors w-full"
                    onClick={() => { if (!fsSupported) setFsGuideOpen(true); else if (isFullscreen) toggleFullscreen(); else goFullscreenLandscape(); }}
                  >
                    {isFullscreen ? '🗗 EXIT FULLSCREEN' : '⛶ GO FULLSCREEN'}
                  </button>
                )}
                {/* desktop app: explicit quit (no browser tab to close) */}
                {isDesktopApp && (
                  <button
                    className="font-pixel text-base px-5 py-1.5 border-2 border-[#e0552e]/70 text-[#e0552e] bg-black/40 hover:bg-[#e0552e] hover:text-black transition-colors w-full"
                    onClick={quitDesktopApp}
                  >
                    ✕ QUIT GAME
                  </button>
                )}
              </div>

              <p className="font-pixel text-[#e8e0d0]/70 text-sm sm:text-base drop-shadow-[1px_1px_0_#000]">{isCoarse ? 'On-screen controls once you start' : 'WASD / arrows move · E interact · Esc close'}</p>
            </div>

          </div>
          );
        })()}

        {/* new-game "what's your vibe?" character pick (not a gender — just a look) */}
        {screen === 'title' && vibePick && (
          <div className={`${isCoarse ? 'fixed' : 'absolute'} inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center text-center p-4`}>
            <h2 className="font-retro text-[#ffd24a] text-lg sm:text-2xl mb-5 drop-shadow-[2px_2px_0_#000]">WHAT'S YOUR VIBE?</h2>
            <div className="flex flex-col items-center gap-1.5 mb-6">
              <label htmlFor="pc-name" className="font-pixel text-[#e8e0d0]/80 text-sm sm:text-base">YOUR NAME</label>
              <input
                id="pc-name"
                data-nosfx
                value={pcName}
                onChange={e => setPcName(e.target.value.slice(0, 16))}
                placeholder="Neighbor"
                maxLength={16}
                className="font-pixel text-lg text-center text-[#e8e0d0] bg-black/50 border-2 border-[#ffd24a]/50 focus:border-[#ffd24a] outline-none px-3 py-1.5 w-56"
              />
            </div>
            <div className="flex gap-5 sm:gap-8">
              {(['fem', 'masc'] as const).map(v => (
                <button
                  key={v}
                  data-nosfx
                  onClick={() => chooseVibe(v)}
                  aria-pressed={pickedVibe === v}
                  className={`flex flex-col items-center p-3 sm:p-4 border-2 transition-colors shadow-[4px_4px_0_#000] ${pickedVibe === v ? 'border-[#ffd24a] bg-[#ffd24a]/15' : 'border-[#ffd24a]/40 bg-black/40 hover:border-[#ffd24a] hover:bg-[#ffd24a]/10'}`}
                >
                  <canvas
                    ref={el => drawVibeThumb(el, v)}
                    width={16}
                    height={16}
                    aria-hidden
                    style={{ width: 176, height: 176, imageRendering: 'pixelated' }}
                  />
                  <span className={`font-pixel text-sm mt-2 ${pickedVibe === v ? 'text-[#ffd24a]' : 'text-[#e8e0d0]/60'}`}>{pickedVibe === v ? '● SELECTED' : 'SELECT'}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3 mt-7">
              <button
                className={`${btnCls} font-pixel text-base px-5 py-1.5 bg-black/40`}
                onClick={() => setVibePick(false)}
              >
                ‹ BACK
              </button>
              <button
                data-nosfx
                className="font-retro text-base px-7 py-1.5 border-2 border-[#ffd24a] bg-[#ffd24a]/15 text-[#ffd24a] hover:bg-[#ffd24a]/30 transition-colors shadow-[3px_3px_0_#000]"
                onClick={startWithVibe}
              >
                START ›
              </button>
            </div>
          </div>
        )}

        {/* fullscreen guide — Android can just tap fullscreen; iOS needs Add to Home Screen */}
        {screen === 'title' && fsGuideOpen && (
          <div className={`${isCoarse ? 'fixed' : 'absolute'} inset-0 z-[60] bg-black/85 flex items-center justify-center p-3 sm:p-4`}>
            <div className={`${panelCls} w-full max-w-md max-h-full overflow-y-auto px-5 py-4`}>
              <div className="flex items-center justify-between border-b-2 border-[#ffd24a]/40 pb-1.5 mb-3">
                <h3 className="font-retro text-[#ffd24a] text-base">GO FULLSCREEN</h3>
                <button className={btnCls} onClick={() => setFsGuideOpen(false)}>✕</button>
              </div>
              {fsSupported ? (
                <div className="text-base leading-snug space-y-2.5">
                  <p>Tap the <span className="text-[#ffd24a]">⛶ FULL</span> button (top-right while playing) any time to fill the screen.</p>
                  <p>For the best fit, also <span className="text-[#ffd24a]">rotate your phone to landscape</span>.</p>
                  <div className="text-center mt-3">
                    <button className={btnCls} onClick={() => { setFsGuideOpen(false); toggleFullscreen(); }}>GO FULLSCREEN NOW</button>
                  </div>
                </div>
              ) : (
                <div className="text-base leading-snug space-y-2.5">
                  <p className="opacity-80">iPhone Safari can't fullscreen a web page directly — but you can install this as an app for a true fullscreen experience:</p>
                  <ol className="list-decimal list-inside space-y-1.5">
                    <li>Tap the <span className="text-[#ffd24a]">Share</span> button <span aria-hidden>(the square with an ↑ arrow)</span> in Safari's toolbar.</li>
                    <li>Scroll down and tap <span className="text-[#ffd24a]">Add to Home Screen</span>.</li>
                    <li>Open the game from the new <span className="text-[#ffd24a]">home-screen icon</span> — it launches fullscreen, no browser bars.</li>
                    <li>Turn your phone <span className="text-[#ffd24a]">landscape</span> and play.</li>
                  </ol>
                  <p className="opacity-60 text-sm">On Android Chrome the ⛶ button just works — no install needed.</p>
                  <div className="text-center mt-3">
                    <button className={btnCls} onClick={() => setFsGuideOpen(false)}>GOT IT</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* display / scaling */}
        {/* Settings menu — groups Display, Save management, and Credits */}
        {screen === 'title' && settingsOpen && (
          <div className={`${isCoarse ? 'fixed' : 'absolute'} inset-0 z-[60] bg-black/85 flex items-center justify-center p-3 sm:p-4`}>
            <div className={`${panelCls} w-full max-w-xs px-5 py-4`}>
              <div className="flex items-center justify-between border-b-2 border-[#ffd24a]/40 pb-1.5 mb-3">
                <h3 className="font-retro text-[#ffd24a] text-base">⚙ SETTINGS</h3>
                <button className={btnCls} onClick={() => setSettingsOpen(false)}>✕</button>
              </div>
              <div className="flex flex-col gap-2">
                <button className={`${btnCls} w-full py-1.5`} onClick={() => { setSettingsOpen(false); setDisplayOpen(true); }}>⛶ DISPLAY</button>
                {saved && (
                  <button className={`${btnCls} w-full py-1.5`} onClick={() => { setSettingsOpen(false); setManageOpen(true); setConfirmMode(null); }}>MANAGE SAVE</button>
                )}
                <button className={`${btnCls} w-full py-1.5`} onClick={() => { setSettingsOpen(false); setCreditsOpen(true); }}>CREDITS</button>
              </div>
            </div>
          </div>
        )}

        {/* Credits */}
        {screen === 'title' && creditsOpen && (
          <div className={`${isCoarse ? 'fixed' : 'absolute'} inset-0 z-[60] bg-black/85 flex items-center justify-center p-3 sm:p-4`}>
            <div className={`${panelCls} w-full max-w-xs px-5 py-4 text-center`}>
              <div className="flex items-center justify-between border-b-2 border-[#ffd24a]/40 pb-1.5 mb-3 text-left">
                <h3 className="font-retro text-[#ffd24a] text-base">CREDITS</h3>
                <button className={btnCls} onClick={() => setCreditsOpen(false)}>✕</button>
              </div>
              <div className="space-y-2">
                <p className="font-retro text-[#ffd24a] text-lg leading-relaxed">LITTLE APARTMENT,<br />BIG CITY</p>
                <p className="text-base opacity-85">Made by <span className="text-[#ffd24a]">TechProGabe</span></p>
                <p className="text-sm opacity-60">Design · code · pixels · vibes</p>
                <p className="text-xs opacity-40 pt-2">Thanks for playing. 🌇</p>
              </div>
              <button className={`${btnCls} w-full py-1.5 mt-4`} onClick={() => setCreditsOpen(false)}>‹ BACK</button>
            </div>
          </div>
        )}

        {screen === 'title' && displayOpen && (
          <div className={`${isCoarse ? 'fixed' : 'absolute'} inset-0 z-[60] bg-black/85 flex items-center justify-center p-3 sm:p-4`}>
            <div className={`${panelCls} w-full max-w-md max-h-full overflow-y-auto px-5 py-4`}>
              <div className="flex items-center justify-between border-b-2 border-[#ffd24a]/40 pb-1.5 mb-3">
                <h3 className="font-retro text-[#ffd24a] text-base">DISPLAY</h3>
                <button className={btnCls} onClick={() => setDisplayOpen(false)}>✕</button>
              </div>
              <div className="text-base leading-snug space-y-3">
                <p className="opacity-80">Pixel scale — how big the {VIEW_PW}×{VIEW_PH} picture is drawn. <span className="text-[#ffd24a]">Auto</span> fills the window; a fixed step keeps the same size and is clamped to what fits.</p>
                <div className="grid grid-cols-4 gap-2">
                  {(['auto', 1, 2, 3, 4, 5, 6] as const).map(opt => {
                    const on = scalePref === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => setScale(opt)}
                        className={`font-pixel text-base px-2 py-2 border-2 transition-colors ${on ? 'bg-[#ffd24a] text-black border-[#ffd24a]' : 'border-[#ffd24a]/60 text-[#ffd24a] hover:bg-[#ffd24a]/20'}`}
                      >
                        {opt === 'auto' ? 'AUTO' : `${opt}×`}
                      </button>
                    );
                  })}
                </div>
                <p className="opacity-60 text-sm">
                  {scalePref === 'auto'
                    ? 'Auto — biggest size that fits the window.'
                    : `${scalePref}× → ${VIEW_PW * scalePref}×${VIEW_PH * scalePref} px (clamped if larger than the window).`}
                </p>
              </div>
              <div className="text-center mt-4">
                <button className={btnCls} onClick={() => setDisplayOpen(false)}>DONE</button>
              </div>
            </div>
          </div>
        )}

        {/* how to play */}
        {screen === 'title' && howToOpen && (
          <div className={`${isCoarse ? 'fixed' : 'absolute'} inset-0 z-[60] bg-black/85 flex items-center justify-center p-3 sm:p-4`}>
            <div className={`${panelCls} w-full max-w-lg max-h-full overflow-y-auto px-5 py-4`}>
              <div className="flex items-center justify-between border-b-2 border-[#ffd24a]/40 pb-1.5 mb-3">
                <h3 className="font-retro text-[#ffd24a] text-base">HOW TO PLAY</h3>
                <button className={btnCls} onClick={() => setHowToOpen(false)}>✕</button>
              </div>
              <div className="text-base leading-snug space-y-2.5">
                <p><span className="text-[#ffd24a]">The goal.</span> You just moved into a tiny apartment with two boxes to your name. Earn money, buy furniture, and place all of it to make the place a home — that's the ending.</p>
                <p><span className="text-[#ffd24a]">Moving around.</span> {isCoarse ? 'Use the on-screen D-pad to move and the E button to interact; ✕ closes menus.' : 'WASD or arrow keys to move. Press E (or Space) to interact with people, doors, and the glowing spots. Esc closes menus.'} Walk to the edges of an area to reach the rest of the city.</p>
                <p><span className="text-[#ffd24a]">Making money.</span> Fish at the shore (learn how from Genji, the old man on the beach first), work a daily shift at the konbini, mine, or sell things. Sell your catch and goods at the right shops.</p>
                <p><span className="text-[#ffd24a]">Energy &amp; the clock.</span> Actions cost energy (the EN bar). Eat or sleep in your bed to recover. The day has a clock — stay out past 2 AM and you'll collapse and wake up home. Sleeping starts the next day.</p>
                <p><span className="text-[#ffd24a]">Furnishing.</span> Things you buy go into boxes. Open your phone (press <span className="text-[#ffd24a]">P</span>, or tap 📱 PHONE) {isCoarse ? '' : 'any time '}→ the Bag app, then <span className="text-[#ffd24a]">Arrange Room</span> at home to drag furniture wherever you like. Beds, fridges and the like only work once placed. Need more stuff fast? Order it from the <span className="text-[#9a6fe0]">ZamaZonk</span> app — it arrives next morning.</p>
                <p><span className="text-[#ffd24a]">Explore.</span> The city is bigger than it looks — a pawn shop, an arcade district, a nightclub, a shrine, an island, and stranger places below. Talk to everyone. Check the menu for your inventory and achievements.</p>
                <p className="opacity-70">Your progress saves automatically. Pick CONTINUE next time to keep going.</p>
              </div>
              <div className="text-center mt-4">
                <button className={btnCls} onClick={() => setHowToOpen(false)}>GOT IT</button>
              </div>
            </div>
          </div>
        )}

        {/* save management — guarded so a save isn't wiped by a stray click */}
        {screen === 'title' && manageOpen && (
          <div className={`${isCoarse ? 'fixed' : 'absolute'} inset-0 z-[60] bg-black/80 flex items-center justify-center p-3 sm:p-4`}>
            <div className={`${panelCls} w-full max-w-md px-5 py-4`}>
              <div className="flex items-center justify-between border-b-2 border-[#ffd24a]/40 pb-1.5 mb-3">
                <h3 className="font-retro text-[#ffd24a] text-base">SAVE MANAGEMENT</h3>
                <button className={btnCls} onClick={() => { setManageOpen(false); setConfirmMode(null); }}>✕</button>
              </div>

              {saved ? (
                <>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-base mb-4">
                    <span className="opacity-60">Day</span><span className="text-right">{saved.day}</span>
                    <span className="opacity-60">Money</span><span className="text-right">¥{saved.money.toLocaleString()}</span>
                    <span className="opacity-60">Furniture placed</span><span className="text-right">{Object.keys(saved.placed).length}</span>
                    <span className="opacity-60">Achievements</span><span className="text-right">{saved.gameAch.length} / {GAME_ACHIEVEMENTS.length}</span>
                    <span className="opacity-60">Fish caught</span><span className="text-right">{Object.values(saved.fishLog).reduce((a: number, b: number) => a + b, 0)}</span>
                  </div>

                  {confirmMode === 'delete' ? (
                    <div className="text-center">
                      <p className="text-base text-[#e8e0d0]/90 mb-3">Delete your Day {saved.day} save for good? This <span className="text-red-300">cannot be undone</span>.</p>
                      <div className="flex gap-2 justify-center">
                        <button className={btnCls} onClick={() => setConfirmMode(null)}>CANCEL</button>
                        <button className="border border-red-400/60 text-red-300 px-3 py-1 font-pixel text-lg hover:bg-red-500 hover:text-black transition-colors" onClick={wipeSave}>DELETE FOREVER</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <button className="border border-red-400/60 text-red-300 px-3 py-1.5 w-full font-pixel text-lg hover:bg-red-500 hover:text-black transition-colors" onClick={() => setConfirmMode('delete')}>DELETE SAVE</button>
                      <p className="text-sm opacity-60 text-center mt-1">Deleting returns you to the title — start a fresh game from there.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <p className="text-base opacity-70">No save yet — start a new game from the title.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* dialogue */}
        {overlay?.type === 'dialog' && (
          <div className="absolute inset-x-2 bottom-2 cursor-pointer" onClick={advanceDialog}>
            <div className={`${panelCls} px-4 py-2.5`}>
              {overlay.speaker && <p className="text-[#ffd24a] text-base mb-0.5">{overlay.speaker}</p>}
              <p className="text-xl leading-snug">{overlay.lines[overlay.idx]}</p>
              <p className="text-right text-sm opacity-40 mt-1">{overlay.idx + 1}/{overlay.lines.length} · E ▸</p>
            </div>
          </div>
        )}

        {/* shops */}
        {overlay?.type === 'shop' && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center p-2 sm:p-4">
            {renderShop(overlay)}
          </div>
        )}

        {/* story letter */}
        {overlay?.type === 'letter' && (
          <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-2 sm:p-4">
            <div className={`${panelCls} w-full max-w-lg max-h-full overflow-y-auto px-5 py-4 border-[#9fc4e8]/60`}>
              <p className="text-sm text-[#9fc4e8] tracking-widest">— {overlay.beat.from} —</p>
              <h3 className="text-2xl text-[#ffd24a] mb-3">{overlay.beat.title}</h3>
              {overlay.beat.lines.map((line, i) => (
                <p key={i} className="text-lg leading-snug mb-2 opacity-90">{line}</p>
              ))}
              <div className="text-center mt-3">
                <button className={btnCls} onClick={() => setOverlayBoth(null)}>CLOSE</button>
              </div>
            </div>
          </div>
        )}

        {/* sleep / pass-out fade */}
        {overlay?.type === 'sleep' && (
          <div
            className={`absolute inset-0 z-50 bg-black flex flex-col items-center justify-center gap-3 px-6 text-center overflow-hidden ${overlay.awaitClick ? 'cursor-pointer' : ''}`}
            onClick={overlay.awaitClick ? finishSleep : undefined}
          >
            <style>{`
              @keyframes labFadeIn { from{opacity:0} to{opacity:1} }
              @keyframes labRise { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
              @keyframes labThrob { 0%,100%{transform:scale(1);opacity:.85} 50%{transform:scale(1.06);opacity:1} }
              @keyframes labZzz { 0%{opacity:.3;transform:translateY(0)} 50%{opacity:1} 100%{opacity:.3;transform:translateY(-6px)} }
              @keyframes labVignette { from{opacity:0} to{opacity:1} }
              .lab-sleep-vignette{position:absolute;inset:0;animation:labVignette 700ms ease forwards;
                background:radial-gradient(circle at 50% 45%, rgba(0,0,0,0) 30%, rgba(0,0,0,.85) 100%)}
            `}</style>
            {overlay.collapsed ? (
              <>
                <span className="lab-sleep-vignette" style={{ background: 'radial-gradient(circle at 50% 45%, rgba(70,10,10,0.5) 0%, rgba(0,0,0,0.92) 70%)' }} />
                <p className="relative font-retro text-[#e0552e] text-2xl sm:text-4xl tracking-widest" style={{ animation: 'labThrob 1100ms ease-in-out infinite' }}>OUT COLD</p>
                <p className="relative font-pixel text-[#e8e0d0]/70 text-base sm:text-lg max-w-sm" style={{ animation: 'labRise 900ms ease forwards' }}>
                  Energy hit zero. The world goes soft and dark… somehow your feet know the way home.
                </p>
                <button
                  className="relative mt-2 font-pixel text-lg px-6 py-2 bg-[#e0552e] text-black border-2 border-[#e0552e] shadow-[3px_3px_0px_#000] hover:bg-[#f0703e] transition-colors"
                  style={{ animation: 'labRise 900ms ease 400ms both' }}
                  onClick={finishSleep}
                >
                  …come to ▸
                </button>
              </>
            ) : (
              <>
                <span className="lab-sleep-vignette" />
                <p className="relative text-4xl sm:text-5xl" style={{ animation: 'labZzz 1600ms ease-in-out infinite' }} aria-hidden>💤</p>
                <p className="relative font-pixel text-[#e8e0d0]/70 text-base sm:text-lg" style={{ animation: 'labFadeIn 800ms ease forwards' }}>Goodnight.</p>
              </>
            )}
          </div>
        )}

        {/* end-of-day recap */}
        {overlay?.type === 'endday' && (() => {
          const r = overlay.recap;
          const row = (label: string, value: string, tone?: string) => (
            <div className="flex items-center justify-between gap-3 py-1 border-b border-[#ffd24a]/15">
              <span className="opacity-70">{label}</span>
              <span className={`tabular-nums ${tone ?? ''}`}>{value}</span>
            </div>
          );
          return (
            <div className="absolute inset-0 z-50 bg-black/90 flex items-center justify-center p-3 sm:p-4">
              <div className={`${panelCls} w-full max-w-md max-h-full overflow-y-auto px-5 py-4`}>
                <div className="text-center border-b-2 border-[#ffd24a]/40 pb-2 mb-3">
                  <p className="font-pixel text-[#9fc4e8] text-sm">{r.collapsed ? 'you pushed it too far' : 'another day in the big city'}</p>
                  <h3 className="font-retro text-[#ffd24a] text-lg sm:text-2xl leading-relaxed">DAY {r.day} — RECAP</h3>
                </div>
                <div className="font-pixel text-base sm:text-lg">
                  {row('Money', `${r.net >= 0 ? '+' : '−'}¥${Math.abs(r.net).toLocaleString()}`, r.net >= 0 ? 'text-[#3da26b]' : 'text-[#e0552e]')}
                  {row('Fish caught', `${r.fish}`)}
                  {row('Minerals mined', `${r.minerals}`)}
                  {row('Shifts worked', `${r.shifts}`)}
                  <div className="py-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="opacity-70">New furniture</span>
                      <span className="tabular-nums">{r.furniture.length}</span>
                    </div>
                    {r.furniture.length > 0 && (
                      <p className="text-sm text-[#ffd24a]/80 mt-1 leading-snug">
                        {r.furniture.map(id => furnitureById(id).name).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
                {r.collapsed && (
                  <p className="font-pixel text-sm text-[#e0552e]/90 mt-3 text-center">You blacked out before bed — try to wrap up before 2 AM.</p>
                )}
                <div className="text-center mt-4">
                  <button className={`${btnCls} px-8 py-1.5`} onClick={closeEndDay}>START DAY {r.day + 1} ▸</button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* in-game achievement toast (separate from the site system) */}
        {achToast && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
            <div className="animate-toast-in bg-[#16181d]/95 border-2 border-[#ffd24a] px-4 py-2 font-pixel text-center">
              <p className="text-[#ffd24a] text-lg leading-tight">🏆 {achToast.title}</p>
              <p className="text-[#e8e0d0]/70 text-sm leading-tight">{achToast.desc}</p>
            </div>
          </div>
        )}

        {/* phone-message toast — buzzes on a new text; tap to open it in the phone.
            Centering lives on the outer div so it can't fight the toast-in
            transform (that conflict made it jump/glitch, esp. on hover repaint). */}
        {msgToast && (
          <div className={`absolute ${achToast ? 'top-16' : 'top-2'} left-1/2 -translate-x-1/2 z-20 w-[88%] max-w-sm`}>
            <button
              data-nosfx
              onClick={() => openToastMessage(msgToast.id)}
              className="animate-toast-in w-full bg-[#16181d]/95 border-2 border-[#7ce8a0] px-4 py-2 font-pixel text-left hover:bg-[#7ce8a0]/15 transition-colors shadow-[3px_3px_0_#000]"
            >
              <p className="text-[#7ce8a0] text-base leading-tight">📱 {msgToast.from}{msgToast.count > 1 ? ` (+${msgToast.count - 1} more)` : ''}</p>
              <p className="text-[#e8e0d0]/85 text-sm leading-tight truncate">{msgToast.preview}</p>
              <p className="text-[#e8e0d0]/45 text-xs leading-tight mt-0.5">tap to open · or press P</p>
            </button>
          </div>
        )}

        {/* menu: inventory + achievements */}
        {overlay?.type === 'menu' && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2 p-2 sm:p-4">
            {renderMenu(overlay)}
            {/* menu-level control (not a phone app) — lets mouse users close the phone */}
            <button
              data-nosfx
              onClick={() => setOverlayBoth(null)}
              className="font-pixel text-base px-6 py-1.5 border-2 border-red-400/70 text-red-300 bg-black/50 hover:bg-red-500 hover:text-black transition-colors shadow-[3px_3px_0_#000]"
            >
              ✕ CLOSE PHONE
            </button>
          </div>
        )}

        {/* Arrange mode: a transparent pointer surface over the room + a tray.
            Drag boxed items onto the floor; drag placed items to move them, or
            to the bin to box them. The canvas underneath draws the grid+ghost. */}
        {arrangeOpen && screen === 'playing' && (() => {
          void arrangeTick;
          const s = saveRef.current;
          const boxed = [...s.owned, ...s.rares].filter(id => !s.placed[id]);
          const held = heldRef.current;
          return (
            <div
              className="absolute inset-0 z-30 select-none"
              style={{ touchAction: 'none' }}
              onPointerDown={arrangeDown}
              onPointerMove={arrangeMove}
              onPointerUp={arrangeUp}
              onPointerCancel={() => { dragStartRef.current = null; }}
              onContextMenu={e => e.preventDefault()}
            >
              {/* top banner */}
              <div data-zz-ui className="absolute top-0 inset-x-0 flex items-center justify-between gap-2 px-3 py-1.5 bg-black/70 border-b border-[#ffd24a]/30 pointer-events-none">
                <span className="font-pixel text-[#ffd24a] text-sm sm:text-base">🛋 ARRANGE ROOM</span>
                <span className="font-pixel text-[#e8e0d0]/70 text-xs sm:text-sm hidden sm:inline">
                  {held ? 'Drop on a green tile · bin to box it' : 'Drag furniture onto the floor · drag placed items to move'}
                </span>
                <button data-zz-ui data-zz-done className="font-pixel text-sm bg-[#ffd24a] text-black px-3 py-0.5 shadow-[2px_2px_0_#000] pointer-events-auto">DONE</button>
              </div>

              {/* bottom tray of boxed furniture + the bin */}
              <div data-zz-ui className="absolute bottom-0 inset-x-0 flex items-end gap-2 px-3 py-2 bg-black/70 border-t border-[#ffd24a]/30">
                <div className="flex-1 flex gap-2 overflow-x-auto pb-1">
                  {boxed.length === 0
                    ? <span className="font-pixel text-[#e8e0d0]/50 text-sm py-3">No furniture in boxes. Buy some, or order from ZamaZonk.</span>
                    : boxed.map(id => (
                        <div
                          key={id}
                          data-zz-item={id}
                          className={`shrink-0 w-[68px] flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-md border bg-[#16181d]/90 cursor-grab active:cursor-grabbing ${held?.id === id ? 'border-[#7ce8a0] opacity-40' : 'border-[#ffd24a]/40'}`}
                        >
                          <SpriteIcon atlas={atlasRef.current} sprite={furnitureById(id).sprite} size={30} />
                          <span className="font-pixel text-[#e8e0d0] text-[10px] leading-tight text-center line-clamp-1">{furnitureById(id).name}</span>
                        </div>
                      ))}
                </div>
                <div
                  data-zz-trash
                  className={`shrink-0 w-16 h-16 flex flex-col items-center justify-center rounded-md border-2 border-dashed ${held ? 'border-[#e0552e] text-[#e0552e] bg-[#e0552e]/10' : 'border-white/25 text-white/40'}`}
                >
                  <span className="text-2xl leading-none">🗑</span>
                  <span className="font-pixel text-[9px]">box it</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ending */}
        {overlay?.type === 'ending' && (
          <div className="absolute inset-0 bg-black/95 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            <div className="max-w-lg text-center font-pixel">
              <h3 className="font-retro text-[#ffd24a] text-lg sm:text-2xl leading-relaxed mb-5">{ENDING.title}</h3>
              {ENDING.lines.map((line, i) => (
                <p key={i} className="text-[#e8e0d0] text-lg sm:text-xl leading-snug mb-3 opacity-90">{line}</p>
              ))}
              <button className={`${btnCls} mt-2 text-xl`} onClick={finishEnding}>STAY A WHILE</button>
            </div>
          </div>
        )}

        {/* mid-play portrait nudge */}
        {screen === 'playing' && isCoarse && isPortrait && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-[#ffd24a] text-black font-pixel text-xs px-3 py-1.5 rounded-sm shadow-[2px_2px_0_#000] flex items-center gap-1.5 whitespace-nowrap">
            <span aria-hidden>🔄</span> turn sideways
          </div>
        )}

        {/* touch controls */}
        {screen === 'playing' && isCoarse && (
          <>
            <div className="absolute bottom-3 left-3 grid grid-cols-3 gap-1 opacity-80" style={{ touchAction: 'none' }}>
              {([
                [null, 'up', null],
                ['left', null, 'right'],
                [null, 'down', null],
              ] as (Dir | null)[][]).flat().map((d, i) =>
                d ? (
                  <TouchBtn key={i} onHold={down => inputRef.current.setVirtualDir(d, down)}>
                    {d === 'up' ? '▲' : d === 'down' ? '▼' : d === 'left' ? '◀' : '▶'}
                  </TouchBtn>
                ) : <span key={i} className="w-11 h-11" />
              )}
            </div>
            <div className="absolute bottom-3 right-3 flex flex-col items-center gap-2" style={{ touchAction: 'none' }}>
              <TouchBtn small onHold={down => { if (down) inputRef.current.queueCancel(); }}>✕</TouchBtn>
              <TouchBtn big onHold={down => inputRef.current.pressVirtualAction(down)}>E</TouchBtn>
            </div>
          </>
        )}

        {/* scene transitions */}
        {transition && (
          <>
            <style>{`
              @keyframes labStartCover { 0%{opacity:0} 16%{opacity:1} 74%{opacity:1} 100%{opacity:0} }
              @keyframes labStartZoom { 0%{transform:scale(1.18);opacity:0} 26%{transform:scale(1);opacity:1} 72%{opacity:1} 100%{transform:scale(.9);opacity:0} }
              @keyframes labBlink { 0%,100%{opacity:.35} 50%{opacity:1} }
              @keyframes labFreezeBg {
                0%{opacity:0;background:#eaf4ff}
                10%{opacity:1;background:#eaf4ff}
                34%{background:#cfe6ff}
                44%{background:#0c0d10}
                52%{background:#d8c93a}
                86%{opacity:1;background:#d8c93a}
                100%{opacity:0;background:#d8c93a}
              }
              @keyframes labShake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-3px)} 40%{transform:translateX(3px)} 60%{transform:translateX(-2px)} 80%{transform:translateX(2px)} }
              @keyframes labGlitch { 0%,100%{opacity:.9;letter-spacing:.25em} 50%{opacity:.45;letter-spacing:.6em} }
              .lab-transition{position:absolute;inset:0;z-index:60;display:flex;align-items:center;justify-content:center;pointer-events:none;overflow:hidden}
              @keyframes labFadeBlack { 0%{opacity:0} 28%{opacity:1} 72%{opacity:1} 100%{opacity:0} }
              .lab-transition-fade{background:#000;animation:labFadeBlack 1100ms ease-in-out forwards}
              .lab-transition-start{background:#0e1016;animation:labStartCover 1400ms ease-in-out forwards}
              .lab-transition-start .lab-trans-inner{animation:labStartZoom 1400ms ease-in-out forwards}
              .lab-transition-freezer{animation:labFreezeBg 1750ms ease-in-out forwards}
              .lab-transition-freezer .lab-trans-inner{animation:labShake 220ms steps(2) infinite}
              .lab-blink{animation:labBlink 700ms steps(2,end) infinite}
              .lab-glitch{animation:labGlitch 280ms steps(2,end) infinite}
              @keyframes labHackFade { 0%{opacity:0} 3%{opacity:1} 92%{opacity:1} 100%{opacity:0} }
              @keyframes labHackScroll { 0%{transform:translateY(40%)} 100%{transform:translateY(-62%)} }
              @keyframes labHackBar { 0%{width:0%} 20%{width:18%} 45%{width:42%} 70%{width:75%} 90%{width:96%} 100%{width:100%} }
              .lab-transition-hack{background:#04080a;animation:labHackFade 6600ms linear forwards}
              .lab-hack-scroll{animation:labHackScroll 6200ms linear forwards}
              .lab-hack-bar{width:0%;animation:labHackBar 6000ms ease-in-out forwards}
            `}</style>
            <div className={`lab-transition lab-transition-${transition}`}>
              {transition === 'start' ? (
                <div className="lab-trans-inner text-center px-4">
                  <p className="font-retro text-[#ffd24a] text-xl sm:text-3xl leading-relaxed drop-shadow-[2px_2px_0_#000]">LITTLE APARTMENT,</p>
                  <p className="font-retro text-[#ffd24a] text-xl sm:text-3xl leading-relaxed drop-shadow-[2px_2px_0_#000]">BIG CITY</p>
                  <p className="font-pixel text-[#9fc4e8] text-base mt-3 lab-blink">starting…</p>
                </div>
              ) : transition === 'hack' ? (
                <div className="lab-trans-inner absolute inset-0 overflow-hidden bg-[#04080a]">
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(#7cff9a 0 1px, transparent 1px 3px)' }} />
                  <div className="absolute inset-0 px-3 sm:px-8 py-3 font-pixel text-[#7cff9a] text-xs sm:text-base leading-snug text-left">
                    <p className="text-[#7ce8e0] mb-2 lab-glitch tracking-widest">ZAMAZONK://VOID-KERNEL — UNAUTHORIZED GEO-BREACH</p>
                    <div className="lab-hack-scroll">
                      {HACK_LINES.concat(HACK_LINES).map((l, i) => (
                        <p key={i} className={l.startsWith('!') ? 'text-[#e0552e]' : ''}>
                          {l}{i % HACK_LINES.length === HACK_LINES.length - 1 ? <span className="lab-blink"> █</span> : null}
                        </p>
                      ))}
                    </div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 px-3 sm:px-8 py-3 bg-black/70 border-t border-[#7cff9a]/30">
                    <p className="font-pixel text-[#7cff9a] text-sm sm:text-lg lab-glitch">LOADING PARIS.EXE …</p>
                    <div className="mt-1 h-3 border border-[#7cff9a]/60">
                      <div className="h-full bg-[#7cff9a] lab-hack-bar" />
                    </div>
                  </div>
                </div>
              ) : transition === 'freezer' ? (
                <div className="lab-trans-inner text-center px-4">
                  <p className="font-pixel lab-glitch text-3xl sm:text-5xl text-black/80">░ ▒ ▓</p>
                  <p className="font-pixel text-black/70 text-sm sm:text-base mt-2 tracking-[0.3em] text-center">WARPING INTO THE UNKNOWN</p>
                </div>
              ) : null}
            </div>
          </>
        )}
      </div>

      {screen === 'playing' && !isCoarse && (
        <p className="font-pixel text-[#e8e0d0]/40 text-base px-1 py-1">WASD / arrows move · E or Space interact · hold E to reel · P phone · Esc close</p>
      )}
    </div>
  );
};

// ---- small helpers ------------------------------------------------------------

const TouchBtn: React.FC<{ onHold: (down: boolean) => void; small?: boolean; big?: boolean; children: React.ReactNode }> =
  ({ onHold, small, big, children }) => (
    <button
      data-nosfx
      className={`${big ? 'w-16 h-16 text-2xl' : small ? 'w-10 h-10 text-base' : 'w-11 h-11 text-lg'} bg-[#16181d]/80 border-2 border-[#ffd24a]/50 text-[#ffd24a] font-pixel rounded-sm active:bg-[#ffd24a] active:text-black`}
      style={{ touchAction: 'none' }}
      onPointerDown={e => { e.preventDefault(); onHold(true); }}
      onPointerUp={() => onHold(false)}
      onPointerLeave={() => onHold(false)}
      onPointerCancel={() => onHold(false)}
      onContextMenu={e => e.preventDefault()}
    >
      {children}
    </button>
  );

// Draws an atlas sprite (canvas/bitmap) into a small DOM canvas for menus/trays.
const SpriteIcon: React.FC<{ atlas: Atlas | null; sprite: string; size?: number }> = ({ atlas, sprite, size = 30 }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    const img = atlas?.[sprite] as (CanvasImageSource & { width: number; height: number }) | undefined;
    if (!cv || !img) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, cv.width, cv.height);
    const iw = img.width || 16, ih = img.height || 16;
    const sc = Math.min(size / iw, size / ih);
    const dw = iw * sc, dh = ih * sc;
    ctx.drawImage(img, Math.round((size - dw) / 2), Math.round((size - dh) / 2), dw, dh);
  }, [atlas, sprite, size]);
  return <canvas ref={ref} width={size} height={size} style={{ imageRendering: 'pixelated', width: size, height: size }} />;
};

const ShopFrame: React.FC<{
  title: string; subtitle: string; money: number; onClose: () => void;
  panelCls: string; btnCls: string; children: React.ReactNode;
}> = ({ title, subtitle, money, onClose, panelCls, btnCls, children }) => (
  <div className={`${panelCls} w-full max-w-lg max-h-full overflow-y-auto px-4 py-3`}>
    <div className="flex items-start justify-between gap-2 border-b-2 border-[#ffd24a]/40 pb-1.5 mb-1.5">
      <div>
        <h3 className="font-retro text-[#ffd24a] text-sm sm:text-base">{title}</h3>
        <p className="text-sm opacity-60">{subtitle}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[#ffd24a] text-xl">¥{money.toLocaleString()}</p>
        <button className={`${btnCls} text-sm px-2 py-0.5 mt-1`} onClick={onClose}>ESC ✕</button>
      </div>
    </div>
    {children}
  </div>
);

export default LittleApartmentGame;
