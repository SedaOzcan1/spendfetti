const LOCALE = 'en-US';

const currencyFormatters = new Map();

function currencyFormatter(currency, fractionDigits) {
  const key = `${currency}:${fractionDigits}`;
  if (!currencyFormatters.has(key)) {
    currencyFormatters.set(
      key,
      new Intl.NumberFormat(LOCALE, {
        style: 'currency',
        currency,
        currencyDisplay: 'narrowSymbol',
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }),
    );
  }
  return currencyFormatters.get(key);
}

/** ₺45,000.00 — pass `{ decimals: 0 }` for whole amounts (₺3,300). */
export function formatMoney(amount, { currency = 'TRY', decimals = 2 } = {}) {
  return currencyFormatter(currency, decimals).format(amount ?? 0);
}

/** −₺845.50 / +₺45,000.00 */
export function formatSignedMoney(amount, type, options) {
  return `${type === 'income' ? '+' : '−'}${formatMoney(Math.abs(amount), options)}`;
}

/** 45000 → "45k" for chart axes. */
export function formatCompact(value) {
  return new Intl.NumberFormat(LOCALE, { notation: 'compact' }).format(value).toLowerCase();
}

export function formatPercent(ratio, decimals = 0) {
  return new Intl.NumberFormat(LOCALE, {
    style: 'percent',
    maximumFractionDigits: decimals,
  }).format(ratio ?? 0);
}

/** "18 Nov 2026" */
export function formatDate(value) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

/** "2026-11-18" for <input type="date"> */
export function toDateInputValue(value) {
  return new Date(value).toISOString().slice(0, 10);
}
