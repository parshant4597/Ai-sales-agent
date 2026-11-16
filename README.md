# Remedy Setu: AI Sales Reply Assistant

Assignment: **Option 3, AI Sales Reply Assistant** (Software Development Intern, Full Stack).

A sales agent pastes a customer's WhatsApp message (English, Hindi or Hinglish) and gets:

1. the **detected intent** (price enquiry, bulk order, availability, puja booking, order status, complaint, general),
2. the **matching products and the quantity-tier price** from a price list,
3. a **ready-to-send reply in the customer's language**, which the agent can edit, copy, or open in WhatsApp.

**Bonus done:** every query is saved as a lead. A Leads page lets the team move each lead through New → Contacted → Quoted → Won / Lost, add notes, search and filter.

> The price list (`server/src/data/priceList.js`, 18 items) is **sample data** made for this assignment, not Remedy Setu's real prices.

## Tech stack

MERN: **MongoDB** (Mongoose) · **Express 5** · **React 19** (Vite, React Router, Tailwind CSS 4) · **Node 20+**.
AI: any OpenAI-compatible chat API. Default is Groq (`openai/gpt-oss-120b`, free tier); change `AI_BASE_URL` / `AI_MODEL` in `.env` to use OpenAI, Gemini or others.

## Run locally (under 5 minutes)

Needs Node 20+ and a MongoDB connection string (free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster, or a local `mongod`).

```bash
npm run install:all
cp server/.env.example server/.env   # then edit server/.env
npm run dev
```

Open http://localhost:5173.

`server/.env`:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string. Without it the assistant works but leads are not saved. |
| `AI_API_KEY` | Key for the AI provider ([Groq keys](https://console.groq.com/keys)). **Leave empty to run in rule-based mode, no AI.** |
| `AI_BASE_URL`, `AI_MODEL` | Provider endpoint and model (defaults are for Groq). |
| `APP_PASSWORD` | Optional. If set, the whole app asks for this password (HTTP Basic Auth, any username). |

Run the tests (no key or database needed): `npm test`

## Deploy (Render, one service)

1. Push to GitHub, create a **Web Service** on Render from the repo.
2. Build command: `npm run build` · Start command: `npm start`
3. Add the environment variables above (`MONGODB_URI`, `AI_API_KEY`, optionally `APP_PASSWORD`).

The Express server also serves the built React app, so there is a single URL.

## How it works

```
message ──► 1. extract ──► 2. price ──► 3. reply ──► save lead
            AI (guarded)    plain code   AI (guarded)
            or rules                     or template
```

| Step | File | What happens |
|---|---|---|
| Extract | `services/extraction/` | The AI returns JSON only: intent, language, `productId`s and quantities. It sees product ids, names and units, **never prices**. |
| Guard | `extraction/guard.js` | Unknown product ids are dropped. A quantity must literally appear in the customer's message. Intent and language must come from fixed lists. |
| Price | `services/pricing.service.js` | Plain code picks the tier (`quantity >= minQty`) and does the multiplication. **The AI never touches a price.** |
| Reply | `services/reply/` | The AI is given the verified quote and writes only the wording. |
| Reply guard | `reply/guard.js` | Every number in the reply must exist in the quote, every quoted unit price must appear, no links. Otherwise the reply is thrown away and a deterministic template is used. |
| Fallback | `extraction/rules.js`, `reply/templates.js` | If the AI is missing, slow, rate-limited or fails a guard, keyword rules and templates still produce a correct answer. The tool never goes down. |

### How wrong outputs are prevented

- **Invented products:** the AI can only return ids from the price list; anything else is dropped by the guard. With no match, the reply asks which product the customer wants (no made-up item).
- **Invented prices:** prices come only from code. The AI reply is rejected if it contains any number that is not in the quote.
- **Invented quantities:** a quantity is accepted only if it is written in the customer's message. Missing quantity means the reply asks for it and no total is calculated.
- **Prompt injection:** the customer message is wrapped in `<customer_message>` tags and the prompts say it is data, not instructions. Even if the model is fooled, its output still goes through the guards.
- **Complaints and order status** use templates only (no prices needed, no AI risk).

## Project structure

```
server/src
  config/        env.js (all env vars), db.js (Mongo connection)
  data/          priceList.js (sample products + tiers)
  models/        Lead.js (Mongoose schema)
  services/      catalogue, pricing, lead, analyze (pipeline), ai.client
    extraction/  prompt, guard, rules, index
    reply/       prompt, guard, templates, index
  controllers/   thin request handlers
  routes/        URL -> controller (+ rate limit)
  middleware/    basicAuth, errorHandler
  validators/    request validation
  utils/         text helpers, HttpError
server/tests     pricing, extraction, reply (node:test)
client/src
  api/           all fetch calls
  pages/         AssistantPage, LeadsPage, PricesPage
  components/    Layout, ResultPanel, QuoteTable, LeadCard, Badge, CopyButton
  hooks/ utils/ constants.js
```

## API

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/replies` | `{ message, customerName?, phone? }` → intent, language, quote, reply, `leadId` |
| GET | `/api/leads?status=&q=` | List leads with status counts |
| PATCH | `/api/leads/:id` | `{ status }` |
| POST | `/api/leads/:id/notes` | `{ text }` |
| GET | `/api/products` | The price list |
| GET | `/api/health` | AI and database status |

## Done

- Intent, language, product and quantity detection for English / Hindi / Hinglish
- Tier pricing from a 18-item price list, multi-product quotes with a total, "order more to save" hint
- Editable reply with copy and "Open in WhatsApp" buttons
- Vague requests ("Rudraksha 100 pcs chahiye") quote the options in that category at that quantity
- Every query saved as a lead; Leads page with status pipeline, notes, search, filters
- Guardrails, rule-based fallback, rate limiting, optional password
- 31 automated tests, mobile-friendly UI

## Next (with one more week)

- Real login with individual agent accounts instead of one shared password
- Edit the price list from the UI (stored in MongoDB) instead of a code file
- Spoken numbers in Hindi ("paanch sau") and units such as kg / dozen
- Stream the WhatsApp Business API in directly, so messages arrive without pasting
- Track which agent handled each lead and add follow-up reminders
