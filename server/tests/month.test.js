import { describe, expect, it } from 'vitest';
import { isValidMonth, monthRange, shiftMonth, toMonthKey } from '../src/utils/month.js';

describe('month utils', () => {
  it('validates YYYY-MM keys', () => {
    expect(isValidMonth('2026-11')).toBe(true);
    expect(isValidMonth('2026-13')).toBe(false);
    expect(isValidMonth('2026-1')).toBe(false);
    expect(isValidMonth(undefined)).toBe(false);
  });

  it('formats dates as month keys in UTC', () => {
    expect(toMonthKey(new Date('2026-02-28T23:59:59Z'))).toBe('2026-02');
  });

  it('returns a half-open UTC range for a month', () => {
    const { start, end } = monthRange('2026-12');
    expect(start.toISOString()).toBe('2026-12-01T00:00:00.000Z');
    expect(end.toISOString()).toBe('2027-01-01T00:00:00.000Z');
  });

  it('shifts months across year boundaries', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-11', 5)).toBe('2027-04');
  });

  it('throws on invalid months', () => {
    expect(() => monthRange('nope')).toThrow('Invalid month');
  });
});
