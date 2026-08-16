# SEO Audit - Edwin Leathers (India-First)

**Date:** August 2026
**Scope:** Storefront (`apps/web`) + API (`apps/api`), audited from source.
**Note on data:** No Google Search Console, GA4, or order-level data was available in this repository at audit time. Where I reference demand or sales geography, it is labelled as a **hypothesis requiring validation** - nothing here is fabricated. Aggregate order/state data can be obtained later from MongoDB orders + GA4 (see IMPLEMENTATION doc).

---

## 1. Current state (what the site is)

- **Stack:** Next.js App Router (server components) storefront + Express/MongoDB API. Products and categories are served live from MongoDB via `/api/v1/products` and `/api/v1/categories`.
- **Catalog:** Data-driven. Products carry `slug`, `name`, `subtitle`, `description`, `category` (string), `collection`, `brand`, `price`, `compareAtPrice`, `images[url, alt]`, `variants[label, sku, color, size, inventory]`. Categories carry `name`, `slug`, `description`, `imageUrl`.
- **Money pages:** Homepage, `/shop`, `/product/[slug]`, and category pages at `/category/[slug]`.
- **Sitemap/robots:** Both exist and are wired (`/sitemap.xml`, `/robots.txt`). `/backoffice`, `/account`, `/cart`, `/checkout`, `/login`, `/signup`, `/thank-you`, `/api/` are disallowed. Good baseline.
- **Analytics:** `NEXT_PUBLIC_GA_MEASUREMENT_ID` is defined in `.env.example`; GA4 is now implemented in the storefront and fires ecommerce events (auto-disabled until the env var is set).
- **Payments/shipping:** Razorpay + COD are implemented in checkout. Delivery config (fee, threshold INR 2,499, state fees) is fetched from the API. GST is modelled.
- **Checkout:** Login-gated (email verified before ordering), cart persisted server-side when logged in, localStorage for guests.

---

## 2. Critical SEO problems found

### P0 - critical issues that were found

1. **No canonical tags on any page** (before this pass). No page emitted a `<link rel="canonical">`, so any URL variant (trailing slash, query params, UTM) could be treated as duplicates. **Fixed: every page now has a self-referencing canonical.**
2. **No category landing pages.** Categories existed only as client-side filter pills on `/shop?category=X` - zero indexable category URLs, so the site could not rank for "leather bags", "leather wallets", "leather belts", "leather bags for office" etc. **Fixed: indexable `/category/[slug]` pages created.**
3. **No structured data anywhere.** No Product JSON-LD (price/availability/currency INR), no BreadcrumbList, no ItemList. **Fixed: Product + BreadcrumbList on product pages, BreadcrumbList + ItemList on category pages.**
4. **Product pages showed demo placeholder copy.** The "Shipping & returns" accordion said *"Demo policy: ships in 2-4 business days. Replace this copy..."* - visible to every customer. **Fixed: real policy links + delivery config.**
5. **Homepage title was 67 characters** ("Edwin Leathers - Handcrafted Leather Bags, Wallets & Belts in India" with an em dash) - over the ideal length. **Fixed: 55 characters, hyphen instead of em dash.**
6. **Em dashes used throughout titles and copy.** **Fixed: replaced with hyphens everywhere in `apps/web`.**
7. **`NEXT_PUBLIC_SITE_URL` must be set in production.** `siteUrl()` falls back to `http://localhost:3000`; if the env var is missing, sitemap, robots and canonical URLs point at localhost. Verify it is configured on Vercel.

### P1 - material ranking/revenue impact

8. **Search-result and filter URLs were indexable duplicates.** `/shop?q=...` (internal site search) was not noindexed; `/shop?category=X` duplicated `/shop` content with no canonical. **Fixed: search URLs noindexed, `/shop` canonicalized.**
9. **Product page metadata was weak.** Title was just the product name; description was the full untruncated description; no category context; generic alt text. **Fixed: `Product | Category` titles, truncated descriptions, descriptive alt text from the API.**
10. **No GA4 ecommerce tracking.** Impossible to measure product/category/mobile conversion rates or revenue by state/city - which blocks the South-India strategy. **Fixed: view_item_list, select_item, view_item, add_to_cart, begin_checkout, purchase events.**
11. **Internal links all pointed at weak `/shop?category=` URLs** (header, footer, homepage category rail). **Fixed: all link to real category pages.**
12. **Sitemap omitted categories.** **Fixed: category URLs added.**

### P2 - important but not blocking

13. **Homepage metadata was brand-only** - told Google (and users) nothing about what is sold, and didn't mention India delivery. **Fixed: title/description now state what is sold + India delivery (factual, no stuffing).**
14. **No breadcrumbs visible or in schema** on product/category pages. **Fixed: visible breadcrumbs + BreadcrumbList schema on product and category pages.**
15. **Empty "Details" accordion** on product pages - `product.details` is always an empty array. **Fixed: shows real spec data (SKU, colour, size, brand, HSN/GST).**
16. **No pagination** on `/shop` - acceptable now (small catalog), revisit as the catalog grows.
17. **No Google Merchant Center feed** - no `GTIN/MPN` in the data model; Merchant Center setup is manual (see IMPLEMENTATION doc).
18. **No reviews/ratings data wired into schema** - only add `aggregateRating` when genuine reviews exist in the DB.

---

## 3. What ranks today (money map)

Current money pages, by expected revenue potential given a leather-goods catalog in India:

