// Little Apartment, Big City — main game component.
// World simulation lives in refs and a fixed-timestep loop; React renders the
// HUD and modal overlays (title, dialogue, shops, letters, sleep, ending).

import React, { Fragment, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  TILE, VIEW_PW, VIEW_PH, RR, Input, startLoop, tryMove, unstickDirs, feetTile, facedTile,
  cameraFor, sceneSize, isSolid, tileAt, mulberry32,
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
import { SCENES, SCENE_SIGNS, MANEKI_SLOT, SHELF_SLOT, GREENHOUSE_PLOTS, APARTMENT_BIG_GRID } from './maps';
// The original (small) apartment grid, captured once before any room-expansion
// swap so we can switch back on a fresh game.
const APARTMENT_SMALL_GRID = SCENES.apartment.grid;
// Swap the apartment between the one-room and two-room layouts. Mutates the shared
// SceneDef; sceneSize() then reports the new dims and placement bounds follow.
const applyApartmentSize = (unlocked: boolean) => {
  SCENES.apartment.grid = unlocked ? APARTMENT_BIG_GRID : APARTMENT_SMALL_GRID;
};
// The private home onsen lives at a fixed top-right corner tile of the first room
// (clear of the default futon, maneki, and trophy shelf, and present in both the
// small and expanded grids). Once bought, it's drawn here and gets its own
// interactable injected into the shared SceneDef (mirrors applyApartmentSize).
const HOME_ONSEN_TILE = { x: 13, y: 1 };
const applyHomeOnsen = (present: boolean) => {
  const list = SCENES.apartment.interactables;
  const has = list.some(it => it.id === 'home-onsen');
  if (present && !has) list.push({ id: 'home-onsen', x: HOME_ONSEN_TILE.x, y: HOME_ONSEN_TILE.y, label: 'Private onsen' });
  else if (!present && has) SCENES.apartment.interactables = list.filter(it => it.id !== 'home-onsen');
};
import {
  FISH, FURNITURE, RARE_FURNITURE, VEHICLES, furnitureById, vehicleById, KONBINI_FOOD,
  fishById, rollFish, DEEP_FISH, TROPICAL_FISH, CAST_COST, SHIFT_COST, SHIFT_PAY, STORY_BEATS,
  RODS, rodInfo,
  GACHA_PRICE, GACHA_FIGURES, SKETCHY_BREAK_CHANCE, GAME_ACHIEVEMENTS, GOSSIP,
  MINERALS, mineralById, WAND_PRICE, WAND2_PRICE, CRAWLER_HIT_ENERGY, CRAFT_RECIPES,
  PICKAXES, pickaxeOf, GEODE_HARDNESS, GUN_PRICE, GUN_UNLOCK_FLOOR,
  itemKind, MUSEUM_SLOTS, MUSEUM_FINDS, BINGUS_FETCHES, CROPS, CROP_QUALITY, FORAGE, forageById,
  RECIPES, recipeById, INSTITUTE_RECIPES, GROCERIES, groceryById, BUFFS, FRIENDS, friendById, DECOR, decorById, MAX_HEARTS,
  FORTUNES,
  keepsakeById,
  SHRINE_RESTORE_PRICE, CHARLIE_PATRON_PRICE, HOME_ONSEN_PRICE,
  festivalFor, FESTIVAL_REWARD_YEN,
  fishingTournamentDay, tournamentScore, tournamentTierFor, TOURNAMENT_NAME, TOURNAMENT_BLURB, TOURNAMENT_SCENE, TOURNAMENT_TIERS,
  MISSIONS,
} from './data';
import type { BingusFetch, GiftKind, GiftTier, IngredientKind, DecorItem, StreetEvent, Festival, TournamentTier } from './data';
import type { HangoutScene, HomeVisit } from './data';
import type { StoryBeat, Fish } from './data';
import {
  newSave, loadSave, persistSave, clearSave,
  maxEnergy, energyCost, sleep as passNight, pawnStockFor, buyFurniture, allFurnished,
  allRaresOwned, sketchyOfferFor, gachaComplete,
  clockLabel, nightT, morningT, COLLAPSE_MIN, routineTargetFor,
  placeItem, unplaceItem, unlockGameAch, itemFootprintW,
  mineLayoutFor, mineChallengeFor, enterMineStreak, crackGeode, minedKey, lootVault,
  shrineLuck, syncMessages, unreadCount, donateToMuseum, museumComplete,
  jackpotFor, backroomOpen, BACKROOM_WINS,
  restoreShrine, sponsorCharlie, buyHomeOnsen, homeSoak,
  grantKeepsake, hasKeepsake,
  fulfillDeliveries, zamazonkCatalog, zamazonkPrice, orderZamaZonk, pushMessage,
  isRainyDay, foggyDay, meteorNight, storeClosedToday, dayEventFor, DAY_EVENT_LABEL, type DayEvent, plantCrop, harvestCrop, plotReady, growGreenhouse, shoreForageFor,
  plotStage, waterPlot, clearPlot, applyFertilizer, sellShipping, buySeed, buySprinkler,
  buyFertilizer, expandBeds, upgradeGreenhouse, grantMoonSeed, seedShopFor, activeRequest,
  SPRINKLER_COST, FERTILIZER_COST, BED_COSTS, TIER_COSTS,
  errandFor, errandDoneToday,
  seacaveDrop, seacaveSearchDoneToday, SEACAVE_SEARCH_COST, bigfootInCaveToday,
  deliveryDoneToday, drivePayout, driveAceTime, type DrivePayout,
  canCook, canCookHere, cook, eatDish, learnRecipe, ingredientCount, buyGrocery, keepProduce,
  buffActive, friendHearts, friendPts, canGiftToday, giftTo, giftTier, metFriend, meetFriend,
  friendFlavorLine, allFriendsMet, pendingHangout, pendingHomeVisit, homeVisitFlag,
  buyDecor, applyDecor, ownsDecor, placeRug, removeRugAt, rugAt, RUG_W, RUG_H,
  ROOM_PRICE, JUKEBOX_PRICE, skillLevel, skillProgress, addSkillXp,
  streetEventFor, streetEventDoneToday,
  sanitizeName,
  petCat, catPetToday, catGiftMorning, catGiftFor,
  syncMissions, biteTableFor,
  settleDerbyPrize,
  exportSaveCode, importSaveCode,
} from './state';
import type { OreNode, CrawlerKind } from './state';
import type { GameSave, Vibe, SkillId } from './state';
import { startFishing, updateFishing, ZONE_H } from './fishing';
import type { FishingState } from './fishing';
import { useUiNav } from './useUiNav';

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
const sfxCoin = () => playSfx('/sfx/coin.mp3', 0.3);   // sampled — earnings/pickups (40% quieter than default)
const sfxBuy = () => playSfx('/sfx/buy.mp3');     // sampled (was a blip) — purchases
const sfxCatch = () => blip([659, 880, 1175], 0.09);
const sfxMiss = () => blip([330, 220], 0.12);
const sfxBite = () => blip([1175, 1175], 0.06, 0.07);
const sfxLetter = () => blip([784, 988], 0.12, 0.04);
const sfxType = (i: number) => blip([i % 2 ? 2050 : 1650], 0.012, 0.012); // faint click-clack as dialogue types
const sfxBoop = () => blip([660], 0.05, 0.02); // soft short placement boop (Arrange drop / decor apply)
const sfxPurr = () => blip([196, 175, 196, 175], 0.4, 0.03); // David's low, warbling purr (petting)
// Mining chime — brighter, fuller arpeggio for the rarer (more valuable) ore.
const sfxMine = (value: number) =>
  value >= 900 ? blip([784, 1175, 1568], 0.09, 0.06)
    : value >= 400 ? blip([659, 988, 1319], 0.075, 0.055)
      : blip([880, 1320], 0.06, 0.05);
// AK-67 — a short, dry low-freq crack for each full-auto round.
const sfxGun = () => blip([180, 90], 0.045, 0.06);
// Climbing down a floor — a soft two-step descending tick (nothing dramatic).
const sfxDescend = () => blip([392, 294], 0.07, 0.04);

// ---- Cute driving motor --------------------------------------------------------
// A soft sustained putter whose pitch + volume glide UP as the car accelerates and
// back DOWN when it coasts/idles. Very quiet (present, not annoying). Honors the
// global mute. Driven each frame from the update loop via `engineSet`.
let engine: { osc: OscillatorNode; sub: OscillatorNode; gain: GainNode; filt: BiquadFilterNode } | null = null;
let engineLevel = 0; // smoothed throttle 0..1
const engineStop = () => {
  engineLevel = 0;
  if (!engine || !audioCtx) { engine = null; return; }
  const e = engine; engine = null;
  try {
    e.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.06);
    e.osc.stop(audioCtx.currentTime + 0.25); e.sub.stop(audioCtx.currentTime + 0.25);
  } catch { /* already stopped */ }
};
const engineSet = (target: number, dt: number) => {
  if (readMuted() || target < 0) { engineStop(); return; }
  try {
    audioCtx = audioCtx || new AudioContext();
    const ctx = audioCtx;
    if (!engine) {
      const osc = ctx.createOscillator(); osc.type = 'triangle';
      const sub = ctx.createOscillator(); sub.type = 'sine';
      const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 500;
      const gain = ctx.createGain(); gain.gain.value = 0;
      osc.connect(filt); sub.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
      osc.start(); sub.start();
      engine = { osc, sub, gain, filt };
    }
    engineLevel += (target - engineLevel) * Math.min(1, dt * 4); // smooth glide
    const f = 46 + engineLevel * 64;        // idle putter ~46Hz → ~110Hz at speed
    engine.osc.frequency.setTargetAtTime(f, ctx.currentTime, 0.05);
    engine.sub.frequency.setTargetAtTime(f * 0.5, ctx.currentTime, 0.05);
    engine.filt.frequency.setTargetAtTime(380 + engineLevel * 820, ctx.currentTime, 0.05);
    engine.gain.gain.setTargetAtTime(0.011 + engineLevel * 0.018, ctx.currentTime, 0.05);
  } catch { /* no audio */ }
};

// ---- Ambient soundscape (WebAudio, asset-free) -----------------------------
// Occasional one-shot ambient accents, swapped by scene (gull caws at the coast,
// water drips in the mines, chips + cards at the casino). Driven each frame from
// the draw loop via `ambientSet`.
// NOTE: the old continuous filtered-noise BED was removed from the outdoor kinds —
// it was a long droning layer that muddled the music. The one exception is the
// casino's crowd murmur, which is mixed *barely audible* (the windowless felt-room
// hush; nothing like the old surf drone). Honors mute.
type AmbientKind = 'shore' | 'mine' | 'rainhome' | 'casino';
type AmbientBed = { src: AudioBufferSourceNode; gain: GainNode };
let ambient: { kind: AmbientKind; accent: number; bed?: AmbientBed } | null = null;
// Shared 1s looping noise buffers for the ambient bits: 'brown' (integrated —
// warm rumble for the murmur bed) and 'white' (bright — filtered into the tiny
// chip/card ticks). Built once each, on first use.
const ambNoiseBufs = new Map<string, AudioBuffer>();
const ambNoiseBuf = (ctx: AudioContext, kind: 'brown' | 'white'): AudioBuffer => {
  let buf = ambNoiseBufs.get(kind);
  if (!buf) {
    const len = ctx.sampleRate;
    buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === 'white') d[i] = w;
      else { last = (last + w * 0.02) / 1.02; d[i] = last * 3.5; } // leaky integrator → brown-ish
    }
    ambNoiseBufs.set(kind, buf);
  }
  return buf;
};
// distant gull — two quick downward caws
const sfxGull = () => {
  if (readMuted() || !audioCtx) return;
  try {
    const ctx = audioCtx, t = ctx.currentTime;
    for (const o of [0, 0.17]) {
      const osc = ctx.createOscillator(); osc.type = 'sawtooth';
      const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.frequency.setValueAtTime(1300, t + o);
      osc.frequency.exponentialRampToValueAtTime(820, t + o + 0.12);
      g.gain.setValueAtTime(0.0001, t + o);
      g.gain.linearRampToValueAtTime(0.02, t + o + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + o + 0.13);
      osc.start(t + o); osc.stop(t + o + 0.15);
    }
  } catch { /* no audio */ }
};
// water drip — a short high plip with a quick pitch drop
const sfxDrip = () => {
  if (readMuted() || !audioCtx) return;
  try {
    const ctx = audioCtx, t = ctx.currentTime;
    const osc = ctx.createOscillator(); osc.type = 'sine';
    const g = ctx.createGain();
    osc.connect(g); g.connect(ctx.destination);
    osc.frequency.setValueAtTime(1450, t);
    osc.frequency.exponentialRampToValueAtTime(660, t + 0.07);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.028, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    osc.start(t); osc.stop(t + 0.18);
  } catch { /* no audio */ }
};
// chip clatter — two or three tiny clicky ticks (a stack of chips restacked at the felt)
const sfxChips = () => {
  if (readMuted() || !audioCtx) return;
  try {
    const ctx = audioCtx, t = ctx.currentTime;
    for (const o of [0, 0.07, 0.16]) {
      const src = ctx.createBufferSource(); src.buffer = ambNoiseBuf(ctx, 'white');
      const filt = ctx.createBiquadFilter(); filt.type = 'bandpass';
      filt.frequency.value = 2200 + Math.random() * 600; filt.Q.value = 7;
      const g = ctx.createGain();
      src.connect(filt); filt.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, t + o);
      g.gain.exponentialRampToValueAtTime(0.018, t + o + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, t + o + 0.05);
      src.start(t + o, Math.random()); src.stop(t + o + 0.07);
    }
  } catch { /* no audio */ }
};
// card riffle — a fast decelerating run of very quiet clicks (a deck shuffled somewhere)
const sfxRiffle = () => {
  if (readMuted() || !audioCtx) return;
  try {
    const ctx = audioCtx, t = ctx.currentTime;
    for (let i = 0; i < 9; i++) {
      const o = i * 0.016 + i * i * 0.0018; // ticks spread apart like a real riffle
      const src = ctx.createBufferSource(); src.buffer = ambNoiseBuf(ctx, 'white');
      const filt = ctx.createBiquadFilter(); filt.type = 'highpass'; filt.frequency.value = 3200;
      const g = ctx.createGain();
      src.connect(filt); filt.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, t + o);
      g.gain.exponentialRampToValueAtTime(0.011, t + o + 0.003);
      g.gain.exponentialRampToValueAtTime(0.0001, t + o + 0.03);
      src.start(t + o, Math.random()); src.stop(t + o + 0.05);
    }
  } catch { /* no audio */ }
};
// Kinryū murmur bed: looping low-passed brown noise eased in barely audible —
// the felt-room crowd hush under the music. Returns its nodes so ambientStop
// can fade + kill them when the player steps back out.
const casinoBedStart = (): AmbientBed | undefined => {
  try {
    audioCtx = audioCtx || new AudioContext();
    const ctx = audioCtx;
    const src = ctx.createBufferSource(); src.buffer = ambNoiseBuf(ctx, 'brown'); src.loop = true;
    const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 320;
    const gain = ctx.createGain(); gain.gain.value = 0;
    src.connect(filt); filt.connect(gain); gain.connect(ctx.destination);
    gain.gain.setTargetAtTime(0.012, ctx.currentTime, 0.6); // ease in, barely-there
    src.start();
    return { src, gain };
  } catch { return undefined; }
};
const ambientStop = () => {
  if (ambient?.bed && audioCtx) {
    const { src, gain } = ambient.bed;
    try {
      gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.08);
      src.stop(audioCtx.currentTime + 0.4);
    } catch { /* already stopped */ }
  }
  ambient = null;
};
// Schedule occasional one-shot ambient accents for the scene. `dt` = seconds
// since the last call (clamped by the caller). `shore` (gulls), `mine` (drips)
// and `casino` (chip clatter / card riffles over its murmur bed) have accents;
// everything else is silent.
const ambientSet = (kind: AmbientKind | null, dt: number) => {
  if (readMuted() || !kind || kind === 'rainhome') { ambientStop(); return; }
  if (!ambient || ambient.kind !== kind) {
    ambientStop();
    ambient = { kind, accent: 2.5 + Math.random() * 4 };
    if (kind === 'casino') ambient.bed = casinoBedStart();
    return;
  }
  const a = ambient;
  a.accent -= dt;
  if (a.accent <= 0) {
    if (kind === 'shore') { a.accent = 7 + Math.random() * 10; sfxGull(); }        // sparse gull caws
    else if (kind === 'mine') { a.accent = 4 + Math.random() * 8; sfxDrip(); }     // sparse mine drips
    else { a.accent = 5 + Math.random() * 9; (Math.random() < 0.5 ? sfxChips : sfxRiffle)(); } // soft table sounds
  }
};

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
const sfxLevelUp = () => playSfx('/sfx/level-up.mp3');
const sfxCasinoWin = () => playSfx('/sfx/casino-win.mp3');
const sfxCasinoLose = () => playSfx('/sfx/gamble-lose.mp3', 0.5); // losing a casino bet (blackjack/slots/roulette)
const sfxHeartUp = () => playSfx('/sfx/heart-up.mp3');
const sfxCarStart = () => playSfx('/sfx/car-start.mp3');

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
  backroom: '/music/casino.mp3',  // the VIP room keeps the lounge's soundtrack
  backrooms: '/music/backrooms.mp3',
  mines: '/music/mines.mp3',
  seacave: '/music/mines.mp3',   // reuse the cave theme for the island's hidden sea cave
  gacha: '/music/gacha.mp3',
  island: '/music/island.mp3',
  deepsea: '/music/deep-sea.mp3',
  shrine: '/music/shrine.mp3',
  museum: '/music/museum.mp3',        // "Museum After Hours"
  greenhouse: '/music/greenhouse.mp3', // "Greenhouse Drift"
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
  { scene: 'shrine', label: 'shrine bells' },
  { scene: 'greenhouse', label: 'Greenhouse Drift' },
  { scene: 'museum', label: 'Museum After Hours' },
  { scene: 'island', label: 'Kiwami Island breeze' },
  { scene: 'seacave', label: 'a cave the island forgot' },
  { scene: 'gacha', label: 'Gacha Gacha hall' },
  { scene: 'backrooms', label: 'the yellow hum (???)' },
  { scene: 'paris', label: 'un café à Paris' },
];
const MUSIC_VOL = 0.35;
const MUSIC_FADE_MS = 700;
// Rain ambience layered OVER the scene music on rainy days while outdoors.
const RAIN_SRC = '/music/rain.mp3';
const RAIN_VOL = 0.18; // halved from 0.36 (user: rain was too loud)

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

type ShopId = 'denden' | 'konbini' | 'pawn' | 'garage' | 'monster' | 'sketchy' | 'dj' | 'boat' | 'boat-island' | 'tiki' | 'vending' | 'yakuza' | 'genji'
  | 'casino' | 'blackjack' | 'slots' | 'roulette' | 'granny-fish' | 'errand' | 'bingus-fetch'
  | 'greenhouse-plot' | 'greenhouse-supply' | 'street';

// Vending-machine sodas. You buy a can into your pocket and drink it from the
// bag for energy (Peepis can also be fed to The Manager; a Conk goes to Max).
type Soda = { id: string; name: string; price: number; energy: number; blurb: string };
const SODAS: Soda[] = [
  { id: 'peepis',  name: '"Diet Doctor Peepis"',   price: 150, energy: 12, blurb: 'Legally distinct, the can insists. Pocket it and drink it later for energy.' },
  { id: 'doofert', name: '"Diet Mountain Doofert"', price: 150, energy: 12, blurb: 'EXTREME citrus. Tastes faintly of cleaning product.' },
  { id: 'conk',    name: '"Conk"',                  price: 120, energy: 8,  blurb: "It's a cola. It's just a cola. We're pretty sure." },
  { id: 'bepsi',   name: '"Bepsi"',                 price: 130, energy: 10, blurb: 'The other other cola. Tastes like a trademark dispute.' },
  { id: 'zonked',  name: '"Zonked! Energy Drink"',  price: 250, energy: 25, blurb: 'Wings sold separately. A genuinely irresponsible jolt.' },
];

interface Crawler { x: number; y: number; hp: number; stepT: number; hurtT: number; dir: Dir; kind: CrawlerKind }
// Per-kind tuning: hp = bolts/shots to kill, spd = movement multiplier.
const CRAWLER_HP: Record<CrawlerKind, number> = { normal: 1, fast: 1, tank: 3, gold: 2 };
const CRAWLER_SPD: Record<CrawlerKind, number> = { normal: 1, fast: 1.6, tank: 0.7, gold: 1 };

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
const SLOT_SEVEN = 5; // index of 7️⃣ in SLOT_SYMBOLS — the 50× line AND the progressive trigger
const isTripleSeven = (reels: number[]): boolean => reels.every(n => n === SLOT_SEVEN);
const slotPayout = (reels: number[], bet: number): number => {
  const [a, b, c] = reels;
  if (a === b && b === c) {
    if (a === SLOT_SEVEN) return bet * 50; // 7️⃣ jackpot
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

// Roulette: single-zero (European) wheel, 0..36. Outside bets pay even money
// (returns 2× the stake); a straight-up number pays 35:1 (returns 36×). 0 is
// green and loses every outside bet.
const ROULETTE_RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
type RouletteBet = 'red' | 'black' | 'even' | 'odd' | 'low' | 'high' | 'number';
// Total credit (stake included) for a settled spin; 0 = lose the stake.
const roulettePayout = (kind: RouletteBet, chosen: number, result: number, bet: number): number => {
  if (kind === 'number') return chosen === result ? bet * 36 : 0; // 35:1
  if (result === 0) return 0;                                     // green kills outside bets
  const wins =
    kind === 'red' ? ROULETTE_RED.has(result) :
    kind === 'black' ? !ROULETTE_RED.has(result) :
    kind === 'even' ? result % 2 === 0 :
    kind === 'odd' ? result % 2 === 1 :
    kind === 'low' ? result <= 18 :
    /* high */ result >= 19;
  return wins ? bet * 2 : 0;
};
type RoulettePhase = 'idle' | 'spin' | 'done';
interface RouletteState {
  bet: number; kind: RouletteBet; pick: number; // pick = chosen number for a straight-up bet
  display: number; result: number; phase: RoulettePhase; win: number; timer: number | null;
}
const freshRoulette = (): RouletteState =>
  ({ bet: 500, kind: 'red', pick: 7, display: 0, result: 0, phase: 'idle', win: 0, timer: null });

interface CasinoState { bj: BlackjackState; slot: SlotState; roul: RouletteState }

interface DayRecap {
  day: number;            // the day that just ended
  net: number;            // money change over the day
  fish: number;
  minerals: number;
  shifts: number;
  furniture: string[];    // furniture ids acquired today
  collapsed: boolean;     // ended by passing out
}

// A trailing button on the FINAL line of a dialog (e.g. "🎁 Give a gift").
type DialogAction = { label: string; onPick: () => void };

type Overlay =
  | { type: 'dialog'; lines: string[]; idx: number; speaker?: string; actions?: DialogAction[] }
  | { type: 'shop'; shop: ShopId }
  | { type: 'letter'; beat: StoryBeat }
  | { type: 'sleep'; day: number; collapsed?: boolean; awaitClick?: boolean }
  | { type: 'endday'; recap: DayRecap }
  | { type: 'menu'; tab: PhoneApp; thread?: string }
  // (no 'ending' — the game is endless; furnishing is a quiet milestone instead)
  | { type: 'cook' }                          // home kitchen — cook known recipes
  | { type: 'gift'; npcId: string };          // pick a held item to gift an NPC

type PhoneApp = 'home' | 'inventory' | 'messages' | 'achievements' | 'settings' | 'cheats' | 'zamazonk' | 'journal' | 'friends' | 'music' | 'skills' | 'fishopedia' | 'almanac' | 'recipes';

// Friendly label for each cooking ingredient kind (shown in the recipe list).
const INGREDIENT_LABEL: Record<IngredientKind, string> = {
  fish: 'Fish', crop: 'Crop', coconut: 'Coconut', peepis: 'Peepis', soda: 'Soda', rice: 'Rice', egg: 'Egg', veg: 'Greens',
};

// Map an in-world NPC's interaction id → its FRIENDS id (they differ for a few:
// Genji is the 'old-man', Lulu the 'tiki' bar, The Manager the 'monster', Max the
// shore 'david'). The cat David (FRIENDS id 'david') is handled at his own catRef.
const FRIEND_OF_NPC: Record<string, string> = {
  'old-man': 'genji', 'tiki': 'lulu', 'monster': 'manager', 'david': 'max',
  'granny': 'granny', 'charlie': 'charlie', 'bingus': 'bingus', 'tex': 'tex', 'miko': 'miko',
  'tourist': 'jean',
};

// A home-visit guest reacts to YOUR apartment — picking the most characterful
// thing they can see (the cat first, then a rug, a full room, decor, or bareness).
// Returned as one extra dialog line, slotted in before their parting words.
const homeDecorReaction = (s: GameSave): string => {
  if (s.cat.found) return 'Then a small black cat strolls out, sits, and judges the visitor thoroughly. "...You have a CAT. That explains a great deal, and improves all of it."';
  if (s.rugs.length > 0) return 'They notice the rug and visibly approve. "A rug. A real, proper rug. This is the home of a person who has their life together."';
  const placed = Object.keys(s.placed).length;
  if (placed >= 8) return 'They take in how full and lived-in the place has become. "You\'ve really made this yours. It feels like somebody\'s HOME — not just where they sleep."';
  if (s.decor.wall !== 'wall-default' || s.decor.floor !== 'floor-default') return 'They run a hand along your chosen walls. "Ooh — you decorated. Picked all this yourself? It suits you, you know."';
  if (placed <= 1) return 'They take in the, ah, minimalism. "Cozy! Very... open-plan. A blank canvas. I admire the restraint, honestly."';
  return 'They turn a slow circle, taking it all in. "It\'s a good little place. Warm. It\'s got you all over it."';
};

const TIME_RATE = 3.5; // in-game minutes per real second (~5.5 real min per day)

type FishTable = 'shallow' | 'deep' | 'tropical';
type FishMode =
  | { phase: 'wait'; t: number; tile: Vec; table: FishTable }
  | { phase: 'bite'; t: number; tile: Vec; table: FishTable }
  | { phase: 'reel'; st: FishingState; tile: Vec; table: FishTable };

// ---- Konbini shift minigame: "Register Rush" --------------------------------
// Replaces the old instant time-skip shift. Serve SHIFT_CUSTOMERS customers; each
// is a 3-step QTE: SCAN (press E once per item) → BAG (press ↓) → CHANGE (match
// the arrow prompts in order). Beat the per-customer timer. A wrong key or a
// timeout = fumble: no tip + combo resets, but the shift always finishes (cozy).
// Pay = a base share per clean serve + speed/combo tips, capped at SHIFT_PAY_CAP.
const SHIFT_CUSTOMERS = 6;
const SHIFT_PAY_CAP = 2400;
const SHIFT_DIRS: Dir[] = ['left', 'right', 'up', 'down'];
const ARROW_GLYPH: Record<Dir, string> = { left: '←', right: '→', up: '↑', down: '↓' };
type ShiftPhase = 'scan' | 'bag' | 'change';
interface ShiftCustomer { items: number; scanned: number; change: Dir[]; changeIdx: number }
interface ShiftGame {
  idx: number; phase: ShiftPhase; cust: ShiftCustomer;
  timer: number; maxTimer: number;
  combo: number; served: number; earned: number;
  flash: number; flashGood: boolean; flashText: string;
  lastDir: Dir | null;
}
const makeShiftCustomer = (n: number): ShiftCustomer => {
  const items = Math.min(4, 2 + (n >= 3 ? 1 : 0) + (Math.random() < 0.5 ? 1 : 0));
  const change: Dir[] = [];
  const len = 2 + (n >= 4 ? 1 : 0);
  for (let i = 0; i < len; i++) change.push(SHIFT_DIRS[Math.floor(Math.random() * 4)]);
  return { items, scanned: 0, change, changeIdx: 0 };
};
const shiftTimerFor = (n: number, c: ShiftCustomer): number =>
  Math.max(2.4, c.items * 0.7 + c.change.length * 0.8 + 2.0 - n * 0.25);
const makeShiftGame = (): ShiftGame => {
  const cust = makeShiftCustomer(0);
  const t = shiftTimerFor(0, cust);
  return { idx: 0, phase: 'scan', cust, timer: t, maxTimer: t, combo: 0, served: 0, earned: 0, flash: 0, flashGood: false, flashText: '', lastDir: null };
};

// ---- Club Kaiju karaoke: "Sing for Tips" -----------------------------------
// A karaokeRef ref-mode rhythm minigame (mirrors shiftRef/driveRef): driven in the
// update loop, drawn FULL-SCREEN, freezing world movement. Single lane: notes scroll
// right→left toward a fixed hit-line; tap the action button (Space/Enter via
// consumeInteract) as each note crosses the line. PERFECT/GOOD/MISS + combo, tips
// scale with accuracy.
//
// AUDIO: the song IS the minigame. A dedicated ~28s cut — "Midnight Neon"
// (intro → first chorus, faded right after the hook; the slow verse tail was
// trimmed at user request) — plays from 0:00 while
// the club track is ducked to silence, and the note chart below was generated by
// OFFLINE onset analysis of that exact mp3 (~129 BPM four-on-the-floor; notes sit
// on the real kicks/vocal pushes, with double-hits on the chorus pushes). While
// the song plays, `kg.t` is re-synced from `audio.currentTime` each tick so the
// lane can never drift from the music. A 4-beat metronome count-in runs BEFORE
// the song starts (the only place the tick blips). On finish OR bail the karaoke
// element stops and playMusicFor('nightclub') swells the club track back.
const KARAOKE_TRACK = '/music/karaoke-midnight-neon.mp3';
const KARAOKE_BPM = 129;                          // measured tempo of the cut
const KARAOKE_BEAT = 60 / KARAOKE_BPM;            // seconds per beat (~0.465s)
const KARAOKE_LEAD = 1.9;                         // seconds a note is visible before the hit-line
const KARAOKE_COUNTIN_SEC = 4 * KARAOKE_BEAT;     // 4-beat count-in, then the song starts
const KARAOKE_PERFECT = 0.07;                     // ± timing window (s) for a perfect
const KARAOKE_GOOD = 0.15;                         // ± timing window (s) for a good
// Onset-derived chart (seconds into the mp3): every time was measured from the
// track's own energy flux, quantized to its 8th-note grid — regenerate by re-running
// the analysis if the audio file changes. ~1 note/sec verse pulse; 0.46s double-hits
// on the chorus pushes.
const KARAOKE_CHART: number[] = [
  1.43, 2.36, 3.29, 4.22, 5.15, 6.08, 7.01, 7.94, 8.87, 9.80, 10.73, 11.66, 12.59,
  14.45, 14.92, 15.38, 16.31, 18.64, 20.03, 21.89, 22.36, 22.82, 23.75, 26.07, 27.47,
];
// DDR-style: each note lives in one of four arrow lanes (← ↓ ↑ →) and is hit by
// pressing the MATCHING direction (arrows/WASD/d-pad) as it reaches its receptor.
const KARAOKE_DIRS = ['left', 'down', 'up', 'right'] as const;
type KaraokeDir = typeof KARAOKE_DIRS[number];
interface KaraokeNote { t: number; dir: KaraokeDir; judged: 'none' | 'perfect' | 'good' | 'miss' }
interface KaraokeGame {
  t: number;                                       // seconds since the count-in started
  audioOn: boolean;                                 // the song element has been started
  notes: KaraokeNote[];
  total: number;                                    // notes.length (accuracy base)
  score: number; combo: number; maxCombo: number;
  perfects: number; goods: number; misses: number;
  flash: number; flashText: string; flashKind: 'perfect' | 'good' | 'miss';
  lastBeat: number;                                 // last beat index a metronome tick fired on
  lastDir: Dir | null;                              // edge-detect arrow presses (shift-QTE pattern)
  done: boolean; tips: number; reaction: string;    // results, computed once at song end
}
// Chart times are mp3-relative; game time adds the count-in in front. Lane
// directions come from a FIXED seed (not the day) so the chart is learnable —
// the same song always steps the same way, like a real DDR chart.
const makeKaraokeGame = (): KaraokeGame => {
  const rnd = mulberry32(20260701);
  return {
    t: 0, audioOn: false,
    notes: KARAOKE_CHART.map(t => ({
      t: t + KARAOKE_COUNTIN_SEC,
      dir: KARAOKE_DIRS[Math.floor(rnd() * 4)],
      judged: 'none' as const,
    })),
    total: KARAOKE_CHART.length,
    score: 0, combo: 0, maxCombo: 0, perfects: 0, goods: 0, misses: 0,
    flash: 0, flashText: '', flashKind: 'good', lastBeat: -1, lastDir: null,
    done: false, tips: 0, reaction: '',
  };
};

// ---- Kojima Motors delivery race: "Special Delivery" ------------------------
// A driveRef ref-mode minigame (mirrors shiftRef): driven in the update loop,
// drawn FULL-SCREEN in the draw loop in its own world-space, freezing normal
// world movement. Top-down dirt rally with real momentum + a satisfying drift —
// reach each checkpoint in order, then the delivery point, before the clock.
// The winding course lives in module space so it's never re-allocated; the car +
// particles are mutated in place (no per-frame array/gradient churn in draw).
//
// World units (NOT tile pixels) — every course lives in the same ~1300×1000 space.
// DRIVE_CAM maps world→screen. A track is a centerline polyline (`points`); the dirt
// road is that polyline stroked to `half` width on each side; `checkpoints` are indices
// into `points` you must pass in order (the LAST is the delivery depot ✦). `timeLimit`
// is the run's clock — longer/twistier courses get more seconds so a fair run is always
// reachable. There are several hand-authored layouts and the day picks one (rota), so
// the route legibly changes morning to morning.
interface DriveTrack {
  name: string;
  points: { x: number; y: number }[];
  checkpoints: number[];       // indices into points (in order); last = delivery depot
  timeLimit: number;           // seconds for an on-time delivery on this course
  half: number;                // dirt road half-width (world units); beyond it = grass
  // precomputed minimap bounds (point extents + road shoulder padding)
  bx0: number; by0: number; bx1: number; by1: number;
}
const DRIVE_CP_RADIUS = 74;    // how close you must pass a checkpoint
const DRIVE_CAM = 0.62;        // world→screen zoom
const DRIVE_MAX_DIRT = 305;    // top speed on dirt (world u/s)
const DRIVE_MAX_GRASS = 132;   // grass caps you slow (cozy — off-track just bogs you down)

// Compute the minimap bounds for a course (so each track frames itself), then freeze it.
const buildDriveTrack = (t: Omit<DriveTrack, 'bx0' | 'by0' | 'bx1' | 'by1'>): DriveTrack => {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of t.points) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
  const pad = t.half + 24;
  return { ...t, bx0: x0 - pad, by0: y0 - pad, bx1: x1 + pad, by1: y1 + pad };
};

// The day's rotating course pool — varied in length, winding, width and checkpoint count
// so each one FEELS distinct. All stay inside the shared world space + camera mapping.
const DRIVE_TRACKS: DriveTrack[] = [
  // 1) Riverside Loop — a gentle, flowing single loop on a forgiving wide road.
  buildDriveTrack({
    name: 'Riverside Loop', timeLimit: 56, half: 72,
    points: [
      { x: 200, y: 840 },   // 0 — start / depot gate
      { x: 560, y: 880 },   // 1
      { x: 920, y: 840 },   // 2 ◆
      { x: 1150, y: 660 },  // 3
      { x: 1200, y: 405 },  // 4 ◆
      { x: 1010, y: 215 },  // 5
      { x: 680, y: 190 },   // 6 ◆
      { x: 430, y: 300 },   // 7
      { x: 300, y: 560 },   // 8 ◆
      { x: 470, y: 775 },   // 9
      { x: 720, y: 650 },   // 10 ✦ delivery
    ],
    checkpoints: [2, 4, 6, 8, 10],
  }),
  // 2) Switchback Climb — tight hairpins zig-zagging up a narrow road. Slow + technical.
  buildDriveTrack({
    name: 'Switchback Climb', timeLimit: 74, half: 50,
    points: [
      { x: 230, y: 880 },   // 0 — start
      { x: 230, y: 730 },   // 1
      { x: 1060, y: 710 },  // 2 ◆  (long traverse right)
      { x: 1100, y: 575 },  // 3   hairpin
      { x: 250, y: 555 },   // 4 ◆  (back left)
      { x: 220, y: 420 },   // 5   hairpin
      { x: 1060, y: 400 },  // 6 ◆  (right again)
      { x: 1100, y: 270 },  // 7   hairpin
      { x: 300, y: 250 },   // 8 ◆  (back left)
      { x: 280, y: 150 },   // 9
      { x: 660, y: 165 },   // 10 ✦ delivery (the summit)
    ],
    checkpoints: [2, 4, 6, 8, 10],
  }),
  // 3) Coastal Sweep — a long, wide, FAST run: big rounded straights and high-speed sweepers.
  buildDriveTrack({
    name: 'Coastal Sweep', timeLimit: 62, half: 84,
    points: [
      { x: 200, y: 820 },   // 0 — start
      { x: 700, y: 870 },   // 1   bottom straight
      { x: 1180, y: 830 },  // 2 ◆
      { x: 1235, y: 500 },  // 3   right sweeper
      { x: 1180, y: 200 },  // 4 ◆
      { x: 700, y: 150 },   // 5   top straight
      { x: 230, y: 215 },   // 6 ◆  top-left sweeper
      { x: 175, y: 510 },   // 7
      { x: 360, y: 720 },   // 8
      { x: 760, y: 555 },   // 9 ✦ delivery (sweep into the bay)
    ],
    checkpoints: [2, 4, 6, 9],
  }),
  // 4) Harbor Figure-8 — a technical crossing course: two looping lobes that overlap at center.
  buildDriveTrack({
    name: 'Harbor Figure-8', timeLimit: 67, half: 58,
    points: [
      { x: 700, y: 490 },   // 0 — start (center, heading into the left lobe)
      { x: 470, y: 430 },   // 1
      { x: 300, y: 520 },   // 2 ◆
      { x: 320, y: 710 },   // 3
      { x: 520, y: 740 },   // 4 ◆
      { x: 680, y: 560 },   // 5   crossing toward center
      { x: 820, y: 420 },   // 6 ◆  (crossed to the right lobe)
      { x: 1050, y: 360 },  // 7
      { x: 1180, y: 520 },  // 8 ◆
      { x: 1080, y: 690 },  // 9
      { x: 860, y: 690 },   // 10 ◆
      { x: 560, y: 620 },   // 11 ✦ delivery (back through center)
    ],
    checkpoints: [2, 4, 6, 8, 10, 11],
  }),
];

// Pick the day's course — seeded by `day` (mulberry32, like the other daily rolls) so it
// rotates morning to morning but is stable across reloads/retries within the same day.
const selectDriveTrack = (day: number): DriveTrack =>
  DRIVE_TRACKS[Math.floor(mulberry32(day * 2654435761 + 137)() * DRIVE_TRACKS.length)];

interface DriveParticle { x: number; y: number; vx: number; vy: number; life: number; max: number; r: number; c?: string }
interface DriveGame {
  track: DriveTrack;           // the day's selected course (points/checkpoints/limit/half)
  x: number; y: number;        // car position (world)
  vx: number; vy: number;      // velocity (world u/s)
  angle: number;               // heading (radians; 0 = +x)
  cp: number;                  // next index into track.checkpoints
  count: number;               // 3-2-1-GO countdown (s); racing starts at ≤0 (clock held till then)
  elapsed: number;             // run time (s)
  grassT: number;              // seconds off the dirt (the clean-driving penalty)
  onGrass: boolean;            // off-track this frame?
  drift: number;               // |lateral speed| (for skid/dust + speed-line cues)
  done: boolean;               // delivered — celebration phase runs, then the ref is nulled
  doneT: number;               // celebration timer (confetti + payout breakdown, then dialog)
  pay: DrivePayout | null;     // settled payout (drawn as the finish breakdown)
  isBest: boolean;             // this run set a new daily best (finish banner)
  best: number;                // daily best at run start (HUD compare)
  flash: number;               // checkpoint-pass flash
  emit: number;                // dust emit countdown
  dust: DriveParticle[];       // tyre dust (capped, mutated in place)
  confetti: DriveParticle[];   // finish confetti (spawned once at delivery, world-space)
  skids: { x: number; y: number }[]; // drift skid-marks on the dirt (capped)
  camX: number; camY: number;  // smoothed camera (world)
}
const makeDriveGame = (best: number, track: DriveTrack): DriveGame => {
  const a = track.points[0], b = track.points[1];
  return {
    track,
    x: a.x, y: a.y, vx: 0, vy: 0,
    angle: Math.atan2(b.y - a.y, b.x - a.x),
    cp: 0, count: 3, elapsed: 0, grassT: 0, onGrass: false, drift: 0,
    done: false, doneT: 0, pay: null, isBest: false,
    best, flash: 0, emit: 0, dust: [], confetti: [], skids: [], camX: a.x, camY: a.y,
  };
};
// Squared distance from point to segment — no allocation (hot path).
const distToSeg2 = (px: number, py: number, ax: number, ay: number, bx: number, by: number): number => {
  const dx = bx - ax, dy = by - ay;
  const len2 = dx * dx + dy * dy || 1;
  let t = ((px - ax) * dx + (py - ay) * dy) / len2;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const cx = ax + t * dx, cy = ay + t * dy;
  const ex = px - cx, ey = py - cy;
  return ex * ex + ey * ey;
};
// Nearest distance from the car to the dirt centerline polyline (world units).
const driveTrackDist = (x: number, y: number, points: { x: number; y: number }[]): number => {
  let best = Infinity;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i], b = points[i + 1];
    const d2 = distToSeg2(x, y, a.x, a.y, b.x, b.y);
    if (d2 < best) best = d2;
  }
  return Math.sqrt(best);
};

interface Projectile { x: number; y: number; dx: number; dy: number; t: number; pierce?: boolean; dmg?: number; gun?: boolean }

interface Hud {
  money: number; day: number; time: string; energy: number; max: number;
  sceneName: string; fish: number; ownedCount: number;
  late: boolean; // past midnight — 2 AM collapse looms
  unread: number; // unread phone messages (badge on the 📱 button)
  event: DayEvent; // today's special day ('market' / 'lucky' / null) — HUD chip
  buff: { emoji: string; name: string; tag: string } | null; // active food buff today — HUD chip
  weather: { emoji: string; label: string; title: string } | null; // today's weather / sky event — HUD chip
}

// Every named character has a voice: several line-sets, picked at random per
// chat, plus state-aware lines layered in by getNpcTalk().
const NPC_VOICES: Record<string, { speaker: string; sets: string[][] }> = {
  charlie: {
    speaker: 'Charlie',
    sets: [
      ['Oh hey, {name} — Charlie. Don\'t mind the camera, I film basically everything. The city\'s got this golden-hour thing at like 4pm, it\'s unreal.', 'konbini\'s always hiring if you\'re short on cash. tell \'em I sent you. or don\'t, that\'s also a vibe.'],
      ['I wrote a song about the vending machine outside your building. Three chords. Two of them are the same chord. It SLAPS though.', 'pawn shop flips fresh stuff every morning — I got a tambourine there once. Best ¥400 I ever spent.'],
      ['So I\'m filming a documentary about the pigeons in this district. Working title: "Coo." ...That\'s it, that\'s the whole title. I think it\'s funny.'],
      ['You ever notice the streetlights buzz in, like, B-flat? Drove me nuts till I tuned the guitar to it. Now we jam. Me and the streetlight.'],
    ],
  },
  granny: {
    speaker: 'Granny Sato',
    sets: [
      ['How is my greenhouse treating you? Keep those sprinklers on and something will always be growing.', 'A plot of soil and a little patience. That is most of happiness, I find.'],
      ['Nakatomi Apartments? I have lived there forty years. Thin walls, good light.', 'A home is not bought in a day, {name}. It is bought one small thing at a time.'],
      ['The man at the pawn shop was a jazz pianist, you know. Ask him about it. Watch his face.'],
      ['Downtown used to be even louder, if you can believe it. The club is still there. So is everything else, in its way.'],
    ],
  },
  'old-man': {
    speaker: 'Genji',
    sets: [
      ['Hold steady when the fish runs deep, {name}. Let the little ones tire themselves out.'],
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
      ['Yeah, {name}? Counter is there. Car runs, boat floats. That is the whole pitch.'],
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
      ['Welcome to Club Kaiju, {name}. Highball is ¥500. The bowtie is non-negotiable.'],
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
      ['Ah! Bonjour, {name}! You also find ze... immersive exhibition? Magnifique. Very conceptual. Very yellow.', 'Ze guidebook said "authentic local konbini experience". Five stars. I have been here three days.'],
      ['I ask ze big monsieur for directions. He is very polite. He sells me a table that whispers. C\'est la vie.'],
      ['Do not worry for me! In France we also have liminal spaces. We call them "Charles de Gaulle Airport".'],
    ],
  },
  miko: {
    speaker: 'Yoshi',
    sets: [
      ['Welcome to the shrine. I am Yoshi — I keep it. Bow twice, clap twice, wish once. The order matters more than people think.'],
      ['The kami here is small but diligent. Fond of fishermen, crows, and exact change.'],
      ['I sweep the same leaves every morning. The tree drops them again every night. We have an understanding.'],
      ['People come up the steps in such a hurry. The kami has waited four hundred years. It can wait for you to catch your breath.'],
      ['A coin in the box is not a transaction. It is a hello. The luck that follows is the kami being polite back.'],
      ['You smell of the city, {name} — neon, fried things, hurry. Stand here a moment. Let the cedar have a turn.'],
      ['The komainu? One has its mouth open, one closed. Beginning and end. They have been arguing the middle for centuries.'],
      ['I drew my own fortune this morning. "Small blessing." It is always "small blessing." I have made my peace with small.'],
      ['When it rains I do not mind. The kami likes the sound on the roof, and so, it turns out, do I.'],
      ['Do not wish for everything at once. The kami is small. Give it one wish it can actually carry.'],
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
    case 'charlie':
      return s.hat ? ['Whoa — the cowboy hat. Hold that pose, that\'s a SHOT. ...Okay I didn\'t actually film it, but spiritually I did.'] : [];
    default:
      return [];
  }
};

// ---- dialogue portraits -----------------------------------------------------
// Stardew-style speaker portraits, drawn entirely in-code with 2D ops (NO PNG,
// NO sprites.ts dependency — fully self-contained so we can swap to a generated
// PNG later). A registry maps a dialog `speaker` string to a draw function that
// paints onto a 64×64 canvas; the panel only renders when the speaker is mapped.
type PortraitDraw = (ctx: CanvasRenderingContext2D, S: number) => void;

// Granny Sato: silver bun, round gold glasses, kind elderly face. Palette spirit
// matches the on-map `npc-granny` sprite (silver hair, warm skin, plum kimono).
const drawGrannyPortrait: PortraitDraw = (ctx, S) => {
  // Work on a 16×16 logical grid scaled up to S, so blocks land on clean pixels.
  const u = S / 16;
  const px = (x: number, y: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x * u), Math.round(y * u), Math.ceil(w * u), Math.ceil(h * u));
  };
  // warm backdrop
  px(0, 0, 16, 16, '#2a2230');
  px(0, 12, 16, 4, '#3a2f3e');
  // plum kimono shoulders
  px(2, 13, 12, 3, '#6e3a64');
  px(3, 12, 10, 2, '#7d4673');
  px(7, 13, 2, 3, '#c9b06a'); // collar knot
  // silver hair (bun + sides)
  px(3, 1, 10, 4, '#cfcad6');
  px(2, 3, 12, 5, '#cfcad6');
  px(6, 0, 4, 2, '#e4e0ea'); // bun highlight
  px(6, 0, 4, 1, '#bdb7c6');
  // face
  px(4, 4, 8, 7, '#e8c4a0');
  px(4, 10, 8, 1, '#d9b48f'); // chin shade
  // rosy cheeks
  px(4, 8, 1, 2, '#dd9b86');
  px(11, 8, 1, 2, '#dd9b86');
  // round gold glasses
  px(4, 6, 3, 3, '#caa23a');
  px(9, 6, 3, 3, '#caa23a');
  px(5, 7, 1, 1, '#3a2b1a'); // eye L
  px(10, 7, 1, 1, '#3a2b1a'); // eye R
  px(7, 7, 2, 1, '#caa23a'); // bridge
  // gentle smile + nose
  px(7, 9, 1, 1, '#c98f72');
  px(6, 10, 4, 1, '#b06a55');
};

const PORTRAITS: Record<string, PortraitDraw> = {
  'Granny Sato': drawGrannyPortrait, // fallback if the PNG is ever missing
};

// Generated/authored portrait PNGs (preferred over the in-code draw above).
// These already include their own frame + name label, so the dialog box skips
// its panel frame and speaker caption when one is shown.
const PORTRAIT_IMAGES: Record<string, string> = {
  'Granny Sato': '/images/portraits/granny-soto.png',
  'Genji': '/images/portraits/genji.jpeg',
  'The Manager': '/images/portraits/the-manager.jpeg',
  'Jean-Pierre': '/images/portraits/jean-pierre.jpeg',
  'Jean-Pierre (tourist)': '/images/portraits/jean-pierre.jpeg',
  'Yoshi': '/images/portraits/yoshi.jpeg',
  'Charlie': '/images/portraits/charlie.jpeg',
  // The wise talking cat is named David (the shore vampire was renamed Max so the
  // cat can own the name). His dialogs use speaker 'David' → this portrait.
  'David': '/images/portraits/david.jpeg',
};

// David the cat is ancient and wise. He dispenses unsettlingly calm aphorisms.
const WISE_CAT_LINES: string[][] = [
  ['David the cat watches you with eyes like old coins. "You rush. The city does not. Consider which of you is mistaken."'],
  ['"I have had nine lives, and forgotten eight," David says, washing a paw. "The trick is to waste the ninth beautifully."'],
  ['"You keep score in yen," he muses. "I keep score in warm patches of sun. One of us is wealthier."'],
  ['David yawns enormously. "Everything you are chasing is, statistically, a piece of string. I would know."'],
  ['"The yellow place behind the cold door," David says, not blinking. "Do not stare into it too long. It stares at the same speed you do."'],
  ['"Feed me, and I will tell you a secret," David says. He will not tell you the secret. This too is a lesson.'],
  ['"A closed door is only a wall that has not given up," he purrs. "Be patient. Or be a cat."'],
];

// Renders a registered speaker portrait into an inline pixel-art canvas. Returns
// null (no panel) when the speaker has no portrait registered.
const DialogPortrait: React.FC<{ speaker: string }> = ({ speaker }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = PORTRAITS[speaker];
  useEffect(() => {
    const el = ref.current;
    if (!el || !draw) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, el.width, el.height);
    draw(ctx, el.width);
  }, [draw, speaker]);
  if (!draw) return null;
  return (
    <canvas
      ref={ref}
      width={64}
      height={64}
      className="w-20 h-20 sm:w-24 sm:h-24"
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

const PLAYER_SPEED = 72; // px/s

// Club patrons that dance/bob in place and bust the occasional move across the
// floor. Treated as wanderers (live positions), plus a draw-time bob.
const DANCER_IDS = new Set(['dancer', 'dancer2', 'dancer3', 'dancer4']);
// NPCs that gently pace around their home tile instead of standing still.
// Outdoor folk all amble about (interaction follows their live position). A few
// stay put on purpose: the yakuza block the alley, David tends his campfire, the
// Paris baguette vendor mans a stall, the dealer works his corner, the cat sits.
const WANDER_IDS = new Set([
  'granny', 'tex', 'charlie', 'old-man', 'miko', ...DANCER_IDS,
  // Routine folk who amble their venue (see ROUTINES in state.ts). Dialog/shops are
  // keyed by id + resolved from the live wanderer position, so movement is safe.
  'kaiju', 'mechanic', 'bingus', 'tiki', 'casino-host', 'collector',
]);
// NPCs (David the vampire + his campfire) that only appear on even-numbered nights.
const NIGHT_EVEN_IDS = new Set(['david', 'campfire']);
const davidActive = (s: GameSave): boolean => s.day % 2 === 0 && nightT(s) > 0.45;
// The midnight stranger haunts the city only in the small hours (10 PM → the 2 AM collapse).
const MIDNIGHT_IDS = new Set(['stranger']);
const strangerActive = (s: GameSave): boolean => s.timeMin >= 22 * 60;
// True if a time-gated NPC is currently hidden (not drawn, not solid, not interactive).
// Bigfoot is doubly gated: he only resolves in the island cave on a rare luck-blessed
// day (and only until met), and only shows at Club Kaiju once you HAVE met him.
const npcHiddenNow = (s: GameSave, id: string): boolean =>
  (NIGHT_EVEN_IDS.has(id) && !davidActive(s)) || (MIDNIGHT_IDS.has(id) && !strangerActive(s))
  || (id === 'bigfoot-cave' && !bigfootInCaveToday(s))
  || (id === 'bigfoot-club' && !s.storySeen.includes('bigfoot-met'));

// ---- Bingus museum fetch-quest helpers --------------------------------------
const bingusHasKind = (s: GameSave, kind: BingusFetch['kind']): boolean =>
  kind === 'peepis' ? s.peepis > 0 :
  kind === 'soda' ? Object.values(s.sodas).some(n => n > 0) :
  kind === 'fish' ? s.fishInv.length > 0 :
  kind === 'coconut' ? s.coconuts > 0 :
  Object.values(s.minerals).some(n => n > 0);
const bingusPending = (s: GameSave, f: BingusFetch): boolean =>
  !s.collectibles.includes(f.slot) && !s.museum.donated.includes(f.slot);
const bingusHeldFetch = (s: GameSave): BingusFetch | null =>
  BINGUS_FETCHES.find(f => bingusPending(s, f) && bingusHasKind(s, f.kind)) ?? null;
const bingusNextAsk = (s: GameSave): BingusFetch | null =>
  BINGUS_FETCHES.find(f => bingusPending(s, f)) ?? null;
// ---- Daily street-event presentation ----------------------------------------
// The shop-frame copy for each event (the actual effects live in runStreetEvent).
const STREET_UI: Record<string, { title: string; subtitle: string; body: string; action: string; no: string; priceLabel: string }> = {
  'ramen-yatai': {
    title: 'RAMEN YATAI', subtitle: 'A traveling cart, red lantern swinging',
    body: 'A little ramen cart has pulled up on the corner, steam curling from under a red awning. "One bowl left of today\'s special, friend — tonkotsu, soft egg, the works. Care to warm up?"',
    action: 'BUY THE SPECIAL', no: 'MAYBE LATER', priceLabel: "Tonight's special —",
  },
  'magician': {
    title: 'STREET MAGICIAN', subtitle: 'Top hat, suspiciously empty sleeves',
    body: 'A magician in a worn tailcoat fans a deck of cards with a flourish. "You there! Care to witness something that should not be possible? No charge — only your astonishment."',
    action: 'WATCH THE TRICK', no: 'NOT NOW', priceLabel: '',
  },
  'claw-machine': {
    title: 'CLAW MACHINE', subtitle: 'Glowing, humming, hungry for coins',
    body: 'A coin-op claw machine has appeared on the sidewalk, crammed with plush toys and the odd cold can. The claw looks weak and the prizes look heavy. You know exactly how this ends. You want to play anyway.',
    action: 'PLAY', no: 'WALK PAST', priceLabel: 'One go —',
  },
  'takoyaki': {
    title: 'TAKOYAKI STALL', subtitle: 'Festival lights, a sizzling griddle',
    body: 'A pop-up stall is flipping takoyaki on a cast-iron griddle, the air thick with sauce and dancing bonito. "Fresh batch coming off now! Octopus heaven, eight to a tray — eat \'em quick!"',
    action: 'BUY A TRAY', no: 'JUST LOOKING', priceLabel: 'A fresh tray —',
  },
  'fortune': {
    title: 'FORTUNE TELLER', subtitle: 'A small table, a single candle',
    body: 'A fortune teller sits beneath a paper lantern, cards laid on a velvet cloth. She does not look up. "You have questions you have not said aloud. Sit. The cards are patient. I am not."',
    action: 'HAVE MY FORTUNE READ', no: 'NOT TODAY', priceLabel: 'A reading —',
  },
  'lost-ferret': {
    title: 'LOST FERRET', subtitle: 'Something is loose in the grass',
    body: 'A long cream-and-brown ferret is zipping through the grass, a tiny leash trailing, clearly having the time of its life. Nearby, a worried voice keeps calling a name. Help catch the little fugitive?',
    action: 'HELP CATCH IT', no: 'LEAVE IT BE', priceLabel: '',
  },
};
// What the event actor says if you come back after finishing it today.
const streetEventDoneLines = (id: string): string[] => {
  switch (id) {
    case 'ramen-yatai': return ['The yatai chef wipes the counter and grins. "Sold clean out of the special, friend. Roll back through tomorrow."'];
    case 'magician': return ['The magician tips his hat. "One wonder per customer per day — house rules. Magician\'s honour."'];
    case 'claw-machine': return ['The claw machine hums to itself, smug and well-fed. You\'ve given it quite enough for one day.'];
    case 'takoyaki': return ['"All out of batter — sorry, sorry!" The stall-keeper bows. "Fresh round tomorrow, come hungry!"'];
    case 'fortune': return ['The fortune teller shakes her head, eyes shut. "The cards have said their piece for today. Return when the sun has turned."'];
    case 'lost-ferret': return ['The ferret is home safe in its owner\'s coat now, watching you over her arm with two bright little eyes.'];
    default: return ['Nothing more to do here today.'];
  }
};

// walkPhase = this NPC's own accumulated stride time (drives the 2-frame walk +
// bob independent of a shared clock); stuck = consecutive fully-blocked attempts,
// so a wanderer walled off from its target gives up and idles instead of grinding.
type Wanderer = { id: string; sprite: string; x: number; y: number; homeX: number; homeY: number; dir: Dir; moving: boolean; stepT: number; walkPhase: number; stuck: number };
const makeWanderers = (scene: SceneDef): Wanderer[] =>
  scene.npcs.filter(n => WANDER_IDS.has(n.id)).map(n => ({
    id: n.id, sprite: n.sprite, x: n.x * TILE, y: n.y * TILE, homeX: n.x * TILE, homeY: n.y * TILE, dir: n.dir, moving: false, stepT: Math.random() * 1.5, walkPhase: 0, stuck: 0,
  }));

// ---- Festival staging (transient — never baked into maps.ts) ----------------
// On a festival day (festivalFor(day) ≠ null) the festival's outdoor scene gets
// dressed up dynamically: lantern bunting across the top, a yatai stall + nobori
// banner, the tappable minigame prop, and a couple of gathered festival-goers.
// All tiles below are open, walkable ground in the matching scene, so the props
// overlay the floor without blocking movement (the player can stand on `prop`
// and press interact to play). Keyed by scene id; the active festival's `scene`
// decides which entry is used.
// `bunting` = the world-space lantern string: swagged between fromX..toX (tiles)
// at yPx (world px) — it hangs IN the scene and parallaxes with the camera (the
// first pass pinned it to the top of the SCREEN, which read as UI, not a festival).
// `groundPx` = where the bunting's bamboo end-poles are planted (world px, the
// visual base of the poles) — the string has to be HELD UP by something or the
// lantern chain reads as floating in mid-air.
interface FestivalLayout { stall: Vec; banner: Vec; prop: Vec; goers: { x: number; y: number; sprite: string; dir: Dir }[]; bunting: { fromX: number; toX: number; yPx: number; groundPx: number } }
const FESTIVAL_LAYOUT: Record<string, FestivalLayout> = {
  city: {
    // West of the torii garden, clear of granny's anchor (12,16) and the midnight
    // stranger's spot (19,16) so the festival never squats on an NPC tile.
    stall: { x: 10, y: 15 }, banner: { x: 8, y: 15 }, prop: { x: 13, y: 15 },
    goers: [{ x: 9, y: 16, sprite: 'npc-tourist', dir: 'down' }, { x: 14, y: 16, sprite: 'npc-charlie', dir: 'left' }],
    bunting: { fromX: 7, toX: 16, yPx: 14 * TILE - 10, groundPx: 16 * TILE + 10 },
  },
  shrine: {
    stall: { x: 4, y: 6 }, banner: { x: 15, y: 6 }, prop: { x: 12, y: 6 },
    goers: [{ x: 6, y: 8, sprite: 'npc-tourist', dir: 'right' }, { x: 14, y: 8, sprite: 'npc-miko', dir: 'left' }],
    bunting: { fromX: 3, toX: 16, yPx: 5 * TILE - 8, groundPx: 8 * TILE + 8 },
  },
};
// The minigame prop sprite: a goldfish tub for kingyo-sukui, otherwise the
// tanabata bamboo (which doubles as the omikuji fortune rack at hatsumode).
const festivalPropSprite = (f: Festival): string => f.minigame === 'goldfish' ? 't-fest-goldfish' : 't-fest-tanabata';

// ---- Fishing-derby staging (transient — never baked into maps.ts) -----------
// On a derby day (fishingTournamentDay(day)) the shore fills with townsfolk
// casting elbow-to-elbow along the wet-sand waterline. They're purely decorative
// (drawn statically, non-blocking — the player walks right past), reusing the
// existing npc-* atlas keys like the festival's gathered goers. All tiles are on
// open sand so nothing overlaps a solid. A chalkboard-style derby sign is drawn
// in world space near Genji's skiff to set the scene.
const DERBY_FISHERS: { x: number; y: number; sprite: string }[] = [
  { x: 3,  y: 8, sprite: 'npc-granny' },
  { x: 7,  y: 7, sprite: 'npc-charlie' },
  { x: 11, y: 8, sprite: 'npc-tourist' },
  { x: 16, y: 7, sprite: 'npc-kid' },
  { x: 20, y: 8, sprite: 'npc-collector' },
  { x: 9,  y: 9, sprite: 'npc-stranger' },
];
const DERBY_SIGN: Vec = { x: 6, y: 5 }; // chalkboard by the waterline, near Genji

// ---- Casino patrons (transient — never baked into maps.ts) ------------------
// The Kinryū Lounge seats 2-3 gamblers a day: decorative townsfolk parked at the
// slot banks / tables (reusing existing npc-* atlas keys, like the derby fishers),
// each with a one-line brush-off if you bug them mid-streak. Seeded per `day`
// (mulberry32, like the other daily rolls) so the crowd reshuffles each morning
// but stays put across re-entries. All spots are open carpet facing a machine or
// table; non-blocking (the player walks right past). Drawn y-sorted with a
// draw-time idle sway so they read as alive without wanderer state.
type CasinoGambler = { x: number; y: number; dir: Dir; sprite: string; line: string };
const CASINO_GAMBLER_SPOTS: { x: number; y: number; dir: Dir }[] = [
  { x: 2,  y: 2, dir: 'up' },  // top slot bank, west
  { x: 7,  y: 2, dir: 'up' },  // top slot bank, centre
  { x: 13, y: 2, dir: 'up' },  // top slot bank, east
  { x: 4,  y: 4, dir: 'up' },  // west blackjack table
  { x: 10, y: 4, dir: 'up' },  // east blackjack table
  { x: 8,  y: 6, dir: 'up' },  // roulette felt
  { x: 1,  y: 7, dir: 'up' },  // lower slot bank, west
  { x: 11, y: 7, dir: 'up' },  // lower slot bank, east
];
const GAMBLER_SPRITES = ['npc-sketchy', 'npc-tourist', 'npc-oldman', 'npc-dancer', 'npc-collector'];
const GAMBLER_LINES = [
  '"Don\'t talk to me. I\'m on a heater."',
  '"Three more spins. Three more spins and I\'m done, I swear."',
  '"The machine by the door pays out. I can feel it. It knows me."',
  '"I came in for the free tea. That was four hours ago."',
  '"Shh — you\'ll scare the luck off."',
  '"This table owes me money. We have an understanding."',
];
let casinoGamblersCache: { day: number; list: CasinoGambler[] } | null = null;
const casinoGamblersFor = (day: number): CasinoGambler[] => {
  if (casinoGamblersCache?.day === day) return casinoGamblersCache.list;
  const rnd = mulberry32(day * 1664525 + 13);
  const spots = [...CASINO_GAMBLER_SPOTS], sprites = [...GAMBLER_SPRITES], lines = [...GAMBLER_LINES];
  const n = 2 + (rnd() < 0.5 ? 1 : 0);
  const list: CasinoGambler[] = [];
  for (let i = 0; i < n; i++) list.push({
    ...spots.splice(Math.floor(rnd() * spots.length), 1)[0],
    sprite: sprites.splice(Math.floor(rnd() * sprites.length), 1)[0],
    line: lines.splice(Math.floor(rnd() * lines.length), 1)[0],
  });
  casinoGamblersCache = { day, list };
  return list;
};

const LittleApartmentGame: React.FC = () => {
  // Active input device (pointer/keyboard/gamepad) + controller/keyboard menu nav.
  const inputSource = useUiNav();
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
  // Dialogue typewriter: how many chars of the current dialog line are revealed.
  // Mirrored into a ref so the keyboard/click advance path can read it synchronously.
  const [typed, setTyped] = useState(0);
  const typedRef = useRef(0);
  const [hud, setHud] = useState<Hud>({ money: 0, day: 1, time: '', energy: 0, max: 100, sceneName: '', fish: 0, ownedCount: 0, late: false, unread: 0, event: null, buff: null, weather: null });
  const [shopTick, setShopTick] = useState(0); // re-render shop lists after purchases
  const casinoRef = useRef<CasinoState>({ bj: freshBlackjack(), slot: freshSlots(), roul: freshRoulette() }); // live casino game state
  // Stop the slot reels / roulette wheel spinning if the player leaves the overlay (Esc, etc.).
  useEffect(() => {
    const { slot, roul } = casinoRef.current;
    const onSlots = overlay?.type === 'shop' && overlay.shop === 'slots';
    if (!onSlots && slot.timer != null) {
      window.clearInterval(slot.timer);
      slot.timer = null;
      if (slot.phase === 'spin') slot.phase = 'idle';
    }
    const onRoul = overlay?.type === 'shop' && overlay.shop === 'roulette';
    if (!onRoul && roul.timer != null) {
      window.clearInterval(roul.timer);
      roul.timer = null;
      if (roul.phase === 'spin') roul.phase = 'idle';
    }
  }, [overlay]);
  useEffect(() => () => {
    const { slot, roul } = casinoRef.current;
    if (slot.timer != null) window.clearInterval(slot.timer);
    if (roul.timer != null) window.clearInterval(roul.timer);
  }, []);
  const [isCoarse] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
  const [isPortrait, setIsPortrait] = useState(() => typeof window !== 'undefined' && window.matchMedia('(orientation: portrait)').matches);
  const [musicMuted, setMusicMuted] = useState(readMuted);
  const tracksRef = useRef(new Map<string, HTMLAudioElement>());
  const currentTrackRef = useRef<string | null>(null);
  const fadeTimersRef = useRef(new Map<HTMLAudioElement, number>());
  // Rain ambience: one looping element. On rainy days outdoors it REPLACES the
  // scene music (the music is suppressed to volume 0 while it rains).
  const rainAudioRef = useRef<HTMLAudioElement | null>(null);
  const rainOnRef = useRef(false);
  const musicSuppressedRef = useRef(false); // true while rain is standing in for music

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
    // The home jukebox: at the apartment, play whatever track you've put on.
    const homePick = sceneId === 'apartment' ? saveRef.current.homeTrack : null;
    const src = djSrc ?? (homePick ? (SCENE_MUSIC[homePick] ?? DEFAULT_MUSIC) : null) ?? SCENE_MUSIC[sceneId] ?? DEFAULT_MUSIC;
    const tracks = tracksRef.current;
    const prevSrc = currentTrackRef.current;
    // While rain stands in for the music, keep the scene track loaded but silent
    // (volume 0) so it can swell back in the instant the rain stops.
    const vol = musicSuppressedRef.current ? 0 : MUSIC_VOL;
    if (prevSrc === src) {
      const cur = tracks.get(src);
      if (cur) { cur.muted = readMuted(); if (vol > 0) cur.play().catch(() => {}); fadeAudio(cur, vol); }
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
    if (vol > 0) audio.play().catch(() => { /* autoplay blocked or file missing */ });
    fadeAudio(audio, vol);
  }, [fadeAudio]);

  // Start/stop the rain loop to match `on`. Rain REPLACES the scene music: when
  // it starts, the current track fades to silence; when it stops, the scene's
  // music swells back. The draw loop calls this every frame, so it no-ops unless
  // the desired state changed. Honors the global mute.
  const syncRain = useCallback((on: boolean) => {
    if (on === rainOnRef.current) {
      if (on && rainAudioRef.current) rainAudioRef.current.muted = readMuted();
      return;
    }
    rainOnRef.current = on;
    musicSuppressedRef.current = on;
    let ra = rainAudioRef.current;
    if (!ra) {
      ra = new Audio(RAIN_SRC);
      ra.loop = true;
      rainAudioRef.current = ra;
    }
    ra.volume = RAIN_VOL;
    ra.muted = readMuted();
    const cur = currentTrackRef.current ? tracksRef.current.get(currentTrackRef.current) : null;
    if (on) {
      if (cur) fadeAudio(cur, 0);          // duck the music out
      ra.play().catch(() => { /* autoplay blocked or file missing */ });
    } else {
      ra.pause();                          // rain off → bring the music back
      if (cur) { cur.muted = readMuted(); cur.play().catch(() => {}); fadeAudio(cur, MUSIC_VOL); }
    }
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
  const parisGlitchRef = useRef(0); // seconds left of the "hacked into the map" materialize on Paris arrival
  // David the cat, once adopted: roams the apartment, sits, naps. Lives only in the
  // apartment scene; (re)spawned lazily in the update loop. px coords, not tiles.
  // napTarget = the rug/kotatsu he's ambling to before curling up (null = none).
  const catRef = useRef<{ x: number; y: number; dir: 'left' | 'right'; sitting: boolean; napping: boolean; timer: number; napTarget: Vec | null } | null>(null);
  const petHeartRef = useRef(0); // seconds left on the little heart floating over David after a pet
  const ghPlotRef = useRef(0); // which greenhouse plot index the open plot menu is acting on
  // Today's random street event (or null), spawned ONLY in the city for that day.
  // Set on every scene entry (enterScene / begin); never baked into the static map.
  const streetEventRef = useRef<StreetEvent | null>(null);
  const inputRef = useRef(new Input());
  const solidsRef = useRef(new Set<string>());
  // Wanderers avoid everything the player's collision does PLUS warp tiles — an NPC
  // must never stand on a door/return tile. Built alongside solidsRef in computeSolids.
  const wanderBlockRef = useRef(new Set<string>());
  const overlayRef = useRef<Overlay | null>(null);
  const fishModeRef = useRef<FishMode | null>(null);
  // Fishing-derby run: a per-day running point tally (no save field — like the
  // festival minigame, the derby gates itself on storySeen + transient refs).
  // `derbyDayRef` stamps which calendar day the tally belongs to so it resets
  // cleanly on a new day / fresh derby.
  const derbyScoreRef = useRef(0);
  const derbyDayRef = useRef(0);
  const shiftRef = useRef<ShiftGame | null>(null);
  const driveRef = useRef<DriveGame | null>(null);
  const karaokeRef = useRef<KaraokeGame | null>(null);
  const karaokeAudioRef = useRef<HTMLAudioElement | null>(null); // the dedicated "Midnight Neon" cut (lazy, rewound per song)
  const driveIntroSeenRef = useRef(false); // show Kojima's how-to-drive briefing only once per session
  const pendingBeatsRef = useRef<StoryBeat[]>([]);
  const sleepTimerRef = useRef<number | null>(null);
  const oreNodesRef = useRef<OreNode[]>([]);
  const crawlersRef = useRef<Crawler[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);
  const mineFloorRef = useRef(1);        // current mine depth (1 = top floor; reset on entry from surface)
  const mineDownRef = useRef<{ x: number; y: number } | null>(null); // this floor's seeded descend-ladder tile
  const mineVaultRef = useRef(false);    // is this floor a rare treasure vault?
  const mineChestRef = useRef<{ x: number; y: number } | null>(null); // the vault's chest tile
  const mineChestOpenRef = useRef(false);// has the vault chest been looted (this visit / today)?
  const gunCooldownRef = useRef(0);      // AK-67 full-auto fire timer
  const autoFireRef = useRef(0);         // auto-defend cadence: weapon locks the nearest crawler on its own
  const nursedRef = useRef(false);
  // Jean-Pierre rescue cutscene (after a mines KO): he's stood in your apartment
  // while he talks, then walks to the door and leaves before you can get up.
  // Scripted NPC actor. 'talk'→'walk' = the rescue (talk over you, then leave).
  // 'approach'→'warn'→'return' = an NPC walks TO you, says a line, walks back
  // (Jean-Pierre blocking the mines). `hideNpc` suppresses that NPC's static map
  // draw so we don't see two of them; `then` fires when the approach completes.
  const cutsceneRef = useRef<{
    actor: { x: number; y: number; dir: Dir; sprite: string };
    phase: 'talk' | 'walk' | 'approach' | 'warn' | 'return';
    path: { x: number; y: number }[];
    home?: { x: number; y: number };
    then?: () => void;
    hideNpc?: string;
  } | null>(null);
  const pendingWakeRef = useRef<{ collapsed: boolean; nursed: boolean; recap: DayRecap; rescuer?: 'jean' | 'yoshi' } | null>(null);
  const sparkleRef = useRef<{ x: number; y: number; t: number } | null>(null);
  // Floating "+N Mineral" pickup text that rises and fades over a mined node.
  const mineTextRef = useRef<{ x: number; y: number; text: string; color: string; t: number } | null>(null);
  // Brief "Floor N" banner shown when you descend a level.
  const depthToastRef = useRef<{ floor: number; t: number } | null>(null);
  const ambLastTRef = useRef(0); // last render `t` (s) — for ambient-loop dt
  const hurtCooldownRef = useRef(0);
  const lastSafeTileRef = useRef<Vec | null>(null);
  const warpCooldownRef = useRef(0); // grace after a warp so you don't bounce back through an adjacent return warp
  const shrineHealRef = useRef(0);   // accumulates real seconds for the very-slow shrine energy heal
  const signGlowRef = useRef(new Map<object, HTMLCanvasElement>()); // cached neon-bloom sprites per sign (built once, not per frame)
  const signSpriteRef = useRef(new Map<object, { c: HTMLCanvasElement; w: number; h: number; s: number; mx: number; my: number; pw: number; ph: number }>()); // each sign's framed plate (drop shadow + bevel + hardware + text) rendered once at device scale, then blitted (no per-frame font switching); w/h = full canvas incl. shadow, mx/my = plate inset, pw/ph = plate size; rebuilt if the scale changes
  const skyGradRef = useRef<CanvasGradient | null>(null);  // night sky band — built once, alpha modulated per frame
  const sunGradRef = useRef<CanvasGradient | null>(null);  // morning sun rake — same
  const fogVigRef = useRef<CanvasGradient | null>(null);   // foggy-day vignette — radial, built once
  const mineDarkRef = useRef<{ lr: number; grad: CanvasGradient } | null>(null); // mines flashlight gradient, cached per light-radius (centered at 0,0, translated each frame)
  const glowSpriteRef = useRef(new Map<string, HTMLCanvasElement>()); // cached radial light sprites (club lights, street lamps) — built once, blitted per frame
  const wanderersRef = useRef<Wanderer[]>([]); // live positions of gently-pacing NPCs in the current scene
  const djPickRef = useRef<string | null>(null);

  // ---- furniture Arrange mode (drag-and-drop placement) ----------------------
  const arrangeRef = useRef(false);                 // loop reads this to freeze/render
  const [arrangeOpen, setArrangeOpen] = useState(false); // drives the DOM overlay
  const [arrangeTab, setArrangeTab] = useState<'furniture' | 'rugs' | 'style' | 'shop'>('furniture');
  const [arrangeTick, setArrangeTick] = useState(0);     // re-render tray on change
  const heldRef = useRef<{ id: string; from: 'box' | 'placed'; rug?: boolean } | null>(null);
  const ghostRef = useRef<{ tx: number; ty: number; valid: boolean } | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const exitArrangeRef = useRef<() => void>(() => {}); // late-bound (update runs before the handler is defined)

  const setOverlayBoth = useCallback((o: Overlay | null) => {
    overlayRef.current = o;
    setOverlay(o);
  }, []);

  const [achToast, setAchToast] = useState<{ title: string; desc: string; icon?: string } | null>(null);
  const achTimerRef = useRef<number | null>(null);
  const [geodePop, setGeodePop] = useState<{ text: string; color: string } | null>(null);
  const geodeTimerRef = useRef<number | null>(null);

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
    if (m) { // the view shows the whole sender conversation, so read the whole group
      let dirty = false;
      for (const x of s.messages) if (x.from === m.from && !x.read) { x.read = true; dirty = true; }
      if (dirty) { persistSave(s); refreshHud(); }
    }
    setOverlayBoth({ type: 'menu', tab: 'messages', thread: id });
  }, []);

  // Deliver any newly-eligible phone messages; if any arrived, buzz + toast
  // ("check your phone") and refresh the unread badge. Returns fresh count.
  // `silent` delivers without the buzz/toast — used during the end-of-day recap,
  // where a toast would be buried; the morning buzz in closeEndDay surfaces the
  // overnight texts a beat after you're back in control instead.
  const checkMessages = useCallback((silent = false): number => {
    const s = saveRef.current;
    const fresh = syncMessages(s);
    // Kawamachi Cooking Institute — a one-time enrollment text. Fires the first
    // time you can actually cook at home (fridge + microwave both placed, i.e.
    // canCookHere), so it lands exactly when the mechanic becomes usable instead
    // of spamming on day 1. It explains cooking in-world and enrolls you in the
    // correspondence course, unlocking the whole INSTITUTE_RECIPES curriculum.
    // Gated once by the message id; learnRecipe is itself idempotent.
    if (canCookHere(s) && !s.messages.some(m => m.id === 'cooking-institute')) {
      for (const id of INSTITUTE_RECIPES) learnRecipe(s, id);
      pushMessage(s, {
        id: 'cooking-institute', from: 'Kawamachi Cooking Institute 🍱', avatar: '🍱', company: true,
        body: [
          'Konnichiwa, {name}! This is the KAWAMACHI COOKING INSTITUTE. A little bird (and our fridge-warranty registry) tells us you\'ve got a fridge AND a microwave now. That\'s a kitchen! 🍳',
          'Here\'s the whole art of it: at home, open your Bag → COOK, and combine ingredients you\'ve gathered — fish from the rod, greens from the greenhouse, rice/eggs/veg from the konbini — into a finished dish. Eat one to restore energy and earn a day-long buff. Dishes also make wonderful gifts for the people you care about.',
          'We\'ve enrolled you in our correspondence course, free of charge — six recipes are now in your book: ramen, katsu curry, tempura, okonomiyaki, mochi, and our graduation bento. Check the RECIPE BOOK on your phone. Cook well, and cook often. がんばって! 🍜',
        ].map(line => line.replaceAll('{name}', s.name)),
      });
      const m = s.messages.find(x => x.id === 'cooking-institute');
      if (m) fresh.push(m);
    }
    if (fresh.length === 0) return 0;
    persistSave(s);
    refreshHud();
    if (silent) return fresh.length;
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

  // A transient banner that reuses the achievement-toast UI (food buffs, perks, etc).
  // Pass an icon to override the default 🏆 (e.g. 💛 for a new contact).
  const showToast = useCallback((title: string, desc = '', icon?: string) => {
    setAchToast({ title, desc, icon });
    if (achTimerRef.current) window.clearTimeout(achTimerRef.current);
    achTimerRef.current = window.setTimeout(() => setAchToast(null), 3500);
  }, []);

  // First time you meet a befriendable NPC → drop them into the Friends app and
  // buzz a one-time "new contact" notification. No-op for non-friends / repeat talks.
  const meetFriendNotify = useCallback((friendId?: string) => {
    if (!friendId) return;
    const f = friendById(friendId);
    if (!f) return;
    const s = saveRef.current;
    if (meetFriend(s, friendId)) {
      persistSave(s);
      showToast(`${f.name} — new contact`, 'Saved to your phone’s Friends app.', '💛');
    }
  }, [showToast]);

  // Award gathering XP; toast on a level-up.
  const SKILL_NAME: Record<SkillId, string> = { fish: 'Fishing', mine: 'Mining', farm: 'Farming' };
  const gainSkill = (k: SkillId, n: number) => {
    const lvl = addSkillXp(saveRef.current, k, n);
    if (lvl) { sfxLevelUp(); showToast(`📈 ${SKILL_NAME[k]} Lv.${lvl}!`, 'Your skill is growing — the rolls tilt your way.'); }
  };

  const refreshHud = useCallback(() => {
    const s = saveRef.current;
    if (s.money >= 50000) award('rich');
    if (s.money < 100) award('broke');
    setHud({
      money: s.money, day: s.day, time: clockLabel(s), energy: s.energy, max: maxEnergy(s),
      sceneName: sceneRef.current.name, fish: s.fishInv.length, ownedCount: s.owned.length,
      late: s.timeMin >= 24 * 60, // midnight or later
      unread: unreadCount(s),
      event: dayEventFor(s),
      buff: s.buff && s.buff.day === s.day ? { emoji: BUFFS[s.buff.id].emoji, name: BUFFS[s.buff.id].name, tag: BUFFS[s.buff.id].tag } : null,
      // Today's weather / sky event (priority matches state.ts: rain > fog > meteor).
      weather:
        isRainyDay(s) ? { emoji: '🌧', label: 'Rainy Day', title: 'Rainy day — the city glistens; some folk stay in' }
        : foggyDay(s) ? { emoji: '🌫', label: 'Foggy Day', title: 'Foggy day — a soft grey mist hangs over town' }
        : meteorNight(s) ? { emoji: '☄️', label: 'Meteor Night', title: 'Meteor shower tonight — step outside after dark to watch & make a wish' }
        : null,
    });
  }, [award]);

  const showDialog = useCallback((lines: string[], speaker?: string, actions?: DialogAction[]) => {
    // Address the player by name everywhere — every dialog flows through here, so
    // any '{name}' token in an NPC/event line resolves to the chosen name.
    const nm = saveRef.current.name || 'Neighbor';
    setOverlayBoth({ type: 'dialog', lines: lines.map(l => l.replaceAll('{name}', nm)), idx: 0, speaker, actions });
  }, [setOverlayBoth]);

  // Journal missions: pay out any newly-completed steps of the starter chain
  // (syncMissions dedupes via save.missionsDone). Mirrors checkMessages — called
  // on scene enter and when the Journal app opens, so a step lands within moments
  // of earning it without polling every frame.
  const checkMissions = useCallback(() => {
    const s = saveRef.current;
    const fresh = syncMissions(s);
    if (fresh.length === 0) return;
    sfxCoin();
    persistSave(s);
    refreshHud();
    const m = fresh[fresh.length - 1];
    showToast(`📓 Mission complete: ${m.title}`,
      `+¥${m.reward.toLocaleString()}${fresh.length > 1 ? ` (and ${fresh.length - 1} more — see the Journal)` : ''}`);
  }, [refreshHud, showToast]);

  // Capstone: the one-time "you know everyone now" payoff. Fires the first time
  // every FRIENDS id is in your phone — a warm journal letter + a modest cash
  // keepsake + the 'regular' achievement. Queued as a story-beat letter so it
  // drains through the normal beat pipeline (after any open overlay closes); the
  // reward + storySeen flag apply immediately. Safe to call repeatedly / anywhere.
  const checkRegular = useCallback(() => {
    const s = saveRef.current;
    if (s.storySeen.includes('regular') || !allFriendsMet(s)) return;
    s.storySeen.push('regular');
    s.money += 6000; // a modest neighborhood keepsake
    award('regular');
    persistSave(s);
    refreshHud();
    pendingBeatsRef.current.push({
      id: 'regular', title: 'A Full Phone', from: 'your journal', when: () => true,
      lines: [
        'Scrolling your phone tonight, you notice the Friends list has quietly, completely, filled up.',
        'Every name is a face now. Every face was a stranger once, on some ordinary day, until it wasn\'t.',
        'Kawamachi is ten million people and a train always arriving. But walk any street now and someone knows you — someone waves.',
        'You came here with two boxes and a futon. Somewhere along the way the big city became a small town that happens to hold your whole life.',
        'Tucked in with the thought, a little cash from nobody in particular — or everybody. A neighborhood looks after its regulars. (Got ¥6,000.)',
      ],
    });
  }, [award, refreshHud]);

  // Typewriter: reveal the current dialog line char-by-char (~83 cps). Restarts
  // whenever the overlay (line/idx) changes; cleared on unmount/overlay change.
  useEffect(() => {
    if (overlay?.type !== 'dialog') { typedRef.current = 0; return; }
    const full = overlay.lines[overlay.idx] ?? '';
    typedRef.current = 0;
    setTyped(0);
    if (full.length === 0) return;
    const id = window.setInterval(() => {
      typedRef.current = Math.min(full.length, typedRef.current + 1);
      setTyped(typedRef.current);
      const ch = full[typedRef.current - 1];
      if (ch && ch !== ' ' && typedRef.current % 3 === 0) sfxType(typedRef.current); // faint patter, every ~3rd glyph
      if (typedRef.current >= full.length) window.clearInterval(id);
    }, 12);
    return () => window.clearInterval(id);
  }, [overlay]);

  // Record the deepest floor reached and fire the one-off depth milestones
  // (achievements + the AK-67 unlock once you survive floor GUN_UNLOCK_FLOOR).
  const reachFloor = useCallback((floor: number) => {
    const s = saveRef.current;
    if (floor <= s.deepestFloor) return;
    s.deepestFloor = floor;
    if (floor >= 5) award('delver');
    if (floor >= 10) award('abyss');
    if (floor >= GUN_UNLOCK_FLOOR && !s.storySeen.includes('gun-unlock')) {
      s.storySeen.push('gun-unlock');
      showDialog([
        'Your phone buzzes, this far underground, which should not be possible.',
        'THE MANAGER: "You have gone deep enough to be interesting, customer. I have something for the deep."',
        '"An AK-67. Full automatic. The last thing the crawlers ever hear. Come up and see me when you can afford it."',
      ], 'The Manager');
    }
    persistSave(s);
  }, [award, showDialog]);

  const computeSolids = useCallback(() => {
    const set = new Set<string>();
    const scene = sceneRef.current;
    const s = saveRef.current;
    for (const npc of scene.npcs) {
      if (npc.id === 'yakuza' && s.gangPaid) continue; // paid off — no longer blocks
      if (WANDER_IDS.has(npc.id)) continue; // wanderers move; not part of the static solid set
      if (npcHiddenNow(s, npc.id)) continue; // time-gated folk (Max on even nights, the midnight stranger) aren't here now
      set.add(`${npc.x},${npc.y}`);
    }
    if (scene.id === 'apartment') {
      for (const itemId of Object.keys(s.placed)) {
        if (itemId === 'ac' || itemId === 'neon') continue; // wall mounts don't block
        const pos = s.placed[itemId];
        const w = itemId === 'bed' || itemId === 'sofa' || itemId === 'kotatsu' ? 2 : 1;
        for (let dx = 0; dx < w; dx++) set.add(`${pos.x + dx},${pos.y}`);
      }
      if (s.homeOnsen) set.add(`${HOME_ONSEN_TILE.x},${HOME_ONSEN_TILE.y}`); // walk up to soak
    }
    if (s.carPos && s.carPos.scene === scene.id) {
      set.add(`${s.carPos.x},${s.carPos.y}`);
      set.add(`${s.carPos.x + 1},${s.carPos.y}`);
    }
    // Today's street-event actor blocks its tile so you bump into it to interact.
    if (scene.id === 'city' && streetEventRef.current) {
      const ev = streetEventRef.current;
      set.add(`${ev.x},${ev.y}`);
    }
    solidsRef.current = set;
    // Wanderers also steer clear of warp tiles (doors/return seams) so townsfolk
    // never park on a doorway. Player keeps using solidsRef so it can still warp.
    const wb = new Set(set);
    for (const wp of scene.warps) wb.add(`${wp.x},${wp.y}`);
    wanderBlockRef.current = wb;
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

  // Derby payout: settle the day's run — Genji reads off your placement tier and
  // hands over the prize. `settleDerbyPrize` (state.ts, pure) owns the money +
  // phone bulletin and the once-per-derby dedupe (storySeen `tournament-prize-
  // <day>`, no save field); this wrapper owns the transient bits (score ref,
  // toast, sfx, achievement). Called from EVERY path that can end a run —
  // leaving the shore (enterScene), sleeping/collapsing (finishSleep, before
  // passNight bumps the day), and SAVE&QUIT (quitToMenu) — so sleeping on the
  // sand or quitting mid-derby can no longer silently eat the prize.
  const settleDerby = useCallback((s: GameSave) => {
    if (derbyDayRef.current !== s.day) return;
    const tier = settleDerbyPrize(s, derbyScoreRef.current);
    if (!tier) return;
    if (tier.name === 'Grand Marlin') award('grand-marlin');
    sfxCoin();
    showToast(`🏆 ${tier.name}!`, `Derby ${derbyScoreRef.current} pts · +¥${tier.prize}`);
  }, [award, showToast]);

  const enterScene = useCallback((id: string, tx: number, ty: number, dir: Dir) => {
    const s = saveRef.current;
    // Leaving the shore on a tournament day after landing at least one fish
    // settles the derby board (toast + phone bulletin, never fights the
    // scene-change).
    if (sceneRef.current.id === TOURNAMENT_SCENE && id !== TOURNAMENT_SCENE) settleDerby(s);
    // First time you LEAVE the konbini: timestamp it so the job offer can text
    // you about an hour later (see the 'konbini-job' message).
    if (sceneRef.current.id === 'konbini' && id !== 'konbini' && s.leftKonbiniAt == null) {
      s.leftKonbiniAt = s.day * 1440 + s.timeMin;
    }
    sceneRef.current = SCENES[id];
    // Fresh derby: entering the shore on a new tournament day zeroes the run tally.
    if (id === TOURNAMENT_SCENE && fishingTournamentDay(s.day) && derbyDayRef.current !== s.day) {
      derbyDayRef.current = s.day; derbyScoreRef.current = 0;
    }
    // Today's one-off street event lives only in the city — re-resolve on entry.
    streetEventRef.current = id === 'city' ? streetEventFor(s) : null;
    wanderersRef.current = makeWanderers(SCENES[id]);
    posRef.current = { x: tx * TILE, y: ty * TILE - 4 };
    dirRef.current = dir;
    warpCooldownRef.current = 0.6; // don't re-trigger a nearby warp for a beat after arriving
    s.scene = id; s.px = posRef.current.x; s.py = posRef.current.y; s.dir = dir;
    if (!s.visited.includes(id)) s.visited.push(id);
    checkMessages(); // visiting a place can unlock its texts (buzz if so)
    checkMissions(); // a step finished elsewhere pays out on the next scene change
    if (id !== 'nightclub') djPickRef.current = null; // the set ends when you leave
    if (id === 'mines') {
      const layout = mineLayoutFor(s, mineFloorRef.current);
      oreNodesRef.current = layout.ore;
      mineDownRef.current = layout.down;
      mineVaultRef.current = !!layout.vault;
      mineChestRef.current = layout.chest ?? null;
      mineChestOpenRef.current = !!layout.vault && s.vaultsLooted.includes(`${s.day}:${mineFloorRef.current}`);
      crawlersRef.current = layout.crawlers.map(c => ({
        x: c.x * TILE, y: c.y * TILE - 4, hp: CRAWLER_HP[c.kind], stepT: Math.random(), hurtT: 0, dir: 'down' as Dir, kind: c.kind,
      }));
    } else {
      crawlersRef.current = [];
    }
    computeSolids();
    persistSave(s);
    refreshHud();
    playMusicFor(id);
    if (id === 'nightclub') award('club');
    if (id === 'backroom') award('inner-circle'); // stepping past the curtain is the trophy
    checkRegular(); // catches an all-cast save on scene enter (e.g. a loaded game)
  }, [computeSolids, refreshHud, playMusicFor, award, checkRegular, settleDerby, checkMissions]);

  // ---- interactions ----------------------------------------------------------

  // Sleep / collapse → end-of-day recap → wake. Three steps so the player can
  // read the recap (and so an "out cold" screen waits for a click first).
  const finishSleep = useCallback(() => {
    const pending = pendingWakeRef.current;
    if (!pending) return;
    const s = saveRef.current;
    if (sleepTimerRef.current) { window.clearTimeout(sleepTimerRef.current); sleepTimerRef.current = null; }
    settleDerby(s); // a derby run open at bedtime (slept/collapsed on the shore) pays out BEFORE the day ticks over
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
    growGreenhouse(s);    // greenhouse crops advance on watered mornings + a fresh request is posted
    const shipPay = sellShipping(s); // the produce buyer pays out the shipping box overnight
    if (shipPay > 0) pushMessage(s, { id: `ship-${s.day}`, from: 'Produce Buyer 🧺', avatar: '🧺', company: true,
      body: [`Your greenhouse harvest sold for ¥${shipPay.toLocaleString()}. Fresh stuff. The neighborhood thanks you. 🌱`] });
    // David's morning gift: ~8% of mornings (seeded by day — deterministic across
    // reloads) the cat leaves a little something by the door. catGiftDay dedupes
    // so a re-run of the wake flow can never pay the same morning twice.
    if (s.cat.found && s.catGiftDay !== s.day && catGiftMorning(s.day)) {
      s.catGiftDay = s.day;
      const gift = catGiftFor(s.day);
      if (gift.egg) s.pantry['egg'] = (s.pantry['egg'] ?? 0) + 1;
      else s.money += gift.money;
      showToast('🐾 David left you something by the door', gift.egg
        ? 'A single egg, gently herded. Do not ask whose. (+1 egg in the pantry)'
        : `A neat little pile of coins. Do not ask where from. (+¥${gift.money.toLocaleString()})`);
    }
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
    // Special-day herald: a morning bulletin so the player KNOWS today is special.
    // Fresh id per day so it can fire again on a later special day (pushMessage
    // dedupes by id). Reinforced by the HUD chip + the Journal.
    const todayEvent = dayEventFor(s);
    if (todayEvent) pushMessage(s, { id: `event-${s.day}`, from: 'Kawamachi Bulletin 📣', avatar: '📣', company: true,
      body: [todayEvent === 'market'
        ? "📣 MARKET DAY in Kawamachi! The pawn shop's stocked deep and even Jimmy on the corner is cutting prices. A good morning to go furniture-hunting. 🏷"
        : "📣 Word is today's a LUCKY DAY. The tide left extra on Sumikawa Shore and the mine veins are running rich. Press your luck while it holds. ✨"] });
    // Meteor-shower herald: a clear night ahead. Tell the player in the morning so
    // they head outside after dark — the shower draws over outdoor scenes at night,
    // and you can make one wish per shower. Fresh id per day (pushMessage dedupes).
    if (meteorNight(s)) pushMessage(s, { id: `meteor-${s.day}`, from: 'Kawamachi Bulletin 📣', avatar: '☄️', company: true,
      body: ["☄️ CLEAR SKIES TONIGHT — a METEOR SHOWER is forecast over Kawamachi! Step outside after dark to watch the stars fall, and make a wish on one. 🌠"] });
    // Festival herald: every so often the city throws a matsuri. Name it, say which
    // scene it takes over, and tease the stall minigame / after-dark fireworks. Fresh
    // id per day (pushMessage dedupes) — festivals land ≥14 days apart, so never twice.
    const fest = festivalFor(s.day);
    if (fest) pushMessage(s, { id: `festival-${s.day}`, from: 'Kawamachi Bulletin 📣', avatar: '🏮', company: true,
      body: [`🏮 ${fest.name} is TODAY! ${fest.blurb} Come down to ${SCENES[fest.scene]?.name ?? 'the festival'} and join in${fest.nightFireworks ? ' — and stay till dark for the fireworks 🎆' : ''}.`] });
    // Fishing-derby herald: on a derby day the whole town lines the waterline to
    // fish against a live board. Name it, tease the prizes, and point them to the
    // shore. Fresh id per day (pushMessage dedupes) — mirrors the festival herald.
    if (fishingTournamentDay(s.day)) pushMessage(s, { id: `tournament-${s.day}`, from: 'Kawamachi Bulletin 📣', avatar: '🎣', company: true,
      body: [`🎣 ${TOURNAMENT_NAME} is TODAY! ${TOURNAMENT_BLURB} The whole town is gathering down at ${SCENES[TOURNAMENT_SCENE]?.name ?? 'the shore'} — reel in your biggest haul and place on the board for a prize.`] });
    // Progressive-jackpot herald: the Kinryū slots pot ticks up nightly; make it
    // town news each time it swells past another ¥10,000 line. Deterministic
    // (the pot derives from day + jackpotDay), so this fires exactly once per line.
    {
      const potNow = jackpotFor(s);
      // passNight already ticked s.day, so jackpotDay ≤ day-1 always holds here.
      const potPrev = jackpotFor({ day: s.day - 1, jackpotDay: s.jackpotDay });
      if (Math.floor(potNow / 10000) > Math.floor(potPrev / 10000))
        pushMessage(s, { id: `jackpot-${s.day}`, from: 'Kawamachi Bulletin 📣', avatar: '🎰', company: true,
          body: [`🎰 The progressive jackpot at the Kinryū Lounge has swollen past ¥${(Math.floor(potNow / 10000) * 10000).toLocaleString()}. Nobody has hit it in days. The slots are getting looked at.`] });
    }
    checkStory();
    checkMessages(true); // deliver overnight texts silently — the recap covers the screen; closeEndDay buzzes for them
    persistSave(s);
    refreshHud();
    setOverlayBoth({ type: 'endday', recap: pending.recap });
    playMusicFor('endofday'); // dedicated end-of-day theme over the recap
  }, [setOverlayBoth, checkStory, refreshHud, computeSolids, playMusicFor, award, showToast, settleDerby]);

  const closeEndDay = useCallback(() => {
    const pending = pendingWakeRef.current;
    pendingWakeRef.current = null;
    setOverlayBoth(null);
    playMusicFor(sceneRef.current.id); // back to the world's music
    // Morning phone buzz: overnight texts (bulletins/heralds/receipts) were
    // delivered silently under the recap — surface them a beat after you're
    // back in control, like a phone catching up on the night's notifications.
    window.setTimeout(() => {
      if (overlayRef.current || !saveRef.current) return; // player already opened something — badge suffices
      const unread = saveRef.current.messages.filter(m => !m.read);
      if (unread.length === 0) return;
      const latest = unread[unread.length - 1];
      const preview = latest.body[0].length > 48 ? latest.body[0].slice(0, 47) + '…' : latest.body[0];
      sfxPhone();
      setMsgToast({ from: latest.from, count: unread.length, preview, id: latest.id });
      if (msgTimerRef.current) window.clearTimeout(msgTimerRef.current);
      msgTimerRef.current = window.setTimeout(() => setMsgToast(null), 6000);
    }, 2800);
    if (pending?.rescuer) {
      nursedRef.current = false;
      // Stand the rescuer in the apartment, talking over you. When you dismiss the
      // dialog they walk to the door and out (handled in the update loop) — and you
      // can't get up until they're gone.
      const sprite = pending.rescuer === 'yoshi' ? 'npc-miko' : 'npc-tourist';
      cutsceneRef.current = {
        actor: { x: 4 * TILE, y: 2 * TILE - 4, dir: 'left', sprite },
        phase: 'talk',
        path: [{ x: 12 * TILE, y: 2 * TILE - 4 }, { x: 12 * TILE, y: 10 * TILE }],
      };
      if (pending.rescuer === 'yoshi') {
        showDialog([
          'You wake on your own futon. The air still carries cedar and a faint thread of incense — the way the shrine grounds smell at first light.',
          'Yoshi kneels by the door, calm and unhurried. "You fell asleep beneath the torii. On sacred ground, in the cold. The kami keeps watch over the grounds — but watching is all a kami can do for a sleeping guest."',
          '"So I saw you the rest of the way home. A guest who falls on the grounds is the shrine\'s guest, and the shrine looks after its own. There is no debt in it, so do not go looking for one."',
          '"I left a small pinch of salt by your door — a little harae, to send the night\'s heaviness on its way. Drink water. Breathe slow. Be gentle with yourself today."',
          '"And come back when you are rested. Bow twice, clap twice — the kami will be glad to see you on your feet." She rises, bows once to the quiet room, and turns to go.',
        ], 'Yoshi');
      } else {
        showDialog([
          'You come to on the floor of your own apartment. There is a damp towel on your forehead, folded with surprising precision.',
          'Jean-Pierre is standing over you, beret slightly askew. "Bonjour. You were face-down in ze yellow place. Very dramatique."',
          '"I carry you up ze ladder, through ze freezer, past ze nice monster. He says hello, by ze way."',
          '"In France we have a saying: do not fight ze crawling things on an empty battery." He pats your head exactly once.',
          '"I let myself out. Rest. Eat something." He turns for the door.',
        ], 'Jean-Pierre');
      }
    } else {
      // No rescue this morning — a high-heart friend may instead DROP BY. They walk
      // in from the door (input locked), react to your place, leave a housewarming
      // gift, then walk back out. Reuses the cutsceneRef approach→talk→return rig.
      const s = saveRef.current;
      const visit = pendingHomeVisit(s);
      if (visit && sceneRef.current.id === 'apartment') {
        s.storySeen.push(homeVisitFlag(visit.friend));
        if (visit.money) s.money += visit.money;
        persistSave(s); refreshHud();
        award('housewarming');
        const lines = [...visit.lines, homeDecorReaction(s)];
        if (visit.closeLine) lines.push(visit.closeLine);
        cutsceneRef.current = {
          actor: { x: 12 * TILE, y: 9 * TILE, dir: 'up', sprite: visit.sprite },
          phase: 'approach',
          path: [{ x: 12 * TILE, y: 3 * TILE }, { x: 4 * TILE, y: 2 * TILE - 4 }],
          home: { x: 12 * TILE, y: 10 * TILE }, // walk back out through the door
          then: () => showDialog(lines, visit.speaker),
        };
      }
    }
  }, [setOverlayBoth, playMusicFor, showDialog, refreshHud, award]);

  const doSleep = useCallback((collapsed = false, nursed = false, rescuer?: 'jean' | 'yoshi') => {
    const s = saveRef.current;
    fishModeRef.current = null;
    projectilesRef.current = [];
    // Belt-and-braces: never carry a ref-mode minigame (or its audio) through the
    // night — the clock freezes while they run, but nothing else should either.
    karaokeRef.current = null;
    karaokeAudioRef.current?.pause();
    shiftRef.current = null;
    driveRef.current = null;
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
    pendingWakeRef.current = { collapsed, nursed, recap, rescuer: rescuer ?? (nursed ? 'jean' : undefined) };
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

  // ---- Keepsake effects ---------------------------------------------------
  // Pawn the vampire's ring for cold yen. One-of-a-kind: once sold, it's gone.
  const sellRing = () => {
    const s = saveRef.current;
    if (!hasKeepsake(s, 'ring')) return;
    const k = keepsakeById('ring');
    s.money += k?.value ?? 3000;
    s.keepsakes = s.keepsakes.filter(id => id !== 'ring');
    sfxCoin();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
    showDialog([
      'The pawnbroker turns the ring beneath a loupe, and for a heartbeat something very old moves behind his eyes. "...I knew the hand this was carved for." He does not ask how you came by it.',
      `He counts out ¥${(k?.value ?? 3000).toLocaleString()} without another word, and keeps the ring cupped in both palms, like it might still be warm.`,
    ], 'Pawnbroker');
  };
  // Eat Granny's plums: a solid hit of energy (capped) + the day-long warm buff.
  // Has a buff, so it's worth eating even at full energy — like a buffed dish.
  const eatPlums = () => {
    const s = saveRef.current;
    if (!hasKeepsake(s, 'plums')) return;
    s.energy = Math.min(maxEnergy(s), s.energy + 50);
    s.buff = { id: 'warm', day: s.day };
    s.keepsakes = s.keepsakes.filter(id => id !== 'plums');
    sfxCoin();
    showToast(`${BUFFS.warm.emoji} ${BUFFS.warm.name}`, BUFFS.warm.desc);
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  // ---- Cooking ------------------------------------------------------------
  const doCook = (recipeId: string) => {
    const s = saveRef.current;
    if (!cook(s, recipeId)) return;
    blip([523, 659, 784], 0.05); // a happy little "ding"
    award('first-dish');
    if (INSTITUTE_RECIPES.every(id => s.cookedLog.includes(id))) award('institute-grad');
    refreshHud(); setShopTick(v => v + 1);
  };
  const doEat = (recipeId: string) => {
    const s = saveRef.current;
    const r = recipeById(recipeId);
    if (!r || !eatDish(s, recipeId)) return;
    sfxCoin();
    if (r.buff) showToast(`${BUFFS[r.buff].emoji} ${BUFFS[r.buff].name}`, BUFFS[r.buff].desc);
    refreshHud(); setShopTick(v => v + 1);
  };
  const buyGroceryItem = (id: string, price: number) => {
    const s = saveRef.current;
    if (!buyGrocery(s, id, price)) return;
    sfxCoin();
    refreshHud(); setShopTick(v => v + 1);
  };

  // Buy the home jukebox from DJ Tanuki — unlocks the phone Music app.
  const buyJukebox = () => {
    const s = saveRef.current;
    if (s.jukeboxUnlocked || s.money < JUKEBOX_PRICE) return;
    s.money -= JUKEBOX_PRICE;
    s.jukeboxUnlocked = true;
    sfxBuy();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
    showDialog([
      '"A home rig? HA. Respect. Most people just yell at their phone speaker."',
      '"It\'s in your pocket now — Music app. Pick any place you\'ve actually BEEN. Authenticity. Matters."',
    ], 'DJ Tanuki');
  };

  // Home jukebox: choose which visited scene's track plays in the apartment.
  const setJukebox = (sceneId: string | null) => {
    const s = saveRef.current;
    s.homeTrack = sceneId;
    persistSave(s);
    if (sceneRef.current.id === 'apartment') playMusicFor('apartment'); // switch the home track now
    setShopTick(v => v + 1);
  };

  // Pay the landlord to knock through into the next unit (a second room).
  const payLandlord = () => {
    const s = saveRef.current;
    if (s.roomUnlocked || !s.backroomsUnlocked || s.money < ROOM_PRICE) return;
    s.money -= ROOM_PRICE;
    s.roomUnlocked = true;
    applyApartmentSize(true);   // grow the apartment now (you're in the city; no live glitch)
    computeSolids();
    sfxBuy(); persistSave(s); refreshHud();
    setOverlayBoth(null);
    showDialog([
      'You send the transfer. The three dots hover for a long, long moment.',
      '"Pleasure doing business. Keys are in the lockbox. The wall between the units is already... thin. You\'ll see."',
      '(Your apartment now has a SECOND ROOM — go home and decorate it. Furniture, rugs, the works.)',
    ], 'Landlord');
  };

  // Fund the shrine's full restoration → a permanent extra luck tier (one-time).
  // Offered as a trailing action on the shrine's offering dialog while unrestored.
  const fundShrineRestoration = () => {
    const s = saveRef.current;
    if (!restoreShrine(s)) {
      showDialog(['Yoshi names the full figure — ¥80,000 — to mend the roof beams and regild the kami\'s seat. You turn out your pockets and come up short. "When you can," she says, unbothered. "The kami keeps no calendar."'], 'Yoshi');
      return;
    }
    sfxBuy(); persistSave(s); refreshHud();
    showDialog([
      'You commit the funds for the shrine\'s full restoration. Within the week the sagging roof is re-thatched, the torii repainted vermilion, the offering hall set right.',
      'Yoshi bows to you — properly, deeply, the way she never has. "The kami does not forget a thing like this. From here on the fortune of this place leans your way, and it will not lean back."',
      '(The shrine is RESTORED — fortune now favors you for good: a permanent extra tier of luck.)',
    ], 'Yoshi');
  };

  // Become Charlie's film patron (one-time, ¥40,000) → executive-producer bit.
  const sponsorCharlieFilm = () => {
    const s = saveRef.current;
    if (!sponsorCharlie(s)) {
      showDialog(['Charlie names a number — ¥40,000, to actually finish the thing. You check your wallet. Not today. "No worries! The city\'s not going anywhere. Neither\'s the dream."'], 'Charlie');
      return;
    }
    sfxBuy(); persistSave(s); refreshHud();
    showDialog([
      'Charlie\'s whole face goes slack, then lights up like a sunrise. "Wait — for real? You\'re IN? Oh man — you\'re my executive producer now. That\'s a real title. I checked."',
      'He digs in his bag and presses something into your hands: a worn clapperboard with your name already chalked across it. "Keepsake. From day one of the rest of this movie."',
      '"And I\'m writing you a cameo. Don\'t argue — golden hour, you, the skyline. It\'s gonna be UNREAL." (You\'re Charlie\'s patron, and a producer.)',
    ], 'Charlie');
  };

  // Landlord text-thread: install the private home onsen (one-time, ¥70,000).
  const buyHomeOnsenFromLandlord = () => {
    const s = saveRef.current;
    if (!buyHomeOnsen(s)) return; // button is disabled when unaffordable/owned
    applyHomeOnsen(true);         // inject the interactable now
    computeSolids();
    sfxBuy(); persistSave(s); refreshHud();
    setOverlayBoth(null);
    showDialog([
      'The landlord sends a single thumbs-up, then a flurry of activity: a plumber, a delivery of hinoki planking, the smell of cedar and hot mineral water.',
      'By evening there is a steaming little hot-tub tucked into the corner of your apartment, all your own.',
      '(A PRIVATE ONSEN is installed at home — walk up and press E to soak once a day.)',
    ], 'Landlord');
  };

  // ---- Friendship / gifting -----------------------------------------------
  // Everything in your bag you could give as a gift, with its GiftKind. Crops
  // that are flowers count as 'flower'; cooked dishes as 'dish'.
  type GiftItem = { kind: GiftKind; label: string; sprite?: string; emoji?: string; count: number; take: (s: GameSave) => void };
  const giftableItems = (s: GameSave): GiftItem[] => {
    const out: GiftItem[] = [];
    if (s.fishInv.length > 0) out.push({ kind: 'fish', label: 'A fresh fish', emoji: '🐟', count: s.fishInv.length, take: x => x.fishInv.shift() });
    for (const [id, n] of Object.entries(s.produce)) if (n > 0) {
      const isFlower = id === 'sunflower' || id === 'moonflower';
      out.push({ kind: isFlower ? 'flower' : 'crop', label: CROPS[id]?.name ?? id, emoji: isFlower ? '🌸' : '🥬', count: n, take: x => { x.produce[id]--; if (x.produce[id] <= 0) delete x.produce[id]; } });
    }
    if (s.coconuts > 0) out.push({ kind: 'coconut', label: 'Coconut', emoji: '🥥', count: s.coconuts, take: x => { x.coconuts--; } });
    if (s.peepis > 0) out.push({ kind: 'soda', label: 'Diet Doctor Peepis', emoji: '🥤', count: s.peepis, take: x => { x.peepis--; } });
    for (const soda of SODAS) if (soda.id !== 'peepis' && (s.sodas[soda.id] ?? 0) > 0)
      out.push({ kind: 'soda', label: soda.name, emoji: '🥤', count: s.sodas[soda.id], take: x => { x.sodas[soda.id]--; } });
    for (const [id, n] of Object.entries(s.minerals)) if (n > 0)
      out.push({ kind: 'mineral', label: mineralById(id)?.name ?? id, emoji: '💎', count: n, take: x => { x.minerals[id]--; } });
    for (const [id, n] of Object.entries(s.dishes)) if (n > 0)
      out.push({ kind: 'dish', label: recipeById(id)?.name ?? id, sprite: recipeById(id)?.sprite, count: n, take: x => { x.dishes[id]--; if (x.dishes[id] <= 0) delete x.dishes[id]; } });
    return out;
  };
  const GIFT_REACTION: Record<GiftTier, (name: string) => string> = {
    loved: n => `${n} lights up. "For me? This is exactly the sort of thing I love. You remembered." (❤️❤️ friendship up!)`,
    liked: n => `${n} smiles, turning it over. "That's really thoughtful. Thank you." (❤️ friendship up)`,
    neutral: n => `${n} accepts it politely. "Ah — thanks. That's kind of you." (friendship up a little)`,
    disliked: n => `${n} takes it with a thin smile. "...Thank you. It's the thought that counts, I suppose." (not really their thing)`,
  };
  const doGift = (npcId: string, item: GiftItem) => {
    const s = saveRef.current;
    const f = friendById(npcId);
    if (!f || !canGiftToday(s, npcId)) return;
    item.take(s);
    const beforeHearts = friendHearts(s, npcId);
    const res = giftTo(s, npcId, item.kind);
    sfxCoin();
    refreshHud(); setShopTick(v => v + 1);
    setOverlayBoth(null);
    const lines = [GIFT_REACTION[res.tier](f.name)];
    if (res.gainedHeart) { sfxHeartUp(); lines.push(`You and ${f.name} are closer now. (${res.hearts}/10 ♥)`); }
    if (f.perk && beforeHearts < f.perk.hearts && res.hearts >= f.perk.hearts)
      lines.push(`✦ ${f.name} perk unlocked: ${f.perk.text}`);
    showDialog(lines, f.name);
  };

  // Talk is always the default now (no chooser). Gifting folds into the END of a
  // conversation: if the player is carrying something giftable and hasn't gifted
  // this friend today, the final dialog line gets a trailing "🎁 Give a gift"
  // button that opens the existing gift picker. Returns undefined when there's
  // nothing to offer (so the dialog just closes on the last line as before).
  const giftActionFor = (friendId?: string): DialogAction[] | undefined => {
    if (!friendId) return undefined;
    const s = saveRef.current;
    if (!canGiftToday(s, friendId) || giftableItems(s).length === 0) return undefined;
    return [{ label: '🎁 Give a gift', onPick: () => setOverlayBoth({ type: 'gift', npcId: friendId }) }];
  };

  // Bingus's regular museum talk — extracted so BOTH paths reach it: the plain
  // E-talk, and the "JUST CHAT" button on the donation confirm (which otherwise
  // swallows the conversation whenever you're carrying something he's after).
  const bingusTalk = () => {
    const s = saveRef.current;
    const have = s.museum.donated.length;
    const total = MUSEUM_SLOTS.length;
    const intro = have === 0
      ? 'AH! A visitor! Welcome, welcome, to the Kawamachi Museum! I am Bingus Doofelsmurt, curator, founder, and — at present — sole staff.'
      : 'Welcome BACK! The collection grows, doesn\'t it? Squint and you can almost feel it becoming important.';
    const ask = bingusNextAsk(s);
    const lines = [
      intro,
      have >= total
        ? 'And it is COMPLETE. Every plinth filled, every frame occupied. I may weep. I am weeping. Do not look at me.'
        : `The displays are, ah, "between acquisitions." ${have} of ${total} filled.`,
      ask
        ? `Here is one thing you could do for the COLLECTION: ${ask.ask} (A donation, mind — it goes straight onto a display, not into my pockets.)`
        : 'A few pieces are still out there in the world — alleys, shores, the deep places. You will know them when you see them.',
    ];
    const flavor = friendFlavorLine(s, 'bingus'); // the heart-warmed closing line the NPC path would add
    if (flavor) lines.push(flavor);
    showDialog(lines, 'Bingus Doofelsmurt', giftActionFor('bingus'));
  };

  // Pet David (once a day, via the cat dialog's trailing action): a purr, a
  // floating heart over wherever he's sat, and a small friendship bump (petCat
  // routes the points through the same clamp as gifting — see state.ts).
  const doPetCat = () => {
    const s = saveRef.current;
    const before = friendHearts(s, 'david');
    if (!petCat(s)) return;
    sfxPurr();
    petHeartRef.current = 1.4; // the heart floats off over ~a second and a half
    persistSave(s); refreshHud();
    const hearts = friendHearts(s, 'david');
    const lines = ['You crouch down and give David a good scritch behind the ears. He leans in, motor running, and pretends not to.'];
    if (hearts > before) { sfxHeartUp(); lines.push(`You and David are closer now. (${hearts}/10 ♥)`); }
    showDialog(lines, 'David');
  };

  // Heart-event hangout: a one-time deeper scene that plays the next time you talk
  // to a friend once you've crossed a heart threshold (see pendingHangout). Sets
  // the storySeen flag immediately so it never repeats, applies any keepsake/buff,
  // and shows the scripted dialog. Normal conversation resumes after this.
  const playHangout = (h: HangoutScene) => {
    const s = saveRef.current;
    s.storySeen.push(h.flag);
    const lines = [...h.lines];
    if (h.money) s.money += h.money;
    if (h.buff) s.buff = { id: h.buff, day: s.day };
    if (h.rewardLine) lines.push(h.rewardLine);
    // A capstone may hand over a one-of-a-kind keepsake (see KEEPSAKES). Grant it
    // and tell the player where to find it; grantKeepsake no-ops on a dup.
    if (h.keepsake && grantKeepsake(s, h.keepsake)) {
      const k = keepsakeById(h.keepsake);
      if (k) lines.push(`🎁 You tuck the ${k.name} into your bag. (Find it under Keepsakes — open your phone → Bag.)`);
    }
    sfxCatch();
    persistSave(s); refreshHud();
    award('heart2heart');
    showDialog(lines, h.speaker);
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
    // First cast ever: explain the minigame before they swing.
    if (!s.storySeen.includes('fish-howto')) {
      s.storySeen.push('fish-howto');
      persistSave(s);
      showDialog([
        'HOW TO FISH: face the water and press E to cast, then wait for the bobber to dip.',
        'The moment it bites (BITE! PRESS E!), press E to set the hook.',
        'Then HOLD E to raise the green catch-bar — keep the darting fish inside it until the meter on the right fills. Release E and the bar sinks. Land it before it fills the wrong way.',
      ]);
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
    gainSkill('fish', fish.value >= 500 ? 35 : 18); // bigger fish, more XP
    // Rare snag: Genji's Lost Lure, a museum curio.
    const gotLure = !s.collectibles.includes('arti-lure') && !s.museum.donated.includes('arti-lure') && Math.random() < 0.05;
    if (gotLure) s.collectibles.push('arti-lure');
    persistSave(s); refreshHud();
    sfxCatch();
    award('first-fish');
    if (deep) award('deep');
    if (fish.id === 'golden') award('golden');
    const flair = fish.id === 'golden' ? ' Genji will not believe this.' : fish.id === 'koi' ? ' Someone must miss it.' : '';
    const lureLine = gotLure ? ['Snagged on the hook too: a battered old lure with "GENJI" scratched into it. The museum would treasure this.'] : [];
    // Derby scoring: on a tournament day, a fish landed at the shore adds to the
    // day's running point tally (fish yen → derby points). Stamp the day so the
    // tally self-resets on a fresh derby; surface a small "Derby" toast + dialog
    // line. Pure ref-tracked (no save field), like the festival minigame.
    let derbyLine: string[] = [];
    if (sceneRef.current.id === TOURNAMENT_SCENE && fishingTournamentDay(s.day)) {
      if (derbyDayRef.current !== s.day) { derbyDayRef.current = s.day; derbyScoreRef.current = 0; }
      const pts = tournamentScore(fish.value);
      derbyScoreRef.current += pts;
      // Float the points over the player (the mine floating-text rig) so the
      // score gain lands visually right where the catch happened.
      mineTextRef.current = { x: posRef.current.x, y: posRef.current.y - 6, text: `+${pts} pts`, color: '#7ce8e0', t: 1.4 };
      showToast(`🎣 Derby: ${derbyScoreRef.current} pts`, `+${pts} for the ${fish.name} — keep casting before the tide turns.`);
      derbyLine = [`That's +${pts} on the derby board — ${derbyScoreRef.current} pts so far.`];
    }
    showDialog([`You caught a ${fish.name}! (worth ¥${fish.value})${flair}`, ...derbyLine, ...lureLine]);
  }, [refreshHud, showDialog, award, showToast]);

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
    // One-in-a-hundred: an old, EMPTY capsule rattles out — a museum curio.
    if (!s.collectibles.includes('arti-capsule') && !s.museum.donated.includes('arti-capsule') && Math.random() < 0.01) {
      s.collectibles.push('arti-capsule');
      lines.push('Wait — a second capsule jams out behind it, scuffed and ancient. Empty, but for a faded label. The museum has a pedestal for exactly this.');
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
    settleSlots(true); // a bailed-out spin still pays what the reels had fixed — never eat a bet
    casinoRef.current.slot = { ...freshSlots(), bet: slot.bet };
    setOverlayBoth({ type: 'shop', shop: 'slots' });
    setShopTick(v => v + 1);
  }, [setOverlayBoth]);
  const startRoulette = useCallback(() => {
    const prev = casinoRef.current.roul;
    settleRoulette(true); // same: a wheel already spun keeps its result (and clears its interval)
    casinoRef.current.roul = { ...freshRoulette(), bet: prev.bet, kind: prev.kind, pick: prev.pick };
    setOverlayBoth({ type: 'shop', shop: 'roulette' });
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

  // ---- Festival stall minigame ----------------------------------------------
  // A short, cozy interaction played once per festival. Gated purely on storySeen
  // (`festival-<id>-<day>`) so it never repeats that day and needs no state.ts
  // field. goldfish → a small cash keepsake; wish/omikuji → a one-day 'lucky' glow.
  const finishFestival = (fest: Festival, lines: string[], opts: { yen?: number; lucky?: boolean } = {}) => {
    const s = saveRef.current;
    const flag = `festival-${fest.id}-${s.day}`;
    if (!s.storySeen.includes(flag)) s.storySeen.push(flag);
    award('matsuri');
    if (opts.yen) { s.money += opts.yen; sfxCoin(); } else sfxCatch();
    if (opts.lucky) { s.buff = { id: 'lucky', day: s.day }; showToast(`${BUFFS.lucky.emoji} ${BUFFS.lucky.name}`, BUFFS.lucky.desc); }
    persistSave(s); refreshHud();
    showDialog(lines);
  };
  const playFestival = (fest: Festival) => {
    const s = saveRef.current;
    if (s.storySeen.includes(`festival-${fest.id}-${s.day}`)) {
      showDialog([
        fest.minigame === 'goldfish'
          ? 'Your paper scoop is long since soggy and your candy apple is gone. You watch the goldfish dart a while, content. (Come back at the next festival.)'
          : fest.minigame === 'wish'
            ? 'Your tanzaku is already tied high on the bamboo, turning gently in the breeze with all the others. The wish is made.'
            : 'You have drawn your fortune for the year already. No sense pestering the kami for a re-roll.',
      ]);
      return;
    }
    if (fest.minigame === 'goldfish') {
      showDialog(
        ['The kingyo-sukui tub glitters under the lanterns — little goldfish flick and dart through the shallow water. A fresh paper scoop (poi) waits on the rim, but the wet paper tears in a heartbeat. How do you go about it?'],
        'Goldfish Scooping',
        [
          { label: '🎏 Scoop fast', onPick: () => finishFestival(fest, ['You stab the poi in quick. The paper holds just long enough — one orange flash and a goldfish is yours before the net dissolves into mush.', fest.rewardLine], { yen: FESTIVAL_REWARD_YEN }) },
          { label: '🐟 Wait for one to drift close', onPick: () => finishFestival(fest, ['You hold the scoop steady and breathe. A plump goldfish drifts right over the paper — one slow, sure lift, and it is cupped safe in the little bowl.', fest.rewardLine], { yen: FESTIVAL_REWARD_YEN }) },
        ],
      );
    } else if (fest.minigame === 'wish') {
      showDialog(
        ['The bamboo leans against the shrine gate, heavy with paper tanzaku in every color. A brush and a blank strip wait on the little table. They say the stars read the wishes nearest the top.'],
        'Tanabata Wish',
        [
          { label: '🎋 Write your wish and tie it high', onPick: () => finishFestival(fest, ['You write it small and careful, then reach up and tie the strip to the topmost branch, where the stars can read it best. The wind takes it gently.', fest.rewardLine], { lucky: true }) },
        ],
      );
    } else {
      showDialog(
        ['You step up to the rack of omikuji drawers, slip a coin in the box, and shake the hexagonal tin until a single numbered stick slides out. You find the matching drawer and ease it open…'],
        'New Year Omikuji',
        [
          { label: '🎍 Read your fortune', onPick: () => finishFestival(fest, [fest.rewardLine], { lucky: true }) },
        ],
      );
    }
  };

  const handleInteract = useCallback(() => {
    const scene = sceneRef.current;
    const faced = facedTile(posRef.current, dirRef.current);
    const feet = feetTile(posRef.current);
    const s = saveRef.current;

    // Have a word with David the cat (he's wherever he's wandered to).
    if (catRef.current && scene.id === 'apartment') {
      const ct = { x: Math.round(catRef.current.x / TILE), y: Math.round(catRef.current.y / TILE) };
      if ((ct.x === faced.x && ct.y === faced.y) || (ct.x === feet.x && ct.y === feet.y)) {
        catRef.current.sitting = true; catRef.current.napping = false; catRef.current.napTarget = null; catRef.current.timer = 4; // he stirs to address you
        // A heart-threshold hangout with the cat takes priority over his usual one-liners.
        const catHang = pendingHangout(s, 'david');
        if (catHang) { playHangout(catHang); return; }
        const catLines = WISE_CAT_LINES[Math.floor(Math.random() * WISE_CAT_LINES.length)];
        const catFlavor = friendFlavorLine(s, 'david'); // warmer as you bond with him
        // Trailing actions: a once-a-day pet, plus the usual gift offer if carrying one.
        const catActs: DialogAction[] = [
          ...(!catPetToday(s) ? [{ label: 'Pet David 🐾', onPick: doPetCat }] : []),
          ...(giftActionFor('david') ?? []),
        ];
        showDialog(catFlavor ? [...catLines, catFlavor] : catLines, 'David', catActs.length ? catActs : undefined);
        return;
      }
    }

    // Pocket a glinting museum curio you're standing on or facing.
    {
      const find = MUSEUM_FINDS.find(f => f.scene === scene.id
        && !s.collectibles.includes(f.slot) && !s.museum.donated.includes(f.slot)
        && ((f.x === faced.x && f.y === faced.y) || (f.x === feet.x && f.y === feet.y)));
      if (find) {
        const slot = MUSEUM_SLOTS.find(sl => sl.id === find.slot)!;
        s.collectibles.push(find.slot);
        sfxCatch();
        persistSave(s); refreshHud();
        showDialog([
          `Something glints, half-forgotten. You pick it up: "${slot.label}".`,
          slot.blurb,
          'A curio if ever there was one. The Kawamachi Museum has an empty display just its size.',
        ], 'A Curious Find');
        return;
      }
    }

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
        sfxCarStart();
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

    // Shore: grab a daily beach find for instant cash (ungated early money).
    if (scene.id === 'shore') {
      const spots = shoreForageFor(s);
      const idx = spots.findIndex((sp, i) =>
        !s.foragedSpots.includes(i) &&
        ((sp.x === faced.x && sp.y === faced.y) || (sp.x === feet.x && sp.y === feet.y)));
      if (idx >= 0) {
        const spot = spots[idx];
        const kind = forageById(spot.kind);
        const value = Math.round((kind.min + Math.random() * (kind.max - kind.min)) / 10) * 10;
        s.money += value;
        s.foragedSpots.push(idx);
        if (!s.almanac.forage.includes(spot.kind)) s.almanac.forage.push(spot.kind); // Almanac: record the find kind
        mineTextRef.current = { x: spot.x * TILE, y: spot.y * TILE, text: `+¥${value.toLocaleString()}`, color: '#ffd24a', t: 1.1 };
        sfxCoin();
        if (!s.storySeen.includes('forage-howto')) {
          s.storySeen.push('forage-howto');
          showDialog([`${kind.name} — ${kind.blurb} (+¥${value.toLocaleString()})`, 'The bay washes up small finds like this every day. Comb the sand each morning for easy pocket money.']);
        }
        persistSave(s); refreshHud();
        return;
      }
    }

    // Festival prop: on a festival day, standing on / facing the active festival's
    // minigame prop plays its cozy stall game (once per festival — gated below).
    {
      const fest = festivalFor(s.day);
      const lay = fest && fest.scene === scene.id ? FESTIVAL_LAYOUT[scene.id] : null;
      if (fest && lay) {
        const pr = lay.prop;
        if ((faced.x === pr.x && faced.y === pr.y) || (feet.x === pr.x && feet.y === pr.y)) {
          playFestival(fest);
          return;
        }
      }
    }

    // Mines: descend the (randomly-placed) ladder, mine ore / free a geode, or
    // let your weapon do the talking.
    if (scene.id === 'mines') {
      const d = mineDownRef.current;
      if (d && ((faced.x === d.x && faced.y === d.y) || (feet.x === d.x && feet.y === d.y))) {
        const nf = mineFloorRef.current + 1;   // descend one floor; drop in at the top
        mineFloorRef.current = nf;
        enterScene('mines', 2, 1, 'down');
        sfxDescend();
        reachFloor(nf);
        depthToastRef.current = { floor: nf, t: 2.2 };
        return;
      }
      // Treasure vault chest — a rare, one-time-per-visit jackpot.
      const vc = mineChestRef.current;
      if (vc && ((faced.x === vc.x && faced.y === vc.y) || (feet.x === vc.x && feet.y === vc.y))) {
        const haul = lootVault(s, mineFloorRef.current);
        if (!haul) { showDialog(['The vault chest sits open and emptied. You already carried off everything that wasn\'t bolted down.']); return; }
        mineChestOpenRef.current = true;
        sfxMine(1600); sfxCoin();
        sparkleRef.current = { x: vc.x * TILE, y: vc.y * TILE, t: 0.7 };
        mineTextRef.current = { x: vc.x * TILE, y: vc.y * TILE, text: `+¥${haul.cash.toLocaleString()}`, color: '#ffd24a', t: 1.6 };
        const loot = [`${haul.crystals}× Hum Crystal`, `${haul.opals}× Void Opal`];
        if (haul.starstones) loot.push(`${haul.starstones}× Astral Stone`);
        loot.push(`${haul.geodes}× geode`);
        award('vault');
        showDialog([
          'The chest groans open — warm gold light spills across the cavern.',
          `¥${haul.cash.toLocaleString()} in old coin, and a heap of ore: ${loot.join(', ')}.`,
          'You stuff your bag until it creaks. The vault sighs shut behind you.',
        ]);
        persistSave(s); refreshHud();
        return;
      }
      const node = oreNodesRef.current.find(n => n.x === faced.x && n.y === faced.y);
      if (node) {
        const pick = pickaxeOf(s.pickaxe);
        // Hardness gates: geodes and the harder ore need a real pickaxe.
        if (node.geode) {
          if (pick.power < GEODE_HARDNESS) { showDialog(['A sealed geode. Bare hands just bruise on it — you need a real pickaxe.']); return; }
        } else if (pick.power < node.mineral.hardness) {
          showDialog([`The ${node.mineral.name} is too hard for your ${pick.name}. Come back with a better pickaxe.`]); return;
        }
        const cost = energyCost(s, pick.cost);
        if (s.energy < cost) { showDialog(['Too tired to swing. The rock hums smugly.']); return; }
        // Remove the node up front so a second swing can't re-hit it mid-frame.
        oreNodesRef.current = oreNodesRef.current.filter(n => n !== node);
        s.minedNodes.push(minedKey(mineFloorRef.current, node.x, node.y));
        s.energy -= cost;
        sparkleRef.current = { x: node.x * TILE, y: node.y * TILE, t: 0.45 };
        if (node.geode) {
          s.geodes += 1;
          mineTextRef.current = { x: node.x * TILE, y: node.y * TILE, text: 'Geode!', color: '#7ce8e0', t: 1.1 };
          sfxMine(900);
        } else {
          let amount = node.amount ?? 1;
          if (pick.bonusChance > 0 && Math.random() < pick.bonusChance) amount += 1; // pickaxe lucky strike
          s.minerals[node.mineral.id] = (s.minerals[node.mineral.id] ?? 0) + amount;
          if (!s.almanac.minerals.includes(node.mineral.id)) s.almanac.minerals.push(node.mineral.id); // Almanac: record the ore kind
          s.today.mineralsMined += amount;
          gainSkill('mine', 5 + Math.round(node.mineral.value / 60)); // rarer ore, more XP
          mineTextRef.current = {
            x: node.x * TILE, y: node.y * TILE,
            text: amount > 1 ? `+${amount} ${node.mineral.name}` : node.mineral.name,
            color: node.mineral.color, t: 1.1,
          };
          sfxMine(node.mineral.value);
          award('miner');
          if (node.mineral.id === 'starstone') award('astral');
        }
        // Rare deep-mine museum curios: a humming shard (floor 6+), a meteorite (floor 10+).
        const floor = mineFloorRef.current;
        const tryMineCurio = (slot: string, chance: number, label: string) => {
          if (s.collectibles.includes(slot) || s.museum.donated.includes(slot) || Math.random() >= chance) return;
          s.collectibles.push(slot);
          mineTextRef.current = { x: node.x * TILE, y: node.y * TILE - 8, text: label, color: '#ffe9a0', t: 1.6 };
        };
        if (floor >= 10) tryMineCurio('arti-meteor', 0.07, 'A meteorite?!');
        else if (floor >= 6) tryMineCurio('arti-shard', 0.06, 'A humming shard!');
        // ...and, at any depth, the inexplicable: a single chicken nugget.
        tryMineCurio('arti-token', 0.02, 'A single chicken nugget?!');
        persistSave(s); refreshHud();
        return;
      }
    }

    // Today's street event (city only): bump into its actor to interact. Once a
    // day (save.streetEventDay); afterwards it just gives a little "done" line.
    if (scene.id === 'city' && streetEventRef.current
      && faced.x === streetEventRef.current.x && faced.y === streetEventRef.current.y) {
      const ev = streetEventRef.current;
      if (streetEventDoneToday(s)) { showDialog(streetEventDoneLines(ev.id)); return; }
      setOverlayBoth({ type: 'shop', shop: 'street' });
      return;
    }

    // Kinryū patrons: a one-line brush-off if you bug a gambler mid-streak.
    if (scene.id === 'casino') {
      const gam = casinoGamblersFor(s.day).find(g => g.x === faced.x && g.y === faced.y);
      if (gam) { showDialog([gam.line]); return; }
    }

    // Derby chalkboard (shore, derby days only): the drawn DERBY sign is readable —
    // the four prize tiers plus today's running tally. Transient like the casino
    // patrons above (nothing added to maps.ts); the board spans two tiles.
    if (scene.id === TOURNAMENT_SCENE && fishingTournamentDay(s.day)) {
      const onSign = (tt: Vec) => tt.y === DERBY_SIGN.y && (tt.x === DERBY_SIGN.x || tt.x === DERBY_SIGN.x + 1);
      if (onSign(faced) || onSign(feet)) {
        const pts = derbyDayRef.current === s.day ? derbyScoreRef.current : 0;
        const next = TOURNAMENT_TIERS.find(tr => pts < tr.minScore);
        const tierLine = (tr: TournamentTier) => `${tr.name} ${tr.minScore}+ pts → ¥${tr.prize.toLocaleString()}`;
        showDialog([
          `${TOURNAMENT_NAME} — today's chalkboard:`,
          `${tierLine(TOURNAMENT_TIERS[0])} · ${tierLine(TOURNAMENT_TIERS[1])}`,
          `${tierLine(TOURNAMENT_TIERS[2])} · ${tierLine(TOURNAMENT_TIERS[3])}`,
          pts > 0
            ? `Your tally: ${pts} pts — that's the ${tournamentTierFor(pts).name} so far${next ? `. ${next.name} needs ${next.minScore}.` : '. Top of the board!'}`
            : 'Your tally: 0 pts — land a fish off this shore to chalk your name up.',
        ]);
        return;
      }
    }

    // Prefer a wanderer at the faced tile (they move; their static tile is stale).
    const wanderHit = wanderersRef.current.find(w => Math.round(w.x / TILE) === faced.x && Math.round(w.y / TILE) === faced.y);
    const npc = wanderHit
      ? { id: wanderHit.id, x: faced.x, y: faced.y, sprite: wanderHit.sprite, dir: wanderHit.dir }
      : scene.npcs.find(n => n.x === faced.x && n.y === faced.y && !WANDER_IDS.has(n.id)
          && !npcHiddenNow(s, n.id));
    if (npc) {
      // Talk is always the default (no chooser). Befriendable NPCs you actually
      // converse with get a trailing "🎁 Give a gift" button on their last line
      // (see giftActionFor); merchants open their stalls.
      const friendId = FRIEND_OF_NPC[npc.id];
      meetFriendNotify(friendId); // first contact → into the Friends app + a buzz
      checkRegular();             // meeting the last of the cast fires the capstone
      const giftAct = giftActionFor(friendId);
      // A warmer, more personal closing line once you have hearts with them. Below
      // the first threshold (or for non-keyed friends) it's null → conversation
      // unchanged. `warm()` appends it to whatever a branch was going to say.
      const flavor = friendId ? friendFlavorLine(s, friendId) : null;
      const warm = (lines: string[]): string[] => (flavor ? [...lines, flavor] : lines);
      // A crossed-a-heart-threshold hangout plays once, ahead of normal chat. The
      // flag is set inside playHangout, so the very next talk is ordinary again.
      const hangout = friendId ? pendingHangout(s, friendId) : undefined;
      if (hangout) { playHangout(hangout); return; }
      if (npc.id === 'yakuza') {
        if (s.gangPaid) return; // already paid; he's on his way out
        setOverlayBoth({ type: 'shop', shop: 'yakuza' });
        return;
      }
      if (npc.id === 'campfire') { showDialog(['Driftwood crackles, though no one gathered it. The fire smells of the sea — and something older.']); return; }
      // Bigfoot — first met deep in the island cave (a rare, luck-blessed sighting),
      // then forever after a regular at Club Kaiju. Meeting him sets 'bigfoot-met',
      // which is exactly what moves him from the cave (bigfoot-cave) to the club
      // (bigfoot-club) via npcHiddenNow.
      if (npc.id === 'bigfoot-cave' || npc.id === 'bigfoot-club') {
        if (!s.storySeen.includes('bigfoot-met')) {
          s.storySeen.push('bigfoot-met');
          s.money += 3000;
          sfxCatch();
          persistSave(s); refreshHud();
          showDialog([
            'The dark at the back of the cave is not empty. It is breathing. A shape unfolds from it — taller than the doorway you crawled through, shaggy with brown fur gone grey at the muzzle, two amber eyes catching the daylight crack and holding it.',
            'You should run. You do not. He tilts his great head, considering you the way you might consider a stray cat — and decides, apparently, that you are alright.',
            '"...wasn\'t hiding from YOU," he rumbles, in a voice like the tide moving stones. "Hiding from the cameras. The fellas with the long lenses. You\'re not one of those." He almost sounds disappointed for you.',
            'He presses something into your hand — a fat roll of damp banknotes, who knows from where. "For not screaming. Buy yourself a drink. ...Actually—" a slow, enormous grin, "—come find me at the loud place in the bad part of town. Club Kaiju. Big green fella out front knows me. They don\'t blink at a guy like me in there." (+¥3,000)',
          ], 'Bigfoot');
          return;
        }
        showDialog([
          '"Hey! The cave kid!" Bigfoot raises a glass that looks like a thimble in his hand, the club lights strobing across his fur. "Told you they don\'t blink at me in here. Best night spot in the prefecture."',
          'He leans in, conspiratorial, which from him means the whole booth darkens. "Keep the cave thing between us, yeah? A guy needs ONE place nobody\'s pointing a camera. ...Drinks are on me though. You found me. Fair\'s fair."',
        ], 'Bigfoot');
        return;
      }
      // The midnight stranger — a one-time gift, then just eerie company on later nights.
      if (npc.id === 'stranger') {
        if (!s.storySeen.includes('midnight-stranger')) {
          s.storySeen.push('midnight-stranger');
          s.money += 888;
          s.buff = { id: 'lucky', day: s.day };
          sfxCatch();
          persistSave(s); refreshHud();
          showDialog([
            'A figure you did not hear arrive. The streetlight finds nothing under the hood but two pale, patient lights where a face should be.',
            '"Out walking the dead hours too. Good. The city is more honest at this end of the clock — fewer people pretending it is theirs."',
            '"Here. You will want this before the others do." A cold coin drops into your palm, heavier than it has any right to be. The pale lights crease, almost a smile.',
            '"Spend it on something small and warm. And do not come looking for me by daylight — I am not there." (+¥888, and your luck has quietly turned — you feel Lucky today.)',
          ], 'The Stranger');
          return;
        }
        showDialog([
          'The Stranger inclines the hood a fraction. "Still keeping the dead hours, I see. The city suits you better down here at the bottom of the night."',
          'A pale glint where a smile would be, and nothing else. Then the streetlight buzzes, and for a breath you are sure you are alone.',
        ], 'The Stranger');
        return;
      }
      if (npc.id === 'david') {
        if (s.rares.includes('coffin')) {
          showDialog(warm(['Max smiles, firelight catching his teeth. "Sleep well in your new bed, friend. I always do."']), 'Max', giftAct);
          return;
        }
        if ((s.sodas['conk'] ?? 0) > 0) {
          s.sodas['conk'] -= 1;
          s.rares.push('coffin');
          sfxCatch();
          persistSave(s); refreshHud();
          showDialog([
            'Max takes the Conk, drinks, and lets out a long sigh. "...You know, don\'t you."',
            '"Fine. Yes. A vampire. Three hundred and twelve years — the sea air helps with the cravings."',
            '"You kept a stranger company and asked nothing. Take this; an old friend built it. It\'s yours." (Got a rare COFFIN — a new bed for your apartment!)',
          ], 'Max');
          return;
        }
        showDialog(warm([
          'A pale man tends a driftwood fire, though the night is not cold. "Lovely evening. Care to sit?"',
          'His smile is all teeth. "You wouldn\'t happen to have a Conk on you? I have such a... thirst."',
        ]), 'Max', giftAct);
        return;
      }
      if (npc.id === 'sketchy') { setOverlayBoth({ type: 'shop', shop: 'sketchy' }); return; }
      if (npc.id === 'mechanic') { startDelivery(); return; } // Kojima hands out the delivery gig in person
      if (npc.id === 'casino-host') { setOverlayBoth({ type: 'shop', shop: 'casino' }); return; }
      // The Kinryū boss, at the back of the backroom. First audience comps you
      // for the trouble of winning; after that he mostly tolerates you.
      if (npc.id === 'kinryu-boss') {
        if (!s.storySeen.includes('backroom-met')) {
          s.storySeen.push('backroom-met');
          s.money += 10000;
          sfxCoin(); persistSave(s); refreshHud();
          showDialog([
            'The back of the room holds one table, one lamp, and one enormous man in a suit that fits like architecture. He does not look up from his tea.',
            `"${BACKROOM_WINS} wins. We keep count, {name}. Most people leave their money here. You keep walking out with ours."`,
            '"I respect a problem I can name." He slides an envelope across the felt without touching your hand. "A courtesy, from the Kinryū. Spend it on the floor, where I can win it back." (+¥10,000)',
          ], 'The Kinryū Boss');
        } else {
          showDialog([
            'He turns a teacup a quarter-rotation on its saucer. The lamp hums.',
            '"The table is open. The tea is not for you."',
          ], 'The Kinryū Boss');
        }
        return;
      }
      if (npc.id === 'monster') {
        // Once you own every one of his rares, The Manager lets you in on the
        // secret: there's a way to Paris hidden in the backrooms. (Feature #19.)
        if (s.monsterFed && allRaresOwned(s) && !s.parisRevealed) { revealParis(); return; }
        setOverlayBoth({ type: 'shop', shop: 'monster' });
        return;
      }
      // Tex no longer opens a whole shop for one hat — he sells it right here in
      // conversation, via an end-of-dialog action (Task: talk-first selling).
      if (npc.id === 'tex') {
        if (s.hat) {
          showDialog(warm([
            '"Well howdy. That hat\'s ridin\' good on ya — knew it would the second I saw your head."',
            'Tex tips his own brim. "Out here it\'s just me, the hats, and the sea breeze. One hat, one price, one dream. Looks like you\'re livin\' it, partner."',
          ]), 'Tex', giftAct);
        } else if (s.money < 6700) {
          showDialog([
            'Tex pulls a cowboy hat from a sack slung over his shoulder. "Genuine article, this. Sixty-seven dollars."',
            '"...That\'s ¥6,700 to you. Tex does not negotiate."',
            'He eyes your wallet, not unkindly. "Come back with more yen, partner. The hat ain\'t goin\' nowhere. Neither am I."',
          ].concat(flavor ? [flavor] : []), 'Tex', giftAct);
        } else {
          showDialog(warm([
            'Tex pulls a cowboy hat from a sack slung over his shoulder. "Genuine article, this. Sixty-seven dollars."',
            '"...That\'s ¥6,700. Tex does not negotiate. You\'ll wear it forever — and you\'ll thank me forever, too."',
          ]), 'Tex', [{ label: 'Buy · ¥6,700', onPick: buyHat }, ...(giftAct ?? [])]);
        }
        return;
      }
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
      // Already learned: Genji runs a tiny tackle stall — he'll sell the rod he
      // never used to chase the carp (deeper water, bigger fish, faster reel).
      if (npc.id === 'old-man') { setOverlayBoth({ type: 'shop', shop: 'genji' }); return; }
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
      // Bingus the curator: introduces the museum + reports donation progress.
      if (npc.id === 'bingus') {
        // Carrying something he's after → offer the donation first (the confirm
        // panel spells out donation-vs-gift and has a JUST CHAT escape hatch).
        if (bingusHeldFetch(s)) { setOverlayBoth({ type: 'shop', shop: 'bingus-fetch' }); return; }
        bingusTalk();
        return;
      }
      // Granny Soto (out in the city): she gatekeeps the community greenhouse
      // behind a small fish errand — she adores a fresh fish. Speaker EXACTLY
      // 'Granny Sato' so her authored portrait shows.
      if (npc.id === 'granny' && !s.greenhouseUnlocked) {
        if (s.fishInv.length > 0) {
          setOverlayBoth({ type: 'shop', shop: 'granny-fish' }); // ask before taking it
        } else {
          showDialog([
            'That glass house east of the apartments? The community greenhouse — mine to mind, the neighborhood\'s really. Locked up tight these days.',
            'I might just hand you the key... if you do an old woman a kindness first. I do love a fresh fish.',
            'Bring me one from Sumikawa Shore and the greenhouse is yours to tend.',
          ], 'Granny Sato', giftAct);
        }
        return;
      }
      // Charlie the filmmaker: ordinary chatter, plus a one-time "sponsor the
      // film" reply (becomes his patron / your executive-producer keepsake).
      if (npc.id === 'charlie') {
        const v = NPC_VOICES['charlie'];
        const set = v.sets[Math.floor(Math.random() * v.sets.length)];
        const sponsorAct: DialogAction[] = s.charliePatron
          ? []
          : [{ label: '🎬 Sponsor the film · ¥40,000', onPick: sponsorCharlieFilm }];
        showDialog(warm([...set, ...npcDynamicLines('charlie', s)]), v.speaker, [...sponsorAct, ...(giftAct ?? [])]);
        return;
      }
      const voice = NPC_VOICES[npc.id];
      if (voice) {
        const set = voice.sets[Math.floor(Math.random() * voice.sets.length)];
        showDialog(warm([...set, ...npcDynamicLines(npc.id, s)]), voice.speaker, giftAct);
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
      // Mines: no ladder, no ore, nobody — your weapon speaks
      if (scene.id === 'mines') {
        if (s.gun) return; // AK-67 is full-auto; firing is handled in the update loop (hold E)
        if (s.wand) {
          const d = dirRef.current;
          const SPD = 190;
          projectilesRef.current.push({
            x: posRef.current.x + 4, y: posRef.current.y + 4,
            dx: d === 'left' ? -SPD : d === 'right' ? SPD : 0,
            dy: d === 'up' ? -SPD : d === 'down' ? SPD : 0,
            t: 0.8, pierce: s.wand2, dmg: 1, // upgraded wand bolts punch through crawlers
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
      case 'trophy-shelf': {
        const owned = GACHA_FIGURES.filter(n => (s.gacha[n] ?? 0) > 0);
        const dupes = owned.filter(n => (s.gacha[n] ?? 0) > 1);
        if (owned.length === 0) {
          showDialog(['An empty display shelf, waiting. Win some gachapon figures across town and they\'ll move in here.']);
        } else {
          const list = owned.map(n => { const c = s.gacha[n] ?? 0; return c > 1 ? `${n} ×${c}` : n; }).join(', ');
          showDialog([
            `Your gachapon shelf: ${owned.length}/${GACHA_FIGURES.length} figures.`,
            list,
            dupes.length
              ? 'The duplicates huddle together. You tell yourself they have personality.'
              : owned.length === GACHA_FIGURES.length
                ? 'Every last one. Mr. Maeda would weep.'
                : 'Gaps in the lineup. The hunt continues.',
          ]);
        }
        break;
      }
      case 'vending': useVending(); break;
      case 'gig-terminal': {
        // First-ever look at the kiosk: explain the courier-terminal loop in-world
        // before the normal errand flow, then roll straight into today's request.
        if (!s.storySeen.includes('gig-intro')) {
          s.storySeen.push('gig-intro');
          persistSave(s);
          const e0 = errandFor(s);
          showDialog([
            'COURIER TERMINAL — a battered kiosk: one deposit slot, a screen blinking for your attention.',
            'It works like this: a client posts a gig asking for one specific item. You DEPOSIT what they want into the slot, and a courier swings by to collect it.',
            'Drop the right goods and the terminal counts out the gig fee on the spot. A fresh request posts every morning.',
            `Today's screen reads — ${e0.ask}`,
          ]);
          break;
        }
        if (errandDoneToday(s)) { showDialog(['The terminal blinks: "NO OPEN GIGS — you cleared today\'s request. New one posts in the morning."']); break; }
        const e = errandFor(s);
        const have = e.kind === 'peepis' ? s.peepis > 0
          : e.kind === 'soda' ? (s.sodas[e.want!] ?? 0) > 0
          : e.kind === 'fish' ? s.fishInv.length > 0
          : s.coconuts > 0;
        // Carrying the goods → the kiosk offers the deposit slot; else the screen
        // just shows the request (what's wanted + where to get it).
        if (have) setOverlayBoth({ type: 'shop', shop: 'errand' });
        else showDialog([e.ask], e.giver);
        break;
      }
      case 'gh-poster': {
        showDialog([
          '— COMMUNITY GREENHOUSE — a hand-lettered poster, Granny Soto\'s tidy hand —',
          '1. Buy SEEDS at the supply counter, then press one into an empty soil bed.',
          '2. WATER each bed once a day (or buy a SPRINKLER to do it for you). Miss a day and it sulks.',
          '3. Tend it well — and earn the shrine\'s favor — for SILVER and GOLD harvests worth far more.',
          '4. Drop the harvest in the SHIPPING BOX; a buyer pays at dawn. Fill Granny\'s community REQUESTS for big bonuses.',
          '5. Reinvest: fertilizer, more beds, a bigger glasshouse. Rumor says the shrine keeps a seed that blooms at midnight.',
        ]);
        break;
      }
      case 'vending-dead':
        showDialog(['OUT OF ORDER, says the sign. Behind the glass, one light still blinks.', 'Something inside hisses softly. You decide you were never thirsty.']);
        break;
      case 'cat-dumpster':
        if (!s.cat.found) {
          s.cat.found = true;
          s.cat.name = 'David';
          meetFriend(s, 'david'); // the cat enters your Friends app on first meet
          award('nine-lives');
          sfxCatch();
          persistSave(s); refreshHud();
          showToast('David — new contact', 'Saved to your phone’s Friends app.', '💛');
          checkRegular(); // adopting the cat may complete the whole cast
          showDialog([
            'Something shifts in the dumpster. Two eyes, like old coins, blink open in the dark.',
            'A black cat unfolds itself onto the lip of the bin and regards you with ancient patience.',
            '"I am David," it says. You did not know cats could speak. This one, evidently, can — and has decided you are worth the breath.',
            '"I have seen this city eat better people than you. I think I shall keep an eye on you. Leave a door open." And he pads off toward home.',
          ], 'David');
        } else {
          showDialog(['Just a dumpster now, smelling of yesterday. David has moved into your apartment and, frankly, improved it.']);
        }
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
        // Once-only restoration is offered as a trailing reply on whatever the
        // shrine says, until you've funded it (then it never shows again).
        const restoreAct: DialogAction[] | undefined = s.shrineRestored
          ? undefined
          : [{ label: '⛩️ Fund the restoration · ¥80,000', onPick: fundShrineRestoration }];
        if (s.shrineDay === s.day) { showDialog(['You have already made your offering today. The kami are not a vending machine.', 'Come back tomorrow.'], undefined, restoreAct); break; }
        if (s.money < 500) { showDialog(['The offering box waits patiently. It has waited longer than you have been broke.'], undefined, restoreAct); break; }
        s.money -= 500;
        s.shrineDay = s.day;
        const prevTier = shrineLuck(s);
        s.donated += 500;
        const tier = shrineLuck(s);
        sfxCoin();
        if (tier === 1) award('blessed');
        // Offer while it's raining → 25% chance the rain suddenly stops for the day.
        const stoppedRain = isRainyDay(s) && Math.random() < 0.25;
        if (stoppedRain) s.rainCleared = true;
        persistSave(s); refreshHud();
        if (stoppedRain) {
          showDialog([
            'You drop the coin, bow twice, clap twice — and above you the rain thins to nothing. The clouds peel back like a curtain.',
            'Yoshi does not look the least bit surprised.',
          ], 'the shrine', restoreAct);
          break;
        }
        // Earning the shrine's deepest favor (¥20k offered) → Yoshi gifts the Moonflower seed, once.
        if (grantMoonSeed(s)) {
          sfxCatch(); persistSave(s); refreshHud();
          showDialog([
            'The shrine seems to lean toward you. Then Yoshi steps close, something cupped in her hands.',
            'She presses a single dark seed into your palm. "A Moonflower. It blooms only in the greenhouse, and only after midnight — for someone the kami has come to trust."',
            '"Plant it. See what the favor you have earned can grow." (Got a MOONFLOWER SEED — plant it in the greenhouse.)',
          ], 'Yoshi', restoreAct);
          break;
        }
        if (tier > prevTier) {
          sfxCatch();
          showDialog([
            tier === 1
              ? 'The coin drops. The wind shifts. Somewhere, the water feels friendlier. (Fishing luck up!)'
              : 'The whole shrine seems to lean toward you approvingly. (Fishing luck way up!)',
          ], undefined, restoreAct);
        } else {
          const lines: [string, string?][] = [
            ['Clink. You bow twice, clap twice, and ask for nothing in particular.', undefined],
            [`Clink. (Total offered: ¥${s.donated.toLocaleString()})`, undefined],
            ['Clink. A crow watches you with what might be respect.', undefined],
            ['"The kami noticed that. It notices everything, eventually. It is just not in a hurry about it."', 'Yoshi'],
            ['"Generous today. Careful — the kami remembers kindness, and it has a long memory and short legs."', 'Yoshi'],
            ['"You did the bow a little crooked. The kami forgives crooked bows. It is the straight ones it suspects."', 'Yoshi'],
          ];
          const pick = lines[Math.floor(Math.random() * lines.length)];
          showDialog([pick[0]], pick[1], restoreAct);
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
          parisGlitchRef.current = 1.9; // you glitch/materialize into the map like a render finishing
          if (!s.storySeen.includes('paris-intro')) {
            s.storySeen.push('paris-intro');
            award('bon-voyage');
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
        if (!s.wand && !s.gun) {
          // Jean-Pierre hustles over from across the room and physically heads you
          // off the ladder instead of warning you from his corner. (One at a time.)
          if (!cutsceneRef.current) {
            cutsceneRef.current = {
              actor: { x: 6 * TILE, y: 6 * TILE, dir: 'down', sprite: 'npc-tourist' },
              phase: 'approach',
              path: [{ x: 6 * TILE, y: 9 * TILE }, { x: 11 * TILE, y: 9 * TILE }],
              home: { x: 6 * TILE, y: 6 * TILE },
              hideNpc: 'tourist',
              then: () => showDialog([
                'Jean-Pierre scrambles across the room and plants himself between you and the ladder, a little out of breath.',
                '"Non non non, mon ami. Down zere? Wizout ze sparkle stick? Zey will EAT you. Conceptually AND literally."',
                '"Ze big monsieur sells ze magical girl wand. Buy first. Descend second. Zis is ze order of operations."',
              ], 'Jean-Pierre'),
            };
          }
          break;
        }
        mineFloorRef.current = 1;       // a dive from the surface always starts at the top floor
        enterMineStreak(s);             // count today's visit toward the daily streak
        enterScene('mines', 2, 1, 'down');
        reachFloor(1);
        if (!s.storySeen.includes('mines-intro')) {
          s.storySeen.push('mines-intro');
          persistSave(s);
          showDialog([
            'The ladder goes down further than ladders should.',
            'The walls glitter with something that is not quite mineral and not quite awake.',
            'A second ladder waits in the far corner — and below that, another. It keeps going down.',
            'Things skitter at the edge of the lamplight — but your weapon minds them on its own, snapping at whatever crawls too close. Keep your hands on the rock and your feet moving.',
          ]);
        }
        break;
      case 'ascend':
        mineFloorRef.current = 1;       // climbing out takes you all the way back to the surface
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
      case 'job-dispatch': startDelivery(); break; // Kojima's wall clipboard also starts the delivery race
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
      case 'banana': {
        if (s.palmDay !== s.day) { s.palmDay = s.day; s.palmsShaken = []; }
        const key = `${target.x},${target.y}`;
        if (s.palmsShaken.includes(key)) { showDialog(['This banana palm is picked clean for today. Its leaves rustle a polite no.']); break; }
        s.palmsShaken.push(key);
        s.energy = Math.min(maxEnergy(s), s.energy + 8);
        sfxCatch();
        persistSave(s); refreshHud();
        showDialog(['You tug down a ripe banana and eat it right there. Sweet, sun-warm, gone in three bites. (+8 energy)']);
        break;
      }
      case 'onsen': {
        if (s.onsenDay === s.day) { showDialog(['You have already had your soak today. The spring steams on, patient as a cat.']); break; }
        s.onsenDay = s.day;
        { const max = maxEnergy(s); s.energy = Math.min(max, s.energy + Math.round(max * 0.5)); }
        s.buff = { id: 'warm', day: s.day };
        sfxCatch();
        persistSave(s); refreshHud();
        showDialog([
          'You ease into the hot spring — mineral water, volcano-warmed, up to your chin. Below, the whole bay glitters.',
          'Some of the ache lets go. (Energy half restored, and you are Warmed for the day — everything costs less.)',
        ]);
        break;
      }
      case 'home-onsen': {
        if (!homeSoak(s)) {
          showDialog(['You have already soaked today. The little tub steams on, patient, waiting for tomorrow.']);
          break;
        }
        sfxCatch();
        persistSave(s); refreshHud();
        showDialog([
          'You sink into your very own hinoki tub, mineral water up to your chin, the city humming somewhere beyond the wall.',
          'Bliss. No island, no ferry — just home. (Energy restored, and you are Warmed for the day — everything costs less.)',
        ]);
        break;
      }
      case 'island-sign': {
        showDialog([
          'A weathered signpost, hand-painted: "WELCOME TO KIWAMI ISLAND."',
          'Below, in smaller letters: "Pop. mostly crabs. Mind the volcano — she smokes, she rarely roars. Swim the lagoon, shake the palms, soak in the spring."',
          'Someone has scratched a tiny heart into the corner. The sea breeze smells of salt and sweet fruit. You could get used to this.',
        ], 'Kiwami Island');
        break;
      }
      case 'island-bottle': {
        if (s.storySeen.includes('island-bottle')) { showDialog(['Just an empty bottle now, catching the light. Whatever it carried, it carried to you.']); break; }
        s.storySeen.push('island-bottle');
        s.money += 1200;
        sfxCoin();
        persistSave(s); refreshHud();
        showDialog([
          'Half-buried in the sand: a green bottle with a curl of paper inside. You work the salt-stiff cork loose.',
          'The note is water-stained, the hand old-fashioned. "To whoever finds this — the island keeps more secrets than it tells. Look for the ones that look back. — K."',
          'Folded inside are a few damp banknotes and a pressed flower from a plant you do not recognise. (+¥1,200, and a small chill down your spine.)',
        ]);
        break;
      }
      // ---- Hidden discoverables (each fires once, then a short flavor line) ----
      // 1) Island sea cave — a crack in the volcanic rock you can actually squeeze
      //    into: enters the real `seacave` scene (the nest egg lives in its niche).
      case 'island-cave': {
        enterScene('seacave', 5, 5, 'up');
        showDialog(['A hairline crack in the volcanic rock — too straight to be natural. You turn sideways, breathe in, and squeeze into a sea cave the island forgot it had.']);
        break;
      }
      // The nest-egg niche inside the sea cave (preserves the one-time 'island-cave' gate).
      case 'seacave-niche': {
        if (s.storySeen.includes('island-cave')) { showDialog(['The niche is empty now — you have already taken what the dark was keeping. The whole ocean still breathes in and out through the stone.']); break; }
        s.storySeen.push('island-cave');
        s.money += 5000;
        sfxCoin();
        persistSave(s); refreshHud();
        showDialog([
          'Inside it is cold and far louder than the surface: the whole ocean breathing in and out through the stone. The walls are scratched with tally-marks no one is left to explain.',
          'In a niche, bound in oilcloth gone hard as bark, someone\'s buried nest egg — old coins, salt-blackened but real, hidden against a worse day than they ever lived to see. You take them, and whisper a thank-you to the dark. (+¥5,000)',
        ]);
        break;
      }
      // Sift the sea-cave floor — once a day, the tide leaves something in the dark.
      // What you turn up is luck-gated (see seacaveDrop): mostly damp coins, but a
      // blessed day can cough up a Void Opal or even an Astral Stone.
      case 'seacave-search': {
        if (seacaveSearchDoneToday(s)) { showDialog(['You\'ve already worked over the cave floor today. The tide will rearrange the dark by morning — come back then.']); break; }
        const cost = energyCost(s, SEACAVE_SEARCH_COST);
        if (s.energy < cost) { showDialog(['You haven\'t the strength left to dig through wet shingle and stone. Rest first, then come back to the dark.']); break; }
        s.energy -= cost;
        s.caveDropDay = s.day;
        const drop = seacaveDrop(s);
        if (drop.mineralId) {
          const m = mineralById(drop.mineralId);
          s.minerals[drop.mineralId] = (s.minerals[drop.mineralId] ?? 0) + drop.count;
          if (!s.almanac.minerals.includes(drop.mineralId)) s.almanac.minerals.push(drop.mineralId);
          sfxMine(m.value);
          persistSave(s); refreshHud();
          showDialog([
            'You sink your hands into the cold shingle where the tide has been working, and the dark gives something up.',
            `Wedged in the wet stone: ${drop.count > 1 ? `${drop.count}× ` : ''}${m.name}, salt-bright and impossibly out of place down here. (+${drop.count > 1 ? `${drop.count}× ` : ''}${m.name})`,
          ]);
        } else {
          s.money += drop.money;
          sfxCoin();
          persistSave(s); refreshHud();
          showDialog([
            'You sink your hands into the cold shingle where the tide has been working, sifting for whatever the sea decided to leave.',
            `A scatter of salt-blackened coins, sand-cold against your palm. Not a fortune — but the cave rarely sends you away empty. (+¥${drop.money.toLocaleString()})`,
          ]);
        }
        break;
      }
      // 2) Shore stargazing — only after dark; spot the Sleeping Cat constellation.
      case 'stargaze': {
        if (nightT(s) < 0.45) { showDialog(['You tip your head back. Just the wide blue afternoon — a gull, the smell of salt, no stars to speak of. They keep their own hours. Come back after dark.']); break; }
        if (s.storySeen.includes('stargaze')) { showDialog(['You lie back in the cool dune grass and find the Sleeping Cat again, curled exactly where you left her. Some things stay put. It is a quiet comfort.']); break; }
        s.storySeen.push('stargaze');
        s.energy = maxEnergy(s);
        sfxCatch();
        persistSave(s); refreshHud();
        showDialog([
          'You lie back on the dark dune grass and let your eyes adjust, until the whole sky comes out at once — far more stars than a city has any right to show.',
          'You trace a shape you half-remember: a long curl of stars with two bright points for eyes. The old fishermen call it the Sleeping Cat — it keeps watch on the tide, they say, so the sailors do not have to.',
          'You stay until the cold finds you, and the wondering empties your head of every heavy thing in it. (You feel rested right down to the bone — energy restored.)',
        ]);
        break;
      }
      case 'tiki': setOverlayBoth({ type: 'shop', shop: 'tiki' }); break;
      case 'zama-poster':
        if (!s.zamazonkApp) {
          s.zamazonkApp = true;
          sfxCoin();
          persistSave(s); refreshHud();
          showDialog([
            'A glossy poster, half-peeled by the salt wind: "ZamaZonk™ — the Everything Store. NOW ON YOUR PHONE."',
            'A little code shimmers in the corner. Your phone buzzes on its own. …The ZamaZonk app is now installed. You do not recall agreeing to this.',
            'Order furniture from anywhere; it lands in your boxes by morning. Open your phone (P) → the new ZamaZonk app. 📦',
          ]);
        } else {
          showDialog(['The ZamaZonk poster smiles its cardboard smile. The app is already on your phone. It is always on your phone now.']);
        }
        break;
      case 'casino-slots': startSlots(); break;
      case 'casino-blackjack': startBlackjack(); break;
      case 'casino-roulette': startRoulette(); break;
      case 'backroom-table': startBlackjack(); break; // the boss's private table deals the same game
      case 'fish-tropical': startCast(faced, 'tropical'); break;
      case 'fish-spot': startCast(faced, 'shallow'); break;
      case 'museum-display': {
        // Find the slot at the faced (or feet) tile.
        const slot = MUSEUM_SLOTS.find(sl =>
          (sl.x === faced.x && sl.y === faced.y) || (sl.x === feet.x && sl.y === feet.y));
        if (!slot) break;
        if (s.museum.donated.includes(slot.id)) {
          showDialog([`"${slot.label}"`, slot.blurb], 'Museum');
        } else if (s.collectibles.includes(slot.id)) {
          // You're holding exactly the piece this display wants — donate it.
          donateToMuseum(s, slot.id);
          s.collectibles = s.collectibles.filter(c => c !== slot.id);
          sfxCatch();
          const done = museumComplete(s);
          if (done) { s.money += 10000; award('curator'); }
          persistSave(s); refreshHud();
          if (done) {
            showDialog([
              `You set "${slot.label}" in place. It fits as though it had always belonged.`,
              'Bingus Doofelsmurt goes very still. Then, quietly, he begins to weep.',
              '"It is complete. After all these years — the Kawamachi Museum is WHOLE." He presses a thick envelope into your hands. (+¥10,000)',
            ], 'Bingus');
          } else {
            const n = s.museum.donated.length;
            showDialog([
              `You donate "${slot.label}". Bingus cradles it like a newborn.`,
              `"Magnificent! ${n} of ${MUSEUM_SLOTS.length} displays filled. The collection grows!"`,
            ], 'Bingus');
          }
        } else {
          const what = slot.kind === 'art' ? 'frame' : 'pedestal';
          showDialog([
            `An empty ${what}. A little brass plate reads: "${slot.label}".`,
            'This display is empty — Bingus is waiting for the right piece. (You\'ll know it when you find it.)',
          ], 'Museum');
        }
        break;
      }
      // Granny's supply counter: seeds, fertilizer, sprinkler, expansions, tiers.
      case 'gh-supply': setOverlayBoth({ type: 'shop', shop: 'greenhouse-supply' }); break;
      // The shipping box: report what's waiting to sell at dawn.
      case 'gh-shipbox': {
        const box = s.greenhouse.shipped;
        if (box.length === 0) { showDialog(['The shipping box is empty.', 'Harvest a crop and drop it in — a buyer collects at dawn and leaves the yen by morning.']); break; }
        const total = box.reduce((a, b) => a + b.value, 0);
        showDialog([
          `${box.length} item${box.length > 1 ? 's' : ''} in the box, worth ¥${total.toLocaleString()} all together.`,
          'The buyer comes at dawn. The money will be in your account by morning.',
        ]);
        break;
      }
      // Greenhouse soil plot: open the plot menu (plant / water / fertilize / harvest).
      case 'gh-plot': {
        const idx = GREENHOUSE_PLOTS.findIndex(pl => pl.x === target!.x && pl.y === target!.y);
        if (idx < 0) break;
        if (idx >= s.greenhouse.beds) {
          showDialog(['This bed isn\'t tilled yet.', 'Granny can break new ground for you at the supply counter.']);
          break;
        }
        // One-press watering: if you're facing/standing on a planted, growing,
        // un-sprinklered bed that's still dry today, water it right here — no menu.
        // (Planting, harvesting, fertilizing, or a watered/empty bed open the menu.)
        const gp = s.greenhouse.plots[idx];
        if (gp.crop && !plotReady(gp) && !s.greenhouse.sprinkler && gp.wateredDay !== s.day) {
          waterPlot(s, idx);
          sfxDrip(); persistSave(s); refreshHud();
          mineTextRef.current = { x: target!.x * TILE, y: target!.y * TILE - 6, text: '💧 watered', color: '#7ce8e0', t: 1.1 };
          break;
        }
        ghPlotRef.current = idx;
        setOverlayBoth({ type: 'shop', shop: 'greenhouse-plot' });
        break;
      }
    }
  }, [doSleep, sleepRect, showDialog, useVending, setOverlayBoth, startCast, rollGacha, startSlots, startBlackjack, startRoulette, enterScene, refreshHud, runTransition, award, playMusicFor, reachFloor]);

  // ---- update -----------------------------------------------------------------

  const advanceDialog = useCallback(() => {
    const ov = overlayRef.current;
    if (!ov || ov.type !== 'dialog') return;
    // Stardew behavior: while still typing, the first press snaps the line fully
    // revealed; only once fully shown does a press advance to the next line.
    const full = (ov.lines[ov.idx] ?? '').length;
    if (typedRef.current < full) { typedRef.current = full; setTyped(full); return; }
    if (ov.idx + 1 < ov.lines.length) setOverlayBoth({ ...ov, idx: ov.idx + 1 });
    // Last line with trailing actions: don't auto-close — the buttons take over.
    else if (!ov.actions || ov.actions.length === 0) setOverlayBoth(null);
  }, [setOverlayBoth]);

  const update = useCallback((dt: number) => {
    const input = inputRef.current;
    input.pollGamepad(); // fold controller state in before reading input
    const ov = overlayRef.current;

    if (ov) {
      if (ov.type === 'dialog') {
        // On the FINAL line with trailing actions (e.g. "🎁 Give a gift") the box
        // becomes a navroot: useUiNav drives the buttons, so the engine just
        // discards interact (no auto-close) and lets B/Esc close. Otherwise it's
        // the usual snap-then-advance, closing past the last line.
        const lineLen = (ov.lines[ov.idx] ?? '').length;
        const actionPhase = ov.idx === ov.lines.length - 1
          && !!ov.actions && ov.actions.length > 0
          && typedRef.current >= lineLen;
        if (actionPhase) {
          const interact = input.consumeInteract();
          const cancel = input.consumeCancel();
          if (cancel) setOverlayBoth(null);
          else if (interact) {
            // E/A on the final line activates the focused button. "Done" is the
            // first (default-focused) button, so a normal press just ends the
            // chat; arrow/stick over to reach the gift/buy options. On gamepad,
            // useUiNav already maps A → focused button, so the engine only drives
            // keyboard/pointer here to avoid a double activation.
            if (document.body.dataset.input !== 'gamepad') {
              const el = document.activeElement as HTMLElement | null;
              if (el && el.tagName === 'BUTTON' && el.closest('[data-navroot]')) el.click();
              else setOverlayBoth(null);
            }
          }
        } else if (input.consumeInteract() || input.consumeCancel()) {
          advanceDialog();
        }
        input.consumeInventory();
      } else if (ov.type === 'letter') {
        if (input.consumeInteract() || input.consumeCancel()) setOverlayBoth(null);
        input.consumeInventory();
      } else if (ov.type === 'shop' || ov.type === 'cook' || ov.type === 'gift') {
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

    // Jean-Pierre rescue: he talks (during the dialog above), then walks out. Your
    // input stays locked the whole time — you can't get up until he's gone.
    if (cutsceneRef.current) {
      const cs = cutsceneRef.current;
      input.consumeInteract(); input.consumeInventory(); input.consumeCancel();
      movingRef.current = false;
      if (cs.phase === 'talk') {
        cs.phase = 'walk'; // the rescue dialog was dismissed — time for him to leave
      } else if (cs.phase === 'warn') {
        // his warning was dismissed — turn around and walk back to where he stood
        cs.phase = 'return';
        if (cs.home) cs.path = [cs.home];
      } else {
        const wp = cs.path[0];
        if (!wp) {
          if (cs.phase === 'approach') {
            // reached you — face you, deliver the line (which opens a dialog and
            // freezes this block until dismissed), then he'll walk back.
            cs.phase = 'warn';
            cs.then?.();
          } else {
            cutsceneRef.current = null; // 'walk' (out the door) or 'return' (home) — you're free
          }
        } else {
          const a = cs.actor;
          const step = 70 * dt;
          const ddx = wp.x - a.x, ddy = wp.y - a.y;
          if (Math.abs(ddx) <= step && Math.abs(ddy) <= step) { a.x = wp.x; a.y = wp.y; cs.path.shift(); }
          else if (Math.abs(ddx) > Math.abs(ddy)) { a.x += Math.sign(ddx) * step; a.dir = ddx > 0 ? 'right' : 'left'; }
          else { a.y += Math.sign(ddy) * step; a.dir = ddy > 0 ? 'down' : 'up'; }
        }
      }
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

    // The day rolls on whenever you're out in the world (incl. fishing) — but NOT
    // during the ref-mode performances (karaoke / shift QTE / delivery race): they
    // run on their own timers, and letting the 2 AM collapse fire mid-song left the
    // minigame ref alive through doSleep (frozen lane + orphaned audio at home).
    if (!karaokeRef.current && !shiftRef.current && !driveRef.current) {
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
        // 2 AM: you fade out. Pass out on the shrine grounds and Yoshi walks you
        // home; anywhere else, the city carries you back as usual.
        doSleep(true, false, sceneRef.current.id === 'shrine' ? 'yoshi' : undefined);
        return;
      }
    }

    // Meteor-shower wish: the rare clear-night sky grants ONE wish per shower. The
    // first moment you stand under it after dark, a quiet prompt fires on its own —
    // making the wish stamps `wishDay` (so it never re-fires that shower-night) and
    // seeds TOMORROW with the `lucky` buff (buffs read by their own day, so it lights
    // up after you sleep). Reaches here only with no overlay/cutscene open.
    {
      const sw = saveRef.current;
      if (sceneRef.current.outdoor && sw.wishDay !== sw.day
        && nightT(sw) > 0.2 && meteorNight(sw)) {
        sw.wishDay = sw.day;
        sw.buff = { id: 'lucky', day: sw.day + 1 };
        persistSave(sw);
        movingRef.current = false;
        showDialog([
          'A streak of light tears the dark — then another, and another. The whole sky is falling in slow silver lines.',
          'You do what people have always done under skies like this. You shut your eyes, and you wish.',
          'Something far away seems to hear you. Tomorrow will lean a little your way. 🍀',
        ]);
        return;
      }
    }

    // Gentle NPC wandering (e.g. Granny pacing her block — never far from home).
    for (const w of wanderersRef.current) {
      // Routine folk steer toward their current time-block target instead of
      // their spawn: we just retarget their "home" each tick, so the existing
      // leash (head back when >2.2 tiles away) walks them there, then lets them
      // idle nearby once arrived. Non-routine wanderers keep their spawn home.
      const rt = routineTargetFor(w.id, saveRef.current.timeMin);
      if (rt) { w.homeX = rt.x * TILE; w.homeY = rt.y * TILE; }
      w.stepT -= dt;
      // A player standing right next to a walker makes them PAUSE and turn to
      // face you (Stardew-style) — chasing a moving NPC to talk (Bingus!) felt
      // bad. Dancers keep dancing. Resumes naturally once you step away (the
      // re-decision timer only starts counting back down then).
      {
        const pdx = posRef.current.x - w.x, pdy = posRef.current.y - w.y;
        if (Math.abs(pdx) <= 22 && Math.abs(pdy) <= 22 && !DANCER_IDS.has(w.id)) {
          if (w.moving) { w.moving = false; w.walkPhase = 0; }
          w.dir = Math.abs(pdx) > Math.abs(pdy) ? (pdx > 0 ? 'right' : 'left') : (pdy > 0 ? 'down' : 'up');
          w.stepT = Math.max(w.stepT, 0.8); // hold still while being addressed
        }
      }
      if (w.stepT <= 0) {
        w.stepT = 1.2 + Math.random() * 2.8;
        const dx = w.homeX - w.x, dy = w.homeY - w.y;
        if (Math.abs(dx) + Math.abs(dy) > 2.2 * TILE) { // wandered too far — head back
          w.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
          w.moving = true;
        } else {
          // Everyone mostly stands; only now and then do they amble a few steps.
          // (Dancers bob in place even more.)
          w.moving = Math.random() < (DANCER_IDS.has(w.id) ? 0.22 : 0.25);
          if (w.moving) w.dir = (['up', 'down', 'left', 'right'] as Dir[])[Math.floor(Math.random() * 4)];
        }
      }
      if (w.moving) {
        const sp = 20 * dt; // slow shuffle
        // One step in a direction, against the wander block set (solids + warps) so
        // an NPC never walks onto a wall, prop, or doorway. Returns whether it moved.
        const stepDir = (d: Dir): boolean => {
          const next = tryMove(sceneRef.current, { x: w.x, y: w.y },
            d === 'left' ? -sp : d === 'right' ? sp : 0,
            d === 'up' ? -sp : d === 'down' ? sp : 0,
            wanderBlockRef.current);
          if (Math.abs(next.x - w.x) < 0.05 && Math.abs(next.y - w.y) < 0.05) return false;
          w.x = next.x; w.y = next.y; w.walkPhase += dt;
          return true;
        };
        if (stepDir(w.dir)) {
          w.stuck = 0;
        } else {
          // Blocked by a wall/prop/warp. Instead of grinding face-first into it (how
          // Charlie used to jam the odd-jobs board), STEER AROUND: try the
          // perpendiculars (toward home first) then a U-turn, commit to the first
          // that actually moves, and keep walking it for a beat so we round the corner.
          let slipped = false;
          for (const alt of unstickDirs(w.dir, w.homeX - w.x, w.homeY - w.y)) {
            if (stepDir(alt)) {
              w.dir = alt;
              w.stepT = Math.min(w.stepT, 0.6 + Math.random() * 0.6);
              slipped = true; w.stuck = 0;
              break;
            }
          }
          if (!slipped) {
            // Boxed in on every side (e.g. a routine NPC walled off from its
            // scheduled tile). Give up gracefully and idle rather than vibrate;
            // after a few dead-ends, take a long pause so we stop re-charging the wall.
            w.moving = false; w.walkPhase = 0;
            w.stuck += 1;
            w.stepT = w.stuck >= 3 ? 2.5 + Math.random() * 2 : 0.25 + Math.random() * 0.5;
          }
        }
      } else if (w.walkPhase !== 0) {
        w.walkPhase = 0; // settle to a clean idle pose (frame 0), no mid-stride freeze
      }
    }

    // David the cat ambles around the apartment, pausing to sit and nap.
    if (sceneRef.current.id === 'apartment' && saveRef.current.cat.found) {
      if (!catRef.current) catRef.current = { x: 8 * TILE, y: 6 * TILE, dir: 'left', sitting: true, napping: false, timer: 1.5, napTarget: null };
      const cat = catRef.current;
      petHeartRef.current = Math.max(0, petHeartRef.current - dt); // the post-pet heart floats off
      cat.timer -= dt;
      if (cat.timer <= 0) {
        if (cat.napTarget) { // the walk-to-a-soft-spot leg ran long — nap right here
          cat.napTarget = null; cat.napping = true; cat.sitting = true; cat.timer = 6 + Math.random() * 8;
        } else if (cat.napping) { // stir awake into a sit before moving again
          cat.napping = false; cat.sitting = true; cat.timer = 1.5 + Math.random() * 2;
        } else if (cat.sitting) { // doze off, or get up and pick somewhere to mosey
          if (Math.random() < 0.3) {
            // Nap time — but he prefers somewhere soft: beeline for the nearest
            // rug (2×2, centered) or the placed kotatsu (wide, he naps ON it) if
            // either exists and isn't underfoot already; else curl up right here.
            const sv = saveRef.current;
            const spots: Vec[] = sv.rugs.map(r => ({ x: r.x * TILE + TILE / 2, y: r.y * TILE + TILE / 2 }));
            if (sv.placed['kotatsu']) spots.push({ x: sv.placed['kotatsu'].x * TILE + TILE / 2, y: sv.placed['kotatsu'].y * TILE - 4 });
            let best: Vec | null = null, bd = Infinity;
            for (const sp of spots) { const d = Math.abs(sp.x - cat.x) + Math.abs(sp.y - cat.y); if (d < bd) { bd = d; best = sp; } }
            if (best && bd > 6) { cat.napTarget = best; cat.sitting = false; cat.timer = 12; } // plenty of time to arrive
            else { cat.napping = true; cat.timer = 6 + Math.random() * 8; }
          } else {
            cat.sitting = false;
            cat.dir = Math.random() < 0.5 ? 'left' : 'right';
            cat.timer = 1.2 + Math.random() * 2.2;
          }
        } else { // settle down for a sit, or turn around
          if (Math.random() < 0.55) { cat.sitting = true; cat.timer = 2.5 + Math.random() * 4; }
          else { cat.dir = Math.random() < 0.5 ? 'left' : 'right'; cat.timer = 1 + Math.random() * 2; }
        }
      }
      if (cat.napTarget) {
        // Teleport-walk straight to the chosen nap spot (no collision — rugs and
        // the kotatsu sit in open floor, and cats go where they please anyway).
        const tgt = cat.napTarget;
        const step = 26 * dt;
        const dx = tgt.x - cat.x, dy = tgt.y - cat.y;
        if (Math.abs(dx) > 1) cat.dir = dx < 0 ? 'left' : 'right';
        cat.x += Math.abs(dx) <= step ? dx : Math.sign(dx) * step;
        cat.y += Math.abs(dy) <= step ? dy : Math.sign(dy) * step;
        if (Math.abs(tgt.x - cat.x) < 1 && Math.abs(tgt.y - cat.y) < 1) { // curled up on the soft spot
          cat.napTarget = null; cat.napping = true; cat.sitting = true; cat.timer = 6 + Math.random() * 8;
        }
      } else if (!cat.sitting) {
        const sp = (cat.dir === 'left' ? -16 : 16) * dt;
        const moved = tryMove(sceneRef.current, { x: cat.x, y: cat.y }, sp, 0, solidsRef.current);
        if (Math.abs(moved.x - cat.x) < 0.01) { cat.dir = cat.dir === 'left' ? 'right' : 'left'; } // bumped a wall — turn
        cat.x = moved.x;
        // keep him inside the interior floor, occasionally drift vertically
        if (Math.random() < 0.02) { const dy = (Math.random() < 0.5 ? -1 : 1) * 14 * dt * 4; cat.y = tryMove(sceneRef.current, { x: cat.x, y: cat.y }, 0, dy, solidsRef.current).y; }
        cat.y = Math.max(1.2 * TILE, Math.min(8 * TILE, cat.y));
      }
    } else if (catRef.current) {
      catRef.current = null; // left the apartment — despawn until you return
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
          // shrine favor: the valuable fish bite more often. The upgraded rod
          // (tier 1+) also draws the bigger, rarer fish toward the hook.
          const sNow = saveRef.current;
          const luck = shrineLuck(sNow);
          const rodPull = sNow.fishRod >= 1 ? 1 : 0;
          const rain = isRainyDay(sNow) ? 0.8 : 0; // rainy days stir up the rare, hungry fish
          // Weather-gated species (Rain Koi / Stargazer) only join the table under
          // their sky — biteTableFor filters on Fish.when (see fishSky in state.ts).
          const base = biteTableFor(sNow, fm.table === 'deep' ? DEEP_FISH : fm.table === 'tropical' ? TROPICAL_FISH : FISH);
          const boost = 0.5 * luck + 0.6 * rodPull + rain + 0.12 * skillLevel(sNow, 'fish'); // skill draws rarer fish
          const table = boost === 0 ? base : base.map(f => (f.value >= 500 ? { ...f, weight: f.weight * (1 + boost) } : f));
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

    // Konbini shift minigame: "Register Rush" (QTE scan → bag → change).
    const sg = shiftRef.current;
    if (sg) {
      const finishShift = () => {
        const sv = saveRef.current;
        const pay = Math.min(SHIFT_PAY_CAP, Math.round(sg.earned));
        sv.money += pay; sv.shiftDay = sv.day; sv.shiftsWorked += 1; sv.today.shifts += 1;
        if (sv.shiftsWorked >= 5) award('shift-5');
        shiftRef.current = null;
        sfxCoin(); persistSave(sv); refreshHud();
        const grade = sg.served >= SHIFT_CUSTOMERS ? 'A flawless rush — the manager almost smiles.'
          : sg.served >= SHIFT_CUSTOMERS - 2 ? 'Solid shift. The register balances and the queue stayed calm.'
          : 'A rough rush. The regulars forgive you. Mostly.';
        showDialog([`Shift over — ${sg.served}/${SHIFT_CUSTOMERS} customers rung up clean. (+¥${pay.toLocaleString()})`, grade]);
      };
      if (input.consumeCancel()) { finishShift(); return; }
      input.consumeInventory();
      const ePress = input.consumeInteract();
      const d = input.currentDir();
      const dirPress = d && d !== sg.lastDir ? d : null;
      sg.lastDir = d;
      if (sg.flash > 0) sg.flash -= dt;
      sg.timer -= dt;

      const advance = (gain: number, good: boolean, text: string) => {
        sg.earned += gain;
        sg.flash = 0.6; sg.flashGood = good; sg.flashText = text;
        sg.idx += 1;
        if (sg.idx >= SHIFT_CUSTOMERS) { finishShift(); return; }
        sg.cust = makeShiftCustomer(sg.idx);
        sg.timer = shiftTimerFor(sg.idx, sg.cust); sg.maxTimer = sg.timer;
        sg.phase = 'scan';
      };
      const fumble = () => { sg.combo = 0; sfxMiss(); advance(0, false, 'FUMBLE!'); };
      const serve = () => {
        sg.served += 1;
        const tip = Math.round(Math.min(140, sg.combo * 14 + (sg.timer / sg.maxTimer) * 80));
        const gain = Math.round(SHIFT_PAY / SHIFT_CUSTOMERS) + tip;
        sg.combo += 1;
        sfxBuy();
        advance(gain, true, `+¥${gain.toLocaleString()}`);
      };

      if (sg.timer <= 0) { fumble(); }
      else if (sg.phase === 'scan') {
        if (ePress) { sfxBite(); sg.cust.scanned += 1; if (sg.cust.scanned >= sg.cust.items) sg.phase = 'bag'; }
        else if (dirPress) fumble();
      } else if (sg.phase === 'bag') {
        if (dirPress === 'down') sg.phase = 'change';
        else if (ePress || dirPress) fumble();
      } else {
        if (ePress) fumble();
        else if (dirPress) {
          if (dirPress === sg.cust.change[sg.cust.changeIdx]) {
            sg.cust.changeIdx += 1;
            if (sg.cust.changeIdx >= sg.cust.change.length) serve();
          } else fumble();
        }
      }
      return;
    }

    // Club Kaiju karaoke: single-lane rhythm minigame (karaokeRef ref-mode). The
    // club music keeps playing underneath as the backing — see startKaraoke / the
    // finish + bail branches for the audio handoff. No second track is ever started.
    const kg = karaokeRef.current;
    if (kg) {
      input.consumeInventory();
      // Results screen: any action/cancel dismisses it (tips already settled below).
      if (kg.done) {
        if (input.consumeInteract() || input.consumeCancel()) {
          karaokeRef.current = null;
          karaokeAudioRef.current?.pause();
          playMusicFor('nightclub'); // swell the ducked club track back in
          showDialog([
            `You set the mic back on the stand. (+¥${kg.tips.toLocaleString()} in tips)`,
            kg.reaction,
          ], 'Club Kaiju');
        }
        return;
      }
      if (input.consumeCancel()) { // bail mid-song — no tips, no harm (cosy)
        karaokeRef.current = null;
        karaokeAudioRef.current?.pause();
        playMusicFor('nightclub'); // restore the club music exactly as it was
        showDialog(['You wave the mic off and melt back into the crowd. Maybe next time.'], 'Club Kaiju');
        return;
      }
      if (kg.flash > 0) kg.flash -= dt;
      kg.t += dt;
      // Start the song once the count-in has elapsed, then keep the lane clock
      // LOCKED to the mp3 — kg.t is re-derived from audio.currentTime whenever
      // they drift, so the chart cannot slide off the music.
      const ka = karaokeAudioRef.current;
      if (!kg.audioOn && kg.t >= KARAOKE_COUNTIN_SEC && ka) {
        kg.audioOn = true;
        ka.muted = readMuted();
        ka.play().catch(() => { /* autoplay blocked — the dt clock carries the chart */ });
      }
      if (kg.audioOn && ka && !ka.paused && ka.readyState >= 2) {
        const want = KARAOKE_COUNTIN_SEC + ka.currentTime;
        if (Math.abs(want - kg.t) > 0.05) kg.t = want;
      }
      // metronome tick — count-in ONLY (the song itself carries the beat after).
      if (kg.t < KARAOKE_COUNTIN_SEC) {
        const beatIdx = Math.floor(kg.t / KARAOKE_BEAT);
        if (beatIdx !== kg.lastBeat) { kg.lastBeat = beatIdx; blip([beatIdx % 4 === 0 ? 880 : 660], 0.028, 0.016); }
      }
      // auto-miss any note that slipped past the GOOD window unhit
      for (const n of kg.notes) {
        if (n.judged === 'none' && kg.t - n.t > KARAOKE_GOOD) {
          n.judged = 'miss'; kg.misses += 1; kg.combo = 0;
          kg.flash = 0.4; kg.flashText = 'MISS'; kg.flashKind = 'miss';
        }
      }
      // an arrow press (edge-detected, shift-QTE style): judge the nearest
      // still-unjudged note inside the GOOD window — hitting its lane's arrow
      // scores it, the WRONG arrow fumbles it (so mashing all four can't cheese
      // the chart). Space/Enter does nothing mid-song (eaten so it can't leak).
      input.consumeInteract();
      const dNow = input.currentDir();
      const press = dNow && dNow !== kg.lastDir ? dNow : null;
      kg.lastDir = dNow;
      if (press) {
        let best = -1, bestDt = KARAOKE_GOOD + 1;
        for (let i = 0; i < kg.notes.length; i++) {
          const n = kg.notes[i];
          if (n.judged !== 'none') continue;
          const d = Math.abs(kg.t - n.t);
          if (d < bestDt) { bestDt = d; best = i; }
        }
        if (best >= 0 && bestDt <= KARAOKE_GOOD) {
          const n = kg.notes[best];
          if (n.dir !== press) {
            n.judged = 'miss'; kg.misses += 1; kg.combo = 0;
            kg.flash = 0.4; kg.flashText = 'WRONG WAY'; kg.flashKind = 'miss';
          } else if (bestDt <= KARAOKE_PERFECT) {
            n.judged = 'perfect'; kg.perfects += 1; kg.score += 100; kg.combo += 1;
            kg.flash = 0.4; kg.flashText = 'PERFECT!'; kg.flashKind = 'perfect'; sfxCatch();
          } else {
            n.judged = 'good'; kg.goods += 1; kg.score += 55; kg.combo += 1;
            kg.flash = 0.4; kg.flashText = 'GOOD'; kg.flashKind = 'good'; sfxBite();
          }
          kg.maxCombo = Math.max(kg.maxCombo, kg.combo);
        }
        // a stray press with no note in range is simply ignored (cosy — no combo break)
      }
      // song over? (the last note's window has passed) → settle tips + crowd reaction
      const lastT = kg.notes.length ? kg.notes[kg.notes.length - 1].t : 0;
      if (kg.t > lastT + 1.1) {
        const s = saveRef.current;
        const ratio = kg.total ? kg.score / (kg.total * 100) : 0;
        const tips = Math.min(1600, Math.max(50, Math.round(ratio ** 1.25 * 1400) + Math.min(180, kg.maxCombo * 4)));
        kg.tips = tips;
        kg.reaction = ratio >= 0.92 ? '🔥 The whole club ERUPTS — Kaiju hoists you onto one scaly shoulder.'
          : ratio >= 0.7 ? '👏 Real cheers roll in; the bartender slides you a drink on the house.'
          : ratio >= 0.45 ? '🙂 Warm, scattered applause. Honestly? Not bad at all.'
          : ratio >= 0.2 ? '😅 A few polite claps. The DJ gives you a sympathetic nod.'
          : '💤 Near-silence. Somewhere a phone buzzes — louder than you sang.';
        s.money += tips;
        if (kg.total > 0 && (kg.perfects + kg.goods) / kg.total >= 0.8) award('encore');
        sfxCoin(); persistSave(s); refreshHud();
        kg.done = true;
      }
      return;
    }

    // Kojima Motors delivery race: top-down dirt rally (driveRef ref-mode).
    const dg = driveRef.current;
    if (dg) {
      input.consumeInteract(); input.consumeInventory();

      // --- finish celebration: the pay is already settled — the car coasts out,
      // confetti falls, the breakdown counts itself up, then Kojima's dialog.
      if (dg.done) {
        dg.doneT += dt;
        const coast = Math.max(0, 1 - 2.2 * dt);       // roll gently to a stop
        dg.vx *= coast; dg.vy *= coast;
        dg.x += dg.vx * dt; dg.y += dg.vy * dt;
        dg.camX += (dg.x - dg.camX) * Math.min(1, dt * 6);
        dg.camY += (dg.y - dg.camY) * Math.min(1, dt * 6);
        engineSet(0, dt);                              // motor winds down under the fanfare
        for (let i = dg.confetti.length - 1; i >= 0; i--) {
          const p = dg.confetti[i]; p.life += dt;
          if (p.life >= p.max) { dg.confetti.splice(i, 1); continue; }
          p.vy += 150 * dt; p.vx *= 0.985;             // flutter down under light gravity
          p.x += p.vx * dt; p.y += p.vy * dt;
        }
        // hold the moment, then settle up (cancel skips ahead)
        if (dg.doneT > 2.6 || input.consumeCancel()) {
          const pay = dg.pay!;
          driveRef.current = null; engineStop();
          const lines = pay.onTime
            ? [
                `Delivered! ${dg.elapsed.toFixed(1)}s on the clock.${dg.isBest ? ' A new daily best!' : ''}`,
                `Base ¥${pay.base.toLocaleString()} + time ¥${pay.timeBonus.toLocaleString()} + clean ¥${pay.cleanBonus.toLocaleString()} = ¥${pay.total.toLocaleString()}. Kojima counts it out without looking up.`,
              ]
            : [
                'Cut it fine — the package is late, but it got there in one piece.',
                `Kojima shrugs and peels off ¥${pay.total.toLocaleString()}. "Tomorrow, faster."`,
              ];
          showDialog(lines, 'Kojima');
        }
        movingRef.current = false;
        return;
      }

      if (input.consumeCancel()) { // bail out — free retry, the daily gate isn't burned
        driveRef.current = null; engineStop();
        showDialog(['You pull over and hand back the keys. "No shame," Kojima says. "The box will keep till you\'re ready."'], 'Kojima');
        return;
      }

      // --- 3-2-1-GO: the clock AND the car hold until the flag drops, so every
      // run starts fair (no more mashing gas the frame the dialog closes).
      if (dg.count > 0) {
        const prevTick = Math.ceil(dg.count);
        dg.count -= dt;
        if (dg.count > 0 && Math.ceil(dg.count) !== prevTick) blip([560], 0.07, 0.05); // 2, 1…
        if (dg.count <= 0) blip([840, 1120], 0.09, 0.06);                              // GO!
        engineSet(0.18, dt); // idle rev at the line builds the moment
        movingRef.current = false;
        return;
      }

      dg.elapsed += dt;
      if (dg.flash > 0) dg.flash -= dt;

      // --- inputs: throttle + steer at once (isHeld), action button also accelerates
      const up = input.isHeld('up'), down = input.isHeld('down');
      const steer = (input.isHeld('right') ? 1 : 0) - (input.isHeld('left') ? 1 : 0);
      const fx = Math.cos(dg.angle), fy = Math.sin(dg.angle);
      let fwd = dg.vx * fx + dg.vy * fy; // signed forward speed

      // steering: turn-rate scales with speed (can't pivot when parked); flips in reverse
      const speed0 = Math.hypot(dg.vx, dg.vy);
      const turn = 2.9 * Math.min(1, speed0 / 85);
      dg.angle += steer * turn * dt * (fwd < -6 ? -1 : 1);

      // throttle / brake / reverse along the (possibly newly-rotated) heading
      const hx = Math.cos(dg.angle), hy = Math.sin(dg.angle);
      const ACCEL = 365, BRAKE = 430, REVERSE = 195;
      if (up || input.actionHeld) { dg.vx += hx * ACCEL * dt; dg.vy += hy * ACCEL * dt; }
      if (down) {
        if (fwd > 12) { dg.vx -= hx * BRAKE * dt; dg.vy -= hy * BRAKE * dt; }
        else { dg.vx -= hx * REVERSE * dt; dg.vy -= hy * REVERSE * dt; }
      }

      // off-track? grass bogs you down (cosy — never a hard crash)
      const tdist = driveTrackDist(dg.x, dg.y, dg.track.points);
      const onGrass = tdist > dg.track.half;
      dg.onGrass = onGrass;
      if (onGrass) dg.grassT += dt;

      // grip / drift: split velocity into forward (heading) + lateral (perp), then
      // bleed off the lateral part. Less grip at speed mid-turn = a satisfying slide.
      // Grip BLENDS out with speed while steering (no hard 165 u/s snap), so the
      // back end eases into the drift instead of stepping out all at once.
      const lx = -hy, ly = hx; // lateral unit
      fwd = dg.vx * hx + dg.vy * hy;
      const lat = dg.vx * lx + dg.vy * ly;
      const slide = steer !== 0 ? Math.min(1, Math.max(0, (speed0 - 120) / 110)) : 0;
      const grip = onGrass ? 2.8 : 8.2 - 3.8 * slide;
      const newLat = lat * Math.max(0, 1 - grip * dt);
      dg.drift = Math.abs(newLat);
      dg.vx = hx * fwd + lx * newLat;
      dg.vy = hy * fwd + ly * newLat;

      // drag + speed cap (grass is both draggier and slower-capped)
      const drag = onGrass ? 2.6 : 0.55;
      const keep = Math.max(0, 1 - drag * dt);
      dg.vx *= keep; dg.vy *= keep;
      let sp = Math.hypot(dg.vx, dg.vy);
      const cap = onGrass ? DRIVE_MAX_GRASS : DRIVE_MAX_DIRT;
      if (sp > cap) { const k = cap / sp; dg.vx *= k; dg.vy *= k; sp = cap; }

      // integrate
      dg.x += dg.vx * dt; dg.y += dg.vy * dt;

      // motor pitch rises with speed (honors mute inside engineSet)
      engineSet(Math.min(1, sp / DRIVE_MAX_DIRT), dt);

      // dust + skid-marks off the rear axle (created here in UPDATE, never in draw)
      const drifting = dg.drift > 30;
      dg.emit -= dt;
      if (sp > 46 && dg.emit <= 0 && dg.dust.length < 90) {
        dg.emit = onGrass || drifting ? 0.018 : 0.05;
        for (const side of [-1, 1]) {
          const wx = dg.x - hx * 13 + lx * side * 5, wy = dg.y - hy * 13 + ly * side * 5;
          dg.dust.push({
            x: wx, y: wy,
            vx: (Math.random() - 0.5) * 24 - dg.vx * 0.04,
            vy: (Math.random() - 0.5) * 24 - dg.vy * 0.04,
            life: 0, max: 0.45 + Math.random() * 0.3, r: 2.5 + Math.random() * 2.5,
          });
        }
      }
      if (!onGrass && dg.drift > 46 && sp > 70) {
        for (const side of [-1, 1]) dg.skids.push({ x: dg.x - hx * 11 + lx * side * 5, y: dg.y - hy * 11 + ly * side * 5 });
        while (dg.skids.length > 240) dg.skids.shift();
      }
      for (let i = dg.dust.length - 1; i >= 0; i--) {
        const p = dg.dust[i]; p.life += dt;
        if (p.life >= p.max) { dg.dust.splice(i, 1); continue; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.9; p.vy *= 0.9; p.r += dt * 7;
      }

      // smoothed camera follows the car
      dg.camX += (dg.x - dg.camX) * Math.min(1, dt * 6);
      dg.camY += (dg.y - dg.camY) * Math.min(1, dt * 6);

      // checkpoints (in order) → final one is the delivery point
      const cps = dg.track.checkpoints;
      const cpPt = dg.track.points[cps[dg.cp]];
      if (Math.hypot(dg.x - cpPt.x, dg.y - cpPt.y) < DRIVE_CP_RADIUS) {
        dg.cp += 1; dg.flash = 0.7;
        if (dg.cp >= cps.length) {
          // delivered — settle pay NOW (gate consumed; a bail was a free retry),
          // then hand off to the celebration phase above (confetti + breakdown).
          const sv = saveRef.current;
          const pay = drivePayout(dg.elapsed, dg.grassT, dg.track.timeLimit);
          sv.money += pay.total; sv.deliveryDay = sv.day;
          const isBest = pay.onTime && (sv.deliveryBest === 0 || dg.elapsed < sv.deliveryBest);
          if (isBest) sv.deliveryBest = Math.round(dg.elapsed * 10) / 10;
          dg.done = true; dg.doneT = 0; dg.pay = pay; dg.isBest = isBest;
          sfxCoin(); award('first-delivery');
          if (pay.onTime && dg.elapsed < driveAceTime(dg.track.timeLimit)) award('ace-driver');
          persistSave(sv); refreshHud();
          // confetti bursts from the depot on an on-time drop (late stays sheepish)
          if (pay.onTime) {
            const CONF = ['#ffd24a', '#e857a8', '#7ce8e0', '#a0ffaa', '#f4eede'];
            for (let i = 0; i < 40; i++) {
              const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 130;
              dg.confetti.push({
                x: cpPt.x, y: cpPt.y,
                vx: Math.cos(a) * v, vy: Math.sin(a) * v - 90, // pop upward, gravity pulls back
                life: 0, max: 1.3 + Math.random() * 1.1, r: 1.5 + Math.random() * 1.5,
                c: CONF[i % CONF.length],
              });
            }
          }
          return;
        }
        sfxBite(); // checkpoint chime
      }
      movingRef.current = false;
      return;
    }

    const s = saveRef.current;
    // Endless game — there is no ending. Furnishing the whole apartment is a quiet
    // milestone (a cosy one-time line + the achievement), then life goes on; the
    // real draw is everything still hidden out in the city. (`s.ended` reused as a
    // "milestone seen" flag so it only fires once.)
    if (sceneRef.current.id === 'apartment' && allFurnished(s) && !s.ended) {
      s.ended = true;
      persistSave(s);
      award('furnished');
      showDialog(['The last piece slides into place. The apartment isn’t a box you’re hiding in anymore — it’s home.', 'Out the window the city goes on forever, and somewhere out there are doors you still haven’t opened. Plenty of evening left.']);
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
      const before = posRef.current; // pre-move pos, so a locked door can bounce you off
      posRef.current = tryMove(sceneRef.current, posRef.current, dx, dy, solidsRef.current);

      const ft = feetTile(posRef.current);
      const warp = sceneRef.current.warps.find(w => w.x === ft.x && w.y === ft.y);
      // Locked-door gates: a walkable warp tile you can't use yet. Bounce the player
      // back off the threshold (so they can't stand on it re-triggering) and only
      // speak the line on a fresh approach — never every frame held into the door.
      const lockedGate =
        (warp?.to === 'badtown' && !s.gangPaid) ||
        (warp?.to === 'greenhouse' && !s.greenhouseUnlocked) ||
        (warp?.to === 'backroom' && !backroomOpen(s));
      // Some retail shops randomly take a sick day (~10%, seeded). Bounce off the
      // door with a closed-sign note, same as a locked gate.
      const closedStore = warp != null && storeClosedToday(s.day, warp.to);
      if (lockedGate || closedStore) {
        posRef.current = before;
        movingRef.current = false;
        if (warpCooldownRef.current <= 0) {
          warpCooldownRef.current = 0.8; // re-arm; ticks down each frame at line above
          if (closedStore)
            showDialog(['A handwritten sign hangs crooked in the door: "Sorry — shut today, I\'m a bit under the weather. Back tomorrow. 🙇"']);
          else if (warp!.to === 'badtown')
            showDialog(['A yakuza enforcer steps into your path, gold watch glinting. "Private district."', 'Face one of them and press E to pay the ¥5,000 toll.'], 'Enforcer');
          else if (warp!.to === 'backroom')
            showDialog(['A wall of a man in a black suit fills the curtain gap. "Members only."',
              `He taps a small ledger without opening it. "The house counts its winners. Keep playing." (${s.casinoWins}/${BACKROOM_WINS} wins)`], 'Kinryū Doorman');
          else
            showDialog(['The greenhouse door is locked tight. Granny Soto keeps the key — do her a kindness first.', '(Word around the block is she loves a fresh fish.)']);
        }
        return;
      }
      if (warp && warpCooldownRef.current <= 0) {
        // Can't drive indoors (or onto the shrine's sacred grounds): the car
        // auto-parks beside the entrance and you continue in on foot, like a store.
        if (s.driving && (!SCENES[warp.to].outdoor || warp.to === 'shrine')) {
          const spot = findParkSpot(sceneRef.current, lastSafeTileRef.current ?? ft);
          s.carPos = spot
            ? { scene: sceneRef.current.id, x: spot.x, y: spot.y }
            : { scene: 'badtown', x: 13, y: 8 }; // worst case: Kojima holds it
          s.driving = false;
        }
        enterScene(warp.to, warp.tx, warp.ty, warp.dir);
        return;
      }
      if (!sceneRef.current.warps.some(w => w.x === ft.x && w.y === ft.y)) lastSafeTileRef.current = ft;
    } else {
      movingRef.current = false;
    }

    // Cute driving motor: pitch/volume climb while accelerating, settle to a soft
    // idle putter when stopped, cut out entirely once you park or open a menu.
    if (saveRef.current.driving && !overlayRef.current) engineSet(movingRef.current ? 1 : 0.18, dt);
    else engineStop();
    if (parisGlitchRef.current > 0) parisGlitchRef.current = Math.max(0, parisGlitchRef.current - dt);

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
        const sp = (near2 ? 70 : 40) * CRAWLER_SPD[c.kind] * dt; // lunges harder when it's right on you; fast kinds are faster
        const dx = c.dir === 'left' ? -sp : c.dir === 'right' ? sp : 0;
        const dy = c.dir === 'up' ? -sp : c.dir === 'down' ? sp : 0;
        const next = tryMove(sceneRef.current, { x: c.x, y: c.y }, dx, dy, solidsRef.current);
        c.x = next.x; c.y = next.y;
        // bite check (god mode: crawlers can't touch you)
        if (!s.god && hurtCooldownRef.current <= 0 && Math.abs(c.x - p.x) < 10 && Math.abs(c.y - p.y) < 10) {
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
    if (depthToastRef.current) {
      depthToastRef.current.t -= dt;
      if (depthToastRef.current.t <= 0) depthToastRef.current = null;
    }
    // Auto-defend: in the mines your weapon locks onto the nearest crawler in
    // range and fires on its own — no aiming, no trigger. This decouples combat
    // from mining so the action button stays free for swinging the pickaxe and
    // you can focus on moving + mining instead of juggling both at once.
    if (sceneRef.current.id === 'mines' && (s.wand || s.gun)
        && crawlersRef.current.length > 0 && !overlayRef.current && !fishModeRef.current) {
      autoFireRef.current -= dt;
      if (autoFireRef.current <= 0) {
        const p = posRef.current;
        const AUTO_RANGE = 5 * TILE;
        let best: Crawler | null = null, bestD = Infinity;
        for (const c of crawlersRef.current) {
          const d = Math.abs(c.x - p.x) + Math.abs(c.y - p.y);
          if (d < AUTO_RANGE && d < bestD) { bestD = d; best = c; }
        }
        if (best) {
          // aim the bolt straight at the locked target (normalized direction)
          const tx = best.x + 8 - (p.x + 4), ty = best.y + 8 - (p.y + 4);
          const len = Math.hypot(tx, ty) || 1;
          const SPD = s.gun ? 340 : 190;
          autoFireRef.current = s.gun ? 0.12 : 0.5; // the gun rattles; the wand paces itself
          projectilesRef.current.push({
            x: p.x + 4, y: p.y + 4,
            dx: (tx / len) * SPD, dy: (ty / len) * SPD,
            t: s.gun ? 0.55 : 0.8, pierce: s.gun ? true : s.wand2, dmg: s.gun ? 3 : 1, gun: s.gun,
          });
          if (s.gun) sfxGun(); else sfxBite();
        } else {
          autoFireRef.current = 0; // nothing in range — ready to fire the instant one appears
        }
      }
    }
    // AK-67: full-auto while you hold the action button down in the mines.
    if (sceneRef.current.id === 'mines' && s.gun && input.actionHeld
        && !overlayRef.current && !fishModeRef.current) {
      gunCooldownRef.current -= dt;
      if (gunCooldownRef.current <= 0) {
        gunCooldownRef.current = 0.08; // ~12 rounds/sec
        const d = dirRef.current;
        const SPD = 340;
        projectilesRef.current.push({
          x: posRef.current.x + 4, y: posRef.current.y + 4,
          dx: d === 'left' ? -SPD : d === 'right' ? SPD : 0,
          dy: d === 'up' ? -SPD : d === 'down' ? SPD : 0,
          t: 0.55, pierce: true, dmg: 3, gun: true,
        });
        sfxGun();
      }
    } else {
      gunCooldownRef.current = 0; // ready to fire instantly next trigger pull
    }
    // weapon bolts (wand sparkle / AK-67 rounds)
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
          hitC.hp -= (pr.dmg ?? 1);
          hitC.hurtT = 0.3;
          // knock the crawler back along the bolt's path
          hitC.x += Math.sign(pr.dx) * 10; hitC.y += Math.sign(pr.dy) * 10;
          sparkleRef.current = { x: hitC.x, y: hitC.y, t: 0.35 };
          if (hitC.hp <= 0) {
            const gold = hitC.kind === 'gold';
            crawlersRef.current = crawlersRef.current.filter(c => c !== hitC);
            award('slayer');
            sfxCatch();
            if (gold) {
              // the rare gold crawler pays out big
              s.money += 1500;
              s.minerals['crystal'] = (s.minerals['crystal'] ?? 0) + 2;
              s.today.mineralsMined += 2;
              mineTextRef.current = { x: hitC.x, y: hitC.y, text: '+¥1,500 + 2 Crystal!', color: '#ffd24a', t: 1.3 };
              persistSave(s); refreshHud();
            } else if (Math.random() < 0.6) {
              const m = MINERALS[Math.floor(Math.random() * 3)]; // common drop (coal/iron/shard tier)
              s.minerals[m.id] = (s.minerals[m.id] ?? 0) + 1;
              s.today.mineralsMined += 1;
              persistSave(s); refreshHud();
            }
          }
          if (!pr.pierce) return false; // pierce rounds carry through to the next crawler
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
        else if (key === 't-foam-0' && waterAlt) key = 't-foam-1'; // tide foam laps gently
        // Dance floor: cycle 4 color frames by tile position so colors ripple
        // across the floor (a real disco wave) instead of flipping in unison.
        else if (key === 't-dance-0') key = `t-dance-${(tx + ty * 2 + Math.floor(t * 5)) & 3}`;
        else if (key === 't-portal-0' && danceAlt) key = 't-portal-1';
        // scatter detail variants through large grass/sand fields
        else if ((key === 't-grass' || key === 't-sand') && (tx * 7 + ty * 13) % 5 === 0) key = `${key}-v1`;
        ctx.drawImage(atlas[key], tx * TILE - cam.x, ty * TILE - cam.y);
      }
    }

    // ---- Festival decor (transient — drawn only on festival days) ------------
    // The active festival dresses up its outdoor scene: paper-lantern bunting
    // swagged across the top of the view (screen-space, so it always frames the
    // frame), a yatai stall + nobori banner, the tappable minigame prop, and a
    // couple of gathered festival-goers. Drawn here (after the ground, before the
    // y-sorted entities) so the player and NPCs pass IN FRONT — readable and
    // non-blocking. Each sprite is guarded by atlas[key] in case art is missing.
    {
      const festD = festivalFor(saveRef.current.day);
      const layD = festD && festD.scene === scene.id ? FESTIVAL_LAYOUT[scene.id] : null;
      if (festD && layD) {
        // Lantern bunting: a string of chōchin swagged IN WORLD SPACE over the
        // festival lane (it parallaxes with the camera like everything else —
        // pinning it to the screen top read as UI chrome, not a festival). The
        // string is HELD UP: bamboo poles planted at both ends + one continuous
        // cord following the same sag the lantern tiles ride (without those the
        // chain floated in mid-air).
        const lant = atlas['t-fest-lanterns'];
        if (lant) {
          const bun = layD.bunting;
          const spanPx = (bun.toX - bun.fromX + 1) * TILE;
          const sagAt = (bx: number) => Math.sin((bx / spanPx) * Math.PI * 3 + 0.4) * 3 + 3;
          const swayAt = (wx: number) => Math.sin(t * 1.3 + wx * 0.04) * 1.2;
          // bamboo end-poles, planted with a contact shadow
          for (const px of [bun.fromX * TILE - 2, (bun.toX + 1) * TILE]) {
            const gx = px - cam.x, top = bun.yPx - 2 - cam.y, base = bun.groundPx - cam.y;
            ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(gx - 2, base - 1, 6, 2);
            ctx.fillStyle = '#6f9e5e'; ctx.fillRect(gx, top, 2, base - top);
            ctx.fillStyle = '#4d7440'; ctx.fillRect(gx + 1, top, 1, base - top);       // shaded side
            ctx.fillStyle = '#557e46'; for (let ny = top + 6; ny < base; ny += 9) ctx.fillRect(gx, ny, 2, 1); // bamboo nodes
          }
          // continuous cord (drawn under the lantern tiles, sampled along the sag)
          ctx.strokeStyle = '#2c3038'; ctx.lineWidth = 1;
          ctx.beginPath();
          for (let bx = -2; bx <= spanPx + 2; bx += 4) {
            const wx = bun.fromX * TILE + bx;
            const y = bun.yPx + sagAt(Math.max(0, Math.min(spanPx, bx))) + swayAt(wx) + 0.5;
            if (bx <= -2) ctx.moveTo(wx - cam.x, Math.round(y) - cam.y);
            else ctx.lineTo(wx - cam.x, Math.round(y) - cam.y);
          }
          ctx.stroke();
          for (let bx = 0; bx < spanPx; bx += TILE) {
            const wx = bun.fromX * TILE + bx;
            ctx.drawImage(lant, wx - cam.x, Math.round(bun.yPx + sagAt(bx) + swayAt(wx)) - cam.y);
          }
        }
        // Gathered festival-goers — static, drawn behind the player for liveliness.
        for (const g of layD.goers) {
          const gx = g.x * TILE - cam.x, gy = g.y * TILE - cam.y;
          const sh = atlas['m-shadow']; if (sh) ctx.drawImage(sh, gx, gy + 2);
          const gs = atlas[`${g.sprite}-${g.dir}-0`]; if (gs) ctx.drawImage(gs, gx, gy);
        }
        // Stall, banner, and the minigame prop, over the ground.
        const drawF = (key: string, tile: Vec, bob = 0) => {
          const sp = atlas[key]; if (sp) ctx.drawImage(sp, tile.x * TILE - cam.x, tile.y * TILE - cam.y + bob);
        };
        drawF('t-fest-banner', layD.banner);
        drawF('t-fest-yatai', layD.stall);
        drawF(festivalPropSprite(festD), layD.prop, Math.round(Math.sin(t * 2) * 0.5 - 0.5)); // prop bobs a hair
      }
    }

    // ---- Fishing-derby decor (transient — shore, derby days only) ------------
    // The town turns out to fish the waterline: a row of static townsfolk casting
    // toward the sea, plus a chalkboard derby sign. Drawn after the ground / before
    // the y-sorted entities (like the festival decor) so the player passes in front.
    // Purely decorative & non-blocking; every sprite guarded by atlas[key].
    if (scene.id === TOURNAMENT_SCENE && fishingTournamentDay(saveRef.current.day)) {
      for (const f of DERBY_FISHERS) {
        const fx = f.x * TILE - cam.x, fy = f.y * TILE - cam.y;
        const sh = atlas['m-shadow']; if (sh) ctx.drawImage(sh, fx, fy + 2);
        // a gentle cast-bob so the line of fishers reads as "alive" without walking
        const bob = Math.round(Math.sin(t * 1.6 + f.x * 0.7) * 0.5 - 0.5);
        const fs = atlas[`${f.sprite}-down-0`]; if (fs) ctx.drawImage(fs, fx, fy + bob);
      }
      // Chalkboard derby sign — a small drawn billboard by Genji's skiff.
      const sx = DERBY_SIGN.x * TILE - cam.x, sy = DERBY_SIGN.y * TILE - cam.y;
      ctx.save();
      ctx.fillStyle = '#2a3328'; ctx.fillRect(sx - 1, sy + 1, 34, 14);
      ctx.fillStyle = '#1d241b'; ctx.fillRect(sx, sy + 2, 32, 12);
      ctx.font = 'bold 6px monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#e8e0c8'; ctx.fillText('DERBY', sx + 16, sy + 7);
      ctx.fillStyle = '#a8d8b0'; ctx.fillText('TODAY', sx + 16, sy + 13);
      ctx.restore();
    }

    // Apartment decor: repaint the floor & walls with the chosen flooring/wallpaper,
    // then lay any rugs down (under the furniture, which draws later in the y-sort).
    if (scene.id === 'apartment') {
      const dec = saveRef.current.decor;
      const floorSpr = dec.floor !== 'floor-default' ? decorById(dec.floor)?.sprite : '';
      const wallSpr = dec.wall !== 'wall-default' ? decorById(dec.wall)?.sprite : '';
      if (floorSpr || wallSpr) {
        for (let ty = ty0; ty <= ty1; ty++) {
          const row = scene.grid[ty]; if (!row) continue;
          for (let tx = tx0; tx <= tx1; tx++) {
            const ch = row[tx];
            const px = tx * TILE - cam.x, py = ty * TILE - cam.y;
            if (floorSpr && (ch === '.' || ch === '=')) ctx.drawImage(atlas[floorSpr], px, py);
            else if (wallSpr && (ch === 'P' || ch === '#')) ctx.drawImage(atlas[wallSpr], px, py);
          }
        }
      }
      for (const rug of saveRef.current.rugs) {
        const spr = decorById(rug.id)?.sprite;
        if (spr && atlas[spr]) ctx.drawImage(atlas[spr], rug.x * TILE - cam.x, rug.y * TILE - cam.y);
      }
    }

    // Museum: overlay a FILLED display sprite onto any slot the player has
    // donated to (empty slots keep their plain pedestal/frame tile). Donations
    // are empty by default, so this draws nothing until collectibles land.
    if (scene.id === 'museum') {
      const donated = saveRef.current.museum.donated;
      for (const slot of MUSEUM_SLOTS) {
        if (!donated.includes(slot.id)) continue;
        if (slot.kind === 'art') {
          // per-piece painting inside the frame (falls back to the generic one)
          ctx.drawImage(atlas[`t-frame-full-${slot.id}`] ?? atlas['t-frame-full'], slot.x * TILE - cam.x, slot.y * TILE - cam.y);
        } else {
          // per-piece artifact, raised 9px so it stands proud of the plinth cap
          const spr = atlas[`mus-${slot.id}`];
          if (spr) ctx.drawImage(spr, slot.x * TILE - cam.x, slot.y * TILE - cam.y - 9);
          else ctx.drawImage(atlas['t-pedestal-full'], slot.x * TILE - cam.x, slot.y * TILE - cam.y);
        }
      }
      // Gallery spotlights: a steady warm pool over EVERY display slot (cached
      // sprite via glowSpriteRef — glow() is declared later in the draw, and
      // per-frame createRadialGradient is the KB-banned pattern).
      let spot = glowSpriteRef.current.get('museum-spot');
      if (!spot) {
        const S = 64;
        spot = document.createElement('canvas'); spot.width = S; spot.height = S;
        const gx = spot.getContext('2d')!;
        const rg = gx.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
        rg.addColorStop(0, 'rgba(255,214,140,1)'); rg.addColorStop(1, 'rgba(255,214,140,0)');
        gx.fillStyle = rg; gx.fillRect(0, 0, S, S);
        glowSpriteRef.current.set('museum-spot', spot);
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = 0.15;
      for (const slot of MUSEUM_SLOTS) {
        ctx.drawImage(spot, slot.x * TILE + 8 - 18 - cam.x, slot.y * TILE + 6 - 18 - cam.y, 36, 36);
      }
      ctx.restore();
    }

    // Paris: the Eiffel Tower, one big sprite rising over the sky behind the plaza.
    if (scene.id === 'paris') {
      const e = atlas['eiffel-big'];
      ctx.drawImage(e, Math.round(13 * TILE - e.width / 2) - cam.x, 134 - e.height - cam.y);
    }

    // Hidden museum curios glint on the ground until pocketed.
    for (const f of MUSEUM_FINDS) {
      if (f.scene !== scene.id || saveRef.current.collectibles.includes(f.slot) || saveRef.current.museum.donated.includes(f.slot)) continue;
      const by = Math.round(Math.sin(t * 3 + f.x) * 1.2);
      ctx.globalAlpha = 0.7 + Math.sin(t * 5 + f.x) * 0.3;
      ctx.drawImage(atlas['t-relic'], f.x * TILE - cam.x, f.y * TILE - cam.y + by);
      ctx.globalAlpha = 1;
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
      // hex → "r,g,b" + luminance, to colour the neon bloom by the sign's
      // brightest swatch (the glowing tube, usually the text or border colour).
      const hex2rgb = (h: string): [number, number, number] => {
        let c = h.slice(1); if (c.length === 3) c = c.split('').map(x => x + x).join('');
        const n = parseInt(c, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
      };
      const lum = (h: string) => { const [r, g, b] = hex2rgb(h); return r * 0.299 + g * 0.587 + b * 0.114; };
      // A sign reads as "lit" (back-lit neon) if it blinks, has a tube border,
      // or sits on a solid panel — plain wayfinding placards stay matte.
      const isLit = (sg: typeof signs[number]) => Boolean(!sg.guide && (sg.blink || sg.border || (sg.bg && sg.bg[0] === '#'))); // guide plates are matte enamel — never bloom
      const glowRgb = (sg: typeof signs[number]) => {
        const cands = [sg.color, sg.border, sg.bg].filter((c): c is string => Boolean(c && c[0] === '#'));
        const best = cands.sort((a, b) => lum(b) - lum(a))[0] ?? sg.color;
        return hex2rgb(best).join(',');
      };
      // Each sign's panel + border + text is rendered to an offscreen canvas ONCE
      // (keyed by the sign object) and then blitted every frame. Walking glyphs
      // with per-char font switches + measureText every frame — in both the base
      // pass AND the night re-light pass — was the framerate sink, worst at night.
      // Rendered at the live device scale (canvas integer scale × DPR) so the
      // pixel text stays crisp when blitted back at logical size — a 1× sprite
      // upscaled by the canvas transform looked blurry.
      const S = scaleRef.current * RR;
      // Tint a hex toward white (f>1) or black (f<1) for the bevel ramp; rgba/named
      // bg colours fall back to a neutral metal plate so wayfinding placards still
      // read as a solid mounted plate, not floaty translucent UI.
      const clamp8 = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
      const mixHex = (h: string, f: number) => { const [r, g, b] = hex2rgb(h); return `rgb(${clamp8(r * f)},${clamp8(g * f)},${clamp8(b * f)})`; };
      const sprite = (sg: typeof signs[number]) => {
        let e = signSpriteRef.current.get(sg);
        if (e && e.s === S) return e;
        // Municipal guide sign (wayfinding): a slim flat enamel plate on a thin
        // grey pole, all one sprite — Tokyo street furniture, not a shop plate.
        // No bevel/rivets/drop shadow (those made wayfinding read as floating UI).
        if (sg.guide) {
          const size = sg.font ?? 6;
          const gtw = Math.ceil(measureRun(sg.text, size));
          const pw = gtw + 6, ph = size + 4, POLE = 18;
          const mx = 1, my = 1;
          const cw = pw + 2, ch = ph + POLE + 2;
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.ceil(cw * S)); c.height = Math.max(1, Math.ceil(ch * S));
          const g = c.getContext('2d')!;
          g.setTransform(S, 0, 0, S, 0, 0);
          g.textBaseline = 'top';
          const base = sg.bg && sg.bg[0] === '#' ? sg.bg : '#27517c';
          // pole first (plate overlaps its top): 2px galvanized grey + lit edge + ground shadow
          const px = mx + Math.floor(pw / 2) - 1;
          g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(px - 2, my + ph + POLE - 1, 6, 1);
          g.fillStyle = '#5d6470'; g.fillRect(px, my + ph - 1, 2, POLE);
          g.fillStyle = '#9aa0a6'; g.fillRect(px, my + ph - 1, 1, POLE);
          // plate: dark rim, flat enamel fill, thin white inner frame, top sheen
          g.fillStyle = mixHex(base, 0.4); g.fillRect(mx - 1, my - 1, pw + 2, ph + 2);
          g.fillStyle = base; g.fillRect(mx, my, pw, ph);
          g.fillStyle = 'rgba(232,240,244,0.9)';
          g.fillRect(mx + 1, my + 1, pw - 2, 1); g.fillRect(mx + 1, my + ph - 2, pw - 2, 1);
          g.fillRect(mx + 1, my + 1, 1, ph - 2); g.fillRect(mx + pw - 2, my + 1, 1, ph - 2);
          g.fillStyle = mixHex(base, 1.3); g.fillRect(mx + 2, my + 2, pw - 4, 1);
          // text, centered in the frame
          g.fillStyle = sg.color;
          let gcx = mx + 3;
          for (const ch2 of sg.text) { g.font = charFont(ch2, size); g.fillText(ch2, gcx, my + 2); gcx += g.measureText(ch2).width; }
          e = { c, w: cw, h: ch, s: S, mx, my, pw, ph };
          signSpriteRef.current.set(sg, e);
          return e;
        }
        const size = sg.font ?? 6;
        const tw = sg.vertical ? size : Math.ceil(measureRun(sg.text, size));
        const pad = 3;                                   // text inset from the plate edge (room for rivets)
        const pw = sg.vertical ? size + 4 : tw + pad + 3;             // plate width
        const ph = sg.vertical ? [...sg.text].length * (size + 1) + 5 : size + 5; // plate height
        const SO = 2;                                    // drop-shadow offset (down-right) — sits the plate ON the wall
        const mx = 1, my = 1;                            // plate inset inside the canvas (1px for the dark outline frame)
        const cw = pw + 2 + SO, ch = ph + 2 + SO;        // canvas = plate + 1px outline each side + cast shadow
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.ceil(cw * S)); c.height = Math.max(1, Math.ceil(ch * S));
        const g = c.getContext('2d')!;
        g.setTransform(S, 0, 0, S, 0, 0);
        g.textBaseline = 'top';
        // 1) cast shadow onto the facade so the plate doesn't float
        g.fillStyle = 'rgba(0,0,0,0.32)'; g.fillRect(mx + SO, my + SO, pw, ph);
        g.fillStyle = 'rgba(0,0,0,0.18)'; g.fillRect(mx + SO + 1, my + SO + 1, pw, ph);
        // 2) dark outline frame (the extruded plate edge)
        const baseHex = sg.bg && sg.bg[0] === '#' ? sg.bg : '#222831';
        g.fillStyle = mixHex(baseHex, 0.32); g.fillRect(mx - 1, my - 1, pw + 2, ph + 2);
        // 3) opaque plate fill (+ the intended tint for rgba placards, over the solid base)
        g.fillStyle = baseHex; g.fillRect(mx, my, pw, ph);
        if (sg.bg && sg.bg[0] !== '#') { g.fillStyle = sg.bg; g.fillRect(mx, my, pw, ph); }
        // 4) bevel: warm highlight top-left, shade bottom-right (upper-left light source)
        g.fillStyle = mixHex(baseHex, 1.45); g.fillRect(mx, my, pw, 1); g.fillRect(mx, my, 1, ph);
        g.fillStyle = mixHex(baseHex, 0.6); g.fillRect(mx, my + ph - 1, pw, 1); g.fillRect(mx + pw - 1, my, 1, ph);
        // 5) neon tube: a bright inset frame inside the dark backing box for lit signs
        if (sg.border) {
          g.fillStyle = sg.border;
          g.fillRect(mx + 1, my + 1, pw - 2, 1); g.fillRect(mx + 1, my + ph - 2, pw - 2, 1);
          g.fillRect(mx + 1, my + 1, 1, ph - 2); g.fillRect(mx + pw - 2, my + 1, 1, ph - 2);
        }
        // 6) corner rivets (mounting hardware) on roomier plates
        if (size >= 7) {
          const rv = ph >= 13 ? 2 : 1;
          const rc = mixHex(baseHex, 0.45), rh = mixHex(baseHex, 1.7);
          for (const [rx, ry] of [[mx + 1, my + 1], [mx + pw - 1 - rv, my + 1], [mx + 1, my + ph - 1 - rv], [mx + pw - 1 - rv, my + ph - 1 - rv]] as const) {
            g.fillStyle = rc; g.fillRect(rx, ry, rv, rv);
            g.fillStyle = rh; g.fillRect(rx, ry, 1, 1);
          }
        }
        // 7) text — per-glyph fonts unchanged (kana/kanji Naganoshi, Latin/digits mono)
        g.fillStyle = sg.color;
        const tx = sg.vertical ? mx + 2 : mx + pad, ty = my + 2;
        if (sg.vertical) {
          [...sg.text].forEach((ch, i) => { g.font = charFont(ch, size); g.fillText(ch, tx, ty + i * (size + 1)); });
        } else {
          let cx = tx; for (const ch of sg.text) { g.font = charFont(ch, size); g.fillText(ch, cx, ty); cx += g.measureText(ch).width; }
        }
        e = { c, w: cw, h: ch, s: S, mx, my, pw, ph };
        signSpriteRef.current.set(sg, e);
        return e;
      };
      const dims = (sg: typeof signs[number]) => sprite(sg); // {mx,my,pw,ph,...}, cached
      const paint = (sg: typeof signs[number]) => {
        const sx = sg.x * TILE - cam.x, sy = sg.y * TILE - cam.y + 4;
        const sp = sprite(sg);
        const blinkOff = sg.blink && !neonOn;
        // anchor the plate top-left at (sx-2, sy-2) — same spot as before; the canvas
        // now carries the outline/shadow margins, so back off by the plate inset.
        ctx.drawImage(sp.c, sx - 2 - sp.mx, sy - 2 - sp.my, sp.w, sp.h);
        // mid-blink the tube goes DARK, not transparent — alpha-fading the whole
        // plate let the wall show through; a dark wash over the plate reads as
        // an unlit sign that's still physically mounted there.
        if (blinkOff) { ctx.fillStyle = 'rgba(10, 10, 16, 0.55)'; ctx.fillRect(sx - 2, sy - 2, sp.pw, sp.ph); }
      };
      for (const sign of signs) paint(sign);

      // Night re-light pass: for each lit sign, lay an additive bloom halo over
      // the darkened world, then repaint the panel + a brightened glyph so the
      // neon punches through. amt = night strength (0..1).
      relightSigns = (amt: number) => {
        for (const sg of signs) {
          if (!isLit(sg)) continue;
          const off = sg.blink && !neonOn; // mid-blink: stay dark
          const { pw, ph } = dims(sg); // bloom is sized/centred on the plate, not the shadow margins
          const sx = sg.x * TILE - cam.x, sy = sg.y * TILE - cam.y + 4;
          const cx = sx - 2 + pw / 2, cy = sy - 2 + ph / 2;
          if (!off) {
            const r = Math.max(pw, ph) * 0.85 + 9;
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

    // apartment furniture: whatever the player has placed, where they placed it.
    // A soft contact shadow under each floor piece grounds it (no more floating).
    if (scene.id === 'apartment') {
      const s = saveRef.current;
      const contactShadow = (tx: number, ty: number, wTiles: number) => {
        const cx = tx * TILE - cam.x + (wTiles * TILE) / 2;
        const cy = ty * TILE - cam.y + TILE - 1.5;
        ctx.fillStyle = 'rgba(20, 14, 10, 0.22)';
        ctx.beginPath();
        ctx.ellipse(cx, cy, wTiles * TILE * 0.42, 2.4, 0, 0, Math.PI * 2);
        ctx.fill();
      };
      if (!s.placed['bed']) {
        contactShadow(1, 1, 2);
        ctx.drawImage(atlas['f-futon'], 1 * TILE - cam.x, 1 * TILE - cam.y);
      }
      for (const itemId of Object.keys(s.placed)) {
        const pos = s.placed[itemId];
        if (itemKind(itemId) !== 'wall') contactShadow(pos.x, pos.y, itemFootprintW(itemId));
        ctx.drawImage(atlas[furnitureById(itemId).sprite], pos.x * TILE - cam.x, pos.y * TILE - cam.y);
      }
      // Private home onsen: a fixed hinoki tub in the corner once you've had the
      // landlord install it. (Guarded — the f-onsen sprite may land in the atlas
      // a build later than this wiring; until then we just skip drawing it.)
      if (s.homeOnsen && atlas['f-onsen']) {
        contactShadow(HOME_ONSEN_TILE.x, HOME_ONSEN_TILE.y, 1);
        ctx.drawImage(atlas['f-onsen'], HOME_ONSEN_TILE.x * TILE - cam.x, HOME_ONSEN_TILE.y * TILE - cam.y);
      }
      if (gachaComplete(s)) {
        contactShadow(MANEKI_SLOT.x, MANEKI_SLOT.y, 1);
        ctx.drawImage(atlas['f-maneki'], MANEKI_SLOT.x * TILE - cam.x, MANEKI_SLOT.y * TILE - cam.y);
      }
      // Trophy shelf: a wall plank that fills with your gachapon figures, one toy
      // per owned figure, spaced across the plank (a packed shelf as it fills).
      const ownedFigs = GACHA_FIGURES.map((n, i) => i).filter(i => (s.gacha[GACHA_FIGURES[i]] ?? 0) > 0);
      if (ownedFigs.length > 0) {
        const sx = SHELF_SLOT.x * TILE - cam.x, sy = SHELF_SLOT.y * TILE - cam.y;
        ctx.drawImage(atlas['f-shelf'], sx, sy);
        const plankW = SHELF_SLOT.w * TILE, FW = 11, FH = 13;
        const pad = 3, span = plankW - pad * 2 - FW;
        const n = ownedFigs.length;
        ownedFigs.forEach((fi, k) => {
          const fx = sx + pad + (n === 1 ? span / 2 : (span * k) / (n - 1));
          ctx.drawImage(atlas[`fig-${fi}`], Math.round(fx), sy + (TILE - 2) - FH);
        });
      }
    }

    // the greenhouse: growing crops on each plot + a sprinkler mist when on
    if (scene.id === 'greenhouse') {
      const gh = saveRef.current.greenhouse;
      const today = saveRef.current.day;
      GREENHOUSE_PLOTS.forEach((cell, i) => {
        const bx = cell.x * TILE - cam.x, by = cell.y * TILE - cam.y;
        if (i >= gh.beds) { // untilled bed — dim so it reads as "expandable later"
          ctx.fillStyle = 'rgba(18,14,8,0.5)';
          ctx.fillRect(bx, by, TILE, TILE);
          return;
        }
        const plot = gh.plots[i];
        if (!plot || !plot.crop) return;
        const crop = CROPS[plot.crop];
        if (!crop) return;
        const ready = plotReady(plot);
        const bob = ready ? Math.round(Math.sin(t * 4 + cell.x) * 1) : 0;
        const key = crop.sprites[plotStage(plot)];
        if (atlas[key]) ctx.drawImage(atlas[key], bx, by - bob);
        if (ready) { // harvest-ready sparkle
          ctx.fillStyle = `rgba(255,233,160,${0.55 + Math.sin(t * 6 + cell.x) * 0.35})`;
          ctx.fillRect(bx + 7, by - 4, 2, 2);
        } else if (!gh.sprinkler && plot.wateredDay !== today) { // dry — needs water today
          ctx.fillStyle = 'rgba(214,120,60,0.85)';
          ctx.fillRect(bx + 6, by - 2, 4, 1);
        }
      });
      if (gh.sprinkler) {
        // a light falling-mist over the tilled beds while the sprinkler runs
        ctx.save();
        ctx.fillStyle = 'rgba(180,230,240,0.7)';
        for (let i = 0; i < gh.beds; i++) {
          const cell = GREENHOUSE_PLOTS[i];
          const bx = cell.x * TILE - cam.x, by = cell.y * TILE - cam.y;
          for (let d = 0; d < 4; d++) {
            const dx = (d * 5 + Math.floor(t * 22 + cell.x * 3)) % 14;
            const dy = (d * 4 + Math.floor(t * 30 + cell.x * 5)) % 14;
            ctx.fillRect(bx + 1 + dx, by + dy, 1, 2);
          }
        }
        ctx.restore();
      }
    }

    // the mines: ore nodes, crawlers, sparkle VFX
    if (scene.id === 'mines') {
      if (mineDownRef.current) {
        ctx.drawImage(atlas['t-ladder-down'], mineDownRef.current.x * TILE - cam.x, mineDownRef.current.y * TILE - cam.y);
      }
      if (mineChestRef.current) {
        const bob = mineChestOpenRef.current ? 0 : Math.round(Math.sin(t * 3) * 1); // closed chest breathes
        ctx.drawImage(atlas[mineChestOpenRef.current ? 't-chest-open' : 't-chest'],
          mineChestRef.current.x * TILE - cam.x, mineChestRef.current.y * TILE - cam.y + bob);
      }
      for (const node of oreNodesRef.current) {
        const key = node.geode ? 'ore-geode' : `ore-${node.mineral.id}`;
        ctx.drawImage(atlas[key], node.x * TILE - cam.x, node.y * TILE - cam.y);
      }
      const cFrame = Math.floor(t * 6) % 2;
      for (const c of crawlersRef.current) {
        if (c.hurtT > 0 && Math.floor(t * 20) % 2 === 0) continue; // hit flicker
        ctx.drawImage(atlas['m-shadow'], Math.round(c.x) - cam.x, Math.round(c.y) - cam.y + 2);
        const sprite = c.kind === 'normal' ? `crawler-${cFrame}` : `crawler-${c.kind}-${cFrame}`;
        ctx.drawImage(atlas[sprite], Math.round(c.x) - cam.x, Math.round(c.y) - cam.y);
      }
      for (const pr of projectilesRef.current) {
        if (pr.gun) {
          // AK-67 tracer: a short bright streak with a glowing tip
          ctx.fillStyle = '#fff0a0';
          ctx.fillRect(Math.round(pr.x) - cam.x + 2, Math.round(pr.y) - cam.y + 2, 4, 4);
          ctx.fillStyle = '#ffb030';
          ctx.fillRect(Math.round(pr.x - pr.dx * 0.012) - cam.x + 3, Math.round(pr.y - pr.dy * 0.012) - cam.y + 3, 2, 2);
        } else {
          ctx.drawImage(atlas['m-sparkle'], Math.round(pr.x) - cam.x, Math.round(pr.y) - cam.y, 9, 9);
        }
      }
    }
    if (sparkleRef.current) {
      ctx.drawImage(atlas['m-sparkle'], Math.round(sparkleRef.current.x) - cam.x, Math.round(sparkleRef.current.y) - cam.y + 2);
    }
    // Shore: scatter today's uncollected beach finds on the sand.
    if (scene.id === 'shore') {
      const spots = shoreForageFor(saveRef.current);
      const taken = saveRef.current.foragedSpots;
      for (let i = 0; i < spots.length; i++) {
        if (taken.includes(i)) continue;
        const sp = spots[i];
        const bx = sp.x * TILE - cam.x, by = sp.y * TILE - cam.y;
        const bob = Math.round(Math.sin(t * 3 + i) * 1.5);               // gentle hop so it reads as "alive"
        ctx.drawImage(atlas[forageById(sp.kind).sprite], bx, by + bob);
        // blinking sparkle above the find — makes it obvious you can grab it
        const a = 0.45 + 0.55 * Math.sin(t * 5 + i * 1.7);
        if (a > 0) {
          ctx.globalAlpha = a;
          ctx.drawImage(atlas['m-sparkle'], bx + 6, by - 6 + bob, 8, 8);
          ctx.globalAlpha = 1;
        }
      }
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
        ctx.drawImage(atlas['v-boat'], 2 * TILE - cam.x, 13 * TILE - cam.y + bob); // moored at the pier head
      }
      if (scene.id === 'island') {
        ctx.drawImage(atlas['v-boat'], 0 * TILE - cam.x, 7 * TILE - cam.y + bob); // moored at the west dock
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
      if (npcHiddenNow(saveRef.current, npc.id)) continue; // time-gated (Max on even nights, the midnight stranger)
      if (cutsceneRef.current?.hideNpc === npc.id) continue; // this NPC is currently a walking cutscene actor
      ents.push({
        y: npc.y * TILE,
        draw: () => {
          if (npc.id === 'campfire') { ctx.drawImage(atlas['prop-campfire'], npc.x * TILE - cam.x, npc.y * TILE - cam.y); return; }
          ctx.drawImage(atlas['m-shadow'], npc.x * TILE - cam.x, npc.y * TILE - cam.y + 2);
          ctx.drawImage(atlas[`${npc.sprite}-${npc.dir}-0`], npc.x * TILE - cam.x, npc.y * TILE - cam.y);
        },
      });
    }
    // Kinryū patrons — decorative gamblers y-sorted with everyone else. A gentle
    // idle sway (like the derby fishers' cast-bob) plus the odd little hop when a
    // spin comes up good — pure draw-time, no state, every sprite atlas-guarded.
    if (scene.id === 'casino') {
      for (const g of casinoGamblersFor(saveRef.current.day)) {
        ents.push({
          y: g.y * TILE,
          draw: () => {
            const gx = g.x * TILE - cam.x, gy = g.y * TILE - cam.y;
            const sh = atlas['m-shadow']; if (sh) ctx.drawImage(sh, gx, gy + 2);
            let bob = Math.round(Math.sin(t * 1.6 + g.x * 0.7) * 0.5 - 0.5);
            // occasional celebration hop, on a slow per-patron clock (seeded by x
            // so the room never jumps in unison) — someone's machine just paid out
            const cyc = t * 0.09 + g.x * 0.13;
            const hph = cyc % 1;
            if (hph < 0.1) bob -= Math.round(2 * Math.sin((hph / 0.1) * Math.PI));
            const gs = atlas[`${g.sprite}-${g.dir}-0`]; if (gs) ctx.drawImage(gs, gx, gy + bob);
          },
        });
      }
    }
    for (const w of wanderersRef.current) {
      ents.push({
        y: w.y,
        draw: () => {
          ctx.drawImage(atlas['m-shadow'], Math.round(w.x) - cam.x, Math.round(w.y) - cam.y + 2);
          const dancing = DANCER_IDS.has(w.id);
          let frame: number, bob: number, dir = w.dir;
          if (dancing) {
            // dancers bob in place even when not walking (Club Kaiju crowd)
            frame = Math.floor(animRef.current * 9) % 2;
            bob = -(Math.abs(Math.sin(animRef.current * 7 + w.homeX)) > 0.5 ? 1 : 0);
            // occasional flourish: on a slow per-dancer clock (seeded by homeX so
            // the crowd never moves in unison) each dancer periodically throws a
            // full SPIN (dir whirls through all four facings) or a little HOP —
            // pure draw-time, no wanderer state to migrate.
            const cyc = animRef.current * 0.14 + w.homeX * 0.031; // ~7s between flourishes
            const fph = cyc % 1;
            if (fph < 0.16 && !w.moving) {
              const k = fph / 0.16;                               // 0..1 through the flourish
              if ((Math.floor(cyc) + Math.floor(w.homeX / TILE)) % 2) {
                dir = (['down', 'left', 'up', 'right'] as Dir[])[Math.floor(k * 4) % 4];
              } else {
                bob = -Math.round(3 * Math.sin(k * Math.PI));     // one smooth hop arc
              }
            }
          } else if (w.moving) {
            // walk cadence rides THIS NPC's own stride (walkPhase), not a shared clock,
            // so steps read naturally; a 1px lift on alternate frames adds a gentle bob.
            const step = Math.floor(w.walkPhase * 7) % 2;
            frame = step; bob = -step;
          } else {
            frame = 0; bob = 0; // clean idle pose, no twitch
          }
          ctx.drawImage(atlas[`${w.sprite}-${dir}-${frame}`], Math.round(w.x) - cam.x, Math.round(w.y) - cam.y + bob);
        },
      });
    }
    if (cutsceneRef.current) {
      const a = cutsceneRef.current.actor;
      ents.push({
        y: a.y,
        draw: () => {
          ctx.drawImage(atlas['m-shadow'], Math.round(a.x) - cam.x, Math.round(a.y) - cam.y + 2);
          const moving = ['walk', 'approach', 'return'].includes(cutsceneRef.current!.phase);
          const frame = moving ? (Math.floor(animRef.current * 7) % 2) : 0;
          ctx.drawImage(atlas[`${a.sprite}-${a.dir}-${frame}`], Math.round(a.x) - cam.x, Math.round(a.y) - cam.y);
        },
      });
    }
    // David the cat (y-sorted with everyone else so he passes in front/behind).
    if (catRef.current) {
      const cat = catRef.current;
      ents.push({
        y: cat.y,
        draw: () => {
          const cx = Math.round(cat.x) - cam.x, cy = Math.round(cat.y) - cam.y;
          const bob = cat.sitting ? 0 : Math.round(Math.sin(animRef.current * 9) * 0.6);
          ctx.drawImage(atlas['m-shadow'], cx, cy + 2);
          const d = cat.dir === 'left' ? 'l' : 'r';
          // nap = curled loaf; sit = slow 2-frame tail flick; walk = 2-frame trot
          const key = cat.napping ? `cat-nap-${d}`
            : cat.sitting ? `cat-sit-${d}-${Math.floor(animRef.current * 1.5) % 2}`
            : `cat-${d}-${Math.floor(animRef.current * 8) % 2}`;
          ctx.drawImage(atlas[key] ?? atlas[`cat-${d}`], cx, cy + bob);
          // Post-pet heart: a tiny pixel heart drifts up off him and fades. A few
          // fillRects only while the 1.4s timer runs — no sprite, no allocation.
          if (petHeartRef.current > 0) {
            const rise = (1.4 - petHeartRef.current) * 8;
            ctx.globalAlpha = Math.min(1, petHeartRef.current * 1.6);
            ctx.fillStyle = '#e857a8';
            const hx = cx + 5, hy = Math.round(cy - 8 - rise);
            ctx.fillRect(hx + 1, hy, 2, 2); ctx.fillRect(hx + 4, hy, 2, 2);       // the two bumps
            ctx.fillRect(hx, hy + 1, 7, 2); ctx.fillRect(hx + 1, hy + 3, 5, 1);   // the body
            ctx.fillRect(hx + 2, hy + 4, 3, 1); ctx.fillRect(hx + 3, hy + 5, 1, 1); // the point
            ctx.globalAlpha = 1;
          }
        },
      });
    }
    // Today's street event — a temporary actor that only exists in the city for
    // this day (npc-* = a character, prop-* = a static stall/machine/critter).
    if (scene.id === 'city' && streetEventRef.current) {
      const ev = streetEventRef.current;
      const isNpc = ev.sprite.startsWith('npc-');
      ents.push({
        y: ev.y * TILE,
        draw: () => {
          const ex = ev.x * TILE - cam.x, ey = ev.y * TILE - cam.y;
          ctx.drawImage(atlas['m-shadow'], ex, ey + 2);
          if (isNpc) ctx.drawImage(atlas[`${ev.sprite}-${ev.dir}-0`], ex, ey);
          else ctx.drawImage(atlas[ev.sprite], ex, ey);
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
          const cx = Math.round(p.x) - cam.x, cy = Math.round(p.y) - cam.y;
          const bob = moving ? Math.round(Math.sin(t * 20) * 0.9) : 0;   // engine jiggle
          const sx = moving ? Math.round(Math.sin(t * 13) * 0.6) : 0;    // little shimmy as it rolls
          // exhaust puff trailing out the back while accelerating
          if (moving) {
            const back = dirRef.current === 'up' ? [8, 18] : dirRef.current === 'down' ? [8, -2] : dirRef.current === 'left' ? [22, 9] : [-6, 9];
            const drift = dirRef.current === 'up' ? [0, 4] : dirRef.current === 'down' ? [0, -4] : dirRef.current === 'left' ? [4, 0] : [-4, 0];
            const puff = (t * 5) % 1;
            ctx.save();
            ctx.globalAlpha = 0.3 * (1 - puff);
            ctx.fillStyle = '#cfcabf';
            ctx.beginPath();
            ctx.arc(cx + back[0] + drift[0] * puff, cy + back[1] + drift[1] * puff, 1.5 + puff * 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
          ctx.drawImage(atlas['m-shadow'], cx - 8, cy + 2);
          ctx.drawImage(atlas['m-shadow'], cx + 8, cy + 2);
          ctx.drawImage(atlas['v-car'], cx - 8 + sx, cy + bob);
          return;
        }
        const px = Math.round(p.x) - cam.x, py = Math.round(p.y) - cam.y;
        const frame = moving ? (Math.floor(animRef.current * 7) % 2) : 0;
        const playerKey = saveRef.current.hat ? `${pcBase}-hat` : pcBase;
        const sprite = atlas[`${playerKey}-${dirRef.current}-${frame}`];
        const g = parisGlitchRef.current;
        if (g > 0) {
          // "Hacked into the map": the player materializes in datamoshed scanlines
          // — sliced + jittered + chromatic flashes, settling as the timer runs out.
          const k = g / 1.9;                       // 1 → 0 over the effect
          const sw = sprite.width, sh = sprite.height, slices = 8, step = sh / slices;
          for (let i = 0; i < slices; i++) {
            if (k > 0.15 && Math.random() < 0.14 * k) continue;          // dropped scanline
            const off = Math.round((Math.random() - 0.5) * 14 * k);     // horizontal tear
            ctx.globalAlpha = 0.55 + Math.random() * 0.45;
            ctx.drawImage(sprite, 0, i * step, sw, step, px + off, py + i * step, sw, step);
          }
          ctx.globalAlpha = 1;
          if (Math.random() < 0.6) {               // additive cyan/magenta glitch band
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.5 * k;
            ctx.fillStyle = Math.random() < 0.5 ? '#37e0ff' : '#ff3df0';
            ctx.fillRect(px - 4, py + Math.round(Math.random() * sh), sw + 8, 1 + Math.round(Math.random() * 2));
            ctx.restore();
          }
          return;
        }
        ctx.drawImage(atlas['m-shadow'], px, py + 2);
        ctx.drawImage(sprite, px, py);
      },
    });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.draw());

    // Arrange mode: dim the room, light up placeable floor, draw the drag ghost.
    if (arrangeRef.current && scene.id === 'apartment') {
      ctx.fillStyle = 'rgba(8, 10, 24, 0.45)';
      ctx.fillRect(0, 0, VIEW_PW, VIEW_PH);
      const held = heldRef.current;
      // grid + valid-cell wash over the interior floor (bounds follow the grid)
      ctx.lineWidth = 1;
      const aSz = sceneSize(scene);
      for (let ty = 0; ty <= aSz.y - 2; ty++) {
        for (let tx = 1; tx <= aSz.x - 2; tx++) {
          const ok = held
            ? (held.rug ? rugPlaceableAt(tx, ty) : placeableAt(held.id, tx, ty))
            : (tileAt(scene, tx, ty) && !tileAt(scene, tx, ty)!.solid && ty >= 1);
          if (ty === 0 && (!held || held.rug || itemKind(held.id) !== 'wall')) continue;
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
        const spr = held.rug ? atlas[decorById(held.id)?.sprite ?? ''] : atlas[furnitureById(held.id).sprite];
        const gx = g.tx * TILE - cam.x, gy = g.ty * TILE - cam.y;
        ctx.globalAlpha = 0.75;
        if (spr) ctx.drawImage(spr, gx, gy);
        ctx.globalAlpha = 1;
        const w = (held.rug ? RUG_W : itemFootprintW(held.id)) * TILE;
        const h = (held.rug ? RUG_H : 1) * TILE;
        ctx.strokeStyle = g.valid ? '#7ce8a0' : '#e0552e';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(gx + 0.5, gy + 0.5, w - 1, h - 1);
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
            if (!skyGradRef.current) {
              const g = ctx.createLinearGradient(0, 0, 0, VIEW_PH);
              g.addColorStop(0, 'rgba(6, 10, 30, 0.28)'); g.addColorStop(0.55, 'rgba(6, 10, 30, 0)');
              skyGradRef.current = g;
            }
            ctx.save(); ctx.globalAlpha = night; ctx.fillStyle = skyGradRef.current; ctx.fillRect(0, 0, VIEW_PW, VIEW_PH); ctx.restore();
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
        if (!sunGradRef.current) {
          const g = ctx.createLinearGradient(0, 0, VIEW_PW, VIEW_PH);
          g.addColorStop(0, 'rgba(255, 214, 140, 0.22)'); g.addColorStop(0.5, 'rgba(255, 214, 140, 0)');
          sunGradRef.current = g;
        }
        ctx.save(); ctx.globalAlpha = morn; ctx.fillStyle = sunGradRef.current; ctx.fillRect(0, 0, VIEW_PW, VIEW_PH); ctx.restore();
      }
    }

    // Rain: a looping ambient track over the scene music + slanted streaks, on
    // rainy days while you're anywhere outdoors (the shrine counts; interiors,
    // mines and the backrooms don't). `isRainyDay` is day-1-safe and seeded.
    // Kiwami Island (and the bay you sail to reach it) sits outside the weather
    // front — it NEVER rains there; the island is the postcard escape.
    {
      const raining = scene.outdoor && scene.id !== 'island' && scene.id !== 'deepsea' && isRainyDay(saveRef.current);
      syncRain(raining);
      if (raining) {
        ctx.save();
        ctx.strokeStyle = 'rgba(180, 205, 235, 0.5)';
        ctx.lineWidth = 1;
        const DROPS = 90, SLANT = 4, LEN = 11, SPD = 520;
        for (let i = 0; i < DROPS; i++) {
          const seed = i * 9301 + 49297;
          const bx = (seed % 997) / 997 * (VIEW_PW + 40) - 20;
          const phase = (seed % 911) / 911;
          const y = ((t * SPD * (0.7 + phase * 0.6) + i * 53) % (VIEW_PH + LEN)) - LEN;
          const x = bx + (y / VIEW_PH) * SLANT * 6;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x - SLANT, y + LEN);
          ctx.stroke();
        }
        ctx.restore();
        // faint cool wash so the whole scene reads overcast
        ctx.fillStyle = 'rgba(70, 90, 120, 0.12)';
        ctx.fillRect(0, 0, VIEW_PW, VIEW_PH);
      }
    }

    // Fog: a calm, cozy misty day — a soft grey-blue wash + a gentle full-screen
    // vignette that trims visibility at the edges (still very readable). Outdoor
    // scenes only, and mutually exclusive with rain (`foggyDay` is false on rainy
    // days). Authored neutral/low-contrast so it reads at any time of day. The
    // vignette is a radial gradient cached once (no per-frame alloc, like the
    // sky/sun bands), in the same logical 384×224 space the draw transform maps.
    if (scene.outdoor && foggyDay(saveRef.current)) {
      ctx.fillStyle = 'rgba(178, 192, 206, 0.20)'; // flat misty grey-blue haze
      ctx.fillRect(0, 0, VIEW_PW, VIEW_PH);
      if (!fogVigRef.current) {
        const g = ctx.createRadialGradient(
          VIEW_PW / 2, VIEW_PH / 2, VIEW_PH * 0.34,
          VIEW_PW / 2, VIEW_PH / 2, VIEW_PW * 0.62);
        g.addColorStop(0, 'rgba(150, 166, 184, 0)');
        g.addColorStop(1, 'rgba(150, 166, 184, 0.5)');
        fogVigRef.current = g;
      }
      ctx.fillStyle = fogVigRef.current;
      ctx.fillRect(0, 0, VIEW_PW, VIEW_PH);
    }

    // Meteor shower: a rare clear-night sky (`meteorNight`, mutually exclusive with
    // rain/fog) sends occasional shooting stars across the upper sky band on outdoor
    // scenes once night falls. Gated on the same `nightT` ramp as the dusk wash, so
    // they only streak over real darkness. Cheap & state-free: each "slot" cycles on
    // its own period, dormant most of the time, drawing one short bright diagonal
    // streak (a faint full tail + a brighter head half + a hot pixel) that fades in
    // and out over its short flight. No per-frame gradient — just a few stroked lines.
    {
      const sM = saveRef.current;
      const nAmt = nightT(sM);
      if (scene.outdoor && nAmt > 0.15 && meteorNight(sM)) {
        const SKY_H = VIEW_PH * 0.6; // upper sky band — meteors live here, fade as they cross it
        ctx.save();
        ctx.lineCap = 'round';
        // Many more, faster, bigger streaks with glowing trails so a meteor night
        // is unmistakable (still cozy — soft additive glow, no harsh strobing).
        ctx.globalCompositeOperation = 'lighter';
        const SLOTS = 10;
        for (let i = 0; i < SLOTS; i++) {
          const period = 1.2 + i * 0.45;           // seconds between this slot's meteors (much more frequent)
          const TRAVEL = 1.0;                      // seconds a single streak is in flight
          const flight = (t + i * 0.73) % period;  // time since this slot's last spawn
          if (flight > TRAVEL) continue;           // dormant for the rest of the cycle
          const k = flight / TRAVEL;               // 0..1 progress of THIS streak
          const h = (i * 2654435761) >>> 0;        // cheap per-slot hash → start + slope
          const sx = ((h % 1000) / 1000) * VIEW_PW * 0.8 + VIEW_PW * 0.06;
          const sy = (h >> 16) & 31;               // start near the top
          const slopeX = 120 + ((h >> 10) & 95);   // px of travel (down-right) — longer flights
          const slopeY = 56 + ((h >> 6) & 47);
          const inv = 1 / Math.hypot(slopeX, slopeY);
          const hx = sx + k * slopeX, hy = sy + k * slopeY;        // streak head
          if (hy > SKY_H) continue;
          const fade = Math.sin(k * Math.PI);      // 0 → 1 → 0 over the flight
          const a = fade * nAmt;
          if (a <= 0.03) continue;
          const LEN = 30;                          // tail length (doubled), pointing back along travel
          const tx = hx - slopeX * inv * LEN, ty = hy - slopeY * inv * LEN;
          const mx = hx - slopeX * inv * LEN * 0.5, my = hy - slopeY * inv * LEN * 0.5;
          // soft glowing trail underlay (wide, dim) → tail → bright head → hot core
          ctx.lineWidth = 3.5;
          ctx.strokeStyle = `rgba(150, 188, 255, ${a * 0.3})`;  // wide glow halo around the trail
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = `rgba(206, 224, 255, ${a * 0.7})`;  // full tail
          ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
          ctx.strokeStyle = `rgba(240, 248, 255, ${a})`;        // brighter head half
          ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(hx, hy); ctx.stroke();
          // glowing head: a cached radial bloom (built once — never
          // createRadialGradient per frame, the KB-banned pattern) + a hot core pixel
          let bloom = glowSpriteRef.current.get('meteor-head');
          if (!bloom) {
            const S = 32;
            bloom = document.createElement('canvas'); bloom.width = S; bloom.height = S;
            const gx = bloom.getContext('2d')!;
            const rg = gx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
            rg.addColorStop(0, 'rgba(255, 255, 255, 1)');
            rg.addColorStop(1, 'rgba(180, 210, 255, 0)');
            gx.fillStyle = rg; gx.fillRect(0, 0, S, S);
            glowSpriteRef.current.set('meteor-head', bloom);
          }
          ctx.globalAlpha = a;
          ctx.drawImage(bloom, hx - 5, hy - 5, 10, 10);
          ctx.globalAlpha = 1;
          ctx.fillStyle = `rgba(255, 255, 255, ${a})`;          // hot leading pixel
          ctx.fillRect(hx - 1, hy - 1, 2.4, 2.4);
        }
        ctx.restore();
      }
    }

    // Ambient soundscape: surf+gulls at the coast, drips in the mines, murmur +
    // chip clatter at the casino, rain on the window when it's raining at home.
    // Layered over (not replacing) the music.
    {
      const sid = scene.id;
      const amb: AmbientKind | null =
        sid === 'apartment' && isRainyDay(saveRef.current) ? 'rainhome'
          : (sid === 'shore' || sid === 'deepsea' || sid === 'island' || sid === 'seacave') ? 'shore'
            : (sid === 'mines' || sid === 'backrooms') ? 'mine'
              : sid === 'casino' ? 'casino'
                : null;
      const adt = Math.min(0.1, Math.max(0, t - ambLastTRef.current));
      ambLastTRef.current = t;
      ambientSet(amb, adt);
    }

    // Club Kaiju: a dim room lit by sweeping colored spotlights, a disco-ball
    // glow, a beat-synced crowd wash + speaker thump, and drifting music notes.
    // The dance-floor tiles already ripple colors; this is the lighting on top.
    // Everything modulates on smooth low-amplitude sines — NO strobe (kb rule:
    // seizure risk; the club should feel groovy, never harsh).
    // Pre-rendered radial light sprite, built once per color and cached —
    // blitting these is far cheaper than createRadialGradient + full-screen fill
    // every frame (which tanked the club's FPS). Shared by the club + lamps.
    const glow = (rgb: string): HTMLCanvasElement => {
      const cache = glowSpriteRef.current;
      let c = cache.get(rgb);
      if (!c) {
        const S = 96;
        c = document.createElement('canvas'); c.width = S; c.height = S;
        const gx = c.getContext('2d')!;
        const rg = gx.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
        rg.addColorStop(0, `rgba(${rgb},1)`); rg.addColorStop(1, `rgba(${rgb},0)`);
        gx.fillStyle = rg; gx.fillRect(0, 0, S, S);
        cache.set(rgb, c);
      }
      return c;
    };

    // City courier terminal ('J'): its screen casts a soft teal glow that gently
    // pulses — always on (it's a lit display), reusing the cached glow() sprite.
    if (scene.id === 'city') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const screen = glow('95,230,210');
      for (let ty = ty0; ty <= ty1; ty++) {
        const row = scene.grid[ty];
        for (let tx = tx0; tx <= tx1; tx++) {
          if (row[tx] !== 'J') continue;
          const gx = tx * TILE - cam.x + 8, gy = ty * TILE - cam.y + 4;
          ctx.globalAlpha = 0.16 + 0.05 * Math.sin(t * 1.8 + tx); // soft display flicker
          ctx.drawImage(screen, gx - 18, gy - 18, 36, 36);
        }
      }
      // Torii-garden toro lanterns ('O'): the same soft warm glow the shrine's
      // stone lanterns give off — lit only once night falls (nightT-gated),
      // still just cheap cached-sprite blits inside the same additive pass.
      const cityNight = nightT(saveRef.current);
      if (cityNight > 0.05) {
        const toro = glow('255,206,120');
        for (let ty = ty0; ty <= ty1; ty++) {
          const row = scene.grid[ty];
          for (let tx = tx0; tx <= tx1; tx++) {
            if (row[tx] !== 'O') continue;
            const gx = tx * TILE - cam.x + 8, gy = ty * TILE - cam.y + 6;
            ctx.globalAlpha = cityNight * (0.22 + 0.04 * Math.sin(t * 1.6 + tx * 1.3)); // soft flicker, swells with night
            ctx.drawImage(toro, gx - 20, gy - 20, 40, 40);
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Downtown street lamps cast a soft warm glow from each lamp head.
    if (scene.id === 'badtown') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const lamp = glow('255,233,160');
      for (let ty = ty0; ty <= ty1; ty++) {
        const row = scene.grid[ty];
        for (let tx = tx0; tx <= tx1; tx++) {
          if (row[tx] !== 'L') continue;
          const gx = tx * TILE - cam.x + 8, gy = ty * TILE - cam.y + 3;
          ctx.globalAlpha = 0.20 + 0.04 * Math.sin(t * 2 + tx);  // faint flicker
          ctx.drawImage(lamp, gx - 22, gy - 22, 44, 44);
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Kinryū Lounge: warm gold lamp-pools over the blackjack/roulette felts and a
    // busier amber flicker over each slot machine — the windowless room is lit
    // like this at every hour (night-independent). Cached glow() sprites blitted
    // additively, same pattern as the club/lamps (never per-frame gradients).
    if (scene.id === 'casino') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const felt = glow('255,200,90');
      const reel = glow('255,150,70');
      for (let ty = ty0; ty <= ty1; ty++) {
        const row = scene.grid[ty];
        for (let tx = tx0; tx <= tx1; tx++) {
          const ch = row[tx];
          if (ch === 'B' || ch === 'R' || ch === 'r') {         // table lamps: steady warm pools
            const gx = tx * TILE - cam.x + 8, gy = ty * TILE - cam.y + 8;
            ctx.globalAlpha = 0.20 + 0.04 * Math.sin(t * 1.4 + tx * 1.1);
            ctx.drawImage(felt, gx - 22, gy - 22, 44, 44);
          } else if (ch === 'S') {                              // slots: faint jittery reel-light
            const gx = tx * TILE - cam.x + 8, gy = ty * TILE - cam.y + 10;
            ctx.globalAlpha = 0.09 + 0.05 * Math.sin(t * 5 + tx * 2.7 + ty * 1.9);
            ctx.drawImage(reel, gx - 14, gy - 14, 28, 28);
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Kiwami Island: the volcano crater glows (always, gently pulsing) and the
    // hot spring breathes little puffs of steam — cheap touches that make the
    // place feel alive. Reuses the cached glow() sprite, additive-blended.
    if (scene.id === 'island') {
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      const crater = glow('255,120,40');
      const steam = glow('228,238,236');
      for (let ty = ty0; ty <= ty1; ty++) {
        const row = scene.grid[ty];
        for (let tx = tx0; tx <= tx1; tx++) {
          const ch = row[tx];
          if (ch !== 'V' && ch !== 'H') continue;
          const gx = tx * TILE - cam.x + 8, gy = ty * TILE - cam.y;
          if (ch === 'V') {
            ctx.globalAlpha = 0.28 + 0.10 * Math.sin(t * 2.2 + tx);
            ctx.drawImage(crater, gx - 18, gy - 14, 36, 36);
          } else {
            for (let k = 0; k < 2; k++) {
              const ph = (t * 0.45 + k * 0.5 + tx * 0.2) % 1; // 0..1 rise+fade loop
              ctx.globalAlpha = 0.16 * (1 - ph);
              ctx.drawImage(steam, gx - 10, gy + 4 - ph * 16 - 10, 20, 20);
            }
          }
        }
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Shrine: the stone (O) and paper (L) lanterns give off a soft warm glow —
    // the only thing that lights up here, and only once night falls.
    if (scene.id === 'shrine') {
      const night = nightT(saveRef.current);
      if (night > 0.05) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const lant = glow('255,206,120');
        for (let ty = ty0; ty <= ty1; ty++) {
          const row = scene.grid[ty];
          for (let tx = tx0; tx <= tx1; tx++) {
            const ch = row[tx];
            if (ch !== 'L' && ch !== 'O') continue;
            const gx = tx * TILE - cam.x + 8, gy = ty * TILE - cam.y + 6;
            ctx.globalAlpha = night * (0.22 + 0.04 * Math.sin(t * 1.6 + tx * 1.3)); // soft flicker, swells with night
            ctx.drawImage(lant, gx - 20, gy - 20, 40, 40);
          }
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }
    }

    // ---- Festival fireworks (transient — festival nights only) ---------------
    // On a festival night whose festival has `nightFireworks`, a handful of gentle
    // hanabi bloom over the upper sky. Cheap & state-free, modelled on the meteor
    // block: each "slot" cycles on its own period — a flare climbs, then bursts
    // into an expanding ring of additive sparks that droop and fade. Drawn over
    // the night wash (additive 'lighter') so it reads against the dark sky.
    {
      const festFw = festivalFor(saveRef.current.day);
      const nFw = nightT(saveRef.current);
      if (festFw?.nightFireworks && festFw.scene === scene.id && nFw > 0.12) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const palette = ['255,210,120', '232,87,168', '124,232,224', '160,255,170', '255,150,90'];
        const SLOTS = 4;
        for (let i = 0; i < SLOTS; i++) {
          const period = 2.6 + i * 0.85;          // seconds between this slot's bursts
          const flight = (t + i * 1.37) % period;  // time since this slot last fired
          const RISE = 0.55, BURST = 1.5;          // flare climb, then ring expand+fade
          const h = (i * 2654435761) >>> 0;        // cheap per-slot hash → burst position
          const bx = ((h % 1000) / 1000) * VIEW_PW * 0.7 + VIEW_PW * 0.15;
          const by = 26 + ((h >> 12) & 31);        // high in the sky band
          const rgb = palette[i % palette.length];
          if (flight < RISE) {                      // rising flare: a bright climbing streak
            const k = flight / RISE;
            const fy = VIEW_PH * 0.62 - k * (VIEW_PH * 0.62 - by);
            ctx.fillStyle = `rgba(255,244,200,${nFw * 0.8})`;
            ctx.fillRect(bx - 0.5, fy, 1.5, 4);
          } else if (flight < RISE + BURST) {       // burst: an expanding ring of sparks
            const k = (flight - RISE) / BURST;      // 0..1 burst progress
            const a = nFw * (1 - k) * (1 - k);      // ease-out fade
            if (a <= 0.02) continue;
            const R = 4 + k * 22;                   // ring radius grows
            const SPARKS = 12;
            for (let j = 0; j < SPARKS; j++) {
              const ang = (j / SPARKS) * Math.PI * 2 + i;
              const sx = bx + Math.cos(ang) * R;
              const sy = by + Math.sin(ang) * R + k * 10; // gentle gravity droop
              ctx.fillStyle = `rgba(${rgb},${a})`;
              ctx.fillRect(sx - 1, sy - 1, 2, 2);
            }
            ctx.globalAlpha = a * 0.5;              // soft central bloom (reuses cached glow sprite)
            ctx.drawImage(glow(rgb), bx - 16, by - 16, 32, 32);
            ctx.globalAlpha = 1;
          }
        }
        ctx.restore();
      }
    }

    if (scene.id === 'nightclub') {
      // One implied beat clock (~114 BPM) that everything grooves to — the wash,
      // the speaker thump and the dancers all ride the same phase, so the room
      // reads as "synced to the music" even though the track isn't analysed.
      const beat = t * 1.9;                                      // beats elapsed
      const pulse = 0.5 + 0.5 * Math.sin(beat * Math.PI * 2);    // smooth 0..1 groove
      ctx.fillStyle = 'rgba(10, 8, 22, 0.34)';       // dim the room so the lights pop (one cheap fill)
      ctx.fillRect(0, 0, VIEW_PW, VIEW_PH);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      // crowd colour wash: one wide soft glow over the dance floor whose hue
      // crossfades through a FIXED palette (fixed rgb strings keep the glow()
      // cache bounded — a continuous hue cycle would bake a new canvas per frame)
      // and whose brightness breathes with the beat = the floor pulses in time.
      const WASH = ['232,87,168', '124,232,224', '160,120,255', '255,180,80'];
      const wSeg = t / 5;                                        // 5s per hue
      const wi = Math.floor(wSeg) % WASH.length, wf = wSeg % 1;
      const wx = 8 * TILE - cam.x, wy = 6 * TILE - cam.y;        // dance-floor centre
      const washA = 0.09 + 0.05 * pulse;
      ctx.globalAlpha = washA * (1 - wf);
      ctx.drawImage(glow(WASH[wi]), wx - 96, wy - 66, 192, 132);
      ctx.globalAlpha = washA * wf;
      ctx.drawImage(glow(WASH[(wi + 1) % WASH.length]), wx - 96, wy - 66, 192, 132);
      const beams: [string, number][] = [['232,87,168', 0], ['124,232,224', 2.1], ['255,210,74', 4.2]];
      const bx = 11 * TILE - cam.x + 8, by = 2 * TILE - cam.y + 8; // origin near the DJ booth
      for (const [rgb, ph] of beams) {
        const fx = bx + Math.sin(t * 0.8 + ph) * 90;             // sweep across the floor
        const fy = by + 96 + Math.sin(t * 0.5 + ph) * 16;
        ctx.globalAlpha = 0.16 + 0.08 * Math.sin(t * 3 + ph) + 0.06 * pulse; // beams lean into the beat
        ctx.drawImage(glow(rgb), fx - 48, fy - 48, 96, 96);      // only a 96px blit, not the whole screen
      }
      // disco-ball glow: drifts in a slow circle (driven by the same clock as the
      // beams) so its spot sweeps the floor instead of sitting dead-center.
      const dbx = 8 * TILE - cam.x + Math.cos(t * 0.9) * 36;
      const dby = 1 * TILE - cam.y + 4 + 40 + Math.sin(t * 0.7) * 24;
      ctx.globalAlpha = 0.22 + 0.12 * Math.sin(t * 6);
      ctx.drawImage(glow('230,240,255'), dbx - 32, dby - 32, 64, 64);
      // bar glow: a warm amber pool over the counter — the cozy corner against
      // the cool dance-floor colours (Lulu-lamp warmth, not another club light).
      ctx.globalAlpha = 0.16 + 0.04 * Math.sin(t * 1.7);
      ctx.drawImage(glow('255,190,110'), 1 * TILE - cam.x, 1.4 * TILE - cam.y, 64, 40);
      // speaker thump: a ring eases out of each end of the DJ booth once per
      // beat — an expanding stroked arc, smooth fade (localized, never a flash).
      const bf = beat % 1;                                       // 0..1 within this beat
      ctx.strokeStyle = 'rgb(180,200,255)'; ctx.lineWidth = 1;
      for (const spx of [11 * TILE + 8, 14 * TILE + 8]) {
        ctx.globalAlpha = 0.30 * (1 - bf);
        ctx.beginPath(); ctx.arc(spx - cam.x, 3 * TILE - cam.y, 3 + bf * 11, 0, Math.PI * 2); ctx.stroke();
      }
      // music notes: a few ♪ drift up off the booth on offset loops, swaying as
      // they rise and easing in/out so they never pop in or vanish abruptly.
      ctx.font = 'bold 8px monospace'; ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe9a8';
      for (let i = 0; i < 3; i++) {
        const nph = (t * 0.42 + i / 3) % 1;                      // 0..1 rise loop
        const nx = (11.6 + i * 1.1) * TILE - cam.x + Math.sin(t * 2 + i * 2.1) * 4;
        const ny = 2.2 * TILE - cam.y - nph * 24;
        ctx.globalAlpha = 0.5 * Math.sin(nph * Math.PI);
        ctx.fillText(i % 2 ? '♪' : '♫', nx, ny);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    // Mines: claustrophobic dark — you only see a few tiles around you (the wand
    // lights a little further). Makes the crawlers genuinely scary.
    if (scene.id === 'mines') {
      const pcx = Math.round(p.x) - cam.x + 8, pcy = Math.round(p.y) - cam.y + 8;
      const sv0 = saveRef.current;
      const lr = (sv0.gun || sv0.wand2) ? 124 : sv0.wand ? 104 : 70;
      const flick = 1 + Math.sin(t * 11) * 0.03; // faint lantern flicker
      // The flashlight gradient is centered at (0,0) and translated to the player
      // each frame, so it caches per light-radius instead of rebuilding every frame
      // (KB rule: never createRadialGradient in the draw loop). lr only changes when
      // you gain a wand/gun, so this is effectively built once. Flicker now rides on
      // globalAlpha (cheap) rather than re-baking the radius.
      if (!mineDarkRef.current || mineDarkRef.current.lr !== lr) {
        const g = ctx.createRadialGradient(0, 0, lr * 0.34, 0, 0, lr);
        g.addColorStop(0, 'rgba(6,6,10,0)');
        g.addColorStop(0.7, 'rgba(6,6,10,0.55)');
        g.addColorStop(1, 'rgba(3,3,7,0.95)');
        mineDarkRef.current = { lr, grad: g };
      }
      ctx.save();
      ctx.globalAlpha = flick; // ~0.97–1.03 lantern pulse (clamped by the stops' own alpha)
      ctx.translate(pcx, pcy);
      ctx.fillStyle = mineDarkRef.current.grad;
      ctx.fillRect(-pcx, -pcy, VIEW_PW, VIEW_PH);
      ctx.restore();

      // Treasure vault: a warm gold wash over the gloom + a brighter additive glow
      // pooling around the chest, so the floor reads as special. Reuses the cached
      // glow() sprite (no per-frame gradient allocations).
      if (mineVaultRef.current) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.05 + 0.012 * Math.sin(t * 2);   // faint floor-wide warm tint
        ctx.fillStyle = '#ffc24a';
        ctx.fillRect(0, 0, VIEW_PW, VIEW_PH);
        const vc = mineChestRef.current;
        if (vc) {
          const gx = vc.x * TILE - cam.x + 8, gy = vc.y * TILE - cam.y + 8;
          ctx.globalAlpha = 0.34 + 0.10 * Math.sin(t * 2.4); // pool of gold on the chest
          ctx.drawImage(glow('255,200,90'), gx - 40, gy - 40, 80, 80);
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // Mine HUD: depth, the day's challenge, and your streak — top-left, above the dark.
      const sv1 = saveRef.current;
      const ch = mineChallengeFor(sv1);
      ctx.save();
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'left';
      const line = (str: string, y: number, color: string) => {
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.strokeText(str, 4, y); ctx.fillStyle = color; ctx.fillText(str, 4, y);
      };
      line(`FLOOR ${mineFloorRef.current}`, 10, '#ffe9a0');
      line(ch.name, 19, ch.color);
      if (sv1.mineStreak > 1) line(`Streak ×${sv1.mineStreak}`, 28, '#9ad0c0');
      ctx.restore();

      // Treasure-vault banner — centered, gold, gently pulsing so it reads as special.
      if (mineVaultRef.current) {
        ctx.save();
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        const bx = VIEW_PW / 2, by = 12;
        const pulse = 0.8 + 0.2 * Math.sin(t * 3);
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.strokeText('✦ TREASURE VAULT ✦', bx, by);
        ctx.globalAlpha = pulse; ctx.fillStyle = '#ffd24a';
        ctx.fillText('✦ TREASURE VAULT ✦', bx, by);
        ctx.restore();
      }

      // Depth toast — a brief banner when you drop a floor.
      if (depthToastRef.current) {
        const dt2 = depthToastRef.current;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, dt2.t * 1.5));
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        const cy = Math.round(VIEW_PH * 0.32);
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.9)';
        ctx.strokeText(`FLOOR ${dt2.floor}`, VIEW_PW / 2, cy);
        ctx.fillStyle = '#ffe9a0'; ctx.fillText(`FLOOR ${dt2.floor}`, VIEW_PW / 2, cy);
        ctx.restore();
      }
    }

    // Derby HUD: on a derby day at the shore, a small always-on banner tracks the
    // live run — points so far + the next tier to chase (mine-challenge / vault-
    // banner style: cheap stroked text, no gradients, nothing allocated).
    if (scene.id === TOURNAMENT_SCENE && fishingTournamentDay(saveRef.current.day)) {
      const dPts = derbyDayRef.current === saveRef.current.day ? derbyScoreRef.current : 0;
      const nextTier = TOURNAMENT_TIERS.find(tr => dPts < tr.minScore);
      const dTxt = `🎣 DERBY · ${dPts} pts · ${nextTier ? `next: ${nextTier.name} at ${nextTier.minScore}` : 'top tier!'}`;
      ctx.save();
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'left';
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,0.9)';
      ctx.strokeText(dTxt, 4, 10);
      ctx.fillStyle = '#ffe9a0'; ctx.fillText(dTxt, 4, 10);
      ctx.restore();
    }

    // interact prompt
    if (!overlayRef.current && !fm) {
      const faced = facedTile(p, dirRef.current);
      const feet = feetTile(p);
      const npcT = wanderersRef.current.some(w => Math.round(w.x / TILE) === faced.x && Math.round(w.y / TILE) === faced.y)
        || scene.npcs.find(n => n.x === faced.x && n.y === faced.y && !WANDER_IDS.has(n.id)
          && !npcHiddenNow(saveRef.current, n.id));
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
      if (scene.id === 'city' && streetEventRef.current
        && faced.x === streetEventRef.current.x && faced.y === streetEventRef.current.y) {
        label = streetEventDoneToday(sv) ? 'Look' : 'Check it out';
      }
      // Kinryū patrons: facing a seated gambler offers a chat (they'll decline).
      if (scene.id === 'casino' && casinoGamblersFor(sv.day).some(g => g.x === faced.x && g.y === faced.y)) label = 'Talk';
      // Derby chalkboard: name the readable sign so it invites a look (2 tiles wide).
      {
        const onSign = (tt: Vec) => tt.y === DERBY_SIGN.y && (tt.x === DERBY_SIGN.x || tt.x === DERBY_SIGN.x + 1);
        if (scene.id === TOURNAMENT_SCENE && fishingTournamentDay(sv.day) && (onSign(faced) || onSign(feet))) label = 'Derby board';
      }
      // Festival stall game: name the prop so the tappable thing is obvious.
      {
        const festP = festivalFor(sv.day);
        const layP = festP && festP.scene === scene.id ? FESTIVAL_LAYOUT[scene.id] : null;
        if (festP && layP && ((faced.x === layP.prop.x && faced.y === layP.prop.y) || (feet.x === layP.prop.x && feet.y === layP.prop.y)))
          label = festP.minigame === 'goldfish' ? 'Goldfish scooping' : festP.minigame === 'wish' ? 'Hang a wish' : 'Draw a fortune';
      }
      if (it?.id === 'gh-supply') label = 'Supplies';
      if (it?.id === 'gh-shipbox') label = sv.greenhouse.shipped.length > 0 ? `Shipping (${sv.greenhouse.shipped.length})` : 'Shipping box';
      if (it?.id === 'gh-plot') {
        const gi = GREENHOUSE_PLOTS.findIndex(pl => pl.x === it!.x && pl.y === it!.y);
        const gp = sv.greenhouse.plots[gi];
        if (gi >= sv.greenhouse.beds) label = 'Untilled';
        else if (gp) label = !gp.crop ? 'Plant' : plotReady(gp) ? 'Harvest' : (sv.greenhouse.sprinkler || gp.wateredDay === sv.day) ? 'Check on it' : 'Water';
      }
      if (scene.id === 'mines' && !label) label = sv.gun ? 'Fire (hold)' : sv.wand ? 'Sparkle!' : undefined;
      if (!sv.canFish && (label === 'Fish' || label === 'Drop a line')) label = 'Fish? (ask Genji)';
      if (scene.id === 'deepsea' && !label) label = (feet.y >= 10 || faced.y >= 11) ? 'Sail south to go home' : 'Drop a line';
      // the freezer keeps its secret until you've been through once
      if (it?.id === 'portal' && !saveRef.current.storySeen.includes('backrooms-intro')) label = npcT ? 'Talk' : undefined;
      // the Paris seam looks like a blank wall until The Manager reveals it
      if (it?.id === 'paris-portal' && !saveRef.current.parisRevealed) label = npcT ? 'Talk' : undefined;
      if (scene.id === 'mines') {
        const d = mineDownRef.current;
        const vc = mineChestRef.current;
        const node = oreNodesRef.current.find(n => n.x === faced.x && n.y === faced.y);
        if (d && ((faced.x === d.x && faced.y === d.y) || (feet.x === d.x && feet.y === d.y))) label = 'Descend deeper';
        else if (vc && ((faced.x === vc.x && faced.y === vc.y) || (feet.x === vc.x && feet.y === vc.y))) label = mineChestOpenRef.current ? 'Looted vault' : 'Open the vault';
        else if (node) label = node.geode ? 'Crack geode' : `Mine ${node.mineral.name}`;
        else {
          const cr = crawlersRef.current.find(c => {
            const ct = feetTile({ x: c.x, y: c.y });
            return ct.x === faced.x && ct.y === faced.y;
          });
          if (cr) label = sv.gun ? 'Fire (hold)' : sv.wand ? 'Sparkle!' : 'Shoo...?';
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

    // Konbini shift minigame: "Register Rush" UI (full-screen over the konbini).
    const sg = shiftRef.current;
    if (sg) {
      ctx.save();
      ctx.fillStyle = 'rgba(8,10,14,0.93)'; ctx.fillRect(0, 0, VIEW_PW, VIEW_PH);
      ctx.textAlign = 'center';
      ctx.font = 'bold 10px monospace'; ctx.fillStyle = '#ffd24a';
      ctx.fillText('REGISTER RUSH', VIEW_PW / 2, 16);
      ctx.font = 'bold 6px monospace'; ctx.fillStyle = '#9fc4e8';
      ctx.fillText(`Customer ${Math.min(sg.idx + 1, SHIFT_CUSTOMERS)}/${SHIFT_CUSTOMERS}    combo x${sg.combo}    earned ¥${sg.earned.toLocaleString()}`, VIEW_PW / 2, 26);

      // per-customer timer bar
      const tw = VIEW_PW - 40, frac = Math.max(0, sg.timer / sg.maxTimer);
      ctx.fillStyle = '#2a3340'; ctx.fillRect(20, 32, tw, 4);
      ctx.fillStyle = frac > 0.4 ? '#7ce8a0' : frac > 0.2 ? '#ffb24a' : '#ff5a5a';
      ctx.fillRect(20, 32, Math.round(tw * frac), 4);

      // little customer at the counter
      ctx.fillStyle = '#caa6d8'; ctx.fillRect(VIEW_PW / 2 - 5, 50, 10, 8);   // body
      ctx.fillStyle = '#e8c4a0'; ctx.fillRect(VIEW_PW / 2 - 4, 44, 8, 7);    // head
      ctx.fillStyle = '#3a2b1a'; ctx.fillRect(VIEW_PW / 2 - 3, 46, 2, 1); ctx.fillRect(VIEW_PW / 2 + 1, 46, 2, 1); // eyes

      const cy = VIEW_PH / 2 + 4;
      if (sg.phase === 'scan') {
        ctx.font = 'bold 9px monospace'; ctx.fillStyle = '#e8e0d0';
        ctx.fillText('SCAN', VIEW_PW / 2, cy - 16);
        const n = sg.cust.items, bw = 16, gap = 6, totW = n * bw + (n - 1) * gap, x0 = (VIEW_PW - totW) / 2;
        for (let i = 0; i < n; i++) {
          const x = x0 + i * (bw + gap);
          ctx.fillStyle = i < sg.cust.scanned ? '#3a4450' : '#caa23a';
          ctx.fillRect(x, cy - 6, bw, 13);
          ctx.fillStyle = '#1d2430';
          for (let b = 0; b < 4; b++) ctx.fillRect(x + 3 + b * 3, cy - 4, 1, 9); // barcode stripes
        }
        ctx.font = 'bold 8px monospace'; ctx.fillStyle = '#ffd24a';
        ctx.fillText(`press [E]  ×${sg.cust.items - sg.cust.scanned}`, VIEW_PW / 2, cy + 24);
      } else if (sg.phase === 'bag') {
        ctx.font = 'bold 9px monospace'; ctx.fillStyle = '#e8e0d0';
        ctx.fillText('BAG IT', VIEW_PW / 2, cy - 10);
        ctx.font = 'bold 16px monospace'; ctx.fillStyle = '#7ce8a0';
        ctx.fillText('↓', VIEW_PW / 2, cy + 12);
        ctx.font = 'bold 7px monospace'; ctx.fillStyle = '#9fc4e8';
        ctx.fillText('press DOWN', VIEW_PW / 2, cy + 26);
      } else {
        ctx.font = 'bold 9px monospace'; ctx.fillStyle = '#e8e0d0';
        ctx.fillText('MAKE CHANGE', VIEW_PW / 2, cy - 16);
        const arr = sg.cust.change, gap = 18, x0 = VIEW_PW / 2 - ((arr.length - 1) * gap) / 2;
        ctx.font = 'bold 15px monospace';
        for (let i = 0; i < arr.length; i++) {
          ctx.fillStyle = i < sg.cust.changeIdx ? '#3a4450' : i === sg.cust.changeIdx ? '#ffd24a' : '#9fc4e8';
          ctx.fillText(ARROW_GLYPH[arr[i]], x0 + i * gap, cy + 4);
        }
        ctx.font = 'bold 7px monospace'; ctx.fillStyle = '#9fc4e8';
        ctx.fillText('press the arrows in order', VIEW_PW / 2, cy + 24);
      }

      if (sg.flash > 0) {
        ctx.globalAlpha = Math.min(1, sg.flash * 2.2);
        ctx.font = 'bold 13px monospace';
        ctx.fillStyle = sg.flashGood ? '#7ce8a0' : '#ff6a6a';
        ctx.fillText(sg.flashText, VIEW_PW / 2, VIEW_PH - 18);
        ctx.globalAlpha = 1;
      }
      ctx.font = 'bold 6px monospace'; ctx.globalAlpha = 0.5; ctx.fillStyle = '#e8e0d0';
      ctx.fillText('[E] scan · [↓] bag · arrows = change · Esc clocks out', VIEW_PW / 2, VIEW_PH - 6);
      ctx.restore();
    }

    // Club Kaiju karaoke — full-screen single-lane rhythm chart (drawn off karaokeRef).
    const kg = karaokeRef.current;
    if (kg) {
      ctx.save();
      ctx.textAlign = 'center';
      // moody club backdrop with a soft beat-synced glow
      const beatPhase = ((kg.t % KARAOKE_BEAT) / KARAOKE_BEAT); // 0..1 within the beat
      const pulse = Math.max(0, 1 - beatPhase * 2);             // bright on the beat, fades out
      ctx.fillStyle = 'rgba(14,8,22,0.94)'; ctx.fillRect(0, 0, VIEW_PW, VIEW_PH);
      ctx.globalAlpha = 0.12 + pulse * 0.16; ctx.fillStyle = '#ff3ba0';
      ctx.fillRect(0, 0, VIEW_PW, VIEW_PH); ctx.globalAlpha = 1;

      ctx.font = 'bold 10px monospace'; ctx.fillStyle = '#ffd24a';
      ctx.fillText('🎤 CLUB KAIJU KARAOKE', VIEW_PW / 2, 15);

      // DDR layout: four vertical lanes (← ↓ ↑ →), receptors near the top, notes
      // RISE from the bottom over KARAOKE_LEAD seconds. Chunky pixel arrows are
      // drawn with a rotated path (cheap — no gradients, no allocs).
      const LANE_W = 32;
      const RECEP_Y = 52;              // receptor row (hit line)
      const SPAWN_Y = VIEW_PH - 6;     // where a note first appears
      const span = SPAWN_Y - RECEP_Y;  // px a note travels over KARAOKE_LEAD seconds
      const laneX = (i: number) => VIEW_PW / 2 + (i - 1.5) * LANE_W;
      const LANE_OF: Record<KaraokeDir, number> = { left: 0, down: 1, up: 2, right: 3 };
      const LANE_COL: Record<KaraokeDir, string> = { left: '#ff8adb', down: '#7ce8e0', up: '#7ce8a0', right: '#ffd24a' };
      const ARROW_ANG: Record<KaraokeDir, number> = { left: Math.PI, down: Math.PI / 2, up: -Math.PI / 2, right: 0 };
      const drawArrow = (x: number, y: number, dir: KaraokeDir, size: number, fill: string, outline = false) => {
        ctx.save();
        ctx.translate(x, y); ctx.rotate(ARROW_ANG[dir]);
        ctx.beginPath();                             // chunky arrow pointing +x
        ctx.moveTo(size, 0);
        ctx.lineTo(0, -size * 0.9);
        ctx.lineTo(0, -size * 0.38); ctx.lineTo(-size * 0.9, -size * 0.38);
        ctx.lineTo(-size * 0.9, size * 0.38); ctx.lineTo(0, size * 0.38);
        ctx.lineTo(0, size * 0.9);
        ctx.closePath();
        if (outline) { ctx.strokeStyle = fill; ctx.lineWidth = 1.6; ctx.stroke(); }
        else { ctx.fillStyle = fill; ctx.fill(); }
        ctx.restore();
      };

      if (kg.done) {
        // ---- results card ----
        const ratio = kg.total ? kg.score / (kg.total * 100) : 0;
        ctx.font = 'bold 13px monospace'; ctx.fillStyle = '#7ce8a0';
        ctx.fillText(`+¥${kg.tips.toLocaleString()} in tips`, VIEW_PW / 2, 60);
        ctx.font = 'bold 7px monospace'; ctx.fillStyle = '#9fc4e8';
        ctx.fillText(`PERFECT ${kg.perfects}   GOOD ${kg.goods}   MISS ${kg.misses}`, VIEW_PW / 2, 82);
        ctx.fillStyle = '#e8c0ff';
        ctx.fillText(`max combo x${kg.maxCombo}   ·   accuracy ${Math.round(ratio * 100)}%`, VIEW_PW / 2, 96);
        ctx.font = 'bold 8px monospace'; ctx.fillStyle = '#ffd24a';
        ctx.fillText(ratio >= 0.92 ? 'SUPERSTAR!' : ratio >= 0.7 ? 'GREAT SET!' : ratio >= 0.45 ? 'NICE!' : ratio >= 0.2 ? 'KEEP PRACTICING' : 'OOF', VIEW_PW / 2, 120);
        ctx.font = 'bold 6px monospace'; ctx.globalAlpha = 0.6; ctx.fillStyle = '#e8e0d0';
        ctx.fillText('press [Space/Enter] to step off the stage', VIEW_PW / 2, VIEW_PH - 10);
        ctx.restore();
      } else {
      // count-in banner before the first note lands
      const firstT = kg.notes.length ? kg.notes[0].t : 0;
      if (kg.t < firstT - KARAOKE_LEAD + 0.05) {
        const beatsLeft = Math.max(1, Math.ceil((firstT - KARAOKE_LEAD - kg.t) / KARAOKE_BEAT));
        ctx.font = 'bold 7px monospace'; ctx.fillStyle = '#9fc4e8';
        ctx.fillText('get ready…', VIEW_PW / 2, 40);
        ctx.font = 'bold 22px monospace'; ctx.fillStyle = '#ffd24a';
        ctx.fillText(String(beatsLeft), VIEW_PW / 2, 58);
      }

      // score / combo readout
      ctx.font = 'bold 7px monospace'; ctx.fillStyle = '#9fc4e8';
      ctx.fillText(`score ${kg.score}    combo x${kg.combo}`, VIEW_PW / 2, 30);

      // lane channels
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 4; i++) ctx.fillRect(laneX(i) - LANE_W / 2 + 2, RECEP_Y - 14, LANE_W - 4, VIEW_PH - RECEP_Y);
      // receptor arrows (outlines that throb on the beat)
      for (const d3 of KARAOKE_DIRS) {
        ctx.globalAlpha = 0.55 + pulse * 0.45;
        drawArrow(laneX(LANE_OF[d3]), RECEP_Y, d3, 9 + pulse * 1.5, LANE_COL[d3], true);
      }
      ctx.globalAlpha = 1;

      // notes rise toward their receptor (only those currently on-screen)
      for (const n of kg.notes) {
        const dt2 = n.t - kg.t;                       // time until this note should be hit
        if (dt2 > KARAOKE_LEAD || dt2 < -0.5) continue; // not visible yet / already gone
        if (n.judged === 'perfect' || n.judged === 'good') continue; // hit notes vanish (a tiny pop is the feedback)
        const x = laneX(LANE_OF[n.dir]);
        const y = RECEP_Y + (dt2 / KARAOKE_LEAD) * span;
        if (n.judged === 'miss') ctx.globalAlpha = 0.35;
        drawArrow(x, y, n.dir, 8, n.judged === 'miss' ? '#ff5a5a' : LANE_COL[n.dir]);
        ctx.globalAlpha = 1;
      }

      // good/perfect/miss flash
      if (kg.flash > 0) {
        ctx.globalAlpha = Math.min(1, kg.flash * 2.4);
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = kg.flashKind === 'perfect' ? '#7cffd0' : kg.flashKind === 'good' ? '#ffd24a' : '#ff6a6a';
        ctx.fillText(kg.flashText, VIEW_PW / 2, RECEP_Y - 24);
        ctx.globalAlpha = 1;
      }

      ctx.font = 'bold 6px monospace'; ctx.globalAlpha = 0.55; ctx.fillStyle = '#e8e0d0';
      ctx.fillText('press the MATCHING arrow as it reaches the top · Esc to leave the stage', VIEW_PW / 2, VIEW_PH - 8);
      ctx.restore();
      }
    }

    // Kojima Motors delivery race — full-screen dirt rally, drawn in its own
    // world-space (camera follows the car). No per-frame gradients/array allocs:
    // the track is a stroked module-constant polyline; particles/skids are reused.
    const dg = driveRef.current;
    if (dg) {
      ctx.save();
      const cx = VIEW_PW / 2, cy = VIEW_PH / 2;
      const sx = (wx: number) => (wx - dg.camX) * DRIVE_CAM + cx;
      const sy = (wy: number) => (wy - dg.camY) * DRIVE_CAM + cy;
      const sp = Math.hypot(dg.vx, dg.vy);

      // grass field + deterministic tufts (coarse world grid, no allocation)
      ctx.fillStyle = '#4e7c42'; ctx.fillRect(0, 0, VIEW_PW, VIEW_PH);
      ctx.fillStyle = '#447038';
      const g0x = Math.floor((dg.camX - 340) / 44) * 44, g0y = Math.floor((dg.camY - 220) / 44) * 44;
      for (let wx = g0x; wx < dg.camX + 340; wx += 44) {
        for (let wy = g0y; wy < dg.camY + 220; wy += 44) {
          const j = ((wx * 13 + wy * 7) % 31);
          ctx.fillRect(Math.round(sx(wx + (j % 11))), Math.round(sy(wy + (j % 9))), 2, 2);
        }
      }

      // dirt track: a dark shoulder stroke under a lighter dirt stroke, then a faint rut.
      const track = dg.track, pts = track.points;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(sx(pts[0].x), sy(pts[0].y));
      for (let i = 1; i < pts.length; i++) ctx.lineTo(sx(pts[i].x), sy(pts[i].y));
      ctx.strokeStyle = '#6e4a2a'; ctx.lineWidth = (track.half + 6) * 2 * DRIVE_CAM; ctx.stroke();
      ctx.strokeStyle = '#a06a3a'; ctx.lineWidth = track.half * 2 * DRIVE_CAM; ctx.stroke();
      ctx.strokeStyle = '#8a5b30'; ctx.lineWidth = 3; ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;

      // skid-marks on the dirt (dark scuffs)
      ctx.fillStyle = '#3a2a1c';
      for (let i = 0; i < dg.skids.length; i++) {
        const k = dg.skids[i], px = sx(k.x), py = sy(k.y);
        if (px < -4 || px > VIEW_PW + 4 || py < -4 || py > VIEW_PH + 4) continue;
        ctx.fillRect(px - 1, py - 1, 2, 2);
      }

      // checkpoints + the delivery depot (last)
      const cps = track.checkpoints;
      for (let i = 0; i < cps.length; i++) {
        const p = pts[cps[i]];
        const px = sx(p.x), py = sy(p.y);
        const last = i === cps.length - 1;
        const passed = i < dg.cp, next = i === dg.cp;
        // the NEXT target telegraphs its capture radius: a ring breathes out to
        // the true trigger distance, so "how close is close enough" is visible.
        if (next && !dg.done) {
          const rp = (t * 0.9) % 1; // 0..1 expand+fade loop
          ctx.globalAlpha = 0.45 * (1 - rp);
          ctx.strokeStyle = last ? '#ffd24a' : '#ff8a8a';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, py, DRIVE_CP_RADIUS * DRIVE_CAM * (0.35 + 0.65 * rp), 0, Math.PI * 2);
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        if (last) {
          // delivery depot: a glowing pad + ✦
          ctx.globalAlpha = next ? 0.5 + Math.sin(t * 6) * 0.25 : 0.4;
          ctx.fillStyle = next ? '#ffd24a' : '#9a8a6a';
          ctx.beginPath(); ctx.arc(px, py, 16, 0, Math.PI * 2); ctx.fill();
          ctx.globalAlpha = 1;
          ctx.font = 'bold 16px monospace'; ctx.textAlign = 'center';
          ctx.fillStyle = next ? '#fff3c4' : '#c9b890'; ctx.fillText('✦', px, py + 6);
        } else {
          // checkpoint flag (pole + pennant); next one pulses
          const a = next ? 0.7 + Math.sin(t * 8) * 0.3 : passed ? 0.3 : 0.85;
          ctx.globalAlpha = a;
          ctx.fillStyle = '#e8e0d0'; ctx.fillRect(px - 1, py - 13, 2, 16);            // pole
          ctx.fillStyle = passed ? '#5a7a52' : next ? '#ff5a5a' : '#ffd24a';
          ctx.beginPath(); ctx.moveTo(px + 1, py - 13); ctx.lineTo(px + 11, py - 9); ctx.lineTo(px + 1, py - 5); ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      // tyre dust (fading tan puffs)
      for (let i = 0; i < dg.dust.length; i++) {
        const p = dg.dust[i], px = sx(p.x), py = sy(p.y);
        ctx.globalAlpha = Math.max(0, 0.5 * (1 - p.life / p.max));
        ctx.fillStyle = dg.onGrass ? '#6f9a5a' : '#caa06a';
        ctx.beginPath(); ctx.arc(px, py, p.r * DRIVE_CAM + 1, 0, Math.PI * 2); ctx.fill();
      }
      ctx.globalAlpha = 1;

      // the car — a small top-down kei truck that rotates with the heading
      ctx.save();
      ctx.translate(Math.round(sx(dg.x)), Math.round(sy(dg.y)));
      ctx.rotate(dg.angle);
      ctx.fillStyle = '#16181d'; ctx.fillRect(-12, -7, 24, 14);                       // tyres/shadow base
      ctx.fillStyle = '#c9a227'; ctx.fillRect(-11, -5, 22, 10);                       // body
      ctx.fillStyle = '#e8c84a'; ctx.fillRect(-11, -5, 22, 2);                        // top highlight
      ctx.fillStyle = '#9fc4e8'; ctx.fillRect(3, -4, 6, 8);                           // windshield (front = +x)
      ctx.fillStyle = '#7a5a16'; ctx.fillRect(-10, -5, 8, 10);                        // flatbed
      ctx.fillStyle = '#ffd24a'; ctx.fillRect(10, -4, 2, 2); ctx.fillRect(10, 2, 2, 2); // headlights
      ctx.fillStyle = '#222'; ctx.fillRect(-9, -7, 5, 2); ctx.fillRect(4, -7, 5, 2); ctx.fillRect(-9, 5, 5, 2); ctx.fillRect(4, 5, 5, 2); // wheels
      ctx.restore();

      // guidance chevron: orbits the car pointing at the next target — you always
      // know where to go, even mid-drift. Hides once the target is nearly on
      // screen (its pulsing capture ring takes over from there).
      if (!dg.done) {
        const tgt = pts[cps[Math.min(dg.cp, cps.length - 1)]];
        const dxT = tgt.x - dg.x, dyT = tgt.y - dg.y;
        const distT = Math.hypot(dxT, dyT);
        if (distT > 150) {
          const angT = Math.atan2(dyT, dxT);
          ctx.save();
          ctx.translate(sx(dg.x) + Math.cos(angT) * 30, sy(dg.y) + Math.sin(angT) * 30);
          ctx.rotate(angT);
          ctx.globalAlpha = 0.7 + Math.sin(t * 5) * 0.25;
          ctx.fillStyle = dg.cp === cps.length - 1 ? '#ffd24a' : '#ffb24a'; // gold = the depot leg
          ctx.beginPath(); ctx.moveTo(7, 0); ctx.lineTo(-4, -5); ctx.lineTo(-1, 0); ctx.lineTo(-4, 5); ctx.fill();
          ctx.restore();
          ctx.globalAlpha = 1;
        }
      }

      // finish confetti — world-space paper flecks fluttering over the depot
      for (let i = 0; i < dg.confetti.length; i++) {
        const p = dg.confetti[i];
        ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
        ctx.fillStyle = p.c!;
        ctx.fillRect(sx(p.x), sy(p.y), p.r, p.r);
      }
      ctx.globalAlpha = 1;

      // speed lines at the screen edges when flying
      if (sp > DRIVE_MAX_DIRT * 0.62) {
        ctx.globalAlpha = Math.min(0.5, (sp - DRIVE_MAX_DIRT * 0.62) / DRIVE_MAX_DIRT);
        ctx.strokeStyle = '#f4eede'; ctx.lineWidth = 1;
        for (let i = 0; i < 7; i++) {
          const ang = (i / 7) * Math.PI * 2 + t;
          const ox = Math.cos(ang), oy = Math.sin(ang);
          ctx.beginPath();
          ctx.moveTo(cx + ox * 120, cy + oy * 80);
          ctx.lineTo(cx + ox * 165, cy + oy * 110);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
      }

      // --- HUD ----------------------------------------------------------------
      const remain = Math.max(0, track.timeLimit - dg.elapsed);
      const frac = remain / track.timeLimit;
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(8,10,14,0.62)'; ctx.fillRect(4, 4, 132, 30);
      ctx.font = 'bold 13px monospace';
      // the clock's color ramps with the pressure (gold→amber→red); in the red
      // zone it breathes on a smooth sine — urgency without a hard blink.
      ctx.fillStyle = frac > 0.4 ? '#ffd24a' : frac > 0.18 ? '#ffb24a' : '#ff5a5a';
      if (frac <= 0.18) ctx.globalAlpha = 0.72 + 0.28 * Math.sin(t * 5);
      ctx.fillText(`${remain.toFixed(1)}s`, 9, 18);
      ctx.globalAlpha = 1;
      ctx.font = 'bold 7px monospace'; ctx.fillStyle = '#9fc4e8';
      ctx.fillText(`CHECKPOINT ${Math.min(dg.cp + 1, cps.length)}/${cps.length}`, 9, 29);
      if (dg.best > 0) { ctx.fillStyle = '#7ce8a0'; ctx.fillText(`BEST ${dg.best.toFixed(1)}s`, 86, 29); }

      // timer pressure bar
      ctx.fillStyle = '#2a3340'; ctx.fillRect(4, 36, 132, 3);
      ctx.fillStyle = frac > 0.4 ? '#7ce8a0' : frac > 0.18 ? '#ffb24a' : '#ff5a5a';
      ctx.fillRect(4, 36, Math.round(132 * frac), 3);

      // the day's course name — a small banner so the route is legible at a glance
      ctx.textAlign = 'center'; ctx.font = 'bold 8px monospace';
      const nameW = ctx.measureText(track.name).width;
      ctx.fillStyle = 'rgba(8,10,14,0.55)'; ctx.fillRect(cx - nameW / 2 - 6, 4, nameW + 12, 13);
      ctx.fillStyle = '#ffe9a8'; ctx.fillText(track.name, cx, 14);

      // minimap (bottom-right): track + checkpoints + car (framed to this course's extents)
      const mmW = 70, mmH = 50, mmX = VIEW_PW - mmW - 5, mmY = VIEW_PH - mmH - 5;
      const mscale = Math.min((mmW - 6) / (track.bx1 - track.bx0), (mmH - 6) / (track.by1 - track.by0));
      const mx = (wx: number) => mmX + 3 + (wx - track.bx0) * mscale;
      const my = (wy: number) => mmY + 3 + (wy - track.by0) * mscale;
      ctx.fillStyle = 'rgba(8,10,14,0.62)'; ctx.fillRect(mmX, mmY, mmW, mmH);
      ctx.strokeStyle = 'rgba(232,224,208,0.25)'; ctx.lineWidth = 1;
      ctx.strokeRect(mmX + 0.5, mmY + 0.5, mmW - 1, mmH - 1); // crisp frame so it reads as a map
      ctx.strokeStyle = '#a06a3a'; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(mx(pts[0].x), my(pts[0].y));
      for (let i = 1; i < pts.length; i++) ctx.lineTo(mx(pts[i].x), my(pts[i].y));
      ctx.stroke();
      for (let i = 0; i < cps.length; i++) {
        const p = pts[cps[i]];
        const nxt = i === dg.cp && !dg.done;
        ctx.fillStyle = i < dg.cp ? '#5a7a52' : nxt ? '#ff5a5a' : '#ffd24a';
        const r = nxt ? 2 + Math.sin(t * 4) * 0.8 : 1.5; // the live target breathes
        ctx.fillRect(mx(p.x) - r, my(p.y) - r, r * 2, r * 2);
      }
      // car dot + a nose tick so the minimap shows your heading too
      const cmx = mx(dg.x), cmy = my(dg.y);
      ctx.fillStyle = '#9fc4e8';
      ctx.fillRect(cmx - 1, cmy - 1, 3, 3);
      ctx.fillRect(cmx - 1 + Math.round(Math.cos(dg.angle) * 3), cmy - 1 + Math.round(Math.sin(dg.angle) * 3), 2, 2);

      // checkpoint splash: a quick centered "✓" beat as you take each gate
      if (dg.flash > 0 && !dg.done && dg.cp < cps.length) {
        ctx.globalAlpha = Math.min(1, dg.flash / 0.3);
        ctx.textAlign = 'center'; ctx.font = 'bold 10px monospace';
        ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(8,10,14,0.85)';
        const msg = `CHECKPOINT ${dg.cp}/${cps.length - 1} ✓`;
        ctx.strokeText(msg, cx, cy - 38);
        ctx.fillStyle = '#7ce8a0'; ctx.fillText(msg, cx, cy - 38);
        ctx.globalAlpha = 1;
      }

      // 3-2-1-GO: each digit pops in large and eases down; GO! flashes green over
      // the first beat of the run. (The clock + car are held in update meanwhile.)
      if (!dg.done && (dg.count > 0 || dg.elapsed < 0.7)) {
        const counting = dg.count > 0;
        const label = counting ? String(Math.ceil(dg.count)) : 'GO!';
        const k = counting ? dg.count % 1 : 1 - dg.elapsed / 0.7; // 1→0 through this tick
        ctx.textAlign = 'center';
        ctx.font = `bold ${Math.round(15 + 9 * k)}px monospace`;
        ctx.globalAlpha = counting ? 0.95 : 0.95 * k;
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(8,10,14,0.85)';
        ctx.strokeText(label, cx, cy - 22);
        ctx.fillStyle = counting ? '#ffd24a' : '#7ce8a0';
        ctx.fillText(label, cx, cy - 22);
        ctx.globalAlpha = 1;
      }

      // finish card: DELIVERED! + the payout breakdown dealing in row by row (a
      // little drumroll under the confetti before Kojima settles up in dialog).
      if (dg.done && dg.pay) {
        const pay = dg.pay;
        ctx.fillStyle = 'rgba(8,10,14,0.78)'; ctx.fillRect(cx - 78, cy - 46, 156, 92);
        ctx.strokeStyle = pay.onTime ? '#ffd24a' : '#8a93a3'; ctx.lineWidth = 1;
        ctx.strokeRect(cx - 77.5, cy - 45.5, 155, 91);
        ctx.textAlign = 'center'; ctx.font = 'bold 12px monospace';
        ctx.fillStyle = pay.onTime ? '#ffd24a' : '#ffb24a';
        ctx.fillText(pay.onTime ? 'DELIVERED!' : 'DELIVERED… LATE', cx, cy - 30);
        ctx.font = 'bold 7px monospace';
        if (dg.isBest) { ctx.fillStyle = '#7ce8a0'; ctx.fillText(`NEW BEST — ${dg.elapsed.toFixed(1)}s`, cx, cy - 20); }
        else { ctx.fillStyle = '#8a93a3'; ctx.fillText(`${dg.elapsed.toFixed(1)}s on the clock`, cx, cy - 20); }
        ctx.font = 'bold 8px monospace';
        const rows: [string, string][] = pay.onTime
          ? [['BASE', `¥${pay.base.toLocaleString()}`], ['TIME BONUS', `¥${pay.timeBonus.toLocaleString()}`],
             ['CLEAN BONUS', `¥${pay.cleanBonus.toLocaleString()}`], ['TOTAL', `¥${pay.total.toLocaleString()}`]]
          : [['LATE FEE', `¥${pay.total.toLocaleString()}`], ['TOTAL', `¥${pay.total.toLocaleString()}`]];
        for (let i = 0; i < rows.length; i++) {
          if (dg.doneT < 0.5 + i * 0.35) break;              // rows reveal in sequence
          const ry = cy - 8 + i * 11;
          ctx.fillStyle = i === rows.length - 1 ? '#ffe9a8' : '#c7d3e0';
          ctx.textAlign = 'left'; ctx.fillText(rows[i][0], cx - 68, ry);
          ctx.textAlign = 'right'; ctx.fillText(rows[i][1], cx + 68, ry);
        }
      }

      if (!dg.done) {
        ctx.font = 'bold 6px monospace'; ctx.globalAlpha = 0.55; ctx.fillStyle = '#e8e0d0';
        ctx.textAlign = 'center';
        ctx.fillText('↑ gas · ↓ brake · ←/→ steer · Esc bail', VIEW_PW / 2, VIEW_PH - 4);
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    }
  }, []);

  // ---- lifecycle --------------------------------------------------------------

  const begin = useCallback((fresh: boolean) => {
    const s = fresh ? newSave() : (loadSave() ?? newSave());
    if (fresh) { s.vibe = pendingVibeRef.current; s.name = pendingNameRef.current; } // apply the new-game pick
    saveRef.current = s;
    applyApartmentSize(s.roomUnlocked); // pick the one/two-room apartment before the scene is read
    applyHomeOnsen(s.homeOnsen);        // inject the private-onsen interactable if owned
    sceneRef.current = SCENES[s.scene] ?? SCENES.apartment;
    streetEventRef.current = sceneRef.current.id === 'city' ? streetEventFor(s) : null;
    wanderersRef.current = makeWanderers(sceneRef.current);
    posRef.current = { x: s.px, y: s.py };
    dirRef.current = s.dir;
    pendingBeatsRef.current = [];
    fishModeRef.current = null;
    karaokeRef.current = null;
    karaokeAudioRef.current?.pause();
    setOverlayBoth(null);
    if (!s.visited.includes(s.scene)) s.visited.push(s.scene);
    if (s.scene === 'mines') {
      mineFloorRef.current = 1; // a reload resumes at the top floor (layout reseeds)
      const layout = mineLayoutFor(s, 1);
      oreNodesRef.current = layout.ore;
      mineDownRef.current = layout.down;
      mineVaultRef.current = !!layout.vault;
      mineChestRef.current = layout.chest ?? null;
      mineChestOpenRef.current = !!layout.vault && s.vaultsLooted.includes(`${s.day}:1`);
      crawlersRef.current = layout.crawlers.map(c => ({
        x: c.x * TILE, y: c.y * TILE - 4, hp: CRAWLER_HP[c.kind], stepT: Math.random(), hurtT: 0, dir: 'down' as Dir, kind: c.kind,
      }));
    } else {
      crawlersRef.current = [];
    }
    computeSolids();
    checkStory(); // queues the day-one journal entry on a fresh save
    syncMessages(s); // seed the welcome texts / any already-earned threads
    checkRegular(); // a loaded/seeded save that already knows everyone fires the capstone
    persistSave(s);
    refreshHud();
    setScreen('playing');
    // Start music here — the New Game / Continue click is the user gesture
    // browsers require before audio can play.
    playMusicFor(s.scene);
  }, [computeSolids, checkStory, refreshHud, setOverlayBoth, playMusicFor, checkRegular]);

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
    pendingNameRef.current = sanitizeName(pcName);
    setVibePick(false);
    startGame(true);
  }, [pickedVibe, pcName, startGame]);

  const toggleMusic = useCallback(() => {
    setMusicMuted(prev => {
      const next = !prev;
      try { localStorage.setItem(MUSIC_MUTE_KEY, next ? '1' : '0'); } catch { /* private mode */ }
      tracksRef.current.forEach(a => { a.muted = next; });
      if (rainAudioRef.current) rainAudioRef.current.muted = next;
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
    rainAudioRef.current?.pause();
    rainOnRef.current = false;
    currentTrackRef.current = null;
    transTimers.current.forEach(id => window.clearTimeout(id));
    transTimers.current = [];
  }, []);

  // Title-screen theme. Autoplay is usually blocked until a user gesture, so
  // try immediately and also arm a one-shot listener for the first input.
  useEffect(() => {
    if (screen !== 'title') return;
    syncRain(false); // no rain on the title screen
    ambientStop();   // kill any surf/drip/rain bed left from a prior session
    engineStop();    // and no phantom motor droning behind the menu
    playMusicFor('title');
    const kick = () => playMusicFor('title');
    window.addEventListener('pointerdown', kick, { once: true });
    window.addEventListener('keydown', kick, { once: true });
    return () => {
      window.removeEventListener('pointerdown', kick);
      window.removeEventListener('keydown', kick);
    };
  }, [screen, playMusicFor, syncRain]);

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
        // Mine runtime refs (not persisted) — let the harness navigate the seeded
        // descend ladder / treasure-vault chest.
        mine: sceneRef.current.id === 'mines' ? {
          floor: mineFloorRef.current,
          down: mineDownRef.current,
          vault: mineVaultRef.current,
          chest: mineChestRef.current,
          chestOpen: mineChestOpenRef.current,
        } : null,
        // Live wanderer positions (tile-rounded) — lets the harness confirm townsfolk
        // keep moving (don't grind against a wall) without a screenshot.
        wanderers: wanderersRef.current.map(w => ({
          id: w.id, x: Math.round(w.x), y: Math.round(w.y),
          tx: Math.round(w.x / TILE), ty: Math.round(w.y / TILE),
          dir: w.dir, moving: w.moving, stuck: w.stuck,
        })),
        // Delivery race runtime (the minigame is canvas-drawn off driveRef, not in
        // the normal snapshot) — exposed so the playtest harness can drive + verify.
        drive: driveRef.current ? {
          active: true,
          track: driveRef.current.track.name,
          timeLimit: driveRef.current.track.timeLimit,
          elapsed: Math.round(driveRef.current.elapsed * 10) / 10,
          count: Math.max(0, Math.round(driveRef.current.count * 10) / 10), // 3-2-1-GO hold left
          cp: driveRef.current.cp,
          cpTotal: driveRef.current.track.checkpoints.length,
          x: Math.round(driveRef.current.x),
          y: Math.round(driveRef.current.y),
          angle: Math.round(driveRef.current.angle * 1000) / 1000,
          speed: Math.round(Math.hypot(driveRef.current.vx, driveRef.current.vy)),
          onGrass: driveRef.current.onGrass,
          grassT: Math.round(driveRef.current.grassT * 10) / 10,
          done: driveRef.current.done,
        } : { active: false, deliveryDay: saveRef.current.deliveryDay, deliveryBest: saveRef.current.deliveryBest },
        // Karaoke runtime (canvas-drawn off karaokeRef, not in the normal snapshot).
        karaoke: karaokeRef.current ? {
          active: true,
          t: Math.round(karaokeRef.current.t * 100) / 100,
          notes: karaokeRef.current.total,
          score: karaokeRef.current.score,
          combo: karaokeRef.current.combo,
          maxCombo: karaokeRef.current.maxCombo,
          perfects: karaokeRef.current.perfects,
          goods: karaokeRef.current.goods,
          misses: karaokeRef.current.misses,
          done: karaokeRef.current.done,
          tips: karaokeRef.current.tips,
        } : { active: false },
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
    // Signs are cached to sprites once rendered, so rebuild that cache the moment
    // the pixel font actually arrives (else early frames freeze the fallback face).
    document.fonts?.load("16px 'Naganoshi'").then(() => signSpriteRef.current.clear()).catch(() => {});
    const input = inputRef.current;
    window.addEventListener('keydown', input.onKeyDown);
    window.addEventListener('keyup', input.onKeyUp);
    const stop = startLoop(update, render);
    return () => {
      stop();
      engineStop(); // kill the driving motor oscillators on unmount
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

  // Every winning bet (any game) ticks the lifetime counter that eventually
  // parts the backroom curtain. Crossing the threshold gets a nudge so the
  // player knows something opened.
  const countCasinoWin = () => {
    const s = saveRef.current;
    s.casinoWins += 1;
    if (s.casinoWins === BACKROOM_WINS)
      showToast('🎴 The house notices', 'The host glances at the velvet curtain in the back. "The boss will see you now."');
  };

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
    if (payout > 0) { s.money += payout; sfxCasinoWin(); }
    else if (bj.result === 'lose') sfxCasinoLose();
    if (bj.result === 'win' || bj.result === 'blackjack') { award('high-roller'); countCasinoWin(); } // a push isn't a win
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };
  const dealBlackjack = () => {
    const s = saveRef.current;
    const bj = casinoRef.current.bj;
    if (bj.phase !== 'bet' || bj.bet <= 0 || s.money < bj.bet) return;
    s.money -= bj.bet; // no deal sfx — the win/coin sound is the only blackjack cue now
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
  // Settle the in-flight spin from slot.final. The reels' outcome is fixed the
  // moment you PULL, so this is shared by the reel-stop interval (with sfx) and
  // the mid-spin bail in startSlots (silent) — bailing out of the panel while
  // the reels turn must never eat a bet or a jackpot.
  const settleSlots = (silent = false) => {
    const slot = casinoRef.current.slot;
    if (slot.timer != null) { window.clearInterval(slot.timer); slot.timer = null; }
    if (slot.phase !== 'spin') return;
    slot.reels = [...slot.final];
    slot.stopped = [true, true, true];
    slot.phase = 'done';
    const s2 = saveRef.current;
    let win = slotPayout(slot.final, slot.bet);
    // Triple-7s ALSO drain the progressive pot (on top of the 50× line),
    // then the pot reseeds from today (jackpotDay = the reset marker).
    if (isTripleSeven(slot.final)) {
      win += jackpotFor(s2);
      s2.jackpotDay = s2.day;
      award('jackpot');
    }
    slot.win = win;
    if (win > 0) {
      s2.money += win;
      if (!silent) sfxCasinoWin();
      award('high-roller'); countCasinoWin();
      persistSave(s2); refreshHud();
    } else if (!silent) sfxCasinoLose();
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
      if (slot.stopped[2]) settleSlots();
    }, 80);
  };

  const setRoulBet = (bet: number) => {
    const roul = casinoRef.current.roul;
    if (roul.phase === 'spin') return;
    roul.bet = bet;
    setShopTick(v => v + 1);
  };
  const setRoulKind = (kind: RouletteBet) => {
    const roul = casinoRef.current.roul;
    if (roul.phase === 'spin') return;
    roul.kind = kind;
    setShopTick(v => v + 1);
  };
  const setRoulPick = (n: number) => {
    const roul = casinoRef.current.roul;
    if (roul.phase === 'spin') return;
    roul.pick = Math.max(0, Math.min(36, n));
    roul.kind = 'number';
    setShopTick(v => v + 1);
  };
  // Settle the in-flight wheel from roul.result — shared by the spin interval
  // (with sfx) and the mid-spin bail in startRoulette (silent), same deal as
  // settleSlots: the ball's pocket is fixed at SPIN, bailing can't eat the bet.
  const settleRoulette = (silent = false) => {
    const roul = casinoRef.current.roul;
    if (roul.timer != null) { window.clearInterval(roul.timer); roul.timer = null; }
    if (roul.phase !== 'spin') return;
    roul.display = roul.result;
    roul.phase = 'done';
    const win = roulettePayout(roul.kind, roul.pick, roul.result, roul.bet);
    roul.win = win;
    if (win > 0) {
      const s2 = saveRef.current;
      s2.money += win;
      if (!silent) sfxCasinoWin();
      award('high-roller'); countCasinoWin();
      persistSave(s2); refreshHud();
    } else if (!silent) sfxCasinoLose();
    setShopTick(v => v + 1);
  };
  const spinRoulette = () => {
    const s = saveRef.current;
    const roul = casinoRef.current.roul;
    if (roul.phase === 'spin' || roul.bet <= 0 || s.money < roul.bet) return;
    s.money -= roul.bet; sfxBuy();
    roul.phase = 'spin'; roul.win = 0;
    roul.result = Math.floor(Math.random() * 37); // 0..36
    persistSave(s); refreshHud();
    const start = performance.now();
    const SPIN_MS = 2200;
    if (roul.timer != null) window.clearInterval(roul.timer);
    roul.timer = window.setInterval(() => {
      const el = performance.now() - start;
      if (el >= SPIN_MS) {
        settleRoulette();
      } else {
        roul.display = Math.floor(Math.random() * 37); // flicker while it spins
        setShopTick(v => v + 1);
      }
    }, 70);
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
    // The kei is the earned endgame buy: Kojima only sells it once you own the
    // skiff AND have run at least one delivery for him (first-delivery achievement).
    if (vehicleId === 'car' && (!s.vehicles.includes('boat') || !s.gameAch.includes('first-delivery'))) {
      showDialog(
        ["Kojima eyes you. \"The kei's a serious machine. Get the skiff under you and run me a few deliveries first — then we'll talk.\""],
        'Kojima',
      );
      return;
    }
    s.money -= v.price;
    s.vehicles.push(vehicleId);
    if (vehicleId === 'car') s.carPos = { scene: 'badtown', x: 13, y: 8 };
    sfxBuy();
    // The bicycle is the cheap entry buy and has no achievement of its own; only
    // the kei and the skiff are milestones.
    if (vehicleId === 'car') award('wheels');
    else if (vehicleId === 'boat') award('captain');
    computeSolids();
    persistSave(s);
    refreshHud();
    setShopTick(v2 => v2 + 1);
    setOverlayBoth(null);
    showDialog(
      vehicleId === 'car'
        ? ['Kojima slides the keys across the counter. "Treat her right."', 'She is parked out front. Walk up, press E, and drive. Press E again anywhere outdoors to park.']
        : vehicleId === 'boat'
          ? ['"She is moored down at the shore," Kojima says. "Deep water, and if you trust the hull — there is an island out there."']
          : ['Kojima wheels out a well-loved mama-chari and pats the saddle. "Cheap, honest, no engine to baby. Basket\'s good for groceries."', '"She\'s yours. Beats waiting on the trains — go feel the city move."'],
      'Kojima',
    );
  };

  const towCar = () => {
    const s = saveRef.current;
    if (!s.vehicles.includes('car') || s.money < 500) return;
    s.money -= 500;
    s.carPos = { scene: 'badtown', x: 13, y: 8 };
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
    award('rare-one'); // first purchase from The Manager
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  const buyWand2 = () => {
    const s = saveRef.current;
    if (!s.wand || s.wand2 || s.money < WAND2_PRICE) return;
    s.money -= WAND2_PRICE;
    s.wand2 = true;
    sfxBuy();
    award('rare-one'); // first purchase from The Manager
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  // Pickaxes are bought strictly in order (each tier needs the previous).
  const buyPickaxe = (tier: number) => {
    const s = saveRef.current;
    const pick = PICKAXES[tier];
    if (!pick || tier !== s.pickaxe + 1 || s.money < pick.price) return;
    s.money -= pick.price;
    s.pickaxe = tier;
    sfxBuy();
    award('rare-one'); // first purchase from The Manager
    if (tier === 3) award('toolmaster');
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  const buyGun = () => {
    const s = saveRef.current;
    if (s.gun || s.deepestFloor < GUN_UNLOCK_FLOOR || s.money < GUN_PRICE) return;
    s.money -= GUN_PRICE;
    s.gun = true;
    sfxBuy();
    award('rare-one'); // first purchase from The Manager
    award('gunner');
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
  };

  const doCrackGeode = () => {
    const s = saveRef.current;
    const res = crackGeode(s);
    if (!res) return;
    award('geode-crack');
    sfxCatch();
    // Rare: a geode is hollow around an ancient coin — a museum curio.
    if (!s.collectibles.includes('arti-coin') && !s.museum.donated.includes('arti-coin') && Math.random() < 0.08) {
      s.collectibles.push('arti-coin');
      res.text = 'A COIN! (First Coin of the Realm)';
      res.color = '#ffe9a0';
    }
    setGeodePop(res);
    if (geodeTimerRef.current) window.clearTimeout(geodeTimerRef.current);
    geodeTimerRef.current = window.setTimeout(() => setGeodePop(null), 2600);
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
    computeSolids();
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
    // Completing The Manager's whole rare collection unlocks the Paris secret.
    // Fire the reveal immediately (don't make the player guess they must re-talk).
    if (s.monsterFed && allRaresOwned(s) && !s.parisRevealed) revealParis();
  };

  // The Manager lets you in on the Paris secret once you own every one of his
  // rares. Reusable so it can fire on the final craft OR a later re-talk.
  const revealParis = useCallback(() => {
    const s = saveRef.current;
    if (s.parisRevealed) return;
    s.parisRevealed = true;
    sfxCatch();
    persistSave(s); refreshHud();
    showDialog([
      'The Manager goes still. "You have taken everything I had to sell. Every piece. Hm. Hmmm."',
      '"Then I will tell you a secret, customer. That little tourist? Jean-Pierre? He did not come from your city at all."',
      '"There is a SEAM in the wall — the top of this room. It opens to Paris. Real Paris. France. That is where he slipped in from."',
      '"Go and see. Press yourself to the seam. It will... load." Its smile does something a smile should not do.',
    ], 'The Manager');
  }, [refreshHud, showDialog]);

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

  // Take the mic: close the DJ panel and launch the karaoke rhythm minigame. AUDIO
  // HANDOFF: we DON'T touch the tracks here — whatever Club Kaiju track is already
  // spinning (currentTrackRef) stays playing and becomes the backing. We only
  // re-assert playMusicFor('nightclub') so the club music is definitely audible (in
  // case it was ducked) — it's the same element, so there's no second song. The
  // minigame restores it again on finish/bail (see the update loop). The chart's
  // tempo is fixed (KARAOKE_BPM), independent of the mp3 — no beatmap needed.
  const startKaraoke = () => {
    setOverlayBoth(null);
    // Duck the club track to silence — "Midnight Neon" is the backing now. The
    // element is created lazily once and rewound per song; the update loop starts
    // it after the count-in and re-syncs kg.t from audio.currentTime.
    const cur = currentTrackRef.current ? tracksRef.current.get(currentTrackRef.current) : null;
    if (cur) fadeAudio(cur, 0);
    let ka = karaokeAudioRef.current;
    if (!ka) { ka = new Audio(KARAOKE_TRACK); karaokeAudioRef.current = ka; }
    ka.currentTime = 0; ka.volume = MUSIC_VOL; ka.muted = readMuted();
    const game = makeKaraokeGame();
    game.lastDir = inputRef.current.currentDir(); // ignore a direction already held on stage-up
    karaokeRef.current = game;
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

  // Genji's upgraded rod (tier 1). One-time purchase; bumps the save's fishRod.
  // Genji's rod price — 25% off once you're 3 ♥ friends with him.
  const rodPriceFor = (s: GameSave, price: number): number =>
    friendHearts(s, 'genji') >= 3 ? Math.round(price * 0.75 / 10) * 10 : price;
  const buyRod = () => {
    const s = saveRef.current;
    const next = rodInfo(s.fishRod + 1);
    const price = rodPriceFor(s, next.price);
    if (s.fishRod >= next.tier || s.money < price) return; // already top tier / broke
    s.money -= price;
    s.fishRod = next.tier;
    sfxBuy();
    persistSave(s);
    refreshHud();
    setShopTick(v => v + 1);
    setOverlayBoth(null);
    showDialog([
      'Genji weighs the rod once, then holds it out. "Carbon. Light as a wish, strong as a grudge."',
      '"I bought it to finally land that golden carp. Never had the nerve to swim where it lives. You might."',
      '(Upgraded rod equipped — the bigger, rarer fish bite for you far more often now.)',
    ], 'Genji');
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

  // Clock in: close the shop UI and start the "Register Rush" minigame. Pay,
  // shiftDay, etc. are settled when the shift finishes (see the update loop).
  const workShift = () => {
    const s = saveRef.current;
    const cost = energyCost(s, SHIFT_COST);
    if (s.shiftDay === s.day || s.energy < cost) return;
    s.energy -= cost;
    persistSave(s); refreshHud(); setShopTick(v => v + 1);
    setOverlayBoth(null);
    const sg = makeShiftGame();
    sg.lastDir = inputRef.current.currentDir(); // ignore a direction already held on clock-in
    shiftRef.current = sg;
  };

  // Take the dispatch clipboard at Kojima Motors → start the delivery race. The
  // daily gate (deliveryDay) is only consumed on an actual delivery, so bailing
  // out (Esc) is a free retry — cosy. Pay is settled at delivery in the update loop.
  const startDelivery = () => {
    const s = saveRef.current;
    if (deliveryDoneToday(s)) {
      showDialog([
        '"Already ran today\'s route — package is delivered, books are square." Kojima waves you off with an oily rag.',
        '"Come back in the morning. There\'s always another box that needs to be somewhere yesterday."',
      ], 'Kojima');
      return;
    }
    if (!driveIntroSeenRef.current) {
      driveIntroSeenRef.current = true;
      showDialog([
        'Kojima jerks a thumb at the kei truck out back. "Dirt route. Hit every checkpoint, drop the package at the depot. Clock\'s running the second you turn the key."',
        '"She slides on the loose stuff — use it. Off the track just bogs you down, won\'t hurt you. Faster and cleaner means a fatter envelope."',
        '(↑ accelerate · ↓ brake/reverse · ←/→ steer · Esc to bail. Reach the checkpoints in order, then the ✦ depot, before the clock.)',
      ], 'Kojima', [{ label: 'Take the keys →', onPick: beginDriveRun }]);
      return;
    }
    beginDriveRun();
  };
  const beginDriveRun = () => {
    setOverlayBoth(null);
    // The day picks the course (rota) — stable across reloads/retries within the day.
    const track = selectDriveTrack(saveRef.current.day);
    driveRef.current = makeDriveGame(saveRef.current.deliveryBest, track);
    blip([560], 0.07, 0.05); // "3" — the countdown's first tick (2/1/GO fire in update)
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
      // The enforcers part with an "invitation" to the house they run.
      pushMessage(s, {
        id: 'yakuza-casino',
        from: 'Unknown Number',
        avatar: '🎴',
        body: [
          'You paid like a gentleman. We remember gentlemen.',
          'Come spend it properly. The Kinryū Lounge, off Downtown — blackjack, slots, and the wheel.',
          'Ask for nothing. The house already knows your name.',
        ],
      });
      computeSolids();
      persistSave(s); refreshHud();
    }, 550, 1100);
  };

  // Hand over the odd-jobs errand item — only on confirm (never auto-taken).
  const deliverErrand = () => {
    const s = saveRef.current;
    if (errandDoneToday(s)) { setOverlayBoth(null); return; }
    const e = errandFor(s);
    const have = e.kind === 'peepis' ? s.peepis > 0
      : e.kind === 'soda' ? (s.sodas[e.want!] ?? 0) > 0
      : e.kind === 'fish' ? s.fishInv.length > 0
      : s.coconuts > 0;
    if (!have) { setOverlayBoth(null); return; }
    if (e.kind === 'peepis') s.peepis -= 1;
    else if (e.kind === 'soda') s.sodas[e.want!] -= 1;
    else if (e.kind === 'fish') s.fishInv.shift();
    else s.coconuts -= 1;
    s.money += e.reward;
    s.errandDay = s.day;
    sfxCoin(); persistSave(s); refreshHud();
    setOverlayBoth(null);
    showDialog([e.thanks, `(+¥${e.reward.toLocaleString()})`], e.giver);
  };

  // Hand Bingus the curio he's after — he donates it straight onto its display.
  const giveBingusFetch = () => {
    const s = saveRef.current;
    const f = bingusHeldFetch(s);
    if (!f) { setOverlayBoth(null); return; }
    if (f.kind === 'peepis') s.peepis -= 1;
    else if (f.kind === 'soda') { const k = Object.keys(s.sodas).find(k => (s.sodas[k] ?? 0) > 0); if (k) s.sodas[k] -= 1; }
    else if (f.kind === 'fish') s.fishInv.shift();
    else if (f.kind === 'coconut') s.coconuts -= 1;
    else { const k = Object.keys(s.minerals).find(k => (s.minerals[k] ?? 0) > 0); if (k) s.minerals[k] -= 1; }
    donateToMuseum(s, f.slot);
    sfxCatch();
    const done = museumComplete(s);
    if (done) { s.money += 10000; award('curator'); }
    persistSave(s); refreshHud();
    setOverlayBoth(null);
    showDialog([
      f.thanks,
      done
        ? 'And — that is the LAST one. The Kawamachi Museum is COMPLETE. Bingus presses a thick envelope into your hands. (+¥10,000)'
        : `(${s.museum.donated.length}/${MUSEUM_SLOTS.length} displays filled.)`,
    ], 'Bingus Doofelsmurt');
  };

  // ---- Daily street-event actions --------------------------------------------
  // Run the chosen street event's effect, mark it done for the day, and report
  // the outcome via the dialog box. One per day (save.streetEventDay). Never
  // touches or hints at locked content — these are self-contained vignettes.
  const finishStreet = (lines: string[], speaker?: string) => {
    const s = saveRef.current;
    s.streetEventDay = s.day;
    persistSave(s); refreshHud();
    setOverlayBoth(null);
    showDialog(lines, speaker);
  };
  const runStreetEvent = (id: string) => {
    const s = saveRef.current;
    if (streetEventDoneToday(s)) { setOverlayBoth(null); return; }
    switch (id) {
      case 'ramen-yatai': {
        if (s.money < 650) { setOverlayBoth(null); return; }
        s.money -= 650;
        s.energy = maxEnergy(s) + 30; // a hot bowl tops you PAST full — a cozy overfill that burns down through the day
        sfxCatch();
        finishStreet([
          'The chef ladles broth over fresh noodles, lays on egg, pork, and a fan of scallion, and slides the bowl across the little counter.',
          'You eat it standing up under the red lantern while the whole city goes by. It is, briefly, the warmest you have felt all week. (Energy filled — and then some.)',
        ], 'Yatai Chef');
        break;
      }
      case 'magician': {
        s.money += 150;
        sfxCoin();
        finishStreet([
          '"Pick a card — no, don\'t show me." You aren\'t holding a card. He produces one anyway; it is, somehow, the very one you were thinking of.',
          'He bows, reaches behind your ear, and plucks out a ¥100 coin. Then a ¥50. "For your kind patronage." (+¥150)',
        ], 'Street Magician');
        break;
      }
      case 'claw-machine': {
        if (s.money < 300) { setOverlayBoth(null); return; }
        s.money -= 300;
        const r = Math.random();
        let lines: string[];
        if (r < 0.18) {
          lines = ['The claw descends with theatrical confidence, closes on a plush rabbit... and lets it flop free at the last possible second.', '(No prize. The machine is, you are now certain, evil.)'];
        } else if (r < 0.50) {
          s.peepis += 1;
          lines = ['The claw snags a chilled can wedged among the toys and — astonishingly — delivers it to the chute. A Diet Doctor Peepis! (+1 can)'];
        } else if (r < 0.72) {
          s.sodas['conk'] = (s.sodas['conk'] ?? 0) + 1;
          lines = ['Clunk. A frosty Conk drops into the tray. You didn\'t know this machine sold Conk. Neither, by the look of it, did the machine. (+1 Conk)'];
        } else if (r < 0.90) {
          const w = 200 + Math.floor(Math.random() * 3) * 100;
          s.money += w; sfxCoin();
          lines = [`The prize is a little capsule. Inside: a neat fold of yen and a slip that just reads "nice". (+¥${w.toLocaleString()})`];
        } else {
          s.money += 1500; sfxCatch();
          lines = ['The claw seizes the GIANT plush at the very back — the one nobody ever wins — and the cabinet lights up screaming. A tiny crowd applauds.', 'The flustered attendant quietly buys it back off you to restock it. (+¥1,500!)'];
        }
        finishStreet(lines, 'Claw Machine');
        break;
      }
      case 'takoyaki': {
        if (s.money < 250) { setOverlayBoth(null); return; }
        s.money -= 250;
        s.energy = Math.min(maxEnergy(s), s.energy + 40);
        sfxCatch();
        finishStreet([
          'Eight golden takoyaki, blistered and steaming, drowned in sauce and dancing bonito flakes. "Careful — molten! Here, a ninth, on the house, for luck."',
          'You burn your mouth immediately and regret nothing whatsoever. (+40 energy)',
        ], 'Takoyaki Stall');
        break;
      }
      case 'fortune': {
        if (s.money < 300) { setOverlayBoth(null); return; }
        s.money -= 300;
        const f = FORTUNES[Math.floor(Math.random() * FORTUNES.length)];
        finishStreet([
          'The fortune teller turns three cards face up, studies them an uncomfortably long while, then looks straight through you.',
          f,
          'She gathers the cards before you can read them yourself. "That is three hundred yen. The future, alas, is not free."',
        ], 'Fortune Teller');
        break;
      }
      case 'lost-ferret': {
        s.money += 700;
        s.peepis += 1;
        sfxCatch();
        finishStreet([
          'The ferret leads you a merry dance — under a bench, around a planter, between your own legs — before flopping over, delighted, to be scooped up.',
          'Its owner comes pelting up, breathless. "MOCHI! You absolute menace —" She gathers the wriggling thing to her chest and sags with relief.',
          '"Thank you, truly. Here, take this, I insist." She presses some yen and a cold can into your hands before you can refuse. (+¥700, +1 Peepis)',
        ], 'Ferret Owner');
        break;
      }
      default: setOverlayBoth(null);
    }
  };

  // ---- Greenhouse actions (plot menu + supply counter) -----------------------
  const ghTick = () => { persistSave(saveRef.current); refreshHud(); setShopTick(v => v + 1); };
  const doPlantCrop = (cropId: string) => { if (plantCrop(saveRef.current, ghPlotRef.current, cropId)) { sfxBuy(); ghTick(); } };
  const doWaterPlot = () => { if (waterPlot(saveRef.current, ghPlotRef.current)) { sfxDrip(); ghTick(); } };
  const doFertilizePlot = () => { if (applyFertilizer(saveRef.current, ghPlotRef.current)) { sfxBuy(); ghTick(); } };
  // Pull up a planted crop (no refund) so a bed can be replanted.
  const doClearPlot = () => { if (clearPlot(saveRef.current, ghPlotRef.current)) { sfxCoin(); ghTick(); } };
  const doHarvestPlot = (keep = false) => {
    const s = saveRef.current;
    const res = harvestCrop(s, ghPlotRef.current, keep);
    if (!res) return;
    gainSkill('farm', 16);
    sfxCatch(); persistSave(s); refreshHud();
    if (res.capstone) award('greenthumb');
    if (res.quality === 0) award('mid'); // a plain, normal-quality crop — that's mid

    setOverlayBoth(null);
    const q = CROP_QUALITY[res.quality];
    const lines = keep
      ? [`You harvest a ${q}${CROPS[res.cropId].name} and tuck it away to cook with later.`]
      : [`You harvest a ${q}${CROPS[res.cropId].name} and lay it in the shipping box. (worth ¥${res.value.toLocaleString()})`];
    if (res.requestBonus > 0) lines.push(`That completes Granny's request! She presses a bonus into your hand. (+¥${res.requestBonus.toLocaleString()})`);
    if (res.capstone) lines.push('The Moonflower keeps glowing faintly in your arms. Granny gasps — then gives you a Bloom Lamp grown from its light.');
    showDialog(lines, 'Greenhouse');
  };
  const buyGhSeed = (cropId: string) => { if (buySeed(saveRef.current, cropId)) { sfxCoin(); ghTick(); } };
  const buyGhFertilizer = () => { if (buyFertilizer(saveRef.current)) { sfxCoin(); ghTick(); } };
  const buyGhSprinkler = () => { if (buySprinkler(saveRef.current)) { sfxBuy(); ghTick(); } };
  const buyGhBeds = () => { if (expandBeds(saveRef.current)) { sfxBuy(); ghTick(); } };
  const buyGhTier = () => { if (upgradeGreenhouse(saveRef.current)) { sfxBuy(); ghTick(); } };

  // Hand Granny Soto a fish (her greenhouse-key errand) — only on confirm.
  const giveGrannyFish = () => {
    const s = saveRef.current;
    if (s.greenhouseUnlocked || s.fishInv.length === 0) { setOverlayBoth(null); return; }
    s.fishInv.shift();
    s.greenhouseUnlocked = true;
    sfxCoin(); persistSave(s); refreshHud();
    setOverlayBoth(null);
    showDialog([
      'Oh! For me? You sweet, sweet thing.',
      'Then it is settled. The community greenhouse east of the apartments is yours to tend now — walk right in.',
      'Plant something. Keep it alive. Go make something grow.',
    ], 'Granny Sato');
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


  // ---- menu (inventory + achievements + cheats) ----------------------------------

  const [placingItem, setPlacingItem] = useState<string | null>(null);
  const [cheatInput, setCheatInput] = useState('');
  const [cheatMsg, setCheatMsg] = useState('');
  // "now you see me" reveals the known-codes list outside dev builds (session-only).
  const [codesRevealed, setCodesRevealed] = useState(false);

  // Save-code panel (phone Settings): the generated export string, the paste box,
  // and the last import complaint (cleared on success).
  const [exportCode, setExportCode] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [importMsg, setImportMsg] = useState<string | null>(null);

  // IMPORT SAVE (title → SAVE MANAGEMENT): validate + default-merge the pasted
  // code (importSaveCode), persist it, and refresh the title's save summary —
  // the player then enters through the normal CONTINUE path. Bad codes get a
  // friendly no and leave the current save untouched.
  const [importOk, setImportOk] = useState(false);
  const doImportSave = () => {
    const merged = importSaveCode(importCode);
    if (!merged) { setImportOk(false); setImportMsg("That code didn't take — make sure you pasted the WHOLE export string, then try again."); return; }
    persistSave(merged);
    setImportCode(''); setExportCode(null); setImportOpen(false);
    setImportOk(true); setImportMsg(`💾 Save loaded — Day ${merged.day}, ${merged.name}. Press CONTINUE to play.`);
    setSaveTick(t => t + 1);
  };

  // Save and bail back to the title screen mid-game.
  const quitToMenu = useCallback(() => {
    settleDerby(saveRef.current); // an open derby run settles into the save instead of vanishing with the refs
    persistSave(saveRef.current);
    setPlacingItem(null);
    setOverlayBoth(null);
    fishModeRef.current = null;
    karaokeRef.current = null;
    karaokeAudioRef.current?.pause();
    setSaveTick(t => t + 1); // refresh the title's save summary
    setScreen('title');      // the title effect handles swapping music
  }, [setOverlayBoth, settleDerby]);

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
        if (s.driving) { s.carPos = { scene: 'badtown', x: 13, y: 8 }; s.driving = false; }
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
      case 'come again another day':
        s.forceRain = true;
        setCheatMsg('Rain, rain — here to stay. Until tomorrow, anyway.');
        break;
      case 'im god':
        s.god = !s.god;
        setCheatMsg(s.god ? 'GOD MODE on. The crawlers can no longer touch you.' : 'God mode off. Mortal again.');
        break;
      case 'now you see me':
        setCodesRevealed(!codesRevealed);
        setCheatMsg(codesRevealed ? "…now you don't. The list slips back behind the curtain." : 'Abracadabra. The list steps out from behind the curtain.');
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
    if (s.homeOnsen) occ.add(`${HOME_ONSEN_TILE.x},${HOME_ONSEN_TILE.y}`); // fixed onsen tile is off-limits to furniture

    // Reserve the trophy-shelf cells so wall-mounted items can't overlap it.
    if (GACHA_FIGURES.some(n => (s.gacha[n] ?? 0) > 0))
      for (let dx = 0; dx < SHELF_SLOT.w; dx++) occ.add(`${SHELF_SLOT.x + dx},${SHELF_SLOT.y}`);
    return occ;
  };

  const placeableAt = (id: string, tx: number, ty: number): boolean => {
    const scene = sceneRef.current;
    if (scene.id !== 'apartment') return false;
    const s = saveRef.current;
    const sz = sceneSize(scene);            // bounds follow the grid (small vs expanded apartment)
    const maxX = sz.x - 2, maxY = sz.y - 2;
    const occ = apartmentOccupied(s, heldRef.current?.id ?? id);
    if (itemKind(id) === 'wall') {
      // wall mounts cling to the top wall row on a solid (non-window) tile
      if (ty !== 0 || tx < 1 || tx > maxX) return false;
      const t = tileAt(scene, tx, ty);
      return Boolean(t && t.solid) && !occ.has(`${tx},${ty}`);
    }
    const w = itemFootprintW(id);
    for (let dx = 0; dx < w; dx++) {
      const cx = tx + dx;
      if (cx < 1 || cx > maxX || ty < 1 || ty > maxY) return false;
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

  const setHeld = (h: { id: string; from: 'box' | 'placed'; rug?: boolean } | null) => {
    heldRef.current = h;
    if (!h) ghostRef.current = null;
    setArrangeTick(t => t + 1);
  };

  // Rugs are 2×2 floor decor: drawn under furniture, can sit anywhere on the
  // interior floor (they layer freely — no occupancy check, unlike furniture).
  const rugPlaceableAt = (tx: number, ty: number): boolean => {
    if (sceneRef.current.id !== 'apartment') return false;
    const sz = sceneSize(sceneRef.current);
    const maxX = sz.x - 2, maxY = sz.y - 2;
    for (let dx = 0; dx < RUG_W; dx++) for (let dy = 0; dy < RUG_H; dy++) {
      const cx = tx + dx, cy = ty + dy;
      if (cx < 1 || cx > maxX || cy < 1 || cy > maxY) return false;
      const t = tileAt(sceneRef.current, cx, cy);
      if (!t || t.solid) return false;
    }
    return true;
  };
  const commitRug = (tx: number, ty: number) => {
    const h = heldRef.current;
    if (!h?.rug) return;
    placeRug(saveRef.current, h.id, tx, ty);
    sfxBoop(); refreshHud();
    heldRef.current = null; ghostRef.current = null;
    setArrangeTick(t => t + 1);
  };
  const pickUpRug = (idx: number) => {
    const s = saveRef.current;
    const rug = s.rugs[idx];
    if (!rug) return;
    s.rugs.splice(idx, 1); persistSave(s);
    setHeld({ id: rug.id, from: 'placed', rug: true });
    blip([520, 392], 0.05);
  };
  // Decor shop / style panel (inside Arrange): apply an owned wall/floor, or buy.
  const doApplyDecor = (id: string) => { if (applyDecor(saveRef.current, id)) { sfxBoop(); setArrangeTick(t => t + 1); } };
  const doBuyDecor = (id: string) => {
    if (buyDecor(saveRef.current, id)) {
      sfxBuy();
      const d = decorById(id);
      if (d && (d.kind === 'wall' || d.kind === 'floor')) applyDecor(saveRef.current, id); // wear it immediately
      refreshHud(); setArrangeTick(t => t + 1);
    }
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
    sfxBoop();
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
    const tabEl = el.closest('[data-arrange-tab]');
    if (tabEl) { setArrangeTab(tabEl.getAttribute('data-arrange-tab') as typeof arrangeTab); setHeld(null); return; }
    const applyEl = el.closest('[data-apply-decor]');
    if (applyEl) { doApplyDecor(applyEl.getAttribute('data-apply-decor')!); return; }
    const buyEl = el.closest('[data-buy-decor]');
    if (buyEl) { doBuyDecor(buyEl.getAttribute('data-buy-decor')!); return; }
    const chip = el.closest('[data-zz-item]');
    if (chip) { setHeld({ id: chip.getAttribute('data-zz-item')!, from: 'box' }); return; }
    const rugChip = el.closest('[data-rug-item]');
    if (rugChip) { setHeld({ id: rugChip.getAttribute('data-rug-item')!, from: 'box', rug: true }); return; }
    if (el.closest('[data-zz-trash]')) { if (heldRef.current) boxHeld(); return; }
    if (isArrangeUI(el)) return; // a button handles its own click
    const tt = eventTile(e);
    if (!tt) return;
    if (heldRef.current) {
      const h = heldRef.current;
      if (h.rug) { if (rugPlaceableAt(tt.tx, tt.ty)) commitRug(tt.tx, tt.ty); }
      else if (placeableAt(h.id, tt.tx, tt.ty)) commitPlace(tt.tx, tt.ty);
      return;
    }
    const hit = findPlacedAt(tt.tx, tt.ty);
    if (hit) { pickUpPlaced(hit); ghostRef.current = { tx: tt.tx, ty: tt.ty, valid: placeableAt(hit, tt.tx, tt.ty) }; return; }
    const ri = rugAt(saveRef.current, tt.tx, tt.ty);
    if (ri >= 0) { pickUpRug(ri); ghostRef.current = { tx: tt.tx, ty: tt.ty, valid: rugPlaceableAt(tt.tx, tt.ty) }; }
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
    const valid = heldRef.current.rug ? rugPlaceableAt(tt.tx, tt.ty) : placeableAt(heldRef.current.id, tt.tx, tt.ty);
    ghostRef.current = { tx: tt.tx, ty: tt.ty, valid };
  };

  const arrangeUp = (e: React.PointerEvent) => {
    const moved = dragStartRef.current?.moved ?? false;
    dragStartRef.current = null;
    const el = e.target as HTMLElement;
    if (!heldRef.current) return;
    if (el.closest('[data-zz-trash]')) { boxHeld(); return; }
    if (!moved) return; // a tap: keep the item held for tap-to-place
    if (isArrangeUI(el) || el.closest('[data-zz-item]') || el.closest('[data-rug-item]')) { boxHeld(); return; } // dropped back on the tray
    const tt = eventTile(e);
    if (!tt) return;
    const h = heldRef.current;
    if (h.rug) { if (rugPlaceableAt(tt.tx, tt.ty)) commitRug(tt.tx, tt.ty); }
    else if (placeableAt(h.id, tt.tx, tt.ty)) commitPlace(tt.tx, tt.ty);
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
      // Threads are grouped by SENDER — opening one marks the whole conversation read.
      const m = s.messages.find(x => x.id === id);
      if (m) {
        let dirty = false;
        for (const x of s.messages) if (x.from === m.from && !x.read) { x.read = true; dirty = true; }
        if (dirty) { persistSave(s); refreshHud(); }
      }
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

        {/* Kitchen — cook once the fridge + microwave are both placed at home. */}
        <div className="mb-3">
          {canCookHere(s)
            ? <button
                className="w-full font-pixel text-base bg-[#e0843a] text-black px-3 py-2 rounded-lg shadow-[2px_2px_0_#000] hover:bg-[#f0a050] transition-colors flex items-center justify-center gap-2"
                onClick={() => setOverlayBoth({ type: 'cook' })}
              ><SpriteIcon atlas={atlasRef.current} sprite="i-cook" size={20} /> COOK — make a meal</button>
            : <p className="text-xs opacity-50 italic">Place a fridge AND a microwave to cook at home.</p>}
        </div>

        {/* Cooked dishes — eat for energy + a day buff. */}
        {Object.values(s.dishes).some(n => n > 0) && (<>
          <p className="text-sm text-[#ffd24a]/80 tracking-wide">KITCHEN — DISHES</p>
          {RECIPES.filter(r => (s.dishes[r.id] ?? 0) > 0).map(r => (
            <div key={r.id} className="flex items-center gap-2 py-1 border-b border-white/10">
              <SpriteIcon atlas={atlasRef.current} sprite={r.sprite} size={22} />
              <p className="flex-grow text-base">{r.name} ×{s.dishes[r.id]} <span className="opacity-50 text-sm">(+{r.energy} en{r.buff ? `, ${BUFFS[r.buff].emoji}` : ''})</span></p>
              <button className={`${btnCls} text-sm px-2 py-0.5`} disabled={s.energy >= maxEnergy(s) && !r.buff} onClick={() => doEat(r.id)}>EAT</button>
            </div>
          ))}
          <div className="h-3" />
        </>)}

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

        {/* Cooking ingredients on hand: pantry staples (konbini) + kept crops. */}
        {(Object.values(s.pantry).some(n => n > 0) || Object.values(s.produce).some(n => n > 0)) && (<>
          <p className="text-sm text-[#ffd24a]/80 tracking-wide mt-3">INGREDIENTS</p>
          {GROCERIES.filter(g => (s.pantry[g.id] ?? 0) > 0).map(g => (
            <div key={g.id} className="flex items-center gap-2 py-0.5">
              <SpriteIcon atlas={atlasRef.current} sprite={g.sprite} size={18} />
              <p className="text-base opacity-80">{g.name} ×{s.pantry[g.id]}</p>
            </div>
          ))}
          {Object.entries(s.produce).filter(([, n]) => n > 0).map(([id, n]) => (
            <p key={id} className="text-base py-0.5 opacity-80 pl-1">🌱 {CROPS[id]?.name ?? id} ×{n} <span className="opacity-50 text-sm">(for cooking)</span></p>
          ))}
        </>)}

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

        {/* Keepsakes — one-of-a-kind mementos from friendship capstones. Some can
            be eaten or pawned; the omamori just quietly brings luck while carried. */}
        {s.keepsakes.length > 0 && (<>
          <p className="text-sm text-[#ffd24a]/80 tracking-wide mt-3">KEEPSAKES ({s.keepsakes.length})</p>
          {s.keepsakes.map(id => {
            const k = keepsakeById(id);
            if (!k) return null;
            return (
              <div key={id} className="flex items-start gap-2 py-1.5 border-b border-white/10">
                {atlasRef.current?.[k.sprite]
                  ? <SpriteIcon atlas={atlasRef.current} sprite={k.sprite} size={24} />
                  : <span className="text-xl w-6 text-center shrink-0">🎁</span>}
                <div className="flex-grow min-w-0">
                  <p className="text-base leading-tight">{k.name}
                    {k.effect === 'luck' && <span className="opacity-50 text-sm"> (brings you luck)</span>}
                  </p>
                  <p className="text-xs opacity-60 leading-tight">{k.flavor}</p>
                </div>
                {k.effect === 'sell' && (
                  <button className={`${btnCls} text-sm px-2 py-0.5 shrink-0`} onClick={sellRing}>Sell · ¥{(k.value ?? 0).toLocaleString()}</button>
                )}
                {k.effect === 'food' && (
                  <button className={`${btnCls} text-sm px-2 py-0.5 shrink-0`} onClick={eatPlums}>Eat</button>
                )}
              </div>
            );
          })}
        </>)}
      </div>
    );

    const threadMsg = ov.thread ? s.messages.find(m => m.id === ov.thread) : undefined;
    // One conversation per SENDER: `ov.thread` stays a message id (toasts/back-nav
    // unchanged), but the view shows every message sharing that sender's `from`,
    // oldest → newest, each under its own Day chip.
    const thread = threadMsg ? s.messages.filter(m => m.from === threadMsg.from) : [];
    // The landlord is a contact you can actually REPLY to: his welcome thread
    // grows situational status bubbles + reply-chip actions (apartment expansion /
    // private onsen) at the bottom — moved here from the old city Lease-office
    // intercom panel, same gating and copy (payLandlord / buyHomeOnsenFromLandlord).
    const landlordTail = (() => {
      if (!thread.some(m => m.id === 'welcome-landlord')) return null; // reply chips ride the landlord CONVERSATION, wherever it's opened from
      const canExpand = s.backroomsUnlocked && !s.roomUnlocked;
      const canOnsen = !s.homeOnsen;
      const incoming: string[] = [];
      incoming.push('Funny old building, the Nakatomi. Damn near everyone you\'ve met lives stacked in it — Granny, the cat, the whole block under one roof. Easier that way. We look after our own.');
      if (!s.backroomsUnlocked) incoming.push('That unit next to yours is still occupied. Particular tenant — keeps strange hours, hums through the wall. Can\'t knock through till they clear out.');
      if (s.roomUnlocked) incoming.push('Knock-through\'s done already. Enjoy the second room. Try not to fill it with fish.');
      if (canExpand) incoming.push(`Good news: the unit next door finally cleared out. ¥${ROOM_PRICE.toLocaleString()} and I knock through the wall — a whole second room, yours to furnish however you like.`);
      if (s.homeOnsen) incoming.push('You\'ve got the private onsen in already. Soak whenever — that\'s what it\'s there for.');
      if (canOnsen) incoming.push(`Side offer: I can plumb a private hot spring into your unit. Hinoki tub, mineral water, the lot. ¥${HOME_ONSEN_PRICE.toLocaleString()}, one-time. Soak once a day — come up rested and warmed.`);
      const replyCls = 'self-end max-w-[88%] text-left rounded-2xl rounded-br-sm px-3 py-2 text-base leading-snug shadow active:translate-y-px transition-all disabled:opacity-40 disabled:pointer-events-none';
      return (
        <>
          {incoming.map((line, i) => (
            <div key={i} className="self-start max-w-[85%] bg-[#2b2f3a] text-[#e8e0d0] rounded-2xl rounded-tl-sm px-3 py-1.5 text-base leading-snug shadow">{line}</div>
          ))}
          {(canExpand || canOnsen) ? (
            <>
              <p className="self-center text-xs opacity-40 mt-1">— reply —</p>
              {canExpand && (
                <button disabled={s.money < ROOM_PRICE} onClick={payLandlord} className={`${replyCls} bg-[#2e6f47] text-[#eafff0]`}>
                  Knock through into the next unit
                  <span className="block text-sm opacity-80">{s.money < ROOM_PRICE ? `Need ¥${ROOM_PRICE.toLocaleString()}` : `Send ¥${ROOM_PRICE.toLocaleString()} — a whole second room`}</span>
                </button>
              )}
              {canOnsen && (
                <button disabled={s.money < HOME_ONSEN_PRICE} onClick={buyHomeOnsenFromLandlord} className={`${replyCls} bg-[#2e6f47] text-[#eafff0]`}>
                  Add a private onsen
                  <span className="block text-sm opacity-80">{s.money < HOME_ONSEN_PRICE ? `Need ¥${HOME_ONSEN_PRICE.toLocaleString()}` : `Send ¥${HOME_ONSEN_PRICE.toLocaleString()} — soak at home daily`}</span>
                </button>
              )}
            </>
          ) : (
            <p className="self-center text-xs opacity-40 mt-1">— delivered —</p>
          )}
        </>
      );
    })();
    const messagesApp = threadMsg ? (
      // one conversation: chat bubbles
      <div className="px-3 py-3 flex flex-col gap-2">
        <div className="flex items-center gap-2 pb-2 border-b border-white/10">
          <span className="text-2xl">{threadMsg.avatar}</span>
          <div className="leading-tight">
            <p className="text-base">{threadMsg.from}</p>
            <p className="text-xs opacity-50">{threadMsg.company ? 'Business account' : 'Contact'}{thread.length > 1 ? ` · ${thread.length} messages` : ` · Day ${threadMsg.day}`}</p>
          </div>
        </div>
        {thread.map(m => (
          <Fragment key={m.id}>
            {thread.length > 1 && <p className="self-center text-xs opacity-40 mt-1">Day {m.day}</p>}
            {m.body.map((line, i) => (
              <div key={i} className="self-start max-w-[85%] bg-[#2b2f3a] text-[#e8e0d0] rounded-2xl rounded-tl-sm px-3 py-1.5 text-base leading-snug shadow">
                {line}
              </div>
            ))}
          </Fragment>
        ))}
        {landlordTail ?? <p className="self-center text-xs opacity-40 mt-1">— delivered —</p>}
      </div>
    ) : (
      // thread list, newest first
      <div className="py-1">
        {s.messages.length === 0 && <p className="px-3 py-6 text-center text-base opacity-50">No messages yet.<br/>Get out there and meet the city.</p>}
        {unread > 0 && (
          <div className="flex justify-end px-3 pb-1">
            <button
              className="font-pixel text-xs px-2.5 py-1 rounded-full border border-[#3da26b]/60 text-[#7ce8a0] hover:bg-[#3da26b] hover:text-black transition-colors"
              onClick={() => { const sv = saveRef.current; for (const m of sv.messages) m.read = true; persistSave(sv); refreshHud(); setShopTick(v => v + 1); }}
            >Clear all ({unread})</button>
          </div>
        )}
        {(() => {
          // One row per SENDER (newest message previews the conversation), sorted
          // by most recent activity — the inbox reads like a real messaging app.
          const seen = new Set<string>();
          const rows = [...s.messages].reverse().filter(m => seen.has(m.from) ? false : (seen.add(m.from), true));
          return rows.map(m => {
            const anyUnread = s.messages.some(x => x.from === m.from && !x.read);
            const count = s.messages.filter(x => x.from === m.from).length;
            return (
              <button
                key={m.from}
                onClick={() => openThread(m.id)}
                className="w-full flex items-center gap-3 px-3 py-2 text-left border-b border-white/10 hover:bg-white/5 transition-colors"
              >
                <span className="text-2xl shrink-0">{m.avatar}</span>
                <span className="flex-grow min-w-0">
                  <span className="flex items-center gap-2">
                    <span className={`text-base truncate ${anyUnread ? 'text-[#ffd24a]' : ''}`}>{m.from}{count > 1 && <span className="opacity-50 text-sm"> ({count})</span>}</span>
                    <span className="ml-auto text-xs opacity-40 shrink-0">Day {m.day}</span>
                  </span>
                  <span className={`block text-sm truncate ${anyUnread ? 'opacity-80' : 'opacity-50'}`}>{m.body[0]}</span>
                </span>
                {anyUnread && <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-[#3da26b]" />}
              </button>
            );
          });
        })()}
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
        {/* Save codes live on the TITLE screen (Settings → MANAGE SAVE), next to
            the rest of save management — not in the in-game phone. */}
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
        {(isDev || codesRevealed) && (
          <div className="mt-3 border-t border-[#ffd24a]/20 pt-2">
            <p className="text-xs text-[#ffd24a]/70 mb-1">{isDev ? 'DEV — known codes' : 'Known codes'}</p>
            {[
              ['motherlode', '+¥50,000'],
              ['redbull', 'Refill energy'],
              ['rocks', '+10 of every mineral'],
              ['gimmegimme', 'Unlock all base furniture'],
              ['country roads', 'Teleport home'],
              ['sunrise', 'Time → 7:00 AM'],
              ['nightfall', 'Time → 10:00 PM'],
              ['midnight', 'Time → 1:30 AM'],
              ['come again another day', 'Force rain today'],
              ['im god', 'Toggle: no crawler damage in mines'],
              ['now you see me', 'Toggle this list'],
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

    // Journal: a "what do I do?" board. Goals are DERIVED from the live save so a
    // lost player can always check next steps. Keep the list small + extensible —
    // add a push() as new systems land.
    const journalApp = (() => {
      const coreFurniture = FURNITURE.filter(f => !f.optional);
      const placedBase = coreFurniture.filter(f => Boolean(s.placed[f.id])).length;
      const fishCount = Object.values(s.fishLog).reduce((a, b) => a + b, 0);
      const museumDone = s.museum.donated.length, museumTotal = MUSEUM_SLOTS.length;
      // GOALS: concrete, trackable progress only (with a count/checkbox). No spelling
      // out *how* — that's discovery. Hand-holdy "go talk to X" lines were cut. There's
      // no ending: the real pull is everything still hidden out there, so the discovery
      // threads lead and "making the apartment a home" sits at the bottom as a cosy
      // optional, not THE objective.
      const goals: { text: string; done: boolean }[] = [];
      if (museumDone > 0 || s.backroomsUnlocked || fishCount > 8) goals.push({ text: `Fill the Kawamachi Museum — ${museumDone}/${museumTotal} displays`, done: museumDone >= museumTotal });
      if (s.canFish && !s.fishLog['golden']) goals.push({ text: 'Land the legendary Golden Carp', done: false });
      if (s.greenhouseUnlocked) goals.push({ text: 'Tend the greenhouse — plant, water, harvest', done: s.skills.farm > 0 }); // farm XP only comes from harvesting
      if (s.backroomsUnlocked && s.deepestFloor < 10) goals.push({ text: `Plumb the mines — deepest floor reached: ${s.deepestFloor}`, done: false });
      goals.push({ text: `Make the apartment a home — ${placedBase}/${coreFurniture.length} furnished`, done: placedBase >= coreFurniture.length });
      // LEADS: vaguer nudges. Cryptic on purpose — point a lost player roughly the
      // right way without handing them the answer.
      const leads: string[] = [];
      // (The forage + learn-to-fish nudges were cut — MISSIONS steps 1-2 cover both.)
      if (s.canFish && s.fishRod < 1) leads.push('Genji keeps something better than a starter rod behind his stall.');
      if (s.canFish && !s.greenhouseUnlocked) leads.push('Granny Soto keeps asking after a fresh fish.');
      if (!s.gangPaid) leads.push('The east alley out of the city is "spoken for." Coin might persuade them.');
      if (s.gangPaid && !s.backroomsUnlocked) leads.push('The big fella holding up the bar at Club Kaiju looks thirsty for something ice-cold, diet, and hard to find.');
      if (s.backroomsUnlocked && allRaresOwned(s) && !s.parisRevealed) leads.push('The Manager has the air of someone holding one last secret.');
      if (s.parisRevealed && !s.storySeen.includes('paris-intro')) leads.push('A seam waits at the very top of the yellow place. Press into it.');
      if (museumDone > 0 && museumDone < museumTotal) leads.push('Bingus the curator is always asking for one odd thing or another — and some curios turn up fishing, mining, or in far-flung corners.');
      // RUMORS: still capped at TWO — one cryptic achievement whisper + one line
      // of NPC gossip (attributed street flavor), both day-seeded so the pair
      // ROTATES each morning. All achievements earned → two gossips instead.
      const locked = GAME_ACHIEVEMENTS.filter(a => !s.gameAch.includes(a.id));
      const rumorOff = s.day % Math.max(1, locked.length);
      const gossipOff = s.day % GOSSIP.length;
      const rumors: { key: string; text: string; who?: string }[] = [];
      if (locked.length > 0) rumors.push({ key: locked[rumorOff].id, text: locked[rumorOff].hint });
      rumors.push({ key: 'g0', text: GOSSIP[gossipOff].text, who: GOSSIP[gossipOff].who });
      if (locked.length === 0) rumors.push({ key: 'g1', text: GOSSIP[(gossipOff + 1) % GOSSIP.length].text, who: GOSSIP[(gossipOff + 1) % GOSSIP.length].who });
      const todayEvent = dayEventFor(s);
      const festToday = festivalFor(s.day);
      const derbyToday = fishingTournamentDay(s.day);
      // MISSIONS: the hand-authored starter chain (data.ts). Done steps show
      // checked, the FIRST unfinished step is the live one (highlighted, with its
      // blurb + hint), and everything past it stays a locked '???' — no spoilers.
      const missionIdx = MISSIONS.findIndex(m => !s.missionsDone.includes(m.id));
      return (
        <div className="px-3 py-2">
          <p className="text-xs opacity-50 mb-2 leading-snug italic">No finish line — just a big city keeping its secrets. Wander, talk to strangers, and see what you turn up.</p>
          <p className="text-sm text-[#ffd24a]/80 tracking-wide mb-1">MISSIONS</p>
          {missionIdx < 0 && <p className="text-xs opacity-50 mb-1 italic">All done — the city is yours now.</p>}
          {MISSIONS.map((m, i) => {
            const done = s.missionsDone.includes(m.id);
            const current = i === missionIdx;
            if (!done && !current) return ( // future steps stay a mystery
              <div key={m.id} className="flex items-start gap-2 py-1 border-b border-white/10 opacity-40">
                <span className="shrink-0">🔒</span>
                <p className="text-base leading-tight tracking-widest">???</p>
              </div>
            );
            return (
              <div key={m.id} className={`py-1 border-b border-white/10 ${current ? 'bg-[#ffd24a]/10 rounded-md px-1 -mx-1' : ''}`}>
                <div className="flex items-start gap-2">
                  <span className="shrink-0">{done ? '✅' : '▢'}</span>
                  <p className={`flex-grow text-base leading-tight ${done ? 'opacity-50 line-through' : ''}`}>{m.title}</p>
                  <span className={`shrink-0 text-sm ${done ? 'opacity-40' : 'text-[#ffd24a]'}`}>¥{m.reward.toLocaleString()}</span>
                </div>
                {current && <p className="text-sm opacity-80 leading-tight mt-0.5 pl-6">{m.blurb}</p>}
                {current && <p className="text-xs text-[#ffd24a]/70 leading-tight mt-0.5 pl-6 italic">hint: {m.hint}</p>}
              </div>
            );
          })}
          <div className="h-3" />
          {festToday && (
            <div className="flex items-start gap-2 rounded-md px-2 py-1.5 mb-2 bg-[#e86a3a]/15 text-[#ffcfa0]">
              <span className="shrink-0 font-bold">🏮 {festToday.name}</span>
              <span className="text-sm leading-tight opacity-90">— TODAY in {SCENES[festToday.scene]?.name ?? festToday.scene}</span>
            </div>
          )}
          {derbyToday && (
            <div className="flex items-start gap-2 rounded-md px-2 py-1.5 mb-2 bg-[#9fc4e8]/15 text-[#c8e0f4]">
              <span className="shrink-0 font-bold">🎣 {TOURNAMENT_NAME}</span>
              <span className="text-sm leading-tight opacity-90">— TODAY at the shore</span>
            </div>
          )}
          {todayEvent && (
            <div className={`flex items-start gap-2 rounded-md px-2 py-1.5 mb-2 ${todayEvent === 'lucky' ? 'bg-[#ffd24a]/15 text-[#ffe9a0]' : 'bg-[#e857a8]/15 text-[#f6b4dc]'}`}>
              <span className="shrink-0 font-bold">{DAY_EVENT_LABEL[todayEvent]}</span>
              <span className="text-sm leading-tight opacity-90">{todayEvent === 'lucky'
                ? 'extra finds wash up on the shore and the mine veins run rich today.'
                : 'the pawn shop and the street dealer are stocked deep and cheap today.'}</span>
            </div>
          )}
          <p className="text-sm text-[#ffd24a]/80 tracking-wide mb-1">CURRENT GOALS</p>
          {goals.length === 0
            ? <p className="py-1 text-base opacity-50">Nothing pressing. Enjoy the city.</p>
            : goals.map((g, i) => (
                <div key={i} className="flex items-start gap-2 py-1 border-b border-white/10">
                  <span className="shrink-0">{g.done ? '✅' : '▢'}</span>
                  <p className={`text-base leading-tight ${g.done ? 'opacity-50 line-through' : ''}`}>{g.text}</p>
                </div>
              ))}
          {leads.length > 0 && <>
            <p className="text-sm text-[#ffd24a]/80 tracking-wide mt-3 mb-1">LEADS</p>
            {leads.map((l, i) => (
              <p key={i} className="text-sm py-1 border-b border-white/10 opacity-75 leading-tight">→ {l}</p>
            ))}
          </>}
          {rumors.length > 0 && <>
            <p className="text-sm text-[#ffd24a]/80 tracking-wide mt-3 mb-1">RUMORS</p>
            {rumors.map(r => (
              <p key={r.key} className="text-sm py-1 border-b border-white/10 opacity-60 leading-tight italic">“{r.text}”{r.who && <span className="not-italic opacity-80"> — {r.who}</span>}</p>
            ))}
          </>}
          <p className="text-xs opacity-40 mt-3 italic">Day {s.day} · ¥{s.money.toLocaleString()} · {fishCount} fish caught</p>
        </div>
      );
    })();

    // Friends: the cast you can befriend. Tap one to give a gift; hearts unlock perks.
    // Only people you've actually met — the app shouldn't spoil the cast you
    // haven't run into yet (their names, blurbs, or that they exist at all).
    const metFriends = FRIENDS.filter(f => metFriend(s, f.id));
    const friendsApp = (
      <div className="px-3 py-2">
        <p className="text-sm text-[#ffd24a]/80 tracking-wide mb-1">FRIENDS</p>
        <p className="text-xs opacity-50 mb-2 leading-snug">Walk up to someone and choose GIVE A GIFT (one each per day) to grow closer. Hearts unlock perks. (Loves/likes reveal at 2 ♥.)</p>
        {metFriends.length === 0 && (
          <p className="py-3 text-base opacity-50 leading-snug">You haven't met anyone worth noting yet. Get out there and talk to people.</p>
        )}
        {metFriends.map(f => {
          const hearts = friendHearts(s, f.id);
          const met = metFriend(s, f.id);
          const gifted = !canGiftToday(s, f.id);
          return (
            <div key={f.id} className="w-full flex items-center gap-3 py-2 border-b border-white/10">
              <span className="text-2xl shrink-0">{f.emoji}</span>
              <div className="flex-grow min-w-0">
                <p className="text-base leading-tight">{f.name}</p>
                <p className="text-xs opacity-55 leading-tight truncate">{f.blurb}</p>
                <p className="text-sm leading-tight tracking-tight">{'❤️'.repeat(hearts)}<span className="opacity-25">{'·'.repeat(MAX_HEARTS - hearts)}</span></p>
              </div>
              {met && gifted && <span className="shrink-0 text-xs px-2 py-1 rounded opacity-40 bg-white/5">gifted today ✓</span>}
            </div>
          );
        })}
      </div>
    );

    // Jukebox: pick the apartment's background track from places you've been.
    const musicApp = (() => {
      const tracks = DJ_SETLIST.filter(t => t.scene !== 'apartment' && s.visited.includes(t.scene));
      const Row = ({ id, label }: { id: string | null; label: string }) => {
        const active = s.homeTrack === id;
        return (
          <button
            onClick={() => setJukebox(id)}
            className={`w-full flex items-center gap-3 py-2 border-b border-white/10 text-left transition ${active ? 'bg-[#ffd24a]/10' : 'hover:bg-white/5'}`}
          >
            <span className="text-xl shrink-0">{active ? '▶️' : '🎵'}</span>
            <span className="flex-grow text-base leading-tight">{label}</span>
            {active && <span className="shrink-0 text-xs px-2 py-0.5 rounded bg-[#ffd24a]/20 text-[#ffd24a]">PLAYING</span>}
          </button>
        );
      };
      return (
        <div className="px-3 py-2">
          <p className="text-sm text-[#ffd24a]/80 tracking-wide mb-1">JUKEBOX</p>
          <p className="text-xs opacity-50 mb-2 leading-snug">Set the track that plays in your apartment. More unlock as you see the city.</p>
          <Row id={null} label="Home theme (default)" />
          {tracks.map(t => <Row key={t.scene} id={t.scene} label={t.label} />)}
        </div>
      );
    })();

    // Skills: fishing / mining / farming levels with a progress bar + the live perk.
    const skillsApp = (() => {
      // Each skill only appears once you've discovered its activity — don't reveal
      // mining/minerals or the greenhouse before the player has found them. XP > 0 also
      // reveals it (defensive, for grandfathered saves).
      const allRows: { k: SkillId; icon: string; name: string; unlocked: boolean; perk: (lv: number) => string }[] = [
        { k: 'fish', icon: '🎣', name: 'Fishing', unlocked: s.canFish, perk: lv => lv > 0 ? `rarer & bigger fish bite (+${lv * 12}%)` : 'level up to draw the rare fish' },
        { k: 'mine', icon: '⛏️', name: 'Mining', unlocked: s.backroomsUnlocked, perk: lv => lv > 0 ? `richer veins (+${(lv * 2.5).toFixed(0)}% ore)` : 'level up for richer ore' },
        { k: 'farm', icon: '🌱', name: 'Farming', unlocked: s.greenhouseUnlocked, perk: lv => lv >= 8 ? '+2 crop quality' : lv >= 4 ? '+1 crop quality' : 'better crops from Lv.4' },
      ];
      const rows = allRows.filter(sk => sk.unlocked || s.skills[sk.k] > 0);
      return (
        <div className="px-3 py-2">
          <p className="text-sm text-[#ffd24a]/80 tracking-wide mb-1">SKILLS</p>
          <p className="text-xs opacity-50 mb-2 leading-snug">Fish, mine, and farm to gain XP. Higher levels quietly tilt the odds your way.</p>
          {rows.length === 0 && (
            <p className="py-3 text-base opacity-50 leading-snug">No skills picked up yet. Find a hobby out in the city.</p>
          )}
          {rows.map(sk => {
            const pr = skillProgress(s, sk.k);
            const maxed = pr.level >= 10;
            const pct = maxed ? 100 : Math.round((pr.into / pr.need) * 100);
            return (
              <div key={sk.k} className="py-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xl shrink-0">{sk.icon}</span>
                  <span className="flex-grow text-base">{sk.name}</span>
                  <span className="text-sm text-[#ffd24a]">Lv. {pr.level}{maxed ? ' · MAX' : ''}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-black/50 overflow-hidden">
                  <div className="h-full bg-[#7ce8a0] transition-[width]" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs opacity-55 mt-1">{sk.perk(pr.level)}</p>
              </div>
            );
          })}
        </div>
      );
    })();

    // Fishopedia: a collection log of every fish species. NO-SPOILER: a species you
    // haven't caught shows as a locked 🔒 ??? row — never its name, value, or sprite.
    // Once caught, it unlocks (sprite + name + tally + value + a cosy blurb).
    const fishopediaApp = (() => {
      // One row per species, deduped across the three water tables (squid/eel/koi/
      // golden overlap them) — a fish shows under the FIRST water it appears in, so
      // the list reads shallow → deep → tropical with no repeats.
      const WATERS: { label: string; table: Fish[] }[] = [
        { label: 'SUMIKAWA SHORE', table: FISH },
        { label: 'SUMIKAWA BAY · DEEP', table: DEEP_FISH },
        { label: 'KIWAMI WATERS', table: TROPICAL_FISH },
      ];
      // Cosy one-liners kept here (no data.ts change) — flavor for caught fish.
      const BLURBS: Record<string, string> = {
        minnow: 'A silver thumbnail of a fish. Everyone catches one first.',
        mackerel: 'Stripes like the bay at dusk. The konbini grills these.',
        bream: 'Sea bream — a fish for a good day, or a small feast.',
        squid: 'More arms than sense. Surprisingly strong on the line.',
        eel: 'Slips off the hook if you blink. Worth the wrestle.',
        puffer: 'Puffs up indignant. Handle with respect (and gloves).',
        koi: 'A garden koi, somehow lost to open water. Beautiful and sad.',
        golden: 'The legend Genji chased for forty years. You found it.',
        tuna: 'Bluefin — pure muscle. The deep water hides the big ones.',
        angler: 'A little lantern in the black. It found you first.',
        parrot: 'Painted like the reef it grazes. A tropical jewel.',
        marlin: "A blue spear of the open sea. Kiwami's grandest catch.",
        rainkoi: 'Only surfaces when the sky is falling. It likes the company.',
        stargazer: 'Rises on meteor nights to watch the stars come down.',
      };
      const seen = new Set<string>();
      const waters = WATERS.map(w => ({
        label: w.label,
        species: w.table.filter(f => (seen.has(f.id) ? false : (seen.add(f.id), true))),
      })).filter(w => w.species.length > 0);
      const all = waters.flatMap(w => w.species);
      const found = all.filter(f => (s.fishLog[f.id] || 0) > 0).length;
      return (
        <div className="px-3 py-2">
          <p className="text-sm text-[#ffd24a]/80 tracking-wide mb-1">FISHOPEDIA</p>
          <p className="text-xs opacity-50 mb-2 leading-snug">Every fish you've landed, logged. <span className="text-[#7ce8a0]">{found}</span> / {all.length} discovered — the rest are still out there.</p>
          {waters.map(w => (
            <div key={w.label}>
              <p className="text-sm text-[#ffd24a]/80 tracking-wide mt-3 mb-1">{w.label}</p>
              {w.species.map(f => {
                const count = s.fishLog[f.id] || 0;
                if (count <= 0) {
                  // locked: no name, no sprite, no value — just a silhouette.
                  return (
                    <div key={f.id} className="w-full flex items-center gap-3 py-2 border-b border-white/10 opacity-50">
                      <span className="text-2xl shrink-0 grayscale">🐟</span>
                      <div className="flex-grow min-w-0">
                        <p className="text-base leading-tight tracking-widest">🔒 ???</p>
                        <p className="text-xs opacity-55 leading-tight">Not yet caught.</p>
                      </div>
                    </div>
                  );
                }
                return (
                  <div key={f.id} className="w-full flex items-center gap-3 py-2 border-b border-white/10">
                    <span className="shrink-0"><SpriteIcon atlas={atlasRef.current} sprite={f.sprite} size={26} /></span>
                    <div className="flex-grow min-w-0">
                      <p className="text-base leading-tight">{f.name}</p>
                      <p className="text-xs opacity-55 leading-tight">{BLURBS[f.id] ?? ''}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm text-[#ffd24a] leading-tight">¥{f.value.toLocaleString()}</p>
                      <p className="text-xs opacity-55 leading-tight">caught ×{count}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      );
    })();

    // Almanac: a single discovery tracker across every collectible system. Each
    // category shows found/total + a progress bar; the header rolls them up into
    // one overall discovery %. NO-SPOILER: only counts are shown — nothing names
    // the things you haven't found yet. (Fish stay a summary line; the Fishopedia
    // app owns the per-species log.)
    const almanacApp = (() => {
      const fishIds = new Set([...FISH, ...DEEP_FISH, ...TROPICAL_FISH].map(f => f.id));
      const fishFound = [...fishIds].filter(id => (s.fishLog[id] || 0) > 0).length;
      const gachaFound = GACHA_FIGURES.filter(n => (s.gacha[n] ?? 0) > 0).length;
      const recipeIds = new Set(RECIPES.map(r => r.id));
      const recipesFound = s.recipes.filter(id => recipeIds.has(id)).length;
      // The discovery secrets (each a one-time storySeen flag); count only, never named.
      const SECRETS = ['island-cave', 'midnight-stranger', 'stargaze', 'island-bottle'];
      const secretsFound = SECRETS.filter(id => s.storySeen.includes(id)).length;
      const cats = [
        { icon: '🐟', name: 'Fish', found: fishFound, total: fishIds.size, note: 'species landed (see the Fishopedia)' },
        { icon: '💎', name: 'Minerals', found: s.almanac.minerals.length, total: MINERALS.length, note: 'ore struck in the mines' },
        { icon: '🐚', name: 'Shore finds', found: s.almanac.forage.length, total: FORAGE.length, note: 'washed up on the sand' },
        { icon: '🎁', name: 'Gacha figures', found: gachaFound, total: GACHA_FIGURES.length, note: 'capsules popped' },
        { icon: '🍳', name: 'Recipes', found: recipesFound, total: RECIPES.length, note: 'dishes learned to cook' },
        { icon: '💛', name: 'Friends met', found: metFriends.length, total: FRIENDS.length, note: 'people in your phone' },
        { icon: '🔮', name: 'Secrets', found: secretsFound, total: SECRETS.length, note: 'hidden things uncovered' },
        { icon: '🗺️', name: 'Places', found: s.visited.length, total: Object.keys(SCENES).length, note: 'corners of the city seen' },
      ];
      const sumFound = cats.reduce((a, c) => a + Math.min(c.found, c.total), 0);
      const sumTotal = cats.reduce((a, c) => a + c.total, 0);
      const pctAll = sumTotal ? Math.round((sumFound / sumTotal) * 100) : 0;
      return (
        <div className="px-3 py-2">
          <p className="text-sm text-[#ffd24a]/80 tracking-wide mb-1">ALMANAC</p>
          <p className="text-xs opacity-50 mb-2 leading-snug">Everything the city has to discover, in one place. <span className="text-[#7ce8a0]">{pctAll}%</span> uncovered — the rest is still out there.</p>
          {cats.map(c => {
            const found = Math.min(c.found, c.total);
            const done = found >= c.total && c.total > 0;
            const pct = c.total ? Math.round((found / c.total) * 100) : 0;
            return (
              <div key={c.name} className="py-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="text-xl shrink-0">{c.icon}</span>
                  <span className="flex-grow text-base">{c.name}</span>
                  <span className="text-sm text-[#ffd24a]">{found}/{c.total}{done ? ' ✓' : ''}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-black/50 overflow-hidden">
                  <div className="h-full bg-[#7ce8a0] transition-[width]" style={{ width: `${pct}%` }} />
                </div>
                <p className="text-xs opacity-55 mt-1">{c.note}</p>
              </div>
            );
          })}
        </div>
      );
    })();

    // Recipe Book: every dish in the game, known and not-yet-learned. Known
    // recipes show their dish icon, ingredients, energy and day-buff; locked ones
    // show a silhouette + how they're taught, as aspirational goals. Read-only —
    // you actually cook from the kitchen (Bag → COOK at home).
    const recipesApp = (() => {
      const known = RECIPES.filter(r => s.recipes.includes(r.id)).length;
      return (
        <div className="px-3 py-2">
          <p className="text-sm text-[#ffd24a]/80 tracking-wide mb-1">RECIPE BOOK</p>
          <p className="text-xs opacity-50 mb-2 leading-snug">Every dish you can make, and the ones still to learn. <span className="text-[#7ce8a0]">{known}</span> / {RECIPES.length} learned. Cook them at home (Bag → COOK once a fridge + microwave are placed).</p>
          {RECIPES.map(r => {
            const have = s.recipes.includes(r.id);
            if (!have) {
              // locked: silhouette + the in-world way it's taught, as a goal.
              const hint = r.learn === 'start' ? 'A basic you should already know.' : r.learn;
              return (
                <div key={r.id} className="w-full flex items-center gap-3 py-2 border-b border-white/10 opacity-50">
                  <span className="shrink-0 grayscale opacity-70"><SpriteIcon atlas={atlasRef.current} sprite={r.sprite} size={26} /></span>
                  <div className="flex-grow min-w-0">
                    <p className="text-base leading-tight">🔒 {r.name}</p>
                    <p className="text-xs opacity-65 leading-tight">{hint}</p>
                  </div>
                </div>
              );
            }
            return (
              <div key={r.id} className="w-full flex items-center gap-3 py-2 border-b border-white/10">
                <span className="shrink-0"><SpriteIcon atlas={atlasRef.current} sprite={r.sprite} size={26} /></span>
                <div className="flex-grow min-w-0">
                  <p className="text-base leading-tight">{r.name} <span className="opacity-50 text-sm">+{r.energy} en{r.buff ? ` · ${BUFFS[r.buff].emoji} ${BUFFS[r.buff].name}` : ''}</span></p>
                  <p className="text-xs opacity-65 leading-tight">{r.ingredients.map(i => `${INGREDIENT_LABEL[i.kind]} ×${i.n}`).join('  ·  ')}</p>
                  <p className="text-xs opacity-45 leading-tight italic">{r.blurb}</p>
                </div>
              </div>
            );
          })}
        </div>
      );
    })();

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
      inventory: 'Bag', messages: 'Messages', achievements: 'Trophies', settings: 'Settings', cheats: 'Codes', zamazonk: 'ZamaZonk', journal: 'Journal', friends: 'Friends', music: 'Music', skills: 'Skills', fishopedia: 'Fishopedia', almanac: 'Almanac', recipes: 'Recipe Book',
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
              <AppIcon icon="📓" label="Journal" bg="linear-gradient(160deg,#4a6ea0,#28406a)" onClick={() => { checkMissions(); open('journal'); }} />
              <AppIcon icon="💛" label="Friends" bg="linear-gradient(160deg,#d0506e,#8a2f4a)" onClick={() => open('friends')} />
              {s.jukeboxUnlocked && (
                <AppIcon icon="🎵" label="Music" bg="linear-gradient(160deg,#7a4fd0,#3a2a8a)" onClick={() => open('music')} />
              )}
              <AppIcon icon="📈" label="Skills" bg="linear-gradient(160deg,#3da26b,#1f6e45)" onClick={() => open('skills')} />
              <AppIcon icon="📚" label="Almanac" bg="linear-gradient(160deg,#c97f3a,#7a4a1f)" onClick={() => open('almanac')} />
              <AppIcon icon="🍱" label="Recipes" bg="linear-gradient(160deg,#d8743a,#9e4a1f)" onClick={() => open('recipes')} />
              {s.canFish && (
                <AppIcon icon="🐟" label="Fishopedia" bg="linear-gradient(160deg,#2f8fc9,#1f5a8a)" onClick={() => open('fishopedia')} />
              )}
              {s.zamazonkApp && (
                <AppIcon
                  icon={<img src={ZAMAZONK_LOGO} alt="" className="w-full h-full object-contain p-0.5" />}
                  label="ZamaZonk" bg="#120726" badge={s.orders.length || undefined} onClick={() => open('zamazonk')}
                />
              )}
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
              {ov.tab === 'journal' && journalApp}
              {ov.tab === 'friends' && friendsApp}
              {ov.tab === 'music' && musicApp}
              {ov.tab === 'skills' && skillsApp}
              {ov.tab === 'almanac' && almanacApp}
              {ov.tab === 'recipes' && recipesApp}
              {ov.tab === 'fishopedia' && fishopediaApp}
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

  // Shared overlay chrome — kept chunky/retro to match the game, but softened
  // corners + a layered shadow (crisp pixel offset + a soft ambient) for depth.
  const panelCls = 'bg-[#181a22] border-2 border-[#ffd24a]/55 text-[#e8e0d0] font-pixel rounded-lg shadow-[3px_3px_0_#000,0_10px_30px_-6px_rgba(0,0,0,0.65)]';
  const btnCls = 'border border-[#ffd24a]/60 rounded px-3 py-1 text-[#ffd24a] hover:bg-[#ffd24a] hover:text-black active:translate-y-px transition-all disabled:opacity-30 disabled:pointer-events-none text-lg';

  // A round casino chip used as a bet button across all three games.
  const chipBtn = (c: number, active: boolean, disabled: boolean, onClick: () => void) => (
    <button
      key={c}
      disabled={disabled}
      onClick={onClick}
      className={`relative w-12 h-12 rounded-full border-2 border-dashed font-bold text-xs flex items-center justify-center transition disabled:opacity-25 disabled:pointer-events-none ${active ? 'border-black bg-[#ffd24a] text-black scale-110 shadow-[0_0_10px_rgba(255,210,74,0.6)] chip-pop' : 'border-[#ffd24a]/70 bg-[#2a1822] text-[#ffd24a] hover:bg-[#3a2230]'}`}
    >¥{c >= 1000 ? `${c / 1000}k` : c}</button>
  );
  const feltCls = 'rounded-xl bg-[radial-gradient(circle_at_50%_30%,#2a7d48,#14502b)] border-2 border-[#c9a227]/70 shadow-[inset_0_2px_10px_rgba(0,0,0,0.5)]';

  // Home kitchen: cook any known recipe whose ingredients you currently hold.
  const renderCook = () => {
    void shopTick;
    const s = saveRef.current;
    const close = () => setOverlayBoth(null);
    const known = RECIPES.filter(r => s.recipes.includes(r.id));
    const buffOn = s.buff && s.buff.day === s.day ? s.buff : null;
    return (
      <ShopFrame title="🍳 HOME KITCHEN" subtitle="Cook with what you've gathered" money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
        {buffOn && (
          <p className="text-sm mb-2 px-2 py-1 rounded bg-[#e0843a]/20 text-[#ffd2a0]">{BUFFS[buffOn.id].emoji} {BUFFS[buffOn.id].name} active — {BUFFS[buffOn.id].desc}</p>
        )}
        {known.map(r => {
          const ok = canCook(s, r);
          return (
            <div key={r.id} className="flex items-center gap-2 py-1.5 border-b border-white/10">
              <SpriteIcon atlas={atlasRef.current} sprite={r.sprite} size={28} />
              <div className="flex-grow leading-tight">
                <p className="text-base">{r.name} <span className="opacity-50 text-sm">+{r.energy} en{r.buff ? ` · ${BUFFS[r.buff].emoji} ${BUFFS[r.buff].name}` : ''}</span></p>
                <p className="text-xs opacity-65">{r.ingredients.map(i => `${INGREDIENT_LABEL[i.kind]} ${ingredientCount(s, i.kind)}/${i.n}`).join('  ·  ')}</p>
              </div>
              <button className={`${btnCls} text-sm px-2 py-0.5`} disabled={!ok} onClick={() => doCook(r.id)}>COOK</button>
            </div>
          );
        })}
        <p className="text-xs opacity-50 mt-2 italic leading-snug">Buy rice / eggs / greens at the konbini. Keep a greenhouse harvest (instead of shipping it) to cook with. Friends and the Kawamachi Cooking Institute teach you new recipes — see the Recipe Book on your phone.</p>
      </ShopFrame>
    );
  };

  // Talk-or-gift chooser, shown when you walk up to a friend carrying something giftable.
  // Pick a held item to give an NPC (one gift/NPC/day). Reaction is a portrait dialog.
  const renderGift = (ov: Extract<Overlay, { type: 'gift' }>) => {
    void shopTick;
    const s = saveRef.current;
    const close = () => setOverlayBoth(null);
    const f = friendById(ov.npcId);
    if (!f) { close(); return null; }
    const hearts = friendHearts(s, ov.npcId);
    const items = giftableItems(s);
    const already = !canGiftToday(s, ov.npcId);
    return (
      <ShopFrame
        title={`${f.emoji} GIVE ${f.name.toUpperCase()} A GIFT`}
        subtitle={`${'❤️'.repeat(hearts)}${'·'.repeat(MAX_HEARTS - hearts)}  ${hearts}/10`}
        money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}
      >
        {already
          ? <p className="text-base opacity-65 py-3">You've already given {f.name} something today. Come back tomorrow.</p>
          : items.length === 0
            ? <p className="text-base opacity-65 py-3">Nothing to give right now. Catch a fish, grow a crop, cook a dish, grab a soda…</p>
            : items.map((it, i) => (
                <div key={i} className="flex items-center gap-2 py-1 border-b border-white/10">
                  {it.sprite ? <SpriteIcon atlas={atlasRef.current} sprite={it.sprite} size={22} /> : <span className="w-[22px] text-center text-lg">{it.emoji}</span>}
                  <p className="flex-grow text-base">{it.label} <span className="opacity-40 text-sm">×{it.count}</span></p>
                  <button className={`${btnCls} text-sm px-2 py-0.5`} onClick={() => doGift(ov.npcId, it)}>GIVE</button>
                </div>
              ))}
        {ov.npcId === 'bingus' && (
          <p className="text-xs opacity-50 mt-2 italic leading-snug">A personal gift — Bingus keeps this one. Pieces for the museum are separate: he asks for those in conversation, as donations, and they go straight on display.</p>
        )}
        {hearts >= 2 && (
          <p className="text-xs opacity-55 mt-2 italic">Loves: {f.loved.join(', ')}{f.liked.length ? ` · Likes: ${f.liked.join(', ')}` : ''}</p>
        )}
        {f.perk && <p className="text-xs opacity-45 mt-1">✦ At {f.perk.hearts} ♥: {f.perk.text}</p>}
      </ShopFrame>
    );
  };

  const renderShop = (ov: Extract<Overlay, { type: 'shop' }>) => {
    void shopTick;
    const s = saveRef.current;
    const close = () => setOverlayBoth(null);
    // Merchant friends (Genji/Lulu/Manager) open a shop on E instead of a talk
    // dialog, so they miss the end-of-conversation gift hook. Give their stalls a
    // "Give a gift" button (same gift picker) when you can still gift them today
    // and you're carrying something giftable.
    const shopGiftButton = (friendId: string) =>
      (canGiftToday(s, friendId) && giftableItems(s).length > 0) ? (
        <button className={`${btnCls} w-full mt-3`} onClick={() => setOverlayBoth({ type: 'gift', npcId: friendId })}>🎁 Give a gift</button>
      ) : null;

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

    if (ov.shop === 'granny-fish') {
      return (
        <ShopFrame title="GRANNY SOTO" subtitle={'"Is that... a fresh fish?"'} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          <p className="text-lg opacity-85 py-1 leading-snug">Granny Soto's eyes light up at the fish in your bag. "Hand an old woman a fresh fish, and the community greenhouse is yours to tend. Do we have a deal?"</p>
          <div className="flex items-center gap-3 mt-3">
            <button className={`${btnCls} flex-grow`} onClick={giveGrannyFish}>GIVE HER A FISH</button>
            <button className={btnCls} onClick={close}>KEEP IT</button>
          </div>
        </ShopFrame>
      );
    }

    if (ov.shop === 'errand') {
      const e = errandFor(s);
      return (
        <ShopFrame title="COURIER TERMINAL" subtitle={`Gig from ${e.giver}`} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          <p className="text-lg opacity-85 py-1 leading-snug">{e.ask}</p>
          <p className="text-base opacity-60 py-1">Drop it in the slot — the terminal dispenses ¥{e.reward.toLocaleString()} on deposit.</p>
          <div className="flex items-center gap-3 mt-3">
            <button className={`${btnCls} flex-grow`} onClick={deliverErrand}>DEPOSIT ITEM · +¥{e.reward.toLocaleString()}</button>
            <button className={btnCls} onClick={close}>NOT YET</button>
          </div>
        </ShopFrame>
      );
    }

    if (ov.shop === 'bingus-fetch') {
      const f = bingusHeldFetch(s);
      if (!f) { close(); return null; }
      const slot = MUSEUM_SLOTS.find(sl => sl.id === f.slot)!;
      return (
        <ShopFrame title="MUSEUM DONATION" subtitle="Bingus Doofelsmurt — the curator's eyes go wide" money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          <p className="text-lg opacity-85 py-1 leading-snug">"Is that— yes! YES! Exactly the thing I asked for. Hand it here and I shall make it ART."</p>
          <p className="text-base opacity-60 py-1 leading-snug">He'll donate it to the collection as <span className="text-[#ffd24a]">"{slot.label}"</span> — it goes on display, not into his pockets.</p>
          <div className="flex items-center gap-3 mt-3">
            <button className={`${btnCls} flex-grow`} onClick={giveBingusFetch}>DONATE TO THE MUSEUM</button>
            <button className={btnCls} onClick={bingusTalk}>JUST CHAT</button>
            <button className={btnCls} onClick={close}>KEEP IT</button>
          </div>
          <p className="text-xs opacity-50 mt-2 italic leading-snug">A donation fills a museum display — it isn't a personal gift. To warm Bingus up instead, JUST CHAT and pick 🎁 Give a gift at the end.</p>
        </ShopFrame>
      );
    }

    if (ov.shop === 'street') {
      const ev = streetEventRef.current;
      if (!ev) { close(); return null; }
      const cfg = STREET_UI[ev.id];
      const afford = ev.cost === 0 || s.money >= ev.cost;
      return (
        <ShopFrame title={cfg.title} subtitle={cfg.subtitle} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          <p className="text-lg opacity-85 py-1 leading-snug">{cfg.body}</p>
          {ev.cost > 0 && <p className="text-base opacity-60 py-1">{cfg.priceLabel} ¥{ev.cost.toLocaleString()}</p>}
          <div className="flex items-center gap-3 mt-3">
            <button className={`${btnCls} flex-grow`} disabled={!afford} onClick={() => runStreetEvent(ev.id)}>
              {afford ? cfg.action : "CAN'T AFFORD"}
            </button>
            <button className={btnCls} onClick={close}>{cfg.no}</button>
          </div>
        </ShopFrame>
      );
    }

    if (ov.shop === 'greenhouse-plot') {
      const plot = s.greenhouse.plots[ghPlotRef.current];
      const crop = plot && plot.crop ? CROPS[plot.crop] : null;
      const ready = plot ? plotReady(plot) : false;
      const wateredToday = plot ? plot.wateredDay === s.day : false;
      const seedIds = Object.keys(s.greenhouse.seeds).filter(id => (s.greenhouse.seeds[id] ?? 0) > 0 && CROPS[id]);
      return (
        <ShopFrame title="SOIL BED" subtitle={crop ? crop.name : 'Empty — ready to plant'} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          {!crop ? (
            <div className="py-1">
              <p className="text-base opacity-70 mb-2">Press a seed into the soil:</p>
              {seedIds.length === 0
                ? <p className="text-base opacity-50 py-2">No seeds on hand. Buy some at Granny's supply counter.</p>
                : seedIds.map(id => {
                    const c = CROPS[id];
                    return (
                      <div key={id} className="flex items-center gap-3 py-1.5 border-b border-white/10">
                        <SpriteIcon atlas={atlasRef.current} sprite={c.sprites[3]} size={26} />
                        <div className="flex-grow min-w-0">
                          <p className="text-base leading-tight">{c.name} <span className="text-xs opacity-50">×{s.greenhouse.seeds[id]}</span></p>
                          <p className="text-xs opacity-50 leading-tight">{c.growDays}d · sells ¥{c.reward.toLocaleString()}{c.regrow ? ' · regrows' : ''}</p>
                        </div>
                        <button className={btnCls} onClick={() => doPlantCrop(id)}>PLANT</button>
                      </div>
                    );
                  })}
            </div>
          ) : ready ? (
            <div className="py-2">
              <div className="flex items-center gap-3 mb-3"><SpriteIcon atlas={atlasRef.current} sprite={crop.sprites[3]} size={40} /><p className="text-lg">{crop.name} — ripe and ready!</p></div>
              <div className="flex flex-col gap-2">
                <button className={`${btnCls} w-full`} onClick={() => doHarvestPlot(false)}>HARVEST → shipping box (sell)</button>
                <button className={`${btnCls} w-full`} onClick={() => doHarvestPlot(true)}>HARVEST → keep to cook 🍳</button>
              </div>
            </div>
          ) : (
            <div className="py-2">
              <div className="flex items-center gap-3 mb-2">
                <SpriteIcon atlas={atlasRef.current} sprite={crop.sprites[plotStage(plot)]} size={40} />
                <div>
                  <p className="text-base">{crop.name}</p>
                  <p className="text-xs opacity-60">Day {plot.progress}/{crop.growDays} · {plot.fertilized ? 'fertilized · ' : ''}{plot.missed > 0 ? `${plot.missed} dry morning${plot.missed > 1 ? 's' : ''}` : 'well-tended'}</p>
                </div>
              </div>
              <p className="text-sm opacity-70 mb-2">{s.greenhouse.sprinkler ? 'The sprinkler keeps this bed watered for you.' : wateredToday ? 'Watered for today — come back tomorrow.' : 'The soil is dry. Give it a drink.'}</p>
              <div className="flex gap-2">
                {!s.greenhouse.sprinkler && <button className={`${btnCls} flex-grow`} disabled={wateredToday} onClick={doWaterPlot}>{wateredToday ? 'WATERED ✓' : '💧 WATER'}</button>}
                <button className={`${btnCls} flex-grow`} disabled={plot.fertilized || s.greenhouse.fertilizer <= 0} onClick={doFertilizePlot}>{plot.fertilized ? 'FERTILIZED ✓' : `FERTILIZE (×${s.greenhouse.fertilizer})`}</button>
              </div>
              <button className={`${btnCls} w-full mt-2 text-sm opacity-80`} onClick={doClearPlot}>🪏 Uproot (clear this bed)</button>
            </div>
          )}
        </ShopFrame>
      );
    }

    if (ov.shop === 'greenhouse-supply') {
      const g = s.greenhouse;
      const seeds = seedShopFor(s);
      const req = activeRequest(s);
      const bedCost = BED_COSTS[g.beds + 3];
      const tierCost = TIER_COSTS[g.tier + 1];
      return (
        <ShopFrame title="GRANNY'S SUPPLY COUNTER" subtitle="Seeds, supplies, and room to grow" money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          {req && (
            <div className="mb-2 rounded-lg bg-[#3da26b]/15 border border-[#3da26b]/40 px-2.5 py-1.5">
              <p className="text-sm text-[#7ce8a0]">📋 COMMUNITY REQUEST</p>
              <p className="text-sm opacity-80 leading-snug">{req.flavor}</p>
              <p className="text-xs opacity-70 mt-0.5">Ship {req.count} {CROPS[req.crop].name} — {g.request?.progress ?? 0}/{req.count} done · bonus ¥{req.reward.toLocaleString()}</p>
            </div>
          )}
          <p className="text-sm text-[#7ce8a0]/80">SEEDS</p>
          {seeds.map(c => (
            <div key={c.id} className="flex items-center gap-2 py-1 border-b border-white/10">
              <SpriteIcon atlas={atlasRef.current} sprite={c.sprites[3]} size={24} />
              <div className="flex-grow min-w-0"><p className="text-sm leading-tight">{c.name} <span className="text-xs opacity-50">have ×{g.seeds[c.id] ?? 0}</span></p><p className="text-xs opacity-50 leading-tight">{c.growDays}d · ¥{c.reward.toLocaleString()}{c.regrow ? ' · regrows' : ''}</p></div>
              <button className={`${btnCls} text-sm`} disabled={s.money < c.seedCost} onClick={() => buyGhSeed(c.id)}>¥{c.seedCost}</button>
            </div>
          ))}
          {g.moonSeed && <p className="text-xs opacity-60 py-1">🌙 Moonflower seed — a gift of the shrine (have ×{g.seeds.moonflower ?? 0})</p>}
          <p className="text-sm text-[#7ce8a0]/80 mt-2">SUPPLIES</p>
          <div className="flex items-center gap-2 py-1 border-b border-white/10">
            <div className="flex-grow"><p className="text-sm">Fertilizer <span className="text-xs opacity-50">have ×{g.fertilizer}</span></p><p className="text-xs opacity-50">apply to a bed for a quality boost</p></div>
            <button className={`${btnCls} text-sm`} disabled={s.money < FERTILIZER_COST} onClick={buyGhFertilizer}>¥{FERTILIZER_COST}</button>
          </div>
          <div className="flex items-center gap-2 py-1 border-b border-white/10">
            <div className="flex-grow"><p className="text-sm">Sprinkler System</p><p className="text-xs opacity-50">auto-waters every bed, every morning</p></div>
            {g.sprinkler ? <span className="text-[#3da26b] text-sm">INSTALLED</span> : <button className={`${btnCls} text-sm`} disabled={s.money < SPRINKLER_COST} onClick={buyGhSprinkler}>¥{SPRINKLER_COST.toLocaleString()}</button>}
          </div>
          <p className="text-sm text-[#7ce8a0]/80 mt-2">EXPANSION</p>
          <div className="flex items-center gap-2 py-1 border-b border-white/10">
            <div className="flex-grow"><p className="text-sm">Till new beds <span className="text-xs opacity-50">{g.beds}/9</span></p><p className="text-xs opacity-50">break ground for 3 more soil beds</p></div>
            {bedCost ? <button className={`${btnCls} text-sm`} disabled={s.money < bedCost} onClick={buyGhBeds}>¥{bedCost.toLocaleString()}</button> : <span className="text-[#3da26b] text-sm">MAX</span>}
          </div>
          <div className="flex items-center gap-2 py-1">
            <div className="flex-grow"><p className="text-sm">Glasshouse upgrade <span className="text-xs opacity-50">tier {g.tier}/2</span></p><p className="text-xs opacity-50">unlocks better seeds + a standing quality bonus</p></div>
            {tierCost ? <button className={`${btnCls} text-sm`} disabled={s.money < tierCost} onClick={buyGhTier}>¥{tierCost.toLocaleString()}</button> : <span className="text-[#3da26b] text-sm">MAX</span>}
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
            <button className={`${btnCls} w-full`} onClick={startSlots}>🎰 SLOT MACHINES — jackpot at ¥{jackpotFor(s).toLocaleString()}</button>
            <button className={`${btnCls} w-full`} onClick={startRoulette}>🔴 ROULETTE — pick a color, a number, your fate</button>
          </div>
          {backroomOpen(s) && <p className="text-xs text-[#ffd24a]/70 mt-3">✦ The velvet curtain at the back of the hall hangs open for you.</p>}
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
      const pip = (c: Card) => (
        <span className="leading-[0.85] text-center">{CARD_RANKS[c.rank]}<br />{CARD_SUITS[c.suit]}</span>
      );
      const cardChip = (c: Card, hidden: boolean, key: number) => (
        <span key={key} className={`card-deal relative inline-block w-[46px] h-16 rounded-md mr-1.5 align-top ${hidden ? 'bg-gradient-to-br from-[#7a2f5e] to-[#3a1530] border-2 border-[#c9a227]' : 'bg-[#f6f2ea] border border-[#b8b0a0] shadow-[1px_2px_0_rgba(0,0,0,0.45)]'}`}>
          {hidden ? (
            <span className="absolute inset-1 rounded-sm border border-[#c9a227]/50 flex items-center justify-center text-[#c9a227] text-lg">❖</span>
          ) : (<>
            <span className={`absolute top-0.5 left-1 text-[11px] font-bold ${red(c) ? 'text-[#c0392b]' : 'text-[#16181d]'}`}>{pip(c)}</span>
            <span className={`absolute inset-0 flex items-center justify-center text-2xl ${red(c) ? 'text-[#c0392b]' : 'text-[#16181d]'}`}>{CARD_SUITS[c.suit]}</span>
            <span className={`absolute bottom-0.5 right-1 text-[11px] font-bold rotate-180 ${red(c) ? 'text-[#c0392b]' : 'text-[#16181d]'}`}>{pip(c)}</span>
          </>)}
        </span>
      );
      const profit = bj.payout - bj.bet;
      const won = bj.result === 'win' || bj.result === 'blackjack';
      // At the boss's private table there IS no lobby — the back button just
      // leaves the table instead of teleporting the Lounge UI into the backroom.
      const inBackroom = sceneRef.current.id === 'backroom';
      const toLobby = () => inBackroom ? close() : setOverlayBoth({ type: 'shop', shop: 'casino' });
      const lobbyLabel = inBackroom ? 'LEAVE THE TABLE' : '← BACK TO LOBBY';
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
              <div className="flex flex-wrap gap-2 mb-3 justify-center">
                {chips.map(c => chipBtn(c, bj.bet === c, s.money < c, () => setBjBet(c)))}
              </div>
              <button className={`${btnCls} w-full`} disabled={s.money < bj.bet} onClick={dealBlackjack}>DEAL · bet ¥{bj.bet.toLocaleString()}</button>
              <button className={`${btnCls} w-full mt-2 text-sm`} onClick={toLobby}>{lobbyLabel}</button>
            </div>
          ) : (
            <div className="py-2">
              <div className={`${feltCls} px-3 py-3 mb-3 ${won ? 'casino-win' : ''}`}>
                <p className="text-xs text-white/70 mb-1">DEALER{bj.hideHole ? '' : ` · ${dv}${dv > 21 ? ' BUST' : ''}`}</p>
                <div className="mb-3 min-h-[64px]">{bj.dealer.map((c, i) => cardChip(c, bj.hideHole && i === 1, i))}</div>
                <p className="text-xs text-white/70 mb-1">YOU · {pv}{pv > 21 ? ' BUST' : ''}</p>
                <div className="min-h-[64px]">{bj.player.map((c, i) => cardChip(c, false, i))}</div>
              </div>
              {bj.phase === 'player' ? (
                <div className="flex gap-2">
                  <button className={`${btnCls} flex-grow`} onClick={hitBlackjack}>HIT</button>
                  <button className={`${btnCls} flex-grow`} onClick={standBlackjack}>STAND</button>
                </div>
              ) : (
                <div>
                  <p className={`text-xl mb-2 text-center ${bj.result === 'lose' ? 'text-[#d05050]' : bj.result === 'push' ? 'text-[#e8e0d0]' : 'text-[#7ce8a0]'}`}>{resultText}</p>
                  <div className="flex gap-2">
                    <button className={`${btnCls} flex-grow`} disabled={s.money < bj.bet} onClick={() => { casinoRef.current.bj = { ...freshBlackjack(), bet: bj.bet }; setShopTick(v => v + 1); }}>NEW HAND</button>
                    <button className={btnCls} onClick={toLobby}>{inBackroom ? 'LEAVE' : 'LOBBY'}</button>
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
      const won = slot.phase === 'done' && slot.win > 0;
      const sym = (n: number) => SLOT_SYMBOLS[((n % SLOT_SYMBOLS.length) + SLOT_SYMBOLS.length) % SLOT_SYMBOLS.length];
      const reelBox = (i: number) => {
        const live = spinning && !slot.stopped[i];
        return (
          <span key={i} className="mx-1 w-[60px] h-20 rounded-md border-2 border-[#7a5a1a] bg-[#0e0a10] overflow-hidden flex flex-col items-center justify-center shadow-[inset_0_0_8px_rgba(0,0,0,0.8)]">
            {live ? (
              <span className="flex flex-col items-center text-3xl leading-tight blur-[1.5px] opacity-90">
                <span>{sym(slot.reels[i] + 1)}</span>
                <span>{sym(slot.reels[i])}</span>
                <span>{sym(slot.reels[i] + 2)}</span>
              </span>
            ) : (
              <span className="text-4xl">{SLOT_SYMBOLS[slot.reels[i]]}</span>
            )}
          </span>
        );
      };
      const winText = slot.phase === 'done' ? (slot.win > 0 ? `WIN  +¥${slot.win.toLocaleString()}!` : 'No match. Spin again.') : (spinning ? 'good luck…' : ' ');
      const pot = jackpotFor(s);
      return (
        <ShopFrame title="SLOT MACHINES" subtitle="Line up three · 7️⃣7️⃣7️⃣ = 50× your bet + the JACKPOT" money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          <p className="text-center text-sm tracking-widest text-[#ffd24a] mt-1">✦ PROGRESSIVE JACKPOT · ¥{pot.toLocaleString()} ✦</p>
          <div className={`relative mx-auto w-fit rounded-xl border-4 border-[#c9a227] bg-gradient-to-b from-[#3a2230] to-[#170d14] px-3 py-4 my-2 ${won ? 'casino-win' : ''}`}>
            {/* payline across the middle */}
            <div className="absolute left-3 right-3 top-1/2 -translate-y-1/2 h-[1px] bg-[#ffd24a]/70 shadow-[0_0_6px_rgba(255,210,74,0.8)] pointer-events-none" />
            <div className="flex justify-center">{[0, 1, 2].map(reelBox)}</div>
          </div>
          <p className={`text-center text-xl h-7 ${slot.win > 0 ? 'text-[#7ce8a0]' : 'opacity-60'}`}>{winText}</p>
          <div className="flex flex-wrap gap-2 justify-center my-2">
            {chips.map(c => chipBtn(c, slot.bet === c, spinning || s.money < c, () => setSlotBet(c)))}
          </div>
          <button className={`${btnCls} w-full text-xl`} disabled={spinning || s.money < slot.bet} onClick={spinSlots}>{spinning ? 'SPINNING…' : `PULL · bet ¥${slot.bet.toLocaleString()}`}</button>
          <button className={`${btnCls} w-full mt-2 text-sm`} disabled={spinning} onClick={() => setOverlayBoth({ type: 'shop', shop: 'casino' })}>← BACK TO LOBBY</button>
          <p className="text-xs opacity-40 mt-2 text-center">7️⃣×3 = 50× + jackpot · 💎×3 = 20× · ⭐×3 = 10× · any 3 = 5× · any pair = 2×</p>
          <p className="text-xs opacity-40 mt-1 text-center">The jackpot grows every day until somebody hits it.</p>
        </ShopFrame>
      );
    }

    if (ov.shop === 'roulette') {
      const roul = casinoRef.current.roul;
      const chips = [100, 500, 1000, 2500];
      const spinning = roul.phase === 'spin';
      const r = roul.display;
      const green = r === 0;
      const isRed = ROULETTE_RED.has(r);
      const hubColor = green ? 'text-[#3ad17a]' : isRed ? 'text-[#ff6b6b]' : 'text-white';
      const won = roul.phase === 'done' && roul.win > 0;
      const kinds: [RouletteBet, string][] = [
        ['red', 'RED'], ['black', 'BLACK'], ['even', 'EVEN'], ['odd', 'ODD'], ['low', '1–18'], ['high', '19–36'],
      ];
      const profit = roul.win - roul.bet;
      const resultText = roul.phase === 'done'
        ? (roul.win > 0 ? `WIN  +¥${profit.toLocaleString()}!` : 'House takes it. Spin again.')
        : (spinning ? 'No more bets…' : ' ');
      const betLabel =
        roul.kind === 'number' ? `straight up on ${roul.pick}` :
        roul.kind === 'red' ? 'on RED' : roul.kind === 'black' ? 'on BLACK' :
        roul.kind === 'even' ? 'on EVEN' : roul.kind === 'odd' ? 'on ODD' :
        roul.kind === 'low' ? 'on 1–18' : 'on 19–36';
      return (
        <ShopFrame title="ROULETTE" subtitle="Single zero · outside bets pay even · a number pays 35:1" money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          <div className="flex justify-center py-2">
            <div className={`relative w-28 h-28 rounded-full ${won ? 'casino-win' : ''}`}>
              {/* alternating red/black wheel ring; spins while the ball is rolling */}
              <div
                className={`absolute inset-0 rounded-full border-4 border-[#c9a227] ${spinning ? 'wheel-spinning' : ''}`}
                style={{ background: 'repeating-conic-gradient(#1a1a1a 0 18deg, #b03030 18deg 36deg)' }}
              />
              {/* the dropping ball, parked at 12 o'clock */}
              <div className="absolute top-[2px] left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-white shadow-[0_0_4px_#fff]" />
              {/* hub showing the winning pocket */}
              <div className="absolute inset-[22px] rounded-full bg-[#0e0a10] border-2 border-[#7a5a1a] flex items-center justify-center">
                <span className={`text-3xl font-bold ${hubColor}`}>{r}</span>
              </div>
            </div>
          </div>
          <p className={`text-center text-xl h-7 ${roul.win > 0 ? 'text-[#7ce8a0]' : 'opacity-60'}`}>{resultText}</p>
          <p className="text-sm opacity-60 text-center mb-2">Betting ¥{roul.bet.toLocaleString()} {betLabel}</p>
          <div className="flex flex-wrap gap-2 justify-center mb-2">
            {kinds.map(([k, lbl]) => (
              <button key={k} className={`${btnCls} text-sm ${roul.kind === k ? 'bg-[#ffd24a] text-black' : ''}`} disabled={spinning} onClick={() => setRoulKind(k)}>{lbl}</button>
            ))}
          </div>
          <div className="flex items-center justify-center gap-2 mb-3">
            <button className={`${btnCls} text-sm ${roul.kind === 'number' ? 'bg-[#ffd24a] text-black' : ''}`} disabled={spinning} onClick={() => setRoulKind('number')}>NUMBER</button>
            <button className={`${btnCls} text-sm`} disabled={spinning} onClick={() => setRoulPick(roul.pick - 1)}>−</button>
            <span className="text-xl w-8 text-center">{roul.pick}</span>
            <button className={`${btnCls} text-sm`} disabled={spinning} onClick={() => setRoulPick(roul.pick + 1)}>+</button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center my-2">
            {chips.map(c => chipBtn(c, roul.bet === c, spinning || s.money < c, () => setRoulBet(c)))}
          </div>
          <button className={`${btnCls} w-full text-xl`} disabled={spinning || s.money < roul.bet} onClick={spinRoulette}>{spinning ? 'SPINNING…' : `SPIN · bet ¥${roul.bet.toLocaleString()}`}</button>
          <button className={`${btnCls} w-full mt-2 text-sm`} disabled={spinning} onClick={() => setOverlayBoth({ type: 'shop', shop: 'casino' })}>← BACK TO LOBBY</button>
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
                <button data-nosfx className={`${btnCls} shrink-0`} disabled={s.money < o.price} onClick={() => buyAtPrice(o.itemId, o.price)}>¥{o.price.toLocaleString()}</button>
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
          {/* Special Delivery gig — a third entry point alongside Kojima (NPC) and the
              dispatch poster. startDelivery handles its own overlay (dialog → drive);
              close the shop first so the hand-off reads clean, like the konbini shift. */}
          <p className="text-base text-[#ffd24a]/80 mt-3">WORK</p>
          <div className="flex items-center gap-3 py-1.5">
            <p className="flex-grow text-lg opacity-80">One dirt-rally delivery run per day. Faster &amp; cleaner pays more.</p>
            <button className={btnCls} disabled={deliveryDoneToday(s)} onClick={() => { close(); startDelivery(); }}>
              {deliveryDoneToday(s) ? 'DELIVERED TODAY ✓' : '🚚 SPECIAL DELIVERY'}
            </button>
          </div>
        </ShopFrame>
      );
    }

    if (ov.shop === 'monster') {
      if (!s.monsterFed) {
        return (
          <ShopFrame title="THE MANAGER" subtitle={'"A customer! How wonderful. How rare. How... hm."'} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
            <img src={PORTRAIT_IMAGES['The Manager']} alt="The Manager" className="w-24 h-24 mx-auto mb-1" style={{ imageRendering: 'pixelated' }} />
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
          <div className="flex items-center gap-3 mb-2 pb-2 border-b border-[#b06ad0]/20">
            <img src={PORTRAIT_IMAGES['The Manager']} alt="The Manager" className="w-16 h-16 shrink-0 rounded-sm" style={{ imageRendering: 'pixelated' }} />
            <p className="text-base text-[#b06ad0]/80 leading-snug">TOOLS &amp; WEAPONS — "For the work, and for the things that object to the work."</p>
          </div>
          {(() => {
            const cur = s.pickaxe;
            const next = PICKAXES[cur + 1];
            return (
              <div className="flex items-center gap-3 py-1.5 border-b border-white/10">
                <div className="flex-grow min-w-0">
                  <p className="text-xl leading-tight">{next ? next.name : pickaxeOf(cur).name} ⛏️</p>
                  <p className="text-sm opacity-60 leading-tight">{next ? next.blurb : 'The finest pick there is. The rock fears you now.'}</p>
                </div>
                {next
                  ? <button className={`${btnCls} shrink-0`} disabled={s.money < next.price} onClick={() => buyPickaxe(cur + 1)}>¥{next.price.toLocaleString()}</button>
                  : <span className="text-[#b06ad0] text-base shrink-0">MAXED</span>}
              </div>
            );
          })()}
          {!s.wand && (
            <div className="flex items-center gap-3 py-1.5 border-b border-white/10">
              <div className="flex-grow min-w-0">
                <p className="text-xl leading-tight">Magical Girl Wand ✨</p>
                <p className="text-sm opacity-60 leading-tight">"For the crawlers downstairs. Point the sparkly end away from yourself."</p>
              </div>
              <button className={`${btnCls} shrink-0`} disabled={s.money < WAND_PRICE} onClick={buyWand}>¥{WAND_PRICE.toLocaleString()}</button>
            </div>
          )}
          {s.wand && !s.wand2 && (
            <div className="flex items-center gap-3 py-1.5 border-b border-white/10">
              <div className="flex-grow min-w-0">
                <p className="text-xl leading-tight">Wand Upgrade 💗</p>
                <p className="text-sm opacity-60 leading-tight">"Now the sparkle goes THROUGH them — and it lights your way that little bit further."</p>
              </div>
              <button className={`${btnCls} shrink-0`} disabled={s.money < WAND2_PRICE} onClick={buyWand2}>¥{WAND2_PRICE.toLocaleString()}</button>
            </div>
          )}
          {s.deepestFloor >= GUN_UNLOCK_FLOOR && !s.gun && (
            <div className="flex items-center gap-3 py-1.5 border-b border-white/10">
              <div className="flex-grow min-w-0">
                <p className="text-xl leading-tight">AK-67 🔫</p>
                <p className="text-sm opacity-60 leading-tight">"Full automatic. The best weapon down there. Hold to fire. They will not bother you again."</p>
              </div>
              <button className={`${btnCls} shrink-0`} disabled={s.money < GUN_PRICE} onClick={buyGun}>¥{GUN_PRICE.toLocaleString()}</button>
            </div>
          )}
          {s.gun && <p className="text-base text-[#ffd24a]/80 py-1">AK-67 — equipped. Hold the action button in the mines to fire.</p>}
          {s.geodes > 0 && (
            <div className="flex items-center gap-3 py-1.5 border-b border-white/10">
              <div className="flex-grow min-w-0">
                <p className="text-xl leading-tight">Crack a Geode 🪨 <span className="text-sm opacity-50">(×{s.geodes})</span></p>
                <p className="text-sm opacity-60 leading-tight">"Sealed rock from the deep. I do so love a surprise. Mostly."</p>
                {geodePop && <p className="text-sm leading-tight mt-0.5" style={{ color: geodePop.color }}>{geodePop.text}</p>}
              </div>
              <button className={`${btnCls} shrink-0`} onClick={doCrackGeode}>CRACK</button>
            </div>
          )}
          <p className="text-base text-[#b06ad0]/80 mt-1">FURNITURE — "Money? Quaint. Down here we work in minerals."</p>
          {RARE_FURNITURE.filter(f => f.id !== 'coffin' && f.id !== 'bloomlamp').map(f => {
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
          {shopGiftButton('manager')}
        </ShopFrame>
      );
    }

    if (ov.shop === 'dj') {
      const options = DJ_SETLIST.filter(t => t.scene === 'nightclub' || s.visited.includes(t.scene));
      const locked = DJ_SETLIST.length - options.length;
      return (
        <ShopFrame title="DJ TANUKI" subtitle={'"Requests?! ...Fine. But ONLY places you have actually been. Authenticity matters."'} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          <div className="mb-3 pb-3 border-b border-white/15">
            <p className="text-base leading-tight mb-1">🎤 Sing Karaoke <span className="text-sm opacity-50">— hop on the mic, earn tips</span></p>
            <p className="text-sm opacity-55 leading-tight mb-2">"Grab the mic, sing to my beat. Crowd tips you for how you do — tap on the rhythm. No cover charge, no shame."</p>
            <button className={`${btnCls} w-full`} onClick={startKaraoke}>🎤 SING! (tips based on how you do)</button>
          </div>
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
          <div className="mt-3 pt-2 border-t border-white/15">
            {s.jukeboxUnlocked ? (
              <p className="text-sm opacity-60">"Your home rig's all set. Spin whatever you want back at the apartment."</p>
            ) : (
              <>
                <p className="text-base leading-tight mb-1">🎵 Home Jukebox <span className="text-sm opacity-50">— play city tracks at your apartment</span></p>
                <button className={`${btnCls} w-full`} disabled={s.money < JUKEBOX_PRICE} onClick={buyJukebox}>
                  {s.money < JUKEBOX_PRICE ? `NEED ¥${JUKEBOX_PRICE.toLocaleString()}` : `BUY HOME JUKEBOX · ¥${JUKEBOX_PRICE.toLocaleString()}`}
                </button>
              </>
            )}
          </div>
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
            <button className={btnCls} onClick={() => { setOverlayBoth(null); enterScene('island', 3, 7, 'right'); showDialog(['The skiff puts the city behind you, tower by tower, until it is a postcard.', 'Ahead: a green smudge becomes palms, then a whole island — a volcano smoking gently over a turquoise lagoon. Kiwami.']); }}>SAIL TO KIWAMI ISLAND ⛵</button>
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
          {shopGiftButton('lulu')}
        </ShopFrame>
      );
    }

    if (ov.shop === 'genji') {
      const owned = rodInfo(s.fishRod);
      const next = s.fishRod + 1 < RODS.length ? rodInfo(s.fishRod + 1) : null;
      return (
        <ShopFrame title="GENJI'S TACKLE" subtitle={'"Forty years on this shore. Ask me anything but the carp."'} money={s.money} onClose={close} panelCls={panelCls} btnCls={btnCls}>
          <p className="text-base text-[#ffd24a]/80 mt-1">YOUR ROD</p>
          <p className="text-lg py-0.5 opacity-80">{owned.name}</p>
          <p className="text-base text-[#ffd24a]/80 mt-3">FOR SALE</p>
          {next ? (() => {
            const price = rodPriceFor(s, next.price);
            const discounted = price < next.price;
            return (
            <div className="flex items-center gap-3 py-1.5">
              <div className="flex-grow min-w-0">
                <p className="text-xl leading-tight">{next.name}</p>
                <p className="text-sm opacity-60 leading-tight">{next.blurb}</p>
                {discounted && <p className="text-xs text-[#7ce8a0] leading-tight">friend's price — 25% off</p>}
              </div>
              {discounted && <span className="text-sm opacity-40 line-through shrink-0">¥{next.price.toLocaleString()}</span>}
              <button className={`${btnCls} shrink-0`} disabled={s.money < price} onClick={buyRod}>¥{price.toLocaleString()}</button>
            </div>
            );
          })() : (
            <p className="py-1 text-lg opacity-60">"That's the best rod I have, friend. The rest is up to the water."</p>
          )}
          {shopGiftButton('genji')}
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
        <p className="text-base text-[#ffd24a]/80 mt-3">GROCERIES <span className="text-sm opacity-60">(cook with these at home)</span></p>
        {GROCERIES.map(g => (
          <div key={g.id} className="flex items-center gap-3 py-1 border-b border-white/10">
            <SpriteIcon atlas={atlasRef.current} sprite={g.sprite} size={20} />
            <p className="flex-grow text-xl">{g.name}{(s.pantry[g.id] ?? 0) > 0 && <span className="text-sm opacity-50"> (have {s.pantry[g.id]})</span>}</p>
            <button className={btnCls} disabled={s.money < g.price} onClick={() => buyGroceryItem(g.id, g.price)}>¥{g.price}</button>
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

          {/* active food buff — emoji + name + what it does, so it's not a mystery icon */}
          {hud.buff && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#e0843a]/20 leading-none"
              title={`${hud.buff.name} — ${hud.buff.tag} (until tomorrow)`}
            >
              <span className="text-base">{hud.buff.emoji}</span>
              <span className="hidden sm:inline text-[10px] font-pixel text-[#ffd2a0] whitespace-nowrap">{hud.buff.name} · {hud.buff.tag}</span>
            </span>
          )}

          {/* weather / sky-event chip — rainy / foggy / meteor night */}
          {hud.weather && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-[#6f9ad0]/20 leading-none"
              title={hud.weather.title}
            >
              <span className="text-base">{hud.weather.emoji}</span>
              <span className="hidden sm:inline text-[10px] font-pixel text-[#bfe0ff] whitespace-nowrap">{hud.weather.label}</span>
            </span>
          )}

          {/* special-day chip — Market / Lucky Day */}
          {hud.event && (
            <span
              className={`ml-auto shrink-0 inline-flex items-center px-2 py-1 rounded text-xs sm:text-sm font-bold leading-none chip-pop ${hud.event === 'lucky' ? 'bg-[#ffd24a]/20 text-[#ffe9a0]' : 'bg-[#e857a8]/20 text-[#f6b4dc]'}`}
              title={hud.event === 'lucky' ? 'Lucky Day — extra shore finds & richer mine veins' : 'Market Day — pawn shop & street dealer stocked deep and cheap'}
            >
              {DAY_EVENT_LABEL[hud.event]}
            </span>
          )}

          {/* scene name */}
          <span className={`${hud.event ? '' : 'ml-auto'} hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded bg-black/25 text-sm text-[#e8e0d0]/80 leading-none truncate max-w-[34%]`}>
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
          <div data-navroot className={`${isCoarse ? 'fixed' : 'absolute'} inset-0 z-50 flex flex-col items-center justify-center text-center p-4 overflow-y-auto`}>
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

              <p className="font-pixel text-[#e8e0d0]/70 text-sm sm:text-base drop-shadow-[1px_1px_0_#000]">{isCoarse ? 'On-screen controls once you start' : 'WASD / arrows move · E interact · P/Q phone · Esc close'}</p>
            </div>

          </div>
          );
        })()}

        {/* new-game "what's your vibe?" character pick (not a gender — just a look) */}
        {screen === 'title' && vibePick && (
          <div data-navroot className={`${isCoarse ? 'fixed' : 'absolute'} inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center text-center p-4`}>
            <h2 className="font-retro text-[#ffd24a] text-lg sm:text-2xl mb-5 drop-shadow-[2px_2px_0_#000]">WHAT'S YOUR VIBE?</h2>
            <div className="flex flex-col items-center gap-1.5 mb-6">
              <label htmlFor="pc-name" className="font-pixel text-[#e8e0d0]/80 text-sm sm:text-base">YOUR NAME</label>
              <input
                id="pc-name"
                data-nosfx
                value={pcName}
                onChange={e => setPcName(e.target.value.replace(/[\u0000-\u001f\u007f-\u009f]/g, '').slice(0, 16))}
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
          <div data-navroot className={`${isCoarse ? 'fixed' : 'absolute'} inset-0 z-[60] bg-black/85 flex items-center justify-center p-3 sm:p-4`}>
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
          <div data-navroot className={`${isCoarse ? 'fixed' : 'absolute'} inset-0 z-[60] bg-black/85 flex items-center justify-center p-3 sm:p-4`}>
            <div className={`${panelCls} w-full max-w-xs px-5 py-4`}>
              <div className="flex items-center justify-between border-b-2 border-[#ffd24a]/40 pb-1.5 mb-3">
                <h3 className="font-retro text-[#ffd24a] text-base">⚙ SETTINGS</h3>
                <button className={btnCls} onClick={() => setSettingsOpen(false)}>✕</button>
              </div>
              <div className="flex flex-col gap-2">
                <button className={`${btnCls} w-full py-1.5`} onClick={() => { setSettingsOpen(false); setDisplayOpen(true); }}>⛶ DISPLAY</button>
                {/* always shown — with no save the panel still offers IMPORT (bring a save TO this device) */}
                <button className={`${btnCls} w-full py-1.5`} onClick={() => { setSettingsOpen(false); setManageOpen(true); setConfirmMode(null); }}>MANAGE SAVE</button>
                <button className={`${btnCls} w-full py-1.5`} onClick={() => { setSettingsOpen(false); setCreditsOpen(true); }}>CREDITS</button>
              </div>
            </div>
          </div>
        )}

        {/* Credits */}
        {screen === 'title' && creditsOpen && (
          <div data-navroot className={`${isCoarse ? 'fixed' : 'absolute'} inset-0 z-[60] bg-black/85 flex items-center justify-center p-3 sm:p-4`}>
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
          <div data-navroot className={`${isCoarse ? 'fixed' : 'absolute'} inset-0 z-[60] bg-black/85 flex items-center justify-center p-3 sm:p-4`}>
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
          <div data-navroot className={`${isCoarse ? 'fixed' : 'absolute'} inset-0 z-[60] bg-black/85 flex items-center justify-center p-3 sm:p-4`}>
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
          <div data-navroot className={`${isCoarse ? 'fixed' : 'absolute'} inset-0 z-[60] bg-black/80 flex items-center justify-center p-3 sm:p-4`}>
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
                      <button
                        className={`${btnCls} w-full py-1.5`}
                        onClick={() => { setExportCode(exportSaveCode(saved)); setImportOpen(false); setImportMsg(null); }}
                      >📤 EXPORT SAVE CODE</button>
                      {exportCode && (<>
                        <textarea
                          readOnly
                          value={exportCode}
                          rows={3}
                          onFocus={e => e.currentTarget.select()}
                          onClick={e => e.currentTarget.select()}
                          className="w-full bg-black/60 border border-[#ffd24a]/40 rounded px-2 py-1 text-xs text-[#e8e0d0] outline-none"
                        />
                        <p className="text-xs opacity-50 leading-snug">Tap the code to select it, then copy. Paste it into IMPORT on the other device.</p>
                      </>)}
                      <button className="border border-red-400/60 text-red-300 px-3 py-1.5 w-full font-pixel text-lg hover:bg-red-500 hover:text-black transition-colors" onClick={() => setConfirmMode('delete')}>DELETE SAVE</button>
                      <p className="text-sm opacity-60 text-center mt-1">Deleting returns you to the title — start a fresh game from there.</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center">
                  <p className="text-base opacity-70 mb-3">No save on this device — start a new game, or paste a save code from another device below.</p>
                </div>
              )}

              {/* IMPORT works with or without an existing save (bring a save TO this device). */}
              {confirmMode !== 'delete' && (
                <div className="flex flex-col gap-2 mt-2">
                  <button
                    className={`${btnCls} w-full py-1.5`}
                    onClick={() => { setImportOpen(v => !v); setImportMsg(null); setImportOk(false); }}
                  >📥 IMPORT SAVE CODE</button>
                  {importOpen && (<>
                    <textarea
                      value={importCode}
                      onChange={e => setImportCode(e.target.value)}
                      rows={3}
                      placeholder="paste a save code…"
                      className="w-full bg-black/60 border border-[#9fc4e8]/40 rounded px-2 py-1 text-xs text-[#e8e0d0] outline-none focus:border-[#9fc4e8]"
                    />
                    <button
                      className={`${btnCls} w-full py-1.5 disabled:opacity-30`}
                      disabled={importCode.trim().length === 0}
                      onClick={doImportSave}
                    >LOAD THIS SAVE</button>
                    <p className="text-xs opacity-50 leading-snug">Importing replaces the save on THIS device.</p>
                  </>)}
                  {importMsg && <p className={`text-sm leading-snug ${importOk ? 'text-[#7ce8a0]' : 'text-[#ff9c7a]'}`}>{importMsg}</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {/* dialogue — typewriter reveal + optional Stardew-style portrait */}
        {overlay?.type === 'dialog' && (() => {
          const line = overlay.lines[overlay.idx] ?? '';
          const shown = line.slice(0, typed);
          const done = typed >= line.length;
          const imgSrc = overlay.speaker ? PORTRAIT_IMAGES[overlay.speaker] : undefined;
          const hasDrawPortrait = Boolean(overlay.speaker && PORTRAITS[overlay.speaker]);
          const hasPortrait = Boolean(imgSrc) || hasDrawPortrait;
          // Trailing actions (e.g. "🎁 Give a gift") only show on the final line,
          // once it's fully typed. The box then acts as a navroot menu.
          const showActions = overlay.idx === overlay.lines.length - 1 && done
            && !!overlay.actions && overlay.actions.length > 0;
          const acts = overlay.actions;
          return (
            <div
              {...(showActions ? { 'data-navroot': '' } : {})}
              className={`absolute inset-x-2 bottom-2 ${showActions ? '' : 'cursor-pointer'}`}
              onClick={showActions ? undefined : advanceDialog}
            >
              <div className="flex items-end gap-2">
                {hasPortrait && (
                  imgSrc
                    ? <img src={imgSrc} alt={overlay.speaker} className="w-[8.75rem] h-[8.75rem] sm:w-[11.25rem] sm:h-[11.25rem] shrink-0 self-end" style={{ imageRendering: 'pixelated' }} />
                    : <div className={`${panelCls} p-1 shrink-0 self-end`}>
                        <DialogPortrait speaker={overlay.speaker!} />
                      </div>
                )}
                <div className={`${panelCls} px-4 py-2.5 flex-grow min-w-0`}>
                  {overlay.speaker && !imgSrc && <p className="text-[#ffd24a] text-base mb-0.5">{overlay.speaker}</p>}
                  <p className="text-xl leading-snug">{shown}<span className="opacity-0">{line.slice(typed)}</span></p>
                  {showActions && acts ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {/* Done is first so it's the default-focused / primary action:
                          a normal E/A press just ends the chat. Move over to the
                          gift/buy buttons to pick those. */}
                      <button className={`${btnCls} text-base py-1`} onClick={() => setOverlayBoth(null)}>Done</button>
                      {acts.map((a, i) => (
                        <button key={i} className={`${btnCls} text-base py-1`} onClick={a.onPick}>{a.label}</button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-right text-sm opacity-40 mt-1">{overlay.idx + 1}/{overlay.lines.length} · {done ? 'E ▸' : '…'}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

        {/* shops */}
        {overlay?.type === 'shop' && (
          <div data-navroot className="absolute inset-0 bg-black/72 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4">
            {renderShop(overlay)}
          </div>
        )}

        {/* home kitchen */}
        {overlay?.type === 'cook' && (
          <div data-navroot className="absolute inset-0 bg-black/72 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4">
            {renderCook()}
          </div>
        )}

        {/* gift an NPC */}
        {overlay?.type === 'gift' && (
          <div data-navroot className="absolute inset-0 bg-black/72 backdrop-blur-[2px] flex items-center justify-center p-2 sm:p-4">
            {renderGift(overlay)}
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
          const sv = saveRef.current;
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
                  {/* Only surface a stat once that system is in play — a day-1 recap
                      shouldn't spoil mining/fishing/shifts you haven't discovered yet. */}
                  {(sv.canFish || r.fish > 0) && row('Fish caught', `${r.fish}`)}
                  {(sv.backroomsUnlocked || r.minerals > 0) && row('Minerals mined', `${r.minerals}`)}
                  {(sv.shiftsWorked > 0 || r.shifts > 0) && row('Shifts worked', `${r.shifts}`)}
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
              <p className="text-[#ffd24a] text-lg leading-tight">{achToast.icon ?? '🏆'} {achToast.title}</p>
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
          <div data-navroot className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center gap-2 p-2 sm:p-4">
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
          const ownedRugs = DECOR.filter(d => d.kind === 'rug' && ownsDecor(s, d.id));
          const styleItems = DECOR.filter(d => (d.kind === 'wall' || d.kind === 'floor') && ownsDecor(s, d.id));
          const shopItems = DECOR.filter(d => !ownsDecor(s, d.id) && d.price > 0);
          const tabCls = (t: typeof arrangeTab) => `font-pixel text-xs px-2 py-1 rounded-t ${arrangeTab === t ? 'bg-[#ffd24a] text-black' : 'bg-black/40 text-[#e8e0d0]/70'}`;
          const swatch = (d: typeof DECOR[number], active: boolean, action: 'apply' | 'buy') => (
            <div
              key={d.id}
              {...(action === 'apply' ? { 'data-apply-decor': d.id } : { 'data-buy-decor': d.id })}
              className={`shrink-0 w-[72px] flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-md border cursor-pointer ${active ? 'border-[#7ce8a0] bg-[#7ce8a0]/10' : 'border-[#ffd24a]/40 bg-[#16181d]/90'}`}
            >
              {d.sprite
                ? <SpriteIcon atlas={atlasRef.current} sprite={d.sprite} size={d.kind === 'rug' ? 34 : 30} />
                : <span className="w-[30px] h-[30px] flex items-center justify-center text-xl">🚪</span>}
              <span className="font-pixel text-[#e8e0d0] text-[9px] leading-tight text-center line-clamp-1">{d.name}</span>
              {action === 'buy' && <span className="font-pixel text-[#ffd24a] text-[9px]">¥{d.price.toLocaleString()}</span>}
            </div>
          );
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

              {/* bottom panel: tabs + the active tray (furniture / rugs / style / shop) */}
              <div data-zz-ui className="absolute bottom-0 inset-x-0 bg-black/70 border-t border-[#ffd24a]/30">
                {/* tab row */}
                <div className="flex gap-1 px-3 pt-1">
                  <button data-zz-ui data-arrange-tab="furniture" className={tabCls('furniture')}>🛋 Furniture</button>
                  <button data-zz-ui data-arrange-tab="rugs" className={tabCls('rugs')}>🟥 Rugs</button>
                  <button data-zz-ui data-arrange-tab="style" className={tabCls('style')}>🎨 Style</button>
                  <button data-zz-ui data-arrange-tab="shop" className={tabCls('shop')}>🛒 Shop <span className="opacity-70">¥{s.money.toLocaleString()}</span></button>
                </div>
                <div className="flex items-end gap-2 px-3 pb-2 pt-1">
                  <div className="flex-1 flex gap-2 overflow-x-auto pb-1 min-h-[78px]">
                    {arrangeTab === 'furniture' && (boxed.length === 0
                      ? <span className="font-pixel text-[#e8e0d0]/50 text-sm py-6">No furniture in boxes. Buy some, or order from ZamaZonk.</span>
                      : boxed.map(id => (
                          <div key={id} data-zz-item={id}
                            className={`shrink-0 w-[68px] flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-md border bg-[#16181d]/90 cursor-grab active:cursor-grabbing ${held?.id === id && !held.rug ? 'border-[#7ce8a0] opacity-40' : 'border-[#ffd24a]/40'}`}>
                            <SpriteIcon atlas={atlasRef.current} sprite={furnitureById(id).sprite} size={30} />
                            <span className="font-pixel text-[#e8e0d0] text-[10px] leading-tight text-center line-clamp-1">{furnitureById(id).name}</span>
                          </div>
                        )))}
                    {arrangeTab === 'rugs' && (ownedRugs.length === 0
                      ? <span className="font-pixel text-[#e8e0d0]/50 text-sm py-6">No rugs yet. Buy one in the 🛒 Shop tab.</span>
                      : ownedRugs.map(d => (
                          <div key={d.id} data-rug-item={d.id}
                            className={`shrink-0 w-[72px] flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-md border bg-[#16181d]/90 cursor-grab active:cursor-grabbing ${held?.id === d.id && held.rug ? 'border-[#7ce8a0] opacity-40' : 'border-[#ffd24a]/40'}`}>
                            <SpriteIcon atlas={atlasRef.current} sprite={d.sprite} size={36} />
                            <span className="font-pixel text-[#e8e0d0] text-[9px] leading-tight text-center line-clamp-1">{d.name}</span>
                          </div>
                        )))}
                    {arrangeTab === 'style' && styleItems.map(d =>
                      swatch(d, s.decor[d.kind as 'wall' | 'floor'] === d.id, 'apply'))}
                    {arrangeTab === 'shop' && (shopItems.length === 0
                      ? <span className="font-pixel text-[#e8e0d0]/50 text-sm py-6">You own every style going. The room is fully you.</span>
                      : shopItems.map(d => swatch(d, false, 'buy')))}
                  </div>
                  <div data-zz-trash
                    className={`shrink-0 w-16 h-16 flex flex-col items-center justify-center rounded-md border-2 border-dashed ${held ? 'border-[#e0552e] text-[#e0552e] bg-[#e0552e]/10' : 'border-white/25 text-white/40'}`}>
                    <span className="text-2xl leading-none">🗑</span>
                    <span className="font-pixel text-[9px]">{held?.rug ? 'remove' : 'box it'}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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

      {/* Adaptive control hint: swaps to match the device the player last used.
          Shown only on the menus a controller/keyboard navigates (title + shops
          + phone); the pointer needs no prompt. */}
      {inputSource !== 'pointer' &&
        (screen === 'title' || overlay?.type === 'shop' || overlay?.type === 'menu') && (
          <div className="pointer-events-none fixed bottom-2 left-1/2 -translate-x-1/2 z-[70] font-pixel text-sm sm:text-base text-[#e8e0d0] bg-black/70 border border-[#e8e0d0]/30 rounded px-3 py-1 shadow-[2px_2px_0_#000]">
            {inputSource === 'gamepad'
              ? 'Ⓐ Select · Ⓑ Back · ↕ Move'
              : 'Enter Select · Esc Back · ↑↓ Move'}
          </div>
        )}

      {screen === 'playing' && !isCoarse && (
        <p className="font-pixel text-[#e8e0d0]/40 text-base px-1 py-1">WASD / arrows move · E or Space interact · hold E to reel · P or Q phone · Esc close · 🎮 controller supported</p>
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
  <div className={`${panelCls} w-full max-w-lg max-h-full overflow-y-auto px-4 pt-3 pb-3.5`}>
    {/* header: title block on the left, a wallet pill + round close on the right */}
    <div className="flex items-start gap-3 pb-2 mb-2.5 border-b border-[#ffd24a]/25">
      <div className="min-w-0 flex-grow">
        <h3 className="font-retro text-[#ffd24a] text-sm sm:text-base leading-snug drop-shadow-[1px_1px_0_rgba(0,0,0,0.6)]">{title}</h3>
        {subtitle && <p className="text-sm opacity-55 leading-snug mt-1">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="inline-flex items-center gap-1 rounded-full bg-black/40 border border-[#ffd24a]/30 px-2.5 py-1 text-[#ffd24a] text-base leading-none tabular-nums">
          <span className="text-[#ffe9a0]">¥</span>{money.toLocaleString()}
        </span>
        <button
          aria-label="Close"
          className="w-7 h-7 shrink-0 rounded-full border border-[#ffd24a]/40 text-[#ffd24a]/80 hover:bg-[#ffd24a] hover:text-black active:translate-y-px transition-all flex items-center justify-center text-sm leading-none"
          onClick={onClose}
        >✕</button>
      </div>
    </div>
    {children}
  </div>
);

export default LittleApartmentGame;
