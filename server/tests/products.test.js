import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import { PRICE_LIST } from '../src/data/priceList.js';
import { analyzeMessage } from '../src/services/analyze.service.js';
import { findProductMentions, getAllProducts, getProductById, setCatalogue } from '../src/services/catalogue.service.js';
import { buildQuote } from '../src/services/pricing.service.js';
import { buildAliases, slugify } from '../src/utils/productText.js';
import { parseProductBody, parseTiers } from '../src/validators/product.js';

const validBody = () => ({
  name: 'Amethyst (Katela)',
  hindiName: 'कटेला',
  description: 'Purple quartz.',
  category: 'gemstone',
  unit: 'ratti',
  aliases: 'amethyst stone, jamunia',
  tiers: [{ minQty: 1, price: 400 }, { minQty: 50, price: 350 }],
});

// Each test file runs in its own process, but tests inside this file share the catalogue.
afterEach(() => setCatalogue(PRICE_LIST));

describe('product ids and spelling variants', () => {
  it('makes a safe id from the name', () => {
    assert.equal(slugify('Neelam (Blue Sapphire)'), 'neelam-blue-sapphire');
    assert.equal(slugify('  5 Mukhi / Nepal!! '), '5-mukhi-nepal');
    assert.equal(slugify('नीलम'), 'product'); // nothing usable: a fallback, made unique by the service
    assert.ok(slugify('x'.repeat(200)).length <= 40);
  });

  it('adds the name, its parts and the Hindi name as spellings automatically', () => {
    const aliases = buildAliases('Amethyst (Katela)', 'कटेला', ['jamunia']);
    for (const alias of ['amethyst (katela)', 'amethyst', 'katela', 'कटेला', 'jamunia']) assert.ok(aliases.includes(alias), alias);
  });

  it('removes duplicates and empty values', () => {
    const aliases = buildAliases('Moti', '', ['moti', ' ', 'MOTI']);
    assert.deepEqual(aliases, ['moti']);
  });
});

describe('price tiers', () => {
  it('sorts the tiers and accepts a valid list', () => {
    assert.deepEqual(parseTiers([{ minQty: 25, price: 90 }, { minQty: 1, price: 100 }]), [
      { minQty: 1, price: 100 },
      { minQty: 25, price: 90 },
    ]);
  });

  it('accepts bulk prices that stay the same', () => {
    assert.equal(parseTiers([{ minQty: 1, price: 100 }, { minQty: 10, price: 100 }]).length, 2);
  });

  const bad = {
    'no tiers': [[], /at least one price/],
    'not a list': ['x', /at least one price/],
    'first tier not 1': [[{ minQty: 5, price: 100 }], /start at quantity 1/],
    'bulk costs more': [[{ minQty: 1, price: 100 }, { minQty: 10, price: 120 }], /cannot cost more/],
    'same quantity twice': [[{ minQty: 1, price: 100 }, { minQty: 1, price: 90 }], /same quantity/],
    'zero price': [[{ minQty: 1, price: 0 }], /more than 0/],
    'negative price': [[{ minQty: 1, price: -5 }], /more than 0/],
    'text price': [[{ minQty: 1, price: 'abc' }], /more than 0/],
    'fractional price': [[{ minQty: 1, price: 99.5 }], /whole rupees/],
    'fractional quantity': [[{ minQty: 1.5, price: 100 }], /whole number/],
    'absurd price': [[{ minQty: 1, price: 99_999_999_999 }], /at most/],
    'too many tiers': [Array.from({ length: 6 }, (_, i) => ({ minQty: i + 1, price: 100 - i })), /at most 5/],
  };
  for (const [label, [value, message]] of Object.entries(bad)) {
    it(`rejects: ${label}`, () => assert.throws(() => parseTiers(value), message));
  }
});

