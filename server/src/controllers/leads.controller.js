import { LEAD_STATUSES } from '../constants.js';
import { addLeadNote, listLeads, updateLeadStatus } from '../services/lead.service.js';
import { parseLeadFilters, parseNote, parseObjectId, parseStatus } from '../validators/index.js';

// GET /api/leads?status=&q=&intent=&day=&agent=   (a member only gets their own leads)
export async function getLeads(req, res) {
  const { leads, statusCounts } = await listLeads(parseLeadFilters(req.query), req.user);
  res.json({ leads, statusCounts, statuses: LEAD_STATUSES });
}

// PATCH /api/leads/:id  { status }
export async function patchLead(req, res) {
  const id = parseObjectId(req.params.id);
  const status = parseStatus(req.body?.status);
  res.json(await updateLeadStatus(id, status, req.user));
}

// POST /api/leads/:id/notes  { text }
export async function postLeadNote(req, res) {
  const id = parseObjectId(req.params.id);
  const text = parseNote(req.body);
  res.status(201).json(await addLeadNote(id, text, req.user));
}
