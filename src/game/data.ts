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
  { id: 'coffin', name: 'Coffin', price: 0, sprite: 'f-coffin', pawnable: false,
    blurb: 'Solid oak, suspiciously comfortable. A gift from a new friend. Sleep tight.' },
  { id: 'bloomlamp', name: 'Bloom Lamp', price: 0, sprite: 'f-bloomlamp', pawnable: false,
    blurb: 'Its shade is a living moonflower that never quite goes dark. Grown, not bought.' },
];
// Special furniture that isn't part of The Manager's stock (so it doesn't gate Paris).
export const NON_MANAGER_RARES = new Set(['coffin', 'bloomlamp']);

// ---- Greenhouse crops --------------------------------------------------------
// Granny Soto's community greenhouse. Sprinkler-watered, day-cycle grown. Built
// as a table so the farming sim can grow (literally) — add a crop here, give it
// its growth-stage sprites + a harvest payout, and the plots handle the rest.
export interface Crop {
  id: string;
  name: string;
  seedCost: number;     // yen per seed at Granny's seed counter (0 = not sold; special source)
  growDays: number;     // watered mornings from seed to harvest
  reward: number;       // base yen for a NORMAL-quality harvest (×1.4 silver, ×2 gold)
  sprites: string[];    // exactly 4 growth-stage atlas keys (sprout→young→budding→ripe)
  tier: number;         // seed-shop gate: sold once greenhouse tier ≥ this (moonflower = special)
  regrow?: number;      // multi-harvest: after harvest, regrows to ripe in this many watered days
  blurb: string;
}

// Visual stage 0..3 from grow progress (0..growDays). Lets grow time vary while
// every crop still uses just 4 sprites.
export const cropStage = (crop: Crop, progress: number): number =>
  Math.max(0, Math.min(3, Math.round((progress / crop.growDays) * 3)));

export const CROPS: Record<string, Crop> = {
  sunflower: { id: 'sunflower', name: 'Sunflower', seedCost: 80, growDays: 3, reward: 240, tier: 0,
    sprites: ['t-crop-sun-0', 't-crop-sun-1', 't-crop-sun-2', 't-crop-sun-3'],
    blurb: 'Cheap, cheerful, quick. The reliable starter bloom.' },
  tomato: { id: 'tomato', name: 'Tomato', seedCost: 140, growDays: 3, reward: 380, tier: 0, regrow: 2,
    sprites: ['t-crop-tomato-0', 't-crop-tomato-1', 't-crop-tomato-2', 't-crop-tomato-3'],
    blurb: 'Keeps fruiting after the first harvest. Bread-and-butter income.' },
  chili: { id: 'chili', name: 'Chili Pepper', seedCost: 160, growDays: 4, reward: 500, tier: 0, regrow: 2,
    sprites: ['t-crop-chili-0', 't-crop-chili-1', 't-crop-chili-2', 't-crop-chili-3'],
    blurb: 'Hot, hardy, and it keeps on giving. Worth the wait.' },
  melon: { id: 'melon', name: 'Melon', seedCost: 400, growDays: 5, reward: 1400, tier: 1,
    sprites: ['t-crop-melon-0', 't-crop-melon-1', 't-crop-melon-2', 't-crop-melon-3'],
    blurb: 'Slow, thirsty, and the single biggest payout per plot.' },
  tea: { id: 'tea', name: 'Tea Bush', seedCost: 650, growDays: 4, reward: 320, tier: 1, regrow: 2,
    sprites: ['t-crop-tea-0', 't-crop-tea-1', 't-crop-tea-2', 't-crop-tea-3'],
    blurb: 'Pricey to start, but it leafs out every couple of days forever. Pure passive income.' },
  moonflower: { id: 'moonflower', name: 'Moonflower', seedCost: 0, growDays: 6, reward: 3000, tier: 2,
    sprites: ['t-crop-moon-0', 't-crop-moon-1', 't-crop-moon-2', 't-crop-moon-3'],
    blurb: 'Blooms in colors that only exist after midnight. The shrine keeps its seeds.' },
};

