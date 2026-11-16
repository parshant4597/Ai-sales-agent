import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PRICE_LIST } from '../src/data/priceList.js';
import { getProductById } from '../src/services/catalogue.service.js';
import { buildQuote, findTier } from '../src/services/pricing.service.js';

const neelam = getProductById('neelam');

describe('price list data', () => {
  it('has 15-20 products with sorted tiers that start at 1', () => {
    assert.ok(PRICE_LIST.length >= 15 && PRICE_LIST.length <= 20);
    for (const product of PRICE_LIST) {
      assert.equal(product.tiers[0].minQty, 1, product.id);
      const sorted = [...product.tiers].sort((a, b) => a.minQty - b.minQty);
      assert.deepEqual(product.tiers, sorted, product.id);
      // bulk must never cost more than retail
      for (let i = 1; i < product.tiers.length; i++) {
        assert.ok(product.tiers[i].price <= product.tiers[i - 1].price, product.id);
      }
    }
  });

  it('has unique ids', () => {
    assert.equal(new Set(PRICE_LIST.map((p) => p.id)).size, PRICE_LIST.length);
  });
});

describe('findTier', () => {
  it('uses the base tier below the first break', () => {
    assert.equal(findTier(neelam, 5).price, 1800);
  });
  it('switches exactly at the tier boundary', () => {
    assert.equal(findTier(neelam, 24).price, 1800);
    assert.equal(findTier(neelam, 25).price, 1650);
    assert.equal(findTier(neelam, 100).price, 1500);
    assert.equal(findTier(neelam, 5000).price, 1500);
  });
});

describe('buildQuote', () => {
  it('prices quantity x tier rate', () => {
    const { lines, total } = buildQuote([{ productId: 'neelam', quantity: 5 }]);
    assert.equal(lines[0].unitPrice, 1800);
    assert.equal(lines[0].lineTotal, 9000);
    assert.equal(total, 9000);
    assert.equal(lines[0].nextTier.minQty, 25);
  });

  it('does not guess a total when quantity is missing', () => {
    const { lines, total } = buildQuote([{ productId: 'neelam', quantity: null }]);
    assert.equal(lines[0].unitPrice, 1800);
    assert.equal(lines[0].lineTotal, null);
    assert.equal(total, null);
  });

  it('sums several lines and ignores unknown ids', () => {
    const { lines, total } = buildQuote([
      { productId: 'neelam', quantity: 2 },
      { productId: 'rudraksha-5-mukhi', quantity: 100 },
      { productId: 'does-not-exist', quantity: 3 },
    ]);
    assert.equal(lines.length, 2);
    assert.equal(total, 2 * 1800 + 100 * 45);
  });
});
