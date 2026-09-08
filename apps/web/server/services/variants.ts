import mongoose from "mongoose";
import { ProductVariant } from "../models/ProductVariant.js";
import { resolvePrice } from "./pricing.js";

export type VariantDimensionInput = { attributeId: string; values: string[] };
export type VariantAttributeValue = { attributeId: string; value: string | string[] };
export type ProductVariantInput = {
  attributes: VariantAttributeValue[];
  sku: string;
  price: number;
  stock: number;
  active: boolean;
  allowBackorder?: boolean;
  salePrice?: number;
  images?: { url: string; publicId?: string; alt?: string }[];
};

function comboKey(attrs: VariantAttributeValue[]): string {
  return attrs
    .slice()
    .sort((a, b) => a.attributeId.localeCompare(b.attributeId))
    .map((a) => `${a.attributeId}__${JSON.stringify(a.value)}`)
    .join("|");
}

function comboKeyFromDoc(attrs: { attributeId: unknown; value: unknown }[]): string {
  return attrs
    .slice()
    .sort((a, b) => String(a.attributeId).localeCompare(String(b.attributeId)))
    .map((a) => `${a.attributeId}__${JSON.stringify(a.value)}`)
    .join("|");
}

// Generate the cartesian product of dimension values into attribute combos.
// e.g. Color:[Black,White] x Size:[8,9] -> Black-8, Black-9, White-8, White-9.
export function generateCombinations(dimensions: VariantDimensionInput[]): VariantAttributeValue[][] {
  if (dimensions.length === 0) return [];
  const buckets = dimensions.map((d) =>
    (d.values ?? []).map((value) => ({ attributeId: String(d.attributeId), value }))
  );
  const results: VariantAttributeValue[][] = [];
  function walk(index: number, acc: VariantAttributeValue[]) {
    if (index === buckets.length) {
      results.push([...acc]);
      return;
    }
    for (const option of buckets[index]) {
      acc.push(option);
      walk(index + 1, acc);
      acc.pop();
    }
  }
  walk(0, []);
  return results;
}

// Reconcile a product's ProductVariant documents against the dimensions and the
// admin-provided variant details. For each generated combination it upserts a
// ProductVariant (keeping the admin-entered sku/price/stock/active) and deletes
// any combination that no longer exists.
export async function reconcileProductVariants(productId: string, dimensions: VariantDimensionInput[], productVariants: ProductVariantInput[]) {
  const generated = generateCombinations(dimensions);
  const providedByKey = new Map<string, ProductVariantInput>();
  for (const pv of productVariants) {
    providedByKey.set(comboKey(pv.attributes), pv);
  }

  const productIdObj = new mongoose.Types.ObjectId(productId);
  const existing = await ProductVariant.find({ productId: productIdObj }).lean();
  type ExistingDoc = (typeof existing)[number];
  const existingByKey = new Map<string, ExistingDoc>();
  for (const doc of existing) {
    existingByKey.set(comboKeyFromDoc(doc.attributes), doc);
  }

  const ops: mongoose.mongo.AnyBulkWriteOperation[] = [];
  const seenKeys = new Set<string>();

  for (const combo of generated) {
    const key = comboKey(combo);
    seenKeys.add(key);
    const provided = providedByKey.get(key);
    const current = existingByKey.get(key);
    const data = {
      attributes: combo.map((c) => ({ attributeId: new mongoose.Types.ObjectId(c.attributeId), value: c.value })),
      sku: provided?.sku ?? current?.sku ?? "",
      price: provided?.price ?? current?.price ?? 0,
      salePrice: provided?.salePrice ?? current?.salePrice ?? undefined,
      images: provided?.images ?? current?.images ?? [],
      stock: provided?.stock ?? current?.stock ?? 0,
      active: provided?.active ?? current?.active ?? true,
      allowBackorder: provided?.allowBackorder ?? current?.allowBackorder ?? false
    };
    if (current) {
      ops.push({
        updateOne: {
          filter: { _id: current._id },
          update: { $set: data }
        }
      });
    } else {
      ops.push({ insertOne: { document: { productId: productIdObj, ...data } } });
    }
  }

  for (const doc of existing) {
    const key = comboKeyFromDoc(doc.attributes);
    if (!seenKeys.has(key)) {
      ops.push({ deleteOne: { filter: { _id: doc._id } } });
    }
  }

  if (ops.length > 0) {
    await ProductVariant.bulkWrite(ops);
  }

  return generated.length;
}

