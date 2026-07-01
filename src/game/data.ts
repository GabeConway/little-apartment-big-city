// Little Apartment, Big City — content tables: furniture, fish, food, story.

export interface Furniture {
  id: string;
  name: string;
  price: number;          // full price at Den Den Electric
  blurb: string;          // shop description (also states the gameplay effect)
  sprite: string;         // atlas key
  pawnable: boolean;      // can appear used at the pawn shop
  optional?: boolean;     // optional decor — purchasable/placeable but NOT required for the allFurnished ending
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
  // ---- Optional decor (NOT required for the "fully furnished" ending) --------
  // Japanese-inspired touches, plus a toilet & sink for laughs. Each is `optional`
  // so allFurnished ignores them — buy and place purely for the vibe.
  { id: 'shoji', name: 'Shoji Screen', price: 3500, sprite: 'f-shoji', pawnable: true, optional: true,
    blurb: 'A paper-and-wood sliding screen. Softens the light, divides the room, says home.' },
  { id: 'chabudai', name: 'Low Tea Table', price: 3000, sprite: 'f-chabudai', pawnable: true, optional: true,
    blurb: 'Sit on the floor, sip your tea. Knees optional.' },
  { id: 'zabuton', name: 'Floor Cushion', price: 1200, sprite: 'f-zabuton', pawnable: true, optional: true,
    blurb: 'A plump little cushion for sitting the proper way. Cat-approved.' },
  { id: 'byobu', name: 'Folding Screen', price: 6000, sprite: 'f-byobu', pawnable: true, optional: true,
    blurb: 'A painted folding screen — cranes over gold. Hides the laundry pile in style.' },
  { id: 'kamidana', name: 'House Shrine', price: 5000, sprite: 'f-kamidana', pawnable: true, optional: true,
    blurb: 'A small wooden shelf-shrine. A pinch of rice, a clap, a little luck of your own.' },
  { id: 'kakejiku', name: 'Hanging Scroll', price: 4000, sprite: 'f-kakejiku', pawnable: true, optional: true,
    blurb: 'A calligraphy scroll for the wall. It reads "patience." Or maybe "noodles."' },
  { id: 'chochin', name: 'Paper Lantern', price: 1800, sprite: 'f-chochin', pawnable: true, optional: true,
    blurb: 'A red paper lantern glowing like a festival you never want to end.' },
  { id: 'bonsai', name: 'Bonsai Tree', price: 4500, sprite: 'f-bonsai', pawnable: true, optional: true,
    blurb: 'A tiny tree that asks for nothing but your patience. A whole forest in a dish.' },
  { id: 'zengarden', name: 'Zen Rock Garden', price: 7000, sprite: 'f-zengarden', pawnable: true, optional: true,
    blurb: 'Rake the sand, find the calm. The cat will un-find it by morning.' },
  { id: 'tansu', name: 'Tansu Chest', price: 6500, sprite: 'f-tansu', pawnable: true, optional: true,
    blurb: 'A handsome stepped wooden chest of drawers. Heirloom energy, storage included.' },
  { id: 'noren', name: 'Noren Curtain', price: 2000, sprite: 'f-noren', pawnable: true, optional: true,
    blurb: 'A split fabric curtain for the doorway. Makes every room feel like a cozy little shop.' },
  { id: 'ricecooker', name: 'Rice Cooker', price: 3500, sprite: 'f-ricecooker', pawnable: true, optional: true,
    blurb: 'It plays a little song when the rice is done. Best roommate you will ever have.' },
  { id: 'toilet', name: 'Washlet Toilet', price: 4000, sprite: 'f-toilet', pawnable: false, optional: true,
    blurb: 'Heated seat. Too many buttons. A throne fit for a tiny apartment. No questions.' },
  { id: 'sink', name: 'Washbasin', price: 3000, sprite: 'f-sink', pawnable: false, optional: true,
    blurb: 'A little washbasin to round out the, ahem, facilities. Now you can wash your hands.' },
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
  tea: { id: 'tea', name: 'Tea Bush', seedCost: 350, growDays: 4, reward: 320, tier: 1, regrow: 2,
    sprites: ['t-crop-tea-0', 't-crop-tea-1', 't-crop-tea-2', 't-crop-tea-3'],
    blurb: 'Pricey to start, but it leafs out every couple of days forever. Pure passive income.' },
  moonflower: { id: 'moonflower', name: 'Moonflower', seedCost: 0, growDays: 6, reward: 3000, tier: 2,
    sprites: ['t-crop-moon-0', 't-crop-moon-1', 't-crop-moon-2', 't-crop-moon-3'],
    blurb: 'Blooms in colors that only exist after midnight. The shrine keeps its seeds.' },
};

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
  { id: 'bicycle', name: 'City Bicycle', price: 9000, sprite: 'v-bicycle',
    blurb: 'A trusty mama-chari. Beats waiting on the trains, and the basket holds your groceries.' },
  { id: 'car', name: 'Used Kei Car', price: 100000, sprite: 'v-car',
    blurb: 'The endgame on four wheels. Drive anywhere outdoors, park anywhere, very fast.' },
  { id: 'boat', name: 'Old Skiff', price: 22000, sprite: 'v-boat',
    blurb: 'Floats, mostly. Deep water, and — they say — a tropical island.' },
];
export const vehicleById = (id: string): Vehicle => VEHICLES.find(v => v.id === id)!;

// One-time prestige purchases (paid from the late-game pile). Defined here so the
// price + the matching state.ts helper share a single source of truth.
export const SHRINE_RESTORE_PRICE = 80000;  // fund the shrine's restoration → a permanent extra luck tier
export const CHARLIE_PATRON_PRICE = 40000;  // become Charlie's patron
export const HOME_ONSEN_PRICE = 70000;      // install a private hot spring at the apartment

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
  { id: 'arti-token', label: 'A Single Chicken Nugget', kind: 'artifact', x: 5, y: 2,
    blurb: 'Found deep in the mines, far from any chicken. Bingus has labelled it "Provenance: terrifying." It has not spoiled. It will not spoil.' },
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
// arti-lure (fishing), arti-token = the chicken nugget (random mine drop, any floor),
// arti-shard (mine floor 6+), arti-meteor (mine 10+), arti-capsule (1% gachapon),
// arti-coin (cracking a geode).

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
  { id: 'rare-one', title: 'Customer of the Void', desc: 'Bought something from The Manager.', hint: 'It bows politely. It sells more than furniture.' },
  { id: 'hat', title: '$67', desc: "Bought Tex's cowboy hat.", hint: 'One hat. One price. One dream.' },
  { id: 'gacha-set', title: 'Ten of Ten', desc: 'Completed the gachapon set.', hint: 'Mr. Maeda has had nine for three years.' },
  { id: 'shift-5', title: 'Employee of the Months', desc: 'Worked five konbini shifts.', hint: 'Yuki appreciates the company.' },
  { id: 'rich', title: 'Fifty Stacks', desc: 'Held ¥50,000 at once.', hint: 'The fish add up.' },
  { id: 'night-owl', title: 'Past Last Train', desc: 'Stayed out past 2 AM and woke up home anyway.', hint: 'The city carries you back, eventually.' },
  { id: 'wand', title: 'Magical Girl', desc: 'Bought the wand from The Manager.', hint: 'It handles most transactions down there.' },
  { id: 'miner', title: 'Yellow Rock Candy', desc: 'Mined your first mineral.', hint: 'The backrooms go further down.' },
  { id: 'slayer', title: 'Sparkle Sparkle', desc: 'Defeated a crawler.', hint: 'They scatter like bad thoughts.' },
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
  { id: 'regular', title: 'Everybody Knows Your Name', desc: 'Met everyone worth knowing in Kawamachi.', hint: 'A city is just strangers you have not met yet.' },
  { id: 'mid', title: "That's Mid", desc: 'Harvested a plain, normal-quality crop. It is fine. It is a crop.', hint: 'Not every harvest is silver or gold. Some are just... a vegetable.' },
  { id: 'vault', title: 'X Marks the Floor', desc: 'Cracked open a treasure vault deep in the mines.', hint: 'Some floors down there glow gold. Bring it home.' },
  { id: 'heart2heart', title: 'Heart to Heart', desc: 'Shared a deeper, one-of-a-kind moment with a friend.', hint: 'Keep someone close. Some conversations only open once you truly know each other.' },
  { id: 'housewarming', title: 'Housewarming', desc: 'A friend felt close enough to drop by your apartment.', hint: 'Grow a friendship deep enough that someone wants to see where you live.' },
  { id: 'first-delivery', title: 'Special Delivery', desc: 'Ran your first delivery for Kojima Motors.', hint: "There's a dispatch clipboard at the garage. Kojima needs a driver." },
  { id: 'ace-driver', title: 'Drift King', desc: 'Beat the ace time on a delivery course.', hint: 'Cut the corners. Trust the slide. Beat the clock.' },
  { id: 'first-dish', title: 'Home Cooking', desc: 'Cooked your first dish.', hint: 'A fridge, a microwave, and something worth putting in them.' },
  { id: 'institute-grad', title: 'Correspondence Chef', desc: 'Cooked every Institute recipe at least once.', hint: 'The course has six lessons. Graduation is a full stomach.' },
  { id: 'high-roller', title: "Beginner's Luck", desc: 'Won your first casino bet.', hint: 'The house always wins. Almost always.' },
  { id: 'grand-marlin', title: 'Top of the Chalkboard', desc: 'Placed Grand Marlin tier in the fishing derby.', hint: 'Some days the whole town fishes. Out-fish the town.' },
  { id: 'matsuri', title: 'Festival Nights', desc: 'Played a festival minigame.', hint: 'Every couple of weeks, the lanterns go up somewhere.' },
  { id: 'encore', title: 'Encore!', desc: 'Finished a karaoke song hitting 80% of the notes.', hint: 'The club keeps a mic for anyone brave enough to hold the beat.' },
  { id: 'nine-lives', title: 'Nine Lives', desc: 'Met David the cat.', hint: 'Something in a Downtown back corner is watching you. Patiently.' },
  { id: 'bon-voyage', title: 'Bon Voyage', desc: 'Reached Paris.', hint: 'The yellow place is not the end of the line.' },
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
  { id: 'opal',      name: 'Void Opal',    value: 750,  weight: 2,  color: '#b06ad0', minFloor: 4, hardness: 3 },
  { id: 'starstone', name: 'Astral Stone', value: 1600, weight: 1,  color: '#ff7cc4', minFloor: 6, hardness: 4 },
];
export const mineralById = (id: string): Mineral => MINERALS.find(m => m.id === id)!;

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

