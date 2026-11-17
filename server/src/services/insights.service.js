// Numbers for the founders' dashboard, all computed inside MongoDB.
import { isDbConnected } from '../config/db.js';
import { Lead } from '../models/Lead.js';
import { fillDailySeries, lastDays, startOfDay } from '../utils/dates.js';
import { unavailable } from '../utils/httpError.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const TOP_PRODUCTS = 5;
const OPEN_STATUSES = ['new', 'contacted', 'quoted'];
const FOLLOW_UP_STATUSES = ['contacted', 'quoted'];
const FOLLOW_UP_AFTER_DAYS = 2;
const FOLLOW_UPS_SHOWN = 5;

const toCountMap = (rows) => Object.fromEntries(rows.map((row) => [row._id, row.count]));
const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : null);

// Win rate only counts leads that are closed, otherwise open leads would drag it down.
const winRateOf = (won, lost) => percent(won, won + lost);

// "current" is the chosen window, "previous" is the window of the same length just before it.
function buildTrend(rows) {
  const read = (period, field) => rows.find((row) => row._id === period)?.[field] || 0;
  const side = (period) => ({
    leads: read(period, 'count'),
    wonValue: read(period, 'wonValue'),
    winRate: winRateOf(read(period, 'won'), read(period, 'lost')),
  });
  return { current: side('current'), previous: side('previous') };
}

const sumIf = (status, field) => ({ $sum: { $cond: [{ $eq: ['$status', status] }, field, 0] } });

/**
 * days: how many days back to look (7, 14 or 30). Every number except the follow-up
 * list only counts leads created inside that window.
 */
export async function getInsights({ days = 7 } = {}) {
  if (!isDbConnected()) throw unavailable('Database is not connected. Check MONGODB_URI.');

  const dayKeys = lastDays(days);
  const since = startOfDay(dayKeys[0]);
  const previousSince = new Date(since.getTime() - days * DAY_MS);
  const followUpBefore = new Date(Date.now() - FOLLOW_UP_AFTER_DAYS * DAY_MS);
  const inRange = { $match: { createdAt: { $gte: since } } };
  const followUpFilter = { status: { $in: FOLLOW_UP_STATUSES }, createdAt: { $lte: followUpBefore } };

  const [byStatus, byIntent, bySource, topProducts, perDay, periods, quotes, customers, followUps, followUpsDue] =
    await Promise.all([
      Lead.aggregate([inRange, { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: { $ifNull: ['$quoteTotal', 0] } } } }]),
      Lead.aggregate([inRange, { $group: { _id: '$intent', count: { $sum: 1 } } }]),
      Lead.aggregate([inRange, { $group: { _id: '$replySource', count: { $sum: 1 } } }]),
      Lead.aggregate([
        inRange,
        { $unwind: '$quoteLines' },
        { $group: { _id: '$quoteLines.productId', name: { $first: '$quoteLines.name' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: TOP_PRODUCTS },
      ]),
      Lead.aggregate([
        inRange,
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'Asia/Kolkata' } }, count: { $sum: 1 } } },
      ]),
      Lead.aggregate([
        { $match: { createdAt: { $gte: previousSince } } },
        {
          $group: {
            _id: { $cond: [{ $gte: ['$createdAt', since] }, 'current', 'previous'] },
            count: { $sum: 1 },
            won: sumIf('won', 1),
            lost: sumIf('lost', 1),
            wonValue: sumIf('won', { $ifNull: ['$quoteTotal', 0] }),
          },
        },
      ]),
      // Only leads that actually got a price count towards the average quote.
      Lead.aggregate([inRange, { $match: { quoteTotal: { $gt: 0 } } }, { $group: { _id: null, count: { $sum: 1 }, value: { $sum: '$quoteTotal' } } }]),
      // One row per phone number: how many times each customer wrote in.
      Lead.aggregate([inRange, { $match: { phoneKey: { $ne: '' } } }, { $group: { _id: '$phoneKey', count: { $sum: 1 } } }]),
      // Leads that were contacted or quoted a while ago and never moved on: the team should chase these.
      Lead.find(followUpFilter).sort({ createdAt: 1 }).limit(FOLLOW_UPS_SHOWN).lean(),
      Lead.countDocuments(followUpFilter),
    ]);

  const statusCounts = toCountMap(byStatus);
  const intentCounts = toCountMap(byIntent);
  const replySources = toCountMap(bySource);
  const totalLeads = byStatus.reduce((sum, row) => sum + row.count, 0);
  const valueOf = (statuses) =>
    byStatus.filter((row) => statuses.includes(row._id)).reduce((sum, row) => sum + row.value, 0);

  const won = statusCounts.won || 0;
  const lost = statusCounts.lost || 0;
  const wonValue = valueOf(['won']);
  const quoted = quotes[0] || { count: 0, value: 0 };

  return {
    days,
    totalLeads,
    statusCounts,
    winRate: winRateOf(won, lost),
    openValue: valueOf(OPEN_STATUSES),
    wonValue,
    trend: buildTrend(periods),
    kpis: {
      avgQuoteValue: quoted.count > 0 ? Math.round(quoted.value / quoted.count) : null,
      avgDealSize: won > 0 ? Math.round(wonValue / won) : null,
      customers: { total: customers.length, repeat: customers.filter((row) => row.count >= 2).length },
      followUpsDue,
      complaintRate: percent(intentCounts.complaint || 0, totalLeads),
      aiReplyRate: percent(replySources.ai || 0, (replySources.ai || 0) + (replySources.template || 0)),
    },
    intentCounts,
    replySources,
    topProducts: topProducts.map(({ _id, name, count }) => ({ productId: _id, name, count })),
    perDay: fillDailySeries(perDay, dayKeys),
    followUps: followUps.map((lead) => ({
      id: String(lead._id),
      message: lead.message,
      customerName: lead.customerName,
      phone: lead.phone,
      status: lead.status,
      createdAt: lead.createdAt,
      quoteTotal: lead.quoteTotal,
    })),
  };
}
