// checkups.mjs — the named check table behind `npm run playtest -- checkup`.
// Each row is one end-to-end regression check the harness runs in a single
// browser session: seed the save → boot → drive inputs → eval `assert` against
// the live snapshot (same scope as `--assert`: money/scene/day/overlay/… + save).
//
// Add a row per mechanic you want guarded. Keep rows ROBUST:
//   - drive via `keys`/`hold` (real keyboard) or `click` (DOM button labels);
//     canvas pointer-drags (Arrange mode) and ref-mode QTEs can't be driven.
//   - `click` labels match by substring, comma = sequence ("PHONE,Messages").
//   - prefer asserting on snapshot/save state over screen contents.
//
// Row shape:
//   name     unique id (run one with: checkup --only <name>)
//   note     what this guards (shown on failure)
//   save     partial save merged over newSave() (null = NEW GAME flow)
//   keys / hold / click / wait   optional inputs, same semantics as CLI flags
//   keepOverlay  don't auto-dismiss the arrival overlay before inputs
//   assert   JS expression evaluated against the snapshot; truthy = pass

export const CHECKS = [
  {
    name: 'new-game-boots',
    note: 'NEW GAME → vibe picker → START lands in the apartment on day 1',
    save: null,
    assert: "scene==='apartment' && day===1 && screen==='playing'",
  },
  {
    name: 'phone-opens',
    note: 'P opens the phone menu overlay',
    save: { scene: 'city', px: 96, py: 224, visited: ['city'] },
    keys: 'p',
    assert: "overlay==='menu'",
  },
  {
    name: 'phone-messages-tab',
    note: 'HUD PHONE button → Messages app reaches the messages tab',
    save: { scene: 'city', px: 96, py: 224, visited: ['city'] },
    click: 'PHONE,Messages',
    assert: "overlay==='menu' && overlayData && overlayData.tab==='messages'",
  },
  {
    name: 'zamazonk-order',
    note: 'ZamaZonk order debits cash and queues a next-morning delivery',
    save: { scene: 'city', px: 96, py: 224, money: 40000, zamazonkApp: true, visited: ['city'] },
    click: 'PHONE,ZamaZonk,ORDER',
    assert: 'save.orders.length===1 && money<40000',
  },
  {
    name: 'seacave-exit-warp',
    note: 'walking onto the sea-cave daylight crack warps back to the island',
    save: { scene: 'seacave', px: 80, py: 80, vehicles: ['boat'], visited: ['island', 'seacave'] },
    hold: ['ArrowDown:700'],
    wait: 1200,
    assert: "scene==='island'",
  },
  {
    name: 'casino-backroom-curtain',
    note: 'with 30 lifetime casino wins the velvet curtain warps into the Kinryū backroom',
    save: { scene: 'casino', px: 112, py: 32, gangPaid: true, casinoWins: 30, visited: ['casino'] },
    hold: ['ArrowUp:700'],
    wait: 1200,
    assert: "scene==='backroom'",
  },
  {
    name: 'casino-backroom-locked',
    note: 'under 30 wins the doorman bodies you off the curtain approach',
    save: { scene: 'casino', px: 112, py: 32, gangPaid: true, casinoWins: 3, visited: ['casino'] },
    hold: ['ArrowUp:700'],
    wait: 800,
    assert: "scene==='casino'",
  },
  {
    name: 'collapse-at-2am',
    note: 'clock passing 26:00 forces the OUT COLD collapse-sleep overlay',
    save: { scene: 'apartment', px: 112, py: 80, timeMin: 1556, visited: ['apartment'] },
    wait: 4500,
    assert: "overlay==='sleep' && overlayData && overlayData.collapsed===true",
  },
  {
    name: 'mine-snapshot-live',
    note: 'mines expose floor/ladder runtime state to the harness',
    save: { scene: 'mines', px: 32, py: 32, backroomsUnlocked: true, wand: true, visited: ['mines'] },
    assert: 'mine && mine.floor===1 && mine.down && typeof mine.down.x==="number"',
  },
  {
    name: 'city-wanderers-alive',
    note: 'townsfolk wander the city without getting stuck',
    save: { scene: 'city', px: 96, py: 224, visited: ['city'] },
    wait: 3000,
    assert: 'wanderers.length>0 && wanderers.every(w=>!w.stuck)',
  },
  {
    name: 'money-not-negative',
    note: 'a fresh save never starts in debt',
    save: { scene: 'apartment', px: 112, py: 80, visited: ['apartment'] },
    assert: 'money>=0 && energy>0',
  },
  {
    name: 'journal-missions-tab',
    note: 'phone Journal app opens (missions section renders with it)',
    save: { scene: 'city', px: 96, py: 224, visited: ['city'] },
    click: 'PHONE,Journal',
    assert: "overlay==='menu' && overlayData && overlayData.tab==='journal'",
  },
  {
    name: 'journal-missions-pay',
    note: 'opening the Journal pays every newly-completed mission step once (5 × ¥300..800 = ¥2,600)',
    save: {
      scene: 'city', px: 96, py: 224, visited: ['city'], money: 3000,
      canFish: true, shiftsWorked: 1, donated: 500,
      fishLog: { minnow: 3 }, almanac: { minerals: [], forage: ['shell'] },
    },
    click: 'PHONE,Journal',
    assert: 'save.missionsDone.length===5 && money===5600',
  },
  {
    name: 'festival-goldfish-pays',
    note: 'Summer Matsuri (day 14): playing the goldfish stall pays ¥600 once + the matsuri trophy',
    save: { scene: 'city', px: 208, py: 252, dir: 'up', day: 14, money: 1000, visited: ['city'] },
    keys: 'e e',                              // open the stall dialog, snap the typewriter so the choices mount
    click: 'Scoop fast',
    wait: 900,
    assert: "money===1600 && save.storySeen.includes('festival-summer-matsuri-14') && save.gameAch.includes('matsuri')",
  },
  {
    name: 'derby-board-readable',
    note: 'derby day (day≡5 mod 10): the shore chalkboard DERBY sign opens the tier-list dialog',
    save: { scene: 'shore', px: 96, py: 92, dir: 'up', day: 15, canFish: true, visited: ['shore'] },
    keys: 'e',                                // facing the sign at (6,5) from (6,6)
    assert: "overlay==='dialog' && overlayData && /chalkboard/.test(overlayData.line)",
  },
  {
    name: 'phone-settings-tab',
    note: 'phone Settings app opens (save codes live on the title MANAGE SAVE panel, covered by unit tests)',
    save: { scene: 'city', px: 96, py: 224, visited: ['city'] },
    click: 'PHONE,Settings',
    assert: "overlay==='menu' && overlayData && overlayData.tab==='settings'",
  },
  {
    name: 'shadow-shore-appears',
    note: 'the shadow figure is interactive on the shore at 1:30 AM (talking opens The Shadow dialog)',
    save: { scene: 'shore', px: 336, py: 108, timeMin: 1532, day: 3, wishDay: 3, storySeen: ['arrive'], visited: ['shore'] },
    hold: ['ArrowRight:300'],
    keys: 'e',
    assert: "overlay==='dialog' && overlayData && overlayData.speaker==='The Shadow'",
  },
  {
    name: 'shadow-shore-hidden-by-day',
    note: 'before 1:30 AM the shadow figure is not there (E on his tile does nothing)',
    save: { scene: 'shore', px: 336, py: 108, timeMin: 1200, day: 3, wishDay: 3, storySeen: ['arrive'], visited: ['shore'] },
    hold: ['ArrowRight:300'],
    keys: 'e',
    assert: "overlay===null",
  },
  {
    name: 'moon-outside-time',
    note: 'on the moon the clock is frozen (timeMin does not advance; no 2 AM collapse)',
    save: { scene: 'moon', px: 144, py: 92, timeMin: 1556, visited: ['moon'] },
    wait: 4500,
    assert: "scene==='moon' && save.timeMin===1556 && overlay===null",
  },
  // --- Town-event attendance (derby / festival) -------------------------------
  // The bug these guard: the event crowd was drawn from the same sprites as live
  // routine NPCs, so a townsperson appeared at the event AND at their usual post.
  {
    name: 'derby-empties-the-town',
    note: 'on a derby day the attendees are gone from the city (no duplicate Granny/Charlie)',
    save: { scene: 'city', px: 96, py: 224, day: 15, timeMin: 780, visited: ['city'] },
    wait: 600,
    assert: "!wanderers.some(w => w.id==='granny' || w.id==='charlie')",
  },
  {
    name: 'derby-crowd-goes-home',
    note: 'after 8 PM on a derby day the attendees are back on their city routines',
    save: { scene: 'city', px: 96, py: 224, day: 15, timeMin: 1290, visited: ['city'] },
    wait: 600,
    assert: "wanderers.some(w => w.id==='granny') && wanderers.some(w => w.id==='charlie')",
  },
  {
    name: 'festival-empties-its-own-venue',
    note: 'day 28 is a SHRINE festival — Yoshi is at it, not on her shrine routine',
    save: { scene: 'shrine', px: 112, py: 76, day: 28, timeMin: 780, visited: ['shrine'] },
    wait: 600,
    assert: "!wanderers.some(w => w.id==='miko')",
  },
  {
    name: 'festival-leaves-other-venues-alone',
    note: 'day 14 is a CITY festival — Yoshi stays at her shrine (she is staged nowhere else)',
    save: { scene: 'shrine', px: 112, py: 76, day: 14, timeMin: 780, visited: ['shrine'] },
    wait: 600,
    assert: "wanderers.some(w => w.id==='miko')",
  },
  {
    name: 'derby-attendee-is-talkable',
    note: 'a townsperson staged at the derby is a real NPC you can talk to (quests intact)',
    save: { scene: 'shore', px: 32, py: 124, dir: 'right', day: 15, timeMin: 780, canFish: true, greenhouseUnlocked: true, visited: ['shore'] },
    keys: 'e',
    assert: "overlay==='dialog' && overlayData && overlayData.speaker==='Granny Sato'",
  },
  // --- Prestige purchases are gated behind the friend asking first -------------
  {
    name: 'shrine-restore-hidden-before-ask',
    note: "the ¥80k restoration reply doesn't exist until Yoshi has raised it",
    save: { scene: 'shrine', px: 144, py: 44, dir: 'down', day: 20, timeMin: 720, money: 200000, visited: ['shrine'] },
    keys: 'e',
    assert: "overlay==='dialog' && !save.shrineRestored && !save.storySeen.includes('shrine-restore-ask')",
  },
  {
    name: 'yoshi-raises-the-restoration',
    note: 'at 4 hearts (hangout already seen) Yoshi asks about the restoration, once',
    save: { scene: 'shrine', px: 112, py: 76, dir: 'down', day: 20, timeMin: 720, storySeen: ['hang-miko-4'], friends: { miko: { pts: 400, giftDay: -1 } }, visited: ['shrine'] },
    keys: 'e',
    assert: "save.storySeen.includes('shrine-restore-ask')",
  },
  // --- Towzawa comps a keepsake, not a second payday --------------------------
  {
    name: 'towzawa-comps-a-chip',
    note: 'the first audience grants the Kinryu house chip and leaves your money alone',
    save: { scene: 'backroom', px: 96, py: 44, dir: 'up', day: 20, timeMin: 1200, casinoWins: 30, money: 50000, visited: ['backroom'] },
    keys: 'e',
    assert: "money===50000 && save.keepsakes.includes('kinryu-chip') && save.storySeen.includes('backroom-met')",
  },
  // --- The museum tracker -----------------------------------------------------
  {
    name: 'collection-app-opens',
    note: 'the Collection app lists the museum slots once the museum is part of your life',
    save: { scene: 'city', px: 96, py: 224, visited: ['city', 'museum'], collectibles: ['arti-rock'] },
    click: 'PHONE,Collection',
    assert: "overlay==='menu' && overlayData && overlayData.tab==='collection'",
  },
  // --- Bailing out of a spin settles it, never eats the stake -----------------
  // Both rows assert on the PHASE, not on money: the stake is debited either way
  // and most spins pay nothing, so the cash balance looks identical whether the
  // outcome was settled or thrown away. phase 'done' = settled (paid what the
  // reels/wheel had already fixed); phase 'idle' = the old bug, stake gone.
  // The click sequence fires PULL/SPIN then the frame's close button back to
  // back, which lands while the reels are still turning.
  {
    name: 'slots-bail-settles',
    note: 'closing the slots panel mid-spin settles the fixed reels instead of eating the bet',
    save: { scene: 'casino', px: 192, py: 32, dir: 'up', money: 20000, gangPaid: true, visited: ['casino'] },
    keys: 'e',
    click: 'PULL,✕',
    wait: 900,
    assert: "overlay===null && casino.slotPhase==='done' && money===20000-casino.slotBet+casino.slotWin",
  },
  {
    name: 'roulette-bail-settles',
    note: 'closing the roulette panel mid-spin settles the wheel instead of eating the bet',
    save: { scene: 'casino', px: 112, py: 96, dir: 'up', money: 20000, gangPaid: true, visited: ['casino'] },
    keys: 'e',
    click: 'SPIN,✕',
    wait: 900,
    assert: "overlay===null && casino.roulPhase==='done' && money===20000-casino.roulBet+casino.roulWin",
  },
  // --- The Hacker: the sea-cave hatch, the closet, the ride to Paris ----------
  // The hatch tile is baked into the seacave grid from day one but is sealed (and
  // overpainted with cave wall) until The Manager names the man behind it, so the
  // pair of rows below guard BOTH halves of that: a dead end before, a door after.
  {
    name: 'seacave-hatch-sealed',
    note: 'before The Manager names the Hacker, the back of the sea cave is solid rock',
    save: { scene: 'seacave', px: 80, py: 16, dir: 'up', vehicles: ['boat'], parisRevealed: false, visited: ['seacave'] },
    hold: ['ArrowUp:900'],
    assert: "scene==='seacave'",
  },
  {
    name: 'seacave-hatch-opens',
    note: 'once parisRevealed is set the hatch is a real door into the server closet',
    save: { scene: 'seacave', px: 80, py: 16, dir: 'up', vehicles: ['boat'], parisRevealed: true, visited: ['seacave'] },
    hold: ['ArrowUp:900'],
    assert: "scene==='hackerlab'",
  },
  {
    name: 'hacker-talks-in-a-terminal',
    note: 'the server-closet TERMINAL is the Hacker — walking up to the screen opens his term dialog and logs the meeting',
    save: { scene: 'hackerlab', px: 80, py: 96, dir: 'up', parisRevealed: true, visited: ['hackerlab'] },
    keys: 'e',
    wait: 400,
    assert: "overlay==='dialog' && save.storySeen.includes('hacker-met')",
  },
  {
    name: 'paris-door-goes-home',
    note: 'the blue door at the west end of the Paris row sets you down in your own apartment',
    save: { scene: 'paris', px: 48, py: 128, dir: 'up', parisRevealed: true, storySeen: ['paris-intro'], visited: ['paris'] },
    hold: ['ArrowUp:900'],
    assert: "scene==='apartment'",
  },
  {
    name: 'backrooms-seam-is-sealed',
    note: 'the old Paris seam never opens any more — it is a scar, not a door',
    save: { scene: 'backrooms', px: 128, py: 16, dir: 'up', backroomsUnlocked: true, wand: true, parisRevealed: true, visited: ['backrooms'] },
    keys: 'e',
    wait: 300,
    assert: "scene==='backrooms' && overlay==='dialog'",
  },

  // ---- Derby day leaves nobody minding the shop -------------------------------
  // Day 15 is a derby day (`day % 10 === 5`, never day 1) and 10:00 is inside the
  // crowd window (derby packs up at 20:00). Kojima is a derby attendee, so the
  // garage is empty — but its counter and job board used to serve you anyway.
  // See STAFFED_INTERACTABLES, and the write-up in kb/future-ideas.md.
  {
    name: 'derby-shuts-the-garage-counter',
    note: 'on a derby day the Vehicles counter bounces instead of opening the shop — Kojima is on the sand',
    save: { scene: 'garage', day: 15, timeMin: 600, px: 88, py: 92, dir: 'up', money: 200000, storySeen: ['arrive'], visited: ['garage'] },
    keys: 'e',
    wait: 500,
    assert: "overlay==='dialog' && (!overlayData || overlayData.shop===undefined)",
  },
  {
    name: 'derby-shuts-the-dispatch-board',
    note: 'on a derby day the delivery clipboard bounces instead of starting the run',
    save: { scene: 'garage', day: 15, timeMin: 600, px: 152, py: 28, dir: 'up', money: 200000, storySeen: ['arrive'], visited: ['garage'] },
    keys: 'e',
    wait: 500,
    assert: "overlay==='dialog' && drive.active===false",
  },
  {
    // The CONTROL, and the more important of the two: it catches a future gate
    // that closes the garage on an ordinary day.
    name: 'garage-counter-open-on-a-normal-day',
    note: 'day 14 is not a derby day — the Vehicles counter must still open',
    save: { scene: 'garage', day: 14, timeMin: 600, px: 88, py: 92, dir: 'up', money: 200000, storySeen: ['arrive'], visited: ['garage'] },
    keys: 'e',
    wait: 500,
    assert: "overlay==='shop' && overlayData.shop==='garage'",
  },

  // ---- The corrupted thirteenth museum curio ----------------------------------
  // Only exists on a save that came back from ████████.EXE (save.corruptDone).
  // See MUSEUM_SLOTS 'arti-corrupt' / MUSEUM_FINDS `gated: 'corruption'`.
  {
    name: 'corrupt-curio-absent-normally',
    note: 'no corrupted curio on the apartment floor unless you went through ████████.EXE',
    save: { scene: 'apartment', px: 40, py: 60, dir: 'up', storySeen: ['arrive'], visited: ['apartment'] },
    keys: 'e',
    wait: 400,
    assert: 'save.collectibles.length===0',
  },
  {
    name: 'corrupt-wake-sets-corrupt-done',
    note: 'begin() consumes the one-shot corruptWake and leaves the permanent corruptDone behind',
    save: { scene: 'city', px: 96, py: 224, corruptWake: true, storySeen: ['arrive'], visited: ['city'] },
    wait: 400,
    assert: "save.corruptWake===false && save.corruptDone===true && scene==='apartment'",
  },
  {
    name: 'corrupt-curio-on-the-floor',
    note: 'with corruptDone set, the curio is beside the bed at (3,3) and pockets with its own text',
    save: { scene: 'apartment', px: 40, py: 60, dir: 'up', corruptDone: true, storySeen: ['arrive'], visited: ['apartment'] },
    keys: 'e',
    wait: 500,
    assert: "save.collectibles.includes('arti-corrupt') && overlayData.speaker==='████████'",
  },
  {
    name: 'corrupt-curio-donates-off-tally',
    note: 'donating the 13th fills its corner plinth without moving the N-of-12 tally or paying the curator bonus',
    save: { scene: 'museum', px: 216, py: 76, dir: 'up', money: 20000, corruptDone: true,
      collectibles: ['arti-corrupt'], storySeen: ['arrive'], visited: ['museum'] },
    keys: 'e',
    wait: 500,
    assert: "save.museum.donated.includes('arti-corrupt') && money===20000 && !save.gameAch.includes('curator')",
  },
  {
    name: 'museum-completes-without-the-13th',
    note: 'the core 12 still complete and pay ¥10,000 with the corrupted slot empty — it must never gate 100%',
    save: { scene: 'museum', px: 168, py: 76, dir: 'up', money: 20000, collectibles: ['arti-meteor'],
      storySeen: ['arrive'], visited: ['museum'],
      museum: { donated: ['art-alley', 'art-madonna', 'art-bento', 'art-cat', 'arti-coin',
        'arti-token', 'arti-onigiri', 'arti-rock', 'arti-lure', 'arti-shard', 'arti-capsule'] } },
    keys: 'e',
    wait: 500,
    assert: "money===30000 && save.gameAch.includes('curator') && !save.museum.donated.includes('arti-corrupt')",
  },
  {
    // Spoiler guard, PARTIAL. Without the optional-slot filter the Collection app
    // advertises "0 of 13" plus a 13th ??? row on a brand-new save, giving away
    // both that a hidden exhibit exists and that you are missing it.
    // NOTE: the snapshot carries no panel TEXT (overlayData for a menu is just
    // {tab, thread, unread}), so this row only proves the app still opens after
    // the filter change — it cannot see the "of 12" itself. The count is covered
    // by `museumDonatedCore` in tests/state.test.ts; the rendering was checked by
    // eye (playtest shot --full). Tighten this row if the snapshot ever exposes
    // panel contents.
    // Distinct from `collection-app-opens` above (which seeds a held curio):
    // this is the FRESH-save path, where every slot including the optional 13th
    // is 'unfound' and the filter has to drop one. Names must be unique —
    // `--only <name>` matches by name and a duplicate runs both.
    name: 'collection-app-opens-on-a-fresh-save',
    note: 'the Collection app still renders with no curios found at all (the optional-slot filter drops the 13th row)',
    save: { scene: 'city', px: 96, py: 224, visited: ['city', 'museum'], metStores: ['museum'] },
    click: 'PHONE,Collection',
    wait: 400,
    assert: "overlay==='menu' && overlayData.tab==='collection'",
  },
  {
    // The corner plinth must not name what it wants — every other empty display
    // does, and this one's name is the secret.
    name: 'corner-plinth-keeps-its-mouth-shut',
    note: 'the empty 13th plinth shows the no-brass-plate line, never the ████████.rec label',
    save: { scene: 'museum', px: 216, py: 76, dir: 'up', storySeen: ['arrive'], visited: ['museum'] },
    keys: 'e',
    wait: 500,
    assert: "overlay==='dialog' && overlayData.line.includes('far corner') && !overlayData.line.includes('.rec')",
  },
  {
    // Ordering bug: complete the core 12 FIRST (curator paid), then donate the
    // 13th. `museumComplete` is still true afterwards, so without the
    // `!slot.optional` guard the ¥10,000 pays a second time and Bingus weeps
    // over a museum he finished days ago. The other donate row seeds an
    // incomplete gallery and cannot see this.
    name: 'corrupt-curio-pays-no-second-bonus',
    note: 'donating the 13th to an ALREADY-complete museum must not re-pay ¥10,000 or re-run the completion scene',
    save: { scene: 'museum', px: 216, py: 76, dir: 'up', money: 20000, corruptDone: true,
      collectibles: ['arti-corrupt'], gameAch: ['curator'], storySeen: ['arrive'], visited: ['museum'],
      museum: { donated: ['art-alley', 'art-madonna', 'art-bento', 'art-cat', 'arti-coin', 'arti-token',
        'arti-onigiri', 'arti-rock', 'arti-lure', 'arti-shard', 'arti-capsule', 'arti-meteor'] } },
    keys: 'e',
    wait: 500,
    assert: "money===20000 && save.museum.donated.includes('arti-corrupt') && overlayData.line.includes('corner plinth')",
  },
  {
    // Anyone who went through ████████.EXE before `corruptDone` existed has
    // already spent the one-shot corruptWake, and corruptionAvailable refuses to
    // run it twice — so without the mergeSave grandfather they could never reach
    // the one piece of content written for them.
    name: 'old-corrupted-save-still-gets-the-curio',
    note: "a pre-existing save with 'corrupt-run' in storySeen is grandfathered into corruptDone on load",
    save: { scene: 'apartment', px: 40, py: 60, dir: 'up', storySeen: ['arrive', 'corrupt-run'], visited: ['apartment'] },
    keys: 'e',
    wait: 500,
    assert: "save.corruptDone===true && save.collectibles.includes('arti-corrupt')",
  },
];
