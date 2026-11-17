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

// Last 10 digits, so "+91 98765-43210" and "9876543210" are the same customer. '' if too short.
export function toPhoneKey(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : '';
}

// A name is typed by a person and ends up inside an AI prompt and a greeting,
// so keep it short and strip digits, line breaks and angle brackets.
export function cleanName(name) {
  return String(name || '')
    .replace(/[\d\r\n<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
}

// "नीलम का रेट" is Hindi; "Neelam का rate 5 ratti" is mostly Roman letters, so it is Hinglish.
export function isMostlyDevanagari(text) {
  const devanagari = (text.match(/[ऀ-ॿ]/g) || []).length;
  const latin = (text.match(/[a-zA-Z]/g) || []).length;
  return devanagari > 0 && devanagari / (devanagari + latin) >= 0.3;
}

export function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ₹1,23,456 (Indian grouping)
export function formatInr(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}