export const cropById = (id: string): Crop | undefined => CROPS[id];

// Quality multipliers for a harvest: normal / silver / gold.
export const CROP_QUALITY = ['', 'Silver ', 'Gold '];
export const CROP_QUALITY_MULT = [1, 1.4, 2];

// Granny's rotating community request: grow & ship N of a crop (any quality) for
// a bonus on top of the sale. Seeded per period in state.ts → greenhouseRequest.
export interface CropRequest { id: string; crop: string; count: number; reward: number; flavor: string; }
export const CROP_REQUESTS: CropRequest[] = [
  { id: 'sun-fair', crop: 'sunflower', count: 8, reward: 1500, flavor: 'The block association wants sunflowers for the summer fair. Lots of them.' },
  { id: 'salsa-night', crop: 'tomato', count: 6, reward: 1800, flavor: 'Konbini\'s doing a "salsa night." They need tomatoes, and they need them fresh.' },
  { id: 'spice-run', crop: 'chili', count: 6, reward: 2200, flavor: 'A ramen stand two wards over heard about your chilis. They will pay for heat.' },
  { id: 'tea-house', crop: 'tea', count: 10, reward: 2600, flavor: 'The old tea house is reopening. Yoshi put in a word. They want a proper harvest.' },
  { id: 'melon-gift', crop: 'melon', count: 3, reward: 3200, flavor: 'Someone important has a birthday. Someone important loves melon. Do the math.' },
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

// ---- The Museum (Downtown) --------------------------------------------------
// Bingus Doofelsmurt's gallery. The player finds objects out in the world and
// DONATES them to fill these display slots, Stardew-community-center style.
// This is the FRAMEWORK: the slots are empty placeholders. Actual collectible
// items get wired to `accepts` later; for now nothing fills them.
//   kind 'artifact' = a floor pedestal/plinth (single object of interest)
//   kind 'art'      = a wall-mounted picture frame (an art piece)
//   x, y            = the pedestal/frame tile in the `museum` scene (maps.ts)
//   accepts         = the item id a slot wants (added when collectibles land)
export interface MuseumSlot {
  id: string;
  label: string;
  kind: 'artifact' | 'art';
  accepts?: string;
  x: number; y: number;
  blurb: string;
}
export const MUSEUM_SLOTS: MuseumSlot[] = [
  // Wall art (the back wall, row 0)
  { id: 'art-alley', label: 'The Vanishing Alley', kind: 'art', x: 2, y: 0,
    blurb: 'A back-street that, per the placard, "is no longer there, and possibly never was."' },
  { id: 'art-madonna', label: 'Neon Madonna', kind: 'art', x: 5, y: 0,
    blurb: 'Painted entirely in colors that only exist after midnight.' },
  { id: 'art-bento', label: 'Still Life with Konbini Bento', kind: 'art', x: 8, y: 0,
    blurb: 'Bingus calls it "the most honest meal ever committed to canvas."' },
  { id: 'art-cat', label: 'Portrait of a Stray, Unbothered', kind: 'art', x: 11, y: 0,
    blurb: 'The cat is not looking at you. The cat will never look at you.' },
  // Pedestals — objects of interest (rows 2 and 4)
  { id: 'arti-coin', label: 'First Coin of the Realm', kind: 'artifact', x: 2, y: 2,
    blurb: '"The very first ¥1 anyone ever dropped in a vending machine here." Provenance: dubious.' },
  { id: 'arti-token', label: 'The Unbreakable Token', kind: 'artifact', x: 5, y: 2,
    blurb: 'A vending token that has outlived three vending machines.' },
  { id: 'arti-onigiri', label: 'Fossilized Onigiri', kind: 'artifact', x: 8, y: 2,
    blurb: 'Left in a coat pocket. Geologically speaking, it is now a mineral.' },
  { id: 'arti-rock', label: 'A Perfectly Ordinary Rock', kind: 'artifact', x: 11, y: 2,
    blurb: '"Allegedly," reads the placard, in Bingus\'s nervous handwriting.' },
  { id: 'arti-lure', label: "Genji's Lost Lure", kind: 'artifact', x: 2, y: 4,
    blurb: 'It caught everything but the one fish he wanted.' },
  { id: 'arti-shard', label: 'Shard of the Deep', kind: 'artifact', x: 5, y: 4,
    blurb: 'Still faintly humming. Bingus keeps it under glass, just in case.' },
  { id: 'arti-capsule', label: 'The Last Gachapon Capsule', kind: 'artifact', x: 8, y: 4,
    blurb: 'Empty. The figure inside it has been missing for three years. Mr. Maeda wept.' },
  { id: 'arti-meteor', label: 'Meteorite (or Burnt Toast)', kind: 'artifact', x: 11, y: 4,
    blurb: 'Curatorial consensus has not been reached.' },
];

// Where each museum collectible comes from. HIDDEN finds glint in a scene at a
// fixed tile — walk onto/face it + E to pocket it (added to save.collectibles),
// then donate it at the matching museum pedestal. The remaining four are rare
// DROPS from activities (see the drop hooks in LittleApartmentGame.tsx). The
// collectible id === the MUSEUM_SLOTS id it fills.
// Just TWO curios literally lie around to be stumbled on, in scenic out-of-the-way
// spots (the rest are earned in unique ways — see below). Walk onto/face + E.
export interface MuseumFind { slot: string; scene: string; x: number; y: number; }
export const MUSEUM_FINDS: MuseumFind[] = [
  { slot: 'arti-rock', scene: 'island', x: 6, y: 4 },  // a perfectly ordinary rock in the island grass
  { slot: 'art-cat', scene: 'paris', x: 8, y: 8 },     // a stray's portrait propped on the Seine quay
];

// Bingus's fetch-quest chain: bring the curator a specific kind of thing and he
// places the matching curio himself (donates it straight onto its display). He
// accepts whichever pending fetch you happen to be carrying, so the order is up
// to you / what you can reach. Item kinds map to existing pockets.
export interface BingusFetch { slot: string; kind: 'peepis' | 'soda' | 'fish' | 'coconut' | 'mineral'; ask: string; thanks: string; }
export const BINGUS_FETCHES: BingusFetch[] = [
  { slot: 'art-bento', kind: 'peepis',
    ask: 'Bring me a cold "Diet Doctor Peepis" from a vending machine. The most honest still life requires the most honest subject.',
    thanks: 'A Peepis can, rendered in oils by morning. "Still Life with Konbini Bento." It goes on the wall this instant.' },
  { slot: 'arti-token', kind: 'soda',
    ask: 'Bring me any vending-machine soda. I am reliably informed one of them hides a TOKEN of unusual stubbornness.',
    thanks: 'There — wedged in the can\'s shadow, a token that has outlived three machines. The Unbreakable Token. Ours now.' },
  { slot: 'arti-onigiri', kind: 'fish',
    ask: 'Bring me a fish, fresh from the bay. I intend to... preserve it. Please do not ask by what method.',
    thanks: 'In a few decades this will be, geologically, a mineral. We shall label it the Fossilized Onigiri and never speak of the fish.' },
  { slot: 'art-madonna', kind: 'coconut',
    ask: 'A coconut from the island, if you can get out there. The Neon Madonna requires, ah... tropical financing.',
    thanks: 'Sold to a collector for an indecent sum. With the proceeds: the Neon Madonna, painted in colors that only exist after midnight.' },
  { slot: 'art-alley', kind: 'mineral',
    ask: 'A mineral from the deep mines — any will do. The deep keeps things the surface has chosen to forget.',
    thanks: 'In its facets, an alley that is no longer there, and possibly never was. "The Vanishing Alley." Hung at last.' },
];

// The rest are rare drops from activities (rolls live in the drop hooks):
// arti-lure (fishing), arti-shard (mine floor 6+), arti-meteor (mine 10+),
// arti-capsule (1% gachapon), arti-coin (cracking a geode).

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
  { id: 'delver', title: 'Going Down', desc: 'Descended to mine floor 5.', hint: 'The ladder is not the bottom.' },
  { id: 'abyss', title: 'The Down There', desc: 'Descended to mine floor 10.', hint: 'Keep climbing down. It keeps going.' },
  { id: 'geode-crack', title: 'What Is Inside', desc: 'Cracked open a geode.', hint: 'Some rocks are hollow. Bring a pick.' },
  { id: 'astral', title: 'Star Candy', desc: 'Mined an Astral Stone.', hint: 'Only the deep, only the best pick.' },
  { id: 'toolmaster', title: 'Last Pick', desc: 'Bought the Diamond Pickaxe.', hint: 'The Manager sells tools, too.' },
  { id: 'gunner', title: 'AK-67', desc: 'Claimed the machine gun from the deep.', hint: 'Descend far enough and The Manager makes an offer.' },
  { id: 'blessed', title: 'Five Thousand Yen Faith', desc: 'Earned the shrine\'s favor. The fish noticed.', hint: 'The little shrine in the park accepts offerings.' },
  { id: 'furnished', title: 'Welcome Home', desc: 'Furnished the whole apartment.', hint: 'The whole point.' },
  { id: 'curator', title: 'The Whole Collection', desc: 'Filled every display in the Kawamachi Museum.', hint: 'Twelve empty displays. Twelve curios, hidden across the city and beyond.' },
  { id: 'greenthumb', title: 'Green Thumb', desc: 'Grew a Moonflower in the community greenhouse.', hint: 'Earn the shrine\'s deepest favor — its seeds bloom only after midnight.' },
  { id: 'broke', title: 'i dont have enough money for chicken nugget', desc: 'Dropped under ¥100. The nuggets remain a dream.', hint: 'Spend almost all of it.' },
];

