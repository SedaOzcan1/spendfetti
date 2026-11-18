import { Category, Transaction } from '../models/index.js';
import { monthRange, shiftMonth } from '../utils/month.js';
import { earnedAchievements, isMonthClosed, unseen } from './achievementService.js';
import { getBudgetsWithSpending } from './budgetService.js';

export const TREND_MONTHS = 6;

const round2 = (value) => Math.round(value * 100) / 100;
const percentChange = (current, previous) =>
  previous > 0 ? round2(((current - previous) / previous) * 100) : null;

/** Income/expense totals per month for the `TREND_MONTHS` months ending at `month`. */
async function monthlyTotals(userId, month) {
  const firstMonth = shiftMonth(month, -(TREND_MONTHS - 1));
  const { start } = monthRange(firstMonth);
  const { end } = monthRange(month);

  const rows = await Transaction.aggregate([
    { $match: { userId, date: { $gte: start, $lt: end } } },
    {
      $group: {
        _id: { month: { $dateToString: { format: '%Y-%m', date: '$date' } }, type: '$type' },
        total: { $sum: '$amount' },
      },
    },
  ]);

  const byMonth = new Map();
  for (const { _id, total } of rows) {
    const entry = byMonth.get(_id.month) ?? { income: 0, expense: 0 };
    entry[_id.type] = round2(total);
    byMonth.set(_id.month, entry);
  }

  return Array.from({ length: TREND_MONTHS }, (_, i) => {
    const key = shiftMonth(firstMonth, i);
    return { month: key, income: 0, expense: 0, ...byMonth.get(key) };
  });
}

/** Expense distribution by category for a month, largest share first. */
async function categoryBreakdown(userId, month, totalExpense) {
  const { start, end } = monthRange(month);
  const rows = await Transaction.aggregate([
    { $match: { userId, type: 'expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
    { $sort: { total: -1 } },
  ]);

  const categories = await Category.find({ _id: { $in: rows.map((row) => row._id) } });
  const categoryById = new Map(categories.map((c) => [c.id, c]));

  return rows.map(({ _id, total }) => {
    const category = categoryById.get(_id.toString());
    return {
      categoryId: _id.toString(),
      name: category?.name ?? 'Unknown',
      icon: category?.icon,
      color: category?.color,
      total: round2(total),
      share: totalExpense > 0 ? round2(total / totalExpense) : 0,
    };
  });
}

export async function getMonthlySummary(user, month) {
  const trend = await monthlyTotals(user._id, month);
  const current = trend.at(-1);
  const previous = trend.at(-2);

  const totals = { ...current, balance: round2(current.income - current.expense) };
  delete totals.month;

  const [byCategory, budgets, monthClosed] = await Promise.all([
    categoryBreakdown(user._id, month, totals.expense),
    getBudgetsWithSpending(user._id, month),
    isMonthClosed(user._id, month),
  ]);
  const earned = earnedAchievements({ closed: monthClosed, balance: totals.balance, budgets });

  return {
    month,
    totals,
    comparison: {
      incomeChangePct: percentChange(current.income, previous.income),
      expenseChangePct: percentChange(current.expense, previous.expense),
      expenseToIncomeRatio:
        totals.income > 0 ? Math.round((totals.expense / totals.income) * 1000) / 1000 : null,
    },
    byCategory,
    trend,
    budgets,
    monthClosed,
    // Achievements earned this month that the user hasn't celebrated yet
    achievements: unseen(user, month, earned),
    funBudget: {
      ratio: user.funBudgetRatio,
      suggestedAmount: totals.balance > 0 ? Math.floor(totals.balance * user.funBudgetRatio) : 0,
    },
  };
}
