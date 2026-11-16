import { analyzeMessage } from '../services/analyze.service.js';
import { saveLeadFromAnalysis } from '../services/lead.service.js';
import { parseAnalyzeBody } from '../validators/index.js';

// POST /api/replies  { message, customerName?, phone? }
export async function createReply(req, res) {
  const input = parseAnalyzeBody(req.body);

  const analysis = await analyzeMessage(input.message);
  const lead = await saveLeadFromAnalysis(input, analysis);

  res.json({ ...analysis, leadId: lead ? String(lead._id) : null });
}
