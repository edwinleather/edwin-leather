# Integration boundaries

The repository intentionally separates the polished UI from external providers. You can develop the entire storefront in demo mode and wire services one at a time.

## MongoDB Atlas

`apps/api/src/config/db.ts` connects only when `MONGODB_URI` is present and not a demo placeholder. Product reads fall back to demo data when the database is unavailable.

## Razorpay

`POST /api/v1/payments/create-order` is the place to create a Razorpay order.

`POST /api/v1/payments/webhook` is the place to verify the webhook signature and update payment/order state. Treat the backend webhook as authoritative.

## Shiprocket

`POST /api/v1/shipping/create-shipment` is the shipment creation boundary.

`GET /api/v1/shipping/track/:awb` returns a tracking URL placeholder. Replace it with Shiprocket/authenticated tracking data if you want detailed milestones later.

## Cloudinary

Store image metadata/URLs in MongoDB, not raw image binary. Product image uploads should be server-signed in production.

## Resend

Add a small email service module under `apps/api/src/services/` when you have the API key and a verified sender domain. Keep transactional mail server-side.

## GA4 / Sentry

The frontend includes configuration placeholders. Add the provider SDKs after you create real projects so you do not ship demo project identifiers.
