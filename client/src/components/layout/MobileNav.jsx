import { Settings } from 'lucide-react';
import { Link, NavLink } from 'react-router-dom';
import { NotificationBell } from '../../features/notifications/NotificationBell.jsx';
import { Logo } from './Logo.jsx';
import { NAV_ITEMS } from './navItems.js';

export function MobileTopBar() {
  return (
    <div className="flex items-center justify-between px-4 pt-[calc(env(safe-area-inset-top)+1rem)] lg:hidden">
      <Logo showTagline={false} />
      <div className="flex items-center gap-2">
        <NotificationBell />
        <Link
          to="/settings"
          aria-label="Settings"
          className="grid size-11 place-items-center rounded-xl bg-sidebar text-ink"
        >
          <Settings className="size-5" strokeWidth={1.8} />
        </Link>
      </div>
    </div>
  );
}

export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {NAV_ITEMS.map(({ to, shortLabel, Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2.5 text-[11px] ${isActive ? 'font-semibold text-sage' : 'text-muted'}`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`rounded-lg px-3 py-1 ${isActive ? 'bg-mint' : ''}`}>
                    <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
                  </span>
                  {shortLabel}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
