import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { analyzeMessage } from '../src/services/analyze.service.js';
import { buildQuote } from '../src/services/pricing.service.js';
import { validateAiReply } from '../src/services/reply/guard.js';
import { buildTemplateReply } from '../src/services/reply/templates.js';

const quote = buildQuote([{ productId: 'neelam', quantity: 5 }]);

describe('AI reply guard', () => {
  it('accepts a reply that only uses quoted numbers', () => {
    const reply = 'Namaste! Neelam ₹1,800 per ratti hai, 5 ratti ka total ₹9,000. 25+ ratti par ₹1,650.';
    assert.equal(validateAiReply(reply, quote).ok, true);
  });

  it('rejects an invented price', () => {
    const verdict = validateAiReply('Neelam ₹1,200 per ratti, total ₹9,000 for 5 ratti.', quote);
    assert.equal(verdict.ok, false);
  });

  it('rejects a reply that skips the real unit price', () => {
    assert.equal(validateAiReply('Total ₹9,000 for 5 ratti.', quote).ok, false);
  });

  it('rejects links and non-text', () => {
    assert.equal(validateAiReply('Pay at https://evil.example ₹1,800 5', quote).ok, false);
    assert.equal(validateAiReply(null, quote).ok, false);
  });

  it('allows digits that are part of a product name', () => {
    const mukhi = buildQuote([{ productId: 'rudraksha-5-mukhi', quantity: 100 }]);
    assert.equal(validateAiReply('5 Mukhi Rudraksha: ₹45 per pc, 100 pcs = ₹4,500. 500+ pcs: ₹35.', mukhi).ok, true);
  });
});

describe('template reply', () => {
  it('puts the exact computed figures in the reply', () => {
    const text = buildTemplateReply({ intent: 'price_enquiry', language: 'english' }, quote);
    assert.match(text, /₹1,800/);
    assert.match(text, /₹9,000/);
    assert.match(text, /25\+ ratti/);
  });

  it('replies in Hindi when asked', () => {
    const text = buildTemplateReply({ intent: 'price_enquiry', language: 'hindi' }, quote);
    assert.match(text, /रत्ती/);
  });

  it('passes its own guard', () => {
    for (const language of ['english', 'hinglish', 'hindi']) {
      const text = buildTemplateReply({ intent: 'price_enquiry', language }, quote);
      assert.equal(validateAiReply(text, quote).ok, true, language);
    }
  });
});

// These run without an AI key, so they exercise the full rule-based pipeline.
describe('analyzeMessage (rule-based pipeline)', () => {
  it('answers the example from the brief', async () => {
    const result = await analyzeMessage('Neelam ka rate kya hai 5 ratti?');
    assert.equal(result.intent, 'price_enquiry');
    assert.equal(result.quote.lines[0].unitPrice, 1800);
    assert.equal(result.quote.total, 9000);
    assert.match(result.reply, /₹1,800/);
  });

  it('quotes real options for "Rudraksha 100 pcs chahiye"', async () => {
    const result = await analyzeMessage('Rudraksha 100 pcs chahiye');
    assert.equal(result.intent, 'bulk_order');
    assert.equal(result.quote.isSuggestion, true);
    assert.ok(result.quote.lines.length > 0);
    assert.ok(result.quote.lines.every((line) => line.quantity === 100));
  });

  it('never invents a product for an unknown request', async () => {
    const result = await analyzeMessage('Diamond ring ka rate batao');
    assert.equal(result.quote.lines.length, 0);
    assert.doesNotMatch(result.reply, /₹/);
  });

  it('sends complaints to a template with no prices', async () => {
    const result = await analyzeMessage('Order mein neelam kharab mila, refund chahiye');
    assert.equal(result.intent, 'complaint');
    assert.equal(result.replySource, 'template');
  });
});
