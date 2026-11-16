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

export const MAX_MESSAGE_LENGTH = 1000;
export const MAX_ITEMS_PER_QUERY = 8;
export const MAX_QUANTITY = 100000;
