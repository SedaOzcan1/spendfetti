import { z } from 'zod';
import { monthSchema } from '../lib/schemas.js';
import { getMonthlySummary } from '../services/summaryService.js';
import { toMonthKey } from '../utils/month.js';

export const summaryQuerySchema = z.object({ month: monthSchema.optional() });

export async function getSummary(req, res) {
  const { month = toMonthKey() } = req.validated.query;
  res.json(await getMonthlySummary(req.user, month));
}
