export const EVENT_TYPE_LABELS = {
  concert: 'Concert',
  theatre: 'Theatre',
  standup: 'Stand-up',
  cinema: 'Cinema',
  festival: 'Festival',
  sports: 'Sports',
  workshop: 'Workshop',
  exhibition: 'Exhibition',
  outdoor: 'Outdoors',
};

export const QUICK_TYPES = ['concert', 'theatre', 'standup', 'workshop'];

export const WHEN_OPTIONS = [
  { value: 'weekend', label: 'This weekend' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'next30', label: 'Next 30 days' },
  { value: 'custom', label: 'Custom range' },
];

const DAY = 86_400_000;
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());

/**
 * Converts a "when" preset into an ISO { from, to } range (local time).
 * Values are day-aligned so they stay stable across renders (they are part of
 * the query key); the API never returns events that already started.
 */
export function dateRangeFor(when, { now = new Date(), from, to } = {}) {
  const today = startOfDay(now);
  const todayIso = today.toISOString();
  switch (when) {
    case 'weekend': {
      const day = now.getDay(); // 0 Sun … 6 Sat
      const saturday =
        day === 0
          ? new Date(today.getTime() - DAY)
          : new Date(today.getTime() + ((6 - day) % 7) * DAY);
      return { from: todayIso, to: new Date(saturday.getTime() + 2 * DAY).toISOString() };
    }
    case 'week':
      return { from: todayIso, to: new Date(today.getTime() + 8 * DAY).toISOString() };
    case 'month':
      return {
        from: todayIso,
        to: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString(),
      };
    case 'custom':
      return {
        from: from ? new Date(`${from}T00:00:00`).toISOString() : todayIso,
        to: to ? new Date(new Date(`${to}T00:00:00`).getTime() + DAY).toISOString() : undefined,
      };
    case 'next30':
    default:
      return { from: todayIso, to: new Date(today.getTime() + 31 * DAY).toISOString() };
  }
}

/** "Fri, 20 Nov · 20:30" */
export function formatEventDate(value) {
  const date = new Date(value);
  const day = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(
    date,
  );
  return `${day} · ${time}`;
}
