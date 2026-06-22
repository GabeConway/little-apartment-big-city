// Little Apartment, Big City — content tables: furniture, fish, food, story.

export interface Furniture {
  id: string;
  name: string;
  price: number;          // full price at Den Den Electric
  blurb: string;          // shop description (also states the gameplay effect)
  sprite: string;         // atlas key
  pawnable: boolean;      // can appear used at the pawn shop
}

// Apartment slots are defined in maps.ts; every item has exactly one slot.
export const FURNITURE: Furniture[] = [
  { id: 'bed', name: 'Real Bed', price: 12000, sprite: 'f-bed', pawnable: true,
    blurb: 'No more futon on the floor. Sleeping restores ALL energy.' },
  { id: 'microwave', name: 'Microwave', price: 6000, sprite: 'f-microwave', pawnable: true,
    blurb: '500 watts of possibility. +10 max energy (hot breakfasts).' },
  { id: 'fridge', name: 'Refrigerator', price: 9000, sprite: 'f-fridge', pawnable: true,
    blurb: 'Keeps things cold, including your barley tea. +10 max energy.' },
  { id: 'ac', name: 'Air Conditioner', price: 8000, sprite: 'f-ac', pawnable: true,
    blurb: 'Summer in the city is no joke. Everything costs 20% less energy.' },
  { id: 'tv', name: 'Television', price: 7000, sprite: 'f-tv', pawnable: true,
    blurb: 'For the morning news and late-night dramas.' },
  { id: 'desk', name: 'Desk', price: 5000, sprite: 'f-desk', pawnable: true,
    blurb: 'A place to write letters home.' },
  { id: 'sofa', name: 'Sofa', price: 8500, sprite: 'f-sofa', pawnable: true,
    blurb: 'Two cushions. Room for a guest, someday.' },
  { id: 'bookshelf', name: 'Bookshelf', price: 4000, sprite: 'f-bookshelf', pawnable: true,
    blurb: 'Bring your books out of their moving boxes.' },
  { id: 'lamp', name: 'Floor Lamp', price: 2500, sprite: 'f-lamp', pawnable: true,
    blurb: 'Warm light beats the bare ceiling bulb.' },
  { id: 'plant', name: 'Potted Plant', price: 1500, sprite: 'f-plant', pawnable: false,
    blurb: 'Something alive to look after.' },
];

// Rare furniture — sold only by the monster in the backrooms. Separate list so
// it never affects the base furnish-to-win math.
export const RARE_FURNITURE: Furniture[] = [
  { id: 'kotatsu', name: 'Kotatsu', price: 14000, sprite: 'f-kotatsu', pawnable: false,
    blurb: 'A heated table from somewhere... else. +10 max energy.' },
  { id: 'aquarium', name: 'Aquarium', price: 18000, sprite: 'f-aquarium', pawnable: false,
    blurb: 'The fish inside watches you back. Lovingly.' },
  { id: 'arcade', name: 'Arcade Cabinet', price: 22000, sprite: 'f-arcade', pawnable: false,
    blurb: 'One credit, infinite continues. The high score is not yours.' },
  { id: 'neon', name: 'Neon Sign', price: 9000, sprite: 'f-neon', pawnable: false,
    blurb: 'Says "HOME" in a color that does not exist outside.' },
];

export const allFurnitureById = (id: string): Furniture =>
  (FURNITURE.find(f => f.id === id) ?? RARE_FURNITURE.find(f => f.id === id))!;

export const furnitureById = (id: string): Furniture => allFurnitureById(id);

// Vehicles — Kojima Motors in the bad side of town.
export interface Vehicle { id: string; name: string; price: number; blurb: string; sprite: string }
export const VEHICLES: Vehicle[] = [
  { id: 'car', name: 'Used Kei Car', price: 75000, sprite: 'v-car',
    blurb: 'The endgame on four wheels. Drive anywhere outdoors, park anywhere, very fast.' },
  { id: 'boat', name: 'Old Skiff', price: 22000, sprite: 'v-boat',
    blurb: 'Floats, mostly. Deep water, and — they say — a tropical island.' },
];
export const vehicleById = (id: string): Vehicle => VEHICLES.find(v => v.id === id)!;

// Sketchy street dealer — deep discount, fifty-fifty the thing is cardboard.
export const SKETCHY_DISCOUNT = 0.35;
export const SKETCHY_BREAK_CHANCE = 0.5;

