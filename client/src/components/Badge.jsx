export default function Badge({ children, className = 'bg-stone-100 text-stone-700' }) {
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>;
}
