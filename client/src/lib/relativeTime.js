const formatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const UNITS = [
  ['year', 365 * 24 * 3600],
  ['month', 30 * 24 * 3600],
  ['week', 7 * 24 * 3600],
  ['day', 24 * 3600],
  ['hour', 3600],
  ['minute', 60],
];

/** "just now", "5 minutes ago", "yesterday" … */
export function timeAgo(value, now = Date.now()) {
  const seconds = Math.round((new Date(value).getTime() - now) / 1000);
  if (Math.abs(seconds) < 60) return 'just now';
  const [unit, size] = UNITS.find(([, s]) => Math.abs(seconds) >= s);
  return formatter.format(Math.round(seconds / size), unit);
}
