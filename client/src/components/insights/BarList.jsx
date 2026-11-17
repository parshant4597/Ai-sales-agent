import { useReady } from '../../hooks/useReady';

// Horizontal bars drawn with plain divs. Each row is a button when `onSelect` is given.
export default function BarList({ items, onSelect, color = '#f97316', emptyText = 'No data yet.' }) {
  const ready = useReady();
  if (items.length === 0) return <p className="text-sm text-stone-500">{emptyText}</p>;

  const max = Math.max(...items.map((item) => item.value), 1);
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <ul className="space-y-1">
      {items.map((item) => {
        const Row = onSelect ? 'button' : 'div';
        return (
          <li key={item.key ?? item.label} className="min-w-0">
            <Row
              type={onSelect ? 'button' : undefined}
              onClick={onSelect ? () => onSelect(item) : undefined}
              className={`group block w-full rounded-lg px-2 py-1.5 text-left ${onSelect ? 'cursor-pointer transition hover:bg-orange-50' : ''}`}
            >
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-stone-800 group-hover:text-stone-950">{item.label}</span>
                <span className="shrink-0 font-semibold text-stone-900">
                  {item.value}
                  <span className="ml-1.5 text-xs font-normal text-stone-400">{total > 0 ? Math.round((item.value / total) * 100) : 0}%</span>
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-stone-100">
                <div
                  className="h-2 rounded-full"
                  style={{ width: ready ? `${(item.value / max) * 100}%` : '0%', backgroundColor: color, transition: 'width 800ms cubic-bezier(0.22, 1, 0.36, 1)' }}
                />
              </div>
            </Row>
          </li>
        );
      })}
    </ul>
  );
}
