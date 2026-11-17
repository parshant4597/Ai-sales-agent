// Validation for the product form. Everything an admin submits is checked here, so the
// catalogue (and therefore every price the assistant quotes) can only contain sensible data.
import { MAX_ALIASES, MAX_PRICE, MAX_QUANTITY, MAX_TIERS, UNITS } from '../constants.js';
import { CATEGORIES } from '../data/priceList.js';
import { badRequest } from '../utils/httpError.js';

const clean = (value) => (typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '');

function parseText(value, label, { required = false, min = 0, max }) {
  const text = clean(value);
  if (required && text.length < Math.max(min, 1)) throw badRequest(`${label} is required${min > 1 ? ` (at least ${min} characters)` : ''}.`);
  if (text.length > max) throw badRequest(`${label} is too long (${max} characters at most).`);
  return text;
}

// Accepts ["a", "b"] or "a, b" (a text box), and returns a clean list.
function parseAliases(value) {
  const raw = Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[,\n]/) : [];
  const aliases = [...new Set(raw.map((item) => clean(item).toLowerCase()).filter(Boolean))];
  if (aliases.some((alias) => alias.length > 40)) throw badRequest('Each spelling variant can be 40 characters at most.');
  if (aliases.length > MAX_ALIASES) throw badRequest(`Use at most ${MAX_ALIASES} spelling variants.`);
  return aliases;
}

/**
 * Bulk pricing. Rules: 1 to 5 tiers, the first starts at quantity 1, quantities are whole and unique,
 * and a bigger quantity never costs MORE per unit (that would be a typo, not a bulk price).
 */
export function parseTiers(value) {
  if (!Array.isArray(value) || value.length === 0) throw badRequest('Add at least one price.');
  if (value.length > MAX_TIERS) throw badRequest(`Use at most ${MAX_TIERS} price tiers.`);

  const tiers = value
    .map((tier) => ({ minQty: Number(tier?.minQty), price: Number(tier?.price) }))
    .sort((a, b) => a.minQty - b.minQty);

  for (const { minQty, price } of tiers) {
    if (!Number.isInteger(minQty) || minQty < 1 || minQty > MAX_QUANTITY) throw badRequest(`Quantity must be a whole number from 1 to ${MAX_QUANTITY}.`);
    if (!Number.isFinite(price) || price <= 0 || price > MAX_PRICE) throw badRequest(`Price must be more than 0 and at most ₹${MAX_PRICE.toLocaleString('en-IN')}.`);
    if (!Number.isInteger(price)) throw badRequest('Use whole rupees for the price.');
  }

  if (tiers[0].minQty !== 1) throw badRequest('The first price must start at quantity 1.');
  for (let index = 1; index < tiers.length; index++) {
    if (tiers[index].minQty === tiers[index - 1].minQty) throw badRequest('Two prices cannot start at the same quantity.');
    if (tiers[index].price > tiers[index - 1].price) {
      throw badRequest(`A bigger quantity cannot cost more: ${tiers[index].minQty}+ is priced above ${tiers[index - 1].minQty}+.`);
    }
  }
  return tiers;
}

export function parseProductBody(body) {
  const category = body?.category;
  if (!Object.keys(CATEGORIES).includes(category)) throw badRequest(`Category must be one of: ${Object.keys(CATEGORIES).join(', ')}.`);
  if (!UNITS.includes(body?.unit)) throw badRequest(`Unit must be one of: ${UNITS.join(', ')}.`);

  return {
    name: parseText(body?.name, 'Product name', { required: true, min: 2, max: 80 }),
    hindiName: parseText(body?.hindiName, 'Hindi name', { max: 80 }),
    description: parseText(body?.description, 'Description', { max: 300 }),
    category,
    unit: body.unit,
    aliases: parseAliases(body?.aliases),
    tiers: parseTiers(body?.tiers),
    active: typeof body?.active === 'boolean' ? body.active : true,
  };
}
