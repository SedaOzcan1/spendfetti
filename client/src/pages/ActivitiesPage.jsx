import { Pencil } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMe } from '../api/auth.js';
import { useCategories } from '../api/categories.js';
import { useEventMeta, useEvents } from '../api/events.js';
import { useFunBudget } from '../api/funBudget.js';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { FilterSelect } from '../components/ui/Field.jsx';
import { PageError } from '../components/ui/PageState.jsx';
import { EditFunBudgetModal } from '../features/activities/EditFunBudgetModal.jsx';
import { EventCard } from '../features/activities/EventCard.jsx';
import {
  dateRangeFor,
  EVENT_TYPE_LABELS,
  QUICK_TYPES,
  WHEN_OPTIONS,
} from '../features/activities/eventFilters.js';
import { FunBudgetBand } from '../features/activities/FunBudgetBand.jsx';
import { FunBudgetPromptModal } from '../features/funBudget/FunBudgetPromptModal.jsx';
import { useTransactionModal } from '../features/transactions/TransactionModalContext.jsx';
import { useMonth } from '../lib/MonthContext.jsx';

const DEFAULTS = { when: 'next30', sort: 'date', budget: '1' };

function useFilterParams() {
  const [params, setParams] = useSearchParams();
  const get = (key) => params.get(key) ?? DEFAULTS[key] ?? '';
  const set = (updates) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (value === '' || value === undefined || value === DEFAULTS[key]) next.delete(key);
          else next.set(key, value);
        });
        return next;
      },
      { replace: true },
    );
  return { get, set };
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`h-11 rounded-lg px-5 text-sm transition-colors ${
        active ? 'bg-ink font-medium text-white' : 'bg-sidebar text-ink/80 hover:bg-nav-active'
      }`}
    >
      {children}
    </button>
  );
}

