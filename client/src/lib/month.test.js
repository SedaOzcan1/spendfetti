import { defaultDateForMonth, formatMonth, recentMonths, shiftMonthKey } from './month.js';

describe('month helpers', () => {
  it('shifts across years', () => {
    expect(shiftMonthKey('2026-01', -1)).toBe('2025-12');
  });

  it('formats long and short month names', () => {
    expect(formatMonth('2026-11')).toBe('November 2026');
    expect(formatMonth('2026-11', { short: true })).toBe('Nov');
  });

  it('lists recent months newest first', () => {
    expect(recentMonths(3, '2026-02')).toEqual(['2026-02', '2026-01', '2025-12']);
  });

  it('defaults new transactions in past months to the 1st', () => {
    expect(defaultDateForMonth('2020-05')).toBe('2020-05-01');
  });
});
