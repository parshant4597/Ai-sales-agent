// The Remedy Setu mark: a faceted gem on a saffron gradient.
export default function Logo({ size = 40 }) {
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600 text-white shadow-lg shadow-orange-500/30"
      style={{ width: size, height: size }}
    >
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 3h12l4 6-10 12L2 9l4-6Z" />
        <path d="M2 9h20M10 3 8 9l4 12 4-12-2-6" />
      </svg>
    </span>
  );
}
