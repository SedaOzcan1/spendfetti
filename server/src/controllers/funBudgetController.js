import { z } from 'zod';
import { HttpError } from '../lib/httpError.js';
import { amountSchema, monthSchema } from '../lib/schemas.js';
import { FunBudget } from '../models/index.js';
import {
  availableSurplus,
  getFunBudgetStatus,
  getPromptDecision,
} from '../services/funBudgetService.js';
import { toMonthKey } from '../utils/month.js';

export const monthQuerySchema = z.object({ month: monthSchema.optional() });

export const decideFunBudgetSchema = z.union([
  z.object({ month: monthSchema, amount: amountSchema }),
  z.object({
    month: monthSchema,
    dismissed: z.literal(true),
    neverAsk: z.boolean().optional(),
  }),
]);

export async function getPrompt(req, res) {
  const { month = toMonthKey() } = req.validated.query;
  res.json(await getPromptDecision(req.user, month));
}

export async function getFunBudget(req, res) {
  const { month = toMonthKey() } = req.validated.query;
  res.json(await getFunBudgetStatus(req.user._id, month));
}

/** Allocate (or update) a month's fun budget, or dismiss the prompt. */
export async function decideFunBudget(req, res) {
  const body = req.validated.body;
  const filter = { userId: req.user._id, month: body.month };

  if (body.dismissed) {
    if (body.neverAsk) {
      req.user.funBudgetPromptEnabled = false;
      await req.user.save();
    }
    const existing = await FunBudget.findOne(filter);
    if (existing?.status === 'allocated') {
      throw HttpError.conflict('A fun budget is already set aside for this month');
    }
    await FunBudget.updateOne(
      filter,
      { $set: { status: 'dismissed', amount: 0 } },
      { upsert: true },
    );
    return res.json(await getFunBudgetStatus(req.user._id, body.month));
  }

  // The fun budget can use the surplus not already moved to savings
  const available = await availableSurplus(req.user._id, body.month, { excludeFun: true });
  if (available <= 0) throw HttpError.badRequest('This month has no surplus to set aside');
  if (body.amount > available) {
    throw HttpError.badRequest('The fun budget cannot exceed what you saved this month', [
      { path: 'amount', message: `Must be at most ${available}` },
    ]);
  }

  await FunBudget.findOneAndUpdate(
    filter,
    {
      $set: { status: 'allocated', amount: body.amount },
      $setOnInsert: { allocatedAt: new Date() },
    },
    { upsert: true, returnDocument: 'after' },
  );
  // A previously dismissed month gets its allocation date when first allocated
  await FunBudget.updateOne(
    { ...filter, allocatedAt: null },
    { $set: { allocatedAt: new Date() } },
  );

  res.status(201).json(await getFunBudgetStatus(req.user._id, body.month));
}
