// Rule-based extractor. It is used when the AI is not configured, times out,
// hits a rate limit, or returns something the guard rejects, so the tool
// never goes down. It is also the source of truth for language detection.
import { MAX_ITEMS_PER_QUERY, MAX_QUANTITY } from '../../constants.js';
import { hasDevanagari, normalize } from '../../utils/text.js';
import { findProductMentions } from '../catalogue.service.js';

const NEAREST_NUMBER_MAX_DISTANCE = 30;
const BULK_QUANTITY_THRESHOLD = 50;

const HINGLISH_WORDS =
  /\b(kya|hai|hain|ka|ki|ke|chahiye|chahie|kitna|kitne|kimat|bhav|bhaav|rate|batao|bataiye|bhejo|bhej|dena|dijiye|karo|karna|mujhe|hume|humein|aapka|aap|nahi|nahin|abhi|wala|wali|ratti|pcs|kab|kahan|kaha|mila|aaya|paisa|sasta)\b/;

const INTENT_PATTERNS = [
  ['complaint', /(complaint|kharab|kharaab|fake|nakli|wapas|refund|galat|damage|toot|broken|cheat|dhokha|problem|not happy|bad quality|शिकायत|खराब|नकली|गलत|वापस)/],
  ['order_status', /(order status|my order|tracking|track |dispatch|kab aayega|kab tak|kahan hai|kaha hai|where is|not received|nahi aaya|नहीं आया|कब आएगा|कहाँ है)/],
  ['puja_booking', /(puja|pooja|पूजा)/],
  ['bulk_order', /(bulk|wholesale|thok|थोक|\bpcs\b|\bpieces\b|\bdozen\b)/],
  ['price_enquiry', /(rate|price|bhav|bhaav|kimat|kitna|kitne|cost|how much|रेट|भाव|कीमत|कितना)/],
  ['availability', /(available|availability|in stock|stock|uplabdh|hai kya|उपलब्ध)/],
];

export function detectLanguage(message) {
  if (hasDevanagari(message)) return 'hindi';
  return HINGLISH_WORDS.test(normalize(message)) ? 'hinglish' : 'english';
}

// Pairs each product mention with the closest number in the text (in the
// product's own unit, e.g. "5 ratti"). Numbers that are already part of a
// product name, such as "5 mukhi", were blanked out by findProductMentions.
function attachQuantities(mentions, masked) {
  const numbers = [...masked.matchAll(/\d+/g)].map((match) => ({
    value: Number(match[0]),
    index: match.index,
    used: false,
  }));

  return mentions.slice(0, MAX_ITEMS_PER_QUERY).map((mention) => {
    let closest = null;
    for (const number of numbers) {
      if (number.used || number.value < 1 || number.value > MAX_QUANTITY) continue;
      const distance = Math.abs(number.index - mention.index);
      if (distance <= NEAREST_NUMBER_MAX_DISTANCE && (!closest || distance < closest.distance)) {
        closest = { number, distance };
      }
    }
    if (closest) closest.number.used = true;
    return { productId: mention.product.id, quantity: closest ? closest.number.value : null };
  });
}

function detectIntent(message, items, looseQuantity) {
  const normalized = normalize(message);
  for (const [intent, pattern] of INTENT_PATTERNS) {
    if (pattern.test(normalized)) return intent;
  }
  const hasBigQuantity =
    items.some((item) => item.quantity >= BULK_QUANTITY_THRESHOLD) || looseQuantity >= BULK_QUANTITY_THRESHOLD;
  return hasBigQuantity ? 'bulk_order' : 'general';
}

export function extractWithRules(message) {
  const { mentions, masked } = findProductMentions(message);
  const items = attachQuantities(mentions, masked);
  const looseQuantity = items.length === 0 ? findLooseQuantity(masked) : null;

  return {
    intent: detectIntent(message, items, looseQuantity),
    language: detectLanguage(message),
    items,
  };
}

// "Rudraksha 100 pcs chahiye": no exact product, but one clear number.
export function findLooseQuantity(maskedOrMessage) {
  const numbers = [...normalize(maskedOrMessage).matchAll(/\d+/g)]
    .map((match) => Number(match[0]))
    .filter((value) => value >= 1 && value <= MAX_QUANTITY);
  return numbers.length === 1 ? numbers[0] : null;
}
