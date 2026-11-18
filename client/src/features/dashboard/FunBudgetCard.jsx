import { ArrowRight } from 'lucide-react';
import { Card } from '../../components/ui/Card.jsx';
import { formatMoney, formatPercent } from '../../lib/format.js';

function ConfettiAccent() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 40" className="absolute top-8 right-8 w-12">
      <rect x="28" y="2" width="4" height="10" rx="1" fill="#e9eecf" transform="rotate(-25 30 7)" />
      <rect x="6" y="20" width="4" height="9" rx="1" fill="#e9eecf" transform="rotate(-60 8 24)" />
      <rect x="38" y="28" width="5" height="5" rx="1" fill="#ebb39e" transform="rotate(20 40 30)" />
    </svg>
  );
}

export function FunBudgetCard({ summary, onCloseMonth }) {
  const { funBudget, totals } = summary;
  const hasSurplus = totals.balance > 0;

  return (
    <Card tone="forest" className="relative flex flex-col p-6 sm:p-8">
      <ConfettiAccent />
      <p className="text-xs font-semibold tracking-[0.12em] text-white/80">
        TREAT YOURSELF A LITTLE
      </p>
      <h2 className="mt-4 text-2xl font-medium sm:text-[28px]">Make room for good moments.</h2>

      {hasSurplus ? (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <p className="text-5xl font-bold tracking-tight text-mint-strong tabular-nums">
              {formatMoney(funBudget.suggestedAmount, { decimals: 0 })}
            </p>
            <span className="rounded-md bg-forest-soft px-3 py-1.5 text-xs text-white/90">
              {formatPercent(funBudget.ratio)} of your balance
            </span>
          </div>
          <p className="mt-5 leading-relaxed text-white/80">
            Close the month with this balance and set this amount aside for concerts, discoveries
            and yourself.
          </p>
        </>
      ) : (
        <p className="mt-6 leading-relaxed text-white/80">
          Once this month ends with money left over, we’ll suggest a little fun budget for you.
        </p>
      )}

      <button
        type="button"
        onClick={onCloseMonth}
        disabled={!hasSurplus}
        className="mt-8 flex h-14 items-center justify-between rounded-xl bg-mint-strong px-6 font-semibold text-forest transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-50 xl:mt-auto"
      >
        Close the month <ArrowRight className="size-5" aria-hidden="true" />
      </button>
    </Card>
  );
}
