// The AI's JSON is untrusted input. This guard turns it into something safe:
//   - product ids that are not in the price list are dropped (no invented products)
//   - a quantity must really appear in the customer's message as a quantity, and be valid for
//     that product's unit (no invented numbers, and never the "10" of "10% discount")
//   - intent and language must be from our fixed lists
import { INTENTS, LANGUAGES, MAX_ITEMS_PER_QUERY } from '../../constants.js';
import { isValidQuantity } from '../../utils/quantity.js';
import { isMostlyDevanagari } from '../../utils/text.js';
import { getProductById } from '../catalogue.service.js';
import { quantityValuesIn } from './rules.js';

const asLowerText = (value) => String(value ?? '').toLowerCase().trim();

export function sanitizeAiExtraction(raw, message) {
  if (!raw || typeof raw !== 'object') return null;

  const quantitiesInMessage = new Set(quantityValuesIn(message));
  const seen = new Set();
  const items = [];

  for (const item of Array.isArray(raw.items) ? raw.items : []) {
    const productId = typeof item?.productId === 'string' ? item.productId.trim() : '';
    const product = getProductById(productId);
    if (!product || seen.has(productId)) continue;
    seen.add(productId);

    const quantity = Number(item.quantity);
    const isAcceptable = isValidQuantity(product.unit, quantity) && quantitiesInMessage.has(quantity);

    items.push({ productId, quantity: isAcceptable ? quantity : null });
    if (items.length === MAX_ITEMS_PER_QUERY) break;
  }

  const intent = INTENTS.find((candidate) => candidate === asLowerText(raw.intent)) ?? null;

  // The script decides "hindi": Devanagari text is Hindi, and Hindi in Roman letters is Hinglish.
  // The model may only choose between english and hinglish for Roman-script messages.
  const romanLanguages = LANGUAGES.filter((language) => language !== 'hindi');
  const language = isMostlyDevanagari(message)
    ? 'hindi'
    : (romanLanguages.find((candidate) => candidate === asLowerText(raw.language)) ?? null);

  return { intent, language, items };
}
