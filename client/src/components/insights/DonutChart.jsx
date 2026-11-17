import { useState } from 'react';
import { useReady } from '../../hooks/useReady';

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 72;
const STROKE = 24;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const GAP = 3;

// Pipeline as a donut. Hover a slice or a legend row to read it, click to open those leads.
export default function DonutChart({ segments, onSelect, centerLabel = 'leads' }) {
  const [active, setActive] = useState(null);
  const ready = useReady();

  const total = segments.reduce((sum, segment) => sum + segment.value, 0);
  const activeSegment = segments.find((segment) => segment.key === active);

  // Each slice starts where the previous one ended.
  const arcs = segments
    .filter((segment) => segment.value > 0)
    .reduce((list, segment) => {
      const start = list.length > 0 ? list[list.length - 1].end : 0;
      const length = (segment.value / total) * CIRCUMFERENCE;
      return [...list, { ...segment, length: Math.max(length - GAP, 1), offset: -start, end: start + length }];
    }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="h-44 w-44 shrink-0" role="img" aria-label="Pipeline by status">
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="#f5f5f4" strokeWidth={STROKE} />
        <g transform={`rotate(-90 ${CENTER} ${CENTER})`}>
          {arcs.map((arc) => (
            <circle
              key={arc.key}
              cx={CENTER}
              cy={CENTER}
              r={RADIUS}
              fill="none"
              stroke={arc.color}
              strokeWidth={active === arc.key ? STROKE + 6 : STROKE}
              strokeDasharray={`${ready ? arc.length : 0} ${CIRCUMFERENCE}`}
              strokeDashoffset={arc.offset}
              opacity={active && active !== arc.key ? 0.35 : 1}
              style={{ cursor: 'pointer', transition: 'stroke-dasharray 900ms ease-out, stroke-width 150ms, opacity 150ms' }}
              onMouseEnter={() => setActive(arc.key)}
              onMouseLeave={() => setActive(null)}
              onClick={() => onSelect?.(arc.key)}
            />
          ))}
        </g>
        <text x={CENTER} y={CENTER - 2} textAnchor="middle" fontSize="30" fontWeight="700" fill="#1c1917">
          {activeSegment ? activeSegment.value : total}
        </text>
        <text x={CENTER} y={CENTER + 18} textAnchor="middle" fontSize="11" fill="#78716c">
          {activeSegment ? activeSegment.label : centerLabel}
        </text>
      </svg>

      <ul className="w-full space-y-1">
        {segments.map((segment) => (
          <li key={segment.key}>
            <button
              type="button"
              onClick={() => onSelect?.(segment.key)}
              onMouseEnter={() => setActive(segment.key)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(segment.key)}
              onBlur={() => setActive(null)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition ${
                active === segment.key ? 'bg-orange-50' : 'hover:bg-stone-50'
              }`}
            >
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="flex-1 text-left text-stone-700">{segment.label}</span>
              <span className="font-semibold text-stone-900">{segment.value}</span>
              <span className="w-10 text-right text-xs text-stone-500">{total > 0 ? Math.round((segment.value / total) * 100) : 0}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
