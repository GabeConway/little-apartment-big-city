// Little Apartment, Big City — reel minigame (Stardew-lite).
// A catch zone rises while the action button is held and falls otherwise;
// keep the darting fish inside it until the progress bar fills.

import type { Fish } from './data';

export const ZONE_H = 0.28;          // catch-zone height (bar is 0..1)

export interface FishingState {
  fish: Fish;
  fishPos: number;       // 0 bottom .. 1 top
  fishTarget: number;
  retargetIn: number;    // seconds until the fish picks a new target
  zonePos: number;       // bottom edge of the catch zone
  zoneVel: number;
  progress: number;      // 0..1; start in the middle
  done: 'caught' | 'escaped' | null;
}

export const startFishing = (fish: Fish): FishingState => ({
  fish,
  fishPos: 0.5,
  fishTarget: 0.5,
  retargetIn: 0.5,
  zonePos: 0.36,
  zoneVel: 0,
  progress: 0.35,
  done: null,
});

export const updateFishing = (st: FishingState, dt: number, held: boolean): void => {
  if (st.done) return;
  const d = st.fish.difficulty;

  // Fish wanders: pick a new target every so often; harder fish jump farther, more often.
  st.retargetIn -= dt;
  if (st.retargetIn <= 0) {
    st.retargetIn = 0.9 - d * 0.55 + Math.random() * 0.5;
    const jump = 0.25 + d * 0.6;
    st.fishTarget = Math.min(1, Math.max(0, st.fishPos + (Math.random() * 2 - 1) * jump));
  }
  const chase = 1.2 + d * 2.2;
  st.fishPos += (st.fishTarget - st.fishPos) * Math.min(1, chase * dt);

  // Catch zone: thrust up while held, gravity down otherwise; soft bounce at the ends.
  const ACCEL = 2.6, GRAV = 2.0, MAXV = 1.4;
  st.zoneVel += (held ? ACCEL : -GRAV) * dt;
  st.zoneVel = Math.max(-MAXV, Math.min(MAXV, st.zoneVel));
  st.zonePos += st.zoneVel * dt;
  if (st.zonePos < 0) { st.zonePos = 0; st.zoneVel *= -0.25; }
  if (st.zonePos > 1 - ZONE_H) { st.zonePos = 1 - ZONE_H; st.zoneVel *= -0.25; }

  const inZone = st.fishPos >= st.zonePos && st.fishPos <= st.zonePos + ZONE_H;
  st.progress += (inZone ? 0.5 : -(0.28 + d * 0.12)) * dt;

  if (st.progress >= 1) { st.progress = 1; st.done = 'caught'; }
  else if (st.progress <= 0) { st.progress = 0; st.done = 'escaped'; }
};