describe('product form validation', () => {
  it('accepts a full product and cleans it up', () => {
    const product = parseProductBody({ ...validBody(), name: '  Amethyst   (Katela) ', aliases: 'Amethyst Stone, JAMUNIA,\namethyst stone' });
    assert.equal(product.name, 'Amethyst (Katela)');
    assert.deepEqual(product.aliases, ['amethyst stone', 'jamunia']);
    assert.equal(product.active, true);
  });

  it('allows an empty Hindi name, description and aliases', () => {
    const product = parseProductBody({ ...validBody(), hindiName: '', description: '', aliases: '' });
    assert.deepEqual([product.hindiName, product.description, product.aliases], ['', '', []]);
  });

  it('rejects a bad name, category or unit', () => {
    assert.throws(() => parseProductBody({ ...validBody(), name: '' }), /Product name is required/);
    assert.throws(() => parseProductBody({ ...validBody(), name: 'A' }), /at least 2 characters/);
    assert.throws(() => parseProductBody({ ...validBody(), name: 'x'.repeat(81) }), /too long/);
    assert.throws(() => parseProductBody({ ...validBody(), category: 'cars' }), /Category must be/);
    assert.throws(() => parseProductBody({ ...validBody(), unit: 'kg' }), /Unit must be/);
    assert.throws(() => parseProductBody({ ...validBody(), description: 'x'.repeat(301) }), /too long/);
    assert.throws(() => parseProductBody(undefined));
  });

  it('rejects too many or too long spelling variants', () => {
    assert.throws(() => parseProductBody({ ...validBody(), aliases: Array.from({ length: 21 }, (_, i) => `variant${i}`) }), /at most 20/);
    assert.throws(() => parseProductBody({ ...validBody(), aliases: 'x'.repeat(41) }), /40 characters/);
  });
});

describe('the live catalogue', () => {
  const amethyst = () => ({
    id: 'amethyst-katela',
    ...parseProductBody(validBody()),
    aliases: buildAliases('Amethyst (Katela)', 'कटेला', ['jamunia']),
  });

  it('starts with the built-in sample list', () => {
    assert.equal(getAllProducts().length, PRICE_LIST.length);
    assert.ok(getProductById('neelam'));
  });

  it('prices a newly added product from the very next message', async () => {
    setCatalogue([...PRICE_LIST, amethyst()]);
    const result = await analyzeMessage('amethyst 60 ratti ka rate batao');
    assert.equal(result.quote.lines[0].productId, 'amethyst-katela');
    assert.equal(result.quote.lines[0].unitPrice, 350); // the 50+ tier
    assert.equal(result.quote.total, 21000);
  });

  it('finds a product by a spelling variant, a typo and the Hindi name', () => {
    setCatalogue([...PRICE_LIST, amethyst()]);
    for (const text of ['jamunia 5 ratti', 'amethist 5 ratti', 'कटेला 5 रत्ती']) {
      assert.equal(findProductMentions(text).mentions[0]?.product.id, 'amethyst-katela', text);
    }
  });

  it('never quotes a hidden product', async () => {
    setCatalogue(PRICE_LIST.map((product) => (product.id === 'neelam' ? { ...product, active: false } : product)));
    assert.equal(getProductById('neelam'), null);
    const result = await analyzeMessage('neelam 5 ratti ka rate');
    assert.equal(result.quote.lines.length, 0);
    assert.doesNotMatch(result.reply, /₹/);
  });

  it('uses the new price straight away after an edit', () => {
    setCatalogue(PRICE_LIST.map((product) => (product.id === 'neelam' ? { ...product, tiers: [{ minQty: 1, price: 2500 }] } : product)));
    assert.equal(buildQuote([{ productId: 'neelam', quantity: 4 }]).total, 10000);
  });

  it('replies in Hindi with the English name when no Hindi name was entered', async () => {
    setCatalogue([...PRICE_LIST, { ...amethyst(), hindiName: '' }]);
    const result = await analyzeMessage('amethyst 5 ratti का रेट');
    assert.equal(result.quote.lines[0].hindiName, 'Amethyst (Katela)');
  });
});
