import { describe, it, expect } from 'vitest';
import {
  newSave, freshDayLog, maxEnergy, energyCost, sleep, clockLabel, nightT,
  buyFurniture, shrineLuck, gachaComplete, pawnStockFor, sketchyOfferFor,
  allFurnished, itemFootprintW, placeItem, unplaceItem,
  WAKE_MIN, type GameSave,
  morningT, syncMessages, unreadCount, zamazonkCatalog, zamazonkPrice,
  orderZamaZonk, fulfillDeliveries, ZAMAZONK_FEE, mineLayoutFor, minedKey,
  mineChallengeFor, enterMineStreak, crackGeode, lootVault, isVaultFloor, VAULT_MIN_FLOOR,
  unlockGameAch, dayEventFor, shoreForageFor,
  isRainyDay, foggyDay, meteorNight,
  plantCrop, harvestCrop, plotReady, growGreenhouse, plotStage, sellShipping,
  streetEventFor, streetEventDoneToday,
  timeBlock, routineTargetFor, ROUTINES, type RoutineBlock,
} from '../src/game/state';
import { BASE_MAX_ENERGY, FURNITURE, PAWN_STOCK_SIZE, SKETCHY_DISCOUNT, PAWN_DISCOUNT, GACHA_FIGURES, CROPS, STREET_EVENTS } from '../src/game/data';
import {
  canCookHere, canCook, cook, eatDish, ingredientCount, buyGrocery, learnRecipe,
  buffActive, friendHearts, giftTo, canGiftToday, applyFriendPerks,
  allFriendsMet, friendFlavorLine, meetFriend,
  buyDecor, applyDecor, ownsDecor, placeRug, removeRugAt, rugAt,
  skillLevel, addSkillXp, skillProgress, SKILL_XP, ROOM_PRICE,
} from '../src/game/state';
import { recipeById, MAX_HEARTS, GIFT_POINTS, MUSEUM_SLOTS, BINGUS_FETCHES, FRIENDS } from '../src/game/data';
import { SCENES } from '../src/game/maps';

describe('newSave', () => {
  it('starts on day 1 at 7:00 AM with starter cash', () => {
    const s = newSave();
    expect(s.day).toBe(1);
    expect(s.timeMin).toBe(WAKE_MIN);
    expect(s.money).toBe(3000);
    expect(s.energy).toBe(BASE_MAX_ENERGY);
    expect(s.v).toBe(2);
  });
});

describe('almanac (discovery tracker)', () => {
  it('starts empty + default-safe (both ever-discovered sets present)', () => {
    const s = newSave();
    expect(s.almanac).toEqual({ minerals: [], forage: [] });
  });
  it('records an ever-mined mineral kind once (the mine-strike recording site)', () => {
    const s = newSave();
    const record = (id: string) => { if (!s.almanac.minerals.includes(id)) s.almanac.minerals.push(id); };
    record('coal'); record('coal'); record('opal');
    expect(s.almanac.minerals).toEqual(['coal', 'opal']);
  });
  it('records a forage find kind once (the shore-grab recording site)', () => {
    const s = newSave();
    const record = (id: string) => { if (!s.almanac.forage.includes(id)) s.almanac.forage.push(id); };
    record('shell'); record('coin'); record('shell');
    expect(s.almanac.forage).toEqual(['shell', 'coin']);
  });
});

describe('maxEnergy', () => {
  it('is the base with no appliances placed', () => {
    expect(maxEnergy(newSave())).toBe(BASE_MAX_ENERGY);
  });
  it('adds +10 per placed appliance (placed, not merely owned)', () => {
    const s = newSave();
    s.placed['microwave'] = { x: 0, y: 0 };
    s.placed['fridge'] = { x: 1, y: 0 };
    expect(maxEnergy(s)).toBe(BASE_MAX_ENERGY + 20);
  });
});

describe('energyCost', () => {
  it('returns the base cost without AC', () => {
    expect(energyCost(newSave(), 10)).toBe(10);
  });
  it('applies a 20% discount with AC placed', () => {
    const s = newSave();
    s.placed['ac'] = { x: 0, y: 0 };
    expect(energyCost(s, 10)).toBe(8);
  });
  it('never returns below 1', () => {
    expect(energyCost(newSave(), 0)).toBe(1);
  });
});

describe('clockLabel', () => {
  const at = (timeMin: number) => clockLabel({ ...newSave(), timeMin });
  it('formats AM/PM with zero-padded minutes', () => {
    expect(at(7 * 60 + 5)).toBe('7:05 AM');
    expect(at(13 * 60)).toBe('1:00 PM');
  });
  it('shows 12 (not 0) at noon and midnight', () => {
    expect(at(12 * 60)).toBe('12:00 PM');
    expect(at(0)).toBe('12:00 AM');
  });
  it('wraps times past 24h back into the day', () => {
    expect(at(25 * 60)).toBe('1:00 AM');
  });
});

describe('nightT', () => {
  it('is full day before 17:00', () => {
    expect(nightT({ ...newSave(), timeMin: 12 * 60 })).toBe(0);
  });
  it('ramps linearly between 17:00 and 20:00', () => {
    expect(nightT({ ...newSave(), timeMin: 18.5 * 60 })).toBeCloseTo(0.5, 5);
  });
  it('is full night from 20:00 on', () => {
    expect(nightT({ ...newSave(), timeMin: 22 * 60 })).toBe(1);
  });
});

describe('sleep', () => {
  it('advances the day, resets the clock, and starts a fresh tally', () => {
    const s = newSave();
    s.energy = 1;
    s.day = 3;
    sleep(s);
    expect(s.day).toBe(4);
    expect(s.timeMin).toBe(WAKE_MIN);
    expect(s.today.startMoney).toBe(s.money);
  });
  it('fully restores energy with a bed, partially with a futon', () => {
    const withBed = newSave();
    withBed.placed['bed'] = { x: 0, y: 0 };
    withBed.energy = 0;
    sleep(withBed);
    expect(withBed.energy).toBe(maxEnergy(withBed));

    const futon = newSave();
    futon.energy = 0;
    sleep(futon);
    expect(futon.energy).toBeLessThan(maxEnergy(futon));
    expect(futon.energy).toBeGreaterThan(0);
  });
});

