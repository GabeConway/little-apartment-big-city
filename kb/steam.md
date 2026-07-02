# kb/steam.md — Steam release plan

Planned (2026-07-01), **not started**. This is the agreed shape of the Steam port —
read alongside [build-targets.md](build-targets.md) (current native pipeline).
Owner decisions baked in: **macOS build IS in scope**, **no native Linux depot**
(Deck/Linux runs the Windows build via Proton), **in-game achievements get ported
to Steam achievements**.

## Paperwork / storefront (Valve side)
1. Steamworks partner account: distribution agreement + tax + bank + identity (days).
2. **$100 app fee** per game (recouped after $1,000 gross).
3. Store page needs capsule art (several exact sizes), 5+ screenshots, short/long
   description, tags, trailer recommended. Valve page review ~3–5 business days.
4. Page must sit public as **"Coming Soon" ≥2 weeks before launch** (wishlist window).
5. Build review is a separate quick pass.

## Depots (what we ship)
Steam wants **loose files** per platform, uploaded via `steamcmd` (SteamPipe) —
no NSIS, no dmg. Steam handles install.

| Depot | Source | Status / notes |
|---|---|---|
| **Windows** | portable `little-apartment.exe` + resources (already built by CI) | Ship first — basically depot-ready. **WebView2 handling built (2026-07-02)**: `steam/installscript.vdf` runs the bundled Evergreen bootstrapper on first install (`HasRunKey` skips when runtime present); `scripts/prepare-steam-depot.mjs` stages the depot (exe + bootstrapper + vdf → `src-tauri/target/steam-depot/`); Rust startup guard `src-tauri/src/webview2.rs` re-runs the bootstrapper / shows an error box if the runtime is still missing. Remaining: wire `steamcmd` upload into CI; store sysreqs say Windows 10 64-bit. **Test the InstallScript under Proton on Deck** — WebView2 install inside the Proton prefix is the flaky part. |
| **macOS** | `.app` (currently aarch64-only) | **Wanted.** Needs work: Steam's mac audience includes Intel and Steam has no clean arch gating → build **universal** (add `x86_64-apple-darwin` target, `lipo`), and get real **Developer ID signing + notarization** (see build-targets "app is damaged" saga — ad-hoc signing won't cut it for Steam). |
| **Linux** | — none — | **No native depot.** Steam Linux Runtime doesn't ship `webkit2gtk-4.1`, so native Tauri builds are fragile there. Decision: **Deck/Linux run the Windows depot via Proton** (WebView2 under Proton works these days; the gilrs bridge reads the Deck pad — see build-targets controllers section). Test on real hardware → submit for **Deck Verified**. Revisit native only if Proton fails. |

## Steam achievements (port the in-game 45)
- In-game system: `GAME_ACHIEVEMENTS` (data.ts) + `award()` (monolith), 45 ids,
  `save.gameAch`. **Decision: mirror them 1:1 as Steam achievements.**
- Integration lives in **`src-tauri/` Rust via the `steamworks` crate** (Tauri
  command/event bridge) — `src/game/` stays React-only/dependency-free. Frontend
  fires the same `award(id)`; a thin bridge (outside `src/game/`, like
  `tauri-gamepad.ts`) forwards new unlocks to Rust → `SetAchievement`. No-op in
  browser/playtest.
- Define the 45 ids + names + descriptions in Steamworks admin (locked ones show
  hint text — keep parity with the phone Trophies app's no-spoiler behavior).
- `steam_appid.txt` beside the binary for local testing; on first Steam boot,
  backfill: push every id already in `save.gameAch` so existing saves sync.

## Cloud saves
Save = `localStorage` (`lab-save`) inside the webview profile dir. Options:
- **Steam Auto-Cloud** pointed at the per-platform webview storage path — zero
  code, but path is webview-internal (brittle across webview updates); verify per OS.
- Fallback story regardless: the existing **save-code export/import** (title →
  SAVE MANAGEMENT).

## Overlay
Shift+Tab hooks the GPU; usually works over WebView2 but webview games sometimes
render under it — **test early** on Windows. If broken, it's a known-issues note,
not a blocker.

## Sequence
1. Steamworks signup + $100 → app ID.
2. Windows depot from existing portable exe + WebView2 InstallScript; wire
   `steamcmd` upload into CI (same trigger as `release.yml`).
3. macOS: universal build + Developer ID signing/notarization → mac depot.
4. Achievements bridge (steamworks crate) + define 45 in Steamworks admin.
5. Store assets + page → review → Coming Soon, collect wishlists ≥2 weeks.
6. Deck-under-Proton testing → Deck Verified submission.
7. Price, date, launch.

Cost: $100 + time. Calendar ~1–2 months, dominated by review + Coming Soon
minimums, not engineering. Biggest engineering items: WebView2 InstallScript,
mac universal+notarization, achievements bridge, Deck/Proton validation.
