import { UNIT_LABELS } from '../constants';
import { formatInr } from '../utils/format';

// Shows the prices the server calculated. Nothing here is computed by the AI.
export default function QuoteTable({ quote }) {
  if (quote.lines.length === 0) {
    return <p className="rounded-xl bg-stone-50 p-4 text-sm text-stone-500">No catalogue product matched, so no prices are quoted.</p>;
  }

  return (
    <div>
      <div className="overflow-hidden rounded-xl ring-1 ring-stone-200">
        <table className="w-full text-left text-xs sm:text-sm">
          <thead className="bg-stone-50 text-[11px] uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-3 py-2.5 font-medium">Product</th>
              <th className="px-2 py-2.5 font-medium">Qty</th>
              <th className="px-2 py-2.5 font-medium">Rate</th>
              <th className="px-3 py-2.5 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 bg-white">
            {quote.lines.map((line) => (
              <tr key={line.productId}>
                <td className="px-3 py-3">
                  <div className="font-medium text-stone-900">{line.name}</div>
                  {line.quantity !== null && line.nextTier && (
                    <span className="mt-1 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      {line.nextTier.minQty}+ {UNIT_LABELS[line.unit]} → {formatInr(line.nextTier.price)}
                    </span>
                  )}
                </td>
                <td className="whitespace-nowrap px-2 py-3">{line.quantity === null ? '—' : `${line.quantity} ${UNIT_LABELS[line.unit]}`}</td>
                <td className="whitespace-nowrap px-2 py-3">
                  {formatInr(line.unitPrice)}/{UNIT_LABELS[line.unit]}
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right font-semibold text-stone-900">{line.lineTotal === null ? '—' : formatInr(line.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
          {quote.total !== null && quote.lines.length > 1 && (
            <tfoot>
              <tr className="bg-orange-50">
                <td colSpan={3} className="px-3 py-3 font-semibold text-stone-900">
                  Total
                </td>
                <td className="whitespace-nowrap px-3 py-3 text-right text-base font-bold text-orange-700">{formatInr(quote.total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {quote.isSuggestion && <p className="mt-2 text-xs text-stone-500">The customer did not name an exact product, so these are the options in that category.</p>}
    </div>
  );
}
