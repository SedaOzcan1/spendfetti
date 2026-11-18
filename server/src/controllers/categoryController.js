import { z } from 'zod';
import { HttpError } from '../lib/httpError.js';
import { transactionTypeSchema } from '../lib/schemas.js';
import { Category } from '../models/index.js';
import { visibleCategoriesFilter } from '../services/categoryService.js';

export const listCategoriesQuerySchema = z.object({ type: transactionTypeSchema.optional() });

export const createCategorySchema = z.object({
  name: z.string().trim().min(1).max(40),
  type: transactionTypeSchema,
  icon: z.string().max(8).optional(),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Color must be a hex value like #7c3aed')
    .optional(),
});

export async function listCategories(req, res) {
  const { type } = req.validated.query;
  const categories = await Category.find({
    ...visibleCategoriesFilter(req.user._id),
    ...(type && { type }),
  }).sort({ type: 1, userId: 1, name: 1 });

  res.json({ categories });
}

export async function createCategory(req, res) {
  const { name, type } = req.validated.body;

  // Custom categories may not shadow a built-in category of the same type
  const clashesWithDefault = await Category.exists({ userId: null, type, name }).collation({
    locale: 'en',
    strength: 2,
  });
  if (clashesWithDefault) throw HttpError.conflict('A category with this name already exists');

  const category = await Category.create({ ...req.validated.body, userId: req.user._id });
  res.status(201).json({ category });
}
