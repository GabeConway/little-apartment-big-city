// Video poker (Jacks or Better): the pure evaluator + pay table in state.ts.
// The machine UI just multiplies bet × mult, so correctness lives entirely here.
import { describe, it, expect } from 'vitest';
import { pokerEval, POKER_PAYTABLE, POKER_NOTHING, type PokerHandCard } from '../src/game/state';

// Hand shorthand: rank 1..13 (1=A, 11=J, 12=Q, 13=K), suit 0..3.
const H = (...cards: [number, number][]): PokerHandCard[] =>
  cards.map(([rank, suit]) => ({ rank, suit }));

describe('pokerEval hand ranking', () => {
  it('royal flush (10-J-Q-K-A suited)', () => {
    expect(pokerEval(H([10, 2], [11, 2], [12, 2], [13, 2], [1, 2])).id).toBe('royal');
  });

  it('straight flush (5-9 suited), and the suited wheel counts too', () => {
    expect(pokerEval(H([5, 0], [6, 0], [7, 0], [8, 0], [9, 0])).id).toBe('sflush');
    expect(pokerEval(H([1, 3], [2, 3], [3, 3], [4, 3], [5, 3])).id).toBe('sflush');
  });

  it('four of a kind', () => {
    expect(pokerEval(H([7, 0], [7, 1], [7, 2], [7, 3], [2, 0])).id).toBe('quads');
  });

  it('full house', () => {
    expect(pokerEval(H([9, 0], [9, 1], [9, 2], [4, 0], [4, 1])).id).toBe('full');
  });

  it('flush (unconnected, suited)', () => {
    expect(pokerEval(H([2, 1], [5, 1], [9, 1], [11, 1], [13, 1])).id).toBe('flush');
  });

  it('straight: mid, broadway (ace high), and the wheel (ace low)', () => {
    expect(pokerEval(H([4, 0], [5, 1], [6, 2], [7, 3], [8, 0])).id).toBe('straight');
    expect(pokerEval(H([10, 0], [11, 1], [12, 2], [13, 3], [1, 0])).id).toBe('straight');
    expect(pokerEval(H([1, 0], [2, 1], [3, 2], [4, 3], [5, 0])).id).toBe('straight');
  });

  it('an ace does NOT wrap a straight around the corner (Q-K-A-2-3)', () => {
    expect(pokerEval(H([12, 0], [13, 1], [1, 2], [2, 3], [3, 0])).id).toBe('nothing');
  });

  it('three of a kind / two pair', () => {
    expect(pokerEval(H([6, 0], [6, 1], [6, 2], [2, 0], [9, 1])).id).toBe('trips');
    expect(pokerEval(H([6, 0], [6, 1], [9, 2], [9, 0], [2, 1])).id).toBe('twopair');
  });

  it('jacks or better: J/Q/K/A pairs pay, tens or lower do not', () => {
    expect(pokerEval(H([11, 0], [11, 1], [2, 2], [5, 3], [9, 0])).id).toBe('jacks');
    expect(pokerEval(H([1, 0], [1, 1], [2, 2], [5, 3], [9, 0])).id).toBe('jacks'); // aces count high
    expect(pokerEval(H([10, 0], [10, 1], [2, 2], [5, 3], [9, 0])).id).toBe('nothing');
  });

  it('high card is nothing', () => {
    expect(pokerEval(H([2, 0], [5, 1], [9, 2], [11, 3], [13, 0]))).toBe(POKER_NOTHING);
  });
});

describe('the pay table', () => {
  it('pays strictly more for strictly better hands', () => {
    for (let i = 1; i < POKER_PAYTABLE.length; i++)
      expect(POKER_PAYTABLE[i - 1].mult).toBeGreaterThan(POKER_PAYTABLE[i].mult);
  });

  it('jacks or better is a wash (stake back), everything above it profits', () => {
    expect(POKER_PAYTABLE.find(r => r.id === 'jacks')!.mult).toBe(1);
    expect(POKER_PAYTABLE.find(r => r.id === 'twopair')!.mult).toBeGreaterThanOrEqual(2);
    expect(POKER_NOTHING.mult).toBe(0);
  });
});
