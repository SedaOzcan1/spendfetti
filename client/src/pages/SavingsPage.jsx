import { PiggyBank, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useDeleteSavingsEntry, useSavings, useSavingsEntries } from '../api/savings.js';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Card, CardHeader } from '../components/ui/Card.jsx';
import { PageError, PageLoading } from '../components/ui/PageState.jsx';
import { StatCard } from '../components/ui/StatCard.jsx';
import { EntryModal } from '../features/savings/EntryModal.jsx';
import { GoalCard } from '../features/savings/GoalCard.jsx';
import { GoalModal } from '../features/savings/GoalModal.jsx';
import { formatDate, formatMoney } from '../lib/format.js';
import { useMonth } from '../lib/MonthContext.jsx';

function RecentEntries({ goals }) {
  const { data: entries = [] } = useSavingsEntries();
  const remove = useDeleteSavingsEntry();
  const goalName = new Map(goals.map((g) => [g.id, g.name]));
  if (entries.length === 0) return null;

  return (
    <Card className="p-5 sm:p-8">
      <CardHeader title="Recent movements" subtitle="Every step toward your goals." />
      <ul className="divide-y divide-line">
        {entries.map((entry) => (
          <li key={entry.id} className="flex items-center gap-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium text-ink">
                {goalName.get(entry.goalId) ?? 'Goal'}
              </p>
              <p className="truncate text-sm text-muted">
                {formatDate(entry.date)}
                {entry.note && ` · ${entry.note}`}
              </p>
            </div>
            <span
              className={`font-semibold tabular-nums ${entry.type === 'deposit' ? 'text-income' : 'text-ink'}`}
            >
              {entry.type === 'deposit' ? '+' : '−'}
              {formatMoney(entry.amount)}
            </span>
            <button
              type="button"
              onClick={() => remove.mutate(entry.id)}
              aria-label={`Delete ${entry.type} of ${formatMoney(entry.amount)}`}
              className="rounded-md p-2 text-muted hover:bg-subtle hover:text-coral"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function SavingsPage() {
  const { month } = useMonth();
  const savings = useSavings(month);
  const [editing, setEditing] = useState(null); // goal | 'new' | null
  const [entry, setEntry] = useState(null); // { goal, type }

  const data = savings.data;
  const goals = data?.goals ?? [];

  return (
    <>
      <PageHeader
        title="Savings & investments"
        subtitle="Pay your future self first."
        action={
          <Button
            size="lg"
            className="w-full sm:w-auto sm:min-w-52"
            onClick={() => setEditing('new')}
          >
            <Plus className="size-5" aria-hidden="true" /> New goal
          </Button>
        }
      />

      {savings.isPending && <PageLoading />}
      {savings.isError && <PageError error={savings.error} />}

      {data && (
        <div className="mt-8 space-y-6 lg:mt-10">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 xl:gap-6">
            <div className="order-first col-span-2 xl:order-none xl:col-span-1">
              <StatCard
                tone="mint"
                label="Total saved"
                value={formatMoney(data.totalSaved, { decimals: 0 })}
                footnote={`${formatMoney(data.byKind.savings, { decimals: 0 })} savings · ${formatMoney(data.byKind.investment, { decimals: 0 })} investments`}
              />
            </div>
            <StatCard
              label="This month"
              value={`${data.savedThisMonth < 0 ? '−' : '+'}${formatMoney(Math.abs(data.savedThisMonth), { decimals: 0 })}`}
              footnote="Net moved into your goals"
            />
            <StatCard
              label="Goals reached"
              value={`${data.goalsReached} / ${goals.length}`}
              footnote={data.goalsReached ? 'Look at you go!' : 'Every transfer counts.'}
            />
          </div>

          {goals.length === 0 ? (
            <Card tone="muted" className="flex flex-col items-center p-10 text-center">
              <PiggyBank className="size-10 text-sage" aria-hidden="true" />
              <h2 className="mt-5 text-2xl font-semibold text-ink">Start your first goal</h2>
              <p className="mt-3 max-w-md text-muted">
                An emergency fund, an index fund or a dream trip. When you close a month with money
                left over, you can send part of it straight here.
              </p>
              <Button size="lg" className="mt-8" onClick={() => setEditing('new')}>
                Create a goal
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {goals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={() => setEditing(goal)}
                  onDeposit={() => setEntry({ goal, type: 'deposit' })}
                  onWithdraw={() => setEntry({ goal, type: 'withdrawal' })}
                />
              ))}
            </div>
          )}

          <RecentEntries goals={goals} />

          <Card tone="mint" className="p-6 sm:p-8">
            <h2 className="text-xl font-semibold text-ink">Savings don’t count as spending.</h2>
            <p className="mt-3 text-ink/80">
              Moving money into a goal keeps your expense charts honest. Close a month with a
              surplus and Spendfetti will suggest how much to save and how much to enjoy.
            </p>
          </Card>
        </div>
      )}

      <GoalModal
        open={editing !== null}
        goal={editing === 'new' ? null : editing}
        onClose={() => setEditing(null)}
      />
      <EntryModal goal={entry?.goal} type={entry?.type} onClose={() => setEntry(null)} />
    </>
  );
}