// Furniture footprints for the placement system.
export type SpotKind = 'wall' | 'wide' | 'single';
export const itemKind = (id: string): SpotKind => {
  if (id === 'ac' || id === 'neon') return 'wall';
  if (id === 'bed' || id === 'sofa' || id === 'kotatsu') return 'wide';
  return 'single';
};

// In-game achievements — completely separate from the site-wide system in
// utils/achievements.ts (which feeds the cake). These live in the game save.
export interface GameAchievement { id: string; title: string; desc: string; hint: string }
export const GAME_ACHIEVEMENTS: GameAchievement[] = [
  { id: 'first-fish', title: 'way down yonder', desc: 'Caught your first fish.', hint: 'The shore is west of the street.' },
  { id: 'deep', title: 'Open Water', desc: 'Caught a deep-water fish from the skiff.', hint: 'Some fish never see the shallows.' },
  { id: 'golden', title: "Genji's Ghost", desc: 'Caught the Golden Carp.', hint: 'Forty years, he never caught it.' },
  { id: 'club', title: 'Sixteen Bars', desc: 'Visited Club Kaiju.', hint: 'The bad side of town still dances.' },
  { id: 'wheels', title: 'Kei to the City', desc: 'Bought the kei car.', hint: 'Kojima has something that runs.' },
  { id: 'captain', title: 'Three-Tatami Navy', desc: 'Bought the old skiff.', hint: 'Kojima has something that floats.' },
  { id: 'scammed', title: 'Tape and Regret', desc: "One of Jimmy's deals broke on the way home.", hint: 'The discount knows why.' },
  { id: 'bargain', title: 'Told You. Quality.', desc: "One of Jimmy's deals actually survived.", hint: 'Sometimes the truck is kind.' },
  { id: 'backrooms', title: 'No Back Wall', desc: 'Stepped through the crack behind the konbini.', hint: 'Corporate says there is no back wall.' },
  { id: 'rare-one', title: 'Customer of the Void', desc: 'Acquired furniture from The Manager.', hint: 'It bows politely. It does not take cash.' },
  { id: 'hat', title: '$67', desc: "Bought Tex's cowboy hat.", hint: 'One hat. One price. One dream.' },
  { id: 'gacha-set', title: 'Ten of Ten', desc: 'Completed the gachapon set.', hint: 'Mr. Maeda has had nine for three years.' },
  { id: 'shift-5', title: 'Employee of the Months', desc: 'Worked five konbini shifts.', hint: 'Yuki appreciates the company.' },
  { id: 'rich', title: 'Fifty Stacks', desc: 'Held ¥50,000 at once.', hint: 'The fish add up.' },
  { id: 'night-owl', title: 'Past Last Train', desc: 'Stayed out past 2 AM and woke up home anyway.', hint: 'The city carries you back, eventually.' },
  { id: 'wand', title: 'Magical Girl', desc: 'Bought the wand from The Manager.', hint: 'It handles most transactions down there.' },
  { id: 'miner', title: 'Yellow Rock Candy', desc: 'Mined your first mineral.', hint: 'The backrooms go further down.' },
  { id: 'slayer', title: 'Sparkle Sparkle', desc: 'Defeated a crawler with the wand.', hint: 'They scatter like bad thoughts.' },
  { id: 'crafted', title: 'Void Carpenter', desc: 'Crafted furniture from minerals.', hint: 'The Manager accepts more than money.' },
  { id: 'blessed', title: 'Five Thousand Yen Faith', desc: 'Earned the shrine\'s favor. The fish noticed.', hint: 'The little shrine in the park accepts offerings.' },
  { id: 'furnished', title: 'Welcome Home', desc: 'Furnished the whole apartment.', hint: 'The whole point.' },
  { id: 'broke', title: 'i dont have enough money for chicken nugget', desc: 'Dropped under ¥100. The nuggets remain a dream.', hint: 'Spend almost all of it.' },
];

// ---- The mines (below the backrooms) ------------------------------------------

export interface Mineral { id: string; name: string; value: number; weight: number; color: string }
export const MINERALS: Mineral[] = [
  { id: 'shard', name: 'Yellow Shard', value: 150, weight: 12, color: '#ffd24a' },
  { id: 'crystal', name: 'Hum Crystal', value: 400, weight: 6, color: '#7ce8e0' },
  { id: 'opal', name: 'Void Opal', value: 900, weight: 2, color: '#b06ad0' },
];
export const mineralById = (id: string): Mineral => MINERALS.find(m => m.id === id)!;

