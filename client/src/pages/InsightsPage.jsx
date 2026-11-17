import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchInsights } from '../api/client';
import AreaChart from '../components/insights/AreaChart';
import BarList from '../components/insights/BarList';
import Delta from '../components/insights/Delta';
import DonutChart from '../components/insights/DonutChart';
import FollowUps from '../components/insights/FollowUps';
import { BellIcon, HourglassIcon, RefreshIcon, RupeeIcon, TrophyIcon, UsersIcon } from '../components/insights/icons';
import MiniStat from '../components/insights/MiniStat';
import Panel from '../components/insights/Panel';
import RangeToggle from '../components/insights/RangeToggle';
import StatCard from '../components/insights/StatCard';
import { INTENT_LABELS, RANGES, STATUSES } from '../constants';
import { formatInr } from '../utils/format';

const REFRESH_MS = 60 * 1000;
const RETRY_AFTER_ERROR_MS = 5 * 1000;
const STORAGE_KEY = 'insights-range';
const percentFormat = (value) => `${Math.round(value)}%`;
const COMPLAINT_ALERT_PERCENT = 20;

function readStoredRange() {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return RANGES.includes(stored) ? stored : 7;
  } catch {
    return 7; // storage can be blocked, the dashboard must still work
  }
}

function LoadingSkeleton() {
  const block = (className) => <div className={`animate-pulse rounded-2xl bg-stone-200/70 ${className}`} />;
  return (
    <div className="space-y-5" aria-busy="true" aria-label="Loading insights">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i}>{block('h-28')}</div>)}</div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">{[0, 1, 2, 3, 4, 5].map((i) => <div key={i}>{block('h-20')}</div>)}</div>
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">{block('h-64')}</div>
        {block('h-64')}
      </div>
    </div>
  );
}