// Weather-gated species read a tiny SKY snapshot (built by state.ts → fishSky)
// so this table never learns the save's shape. `when` omitted = always biting.
export interface FishSky { rainy: boolean; meteorNight: boolean }

export interface Fish {
  id: string;
  name: string;
  value: number;
  weight: number;         // roll weight (higher = more common)
  difficulty: number;     // 0..1 — how erratically it moves in the minigame
  sprite: string;
  when?: (sky: FishSky) => boolean; // weather gate: in the bite table only while true
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
  // Weather-only species — filtered OUT of the bite table under a clear sky (see
  // biteTableFor in state.ts).
  { id: 'rainkoi', name: 'Rain Koi', value: 900, weight: 4, difficulty: 0.8, sprite: 'fish-rainkoi',
    when: sky => sky.rainy },
  { id: 'stargazer', name: 'Stargazer', value: 1600, weight: 2, difficulty: 0.9, sprite: 'fish-stargazer',
    when: sky => sky.meteorNight },
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

// ---- Gig / courier terminal (errands) ---------------------------------------
// Phase 2 of early money, layered on foraging: the courier gig terminal by home
// posts ONE daily delivery request (seeded per day in state.ts → errandFor).
// Deposit the wanted item into the kiosk and it dispenses a premium reward —
// e.g. a ¥150 vending soda deposited for ¥450. The `ask` text reads as the
// client's request shown on the terminal screen.
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
  { id: 'coconut-run', giver: 'Lulu (remote gig)', kind: 'coconut', reward: 550,
    ask: 'A gig pings in, the message faintly scented with rum: "Darling — the tiki bar is dry on coconuts. Courier me one from Kiwami Island? ¥550. — L"',
    thanks: 'The slot clunks; ¥550 dispenses, still warm. Lulu pays her debts.' },
];

// ---- Journal missions --------------------------------------------------------
// A hand-authored 5-step starter chain shown in the phone Journal: it walks a new
// player along the spine of the game (forage → Genji → fish → shift → shrine).
// Predicates are PURE over a tiny structural slice of the save (GameSave satisfies
// MissionCtx, no state.ts import — same trick as MsgCtx) so they unit-test clean.
// Completion pay/tracking lives in state.ts → syncMissions (save.missionsDone);
// the Journal renders done steps checked, the current step + hint highlighted,
// and every later step as a locked '???' so the chain never spoils itself.
export interface MissionCtx {
  almanac: { forage: string[] };
  canFish: boolean;
  fishLog: Record<string, number>;
  shiftsWorked: number;
  donated: number;
}
export interface Mission {
  id: string;
  title: string;
  blurb: string;                       // what to actually do (shown on the current step)
  hint: string;                        // where/how, in-world (shown on the current step)
  reward: number;                      // yen paid once, when the step completes
  isDone: (c: MissionCtx) => boolean;
}
export const MISSIONS: Mission[] = [
  { id: 'm-forage', title: 'Comb the shore', reward: 300,
    blurb: 'Pick up something the tide washed onto Sumikawa Shore.',
    hint: 'The beach is west out of Kawamachi St. — finds glint on the sand each morning.',
    isDone: c => c.almanac.forage.length > 0 },
  { id: 'm-genji', title: 'Learn to fish', reward: 400,
    blurb: 'Talk to Genji, the old angler working the waterline.',
    hint: 'He has the look of someone itching to teach. He even keeps a spare rod.',
    isDone: c => c.canFish },
  { id: 'm-fish3', title: 'Land three fish', reward: 500,
    blurb: 'Catch 3 fish, any species, any water.',
    hint: 'Face the water, E to cast, E on the bite, then hold E to keep the fish in the bar.',
    isDone: c => Object.values(c.fishLog).reduce((a, b) => a + b, 0) >= 3 },
  { id: 'm-shift', title: 'Work a konbini shift', reward: 600,
    blurb: 'Pick up a paid shift behind the Konbini 24h counter.',
    hint: 'Visit the konbini, then check your texts — they are always short a pair of hands.',
    isDone: c => c.shiftsWorked > 0 },
  { id: 'm-shrine', title: 'Make an offering', reward: 800,
    blurb: 'Donate once at the little shrine in the torii garden.',
    hint: 'Follow the stone path in the city\'s south-east corner. Any coin counts.',
    isDone: c => c.donated > 0 },
];

