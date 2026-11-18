import { Category, FunBudget, FUN_CATEGORY_SLUG, Transaction } from '../models/index.js';
import { monthRange, shiftMonth } from '../utils/month.js';
import { monthCloseSavings } from './monthCloseSavings.js';

const round2 = (value) => Math.round(value * 100) / 100;

export async function monthBalance(userId, month) {
  const { start, end } = monthRange(month);
  const rows = await Transaction.aggregate([
    { $match: { userId, date: { $gte: start, $lt: end } } },
    { $group: { _id: '$type', total: { $sum: '$amount' } } },
  ]);
  const totals = Object.fromEntries(rows.map((row) => [row._id, row.total]));
  return round2((totals.income ?? 0) - (totals.expense ?? 0));
}

export const suggestAmount = (balance, ratio) =>
  balance > 0 ? Math.min(Math.floor(balance * ratio), balance) : 0;

/**
 * Whether to offer the end-of-month fun budget popup. Shown at most once per
 * month, only for a positive balance and while the user hasn't opted out.
 */
export async function getPromptDecision(user, month) {
  const [balance, decision] = await Promise.all([
    monthBalance(user._id, month),
    FunBudget.exists({ userId: user._id, month }),
  ]);

  let reason = null;
  if (!user.funBudgetPromptEnabled) reason = 'disabled';
  else if (decision) reason = 'already_decided';
  else if (balance <= 0) reason = 'no_surplus';

  const suggestedAmount = suggestAmount(balance, user.funBudgetRatio);
  return {
    show: reason === null,
    reason,
    balance,
    ratio: user.funBudgetRatio,
    suggestedAmount,
    savingsRatio: user.savingsRatio,
    // Savings come out of what's left after the fun budget
    suggestedSavings: Math.max(
      Math.min(suggestAmount(balance, user.savingsRatio), Math.floor(balance - suggestedAmount)),
      0,
    ),
  };
}

/**
 * Fun spending counts from the day the budget was set aside until the end of
 * the following month (the month is closed first, then the money is enjoyed).
 */
export function spendingWindow(funBudget) {
  const allocatedAt = new Date(funBudget.allocatedAt ?? funBudget.createdAt);
  const start = new Date(
    Date.UTC(allocatedAt.getUTCFullYear(), allocatedAt.getUTCMonth(), allocatedAt.getUTCDate()),
  );
  const { end } = monthRange(shiftMonth(funBudget.month, 1));
  return { start, end };
}

export async function getFunBudgetStatus(userId, month) {
  const funBudget = await FunBudget.findOne({ userId, month });
  if (!funBudget || funBudget.status !== 'allocated') {
    return {
      month,
      status: funBudget?.status ?? 'none',
      allocated: 0,
      spent: 0,
      remaining: 0,
    };
  }

  const fun = await Category.findOne({ slug: FUN_CATEGORY_SLUG });
  const { start, end } = spendingWindow(funBudget);
  const [row] = await Transaction.aggregate([
    {
      $match: {
        userId,
        type: 'expense',
        categoryId: fun._id,
        date: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  const spent = round2(row?.total ?? 0);

  return {
    month,
    status: 'allocated',
    allocated: funBudget.amount,
    spent,
    remaining: round2(Math.max(funBudget.amount - spent, 0)),
    window: { from: start, to: end },
  };
}

/** How much of a month's surplus is still free to set aside. */
export async function availableSurplus(userId, month, { excludeFun = false } = {}) {
  const [balance, saved, funBudget] = await Promise.all([
    monthBalance(userId, month),
    monthCloseSavings(userId, month),
    excludeFun ? null : FunBudget.findOne({ userId, month, status: 'allocated' }),
  ]);
  return Math.round((balance - saved - (funBudget?.amount ?? 0)) * 100) / 100;
}