// ---- The mines (below the backrooms) ------------------------------------------
// The mine is a multi-floor descent. Each floor you climb DOWN is richer and more
// dangerous; you ascend (one ladder) all the way back to the surface in one go.
// minFloor = the shallowest floor an ore can appear on (deep ore stays deep, so
// descending is the only way to the good stuff). hardness = the pickaxe `power`
// required to break the node (gates ore behind tool upgrades).

export interface Mineral {
  id: string; name: string; value: number; weight: number; color: string;
  minFloor: number;   // deepest ore won't spawn until you've descended this far
  hardness: number;   // pickaxe power needed to crack it
}
export const MINERALS: Mineral[] = [
  { id: 'coal',      name: 'Cave Coal',    value: 60,   weight: 18, color: '#5a5a66', minFloor: 1, hardness: 1 },
  { id: 'iron',      name: 'Iron Chunk',   value: 110,  weight: 14, color: '#c0a890', minFloor: 1, hardness: 1 },
  { id: 'shard',     name: 'Yellow Shard', value: 150,  weight: 12, color: '#ffd24a', minFloor: 1, hardness: 1 },
  { id: 'crystal',   name: 'Hum Crystal',  value: 400,  weight: 6,  color: '#7ce8e0', minFloor: 2, hardness: 2 },
  { id: 'opal',      name: 'Void Opal',    value: 900,  weight: 2,  color: '#b06ad0', minFloor: 4, hardness: 3 },
  { id: 'starstone', name: 'Astral Stone', value: 2200, weight: 1,  color: '#ff7cc4', minFloor: 6, hardness: 4 },
];
export const mineralById = (id: string): Mineral => MINERALS.find(m => m.id === id)!;

