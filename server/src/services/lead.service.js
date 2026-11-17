// Everything that touches the leads collection.
//
// Who sees what: every lead remembers the team member who answered that customer (createdBy).
// A member only ever works with their own leads. An admin works with all of them.
import { isDbConnected } from '../config/db.js';
import { Lead } from '../models/Lead.js';
import { startOfDay } from '../utils/dates.js';
import { notFound, unavailable } from '../utils/httpError.js';
import { escapeRegExp, toPhoneKey } from '../utils/text.js';

const LIST_LIMIT = 200;
const DAY_MS = 24 * 60 * 60 * 1000;
const HISTORY_SHOWN = 3;
export const UNASSIGNED = 'none'; // ?agent=none: leads from before accounts existed

function requireDb() {
  if (!isDbConnected()) throw unavailable('Database is not connected. Check MONGODB_URI.');
}

/** The MongoDB filter that limits a query to what this person may see. Added to EVERY lead query. */
export const leadScope = (user) => (user.role === 'admin' ? {} : { createdBy: user._id });

// Keep only what a lead needs from the full quote.
function toQuoteLines(quote) {
  return quote.lines.map(({ productId, name, unit, quantity, unitPrice, lineTotal }) => ({
    productId,
    name,
    unit,
    quantity,
    unitPrice,
    lineTotal,
  }));
}

/**
 * Saves every analysed query as a lead (the assignment bonus), owned by the agent who answered it.
 * Returns null instead of throwing when the DB is down, so the agent still gets their reply.
 */
export async function saveLeadFromAnalysis({ message, customerName, phone }, analysis, user) {
  if (!isDbConnected()) return null;
  try {
    return await Lead.create({
      message,
      customerName,
      phone,
      phoneKey: toPhoneKey(phone),
      intent: analysis.intent,
      language: analysis.language,
      quoteLines: toQuoteLines(analysis.quote),
      quoteTotal: analysis.quote.total,
      reply: analysis.reply,
      extractionSource: analysis.extractionSource,
      replySource: analysis.replySource,
      createdBy: user._id,
      createdByName: user.name,
    });
  } catch (error) {
    console.error('[leads] Could not save lead:', error.message);
    return null;
  }
}

/**
 * Earlier enquiries from the same phone number, or null for a new customer.
 * A member only sees their own earlier enquiries (the same rule as the Leads page).
 * Never throws: personalisation is a bonus, so a database problem must not block the reply.
 */
export async function getCustomerHistory(phone, user) {
  const phoneKey = toPhoneKey(phone);
  if (!phoneKey || !isDbConnected()) return null;

  const filter = { phoneKey, ...leadScope(user) };
  try {
    const [recent, enquiries] = await Promise.all([
      Lead.find(filter).sort({ createdAt: -1 }).limit(HISTORY_SHOWN).lean(),
      Lead.countDocuments(filter),
    ]);
    if (recent.length === 0) return null;

    return {
      name: recent.find((lead) => lead.customerName)?.customerName || '',
      enquiries,
      recent: recent.map((lead) => ({
        id: String(lead._id),
        message: lead.message,
        createdAt: lead.createdAt,
        status: lead.status,
        quoteTotal: lead.quoteTotal,
        products: lead.quoteLines.map((line) => line.name),
      })),
    };
  } catch (error) {
    console.warn('[leads] Could not load customer history:', error.message);
    return null;
  }
}

export async function listLeads({ status, q, intent, day, agent }, user) {
  requireDb();

  // The scope comes first and cannot be overridden: a member's ?agent=... is simply ignored.
  const scope = leadScope(user);
  if (user.role === 'admin' && agent) scope.createdBy = agent === UNASSIGNED ? null : agent;

  const filter = { ...scope };
  if (status) filter.status = status;
  if (intent) filter.intent = intent;
  if (day) {
    const start = startOfDay(day); // one Indian calendar day
    filter.createdAt = { $gte: start, $lt: new Date(start.getTime() + DAY_MS) };
  }

  if (q) {
    const pattern = new RegExp(escapeRegExp(q), 'i');
    filter.$or = [
      { message: pattern },
      { customerName: pattern },
      { phone: pattern },
      { 'quoteLines.name': pattern },
    ];
  }

  const [leads, counts] = await Promise.all([
    Lead.find(filter).sort({ createdAt: -1 }).limit(LIST_LIMIT).lean(),
    // The tab numbers follow the same scope, so a member never sees counts of leads they cannot open.
    Lead.aggregate([{ $match: scope }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const statusCounts = Object.fromEntries(counts.map(({ _id, count }) => [_id, count]));
  return { leads, statusCounts };
}

// A lead outside the person's scope is reported as "not found", so its existence is not revealed.
async function updateLead(id, update, user) {
  requireDb();
  const lead = await Lead.findOneAndUpdate({ _id: id, ...leadScope(user) }, update, { new: true, runValidators: true }).lean();
  if (!lead) throw notFound('Lead not found.');
  return lead;
}

export const updateLeadStatus = (id, status, user) => updateLead(id, { status }, user);

export const addLeadNote = (id, text, user) => updateLead(id, { $push: { notes: { text } } }, user);
