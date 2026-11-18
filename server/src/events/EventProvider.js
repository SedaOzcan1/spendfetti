/**
 * EventProvider contract
 * ----------------------
 * A provider is a module exporting an object with:
 *
 *   name: string
 *   search(filters): Promise<{ items: NormalizedEvent[], total: number }>
 *
 * filters: { city?, types?: string[], from: Date, to?: Date, maxPrice?: number,
 *            free?: boolean, sort: 'date' | 'price', page: number, limit: number }
 *
 * NormalizedEvent: { id, title, type, city, venue, startsAt, endsAt, minPrice,
 *                    maxPrice, currency, imageUrl, url, source, externalId }
 *
 * Providers are independent: add or remove one in `providers.js`.
 */
export const NORMALIZED_EVENT_FIELDS = [
  'title',
  'type',
  'city',
  'venue',
  'startsAt',
  'endsAt',
  'minPrice',
  'maxPrice',
  'currency',
  'imageUrl',
  'url',
  'source',
  'externalId',
];
