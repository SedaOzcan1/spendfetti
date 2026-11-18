import { Card, CardHeader } from '../../components/ui/Card.jsx';
import { formatPercent } from '../../lib/format.js';
import { colors } from '../../theme/colors.js';
import { CategoryDoughnut } from '../charts/CategoryDoughnut.jsx';
import { TrendChart } from '../charts/TrendChart.jsx';

function Legend() {
  return (
    <ul className="flex gap-4 text-xs text-muted" aria-label="Legend">
      <li className="flex items-center gap-1.5">
        <span className="size-2 rounded-sm bg-sage" /> Income
      </li>
      <li className="flex items-center gap-1.5">
        <span className="size-2 rounded-sm bg-peach" /> Expenses
      </li>
    </ul>
  );
}

export function SpendingInsights({ summary }) {
  const { trend, byCategory, totals } = summary;
  const top = byCategory[0];

  return (
    <Card className="grid gap-8 p-5 sm:p-8 xl:grid-cols-[1fr_auto_1fr]">
      <div className="min-w-0">
        <CardHeader
          title="Money rhythm"
          subtitle="Income vs. expenses, last 6 months"
          action={<Legend />}
        />
        <TrendChart trend={trend} />
      </div>

      <div className="hidden w-px bg-line xl:block" aria-hidden="true" />

      <div className="min-w-0">
        <CardHeader title="Where did it go?" subtitle="This month’s spending by category" />
        {byCategory.length === 0 ? (
          <p className="rounded-lg bg-subtle px-4 py-10 text-center text-sm text-muted">
            No expenses this month yet.
          </p>
        ) : (
          <>
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center xl:gap-5">
              <CategoryDoughnut breakdown={byCategory} total={totals.expense} />
              <ul className="w-full min-w-0 space-y-3 text-sm">
                {byCategory.slice(0, 6).map((c) => (
                  <li key={c.categoryId} className="flex items-center gap-2.5">
                    <span
                      className="size-2 shrink-0 rounded-sm"
                      style={{ backgroundColor: c.color ?? colors.stone }}
                    />
                    <span className="flex-1 truncate text-ink/80">{c.name}</span>
                    <span className="shrink-0 font-medium text-ink tabular-nums">
                      {formatPercent(c.share)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-6 rounded-lg bg-subtle px-4 py-3 text-sm text-muted">
              {top.name} takes the biggest share at {formatPercent(top.share)}.
            </p>
          </>
        )}
      </div>
    </Card>
  );
}
