import mongoose from 'mongoose';
import { INTENTS, LANGUAGES, LEAD_STATUSES } from '../constants.js';

// One product line of the quote, stored as a snapshot so old leads keep
// their original prices even if the price list changes later.
const quoteLineSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    unit: { type: String, required: true },
    quantity: { type: Number, default: null },
    unitPrice: { type: Number, required: true },
    lineTotal: { type: Number, default: null },
  },
  { _id: false },
);

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const leadSchema = new mongoose.Schema(
  {
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    customerName: { type: String, trim: true, maxlength: 80, default: '' },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    // Last 10 digits of the phone, used to recognise a returning customer.
    phoneKey: { type: String, default: '', index: true },

    // The team member who answered this customer. A member only sees leads where this is their id.
    // The name is copied too, so the admin still sees who handled it after that person is removed.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    createdByName: { type: String, trim: true, maxlength: 60, default: '' },

    intent: { type: String, enum: INTENTS, required: true },
    language: { type: String, enum: LANGUAGES, required: true },
    quoteLines: { type: [quoteLineSchema], default: [] },
    quoteTotal: { type: Number, default: null },
    reply: { type: String, required: true },
    extractionSource: { type: String, enum: ['ai', 'rules'], required: true },
    replySource: { type: String, enum: ['ai', 'template'], required: true },

    status: { type: String, enum: LEAD_STATUSES, default: 'new', index: true },
    notes: { type: [noteSchema], default: [] },
  },
  { timestamps: true },
);

leadSchema.index({ createdAt: -1 });

export const Lead = mongoose.model('Lead', leadSchema);
