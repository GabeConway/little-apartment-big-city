import { describe, it, expect } from 'vitest';
import {
  newSave, freshDayLog, maxEnergy, energyCost, sleep, clockLabel, nightT,
  buyFurniture, shrineLuck, gachaComplete, pawnStockFor, sketchyOfferFor,
  allFurnished, itemFootprintW, spotFree, placeItem, unplaceItem,
  WAKE_MIN, type GameSave,
  morningT, syncMessages, unreadCount, zamazonkCatalog, zamazonkPrice,
  orderZamaZonk, fulfillDeliveries, ZAMAZONK_FEE, mineLayoutFor,
} from '../src/game/state';
import { BASE_MAX_ENERGY, FURNITURE, PAWN_STOCK_SIZE, GACHA_FIGURES } from '../src/game/data';
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
    s.minedNodes.push(`${gone.x},${gone.y}`);
    const after = mineLayoutFor(s);
    expect(after.ore.some(n => n.x === gone.x && n.y === gone.y)).toBe(false);
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

describe('placement helpers', () => {
  it('reports footprint width by item kind', () => {
    expect(itemFootprintW('bed')).toBeGreaterThanOrEqual(1);
  });
  it('place/unplace round-trips and spotFree reflects occupancy', () => {
    const s: GameSave = newSave();
    expect(spotFree(s, 2, 2)).toBe(true);
    placeItem(s, 'lamp', 2, 2);
    expect(spotFree(s, 2, 2)).toBe(false);
    unplaceItem(s, 'lamp');
    expect(spotFree(s, 2, 2)).toBe(true);
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