describe('buyFurniture', () => {
  it('debits money and records ownership on success', () => {
    const s = newSave();
    const ok = buyFurniture(s, 'lamp', 500);
    expect(ok).toBe(true);
    expect(s.money).toBe(2500);
    expect(s.owned).toContain('lamp');
    expect(s.today.newFurniture).toContain('lamp');
  });
  it('rejects duplicates and unaffordable purchases without side effects', () => {
    const s = newSave();
    buyFurniture(s, 'lamp', 500);
    expect(buyFurniture(s, 'lamp', 500)).toBe(false); // dup
    const before = s.money;
    expect(buyFurniture(s, 'kotatsu', 999999)).toBe(false); // too expensive
    expect(s.money).toBe(before);
  });
});

describe('shrineLuck', () => {
  it('tiers up at 5,000 and 20,000 yen donated', () => {
    expect(shrineLuck({ ...newSave(), donated: 0 })).toBe(0);
    expect(shrineLuck({ ...newSave(), donated: 5000 })).toBe(1);
    expect(shrineLuck({ ...newSave(), donated: 19999 })).toBe(1);
    expect(shrineLuck({ ...newSave(), donated: 20000 })).toBe(2);
  });
});

describe('gachaComplete', () => {
  it('is false until every figure is owned', () => {
    const s = newSave();
    expect(gachaComplete(s)).toBe(false);
    for (const name of GACHA_FIGURES) s.gacha[name] = 1;
    expect(gachaComplete(s)).toBe(true);
  });
});

describe('pawnStockFor', () => {
  it('is deterministic per day and bounded by the stock size', () => {
    const s = newSave();
    const a = pawnStockFor(s);
    const b = pawnStockFor(s);
    expect(a).toEqual(b);
    expect(a.length).toBeLessThanOrEqual(PAWN_STOCK_SIZE);
  });
  it('rotates the stock across days', () => {
    const day1 = pawnStockFor({ ...newSave(), day: 1 });
    const day2 = pawnStockFor({ ...newSave(), day: 2 });
    expect(day1).not.toEqual(day2);
  });
  it('never offers furniture the player already owns', () => {
    const s = newSave();
    const offer = pawnStockFor(s)[0];
    s.owned.push(offer.itemId);
    expect(pawnStockFor(s).some(o => o.itemId === offer.itemId)).toBe(false);
  });
});

describe('sketchyOfferFor', () => {
  it('is deterministic per day', () => {
    const s = newSave();
    expect(sketchyOfferFor(s)).toEqual(sketchyOfferFor(s));
  });
  it('returns null once every furniture is owned', () => {
    const s = newSave();
    s.owned = FURNITURE.map(f => f.id);
    expect(sketchyOfferFor(s)).toBeNull();
  });
});