export default function InsightsPage() {
  const navigate = useNavigate();
  const [days, setDays] = useState(readStoredRange);
  const [refreshTick, setRefreshTick] = useState(0);
  const [result, setResult] = useState({ key: '', data: null, at: null });
  const [error, setError] = useState('');

  // A result is "current" only if it was fetched for this range and this refresh. No setState runs
  // synchronously inside the effect: loading is derived, and state is set when the response arrives.
  const requestKey = `${days}:${refreshTick}`;
  const loading = result.key !== requestKey;
  const data = result.data;

  useEffect(() => {
    let cancelled = false;
    fetchInsights({ days })
      .then((response) => {
        if (cancelled) return;
        setResult({ key: requestKey, data: response, at: new Date() });
        setError('');
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [days, requestKey]);

  useEffect(() => {
    const timer = setInterval(() => setRefreshTick((tick) => tick + 1), REFRESH_MS);
    return () => clearInterval(timer);
  }, []);

  // While the last request failed (server restarting, brief network drop), try again every few
  // seconds instead of waiting for the next minute. It stops by itself once a request succeeds.
  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setRefreshTick((tick) => tick + 1), RETRY_AFTER_ERROR_MS);
    return () => clearTimeout(timer);
  }, [error, refreshTick]);

  function changeRange(next) {
    setDays(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      /* not remembering the range is fine */
    }
  }

  const goToLeads = (params) => navigate(`/leads?${new URLSearchParams(params)}`);

  const header = (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-2xl font-semibold text-stone-900">Sales overview</h1>
        <p className="text-xs text-stone-500">
          {result.at ? `Updated ${result.at.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })} · ` : ''}
          refreshes every minute
        </p>
      </div>
      <div className="flex items-center gap-2">
        <RangeToggle value={days} onChange={changeRange} />
        <button
          type="button"
          onClick={() => setRefreshTick((tick) => tick + 1)}
          disabled={loading}
          aria-label="Refresh now"
          className="rounded-xl border border-stone-200 bg-white p-2.5 text-stone-600 transition hover:bg-orange-50 disabled:opacity-60"
        >
          <RefreshIcon spinning={loading} />
        </button>
      </div>
    </div>
  );

  if (!data) {
    return (
      <div className="space-y-5">
        {header}
        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            <p className="font-medium">Could not load the dashboard.</p>
            <p className="mt-1">{error}</p>
            <button type="button" onClick={() => setRefreshTick((tick) => tick + 1)} className="mt-3 rounded-lg bg-red-600 px-3 py-1.5 text-white hover:bg-red-700">
              Try again
            </button>
          </div>
        ) : (
          <LoadingSkeleton />
        )}
      </div>
    );
  }

  const { trend, kpis } = data;
  const won = data.statusCounts.won || 0;
  const lost = data.statusCounts.lost || 0;
  const openLeads = (data.statusCounts.new || 0) + (data.statusCounts.contacted || 0) + (data.statusCounts.quoted || 0);
  const complaints = data.intentCounts.complaint || 0;

  return (
    <div className={`space-y-5 transition-opacity ${loading ? 'opacity-60' : ''}`}>
      {header}
      {error && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Showing the last loaded numbers. {error}</p>}

      {data.totalLeads === 0 && (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-white p-8 text-center">
          <p className="font-medium text-stone-800">No leads in the last {days} days.</p>
          <p className="mt-1 text-sm text-stone-500">Try a longer range, or answer a customer message to create the first lead.</p>
          <Link to="/" className="mt-4 inline-block rounded-xl bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700">
            Open the reply assistant
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total leads"
          value={data.totalLeads}
          icon={<UsersIcon />}
          tone="bg-sky-100 text-sky-700"
          delta={<Delta current={trend.current.leads} previous={trend.previous.leads} />}
          hint={`last ${days} days`}
          onClick={() => goToLeads({})}
        />
        <StatCard
          label="Win rate"
          value={data.winRate}
          format={percentFormat}
          icon={<TrophyIcon />}
          tone="bg-emerald-100 text-emerald-700"
          delta={<Delta mode="points" current={trend.current.winRate} previous={trend.previous.winRate} />}
          hint={`${won} won · ${lost} lost`}
          onClick={() => goToLeads({ status: 'won' })}
        />
        <StatCard
          label="Open pipeline"
          value={data.openValue}
          format={(value) => formatInr(Math.round(value))}
          icon={<HourglassIcon />}
          tone="bg-amber-100 text-amber-700"
          hint={`${openLeads} open ${openLeads === 1 ? 'lead' : 'leads'}`}
          onClick={() => goToLeads({ status: 'quoted' })}
        />
        <StatCard
          label="Won revenue"
          value={data.wonValue}
          format={(value) => formatInr(Math.round(value))}
          icon={<RupeeIcon />}
          tone="bg-orange-100 text-orange-700"
          delta={<Delta current={trend.current.wonValue} previous={trend.previous.wonValue} />}
          hint={`${won} won ${won === 1 ? 'deal' : 'deals'}`}
          onClick={() => goToLeads({ status: 'won' })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <MiniStat label="Avg quote" value={kpis.avgQuoteValue} format={(value) => formatInr(Math.round(value))} hint="per priced lead" />
        <MiniStat label="Avg deal" value={kpis.avgDealSize} format={(value) => formatInr(Math.round(value))} hint="per won lead" />
        <MiniStat
          label="Repeat customers"
          value={kpis.customers.repeat}
          hint={`of ${kpis.customers.total} customers`}
          bar={kpis.customers.total > 0 ? (kpis.customers.repeat / kpis.customers.total) * 100 : null}
          barColor="#0ea5e9"
        />
        <MiniStat
          label="Follow-ups due"
          value={kpis.followUpsDue}
          hint="quiet for 2+ days"
          alert={kpis.followUpsDue > 0}
          onClick={() => document.getElementById('follow-ups')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />
        <MiniStat
          label="Complaints"
          value={kpis.complaintRate}
          format={percentFormat}
          hint={`${complaints} of ${data.totalLeads} leads`}
          bar={kpis.complaintRate}
          barColor="#ef4444"
          alert={kpis.complaintRate !== null && kpis.complaintRate > COMPLAINT_ALERT_PERCENT}
          onClick={() => goToLeads({ intent: 'complaint' })}
        />
        <MiniStat label="AI replies" value={kpis.aiReplyRate} format={percentFormat} hint="rest used the safe template" bar={kpis.aiReplyRate} barColor="#10b981" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Panel title="Leads per day" subtitle="Hover a day for details, click to open its leads" className="lg:col-span-2">
          <AreaChart data={data.perDay} onSelect={(day) => goToLeads({ day })} />
        </Panel>
        <Panel title="Pipeline" subtitle="Click a status to open those leads">
          <DonutChart
            segments={STATUSES.map((status) => ({
              key: status.value,
              label: status.label,
              value: data.statusCounts[status.value] || 0,
              color: status.color,
            }))}
            onSelect={(status) => goToLeads({ status })}
          />
        </Panel>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Panel title="Most asked products" subtitle="Click a product to see who asked">
          <BarList
            items={data.topProducts.map((product) => ({ key: product.productId, label: product.name, value: product.count }))}
            onSelect={(item) => goToLeads({ q: item.label })}
            color="#f59e0b"
          />
        </Panel>
        <Panel title="What customers want" subtitle="Click a type to filter the leads">
          <BarList
            items={Object.entries(data.intentCounts)
              .map(([intent, count]) => ({ key: intent, label: INTENT_LABELS[intent] || intent, value: count }))
              .sort((a, b) => b.value - a.value)}
            onSelect={(item) => goToLeads({ intent: item.key })}
          />
        </Panel>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div id="follow-ups" className="min-w-0 scroll-mt-4 lg:col-span-2">
          <Panel
            title="Needs follow-up"
            subtitle="Contacted or quoted leads with no progress for 2+ days"
            action={
              kpis.followUpsDue > 0 && (
                <span className="flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                  <BellIcon /> {kpis.followUpsDue}
                </span>
              )
            }
          >
            <FollowUps
              items={data.followUps}
              total={kpis.followUpsDue}
              onOpen={(lead) => goToLeads({ status: lead.status, q: lead.phone || lead.customerName || lead.message })}
            />
          </Panel>
        </div>
        <Panel title="How replies were written" subtitle="AI wording vs the safe template">
          <BarList
            items={[
              { key: 'ai', label: 'AI, numbers verified', value: data.replySources.ai || 0 },
              { key: 'template', label: 'Safe template fallback', value: data.replySources.template || 0 },
            ]}
            color="#10b981"
          />
          <p className="mt-3 text-xs text-stone-500">A template is used when the AI is unavailable or its reply fails the price check.</p>
        </Panel>
      </div>
    </div>
  );
}
