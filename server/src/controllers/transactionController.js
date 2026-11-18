import { z } from 'zod';
import { HttpError } from '../lib/httpError.js';
import {
  amountSchema,
  monthSchema,
  objectIdSchema,
  transactionTypeSchema,
} from '../lib/schemas.js';
import { Transaction } from '../models/index.js';
import { getUsableCategory } from '../services/categoryService.js';
import { monthRange, toMonthKey } from '../utils/month.js';

const dateSchema = z.coerce.date().refine((d) => !Number.isNaN(d.getTime()), 'Invalid date');

export const listTransactionsQuerySchema = z.object({
  month: monthSchema.optional(),
  category: objectIdSchema.optional(),
  type: transactionTypeSchema.optional(),
});

export const createTransactionSchema = z.object({
  type: transactionTypeSchema,
  amount: amountSchema,
  categoryId: objectIdSchema,
  date: dateSchema,
  note: z.string().trim().max(500).optional(),
});

export const updateTransactionSchema = createTransactionSchema
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'At least one field is required');

async function assertCategoryMatchesType(userId, categoryId, type) {
  const category = await getUsableCategory(userId, categoryId);
  if (category.type !== type) {
    throw HttpError.badRequest(`Category "${category.name}" is for ${category.type} transactions`);
  }
}

async function findOwnedTransaction(userId, id) {
  const transaction = await Transaction.findOne({ _id: id, userId });
  if (!transaction) throw HttpError.notFound('Transaction not found');
  return transaction;
}

export async function listTransactions(req, res) {
  const { month = toMonthKey(), category, type } = req.validated.query;
  const { start, end } = monthRange(month);

  const transactions = await Transaction.find({
    userId: req.user._id,
    date: { $gte: start, $lt: end },
    ...(category && { categoryId: category }),
    ...(type && { type }),
  }).sort({ date: -1, createdAt: -1 });

  res.json({ month, transactions });
}

export async function createTransaction(req, res) {
  const body = req.validated.body;
  await assertCategoryMatchesType(req.user._id, body.categoryId, body.type);

  const transaction = await Transaction.create({ ...body, userId: req.user._id });
  res.status(201).json({ transaction });
}

export async function updateTransaction(req, res) {
  const transaction = await findOwnedTransaction(req.user._id, req.validated.params.id);
  const updates = req.validated.body;

  if (updates.categoryId || updates.type) {
    await assertCategoryMatchesType(
      req.user._id,
      updates.categoryId ?? transaction.categoryId,
      updates.type ?? transaction.type,
    );
  }

  transaction.set(updates);
  await transaction.save();
  res.json({ transaction });
}

export async function deleteTransaction(req, res) {
  const transaction = await findOwnedTransaction(req.user._id, req.validated.params.id);
  await transaction.deleteOne();
  res.status(204).end();
}