describe('mineLayoutFor (daily mine generation)', () => {
  const minesGrid = SCENES.mines.grid;
  const isFloor = (x: number, y: number) => minesGrid[y]?.[x] === '.';

  it('is stable within a day but differs across days', () => {
    const a = newSave(); a.day = 5;
    const b = newSave(); b.day = 5;
    const c = newSave(); c.day = 6;
    expect(mineLayoutFor(a)).toEqual(mineLayoutFor(b));
    // Two arbitrary days should (overwhelmingly) differ in their node layout.
    expect(JSON.stringify(mineLayoutFor(a).ore)).not.toEqual(JSON.stringify(mineLayoutFor(c).ore));
  });

  it('only ever spawns ore and crawlers on walkable floor (never walls/entry)', () => {
    for (let day = 1; day <= 60; day++) {
      const s = newSave(); s.day = day;
      const { ore, crawlers } = mineLayoutFor(s);
      for (const n of ore) {
        expect(isFloor(n.x, n.y)).toBe(true);
        expect(`${n.x},${n.y}`).not.toBe('2,1'); // entry tile
        expect(n.amount).toBeGreaterThanOrEqual(1);
      }
      for (const c of crawlers) {
        expect(isFloor(c.x, c.y)).toBe(true);
        // never crowd the ladder entry
        expect(Math.abs(c.x - 2) + Math.abs(c.y - 1)).toBeGreaterThanOrEqual(3);
      }
      // ore and crawlers never overlap
      const oreKeys = new Set(ore.map(n => `${n.x},${n.y}`));
      for (const c of crawlers) expect(oreKeys.has(`${c.x},${c.y}`)).toBe(false);
    }
  });

  it('hides already-mined nodes for the rest of the day', () => {
    const s = newSave(); s.day = 9;
    const first = mineLayoutFor(s);
    expect(first.ore.length).toBeGreaterThan(0);
    const gone = first.ore[0];
    s.minedNodes.push(minedKey(1, gone.x, gone.y));
    const after = mineLayoutFor(s);
    expect(after.ore.some(n => n.x === gone.x && n.y === gone.y)).toBe(false);
  });

  it('mined-node hiding is floor-scoped (same tile on a deeper floor is untouched)', () => {
    const s = newSave(); s.day = 12;
    const f1 = mineLayoutFor(s, 1);
    const gone = f1.ore[0];
    s.minedNodes.push(minedKey(1, gone.x, gone.y));
    // The deeper floor reseeds independently; the key for floor 2 differs.
    expect(s.minedNodes.includes(minedKey(2, gone.x, gone.y))).toBe(false);
    expect(mineLayoutFor(s, 1).ore.some(n => n.x === gone.x && n.y === gone.y)).toBe(false);
  });

  it('deeper floors yield more ore and only the deep floors carry the rarest ore', () => {
    let shallow = 0, deep = 0, sawStarstoneShallow = false, sawStarstoneDeep = false;
    for (let day = 1; day <= 40; day++) {
      const s = newSave(); s.day = day;
      const f1 = mineLayoutFor(s, 1);
      const f8 = mineLayoutFor(s, 8);
      shallow += f1.ore.length; deep += f8.ore.length;
      if (f1.ore.some(n => n.mineral.id === 'starstone')) sawStarstoneShallow = true;
      if (f8.ore.some(n => n.mineral.id === 'starstone')) sawStarstoneDeep = true;
    }
    expect(deep).toBeGreaterThan(shallow);              // depth → richer
    expect(sawStarstoneShallow).toBe(false);            // gated by minFloor
    expect(sawStarstoneDeep).toBe(true);                // shows up once deep enough
  });

  it('tougher crawler kinds only appear with depth', () => {
    let shallowTank = false, deepTank = false;
    for (let day = 1; day <= 40; day++) {
      const s = newSave(); s.day = day;
      if (mineLayoutFor(s, 1).crawlers.some(c => c.kind === 'tank')) shallowTank = true;
      if (mineLayoutFor(s, 6).crawlers.some(c => c.kind === 'tank')) deepTank = true;
    }
    expect(shallowTank).toBe(false); // tanks need depth >= 2
    expect(deepTank).toBe(true);
  });

  it('mine streak increments on consecutive days and resets after a gap', () => {
    const s = newSave();
    s.day = 1; enterMineStreak(s); expect(s.mineStreak).toBe(1);
    enterMineStreak(s); expect(s.mineStreak).toBe(1);   // same day doesn't double-count
    s.day = 2; enterMineStreak(s); expect(s.mineStreak).toBe(2);
    s.day = 5; enterMineStreak(s); expect(s.mineStreak).toBe(1); // skipped days reset it
  });

  it('the descend ladder is seeded, far from the entry, and never under ore/crawlers', () => {
    const seen = new Set<string>();
    for (let floor = 1; floor <= 6; floor++) {
      const s = newSave(); s.day = 21;
      const { ore, crawlers, down } = mineLayoutFor(s, floor);
      expect(Math.abs(down.x - 2) + Math.abs(down.y - 1)).toBeGreaterThanOrEqual(7); // away from entry (2,1)
      expect(ore.some(n => n.x === down.x && n.y === down.y)).toBe(false);
      expect(crawlers.some(c => c.x === down.x && c.y === down.y)).toBe(false);
      seen.add(`${down.x},${down.y}`);
    }
    expect(seen.size).toBeGreaterThan(1); // not always the same spot across floors
  });

  it('treasure vaults are deterministic per day+floor, rare, and only below the min floor', () => {
    // Determinism: same day+floor → same vault flag (stable across reloads).
    for (let day = 1; day <= 30; day++)
      for (let floor = 1; floor <= 12; floor++)
        expect(isVaultFloor({ ...newSave(), day }, floor)).toBe(isVaultFloor({ ...newSave(), day }, floor));
    // Never above the minimum depth.
    for (let day = 1; day <= 200; day++)
      for (let floor = 1; floor < VAULT_MIN_FLOOR; floor++)
        expect(isVaultFloor({ ...newSave(), day }, floor)).toBe(false);
    // Rare: well under a quarter of qualifying floors.
    let total = 0, vaults = 0;
    for (let day = 1; day <= 200; day++)
      for (let floor = VAULT_MIN_FLOOR; floor <= 12; floor++) { total++; if (isVaultFloor({ ...newSave(), day }, floor)) vaults++; }
    expect(vaults).toBeGreaterThan(0);
    expect(vaults / total).toBeLessThan(0.2);
    // A known trigger: day 15, floor 3.
    expect(isVaultFloor({ ...newSave(), day: 15 }, 3)).toBe(true);
  });

  it('a vault floor is flagged, stocks a chest + a geode, and is richer than a normal floor', () => {
    // day 2 / floor 4 is a vault (see isVaultFloor seeding).
    const v = newSave(); v.day = 2;
    const layout = mineLayoutFor(v, 4);
    expect(layout.vault).toBe(true);
    expect(layout.chest).toBeDefined();
    // chest is on walkable floor, away from the entry, and never under ore/the ladder.
    expect(isFloor(layout.chest!.x, layout.chest!.y)).toBe(true);
    expect(Math.abs(layout.chest!.x - 2) + Math.abs(layout.chest!.y - 1)).toBeGreaterThanOrEqual(4);
    expect(layout.ore.some(n => n.x === layout.chest!.x && n.y === layout.chest!.y)).toBe(false);
    expect(layout.chest!.x === layout.down.x && layout.chest!.y === layout.down.y).toBe(false);
    expect(layout.ore.some(n => n.geode)).toBe(true); // a vault always seals a geode
    // Averaged richness: a vault floor out-yields the same floor on non-vault days.
    let vaultOre = mineLayoutFor(v, 4).ore.length, normSum = 0, normN = 0;
    for (let day = 1; day <= 30; day++) {
      if (isVaultFloor({ ...newSave(), day }, 4)) continue; // skip other vault days
      normSum += mineLayoutFor({ ...newSave(), day }, 4).ore.length; normN++;
    }
    expect(vaultOre).toBeGreaterThan(normSum / normN);
  });

  it('lootVault pays a one-time haul (cash + ore + geode) and awards the achievement once', () => {
    const s = newSave(); s.day = 2; s.money = 1000; s.geodes = 0;
    const haul = lootVault(s, 4);
    expect(haul).not.toBeNull();
    expect(s.money).toBe(1000 + haul!.cash);
    expect(haul!.cash).toBeGreaterThan(0);
    expect(s.minerals['crystal']).toBe(haul!.crystals);
    expect(s.minerals['opal']).toBe(haul!.opals);
    expect(s.geodes).toBe(haul!.geodes);
    expect(haul!.starstones).toBe(0); // floor 4 is too shallow for an astral stone
    // Looting again the same day+floor returns nothing (already looted).
    expect(lootVault(s, 4)).toBeNull();
    // A deeper vault floor (6+) tucks in an astral stone.
    const deep = newSave(); deep.day = 24;
    expect(isVaultFloor(deep, 7)).toBe(true);
    expect(lootVault(deep, 7)!.starstones).toBeGreaterThanOrEqual(1);
    // The first vault opened unlocks the 'vault' achievement.
    const a = newSave(); a.day = 15;
    expect(a.gameAch.includes('vault')).toBe(false);
    expect(unlockGameAch(a, 'vault')).toBe(true);
    expect(a.gameAch.includes('vault')).toBe(true);
    expect(unlockGameAch(a, 'vault')).toBe(false); // only once
  });

  it('the daily vault tracking resets when the day rolls over', () => {
    const s = newSave(); s.day = 2;
    lootVault(s, 4);
    expect(s.vaultsLooted.length).toBe(1);
    s.day = 3; mineLayoutFor(s, 1); // re-seeding for a new day clears the looted set
    expect(s.vaultsLooted.length).toBe(0);
  });

  it('mineChallengeFor is deterministic per day', () => {
    const a = newSave(); a.day = 7;
    const b = newSave(); b.day = 7;
    expect(mineChallengeFor(a).id).toBe(mineChallengeFor(b).id);
  });

  it('crackGeode consumes a geode and pays out something', () => {
    const s = newSave(); s.geodes = 1; s.money = 0;
    const before = { money: s.money, minerals: { ...s.minerals }, gacha: { ...s.gacha } };
    const res = crackGeode(s);
    expect(res).not.toBeNull();
    expect(s.geodes).toBe(0);
    const gainedMoney = s.money > before.money;
    const gainedMineral = Object.keys(s.minerals).length > 0;
    const gainedFigure = Object.keys(s.gacha).length > 0;
    expect(gainedMoney || gainedMineral || gainedFigure).toBe(true);
    expect(crackGeode(s)).toBeNull(); // none left
  });

  it('shrine favor secretly yields more/rarer ore and fewer crawlers (averaged)', () => {
    let baseOre = 0, baseRare = 0, baseCrawl = 0;
    let luckOre = 0, luckRare = 0, luckCrawl = 0;
    for (let day = 1; day <= 80; day++) {
      const plain = newSave(); plain.day = day;
      const blessed = newSave(); blessed.day = day; blessed.donated = 25000; // tier 2
      const a = mineLayoutFor(plain);
      const b = mineLayoutFor(blessed);
      baseOre += a.ore.length; baseCrawl += a.crawlers.length;
      baseRare += a.ore.filter(n => n.mineral.id !== 'shard').length;
      luckOre += b.ore.length; luckCrawl += b.crawlers.length;
      luckRare += b.ore.filter(n => n.mineral.id !== 'shard').length;
    }
    expect(luckOre).toBeGreaterThan(baseOre);     // more ore overall
    expect(luckRare).toBeGreaterThan(baseRare);   // and rarer ore
    expect(luckCrawl).toBeLessThan(baseCrawl);    // fewer monsters
  });
});

