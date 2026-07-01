import { describe, it, expect } from 'vitest';
import {
  FESTIVALS, FESTIVAL_PERIOD, festivalFor,
  TOURNAMENT_PERIOD, TOURNAMENT_PHASE, fishingTournamentDay,
  tournamentScore, tournamentTierFor, TOURNAMENT_TIERS,
} from '../src/game/data';

describe('festivalFor', () => {
  it('never fires before the first window or on ordinary days', () => {
    expect(festivalFor(1)).toBeNull();
    expect(festivalFor(13)).toBeNull();
    expect(festivalFor(15)).toBeNull();
    expect(festivalFor(27)).toBeNull();
  });

  it('rotates through the calendar in order every 14 days', () => {
    expect(festivalFor(14)?.id).toBe('summer-matsuri');
    expect(festivalFor(28)?.id).toBe('tanabata');
    expect(festivalFor(42)?.id).toBe('hatsumode');
    expect(festivalFor(56)?.id).toBe('summer-matsuri'); // wraps
  });

  it('is deterministic — same day, same festival', () => {
    expect(festivalFor(28)).toBe(festivalFor(28));
  });

  it('every festival has a scene and a minigame', () => {
    for (const f of FESTIVALS) {
      expect(f.scene.length).toBeGreaterThan(0);
      expect(f.minigame.length).toBeGreaterThan(0);
    }
  });
});

describe('fishingTournamentDay', () => {
  it('lands on days ≡ 5 (mod 10), never day 1', () => {
    expect(fishingTournamentDay(1)).toBe(false);
    expect(fishingTournamentDay(5)).toBe(true);
    expect(fishingTournamentDay(15)).toBe(true);
    expect(fishingTournamentDay(10)).toBe(false);
    expect(fishingTournamentDay(14)).toBe(false);
  });

  it('never coincides with a festival (odd vs even day parity)', () => {
    for (let day = 2; day <= 400; day++) {
      if (fishingTournamentDay(day)) expect(festivalFor(day)).toBeNull();
    }
  });

  it('phase stays inside the period (guards a future retune)', () => {
    expect(TOURNAMENT_PHASE).toBeLessThan(TOURNAMENT_PERIOD);
    expect(FESTIVAL_PERIOD % 2).toBe(0); // festivals even ↔ derbies odd is the non-collision proof
    expect(TOURNAMENT_PHASE % 2).toBe(1);
  });
});

describe('tournament scoring + tiers', () => {
  it('maps fish yen to points at 1-per-¥10, minimum 1', () => {
    expect(tournamentScore(80)).toBe(8);
    expect(tournamentScore(1800)).toBe(180);
    expect(tournamentScore(4)).toBe(1);
  });

  it('walks ascending tiers and returns the best earned', () => {
    expect(tournamentTierFor(0).name).toBe('Bronze Lure');
    expect(tournamentTierFor(149).name).toBe('Bronze Lure');
    expect(tournamentTierFor(150).name).toBe('Silver Reel');
    expect(tournamentTierFor(320).name).toBe('Gold Hook');
    expect(tournamentTierFor(99999).name).toBe('Grand Marlin');
  });

  it('tiers are listed low→high (the walk depends on it)', () => {
    for (let i = 1; i < TOURNAMENT_TIERS.length; i++) {
      expect(TOURNAMENT_TIERS[i].minScore).toBeGreaterThan(TOURNAMENT_TIERS[i - 1].minScore);
      expect(TOURNAMENT_TIERS[i].prize).toBeGreaterThan(TOURNAMENT_TIERS[i - 1].prize);
    }
  });
});