// ---- Random daily street events ---------------------------------------------
// One-off CITY vignettes, seeded per day (state.ts → streetEventFor): roughly one
// a day after day 1, varying day to day. Each spawns a TEMPORARY actor in the city
// hub that exists only on its day — never baked into the static map. Completing
// it is once per day (save.streetEventDay). Each is a self-contained, unique
// charmer: NOT a reskin of an existing shop/NPC, and it never references or
// unlocks any other (locked) part of the game — fortunes stay pure atmosphere.
// Placement is a free, walkable city tile (verified against maps.ts). The actual
// dialog/effect lives in the interact handler, keyed by id (cf. how shops branch).
// `sprite` prefix decides how it's drawn: 'npc-*' = a 4-direction character built
// from the accessory system; 'prop-*' = a single static prop tile.
export interface StreetEvent {
  id: string;
  sprite: string;                         // atlas key ('npc-*' character | 'prop-*' prop)
  x: number; y: number;                   // city tile coords (single tile, made solid for the day)
  dir: 'up' | 'down' | 'left' | 'right';  // facing (characters only)
  label: string;                          // short name (debug / parity with other tables)
  cost: number;                           // yen the interaction asks for (0 = free)
}
export const STREET_EVENTS: StreetEvent[] = [
  // A traveling ramen yatai: buy the one-day special → a big, cozy hot meal that
  // tops you off past full (a warm "stuffed" overfill that burns down through the day).
  { id: 'ramen-yatai', sprite: 'prop-yatai', x: 14, y: 9, dir: 'down', label: 'Ramen yatai', cost: 650 },
  // A street magician working the sidewalk: watch the card trick (free) → a
  // flourish and a coin produced "from behind your ear".
  { id: 'magician', sprite: 'npc-magician', x: 10, y: 9, dir: 'down', label: 'Street magician', cost: 0 },
  // A coin-op claw machine wheeled out front: pay a little for a weighted random
  // small prize (a can, a souvenir, your money back, or — rarely — a jackpot).
  { id: 'claw-machine', sprite: 'prop-claw', x: 18, y: 9, dir: 'down', label: 'Claw machine', cost: 300 },
  // A pop-up festival stall: a paper tray of fresh takoyaki → a tasty snack that
  // restores a chunk of energy (with one extra "for luck").
  { id: 'takoyaki', sprite: 'prop-takoyaki', x: 22, y: 9, dir: 'down', label: 'Takoyaki stall', cost: 250 },
  // A fortune teller under a paper lantern: pay → a cryptic, atmospheric reading.
  // PURE FLAVOR — no mechanics, no spoilers, no hints at locked content.
  { id: 'fortune', sprite: 'npc-fortune', x: 26, y: 9, dir: 'down', label: 'Fortune teller', cost: 300 },
  // A lost pet ferret darting in the grass: help catch it (free) → a grateful
  // owner's reward (cash + a cold can for your trouble).
  { id: 'lost-ferret', sprite: 'prop-ferret', x: 20, y: 10, dir: 'down', label: 'Lost ferret', cost: 0 },
];
// Cryptic fortunes — atmospheric only, deliberately vague, no concrete spoilers.
export const FORTUNES: string[] = [
  '"A small kindness you have already forgotten will find its way back to your door."',
  '"The sea keeps what it is given, and returns it polished. Be patient with still water."',
  '"You are building something one quiet evening at a time. The walls do not see it yet. They will."',
  '"Beware the day that feels too easy. Beware more the one that feels too hard. Both pass."',
  '"A stranger you pass tomorrow is carrying the same worry as you. Smile anyway."',
  '"Money is a river, not a pond. Stop trying to hold it still and let it carry you somewhere."',
  '"Three lights burn for you tonight: one at home, one over water, one you have not lit yet."',
  '"The cat knows. The cat is not telling. Buy the cat nothing and it will respect you more."',
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
];


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
  gangPaid: boolean;            // paid the yakuza toll into Downtown
  friendsMet: string[];         // FRIENDS ids in the phone (people you've actually met)
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
    id: 'charlie-downtown', from: 'Charlie 🎬', avatar: '🎬',
    // A gentle toll nudge: by day 3, if you've met Charlie and the east alley is
    // still "spoken for," he texts you what the whole east side is worth.
    when: c => c.day >= 3 && !c.gangPaid && c.friendsMet.includes('charlie'),
    body: [
      "yo, charlie here — got your number off the konbini crew. hope that's cool. 🎬",
      "been location-scouting past the east alley for the doc. the boys holding it down will wave you through for ¥5,000 — one-time thing. think of it as a toll booth with tattoos. great texture, honestly.",
      "and listen, the east side is WORTH the ticket: Club Kaiju, Kojima's garage, the Kinryū Lounge, even a little museum. pure cinema over there. go shoot your own scene.",
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
];

// ============================================================================
// Cooking, Friendship & Decor — three life-sim systems layered on the base game.
// Data tables only (no state import); the logic lives in state.ts, wiring in
// LittleApartmentGame.tsx. See kb/games.md.
// ============================================================================

// ---- Cooking ---------------------------------------------------------------
// Cook at home once the fridge AND microwave are placed. Recipes consume held
// ingredients → a dish in your bag; eat a dish for energy + an optional day buff.
// Ingredients come from things you already gather: fish (rod), crops (greenhouse,
// kept not shipped), coconuts (island), sodas/peepis (vending), and pantry
// staples (rice/egg/veg) bought at the konbini. One buff is active at a time.
export type IngredientKind = 'fish' | 'crop' | 'coconut' | 'peepis' | 'soda' | 'rice' | 'egg' | 'veg';
export type BuffId = 'hearty' | 'warm' | 'lucky';

// `tag` = a tiny effect summary for the HUD chip (the full sentence is `desc`).
export interface BuffInfo { id: BuffId; name: string; emoji: string; tag: string; desc: string }
export const BUFFS: Record<BuffId, BuffInfo> = {
  hearty: { id: 'hearty', name: 'Hearty', emoji: '💪', tag: '+20 max energy', desc: '+20 max energy until tomorrow.' },
  warm:   { id: 'warm',   name: 'Warmed',  emoji: '🔥', tag: '−20% energy cost', desc: 'Everything costs 20% less energy today.' },
  lucky:  { id: 'lucky',  name: 'Lucky',   emoji: '🍀', tag: 'better finds', desc: 'Extra shore finds & richer mine veins today.' },
};

export interface Recipe {
  id: string;
  name: string;
  sprite: string;                                   // atlas dish icon
  ingredients: { kind: IngredientKind; n: number }[];
  energy: number;                                   // restored when eaten
  buff?: BuffId;                                     // optional day buff on eat
  learn: 'start' | string;                          // 'start', or flavor for how it's taught
  blurb: string;
}
// Pantry staples sold at the konbini counter (into save.pantry).
export interface Grocery { id: 'rice' | 'egg' | 'veg'; name: string; price: number; sprite: string }
export const GROCERIES: Grocery[] = [
  { id: 'rice', name: 'Bag of Rice',   price: 120, sprite: 'i-rice' },
  { id: 'egg',  name: 'Eggs',          price: 160, sprite: 'i-egg' },
  { id: 'veg',  name: 'Fresh Greens',  price: 200, sprite: 'i-veg' },
];
export const groceryById = (id: string): Grocery | undefined => GROCERIES.find(g => g.id === id);

// Shared `learn` flavor for every Cooking 2.0 dish, so the curriculum can be
// derived (INSTITUTE_RECIPES) without a separate learn-enum.
export const INSTITUTE_RECIPE_LEARN = "From the Kawamachi Cooking Institute's correspondence course.";