describe('greenhouse', () => {
  it('starts with empty plots, no sprinkler, 3 tilled beds', () => {
    const s = newSave();
    expect(s.greenhouse.sprinkler).toBe(false);
    expect(s.greenhouse.beds).toBe(3);
    expect(s.greenhouse.plots.length).toBeGreaterThanOrEqual(3);
    expect(s.greenhouse.plots.every(p => p.crop === null)).toBe(true);
  });

  it('seed → plant → water/grow → harvest → ship', () => {
    const s = newSave();
    const sun = CROPS.sunflower;
    // need a seed first
    expect(plantCrop(s, 0, 'sunflower')).toBe(false);
    s.greenhouse.seeds.sunflower = 2;
    expect(plantCrop(s, 0, 'sunflower')).toBe(true);
    expect(s.greenhouse.seeds.sunflower).toBe(1); // seed consumed
    expect(s.greenhouse.plots[0].crop).toBe('sunflower');
    expect(plotStage(s.greenhouse.plots[0])).toBe(0);
    expect(plotReady(s.greenhouse.plots[0])).toBe(false);
    // can't double-plant an occupied plot
    expect(plantCrop(s, 0, 'sunflower')).toBe(false);

    // no sprinkler + not watered → a new morning stalls growth
    const day0 = s.day;
    sleep(s); growGreenhouse(s);
    expect(s.greenhouse.plots[0].progress).toBe(0);

    // sprinkler on → each morning advances toward harvest
    s.greenhouse.sprinkler = true;
    for (let i = 0; i < sun.growDays; i++) { sleep(s); growGreenhouse(s); }
    expect(s.greenhouse.plots[0].progress).toBe(sun.growDays);
    expect(plotReady(s.greenhouse.plots[0])).toBe(true);
    expect(s.day).toBeGreaterThan(day0);

    // further mornings don't grow past ready
    sleep(s); growGreenhouse(s);
    expect(s.greenhouse.plots[0].progress).toBe(sun.growDays);

    // harvest ships produce (paid next morning) and clears the plot
    const res = harvestCrop(s, 0);
    expect(res).not.toBeNull();
    expect(res!.cropId).toBe('sunflower');
    expect(res!.value).toBeGreaterThan(0);
    expect(s.greenhouse.shipped.length).toBe(1);
    expect(s.greenhouse.plots[0].crop).toBeNull();
    // nothing to harvest from an empty plot
    expect(harvestCrop(s, 0)).toBeNull();

    // the shipping box pays out
    const before = s.money;
    const total = sellShipping(s);
    expect(total).toBe(res!.value);
    expect(s.money).toBe(before + total);
    expect(s.greenhouse.shipped.length).toBe(0);
  });
});

