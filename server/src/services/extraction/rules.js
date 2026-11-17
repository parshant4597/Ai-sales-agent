// Rule-based extractor. It is used when the AI is not configured, times out,
// hits a rate limit, or returns something the guard rejects, so the tool
// never goes down. It is also the source of truth for language detection.
import { MAX_ITEMS_PER_QUERY, MAX_QUANTITY } from '../../constants.js';
import { isValidQuantity } from '../../utils/quantity.js';
import { isMostlyDevanagari, normalize } from '../../utils/text.js';
import { findProductMentions } from '../catalogue.service.js';

const NEAREST_NUMBER_MAX_DISTANCE = 30;
const BULK_QUANTITY_THRESHOLD = 50;

// Words only Hindi speakers write in Roman letters. Words that are also English or product
// words (rate, ratti, pcs) are NOT here, or an English message would be called Hinglish.
const HINGLISH_WORDS =
  /\b(kya|hai|hain|ka|ki|ke|ko|chahiye|chahie|chaiye|kitna|kitne|kimat|bhav|bhaav|batao|bataiye|bhejo|bhej|dena|dijiye|karo|karna|mujhe|hume|humein|aapka|aap|nahi|nahin|abhi|wala|wali|kab|kahan|kaha|mila|aaya|paisa|sasta|bhai|bhaiya|aur|mein|liye|hoti|milega|milegi|dono|thoda|zyada)\b/;

const PRICE_WORDS = 'rate|price|bhav|bhaav|kimat|cost|रेट|भाव|कीमत';

// Order matters: the first pattern that matches decides the intent.
export const INTENT_PATTERNS = [
  ['complaint', /(complaint|kharab|kharaab|fake|nakli|wapas|refund|galat|damage|toot|broken|cheat|dhokha|problem|not happy|bad quality|शिकायत|खराब|नकली|गलत|वापस)/],
  ['order_status', /(order status|my order|tracking|track |dispatch|kab aayega|kab tak|kahan hai|kaha hai|where is|not received|nahi aaya|नहीं आया|कब आएगा|कहाँ है)/],
  // Booking a puja needs a booking word. "Kaal sarp puja ka rate" is only a price question.
  ['puja_booking', /(?=[\s\S]*(?:puja|pooja|पूजा))(?=[\s\S]*(?:book|karwa|karva|karani|karni|karna|कराना|करवा|करानी|करनी|बुक))/],
  ['bulk_order', /(bulk|wholesale|thok|थोक)/],
  // Delivery, payment and authenticity questions are not price questions, unless a price word is also there.
  ['general', new RegExp(`^(?![\\s\\S]*(?:${PRICE_WORDS}))[\\s\\S]*(?:deliver|shipping|courier|cash on delivery|\\bcod\\b|payment|certificate|\\blab\\b|asli|authentic|genuine|original|\\bgst\\b|invoice|\\bbill\\b|डिलीवरी|असली|सर्टिफिकेट)`)],
  ['price_enquiry', /(rate|price|bhav|bhaav|kimat|kitna|kitne|cost|how much|discount|kam kar|sasta|रेट|भाव|कीमत|कितना|छूट|कम कर)/],
  ['availability', /(available|availability|in stock|stock|uplabdh|hai kya|उपलब्ध)/],
];

export function detectLanguage(message) {
  if (isMostlyDevanagari(message)) return 'hindi';
  // Some Devanagari mixed into Roman text ("Neelam का rate") is Hinglish too.
  if (/[ऀ-ॿ]/.test(message)) return 'hinglish';
  return HINGLISH_WORDS.test(normalize(message)) ? 'hinglish' : 'english';
}

// Numbers that are NOT a quantity: money, percentages, days, weights, dates, times, "11 mukhi".
const NOT_A_QUANTITY_AFTER =
  /^\s*(?:rs\b|rupees?\b|rupaye\b|rupay\b|₹|\/-|%|percent\b|din\b|days?\b|hafte\b|weeks?\b|mahine\b|months?\b|saal\b|years?\b|kgs?\b|kilo\b|gms?\b|grams?\b|g\b|carats?\b|karats?\b|ct\b|inch\b|cm\b|mm\b|baje\b|am\b|pm\b|budget\b|mukhi\b|mukh\b|मुखी|[/:]\s*\d)/;
const NOT_A_QUANTITY_BEFORE = /(?:rs\.?|inr|₹|rupees?|budget)\s*$|\d\s*[/:]\s*$/;

function isNotAQuantity(text, match) {
  const before = text.slice(0, match.index);
  const after = text.slice(match.index + match[0].length);
  return NOT_A_QUANTITY_BEFORE.test(before) || NOT_A_QUANTITY_AFTER.test(after);
}

// Every number in the text that could be a quantity, with its position.
function findQuantityNumbers(text) {
  return [...text.matchAll(/\d+(?:\.\d+)?/g)]
    .filter((match) => !isNotAQuantity(text, match))
    .map((match) => ({ value: Number(match[0]), index: match.index }))
    .filter((number) => number.value > 0 && number.value <= MAX_QUANTITY);
}

// The AI guard uses this too: a quantity from the AI must be one of these.
export function quantityValuesIn(text) {
  return findQuantityNumbers(normalize(text)).map((number) => number.value);
}

// Pairs each product mention with the closest number in the text (in the
// product's own unit, e.g. "5 ratti"). Numbers that are already part of a
// product name, such as "5 mukhi", were blanked out by findProductMentions.
function attachQuantities(mentions, masked) {
  const numbers = findQuantityNumbers(masked).map((number) => ({ ...number, used: false }));

  return mentions.slice(0, MAX_ITEMS_PER_QUERY).map((mention) => {
    let closest = null;
    for (const number of numbers) {
      if (number.used) continue;
      const distance = Math.abs(number.index - mention.index);
      if (distance <= NEAREST_NUMBER_MAX_DISTANCE && (!closest || distance < closest.distance)) {
        closest = { number, distance };
      }
    }
    if (closest) closest.number.used = true;

    const quantity = closest && isValidQuantity(mention.product.unit, closest.number.value) ? closest.number.value : null;
    return { productId: mention.product.id, quantity };
  });
}

function detectIntent(message, items, looseQuantity) {
  const normalized = normalize(message);
  for (const [intent, pattern] of INTENT_PATTERNS) {
    if (pattern.test(normalized)) return intent;
  }

  const hasBigQuantity =
    items.some((item) => item.quantity >= BULK_QUANTITY_THRESHOLD) || looseQuantity >= BULK_QUANTITY_THRESHOLD;
  if (hasBigQuantity) return 'bulk_order';

  // "Neelam 5 ratti" says no keyword, but a product with a quantity is clearly a price question.
  const hasQuantity = items.some((item) => item.quantity !== null) || looseQuantity !== null;
  return hasQuantity ? 'price_enquiry' : 'general';
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

// "Rudraksha 100 pcs chahiye": no exact product, but one clear whole number.
export function findLooseQuantity(maskedOrMessage) {
  const numbers = findQuantityNumbers(normalize(maskedOrMessage)).filter((number) => Number.isInteger(number.value));
  return numbers.length === 1 ? numbers[0].value : null;
}
