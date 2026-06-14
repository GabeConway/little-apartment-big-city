import { defineConfig } from 'vitest/config';

// Pure-logic unit tests run in a plain Node environment — the game's engine /
// state / fishing modules have no DOM or React dependencies. (Component or
// canvas tests would need environment: 'jsdom'; add per-file with a
// // @vitest-environment jsdom docblock if/when we test those.)
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
