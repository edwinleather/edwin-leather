// Pricing resolution. `price` is the final amount a customer pays. An optional
// `salePrice` (product-level or variant-level) overrides the base price, and an
// optional `compareAtPrice` (MRP) is shown crossed-out when it is higher than
// the final price so shoppers can see the discount.
import { Promotion } from "../models/Promotion.js";

export type ResolvedPrice = {
  basePrice: number;
  price: number;
  salePrice: number | null;
  compareAtPrice: number | null;
  hasDiscount: boolean;
  percentOff: number;
};

export function resolvePrice(
  basePrice: number,
  opts?: { salePrice?: number | null; compareAtPrice?: number | null }
): ResolvedPrice {
  const base = Math.max(0, basePrice ?? 0);
  const sale = opts?.salePrice && opts.salePrice > 0 && opts.salePrice < base ? opts.salePrice : null;
  const price = sale ?? base;
  const mrp = opts?.compareAtPrice && opts.compareAtPrice > price ? opts.compareAtPrice : null;
  const percentOff = mrp ? Math.round(((mrp - price) / mrp) * 100) : 0;

  return {
    basePrice: base,
    price,
    salePrice: sale,
    compareAtPrice: mrp,
    hasDiscount: mrp != null && mrp > price,
    percentOff: mrp && mrp > price ? percentOff : 0
  };
}

// ------------------------------------------------------------ Promotions

export type ActivePromotion = {
  promotionId: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  target: "product" | "category";
  targetProductId?: string;
  targetCategory?: string;
  priority: number;
};

export type PromotionDiscount = {
  promotionId: string;
  name: string;
  amount: number;
  price: number;
};

// All promotions currently in effect, sorted so the highest priority (then the
// most generous) wins when several overlap.
export async function getActivePromotions(now = new Date()): Promise<ActivePromotion[]> {
  const rows = await Promotion.find({
    active: true,
    $or: [{ startsAt: { $lte: now } }, { startsAt: null }, { startsAt: { $exists: false } }],
    $and: [{ $or: [{ expiresAt: { $gte: now } }, { expiresAt: null }, { expiresAt: { $exists: false } }] }]
  })
    .lean();
  return rows.map((p) => ({
    promotionId: String(p._id),
    name: p.name,
    type: p.type,
    value: p.value,
    target: p.target,
    targetProductId: p.targetProductId ? String(p.targetProductId) : undefined,
    targetCategory: p.targetCategory,
    priority: p.priority ?? 0
  }));
}

// Apply the best matching promotion to a single unit price.
export function applyPromotion(
  promotions: ActivePromotion[],
  unitPrice: number,
  productId: string,
  category: string
): PromotionDiscount | null {
  let best: PromotionDiscount | null = null;
  let bestPriority = Number.NEGATIVE_INFINITY;
  for (const p of promotions) {
    const matches =
      p.target === "product" ? String(p.targetProductId) === String(productId) : p.targetCategory === category;
    if (!matches) continue;
    const amount =
      p.type === "percentage" ? (unitPrice * p.value) / 100 : Math.min(p.value, unitPrice);
    const discounted = Math.max(0, unitPrice - amount);
    if (
      !best ||
      p.priority > bestPriority ||
      (p.priority === bestPriority && discounted < best.price)
    ) {
      best = { promotionId: p.promotionId, name: p.name, amount: Math.round(amount), price: Math.round(discounted) };
      bestPriority = p.priority;
    }
  }
  return best;
}

export type PromotedPrice = ResolvedPrice & {
  promotion: PromotionDiscount | null;
};

// Resolve a variant's final price with a sale price, MRP, and any active
// promotion applied on top (promotion discounts are computed after sale price).
export function resolvePromotedPrice(
  basePrice: number,
  opts: { salePrice?: number | null; compareAtPrice?: number | null; productId: string; category: string },
  promotions: ActivePromotion[]
): PromotedPrice {
  const resolved = resolvePrice(basePrice, opts);
  const promotion = applyPromotion(promotions, resolved.price, opts.productId, opts.category);
  return {
    ...resolved,
    price: promotion ? promotion.price : resolved.price,
    promotion
  };
}