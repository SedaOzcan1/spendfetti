import { useNavigate } from 'react-router-dom';
import { useMe } from '../api/auth.js';
import { useSummary } from '../api/summary.js';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { PageError, PageLoading } from '../components/ui/PageState.jsx';
import { BudgetOverview } from '../features/dashboard/BudgetOverview.jsx';
import { FunBudgetCard } from '../features/dashboard/FunBudgetCard.jsx';
import { RecentTransactions } from '../features/dashboard/RecentTransactions.jsx';
import { SpendingInsights } from '../features/dashboard/SpendingInsights.jsx';
import { SummaryStats } from '../features/dashboard/SummaryStats.jsx';
import { AddTransactionButton } from '../features/transactions/AddTransactionButton.jsx';
import { useMonth } from '../lib/MonthContext.jsx';

export default function DashboardPage() {
  const { data: user } = useMe();
  const { month } = useMonth();
  const navigate = useNavigate();
  const summary = useSummary(month);
  const firstName = user?.name.split(' ')[0];

  return (
    <>
      <PageHeader
        title={`Hello ${firstName},`}
        subtitle="Today’s small decisions, tomorrow’s good memories."
        action={<AddTransactionButton />}
      />

      {summary.isPending && <PageLoading />}
      {summary.isError && <PageError error={summary.error} />}
      {summary.data && (
        <div className="mt-8 space-y-6 lg:mt-10">
          <SummaryStats summary={summary.data} />
          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <SpendingInsights summary={summary.data} />
            <FunBudgetCard summary={summary.data} onCloseMonth={() => navigate('/activities')} />
          </div>
          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <RecentTransactions month={month} />
            <BudgetOverview budgets={summary.data.budgets} />
          </div>
        </div>
      )}
    </>
  );
}
