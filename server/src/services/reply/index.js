// Step 3 of the pipeline: verified quote -> ready-to-send reply.
import { isAiConfigured, requestJson } from '../ai.client.js';
import { validateAiReply } from './guard.js';
import { buildReplySystemPrompt, buildReplyUserPrompt } from './prompt.js';
import { buildTemplateReply } from './templates.js';

// Complaints and status checks need no figures, so a template is safer and cheaper than AI.
const TEMPLATE_ONLY_INTENTS = new Set(['complaint', 'order_status']);

// Questions about delivery, payment or "hello" have no product and no price. An AI reply could
// promise a delivery time or an answer we do not have, so the team-will-help template is used.
const needsNoAi = (analysis, quote) =>
  TEMPLATE_ONLY_INTENTS.has(analysis.intent) || (analysis.intent === 'general' && quote.lines.length === 0);

export async function composeReply({ message, analysis, quote }) {
  const fallback = () => ({ text: buildTemplateReply(analysis, quote), source: 'template' });

  if (!isAiConfigured() || needsNoAi(analysis, quote)) return fallback();

  try {
    const raw = await requestJson({
      system: buildReplySystemPrompt(analysis),
      user: buildReplyUserPrompt({ message, analysis, quote }),
    });

    const verdict = validateAiReply(raw?.reply, quote);
    if (!verdict.ok) {
      console.warn(`[reply] AI reply rejected (${verdict.reason}), using template`);
      return fallback();
    }
    return { text: raw.reply.trim(), source: 'ai' };
  } catch (error) {
    console.warn(`[reply] AI failed, using template: ${error.message}`);
    return fallback();
  }
}
