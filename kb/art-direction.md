# Art Direction

The visual bible for *Little Apartment, Big City*. Read before generating, commissioning, or
hand-drawing any new asset. Implementation facts (atlas, canvas, file paths) live in
[games.md](games.md) — this file is the **style law** on top of them.

## Vibe (the three north stars)

Cozy pixel life-sim. Three reference games, each contributes one thing — we do **not** copy any
one wholesale:

- **Tiny Tower** — *warmth + readability at tiny size.* Tiny chibi people, instantly-legible
  furniture silhouettes, a "doll-house of little lives" feeling. Borrow: charm, clarity, gentle
  saturation. Do **not** borrow its flat side-on cutaway camera.
- **Stardew Valley** — *the master template.* Cohesive warm palette, soft shading, hand-made
  texture, top-down 3/4 read. This is the **default** when refs conflict. Borrow: palette
  discipline, cozy lighting, furniture that reads 3D from above.
- **Habbo Hotel** — *room-as-stage personality.* Expressive furniture, room-customization joy,
  chunky friendly props. Borrow: furniture variety + "decorate your space" spirit. Do **not**
  borrow its isometric grid.

If two refs disagree, **Stardew wins**.

## Perspective — match the current game (non-negotiable)

The engine is a square 16px tile grid (24×14 tiles = **384×224** logical view) with AABB movement.
New art **must** fit that camera. No isometric, no side-on cutaway — both break the tile grid and
collision.

- **Floors / ground** — drawn flat, straight from above.
- **Characters** — 16×16 chibi, drawn **front-facing** (the body reads as if seen from a low
  3/4 angle: you see the top + front of the head and torso). See `BODY_DOWN_*` in `sprites.ts` for
  the canonical proportions — head ~6px tall, stocky body, big readable eyes.
- **Furniture / walls** — fake-3D Stardew style: the top surface is foreshortened and you see a
  **short front face** so the object reads as solid, not a flat decal. Keep front faces shallow
  (1–4px) — this is top-down with a hint of depth, not true 3/4.

Rule of thumb: if a new prop wouldn't sit convincingly next to the existing bed/fridge/kotatsu,
it's wrong.

## Sprite scale & proportions

- **Tiles: 16×16.** Furniture is 1–N tiles; footprints stay on the grid.
- **Characters: ~16px**, matching the shipped player/NPC body. One base body + accessory overlays
  (hats/shades/aprons/etc.) — extend NPC variety with **new overlays**, not new full bodies.
- Big-head chibi cuteness is welcome **within** the existing ~16px frame. Do not scale characters
  up to 2-head Stardew height — it desyncs every shipped sprite.

## Palette — one fixed master palette

All assets share a single locked palette for cohesion (this is the Stardew lesson). Pull from the
colors already in `sprites.ts`; do **not** introduce off-palette hues. Prefer ramps of 3 (light /
mid / shadow) per material. Warm, slightly muted, cozy — never neon-bright except deliberate
accent props (arcade/neon signs).

**Soft cap: ~32–48 master colors total** (Stardew-scale). Not a hard lockout — add a ramp when a
new material genuinely needs one, but reuse before inventing. If you're past ~48, you're drifting.

