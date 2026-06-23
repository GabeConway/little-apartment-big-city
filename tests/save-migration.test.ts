// Save-migration regression corpus. `loadSave` is a one-way door: a bad
// migration permanently corrupts a real player's apartment. These tests freeze
// known save blobs (v1 legacy, v2 current, garbage) and assert the loader
// upgrades / preserves / fails-safe exactly. RULE: bumping the save version
// REQUIRES adding an old-version fixture here plus a forward-migration assertion.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadSave, persistSave, clearSave, newSave } from '../src/game/state';

const KEY = 'lab-save';

// Minimal in-memory localStorage (node env has none). state.ts only uses
// getItem/setItem/removeItem.
function makeStorage() {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k)! : null),
    setItem: (k: string, v: string) => { map.set(k, String(v)); },
    removeItem: (k: string) => { map.delete(k); },
    clear: () => { map.clear(); },
  };
}

beforeEach(() => { vi.stubGlobal('localStorage', makeStorage()); });
afterEach(() => { vi.unstubAllGlobals(); });

const seed = (blob: string) => localStorage.setItem(KEY, blob);

describe('loadSave — no save present', () => {
  it('returns null when nothing is stored', () => {
    expect(loadSave()).toBeNull();
  });
});

describe('loadSave — v1 legacy migration (no version field)', () => {
  // v1 predates the placement system: items live in owned/rares with no `placed`
  // map and no `v`. The loader must auto-place them at the legacy fixed slots.
  const V1 = JSON.stringify({
    money: 5000, day: 4, owned: ['bed', 'tv', 'fridge'], rares: ['kotatsu'],
  });

  it('stamps the save as v2', () => {
    seed(V1);
    expect(loadSave()!.v).toBe(2);
  });

  it('auto-places owned base furniture at legacy slots', () => {
    seed(V1);
    const s = loadSave()!;
    expect(s.placed['bed']).toEqual({ x: 1, y: 1 });
    expect(s.placed['tv']).toEqual({ x: 6, y: 1 });
    expect(s.placed['fridge']).toEqual({ x: 13, y: 1 });
  });

  it('auto-places owned rare furniture at legacy rare slots', () => {
    seed(V1);
    expect(loadSave()!.placed['kotatsu']).toEqual({ x: 7, y: 5 });
  });

  it('does not invent placements for items the player never owned', () => {
    seed(V1);
    expect(loadSave()!.placed['sofa']).toBeUndefined();
  });

  it('backfills new-shape fields that v1 never had', () => {
    seed(V1);
    const s = loadSave()!;
    expect(s.messages).toEqual([]);
    expect(s.orders).toEqual([]);
    expect(s.today.startMoney).toBe(5000); // freshDayLog baselined to current money
  });
});

describe('loadSave — v2 current shape is preserved, not re-migrated', () => {
  // A v2 save may legitimately have owned items still boxed (placed empty).
  // The legacy auto-place must NOT fire, or boxed items teleport onto the floor.
  const V2_BOXED = JSON.stringify({
    ...newSave(), v: 2, owned: ['bed', 'tv'], placed: {},
  });

  it('keeps boxed items boxed (no legacy auto-place on v2)', () => {
    seed(V2_BOXED);
    const s = loadSave()!;
    expect(s.placed).toEqual({});
    expect(s.owned).toEqual(['bed', 'tv']);
  });

  it('round-trips a persisted save unchanged in the fields that matter', () => {
    const original = { ...newSave(), money: 99999, day: 12, hat: true, canFish: true };
    persistSave(original);
    const s = loadSave()!;
    expect(s.money).toBe(99999);
    expect(s.day).toBe(12);
    expect(s.hat).toBe(true);
    expect(s.v).toBe(2);
  });
});

describe('loadSave — grandfather fixups', () => {
  it('parks an owned car that has no recorded position', () => {
    seed(JSON.stringify({ ...newSave(), vehicles: ['car'], carPos: null, driving: false }));
    expect(loadSave()!.carPos).toEqual({ scene: 'badtown', x: 13, y: 8 });
  });

  it('grandfathers fishing for anyone who already has caught fish', () => {
    seed(JSON.stringify({ ...newSave(), canFish: false, fishInv: ['sardine'] }));
    expect(loadSave()!.canFish).toBe(true);
  });

  it('baselines today from money when an old save lacks the tally', () => {
    const blob = { ...newSave(), money: 4200 } as Record<string, unknown>;
    delete blob.today;
    seed(JSON.stringify(blob));
    expect(loadSave()!.today.startMoney).toBe(4200);
  });
});

describe('loadSave — fail safe on bad data', () => {
  it('returns null for a non-JSON blob instead of throwing', () => {
    seed('not json at all }{');
    expect(loadSave()).toBeNull();
  });

  it('returns null for truncated JSON', () => {
    seed('{"v":2,"money":300,');
    expect(loadSave()).toBeNull();
  });

  it('clearSave removes the blob so the next load starts fresh', () => {
    seed(JSON.stringify(newSave()));
    clearSave();
    expect(loadSave()).toBeNull();
  });
});
