// Fixed lists shared by the AI guard, the rule-based fallback and the Lead model.

export const INTENTS = [
  'price_enquiry',
  'bulk_order',
  'availability',
  'puja_booking',
  'order_status',
  'complaint',
  'general',
];

export const LANGUAGES = ['english', 'hinglish', 'hindi'];

export const LEAD_STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];

// What a product's quantity counts. Fixed, because quantity rules (fractions only for ratti) depend on it.
export const UNITS = ['ratti', 'piece', 'mala', 'puja'];
export const MAX_TIERS = 5;
export const MAX_ALIASES = 20;
export const MAX_PRICE = 10_000_000;

export const USER_ROLES = ['admin', 'member'];
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 100;
export const SESSION_COOKIE = 'remedy_session';

export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_ITEMS_PER_QUERY = 8;
export const MAX_QUANTITY = 100000;
