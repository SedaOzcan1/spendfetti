import { ArrowDownLeft, ArrowUpLeft, Wallet } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard.jsx';
import { formatMoney, formatPercent } from '../../lib/format.js';

function incomeFootnote(changePct) {
  if (changePct === null || changePct === undefined) return 'No income recorded last month';
  if (changePct === 0) return 'Same as last month';
  const direction = changePct > 0 ? 'up' : 'down';
  return `${formatPercent(Math.abs(changePct) / 100, 1)} ${direction} from last month`;
}

function expenseFootnote(ratio) {
  if (ratio === null || ratio === undefined) return 'No income to compare against yet';
  return `You spent ${formatPercent(ratio, 1)} of your income`;
}

export function SummaryStats({ summary }) {
  const { totals, comparison } = summary;
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3 xl:gap-6">
      <StatCard
        label="Total income"
        value={formatMoney(totals.income)}
        footnote={incomeFootnote(comparison.incomeChangePct)}
        icon={<ArrowDownLeft className="size-5 text-sage" aria-hidden="true" />}
      />
      <StatCard
        label="Total expenses"
        value={formatMoney(totals.expense)}
        footnote={expenseFootnote(comparison.expenseToIncomeRatio)}
        icon={<ArrowUpLeft className="size-5 text-coral" aria-hidden="true" />}
      />
      <div className="order-first col-span-2 xl:order-none xl:col-span-1">
        <StatCard
          tone="mint"
          label="Left this month"
          value={formatMoney(totals.balance)}
          footnote={
            totals.balance > 0
              ? 'One more step toward good plans.'
              : 'Keep an eye on your budgets this month.'
          }
          icon={<Wallet className="size-5 text-sage" aria-hidden="true" />}
        />
      </div>
    </div>
  );
}
