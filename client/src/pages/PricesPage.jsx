import { useEffect, useState } from 'react';
import { fetchProducts } from '../api/client';
import { UNIT_LABELS } from '../constants';
import { formatInr } from '../utils/format';

export default function PricesPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProducts().then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-sm text-stone-500">Loading…</p>;

  return (
    <div className="space-y-6">
      <p className="text-sm text-stone-600">
        Sample price list used by the assistant. A tier applies once the quantity reaches its minimum.
      </p>
      {Object.entries(data.categories).map(([category, title]) => (
        <section key={category} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="mb-3 font-semibold text-stone-900">{title}</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <tbody className="divide-y divide-stone-100">
                {data.products
                  .filter((product) => product.category === category)
                  .map((product) => (
                    <tr key={product.id}>
                      <td className="py-2 pr-3">
                        <div className="font-medium text-stone-900">{product.name}</div>
                        <div className="text-xs text-stone-500">{product.hindiName}</div>
                      </td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-2">
                          {product.tiers.map((tier) => (
                            <span key={tier.minQty} className="rounded-md bg-orange-50 px-2 py-1 text-xs text-stone-800">
                              {tier.minQty}+ {UNIT_LABELS[product.unit]}: <b>{formatInr(tier.price)}</b>
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
