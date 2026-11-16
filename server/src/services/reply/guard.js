// The AI reply is untrusted text. It is accepted only if every number in it
// comes from the verified quote, and the quoted unit prices are really there.
import { extractNumbers, toAsciiDigits } from '../../utils/text.js';

const MAX_REPLY_LENGTH = 1200;

// Every figure the reply is allowed to contain.
export function collectAllowedNumbers(quote) {
  const allowed = new Set();
  for (const line of quote.lines) {
    // Digits inside product names ("5 Mukhi", "108 beads") are fine to repeat.
    extractNumbers(`${line.name} ${line.hindiName}`).forEach((value) => allowed.add(value));
    allowed.add(line.unitPrice);
    if (line.quantity !== null) allowed.add(line.quantity);
    if (line.lineTotal !== null) allowed.add(line.lineTotal);
    for (const tier of line.tiers) {
      allowed.add(tier.minQty);
      allowed.add(tier.price);
    }
  }
  if (quote.total !== null) allowed.add(quote.total);
  return allowed;
}

/**
 * Returns { ok: true } or { ok: false, reason }.
 * The reason is only logged; the caller falls back to the template reply.
 */
export function validateAiReply(reply, quote) {
  if (typeof reply !== 'string') return { ok: false, reason: 'reply is not text' };

  const text = reply.trim();
  if (text.length === 0 || text.length > MAX_REPLY_LENGTH) return { ok: false, reason: 'bad length' };
  if (/https?:\/\/|www\./i.test(text)) return { ok: false, reason: 'contains a link' };

  const allowed = collectAllowedNumbers(quote);
  const numbersInReply = extractNumbers(text);

  const stranger = numbersInReply.find((value) => !allowed.has(value));
  if (stranger !== undefined) return { ok: false, reason: `number ${stranger} is not in the quote` };

  // Every unit price we computed must be quoted, so the reply cannot silently skip a price.
  const written = new Set(numbersInReply);
  const missing = quote.lines.find((line) => !written.has(line.unitPrice));
  if (missing) return { ok: false, reason: `price for ${missing.productId} is missing` };

  return { ok: true };
}

// Exposed for tests.
export { toAsciiDigits };
