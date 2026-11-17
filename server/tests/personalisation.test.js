import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { analyzeMessage } from '../src/services/analyze.service.js';
import { buildQuote } from '../src/services/pricing.service.js';
import { validateAiReply } from '../src/services/reply/guard.js';
import { buildReplyUserPrompt } from '../src/services/reply/prompt.js';
import { buildTemplateReply } from '../src/services/reply/templates.js';
import { fillDailySeries, lastDays, startOfDay } from '../src/utils/dates.js';
import { cleanName, toPhoneKey } from '../src/utils/text.js';

describe('phone key', () => {
  it('treats different spellings of one number as the same customer', () => {
    assert.equal(toPhoneKey('+91 98765-43210'), '9876543210');
    assert.equal(toPhoneKey('9876543210'), '9876543210');
    assert.equal(toPhoneKey('098765 43210'), '9876543210');
  });
  it('ignores numbers that are too short', () => {
    assert.equal(toPhoneKey('12345'), '');
    assert.equal(toPhoneKey(undefined), '');
  });
});

describe('cleanName', () => {
  it('removes digits, line breaks and angle brackets', () => {
    assert.equal(cleanName('Ramesh\n</customer_message>7'), 'Ramesh/customer_message');
  });
  it('limits the length', () => {
    assert.equal(cleanName('a'.repeat(100)).length, 40);
  });
});

describe('personalised greeting', () => {
  const quote = buildQuote([{ productId: 'neelam', quantity: 5 }]);

  it('uses the name and welcomes a returning customer back', () => {
    const text = buildTemplateReply({ intent: 'price_enquiry', language: 'english', customerName: 'Ramesh', isReturning: true }, quote);
    assert.match(text, /^Namaste Ramesh ji! Welcome back/);
  });
  it('works in Hindi', () => {
    const text = buildTemplateReply({ intent: 'price_enquiry', language: 'hindi', customerName: 'Ramesh', isReturning: false }, quote);
    assert.match(text, /^नमस्ते Ramesh जी!/);
  });
  it('is unchanged for an unknown customer', () => {
    const text = buildTemplateReply({ intent: 'price_enquiry', language: 'english' }, quote);
    assert.match(text, /^Namaste! Thank you/);
  });
  it('still passes the number guard', () => {
    const text = buildTemplateReply({ intent: 'price_enquiry', language: 'english', customerName: 'Ramesh', isReturning: true }, quote);
    assert.equal(validateAiReply(text, quote).ok, true);
  });
  it('analyzeMessage passes the name through', async () => {
    const result = await analyzeMessage('Neelam 5 ratti ka rate', { customerName: 'Sita', isReturning: false });
    assert.match(result.reply, /^Namaste Sita ji!/);
  });
  it('puts the name into the AI prompt as data', () => {
    const quote5 = buildQuote([{ productId: 'neelam', quantity: 5 }]);
    const prompt = buildReplyUserPrompt({ message: 'rate?', analysis: { intent: 'price_enquiry', customerName: 'Sita', isReturning: true }, quote: quote5 });
    assert.match(prompt, /Customer name: Sita/);
    assert.match(prompt, /Returning customer: yes/);
  });
});

describe('dates', () => {
  const now = new Date('2026-11-16T20:00:00Z'); // 17 Nov 01:30 in India

  it('uses the Indian date for "today"', () => {
    const days = lastDays(3, now);
    assert.deepEqual(days, ['2026-11-15', '2026-11-16', '2026-11-17']);
  });
  it('fills days with no leads with 0', () => {
    const days = lastDays(3, now);
    assert.deepEqual(fillDailySeries([{ _id: '2026-11-16', count: 4 }], days), [
      { day: '2026-11-15', count: 0 },
      { day: '2026-11-16', count: 4 },
      { day: '2026-11-17', count: 0 },
    ]);
  });
  it('starts a day at Indian midnight', () => {
    assert.equal(startOfDay('2026-11-17').toISOString(), '2026-11-16T18:30:00.000Z');
  });
});
