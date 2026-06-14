import { describe, it, expect, vi, afterEach } from 'vitest';
import { startFishing, updateFishing, ZONE_H, type FishingState } from '../src/game/fishing';
import type { Fish } from '../src/game/data';

const fish = (difficulty = 0.3): Fish =>
  ({ id: 'test', name: 'Test Fish', value: 100, weight: 10, difficulty, sprite: 'fish-test' });

afterEach(() => vi.restoreAllMocks());

describe('startFishing', () => {
  it('initializes mid-bar, not yet resolved', () => {
    const st = startFishing(fish());
    expect(st.done).toBeNull();
    expect(st.progress).toBeGreaterThan(0);
    expect(st.progress).toBeLessThan(1);
    expect(st.fishPos).toBe(0.5);
  });
});

describe('updateFishing', () => {
  it('is a no-op once resolved', () => {
    const st = startFishing(fish());
    st.done = 'caught';
    const snapshot = { ...st };
    updateFishing(st, 0.1, true);
    expect(st).toEqual(snapshot);
  });

  it('fills progress while the fish sits inside the held zone', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5); // freeze the wander RNG
    const st: FishingState = {
      ...startFishing(fish()),
      fishPos: 0.5,
      fishTarget: 0.5,
      zonePos: 0.5 - ZONE_H / 2, // center the zone on the fish
      retargetIn: 999,           // never retarget during the test
    };
    const before = st.progress;
    for (let i = 0; i < 5; i++) updateFishing(st, 1 / 60, true);
    expect(st.progress).toBeGreaterThan(before);
  });

  it('drains progress and can escape when the fish is far from the zone', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const st: FishingState = {
      ...startFishing(fish()),
      fishPos: 0.95,
      fishTarget: 0.95,
      zonePos: 0,       // zone pinned at the bottom, fish at the top
      retargetIn: 999,
      progress: 0.05,
    };
    for (let i = 0; i < 60; i++) updateFishing(st, 1 / 60, false);
    expect(st.progress).toBe(0);
    expect(st.done).toBe('escaped');
  });

  it('keeps the catch zone within [0, 1 - ZONE_H]', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const st = startFishing(fish());
    st.retargetIn = 999;
    for (let i = 0; i < 600; i++) updateFishing(st, 1 / 60, true); // hold up forever
    expect(st.zonePos).toBeLessThanOrEqual(1 - ZONE_H + 1e-9);
    expect(st.zonePos).toBeGreaterThanOrEqual(0);
  });
});
