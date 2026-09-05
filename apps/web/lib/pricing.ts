/**
 * Shared price resolution logic.
 *
 * Priority order:
 * 1. promotionPrice / promotion.price — active promotional override
 * 2. salePrice — only when strictly less than the base price
 * 3. price — base / list price
 */

type PriceSource = {
  price?: number | null;
  salePrice?: number | null;
  promotionPrice?: number | null;
};

type ProductPriceSource = {
  price?: number | null;
  salePrice?: number | null;
  promotion?: { price?: number | null } | null;
};

/** Resolve the effective unit price for a variant or product-level item. */
export function resolveUnitPrice(source: PriceSource): number {
  const base = source.price ?? 0;
  if (source.promotionPrice != null && source.promotionPrice < base) return source.promotionPrice;
  if (source.salePrice != null && source.salePrice < base) return source.salePrice;
  return base;
}

/** Resolve the display price when only product-level fields are available (no variant selected). */
export function resolveProductPrice(source: ProductPriceSource): number {
  const base = source.price ?? 0;
  const promo = source.promotion?.price;
  if (promo != null && promo < base) return promo;
  if (source.salePrice != null && source.salePrice < base) return source.salePrice;
  return base;
}

/** Return the original / compare-at price for strikethrough display. */
export function resolveOriginalPrice(source: PriceSource & { compareAtPrice?: number | null }): number | null {
  if (source.compareAtPrice != null && source.compareAtPrice > 0) return source.compareAtPrice;
  return null;
}
