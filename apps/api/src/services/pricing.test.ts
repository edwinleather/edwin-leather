import { describe, it, expect } from "vitest";
import { resolvePrice, applyPromotion, resolvePromotedPrice } from "./pricing.js";
import type { ActivePromotion } from "./pricing.js";

describe("resolvePrice", () => {
  it("returns basePrice when no sale or compareAt", () => {
    const r = resolvePrice(1000);
    expect(r).toEqual({
      basePrice: 1000,
      price: 1000,
      salePrice: null,
      compareAtPrice: null,
      hasDiscount: false,
      percentOff: 0,
    });
  });

  it("applies salePrice when lower than base", () => {
    const r = resolvePrice(1000, { salePrice: 799 });
    expect(r.price).toBe(799);
    expect(r.salePrice).toBe(799);
  });

  it("ignores salePrice when higher than base", () => {
    const r = resolvePrice(1000, { salePrice: 1200 });
    expect(r.price).toBe(1000);
    expect(r.salePrice).toBeNull();
  });

  it("ignores salePrice equal to base", () => {
    const r = resolvePrice(1000, { salePrice: 1000 });
    expect(r.salePrice).toBeNull();
  });

  it("shows compareAtPrice when higher than final price", () => {
    const r = resolvePrice(1000, { compareAtPrice: 1500 });
    expect(r.compareAtPrice).toBe(1500);
    expect(r.hasDiscount).toBe(true);
    expect(r.percentOff).toBe(33);
  });

  it("hides compareAtPrice when lower than final price", () => {
    const r = resolvePrice(1000, { compareAtPrice: 800 });
    expect(r.compareAtPrice).toBeNull();
  });

  it("computes percentOff correctly", () => {
    const r = resolvePrice(600, { compareAtPrice: 1000 });
    expect(r.percentOff).toBe(40);
  });

  it("salePrice + compareAtPrice together", () => {
    const r = resolvePrice(1000, { salePrice: 600, compareAtPrice: 1200 });
    expect(r.price).toBe(600);
    expect(r.salePrice).toBe(600);
    expect(r.compareAtPrice).toBe(1200);
    expect(r.percentOff).toBe(50);
  });

  it("clamps negative basePrice to 0", () => {
    const r = resolvePrice(-100);
    expect(r.basePrice).toBe(0);
    expect(r.price).toBe(0);
  });

  it("clamps nullish basePrice to 0", () => {
    const r = resolvePrice(null as any);
    expect(r.basePrice).toBe(0);
  });
});

describe("applyPromotion", () => {
  const promos: ActivePromotion[] = [
    { promotionId: "p1", name: "10% off Shoes", type: "percentage", value: 10, target: "category", targetCategory: "shoes", priority: 1 },
    { promotionId: "p2", name: "₹200 off Belt", type: "fixed", value: 200, target: "product", targetProductId: "belt1", priority: 2 },
    { promotionId: "p3", name: "20% off Shoes", type: "percentage", value: 20, target: "category", targetCategory: "shoes", priority: 5 },
  ];

  it("returns null when no promotion matches", () => {
    expect(applyPromotion(promos, 1000, "shirt1", "shirts")).toBeNull();
  });

  it("applies percentage promotion to matching category", () => {
    const d = applyPromotion(promos, 1000, "shoe1", "shoes");
    expect(d).not.toBeNull();
    expect(d!.promotionId).toBe("p3"); // higher priority wins
    expect(d!.amount).toBe(200);
    expect(d!.price).toBe(800);
  });

  it("applies fixed promotion to matching product", () => {
    const d = applyPromotion(promos, 1000, "belt1", "accessories");
    expect(d).not.toBeNull();
    expect(d!.promotionId).toBe("p2");
    expect(d!.amount).toBe(200);
    expect(d!.price).toBe(800);
  });

  it("fixed promotion cannot discount below 0", () => {
    const d = applyPromotion(promos, 100, "belt1", "accessories");
    expect(d!.amount).toBe(100);
    expect(d!.price).toBe(0);
  });

  it("higher priority wins when two match same product", () => {
    const d = applyPromotion(promos, 1000, "shoe1", "shoes");
    expect(d!.promotionId).toBe("p3"); // priority 5 > 1
  });
});

describe("resolvePromotedPrice", () => {
  const promos: ActivePromotion[] = [
    { promotionId: "p1", name: "10% off", type: "percentage", value: 10, target: "category", targetCategory: "shoes", priority: 1 },
  ];

  it("applies promotion after salePrice", () => {
    const r = resolvePromotedPrice(
      1000,
      { salePrice: 800, productId: "shoe1", category: "shoes" },
      promos
    );
    expect(r.price).toBe(720); // 800 - 10%
    expect(r.promotion).not.toBeNull();
  });

  it("no promotion when category doesn't match", () => {
    const r = resolvePromotedPrice(
      1000,
      { salePrice: 800, productId: "shoe1", category: "shirts" },
      promos
    );
    expect(r.price).toBe(800);
    expect(r.promotion).toBeNull();
  });

  it("no promotion when empty array", () => {
    const r = resolvePromotedPrice(
      1000,
      { productId: "shoe1", category: "shoes" },
      []
    );
    expect(r.price).toBe(1000);
    expect(r.promotion).toBeNull();
  });
});
