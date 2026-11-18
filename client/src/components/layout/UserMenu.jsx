import { ChevronDown, LogOut, Settings } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogout, useMe } from '../../api/auth.js';

export function UserMenu() {
  const { data: user } = useMe();
  const logout = useLogout();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !ref.current?.contains(event.target))
        setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const signOut = () =>
    logout.mutate(undefined, { onSettled: () => navigate('/login', { replace: true }) });

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-nav-active/60"
      >
        <span>
          <span className="block text-[15px] font-semibold text-ink">{user?.name}</span>
          <span className="block text-sm text-muted">Personal account</span>
        </span>
        <ChevronDown
          className={`size-5 text-muted transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute bottom-full left-0 mb-2 w-full rounded-xl border border-line bg-white p-1.5 shadow-lg"
        >
          <Link
            role="menuitem"
            to="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-subtle"
          >
            <Settings className="size-4" /> Settings
          </Link>
          <button
            role="menuitem"
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-coral hover:bg-blush"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
