import { z } from 'zod';
import { HttpError } from '../lib/httpError.js';
import { amountSchema, monthSchema, objectIdSchema } from '../lib/schemas.js';
import {
  FunBudget,
  SAVINGS_ENTRY_TYPES,
  SAVINGS_KINDS,
  SavingsEntry,
  SavingsGoal,
} from '../models/index.js';
import { availableSurplus } from '../services/funBudgetService.js';
import {
  addEntry,
  deleteEntry,
  describeGoal,
  getOwnedGoal,
  goalBalance,
  savingsOverview,
} from '../services/savingsService.js';
import { toMonthKey } from '../utils/month.js';

const dateSchema = z.coerce.date().refine((d) => !Number.isNaN(d.getTime()), 'Invalid date');

const goalFields = {
  name: z.string().trim().min(1).max(60),
  kind: z.enum(SAVINGS_KINDS),
  targetAmount: amountSchema,
  targetDate: dateSchema.nullable(),
};

export const createGoalSchema = z.object({
  ...goalFields,
  kind: goalFields.kind.default('savings'),
  targetDate: goalFields.targetDate.optional(),
});
export const updateGoalSchema = z
  .object(goalFields)
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'At least one field is required');

export const createEntrySchema = z.object({
  goalId: objectIdSchema,
  type: z.enum(SAVINGS_ENTRY_TYPES).default('deposit'),
  amount: amountSchema,
  date: dateSchema.default(() => new Date()),
  note: z.string().trim().max(200).optional(),
});

export const listEntriesQuerySchema = z.object({
  goalId: objectIdSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const overviewQuerySchema = z.object({ month: monthSchema.optional() });

export const monthCloseSchema = z.object({
  month: monthSchema,
  funAmount: z.coerce.number().min(0).default(0),
  savings: z
    .array(z.object({ goalId: objectIdSchema, amount: amountSchema }))
    .max(10)
    .default([]),
});

export async function getOverview(req, res) {
  const { month = toMonthKey() } = req.validated.query;
  res.json(await savingsOverview(req.user._id, month));
}

export async function createGoal(req, res) {
  const goal = await SavingsGoal.create({ ...req.validated.body, userId: req.user._id });
  res.status(201).json({ goal: describeGoal(goal, 0) });
}

export async function updateGoal(req, res) {
  const goal = await getOwnedGoal(req.user._id, req.validated.params.id);
  const { targetDate, ...rest } = req.validated.body;
  goal.set(rest);
  if (targetDate !== undefined) goal.targetDate = targetDate ?? undefined;

  const saved = await goalBalance(req.user._id, goal._id);
  goal.achievedAt = saved >= goal.targetAmount ? (goal.achievedAt ?? new Date()) : undefined;
  await goal.save();
  res.json({ goal: describeGoal(goal, saved) });
}

export async function deleteGoal(req, res) {
  const goal = await getOwnedGoal(req.user._id, req.validated.params.id);
  await Promise.all([
    SavingsEntry.deleteMany({ userId: req.user._id, goalId: goal._id }),
    goal.deleteOne(),
  ]);
  res.status(204).end();
}

export async function listEntries(req, res) {
  const { goalId, limit } = req.validated.query;
  const entries = await SavingsEntry.find({ userId: req.user._id, ...(goalId && { goalId }) })
    .sort({ date: -1, createdAt: -1 })
    .limit(limit);
  res.json({ entries });
}

export async function createEntry(req, res) {
  res.status(201).json(await addEntry(req.user._id, req.validated.body));
}

export async function removeEntry(req, res) {
  await deleteEntry(req.user._id, req.validated.params.id);
  res.status(204).end();
}

/**
 * Closes a month in one step: sets the fun budget and moves money into
 * savings goals. The total cannot exceed the month's remaining surplus.
 */
export async function closeMonth(req, res) {
  const { month, funAmount, savings } = req.validated.body;
  const userId = req.user._id;

  if (await FunBudget.exists({ userId, month })) {
    throw HttpError.conflict('This month has already been closed');
  }
  await Promise.all(savings.map(({ goalId }) => getOwnedGoal(userId, goalId)));

  const available = await availableSurplus(userId, month);
  const total = funAmount + savings.reduce((sum, s) => sum + s.amount, 0);
  if (available <= 0) throw HttpError.badRequest('This month has no surplus to set aside');
  if (total > available) {
    throw HttpError.badRequest('Fun and savings together cannot exceed this month’s surplus', [
      { path: 'total', message: `Must be at most ${available}` },
    ]);
  }

  await FunBudget.create({
    userId,
    month,
    amount: funAmount,
    status: funAmount > 0 ? 'allocated' : 'dismissed',
    ...(funAmount > 0 && { allocatedAt: new Date() }),
  });

  const results = [];
  for (const { goalId, amount } of savings) {
    results.push(
      await addEntry(userId, {
        goalId,
        type: 'deposit',
        amount,
        date: new Date(),
        source: 'month_close',
        month,
        note: 'From month-end surplus',
      }),
    );
  }

  res.status(201).json({
    month,
    funAmount,
    saved: savings.reduce((sum, s) => sum + s.amount, 0),
    goalsReached: results.filter((r) => r.goalReached).map((r) => r.goal.id),
  });
}