function LoadMore({ query }) {
  const ref = useRef(null);
  const { hasNextPage, isFetchingNextPage, fetchNextPage } = query;

  useEffect(() => {
    if (!hasNextPage || !ref.current || typeof IntersectionObserver === 'undefined')
      return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage();
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (!hasNextPage) return null;
  return (
    <div ref={ref} className="flex justify-center">
      <Button variant="secondary" onClick={() => fetchNextPage()} isLoading={isFetchingNextPage}>
        {isFetchingNextPage ? 'Loading…' : 'Load more'}
      </Button>
    </div>
  );
}

export default function ActivitiesPage() {
  const { month } = useMonth();
  const { data: user } = useMe();
  const { data: meta } = useEventMeta();
  const { data: categories = [] } = useCategories();
  const funBudget = useFunBudget(month);
  const { openTransactionModal } = useTransactionModal();
  const [promptOpen, setPromptOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { get, set } = useFilterParams();

  const hasBudget = funBudget.data?.status === 'allocated';
  const remaining = hasBudget ? funBudget.data.remaining : null;
  const withinBudget = hasBudget && get('budget') === '1';
  const when = get('when');
  const type = get('type');
  const free = get('free') === '1';
  const city = get('city') || user?.city || '';

  const events = useEvents({
    city: city || undefined,
    type: type || undefined,
    ...dateRangeFor(when, { from: get('from'), to: get('to') }),
    sort: get('sort'),
    free: free || undefined,
    withinBudget: withinBudget || undefined,
    month,
  });

  const items = events.data?.pages.flatMap((page) => page.items) ?? [];
  const total = events.data?.pages[0]?.total ?? 0;
  const funCategory = categories.find((c) => c.slug === 'fun-activities');
  const cities = [...new Set([...(meta?.cities ?? []), ...(city ? [city] : [])])];

  const addAsExpense = (event) =>
    openTransactionModal(null, {
      type: 'expense',
      categoryId: funCategory?.id ?? '',
      amount: event.minPrice ? String(event.minPrice) : '',
      title: event.title,
      note: `${event.venue} · ${event.city}`,
    });

  return (
    <>
      <PageHeader
        title="Activities"
        subtitle="Turn what you saved into good memories."
        action={
          hasBudget && (
            <Button
              size="lg"
              className="w-full sm:w-auto sm:min-w-52"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="size-4" aria-hidden="true" /> Edit budget
            </Button>
          )
        }
      />

      <div className="mt-8 space-y-6 lg:mt-10">
        {funBudget.data && (
          <FunBudgetBand funBudget={funBudget.data} onCloseMonth={() => setPromptOpen(true)} />
        )}

        <div className="grid grid-cols-2 gap-3 xl:grid-cols-[1fr_1fr_1fr_1fr_auto] xl:items-center xl:gap-5">
          <FilterSelect label="City" value={city} onChange={(e) => set({ city: e.target.value })}>
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="When" value={when} onChange={(e) => set({ when: e.target.value })}>
            {WHEN_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Type" value={type} onChange={(e) => set({ type: e.target.value })}>
            <option value="">All types</option>
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </FilterSelect>
          <FilterSelect
            label="Sort"
            value={get('sort')}
            onChange={(e) => set({ sort: e.target.value })}
          >
            <option value="date">Date: soonest</option>
            <option value="price">Price: lowest</option>
          </FilterSelect>
          <label
            className={`col-span-2 flex items-center gap-3 text-[15px] xl:col-span-1 ${hasBudget ? 'text-ink' : 'text-muted'}`}
            title={hasBudget ? undefined : 'Set aside a fun budget to use this filter'}
          >
            <button
              type="button"
              role="switch"
              aria-checked={withinBudget}
              disabled={!hasBudget}
              onClick={() => set({ budget: withinBudget ? '0' : '1' })}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${withinBudget ? 'bg-sage' : 'bg-stone'}`}
            >
              <span
                className={`absolute top-1 left-1 size-5 rounded-full bg-white shadow transition-transform ${withinBudget ? 'translate-x-5' : ''}`}
              />
            </button>
            Within my budget
          </label>
        </div>

        {when === 'custom' && (
          <div className="flex flex-wrap gap-3">
            <label className="text-sm text-muted">
              From
              <input
                type="date"
                value={get('from')}
                onChange={(e) => set({ from: e.target.value })}
                className="ml-2 h-11 rounded-lg border border-line bg-white px-3 text-ink"
              />
            </label>
            <label className="text-sm text-muted">
              To
              <input
                type="date"
                value={get('to')}
                onChange={(e) => set({ to: e.target.value })}
                className="ml-2 h-11 rounded-lg border border-line bg-white px-3 text-ink"
              />
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Chip active={!type && !free} onClick={() => set({ type: '', free: '' })}>
            All
          </Chip>
          {QUICK_TYPES.map((value) => (
            <Chip
              key={value}
              active={type === value}
              onClick={() => set({ type: type === value ? '' : value })}
            >
              {EVENT_TYPE_LABELS[value]}
            </Chip>
          ))}
          <Chip active={free} onClick={() => set({ free: free ? '' : '1' })}>
            Free
          </Chip>
          <p className="ml-auto text-sm text-muted" aria-live="polite">
            {total} {total === 1 ? 'event' : 'events'}
          </p>
        </div>

        {events.isError && <PageError error={events.error} />}

        {!events.isPending && items.length === 0 && (
          <p className="rounded-2xl bg-sidebar px-6 py-14 text-center text-muted">
            No events match these filters — try a wider date range or show free events.
          </p>
        )}

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              remainingBudget={withinBudget ? null : remaining}
              onAddExpense={addAsExpense}
            />
          ))}
        </div>

        <LoadMore query={events} />

        <p className="text-sm text-muted">
          Events are sample data. Tickets and details open on the source page.
        </p>
      </div>

      <FunBudgetPromptModal open={promptOpen} month={month} onClose={() => setPromptOpen(false)} />
      <EditFunBudgetModal
        open={editOpen}
        month={month}
        current={funBudget.data?.allocated ?? 0}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}
