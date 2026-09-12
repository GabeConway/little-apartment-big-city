import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Build-only: `npm run build` produces the dist/ that Tauri wraps for the desktop
// targets. There is no web/hosted deploy (see CLAUDE.md) — this used to say
// Cloudflare Pages, which is no longer true.
// base '/' so the game's absolute asset paths (/images, /music, /sfx) resolve at the
// app root inside the Tauri webview.
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    target: 'es2022',
  },
  // Tauri dev server settings (ignored by plain `vite`/CF Pages).
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
});
