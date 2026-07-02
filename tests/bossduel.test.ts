// The boss duel: nightly stake scaling + the seeded daily house rule. The hand
// itself runs in the monolith off the shared blackjack helpers; what's pinnable
// here is the pure state: the stake curve and placard determinism.
import { describe, it, expect } from 'vitest';
import {
  newSave, bossStakeFor, houseRuleFor, HOUSE_RULES,
  BOSS_STAKE_BASE, BOSS_STAKE_CAP, BACKROOM_WINS,
} from '../src/game/state';

describe('bossStakeFor', () => {
  it('starts at the base stake the day the backroom opens', () => {
    expect(bossStakeFor({ casinoWins: BACKROOM_WINS })).toBe(BOSS_STAKE_BASE);
    expect(bossStakeFor({ casinoWins: 0 })).toBe(BOSS_STAKE_BASE); // never below base
  });

  it('creeps up with lifetime wins and caps', () => {
    expect(bossStakeFor({ casinoWins: BACKROOM_WINS + 10 })).toBe(BOSS_STAKE_BASE + 2500);
    expect(bossStakeFor({ casinoWins: 10000 })).toBe(BOSS_STAKE_CAP);
  });
});

describe('houseRuleFor (the placard)', () => {
  it('is deterministic per day', () => {
    for (let day = 1; day <= 30; day++)
      expect(houseRuleFor(day).id).toBe(houseRuleFor(day).id);
  });

  it('every rule comes up within a couple of months', () => {
    const seen = new Set<string>();
    for (let day = 1; day <= 60; day++) seen.add(houseRuleFor(day).id);
    expect(seen.size).toBe(HOUSE_RULES.length);
  });

  it('every rule has a placard line', () => {
    for (const r of HOUSE_RULES) expect(r.placard.length).toBeGreaterThan(0);
  });
});

describe('the duel gate fields', () => {
  it('new saves have never dueled', () => {
    const s = newSave();
    expect(s.bossDuelDay).toBe(0);
    expect(s.bossDuelLosses).toBe(0);
  });
});
