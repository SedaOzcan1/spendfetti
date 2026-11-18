import { timeAgo } from './relativeTime.js';

describe('timeAgo', () => {
  const now = new Date('2026-11-18T12:00:00Z').getTime();
  it.each([
    ['2026-11-18T11:59:30Z', 'just now'],
    ['2026-11-18T11:55:00Z', '5 minutes ago'],
    ['2026-11-18T09:00:00Z', '3 hours ago'],
    ['2026-11-17T12:00:00Z', 'yesterday'],
    ['2026-11-04T12:00:00Z', '2 weeks ago'],
  ])('%s → %s', (value, expected) => {
    expect(timeAgo(value, now)).toBe(expected);
  });
});
