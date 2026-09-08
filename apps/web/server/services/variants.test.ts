import { describe, it, expect } from "vitest";
import { generateCombinations, productVariantLabel, resolveVariantById } from "./variants.js";
import type { VariantDimensionInput, ResolveProduct, ResolveProductVariant } from "./variants.js";

describe("generateCombinations", () => {
  it("returns empty for empty dimensions", () => {
    expect(generateCombinations([])).toEqual([]);
  });

  it("single dimension", () => {
    const dims: VariantDimensionInput[] = [{ attributeId: "color", values: ["Black", "White"] }];
    const r = generateCombinations(dims);
    expect(r).toEqual([
      [{ attributeId: "color", value: "Black" }],
      [{ attributeId: "color", value: "White" }],
    ]);
  });

  it("two dimensions = cartesian product", () => {
    const dims: VariantDimensionInput[] = [
      { attributeId: "color", values: ["Black", "White"] },
      { attributeId: "size", values: ["8", "9"] },
    ];
    const r = generateCombinations(dims);
    expect(r).toHaveLength(4);
    expect(r[0]).toEqual([
      { attributeId: "color", value: "Black" },
      { attributeId: "size", value: "8" },
    ]);
    expect(r[3]).toEqual([
      { attributeId: "color", value: "White" },
      { attributeId: "size", value: "9" },
    ]);
  });

  it("three dimensions", () => {
    const dims: VariantDimensionInput[] = [
      { attributeId: "a", values: ["1", "2"] },
      { attributeId: "b", values: ["3"] },
      { attributeId: "c", values: ["4", "5", "6"] },
    ];
    expect(generateCombinations(dims)).toHaveLength(6);
  });

  it("dimension with no values", () => {
    const dims: VariantDimensionInput[] = [{ attributeId: "color", values: [] }];
    expect(generateCombinations(dims)).toEqual([]);
  });
});

describe("productVariantLabel", () => {
  it("joins attribute values with /", () => {
    const pv = {
      _id: "1",
      sku: "SKU",
      price: 100,
      stock: 10,
      active: true,
      attributes: [
        { attributeId: "color_id", value: "Black" },
        { attributeId: "size_id", value: "UK 8" },
      ],
    };
    expect(productVariantLabel(pv as any)).toBe("Black / UK 8");
  });

  it("uses dimension order when provided", () => {
    const pv = {
      _id: "1",
      sku: "SKU",
      price: 100,
      stock: 10,
      active: true,
      attributes: [
        { attributeId: "size_id", value: "UK 8" },
        { attributeId: "color_id", value: "Black" },
      ],
    };
    const dims = [
      { attributeId: "color_id" },
      { attributeId: "size_id" },
    ];
    expect(productVariantLabel(pv as any, dims as any)).toBe("Black / UK 8");
  });
});

describe("resolveVariantById", () => {
  const product: ResolveProduct = {
    _id: "prod1",
    price: 1000,
    compareAtPrice: 1500,
    salePrice: 800,
    variants: [
      { _id: "v1", label: "Legacy Variant", sku: "L-SKU", color: "Black", size: "8", priceOverride: 900, salePrice: 700, inventoryAvailable: 5, allowBackorder: false, active: true },
    ],
    variantDimensions: [{ attributeId: "color" }, { attributeId: "size" }],
  };

  const productVariants: ResolveProductVariant[] = [
    {
      _id: "pv1",
      sku: "PV-SKU",
      price: 950,
      salePrice: 750,
      stock: 10,
      active: true,
      allowBackorder: true,
      attributes: [
        { attributeId: { key: "color", name: "Color" }, value: "White" },
        { attributeId: { key: "size", name: "Size" }, value: "UK 9" },
      ],
    },
  ];

  it("resolves legacy variant", () => {
    const r = resolveVariantById(product, [], "v1");
    expect(r).not.toBeNull();
    expect(r!.kind).toBe("legacy");
    expect(r!.sku).toBe("L-SKU");
    expect(r!.price).toBe(700); // salePrice 700 < override 900
    expect(r!.stock).toBe(5);
  });

  it("resolves ProductVariant", () => {
    const r = resolveVariantById(product, productVariants, "pv1");
    expect(r).not.toBeNull();
    expect(r!.kind).toBe("product");
    expect(r!.sku).toBe("PV-SKU");
    expect(r!.price).toBe(750);
    expect(r!.stock).toBe(10);
    expect(r!.allowBackorder).toBe(true);
  });

  it("returns null for unknown variant", () => {
    expect(resolveVariantById(product, productVariants, "unknown")).toBeNull();
  });

  it("legacy variant uses product compareAtPrice", () => {
    const r = resolveVariantById(product, [], "v1");
    expect(r!.compareAtPrice).toBe(1500);
    expect(r!.hasDiscount).toBe(true);
  });
});
