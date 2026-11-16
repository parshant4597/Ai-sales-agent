import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sanitizeAiExtraction } from '../src/services/extraction/guard.js';
import { detectLanguage, extractWithRules } from '../src/services/extraction/rules.js';

describe('rule-based extraction', () => {
  it('reads "Neelam ka rate kya hai 5 ratti?"', () => {
    const result = extractWithRules('Neelam ka rate kya hai 5 ratti?');
    assert.deepEqual(result.items, [{ productId: 'neelam', quantity: 5 }]);
    assert.equal(result.intent, 'price_enquiry');
    assert.equal(result.language, 'hinglish');
  });

  it('does not mistake "5 mukhi" for a quantity', () => {
    const result = extractWithRules('5 mukhi rudraksha 100 pcs chahiye');
    assert.deepEqual(result.items, [{ productId: 'rudraksha-5-mukhi', quantity: 100 }]);
    assert.equal(result.intent, 'bulk_order');
  });

  it('handles several products in one message', () => {
    const result = extractWithRules('Pukhraj 10 ratti aur panna 20 ratti ka rate batao');
    assert.deepEqual(result.items, [
      { productId: 'pukhraj', quantity: 10 },
      { productId: 'panna', quantity: 20 },
    ]);
  });

  it('understands Hindi script', () => {
    const result = extractWithRules('नीलम का रेट क्या है 7 रत्ती');
    assert.equal(result.language, 'hindi');
    assert.deepEqual(result.items, [{ productId: 'neelam', quantity: 7 }]);
    assert.equal(result.intent, 'price_enquiry');
  });

  it('does not match a product inside another word', () => {
    assert.deepEqual(extractWithRules('I need motivation and some advice').items, []);
  });

  it('detects complaints before anything else', () => {
    assert.equal(extractWithRules('Neelam kharab nikla, refund chahiye').intent, 'complaint');
  });

  it('detects language', () => {
    assert.equal(detectLanguage('What is the price of emerald?'), 'english');
  });
});

describe('AI extraction guard', () => {
  const message = 'Neelam 5 ratti chahiye';

  it('drops products that are not in the price list', () => {
    const safe = sanitizeAiExtraction(
      { intent: 'price_enquiry', language: 'hinglish', items: [{ productId: 'diamond', quantity: 1 }, { productId: 'neelam', quantity: 5 }] },
      message,
    );
    assert.deepEqual(safe.items, [{ productId: 'neelam', quantity: 5 }]);
  });

  it('nulls a quantity that is not written in the message', () => {
    const safe = sanitizeAiExtraction({ intent: 'bulk_order', language: 'english', items: [{ productId: 'neelam', quantity: 500 }] }, message);
    assert.deepEqual(safe.items, [{ productId: 'neelam', quantity: null }]);
  });

  it('replaces unknown intent and language values', () => {
    const safe = sanitizeAiExtraction({ intent: 'hack', language: 'klingon', items: [] }, message);
    assert.equal(safe.intent, null);
    assert.equal(safe.language, null);
  });

  it('forces Hindi for Devanagari messages', () => {
    const safe = sanitizeAiExtraction({ intent: 'general', language: 'english', items: [] }, 'नीलम चाहिए');
    assert.equal(safe.language, 'hindi');
  });

  it('rejects non-object output', () => {
    assert.equal(sanitizeAiExtraction('nonsense', message), null);
  });
});
