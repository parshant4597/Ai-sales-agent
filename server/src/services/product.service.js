// The admin-managed product list. MongoDB is the source of truth; after every change the in-memory
// catalogue (catalogue.service.js) is rebuilt, so the very next customer message is priced with it.
import { isDbConnected } from '../config/db.js';
import { PRICE_LIST } from '../data/priceList.js';
import { Product } from '../models/Product.js';
import { notFound, unavailable } from '../utils/httpError.js';
import { buildAliases, slugify } from '../utils/productText.js';
import { setCatalogue } from './catalogue.service.js';

function requireDb() {
  if (!isDbConnected()) throw unavailable('Database is not connected. Check MONGODB_URI.');
}

// A database document -> the shape the rest of the app uses (the slug is the product id).
export function toProduct(doc) {
  return {
    id: doc.slug,
    name: doc.name,
    hindiName: doc.hindiName || '',
    description: doc.description || '',
    category: doc.category,
    unit: doc.unit,
    aliases: doc.aliases || [],
    tiers: (doc.tiers || []).map(({ minQty, price }) => ({ minQty, price })),
    active: doc.active !== false,
  };
}

const toDocument = (product) => ({ slug: product.id, ...product, id: undefined });

/**
 * Loads the products into the in-memory catalogue. The first time (empty collection) the built-in
 * sample list is copied into the database, so a fresh install starts with a full price list.
 * Never throws: on a database error the previous catalogue keeps working.
 */
export async function loadCatalogue() {
  if (!isDbConnected()) return;
  try {
    if ((await Product.countDocuments()) === 0) {
      await Product.insertMany(PRICE_LIST.map(toDocument));
      console.log(`[catalogue] Copied ${PRICE_LIST.length} sample products into the database.`);
    }
    const docs = await Product.find().sort({ createdAt: 1, _id: 1 }).lean();
    setCatalogue(docs.map(toProduct));
  } catch (error) {
    console.error('[catalogue] Could not load products, keeping the previous list:', error.message);
  }
}

export async function listProducts() {
  requireDb();
  const docs = await Product.find().sort({ createdAt: 1, _id: 1 }).lean();
  return docs.map(toProduct);
}

// "neelam", then "neelam-2", "neelam-3"... The id is permanent, so it must be unique from the start.
async function uniqueSlug(name) {
  const base = slugify(name);
  let slug = base;
  for (let attempt = 2; await Product.exists({ slug }); attempt++) slug = `${base.slice(0, 36)}-${attempt}`;
  return slug;
}

export async function createProduct(input) {
  requireDb();
  const doc = await Product.create({
    ...input,
    slug: await uniqueSlug(input.name),
    aliases: buildAliases(input.name, input.hindiName, input.aliases),
  });
  await loadCatalogue();
  return toProduct(doc);
}

export async function updateProduct(id, input) {
  requireDb();
  const doc = await Product.findOne({ slug: id });
  if (!doc) throw notFound('Product not found.');

  // The id (slug) is never changed: old leads and the AI refer to it.
  Object.assign(doc, input, { aliases: buildAliases(input.name, input.hindiName, input.aliases) });
  await doc.save();
  await loadCatalogue();
  return toProduct(doc);
}

export async function removeProduct(id) {
  requireDb();
  const result = await Product.deleteOne({ slug: id });
  if (result.deletedCount === 0) throw notFound('Product not found.');
  await loadCatalogue();
}
