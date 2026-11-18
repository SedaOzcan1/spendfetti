const moneyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'TRY',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
});

/** ₺4,500 — used in server-generated notification text. */
export const formatMoney = (amount) => moneyFormatter.format(amount);

/** "2026-11" → "November" */
export function monthName(month) {
  const [year, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, m - 1, 1)),
  );
}
