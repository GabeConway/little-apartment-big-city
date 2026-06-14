import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Web build → Cloudflare Pages (dist/). Same dist is wrapped by Tauri for native targets.
// base '/' so the game's absolute asset paths (/images, /music, /sfx) resolve at app root
// in both the Pages deploy and the Tauri webview.
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
