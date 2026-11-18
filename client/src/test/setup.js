import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// canvas-confetti needs a real canvas; tests assert on calls instead.
export const confettiFire = Object.assign(
  vi.fn(() => Promise.resolve()),
  { reset: vi.fn() },
);
vi.mock('canvas-confetti', () => ({
  default: Object.assign(vi.fn(), {
    create: vi.fn(() => confettiFire),
    shapeFromText: vi.fn(({ text }) => ({ type: 'text', text })),
  }),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  confettiFire.mockClear();
});
