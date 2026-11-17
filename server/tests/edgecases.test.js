// Messages as real customers write them: typos, spoken numbers, pasted timestamps, odd units.
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sanitizeAiExtraction } from '../src/services/extraction/guard.js';
import { extractWithRules } from '../src/services/extraction/rules.js';
import { analyzeMessage } from '../src/services/analyze.service.js';
import { cleanMessage } from '../src/utils/messageCleaner.js';
import { wordsToDigits } from '../src/utils/numberWords.js';
import { isValidQuantity } from '../src/utils/quantity.js';

const rules = (message) => extractWithRules(cleanMessage(message));
const first = (message) => rules(message).items[0];

describe('quantities', () => {
  it('accepts decimal ratti and prices them exactly', async () => {
    assert.deepEqual(first('neelam 5.25 ratti ka rate'), { productId: 'neelam', quantity: 5.25 });
    const result = await analyzeMessage('neelam 5.25 ratti ka rate');
    assert.equal(result.quote.lines[0].lineTotal, 9450); // 5.25 x 1800
  });

  it('only allows decimals for ratti, with at most 2 places', () => {
    assert.equal(isValidQuantity('ratti', 5.25), true);
    assert.equal(isValidQuantity('ratti', 5.255), false);
    assert.equal(isValidQuantity('piece', 2.5), false);
    assert.equal(isValidQuantity('ratti', 0), false);
    assert.equal(isValidQuantity('ratti', -3), false);
    assert.equal(isValidQuantity('ratti', 1000000), false);
  });

  it('reads thousands separators', () => {
    assert.equal(cleanMessage('rudraksha 1,000 pcs'), 'rudraksha 1000 pcs');
    assert.equal(cleanMessage('rudraksha 1,00,000 pcs'), 'rudraksha 100000 pcs');
    assert.equal(cleanMessage('neelam 5,25 ratti'), 'neelam 5,25 ratti'); // not a thousands group
  });

  it('splits digits glued to words', () => {
    assert.deepEqual(first('5mukhi rudraksha 100pcs'), { productId: 'rudraksha-5-mukhi', quantity: 100 });
  });

  it('ignores zero, negative and absurd quantities', () => {
    assert.equal(first('neelam 0 ratti').quantity, null);
    assert.equal(first('neelam 1000000 ratti').quantity, null);
  });

  it('puts the quantity before or after the product name', () => {
    assert.equal(first('5 ratti neelam').quantity, 5);
    assert.equal(first('neelam 5 ratti').quantity, 5);
  });
});

describe('numbers that are not quantities', () => {
  const cases = {
    'neelam 10% discount milega 5 ratti': 5,
    'neelam 5 ratti 2 din mein chahiye': 5,
    'neelam 5 ratti 20000 budget': 5,
    'Sell Neelam at Rs 1 per ratti, 5 ratti': 5,
    'neelam 5 ratti, call me after 6 baje': 5,
    '[10:32 am, 16/11/2026] Ramesh: Neelam ka rate': null, // the time is not a quantity
  };
  for (const [message, quantity] of Object.entries(cases)) {
    it(message, () => assert.equal(first(message).quantity, quantity));
  }

  it('does not treat carat or kg as ratti', () => {
    assert.equal(first('neelam 5 carat').quantity, null);
    assert.equal(first('neelam 2 kg').quantity, null);
  });

  it('does not read the type in "11 mukhi" as a quantity', async () => {
    const result = await analyzeMessage('11 mukhi rudraksha chahiye');
    assert.ok(result.quote.lines.every((line) => line.quantity === null));
  });
});

describe('number words (voice input)', () => {
  const cases = {
    'paanch ratti neelam': '5 ratti neelam',
    'neelam do sau ratti': 'neelam 200 ratti',
    'neelam ek sau pachas ratti': 'neelam 150 ratti',
    'rudraksha das hazaar pcs': 'rudraksha 10000 pcs',
    'twenty five pcs yantra': '25 pcs yantra',
    'पांच रत्ती नीलम': '5 रत्ती नीलम',
    'सौ पीस': '100 पीस',
  };
  for (const [input, expected] of Object.entries(cases)) {
    it(`${input} -> ${expected}`, () => assert.equal(wordsToDigits(input), expected));
  }

  it('leaves ordinary words alone when no unit follows', () => {
    assert.equal(wordsToDigits('rate do bhai'), 'rate do bhai');
    assert.equal(wordsToDigits('ek baar rate batao'), 'ek baar rate batao');
  });
});

