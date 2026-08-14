import type { Types } from "mongoose";
import { Coupon } from "../models/Coupon.js";
import { Order } from "../models/Order.js";
import { ApiError } from "../middleware/error.js";

export type CouponLine = { productId: string | Types.ObjectId; category: string; quantity: number; unitPrice: number };

export type CouponResult = {
  code: string;
  discountType: "percentage" | "fixed" | "free_shipping";
  discountAmount: number;
  freeShipping: boolean;
  couponId: string;
};

function eligibleSubtotal(coupon: InstanceType<typeof Coupon>, lines: CouponLine[]) {
  const hasRestrictions = coupon.applicableProductIds.length > 0 || coupon.applicableCategories.length > 0;
  if (!hasRestrictions) return lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);

  const productIds = new Set(coupon.applicableProductIds.map((id: { toString(): string }) => String(id)));
  const categories = new Set(coupon.applicableCategories);
  return lines
    .filter((line) => productIds.has(String(line.productId)) || categories.has(line.category))
    .reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
}

export function computeCouponDiscount(
  coupon: InstanceType<typeof Coupon>,
  lines: CouponLine[],
  shippingAmount: number
): Omit<CouponResult, "code" | "couponId"> {
  const base = eligibleSubtotal(coupon, lines);
  if (coupon.discountType === "free_shipping") {
    return { discountType: "free_shipping", discountAmount: shippingAmount, freeShipping: true };
  }
  if (base < coupon.minimumOrder) {
    throw new ApiError(400, `This coupon requires a minimum order of ₹${coupon.minimumOrder}`);
  }
  if (coupon.discountType === "fixed") {
    const discount = Math.min(coupon.value, base);
    return { discountType: "fixed", discountAmount: Math.round(discount), freeShipping: false };
  }
  let discount = (base * coupon.value) / 100;
  if (coupon.maximumDiscount) discount = Math.min(discount, coupon.maximumDiscount);
  discount = Math.min(discount, base);
  return { discountType: "percentage", discountAmount: Math.round(discount), freeShipping: false };
}

export async function validateCoupon(code: string, lines: CouponLine[], email: string | undefined, shippingAmount: number): Promise<CouponResult> {
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), active: true });
  if (!coupon) throw new ApiError(404, "Invalid coupon code");

  const now = Date.now();
  if (coupon.startsAt && coupon.startsAt.getTime() > now) throw new ApiError(400, "This coupon is not active yet");
  if (coupon.expiresAt && coupon.expiresAt.getTime() < now) throw new ApiError(400, "This coupon has expired");
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, "This coupon has reached its usage limit");
  if (coupon.usagePerCustomer && email) {
    const usedByCustomer = await Order.countDocuments({ email, "coupon.couponId": coupon._id, orderStatus: { $nin: ["cancelled", "refunded"] } });
    if (usedByCustomer >= coupon.usagePerCustomer) throw new ApiError(400, "You have already used this coupon");
  }

  const discount = computeCouponDiscount(coupon, lines, shippingAmount);
  return { code: coupon.code, ...discount, couponId: String(coupon._id) };
}

export async function recordCouponUsage(couponId: string | undefined) {
  if (!couponId) return;
  await Coupon.findByIdAndUpdate(couponId, { $inc: { usedCount: 1 } }).lean();
}