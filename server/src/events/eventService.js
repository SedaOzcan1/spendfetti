import { Event, EVENT_TYPES } from '../models/index.js';
import { providers } from './providers.js';

/**
 * Searches all providers. With a single provider, pagination is delegated;
 * with several, results are merged by date and paginated here.
 */
export async function searchEvents(filters) {
  if (providers.length === 1) return providers[0].search(filters);

  const window = { ...filters, page: 1, limit: filters.page * filters.limit };
  const results = await Promise.all(providers.map((provider) => provider.search(window)));
  const merged = results
    .flatMap((result) => result.items)
    .sort((a, b) =>
      filters.sort === 'price'
        ? (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity)
        : new Date(a.startsAt) - new Date(b.startsAt),
    );
  const start = (filters.page - 1) * filters.limit;
  return {
    items: merged.slice(start, start + filters.limit),
    total: results.reduce((sum, result) => sum + result.total, 0),
  };
}

export async function getEventMeta() {
  const cities = await Event.distinct('city', { startsAt: { $gte: new Date() } });
  return { cities: cities.sort((a, b) => a.localeCompare(b)), types: EVENT_TYPES };
}
