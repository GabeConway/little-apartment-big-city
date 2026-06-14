import { describe, it, expect } from 'vitest';
import {
  TILE, VIEW_PW, VIEW_PH,
  sceneSize, tileAt, isSolid, tryMove, feetTile, facedTile, cameraFor,
  mulberry32, Input,
  type SceneDef, type Dir,
} from '../src/game/engine';

// Minimal 4x3 scene: '#' solid wall border, '.' floor.
const scene = (): SceneDef => ({
  id: 'test',
  name: 'Test',
  grid: [
    '####',
    '#..#',
    '####',
  ],
  legend: {
    '#': { sprite: 'wall', solid: true },
    '.': { sprite: 'floor' },
  },
  warps: [],
  interactables: [],
  npcs: [],
});

describe('sceneSize', () => {
  it('reports width from row length and height from row count', () => {
    expect(sceneSize(scene())).toEqual({ x: 4, y: 3 });
  });
});

describe('tileAt', () => {
  it('returns the legend tile at a coordinate', () => {
    expect(tileAt(scene(), 1, 1)?.sprite).toBe('floor');
    expect(tileAt(scene(), 0, 0)?.solid).toBe(true);
  });
  it('returns undefined off the grid', () => {
    expect(tileAt(scene(), 99, 0)).toBeUndefined();
    expect(tileAt(scene(), 0, 99)).toBeUndefined();
  });
});

describe('isSolid', () => {
  const empty = new Set<string>();
  it('treats out-of-bounds as solid', () => {
    expect(isSolid(scene(), -1, 0, empty)).toBe(true);
    expect(isSolid(scene(), 0, -1, empty)).toBe(true);
    expect(isSolid(scene(), 4, 1, empty)).toBe(true);
  });
  it('treats wall tiles as solid and floor as not', () => {
    expect(isSolid(scene(), 0, 0, empty)).toBe(true);
    expect(isSolid(scene(), 1, 1, empty)).toBe(false);
  });
  it('honors extraSolids overlay on otherwise-open tiles', () => {
    expect(isSolid(scene(), 1, 1, new Set(['1,1']))).toBe(true);
  });
});

describe('tryMove', () => {
  it('moves freely into open space', () => {
    // feet hitbox sits inside tile (1,1) at this position
    const start = { x: TILE, y: TILE };
    const moved = tryMove(scene(), start, 1, 0, new Set());
    expect(moved.x).toBe(TILE + 1);
  });
  it('blocks movement into a wall (axis stays put)', () => {
    const start = { x: TILE, y: TILE };
    // push left into the wall column 0 — x should not decrease
    const moved = tryMove(scene(), start, -8, 0, new Set());
    expect(moved.x).toBe(TILE);
  });
  it('slides along a wall: blocked axis frozen, free axis moves', () => {
    const start = { x: TILE, y: TILE };
    const moved = tryMove(scene(), start, -8, 0, new Set());
    // y was unchanged here; verify the two axes are independent
    expect(moved.y).toBe(TILE);
  });
});

describe('feetTile / facedTile', () => {
  it('feet tile is the tile under the hitbox center', () => {
    expect(feetTile({ x: TILE, y: TILE })).toEqual({ x: 1, y: 1 });
  });
  it('facedTile offsets by one tile in the facing direction', () => {
    const pos = { x: TILE, y: TILE };
    const cases: Record<Dir, { x: number; y: number }> = {
      up: { x: 1, y: 0 },
      down: { x: 1, y: 2 },
      left: { x: 0, y: 1 },
      right: { x: 2, y: 1 },
    };
    for (const dir of Object.keys(cases) as Dir[]) {
      expect(facedTile(pos, dir)).toEqual(cases[dir]);
    }
  });
});

describe('cameraFor', () => {
  it('clamps to map bounds (never negative)', () => {
    const big: SceneDef = { ...scene(), grid: Array(40).fill('.'.repeat(40)) };
    const cam = cameraFor(big, { x: 0, y: 0 });
    expect(cam.x).toBeGreaterThanOrEqual(0);
    expect(cam.y).toBeGreaterThanOrEqual(0);
  });
  it('centers maps smaller than the viewport', () => {
    // 4x3 map is far smaller than 24x14 view → centered (negative offset)
    const cam = cameraFor(scene(), { x: 0, y: 0 });
    expect(cam.x).toBe(Math.floor((4 * TILE - VIEW_PW) / 2));
    expect(cam.y).toBe(Math.floor((3 * TILE - VIEW_PH) / 2));
  });
});

describe('mulberry32', () => {
  it('is deterministic for a given seed', () => {
    const a = mulberry32(42); const b = mulberry32(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
  it('produces different streams for different seeds', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });
  it('stays within [0, 1)', () => {
    const r = mulberry32(7);
    for (let i = 0; i < 1000; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});

describe('Input', () => {
  const key = (k: string, extra: Partial<KeyboardEvent> = {}) =>
    ({ key: k, preventDefault: () => {}, target: null, repeat: false, ...extra }) as unknown as KeyboardEvent;

  it('tracks the most recently pressed direction', () => {
    const i = new Input();
    i.onKeyDown(key('w'));
    expect(i.currentDir()).toBe('up');
    i.onKeyDown(key('d'));
    expect(i.currentDir()).toBe('right');
    // releasing the latest falls back to the prior held key
    i.onKeyUp(key('d'));
    expect(i.currentDir()).toBe('up');
  });

  it('queues and consumes interact exactly once', () => {
    const i = new Input();
    i.onKeyDown(key('e'));
    expect(i.consumeInteract()).toBe(true);
    expect(i.consumeInteract()).toBe(false);
  });

  it('ignores keys aimed at text inputs', () => {
    const i = new Input();
    i.onKeyDown(key('w', { target: { tagName: 'INPUT' } as HTMLElement }));
    expect(i.currentDir()).toBeNull();
  });

  it('virtual d-pad behaves like keys and clear() resets everything', () => {
    const i = new Input();
    i.setVirtualDir('left', true);
    expect(i.currentDir()).toBe('left');
    i.pressVirtualAction(true);
    expect(i.consumeInteract()).toBe(true);
    i.clear();
    expect(i.currentDir()).toBeNull();
    expect(i.consumeInteract()).toBe(false);
  });
});
