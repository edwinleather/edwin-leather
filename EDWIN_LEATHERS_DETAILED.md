# Edwin Leathers — Detailed How It Works

A complete walkthrough of the architecture, data flow, admin backoffice, the
recent UI/UX fixes, and the security hardening applied to the project.

> The final "overview" summary lives in `EDWIN_LEATHERS_OVERVIEW.md`.

---

## 1. Repository layout

```
edwin-leathers/
├── apps/
│   ├── api/                 Express + TypeScript backend (MongoDB, Razorpay)
│   │   └── src/
│   │       ├── config/      env, db, backofficeDb, firebase, cloudinary
│   │       ├── models/      Mongoose schemas
│   │       ├── routes/      HTTP routes (public + backoffice)
│   │       ├── services/    business logic (orders, inventory, coupons, …)
│   │       └── middleware/  auth, error, backoffice guards
│   └── web/                 Next.js 16 (Turbopack) storefront + backoffice UI
│       ├── app/             App Router pages + backoffice managers
│       ├── components/      Storefront components
│       └── lib/             API client helpers + React hooks
├── scripts/                 deploy/maintenance helpers
├── vercel.json              Vercel routing (single web app serves API too)
└── README / ARCHITECTURE / CONFIGURE_ME / INTEGRATIONS
```

The production app is deployed to Vercel as a single Next.js app
(`edwin-leathers-web.vercel.app`). The Express API is bundled into the same
app and served from `/api/v1/*` via the Vercel config, so both the storefront
and the API share one domain and one environment.

---

## 2. Backend (apps/api)

### 2.1 Environment & startup
- `src/config/env.ts` reads `process.env` via a small `value()` helper and
  exports a typed `env` object plus `isConfigured()`.
- `src/config/db.ts` (product DB `edwin-leathers`) and `src/config/backofficeDb.ts`
  (admins DB `edwin-backoffice`) are lazily connected on demand via
  `ensureDatabase()` / `ensureBackoffice()`.
- `src/app.ts` wires middleware in this order:
  1. `helmet()` — security headers, `x-powered-by` disabled.
  2. `cors()` — locked to `env.clientUrl`, credentials allowed.
  3. A **global rate limiter** (trusted-IP-aware key) for the whole API.
  4. **Per-endpoint rate limiters** for `/auth`, `/orders`, `/reviews`, `/feedback`.
  5. `express.raw()` for the Razorpay webhook (needs exact bytes) then `express.json()`.
  6. Routers, 404 handler, and a central error handler.

### 2.2 Data models (`src/models`)
- `Product` — catalog items with nested `variants[]` (each with its own SKU,
  price, active flag, and three inventory fields: `inventoryTotal`,
  `inventoryStoreAllocated`, `inventoryAvailable`, plus `inventoryReserved`,
  `lowStockThreshold`, `allowBackorder`).
- `Category` — store categories (name, slug, image).
- `User` — customer accounts (email, firebaseUid, name, phone, role).
- `Order` — one order per checkout with `lines[]`, `subtotal`, `deliveryFee`,
  `tax`/GST, `total`, `payment` (Razorpay ids + status), `orderStatus`, and a
  `timeline[]` of events.
- `Review` — product reviews with images.
- `Asset` — uploaded media (Cloudinary public id + url).
- `SiteSetting` — storefront configuration: announcement, hero fields, the
  editable **homepage** object, and `estYear`.
- `DeliveryConfig` / `TaxConfig` — per-state delivery fees + free-delivery
  threshold / GST rate + waiver threshold.
- `PageContent` — CMS pages keyed by `key` (story, about, shipping-policy,
  returns-policy, terms, privacy) holding a flexible `content` blob + `updatedBy`.
- `backoffice` models — `AdminUser` (email, role, active, permissions[]),
  `AdminRole` (named role with feature flags), `Coupon`, `Log` (audit/error log).