export const MINE_COST = 5;            // energy per swing at an ore node
export const WAND_PRICE = 3000;        // The Manager's price for the wand
export const CRAWLER_HIT_ENERGY = 8;   // energy lost when a crawler gets you

// Craft the Manager's rare furniture from minerals instead of paying cash.
export const CRAFT_RECIPES: Record<string, Record<string, number>> = {
  kotatsu: { shard: 6, crystal: 2 },
  aquarium: { crystal: 4, opal: 1 },
  arcade: { crystal: 6, opal: 2 },
  neon: { shard: 8, opal: 1 },
};

// Gachapon — ¥300 a capsule, 10 figures to collect. Full set = golden maneki trophy.
export const GACHA_PRICE = 300;
export const GACHA_FIGURES: string[] = [
  'Salaryman Cat', 'Tower Crab', 'Drift King', 'Melon Soda-kun', 'Pixel Gabe',
  'Konbini Ghost', 'Mini Golden Carp', 'Robot Vacuum', 'Bonsai Buddy', 'UFO Catcher',
];

export const PAWN_DISCOUNT = 0.55;        // pawn shop sells at 55% of full price
export const PAWN_STOCK_SIZE = 3;

export interface Fish {
  id: string;
  name: string;
  value: number;
  weight: number;         // roll weight (higher = more common)
  difficulty: number;     // 0..1 — how erratically it moves in the minigame
  sprite: string;
}

export const FISH: Fish[] = [
  { id: 'minnow', name: 'Tiny Minnow', value: 80, weight: 30, difficulty: 0.15, sprite: 'fish-minnow' },
  { id: 'mackerel', name: 'Mackerel', value: 180, weight: 24, difficulty: 0.3, sprite: 'fish-mackerel' },
  { id: 'bream', name: 'Sea Bream', value: 320, weight: 16, difficulty: 0.45, sprite: 'fish-bream' },
  { id: 'squid', name: 'Squid', value: 380, weight: 12, difficulty: 0.5, sprite: 'fish-squid' },
  { id: 'eel', name: 'River Eel', value: 500, weight: 8, difficulty: 0.65, sprite: 'fish-eel' },
  { id: 'puffer', name: 'Pufferfish', value: 700, weight: 5, difficulty: 0.75, sprite: 'fish-puffer' },
  { id: 'koi', name: 'Lost Koi', value: 950, weight: 3, difficulty: 0.85, sprite: 'fish-koi' },
  { id: 'golden', name: 'Golden Carp', value: 1800, weight: 1, difficulty: 1, sprite: 'fish-golden' },
];

// Deep water (needs the skiff): bigger fish, no minnows out here.
export const DEEP_FISH: Fish[] = [
  { id: 'squid', name: 'Squid', value: 380, weight: 14, difficulty: 0.5, sprite: 'fish-squid' },
  { id: 'eel', name: 'River Eel', value: 500, weight: 12, difficulty: 0.65, sprite: 'fish-eel' },
  { id: 'puffer', name: 'Pufferfish', value: 700, weight: 10, difficulty: 0.75, sprite: 'fish-puffer' },
  { id: 'koi', name: 'Lost Koi', value: 950, weight: 8, difficulty: 0.85, sprite: 'fish-koi' },
  { id: 'tuna', name: 'Bluefin Tuna', value: 2400, weight: 7, difficulty: 0.8, sprite: 'fish-tuna' },
  { id: 'angler', name: 'Anglerfish', value: 3200, weight: 4, difficulty: 0.92, sprite: 'fish-angler' },
  { id: 'golden', name: 'Golden Carp', value: 1800, weight: 3, difficulty: 1, sprite: 'fish-golden' },
];

// Kiwami Island waters
export const TROPICAL_FISH: Fish[] = [
  { id: 'parrot', name: 'Parrotfish', value: 850, weight: 14, difficulty: 0.55, sprite: 'fish-parrot' },
  { id: 'squid', name: 'Squid', value: 380, weight: 10, difficulty: 0.5, sprite: 'fish-squid' },
  { id: 'puffer', name: 'Pufferfish', value: 700, weight: 8, difficulty: 0.75, sprite: 'fish-puffer' },
  { id: 'koi', name: 'Lost Koi', value: 950, weight: 5, difficulty: 0.85, sprite: 'fish-koi' },
  { id: 'marlin', name: 'Blue Marlin', value: 4000, weight: 2, difficulty: 0.97, sprite: 'fish-marlin' },
  { id: 'golden', name: 'Golden Carp', value: 1800, weight: 2, difficulty: 1, sprite: 'fish-golden' },
];

