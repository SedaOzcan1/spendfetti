import { Budget, Transaction } from '../models/index.js';
import { monthRange } from '../utils/month.js';

const round2 = (value) => Math.round(value * 100) / 100;

/** Expense totals per category for a month, as a Map<categoryId, total>. */
export async function expenseTotalsByCategory(userId, month) {
  const { start, end } = monthRange(month);
  const rows = await Transaction.aggregate([
    { $match: { userId, type: 'expense', date: { $gte: start, $lt: end } } },
    { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
  ]);
  return new Map(rows.map((row) => [row._id.toString(), round2(row.total)]));
}

export function budgetStatus(spent, limit, alertThreshold) {
  if (spent > limit) return 'exceeded';
  if (spent >= limit * alertThreshold) return 'warning';
  return 'ok';
}

/** Budgets of a user with this month's spending, sorted by usage (highest first). */
export async function getBudgetsWithSpending(userId, month) {
  const [budgets, totals] = await Promise.all([
    Budget.find({ userId }).populate('categoryId', 'name icon color type slug userId'),
    expenseTotalsByCategory(userId, month),
  ]);

  return budgets
    .filter((budget) => budget.categoryId) // category may have been removed
    .map((budget) => {
      const category = budget.categoryId;
      const spent = totals.get(category.id) ?? 0;
      return {
        id: budget.id,
        categoryId: category.id,
        category: {
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
        },
        limit: budget.limit,
        alertThreshold: budget.alertThreshold,
        spent,
        remaining: round2(budget.limit - spent),
        usage: budget.limit > 0 ? round2(spent / budget.limit) : 0,
        status: budgetStatus(spent, budget.limit, budget.alertThreshold),
      };
    })
    .sort((a, b) => b.usage - a.usage);
}
