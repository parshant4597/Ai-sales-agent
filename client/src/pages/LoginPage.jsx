import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ChartIcon, EyeIcon, EyeOffIcon, GlobeIcon, ShieldIcon } from '../components/icons';
import Logo from '../components/Logo';
import { useAuth } from '../hooks/useAuth';

const HIGHLIGHTS = [
  { Icon: ShieldIcon, text: 'Every price comes from your list, never from the AI' },
  { Icon: GlobeIcon, text: 'Hindi, Hinglish and English, understood and answered' },
  { Icon: ChartIcon, text: 'Leads and sales insights for the whole team' },
];

export default function LoginPage() {
  const { user, login, connectionError } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // After signing in, go back to the page the person was trying to open.
  const cameFrom = location.state?.from;
  const destination = cameFrom ? `${cameFrom.pathname}${cameFrom.search || ''}` : '/';
  if (user) return <Navigate to={destination} replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
      setPassword('');
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand side: only on large screens */}
      <aside className="brand-panel relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 top-1/4 h-80 w-80 animate-float rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -left-16 bottom-16 h-64 w-64 animate-float rounded-full bg-amber-200/20 blur-2xl [animation-delay:-3s]" />
        <svg className="pointer-events-none absolute right-10 top-16 h-44 w-44 animate-float text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.6" aria-hidden="true">
          <path d="M6 3h12l4 6-10 12L2 9l4-6Z" />
          <path d="M2 9h20M10 3 8 9l4 12 4-12-2-6" />
        </svg>

        <div className="relative flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/40 backdrop-blur">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M6 3h12l4 6-10 12L2 9l4-6Z" />
              <path d="M2 9h20M10 3 8 9l4 12 4-12-2-6" />
            </svg>
          </span>
          <span className="font-display text-xl font-semibold">Remedy Setu</span>
        </div>

        <div className="relative max-w-lg">
          <h1 className="font-display text-5xl font-semibold leading-tight">Replies, quotes and leads, in one calm place.</h1>
          <p className="mt-5 text-lg text-white/85">Answer every customer in seconds, with prices you can trust.</p>
          <ul className="mt-10 space-y-4">
            {HIGHLIGHTS.map(({ Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/95">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/30">
                  <Icon size={18} />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/70">A private workspace for the Remedy Setu team.</p>
      </aside>

      {/* Form side */}
      <main className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md animate-fade-up">
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <Logo size={44} />
            <span className="font-display text-xl font-semibold">Remedy Setu</span>
          </div>

          <h2 className="font-display text-3xl font-semibold text-stone-900">Welcome back</h2>
          <p className="mt-2 text-sm text-stone-500">Sign in with your team account to continue.</p>

          <form onSubmit={handleSubmit} className="surface mt-8 space-y-5 p-6">
            {connectionError && (
              <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                {connectionError}
              </p>
            )}

            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-stone-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="field"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-stone-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Your password"
                  className="field pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-stone-400 hover:text-stone-700"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}

            <button type="submit" disabled={busy || !email || !password} className="btn-primary w-full px-5 py-3 text-sm">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs leading-relaxed text-stone-500">
            Only Remedy Setu team members can sign in. There is no public sign-up.
            <br />
            Need access? Ask your admin to add you.
          </p>
        </div>
      </main>
    </div>
  );
}
