// Native gamepad bridge for the Tauri desktop shell.
//
// The webview Gamepad API is unreliable inside Tauri (WebView2 focus bug on
// Windows; WebKitGTK needs libmanette on Linux/Steam Deck), so the Rust side
// (src-tauri/src/gamepad.rs) reads controllers with gilrs and emits a
// "gamepad:state" event ~120 Hz. Here we mirror that into a polyfilled
// navigator.getGamepads() so the engine's existing pollGamepad() works unchanged.
//
// No-op outside Tauri: plain-browser `npm run dev` / playtest keep the real
// native Gamepad API. Lives outside src/game/ so the game stays React-only.

type PadButton = { pressed: boolean; value: number };
type PadState = {
  index: number;
  id: string;
  mapping: string;
  connected: boolean;
  buttons: PadButton[];
  axes: number[];
};

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export async function initTauriGamepad(): Promise<void> {
  if (!isTauri) return;
  const { listen } = await import('@tauri-apps/api/event');

  let pads: (Gamepad | null)[] = [];
  const known = new Set<number>();

  // Best-effort connect/disconnect events (the engine polls, so these are just
  // for completeness / future code). GamepadEvent exists in both webviews.
  const fire = (type: 'gamepadconnected' | 'gamepaddisconnected', gp: Gamepad) => {
    try {
      window.dispatchEvent(new GamepadEvent(type, { gamepad: gp }));
    } catch {
      /* GamepadEvent unavailable — ignore */
    }
  };

  await listen<PadState[]>('gamepad:state', (e) => {
    const now = performance.now();
    const next: (Gamepad | null)[] = [];
    const seen = new Set<number>();
    for (const p of e.payload) {
      seen.add(p.index);
      const gp = {
        index: p.index,
        id: p.id,
        mapping: p.mapping as GamepadMappingType,
        connected: p.connected,
        timestamp: now,
        axes: p.axes,
        buttons: p.buttons.map((b) => ({ pressed: b.pressed, touched: b.pressed, value: b.value })),
        vibrationActuator: null,
        hapticActuators: [],
      } as unknown as Gamepad;
      next[p.index] = gp;
      if (!known.has(p.index)) {
        known.add(p.index);
        fire('gamepadconnected', gp);
      }
    }
    for (const idx of [...known]) {
      if (!seen.has(idx)) {
        known.delete(idx);
        const old = pads[idx];
        if (old) fire('gamepaddisconnected', old);
      }
    }
    pads = next;
  });

  // Shadow the (empty-in-Tauri) native API with our gilrs-backed mirror.
  const getPads = () => pads.slice();
  try {
    (navigator as unknown as { getGamepads: () => (Gamepad | null)[] }).getGamepads = getPads;
  } catch {
    Object.defineProperty(navigator, 'getGamepads', { value: getPads, configurable: true });
  }
}
