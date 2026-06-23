// Little Apartment, Big City — reel minigame (Stardew-lite, overhauled).
// A deeper fight: keep the darting, LUNGING fish inside a catch zone while the
// landing meter fills. The fish has STAMINA (it tires the longer you keep it
// pinned, so a long fight slowly turns in your favor) and you build TENSION when
// it slips out while you're reeling under load. A better ROD widens the catch
// zone, reels faster, and keeps the fish from lunging as wildly.
//
// Deterministic given a fixed Math.random (the unit tests freeze it), so the
// classic field names + behaviors are preserved: progress fills in-zone, drains
// out-of-zone, and the zone clamps to [0, 1 - zoneH].

import type { Fish } from './data';

export const ZONE_H = 0.28;          // base catch-zone height (rod tier 0)

// Rod tiers — how the gear changes the fight. Index = rod tier on the save.
//   zoneH = catch-zone height, reel = landing-meter fill multiplier,
//   calm  = lunge-frequency multiplier (>1 = rarer hard darts).
export interface RodTier { tier: number; zoneH: number; reel: number; calm: number }
export const ROD_TIERS: RodTier[] = [
  { tier: 0, zoneH: 0.28, reel: 1.0,  calm: 1.0 },  // Genji's starter bamboo
  { tier: 1, zoneH: 0.37, reel: 1.35, calm: 1.6 },  // upgraded carbon rod
];
export const rodTier = (t: number): RodTier =>
  ROD_TIERS[Math.max(0, Math.min(ROD_TIERS.length - 1, t))];

export interface FishingState {
  fish: Fish;
  rod: number;           // rod tier in play (gear effects)
  fishPos: number;       // 0 bottom .. 1 top
  fishTarget: number;
  retargetIn: number;    // seconds until the fish picks a new wander target
  zonePos: number;       // bottom edge of the catch zone
  zoneVel: number;
  zoneH: number;         // catch-zone height for this fight (rod-dependent)
  progress: number;      // 0..1 landing meter; start in the middle
  stamina: number;       // 1..0 — the fish tires while pinned in the zone
  tension: number;       // 0..1 — rises when it slips out while you reel
  lungeT: number;        // countdown to the next hard dart
  lunging: number;       // remaining lunge time (fish darts fast + far)
  done: 'caught' | 'escaped' | null;
}

export const startFishing = (fish: Fish, rod = 0): FishingState => {
  const r = rodTier(rod);
  return {
    fish,
    rod,
    fishPos: 0.5,
    fishTarget: 0.5,
    retargetIn: 0.5,
    zonePos: 0.5 - r.zoneH / 2,
    zoneVel: 0,
    zoneH: r.zoneH,
    progress: 0.35,
    stamina: 1,
    tension: 0,
    lungeT: 1.4 + fish.difficulty, // first hard dart comes a beat in
    lunging: 0,
    done: null,
  };
};

export const updateFishing = (st: FishingState, dt: number, held: boolean): void => {
  if (st.done) return;
  const d = st.fish.difficulty;
  const r = rodTier(st.rod);

  // ---- fish movement: lazy wander, punctuated by hard lunges ----------------
  st.lungeT -= dt;
  if (st.lunging > 0) {
    st.lunging -= dt;
  } else if (st.lungeT <= 0) {
    // A sudden dart toward an extreme; harder fish lunge more often + farther,
    // a better rod (calm) spaces the darts out.
    st.lunging = 0.35 + d * 0.35;
    st.lungeT = (1.6 - d * 0.7 + Math.random() * 1.2) * r.calm;
    st.fishTarget = Math.random() < 0.5
      ? 0.02 + Math.random() * 0.15   // dive
      : 0.83 + Math.random() * 0.15;  // surface run
  }

  st.retargetIn -= dt;
  if (st.retargetIn <= 0) {
    st.retargetIn = 0.9 - d * 0.55 + Math.random() * 0.5;
    const jump = 0.25 + d * 0.6;
    st.fishTarget = Math.min(1, Math.max(0, st.fishPos + (Math.random() * 2 - 1) * jump));
  }
  // Lunging fish move fast; a tired (low-stamina) fish moves sluggishly.
  const chase = (st.lunging > 0 ? 3.0 + d * 3 : 1.2 + d * 2.2) * (0.5 + st.stamina * 0.5);
  st.fishPos += (st.fishTarget - st.fishPos) * Math.min(1, chase * dt);
  st.fishPos = Math.max(0, Math.min(1, st.fishPos));

  // ---- catch zone: thrust up while held, gravity down otherwise -------------
  const ACCEL = 2.6, GRAV = 2.0, MAXV = 1.4;
  st.zoneVel += (held ? ACCEL : -GRAV) * dt;
  st.zoneVel = Math.max(-MAXV, Math.min(MAXV, st.zoneVel));
  st.zonePos += st.zoneVel * dt;
  if (st.zonePos < 0) { st.zonePos = 0; st.zoneVel *= -0.25; }
  if (st.zonePos > 1 - st.zoneH) { st.zonePos = 1 - st.zoneH; st.zoneVel *= -0.25; }

  const inZone = st.fishPos >= st.zonePos && st.fishPos <= st.zonePos + st.zoneH;

  // ---- stamina + tension ----------------------------------------------------
  if (inZone) {
    st.stamina = Math.max(0, st.stamina - (0.16 + d * 0.12) * dt); // it tires when pinned
    st.tension = Math.max(0, st.tension - 1.4 * dt);
  } else {
    st.stamina = Math.min(1, st.stamina + 0.05 * dt);              // it catches its breath
    st.tension = held
      ? Math.min(1, st.tension + 0.7 * dt)                         // straining the line
      : Math.max(0, st.tension - 0.5 * dt);
  }

  // ---- landing meter --------------------------------------------------------
  // A tired fish reels in faster; a better rod reels faster still; high tension
  // costs you a touch extra the moment you lose the zone.
  const gain = (0.42 + (1 - st.stamina) * 0.5) * r.reel;
  const drain = 0.26 + d * 0.12 + st.tension * 0.15;
  st.progress += (inZone ? gain : -drain) * dt;

  if (st.progress >= 1) { st.progress = 1; st.done = 'caught'; }
  else if (st.progress <= 0) { st.progress = 0; st.done = 'escaped'; }
};