### 2.3 Business logic (`src/services`)
- `orders.ts` — builds server-authoritative order totals (products + delivery +
  GST), applies coupons, persists the order. Totals are NEVER trusted from the client.
- `inventory.ts` — `reserveStock`, `releaseStock`, `commitStock`, and
  `setVariantInventory`. Available = total − store allocation − reserved.
- `coupons.ts`, `delivery.ts`, `tax.ts` — coupon validation and config-driven
  delivery/GST computation with in-memory cache + invalidation.
- `email.ts` — order confirmation emails.
- `backoffice.ts` — resolves admin identity/role/features.

### 2.4 Public routes
- `GET /api/v1/products` + `/api/v1/products/:slug` — public catalog.
- `GET /api/v1/categories` — category list for navigation.
- `POST /api/v1/auth/firebase` — exchange a Firebase ID token for the httpOnly
  session cookie; also session/logout endpoints.
- `GET /api/v1/site` — public site settings (announcement, homepage).
- `GET /api/v1/site/pages/:key` — public CMS page content.
- `POST /api/v1/orders` + `/validate-coupon` — checkout (requires verified auth).
- `POST /api/v1/reviews` — submit a review (verified customer).
- `POST /api/v1/feedback` — feedback/contact form submissions.
- `POST /api/v1/payments/...` — Razorpay create-order, verify, and webhook.

### 2.5 Backoffice routes (`src/routes/backoffice.ts`, `admin.ts`)
All gated by `requireBackofficeAdmin` (re-validates the admin record against
`edwin-backoffice` on every request) and, where appropriate,
`requireBackofficeFeature(...)`. Examples:
- `/stats`, `/products`, `/categories`, `/orders`, `/customers`, `/coupons`
- `/reviews`, `/assets`, `/admins`, `/roles`, `/logs`
- `/delivery` (feature `shipping`), `/tax` (feature `taxes`),
  `/settings` (feature `homepage`), `/pages` (feature `pages`)
- `POST /admin/media/replace` — replaces an asset everywhere it is referenced
  (see "Asset replace" below).

---

## 3. The current audit & fixes (this session)

The storefront, checkout, admin backoffice, and API were reviewed end-to-end
(mobile + desktop). All fixes below are applied and both workspaces build.

### 3.1 Search & navigation (previously broken)
- **Header search now works.** A search box lives in the desktop header and in
  the mobile menu. Submitting navigates to `/shop?q=<term>`, and the shop page
  filters products by name, subtitle, category, and SKU.
  - `SiteHeader.tsx` was rewritten: dynamic category links fetched from the
    API, active-link states, working search (desktop bar + mobile menu search).
  - `SiteFooter.tsx` now lists real categories from the API instead of hardcoded ones.
  - New `apps/web/lib/useCategories.ts` provides a `useCategories()` hook and a
    `useSearchNavigation()` helper shared by header and shop.
  - `ShopClient.tsx` gained an in-page search box (name/subtitle/category/SKU),
    a clear button, a result count, and a `useEffect` that syncs to the
    `?q=`/`?category=` query params so header→shop navigation works.
- **Categories sit alongside "Shop" in the nav bar** (previously hardcoded).
- **Mobile/desktop nav parity** — the mobile menu carries the same category
  links and search as the desktop bar.

### 3.2 Landing page details
- **"Shop the collection" hero button no longer slides/jumps on hover.** Added
  `.hero .button:hover { transform: none; ... }` so it only changes shading.
- **"Est. 2026" text is now configurable.** `SiteSetting` gained `estYear`
  (default 2026). `HomepageEditor` has an "Established year" number field and
  the storefront `Hero` renders `estYear` from settings.
- Announcement bar, hero, marquee, featured products, editorial, stats,
  categories, and new-arrivals sections are all editable in the admin
  "Homepage editor" with typed validation on save.

### 3.3 Cart / checkout / order flow fixes
- **Free-shipping coupon now actually zeroes delivery.** `CheckoutClient.tsx`
  treats the free-shipping coupon as covering the delivery fee so the total
  reflects free delivery.
