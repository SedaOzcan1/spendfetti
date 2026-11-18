import {
  formatCompact,
  formatDate,
  formatMoney,
  formatPercent,
  formatSignedMoney,
} from './format.js';

describe('format helpers', () => {
  it('formats Turkish lira amounts', () => {
    expect(formatMoney(45000)).toBe('₺45,000.00');
    expect(formatMoney(3300, { decimals: 0 })).toBe('₺3,300');
  });

  it('signs amounts by transaction type', () => {
    expect(formatSignedMoney(845.5, 'expense')).toBe('−₺845.50');
    expect(formatSignedMoney(45000, 'income')).toBe('+₺45,000.00');
  });

  it('formats compact numbers, percents and dates', () => {
    expect(formatCompact(45000)).toBe('45k');
    expect(formatPercent(0.633, 1)).toBe('63.3%');
    expect(formatDate('2026-11-18T12:00:00Z')).toBe('18 Nov 2026');
  });
});
