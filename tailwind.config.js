/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Game uses font-retro (Press Start 2P) and font-pixel (VT323).
        'sans': ['Inter', 'sans-serif'],
        'retro': ['"Press Start 2P"', 'cursive'],
        'pixel': ['"VT323"', 'monospace'],
        'handwriting': ['"Kalam"', 'cursive'],
      },
      colors: {
        'matrix-green': '#00FF41',
        'fallout-amber': '#FFB900',
        'pc-beige': {
          'light': '#dcd4c3',
          'DEFAULT': '#cfc4a3',
          'dark': '#b4a98a',
          'darker': '#968b6d',
        },
      },
      keyframes: {
        'toast-in': {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      animation: {
        'toast-in': 'toast-in 0.3s ease-out',
      },
    },
  },
  plugins: [],
}