- Missing error/notice styling added: global `.auth-error`, `.checkout-error`,
  `.checkout-note` in `globals.css` so failures/notes are clearly visible.
- **Reviews no longer crash when a review has no images**
  (`review.images?.length` guard) in `Reviews.tsx`.
- **Duplicate mobile "Add to bag"** button removed: `.purchase-row` is hidden
  below 860px so only one purchase control shows on phones.
- **Account overview order cards** gained a date column
  (`.order-card__date`) so users can see when they ordered.

### 3.4 Forms (were fake/stubbed)
- **Contact form now submits for real.** `ContactForm.tsx` was rewritten to
  POST `/api/v1/feedback` with named inputs, busy/error states, and genuine
  success feedback (it previously showed a fake success message).
- **Feedback form default path fixed** to `/.netlify/functions/api/v1`
  (matching the deployed API location).
- **Signup now splits First / Last name** (`AuthPanel.tsx`) instead of one name field.

### 3.5 Admin backoffice fixes
- Global admin CSS added: `.feature-grid` / `.feature-chip` (role editor),
  `.block-drag` / `.block-list` (page editor), `.admin-header__actions`,
  extra `.status--*` badges.
- `CategoriesManager` header label corrected from "Products" to "Description".
- `AdminsManager` now surfaces load errors instead of failing silently.
- `RolesManager` feature labels completed (added taxes, pages, error-logs).
- `ReviewsManager` gained a search box.

---

## 4. Security hardening (this session)

Findings were triaged by severity (High / Medium / Low) and fixed:

### High
- **H1 / L1 — JWT secret was a known, hardcoded fallback.**
  - Removed the fallback in `config/env.ts` (was `DEMO_REPLACE_ME`). Now
    `jwtSecret` comes strictly from `JWT_SECRET` with **no** fallback.
  - `isConfigured()` was made stricter: rejects placeholders, short/word-like
    secrets, and values under 32 characters, so the system **fails closed**.
  - `requireAuth` (middleware/auth.ts) now returns 503 "Authentication is not
    configured" if the secret is not a real configured value.
  - `apps/api/.env` was updated with a fresh, strong random secret. This env
    file is git-ignored and **must be re-provisioned** in the hosting provider
    (Vercel) with the same value — see Deployment section.
- **H2 — Backoffice feature scoping.**
  - `/settings` now requires the `homepage` feature, `/delivery` requires
    `shipping`, `/tax` requires `taxes` (via `requireBackofficeFeature`), so
    employees without those permissions cannot edit store configuration.
  - The homepage settings payload is now validated with a strict typed zod
    schema (marquee/featured/editorial/stats/categories/newArrivals + estYear)
    instead of an open `z.record`.

### Medium
- **M1 — Global rate limit key could be spoofed via `X-Forwarded-For`.**
  The `keyGenerator` now derives the key from the socket address and only uses
  the first hop of the forwarded chain when it looks like a real IP, so the
  header can't be used to mint unlimited keys.
- **M2 — No per-endpoint abuse limits.** Added stricter rate limits for
  `/auth` (30/15min), `/orders` (10/min), `/reviews` (5/min), `/feedback`
  (10/min).
- **M3 — Inventory reservation race.** `reserveStock` now uses an atomic
  conditional update that re-checks stock within the same write
  (`variants.inventoryAvailable >= quantity`), preventing concurrent orders
  from over-reserving past physical stock.
- **M4 — NoSQL injection via `?category=`.** The products route rejects query
  values containing MongoDB operators (`$gt`, `$regex`, …) before building the
  filter.
- **M5 — Payment verification used a plain string compare.** Both the
  `/verify` signature check and the webhook now use `timingSafeEqual`.

### Low
- **L3 — Unbounded cart size.** Order item arrays are capped at 50 lines (and
  each quantity already capped at 20).

