// The catalogue the assistant quotes from: lookup by id, find product names inside a message,
// and suggest products when a customer is vague ("rudraksha chahiye").
//
// The list is kept in memory so every lookup stays instant and synchronous. It starts as the
// built-in sample list (so the app and the tests work without a database) and is replaced by the
// admin-managed products from MongoDB through setCatalogue() (see product.service.js).
import { PRICE_LIST } from '../data/priceList.js';
import { escapeRegExp, normalize } from '../utils/text.js';

let products = [];
let productsById = new Map();
// All (alias, product) pairs, longest alias first, so that
// "rudraksha mala" wins over a shorter alias that is inside it.
let aliasIndex = [];

// Generic words that point to a category but not to one product.
const CATEGORY_KEYWORDS = {
  rudraksha: ['rudraksha', 'rudraksh', 'mukhi', 'रुद्राक्ष'],
  gemstone: ['gemstone', 'gem stone', 'stone', 'ratna', 'ratan', 'रत्न'],
  spiritual: ['mala', 'yantra', 'shivling', 'माला', 'यंत्र'],
  puja: ['puja', 'pooja', 'pujan', 'पूजा'],
};

const isLatin = (text) => /^[\x00-\x7F]+$/.test(text);

// Latin words must match whole words ("moti" must not match "motivation", "mala" not "malayalam").
// A plural "s" is allowed. Hindi words use a plain substring match.
function wordRegExp(word, flags = '') {
  const body = escapeRegExp(word);
  return isLatin(word) ? new RegExp(`(?<![a-z0-9])${body}s?(?![a-z])`, flags) : new RegExp(body, flags);
}

const categoryMatchers = Object.entries(CATEGORY_KEYWORDS).map(([category, keywords]) => ({
  category,
  patterns: keywords.map((keyword) => wordRegExp(keyword)),
}));
const MALA_PATTERN = wordRegExp('mala');
const MALA_HINDI_PATTERN = /माला/;

// "neelam nahi chahiye": the customer is saying they do NOT want this product.
const NEGATION_AFTER =
  /^\s*(?:ka|ki|ko|wala|wali)?\s*(?:nahi|nahin|nhi|not|mat|नहीं)\s+(?:chahiye|chahie|chaiye|want|need|lena|चाहिए)/;

// Replaces the catalogue. Hidden products (active: false) are dropped, so they can never be quoted.
export function setCatalogue(list) {
  products = list
    .filter((product) => product.active !== false)
    .map((product) => ({
      ...product,
      hindiName: product.hindiName || product.name, // the Hindi reply falls back to the English name
      description: product.description || '',
      aliases: product.aliases || [],
    }));

  productsById = new Map(products.map((product) => [product.id, product]));
  aliasIndex = products
    .flatMap((product) => product.aliases.map((alias) => ({ alias: normalize(alias), product })))
    .filter(({ alias }) => alias.length > 0)
    .sort((a, b) => b.alias.length - a.alias.length);
}

setCatalogue(PRICE_LIST);

export function getAllProducts() {
  return products;
}

export function getProductById(id) {
  return productsById.get(id) || null;
}

function levenshtein(a, b) {
  const row = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    let previous = row[0];
    row[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const current = row[j];
      row[j] = Math.min(row[j] + 1, row[j - 1] + 1, previous + (a[i - 1] === b[j - 1] ? 0 : 1));
      previous = current;
    }
  }
  return row[b.length];
}

// Customers misspell names on WhatsApp ("pukhraaj", "panaa"). One wrong, missing or extra
// letter is accepted, but only for words of 5+ letters that start with the same letter,
// so short common words are never turned into a product.
function findTypoMentions(masked, alreadyFound) {
  const single = aliasIndex.filter(({ alias }) => alias.length >= 5 && isLatin(alias) && !alias.includes(' '));
  const found = [];

  for (const token of masked.matchAll(/[a-z]{5,}/g)) {
    const word = token[0];
    const hit = single.find(
      ({ alias, product }) =>
        !alreadyFound.has(product.id) &&
        word[0] === alias[0] &&
        Math.abs(word.length - alias.length) <= 1 &&
        levenshtein(word, alias) <= 1,
    );
    if (hit && !found.some((mention) => mention.product.id === hit.product.id)) {
      found.push({ product: hit.product, index: token.index, matchedText: word });
    }
  }
  return found;
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
  const rejected = new Set(); // products the customer said they do not want

  const blank = (index, length) => {
    masked = masked.slice(0, index) + ' '.repeat(length) + masked.slice(index + length);
  };

  for (const { alias, product } of aliasIndex) {
    if (rejected.has(product.id) || mentions.some((mention) => mention.product.id === product.id)) continue;
    const match = wordRegExp(alias, 'g').exec(masked);
    if (!match) continue;

    const rest = masked.slice(match.index + match[0].length);
    if (NEGATION_AFTER.test(rest)) rejected.add(product.id);
    else mentions.push({ product, index: match.index, matchedText: match[0] });
    blank(match.index, match[0].length);
  }

  const known = new Set([...mentions.map((mention) => mention.product.id), ...rejected]);
  for (const mention of findTypoMentions(masked, known)) {
    mentions.push(mention);
    blank(mention.index, mention.matchedText.length);
  }

  mentions.sort((a, b) => a.index - b.index);
  return { mentions, masked };
}

// Category a vague phrase belongs to, or null. "rudraksha" -> "rudraksha".
export function detectCategory(text) {
  const normalized = normalize(text);
  const match = categoryMatchers.find(({ patterns }) => patterns.some((pattern) => pattern.test(normalized)));
  return match ? match.category : null;
}

// Products we can offer when the customer did not name an exact one.
export function suggestProducts(text, limit = 4) {
  const normalized = normalize(text);

  // "mala 50 pcs" means malas, not yantras or shivlings from the same category.
  if (MALA_PATTERN.test(normalized) || MALA_HINDI_PATTERN.test(normalized)) {
    return products.filter((product) => product.unit === 'mala').slice(0, limit);
  }

  const category = detectCategory(text);
  if (!category) return [];
  return products.filter((product) => product.category === category).slice(0, limit);
}
