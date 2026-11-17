# Remedy Setu: AI Sales Reply Assistant

Assignment: **Option 3, AI Sales Reply Assistant** (Software Development Intern, Full Stack).

A sales agent pastes a customer's WhatsApp message (English, Hindi or Hinglish) and gets:

1. the **detected intent** (price enquiry, bulk order, availability, puja booking, order status, complaint, general),
2. the **matching products and the quantity-tier price** from a price list,
3. a **ready-to-send reply in the customer's language**, which the agent can edit, copy, or open in WhatsApp.

**Bonus done:** every query is saved as a lead. A Leads page lets the team move each lead through New → Contacted → Quoted → Won / Lost, add notes, search and filter.

**Our own additions (beyond the brief):**

- **Returning-customer memory:** a phone number is reduced to its last 10 digits (`+91 98765-43210` = `9876543210`). If that customer messaged before, the agent sees their earlier enquiries and quotes, and the reply greets them by name ("Namaste Ramesh ji, welcome back"). The AI is told to use the name but never to mention past orders or prices.
- **Admin-managed price list:** admins add, edit, hide and delete products on the Price list page (name, Hindi name, description, category, unit, spelling variants and up to 5 bulk price tiers). Products live in MongoDB (the first start copies the 18 sample products in). A change applies to the assistant **at once**: the next customer message is matched, priced and sent to the AI prompt with the new list. The form checks the rules (first price starts at quantity 1, a bigger quantity never costs more, whole rupees), and a hidden product is never quoted.
- **Roles:** a **member** (sales agent) sees only the leads they answered themselves and can only read the price list. An **admin** sees every lead (and can filter by agent), the Insights dashboard, the Team page, and can edit the price list. See "Who can do what" below.
- **Interactive insights dashboard (admin only):** for the founders, and every part of it is clickable.
  - **Headline KPIs** with a change against the previous period: total leads, win rate, open pipeline value, won revenue.
  - **Six more KPIs:** average quote, average deal size, repeat customers, follow-ups due, complaint rate, share of AI-written replies. Numbers count up when they load.
  - **Range:** 7, 14 or 30 days (remembered), plus auto-refresh every minute and a manual refresh.
  - **Charts:** an area chart with hover tooltips and a donut for the pipeline. Both are hand-drawn SVG, with no chart library.
  - **Click-through:** a day, a pipeline status, a product, a customer-intent bar or a KPI card opens the Leads page already filtered. Filters live in the URL (`/leads?status=quoted&intent=complaint&day=2026-11-16`), so Back works and a filtered view can be shared.
  - **Needs follow-up:** leads that stayed Contacted or Quoted for 2+ days, each with a WhatsApp button pre-filled with a nudge.
- **Voice input in Hindi / English:** a mic button turns a spoken query into text, since customers often send voice notes. It uses the browser's built-in speech recognition (Chrome or Edge, needs internet, audio goes to the browser vendor's speech service, so it is optional and hidden where unsupported).

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

Open http://localhost:5173 and sign in with the admin account from your `.env` (`ADMIN_EMAIL` and `ADMIN_PASSWORD`).

