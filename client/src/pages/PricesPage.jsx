import { useEffect, useMemo, useState } from 'react';
import { createProduct, deleteProduct, fetchProducts, updateProduct } from '../api/client';
import { PlusIcon, SearchIcon } from '../components/icons';
import Modal from '../components/Modal';
import ProductCard from '../components/products/ProductCard';
import ProductForm from '../components/products/ProductForm';
import { useAuth } from '../hooks/useAuth';

// Everyone can read the price list. Only an admin can add, edit, hide or delete products, and a change
// applies to the assistant at once: the very next customer message is priced with it.
export default function PricesPage() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';

  const [reloadTick, setReloadTick] = useState(0);
  const [result, setResult] = useState({ key: -1, data: null });
  const [error, setError] = useState('');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new product, {...} = existing
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((data) => {
        if (cancelled) return;
        setResult({ key: reloadTick, data });
        setError('');
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  const data = result.data;
  const canManage = Boolean(data?.canManage);
  const reload = () => setReloadTick((tick) => tick + 1);

  const visible = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return data.products.filter(
      (product) =>
        (category === 'all' || product.category === category) &&
        (!term ||
          product.name.toLowerCase().includes(term) ||
          product.hindiName.includes(term) ||
          product.description.toLowerCase().includes(term) ||
          (product.aliases || []).some((alias) => alias.includes(term))),
    );
  }, [data, category, search]);

  async function handleSave(values) {
    if (editing?.id) await updateProduct(editing.id, values);
    else await createProduct(values);
    setNotice(editing?.id ? `Saved ${values.name}.` : `Added ${values.name}. The assistant can quote it now.`);
    setEditing(null);
    reload();
  }

  async function handleDelete(product) {
    try {
      await deleteProduct(product.id);
      setNotice(`Deleted ${product.name}.`);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  if (error && !data) return <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>;
  if (!data) return <p className="text-sm text-stone-500">Loading…</p>;

  const categories = Object.entries(data.categories);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-stone-900">Price list</h1>
          <p className="text-sm text-stone-500">
            {canManage ? 'Add or change products here. Every change applies to the assistant straight away.' : 'The prices the assistant quotes. A tier applies once the quantity reaches its minimum.'}
          </p>
        </div>
        {canManage && (
          <button type="button" onClick={() => setEditing({})} className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm">
            <PlusIcon size={16} /> Add product
          </button>
        )}
      </div>

      {isAdmin && !canManage && (
        <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          The database is not connected, so products cannot be changed right now. Showing the list the assistant is using.
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-60">
          <SearchIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} type="search" placeholder="Search a product, e.g. Neelam or नीलम" className="field pl-10" />
        </div>
        <div className="flex flex-wrap gap-2">
          {[['all', 'All'], ...categories].map(([key, title]) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                category === key ? 'bg-stone-900 text-white shadow-md' : 'bg-white/80 text-stone-700 ring-1 ring-stone-900/10 hover:bg-white'
              }`}
            >
              {title}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 && <p className="surface p-8 text-center text-sm text-stone-500">No product matches this search.</p>}

      <div className="grid gap-4 md:grid-cols-2">
        {visible.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            categoryName={data.categories[product.category]}
            canManage={canManage}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? `Edit ${editing.name}` : 'Add a product'} onClose={() => setEditing(null)}>
          <ProductForm product={editing.id ? editing : null} categories={data.categories} onSave={handleSave} onCancel={() => setEditing(null)} />
        </Modal>
      )}
    </div>
  );
}
