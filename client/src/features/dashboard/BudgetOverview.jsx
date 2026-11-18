import { AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { formatMoney } from '../../lib/format.js';
import { budgetColor } from '../budgets/budgetColors.js';

function alertMessage(budget) {
  if (budget.status === 'exceeded') {
    return `You’re ${formatMoney(-budget.remaining, { decimals: 0 })} over your ${budget.category.name} limit.`;
  }
  return `${formatMoney(budget.remaining, { decimals: 0 })} left in your ${budget.category.name} limit.`;
}

export function BudgetOverview({ budgets }) {
  const shown = budgets.slice(0, 3);
  const alert = budgets.find((b) => b.status !== 'ok');

  return (
    <Card className="flex flex-col p-5 sm:p-8">
      <CardHeader title="Is your budget on track?" subtitle="Know your limits, spend with ease." />

      {shown.length === 0 ? (
        <p className="rounded-lg bg-subtle px-4 py-8 text-center text-sm text-muted">
          No budgets yet.{' '}
          <Link to="/budgets" className="font-semibold text-sage hover:underline">
            Set your first limit
          </Link>
        </p>
      ) : (
        <ul className="space-y-7">
          {shown.map((budget) => (
            <li key={budget.id}>
              <div className="mb-3 flex items-baseline gap-3 text-[15px]">
                <span className="flex-1 text-ink">{budget.category.name}</span>
                <span className="font-semibold text-ink tabular-nums">
                  {formatMoney(budget.spent, { decimals: 0 })}
                </span>
                <span className="w-20 text-right text-sm text-muted tabular-nums">
                  / {formatMoney(budget.limit, { decimals: 0 })}
                </span>
              </div>
              <ProgressBar
                value={budget.usage}
                color={budgetColor(budget)}
                label={`${budget.category.name} budget usage`}
              />
            </li>
          ))}
        </ul>
      )}

      {alert && (
        <p
          role="status"
          className="mt-8 flex items-center gap-3 rounded-lg bg-blush px-4 py-4 text-sm font-medium text-coral xl:mt-auto"
        >
          <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
          {alertMessage(alert)}
        </p>
      )}
    </Card>
  );
}
