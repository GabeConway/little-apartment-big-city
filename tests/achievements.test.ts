// Achievement-table integrity. The GAME_ACHIEVEMENTS catalog (data.ts) and the
// award('<id>') call sites in the monolith drift independently — a typo'd id at
// an award site silently no-ops (unlockGameAch rejects unknown ids), and a table
// row with no call site is an unearnable trophy. These tests pin both directions
// by scanning the monolith source for award() literals.
import { describe, it, expect } from 'vitest';
import { GAME_ACHIEVEMENTS } from '../src/game/data';
// Vite `?raw` import (typed by vite/client): the monolith SOURCE as a string —
// no @types/node needed, and vitest resolves it through the same pipeline.
import monolith from '../src/game/LittleApartmentGame.tsx?raw';
const awarded = new Set(
  [...monolith.matchAll(/\baward\('([^']+)'\)/g)].map(m => m[1]));
const tableIds = GAME_ACHIEVEMENTS.map(a => a.id);

describe('GAME_ACHIEVEMENTS table', () => {
  it('holds 50 achievements with unique ids', () => {
    expect(tableIds.length).toBe(50);
    expect(new Set(tableIds).size).toBe(50);
  });

  it('every row has a title, desc, and a locked hint', () => {
    for (const a of GAME_ACHIEVEMENTS) {
      expect(a.title.length, a.id).toBeGreaterThan(0);
      expect(a.desc.length, a.id).toBeGreaterThan(0);
      expect(a.hint.length, a.id).toBeGreaterThan(0);
    }
  });
});

describe('award() call sites ↔ table', () => {
  it('found award() literals to check (regex still matches the code)', () => {
    expect(awarded.size).toBeGreaterThan(0);
  });

  it('every id passed to award() exists in the table (no silent no-ops)', () => {
    for (const id of awarded) expect(tableIds, `award('${id}')`).toContain(id);
  });

  it('every table id is awarded somewhere (no unearnable trophies)', () => {
    for (const id of tableIds) expect([...awarded], id).toContain(id);
  });
});