export const RECIPES: Recipe[] = [
  { id: 'onigiri', name: 'Onigiri', sprite: 'i-dish-onigiri', energy: 25, learn: 'start',
    ingredients: [{ kind: 'rice', n: 1 }],
    blurb: 'A rice ball wrapped in nori. The first thing anyone learns to make.' },
  { id: 'grillfish', name: 'Grilled Fish', sprite: 'i-dish-grillfish', energy: 35, learn: 'start',
    ingredients: [{ kind: 'fish', n: 1 }],
    blurb: 'Salt, heat, patience. Whatever you caught, made dinner.' },
  { id: 'tamago', name: 'Tamago & Rice', sprite: 'i-dish-breakfast', energy: 55, buff: 'hearty', learn: 'start',
    ingredients: [{ kind: 'egg', n: 1 }, { kind: 'rice', n: 1 }],
    blurb: 'Egg over rice — the breakfast that makes a whole day feel possible.' },
  { id: 'donburi', name: 'Fish Donburi', sprite: 'i-dish-fishbowl', energy: 60, learn: 'start',
    ingredients: [{ kind: 'fish', n: 1 }, { kind: 'rice', n: 1 }],
    blurb: 'Fresh fish over a warm bowl of rice. Konbini bento, but better.' },
  { id: 'stirfry', name: 'Veg Stir-fry', sprite: 'i-dish-stirfry', energy: 40, buff: 'warm', learn: "Granny Sato shows you, once you're friends.",
    ingredients: [{ kind: 'veg', n: 1 }, { kind: 'crop', n: 1 }],
    blurb: 'Greens and garden veg, hot and fast in the pan. Sticks to your ribs.' },
  { id: 'miso', name: 'Miso Soup', sprite: 'i-dish-misosoup', energy: 30, buff: 'warm', learn: 'start',
    ingredients: [{ kind: 'veg', n: 1 }, { kind: 'egg', n: 1 }],
    blurb: 'Tofu, scallion, broth. The bowl that says the day is over now.' },
  { id: 'smoothie', name: 'Island Smoothie', sprite: 'i-dish-smoothie', energy: 45, buff: 'lucky', learn: "Lulu mixes you one, once you're friends.",
    ingredients: [{ kind: 'coconut', n: 1 }, { kind: 'crop', n: 1 }],
    blurb: 'Coconut and something sweet from the garden. Tastes like a day off.' },
  { id: 'hotpot', name: 'Nabe Hot Pot', sprite: 'i-dish-hotpot', energy: 80, buff: 'hearty', learn: "Granny Sato's reward for true friendship.",
    ingredients: [{ kind: 'fish', n: 1 }, { kind: 'veg', n: 1 }, { kind: 'rice', n: 1 }],
    blurb: 'Everything in one bubbling pot. The meal you make for someone you like.' },
  // Cooking 2.0 — the Kawamachi Cooking Institute correspondence course (INSTITUTE_RECIPE_LEARN).
  { id: 'ramen', name: 'Shoyu Ramen', sprite: 'i-dish-ramen', energy: 70, buff: 'hearty', learn: INSTITUTE_RECIPE_LEARN,
    ingredients: [{ kind: 'fish', n: 1 }, { kind: 'veg', n: 1 }, { kind: 'egg', n: 1 }],
    blurb: 'Springy noodles, soy broth, a soft egg on top. The bowl you slurp standing up.' },
  { id: 'curry', name: 'Katsu Curry', sprite: 'i-dish-curry', energy: 75, buff: 'hearty', learn: INSTITUTE_RECIPE_LEARN,
    ingredients: [{ kind: 'veg', n: 1 }, { kind: 'rice', n: 1 }, { kind: 'egg', n: 1 }],
    blurb: 'Golden curry over rice with a crisp cutlet. Comfort with a little crunch.' },
  { id: 'tempura', name: 'Tempura', sprite: 'i-dish-tempura', energy: 60, buff: 'warm', learn: INSTITUTE_RECIPE_LEARN,
    ingredients: [{ kind: 'fish', n: 1 }, { kind: 'veg', n: 1 }],
    blurb: 'Lacy, feather-light batter. The trick is oil hot enough to whisper.' },
  { id: 'okonomiyaki', name: 'Okonomiyaki', sprite: 'i-dish-okonomiyaki', energy: 65, buff: 'hearty', learn: INSTITUTE_RECIPE_LEARN,
    ingredients: [{ kind: 'veg', n: 1 }, { kind: 'egg', n: 1 }, { kind: 'crop', n: 1 }],
    blurb: 'A savory griddle pancake — "however you like it." Yours, with extra greens.' },
  { id: 'mochi', name: 'Mochi', sprite: 'i-dish-mochi', energy: 30, buff: 'lucky', learn: INSTITUTE_RECIPE_LEARN,
    ingredients: [{ kind: 'rice', n: 1 }, { kind: 'crop', n: 1 }],
    blurb: 'Pounded rice gone soft and chewy, hiding a sweet little surprise inside.' },
  { id: 'bento', name: 'Homemade Bento', sprite: 'i-dish-bento', energy: 90, buff: 'hearty', learn: INSTITUTE_RECIPE_LEARN,
    ingredients: [{ kind: 'fish', n: 1 }, { kind: 'rice', n: 1 }, { kind: 'veg', n: 1 }, { kind: 'egg', n: 1 }],
    blurb: 'A whole box packed with care — the graduation dish, everything you learned in one lid.' },
];
export const recipeById = (id: string): Recipe | undefined => RECIPES.find(r => r.id === id);
export const STARTER_RECIPES = RECIPES.filter(r => r.learn === 'start').map(r => r.id);
// The Kawamachi Cooking Institute's curriculum (Cooking 2.0) — the wiring agent
// unlocks these as the player progresses through the correspondence course.
export const INSTITUTE_RECIPES = RECIPES.filter(r => r.learn === INSTITUTE_RECIPE_LEARN).map(r => r.id);

// ---- Friendship & gifting --------------------------------------------------
// Give an NPC something they like (one gift/NPC/day) to raise friendship. Hearts
// = floor(points / 100), capped at 10. Items are classified by GiftKind; each NPC
// loves some kinds, likes others, dislikes a few. A handful of hearts thresholds
// grant a concrete perk (handled at the relevant shop/interaction).
export type GiftKind = 'fish' | 'crop' | 'flower' | 'coconut' | 'peepis' | 'soda' | 'mineral' | 'dish';
export type GiftTier = 'loved' | 'liked' | 'neutral' | 'disliked';
export const GIFT_POINTS: Record<GiftTier, number> = { loved: 40, liked: 22, neutral: 8, disliked: -15 };
export const HEART_POINTS = 100;       // points per heart
export const MAX_HEARTS = 10;

export interface FriendDef {
  id: string;            // npc id (matches the speaker/interaction id)
  name: string;          // display name
  emoji: string;         // avatar in the Friends app
  blurb: string;         // one-line who-they-are
  loved: GiftKind[];
  liked: GiftKind[];
  disliked: GiftKind[];
  perk?: { hearts: number; text: string };   // a concrete reward at N hearts (applied in code)
}
// The cast you can befriend. ids match how the game refers to them on interact.
export const FRIENDS: FriendDef[] = [
  { id: 'genji', name: 'Genji', emoji: '🎣', blurb: 'The shore fisherman who taught you to cast.',
    loved: ['fish'], liked: ['mineral', 'soda'], disliked: ['flower'],
    perk: { hearts: 3, text: 'His Carbon Rod is 25% off.' } },
  { id: 'granny', name: 'Granny Sato', emoji: '🌻', blurb: 'Keeper of the community greenhouse.',
    loved: ['crop', 'flower'], liked: ['dish'], disliked: ['soda', 'peepis'],
    perk: { hearts: 3, text: 'Teaches you Stir-fry (and Nabe Hot Pot at 5 ♥).' } },
  { id: 'lulu', name: 'Lulu', emoji: '🍹', blurb: 'Runs the tiki bar on Kiwami Island.',
    loved: ['coconut', 'dish'], liked: ['fish'], disliked: ['mineral'],
    perk: { hearts: 3, text: 'Teaches you the Island Smoothie recipe.' } },
  { id: 'charlie', name: 'Charlie', emoji: '🎸', blurb: 'The bearded filmmaker out front of the konbini.',
    loved: ['dish'], liked: ['coconut', 'soda'], disliked: ['mineral'] },
  { id: 'max', name: 'Max', emoji: '🧛', blurb: 'The shore vampire, out on even nights.',
    loved: ['soda'], liked: ['fish'], disliked: ['crop', 'flower'] },
  { id: 'bingus', name: 'Bingus', emoji: '🖼️', blurb: 'The eccentric museum curator.',
    loved: ['mineral'], liked: ['dish', 'fish'], disliked: ['peepis'] },
  { id: 'manager', name: 'The Manager', emoji: '👁️', blurb: 'Minds the backrooms shop.',
    loved: ['mineral'], liked: ['soda'], disliked: ['flower'] },
  { id: 'tex', name: 'Tex', emoji: '🤠', blurb: 'The cowboy hawking hats on the shore.',
    loved: ['soda'], liked: ['fish', 'mineral'], disliked: ['dish'] },
  { id: 'david', name: 'David', emoji: '🐈‍⬛', blurb: 'The wise talking cat who lives with you.',
    loved: ['fish'], liked: ['dish'], disliked: ['peepis', 'soda'] },
  { id: 'miko', name: 'Yoshi', emoji: '⛩️', blurb: 'The miko who keeps the shrine.',
    loved: ['flower', 'crop'], liked: ['dish'], disliked: ['mineral'] },
  { id: 'jean', name: 'Jean-Pierre', emoji: '🥖', blurb: 'The very lost French tourist who mistook the backrooms for an art exhibition.',
    loved: ['dish'], liked: ['crop', 'fish'], disliked: ['peepis'] },
];
export const friendById = (id: string): FriendDef | undefined => FRIENDS.find(f => f.id === id);

