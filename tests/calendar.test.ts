import { describe, it, expect } from 'vitest';
import {
  FESTIVALS, FESTIVAL_PERIOD, festivalFor,
  TOURNAMENT_PERIOD, TOURNAMENT_PHASE, fishingTournamentDay,
  tournamentScore, tournamentTierFor, TOURNAMENT_TIERS,
} from '../src/game/data';
import { townEventNow, townEventSceneNow, atTownEventNow, TOWN_EVENT_ATTENDEES, ROUTINES } from '../src/game/state';

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

// ---- Town-event attendance --------------------------------------------------
// Who leaves their post for the derby / a festival, and for how long. The window
// MUST match how long the world stays dressed for the event, or the duplicate-NPC
// bug returns at the seam (a goer still drawn after the real NPC walked home).
describe('townEventNow / atTownEventNow', () => {
  const at = (day: number, hour: number) => ({ day, timeMin: hour * 60 });

  it('is null on an ordinary day at any hour', () => {
    expect(townEventNow(at(3, 9))).toBeNull();
    expect(townEventNow(at(3, 19))).toBeNull();
    expect(townEventNow(at(3, 23))).toBeNull();
  });

  it('reports a derby on derby days, and only until the crowd breaks up', () => {
    expect(fishingTournamentDay(15)).toBe(true);
    expect(townEventNow(at(15, 7))).toBe('derby');
    expect(townEventNow(at(15, 19.9))).toBe('derby');
    expect(townEventNow(at(15, 20))).toBeNull();   // 8 PM — everyone home
    expect(townEventNow(at(15, 23))).toBeNull();
  });

  it('reports a festival all evening — festivals run to the 2 AM collapse', () => {
    expect(festivalFor(14)).not.toBeNull();
    expect(townEventNow(at(14, 9))).toBe('festival');
    expect(townEventNow(at(14, 21))).toBe('festival'); // still on, unlike the derby
    expect(townEventNow(at(14, 25.9))).toBe('festival');
    expect(townEventNow(at(14, 26))).toBeNull();       // collapse
  });

  it('only pulls the listed attendees, and only during their event', () => {
    for (const id of TOWN_EVENT_ATTENDEES.derby.shore) expect(atTownEventNow(at(15, 12), id)).toBe(true);
    expect(atTownEventNow(at(15, 12), 'tex')).toBe(false);      // already lives on the shore
    expect(atTownEventNow(at(15, 12), 'old-man')).toBe(false);  // Genji runs the derby
    expect(atTownEventNow(at(15, 21), 'granny')).toBe(false);   // after 8 PM she's home
    // Festival attendance is a different, smaller, scene-specific list.
    expect(atTownEventNow(at(14, 12), 'charlie')).toBe(true);   // day 14 matsuri is in the city
    expect(atTownEventNow(at(14, 12), 'granny')).toBe(false);
    expect(atTownEventNow(at(3, 12), 'charlie')).toBe(false);   // ordinary day
  });

  it('only lists folk who actually have a routine to be pulled away from', () => {
    // The whole point of the fix: an attendee must be absent from their routine
    // while they're at the event, so the crowd and the town can't both show them.
    for (const ev of ['derby', 'festival'] as const)
      for (const ids of Object.values(TOWN_EVENT_ATTENDEES[ev]))
        for (const id of ids) expect(ROUTINES[id]).toBeDefined();
  });

  // The regression this guards: a flat per-event attendee list hid BOTH festival
  // folk on every festival day, but only the active festival's own scene stages
  // anyone — so on a city matsuri, Yoshi was pulled from the shrine and staged
  // nowhere. She vanished from the game for the whole day.
  it('only pulls the attendees the ACTIVE festival scene actually stages', () => {
    expect(festivalFor(14)?.scene).toBe('city');
    expect(townEventSceneNow(at(14, 12))).toBe('city');
    expect(atTownEventNow(at(14, 12), 'charlie')).toBe(true);   // staged in the city
    expect(atTownEventNow(at(14, 12), 'miko')).toBe(false);     // still minding her shrine

    expect(festivalFor(28)?.scene).toBe('shrine');
    expect(townEventSceneNow(at(28, 12))).toBe('shrine');
    expect(atTownEventNow(at(28, 12), 'miko')).toBe(true);      // staged at the shrine
    expect(atTownEventNow(at(28, 12), 'charlie')).toBe(false);  // still out front of the konbini
  });

  it('every listed attendee is staged by the scene that claims them', () => {
    // No name may appear under a scene without that scene having somewhere to put
    // them — that's exactly how an NPC falls out of the world for a day.
    expect(Object.keys(TOWN_EVENT_ATTENDEES.festival).sort()).toEqual(['city', 'shrine']);
    expect(TOWN_EVENT_ATTENDEES.festival.city).not.toContain('miko');
    expect(TOWN_EVENT_ATTENDEES.festival.shrine).not.toContain('charlie');
  });
});
