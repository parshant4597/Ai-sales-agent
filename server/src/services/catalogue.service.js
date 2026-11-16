// Read-only access to the price list: lookup by id, find product names inside
// a message, and suggest products when a customer is vague ("rudraksha chahiye").
import { PRICE_LIST } from '../data/priceList.js';
import { escapeRegExp, normalize } from '../utils/text.js';

const productsById = new Map(PRICE_LIST.map((product) => [product.id, product]));

// All (alias, product) pairs, longest alias first, so that
// "rudraksha mala" wins over a shorter alias that is inside it.
const aliasIndex = PRICE_LIST.flatMap((product) =>
  product.aliases.map((alias) => ({ alias: normalize(alias), product })),
).sort((a, b) => b.alias.length - a.alias.length);

// Generic words that point to a category but not to one product.
const CATEGORY_KEYWORDS = {
  rudraksha: ['rudraksha', 'rudraksh', 'mukhi', 'रुद्राक्ष'],
  gemstone: ['gemstone', 'gem stone', 'stone', 'ratna', 'ratan', 'रत्न'],
  spiritual: ['mala', 'yantra', 'shivling', 'माला', 'यंत्र'],
  puja: ['puja', 'pooja', 'pujan', 'पूजा'],
};

export function getAllProducts() {
  return PRICE_LIST;
}

export function getProductById(id) {
  return productsById.get(id) || null;
}

// Aliases written in Latin letters must match whole words ("moti" must not
// match "motivation"). Hindi aliases use a plain substring match.
function buildAliasRegExp(alias) {
  const isLatin = /^[\x00-\x7F]+$/.test(alias);
  const body = escapeRegExp(alias);
  return isLatin ? new RegExp(`(?<![a-z0-9])${body}(?![a-z])`, 'g') : new RegExp(body, 'g');
}

/**
 * Finds every catalogue product mentioned in a message.
 * Returns [{ product, index, matchedText }] plus the message with those
 * mentions blanked out (same length), so callers can look for quantities
 * without confusing "5 mukhi" with "5 pieces".
 */
export function findProductMentions(message) {
  let masked = normalize(message);
  const mentions = [];

  for (const { alias, product } of aliasIndex) {
    if (mentions.some((mention) => mention.product.id === product.id)) continue;
    const match = buildAliasRegExp(alias).exec(masked);
    if (!match) continue;

    mentions.push({ product, index: match.index, matchedText: match[0] });
    masked =
      masked.slice(0, match.index) + ' '.repeat(match[0].length) + masked.slice(match.index + match[0].length);
  }

  mentions.sort((a, b) => a.index - b.index);
  return { mentions, masked };
}

// Category a vague phrase belongs to, or null. "rudraksha" -> "rudraksha".
export function detectCategory(text) {
  const normalized = normalize(text);
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(keyword))) return category;
  }
  return null;
}

// Products we can offer when the customer did not name an exact one.
export function suggestProducts(text, limit = 4) {
  const category = detectCategory(text);
  if (!category) return [];
  return PRICE_LIST.filter((product) => product.category === category).slice(0, limit);
}
