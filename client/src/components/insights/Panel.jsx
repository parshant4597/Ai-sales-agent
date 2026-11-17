// The glass card every dashboard section sits in.
export default function Panel({ title, subtitle, action, className = '', children }) {
  return (
    <section className={`surface min-w-0 p-5 ${className}`}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-stone-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-xs text-stone-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
