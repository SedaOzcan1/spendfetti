import { z } from 'zod';
import { getEventMeta, searchEvents } from '../events/eventService.js';
import { HttpError } from '../lib/httpError.js';
import { monthSchema } from '../lib/schemas.js';
import { Event, EVENT_TYPES } from '../models/index.js';
import { getFunBudgetStatus } from '../services/funBudgetService.js';
import { toMonthKey } from '../utils/month.js';

const queryBoolean = z.enum(['true', 'false']).transform((value) => value === 'true');
const queryDate = z.coerce.date().refine((d) => !Number.isNaN(d.getTime()), 'Invalid date');

export const searchEventsQuerySchema = z.object({
  city: z.string().trim().max(80).optional(),
  type: z
    .string()
    .transform((value) => value.split(',').filter(Boolean))
    .pipe(z.array(z.enum(EVENT_TYPES)))
    .optional(),
  from: queryDate.optional(),
  to: queryDate.optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  free: queryBoolean.optional(),
  // Use the remaining fun budget of `month` as maxPrice (unless maxPrice is given)
  withinBudget: queryBoolean.optional(),
  month: monthSchema.optional(),
  sort: z.enum(['date', 'price']).default('date'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

export async function listEvents(req, res) {
  const q = req.validated.query;
  const now = new Date();

  let { maxPrice } = q;
  let budget = null;
  if (q.withinBudget && maxPrice === undefined) {
    budget = await getFunBudgetStatus(req.user._id, q.month ?? toMonthKey());
    maxPrice = budget.remaining;
  }

  const filters = {
    city: q.city,
    types: q.type,
    from: q.from && q.from > now ? q.from : now,
    to: q.to,
    maxPrice,
    free: q.free,
    sort: q.sort,
    page: q.page,
    limit: q.limit,
  };
  const { items, total } = await searchEvents(filters);

  res.json({
    items,
    page: q.page,
    limit: q.limit,
    total,
    hasMore: q.page * q.limit < total,
    appliedMaxPrice: maxPrice ?? null,
  });
}

export async function getMeta(_req, res) {
  res.json(await getEventMeta());
}

/** Records an outbound click (simple analytics) and returns the target URL. */
export async function trackClick(req, res) {
  const event = await Event.findByIdAndUpdate(
    req.validated.params.id,
    { $inc: { clicks: 1 } },
    { returnDocument: 'after' },
  );
  if (!event) throw HttpError.notFound('Event not found');
  res.json({ url: event.url });
}
