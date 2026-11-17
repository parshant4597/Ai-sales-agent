// All price maths lives here. The AI never calculates or chooses a price:
// it only tells us WHICH product and HOW MANY, and this file does the rest.
import { getProductById } from './catalogue.service.js';

// The tier that applies for a quantity = the highest minQty that is <= quantity.
export function findTier(product, quantity) {
  let applied = product.tiers[0];
  for (const tier of product.tiers) {
    if (quantity >= tier.minQty) applied = tier;
  }
  return applied;
}

// The next cheaper tier the customer could reach by ordering more, or null.
export function findNextTier(product, quantity) {
  return product.tiers.find((tier) => tier.minQty > quantity) || null;
}

/**
 * Turns one requested item into one quote line.
 * If the customer gave no quantity we quote the base (1 unit) price and leave
 * the total empty, instead of guessing a quantity.
 */
export function buildQuoteLine(product, quantity) {
  const hasQuantity = typeof quantity === 'number';
  const tier = findTier(product, hasQuantity ? quantity : 1);

  return {
    productId: product.id,
    name: product.name,
    hindiName: product.hindiName,
    unit: product.unit,
    quantity: hasQuantity ? quantity : null,
    unitPrice: tier.price,
    tierMinQty: tier.minQty,
    lineTotal: hasQuantity ? Math.round(tier.price * quantity) : null, // 5.25 ratti can give paise
    nextTier: findNextTier(product, hasQuantity ? quantity : 1),
    tiers: product.tiers,
  };
}

/**
 * items: [{ productId, quantity }] (already validated by the extraction guard)
 * returns { lines, total } where total is null if no line has a quantity.
 */
export function buildQuote(items) {
  const lines = [];
  for (const item of items) {
    const product = getProductById(item.productId);
    if (product) lines.push(buildQuoteLine(product, item.quantity));
  }

  const pricedLines = lines.filter((line) => line.lineTotal !== null);
  const total = pricedLines.length > 0 ? pricedLines.reduce((sum, line) => sum + line.lineTotal, 0) : null;

  return { lines, total };
}