export const fishById = (id: string): Fish =>
  (FISH.find(f => f.id === id) ?? DEEP_FISH.find(f => f.id === id) ?? TROPICAL_FISH.find(f => f.id === id))!;

export const rollFish = (rand: () => number, table: Fish[] = FISH): Fish => {
  const total = table.reduce((s, f) => s + f.weight, 0);
  let r = rand() * total;
  for (const f of table) { r -= f.weight; if (r <= 0) return f; }
  return table[0];
};

export interface Food { id: string; name: string; price: number; energy: number }
export const KONBINI_FOOD: Food[] = [
  { id: 'coffee', name: 'Can Coffee', price: 150, energy: 12 },
  { id: 'onigiri', name: 'Onigiri', price: 200, energy: 20 },
  { id: 'sando', name: 'Egg Sando', price: 320, energy: 32 },
  { id: 'bento', name: 'Deluxe Bento', price: 550, energy: 60 },
];

// Energy economy
export const BASE_MAX_ENERGY = 100;
export const CAST_COST = 8;
export const SHIFT_COST = 35;
export const SHIFT_PAY = 1800;
export const SLEEP_RESTORE_FUTON = 85;     // % of max without a real bed

// ---- Story --------------------------------------------------------------
// Beats unlock as the apartment fills in. Each is a letter or journal entry.

export interface StoryBeat {
  id: string;
  title: string;
  from: string;
  lines: string[];
  // beat fires when this returns true (checked after purchases and on waking)
  when: (owned: string[]) => boolean;
}

export const STORY_BEATS: StoryBeat[] = [
  {
    id: 'arrive', title: 'Day One', from: 'your journal',
    when: () => true,
    lines: [
      'The lease says 1K, 19 square meters. The agent called it "cozy." The agent was generous.',
      'Everything I own fits in two boxes and one suitcase. The futon goes on the floor. The floor is the furniture now.',
      'Out the window: a city that goes on forever, vending machines humming on every corner, a train somewhere always arriving.',
      'I have a little money saved. Time to make this place a home.',
    ],
  },
  {
    id: 'first-item', title: 'A Start', from: 'your journal',
    when: owned => owned.length >= 1,
    lines: [
      'Bought my first real thing for the apartment today. Carried it home through the evening crowd like a trophy.',
      'The room looks different with something in it. Less like a storage unit, more like a beginning.',
    ],
  },
  {
    id: 'bed', title: 'Letter from Grandma', from: 'Grandma',
    when: owned => owned.includes('bed'),
    lines: [
      'Dear sleepyhead,',
      'Your mother tells me you have been sleeping on the floor like a stray cat. I am glad to hear you finally bought a proper bed.',
      'A person who sleeps well can do anything. A person who sleeps on the floor only does laundry late.',
      'Eat real vegetables. Not the convenience store kind.',
      '— Grandma',
    ],
  },
  {
    id: 'kitchen', title: 'A Working Kitchen', from: 'your journal',
    when: owned => owned.includes('microwave') && owned.includes('fridge'),
    lines: [
      'The fridge hums in the corner and the microwave clock blinks the wrong time, and together they make this kitchen real.',
      'Cooked my first hot meal at home tonight. Well — "cooked." The microwave did the hard part.',
      'It tasted like progress.',
    ],
  },
  {
    id: 'ac', title: 'Cool Air', from: 'your journal',
    when: owned => owned.includes('ac'),
    lines: [
      'The AC came to life with a click and a sigh, and the whole apartment exhaled with it.',
      'The old man at the pier says the fish bite better when you are comfortable. I think he makes up half of what he says.',
      'I believe him anyway.',
    ],
  },
  {
    id: 'tv', title: 'Voices in the Room', from: 'your journal',
    when: owned => owned.includes('tv'),
    lines: [
      'Turned on the TV and the apartment filled with voices. A cooking show. A weather woman promising rain.',
      'It is strange how much less alone a room feels when the weather woman is in it.',
      'Grandma would say I should call home instead. She is right. I did.',
    ],
  },
  {
    id: 'halfway', title: 'Letter from Grandma', from: 'Grandma',
    when: owned => owned.length >= 6,
    lines: [
      'Dear homemaker,',
      'Six things! Your mother showed me the photo. The plant is crooked but the rest looks almost respectable.',
      'When your grandfather and I had our first apartment, we owned a kettle, two cups, and an argument about everything else.',
      'It became a home anyway. Yours will too. It already is, I think.',
      '— Grandma',
    ],
  },
  {
    id: 'almost', title: 'Almost There', from: 'your journal',
    when: owned => owned.length >= 9,
    lines: [
      'One empty corner left. I know exactly what goes there.',
      'Funny — when I moved in, the apartment felt like a box I was hiding in. Now it feels like a place that was waiting for me.',
      'The city outside is still enormous. But it is MY enormous city now.',
    ],
  },
];

