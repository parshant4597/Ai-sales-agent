import { RANGES } from '../../constants';

export default function RangeToggle({ value, onChange }) {
  return (
    <div className="inline-flex rounded-xl border border-stone-200 bg-white p-1" role="group" aria-label="Time range">
      {RANGES.map((days) => (
        <button
          key={days}
          type="button"
          aria-pressed={value === days}
          onClick={() => onChange(days)}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
            value === days ? 'bg-orange-600 text-white shadow-sm' : 'text-stone-600 hover:bg-orange-50'
          }`}
        >
          {days} days
        </button>
      ))}
    </div>
  );
}