// ---- Heart-tiered greetings -------------------------------------------------
// As hearts rise, a friend layers ONE warmer, more personal line onto the END of
// the conversation (after their random voice set / bespoke branch). The talk path
// picks the highest tier whose heart threshold is met; below the first threshold
// (2 ♥) there's no extra line, so early acquaintances stay neutral. Keyed by the
// FRIENDS id, tiers listed low→high, each written in that character's voice.
// Friends who only ever open a shop (Lulu/Manager/Genji) aren't keyed here — their
// conversations don't surface a flavor line.
export interface HeartLine { hearts: number; line: string }
export const FRIEND_HEART_LINES: Record<string, HeartLine[]> = {
  granny: [
    { hearts: 2, line: 'You come round more than my own grandchildren, you know. I do not mind it one bit.' },
    { hearts: 5, line: 'Sit a moment, dear — the kettle is on. A friend is only a neighbor you stopped being shy with.' },
    { hearts: 8, line: 'I tell the other old women about you at the market. "My young one," I call you. They are terribly jealous.' },
  ],
  charlie: [
    { hearts: 2, line: "Honestly? You're good people, I can tell. I've got a sense for it — it's a whole section of the documentary now." },
    { hearts: 5, line: "Hey, real talk — you're a main character to me. Not in a weird way. In the best way." },
    { hearts: 8, line: 'I\'ve got a whole reel of just... you, around the neighborhood. Gonna cut it together someday. Working title: "My Favorite Neighbor."' },
  ],
  max: [
    { hearts: 2, line: 'Three centuries, and the nights still run long. You make one or two of them shorter. Thank you for that.' },
    { hearts: 5, line: 'I outlived everyone I ever called a friend, and stopped collecting them. ...And then, you.' },
    { hearts: 8, line: 'When you are as old as I am, you measure a life in the few who sat by your fire. You are one of mine now. Do not be a stranger.' },
  ],
  bingus: [
    { hearts: 2, line: 'You keep COMING BACK. Do you know how rare that is? Most visitors flee. You, I have begun to expect — fondly!' },
    { hearts: 5, line: 'I have decided you are a Patron. Capital P. There is no plaque yet. There WILL be a plaque.' },
    { hearts: 8, line: 'When the collection is complete, I shall add one last placard: "Acquired with the help of a true friend." That is you, in case it was unclear.' },
  ],
  tex: [
    { hearts: 2, line: "You keep moseyin' by to jaw with old Tex. Out here, partner, that's worth more'n any hat — and I sell HATS." },
    { hearts: 5, line: "Y'know, I came to this shore a stranger with a sack of hats and a dream. You made it feel like home turf." },
    { hearts: 8, line: "Partner, if I had a kid, I'd want 'em to turn out like you. ...Now don't go makin' it weird. Tex don't do weepy." },
  ],
  miko: [
    { hearts: 2, line: 'The kami has begun to recognize your footstep on the stairs. So, I confess, have I.' },
    { hearts: 5, line: 'I sweep these grounds alone most mornings. Lately I find I am listening for you. The cedar agrees it is nicer.' },
    { hearts: 8, line: 'I drew your fortune without telling you. "A lasting bond." The kami does not say that lightly. Neither do I.' },
  ],
  david: [
    { hearts: 2, line: 'David regards you for a long moment. "...You are tolerable. For a human. Sit. I permit it."' },
    { hearts: 5, line: '"I have lived in a dumpster and lived in a palace," David says. "This is better than both. Do not let it go to your head."' },
    { hearts: 8, line: 'David presses his head, once, against your hand — then pretends it never happened. "We will not speak of that. But know that I meant it."' },
  ],
};

// ---- Keepsakes --------------------------------------------------------------
// Physical mementos handed over at a friendship CAPSTONE (a deep hangout scene).
// Each is a one-of-a-kind object, not cash: a jar of plums to eat, a demo disc to
// display, a vampire's ring to pawn, a charm to carry for luck. The capstone sets
// `keepsake` on its reward and the wiring layer grants it via grantKeepsake.
//   effect 'display' — a keepsake you simply keep / show off (no mechanical use)
//   effect 'food'    — consumable: restores energy + grants a buff when eaten
//   effect 'sell'    — can be pawned for `value` yen if you're ever desperate
//   effect 'luck'    — passive: nudges your luck a little while it's in your bag
export interface Keepsake {
  id: string;
  name: string;
  sprite: string;                                   // atlas key
  flavor: string;                                   // one-line charm
  effect: 'display' | 'food' | 'sell' | 'luck';
  value?: number;                                   // pawn yen (effect 'sell')
}
export const KEEPSAKES: Keepsake[] = [
  { id: 'plums', name: 'Jar of Sun-Pickled Plums', sprite: 'i-plums', effect: 'food',
    flavor: "Granny's own umeboshi. Sour enough to wake the dead and warm you through." },
  { id: 'demodisc', name: 'Demo Disc', sprite: 'i-demodisc', effect: 'display',
    flavor: 'First copy, your name in sharpie. The neighborhood, on a disc.' },
  { id: 'ring', name: "Vampire's Ring", sprite: 'i-ring', effect: 'sell', value: 3000,
    flavor: 'Older than the country. It hums faintly, like it remembers being loved.' },
  { id: 'omamori', name: 'Omamori Charm', sprite: 'i-omamori', effect: 'luck',
    flavor: 'Hand-tied at the shrine, for you. The kami keeps half an eye on your roads.' },
  { id: 'badge', name: 'Patron Badge', sprite: 'i-badge', effect: 'display',
    flavor: '"PATRON — LEVEL ONE," hand-laminated and slightly sticky. Wear with terrifying pride.' },
  { id: 'hatband', name: 'Silver Concho Hatband', sprite: 'i-hatband', effect: 'display',
    flavor: "Real silver conchos from a cowboy who don't do weepy. Worth more than the hat." },
];
export const keepsakeById = (id: string): Keepsake | undefined => KEEPSAKES.find(k => k.id === id);

