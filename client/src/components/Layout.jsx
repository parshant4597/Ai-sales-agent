import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Reply assistant', end: true },
  { to: '/leads', label: 'Leads' },
  { to: '/prices', label: 'Price list' },
];

const linkClass = ({ isActive }) =>
  `rounded-lg px-3 py-2 text-sm font-medium transition ${
    isActive ? 'bg-orange-600 text-white' : 'text-stone-700 hover:bg-orange-100'
  }`;

export default function Layout() {
  return (
    <div className="min-h-screen bg-orange-50/40">
      <header className="border-b border-orange-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div>
            <h1 className="text-lg font-bold text-stone-900">Remedy Setu</h1>
            <p className="text-xs text-stone-500">Sales reply assistant</p>
          </div>
          <nav className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
