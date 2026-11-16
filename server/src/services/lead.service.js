// Everything that touches the leads collection.
import { isDbConnected } from '../config/db.js';
import { Lead } from '../models/Lead.js';
import { notFound, unavailable } from '../utils/httpError.js';
import { escapeRegExp } from '../utils/text.js';

const LIST_LIMIT = 200;

function requireDb() {
  if (!isDbConnected()) throw unavailable('Database is not connected. Check MONGODB_URI.');
}

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
 * Saves every analysed query as a lead (the assignment bonus).
 * Returns null instead of throwing when the DB is down, so the agent still
 * gets their reply.
 */
export async function saveLeadFromAnalysis({ message, customerName, phone }, analysis) {
  if (!isDbConnected()) return null;
  try {
    const lead = await Lead.create({
      message,
      customerName,
      phone,
      intent: analysis.intent,
      language: analysis.language,
      quoteLines: toQuoteLines(analysis.quote),
      quoteTotal: analysis.quote.total,
      reply: analysis.reply,
      extractionSource: analysis.extractionSource,
      replySource: analysis.replySource,
    });
    return lead;
  } catch (error) {
    console.error('[leads] Could not save lead:', error.message);
    return null;
  }
}

export async function listLeads({ status, q }) {
  requireDb();
  const filter = {};
  if (status) filter.status = status;

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
    Lead.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);

  const statusCounts = Object.fromEntries(counts.map(({ _id, count }) => [_id, count]));
  return { leads, statusCounts };
}

async function updateLead(id, update) {
  requireDb();
  const lead = await Lead.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
  if (!lead) throw notFound('Lead not found.');
  return lead;
}

export const updateLeadStatus = (id, status) => updateLead(id, { status });

export const addLeadNote = (id, text) => updateLead(id, { $push: { notes: { text } } });
