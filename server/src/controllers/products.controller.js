import { isDbConnected } from '../config/db.js';
import { UNITS } from '../constants.js';
import { CATEGORIES } from '../data/priceList.js';
import { getAllProducts } from '../services/catalogue.service.js';
import { createProduct, listProducts, removeProduct, updateProduct } from '../services/product.service.js';
import { parseProductBody } from '../validators/product.js';

const publicFields = ({ id, name, hindiName, description, category, unit, tiers }) => ({ id, name, hindiName, description, category, unit, tiers });

// GET /api/products
// Everyone sees the products customers are quoted. An admin also sees hidden products and the
// spelling variants, and is told whether editing is possible (it needs the database).
export async function getProducts(req, res) {
  const isAdmin = req.user.role === 'admin';
  const canManage = isAdmin && isDbConnected();

  const products = canManage ? await listProducts() : getAllProducts().map((product) => (isAdmin ? product : publicFields(product)));
  res.json({ products, categories: CATEGORIES, units: UNITS, canManage });
}

// POST /api/products (admin)
export async function postProduct(req, res) {
  res.status(201).json({ product: await createProduct(parseProductBody(req.body)) });
}

// PATCH /api/products/:id (admin). Sends the whole product, like the form does.
export async function patchProduct(req, res) {
  res.json({ product: await updateProduct(req.params.id, parseProductBody(req.body)) });
}

// DELETE /api/products/:id (admin)
export async function deleteProduct(req, res) {
  await removeProduct(req.params.id);
  res.json({ ok: true });
}
