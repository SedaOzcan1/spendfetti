import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    // The first run downloads the MongoDB binary used by mongodb-memory-server
    hookTimeout: 120_000,
  },
});
