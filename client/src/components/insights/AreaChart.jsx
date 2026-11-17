import { useState } from 'react';
import { useReady } from '../../hooks/useReady';

const WIDTH = 600;
const HEIGHT = 220;
const PAD = { left: 30, right: 14, top: 16, bottom: 30 };
const GRID_LINES = 4;

const formatDay = (day) => new Date(`${day}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

// Daily leads as a line with a soft fill. Hover (or Tab) a day to read it, click to open that day's leads.
export default function AreaChart({ data, onSelect, color = '#f97316' }) {
  const [active, setActive] = useState(null);
  const ready = useReady();

  const innerWidth = WIDTH - PAD.left - PAD.right;
  const innerHeight = HEIGHT - PAD.top - PAD.bottom;
  const top = Math.ceil(Math.max(4, ...data.map((point) => point.count)) / GRID_LINES) * GRID_LINES;

  const x = (index) => PAD.left + (data.length === 1 ? innerWidth / 2 : (index * innerWidth) / (data.length - 1));
  const y = (value) => PAD.top + innerHeight * (1 - value / top);
  const baseline = PAD.top + innerHeight;

  const line = data.map((point, index) => `${index ? 'L' : 'M'}${x(index)},${y(point.count)}`).join(' ');
  const area = `${line} L${x(data.length - 1)},${baseline} L${x(0)},${baseline} Z`;
  const labelEvery = data.length > 14 ? 5 : data.length > 7 ? 2 : 1;
  const columnWidth = innerWidth / data.length;
  const activePoint = active === null ? null : data[active];

  return (
    <div className="relative">
      {activePoint && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-stone-900 px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: `${(x(active) / WIDTH) * 100}%`, top: 0 }}
        >
          <span className="text-stone-300">{formatDay(activePoint.day)}</span>
          <span className="ml-2 font-semibold">
            {activePoint.count} {activePoint.count === 1 ? 'lead' : 'leads'}
          </span>
        </div>
      )}

      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" role="img" aria-label="Leads per day">
        <defs>
          <linearGradient id="leadsFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {Array.from({ length: GRID_LINES + 1 }, (_, step) => {
          const value = (top / GRID_LINES) * step;
          return (
            <g key={step}>
              <line x1={PAD.left} x2={WIDTH - PAD.right} y1={y(value)} y2={y(value)} stroke="#e7e5e4" strokeDasharray={step === 0 ? '0' : '3 4'} />
              <text x={PAD.left - 6} y={y(value) + 3} textAnchor="end" fontSize="10" fill="#a8a29e">
                {value}
              </text>
            </g>
          );
        })}

        <path d={area} fill="url(#leadsFill)" style={{ opacity: ready ? 1 : 0, transition: 'opacity 900ms ease-out' }} />
        <path
          d={line}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="1"
          strokeDasharray="1"
          style={{ strokeDashoffset: ready ? 0 : 1, transition: 'stroke-dashoffset 1000ms ease-out' }}
        />

        {activePoint && <line x1={x(active)} x2={x(active)} y1={PAD.top} y2={baseline} stroke={color} strokeOpacity="0.4" strokeDasharray="4 4" />}

        {data.map((point, index) => (
          <g key={point.day}>
            <circle cx={x(index)} cy={y(point.count)} r={active === index ? 6 : 3.5} fill="white" stroke={color} strokeWidth="2.5" style={{ transition: 'r 120ms' }} />
            {index % labelEvery === 0 && (
              <text x={x(index)} y={HEIGHT - 8} textAnchor="middle" fontSize="10" fill={active === index ? '#292524' : '#a8a29e'}>
                {formatDay(point.day)}
              </text>
            )}
          </g>
        ))}

        {/* One invisible, focusable column per day: easy to hover, click and reach by keyboard. */}
        {data.map((point, index) => (
          <rect
            key={`hit-${point.day}`}
            x={x(index) - columnWidth / 2}
            y={PAD.top}
            width={columnWidth}
            height={innerHeight}
            fill="transparent"
            tabIndex={0}
            role="button"
            aria-label={`${formatDay(point.day)}: ${point.count} leads. Open these leads.`}
            style={{ cursor: 'pointer', outline: 'none' }}
            onMouseEnter={() => setActive(index)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(index)}
            onBlur={() => setActive(null)}
            onClick={() => onSelect?.(point.day)}
            onKeyDown={(event) => (event.key === 'Enter' || event.key === ' ') && onSelect?.(point.day)}
          />
        ))}
      </svg>
    </div>
  );
}
