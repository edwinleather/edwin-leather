# SEO Implementation Log - Edwin Leathers (India-First)

**Date:** August 2026
**Scope of this pass:** Safe P0/P1 improvements only. No international SEO, no city-page spam, no fabricated business facts. Everything implemented is driven by real catalog/delivery data.

---

## What was changed (files -> reason -> expected effect)

### 1. New: indexable category landing pages
**Files:** `apps/web/app/category/[slug]/page.tsx` (new), `apps/web/app/globals.css` (breadcrumb/category styles)

- Each category from the DB now gets a real URL: `/category/bags`, `/category/wallets`, `/category/belts`, `/category/travel`, `/category/accessories`, `/category/work`.
- Server-rendered with unique H1, meta title (`Bags - Edwin Leathers`), meta description (from the DB), canonical, and visible breadcrumbs.
- Emits `BreadcrumbList` + `ItemList` JSON-LD. No invented copy - the intro text is the category description from the DB plus a factual product count.
- If a category has no products it renders an honest "no products yet" state (no doorway content).

**Expected effect:** These are the site's Tier-1 money pages. Enables ranking for "leather bags", "leather wallets", "leather belts", "leather travel bags" and every category-level buying-intent query. This is the single biggest structural SEO change.

### 2. Product page SEO
**Files:** `apps/web/app/product/[slug]/page.tsx`

- Added canonical (`alternates.canonical`).
- Better titles: `Heritage Tote | Bags - Edwin Leathers`; meta description composed from subtitle + description, truncated to ~158 chars.
- **Product JSON-LD**: name, image(s), description, SKU (from the first variant), brand (only when present), Offer with INR price, availability derived from **real inventory** (InStock/OutOfStock), `NewCondition`, priceValidUntil.
- **BreadcrumbList JSON-LD**: Home -> Shop -> Category -> Product.
- Descriptive alt text from the API's per-image `alt` (fallback: name + subtitle).
- No fake ratings/reviews/stock claims added.

**Expected effect:** Eligible for Google rich results (product snippets), clearer intent signals, better CTR from SERPs, and disambiguated duplicate handling.

### 3. Canonical tags on every page
**Files:** `apps/web/app/page.tsx`, `apps/web/app/contact/page.tsx`, `apps/web/app/feedback/page.tsx`, `apps/web/app/cart/page.tsx`, `apps/web/app/login/page.tsx`, `apps/web/app/checkout/page.tsx`, `apps/web/app/signup/page.tsx`, `apps/web/app/discount/layout.tsx`, `apps/web/app/thank-you/layout.tsx`, `apps/web/app/account/layout.tsx`, `apps/web/app/backoffice/layout.tsx`, `apps/web/lib/pages.ts`

- Every page now emits a self-referencing `<link rel="canonical">` (home, shop, categories, products, about, story, contact, discount, feedback, policies, and transactional pages).
- Relative canonical values are resolved against `metadataBase` (`NEXT_PUBLIC_SITE_URL`).

**Expected effect:** Fixes the "canonical URL not defined" warning; no more duplicate-content ambiguity from URL variants or query strings.

### 4. Title length + dash cleanup
**Files:** `apps/web/app/layout.tsx`, `apps/web/app/category/[slug]/page.tsx`, `apps/web/app/product/[slug]/page.tsx`, plus ~25 files across `components/`, `app/`, `lib/`

- Homepage title shortened from **67 to 55 characters**: `Edwin Leathers - Leather Bags, Wallets & Belts in India`.
- Title template is now `%s - Edwin Leathers` (hyphen; the previous template used an em dash).
- **All em dashes replaced with hyphens** across the entire `apps/web` codebase - metadata, titles, meta descriptions, alt text, visible UI copy, and code comments (0 remaining).

**Expected effect:** Titles fit the recommended 50-60 character range for clean SERP display; consistent, tool-friendly dash usage everywhere.

### 5. Data layer support
**Files:** `apps/web/lib/catalog.ts`, `apps/web/lib/types.ts`, `apps/web/lib/useCategories.ts`, `apps/web/lib/slugs.ts` (new)

- `getCategoryList()` / `getCategoryBySlug()` added; header/footer now use category slugs.
- Product images now carry `imageAlts` mapped from the API.
- `slugify()` helper for deriving category URLs from names.

### 6. Internal linking
**Files:** `apps/web/components/SiteHeader.tsx`, `apps/web/components/SiteFooter.tsx`, `apps/web/components/HomeSections.tsx`

- Desktop + mobile nav, footer "Shop" column and the homepage category rail now link to `/category/[slug]` instead of `/shop?category=X`.
- Category pages cross-link to sibling categories ("Other collections").

**Expected effect:** Every category page is reachable in 1-2 clicks from the homepage; link equity now flows to indexable money pages instead of query-string dead ends.

### 7. Shop page hygiene
**Files:** `apps/web/app/shop/page.tsx`

