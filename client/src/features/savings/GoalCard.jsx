import { Minus, Pencil, Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { formatMoney, formatPercent } from '../../lib/format.js';
import { GOAL_KIND_LABELS } from './goalKinds.js';

const KIND_STYLE = {
  savings: { tag: 'bg-mint text-forest', bar: 'var(--color-sage)' },
  investment: { tag: 'bg-lavender-light text-[#6e6a93]', bar: 'var(--color-lavender)' },
};

function targetText(goal) {
  if (goal.achievedAt) return 'Goal reached — well done!';
  if (!goal.targetDate) return `${formatMoney(goal.remaining, { decimals: 0 })} to go`;
  const by = new Intl.DateTimeFormat('en-GB', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(goal.targetDate));
  if (goal.monthlyNeeded === null) return `Target: ${by}`;
  return `${formatMoney(goal.monthlyNeeded, { decimals: 0 })}/month to reach it by ${by}`;
}

export function GoalCard({ goal, onEdit, onDeposit, onWithdraw }) {
  const style = KIND_STYLE[goal.kind];
  return (
    <Card className="flex flex-col p-6 sm:p-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${style.tag}`}>
            {GOAL_KIND_LABELS[goal.kind]}
          </span>
          <h2 className="mt-3 text-xl font-semibold text-ink">{goal.name}</h2>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${goal.name}`}
          className="rounded-md p-1.5 text-muted hover:bg-subtle hover:text-ink"
        >
          <Pencil className="size-4" />
        </button>
      </div>

      <p className="mt-5 text-4xl font-bold tracking-tight text-ink tabular-nums">
        {formatMoney(goal.saved, { decimals: 0 })}
      </p>
      <div className="mt-2 flex items-end justify-between text-sm">
        <span className="text-muted">/ {formatMoney(goal.targetAmount, { decimals: 0 })}</span>
        <span className="font-medium text-ink tabular-nums">{formatPercent(goal.progress)}</span>
      </div>
      <div className="mt-5">
        <ProgressBar value={goal.progress} color={style.bar} label={`${goal.name} progress`} />
      </div>
      <p className={`mt-5 text-sm ${goal.achievedAt ? 'font-medium text-sage' : 'text-muted'}`}>
        {goal.achievedAt && '🎉 '}
        {targetText(goal)}
      </p>

      <div className="mt-6 flex gap-3 md:mt-auto md:pt-6">
        <button
          type="button"
          onClick={onDeposit}
          className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-forest text-sm font-semibold text-white hover:bg-forest-soft"
        >
          <Plus className="size-4" aria-hidden="true" /> Add money
        </button>
        <button
          type="button"
          onClick={onWithdraw}
          disabled={goal.saved <= 0}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-subtle disabled:opacity-50"
        >
          <Minus className="size-4" aria-hidden="true" /> Withdraw
        </button>
      </div>
    </Card>
  );
}
