# Edwin Leathers — Overview

A short summary of what the project is and what was done in the latest audit.

---

## What it is
Edwin Leathers is an e-commerce store (leather goods) with:
- a **storefront** (Next.js) for browsing, search, cart, checkout, and reviews;
- a **backoffice admin** (same app) for products, orders, customers, coupons,
  reviews, assets, delivery/tax, CMS pages, admins/roles, and the homepage editor;
- a **backend API** (Express + MongoDB) that owns all data, pricing, inventory,
  and payments (Razorpay).

The storefront and API ship as one Vercel app: `edwin-leathers-web.vercel.app`,
with the API at `/api/v1/*`.

## Repo
- `apps/api` — Express backend, MongoDB.
- `apps/web` — Next.js 16 storefront + admin.
- Auth via Firebase; admin DB is separate from the store DB.

---

## What changed in this audit

### Storefront (previously broken details, now fixed)
- **Working search** — a search box in the header (desktop) and mobile menu
  navigates to `/shop?q=…`; the shop filters by name, subtitle, category, and SKU.
- **Dynamic navigation** — real categories from the API in the header, footer,
  and mobile menu, plus active-link states. Categories now sit beside "Shop".
- **Hero "Shop the collection" button** no longer jumps/slides on hover.
- **"Est. 2026" is configurable** in the admin homepage editor.
- **Free-shipping coupon actually zeroes delivery.**
- **Forms are real now** — the contact form submits to the API (it used to fake
  success); feedback default path corrected; signup splits first/last name.
- **Mobile cleanup** — removed a duplicate mobile "Add to bag" button; review
  cards no longer crash when a review has no images; account order cards show a date.

### Admin backoffice
- Cleaner, consistent styling (badges, feature chips, block lists, admin header).
- Category manager column label fixed; admin manager surfaces errors; role
  feature labels completed; reviews manager search added.

### Security (triage: High / Medium / Low)
- **High:** removed a known/hardcoded JWT secret fallback — auth now fails
  closed if `JWT_SECRET` is missing, too short, or a placeholder. Backoffice
  `/settings`, `/delivery`, `/tax` are feature-scoped. Homepage settings payload
  is validated with a strict schema.
- **Medium:** rate limits added (global + auth/orders/reviews/feedback) with a
  spoof-proof IP key; atomic inventory reservation (no over-reserving under
  concurrency); NoSQL-injection guard on `?category=`; constant-time signature
  checks for payment verify + webhook.
- **Low:** order cart capped at 50 lines.
- Verified already-solid: helmet, locked CORS, httpOnly/sameSite cookies,
  server-authoritative order totals, per-request admin re-validation.

### Asset replace (kept rule)
Replacing an asset updates it **everywhere it is referenced** (product images,
reviews, categories, homepage, CMS pages) instead of breaking those references.

### Page CMS (kept from prior work)
Story/about/policy pages are editable in the admin (headings, images, sections,
blocks) and render from the database at request time.

---

## Build status
Both workspaces build cleanly:
- `npm run build --workspace @edwin/api`
- `npm run build --workspace @edwin/web`

## ⚠️ Deployment must-do
`apps/api/.env` got a **new strong `JWT_SECRET`** (local, git-ignored). Before
deploying, set the **same** `JWT_SECRET` in the Vercel app's environment
variables. Without it the API intentionally returns "Authentication is not
configured" (fail-closed). No secrets are written in these docs.

## Docs
- `EDWIN_LEATHERS_DETAILED.md` — full architecture, fixes, and security notes.