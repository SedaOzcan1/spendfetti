import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCategoryMap } from '../../api/categories.js';
import { useTransactions } from '../../api/transactions.js';
import { CategoryIcon } from '../../components/CategoryIcon.jsx';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { formatDate } from '../../lib/format.js';
import { TransactionAmount, TransactionListItem } from '../transactions/TransactionRow.jsx';
import { useTransactionModal } from '../transactions/TransactionModalContext.jsx';

export function RecentTransactions({ month }) {
  const { data: transactions = [], isPending } = useTransactions({ month });
  const categories = useCategoryMap();
  const { openTransactionModal } = useTransactionModal();
  const recent = transactions.slice(0, 4);

  return (
    <Card className="p-5 sm:p-8">
      <CardHeader
        title="Recent transactions"
        subtitle="Small purchases are part of the story too."
        action={
          <Link
            to="/transactions"
            className="flex items-center gap-1 text-sm font-medium whitespace-nowrap text-sage hover:underline"
          >
            See all <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />

      {!isPending && recent.length === 0 && (
        <div className="rounded-lg bg-subtle px-4 py-10 text-center text-sm text-muted">
          Nothing here yet.{' '}
          <button
            type="button"
            onClick={() => openTransactionModal()}
            className="font-semibold text-sage hover:underline"
          >
            Add your first transaction
          </button>
        </div>
      )}

      {recent.length > 0 && (
        <>
          <ul className="divide-y divide-line md:hidden">
            {recent.map((t) => (
              <TransactionListItem
                key={t.id}
                transaction={t}
                category={categories.get(t.categoryId)}
                onSelect={openTransactionModal}
              />
            ))}
          </ul>

          <table className="hidden w-full text-left md:table">
            <thead>
              <tr className="bg-subtle text-xs tracking-wide text-muted uppercase">
                <th className="rounded-l-lg px-4 py-3 font-medium">Transaction</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="rounded-r-lg px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recent.map((t) => {
                const category = categories.get(t.categoryId);
                return (
                  <tr
                    key={t.id}
                    onClick={() => openTransactionModal(t)}
                    className="cursor-pointer hover:bg-page"
                  >
                    <td className="px-2 py-3">
                      <div className="flex items-center gap-4">
                        <CategoryIcon category={category} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{t.title}</p>
                          {t.note && <p className="truncate text-sm text-muted">{t.note}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[15px] text-ink/80">{category?.name}</td>
                    <td className="px-4 py-3 text-sm whitespace-nowrap text-muted">
                      {formatDate(t.date)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <TransactionAmount transaction={t} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
    </Card>
  );
}
