import { useState } from 'react';
import { UNIT_LABELS } from '../../constants';
import { formatInr } from '../../utils/format';
import { EditIcon, TrashIcon } from '../icons';

// A small colour per category, so the page is easy to scan.
const CATEGORY_STYLE = {
  gemstone: 'bg-violet-50 text-violet-800',
  rudraksha: 'bg-amber-50 text-amber-900',
  spiritual: 'bg-sky-50 text-sky-800',
  puja: 'bg-rose-50 text-rose-800',
};

// "-8%" against the first (smallest quantity) price: how much the bulk tier saves.
const savingPercent = (base, price) => Math.round(((base - price) / base) * 100);

// One product with its prices. For an admin it also has Edit and Delete.
export default function ProductCard({ product, categoryName, canManage, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const base = product.tiers[0].price;
  const hidden = product.active === false;

  async function handleDelete() {
    setBusy(true);
    try {
      await onDelete(product);
    } finally {
      setBusy(false);
      setConfirming(false);
    }
  }

  return (
    <article className={`surface min-w-0 p-5 transition hover:-translate-y-0.5 hover:shadow-lg ${hidden ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-semibold text-stone-900">{product.name}</h2>
          {product.hindiName && <p className="text-sm text-stone-500">{product.hindiName}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${CATEGORY_STYLE[product.category]}`}>{categoryName}</span>
          {hidden && <span className="rounded-full bg-stone-200 px-2.5 py-0.5 text-[11px] font-semibold text-stone-600">Hidden from customers</span>}
        </div>
      </div>

      {product.description && <p className="mt-2 text-sm text-stone-600">{product.description}</p>}

      <div className="mt-4 grid grid-cols-3 gap-2">
        {product.tiers.map((tier, index) => (
          <div key={tier.minQty} className={`min-w-0 rounded-xl p-2 text-center sm:p-2.5 ${index === 0 ? 'bg-stone-50' : 'bg-emerald-50'}`}>
            <p className="text-[11px] text-stone-500">
              {tier.minQty}+ {UNIT_LABELS[product.unit]}
            </p>
            <p className="text-sm font-bold text-stone-900 sm:text-base">{formatInr(tier.price)}</p>
            {index > 0 && savingPercent(base, tier.price) > 0 && <p className="text-[11px] font-semibold text-emerald-700">−{savingPercent(base, tier.price)}%</p>}
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-stone-400">Price per {UNIT_LABELS[product.unit]}</p>

      {canManage && (
        <div className="mt-4 border-t border-stone-100 pt-3">
          {confirming ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-800">
              <span className="flex-1">Delete {product.name}? Old leads keep their prices.</span>
              <button type="button" onClick={() => setConfirming(false)} className="btn-secondary px-3 py-1.5 text-xs">
                Cancel
              </button>
              <button type="button" disabled={busy} onClick={handleDelete} className="rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700">
                {busy ? 'Deleting…' : 'Yes, delete'}
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button type="button" onClick={() => onEdit(product)} className="btn-secondary flex items-center gap-1.5 px-3 py-1.5 text-xs">
                <EditIcon size={14} /> Edit
              </button>
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50"
              >
                <TrashIcon size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