export const ENDING = {
  title: 'Little Apartment, Big City',
  lines: [
    'The last piece slides into place, and you stand in the doorway and look at the whole tiny kingdom of it.',
    'A bed with real sheets. A kitchen that hums. Warm light from the lamp instead of the bare bulb.',
    'Out the window the city goes on forever, vending machines and train lines and ten million strangers.',
    'But in here, nineteen square meters say, in a small clear voice: welcome home.',
    'THE END — thanks for playing. Your apartment (and the fish) will still be here.',
  ],
};

// ---- phone messages ---------------------------------------------------------
// The smartphone's Messages app. Companies push promos; people (Grandma, the
// folks you meet) text you as you hit milestones. Stored on the save once
// delivered; `when` is a pure predicate over a small context so data.ts stays
// independent of state.ts (no import cycle).

export interface PhoneMessage {
  id: string;
  from: string;        // sender / thread name
  avatar: string;      // single emoji shown as the contact icon
  company?: boolean;   // company/brand thread (vs. a person)
  body: string[];      // chat bubbles, oldest → newest
  day: number;         // in-game day delivered
  read: boolean;
}

// Just enough of the save to decide delivery, passed by state.ts.
export interface MsgCtx {
  day: number;
  timeMin: number;     // in-game clock (minutes since midnight) — for time-gated day-1 texts
  leftKonbiniAt: number | null; // absolute minute you first left the konbini (job offer fires ~1h later)
  owned: string[];
  placedCount: number;
  money: number;
  vehicles: string[];
  hat: boolean;
  wand: boolean;
  canFish: boolean;
  fishCount: number;
  visited: string[];
  gameAch: string[];
}

export interface MessageDef {
  id: string;
  from: string;
  avatar: string;
  company?: boolean;
  body: string[];
  when: (c: MsgCtx) => boolean;
}

