import { Event } from '../models/index.js';

const CASE_INSENSITIVE = { locale: 'en', strength: 2 };

export function buildQuery({ city, types, from, to, maxPrice, free }) {
  const query = { startsAt: { $gte: from, ...(to && { $lt: to }) } };
  if (city) query.city = city;
  if (types?.length) query.type = { $in: types };
  if (free) query.minPrice = 0;
  else if (maxPrice !== undefined) query.minPrice = { $ne: null, $lte: maxPrice };
  return query;
}

/** MVP provider backed by the `events` collection (seeded sample data). */
export const seedProvider = {
  name: 'seed',

  async search(filters) {
    const query = buildQuery(filters);
    const sort =
      filters.sort === 'price' ? { minPrice: 1, startsAt: 1 } : { startsAt: 1, minPrice: 1 };
    // Unknown prices sort last when ordering by price
    const pipeline = [
      { $match: query },
      { $addFields: { _priceKey: { $ifNull: ['$minPrice', Number.MAX_SAFE_INTEGER] } } },
      { $sort: filters.sort === 'price' ? { _priceKey: 1, startsAt: 1 } : sort },
      { $skip: (filters.page - 1) * filters.limit },
      { $limit: filters.limit },
      { $project: { _priceKey: 0 } },
    ];

    const [rows, total] = await Promise.all([
      Event.aggregate(pipeline).collation(CASE_INSENSITIVE),
      Event.countDocuments(query).collation(CASE_INSENSITIVE),
    ]);

    return { items: rows.map((row) => Event.hydrate(row).toJSON()), total };
  },
};
