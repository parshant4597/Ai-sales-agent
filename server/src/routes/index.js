import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { isDbConnected } from '../config/db.js';
import { env } from '../config/env.js';
import { getLeads, patchLead, postLeadNote } from '../controllers/leads.controller.js';
import { getProducts } from '../controllers/products.controller.js';
import { createReply } from '../controllers/replies.controller.js';
import { isAiConfigured } from '../services/ai.client.js';

// Protects the AI quota: 30 analyses per minute per IP is plenty for a sales desk.
const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a minute and try again.' },
});

const router = Router();

router.get('/health', (req, res) => {
  res.json({ ok: true, ai: isAiConfigured() ? env.aiModel : 'not configured (rule-based mode)', database: isDbConnected() });
});

router.get('/products', getProducts);
router.post('/replies', analyzeLimiter, createReply);

router.get('/leads', getLeads);
router.patch('/leads/:id', patchLead);
router.post('/leads/:id/notes', postLeadNote);

export default router;
