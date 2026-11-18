export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function shiftMonthKey(month, delta) {
  const [year, m] = month.split('-').map(Number);
  const date = new Date(Date.UTC(year, m - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** "2026-11" → "November 2026" (or "Nov" with `{ short: true }`). */
export function formatMonth(month, { short = false } = {}) {
  const [year, m] = month.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    month: short ? 'short' : 'long',
    ...(short ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, m - 1, 1)));
}

/** The last `count` months, newest first. */
export function recentMonths(count = 12, from = currentMonthKey()) {
  return Array.from({ length: count }, (_, i) => shiftMonthKey(from, -i));
}

/** A date inside `month` for new transactions: today if in that month, else the 1st. */
export function defaultDateForMonth(month) {
  const today = new Date();
  if (currentMonthKey(today) === month) return today.toISOString().slice(0, 10);
  return `${month}-01`;
}