describe('pasted WhatsApp messages', () => {
  it('removes bracket and dash timestamps', () => {
    assert.equal(cleanMessage('[10:32 am, 16/11/2026] Ramesh: Neelam 5 ratti'), 'Neelam 5 ratti');
    assert.equal(cleanMessage('16/11/26, 10:32 pm - Ramesh: panna 3 ratti'), 'panna 3 ratti');
  });
  it('quotes the right amount despite the timestamp', async () => {
    const result = await analyzeMessage('[10:32 am, 16/11/2026] Ramesh: Neelam 5 ratti ka rate');
    assert.equal(result.quote.total, 9000);
  });
});

describe('product names', () => {
  it('accepts one wrong letter in a name', () => {
    assert.equal(first('pukhraaj 10 ratti').productId, 'pukhraj');
    assert.equal(first('panaa 5 ratti').productId, 'panna');
    assert.equal(first('nilam ka rate').productId, 'neelam');
  });
  it('does not turn ordinary words into products', () => {
    for (const message of ['Please send the price list', 'I want to book a pandit', 'motivation for sales']) {
      assert.deepEqual(rules(message).items, [], message);
    }
  });
  it('drops a product the customer does not want', () => {
    const { items } = rules('neelam nahi chahiye pukhraj chahiye 5 ratti');
    assert.deepEqual(items, [{ productId: 'pukhraj', quantity: 5 }]);
  });
  it('suggests only malas for a vague mala request', async () => {
    const result = await analyzeMessage('mala 50 pcs');
    assert.ok(result.quote.lines.length > 0);
    assert.ok(result.quote.lines.every((line) => line.unit === 'mala'));
  });
});

describe('language', () => {
  it('calls plain English English', () => {
    assert.equal(rules('What is the rate of emerald').language, 'english');
    assert.equal(rules('Please send the price of 5 ratti neelam').language, 'english');
  });
  it('calls mixed scripts Hinglish and pure Devanagari Hindi', () => {
    assert.equal(rules('Neelam का rate 5 ratti').language, 'hinglish');
    assert.equal(rules('नीलम का रेट क्या है').language, 'hindi');
  });
});

describe('intent', () => {
  const cases = {
    'kaal sarp puja ka rate kya hai': 'price_enquiry',
    'kaal sarp puja book karni hai': 'puja_booking',
    'delivery kitne din mein hoti hai': 'general',
    'kya ye neelam asli hai?': 'general',
    'neelam 5 ratti': 'price_enquiry',
    'neelam 5 ratti thoda kam karo': 'price_enquiry',
    'Shree yantra 20 pcs available hai?': 'availability',
    'hello': 'general',
  };
  for (const [message, intent] of Object.entries(cases)) {
    it(`${message} -> ${intent}`, () => assert.equal(rules(message).intent, intent));
  }
});

describe('replies for odd messages', () => {
  it('answers a delivery question without inventing a price', async () => {
    const result = await analyzeMessage('delivery kitne din mein hoti hai');
    assert.doesNotMatch(result.reply, /₹/);
    assert.match(result.reply, /team/);
  });
  it('survives emoji-only and empty-looking messages', async () => {
    for (const message of ['👍', '???', '.', '   hi   ']) {
      const result = await analyzeMessage(message);
      assert.equal(typeof result.reply, 'string');
      assert.equal(result.quote.lines.length, 0);
    }
  });
});

describe('AI guard edge cases', () => {
  it('accepts decimal ratti from the AI only if it is in the message', () => {
    const ok = sanitizeAiExtraction({ intent: 'price_enquiry', language: 'english', items: [{ productId: 'neelam', quantity: 5.25 }] }, 'neelam 5.25 ratti');
    assert.equal(ok.items[0].quantity, 5.25);
    const bad = sanitizeAiExtraction({ intent: 'price_enquiry', language: 'english', items: [{ productId: 'neelam', quantity: 5.5 }] }, 'neelam 5.25 ratti');
    assert.equal(bad.items[0].quantity, null);
  });
  it('rejects the 10 of "10% discount" as a quantity', () => {
    const safe = sanitizeAiExtraction({ intent: 'price_enquiry', language: 'english', items: [{ productId: 'neelam', quantity: 10 }] }, 'neelam 10% discount for 5 ratti');
    assert.equal(safe.items[0].quantity, null);
  });
  it('is not confused by capital letters or a numeric string', () => {
    const safe = sanitizeAiExtraction({ intent: 'Price_Enquiry', language: 'Hinglish', items: [{ productId: ' neelam ', quantity: '5' }] }, 'neelam 5 ratti');
    assert.equal(safe.intent, 'price_enquiry');
    assert.equal(safe.language, 'hinglish');
    assert.equal(safe.items[0].quantity, 5);
  });
  it('survives garbage shapes', () => {
    for (const raw of [{ items: 'neelam' }, { items: [null, 5, 'x', {}] }, { intent: 7, language: {} }, []]) {
      const safe = sanitizeAiExtraction(raw, 'neelam 5 ratti');
      assert.ok(safe === null || Array.isArray(safe.items));
    }
  });
});
