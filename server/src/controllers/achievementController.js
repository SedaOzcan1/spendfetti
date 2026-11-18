import { z } from 'zod';
import { monthSchema } from '../lib/schemas.js';
import { markSeen } from '../services/achievementService.js';

export const markSeenSchema = z.object({
  month: monthSchema,
  keys: z
    .array(
      z
        .string()
        .regex(
          /^(month_positive|all_budgets_met|first_transaction|budget_met:[a-f\d]{24})$/i,
          'Unknown achievement',
        ),
    )
    .min(1)
    .max(50),
});

export async function markAchievementsSeen(req, res) {
  const { month, keys } = req.validated.body;
  await markSeen(req.user._id, month, keys);
  res.status(204).end();
}
