import { AlertCircle, AlertTriangle, CalendarCheck, Sparkles, Ticket, X } from 'lucide-react';
import { timeAgo } from '../../lib/relativeTime.js';

const ICONS = {
  welcome: { Icon: Sparkles, className: 'bg-mint text-sage' },
  budget_warning: { Icon: AlertTriangle, className: 'bg-cream text-[#a0703a]' },
  budget_exceeded: { Icon: AlertCircle, className: 'bg-blush text-coral' },
  fun_budget_low: { Icon: Ticket, className: 'bg-mint text-forest' },
  month_close_reminder: { Icon: CalendarCheck, className: 'bg-lavender-light text-[#6e6a93]' },
};

export function NotificationItem({ notification, onOpen, onDismiss }) {
  const { Icon, className } = ICONS[notification.type] ?? ICONS.welcome;

  return (
    <li className="group relative">
      <button
        type="button"
        onClick={() => onOpen(notification)}
        className={`flex w-full gap-3 rounded-xl p-3 pr-10 text-left transition-colors hover:bg-subtle ${notification.read ? '' : 'bg-page'}`}
      >
        <span
          aria-hidden="true"
          className={`grid size-10 shrink-0 place-items-center rounded-lg ${className}`}
        >
          <Icon className="size-5" strokeWidth={1.8} />
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block text-sm text-ink ${notification.read ? '' : 'font-semibold'}`}>
            {notification.title}
          </span>
          {notification.body && (
            <span className="mt-0.5 block text-sm leading-snug text-muted">
              {notification.body}
            </span>
          )}
          <span className="mt-1.5 block text-xs text-muted">
            {!notification.read && <span className="sr-only">Unread · </span>}
            {timeAgo(notification.createdAt)}
          </span>
        </span>
        {!notification.read && (
          <span aria-hidden="true" className="mt-1.5 size-2 shrink-0 rounded-full bg-coral" />
        )}
      </button>
      <button
        type="button"
        onClick={() => onDismiss(notification)}
        aria-label={`Dismiss "${notification.title}"`}
        className="absolute top-3 right-2 rounded-md p-1.5 text-muted opacity-100 hover:bg-white hover:text-ink sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      >
        <X className="size-4" />
      </button>
    </li>
  );
}
