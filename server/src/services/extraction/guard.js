// The AI's JSON is untrusted input. This guard turns it into something safe:
//   - product ids that are not in the price list are dropped (no invented products)
//   - a quantity must really appear in the customer's message (no invented numbers)
//   - intent and language must be from our fixed lists
import { INTENTS, LANGUAGES, MAX_ITEMS_PER_QUERY, MAX_QUANTITY } from '../../constants.js';
import { extractNumbers, hasDevanagari } from '../../utils/text.js';
import { getProductById } from '../catalogue.service.js';

export function sanitizeAiExtraction(raw, message) {
  if (!raw || typeof raw !== 'object') return null;

  const numbersInMessage = new Set(extractNumbers(message));
  const seen = new Set();
  const items = [];

  for (const item of Array.isArray(raw.items) ? raw.items : []) {
    const productId = typeof item?.productId === 'string' ? item.productId.trim() : '';
    if (!getProductById(productId) || seen.has(productId)) continue;
    seen.add(productId);

    const quantity = Number(item.quantity);
    const isValidQuantity =
      Number.isInteger(quantity) && quantity >= 1 && quantity <= MAX_QUANTITY && numbersInMessage.has(quantity);

    items.push({ productId, quantity: isValidQuantity ? quantity : null });
    if (items.length === MAX_ITEMS_PER_QUERY) break;
  }

  const intent = INTENTS.includes(raw.intent) ? raw.intent : null;
  // A Devanagari message is Hindi no matter what the model says.
  const language = hasDevanagari(message) ? 'hindi' : LANGUAGES.includes(raw.language) ? raw.language : null;

  return { intent, language, items };
}
