import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchLeads, fetchUsers } from '../api/client';
import { SearchIcon } from '../components/icons';
import LeadCard from '../components/LeadCard';
import { INTENT_LABELS, STATUSES } from '../constants';
import { useAuth } from '../hooks/useAuth';
import { useDebouncedValue } from '../hooks/useDebouncedValue';

const formatDay = (day) => new Date(`${day}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// A filter that came from the dashboard, with a button to remove it.
function FilterChip({ label, onClear }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 py-1 pl-3 pr-1.5 text-sm font-medium text-orange-900">
      {label}
      <button type="button" onClick={onClear} aria-label={`Remove filter ${label}`} className="rounded-full px-1.5 text-orange-700 hover:bg-orange-200">
        ✕
      </button>
    </span>
  );
}

// Filters live in the URL (?status=quoted&intent=complaint&day=2026-11-16), so a click on the
// dashboard lands here already filtered, and the browser's Back button works.
//
// Who sees what is decided by the SERVER: a team member gets only the leads they answered themselves,
// an admin gets all of them (and can narrow them down to one agent here).
export default function LeadsPage() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';

  const [params, setParams] = useSearchParams();
  const status = params.get('status') || 'all';
  const intent = params.get('intent') || '';
  const day = params.get('day') || '';
  const agent = isAdmin ? params.get('agent') || '' : '';

  const [search, setSearch] = useState(params.get('q') || '');
  const debouncedSearch = useDebouncedValue(search);

  // A result belongs to one set of filters. Loading is derived from that, so the effect
  // below never has to set state synchronously.
  const requestKey = JSON.stringify([status, debouncedSearch, intent, day, agent]);
  const [result, setResult] = useState({ key: '', data: null });
  const [error, setError] = useState('');
  const [agents, setAgents] = useState([]);
  const loading = result.key !== requestKey;
  const leads = result.data?.leads ?? [];
  const counts = result.data?.statusCounts ?? {};

  useEffect(() => {
    let cancelled = false; // ignore a slow response that arrives after the filter changed
    fetchLeads({ status, q: debouncedSearch, intent, day, agent })
      .then((data) => {
        if (cancelled) return;
        setResult({ key: requestKey, data });
        setError('');
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [status, debouncedSearch, intent, day, agent, requestKey]);

  // The admin's "which agent?" list.
  useEffect(() => {
    if (!isAdmin) return undefined;
    let cancelled = false;
    fetchUsers()
      .then(({ users }) => !cancelled && setAgents(users))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  function setParam(key, value) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value && value !== 'all') next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
  }

  // After a status change or note, replace that one lead in the list without refetching.
  function handleLeadChange(updated) {
    setResult((current) => {
      if (!current.data) return current;
      const stillMatches = status === 'all' || updated.status === status;
      const nextLeads = stillMatches
        ? current.data.leads.map((lead) => (lead._id === updated._id ? updated : lead))
        : current.data.leads.filter((lead) => lead._id !== updated._id);
      return { ...current, data: { ...current.data, leads: nextLeads } };
    });
    fetchLeads({ status: 'all', agent })
      .then((data) => setResult((current) => (current.data ? { ...current, data: { ...current.data, statusCounts: data.statusCounts } } : current)))
      .catch(() => {});
  }

  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const tabs = [{ value: 'all', label: 'All', count: total }, ...STATUSES.map((s) => ({ ...s, count: counts[s.value] || 0 }))];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-stone-900">{isAdmin ? 'Leads' : 'My leads'}</h1>
        <p className="text-sm text-stone-500">
          {isAdmin ? 'Every customer message becomes a lead. See the whole team’s leads, or filter by agent.' : 'The customers you have replied to. Move each one through the pipeline.'}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setParam('status', tab.value)}
            className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
              status === tab.value ? 'bg-stone-900 text-white shadow-md' : 'bg-white/80 text-stone-700 ring-1 ring-stone-900/10 hover:bg-white'
            }`}
          >
            {tab.color && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: tab.color }} />}
            {tab.label}
            <span className={`rounded-full px-1.5 text-xs ${status === tab.value ? 'bg-white/20' : 'bg-stone-100 text-stone-600'}`}>{tab.count}</span>
          </button>
        ))}
      </div>

      {(intent || day) && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-stone-500">Filtered by</span>
          {intent && <FilterChip label={INTENT_LABELS[intent] || intent} onClear={() => setParam('intent', '')} />}
          {day && <FilterChip label={formatDay(day)} onClear={() => setParam('day', '')} />}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-0 flex-1 basis-64">
          <SearchIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="search"
            placeholder="Search by message, name, phone or product"
            className="field pl-10"
          />
        </div>

        {isAdmin && (
          <select value={agent || 'all'} onChange={(event) => setParam('agent', event.target.value)} aria-label="Filter by agent" className="field w-auto min-w-44 cursor-pointer">
            <option value="all">All agents</option>
            {agents.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name}
              </option>
            ))}
            <option value="none">No owner (older leads)</option>
          </select>
        )}
      </div>

      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {loading && !error && <p className="text-sm text-stone-500">Loading…</p>}
      {!loading && !error && leads.length === 0 && (
        <p className="surface p-8 text-center text-sm text-stone-500">
          {isAdmin ? 'No leads match these filters.' : 'No leads yet. Every customer message you answer on the Reply assistant page appears here.'}
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
