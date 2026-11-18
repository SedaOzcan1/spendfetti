import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSavings } from '../../api/savings.js';
import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { formatMoney, formatPercent } from '../../lib/format.js';

export function SavingsSnapshot({ month }) {
  const { data } = useSavings(month);
  if (!data) return null;
  const goals = data.goals.slice(0, 3);

  return (
    <Card className="p-5 sm:p-8">
      <CardHeader
        title="Savings & investments"
        subtitle="Your future self, funded a little every month."
        action={
          <Link
            to="/savings"
            className="flex items-center gap-1 text-sm font-medium whitespace-nowrap text-sage hover:underline"
          >
            Manage <ChevronRight className="size-4" aria-hidden="true" />
          </Link>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:gap-10">
        <dl className="flex gap-8 lg:flex-col lg:gap-4">
          <div>
            <dt className="text-sm text-muted">Total saved</dt>
            <dd className="mt-1 text-3xl font-bold tracking-tight text-ink tabular-nums">
              {formatMoney(data.totalSaved, { decimals: 0 })}
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">This month</dt>
            <dd className="mt-1 text-xl font-semibold text-income tabular-nums">
              {data.savedThisMonth < 0 ? '−' : '+'}
              {formatMoney(Math.abs(data.savedThisMonth), { decimals: 0 })}
            </dd>
          </div>
        </dl>

        {goals.length === 0 ? (
          <p className="self-center rounded-lg bg-subtle px-4 py-6 text-center text-sm text-muted">
            No goals yet.{' '}
            <Link to="/savings" className="font-semibold text-sage hover:underline">
              Create your first one
            </Link>
          </p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {goals.map((goal) => (
              <li key={goal.id}>
                <div className="mb-3 flex items-baseline justify-between gap-3 text-[15px]">
                  <span className="truncate text-ink">{goal.name}</span>
                  <span className="text-sm text-muted tabular-nums">
                    {formatPercent(goal.progress)}
                  </span>
                </div>
                <ProgressBar
                  value={goal.progress}
                  color={goal.kind === 'investment' ? 'var(--color-lavender)' : 'var(--color-sage)'}
                  label={`${goal.name} progress`}
                />
                <p className="mt-2 text-sm text-muted tabular-nums">
                  {formatMoney(goal.saved, { decimals: 0 })} of{' '}
                  {formatMoney(goal.targetAmount, { decimals: 0 })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
