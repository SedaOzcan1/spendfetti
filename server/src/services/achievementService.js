import { FunBudget, Transaction, User } from '../models/index.js';
import { toMonthKey } from '../utils/month.js';

export const ACHIEVEMENTS = {
  MONTH_POSITIVE: 'month_positive',
  BUDGET_MET: 'budget_met', // budget_met:<categoryId>
  ALL_BUDGETS_MET: 'all_budgets_met',
  FIRST_TRANSACTION: 'first_transaction',
};

/** A month is "closed" once it is over or the user closed it explicitly. */
export async function isMonthClosed(userId, month, now = new Date()) {
  if (month < toMonthKey(now)) return true;
  return Boolean(await FunBudget.exists({ userId, month }));
}

/** Pure: achievement keys earned in a closed month. */
export function earnedAchievements({ closed, balance, budgets }) {
  if (!closed) return [];
  const keys = [];
  if (balance > 0) keys.push(ACHIEVEMENTS.MONTH_POSITIVE);

  const met = budgets.filter((budget) => budget.spent <= budget.limit);
  keys.push(...met.map((budget) => `${ACHIEVEMENTS.BUDGET_MET}:${budget.categoryId}`));
  if (budgets.length > 0 && met.length === budgets.length) keys.push(ACHIEVEMENTS.ALL_BUDGETS_MET);
  return keys;
}

export function unseen(user, month, keys) {
  const seen = new Set(
    (user.seenAchievements ?? []).filter((a) => a.month === month).map((a) => a.key),
  );
  return keys.filter((key) => !seen.has(key));
}

export async function markSeen(userId, month, keys) {
  if (!keys.length) return;
  await User.updateOne(
    { _id: userId },
    { $addToSet: { seenAchievements: { $each: keys.map((key) => ({ key, month })) } } },
  );
}

/**
 * Returns ['first_transaction'] the first time a user records a transaction
 * (and marks it seen right away, since it can only happen once).
 */
export async function firstTransactionAchievement(user, date) {
  const alreadySeen = user.seenAchievements?.some((a) => a.key === ACHIEVEMENTS.FIRST_TRANSACTION);
  if (alreadySeen || (await Transaction.countDocuments({ userId: user._id })) !== 1) return [];

  await markSeen(user._id, toMonthKey(date), [ACHIEVEMENTS.FIRST_TRANSACTION]);
  return [ACHIEVEMENTS.FIRST_TRANSACTION];
}
