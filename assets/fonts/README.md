# assets/fonts

Source font archives (originals — **not** bundled). This folder is outside
`public/` and `src/`, so nothing here ships in the `dist/` build.

The actual served files live in **`public/fonts/`** (loaded by `@font-face` in
`src/index.css` at the absolute path `/fonts/...`).

- `Naganoshi_Font_0_4.zip` — Naganoshi, a Japanese pixel font (OFL 1.1, GGBotNet).
  Extracted `Naganoshi.woff2` + `.woff` + `License.txt` → `public/fonts/`.
  Used for the kana/kanji store signs on the game canvas (see `font-jp`).
