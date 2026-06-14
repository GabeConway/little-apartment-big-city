// Little Apartment, Big City — core engine: types, input, collision, camera.
// No deps. Logical pixels; the canvas is upscaled in CSS with image-rendering: pixelated.

export const TILE = 16;
export const VIEW_W = 24; // tiles
export const VIEW_H = 14; // tiles
export const VIEW_PW = VIEW_W * TILE; // 384
export const VIEW_PH = VIEW_H * TILE; // 224

export type Dir = 'up' | 'down' | 'left' | 'right';

export interface Vec { x: number; y: number }

export interface TileDef {
  sprite: string;   // key into the sprite atlas
  solid?: boolean;
}

export interface Warp {
  x: number; y: number;          // tile coords in this scene
  to: string;                    // target scene id
  tx: number; ty: number;        // target tile coords (player feet)
  dir: Dir;                      // facing after warp
}

export interface Interactable {
  id: string;                    // handled by the game (e.g. 'shop-denden', 'fish-spot', 'bed')
  x: number; y: number;          // tile coords
  w?: number; h?: number;        // tile extent (default 1x1)
  label: string;                 // shown in the "press E" prompt
}

export interface NpcDef {
  id: string;
  x: number; y: number;          // tile coords (npc stands here, solid)
  sprite: string;
  dir: Dir;
}

export interface SceneDef {
  id: string;
  name: string;                  // shown in HUD
  grid: string[];                // rows of legend chars; all rows equal length
  legend: Record<string, TileDef>;
  warps: Warp[];
  interactables: Interactable[];
  npcs: NpcDef[];
  outdoor?: boolean;
}

export const sceneSize = (s: SceneDef): Vec => ({ x: s.grid[0].length, y: s.grid.length });

export const tileAt = (s: SceneDef, tx: number, ty: number): TileDef | undefined => {
  const row = s.grid[ty];
  if (!row) return undefined;
  return s.legend[row[tx]];
};

export const isSolid = (s: SceneDef, tx: number, ty: number, extraSolids: Set<string>): boolean => {
  const size = sceneSize(s);
  if (tx < 0 || ty < 0 || tx >= size.x || ty >= size.y) return true;
  const t = tileAt(s, tx, ty);
  if (!t || t.solid) return true;
  if (extraSolids.has(`${tx},${ty}`)) return true;
  return false;
};

// Player hitbox: feet-anchored. px/py = top-left of the 16x16 sprite.
// Hitbox covers the lower body so the head can overlap walls behind (top-down depth feel).
const HB_X = 3, HB_Y = 9, HB_W = 10, HB_H = 6;

const boxBlocked = (s: SceneDef, px: number, py: number, extraSolids: Set<string>): boolean => {
  const x0 = px + HB_X, y0 = py + HB_Y;
  const x1 = x0 + HB_W - 1, y1 = y0 + HB_H - 1;
  const tx0 = Math.floor(x0 / TILE), ty0 = Math.floor(y0 / TILE);
  const tx1 = Math.floor(x1 / TILE), ty1 = Math.floor(y1 / TILE);
  for (let ty = ty0; ty <= ty1; ty++) {
    for (let tx = tx0; tx <= tx1; tx++) {
      if (isSolid(s, tx, ty, extraSolids)) return true;
    }
  }
  return false;
};

// Move with axis separation so the player slides along walls.
export const tryMove = (
  s: SceneDef, pos: Vec, dx: number, dy: number, extraSolids: Set<string>
): Vec => {
  let nx = pos.x, ny = pos.y;
  if (dx !== 0 && !boxBlocked(s, pos.x + dx, ny, extraSolids)) nx = pos.x + dx;
  if (dy !== 0 && !boxBlocked(s, nx, pos.y + dy, extraSolids)) ny = pos.y + dy;
  return { x: nx, y: ny };
};

// Tile the player's feet occupy (for warps) and the tile faced (for interactions).
export const feetTile = (pos: Vec): Vec => ({
  x: Math.floor((pos.x + HB_X + HB_W / 2) / TILE),
  y: Math.floor((pos.y + HB_Y + HB_H / 2) / TILE),
});

export const facedTile = (pos: Vec, dir: Dir): Vec => {
  const f = feetTile(pos);
  switch (dir) {
    case 'up': return { x: f.x, y: f.y - 1 };
    case 'down': return { x: f.x, y: f.y + 1 };
    case 'left': return { x: f.x - 1, y: f.y };
    case 'right': return { x: f.x + 1, y: f.y };
  }
};