// ---- Heart-event hangouts ---------------------------------------------------
// One-time, deeper scenes that play the next time you TALK to a friend once you
// cross a heart threshold (4 ♥ and 8 ♥). Each is storySeen-gated by `flag`, so it
// fires exactly once and then normal conversation resumes. Bespoke and in-voice;
// some leave a tiny keepsake (cash) and/or grant a day-long buff. Keyed by the
// FRIENDS id. Friends not listed here simply have no hangouts (graceful no-op).
export interface HangoutScene {
  friend: string;        // FRIENDS id
  hearts: number;        // heart threshold that unlocks the scene
  flag: string;          // storySeen id, e.g. 'hang-granny-4'
  speaker: string;       // dialog speaker (matches a portrait where one exists)
  lines: string[];
  money?: number;        // a small token of cash handed over during the scene
  buff?: BuffId;         // an optional day-long buff the scene grants
  keepsake?: string;     // a KEEPSAKES id — the real reward at a capstone (granted in code)
  rewardLine?: string;   // a closing line describing the keepsake / buff
}
export const HANGOUTS: HangoutScene[] = [
  // — Granny Sato —
  { friend: 'granny', hearts: 4, flag: 'hang-granny-4', speaker: 'Granny Sato',
    lines: [
      'Granny Sato waves you over to a folding stool she keeps tucked by the tomatoes. "Sit, sit. The plants can wait. Old women cannot."',
      '"When my husband passed, the neighbors stopped knocking. Folk get shy around grief, like it might be catching. This glass house was the only thing that still needed me every single morning."',
      '"And then you turned up, smelling of fish, asking an old woman for a key. Best thing to happen to this place in years."',
    ], money: 400, keepsake: 'plums', rewardLine: 'She presses a jar of sun-pickled plums into your bag. "For later. Do not argue." (A jar of plums to keep — and a grandmother. +¥400 besides.)' },
  { friend: 'granny', hearts: 8, flag: 'hang-granny-8', speaker: 'Granny Sato',
    lines: [
      '"I have something to say, and I will only say it once, so listen." Granny Sato sets down her watering can with great ceremony.',
      '"I wrote you into the greenhouse rota. In pen. In my book. When I am too old to climb the step-ladder, this place is yours to mind."',
      '"Do not look at me like that. It is only a glasshouse and some dirt. ...It is also forty years of my mornings, and I am handing them to you."',
    ], buff: 'hearty', rewardLine: '"Now EAT — you are too thin." She feeds you until your seams creak. You feel hale and hearty all day. (Hearty buff!)' },
  // — Charlie —
  { friend: 'charlie', hearts: 4, flag: 'hang-charlie-4', speaker: 'Charlie',
    lines: [
      'Charlie lowers the camera he was definitely not pointing at you. "Okay, busted. I film everybody on this corner. It\'s a project. A document. A love letter to the block, y\'know?"',
      '"Thing is, it\'s been stuck for a year. No through-line. No heart. Couldn\'t figure out what it was even ABOUT."',
      'He looks at you a beat too long. "...And then I kept finding you in the footage. Just being decent to people. I think you might be the spine of the whole movie, man."',
    ], money: 1000, rewardLine: '"Here — coffee\'s on the production budget. You\'re talent now." He slips you a fistful of yen. (+¥1,000 "talent fee".)' },
  { friend: 'charlie', hearts: 8, flag: 'hang-charlie-8', speaker: 'Charlie',
    lines: [
      'Charlie\'s got his guitar out and, for once, the camera off. "Wrote something. Don\'t make it weird."',
      'He plays — rough, half-finished, but real. It\'s the konbini at 2am, the train hum, neon in the puddles. It\'s the whole neighborhood. It\'s, somehow, you.',
      '"Working title\'s \'Big City, Little Apartment.\' ...The little apartment\'s the good part. That\'s where the people are."',
    ], money: 750, keepsake: 'demodisc', rewardLine: 'He hands you a sharpie-scrawled demo disc with your name on it. "First copy. Don\'t flip it on auction when I\'m famous." (A keepsake to display, +¥750.)' },
  // — Max (the shore vampire) —
  { friend: 'max', hearts: 4, flag: 'hang-max-4', speaker: 'Max',
    lines: [
      'Max feeds the driftwood fire without looking up. "Sit. I want to show you something the daylight people never get to see."',
      'He lifts a hand toward the black water and the whole bay answers — bioluminescence, blue-green, breathing with the tide. "Three centuries, and this still stops me cold."',
      '"You learn to love the small repeating things, when you have forever to fill. A tide. A fire. A friend who sits without flinching."',
    ], buff: 'warm', rewardLine: '"Take some of the fire\'s warmth with you. It keeps better than I do." You feel pleasantly warm all day. (Warm buff — −20% energy cost.)' },
  { friend: 'max', hearts: 8, flag: 'hang-max-8', speaker: 'Max',
    lines: [
      'Max is quiet a long while. Then: "I am going to give you something, and you will NOT make it sentimental, because I cannot bear it."',
      'He works a heavy iron ring off his finger — older than the city, older than the country. "The man who built my coffin made this. He has been dead two hundred years. I have no one left to leave it to."',
      '"So. You. Pawn it if you are ever truly desperate; it is worth a fortune. But I would rather you kept it, and remembered an old monster kindly."',
    ], money: 1500, keepsake: 'ring', rewardLine: 'You pocket the ring. It hums faintly, like it remembers being loved. (A vampire\'s keepsake — worth ¥3,000 at the pawn shop if you ever must. +¥1,500 he forces on you besides.)' },
  // — Bingus the curator —
  { friend: 'bingus', hearts: 4, flag: 'hang-bingus-4', speaker: 'Bingus Doofelsmurt',
    lines: [
      'Bingus seizes your sleeve and hauls you behind the velvet rope. "You — YOU — get to see the Vault. Nobody sees the Vault."',
      'The "Vault" is a broom closet with one cracked teacup on a silk pillow, lit like a coronation. "My first acquisition. Worthless. Priceless. The day I decided this town deserved a museum."',
      '"Everyone laughed, of course. They still laugh. But you keep COMING BACK. You make the laughing quieter."',
    ], money: 600, keepsake: 'badge', rewardLine: 'He presses a "PATRON — LEVEL ONE" badge into your palm, hand-laminated, slightly sticky. "Wear it with terrifying pride." (A keepsake badge, +¥600 endowment.)' },
  { friend: 'bingus', hearts: 8, flag: 'hang-bingus-8', speaker: 'Bingus Doofelsmurt',
    lines: [
      'Bingus waits at the door with a brass plaque and the air of a man about to commit emotion. "Stand there. Do not move. Posterity is watching."',
      'He mounts the plaque by the entrance. It reads: "KAWAMACHI MUSEUM — co-founded, in spirit, by a true friend of the collection." Your name is under it. Spelled correctly and everything.',
      '"I have no children. The exhibits are my children. ...And you, I think, are the one who will keep them safe when I am only a portrait on a wall."',
    ], money: 2000, rewardLine: 'He weeps magnificently and insists you take a ¥2,000 "patronage stipend." (+¥2,000.)' },
  // — Tex —
  { friend: 'tex', hearts: 4, flag: 'hang-tex-4', speaker: 'Tex',
    lines: [
      'Tex sits you down on an upturned bait bucket and goes quiet, which for Tex is an event. "Lemme tell ya how I wound up sellin\' hats on a beach in Japan."',
      '"Had a ranch. Had a whole life, big as the sky. Lost the lot to a bad year and a worse handshake. Packed one sack — hats, mostly — and kept goin\' east till the land ran out."',
      '"Figured I\'d be a stranger here forever. Then folks like you started sayin\' howdy back." He clears his throat, aggressively.',
    ], money: 450, keepsake: 'hatband', rewardLine: '"Aw, hell. Take a hat band, on the house — real silver concho." He won\'t meet your eye. (A keepsake to display, +¥450.)' },
  { friend: 'tex', hearts: 8, flag: 'hang-tex-8', speaker: 'Tex',
    lines: [
      'Tex is holding his oldest hat, the brim sweat-dark and shapeless with years. "This one rode the ranch with me. Through the good and the losin\' of it. Ain\'t for sale. Never was."',
      '"...Which is exactly why I want YOU to have it. A hat like this don\'t belong on a shelf. It belongs on somebody headed somewhere."',
      '"Don\'t you dare thank me. Just wear it when the wind\'s at your back, and think on old Tex once in a while."',
    ], money: 2500, rewardLine: 'You take the hat. It has seen more country than you can imagine, and now it\'s yours. (A weathered keepsake, +¥2,500.)' },
  // — Yoshi the miko —
  { friend: 'miko', hearts: 4, flag: 'hang-miko-4', speaker: 'Yoshi',
    lines: [
      'Yoshi stops you at the temizuya and ladles the cold water herself. "Today you are not a visitor. Today you help me sweep. The kami does not mind an extra pair of hands, and neither do I."',
      'You sweep the sando in companionable quiet. She tells you the shrine is older than the city\'s name; that she is its ninth keeper; that some mornings the loneliness of that is a real weight.',
      '"And some mornings," she says, not looking at you, "a friend arrives with the dawn, and it is not heavy at all."',
    ], money: 500, keepsake: 'omamori', rewardLine: 'She ties a small omamori to your bag — handmade this morning, for you. "For safe roads. Carry it." (A blessed charm — a little luck while you carry it. +¥500 besides.)' },
  { friend: 'miko', hearts: 8, flag: 'hang-miko-8', speaker: 'Yoshi',
    lines: [
      'Yoshi leads you behind the honden, where visitors never go, to a plum tree her grandmother planted. "I have shown this to no one. It did not feel right — until you."',
      '"When the ninth keeper has no daughter, the shrine chooses its own tenth. The kami has been... unsubtle. It keeps sending me you."',
      'She bows, deeper than a miko bows to anyone. "Whatever roads you walk, this gate is yours to return through. Always. That is not a small thing for me to say."',
    ], buff: 'lucky', money: 1500, rewardLine: 'She folds a paper fortune into your hand. It reads only: 大吉 — greatest blessing. Fortune turns toward you. (Lucky buff + ¥1,500.)' },
  // — David the cat —
  { friend: 'david', hearts: 4, flag: 'hang-david-4', speaker: 'David',
    lines: [
      'David hops onto the windowsill and pats the spot beside him with one deliberate paw. "Sit. We are going to watch the city do nothing for a while. It is the highest of the arts."',
      'You watch the trains together. After a long silence: "I have outlasted nine owners. I do not call them owners, of course. Staff."',
      '"You are different. You ask me things — as though I might know the answers." A pause. "...I usually do. But it is the asking I have come to like."',
    ], money: 1500, rewardLine: 'He nudges a small hoard from behind the radiator toward you — a bottle cap, a shiny button, a fold of yen. "My contribution to the household. Do not make it strange." (+¥1,500.)' },
  { friend: 'david', hearts: 8, flag: 'hang-david-8', speaker: 'David',
    lines: [
      'David sits very upright, tail curled, the way he does only when something matters. "I am going to tell you my real name. I have not spoken it since before you were born."',
      'He tells you. It is long, and old, and in no language you know, and it sounds like wind through a shrine gate. "You will forget it by morning. That is correct. It is not for keeping. It is for having been trusted with."',
      '"I have been a stray, a god\'s messenger, and a dumpster\'s king. This — a warm window, a foolish human who listens — this is the best of my nine lives. Tell the others nothing."',
    ], buff: 'lucky', rewardLine: 'He presses his forehead to yours, once, and the room feels brighter for it. You feel oddly, deeply lucky. (Lucky buff!)' },
];

