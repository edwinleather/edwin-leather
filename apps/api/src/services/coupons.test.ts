import { describe, it, expect } from "vitest";
import { computeCouponDiscount } from "./coupons.js";
import type { CouponLine } from "./coupons.js";

function makeCoupon(overrides: Record<string, any> = {}) {
  return {
    code: "TEST",
    discountType: "percentage" as const,
    value: 10,
    minimumOrder: 0,
    maximumDiscount: null as number | null,
    applicableProductIds: [],
    applicableCategories: [],
    active: true,
    startsAt: null,
    expiresAt: null,
    usageLimit: null,
    usedCount: 0,
    usagePerCustomer: null,
    ...overrides,
  };
}

const lines: CouponLine[] = [
  { productId: "p1", category: "shoes", quantity: 2, unitPrice: 500 },
  { productId: "p2", category: "shirts", quantity: 1, unitPrice: 800 },
];

describe("computeCouponDiscount", () => {
  it("percentage discount on full order", () => {
    const c = makeCoupon({ discountType: "percentage", value: 10 });
    const r = computeCouponDiscount(c, lines, 120);
    expect(r.discountType).toBe("percentage");
    expect(r.discountAmount).toBe(180); // 10% of 1800
    expect(r.freeShipping).toBe(false);
  });

  it("fixed discount capped at eligible subtotal", () => {
    const c = makeCoupon({ discountType: "fixed", value: 5000 });
    const r = computeCouponDiscount(c, lines, 120);
    expect(r.discountAmount).toBe(1800); // can't exceed subtotal
  });

  it("fixed discount applied normally", () => {
    const c = makeCoupon({ discountType: "fixed", value: 200 });
    const r = computeCouponDiscount(c, lines, 120);
    expect(r.discountAmount).toBe(200);
  });

  it("free_shipping returns shippingAmount as discount", () => {
    const c = makeCoupon({ discountType: "free_shipping" });
    const r = computeCouponDiscount(c, lines, 120);
    expect(r.discountType).toBe("free_shipping");
    expect(r.discountAmount).toBe(120);
    expect(r.freeShipping).toBe(true);
  });

  it("percentage with maximumDiscount cap", () => {
    const c = makeCoupon({ discountType: "percentage", value: 50, maximumDiscount: 300 });
    const r = computeCouponDiscount(c, lines, 0);
    expect(r.discountAmount).toBe(300); // 50% of 1800 = 900, capped to 300
  });

  it("percentage discount cannot exceed eligible subtotal", () => {
    const c = makeCoupon({ discountType: "percentage", value: 200 });
    const r = computeCouponDiscount(c, lines, 0);
    expect(r.discountAmount).toBe(1800); // capped at subtotal
  });

  it("restricts eligible subtotal to matching products", () => {
    const c = makeCoupon({
      discountType: "percentage",
      value: 10,
      applicableProductIds: ["p1"],
    });
    const r = computeCouponDiscount(c, lines, 0);
    expect(r.discountAmount).toBe(100); // 10% of 1000 (only p1)
  });

  it("restricts eligible subtotal to matching categories", () => {
    const c = makeCoupon({
      discountType: "percentage",
      value: 10,
      applicableCategories: ["shirts"],
    });
    const r = computeCouponDiscount(c, lines, 0);
    expect(r.discountAmount).toBe(80); // 10% of 800 (only shirts)
  });
});
