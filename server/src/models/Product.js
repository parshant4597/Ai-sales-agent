import mongoose from 'mongoose';
import { UNITS } from '../constants.js';
import { CATEGORIES } from '../data/priceList.js';

const tierSchema = new mongoose.Schema(
  {
    minQty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

// One sellable product. The catalogue the assistant quotes from is built from these documents.
const productSchema = new mongoose.Schema(
  {
    // The permanent id (e.g. "neelam"). Leads and the AI refer to products by it, so it never changes.
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    hindiName: { type: String, trim: true, maxlength: 80, default: '' },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    category: { type: String, enum: Object.keys(CATEGORIES), required: true },
    unit: { type: String, enum: UNITS, required: true },
    // Every spelling customers use for it (lowercase). Matching a WhatsApp message depends on this.
    aliases: { type: [String], default: [] },
    tiers: { type: [tierSchema], validate: (tiers) => tiers.length > 0 },
    // A hidden product is kept for the admin but never quoted to customers.
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Product = mongoose.model('Product', productSchema);