### Already solid (verified, not changed)
- Helmet + locked CORS + httpOnly/sameSite cookies.
- Order totals are server-authoritative (client amounts are not trusted).
- Backoffice re-validates the admin record against the DB on every request.
- The Razorpay webhook already used `timingSafeEqual` on the raw body.

> Note: there is **no OTP / password-reset flow** in the backend (only a stale
> `dist/` build). If email-based magic links are wanted later, that is new work.

---

## 5. Asset replace (kept requirement)

`POST /admin/media/replace` (in `admin.ts`) uploads a new image to the same
Cloudinary folder as the old one, then rewrites every reference from the old
public id/url to the new one across:
- `Product.images[]`
- `Review.images[]`
- `Category.imageUrl`
- `SiteSetting` (heroImage, homepage editorial image, category cards)
- `PageContent` (hero image + all block images/items)
- the `Asset` record itself, then deletes the old file.

The frontend `AssetsManager` has a Replace button and search. This honours the
rule that a replaced asset is updated everywhere it is currently used rather
than breaking those references.

---

## 6. The page CMS (kept from prior work)

- Backend: `PageContent` stores `{ key, content, updatedBy, timestamps }`.
  Public `GET /site/pages/:key` for the storefront; backoffice
  `GET/PUT /pages/:key` gated by the `pages` feature.
- Frontend: `apps/web/lib/pages.ts` fetches pages; `PageRenderer.tsx` renders
  story/about (statements, image-text, values, image-band, CTA) and
  policy (policy-section) blocks. Six static pages (story, about,
  shipping-policy, returns-policy, terms, privacy) now fetch CMS content at
  request time (they appear as dynamic `ƒ` routes in the build output).
- Backoffice: `PageEditor.tsx` lets admins edit the hero, sections, and blocks,
  then save the whole content object back to the API.

---

## 7. Storefront components (apps/web/components)

- `SiteHeader.tsx` / `SiteFooter.tsx` — dynamic nav, categories, search.
- `Hero.tsx` — landing hero with configurable estYear + hover-safe button.
- `ShopClient.tsx` — search + category filtering on the shop page.
- `ProductCard.tsx`, `ProductPage` pieces, `CartDrawer`, `CheckoutClient.tsx`,
  `Reviews.tsx` — shopping + reviews.
- `ContactForm.tsx`, `FeedbackForm.tsx`, `AuthPanel.tsx` — real form submissions.
- `PageRenderer.tsx` — CMS page rendering.
- `CategoryDrawer` / `CategorySidebar` — mobile category navigation.

---

## 8. Build & run

```bash
# Backend build (type-checks the API)
npm run build --workspace @edwin/api

# Frontend build (Next.js production build + type check)
npm run build --workspace @edwin/web
```

Both complete successfully. Key files touched this session:
- `apps/api/src/config/env.ts`, `apps/api/src/middleware/auth.ts`,
  `apps/api/src/app.ts`, `apps/api/src/routes/{products,payments,orders,backoffice}.ts`,
  `apps/api/src/services/inventory.ts`, `apps/api/.env`.
- `apps/web/app/globals.css`, `apps/web/components/{SiteHeader,SiteFooter,ShopClient,Hero,ContactForm,FeedbackForm,CheckoutClient,Reviews,AuthPanel}.tsx`,
  `apps/web/lib/useCategories.ts`,
  `apps/web/app/backoffice/{HomepageEditor,CategoriesManager,AdminsManager,RolesManager,ReviewsManager,AssetsManager}.tsx`.

---

## 9. Deployment note (important)

`apps/api/.env` was updated with a new strong `JWT_SECRET`. This file is local
and git-ignored. The hosting environment (Vercel) must be updated with the same
`JWT_SECRET` value — otherwise, after deploy, the API fails closed with
"Authentication is not configured". Generate/paste the identical secret into
Vercel's environment variables for the app.

No secrets are included in this document by design.