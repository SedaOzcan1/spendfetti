import { CategoryIcon } from '../../components/CategoryIcon.jsx';
import { formatDate, formatSignedMoney } from '../../lib/format.js';

export function TransactionAmount({ transaction, className = '' }) {
  return (
    <span
      className={`font-semibold tabular-nums ${transaction.type === 'income' ? 'text-income' : 'text-ink'} ${className}`}
    >
      {formatSignedMoney(transaction.amount, transaction.type)}
    </span>
  );
}

/** Compact list row used on mobile and in the dashboard on small screens. */
export function TransactionListItem({ transaction, category, onSelect }) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect?.(transaction)}
        className="flex w-full items-center gap-3 py-4 text-left"
      >
        <CategoryIcon category={category} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-ink">{transaction.title}</span>
          <span className="block truncate text-sm text-muted">
            {category?.name ?? 'Unknown'} · {formatDate(transaction.date).slice(0, 6)}
          </span>
        </span>
        <TransactionAmount transaction={transaction} />
      </button>
    </li>
  );
}
