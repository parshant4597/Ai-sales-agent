import { getInsights } from '../services/insights.service.js';
import { parseDays } from '../validators/index.js';

// GET /api/insights?days=7|14|30
export async function getInsightsSummary(req, res) {
  res.json(await getInsights({ days: parseDays(req.query) }));
}
