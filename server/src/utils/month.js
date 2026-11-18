const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isValidMonth(month) {
  return typeof month === 'string' && MONTH_PATTERN.test(month);
}

/** Formats a date as a `YYYY-MM` month key (UTC). */
export function toMonthKey(date = new Date()) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

/** Returns the UTC [start, end) range covered by a `YYYY-MM` month key. */
export function monthRange(month) {
  if (!isValidMonth(month)) throw new Error(`Invalid month: ${month}`);
  const [year, monthIndex] = month.split('-').map(Number);
  return {
    start: new Date(Date.UTC(year, monthIndex - 1, 1)),
    end: new Date(Date.UTC(year, monthIndex, 1)),
  };
}

/** Shifts a `YYYY-MM` month key by `delta` months. */
export function shiftMonth(month, delta) {
  const { start } = monthRange(month);
  start.setUTCMonth(start.getUTCMonth() + delta);
  return toMonthKey(start);
}
