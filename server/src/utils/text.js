// Small text helpers used by the rule-based extractor and the reply guard.

const DEVANAGARI_DIGITS = '०१२३४५६७८९';

// "१२" -> "12", so Hindi replies can be checked like English ones.
export function toAsciiDigits(text) {
  return text.replace(/[०-९]/g, (digit) => String(DEVANAGARI_DIGITS.indexOf(digit)));
}

// Lowercase, ASCII digits, single spaces. Keeps string length stable enough for matching.
export function normalize(text) {
  return toAsciiDigits(String(text)).toLowerCase().replace(/\s+/g, ' ').trim();
}

// Every number written in the text, as JS numbers. "₹1,800" -> 1800.
export function extractNumbers(text) {
  const cleaned = toAsciiDigits(String(text)).replace(/(\d),(?=\d)/g, '$1');
  const matches = cleaned.match(/\d+(?:\.\d+)?/g) || [];
  return matches.map(Number);
}

export function hasDevanagari(text) {
  return /[ऀ-ॿ]/.test(text);
}

export function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ₹1,23,456 (Indian grouping)
export function formatInr(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}