- `/shop` always canonicals to itself; internal-search URLs (`/shop?q=...`) are `noindex, follow`.
- Filter URL variants no longer create duplicate indexable pages.

### 8. Sitemap
**Files:** `apps/web/app/sitemap.ts`

- Category URLs added (priority 0.7), products 0.8, home 1.0. Static pages unchanged.

### 9. GA4 ecommerce tracking
**Files:** `apps/web/lib/analytics.ts` (new), `apps/web/components/Analytics.tsx` (new), `apps/web/components/ProductListTracker.tsx` (new), `apps/web/components/ProductGrid.tsx`, `apps/web/components/ProductCard.tsx`, `apps/web/components/CartProvider.tsx`, `apps/web/components/ProductPurchasePanel.tsx`, `apps/web/components/CheckoutClient.tsx`, `apps/web/app/thank-you/page.tsx`, `apps/web/app/layout.tsx`

- gtag loads once, **only when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set** - zero impact in demo/dev.
- Events: `view_item_list`, `select_item`, `view_item`, `add_to_cart` (from quick-add, cart-drawer and product-page add-to-bag), `begin_checkout`, `purchase`.
- `purchase` fires once per order (sessionStorage key shared between checkout success and `/thank-you`), with correct INR value/tax/shipping/transaction id.
- Item params include `item_id`, `item_name`, `price`, `item_category`, `item_variant` - enables GA4 product/category/cart-funnel reports by default.

**Expected effect:** This is what makes the "measure South India performance" goal possible: revenue by state/city, product and category conversion rates, mobile vs desktop, and checkout drop-off.

### 10. Product-page trust / conversion
**Files:** `apps/web/components/ProductPurchasePanel.tsx`

- Removed the visible **demo placeholder policy copy**.
- "Shipping & returns" accordion now shows: per-product `deliveryBy` (when present), the real free-delivery threshold from the delivery config, and links to the actual `/shipping-policy` and `/returns-policy` pages.
- Trust notes updated to what checkout genuinely supports: "Free delivery across India over INR 2,499" and "Cards - UPI - Netbanking - COD".
- Empty "Details" accordion replaced with real spec data: SKU, colour, size, brand, HSN/GST.

### 11. Homepage metadata
**Files:** `apps/web/app/layout.tsx`, `apps/web/lib/site-config.ts`

- Default title (55 chars): "Edwin Leathers - Leather Bags, Wallets & Belts in India" (one natural India mention on the homepage; nothing stuffed).
- Description now includes the genuine "Free delivery across India on orders over INR 2,499".

---

## What needs your action

1. **`NEXT_PUBLIC_SITE_URL`** - confirm it's set to your live domain on Vercel. If missing, sitemap/robots/canonicals fall back to `http://localhost:3000` (P0).
2. **GA4** - create a GA4 property (if not done) and set `NEXT_PUBLIC_GA_MEASUREMENT_ID` in Vercel env. After ~2 weeks of orders, you can build the South-India revenue-by-state report (GA4 Explorations can slice by region; `apps/web/app/backoffice` has order data).
3. **Google Merchant Center** (for Google Shopping, India, INR):
   - Create a Merchant Center account and verify the domain (DNS/HTML verification).
   - Enable **free product listings** and link to a Google Ads account if you want paid Shopping.
   - Product data comes from your catalog; the site now exposes Product JSON-LD (name, price INR, availability, SKU, brand, image) which the automatic feed can read - but **GTIN/MPN don't exist in the data model**, so leave those blank or add real ones (never fabricate).
   - Set shipping rules to match the delivery config (INR 120 default, free over INR 2,499) so Merchant Center agrees with the site.
4. **Reviews** - when genuine customer reviews exist, they're displayed; only then should `aggregateRating` be added to the Product schema.
5. **Category descriptions** - make sure each category in the backoffice/DB has a real, useful `description`; that's what renders on the new category pages (currently "Totes, crossbodies and everyday carry" etc.).

---

## Recommended next work (in order)

1. **Verify** the above env vars + deploy; run the pages through Google Search Console URL inspection and submit the new sitemap.
2. **Add 3-4 buying-guide articles** that link to category pages (office bags guide, formal leather shoes, belt sizing, monsoon leather care) - high value, low risk (see `SEO-KEYWORDS-INDIA.md`).
3. **Re-test checkout friction** (login + email verification gate) once GA4 shows checkout drop-off - this is the biggest lever on orders from existing traffic.
4. **Merchant Center feed** (step 3 above).
5. **After ~6-8 weeks of GSC data**, evaluate a small set of South-India pages with evidence of demand - not before.

## Verification notes

- This machine has no bash/Git Bash available, so `npm run build` / `tsc` could not be executed here. Changes were reviewed file-by-file for syntax and type consistency (imports, types, hooks, Next.js 15 async `params`/`searchParams`). Run `npm run build` locally or on Vercel to confirm before/at deploy.
