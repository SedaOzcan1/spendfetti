import { ArrowUpRight } from 'lucide-react';
import { trackEventClick } from '../../api/events.js';
import { Card } from '../../components/ui/Card.jsx';
import { formatMoney } from '../../lib/format.js';
import { EVENT_TYPE_LABELS, formatEventDate } from './eventFilters.js';

function Price({ event }) {
  if (event.minPrice === null) return <span className="text-base text-muted">Price unknown</span>;
  if (event.minPrice === 0) return <span className="text-sage">Free</span>;
  return <span>{formatMoney(event.minPrice, { decimals: 0 })}</span>;
}

export function EventCard({ event, remainingBudget, onAddExpense }) {
  const overBy =
    remainingBudget !== null && event.minPrice !== null ? event.minPrice - remainingBudget : 0;

  return (
    <Card as="article" className="flex flex-col p-3 sm:p-4">
      <div className="relative">
        <img
          src={event.imageUrl}
          alt=""
          loading="lazy"
          className="aspect-[16/9] w-full rounded-xl bg-subtle object-cover"
        />
        {overBy > 0 && (
          <span className="absolute top-3 left-3 rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold text-coral shadow-sm">
            {formatMoney(overBy, { decimals: 0 })} over your budget
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-2 pt-5 pb-2">
        <span className="self-start rounded-md bg-mint px-3 py-1 text-xs font-medium text-forest">
          {EVENT_TYPE_LABELS[event.type]}
        </span>
        <h3 className="mt-4 text-xl font-semibold text-ink sm:text-2xl">{event.title}</h3>
        <p className="mt-2 text-sm text-muted">
          {event.venue} · {event.city}
        </p>
        <p className="mt-1.5 text-sm text-muted">{formatEventDate(event.startsAt)}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <p className="text-2xl font-bold text-ink tabular-nums">
            <Price event={event} />
          </p>
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEventClick(event.id)}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-coral px-4 text-sm font-semibold text-white hover:bg-coral-dark"
          >
            Tickets / Details <ArrowUpRight className="size-4" aria-hidden="true" />
            <span className="sr-only">(opens in a new tab)</span>
          </a>
        </div>
        <button
          type="button"
          onClick={() => onAddExpense(event)}
          className="mt-5 self-start text-sm font-medium text-sage hover:underline"
        >
          + Add as expense
        </button>
      </div>
    </Card>
  );
}
