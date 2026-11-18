import { Bell, BellOff } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useDeleteNotification,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
  useUnreadCount,
} from '../../api/notifications.js';
import { NotificationItem } from './NotificationItem.jsx';

function NotificationPanel({ id, onClose }) {
  const navigate = useNavigate();
  const notifications = useNotifications({ enabled: true });
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const remove = useDeleteNotification();

  const items = notifications.data?.pages.flatMap((page) => page.items) ?? [];
  const unread = notifications.data?.pages[0]?.unreadCount ?? 0;

  const open = (notification) => {
    if (!notification.read) markRead.mutate(notification.id);
    onClose();
    if (notification.link) navigate(notification.link);
  };

  return (
    <div
      id={id}
      role="dialog"
      aria-label="Notifications"
      className="fixed inset-x-3 top-20 z-50 flex max-h-[75vh] flex-col rounded-2xl border border-line bg-white shadow-xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[400px]"
    >
      <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <h2 className="text-base font-semibold text-ink">Notifications</h2>
        <button
          type="button"
          onClick={() => markAllRead.mutate()}
          disabled={unread === 0}
          className="text-sm font-medium text-sage hover:underline disabled:text-muted disabled:no-underline"
        >
          Mark all as read
        </button>
      </header>

      <div className="overflow-y-auto p-2">
        {notifications.isPending && (
          <p role="status" className="px-3 py-8 text-center text-sm text-muted">
            Loading…
          </p>
        )}
        {notifications.isError && (
          <p role="alert" className="px-3 py-8 text-center text-sm text-coral">
            Couldn’t load notifications.
          </p>
        )}
        {notifications.isSuccess && items.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-3 py-10 text-center text-sm text-muted">
            <BellOff className="size-6" aria-hidden="true" />
            You’re all caught up.
          </div>
        )}
        <ul className="space-y-1">
          {items.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onOpen={open}
              onDismiss={(n) => remove.mutate(n.id)}
            />
          ))}
        </ul>
        {notifications.hasNextPage && (
          <button
            type="button"
            onClick={() => notifications.fetchNextPage()}
            disabled={notifications.isFetchingNextPage}
            className="mt-2 w-full rounded-lg py-2.5 text-sm font-medium text-sage hover:bg-subtle"
          >
            {notifications.isFetchingNextPage ? 'Loading…' : 'Show older'}
          </button>
        )}
      </div>
    </div>
  );
}

export function NotificationBell({ className = '' }) {
  const { data: unread = 0 } = useUnreadCount();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const buttonRef = useRef(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const label = unread ? `Notifications, ${unread} unread` : 'Notifications';

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((v) => !v)}
        className="relative grid size-11 place-items-center rounded-lg border border-line bg-white text-ink hover:bg-subtle lg:size-12"
      >
        <Bell className="size-5" strokeWidth={1.8} />
        {unread > 0 && (
          <span
            aria-hidden="true"
            className="absolute -top-1.5 -right-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-[11px] font-semibold text-white ring-2 ring-page"
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && <NotificationPanel id={panelId} onClose={() => setOpen(false)} />}
    </div>
  );
}
