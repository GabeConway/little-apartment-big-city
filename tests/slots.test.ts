// The Kinryū slot machine's pay table.
//
// This file exists because the pay table was once accidentally +21.4% RTP: a pair
// landed on 47.2% of spins and paid 2× for it, which made the lever the single
// best yen-per-minute in the game and quietly obsoleted fishing, mining, farming
// and the delivery gig. The band below is the guard rail. If you retune the table,
// retune it INSIDE the band — or come back here and change the band deliberately,
// with the owner, on purpose.
import { describe, it, expect } from 'vitest';
import {
  SLOT_POOL, SLOT_SYMBOLS, SLOT_SEVEN, slotPayout, slotRTP, isTripleSeven, pickSlot,
} from '../src/game/state';

// Every reel combination, weighted exactly as the pool draws them.
const everySpin = (): number[][] => {
  const out: number[][] = [];
  for (const a of SLOT_POOL) for (const b of SLOT_POOL) for (const c of SLOT_POOL) out.push([a, b, c]);
  return out;
};

describe('slot pay table', () => {
  it('sits in the intended slightly-player-favourable band', () => {
    const rtp = slotRTP();
    // ~103%: the player is meant to win here, but not enough to farm.
    expect(rtp).toBeGreaterThan(1.015);
    expect(rtp).toBeLessThan(1.045);
  });

  it('leaves the max-bet edge as pocket change, not an income', () => {
    // The worst case that matters: max chip, spun as fast as the reels allow.
    const edgePerMaxSpin = (slotRTP() - 1) * 2500;
    expect(edgePerMaxSpin).toBeGreaterThan(0);   // it IS a player edge, by design
    expect(edgePerMaxSpin).toBeLessThan(150);    // ...and it stays smaller than a fish
  });

  it('pays a pair back exactly the stake — a wash, never a win', () => {
    // settleSlots keys "was this a casino win?" off payout > bet, so a pair must
    // never clear the bar. This is what keeps the 30-win backroom gate honest.
    for (const reels of everySpin()) {
      const [a, b, c] = reels;
      const trips = a === b && b === c;
      const pair = !trips && (a === b || b === c || a === c);
      if (pair) expect(slotPayout(reels, 500)).toBe(500);
    }
  });

  it('pays nothing at all for three different symbols', () => {
    for (const reels of everySpin()) {
      const [a, b, c] = reels;
      if (a !== b && b !== c && a !== c) expect(slotPayout(reels, 500)).toBe(0);
    }
  });

  it('ranks three-of-a-kind by symbol rarity, monotonically', () => {
    const trip = (sym: number) => slotPayout([sym, sym, sym], 100);
    const counts = SLOT_SYMBOLS.map((_, i) => SLOT_POOL.filter(n => n === i).length);
    for (let i = 0; i < SLOT_SYMBOLS.length; i++) {
      for (let j = 0; j < SLOT_SYMBOLS.length; j++) {
        // A rarer symbol must never pay LESS than a commoner one. The three
        // common fruit deliberately share the base row, so ties are fine.
        if (counts[i] < counts[j]) expect(trip(i)).toBeGreaterThanOrEqual(trip(j));
      }
    }
    // The seven is the top line, alone.
    const others = SLOT_SYMBOLS.map((_, i) => i).filter(i => i !== SLOT_SEVEN).map(trip);
    expect(trip(SLOT_SEVEN)).toBeGreaterThan(Math.max(...others));
  });

  it('scales linearly with the bet', () => {
    for (const reels of [[0, 0, 0], [3, 3, 3], [5, 5, 5], [0, 0, 1], [0, 1, 2]]) {
      expect(slotPayout(reels, 1000)).toBe(slotPayout(reels, 100) * 10);
    }
  });

  it('recognises the triple seven that drains the progressive pot', () => {
    expect(isTripleSeven([SLOT_SEVEN, SLOT_SEVEN, SLOT_SEVEN])).toBe(true);
    expect(isTripleSeven([SLOT_SEVEN, SLOT_SEVEN, 4])).toBe(false);
    expect(isTripleSeven([4, 4, 4])).toBe(false);
    // 1 in 2,744 — rare enough that the pot has time to grow.
    const sevens = everySpin().filter(isTripleSeven).length;
    expect(everySpin().length / sevens).toBeCloseTo(2744, 0);
  });

  it('only ever draws a real symbol index', () => {
    for (let i = 0; i < 200; i++) {
      const n = pickSlot();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(SLOT_SYMBOLS.length);
    }
  });
});
