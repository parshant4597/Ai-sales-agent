import { useEffect, useState } from 'react';
import { fetchLeads } from '../api/client';
import LeadCard from '../components/LeadCard';
import { STATUSES } from '../constants';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

export default function LeadsPage() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);

  const [leads, setLeads] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false; // ignore a slow response that arrives after the filter changed
    setLoading(true);
    fetchLeads({ status, q: debouncedSearch })
      .then((data) => {
        if (cancelled) return;
        setLeads(data.leads);
        setCounts(data.statusCounts);
        setError('');
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [status, debouncedSearch]);

  // After a status change or note, replace that one lead in the list without refetching.
  function handleLeadChange(updated) {
    setLeads((current) => {
      const stillMatches = status === 'all' || updated.status === status;
      return stillMatches
        ? current.map((lead) => (lead._id === updated._id ? updated : lead))
        : current.filter((lead) => lead._id !== updated._id);
    });
    fetchLeads({ status: 'all' }).then((data) => setCounts(data.statusCounts)).catch(() => {});
  }

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const tabs = [{ value: 'all', label: 'All', count: total }, ...STATUSES.map((s) => ({ ...s, count: counts[s.value] || 0 }))];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatus(tab.value)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              status === tab.value ? 'bg-orange-600 text-white' : 'bg-white text-stone-700 ring-1 ring-stone-200 hover:bg-orange-50'
            }`}
          >
            {tab.label} <span className="opacity-70">{tab.count}</span>
          </button>
        ))}
      </div>

      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        type="search"
        placeholder="Search by message, name, phone or product"
        className="w-full rounded-xl border border-stone-300 bg-white p-3 text-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200"
      />

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && <p className="text-sm text-stone-500">Loading…</p>}
      {!loading && !error && leads.length === 0 && (
        <p className="rounded-xl bg-white p-6 text-center text-sm text-stone-500">
          No leads yet. Every message you analyse on the Reply assistant page is saved here.
        </p>
      )}

      <div className="space-y-3">
        {leads.map((lead) => (
          <LeadCard key={lead._id} lead={lead} onChange={handleLeadChange} />
        ))}
      </div>
    </div>
  );
}