Seed master palette (hex already shipping in-game — extend ramps, don't replace):

| Role | Colors |
|---|---|
| Skin | `#f0c8a0` `#caa27c` `#a9805a` `#8a6644` |
| Hair / wood-dark | `#6e4a2f` `#5a3c24` `#4a3f36` |
| Warm gold / lamp (key accent) | `#ffe9a0` `#ffd24a` `#c9a227` `#b08a50` |
| Cozy cream / walls / paper | `#e8e0d0` `#cdbb8e` `#c4bcab` |
| Reds (rugs, signage) | `#d05050` `#c0392b` `#9e3a3a` `#8e2a1e` |
| Greens (plants, grass) | `#7ce8a0` `#50c878` `#6f9e5e` `#5e8a4f` `#4d7440` |
| Blues (water, sky, tech) | `#9fc4e8` `#50a0d0` `#3d6e9e` `#2e5e8e` `#27517c` |
| Pinks / magenta (neon accent) | `#e857a8` `#b06ad0` `#a86b8a` |
| Cyan accent | `#7ce8e0` `#7ce8a0` |
| Neutrals / metal | `#e8f0f4` `#9aa0a6` `#8a96a0` `#6e7682` `#3a4250` |
| Darks / outline | `#2c3038` `#222831` `#16181d` `#1d1826` |

Shading: soft, low-contrast, **single light source from upper-left** (warm). Outlines are dark but
**colored toward the object's shadow**, not pure black, except the deepest `#16181d` for max
contrast. Night/morning recoloring is done at runtime (time-of-day wash, see games.md) — author
assets at **neutral daytime** and let the engine tint.

## Asset pipeline — PNG sprite sheets

New generated art ships as **PNG sprite sheets in `public/images/`**, loaded by absolute path
(`/images/...`), same as `zamazonk-logo.png` / `title-bg.png`.

**Implemented loader (`sprites.ts`):** `loadSheets(atlas, defs, done?)` takes `SheetDef[]`
(`{ key, src, fw, fh, frames, out? }`), loads each PNG async, slices `frames` horizontal cells of
`fw×fh`, optional nearest-neighbor downscale to `out` px height, and injects each frame into the
**same atlas** the renderer blits, keyed `${key}-${i}`. Nothing downstream changes — the render
loop just starts finding the new keys as they load. This is the **general pipeline for all
AI-generated art**: **world tiles, props, locations and maps will be generated through sprite-ai
and added as new `SheetDef` rows** — no renderer changes needed, just manifest entries (+ map/tile
wiring). (Player characters tried this pipeline then reverted to in-code art — see below.)

Source art is generated via the **sprite-ai MCP** (`mcp__sprite-ai__*`): `sprite_generate` (still,
1 tok; tile/bg/ui/effect 4 tok), `sprite_generate_animation` (walk/idle/etc., ~14 tok per walk →
horizontal spritesheet; "timed out" usually still completes — poll `sprite_list_creations`/
`sprite_get_job`). **Token note:** the API balance shows a small `monthly` pool + a separate
`purchased` pool; spends draw from `purchased` even when "balance" reads low — check both.

**Directional art (learned 2026-06-15):** true back/side views ARE achievable, but **only without**
`reference_asset_id` — the style reference locks the source POSE and returns front-facing for every
`direction`. To get them: drop the reference, set `camera_perspective: side` for profiles, and
write a forceful pose prompt ("STRICTLY FROM BEHIND, back of head, NO face" / "STRICT SIDE PROFILE
facing left, one eye and one ear visible, nose pointing left"). Trade-off: dropping the reference
risks character drift, so keep outfit/skin/hair fully specified in the prompt.

### Player characters (in-code pixel art)
Both player looks are **in-code 16px pixel-art bodies** (`sprites.ts` `addCharacter` / `BODY_*`),
the **same system as NPCs** — not PNGs. `masc` vibe = `player` / `player-hat` (the original body);
`fem` vibe = `player-fem` / `player-fem-hat` (`FEM_PAL` warm-brown hair + rose top + the
`ACC.longhair` overlay for a shoulder-length silhouette). True **4-direction** (up/down/left art,
`right` = mirrored left) with a 2-frame walk bob and the `m-shadow` under the feet. The cowboy hat
(`save.hat`) works on both via the `-hat` variants.

New game shows a **"what's your vibe?"** pick (not a gender — `save.vibe: 'fem' | 'masc'`) **plus a
name input** (`save.name`, 16 chars, default "Neighbor"); the picker thumbnails render the in-code
sprite to a `<canvas>` via `drawVibeThumb` (no image asset). **Name usage:** address the player by
`save.name`, never a pronoun — phone message bodies run a `{name}` substitution in `syncMessages`
(`state.ts`); put `{name}` in any new player-facing copy.

**History (don't repeat without buy-in):** a 128px AI-generated PNG villager set (`PC_SHEETS`,
`villager-*.png`, `walk-*.png`, `masc-back/side.png`) was tried (commit 287b0d1) then **reverted** —
the AI sprites kept missing the cozy style (googly eyes, child proportions, bowlegged walks). **To
add a new player look, author an in-code palette + accessory overlay (like an NPC), not a PNG.**
The `loadSheets` / `SheetDef` pipeline stays for **world / prop** art.

## Render resolution & scale (TARGET: 4× / Stardew proportion)

Decision (2026-06-15): chase a Stardew-Valley look by raising the game's internal render
resolution and authoring art larger, rather than shrinking characters into a 16px world.

> **Update:** the **character** half of this (128px 2-tile players) was reverted — players are
> in-code 16px again (see "Player characters" above). The `RR=2` render-resolution multiplier
> stays in `engine.ts`, ready for hi-res **world/tile** art; the 64px-tile target below still holds.

- **World logic stays in 16px-tile logical units** — `TILE=16`, camera, collision, and `save.px/py`
  are unchanged (no migration). The *renderer* maps logical → a higher-resolution buffer.
- **Target multiplier ≈ 4×**: tiles render at **64px**, characters at **128px** (= **2 tiles tall**,
  the Stardew proportion), so character art draws at full native detail. Logical buffer
  384×224 → **1536×896** (still an integer multiple of 384×224 — Retina rule holds).
- **Why 4× and not more**: character detail is capped by source resolution. 128px source ↔ 2 tiles
  at 64px/tile is the matched ceiling. Going higher only pays off if *all* source art is authored
  larger again.
- **Source-art targets** (regenerate through sprite-ai):
  - **Characters: 128px** (2-tile tall). Current 64px assets are interim (drawn upscaled until regen).
  - **World tiles: 64px native** (1 tile). Current 16px procedural art is interim (nearest ×4 = chunky).
  - **NPCs: ~128px** (2-tile) to match the player — otherwise 1-tile NPCs look half-height next to
    the 2-tile player (the "Granny Sato mismatch"). Regen the cast at the larger size.
- **Sequence**: flip the engine to the higher resolution first (accept chunky upscaled interim
  art), then regenerate characters → NPCs → world tiles/props at the target sizes to fill in detail.

- **Absolute paths only** — never hardcode an origin (breaks in the Tauri webview). Invariant.
- PNGs must be authored at **1× logical pixels** (16px tiles), transparent background, no
  anti-aliasing / no semi-transparent edge pixels — the renderer scales with
  `imageSmoothingEnabled = false` and any soft edge turns to mush at integer upscale.
- The existing in-code pixel-string art (`buildAtlas()` in `sprites.ts`) is **not** removed; both
  coexist. Rule of thumb: **characters, furniture, and detailed props → PNG; flat repeating tiles
  and tiny procedural bits → keep in-code.** Simple > clever — don't PNG-ify a 2-color floor tile.
- Keep `src/game/` dependency-free (React-only). PNGs live in `public/`, loaded via normal
  `<img>`/canvas draw — no new npm deps, no bundler asset imports inside `src/game/`.

## Gemini API pipeline — portraits, logos, splash art (`scripts/gemini-portraits.mjs`)

The second AI-art tool beside sprite-ai (2026-07-07). **Division of labor: sprite-ai = tiles/sprites/animations on the 16px grid; the Gemini tool = big painterly one-offs** — dialog portraits, the title wordmark, the title background, and future Steam capsules / Bingus-gallery paintings / scene splash art. All shipped dialog portraits + the title logo/bg were made with it (paid-tier Gemini API: no visible watermark, commercial terms; invisible SynthID remains). AI use is disclosed in the README footer; any storefront with an AI-content survey needs the same declaration.

**Setup**: `export GEMINI_API_KEY=...` (paid-tier key from AI Studio; keep it in `~/.zshrc`, never commit). Model default `gemini-2.5-flash-image` (~$0.04/image).

**Three modes** (outputs → `art-staging/` (gitignored) as PNG; review, then install):
- `node scripts/gemini-portraits.mjs regen <roster-name|all|path>` — image-to-image faithful recreation (used to strip the consumer-app ✦ watermark from the original set). Roster names in the script's `ROSTER`. A `path` target gets a generic prompt (no frame/nameplate language) — that's how `title-bg.png` was redone.
- `node scripts/gemini-portraits.mjs new "<NAME>" "<description>" [--ref <roster-name>]` — new character portrait in the house style: style-ref image (default `genji`) + description; frame + all-caps gold nameplate come from the built-in prompt.
- `node scripts/gemini-portraits.mjs gen <slug> "<full prompt>" [--ref <image-path>]` — free-form (logo, splash, capsule). You write the whole prompt; `--ref` may point at ANY image file.
- All modes take `--note "<extra prompt>"` (appended — retry corrections without editing the script), `--model`, `--out`.

**Portrait style law**: bust-height, wooden frame, **all-caps gold pixel nameplate directly on the dark bar — no plaque/box, uniform letter height**; character shown **in their in-game setting** (Granny at her greenhouse, Saito behind the bar). QA every output for: stray ✦ sparkle (esp. bottom-right), nameplate spelling/case, garbled signs, style drift.

**Hard-won lessons (don't relearn):**
- **i2i will NOT edit text.** Asking `regen`/`gen`-with-ref to change nameplate case/spelling fails ~100% (it faithfully copies, or blanks the plate). **Fresh generations render requested text fine.** To fix text on otherwise-good art, repaint deterministically: erase the bar + redraw in **Press Start 2P** (the game's `font-retro`) via a Playwright canvas script — see `scripts/fix-nameplates.mjs` (sample bar color → fillRect → 8-way-offset outline + gold fill).
- **Style refs bleed identity.** `new` with a ref can clone the ref's face (the Tex-looks-like-Genji bug). Counter with an explicit "completely different person from the reference — only copy style/frame/nameplate" note.
- **Transparent assets**: the model can't output alpha. Prompt for "one perfectly flat solid pure magenta (RGB 255 0 255) background, no gradient/glow/shapes", then chroma-key + auto-crop with a Playwright canvas script (see `scripts/chroma-key-logo.mjs`; de-fringe magenta-ish edge pixels toward the outline color). Also demand "dark BROWN outlines/shadows, never magenta-tinted" or the drop shadow keys badly.
- Exact text needs letter-by-letter spelling in the prompt ("B-I-N-G-U-S…"), commas called out explicitly, and "ALL CAPITAL LETTERS" or you get title-case.
- Background signage: pin it ("must say exactly CLUB KAIJU or be unreadable glyphs") or the model invents misspelled signs.
- The watermark ✦ from old consumer-app sources gets **copied by i2i** — tell the model the bottom-right sparkle "is a WATERMARK, not part of the artwork".

**Install pipeline (after explicit user approval of staged art)**: `sips -s format jpeg -s formatOptions 88 --resampleWidth 1024 art-staging/portraits/<n>.png --out public/images/portraits/<n>.jpeg` → add the exact speaker string to `PORTRAIT_IMAGES` (LittleApartmentGame.tsx) → `tsc`/`test`/`build` → playtest screenshots (title + a dialog, day + night) → user "ship" → commit.

## Checklist for any new asset

1. Reads clearly at its native size (tiles 64px, characters/NPCs 128px per the resolution target).
2. Uses only master-palette colors, 3-step ramps.
3. Upper-left warm light, colored (not black) outlines.
4. Correct camera: flat floor / front-facing chibi / shallow-front-face furniture.
5. Neutral daytime tone (engine handles night/morning).
6. PNG, transparent, hard edges, absolute `/images/` path — or justified in-code tile.
7. Sits convincingly beside the shipped bed/fridge/NPCs.
