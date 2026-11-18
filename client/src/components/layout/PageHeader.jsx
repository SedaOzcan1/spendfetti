import { Bell } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useSummary } from '../../api/summary.js';
import { useMonth } from '../../lib/MonthContext.jsx';
import { MonthSelect } from './MonthSelect.jsx';

function NotificationsButton() {
  const { month } = useMonth();
  const { data } = useSummary(month);
  const alerts = data?.budgets.filter((b) => b.status !== 'ok').length ?? 0;

  return (
    <Link
      to="/budgets"
      aria-label={alerts ? `${alerts} budget alerts` : 'No budget alerts'}
      className="relative grid size-12 shrink-0 place-items-center rounded-lg border border-line bg-white text-ink hover:bg-subtle"
    >
      <Bell className="size-5" strokeWidth={1.8} />
      {alerts > 0 && (
        <span className="absolute top-3 right-3 size-2 rounded-full bg-coral ring-2 ring-white" />
      )}
    </Link>
  );
}

export function PageHeader({ title, subtitle, action, showMonth = true }) {
  return (
    <header className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
      <div>
        <p className="hidden text-xs font-semibold tracking-[0.14em] text-muted lg:block">
          YOUR MONEY, YOUR CALL
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-ink lg:mt-3 lg:text-[44px] lg:leading-tight">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-[15px] text-muted lg:text-base">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {showMonth && <MonthSelect className="w-full sm:w-48" />}
        {action}
        <span className="hidden lg:block">
          <NotificationsButton />
        </span>
      </div>
    </header>
  );
}
