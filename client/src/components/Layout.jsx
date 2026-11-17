import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getInitials } from '../utils/format';
import { ChartIcon, ChatIcon, ListIcon, LogoutIcon, TagIcon, TeamIcon } from './icons';
import Logo from './Logo';

const NAV_ITEMS = [
  { to: '/', label: 'Reply assistant', short: 'Reply', Icon: ChatIcon, end: true },
  { to: '/leads', label: 'Leads', short: 'Leads', Icon: ListIcon },
  { to: '/insights', label: 'Insights', short: 'Insights', Icon: ChartIcon, adminOnly: true },
  { to: '/prices', label: 'Price list', short: 'Prices', Icon: TagIcon },
  { to: '/team', label: 'Team', short: 'Team', Icon: TeamIcon, adminOnly: true },
];

const desktopLink = ({ isActive }) =>
  `flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium transition lg:px-4 ${
    isActive ? 'bg-stone-900 text-white shadow-md' : 'text-stone-600 hover:bg-white hover:text-stone-900'
  }`;

const mobileLink = ({ isActive }) =>
  `relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition ${
    isActive ? 'text-orange-600' : 'text-stone-500'
  }`;

// Avatar button that opens a small menu with the person's details and Sign out.
function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (event.type === 'keydown' ? event.key === 'Escape' : !menuRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex items-center gap-2 rounded-full p-1 pr-3 transition hover:bg-white"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-rose-500 text-sm font-semibold text-white">
          {getInitials(user.name)}
        </span>
        <span className="hidden max-w-28 truncate text-sm font-medium text-stone-700 md:block">{user.name}</span>
      </button>

      {open && (
        <div role="menu" className="surface absolute right-0 top-full z-50 mt-2 w-64 animate-fade-up p-2">
          <div className="px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-stone-900">{user.name}</p>
            <p className="truncate text-xs text-stone-500">{user.email}</p>
            <span className="mt-2 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-semibold capitalize text-orange-800">
              {user.role}
            </span>
          </div>
          <button
            type="button"
            role="menuitem"
            onClick={onLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 transition hover:bg-red-50"
          >
            <LogoutIcon /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const items = NAV_ITEMS.filter((item) => !item.adminOnly || user.role === 'admin');

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-white/70 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-center gap-3">
            <Logo />
            <span className="leading-tight">
              <span className="block whitespace-nowrap font-display text-lg font-semibold text-stone-900">Remedy Setu</span>
              <span className="hidden text-[11px] text-stone-500 md:block">AI sales assistant</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full bg-stone-900/5 p-1 sm:flex" aria-label="Main">
            {items.map(({ to, label, Icon, end }) => (
              <NavLink key={to} to={to} end={end} className={desktopLink} title={label} aria-label={label}>
                <Icon size={16} />
                {/* Labels need room: on medium screens only the icons show */}
                <span className="hidden lg:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          <UserMenu user={user} onLogout={logout} />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:pb-10">
        <Outlet />
      </main>

      <footer className="mx-auto hidden max-w-6xl px-4 pb-8 text-center text-xs text-stone-400 sm:block">
        Sample price list for demonstration. Prices are always calculated by code, never by the AI.
      </footer>

      {/* Phone: a bottom tab bar, easier to reach with a thumb than the top menu */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-stone-200 bg-white/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl sm:hidden"
        aria-label="Main"
      >
        {items.map(({ to, short, Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={mobileLink}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-orange-500" />}
                <Icon size={20} />
                {short}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