export const MESSAGES: MessageDef[] = [
  {
    id: 'welcome-landlord', from: 'Maison Kawa 🏢', avatar: '🏢', company: true,
    // Day 1: arrives ~7:30 AM, a little after you wake (a phone buzz teaches you
    // the notification + to check the 📱). Available any later day.
    when: c => c.day > 1 || c.timeMin >= 7 * 60 + 30,
    body: [
      'Welcome to MAISON KAWA, unit 204 — good to have you, {name}! This is the building line.',
      'That buzz was your phone. Open it any time with the 📱 button (or press P) — messages, the ZamaZonk store, and your wallet all live in there.',
      'Hot water is on the meter, recycling goes out Tuesday, and the wall to 205 is thinner than it looks. Rent autodrafts monthly — keep a cushion in the bank. Enjoy your new home! 🌇',
    ],
  },
  {
    id: 'grandma-phone', from: 'Grandma 💮', avatar: '💮',
    when: c => c.day >= 2,
    body: [
      'your mother set up this "texting" on my phone. am i doing it right?',
      'are you eating? a city is no excuse for instant noodles every night.',
      'send me a photo of the apartment when it looks nice. ❤️',
    ],
  },
  {
    id: 'zamazonk-welcome', from: 'ZamaZonk 📦', avatar: '📦', company: true,
    // Day 1: lands around midday — spread out from the landlord text so the
    // welcome buzzes don't all pile up at once. Available on any later day too.
    when: c => c.day > 1 || c.timeMin >= 12 * 60,
    body: [
      'Hello, valued human. This is ZamaZonk™ — the Everything Store. We got your number. We get everyone\'s number.',
      'How it works: open your phone (📱 / P) → tap the ZamaZonk app → pick furniture → it pays up front and arrives in your boxes by morning. Then open ARRANGE ROOM in your Bag to place it.',
      'Why visit a store when a store can visit you, forever? Keep tapping. 📦',
    ],
  },
  {
    id: 'dokidoki-promo', from: 'Doki Doki Discount 🛒', avatar: '🛒', company: true,
    when: c => c.visited.includes('city'),
    body: [
      '♥ DOKI DOKI DISCOUNT ♥ — your home electronics superstore!',
      'TV, fridge, AC, microwave — everything to make 19 sqm feel like 20. New stock weekly.',
      'Show this text for... well, the same prices as everyone else. But we appreciate you. 🧡',
    ],
  },
  {
    id: 'konbini-job', from: 'Konbini 24h 🏪', avatar: '🏪', company: true,
    // Fires ~1 in-game hour after you first leave the konbini; unlocks the shift.
    when: c => c.leftKonbiniAt != null && c.day * 1440 + c.timeMin >= c.leftKonbiniAt + 60,
    body: [
      'Hey {name} — thanks for stopping by KONBINI 24H earlier.',
      'We\'re always short a pair of hands on shift. Want work? Come to the counter and pick up a SHIFT — one a day, paid same-day in cash.',
      'Tony out front vouched for you. Sort of. He said "that one seems chill." Good enough for us. 🏪',
    ],
  },
  {
    id: 'konbini-coupon', from: 'Konbini 24h 🏪', avatar: '🏪', company: true,
    when: c => c.visited.includes('konbini'),
    body: [
      'Thanks for stopping by KONBINI 24H!',
      'Reminder: we buy fresh fish at the counter, and the back freezer is staff-only. Do not mind the humming.',
      'Try a cold "Diet Doctor Peepis" — now with 0% more doctor. 🥤',
    ],
  },
  {
    id: 'tex-hat', from: "Tex's Hats 🤠", avatar: '🤠', company: true,
    when: c => c.hat,
    body: [
      'WELL HOWDY. Tex here. That hat looks RIGHT on you, partner.',
      'A hat like that is a promise. Wear it into the bay. Wear it into the club. Wear it to sleep, I don\'t judge.',
      'Yeehaw responsibly. 🐎',
    ],
  },
  {
    id: 'kojima-car', from: 'Kojima Motors 🚗', avatar: '🚗', company: true,
    when: c => c.vehicles.includes('car'),
    body: [
      'KOJIMA MOTORS — congrats on the kei car! She is small but she has heart.',
      'If you ever lose her downtown, we run a tow. ¥500 and no questions about WHY she is on the sidewalk.',
      'Drive safe. Honk twice for us. 🔧',
    ],
  },
  {
    id: 'lulu-boat', from: 'Lulu 🌴', avatar: '🌴',
    when: c => c.vehicles.includes('boat'),
    body: [
      'aloha~ it\'s Lulu from the Tiki Bar on Kiwami!',
      'heard you got a boat. the coconuts are free if you shake the palms, the cocktails are not. 😌',
      'sail out anytime, the island\'s always warm. 🍹',
    ],
  },
  {
    id: 'manager-wand', from: 'The Manager 🥤', avatar: '🥤',
    when: c => c.wand,
    body: [
      '...you took the wand. good.',
      'the deeper rock does not like visitors. the wand does not like the deeper rock. it works out.',
      'thank you for the cold one. the shop is always open. it is always open. 🧊',
    ],
  },
  {
    id: 'dj-tanuki', from: 'DJ Tanuki 🎧', avatar: '🎧',
    when: c => c.visited.includes('nightclub'),
    body: [
      'YOOO it\'s DJ TANUKI from CLUB KAIJU 🦖',
      'i spin the places you\'ve BEEN, so go SEE things and i\'ll drop the track. the more you wander the fatter my crates.',
      'pull up. the big guy in the back tips in fish. 🎶',
    ],
  },
  {
    id: 'landlord-furnished', from: 'Maison Kawa 🏢', avatar: '🏢', company: true,
    when: c => c.placedCount >= 5,
    body: [
      'Doing our quarterly walkthrough — unit 204 is looking really put-together. 👏',
      'A few residents take a decade to hang one poster. You\'ve made it a HOME.',
      'No notes. Carry on. 🌇',
    ],
  },
  {
    id: 'grandma-proud', from: 'Grandma 💮', avatar: '💮',
    when: c => c.placedCount >= 9,
    body: [
      'your mother showed me the new photos. oh, it is BEAUTIFUL.',
      'when i was your age our whole apartment was a kettle and an argument. you have made something lovely.',
      'i am proud of you. now go to bed at a reasonable hour. ❤️',
    ],
  },
];
