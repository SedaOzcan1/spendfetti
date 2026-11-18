import { confettiColors } from '../../theme/colors.js';

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);

const isSmallScreen = () => typeof window !== 'undefined' && window.innerWidth < 640;
/** Fewer particles on phones keeps animations smooth. */
const scale = (count) => Math.round(count * (isSmallScreen() ? 0.5 : 1));

/**
 * Presets receive the confetti instance (bound to the shared canvas) and
 * return a promise that resolves when the animation is done.
 */
export const PRESETS = {
  /** Big burst from the centre (~1.5s): month closed with a surplus. */
  burst: (fire, { origin = { x: 0.5, y: 0.45 } } = {}) =>
    fire({
      particleCount: scale(140),
      spread: 90,
      startVelocity: 45,
      origin,
      colors: confettiColors,
    }),

  /** Small burst from an element: a budget was met, first transaction. */
  pop: (fire, { origin = { x: 0.5, y: 0.6 } } = {}) =>
    fire({
      particleCount: scale(50),
      spread: 60,
      startVelocity: 28,
      scalar: 0.9,
      origin,
      colors: confettiColors,
    }),

  /** Cannons from both sides: fun budget set aside. */
  cannons: (fire) =>
    Promise.all([
      fire({
        particleCount: scale(80),
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: confettiColors,
      }),
      fire({
        particleCount: scale(80),
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: confettiColors,
      }),
    ]),

  /** Gentle rain from the top (~3s): every budget met this month. */
  rain: (fire, { duration = 3000 } = {}) =>
    new Promise((resolve) => {
      const end = Date.now() + duration;
      const timer = setInterval(() => {
        if (Date.now() > end) {
          clearInterval(timer);
          resolve();
          return;
        }
        fire({
          particleCount: scale(6),
          angle: 270,
          spread: 140,
          startVelocity: 8,
          gravity: 0.7,
          ticks: 320,
          origin: { x: Math.random(), y: -0.05 },
          colors: confettiColors,
        });
      }, 120);
    }),

  /** Emoji confetti: a fun expense from the Activities page. */
  emoji: (fire, { emojis = ['🎟️', '🎶'], origin = { x: 0.5, y: 0.6 }, shapeFromText } = {}) =>
    fire({
      shapes: emojis.map((text) => shapeFromText({ text, scalar: 2 })),
      scalar: 2,
      particleCount: scale(24),
      spread: 70,
      startVelocity: 30,
      origin,
    }),
};

/** Converts an element's on-screen position into a confetti origin. */
export function originFromElement(element) {
  if (!element) return undefined;
  const rect = element.getBoundingClientRect();
  return {
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 3) / window.innerHeight,
  };
}