export const cameraFor = (s: SceneDef, player: Vec): Vec => {
  const size = sceneSize(s);
  const mw = size.x * TILE, mh = size.y * TILE;
  let cx = Math.round(player.x + TILE / 2 - VIEW_PW / 2);
  let cy = Math.round(player.y + TILE / 2 - VIEW_PH / 2);
  cx = Math.max(0, Math.min(cx, mw - VIEW_PW));
  cy = Math.max(0, Math.min(cy, mh - VIEW_PH));
  if (mw <= VIEW_PW) cx = Math.floor((mw - VIEW_PW) / 2);
  if (mh <= VIEW_PH) cy = Math.floor((mh - VIEW_PH) / 2);
  return { x: cx, y: cy };
};

// ---- Input ------------------------------------------------------------

const MOVE_KEYS: Record<string, Dir> = {
  arrowup: 'up', w: 'up',
  arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left',
  arrowright: 'right', d: 'right',
};

export class Input {
  private held = new Set<Dir>();
  private order: Dir[] = [];      // most recent direction wins
  private interactQueued = false;
  private cancelQueued = false;
  private inventoryQueued = false;
  actionHeld = false;             // used by the fishing minigame

  readonly onKeyDown = (e: KeyboardEvent) => {
    // Don't steal keys from real text fields (e.g. the site's hidden CLI)
    const tag = (e.target as HTMLElement | null)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key.toLowerCase();
    const dir = MOVE_KEYS[k];
    if (dir) {
      e.preventDefault();
      if (!this.held.has(dir)) { this.held.add(dir); this.order.push(dir); }
      return;
    }
    if (k === 'e' || k === ' ' || k === 'enter') {
      e.preventDefault();
      if (!e.repeat) this.interactQueued = true;
      this.actionHeld = true;
    }
    if (k === 'escape') { this.cancelQueued = true; }
    if (k === 'i' && !e.repeat) { this.inventoryQueued = true; }
  };

  readonly onKeyUp = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    const dir = MOVE_KEYS[k];
    if (dir) {
      this.held.delete(dir);
      this.order = this.order.filter(d => d !== dir);
    }
    if (k === 'e' || k === ' ' || k === 'enter') this.actionHeld = false;
  };

  // Virtual controls (touch D-pad / action button)
  setVirtualDir(dir: Dir, down: boolean) {
    if (down) {
      if (!this.held.has(dir)) { this.held.add(dir); this.order.push(dir); }
    } else {
      this.held.delete(dir);
      this.order = this.order.filter(d => d !== dir);
    }
  }
  pressVirtualAction(down: boolean) {
    if (down && !this.actionHeld) this.interactQueued = true;
    this.actionHeld = down;
  }
  queueCancel() { this.cancelQueued = true; }

  currentDir(): Dir | null {
    return this.order.length ? this.order[this.order.length - 1] : null;
  }
  consumeInteract(): boolean {
    const v = this.interactQueued; this.interactQueued = false; return v;
  }
  consumeCancel(): boolean {
    const v = this.cancelQueued; this.cancelQueued = false; return v;
  }
  consumeInventory(): boolean {
    const v = this.inventoryQueued; this.inventoryQueued = false; return v;
  }
  queueInventory() { this.inventoryQueued = true; }
  clear() {
    this.held.clear(); this.order = [];
    this.interactQueued = false; this.cancelQueued = false; this.inventoryQueued = false;
    this.actionHeld = false;
  }
}

// ---- Loop -------------------------------------------------------------

// Fixed-timestep update + render-per-frame. Returns a stop function.
export const startLoop = (update: (dt: number) => void, render: (t: number) => void): (() => void) => {
  const STEP = 1 / 60;
  let last = performance.now();
  let acc = 0;
  let raf = 0;
  let running = true;
  const frame = (now: number) => {
    if (!running) return;
    acc += Math.min((now - last) / 1000, 0.25);
    last = now;
    while (acc >= STEP) { update(STEP); acc -= STEP; }
    render(now / 1000);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => { running = false; cancelAnimationFrame(raf); };
};

// Deterministic PRNG for daily pawn-shop stock (seeded by day number).
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
