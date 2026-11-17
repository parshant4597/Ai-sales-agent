import { MAX_QUANTITY } from '../constants.js';

// Everything is sold in whole units except gemstones, which are sold by the ratti and
// can be fractional ("5.25 ratti"). Two decimals are enough; anything odder is ignored.
export function isValidQuantity(unit, value) {
  if (!Number.isFinite(value) || value <= 0 || value > MAX_QUANTITY) return false;
  if (Number.isInteger(value)) return true;

  const decimals = (String(value).split('.')[1] || '').length;
  return unit === 'ratti' && decimals <= 2;
}
