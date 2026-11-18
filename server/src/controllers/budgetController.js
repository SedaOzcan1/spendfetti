import { z } from 'zod';
import { HttpError } from '../lib/httpError.js';
import { amountSchema, monthSchema, objectIdSchema } from '../lib/schemas.js';
import { Budget } from '../models/index.js';
import { getBudgetsWithSpending } from '../services/budgetService.js';
import { getUsableCategory } from '../services/categoryService.js';
import { toMonthKey } from '../utils/month.js';

export const listBudgetsQuerySchema = z.object({ month: monthSchema.optional() });
export const categoryParamsSchema = z.object({ categoryId: objectIdSchema });
export const upsertBudgetSchema = z.object({
  limit: amountSchema,
  alertThreshold: z.number().min(0.1).max(1).optional(),
});

export async function listBudgets(req, res) {
  const { month = toMonthKey() } = req.validated.query;
  res.json({ month, budgets: await getBudgetsWithSpending(req.user._id, month) });
}

export async function upsertBudget(req, res) {
  const { categoryId } = req.validated.params;
  const category = await getUsableCategory(req.user._id, categoryId);
  if (category.type !== 'expense')
    throw HttpError.badRequest('Budgets apply to expense categories');

  const budget = await Budget.findOneAndUpdate(
    { userId: req.user._id, categoryId },
    { $set: req.validated.body },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true },
  );
  res.json({ budget });
}

export async function deleteBudget(req, res) {
  const { deletedCount } = await Budget.deleteOne({
    userId: req.user._id,
    categoryId: req.validated.params.categoryId,
  });
  if (!deletedCount) throw HttpError.notFound('Budget not found');
  res.status(204).end();
}
