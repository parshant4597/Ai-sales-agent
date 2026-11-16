import { CATEGORIES } from '../data/priceList.js';
import { getAllProducts } from '../services/catalogue.service.js';

// GET /api/products - the price list, so agents can check any rate by hand.
export function getProducts(req, res) {
  const products = getAllProducts().map(({ id, name, hindiName, category, unit, tiers }) => ({
    id,
    name,
    hindiName,
    category,
    unit,
    tiers,
  }));
  res.json({ products, categories: CATEGORIES });
}