// ---- Friend home visits -----------------------------------------------------
// Once a friend reaches a high heart count (HOME_VISIT_HEARTS), one morning they
// show up in YOUR apartment as a scripted actor: they walk in, react to your
// place, leave a housewarming gift, and go. Once per friend (storySeen
// `visit-<id>`). `sprite` is the existing NPC sprite they walk in as. A decor
// reaction line is appended at runtime by the game (it needs your save state).
export interface HomeVisit {
  friend: string;     // FRIENDS id
  speaker: string;
  sprite: string;     // existing NPC sprite the visitor walks in as
  lines: string[];    // said on arrival (a decor reaction + closeLine are appended)
  money?: number;     // a housewarming gift
  closeLine?: string; // their parting line as they head for the door
}
export const HOME_VISITS: HomeVisit[] = [
  { friend: 'granny', speaker: 'Granny Sato', sprite: 'npc-granny', money: 1500,
    lines: [
      'A soft knock, far too early. You open the door to Granny Sato, a covered basket on her arm. "I was up. Old women are always up. So I thought — why not see where my favorite tenant actually LIVES."',
      'She bustles in without waiting to be asked, the way grandmothers do everywhere.',
    ], closeLine: '"I left soup on the counter. Eat it before it goes cold, and do not let the dishes pile up." She bustles out as briskly as she came. (+¥1,500 and a pot of soup.)' },
  { friend: 'charlie', speaker: 'Charlie', sprite: 'npc-charlie', money: 1500,
    lines: [
      'You wake to your buzzer and a familiar grin on the intercom. Charlie lets himself up, camera already rolling. "Morning! Don\'t mind me — establishing shots. \'The hero\'s humble dwelling.\' This is gold."',
      'He pans slowly across your apartment like it is a film set.',
    ], closeLine: '"This was great. THE place, man. I\'ll send you the rough cut." He backs out the door, still filming. (+¥1,500 location fee, he insists.)' },
  { friend: 'max', speaker: 'Max', sprite: 'npc-vampire', money: 2500,
    lines: [
      'A knock after dark — of course after dark. Max stands in your doorway, pale and apologetic. "Forgive the hour. I do not do mornings, as you may have gathered. May I come in? I have not been invited anywhere in some... decades."',
      'He steps over the threshold with visible, genuine delight.',
    ], closeLine: '"Thank you. Truly. An old thing like me is rarely invited in." He bows and slips out into the night. (+¥2,500, pressed on you firmly.)' },
  { friend: 'bingus', speaker: 'Bingus Doofelsmurt', sprite: 'npc-bingus', money: 2000,
    lines: [
      'A frantic knock. Bingus is on your doorstep with a clipboard. "I am conducting a SURVEY of significant local interiors, and yours made the shortlist! May I? I will be quick. I am never quick."',
      'He sweeps in, appraising everything as though it might belong in a display case.',
    ], closeLine: '"Provisionally, I declare your apartment a Site of Minor Cultural Importance. Congratulations." He leaves a small grant on the table. (+¥2,000.)' },
  { friend: 'tex', speaker: 'Tex', sprite: 'npc-hatvendor', money: 1200,
    lines: [
      'A knock, and a muffled "Howdy?" through the door. Tex stands in the hall holding his hat to his chest, strangely shy indoors. "Hope it ain\'t rude, droppin\' by. Beach gets quiet. Wanted to see how a city fella keeps house."',
      'He wipes his boots with enormous care before stepping in.',
    ], closeLine: '"Real nice place, partner. Real nice." He tips his hat and ambles back toward the sea. (+¥1,200 left on the table, "for the trouble.")' },
  { friend: 'miko', speaker: 'Yoshi', sprite: 'npc-miko', money: 1500,
    lines: [
      'A quiet knock at first light. Yoshi waits in the hall with a small cloth bundle. "I do not often leave the grounds. But a keeper should know where her people return to at night. So. Here I am."',
      'She slips off her sandals at the door and steps in softly.',
    ], closeLine: 'She sets a pinch of salt at your threshold and a fresh omamori on the shelf. "Now the gate watches over here, too." She bows, and goes. (+¥1,500 and a blessing.)' },
];

// ---- Decor: wallpaper / flooring / rugs ------------------------------------
// Bought + applied right in Arrange mode. Wall & floor are room-wide swaps; rugs
// are 2×2 objects placed on the floor (under furniture, walkable). The 'default'
// wall/floor render the original apartment tiles (free, always owned).
export interface DecorItem { id: string; name: string; kind: 'wall' | 'floor' | 'rug'; sprite: string; price: number; blurb: string }
export const DECOR: DecorItem[] = [
  // walls
  { id: 'wall-default', name: 'Plain Wall', kind: 'wall', sprite: '', price: 0, blurb: 'The apartment as it came.' },
  { id: 'wall-cream',  name: 'Cream Pinstripe', kind: 'wall', sprite: 't-wall-cream', price: 1200, blurb: 'Soft and bright. Makes 19 sqm feel like 20.' },
  { id: 'wall-wood',   name: 'Wood Panel',      kind: 'wall', sprite: 't-wall-wood',  price: 2200, blurb: 'Warm wainscot. Old-coffee-house cosy.' },
  { id: 'wall-mint',   name: 'Mint Trellis',    kind: 'wall', sprite: 't-wall-mint',  price: 2400, blurb: 'A calm sage-green. Easy to wake up to.' },
  { id: 'wall-sakura', name: 'Sakura Bloom',    kind: 'wall', sprite: 't-wall-sakura', price: 3200, blurb: 'Pale pink with drifting petals. Spring, indoors.' },
  { id: 'wall-navy',   name: 'Starlit Navy',    kind: 'wall', sprite: 't-wall-navy',  price: 3600, blurb: 'Deep blue scattered with little gold stars.' },
  // floors
  { id: 'floor-default', name: 'Original Floor', kind: 'floor', sprite: '', price: 0, blurb: 'The boards that were always here.' },
  { id: 'floor-oak',    name: 'Oak Boards',     kind: 'floor', sprite: 't-floor-oak',    price: 1600, blurb: 'Clean honeyed planks underfoot.' },
  { id: 'floor-tatami', name: 'Tatami Mats',    kind: 'floor', sprite: 't-floor-tatami', price: 2600, blurb: 'Woven rush. The whole room smells faintly of summer.' },
  { id: 'floor-checker', name: 'Checker Tile',  kind: 'floor', sprite: 't-floor-checker', price: 3000, blurb: 'A diner-ish checkerboard. Surprisingly fun.' },
  { id: 'floor-stone',  name: 'Slate Stone',    kind: 'floor', sprite: 't-floor-stone',  price: 3400, blurb: 'Cool grey flagstones. Modern and quiet.' },
  { id: 'floor-pink',   name: 'Pink Carpet',    kind: 'floor', sprite: 't-floor-pink',   price: 3800, blurb: 'Plush and rosy. Warm on bare feet.' },
  // rugs (2×2, placed)
  { id: 'rug-red',     name: 'Red Area Rug',   kind: 'rug', sprite: 't-rug-red',     price: 2000, blurb: 'A classic bordered rug that anchors the room.' },
  { id: 'rug-blue',    name: 'Blue Round Rug', kind: 'rug', sprite: 't-rug-blue',    price: 2200, blurb: 'A soft blue medallion to sink your feet into.' },
  { id: 'rug-persian', name: 'Persian Rug',    kind: 'rug', sprite: 't-rug-persian', price: 4200, blurb: 'Ornate red-and-gold. Looks like it has stories.' },
  { id: 'rug-tatami',  name: 'Tatami Mat',     kind: 'rug', sprite: 't-rug-tatami',  price: 1800, blurb: 'A bordered rush mat. A spot to kneel and breathe.' },
];
export const decorById = (id: string): DecorItem | undefined => DECOR.find(d => d.id === id);
export const DEFAULT_DECOR = { wall: 'wall-default', floor: 'floor-default' };
export const STARTER_DECOR = ['wall-default', 'floor-default'];

