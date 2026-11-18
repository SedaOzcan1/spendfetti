import { Card } from '../../components/ui/Card.jsx';
import { ProgressBar } from '../../components/ui/ProgressBar.jsx';
import { formatMoney } from '../../lib/format.js';

export function FunBudgetBand({ funBudget, onCloseMonth }) {
  if (funBudget.status !== 'allocated') {
    return (
      <Card
        tone="forest"
        className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8"
      >
        <div>
          <p className="text-xs font-semibold tracking-[0.12em] text-white/80">YOUR FUN BUDGET</p>
          <p className="mt-3 max-w-xl text-lg text-white/90">
            Nothing set aside for this month yet. Close the month to turn what you saved into
            concerts, workshops and more.
          </p>
        </div>
        <button
          type="button"
          onClick={onCloseMonth}
          className="h-12 shrink-0 rounded-xl bg-mint-strong px-6 font-semibold text-forest hover:bg-white"
        >
          Close the month
        </button>
      </Card>
    );
  }

  const stats = [
    ['Set aside', funBudget.allocated],
    ['Spent', funBudget.spent],
    ['Left to explore', funBudget.remaining],
  ];

  return (
    <Card tone="forest" className="p-6 sm:p-8">
      <p className="text-xs font-semibold tracking-[0.12em] text-white/80">
        SET ASIDE FOR GOOD MOMENTS
      </p>
      <dl className="mt-5 grid grid-cols-3 gap-4">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-white/75">{label}</dt>
            <dd className="mt-2 text-2xl font-bold tracking-tight text-mint-strong tabular-nums sm:text-4xl">
              {formatMoney(value, { decimals: 0 })}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-6">
        <ProgressBar
          value={funBudget.allocated ? funBudget.spent / funBudget.allocated : 0}
          color="var(--color-mint-strong)"
          track="bg-forest-soft"
          label="Fun budget spent"
        />
      </div>
    </Card>
  );
}
