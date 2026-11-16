// The whole pipeline for one customer message:
//   1. extract  - AI (guarded) or rules: intent, language, product ids, quantities
//   2. price    - plain code looks up tier prices from the price list
//   3. reply    - AI wording (guarded) or template
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

export async function analyzeMessage(message) {
  const extraction = await extractQuery(message);

  const { items, isSuggestion } = chooseItemsToQuote(extraction);
  const quote = { ...buildQuote(items), isSuggestion };

  const analysis = { intent: extraction.intent, language: extraction.language };
  const reply = await composeReply({ message, analysis, quote });

  return {
    intent: extraction.intent,
    language: extraction.language,
    extractionSource: extraction.source,
    quote,
    reply: reply.text,
    replySource: reply.source,
  };
}
