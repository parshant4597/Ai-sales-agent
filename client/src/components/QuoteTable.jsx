import { UNIT_LABELS } from '../constants';
import { formatInr } from '../utils/format';

// Shows the prices the server calculated. Nothing here is computed by the AI.
export default function QuoteTable({ quote }) {
  if (quote.lines.length === 0) {
    return <p className="text-sm text-stone-500">No catalogue product matched, so no prices are quoted.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-left text-sm">
        <thead className="text-xs uppercase text-stone-500">
          <tr>
            <th className="py-2 pr-3 font-medium">Product</th>
            <th className="py-2 pr-3 font-medium">Qty</th>
            <th className="py-2 pr-3 font-medium">Rate</th>
            <th className="py-2 text-right font-medium">Amount</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {quote.lines.map((line) => (
            <tr key={line.productId}>
              <td className="py-2 pr-3">
                <div className="font-medium text-stone-900">{line.name}</div>
                {line.quantity !== null && line.nextTier && (
                  <div className="text-xs text-emerald-700">
                    {line.nextTier.minQty}+ {UNIT_LABELS[line.unit]} → {formatInr(line.nextTier.price)}
                  </div>
                )}
              </td>
              <td className="py-2 pr-3">{line.quantity === null ? '—' : `${line.quantity} ${UNIT_LABELS[line.unit]}`}</td>
              <td className="py-2 pr-3">
                {formatInr(line.unitPrice)}/{UNIT_LABELS[line.unit]}
              </td>
              <td className="py-2 text-right font-medium">{line.lineTotal === null ? '—' : formatInr(line.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
        {quote.total !== null && quote.lines.length > 1 && (
          <tfoot>
            <tr className="border-t border-stone-300">
              <td colSpan={3} className="py-2 pr-3 font-semibold">
                Total
              </td>
              <td className="py-2 text-right font-semibold">{formatInr(quote.total)}</td>
            </tr>
          </tfoot>
        )}
      </table>
      {quote.isSuggestion && (
        <p className="mt-2 text-xs text-stone-500">The customer did not name an exact product, so these are the options in that category.</p>
      )}
    </div>
  );
}
