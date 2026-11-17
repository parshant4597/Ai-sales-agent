// The whole pipeline for one customer message:
//   1. extract  - AI (guarded) or rules: intent, language, product ids, quantities
//   2. price    - plain code looks up tier prices from the price list
//   3. reply    - AI wording (guarded) or template
import { cleanMessage } from '../utils/messageCleaner.js';
import { extractSalesPart } from './extraction/clauses.js';
import { extractQuery } from './extraction/index.js';
import { buildQuote } from './pricing.service.js';
import { composeReply } from './reply/index.js';

// Without an exact product, quote the suggested category products (at the
// customer's lone number if they gave one), so the agent still has real prices.
function chooseItemsToQuote(extraction) {
  if (extraction.items.length > 0) return { items: extraction.items, isSuggestion: false };

  const items = extraction.suggestions.map((productId) => ({
    productId,
    quantity: extraction.looseQuantity,
  }));
  return { items, isSuggestion: items.length > 0 };
}

const SUPPORT_INTENTS = new Set(['complaint', 'order_status']);

// A support message can hide a second, sales request in it. The support part keeps its own
// reply text and the sales part is extracted separately, so neither request is dropped.
async function extractWithSalesFollowUp(message) {
  const extraction = await extractQuery(message);
  if (!SUPPORT_INTENTS.has(extraction.intent)) return extraction;

  // A product named in a complaint is the one that went wrong, so it is never quoted.
  const supportOnly = { ...extraction, items: [], category: null, looseQuantity: null, suggestions: [] };

  const salesPart = extractSalesPart(message);
  if (!salesPart) return supportOnly;

  const { items, category, looseQuantity, suggestions } = await extractQuery(salesPart);
  return { ...supportOnly, items, category, looseQuantity, suggestions };
}

// customer: { customerName, isReturning } is only used to personalise the greeting.
export async function analyzeMessage(message, customer = {}) {
  // The extractor and the AI work on cleaned text: no WhatsApp timestamps, "paanch" -> 5, "1,000" -> 1000.
  const text = cleanMessage(message);
  const extraction = await extractWithSalesFollowUp(text);

  const { items, isSuggestion } = chooseItemsToQuote(extraction);
  const built = buildQuote(items);
  // Suggested options are alternatives, so adding them into one total would be misleading.
  const quote = { ...built, total: isSuggestion ? null : built.total, isSuggestion };

  const analysis = {
    intent: extraction.intent,
    language: extraction.language,
    customerName: customer.customerName || '',
    isReturning: Boolean(customer.isReturning),
  };
  const reply = await composeReply({ message: text, analysis, quote });

  return {
    intent: extraction.intent,
    language: extraction.language,
    extractionSource: extraction.source,
    quote,
    reply: reply.text,
    replySource: reply.source,
  };
}