describe('placement helpers', () => {
  it('reports footprint width by item kind', () => {
    expect(itemFootprintW('bed')).toBeGreaterThanOrEqual(1);
  });
  it('place/unplace round-trips in s.placed', () => {
    const s: GameSave = newSave();
    expect(s.placed['lamp']).toBeUndefined();
    placeItem(s, 'lamp', 2, 2);
    expect(s.placed['lamp']).toEqual({ x: 2, y: 2 });
    unplaceItem(s, 'lamp');
    expect(s.placed['lamp']).toBeUndefined();
  });
  it('allFurnished is false on a fresh save', () => {
    expect(allFurnished(newSave())).toBe(false);
  });
});

describe('freshDayLog', () => {
  it('seeds startMoney and zeroes the counters', () => {
    const log = freshDayLog(1234);
    expect(log.startMoney).toBe(1234);
    expect(log.fishCaught).toBe(0);
    expect(log.newFurniture).toEqual([]);
  });
});

describe('morningT', () => {
  it('is full at wake and gone by mid-morning', () => {
    const s = newSave();
    s.timeMin = 7 * 60;       expect(morningT(s)).toBeCloseTo(1, 5);
    s.timeMin = 8.25 * 60;    expect(morningT(s)).toBeGreaterThan(0);
    s.timeMin = 9.5 * 60;     expect(morningT(s)).toBe(0);
    s.timeMin = 13 * 60;      expect(morningT(s)).toBe(0);
  });
});

describe('phone messages', () => {
  it('delivers earned messages once and tracks unread', () => {
    const s = newSave();
    // Day-1 store welcome texts are time-gated to buzz a few in-game minutes
    // after waking, so nothing lands at the exact wake minute.
    expect(syncMessages(s).length).toBe(0);
    // ...a little later in the day they arrive.
    s.timeMin += 30;
    const first = syncMessages(s);
    expect(first.length).toBeGreaterThan(0);
    expect(unreadCount(s)).toBe(s.messages.length);
    // re-running delivers nothing new (deduped)
    expect(syncMessages(s).length).toBe(0);
    // reading drops the unread count
    s.messages[0].read = true;
    expect(unreadCount(s)).toBe(s.messages.length - 1);
  });
});

describe('ZamaZonk', () => {
  it('prices include the ZamaPrime fee', () => {
    const bed = FURNITURE.find(f => f.id === 'bed')!;
    expect(zamazonkPrice(bed)).toBe(bed.price + ZAMAZONK_FEE);
  });
  it('an order debits cash and queues next-morning delivery', () => {
    const s = newSave();
    s.money = 50000;
    const bed = FURNITURE.find(f => f.id === 'bed')!;
    const price = zamazonkPrice(bed);
    expect(orderZamaZonk(s, 'bed', price)).toBe(true);
    expect(s.money).toBe(50000 - price);
    expect(s.orders).toEqual([{ itemId: 'bed', dueDay: s.day + 1 }]);
    // already in transit → not offered again, can't double-order
    expect(zamazonkCatalog(s).some(f => f.id === 'bed')).toBe(false);
    expect(orderZamaZonk(s, 'bed', price)).toBe(false);
  });
  it('rejects orders you cannot afford', () => {
    const s = newSave();
    s.money = 10;
    expect(orderZamaZonk(s, 'bed', zamazonkPrice(FURNITURE.find(f => f.id === 'bed')!))).toBe(false);
    expect(s.orders).toHaveLength(0);
  });
  it('fulfills due deliveries into the boxes on the right day', () => {
    const s = newSave();
    s.day = 5;
    s.orders = [{ itemId: 'bed', dueDay: 5 }, { itemId: 'tv', dueDay: 6 }];
    const delivered = fulfillDeliveries(s);
    expect(delivered).toEqual(['bed']);
    expect(s.owned).toContain('bed');
    expect(s.owned).not.toContain('tv');
    expect(s.orders).toEqual([{ itemId: 'tv', dueDay: 6 }]);
    expect(s.today.newFurniture).toContain('bed');
  });
});

describe('dayEventFor (special days)', () => {
  it('never fires on day 1', () => {
    const s = newSave();
    s.day = 1;
    expect(dayEventFor(s)).toBeNull();
  });
  it('is deterministic per day (stable across reloads)', () => {
    const s = newSave();
    for (const d of [6, 9, 15, 23]) {
      s.day = d;
      expect(dayEventFor(s)).toBe(dayEventFor({ ...s }));
    }
  });
  it('rolls the known seeded market & lucky days', () => {
    const s = newSave();
    s.day = 6; expect(dayEventFor(s)).toBe('market');
    s.day = 9; expect(dayEventFor(s)).toBe('lucky');
  });
  it('Market Day adds a pawn slot vs an ordinary day', () => {
    const plain = newSave(); plain.day = 7;   // ordinary
    const market = newSave(); market.day = 6; // Market Day
    expect(dayEventFor(plain)).toBeNull();
    expect(pawnStockFor(plain).length).toBe(PAWN_STOCK_SIZE);
    expect(pawnStockFor(market).length).toBe(PAWN_STOCK_SIZE + 1);
  });
  it('Market Day prices the sketchy deal at 80% of the usual discount', () => {
    const market = newSave(); market.day = 6;
    const plain = newSave(); plain.day = 7;
    const mo = sketchyOfferFor(market)!, po = sketchyOfferFor(plain)!;
    const mf = FURNITURE.find(f => f.id === mo.itemId)!;
    const pf = FURNITURE.find(f => f.id === po.itemId)!;
    expect(mo.price).toBe(Math.round(mf.price * SKETCHY_DISCOUNT * 0.8 / 10) * 10);
    expect(po.price).toBe(Math.round(pf.price * SKETCHY_DISCOUNT / 10) * 10);
  });
  it('Lucky Day scatters extra shore finds (6-8 vs the usual 4-6)', () => {
    const lucky = newSave(); lucky.scene = 'shore'; lucky.day = 9;
    const plain = newSave(); plain.scene = 'shore'; plain.day = 7;
    expect(dayEventFor(lucky)).toBe('lucky');
    const lc = shoreForageFor(lucky).length, pc = shoreForageFor(plain).length;
    expect(pc).toBeGreaterThanOrEqual(4); expect(pc).toBeLessThanOrEqual(6); // ordinary band
    expect(lc).toBeGreaterThanOrEqual(6); expect(lc).toBeLessThanOrEqual(8); // +2 lucky band
    // seeded → stable across reloads (verifies the +2 is baked into this day's roll)
    expect(shoreForageFor({ ...lucky, foragedSpots: [], forageDay: 0 }).length).toBe(lc);
  });
});

