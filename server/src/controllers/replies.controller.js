import { analyzeMessage } from '../services/analyze.service.js';
import { getCustomerHistory, saveLeadFromAnalysis } from '../services/lead.service.js';
import { cleanName } from '../utils/text.js';
import { parseAnalyzeBody } from '../validators/index.js';

// POST /api/replies  { message, customerName?, phone? }
export async function createReply(req, res) {
  const input = parseAnalyzeBody(req.body);

  // Look up past enquiries BEFORE saving this one, so the new lead is not counted as history.
  const customer = await getCustomerHistory(input.phone, req.user);
  const customerName = cleanName(input.customerName || customer?.name);

  const analysis = await analyzeMessage(input.message, { customerName, isReturning: Boolean(customer) });
  const lead = await saveLeadFromAnalysis({ ...input, customerName }, analysis, req.user);

  res.json({ ...analysis, customer, leadId: lead ? String(lead._id) : null });
}
