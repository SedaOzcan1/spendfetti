import { z } from 'zod';
import { TRANSACTION_TYPES } from '../models/constants.js';
import { isValidMonth } from '../utils/month.js';

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');
export const transactionTypeSchema = z.enum(TRANSACTION_TYPES);
export const monthSchema = z.string().refine(isValidMonth, 'Month must be in YYYY-MM format');

/** Positive money amount, rounded to 2 decimals. */
export const amountSchema = z.coerce
  .number()
  .positive()
  .max(1_000_000_000)
  .transform((value) => Math.round(value * 100) / 100);

export const idParamsSchema = z.object({ id: objectIdSchema });