describe('weather variety (fog + meteor shower)', () => {
  it('never fogs or showers on day 1', () => {
    const s = newSave(); s.day = 1;
    expect(foggyDay(s)).toBe(false);
    expect(meteorNight(s)).toBe(false);
  });
  it('is deterministic per day (stable across reloads)', () => {
    const s = newSave();
    for (let d = 2; d <= 60; d++) {
      s.day = d;
      expect(foggyDay(s)).toBe(foggyDay({ ...s }));
      expect(meteorNight(s)).toBe(meteorNight({ ...s }));
    }
  });
  it('rolls the known seeded fog & meteor days', () => {
    const s = newSave();
    s.day = 14; expect(foggyDay(s)).toBe(true);    // a foggy day
    s.day = 13; expect(meteorNight(s)).toBe(true); // a meteor-shower night
    s.day = 9;  expect(foggyDay(s)).toBe(true);
    s.day = 25; expect(meteorNight(s)).toBe(true);
  });
  it('is mutually exclusive with rain and with each other (no day has two)', () => {
    const s = newSave();
    for (let d = 2; d <= 1500; d++) {
      s.day = d;
      const r = isRainyDay(s), f = foggyDay(s), m = meteorNight(s);
      expect(r && f).toBe(false); // rain wins over fog
      expect(f && m).toBe(false); // a meteor night is never foggy
      expect(r && m).toBe(false); // a meteor night is never rainy
    }
  });
  it('a rainy day is never foggy and never a meteor night (rain has priority)', () => {
    // forceRain makes any day rainy; fog/meteor must both back off.
    const s = newSave(); s.day = 14; s.forceRain = true; // day 14 is otherwise foggy
    expect(isRainyDay(s)).toBe(true);
    expect(foggyDay(s)).toBe(false);
    expect(meteorNight(s)).toBe(false);
  });
  it('keeps fog & meteor rates in their cozy/rare bands over a long stretch', () => {
    const s = newSave();
    let fog = 0, met = 0;
    const N = 5000;
    for (let d = 2; d <= N + 1; d++) { s.day = d; if (foggyDay(s)) fog++; if (meteorNight(s)) met++; }
    const fogPct = (fog / N) * 100, metPct = (met / N) * 100;
    expect(fogPct).toBeGreaterThan(10); expect(fogPct).toBeLessThan(15); // ~12% cozy fog
    expect(metPct).toBeGreaterThan(3);  expect(metPct).toBeLessThan(6);  // ~4% rare shower
  });
});

describe('cooking', () => {
  it('needs a fridge AND microwave placed to cook at home', () => {
    const s = newSave();
    expect(canCookHere(s)).toBe(false);
    s.placed['fridge'] = { x: 1, y: 4 };
    expect(canCookHere(s)).toBe(false);
    s.placed['microwave'] = { x: 3, y: 4 };
    expect(canCookHere(s)).toBe(true);
  });
  it('counts ingredients across the right pockets', () => {
    const s = newSave();
    s.fishInv = ['minnow', 'koi'];
    s.pantry = { rice: 2 };
    s.produce = { tomato: 3 };
    s.coconuts = 1;
    expect(ingredientCount(s, 'fish')).toBe(2);
    expect(ingredientCount(s, 'rice')).toBe(2);
    expect(ingredientCount(s, 'crop')).toBe(3);
    expect(ingredientCount(s, 'coconut')).toBe(1);
    expect(ingredientCount(s, 'egg')).toBe(0);
  });
  it('cooks a known recipe, consuming ingredients into a dish', () => {
    const s = newSave();
    s.fishInv = ['minnow'];
    s.pantry = { rice: 1 };
    expect(s.recipes).toContain('donburi'); // a starter
    expect(canCook(s, recipeById('donburi')!)).toBe(true);
    expect(cook(s, 'donburi')).toBe(true);
    expect(s.dishes['donburi']).toBe(1);
    expect(s.fishInv.length).toBe(0);
    expect(s.pantry['rice'] ?? 0).toBe(0);
    expect(cook(s, 'donburi')).toBe(false); // out of ingredients now
  });
  it('refuses to cook an unknown recipe even with ingredients', () => {
    const s = newSave();
    s.recipes = s.recipes.filter(r => r !== 'donburi');
    s.fishInv = ['minnow']; s.pantry = { rice: 1 };
    expect(cook(s, 'donburi')).toBe(false);
  });
  it('eating a dish restores energy and sets its day buff', () => {
    const s = newSave();
    s.dishes = { tamago: 1 };   // +55 energy, Hearty buff
    s.energy = 10;
    expect(eatDish(s, 'tamago')).toBe(true);
    expect(s.dishes['tamago'] ?? 0).toBe(0);
    expect(buffActive(s, 'hearty')).toBe(true);
    expect(s.energy).toBeGreaterThan(10);
  });
  it('Hearty lifts max energy; Warmed cuts energy cost; buffs expire next day', () => {
    const s = newSave();
    const baseMax = maxEnergy(s);
    s.buff = { id: 'hearty', day: s.day };
    expect(maxEnergy(s)).toBe(baseMax + 20);
    s.buff = { id: 'warm', day: s.day };
    expect(energyCost(s, 10)).toBeLessThan(10);
    s.day += 1; // a new day — yesterday's buff is dead
    expect(buffActive(s, 'warm')).toBe(false);
    expect(energyCost(s, 10)).toBe(10);
  });
  it('groceries buy into the pantry', () => {
    const s = newSave(); s.money = 1000;
    expect(buyGrocery(s, 'rice', 120)).toBe(true);
    expect(s.pantry['rice']).toBe(1);
    expect(s.money).toBe(880);
  });
});

