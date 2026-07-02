// Kinryū Lounge: the progressive slots jackpot + the win-gated backroom.
// jackpotFor is pure and seeded, so the slots panel, the lobby button and the
// morning bulletin can all derive the same pot — pin that determinism here.
import { describe, it, expect } from 'vitest';
import { newSave, jackpotFor, backroomOpen, JACKPOT_BASE, JACKPOT_CAP, BACKROOM_WINS } from '../src/game/state';

describe('progressive jackpot (jackpotFor)', () => {
  it('starts at the base and is deterministic', () => {
    expect(jackpotFor({ day: 0, jackpotDay: 0 })).toBe(JACKPOT_BASE);
    expect(jackpotFor({ day: 9, jackpotDay: 0 })).toBe(jackpotFor({ day: 9, jackpotDay: 0 }));
  });

  it('grows every day, ¥400–899 per day', () => {
    let prev = jackpotFor({ day: 1, jackpotDay: 0 });
    for (let day = 2; day <= 60; day++) {
      const pot = jackpotFor({ day, jackpotDay: 0 });
      const growth = pot - prev;
      expect(growth).toBeGreaterThanOrEqual(400);
      expect(growth).toBeLessThan(900);
      prev = pot;
    }
  });

  it('hitting it resets the pot to base (jackpotDay = today)', () => {
    expect(jackpotFor({ day: 30, jackpotDay: 30 })).toBe(JACKPOT_BASE);
    // ...and it starts growing again the next day
    expect(jackpotFor({ day: 31, jackpotDay: 30 })).toBeGreaterThan(JACKPOT_BASE);
  });

  it('caps at JACKPOT_CAP — a long-untouched pot (e.g. a veteran save meeting the feature) stays sane', () => {
    expect(jackpotFor({ day: 300, jackpotDay: 0 })).toBe(JACKPOT_CAP);
    expect(jackpotFor({ day: 300, jackpotDay: 0 })).toBe(JACKPOT_CAP); // memoized path agrees
  });

  it('the morning bulletin can diff yesterday vs today (crossing a ¥10k line exactly once)', () => {
    // Walk the pot day by day; each ¥10,000 line must be crossed on exactly one day.
    const crossings = new Map<number, number>();
    for (let day = 2; day <= 120; day++) {
      const now = Math.floor(jackpotFor({ day, jackpotDay: 0 }) / 10000);
      const before = Math.floor(jackpotFor({ day: day - 1, jackpotDay: 0 }) / 10000);
      if (now > before) crossings.set(now, (crossings.get(now) ?? 0) + 1);
    }
    expect(crossings.size).toBeGreaterThan(3); // it does make the news now and then
    for (const [, times] of crossings) expect(times).toBe(1);
  });
});

describe('the backroom gate', () => {
  it('new saves start with no casino history and a closed curtain', () => {
    const s = newSave();
    expect(s.casinoWins).toBe(0);
    expect(s.jackpotDay).toBe(0);
    expect(backroomOpen(s)).toBe(false);
  });

  it('opens at exactly BACKROOM_WINS lifetime wins', () => {
    const s = newSave();
    s.casinoWins = BACKROOM_WINS - 1;
    expect(backroomOpen(s)).toBe(false);
    s.casinoWins = BACKROOM_WINS;
    expect(backroomOpen(s)).toBe(true);
  });
});
