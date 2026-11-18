import { Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { useBudgets } from '../api/budgets.js';
import { useCategories } from '../api/categories.js';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card } from '../components/ui/Card.jsx';
import { PageError, PageLoading } from '../components/ui/PageState.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { budgetColor } from '../features/budgets/budgetColors.js';
import { BudgetModal } from '../features/budgets/BudgetModal.jsx';
import { CategoryModal } from '../features/budgets/CategoryModal.jsx';
import { formatMoney, formatPercent } from '../lib/format.js';
import { useMonth } from '../lib/MonthContext.jsx';

function statusText(budget) {
  if (budget.status === 'exceeded')
    return `${formatMoney(-budget.remaining, { decimals: 0 })} over your limit`;
  if (budget.status === 'warning') return 'Getting close to your limit';
  return `${formatMoney(budget.remaining, { decimals: 0 })} more to spend`;
}

function BudgetCard({ budget, onEdit }) {
  const color = budgetColor(budget);
  return (
    <Card className="flex flex-col p-6 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-xl font-semibold text-ink">{budget.category.name}</h2>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${budget.category.name} limit`}
          className="rounded-md p-1.5 text-muted hover:bg-subtle hover:text-ink"
        >
          <Pencil className="size-4" />
        </button>
      </div>
      <p className="mt-5 text-4xl font-bold tracking-tight text-ink tabular-nums">
        {formatMoney(budget.spent, { decimals: 0 })}
      </p>
      <div className="mt-2 flex items-end justify-between text-sm">
        <span className="text-muted">/ {formatMoney(budget.limit, { decimals: 0 })}</span>
        <span className="font-medium tabular-nums" style={{ color }}>
          {formatPercent(budget.usage)}
        </span>
      </div>
      <div className="mt-5">
        <ProgressBar value={budget.usage} color={color} label={`${budget.category.name} usage`} />
      </div>
      <p
        className={`mt-6 text-[15px] font-medium ${budget.status === 'ok' ? 'text-sage' : 'text-coral'}`}
      >
        {statusText(budget)}
      </p>
      <button
        type="button"
        onClick={onEdit}
        className="mt-6 self-start text-sm text-ink/80 hover:text-ink hover:underline"
      >
        Edit limit
      </button>
    </Card>
  );
}

export default function BudgetsPage() {
  const { month } = useMonth();
  const budgets = useBudgets(month);
  const { data: categories = [] } = useCategories();
  const [editing, setEditing] = useState(null); // budget | 'new' | null
  const [creatingCategory, setCreatingCategory] = useState(false);

  const list = [...(budgets.data ?? [])].sort((a, b) => b.limit - a.limit);
  const totalLimit = list.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = list.reduce((sum, b) => sum + b.spent, 0);
  const budgetedIds = new Set(list.map((b) => b.categoryId));
  const availableCategories = categories.filter(
    (c) => c.type === 'expense' && !budgetedIds.has(c.id),
  );

  return (
    <>
      <PageHeader
        title="My budgets"
        subtitle="Make a plan, leave room for good moments."
        action={
          <Button
            size="lg"
            className="w-full sm:w-auto sm:min-w-52"
            onClick={() => setEditing('new')}
            disabled={availableCategories.length === 0}
          >
            <Plus className="size-5" aria-hidden="true" /> Add budget
          </Button>
        }
      />

      {budgets.isPending && <PageLoading />}
      {budgets.isError && <PageError error={budgets.error} />}

      {budgets.data && (
        <div className="mt-8 space-y-6 lg:mt-10">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 xl:gap-6">
            <StatCard
              label="Total monthly limit"
              value={formatMoney(totalLimit, { decimals: 0 })}
              footnote={`${list.length} active ${list.length === 1 ? 'category' : 'categories'}`}
            />
            <StatCard
              label="Spent this month"
              value={formatMoney(totalSpent, { decimals: 0 })}
              footnote={
                totalLimit > 0
                  ? `${formatPercent(totalSpent / totalLimit, 1)} of your total limit`
                  : 'Set a limit to track your progress'
              }
            />
            <div className="sm:col-span-2 xl:col-span-1">
              <StatCard
                tone="mint"
                label="Left in your limits"
                value={formatMoney(Math.max(totalLimit - totalSpent, 0), { decimals: 0 })}
                footnote={
                  totalSpent <= totalLimit
                    ? 'You’re in control. Keep it up!'
                    : 'A little over this month — you’ve got this.'
                }
              />
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {list.map((budget) => (
              <BudgetCard key={budget.id} budget={budget} onEdit={() => setEditing(budget)} />
            ))}

            <Card tone="muted" className="flex flex-col p-6 sm:p-8">
              <Plus className="size-7 text-sage" aria-hidden="true" />
              <h2 className="mt-8 text-2xl font-semibold text-ink">A category just for you</h2>
              <p className="mt-4 leading-relaxed text-muted">
                Books, hobbies or a new goal. There’s room for all of it in your budget.
              </p>
              <button
                type="button"
                onClick={() => setCreatingCategory(true)}
                className="mt-8 self-start font-semibold text-sage hover:underline md:mt-auto md:pt-8"
              >
                + Create category
              </button>
            </Card>
          </div>

          <Card tone="mint" className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-ink">
              A budget isn’t a restriction, it’s a plan.
            </h2>
            <p className="mt-3 text-ink/80">
              Adjust your limits as your needs change. Hit your budget by the end of the month and
              we’ll celebrate together.
            </p>
          </Card>
        </div>
      )}

      <BudgetModal
        open={editing !== null}
        budget={editing === 'new' ? null : editing}
        availableCategories={availableCategories}
        onClose={() => setEditing(null)}
      />
      <CategoryModal open={creatingCategory} onClose={() => setCreatingCategory(false)} />
    </>
  );
}
