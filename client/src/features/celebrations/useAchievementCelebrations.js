import { useEffect, useRef } from 'react';
import { useMarkAchievementsSeen } from '../../api/achievements.js';
import { useConfetti } from './CelebrationProvider.jsx';
import { originFromElement } from './confettiPresets.js';

/**
 * Plays one effect for the most important unseen achievement of a closed
 * month, then marks all of them as seen so they never repeat.
 */
export function useAchievementCelebrations(summary) {
  const { celebrate } = useConfetti();
  const markSeen = useMarkAchievementsSeen();
  const handledRef = useRef(new Set());
  const month = summary?.month;
  const keys = summary?.achievements ?? [];
  const signature = `${month}:${keys.join(',')}`;

  useEffect(() => {
    if (!keys.length || handledRef.current.has(signature)) return;
    handledRef.current.add(signature);

    if (keys.includes('all_budgets_met')) {
      celebrate({ preset: 'rain', message: 'You met every budget this month!' });
    } else if (keys.some((key) => key.startsWith('budget_met:'))) {
      celebrate({
        preset: 'pop',
        origin: originFromElement(document.querySelector('[data-celebrate="budgets"]')),
        message: 'You hit your budget!',
      });
    } else if (keys.includes('month_positive')) {
      celebrate({ preset: 'burst', message: 'You closed the month with money left over!' });
    }
    markSeen.mutate({ month, keys });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed by signature
  }, [signature]);
}
