import { useCountUp } from '../../hooks/useCountUp';

// Smaller KPI for the second row. A `bar` (0-100) draws a thin progress line under the number.
export default function MiniStat({ label, value, format = (number) => Math.round(number).toLocaleString('en-IN'), hint, bar, barColor = '#f97316', alert = false, onClick }) {
  const shown = useCountUp(value ?? 0);
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-2xl border bg-white/80 p-3.5 text-left shadow-sm backdrop-blur transition ${
        alert ? 'border-red-200 bg-red-50/40' : 'border-stone-200'
      } ${onClick ? 'cursor-pointer hover:-translate-y-0.5 hover:border-orange-300 hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400' : ''}`}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${alert ? 'text-red-700' : 'text-stone-900'}`}>{value === null ? '—' : format(shown)}</p>
      {bar !== undefined && bar !== null && (
        <div className="mt-2 h-1.5 rounded-full bg-stone-100">
          <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${Math.min(bar, 100)}%`, backgroundColor: barColor }} />
        </div>
      )}
      {hint && <p className="mt-1.5 text-xs text-stone-500">{hint}</p>}
    </Wrapper>
  );
}
