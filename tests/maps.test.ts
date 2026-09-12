import { describe, it, expect } from 'vitest';
import {
  SCENES, APARTMENT_BIG_GRID, APARTMENT_SLOTS, RARE_SLOTS,
  MANEKI_SLOT, SHELF_SLOT, HOME_ONSEN_TILE,
} from '../src/game/maps';

// The apartment's fixed tiles (onsen, maneki, trophy shelf) are declared apart
// from the furniture slot table but have to stay clear of it. That split is
// exactly how the onsen ended up on the fridge's tile — the constant lived in
// LittleApartmentGame.tsx and nobody cross-checked maps.ts's row-1 appliances.
// These tests are the cross-check.

// SCENES.apartment.grid is the small (one-room) layout at module load; the
// room-expansion swap to APARTMENT_BIG_GRID happens at runtime.
const SMALL_GRID = SCENES.apartment.grid;

const cellAt = (grid: string[], x: number, y: number) => grid[y]?.[x];
const isFloor = (grid: string[], x: number, y: number) => cellAt(grid, x, y) === '.';

describe('apartment fixed tiles vs the furniture slot table', () => {
  it('puts the home onsen on floor in BOTH the small and the expanded grid', () => {
    const { x, y } = HOME_ONSEN_TILE;
    expect(isFloor(SMALL_GRID, x, y)).toBe(true);
    expect(isFloor(APARTMENT_BIG_GRID, x, y)).toBe(true);
  });

  it('keeps the home onsen off every default furniture slot', () => {
    const { x, y } = HOME_ONSEN_TILE;
    for (const slot of [...APARTMENT_SLOTS, ...RARE_SLOTS]) {
      for (let dx = 0; dx < slot.w; dx++) {
        // The regression: HOME_ONSEN_TILE was { x: 13, y: 1 } === the fridge slot.
        expect(
          { id: slot.itemId, x: slot.x + dx, y: slot.y },
        ).not.toEqual({ id: slot.itemId, x, y });
      }
    }
  });

  it('keeps the home onsen off the maneki tile and the trophy shelf', () => {
    const { x, y } = HOME_ONSEN_TILE;
    expect([x, y]).not.toEqual([MANEKI_SLOT.x, MANEKI_SLOT.y]);
    for (let dx = 0; dx < SHELF_SLOT.w; dx++) {
      expect([x, y]).not.toEqual([SHELF_SLOT.x + dx, SHELF_SLOT.y]);
    }
  });

  it('leaves every default furniture slot on a tile that exists in the small grid', () => {
    for (const slot of APARTMENT_SLOTS) {
      for (let dx = 0; dx < slot.w; dx++) {
        expect(cellAt(SMALL_GRID, slot.x + dx, slot.y)).toBeDefined();
      }
    }
  });

  it('never double-books a default furniture slot tile', () => {
    const seen = new Map<string, string>();
    for (const slot of [...APARTMENT_SLOTS, ...RARE_SLOTS]) {
      for (let dx = 0; dx < slot.w; dx++) {
        const key = `${slot.x + dx},${slot.y}`;
        expect(seen.has(key) ? `${seen.get(key)} vs ${slot.itemId} @ ${key}` : null).toBeNull();
        seen.set(key, slot.itemId);
      }
    }
  });
});