describe('friendship', () => {
  it('hearts = points / 100, capped', () => {
    const s = newSave();
    s.friends['genji'] = { pts: 340, giftDay: -1 };
    expect(friendHearts(s, 'genji')).toBe(3);
    s.friends['genji'].pts = 99999;
    expect(friendHearts(s, 'genji')).toBe(MAX_HEARTS);
  });
  it('a loved gift adds more than a disliked one, and is once per day', () => {
    const s = newSave();
    const loved = giftTo(s, 'genji', 'fish');   // Genji loves fish
    expect(loved.tier).toBe('loved');
    expect(friendHearts(s, 'genji') >= 0).toBe(true);
    expect(s.friends['genji'].pts).toBe(GIFT_POINTS.loved);
    expect(canGiftToday(s, 'genji')).toBe(false); // already gifted today
    const s2 = newSave();
    giftTo(s2, 'genji', 'flower');               // Genji dislikes flowers
    expect(s2.friends['genji'].pts).toBe(Math.max(0, GIFT_POINTS.disliked));
  });
  it('heart-threshold perks teach recipes', () => {
    const s = newSave();
    expect(s.recipes).not.toContain('smoothie');
    s.friends['lulu'] = { pts: 300, giftDay: -1 }; // 3 hearts
    applyFriendPerks(s);
    expect(s.recipes).toContain('smoothie');
  });
  it('allFriendsMet: false until every FRIENDS id is present, then true', () => {
    const s = newSave();
    expect(allFriendsMet(s)).toBe(false);             // fresh save knows no one
    // Meet all but the last one — still not complete.
    for (const f of FRIENDS.slice(0, -1)) meetFriend(s, f.id);
    expect(allFriendsMet(s)).toBe(false);
    // Meet the final friend → complete.
    meetFriend(s, FRIENDS[FRIENDS.length - 1].id);
    expect(allFriendsMet(s)).toBe(true);
    expect(FRIENDS.every(f => f.id in s.friends)).toBe(true);
  });
  it('friendFlavorLine: null below 2 hearts, picks the highest unlocked tier', () => {
    const s = newSave();
    s.friends['granny'] = { pts: 0, giftDay: -1 };
    expect(friendFlavorLine(s, 'granny')).toBeNull();   // 0 hearts → neutral
    s.friends['granny'].pts = 200;                      // 2 hearts
    const t2 = friendFlavorLine(s, 'granny');
    expect(typeof t2).toBe('string');
    s.friends['granny'].pts = 800;                      // 8 hearts → warmest tier
    const t8 = friendFlavorLine(s, 'granny');
    expect(typeof t8).toBe('string');
    expect(t8).not.toBe(t2);                            // a deeper, different line
    // Shop-only friends have no line table → always null.
    s.friends['lulu'] = { pts: 800, giftDay: -1 };
    expect(friendFlavorLine(s, 'lulu')).toBeNull();
  });
});

describe('decor', () => {
  it('starts owning only the defaults', () => {
    const s = newSave();
    expect(ownsDecor(s, 'wall-default')).toBe(true);
    expect(ownsDecor(s, 'wall-sakura')).toBe(false);
    expect(s.decor.wall).toBe('wall-default');
  });
  it('buys then applies a wallpaper', () => {
    const s = newSave(); s.money = 9999;
    expect(applyDecor(s, 'wall-sakura')).toBe(false); // not owned yet
    expect(buyDecor(s, 'wall-sakura')).toBe(true);
    expect(ownsDecor(s, 'wall-sakura')).toBe(true);
    expect(applyDecor(s, 'wall-sakura')).toBe(true);
    expect(s.decor.wall).toBe('wall-sakura');
    expect(buyDecor(s, 'wall-sakura')).toBe(false); // can't re-buy
  });
  it('places and removes a 2x2 rug', () => {
    const s = newSave();
    placeRug(s, 'rug-red', 5, 5);
    expect(s.rugs.length).toBe(1);
    expect(rugAt(s, 6, 6)).toBe(0);   // within the 2x2 footprint
    expect(rugAt(s, 8, 8)).toBe(-1);  // outside
    expect(removeRugAt(s, 6, 6)).toBe(true);
    expect(s.rugs.length).toBe(0);
  });
});

describe('museum: the chicken nugget', () => {
  it('repurposes the arti-token slot as "A Single Chicken Nugget"', () => {
    const slot = MUSEUM_SLOTS.find(sl => sl.id === 'arti-token')!;
    expect(slot.label).toBe('A Single Chicken Nugget');
    // it is no longer a Bingus fetch (it's a random mine drop now)
    expect(BINGUS_FETCHES.some(f => f.slot === 'arti-token')).toBe(false);
  });
});

describe('skills (fish/mine/farm)', () => {
  it('starts every skill at level 0', () => {
    const s = newSave();
    expect(skillLevel(s, 'fish')).toBe(0);
    expect(skillLevel(s, 'mine')).toBe(0);
    expect(skillLevel(s, 'farm')).toBe(0);
  });
  it('derives level from cumulative XP thresholds', () => {
    const s = newSave();
    s.skills.fish = SKILL_XP[1] - 1; expect(skillLevel(s, 'fish')).toBe(0);
    s.skills.fish = SKILL_XP[1];     expect(skillLevel(s, 'fish')).toBe(1);
    s.skills.fish = SKILL_XP[3];     expect(skillLevel(s, 'fish')).toBe(3);
    s.skills.fish = 999999;          expect(skillLevel(s, 'fish')).toBe(10); // capped
  });
  it('addSkillXp returns the new level only when it goes up', () => {
    const s = newSave();
    expect(addSkillXp(s, 'mine', SKILL_XP[1] - 1)).toBe(0); // still level 0
    expect(addSkillXp(s, 'mine', 1)).toBe(1);               // crossed into level 1
    expect(addSkillXp(s, 'mine', 5)).toBe(0);               // no new level
    expect(s.skills.mine).toBe(SKILL_XP[1] + 5);
  });
  it('skillProgress reports into/need within the current level', () => {
    const s = newSave();
    s.skills.farm = SKILL_XP[2] + 10;
    const pr = skillProgress(s, 'farm');
    expect(pr.level).toBe(2);
    expect(pr.into).toBe(10);
    expect(pr.need).toBe(SKILL_XP[3] - SKILL_XP[2]);
  });
});

