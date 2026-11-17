// Request validation. Controllers receive clean values or a 400 error.
import mongoose from 'mongoose';
import {
  INTENTS,
  LEAD_STATUSES,
  MAX_MESSAGE_LENGTH,
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  USER_ROLES,
} from '../constants.js';
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
  if (!mongoose.isValidObjectId(id)) throw badRequest('Invalid id.');
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

const DAY_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const ALLOWED_RANGES = [7, 14, 30];

// Only plain strings are accepted: ?q[$ne]=x arrives as an object and is ignored.
export function parseLeadFilters(query) {
  const filters = {};
  if (typeof query.status === 'string' && query.status !== 'all') filters.status = parseStatus(query.status);
  if (typeof query.q === 'string') filters.q = query.q.trim().slice(0, 100);

  if (typeof query.intent === 'string' && query.intent !== 'all') {
    if (!INTENTS.includes(query.intent)) throw badRequest(`Intent must be one of: ${INTENTS.join(', ')}.`);
    filters.intent = query.intent;
  }

  // Admin-only filter: one team member's leads, or "none" for leads that have no owner.
  if (typeof query.agent === 'string' && query.agent && query.agent !== 'all') {
    filters.agent = query.agent === 'none' ? 'none' : parseObjectId(query.agent);
  }

  if (typeof query.day === 'string' && query.day) {
    if (!DAY_FORMAT.test(query.day) || Number.isNaN(Date.parse(query.day))) {
      throw badRequest('Day must look like 2026-11-16.');
    }
    filters.day = query.day;
  }
  return filters;
}

const EMAIL_FORMAT = /^[^\s@]+@[^\s@]+$/;

const parseEmail = (value) => {
  const email = asTrimmedString(value).toLowerCase();
  if (!EMAIL_FORMAT.test(email) || email.length > 120) throw badRequest('Enter a valid email address.');
  return email;
};

// A new password must be long enough. (A login attempt only needs to be a non-empty string.)
export function parsePassword(value) {
  if (typeof value !== 'string' || value.length < MIN_PASSWORD_LENGTH || value.length > MAX_PASSWORD_LENGTH) {
    throw badRequest(`Password must be ${MIN_PASSWORD_LENGTH} to ${MAX_PASSWORD_LENGTH} characters.`);
  }
  return value;
}

export function parseLoginBody(body) {
  const password = body?.password;
  if (typeof password !== 'string' || password.length === 0 || password.length > MAX_PASSWORD_LENGTH) {
    throw badRequest('Enter your email and password.');
  }
  return { email: parseEmail(body?.email), password };
}

export function parseNewUser(body) {
  const name = asTrimmedString(body?.name);
  if (!name || name.length > 60) throw badRequest('Name is required (60 characters at most).');

  const role = body?.role === undefined ? 'member' : body.role;
  if (!USER_ROLES.includes(role)) throw badRequest(`Role must be one of: ${USER_ROLES.join(', ')}.`);

  return { name, email: parseEmail(body?.email), password: parsePassword(body?.password), role };
}

export function parseDays(query) {
  const days = query.days === undefined ? 7 : Number(query.days);
  if (!ALLOWED_RANGES.includes(days)) throw badRequest(`days must be one of: ${ALLOWED_RANGES.join(', ')}.`);
  return days;
}
