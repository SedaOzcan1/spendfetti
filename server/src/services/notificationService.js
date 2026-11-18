import { Category, FunBudget, FUN_CATEGORY_SLUG, Notification } from '../models/index.js';
import { formatMoney, monthName } from '../utils/format.js';
import { shiftMonth, toMonthKey } from '../utils/month.js';
import { getBudgetsWithSpending } from './budgetService.js';
import { getFunBudgetStatus, monthBalance } from './funBudgetService.js';

const FUN_BUDGET_LOW_RATIO = 0.2;

/** Creates a notification unless one with the same dedupe key exists. Returns true if created. */
export async function notifyOnce(userId, { dedupeKey, ...fields }) {
  const result = await Notification.updateOne(
    { userId, dedupeKey },
    { $setOnInsert: { userId, dedupeKey, readAt: null, ...fields } },
    { upsert: true },
  );
  return result.upsertedCount === 1;
}

export function notifyWelcome(userId) {
  return notifyOnce(userId, {
    dedupeKey: 'welcome',
    type: 'welcome',
    title: 'Welcome to Spendfetti 🎉',
    body: 'Add your first transaction to get started. Small steps, big plans.',
    link: '/transactions',
  });
}

/** Warns once per category and month when a budget nears or passes its limit. */
export async function checkBudgetAlerts(userId, month, categoryId) {
  const budgets = await getBudgetsWithSpending(userId, month);
  const relevant = categoryId
    ? budgets.filter((b) => b.categoryId === categoryId.toString())
    : budgets;

  for (const budget of relevant) {
    const name = budget.category.name;
    const spentText = `${formatMoney(budget.spent)} of ${formatMoney(budget.limit)} spent in ${monthName(month)}`;

    if (budget.status === 'exceeded') {
      await notifyOnce(userId, {
        dedupeKey: `budget_exceeded:${budget.categoryId}:${month}`,
        type: 'budget_exceeded',
        title: `You went over your ${name} budget`,
        body: `${spentText}.`,
        link: '/budgets',
      });
    } else if (budget.status === 'warning') {
      await notifyOnce(userId, {
        dedupeKey: `budget_warning:${budget.categoryId}:${month}`,
        type: 'budget_warning',
        title: `${name} is close to its limit`,
        body: `${spentText}. ${formatMoney(budget.remaining)} left.`,
        link: '/budgets',
      });
    }
  }
}

/** Warns once when a fun budget has 20% or less left to spend. */
export async function checkFunBudgetLow(userId, date) {
  const month = toMonthKey(date);
  // A fun budget set aside in month M is spent during M and M+1
  for (const candidate of [month, shiftMonth(month, -1)]) {
    const status = await getFunBudgetStatus(userId, candidate);
    if (status.status !== 'allocated' || status.allocated <= 0) continue;
    if (status.remaining > status.allocated * FUN_BUDGET_LOW_RATIO) continue;

    await notifyOnce(userId, {
      dedupeKey: `fun_budget_low:${candidate}`,
      type: 'fun_budget_low',
      title: 'Your fun budget is running low',
      body: `${formatMoney(status.remaining)} of ${formatMoney(status.allocated)} left to explore.`,
      link: '/activities',
    });
  }
}

/** Runs the checks that follow a new or edited expense. Never throws. */
export async function afterExpenseChange(userId, transaction) {
  if (transaction.type !== 'expense') return;
  try {
    await checkBudgetAlerts(userId, toMonthKey(transaction.date), transaction.categoryId);
    const fun = await Category.findOne({ slug: FUN_CATEGORY_SLUG });
    if (fun && transaction.categoryId.toString() === fun.id) {
      await checkFunBudgetLow(userId, transaction.date);
    }
  } catch (error) {
    console.error('Notification checks failed', error);
  }
}

/**
 * Time-based reminders, evaluated lazily when notifications are read
 * (no scheduler needed): close last month if it ended with a surplus.
 */
export async function syncReminders(user, now = new Date()) {
  if (!user.funBudgetPromptEnabled) return;
  const lastMonth = shiftMonth(toMonthKey(now), -1);
  if (await FunBudget.exists({ userId: user._id, month: lastMonth })) return;

  const balance = await monthBalance(user._id, lastMonth);
  if (balance <= 0) return;

  await notifyOnce(user._id, {
    dedupeKey: `month_close_reminder:${lastMonth}`,
    type: 'month_close_reminder',
    title: `Close ${monthName(lastMonth)} and celebrate`,
    body: `You saved ${formatMoney(balance)} in ${monthName(lastMonth)}. Set some aside for fun?`,
    link: `/?closeMonth=${lastMonth}`,
  });
}