export const MINE_COST = 5;            // energy per swing with bare hands (tier 0)
export const WAND_PRICE = 3000;        // The Manager's price for the wand
export const WAND2_PRICE = 9000;       // The Manager's price for the wand upgrade (pierces, brighter)
export const CRAWLER_HIT_ENERGY = 8;   // energy lost when a crawler gets you

// The AK-67 — a full-auto machine gun, the best weapon in the mines. The Manager
// only offers it once you've proven you can survive the deep (reached the floor
// below). Bullets are fast, pierce, and shred any crawler.
export const GUN_PRICE = 25000;
export const GUN_UNLOCK_FLOOR = 10;

// ---- Pickaxe tiers ----------------------------------------------------------
// Bought from The Manager. `cost` = energy per swing, `power` = the hardness it
// can crack, `bonusChance` = odds of a +1 yield. Tier 0 is your bare hands.
export interface Pickaxe {
  tier: number; name: string; price: number;
  cost: number; power: number; bonusChance: number;
  sprite: string; blurb: string;
}
export const PICKAXES: Pickaxe[] = [
  { tier: 0, name: 'Bare Hands',   price: 0,     cost: 5, power: 1, bonusChance: 0,    sprite: '',             blurb: 'Just you and the rock. It hurts a little.' },
  { tier: 1, name: 'Tin Pick',     price: 1200,  cost: 4, power: 2, bonusChance: 0.10, sprite: 'pick-tin',     blurb: 'A real tool at last. Cheaper swings — and it cracks Hum Crystal.' },
  { tier: 2, name: 'Steel Pick',   price: 4500,  cost: 3, power: 3, bonusChance: 0.20, sprite: 'pick-steel',   blurb: 'Bites deep. Cracks Void Opal, and the veins give more.' },
  { tier: 3, name: 'Diamond Pick', price: 14000, cost: 2, power: 4, bonusChance: 0.35, sprite: 'pick-diamond', blurb: 'The last pick you will ever buy. Cracks anything down there.' },
];
export const pickaxeOf = (tier: number): Pickaxe =>
  PICKAXES[Math.max(0, Math.min(PICKAXES.length - 1, tier))];

