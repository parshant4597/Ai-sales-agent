// Request validation. Controllers receive clean values or a 400 error.
import mongoose from 'mongoose';
import { LEAD_STATUSES, MAX_MESSAGE_LENGTH } from '../constants.js';
import { badRequest } from '../utils/httpError.js';

const asTrimmedString = (value) => (typeof value === 'string' ? value.trim() : '');

export function parseAnalyzeBody(body) {
  const message = asTrimmedString(body?.message);
  if (!message) throw badRequest('Paste the customer message first.');
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw badRequest(`Message is too long (max ${MAX_MESSAGE_LENGTH} characters).`);
  }

  const customerName = asTrimmedString(body?.customerName).slice(0, 80);
  const phone = asTrimmedString(body?.phone).replace(/[^\d+\s-]/g, '').slice(0, 20);

  return { message, customerName, phone };
}

export function parseObjectId(id) {
  if (!mongoose.isValidObjectId(id)) throw badRequest('Invalid lead id.');
  return id;
}

export function parseStatus(value) {
  if (!LEAD_STATUSES.includes(value)) {
    throw badRequest(`Status must be one of: ${LEAD_STATUSES.join(', ')}.`);
  }
  return value;
}

export function parseNote(body) {
  const text = asTrimmedString(body?.text);
  if (!text) throw badRequest('Note cannot be empty.');
  if (text.length > 500) throw badRequest('Note is too long (max 500 characters).');
  return text;
}

export function parseLeadFilters(query) {
  const filters = {};
  if (typeof query.status === 'string' && query.status !== 'all') filters.status = parseStatus(query.status);
  if (typeof query.q === 'string') filters.q = query.q.trim().slice(0, 100);
  return filters;
}