// ---------------------------------------------------------------- Resolution
// A unified view of a purchasable variant regardless of storage: a ProductVariant
// document (new system) or a legacy embedded `product.variants` entry. Every
// purchase path (cart, order creation, stock validation) resolves through this so
// both systems behave identically downstream.
export type ResolvedVariant = {
  kind: "legacy" | "product";
  variantId: string;
  sku: string;
  label: string;
  price: number;
  basePrice: number;
  salePrice: number | null;
  compareAtPrice: number | null;
  hasDiscount: boolean;
  percentOff: number;
  stock: number;
  allowBackorder: boolean;
  active: boolean;
  attributes: { key: string; name: string; value: string }[];
};

export type ResolveProduct = {
  _id: unknown;
  price: number;
  compareAtPrice?: number | null;
  salePrice?: number | null;
  variants?: { _id: unknown; label: string; sku: string; color?: string; size?: string; priceOverride?: number; salePrice?: number; inventoryAvailable?: number; allowBackorder?: boolean; active?: boolean }[];
  variantDimensions?: { attributeId: unknown }[];
};

export type ResolveProductVariant = {
  _id: unknown;
  sku: string;
  price: number;
  salePrice?: number;
  stock: number;
  active: boolean;
  allowBackorder?: boolean;
  attributes: { attributeId: { key?: string; name?: string } | string; value: unknown }[];
};

// Human label for a ProductVariant, e.g. "Black / UK 8". Uses the product's
// dimension order for stable attribute ordering when available.
export function productVariantLabel(pv: ResolveProductVariant, dimensions?: { attributeId: unknown }[]): string {
  const attrs = pv.attributes;
  const ordered = dimensions && dimensions.length > 0 ? dimensions : attrs;
  const parts = ordered
    .map((d) => {
      const match = attrs.find((a) => String(a.attributeId) === String(d.attributeId));
      return match ? String(match.value) : "";
    })
    .filter(Boolean);
  return parts.length > 0 ? parts.join(" / ") : attrs.map((a) => String(a.value)).join(" / ");
}

export function resolveVariantById(
  product: ResolveProduct,
  productVariants: ResolveProductVariant[],
  variantId: string
): ResolvedVariant | null {
  const legacy = (product.variants ?? []).find((v) => String(v._id) === String(variantId));
  if (legacy) {
    const pricing = resolvePrice(legacy.priceOverride ?? product.price, {
      salePrice: legacy.salePrice,
      compareAtPrice: product.compareAtPrice
    });
    return {
      kind: "legacy",
      variantId: String(legacy._id),
      sku: legacy.sku,
      label: legacy.label,
      price: pricing.price,
      basePrice: pricing.basePrice,
      salePrice: pricing.salePrice,
      compareAtPrice: pricing.compareAtPrice,
      hasDiscount: pricing.hasDiscount,
      percentOff: pricing.percentOff,
      stock: legacy.inventoryAvailable ?? 0,
      allowBackorder: Boolean(legacy.allowBackorder),
      active: legacy.active !== false,
      attributes: [
        { key: "color", name: "Color", value: legacy.color ?? "" },
        ...(legacy.size ? [{ key: "size", name: "Size", value: legacy.size }] : [])
      ]
    };
  }

  const pv = (productVariants ?? []).find((v) => String(v._id) === String(variantId));
  if (pv) {
    const pricing = resolvePrice(pv.price, {
      salePrice: pv.salePrice,
      compareAtPrice: product.compareAtPrice
    });
    return {
      kind: "product",
      variantId: String(pv._id),
      sku: pv.sku,
      label: productVariantLabel(pv, product.variantDimensions),
      price: pricing.price,
      basePrice: pricing.basePrice,
      salePrice: pricing.salePrice,
      compareAtPrice: pricing.compareAtPrice,
      hasDiscount: pricing.hasDiscount,
      percentOff: pricing.percentOff,
      stock: pv.stock ?? 0,
      allowBackorder: Boolean(pv.allowBackorder),
      active: pv.active !== false,
      attributes: pv.attributes.map((a) => {
        const def = typeof a.attributeId === "object" && a.attributeId ? a.attributeId : null;
        return {
          key: def?.key ?? String(a.attributeId),
          name: def?.name ?? String(a.attributeId),
          value: String(a.value)
        };
      })
    };
  }

  return null;
}