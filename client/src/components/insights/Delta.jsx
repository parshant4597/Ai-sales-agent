// "▲ 12%" or "▼ 5%" compared with the previous period. Shows nothing when there is nothing to compare.
// mode="points" is for values that are already percentages (win rate): "▲ 8 pts".
export default function Delta({ current, previous, goodWhenUp = true, mode = 'percent' }) {
  if (current === null || previous === null || previous === undefined) return null;
  if (mode === 'percent' && previous === 0) return null;

  const change = mode === 'points' ? Math.round(current - previous) : Math.round(((current - previous) / previous) * 100);
  if (change === 0) return <span className="text-xs font-medium text-stone-500">no change</span>;

  const isGood = (change > 0) === goodWhenUp;
  return (
    <span className={`text-xs font-semibold ${isGood ? 'text-emerald-600' : 'text-red-600'}`}>
      {change > 0 ? '▲' : '▼'} {Math.abs(change)}
      {mode === 'points' ? ' pts' : '%'}
    </span>
  );
}
