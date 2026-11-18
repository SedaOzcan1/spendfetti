import { Card } from './Card.jsx';

export function StatCard({ label, value, footnote, icon, tone = 'white', iconClassName = '' }) {
  return (
    <Card tone={tone} className="flex min-h-36 flex-col p-4 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className={`text-[15px] ${tone === 'mint' ? 'text-forest' : 'text-muted'}`}>{label}</p>
        {icon && (
          <span
            className={`hidden size-9 shrink-0 place-items-center rounded-lg sm:grid ${tone === 'mint' ? 'bg-nav-active' : 'bg-subtle'} ${iconClassName}`}
          >
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-[22px] font-bold tracking-tight text-ink tabular-nums sm:text-3xl xl:text-[34px]">
        {value}
      </p>
      {footnote && (
        <p className={`mt-auto pt-4 text-sm ${tone === 'mint' ? 'text-forest/80' : 'text-muted'}`}>
          {footnote}
        </p>
      )}
    </Card>
  );
}
