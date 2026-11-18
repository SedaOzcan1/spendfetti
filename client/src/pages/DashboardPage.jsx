import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMe } from '../api/auth.js';
import { useSummary } from '../api/summary.js';
import { PageHeader } from '../components/layout/PageHeader.jsx';
import { PageError, PageLoading } from '../components/ui/PageState.jsx';
import { BudgetOverview } from '../features/dashboard/BudgetOverview.jsx';
import { FunBudgetCard } from '../features/dashboard/FunBudgetCard.jsx';
import { useAchievementCelebrations } from '../features/celebrations/useAchievementCelebrations.js';
import { FunBudgetPromptModal } from '../features/funBudget/FunBudgetPromptModal.jsx';
import { RecentTransactions } from '../features/dashboard/RecentTransactions.jsx';
import { SpendingInsights } from '../features/dashboard/SpendingInsights.jsx';
import { SummaryStats } from '../features/dashboard/SummaryStats.jsx';
import { AddTransactionButton } from '../features/transactions/AddTransactionButton.jsx';
import { useMonth } from '../lib/MonthContext.jsx';

export default function DashboardPage() {
  const { data: user } = useMe();
  const { month } = useMonth();
  const [params, setParams] = useSearchParams();
  const closeMonth = params.get('closeMonth');
  // null → closed; otherwise the month whose close prompt is shown
  const [promptMonth, setPromptMonth] = useState(null);
  const [handledLink, setHandledLink] = useState(null);

  // Deep link from the "close last month" notification: /?closeMonth=YYYY-MM
  if (closeMonth && closeMonth !== handledLink && /^\d{4}-\d{2}$/.test(closeMonth)) {
    setHandledLink(closeMonth);
    setPromptMonth(closeMonth);
  }
  useEffect(() => {
    if (closeMonth) setParams({}, { replace: true });
  }, [closeMonth, setParams]);
  const summary = useSummary(month);
  const firstName = user?.name.split(' ')[0];
  useAchievementCelebrations(summary.data);

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
            <FunBudgetCard
              summary={summary.data}
              month={month}
              onCloseMonth={() => setPromptMonth(month)}
            />
          </div>
          <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
            <RecentTransactions month={month} />
            <BudgetOverview budgets={summary.data.budgets} monthClosed={summary.data.monthClosed} />
          </div>
        </div>
      )}

      <FunBudgetPromptModal
        open={promptMonth !== null}
        month={promptMonth ?? month}
        onClose={() => setPromptMonth(null)}
      />
    </>
  );
}
