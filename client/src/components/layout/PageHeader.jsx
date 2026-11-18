import { NotificationBell } from '../../features/notifications/NotificationBell.jsx';
import { MonthSelect } from './MonthSelect.jsx';

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
        <NotificationBell className="hidden lg:block" />
      </div>
    </header>
  );
}
