import { dateRangeFor } from './eventFilters.js';

describe('dateRangeFor', () => {
  const wednesday = new Date(2026, 10, 18, 15, 42); // Wed 18 Nov 2026, 15:42 local

  it('is stable within a day (used as a query key)', () => {
    const later = new Date(2026, 10, 18, 23, 59);
    expect(dateRangeFor('next30', { now: wednesday })).toEqual(
      dateRangeFor('next30', { now: later }),
    );
  });

  it('covers the upcoming weekend', () => {
    const { to } = dateRangeFor('weekend', { now: wednesday });
    expect(new Date(to)).toEqual(new Date(2026, 10, 23)); // Monday 00:00
  });

  it('keeps the current weekend on a Sunday', () => {
    const sunday = new Date(2026, 10, 22, 10);
    const { to } = dateRangeFor('weekend', { now: sunday });
    expect(new Date(to)).toEqual(new Date(2026, 10, 23));
  });

  it('ends "this month" at the start of next month', () => {
    expect(new Date(dateRangeFor('month', { now: wednesday }).to)).toEqual(new Date(2026, 11, 1));
  });

  it('includes the whole last day of a custom range', () => {
    const range = dateRangeFor('custom', { now: wednesday, from: '2026-12-01', to: '2026-12-05' });
    expect(new Date(range.from)).toEqual(new Date(2026, 11, 1));
    expect(new Date(range.to)).toEqual(new Date(2026, 11, 6));
  });
});
