import { useCountUp } from '../../hooks/useCountUp';

// A big headline number that counts up. Becomes a button when `onClick` is given.
export default function StatCard({ label, value, format = (number) => Math.round(number).toLocaleString('en-IN'), icon, tone, delta, hint, onClick }) {
  const shown = useCountUp(value ?? 0);
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`group surface p-4 text-left transition ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tone}`}>{icon}</span>
      </div>
      <p className="mt-2 break-words text-2xl font-bold text-stone-900">{value === null ? '—' : format(shown)}</p>
      <div className="mt-1 flex min-h-4 flex-wrap items-center gap-x-2 text-xs text-stone-500">
        {delta}
        {hint && <span>{hint}</span>}
      </div>
    </Wrapper>
  );
}
