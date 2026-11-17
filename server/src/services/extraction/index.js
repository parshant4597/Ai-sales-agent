// Step 1 of the pipeline: message -> { intent, language, items, category, ... }.
// AI first, guarded; rule-based fallback whenever the AI is unavailable or unsafe.
import { isAiConfigured, requestJson } from '../ai.client.js';
import { detectCategory, suggestProducts } from '../catalogue.service.js';
import { sanitizeAiExtraction } from './guard.js';
import { buildExtractionSystemPrompt, buildExtractionUserPrompt } from './prompt.js';
import { extractWithRules, findLooseQuantity } from './rules.js';

async function extractWithAi(message, rules) {
  const raw = await requestJson({
    system: buildExtractionSystemPrompt(),
    user: buildExtractionUserPrompt(message),
  });
  const safe = sanitizeAiExtraction(raw, message);
  if (!safe) return null;

  // If the AI missed a product or a quantity that plain rules can see, keep the rules' answer.
  const rulesQuantity = new Map(rules.items.map((item) => [item.productId, item.quantity]));
  const items = (safe.items.length > 0 ? safe.items : rules.items).map((item) => ({
    productId: item.productId,
    quantity: item.quantity ?? rulesQuantity.get(item.productId) ?? null,
  }));

  return {
    intent: safe.intent ?? rules.intent,
    language: safe.language ?? rules.language,
    items,
  };
}

export async function extractQuery(message) {
  const rules = extractWithRules(message);
  let extraction = rules;
  let source = 'rules';

  if (isAiConfigured()) {
    try {
      const aiResult = await extractWithAi(message, rules);
      if (aiResult) {
        extraction = aiResult;
        source = 'ai';
      }
    } catch (error) {
      console.warn(`[extraction] AI failed, using rules instead: ${error.message}`);
    }
  }

  // No exact product named: remember the category ("rudraksha") and a lone number ("100")
  // so the reply can still show real options at that quantity.
  const hasItems = extraction.items.length > 0;
  const category = hasItems ? null : detectCategory(message);
  const looseQuantity = hasItems || !category ? null : findLooseQuantity(message);
  const suggestions = category ? suggestProducts(message).map((product) => product.id) : [];

  // "Neelam 5 ratti" has no price word, but it is a price question. The AI often says "general" here.
  const hasQuantity = extraction.items.some((item) => item.quantity !== null) || looseQuantity !== null;
  const intent = extraction.intent === 'general' && hasQuantity ? 'price_enquiry' : extraction.intent;

  return { ...extraction, intent, category, looseQuantity, suggestions, source };
}
