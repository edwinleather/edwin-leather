# Edwin Leathers — Admin Panel Guide

A complete reference for managing your store through the backoffice admin panel.

---

## Table of Contents

1. [Overview](#overview)
2. [Products](#products)
3. [Categories](#categories)
4. [Attributes](#attributes)
5. [Inventory](#inventory)
6. [Orders](#orders)
7. [Coupons](#coupons)
8. [Promotions](#promotions)
9. [Other Sections](#other-sections)

---

## Overview

The admin panel is the central hub for running your store. Access it at `/backoffice` after logging in as an admin. The left sidebar lists all available sections — which ones you see depends on your role (`employee`, `admin`, or `superadmin`) and the features assigned to your account.

The **Overview** dashboard shows key metrics at a glance:

| KPI | What it means |
|-----|---------------|
| Revenue | Total revenue in rupees for the current period |
| Orders | Number of orders placed |
| Customers | Registered customer count |
| Low stock | SKUs where available stock is at or below the low-stock threshold |

Below the KPIs, a **Recent Orders** table lists the latest orders with order number, customer name, first item, total, and status badge.

---

## Products

The Products section is where you create, edit, and manage your product catalog. It uses a **dual variant system**: legacy hand-entered variants (colour/size) and a newer attribute-driven SKU generator.

### Product Listing

The table shows every product with columns for image thumbnail, name (with a "Featured" badge if applicable), category, price (with compare-at strikethrough if set), variant count, and status (active/draft/inactive).

**Search** works across name, slug, category, brand, and variant SKU.

#### Listing Actions

| Action | What it does |
|--------|-------------|
| **Edit** | Opens the inline product editor |
| **Duplicate** | Creates an exact copy as a draft with a new slug (`*-copy-*`) |
| **Delete** | Permanently removes the product (with confirmation) |

#### Bulk Actions

Select multiple products using the checkbox column, then use the bulk action bar:

- **Set active / Set draft / Set inactive** — changes status of all selected products
- **Bulk delete** — removes all selected products

### Creating / Editing a Product

The product form is divided into sections. All changes are saved when you click **Save changes** (edit mode) or **Create product** (new mode).

#### Basic Info

| Field | Required | Notes |
|-------|----------|-------|
| Name | Yes | Auto-generates the slug as you type. Edit the slug manually to disable auto-generation. |
| Slug | Yes | URL-friendly identifier. Auto from name unless you edit it directly. |
| Category | Yes | Determines which attribute schema is available. Changing category resets the attribute fields. |
| Price (₹) | Yes | Base price in rupees. |
| Sale price (₹) | No | If set and lower than base price, the product shows as "on sale". |
| Compare-at price (₹) | No | Shows as a strikethrough price on the storefront. |
| Subtitle | No | Short selling line shown below the product name. |
| Description | Yes | Full product description (supports plain text). |
| Status | — | `active` (visible), `draft` (hidden), or `inactive` (hidden + excluded from search). |
| Featured | No | Check to feature the product on the homepage. |
| COD available | No | Uncheck to prevent Cash on Delivery for this product. Default: checked. |

#### SEO Fields

| Field | Max length | Notes |
|-------|-----------|-------|
| SEO title | 70 chars | Appears in browser tab and Google results. Falls back to product name. |
| SEO description | 160 chars | Appears below the title in search results. Falls back to subtitle. |

#### Product Details

| Field | Notes |
|-------|-------|
| Brand | Product brand name |
| HSN code | Harmonized System Nomenclature code (e.g. `4202` for leather bags) |
| GST rate (%) | Tax rate (0–100). Used for invoice generation. |
| Delivery estimate | Free-text, e.g. "Arrives by Thu, 14 Aug" |

#### Images

Upload product images via drag-and-drop or file picker.

- **Accepted formats:** Any image type (jpg, png, webp, etc.)
- **Max file size:** 10 MB per image
- **Recommended dimensions:** 1200 × 1600 px (3:4 portrait orientation)
- If your image doesn't match the recommended size, the uploader offers a built-in **ImageResizer** tool.

**Image controls:**
- **×** — Remove the image
- **←** / **→** — Move image left or right to reorder

The first image is the primary image shown in product listings and the cart.

#### Legacy Variants (Manual SKU Entry)

Use this section for simple colour/size variants where each combination is hand-entered.

**To add a variant:** Click **+ Add variant** and fill in:

| Field | Required | Notes |
|-------|----------|-------|
| Label | Yes | Display name, e.g. "Black / 32" |
| SKU | Yes | Stock-keeping unit code |
| Colour | Yes | Colour name |
| Size | No | Size label |
| Price override | No | If set, overrides the product base price for this variant |
| Sale price | No | Variant-specific sale price |
| Total stock | Yes | Physical stock count |
| Store allocation | Yes | Units allocated to physical store (unavailable online) |
| Low-stock at | No | Threshold for low-stock warning. Default: 3. |
| Allow backorder | No | Check to keep selling when stock hits zero |
| Active | No | Uncheck to hide this variant from the storefront |

**To remove a variant:** Click the trash icon (red text) on the variant row.

#### Category Attributes

When you select a category, its attribute schema appears below the basic fields. These are the structured attributes (e.g. Material, Hardware, Lining) that the category admin defined.

- Each attribute renders the appropriate input control based on its type (text, select, yes/no, number, etc.)
- Fields marked as **required** must be filled before saving
- Validation errors from the server appear inline below each field

#### Variant Attributes (SKU Generator)

This section appears when the category has attributes marked as **variant**. It automatically generates all possible SKU combinations.

**How to use:**

1. **Enable dimensions** — Check the checkbox next to each attribute you want to use as a variant dimension (e.g. "Colour", "Size")
2. **Enter values** — For each enabled dimension, type comma-separated values (e.g. `Black, Brown, Tan`)
3. **Generated table** — The system generates a table with one row per combination, with columns for each dimension plus SKU, Price, Sale Price, Stock, Active, and Backorder

| Generated field | Notes |
|----------------|-------|
| SKU | Auto-generated as `{product-slug}-{N}`. Edit manually if needed. |
| Price (₹) | Defaults to the product base price. Override per-SKU. |
| Sale (₹) | Optional per-SKU sale price. |
| Stock | Units available. Set to 0 and enable backorder for backorder items. |
| Active | Uncheck to hide this SKU from the storefront. |
| Backorder | Check to allow purchasing when stock is 0. |

> **Important:** You must click **Generate SKUs** (or ensure the table is populated) before saving. Empty variant dimensions with no generated rows will show a warning.

---

## Categories

Categories organize your products and define which attributes are available for products in that category.

### Category Listing

| Column | Description |
|--------|-------------|
| Name | Category name |
| Slug | URL slug (shown as `/slug`) |
| Attributes | Number of attached attributes |
| Description | First 40 characters of the description |
| Order | Display order number |
| Status | Active or Hidden badge |

**Search** works across name, slug, and description.

### Creating / Editing a Category

| Field | Required | Notes |
|-------|----------|-------|
| Name | Yes | Auto-generates slug. Duplicate names are rejected with a friendly error. |
| Slug | Yes | Auto from name unless edited manually |
| Description | No | Short description |
| SEO title | No | Max 70 chars |
| SEO description | No | Max 160 chars |
| Display order | No | Lower numbers appear first. Default: 0. |
| Image URL | No | Category image. Recommended: 1000 × 1500 px (2:3 portrait). |
| Active | No | Uncheck to hide the category |

### Deleting a Category

When you delete a category, the system shows how many products are currently assigned to it. You'll be asked to confirm before the deletion proceeds.

> **Note:** Deleting a category does **not** delete the products — they just lose their category assignment. Reassign products before deleting if needed.

### Managing Category Attributes

Each category has an **Attribute Pool** — a list of attributes that products in this category can use.

#### Adding Attributes to a Category

1. **Search existing attributes** — Type in the search box and click Search. Results appear as a checklist showing attribute name and type.
2. **Attach** — Check the attributes you want, then click Attach.
3. **Create & attach** — If the attribute doesn't exist yet, type its name, select a type, and click the create button. It's automatically attached.

#### Attribute Configuration

For each attached attribute, configure:

| Setting | Description |
|---------|-------------|
| Display order | Sort position within the product page |
| Section | `specifications` (shown in specs tab) or `listing` (shown on product grid) |
| Required | Must have a value on every product |
| Customer-visible | Shown to customers on the storefront |
| Seller-visible | Visible to marketplace sellers |
| Filterable | Appears in the sidebar filter on category/shop pages |
| Searchable | Included in the search index |
| Variant | When checked, this attribute creates SKU combinations (see Variant Attributes above) |

#### Attribute Types

| Type | Input control | Example |
|------|--------------|---------|
| `text` | Text input | "Full-grain leather" |
| `select` | Dropdown | Choose from predefined options |
| `multi` | Checkbox group (with options) or comma-separated text | "Gold, Silver" |
| `textarea` | Multi-line text | Long descriptions |
| `yesno` | Yes/No toggle | "Handstitched: Yes" |
| `number` | Number input | "Weight: 450" |

---

## Attributes

Attributes are shared definitions reusable across categories. The attribute pool is managed from the **Categories** section (see above), but attributes can also be managed standalone.

### Creating an Attribute

| Field | Notes |
|-------|-------|
| Name | Display name (e.g. "Colour", "Material") |
| Type | One of: text, multi, textarea, select, yesno, number |
| Description | Optional help text |
| Options | Comma-separated list (used by `select` and `multi` types) |

### Editing an Attribute

- Changing the **name** updates the key used in queries
- Duplicate attribute names are rejected with a friendly error
- Updating **options** replaces the entire list — existing products keep their old values, but new products must use the new options

---

## Inventory

The Inventory section provides a real-time view of stock levels across all SKUs — both legacy variants and attribute-driven ProductVariants.

### KPIs

| Metric | Meaning |
|--------|---------|
| Total units | Sum of all available + reserved + damaged stock |
| Low stock | SKUs at or below their low-stock threshold |
| Out of stock | SKUs with zero available and no backorder enabled |
| Reserved (carts) | Units locked by active carts and pending orders |

### Inventory Table

| Column | Description |
|--------|-------------|
| Product / SKU | Product name, variant label, and SKU code. SKU tag shown for ProductVariant rows. |
| Total stock | Physical count you enter |
| Store | Units allocated to physical store (legacy variants only) |
| Damaged | Units set aside as damaged (ProductVariant rows only) |
| Available | Calculated: Total − Damaged − Reserved (or Total − Store − Reserved for legacy) |
| Reserved | Units locked by carts/orders (updates automatically) |
| Low at | Threshold for low-stock warning |
| Backorder | Whether selling continues at zero stock |
| Status | Out / Low / In stock / Hidden badge |

### Editing Inventory

Click any editable field (Total stock, Store, Damaged, Low at, Backorder) to modify it. A **Save** button appears when changes are made.

- **Variant rows:** Total stock and Damaged are editable. Store shows "—".
- **Legacy rows:** Total stock and Store are editable. Damaged shows "—".

### Stock History

Click the **clock icon** on any row to view the stock movement history:

| Column | Description |
|--------|-------------|
| Date | When the movement occurred |
| Type | Movement type (adjustment, sale, cancellation, etc.) |
| Qty | Units moved (positive = added, negative = removed) |
| Reference | Order ID or admin actor ID |
| Note | Additional context |

---

## Orders

The Orders section manages the full order lifecycle from placement to delivery.

### Order Listing

| Column | Description |
|--------|-------------|
| Order | Order number |
| Customer | Name and email |
| Item | First line item + "+N" for additional items |
| Total | Order total in ₹ |
| Payment | Method (online/cod) and status |
| Status | Current order status badge |
| Actions | Status transition buttons |

**Search** works across order number, email, and full name.

### Order Status Flow

Orders move through a state machine. Available transitions from each status:

```
pending_payment → order_received, cancelled
order_received → confirmed, processing, cancelled, delivered
confirmed → processing, packing, cancelled
processing → packing, cancelled
packing → shipping, cancelled
shipping → packed, shipped, cancelled
packed → shipped, cancelled
shipped → delivered
delivered → (terminal)
cancelled → (terminal)
return_requested → returned, refunded, cancelled
returned → (terminal)
refunded → (terminal)
```

### Updating Order Status

1. Click the status action button on an order row
2. Select the next status from the dropdown
3. For **shipped** status, fill in:
   - Courier name
   - AWB / tracking number
   - Tracking URL
4. Click **Apply**

**Automatic stock effects:**
- **Cancelled** → reserved stock is released back to available
- **Delivered** → stock is permanently committed (removed from inventory)
- **Confirmed / order_received** from `pending_payment` → payment status set to "paid"

### Order Details

Click an order row to expand and see:
- **Items:** Product name, variant, quantity, and line total
- **Ship to:** Full shipping address (name, street, city, state, pincode, phone)
- **Totals:** Subtotal, delivery fee (or "Free"), discount amount, and grand total

---

## Coupons

Coupons are discount codes customers enter at checkout.

### Coupon Listing

| Column | Description |
|--------|-------------|
| Code | Uppercase discount code |
| Type | Percentage, fixed amount, or free shipping |
| Value | Discount value (% or ₹) |
| Min order | Minimum order value to qualify |
| Used | Times used / usage limit |
| Status | Active or Disabled badge |

### Creating / Editing a Coupon

| Field | Required | Notes |
|-------|----------|-------|
| Code | Yes | Auto-uppercased. Must be unique. |
| Type | Yes | `percentage` (% off), `fixed` (₹ off), or `free_shipping` (free delivery) |
| Value | Yes | Discount amount |
| Minimum order (₹) | No | Order subtotal must meet this to use the coupon |
| Maximum discount (₹) | No | Cap for percentage discounts (e.g. "20% off, max ₹500") |
| Usage limit | No | Total times this coupon can be used across all customers |
| Per customer | No | Max uses per individual customer |
| Expires | No | Coupon stops working after this date |
| Active | No | Uncheck to disable without deleting |
| Applicable categories | No | Restrict coupon to specific categories. Leave all unchecked for "all categories". |

### Coupon Actions

| Action | Effect |
|--------|--------|
| **Edit** | Opens the coupon form |
| **Enable / Disable** | Toggles active state without deleting |
| **Delete** | Permanently removes the coupon |

---

## Promotions

Promotions are automatic discounts applied at checkout **before** any coupon code. They target a specific product or an entire category.

### Promotion Listing

| Column | Description |
|--------|-------------|
| Name | Promotion name |
| Target | Product name or category name |
| Type | Percentage or fixed amount |
| Value | Discount value |
| Window | Start → end dates (or "now" if no start date) |
| Status | Active or Disabled badge |

### Creating / Editing a Promotion

| Field | Required | Notes |
|-------|----------|-------|
| Name | Yes | e.g. "Summer Sale", "Monsoon Madness" |
| Type | Yes | `percentage` (% off) or `fixed` (₹ off) |
| Value | Yes | Discount amount |
| Applies to | Yes | `product` (single product) or `category` (all products in category) |
| Product / Category | Yes | Dropdown to select the target |
| Starts | No | Promotion starts on this date. Empty = starts immediately. |
| Ends | No | Promotion expires on this date. Empty = no expiry. |
| Priority | No | Higher numbers are applied first when multiple promotions overlap. |
| Active | No | Uncheck to disable without deleting |

### How Promotions Apply

1. All active promotions matching the cart items are found
2. Promotions are sorted by priority (highest first)
3. For each item, the best single promotion is applied (promotions don't stack on one item)
4. After promotions, coupon codes are applied on the promoted subtotal

---

## Other Sections

| Section | Description |
|---------|-------------|
| **Customers** | View registered users, their order history, and account details |
| **Returns & Refunds** | Process return requests and issue refunds |
| **Delivery** | Configure shipping zones, free delivery thresholds, and courier integrations |
| **Customize Page** | Edit homepage layout, banners, and featured collections |
| **Reviews** | Moderate customer reviews and ratings |
| **Feedback** | View customer feedback submissions |
| **Admins** | Manage admin accounts and invite new admins |
| **Roles** | Define custom roles with granular feature permissions |
| **Assets** | Media library for uploaded images and files |
| **Error Logs** | View application error logs for debugging |
| **Database** | Superadmin-only: import/export database backups |
| **Analytics** | Sales analytics, traffic data, and low-stock reports |

---

## Quick Reference: Admin Keyboard Shortcuts

There are no keyboard shortcuts — all actions are mouse/touch driven through the admin UI.

---

## Glossary

| Term | Definition |
|------|-----------|
| **Legacy variant** | A manually-entered colour/size combination stored directly on the product document |
| **ProductVariant (SKU)** | An attribute-driven variant stored in its own collection, generated from category attribute combinations |
| **Available stock** | Total − Damaged − Reserved (or Total − Store − Reserved for legacy). This is what customers can buy. |
| **Reserved stock** | Units locked by active carts or pending orders. Released automatically on cart expiry or order cancellation. |
| **Backorder** | When enabled, customers can purchase even when available stock is zero |
| **Promotion** | Automatic discount applied before coupons |
| **Coupon** | Customer-entered discount code applied after promotions |
| **Filterable** | An attribute flag that adds it to the sidebar filter on shop/category pages |
| **Variant attribute** | An attribute flagged to create SKU combinations (e.g. Colour × Size) |
