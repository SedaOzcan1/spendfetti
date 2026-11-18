import { SavingsEntry } from '../models/index.js';

/** Amount moved to savings from a month's surplus when it was closed. */
export async function monthCloseSavings(userId, month) {
  const [row] = await SavingsEntry.aggregate([
    { $match: { userId, source: 'month_close', month } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return Math.round((row?.total ?? 0) * 100) / 100;
}
