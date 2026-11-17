import { useState } from 'react';
import { UNIT_LABELS, UNIT_OPTIONS } from '../../constants';
import { formatInr } from '../../utils/format';
import { PlusIcon, TrashIcon } from '../icons';

const MAX_TIERS = 5;
const EMPTY_PRODUCT = {
  name: '',
  hindiName: '',
  description: '',
  category: 'gemstone',
  unit: 'ratti',
  aliases: '',
  tiers: [{ minQty: '1', price: '' }],
  active: true,
};

// Existing product -> the text values the inputs hold.
const toFormValues = (product) => ({
  ...product,
  // The name and Hindi name are added as spellings automatically, so only the extra ones are shown.
  aliases: (product.aliases || []).join(', '),
  tiers: product.tiers.map((tier) => ({ minQty: String(tier.minQty), price: String(tier.price) })),
});

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-stone-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  );
}

// The whole add / edit form. It only collects values: the server checks every rule again.
export default function ProductForm({ product, categories, onSave, onCancel }) {
  const [form, setForm] = useState(product ? toFormValues(product) : EMPTY_PRODUCT);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const update = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));

  const updateTier = (index, key, value) =>
    setForm((current) => ({ ...current, tiers: current.tiers.map((tier, i) => (i === index ? { ...tier, [key]: value } : tier)) }));
  const addTier = () => setForm((current) => ({ ...current, tiers: [...current.tiers, { minQty: '', price: '' }] }));
  const removeTier = (index) => setForm((current) => ({ ...current, tiers: current.tiers.filter((_, i) => i !== index) }));

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSave({
        ...form,
        tiers: form.tiers.map((tier) => ({ minQty: Number(tier.minQty), price: Number(tier.price) })),
      });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  const unit = UNIT_LABELS[form.unit];
  const basePrice = Number(form.tiers[0]?.price);

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product name">
          <input value={form.name} onChange={update('name')} required minLength={2} maxLength={80} placeholder="e.g. Amethyst (Katela)" className="field" />
        </Field>
        <Field label="Hindi name" hint="Optional. Used when replying in Hindi.">
          <input value={form.hindiName} onChange={update('hindiName')} maxLength={80} placeholder="e.g. कटेला" className="field" />
        </Field>
      </div>

      <Field label="Description" hint="Optional. Shown on the price list.">
        <textarea value={form.description} onChange={update('description')} maxLength={300} rows={2} placeholder="A short line about the product" className="field resize-none" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <select value={form.category} onChange={update('category')} className="field">
            {Object.entries(categories).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Sold by" hint="What the quantity counts. Only ratti can be fractional (5.25).">
          <select value={form.unit} onChange={update('unit')} className="field">
            {UNIT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Other spellings customers use" hint="Separate with commas, e.g. jamunia, amethyst stone. The product name itself is always recognised.">
        <input value={form.aliases} onChange={update('aliases')} placeholder="jamunia, amethyst stone" className="field" />
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-stone-700">Prices (per {unit})</legend>
        <p className="mb-3 text-xs text-stone-500">The first price starts at 1. Add bulk prices for bigger quantities; they can never cost more than a smaller quantity.</p>
        <div className="space-y-2">
          {form.tiers.map((tier, index) => {
            const saving = index > 0 && basePrice > 0 && Number(tier.price) > 0 ? Math.round(((basePrice - Number(tier.price)) / basePrice) * 100) : null;
            return (
              <div key={index} className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500">From</span>
                  <input
                    value={tier.minQty}
                    onChange={(event) => updateTier(index, 'minQty', event.target.value)}
                    type="number"
                    min={1}
                    step={1}
                    required
                    readOnly={index === 0}
                    aria-label={`Tier ${index + 1} minimum quantity`}
                    className={`field w-24 ${index === 0 ? 'bg-stone-50 text-stone-500' : ''}`}
                  />
                  <span className="text-xs text-stone-500">{unit}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-stone-500">₹</span>
                  <input
                    value={tier.price}
                    onChange={(event) => updateTier(index, 'price', event.target.value)}
                    type="number"
                    min={1}
                    step={1}
                    required
                    placeholder="Price"
                    aria-label={`Tier ${index + 1} price`}
                    className="field w-28"
                  />
                  <span className="text-xs text-stone-500">per {unit}</span>
                </div>
                {saving !== null && saving > 0 && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">−{saving}%</span>}
                {index > 0 && (
                  <button type="button" onClick={() => removeTier(index)} aria-label={`Remove tier ${index + 1}`} className="rounded-lg p-2 text-stone-400 transition hover:bg-red-50 hover:text-red-600">
                    <TrashIcon size={16} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {form.tiers.length < MAX_TIERS && (
          <button type="button" onClick={addTier} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-orange-700 hover:underline">
            <PlusIcon size={15} /> Add a bulk price
          </button>
        )}
        {basePrice > 0 && <p className="mt-2 text-xs text-stone-500">Customers asking for 1 {unit} are quoted {formatInr(basePrice)}.</p>}
      </fieldset>

      <label className="flex items-start gap-3 rounded-xl bg-stone-50 p-3">
        <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} className="mt-0.5 h-4 w-4 accent-orange-600" />
        <span className="text-sm">
          <span className="font-medium text-stone-800">Quote this product to customers</span>
          <span className="block text-xs text-stone-500">Untick to hide it. The assistant will not offer it, but you keep it here.</span>
        </span>
      </label>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="btn-secondary px-5 py-2.5 text-sm">
          Cancel
        </button>
        <button type="submit" disabled={busy} className="btn-primary px-6 py-2.5 text-sm">
          {busy ? 'Saving…' : product ? 'Save changes' : 'Add product'}
        </button>
      </div>
    </form>
  );
}