// ---- Geodes -----------------------------------------------------------------
// A sealed rock node. Mining it (needs a Tin pick or better) drops a GEODE into
// your bag instead of ore; crack it at The Manager for a weighted random reward.
export const GEODE_HARDNESS = 2;       // pickaxe power needed to free a geode
export interface GeodeReward { id: string; weight: number }
export const GEODE_REWARDS: GeodeReward[] = [
  { id: 'cash',      weight: 30 },     // a yen burst
  { id: 'crystal',   weight: 24 },     // a bundle of Hum Crystal
  { id: 'opal',      weight: 14 },     // a couple Void Opal
  { id: 'gacha',     weight: 12 },     // a random gachapon figure
  { id: 'starstone', weight: 6 },      // an Astral Stone
  { id: 'jackpot',   weight: 4 },      // big yen + rare ore
];

// ---- Daily mine modifier ----------------------------------------------------
// One challenge is in effect each in-game day (seeded by the day). It nudges the
// layout and is surfaced on the mine HUD so the day feels different.
export interface MineChallenge { id: string; name: string; desc: string; color: string }
export const MINE_CHALLENGES: MineChallenge[] = [
  { id: 'calm',     name: 'Quiet Day',      desc: 'Steady ore, few crawlers.',           color: '#9ad0c0' },
  { id: 'rich',     name: 'Rich Veins',     desc: 'Nodes yield extra minerals.',         color: '#ffd24a' },
  { id: 'infested', name: 'Infested',       desc: 'Crawlers everywhere — but loot too.',  color: '#e857a8' },
  { id: 'crystal',  name: 'Crystal Rush',   desc: 'Hum Crystal is everywhere today.',     color: '#7ce8e0' },
  { id: 'deep',     name: 'The Deep Calls',  desc: 'Ore skews rarer the deeper you go.',  color: '#b06ad0' },
  { id: 'geode',    name: 'Geode Day',      desc: 'Sealed geodes are plentiful.',         color: '#ff7cc4' },
];