// ---- Festivals -------------------------------------------------------------
// Seasonal matsuri the city throws every so often. Each is a special DAY (not a
// span) anchored to an outdoor scene, with a little stall-side minigame and,
// sometimes, fireworks once the sky goes dark. The wiring agent reads this
// catalog + `festivalFor(day)` to spawn the in-world event; nothing here mutates
// state — these are PURE, deterministic helpers keyed only on the calendar `day`.
export interface Festival {
  id: string;
  name: string;
  blurb: string;                                       // marquee line, told the morning of
  scene: string;                                       // outdoor scene the festival takes over ('city' | 'shrine')
  nightFireworks: boolean;                             // does the sky bloom with hanabi after dark?
  minigame: 'goldfish' | 'ringtoss' | 'wish' | 'omikuji';
  rewardLine: string;                                  // flavor shown when you collect your festival keepsake
}

// Three festivals, rotated through in this order (see `festivalFor`).
export const FESTIVALS: Festival[] = [
  {
    id: 'summer-matsuri',
    name: 'Summer Festival',
    blurb: 'The city lane is strung with paper lanterns tonight — yatai stalls, the smell of grilled corn, and goldfish darting in shallow tubs. Stay till dark for the fireworks.',
    scene: 'city',
    nightFireworks: true,
    minigame: 'goldfish',
    rewardLine: 'You scoop one last goldfish before your paper net gives out, and someone hands you a candy apple "for trying so hard." Worth every yen.',
  },
  {
    id: 'tanabata',
    name: 'Star Festival (Tanabata)',
    blurb: 'Bamboo branches lean against the shrine gate, heavy with paper wishes. Write yours on a tanzaku strip and hang it high — they say the stars read the ones nearest the top.',
    scene: 'shrine',
    nightFireworks: false,
    minigame: 'wish',
    rewardLine: 'You tie your strip to the topmost branch and step back. The wind takes it gently. Tomorrow feels a little luckier already.',
  },
  {
    id: 'hatsumode',
    name: "New Year's Visit",
    blurb: 'The first shrine visit of the year. Bell-rope, two bows, two claps — then draw an omikuji and see what fortune the new year has folded up for you.',
    scene: 'shrine',
    nightFireworks: false,
    minigame: 'omikuji',
    rewardLine: 'Your omikuji reads 中吉 — middling-good luck. You tie the bad parts to the rack and keep the good parts in your pocket.',
  },
];

// Cadence: a festival lands on every `FESTIVAL_PERIOD`-th day (one roughly every
// two weeks), and they rotate through `FESTIVALS` in order. The scheme is a clean
// deterministic modulo window — a given `day` ALWAYS resolves to the same result,
// no RNG needed — and it never fires on day 1 (the first festival is day 14).
//   day 14 → FESTIVALS[0]  summer-matsuri
//   day 28 → FESTIVALS[1]  tanabata
//   day 42 → FESTIVALS[2]  hatsumode
//   day 56 → FESTIVALS[0]  summer-matsuri  … and so on, wrapping forever.
// Every other day returns null, which is what makes a festival day feel special.
export const FESTIVAL_PERIOD = 14;
export function festivalFor(day: number): Festival | null {
  if (day < FESTIVAL_PERIOD) return null;          // never on day 1 (and no festival before the first window)
  if (day % FESTIVAL_PERIOD !== 0) return null;    // most days: ordinary
  const nth = day / FESTIVAL_PERIOD;               // 1st, 2nd, 3rd … festival so far
  return FESTIVALS[(nth - 1) % FESTIVALS.length];
}

// Festival rewards are about charm, not income — modest by design.
export const FESTIVAL_REWARD_YEN = 600;            // small cash keepsake for playing a festival minigame

// ---- Fishing Tournament ----------------------------------------------------
// The whole town wanders down to the waterline to fish elbow-to-elbow against a
// live scoreboard. Like festivals, a tournament is a special DAY (not a span)
// anchored to the `shore` scene, and everything here is PURE & deterministic —
// keyed only on the calendar `day` and on fish yen `value`s. The wiring agent
// reads these to spawn the in-world derby, tally a run, and pay out a tier.
export const TOURNAMENT_NAME = 'Sumikawa Shore Fishing Derby';
export const TOURNAMENT_BLURB =
  'The whole town has hauled tackle boxes down to the waterline — Genji is keeping score on a chalkboard by the skiff. Reel in your biggest haul before the tide turns and see where you land on the board.';
export const TOURNAMENT_SCENE = 'shore';            // the waterline scene the derby takes over (maps.ts `shore`)

// Cadence: a derby lands every `TOURNAMENT_PERIOD`-th day on a fixed phase so it
// reads as "roughly every ~10 days." The phase (`TOURNAMENT_PHASE`) is chosen so
// tournament days are ALWAYS ≡ 5 (mod 10) — i.e. they end in 5 and are odd —
// while festivals are multiples of `FESTIVAL_PERIOD` (14), which are always even.
// Odd vs. even means the two events can NEVER coincide, at any day, forever. As
// with festivals it's a clean modulo window (no RNG, same `day` → same answer)
// and it never fires on day 1.
//   day 5  → derby      day 15 → derby      day 25 → derby   …
//   festival days 14 / 28 / 42 / 56 stay derby-free (even, never ≡ 5 mod 10).
export const TOURNAMENT_PERIOD = 10;
export const TOURNAMENT_PHASE = 5;                  // offset within the period; keeps derbies clear of festivals
export function fishingTournamentDay(day: number): boolean {
  if (day <= 1) return false;                       // never on day 1
  return day % TOURNAMENT_PERIOD === TOURNAMENT_PHASE;
}

// Scoring: a caught fish's yen `value` maps to derby POINTS at a tidy 1-per-¥10,
// so the leaderboard reads in small, friendly numbers while still honoring rarity
// (a Tiny Minnow ¥80 → 8 pts; a Golden Carp ¥1800 → 180 pts; a Blue Marlin
// ¥4000 → 400 pts). The wiring agent sums a run's catches into a best score and
// feeds it to `tournamentTierFor`.
export function tournamentScore(fishValue: number): number {
  return Math.max(1, Math.round(fishValue / 10));
}

export interface TournamentTier {
  name: string;
  minScore: number;   // lowest run score that earns this tier (inclusive)
  prize: number;      // yen handed over at the dock for placing here
}

// Four cozy placement tiers keyed off a run's best score. Bronze sits at 0 so
// everyone who casts a line takes something home; prizes climb to feel special
// without breaking the economy — Grand (¥2200) is about one Golden Carp's worth,
// a great-run bonus on TOP of the fish you keep, not a windfall. Tiers are listed
// low→high; `tournamentTierFor` walks them and returns the best one earned.
export const TOURNAMENT_TIERS: TournamentTier[] = [
  { name: 'Bronze Lure',  minScore: 0,   prize: 200  },
  { name: 'Silver Reel',  minScore: 150, prize: 500  },
  { name: 'Gold Hook',    minScore: 320, prize: 1100 },
  { name: 'Grand Marlin', minScore: 550, prize: 2200 },
];

export function tournamentTierFor(score: number): TournamentTier {
  let earned = TOURNAMENT_TIERS[0];
  for (const tier of TOURNAMENT_TIERS) {
    if (score >= tier.minScore) earned = tier;      // tiers are ascending, so the last match is the highest
  }
  return earned;
}
