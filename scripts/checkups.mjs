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
];
