import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { isDbConnected } from '../config/db.js';
import { login, logout, me } from '../controllers/auth.controller.js';
import { getInsightsSummary } from '../controllers/insights.controller.js';
import { getLeads, patchLead, postLeadNote } from '../controllers/leads.controller.js';
import { deleteProduct, getProducts, patchProduct, postProduct } from '../controllers/products.controller.js';
import { createReply } from '../controllers/replies.controller.js';
import { deleteUser, getUsers, patchUserPassword, postUser } from '../controllers/users.controller.js';
import { requireAdmin, requireAuth } from '../middleware/requireAuth.js';
import { isAiConfigured } from '../services/ai.client.js';

// Protects the AI quota: 30 analyses per minute per IP is plenty for a sales desk.
const analyzeLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a minute and try again.' },
});

// Slows password guessing: 10 failed sign-ins per 15 minutes per IP. A correct login is not counted.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many failed sign-in attempts. Try again in 15 minutes.' },
});

const router = Router();

// ---- Public: health check and sign-in. Nothing else.
router.get('/health', (req, res) => {
  res.json({ ok: true, ai: isAiConfigured(), database: isDbConnected() });
});
router.post('/auth/login', loginLimiter, login);
router.post('/auth/logout', logout);

// ---- Everything below needs a signed-in team member.
router.use(requireAuth);

router.get('/auth/me', me);

router.get('/products', getProducts);
router.post('/replies', analyzeLimiter, createReply);
router.get('/leads', getLeads); // a member only gets their own leads (see lead.service.js)
router.patch('/leads/:id', patchLead);
router.post('/leads/:id/notes', postLeadNote);

// ---- Admin only: the sales dashboard covers the whole team, so a sales agent has no need for it.
router.get('/insights', requireAdmin, getInsightsSummary);

// ---- Admin only: manage the price list.
router.post('/products', requireAdmin, postProduct);
router.patch('/products/:id', requireAdmin, patchProduct);
router.delete('/products/:id', requireAdmin, deleteProduct);

// ---- Admin only: manage who is on the team.
router.get('/users', requireAdmin, getUsers);
router.post('/users', requireAdmin, postUser);
router.patch('/users/:id/password', requireAdmin, patchUserPassword);
router.delete('/users/:id', requireAdmin, deleteUser);

export default router;
