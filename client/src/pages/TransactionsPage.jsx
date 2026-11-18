import { ArrowDownLeft, ArrowUpLeft, Download, Pencil, Search } from 'lucide-react';
import { useDeferredValue, useState } from 'react';
import { useCategories, useCategoryMap } from '../api/categories.js';
import { useSummary } from '../api/summary.js';
import { useTransactions } from '../api/transactions.js';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Card } from '../components/ui/Card.jsx';
import { FilterSelect } from '../components/ui/Field.jsx';
import { PageError } from '../components/ui/PageState.jsx';
import { SummaryStats } from '../features/dashboard/SummaryStats.jsx';
import { AddTransactionButton } from '../features/transactions/AddTransactionButton.jsx';
import {
  TransactionAmount,
  TransactionListItem,
} from '../features/transactions/TransactionRow.jsx';
import { useTransactionModal } from '../features/transactions/TransactionModalContext.jsx';
import { downloadCsv, toCsv } from '../lib/csv.js';
import { formatDate, toDateInputValue } from '../lib/format.js';
import { useMonth } from '../lib/MonthContext.jsx';
import { formatMonth } from '../lib/month.js';

const SORT_OPTIONS = [
  { value: 'date_desc', label: 'Newest first' },
  { value: 'date_asc', label: 'Oldest first' },
  { value: 'amount_desc', label: 'Highest amount' },
  { value: 'amount_asc', label: 'Lowest amount' },
];

function DirectionIcon({ type }) {
  const income = type === 'income';
  const Icon = income ? ArrowDownLeft : ArrowUpLeft;
  return (
    <span
      aria-hidden="true"
      className={`grid size-11 shrink-0 place-items-center rounded-lg ${income ? 'bg-mint text-sage' : 'bg-cream text-[#a0703a]'}`}
    >
      <Icon className="size-5" strokeWidth={1.8} />
    </span>
  );
}

export default function TransactionsPage() {
  const { month } = useMonth();
  const summary = useSummary(month);
  const { data: categories = [] } = useCategories();
  const categoryMap = useCategoryMap();
  const { openTransactionModal } = useTransactionModal();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('date_desc');
  const q = useDeferredValue(search.trim());

  const transactions = useTransactions({ month, q, category, type, sort });
  const rows = transactions.data ?? [];
  const isFiltered = Boolean(q || category || type);

  const exportCsv = () => {
    const csv = toCsv(rows, [
      { label: 'Date', value: (t) => toDateInputValue(t.date) },
      { label: 'Name', value: (t) => t.title },
      { label: 'Type', value: (t) => t.type },
      { label: 'Category', value: (t) => categoryMap.get(t.categoryId)?.name },
      { label: 'Amount', value: (t) => (t.type === 'income' ? t.amount : -t.amount) },
      { label: 'Note', value: (t) => t.note },
    ]);
    downloadCsv(`spendfetti-${month}.csv`, csv);
  };

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle="Follow your money. Everything in one place."
        action={<AddTransactionButton />}
      />

      <div className="mt-8 space-y-6 lg:mt-10">
        {summary.data && (
          <div className="hidden lg:block">
            <SummaryStats summary={summary.data} />
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[1.5fr_1fr_1.1fr_1fr_auto] xl:gap-5">
          <label className="relative block sm:col-span-2 xl:col-span-1">
            <span className="sr-only">Search transactions</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions…"
              className="h-12 w-full rounded-lg border border-line bg-white pr-11 pl-4 text-[15px] text-ink placeholder:text-ink/70 focus:border-sage focus:outline-none"
            />
            <Search className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-muted" />
          </label>
          <FilterSelect
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </FilterSelect>
          <FilterSelect label="Type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Income & expenses</option>
            <option value="income">Income</option>
            <option value="expense">Expenses</option>
          </FilterSelect>
          <FilterSelect label="Sort" value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </FilterSelect>
          <button
            type="button"
            onClick={exportCsv}
            disabled={rows.length === 0}
            className="flex h-12 items-center justify-between gap-6 rounded-lg border border-line bg-white px-5 text-[15px] text-ink hover:bg-subtle disabled:opacity-50"
          >
            Export CSV <Download className="size-5 text-sage" aria-hidden="true" />
          </button>
        </div>

        <Card className="p-5 sm:p-8">
          <h2 className="text-xl font-semibold text-ink">
            {formatMonth(month).split(' ')[0]} activity
          </h2>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {rows.length} {rows.length === 1 ? 'transaction' : 'transactions'} ·{' '}
            {isFiltered ? 'Filtered results' : 'Showing everything'}
          </p>

          {transactions.isError && <PageError error={transactions.error} />}

          {!transactions.isPending && rows.length === 0 && (
            <p className="mt-6 rounded-lg bg-subtle px-4 py-12 text-center text-sm text-muted">
              {isFiltered
                ? 'No transactions match these filters.'
                : 'No transactions this month yet.'}
            </p>
          )}

          {rows.length > 0 && (
            <>
              <ul className="mt-4 divide-y divide-line md:hidden">
                {rows.map((t) => (
                  <TransactionListItem
                    key={t.id}
                    transaction={t}
                    category={categoryMap.get(t.categoryId)}
                    onSelect={openTransactionModal}
                  />
                ))}
              </ul>

              <div className="mt-6 hidden overflow-x-auto md:block">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="bg-subtle text-xs tracking-wide text-muted uppercase">
                      <th className="rounded-l-lg px-5 py-4 font-medium">Transaction</th>
                      <th className="px-4 py-4 font-medium">Category</th>
                      <th className="px-4 py-4 font-medium">Date</th>
                      <th className="px-4 py-4 font-medium">Type</th>
                      <th className="px-4 py-4 text-right font-medium">Amount</th>
                      <th className="rounded-r-lg px-4 py-4">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {rows.map((t) => (
                      <tr key={t.id} className="hover:bg-page">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-4">
                            <DirectionIcon type={t.type} />
                            <div className="min-w-0">
                              <p className="truncate font-medium text-ink">{t.title}</p>
                              {t.note && <p className="truncate text-sm text-muted">{t.note}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-ink/80">
                          {categoryMap.get(t.categoryId)?.name}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-muted">
                          {formatDate(t.date)}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm ${t.type === 'income' ? 'font-medium text-income' : 'text-muted'}`}
                        >
                          {t.type === 'income' ? 'Income' : 'Expense'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <TransactionAmount transaction={t} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => openTransactionModal(t)}
                            aria-label={`Edit ${t.title}`}
                            className="rounded-md p-2 text-muted hover:bg-subtle hover:text-ink"
                          >
                            <Pencil className="size-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
