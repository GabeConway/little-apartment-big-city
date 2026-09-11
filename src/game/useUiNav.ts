import { useEffect, useState } from 'react';

// Active-input tracking + gamepad/keyboard navigation for the DOM UI (title
// screen, phone menu, shops). The in-world player movement lives in engine.ts;
// this hook only drives the React overlays so a controller (or arrow keys) can
// operate every menu, and so the UI can show the right prompts for whatever the
// player last touched (pointer vs keyboard vs gamepad).
//
// A surface opts in by putting `data-navroot` on its container; the hook then
// rovs focus over the enabled buttons inside it. Single-action overlays
// (dialog/sleep/end-of-day) are NOT navroots — the engine loop handles their
// A/B directly, so they're intentionally left alone here.

export type InputSource = 'pointer' | 'keyboard' | 'gamepad';

const DZ = 0.5; // analog dead-zone for menu navigation
const REPEAT_DELAY = 420; // ms before a held direction repeats
const REPEAT_RATE = 130; // ms between repeats

const activeRoot = (): HTMLElement | null => {
  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-navroot]'))
    .filter((el) => el.offsetParent !== null); // visible only
  return roots.length ? roots[roots.length - 1] : null; // topmost wins
};

const focusables = (root: HTMLElement): HTMLElement[] =>
  Array.from(root.querySelectorAll<HTMLElement>('button, [data-nav]')).filter(
    (el) => !(el as HTMLButtonElement).disabled && el.offsetParent !== null,
  );

const moveFocus = (delta: number) => {
  const root = activeRoot();
  if (!root) return;
  const items = focusables(root);
  if (!items.length) return;
  const cur = document.activeElement as HTMLElement;
  let idx = items.indexOf(cur);
  if (idx < 0) idx = delta > 0 ? -1 : 0;
  idx = (idx + delta + items.length) % items.length;
  items[idx].focus();
};

const clickFocused = () => {
  const root = activeRoot();
  if (!root) return;
  const items = focusables(root);
  if (!items.length) return;
  let el = document.activeElement as HTMLElement;
  if (!root.contains(el) || items.indexOf(el) < 0) {
    el = items[0];
    el.focus();
    return; // first press just lands focus; press again to activate
  }
  el.click();
};

export function useUiNav(): InputSource {
  const [source, setSource] = useState<InputSource>('pointer');

  useEffect(() => {
    let src: InputSource = 'pointer';
    document.body.dataset.input = src;
    const setSrc = (s: InputSource) => {
      if (src === s) return;
      src = s;
      document.body.dataset.input = s;
      setSource(s);
    };

    const NAV_NEXT = new Set(['arrowdown', 'arrowright', 's', 'd']);
    const NAV_PREV = new Set(['arrowup', 'arrowleft', 'w', 'a']);

    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      setSrc('keyboard');
      if (!activeRoot()) return; // in-world: let the engine handle it
      const k = e.key.toLowerCase();
      // We run in the capture phase (before the engine's bubble-phase keydown).
      // For keys we handle inside a menu, stop the event reaching the engine so it
      // can't ALSO queue an in-world interact (which would e.g. re-open a shop the
      // instant our click closes it).
      if (NAV_NEXT.has(k)) { e.preventDefault(); e.stopImmediatePropagation(); moveFocus(1); }
      else if (NAV_PREV.has(k)) { e.preventDefault(); e.stopImmediatePropagation(); moveFocus(-1); }
      // Activation must NOT auto-repeat. Space is also the in-world interact key, so
      // holding it on a menu would fire clickFocused() ~30×/s: on the title that walks
      // focus onto DELETE SAVE, clicks it, then clicks YES on the confirm panel that
      // mounts as a fresh navroot. Held navigation IS wanted, so the guard is here only.
      else if (k === 'enter' || k === ' ') {
        e.preventDefault(); e.stopImmediatePropagation();
        if (!e.repeat) clickFocused();
      }
    };
    const onPointer = () => setSrc('pointer');
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('pointermove', onPointer, true);
    window.addEventListener('pointerdown', onPointer, true);

    // ---- gamepad poll (independent of the game loop, so it covers the title) --
    const prev = { up: false, down: false, left: false, right: false, a: false };
    let repeatAt = 0;
    let lastRoot: HTMLElement | null = null;
    let raf = 0;

    const poll = (t: number) => {
      raf = requestAnimationFrame(poll);
      const pads = navigator.getGamepads?.();
      if (!pads) return;
      let gp: Gamepad | null = null;
      for (const p of pads) if (p) { gp = p; break; }

      const root = activeRoot();
      // Auto-focus the first item when a menu first appears, so the ring shows.
      if (root && root !== lastRoot) {
        const items = focusables(root);
        if (items.length && !root.contains(document.activeElement)) items[0].focus();
      }
      lastRoot = root;

      if (!gp) return;
      const ax = gp.axes[0] ?? 0, ay = gp.axes[1] ?? 0;
      const b = (i: number) => Boolean(gp!.buttons[i]?.pressed);
      const cur = {
        up: ay < -DZ || b(12),
        down: ay > DZ || b(13),
        left: ax < -DZ || b(14),
        right: ax > DZ || b(15),
        a: b(0),
      };
      if (cur.up || cur.down || cur.left || cur.right || cur.a || b(1) || b(2) || b(3) || b(9)) {
        setSrc('gamepad');
      }

      if (root) {
        const delta = cur.down || cur.right ? 1 : cur.up || cur.left ? -1 : 0;
        const wasNav = prev.up || prev.down || prev.left || prev.right;
        if (delta !== 0 && !wasNav) { moveFocus(delta); repeatAt = t + REPEAT_DELAY; }
        else if (delta !== 0 && t >= repeatAt) { moveFocus(delta); repeatAt = t + REPEAT_RATE; }
        if (cur.a && !prev.a) clickFocused();
      }
      prev.up = cur.up; prev.down = cur.down; prev.left = cur.left; prev.right = cur.right; prev.a = cur.a;
    };
    raf = requestAnimationFrame(poll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('pointermove', onPointer, true);
      window.removeEventListener('pointerdown', onPointer, true);
    };
  }, []);

  return source;
}
