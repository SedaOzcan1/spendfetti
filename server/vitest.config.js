import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    env: { NODE_ENV: 'test', JWT_SECRET: 'test-secret' },
    // The first run downloads the MongoDB binary used by mongodb-memory-server
    hookTimeout: 120_000,
  },
});