| Tier | Page / intent | Notes |
|---|---|---|
| **Tier 1** | **Category pages** (Bags, Wallets, Belts, Work, Travel) | Highest commercial intent. "Leather bags", "leather wallets", "leather belts" - these are the queries that convert. Created in this pass. |
| **Tier 1** | **Product pages** | Rank for long-tail product queries; now have schema, canonicals, better titles. |
| **Tier 2** | `/shop` | Category-agnostic "buy leather goods online" page; now canonicalized. |
| **Tier 3** | Homepage, story/about, discount | Brand + navigational queries. |
| **Tier 3** | Blog/guides (none yet) | Future: buying guides that link to products (see KEYWORDS doc). |

---

## 4. South India opportunity (hypotheses to validate)

The business reports its strongest base in South India. Everything below is a **hypothesis to be confirmed with GSC/GA4/order data**:

- Queries like "leather bags Bangalore", "leather handbags Chennai", "leather office bags Hyderabad" have genuine commercial intent in Tier-1/2 Indian cities. The correct response is **not** 50 city pages; it is (a) strong category + product pages, (b) India-wide delivery messaging already present, (c) a small number of genuinely useful location pages **only if** the business has real service/demand there.
- **No city pages were created** - this complies with the brief. Revisit only with Search Console evidence (positions 4-20, real impressions) plus a page that adds unique value (delivery info, popular products, FAQs).
- Measurement first: GA4 (now implemented) + order-state aggregation will show whether Tamil Nadu / Karnataka / Kerala / Telangana / Andhra Pradesh really outperform - and by which categories.

---

## 5. Conversion problems found

1. **Demo policy copy on product pages** (see P0-4) - erodes trust at the exact moment of purchase. **Fixed.**
2. **No breadcrumbs** - harder for customers to orient / navigate back to category. **Fixed on product + category pages.**
3. **Empty details accordion** - missed the chance to show SKU/colour/size/brand/HSN which builds confidence. **Fixed.**
4. **Trust signals not reinforced** - the purchase panel now shows delivery threshold + payment methods; checkout shows Razorpay/COD. No fake claims added.
5. Checkout is login + email-verification gated - friction, but a business decision; flag to re-test later.

## 6. Mobile / performance

- Images: `next/image` with `fill`, blur placeholders, `sizes` attributes, lazy loading (priority on hero/first cards). Solid baseline. Alt text gap fixed.
- No obvious render-blocking third-party scripts (Razorpay loads lazily at checkout; gtag now loads async and only when configured).
- Product gallery uses `next/image` with two large images; Cloudinary/Unsplash URLs are served with size params. Keep an eye on LCP for the hero + first product image.
- CLS is controlled via fixed-height media containers. Good.

---

## 7. Priority recommendations (P0 -> P3)

### P0 - Critical (done unless marked)
- [x] Canonical tags on every page (home, shop, categories, products, policies, contact, etc.).
- [x] Indexable category landing pages at `/category/[slug]` (metadata, H1, description, ItemList + BreadcrumbList schema).
- [x] Product JSON-LD (Product + BreadcrumbList) with INR pricing, availability from real inventory, SKU, brand.
- [x] Remove demo policy copy from product pages - real shipping/returns links + delivery config.
- [x] Search-result pages (`/shop?q=`) noindexed; `/shop` canonicalized.
- [x] Homepage title shortened to 55 characters; em dashes replaced with hyphens everywhere in `apps/web`.
- [ ] **User action:** confirm `NEXT_PUBLIC_SITE_URL` is set on Vercel (else sitemap/robots/canonicals use localhost).

### P1 - High impact (done unless marked)
- [x] GA4 ecommerce events: `view_item_list`, `select_item`, `view_item`, `add_to_cart`, `begin_checkout`, `purchase` (deduped).
- [x] Better product titles (`Product | Category - Edwin Leathers`), truncated descriptions, OG tags.
- [x] Descriptive image alt text from the API's per-image alt (fallback to name + subtitle).
- [x] Internal links (header, footer, homepage rail) now point to real category pages.
- [x] Category URLs added to sitemap.
- [x] Homepage title/description updated to state what is sold + India delivery (factual, no stuffing).
- [ ] **User action:** add GA4 Measurement ID (`NEXT_PUBLIC_GA_MEASUREMENT_ID`) + set up the property; configure Google Merchant Center (see IMPLEMENTATION doc).

### P2 - Medium
- [ ] Blog/guides that link into category pages (see KEYWORDS doc - "Content opportunities"). Highest value: office-bag buying guide, how to choose leather formal shoes, monsoon leather care.
- [ ] Pagination or ISR tuning on `/shop`/category pages as the catalog grows.
- [ ] Add `updatedAt`-based `lastModified` to sitemap (currently fresh timestamp per request - fine, but per-product dates are better).
- [ ] Reviews: when genuine reviews exist in DB, surface them + add `aggregateRating` to Product schema.
- [ ] Merchant Center feed + `GTIN/MPN` fields (data model change; do not fabricate identifiers).

### P3 - Future opportunities (validate first)
- [ ] Regional language content (Tamil/Kannada/Telugu/Malayalam) **only** if professionally reviewed and there is real demand - never machine-generated mass pages.
- [ ] A small number of genuinely useful South-India pages (e.g., "Leather bags in Chennai" with real delivery/FAQ/product value) - **only** with GSC evidence of demand; never a blanket city-page build.
- [ ] Seasonal/festive landing pages (Diwali, Onam, Pongal, corporate gifting) - only when the catalog genuinely supports the angle.
- [ ] WhatsApp order support (widget exists) - surface it on product pages only if the business truly handles orders via WhatsApp.
