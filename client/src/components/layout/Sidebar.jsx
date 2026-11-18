import { Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Logo } from './Logo.jsx';
import { NAV_ITEMS } from './navItems.js';
import { UserMenu } from './UserMenu.jsx';

const linkClass = ({ isActive }) =>
  `flex items-center gap-3 rounded-xl px-4 py-3.5 text-[17px] transition-colors ${
    isActive ? 'bg-nav-active font-semibold text-ink' : 'text-ink/75 hover:bg-nav-active/50'
  }`;

export function Sidebar() {
  return (
    <div className="hidden w-60 shrink-0 border-r border-line bg-sidebar lg:block">
      <aside className="sticky top-0 flex h-screen flex-col overflow-y-auto px-4 py-8">
        <div className="px-3">
          <Logo />
        </div>

        <nav aria-label="Main" className="mt-12 flex flex-col gap-1.5">
          {NAV_ITEMS.map(({ to, label, Icon, end, dot }) => (
            <NavLink key={to} to={to} end={end} className={linkClass}>
              <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
              <span className="flex-1">{label}</span>
              {dot && <span aria-hidden="true" className="size-1.5 rounded-full bg-coral" />}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <div className="rounded-2xl bg-nav-active/70 p-5">
            <p className="text-lg leading-snug font-semibold text-ink">
              Small steps,
              <br />
              big plans.
            </p>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Mind your budget.
              <br />
              Make room for good moments.
            </p>
          </div>

          <NavLink to="/settings" className={(state) => `mt-6 ${linkClass(state)}`}>
            <Settings className="size-5" strokeWidth={1.8} aria-hidden="true" />
            Settings
          </NavLink>

          <div className="mt-3 border-t border-line pt-3">
            <UserMenu />
          </div>
        </div>
      </aside>
    </div>
  );
}
