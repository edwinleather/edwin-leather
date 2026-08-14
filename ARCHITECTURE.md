# Architecture

```text
Customer
   |
   v
Next.js storefront (Vercel)
   |
   v
Express API (Vercel / later move independently if needed)
   |
   +--> MongoDB Atlas (products, variants, inventory, users, carts, orders, coupons, returns)
   +--> Razorpay (online payments + refunds + webhooks)
   +--> Shiprocket (shipment creation, AWB, tracking)
   +--> Cloudinary (product media)
   +--> Resend (transactional email)
```

## Order state is intentionally separated

### Order

- pending_payment
- confirmed
- processing
- packed
- shipped
- delivered
- cancelled
- return_requested
- returned
- refunded

### Payment

- pending
- paid
- failed
- refunded
- partially_refunded
- cod_pending
- cod_collected

### Shipping

- not_created
- ready_to_ship
- picked_up
- in_transit
- out_for_delivery
- delivered
- rto

Keeping these separate prevents a shipping event, refund, or COD collection from corrupting the overall order lifecycle.

## Inventory

Stock belongs to **variants/SKUs**, not just the parent product. The included product model tracks size/color combinations with SKU and inventory fields.

For real concurrency, reserve inventory atomically when an order is created and restore it on failed payment/cancellation. For high-volume stores, add transactional/atomic reservation logic before launch.

## UI transition strategy

The storefront combines:

1. the browser View Transition API when available;
2. CSS view-transition names on product images for card → detail continuity;
3. Framer Motion for drawers, mobile navigation, staggered reveals, and micro-interactions;
4. CSS fallbacks for browsers without View Transition support;
5. reduced-motion handling for accessibility.