describe('apartment room + jukebox save fields', () => {
  it('defaults: not expanded, default home track', () => {
    const s = newSave();
    expect(s.roomUnlocked).toBe(false);
    expect(s.homeTrack).toBeNull();
    expect(ROOM_PRICE).toBeGreaterThan(0);
  });
});

describe('streetEventFor', () => {
  const at = (day: number) => streetEventFor({ ...newSave(), day });
  it('never spawns an event on day 1', () => {
    expect(at(1)).toBeNull();
  });
  it('is deterministic for a given day (stable across calls/reloads)', () => {
    for (const day of [2, 3, 5, 7, 13, 21, 40]) {
      const a = at(day);
      const b = at(day);
      expect(a?.id ?? null).toBe(b?.id ?? null);
    }
  });
  it('only ever returns events from the STREET_EVENTS table', () => {
    const ids = new Set(STREET_EVENTS.map(e => e.id));
    for (let day = 2; day <= 200; day++) {
      const ev = at(day);
      if (ev) expect(ids.has(ev.id)).toBe(true);
    }
  });
  it('places every event on a distinct, in-bounds city tile', () => {
    const seen = new Set<string>();
    for (const e of STREET_EVENTS) {
      expect(e.x).toBeGreaterThanOrEqual(0);
      expect(e.y).toBeGreaterThanOrEqual(0);
      const key = `${e.x},${e.y}`;
      expect(seen.has(key)).toBe(false); // no two events share a tile
      seen.add(key);
    }
  });
  it('reaches every event across a reasonable day range, and has some quiet days', () => {
    const got = new Set<string>();
    let quiet = 0;
    for (let day = 2; day <= 120; day++) {
      const ev = at(day);
      if (ev) got.add(ev.id); else quiet++;
    }
    expect(got.size).toBe(STREET_EVENTS.length); // all events are reachable
    expect(quiet).toBeGreaterThan(0);            // some days are deliberately empty
  });
});

describe('streetEventDoneToday', () => {
  it('is false until completed this day, true once streetEventDay matches', () => {
    const s = newSave();
    s.day = 5;
    expect(streetEventDoneToday(s)).toBe(false);
    s.streetEventDay = 5;
    expect(streetEventDoneToday(s)).toBe(true);
    s.day = 6; // a new day resets the gate
    expect(streetEventDoneToday(s)).toBe(false);
  });
});

describe('NPC daily routines', () => {
  // Which scene each routine NPC lives in (matches maps.ts npcs[]).
  const NPC_SCENE: Record<string, string> = {
    granny: 'city', charlie: 'city', miko: 'shrine', tex: 'shore', 'old-man': 'shore',
  };
  const tileSolidAt = (sceneId: string, x: number, y: number): boolean => {
    const sc = SCENES[sceneId];
    const ch = sc.grid[y]?.[x];
    return !!sc.legend[ch ?? '']?.solid;
  };

  it('timeBlock maps the clock to the four blocks (and wraps past midnight)', () => {
    expect(timeBlock(7 * 60)).toBe('morning');   // wake
    expect(timeBlock(10 * 60 + 59)).toBe('morning');
    expect(timeBlock(11 * 60)).toBe('midday');
    expect(timeBlock(15 * 60 + 59)).toBe('midday');
    expect(timeBlock(16 * 60)).toBe('evening');
    expect(timeBlock(19 * 60 + 59)).toBe('evening');
    expect(timeBlock(20 * 60)).toBe('night');
    expect(timeBlock(25 * 60)).toBe('night');     // 1 AM (past-midnight clock value)
    expect(timeBlock(26 * 60)).toBe('night');     // 2 AM collapse
  });

  it('routineTargetFor is deterministic per block and differs across the day', () => {
    const id = 'granny';
    const morning = routineTargetFor(id, 8 * 60)!;
    const midday = routineTargetFor(id, 13 * 60)!;
    // same block always yields the same tile (no randomness)
    expect(routineTargetFor(id, 8 * 60)).toEqual(routineTargetFor(id, 10 * 60));
    expect(routineTargetFor(id, 13 * 60)).toEqual(routineTargetFor(id, 15 * 60));
    // Granny moves greenhouse (morning) → pond (midday)
    expect(morning).not.toEqual(midday);
  });

  it('returns null for NPCs without a routine (they keep wander-near-spawn)', () => {
    expect(routineTargetFor('dancer', 8 * 60)).toBeNull();
    expect(routineTargetFor('yakuza', 8 * 60)).toBeNull();
  });

  it('every routine tile is walkable + in-bounds in its scene', () => {
    const blocks: RoutineBlock[] = ['morning', 'midday', 'evening', 'night'];
    for (const [id, stops] of Object.entries(ROUTINES)) {
      const sceneId = NPC_SCENE[id];
      expect(sceneId, `${id} needs a scene mapping`).toBeTruthy();
      const sc = SCENES[sceneId];
      // covers all four blocks
      expect(stops.map(s => s.block).sort()).toEqual([...blocks].sort());
      for (const st of stops) {
        expect(st.tile.x, `${id} ${st.block} x`).toBeGreaterThanOrEqual(0);
        expect(st.tile.y, `${id} ${st.block} y`).toBeGreaterThanOrEqual(0);
        expect(st.tile.y).toBeLessThan(sc.grid.length);
        expect(st.tile.x).toBeLessThan(sc.grid[0].length);
        expect(tileSolidAt(sceneId, st.tile.x, st.tile.y), `${id} ${st.block} tile must be walkable`).toBe(false);
      }
    }
  });
});
