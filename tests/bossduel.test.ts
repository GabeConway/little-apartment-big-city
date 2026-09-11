// The boss duel: nightly stake scaling + the seeded daily house rule. The hand
// itself runs in the monolith off the shared blackjack helpers; what's pinnable
// here is the pure state: the stake curve and placard determinism.
import { describe, it, expect } from 'vitest';
import {
  newSave, bossStakeFor, houseRuleFor, HOUSE_RULES,
  BOSS_STAKE_BASE, BOSS_STAKE_CAP, BACKROOM_WINS,
} from '../src/game/state';
import { keepsakeById } from '../src/game/data';

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
    expect(s.bossDuelPlayed).toBe(0);
  });

  it("the rival-capstone keepsake exists (Towzawa's Hanafuda, granted at 5 duel wins)", () => {
    expect(keepsakeById('hanafuda')).toBeDefined();
    expect(keepsakeById('hanafuda')!.effect).toBe('display');
  });
});

// ---- "Read the Placard" ------------------------------------------------------
// The achievement exists to reward sitting down on his BAD nights. The placard is
// visible before the bet with a free walk-away, so a player can otherwise skip to
// only the two rules that favour them.
describe('duelRulesWon', () => {
  it('is empty and default-safe on a fresh save', () => {
    expect(newSave().duelRulesWon).toEqual([]);
  });

  it('needs every house rule, not just a pile of wins under one', () => {
    const s = newSave();
    const beat = (rule: string) => { if (!s.duelRulesWon.includes(rule)) s.duelRulesWon.push(rule); };
    const complete = () => HOUSE_RULES.every(hr => s.duelRulesWon.includes(hr.id));
    for (let i = 0; i < 20; i++) beat('pays2to1');       // twenty wins, one placard
    expect(s.duelRulesWon).toEqual(['pays2to1']);
    expect(complete()).toBe(false);
    for (const hr of HOUSE_RULES) beat(hr.id);
    expect(complete()).toBe(true);
    expect(s.duelRulesWon).toHaveLength(HOUSE_RULES.length); // deduped
  });
});

// The first audience used to hand over ¥10,000 seconds after the duel table had
// already paid out. It comps a keepsake now — worth nothing, means everything.
describe('the Kinryu house chip', () => {
  it('is a real keepsake with a sprite, and carries no cash value', () => {
    const chip = keepsakeById('kinryu-chip');
    expect(chip).toBeDefined();
    expect(chip!.sprite).toBe('i-kinryu-chip');
    expect(chip!.effect).toBe('display');
    expect(chip!.value).toBeUndefined();
  });
});