`server/.env`:

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string. **Required**: accounts and leads live here, so nobody can sign in without it. |
| `SESSION_SECRET` | Signs the login cookie. 32+ random characters, **required in production** (the server refuses to start without it). |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | The first admin, created on startup if it does not exist. Password: 8+ characters. |
| `AI_API_KEY` | Key for the AI provider ([Groq keys](https://console.groq.com/keys)). **Leave empty to run in rule-based mode, no AI.** |
| `AI_BASE_URL`, `AI_MODEL` | Provider endpoint and model (defaults are for Groq). |

Generate a secret: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

Run the tests (no key or database needed): `npm test`

## Deploy (Render, one service)

1. Push the repository to GitHub.
2. On Render choose **New → Blueprint** and pick the repository. `render.yaml` sets up the service (build `npm run build`, start `npm start`, health check `/api/health`, a generated `SESSION_SECRET`).
3. Render asks for the values that are not in the repository: `MONGODB_URI`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AI_API_KEY`.
4. In MongoDB Atlas, allow Render to connect (Network Access, `0.0.0.0/0`).
5. Open the service URL and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. The first start creates that admin and copies the 18 sample products into the database.

Without the Blueprint, create a **Web Service** by hand with the same build and start commands and add the environment variables from the table above.

The Express server also serves the built React app, so there is a single URL. Give reviewers the admin email and password; they can add their own team accounts on the Team page.

## Login and security

Only people an admin has added can use the app. There is **no public sign-up**.

| What | How |
|---|---|
| Accounts | `User` collection: name, email, role (`admin` or `member`), password hash. An admin adds and removes members on the **Team** page and can reset a password. |
| Passwords | Hashed with **scrypt** (built into Node) and a random salt per password. The password itself is never stored or logged. |
| Sessions | A token signed with HMAC-SHA256 in an **HttpOnly, SameSite=Lax** cookie (Secure in production), so page scripts cannot read it and other sites cannot send it. It lasts 7 days. |
| Protected API | Every route except `/api/health` and sign-in needs a valid session. Admin-only routes (`/api/users`) also need the admin role. |
| Instant revoke | The user is looked up on every request, so removing a member or resetting a password ends their session at once. |
| Safe errors | Wrong email and wrong password give the same message, and an unknown email takes as long as a wrong password, so nobody can find out who has an account. |
| Brute force | 10 failed sign-ins per 15 minutes per IP, and scrypt makes each guess slow. |
| Safety rails | You cannot remove yourself or the last admin. Duplicate emails are rejected by a unique index. |

### Who can do what

| | Member (sales agent) | Admin |
|---|---|---|
| Reply assistant | yes | yes |
| Leads | **only the leads they answered**, can change status and add notes on those | **all leads**, filter by agent, sees who handled each |
| Customer history on the Reply page | only their own earlier enquiries | everyone's |
| Price list | read only | add, edit, hide, delete |
| Insights dashboard | no | yes |
| Team page | no | yes |

This is enforced **on the server**, not just by hiding buttons: every lead query is filtered by `createdBy` (`leadScope()` in `services/lead.service.js`), so a member cannot read, change or even confirm the existence of another agent's lead (it answers "not found"), and `/api/insights`, `/api/users` and product changes return 403 for a member. The pages are also hidden in the menu and redirect a member who types the address by hand. Leads created before accounts existed have no owner, so only an admin sees them ("No owner" in the agent filter).

The login page, the Team page and the route guard are in `client/src/pages/LoginPage.jsx`, `TeamPage.jsx` and `components/ProtectedRoute.jsx`. The server side is `routes/index.js`, `middleware/requireAuth.js`, `services/user.service.js` and `utils/{password,token,cookies}.js`.

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

### Edge cases handled

Real WhatsApp messages are messy, so the pipeline cleans the text first (`utils/messageCleaner.js`, `utils/numberWords.js`) and then extracts.

| Situation | Example | Result |
|---|---|---|
| Fractional gemstones | `neelam 5.25 ratti` | priced as 5.25 × rate (decimals only for ratti, max 2 places) |
| Thousands separators | `rudraksha 1,000 pcs` | 1000 (also `1,00,000`) |
| Glued text | `5mukhi rudraksha 100pcs` | `5 mukhi`, `100 pcs` |
| Spoken numbers (voice input) | `paanch ratti`, `do sau`, `पांच रत्ती` | 5, 200, 5. Converted only when a unit word follows, so "rate **do**" stays "give the rate" |
| Numbers that are not quantities | `10% discount`, `Rs 500`, `budget 20000`, `2 din mein`, `5 carat`, `2 kg`, `11 mukhi`, `10:32` | ignored. A weight in carat/kg is never read as ratti |
| Pasted WhatsApp text | `[10:32 am, 16/11/2026] Ramesh: Neelam 5 ratti` | timestamp and name removed |
| Spelling mistakes | `pukhraaj`, `panaa`, `nilam` | one wrong letter accepted (names of 5+ letters only, so short common words are never turned into products) |
| Customer does not want it | `neelam nahi chahiye, moonga 20 ratti` | only moonga is quoted |
| Two requests in one message | `moti kharab mila, refund chahiye aur rudraksha 100 pcs chahiye` | complaint reply first, then prices for the Rudraksha. The faulty product is never quoted |
| Vague request | `rudraksha 100 pcs`, `mala 50 pcs` | the real options of that type at that quantity (malas only for "mala"), with no combined total |
| Not a sales message | `delivery kitne din`, `certificate?`, `hello`, `👍` | "our team will help" template, never an invented answer |
| Puja price vs booking | `kaal sarp puja ka rate` vs `puja book karni hai` | price enquiry vs booking (asks name, gotra, date) |
| Language | `What is the rate of emerald` / `Neelam का rate` / `नीलम का रेट` | English / Hinglish / Hindi, decided by script, not by the AI |
| AI misbehaves | wrong id, invented quantity, bad JSON, code fences, capital letters, 429 | guards and fallback; one automatic retry on a short rate limit |
| AI wording risks | "order confirmed", "Namaste ji" with no name | forbidden in the prompt; delivery/payment questions never go to the AI |
| Bad API input | broken JSON, 15 KB body, wrong types, `q[$ne]=x`, regex characters | clean 400/413 errors, nothing executed |

### Known limits

- The same product twice with two quantities (`neelam 5 ratti aur neelam 10 ratti`) keeps only the first.
- Two requests in one message are split only at a comma, `and` or `aur`, and only for complaints / order status.
- Units other than ratti, pcs, mala and puja (kg, carat, dozen) are not converted. The reply asks for the quantity instead of guessing.
- A misspelling of a very short name (`moti`) is not corrected.

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
| GET | `/api/leads?status=&q=&intent=&day=&agent=` | List leads. A member gets only their own; `agent` (an admin filter, or `none`) is ignored for a member. `day` is `YYYY-MM-DD` in Indian time. Includes status counts for the same scope. |
| PATCH | `/api/leads/:id` | `{ status }` (own leads only for a member) |
| POST | `/api/leads/:id/notes` | `{ text }` (own leads only for a member) |
| GET | `/api/insights?days=7\|14\|30` | **Admin.** Dashboard: KPIs, trend vs previous period, daily series, pipeline, products, intents, follow-ups |
| GET | `/api/products` | The price list (an admin also gets hidden products and spelling variants) |
| POST / PATCH / DELETE | `/api/products`, `/api/products/:id` | **Admin.** Add, edit (whole product), delete a product |
| GET | `/api/health` | AI and database status |

## Done

- Intent, language, product and quantity detection for English / Hindi / Hinglish
- Tier pricing from a 18-item price list, multi-product quotes with a total, "order more to save" hint
- Editable reply with copy and "Open in WhatsApp" buttons
- Vague requests ("Rudraksha 100 pcs chahiye") quote the options in that category at that quantity
- Every query saved as a lead; Leads page with status pipeline, notes, search, filters
- Returning-customer memory with a personalised greeting, insights dashboard, voice input
- Team login with an admin-managed Team page, hashed passwords, signed cookie sessions and protected routes
- Guardrails, rule-based fallback, rate limiting
- 156 automated tests (pricing, guards, edge cases, validation, login security, price list, lead access), mobile-friendly UI

## Next (with one more week)

- Password reset by email, "sign out everywhere", and two-factor sign-in
- Record which team member handled each lead
- Edit the price list from the UI (stored in MongoDB) instead of a code file
- Number words in Hindi ("paanch sau") and units such as kg / dozen. Voice input works best when the browser writes numbers as digits.
- Connect the WhatsApp Business API (webhook), so messages arrive without pasting
- Follow-up reminders for leads stuck in Contacted or Quoted
- Track which agent handled each lead and add follow-up reminders
