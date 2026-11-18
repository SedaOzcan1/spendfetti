import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useMe } from '../../api/auth.js';
import { prefersReducedMotion, PRESETS } from './confettiPresets.js';

const CelebrationContext = createContext(null);

export function CelebrationProvider({ children }) {
  const { data: user } = useMe();
  const canvasRef = useRef(null);
  const instanceRef = useRef(null);
  const [announcement, setAnnouncement] = useState('');
  const [toast, setToast] = useState(null);
  const confettiEnabled = user?.confettiEnabled ?? true;

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  /** Lazily loads canvas-confetti and binds it to the single shared canvas. */
  const getConfetti = useCallback(async () => {
    if (!instanceRef.current) {
      const { default: confetti } = await import('canvas-confetti');
      const fire = confetti.create(canvasRef.current, { resize: true, useWorker: false });
      instanceRef.current = { fire, shapeFromText: confetti.shapeFromText };
    }
    return instanceRef.current;
  }, []);

  const celebrate = useCallback(
    async ({ preset = 'burst', message, ...options }) => {
      if (message) setAnnouncement(message);
      if (!confettiEnabled || prefersReducedMotion()) {
        if (message) setToast(message);
        return;
      }
      try {
        const { fire, shapeFromText } = await getConfetti();
        await PRESETS[preset](fire, { ...options, shapeFromText });
        fire.reset(); // clear the canvas once the animation is over
      } catch {
        if (message) setToast(message); // e.g. canvas unsupported
      }
    },
    [confettiEnabled, getConfetti],
  );

  const value = useMemo(() => ({ celebrate }), [celebrate]);

  return (
    <CelebrationContext.Provider value={value}>
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-testid="confetti-canvas"
        className="pointer-events-none fixed inset-0 z-[60] size-full"
      />
      <div aria-live="polite" className="sr-only">
        {announcement}
      </div>
      {toast && (
        <div
          aria-hidden="true"
          className="fixed bottom-24 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-2 rounded-full bg-forest px-5 py-3 text-sm font-medium text-white shadow-lg lg:bottom-8"
        >
          <span>🎉</span> {toast}
        </div>
      )}
    </CelebrationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context hook lives with its provider
export function useConfetti() {
  const context = useContext(CelebrationContext);
  if (!context) throw new Error('useConfetti must be used inside <CelebrationProvider>');
  return context;
}
