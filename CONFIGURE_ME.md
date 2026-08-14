# Edwin Leathers — replace these demo values before launch

This file is the single checklist for URLs, paths, credentials, and content you will replace later.

## 1. Environment files

Use the purpose-specific examples:

```bash
cp apps/web/.env.local.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

The root `.env.example` is a master reference only. Keep server secrets out of `apps/web/.env.local` even though Next.js only exposes `NEXT_PUBLIC_*` values to browser bundles. Never commit production secrets.

## 2. Storefront content and demo URLs

Edit:

- `apps/web/lib/site-config.ts`
  - brand name
  - support email
  - phone / WhatsApp placeholder
  - Instagram URL
  - canonical domain
  - announcement text
  - free-shipping threshold
- `apps/web/lib/demo-data.ts`
  - product names
  - prices
  - SKUs
  - inventory
  - product image URLs
  - descriptions
  - category assignments

Current product photography is represented with **demo Unsplash URLs**. Replace every production image with your own Cloudinary delivery URL.

## 3. MongoDB Atlas

Dashboard: `https://cloud.mongodb.com/`

Replace:

```env
MONGODB_URI=mongodb+srv://...
```

Database models live in:

- `apps/api/src/models/Product.ts`
- `apps/api/src/models/User.ts`
- `apps/api/src/models/Order.ts`
- `apps/api/src/models/Coupon.ts`

For production, enable a MongoDB plan with backups before real order data matters.

## 4. Razorpay

Dashboard: `https://dashboard.razorpay.com/`
Docs: `https://razorpay.com/docs/`

Replace:

```env
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

Backend boundary:

- `apps/api/src/routes/payments.ts`

Frontend checkout surface:

- `apps/web/app/checkout/page.tsx`

Do not mark an order as paid from browser state. Verify Razorpay signatures/webhooks on the API.

## 5. Shiprocket

Dashboard: `https://app.shiprocket.in/`
API docs: `https://apidocs.shiprocket.in/`

Replace:

```env
SHIPROCKET_EMAIL=
SHIPROCKET_PASSWORD=
SHIPROCKET_TRACKING_BASE_URL=
```

Backend boundary:

- `apps/api/src/routes/shipping.ts`

Store AWB, courier, shipment ID, and tracking URL on the order after shipment creation.

## 6. Cloudinary

Console: `https://console.cloudinary.com/`
Docs: `https://cloudinary.com/documentation`

Replace:

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Then replace demo image URLs in:

- `apps/web/lib/demo-data.ts`

For production uploads, validate MIME type, file size, dimensions, and authenticated upload signatures on the backend.

## 7. Resend transactional email

Dashboard: `https://resend.com/`
Docs: `https://resend.com/docs`

Replace:

```env
EMAIL_API_KEY=
EMAIL_FROM=
```

Recommended events:

- account created
- password reset
- order confirmed
- payment success
- order shipped
- order delivered
- cancellation
- refund initiated

## 8. Authentication

Replace:

```env
JWT_SECRET=
JWT_EXPIRES_IN=7d
COOKIE_NAME=edwin_session
```

Complete production auth in:

- `apps/api/src/routes/auth.ts`
- `apps/api/src/middleware/auth.ts`

Required before launch:

- bcrypt password hashing
- HttpOnly secure cookies
- CSRF strategy if using cookie auth
- email verification if desired
- password-reset token workflow
- backend role checks for admin/superadmin
- login throttling / brute-force protection

## 9. Domain and Vercel

Vercel: `https://vercel.com/`

Suggested production layout:

- Store: `https://edwinleathers.in`
- API: `https://api.edwinleathers.in`

Update:

```env
CLIENT_URL=https://edwinleathers.in
SERVER_URL=https://api.edwinleathers.in
NEXT_PUBLIC_API_URL=https://api.edwinleathers.in/api/v1
NEXT_PUBLIC_SITE_URL=https://edwinleathers.in
```

Deploy `apps/web` and `apps/api` as separate Vercel projects for the simplest setup.

## 10. Analytics and monitoring

Google Analytics: `https://analytics.google.com/`
Sentry: `https://sentry.io/`

Replace:

```env
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

Recommended commerce events:

- `view_item`
- `add_to_cart`
- `begin_checkout`
- `purchase`

## 11. Brand assets

Replace:

- `apps/web/public/favicon.svg`
- textual wordmark in `apps/web/components/SiteHeader.tsx`
- footer details in `apps/web/lib/site-config.ts`

Optional later:

- add OG image at `apps/web/public/og.jpg`
- add real product photography via Cloudinary
- add custom licensed brand font files only if you own redistribution/webfont rights

## 12. Legal / operational content before launch

Add your actual pages for:

- Privacy Policy
- Terms & Conditions
- Shipping Policy
- Returns / Refund Policy
- Contact details
- GST / business information if applicable

The footer currently uses placeholder links for these.
