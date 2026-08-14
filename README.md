# Edwin Leathers — modern leather e-commerce starter

A polished, responsive leather-goods storefront and commerce API scaffold built around the requested stack:

- **Frontend:** Next.js + React
- **Backend:** Node.js + Express
- **Database:** MongoDB Atlas + Mongoose
- **Payments:** Razorpay-ready integration boundary
- **Shipping:** Shiprocket-ready integration boundary
- **Images:** Cloudinary-ready configuration
- **Email:** Resend-ready configuration
- **Deployment:** Vercel-friendly monorepo

The project runs in **demo mode by default**, so the UI works before any paid/external services are configured.

## What is included

- Luxury editorial homepage designed for leather products
- Smooth native View Transition navigation with graceful fallback
- Shared product-image transition from catalog card to product page
- Animated mobile navigation and cart drawer using Framer Motion
- Shop filtering and sorting
- Product variants, stock state, SKU concepts, and cart persistence
- Demo checkout with Razorpay / COD presentation
- Account and order-history UI
- Admin dashboard foundation
- Express API with product, order, auth, payment, and shipping route boundaries
- Mongoose models for users, products, orders, and coupons
- Security middleware foundations: Helmet, CORS, rate limiting, validation-ready structure
- Separate configuration guide with every placeholder you need to replace

## Run locally

```bash
npm install
cp .env.example .env
cp apps/web/.env.local.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
npm run dev
```

Then open:

- Storefront: `http://localhost:3000`
- API health: `http://localhost:4000/api/v1/health`

If you prefer separate terminals:

```bash
npm run dev:web
npm run dev:api
```

## Important demo behavior

- The storefront uses local demo product data so it renders even without MongoDB.
- Cart state is stored in localStorage.
- Checkout does **not** charge a card or create a real shipment.
- API payment/shipping endpoints return safe integration placeholders until credentials are added.
- Authentication screens are UI foundations only; production session flows should be completed before launch.

## Project map

```text
edwin-leathers/
├── apps/
│   ├── web/                  # Next.js storefront
│   │   ├── app/              # Routes
│   │   ├── components/       # UI / motion / cart components
│   │   ├── lib/              # Demo data, types, config
│   │   └── public/           # Local brand assets
│   └── api/                  # Express + Mongoose API
│       ├── api/index.ts      # Vercel serverless entry
│       └── src/              # App, routes, models, middleware
├── .env.example              # Every required environment variable
├── CONFIGURE_ME.md           # Replace-this-later checklist
├── INTEGRATIONS.md           # Service-by-service wiring guide
└── ARCHITECTURE.md           # Architecture and data-flow notes
```

## Production checklist

Before using this for real orders, complete the items in `CONFIGURE_ME.md`, especially database backups, secure production secrets, Razorpay webhook verification, proper authentication, production Cloudinary upload validation, shipping credentials, email sender verification, and legal/policy pages.
