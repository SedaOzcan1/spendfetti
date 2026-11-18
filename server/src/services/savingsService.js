import { HttpError } from '../lib/httpError.js';
import { SavingsEntry, SavingsGoal } from '../models/index.js';
import { formatMoney } from '../utils/format.js';
import { monthRange } from '../utils/month.js';
import { notifyOnce } from './notificationService.js';

const round2 = (value) => Math.round(value * 100) / 100;

/** Saved amount per goal: deposits minus withdrawals. */
async function balancesByGoal(userId, goalIds) {
  const rows = await SavingsEntry.aggregate([
    { $match: { userId, ...(goalIds && { goalId: { $in: goalIds } }) } },
    {
      $group: {
        _id: '$goalId',
        saved: {
          $sum: {
            $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', { $multiply: ['$amount', -1] }],
          },
        },
      },
    },
  ]);
  return new Map(rows.map((row) => [row._id.toString(), round2(row.saved)]));
}

function monthsUntil(date, now) {
  const months =
    (date.getUTCFullYear() - now.getUTCFullYear()) * 12 + (date.getUTCMonth() - now.getUTCMonth());
  return Math.max(months, 0);
}

export function describeGoal(goal, saved, now = new Date()) {
  const remaining = round2(Math.max(goal.targetAmount - saved, 0));
  const monthsLeft = goal.targetDate ? monthsUntil(goal.targetDate, now) : null;
  return {
    ...goal.toJSON(),
    saved,
    remaining,
    progress: round2(Math.min(saved / goal.targetAmount, 1)),
    monthsLeft,
    // What to put aside each month to reach the target on time
    monthlyNeeded:
      monthsLeft !== null && remaining > 0 ? Math.ceil(remaining / Math.max(monthsLeft, 1)) : null,
  };
}

export async function listGoals(userId, now = new Date()) {
  const goals = await SavingsGoal.find({ userId }).sort({ achievedAt: 1, createdAt: 1 });
  const balances = await balancesByGoal(userId);
  return goals.map((goal) => describeGoal(goal, balances.get(goal.id) ?? 0, now));
}

export async function getOwnedGoal(userId, goalId) {
  const goal = await SavingsGoal.findOne({ _id: goalId, userId });
  if (!goal) throw HttpError.notFound('Savings goal not found');
  return goal;
}

export async function goalBalance(userId, goalId) {
  return (await balancesByGoal(userId, [goalId])).get(goalId.toString()) ?? 0;
}

/** Marks a goal achieved (once) and notifies; returns true when it was just reached. */
async function updateAchievement(goal, saved) {
  if (saved >= goal.targetAmount && !goal.achievedAt) {
    goal.achievedAt = new Date();
    await goal.save();
    await notifyOnce(goal.userId, {
      dedupeKey: `savings_goal_reached:${goal.id}`,
      type: 'savings_goal_reached',
      title: `You reached “${goal.name}” 🎉`,
      body: `${formatMoney(goal.targetAmount)} saved. Time to celebrate — or set a new goal.`,
      link: '/savings',
    });
    return true;
  }
  if (saved < goal.targetAmount && goal.achievedAt) {
    goal.achievedAt = undefined;
    await goal.save();
  }
  return false;
}

export async function addEntry(userId, { goalId, type, amount, date, note, source, month }) {
  const goal = await getOwnedGoal(userId, goalId);
  const before = await goalBalance(userId, goal._id);
  if (type === 'withdrawal' && amount > before) {
    throw HttpError.badRequest('You can’t withdraw more than you’ve saved', [
      { path: 'amount', message: `Must be at most ${before}` },
    ]);
  }

  const entry = await SavingsEntry.create({
    userId,
    goalId,
    type,
    amount,
    date,
    note,
    source,
    month,
  });
  const saved = round2(before + (type === 'deposit' ? amount : -amount));
  const goalReached = await updateAchievement(goal, saved);
  return { entry, goal: describeGoal(goal, saved), goalReached };
}

export async function deleteEntry(userId, entryId) {
  const entry = await SavingsEntry.findOneAndDelete({ _id: entryId, userId });
  if (!entry) throw HttpError.notFound('Entry not found');
  const goal = await SavingsGoal.findById(entry.goalId);
  if (goal) await updateAchievement(goal, await goalBalance(userId, goal._id));
}

export async function savingsOverview(userId, month) {
  const { start, end } = monthRange(month);
  const [goals, [thisMonth]] = await Promise.all([
    listGoals(userId),
    SavingsEntry.aggregate([
      { $match: { userId, date: { $gte: start, $lt: end } } },
      {
        $group: {
          _id: null,
          net: {
            $sum: {
              $cond: [{ $eq: ['$type', 'deposit'] }, '$amount', { $multiply: ['$amount', -1] }],
            },
          },
        },
      },
    ]),
  ]);

  const byKind = { savings: 0, investment: 0 };
  goals.forEach((goal) => {
    byKind[goal.kind] = round2(byKind[goal.kind] + goal.saved);
  });

  return {
    month,
    totalSaved: round2(byKind.savings + byKind.investment),
    byKind,
    savedThisMonth: round2(thisMonth?.net ?? 0),
    goalsReached: goals.filter((goal) => goal.achievedAt).length,
    goals,
  };
}