// Floors that fire a one-off milestone (achievement + Manager text).
export const DEPTH_MILESTONES = [5, 10];

// Craft the Manager's rare furniture from minerals. Each recipe is deliberately
// pinned to a depth/pickaxe tier so the rares unlock in a progression ladder —
// you can't craft the good stuff until you've earned the pick and the depth:
//   neon     → Tin pick (power 2) + floor 2  (Hum Crystal)        — first rare
//   kotatsu  → Tin pick + floor 2
//   aquarium → Steel pick (power 3) + floor 4 (Void Opal)         — mid
//   arcade   → Diamond pick (power 4) + floor 6 (Astral Stone)    — endgame
export const CRAFT_RECIPES: Record<string, Record<string, number>> = {
  neon: { shard: 8, crystal: 4 },
  kotatsu: { iron: 10, crystal: 8 },
  aquarium: { crystal: 10, opal: 3 },
  arcade: { opal: 5, starstone: 2 },
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

// ---- Fishing rods -----------------------------------------------------------
// Genji gives you tier 0 (a worn bamboo rod) the first time you meet him; he
// SELLS tier 1 once you've fished a while. The upgraded rod doesn't change the
// reel minigame — it just draws the bigger, rarer fish to the hook far more
// often (see the bite roll in LittleApartmentGame.tsx). Shop-facing copy only.
export interface Rod { tier: number; name: string; price: number; blurb: string }
export const RODS: Rod[] = [
  { tier: 0, name: 'Worn Bamboo Rod', price: 0, blurb: "Genji's spare. Pulls the shallows in just fine." },
  { tier: 1, name: "Genji's Carbon Rod", price: 6000, blurb: 'Backbone enough to tempt the big ones — the rare and deep fish bite for you far more often. The rod he never used to chase the carp.' },
];
export const rodInfo = (tier: number): Rod => RODS[Math.max(0, Math.min(RODS.length - 1, tier))];

// ---- Shore foraging ---------------------------------------------------------
// Ungated EARLY money: the beach washes up small finds each day, grabbed for
// instant cash (no rod, no job, day 1). Placement is seeded per day in state.ts
// (shoreForageFor); this is the kind table — name, sprite, yen range, spawn
// weight, flavor. Add a kind here + a matching sprite to expand the loot.
export interface ForageKind { id: string; name: string; sprite: string; min: number; max: number; weight: number; blurb: string }
export const FORAGE: ForageKind[] = [
  { id: 'shell', name: 'Spiral Shell', sprite: 't-forage-shell', min: 40, max: 90, weight: 5, blurb: 'A perfect little spiral. The konbini resells these to tourists.' },
  { id: 'wood', name: 'Driftwood', sprite: 't-forage-wood', min: 30, max: 70, weight: 4, blurb: 'Smooth, salt-bleached. Someone always wants kindling.' },
  { id: 'glass', name: 'Sea Glass', sprite: 't-forage-glass', min: 90, max: 170, weight: 3, blurb: 'A frosted bead of green, tumbled soft by the bay.' },
  { id: 'coin', name: 'Lost Coins', sprite: 't-forage-coin', min: 220, max: 420, weight: 1, blurb: "Someone's loss, your gain — sand-polished yen." },
];
export const forageById = (id: string): ForageKind => FORAGE.find(f => f.id === id) ?? FORAGE[0];

// ---- Odd jobs (errand board) ------------------------------------------------
// Phase 2 of early money, layered on foraging: the notice board by home posts ONE
// daily fetch job (seeded per day in state.ts → errandFor). Bring the wanted item
// and the giver pays a premium — e.g. a ¥150 vending soda turned in for ¥450.
// `kind` picks which pocket to consume from; `want` is the item id for 'soda'.
// One completion per day (save.errandDay). Extend by adding rows here.
export interface Errand {
  id: string; giver: string;
  kind: 'peepis' | 'soda' | 'fish' | 'coconut';
  want?: string;            // soda id (for kind 'soda')
  reward: number;
  ask: string; thanks: string;
}
export const ERRANDS: Errand[] = [
  { id: 'peepis-run', giver: 'Thirsty Salaryman', kind: 'peepis', reward: 450,
    ask: 'The machine ate my last coin and I am DYING here. Bring me a Diet Doctor Peepis from any vending machine — ¥450 for the favor.',
    thanks: '*glug glug* ...Aaah. You are a finer human being than I am. Here.' },
  { id: 'doofert-run', giver: 'Gym Bro', kind: 'soda', want: 'doofert', reward: 600,
    ask: 'Bro. My pre-workout is a Diet Mountain Doofert and the konbini line is INSANE. Grab me one, ¥600, no questions.',
    thanks: 'EXTREME citrus. EXTREME gains. EXTREME gratitude, my dude.' },
  { id: 'fish-fry', giver: 'Konbini Cook', kind: 'fish', reward: 700,
    ask: "Today's lunch special needs a fresh catch and my supplier flaked. Bring me ANY fish and ¥700 is yours.",
    thanks: 'Beautiful. The noon crowd will never know how close we came. Take the cash.' },
  { id: 'coconut-run', giver: 'Lulu, by note', kind: 'coconut', reward: 550,
    ask: 'A note pinned to the board, smelling faintly of rum: "Darling — the tiki bar is dry on coconuts. Bring me one from Kiwami Island? ¥550. — L"',
    thanks: 'The note vanishes; ¥550 appears in its place, still warm. Lulu pays her debts.' },
];
export const errandById = (id: string): Errand => ERRANDS.find(e => e.id === id) ?? ERRANDS[0];

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
  metStores: string[];          // store ids you've introduced yourself to (gave your number)
  zamazonkApp: boolean;         // downloaded the ZamaZonk app (island poster)
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
    id: 'welcome-landlord', from: 'Nakatomi Apartments 🏢', avatar: '🏢', company: true,
    // Day 1: arrives ~7:30 AM, a little after you wake (a phone buzz teaches you
    // the notification + to check the 📱). Available any later day.
    when: c => c.day > 1 || c.timeMin >= 7 * 60 + 30,
    body: [
      'Welcome to NAKATOMI APARTMENTS, unit 204 — good to have you, {name}! This is the building line.',
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
    // Fires once you've downloaded the app from the island poster.
    when: c => c.zamazonkApp,
    body: [
      'Hello, valued human. This is ZamaZonk™ — the Everything Store. We got your number. We get everyone\'s number.',
      'How it works: open your phone (📱 / P) → tap the ZamaZonk app → pick furniture → it pays up front and arrives in your boxes by morning. Then open ARRANGE ROOM in your Bag to place it.',
      'Why visit a store when a store can visit you, forever? Keep tapping. 📦',
    ],
  },
  {
    id: 'dokidoki-promo', from: 'Doki Doki Discount 🛒', avatar: '🛒', company: true,
    when: c => c.metStores.includes('denden'),
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
      'Charlie out front vouched for you. Sort of. He said "that one\'s got main-character energy." Good enough for us. 🏪',
    ],
  },
  {
    id: 'konbini-coupon', from: 'Konbini 24h 🏪', avatar: '🏪', company: true,
    when: c => c.metStores.includes('konbini'),
    body: [
      'Thanks for stopping by KONBINI 24H!',
      'Reminder: we buy fresh fish at the counter, and the back freezer is staff-only. Do not mind the humming.',
      'Try a cold "Diet Doctor Peepis" — now with 0% more doctor. 🥤',
    ],
  },
];
