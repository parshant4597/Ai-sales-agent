// Customers often put two requests in one message:
//   "Order mein moti kharab mila, refund chahiye aur rudraksha 100 pcs chahiye"
// This splits the message into short parts and keeps only the ones that are NOT
// a complaint or an order-status question, so the sales part can be quoted on its own.
import { normalize } from '../../utils/text.js';
import { INTENT_PATTERNS } from './rules.js';

const SUPPORT_PATTERNS = INTENT_PATTERNS.filter(([intent]) => intent === 'complaint' || intent === 'order_status').map(
  ([, pattern]) => pattern,
);

const CLAUSE_SEPARATORS = /\s*(?:[,;.?!\n]|\band\b|\baur\b|\btatha\b|और)\s*/i;

const isSupportClause = (clause) => SUPPORT_PATTERNS.some((pattern) => pattern.test(normalize(clause)));

// '' when the whole message is only about the complaint / order status.
export function extractSalesPart(message) {
  return message
    .split(CLAUSE_SEPARATORS)
    .map((clause) => clause.trim())
    .filter((clause) => clause && !isSupportClause(clause))
    .join(', ');
}
