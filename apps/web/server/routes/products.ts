import { Router } from "express";
import { z } from "zod";
import { Types } from "mongoose";
import { ensureDatabase } from "../config/db.js";
import { Product } from "../models/Product.js";
import { ProductVariant } from "../models/ProductVariant.js";
import { Attribute } from "../models/Attribute.js";
import { Category } from "../models/Category.js";
import AnalyticEvent from "../models/AnalyticEvent.js";
import { ApiError } from "../middleware/error.js";
import { getActivePromotions, applyPromotion } from "../services/pricing.js";

export const productsRouter = Router();

// Reject query parameters that look like MongoDB operators ($gt, $ne, $regex, $in…)
// so a malicious client can never inject into the filter object.
function isOperator(obj: unknown): boolean {
  if (!obj || typeof obj !== "object") return false;
  return Object.keys(obj).some((k) => k.startsWith("$"));
}

async function attachVariants(data: (Record<string, unknown> & { _id: { toString(): string } })[]) {
  const ids = data.map((p) => p._id.toString());
  const variants = await ProductVariant.find({ productId: { $in: ids }, active: true })
    .populate("attributes.attributeId")
    .lean();
  const byProduct = new Map<string, typeof variants>();
  for (const v of variants) {
    const pid = String(v.productId);
    const list = byProduct.get(pid) ?? [];
    list.push(v);
    byProduct.set(pid, list);
  }
  for (const p of data) {
    p.productVariants = byProduct.get(p._id.toString()) ?? [];
  }
}

async function attachDimensions(data: (Record<string, unknown> & { variantDimensions?: { attributeId: unknown; values?: string[] }[] })[]) {
  const productsWithDimensions = data.filter((p) => (p.variantDimensions ?? []).length > 0);
  if (productsWithDimensions.length === 0) return;
  const ids = productsWithDimensions.flatMap((p) => p.variantDimensions!.map((d) => d.attributeId));
  const attrDocs = await Attribute.find({ _id: { $in: ids } }).lean();
  const attrById = new Map(attrDocs.map((a) => [String(a._id), a]));
  for (const p of productsWithDimensions) {
    p.variantDimensions = (p.variantDimensions ?? []).map((d) => {
      const attr = attrById.get(String(d.attributeId)) ?? null;
      return {
        attributeId: attr,
        values: d.values ?? [],
        attribute: attr
      };
    });
  }
}

async function attachPromotions(data: (Record<string, unknown> & { _id: { toString(): string }; price: number; salePrice?: number; category: string; productVariants?: { _id: { toString(): string }; price: number; salePrice?: number }[] })[]) {
  const promotions = await getActivePromotions();
  for (const p of data) {
    const productId = p._id.toString();
    const basePrice = p.salePrice && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
    const promo = applyPromotion(promotions, basePrice, productId, p.category);
    if (promo) {
      p.promotion = { name: promo.name, amount: promo.amount, price: promo.price };
      for (const v of p.productVariants ?? []) {
        const vBase = v.salePrice && v.salePrice > 0 && v.salePrice < v.price ? v.salePrice : v.price;
        const vPromo = applyPromotion(promotions, vBase, productId, p.category);
        if (vPromo) (v as Record<string, unknown>).promotionPrice = vPromo.price;
      }
    }
  }
}

productsRouter.get("/", async (req, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Catalog unavailable. Configure MONGODB_URI."));
    const filter: Record<string, unknown> = { active: true };
    const rawCategory = req.query.category;
    if (isOperator(rawCategory)) return next(new ApiError(400, "Invalid category filter"));
    if (typeof rawCategory === "string" && rawCategory) filter.category = rawCategory;

    // Free-text search across name, subtitle, brand, keywords and SKUs.
    const rawQ = req.query.q;
    if (isOperator(rawQ)) return next(new ApiError(400, "Invalid search query"));
    if (typeof rawQ === "string" && rawQ.trim()) {
      const q = rawQ.trim().slice(0, 200).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const or: Record<string, unknown>[] = [
        { name: { $regex: q, $options: "i" } },
        { subtitle: { $regex: q, $options: "i" } },
        { brand: { $regex: q, $options: "i" } },
        { searchKeywords: { $regex: q, $options: "i" } },
        { "variants.sku": { $regex: q, $options: "i" } }
      ];
      const pvMatches = await ProductVariant.find({ sku: { $regex: q, $options: "i" } }, { productId: 1 }).lean();
      if (pvMatches.length > 0) {
        const pvProductIds = [...new Set(pvMatches.map((pv) => String(pv.productId)))];
        or.push({ _id: { $in: pvProductIds.map((id) => new Types.ObjectId(id)) } });
      }
      filter.$or = or;
    }

    // Price range (based on the product base price).
    const priceBounds: Record<string, number> = {};
    const rawMin = req.query.priceMin;
    const rawMax = req.query.priceMax;
    if (!isOperator(rawMin) && typeof rawMin === "string" && rawMin !== "" && !Number.isNaN(Number(rawMin))) {
      priceBounds.$gte = Number(rawMin);
    }
    if (!isOperator(rawMax) && typeof rawMax === "string" && rawMax !== "" && !Number.isNaN(Number(rawMax))) {
      priceBounds.$lte = Number(rawMax);
    }
    if (Object.keys(priceBounds).length > 0) filter.price = priceBounds;

    // Attribute filters: ?filter[color]=Black&filter[size]=8,9 (values within a
    // key are OR-ed, different keys are AND-ed).
    const attrFilter = req.query.filter;
    const attrConditions: Record<string, unknown>[] = [];
    if (attrFilter && typeof attrFilter === "object" && !Array.isArray(attrFilter)) {
      const entries = Object.entries(attrFilter as Record<string, unknown>);
      if (entries.length > 0) {
        const keys = entries.map(([k]) => k);
        const attrs = await Attribute.find({ key: { $in: keys } }, { _id: 1, key: 1 }).lean();
        const idByKey = new Map(attrs.map((a) => [a.key, String(a._id)]));
        for (const [key, rawValue] of entries) {
          const id = idByKey.get(key);
          if (!id) continue;
          const values = (Array.isArray(rawValue) ? rawValue : [rawValue])
            .map((v) => String(v).split(","))
            .flat()
            .map((s) => s.trim())
            .filter((s) => s && !s.startsWith("$"));
          if (values.length === 0) continue;
          attrConditions.push({ attributes: { $elemMatch: { attributeId: new Types.ObjectId(id), value: { $in: values } } } });
        }
      }
    }
    if (attrConditions.length > 0) {
      filter.$and = [...(filter.$or ? [filter.$or] : []), ...attrConditions];
    }

    const data = await Product.find(filter).sort({ featured: -1, createdAt: -1 }).populate("attributes.attributeId").lean();
    await Promise.all([attachVariants(data), attachDimensions(data), attachPromotions(data)]);

    const facets = buildFacets(data, typeof rawCategory === "string" ? rawCategory : undefined);

    return res.json({ ok: true, source: "mongodb", data, facets });
  } catch (error) {
    return next(error);
  }
});

type FacetAttr = { key: string; name: string; values: string[] };
function buildFacets(data: { attributes?: { attributeId?: { key?: string; name?: string } | string; value?: string | string[] }[] }[], category?: string): { attributes: FacetAttr[]; priceRange: { min: number; max: number } } {
  const priceRange: { min: number; max: number } = { min: Number.POSITIVE_INFINITY, max: 0 };
  const map = new Map<string, Set<string>>();
  for (const p of data) {
    const price = (p as unknown as { price?: number }).price ?? 0;
    if (price < priceRange.min) priceRange.min = price;
    if (price > priceRange.max) priceRange.max = price;
    for (const a of p.attributes ?? []) {
      const def = typeof a.attributeId === "object" && a.attributeId ? a.attributeId : null;
      const key = def?.key;
      if (!key) continue;
      const values = Array.isArray(a.value) ? a.value.map(String) : [String(a.value ?? "")];
      const set = map.get(key) ?? new Set<string>();
      for (const v of values) if (v) set.add(v);
      map.set(key, set);
    }
  }
  if (priceRange.min === Number.POSITIVE_INFINITY) priceRange.min = 0;
  return {
    attributes: [...map.entries()].map(([key, values]) => ({
      key,
      name: key,
      values: [...values]
    })),
    priceRange
  };
}

productsRouter.get("/:slug", async (req, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Catalog unavailable. Configure MONGODB_URI."));
    const product = await Product.findOne({ slug: req.params.slug, active: true }).populate("attributes.attributeId").lean();
    if (!product) return next(new ApiError(404, "Product not found"));
    await Promise.all([attachVariants([product]), attachDimensions([product]), attachPromotions([product])]);
    return res.json({ ok: true, source: "mongodb", data: product });
  } catch (error) {
    return next(error);
  }
});

productsRouter.post("/analytics/event", async (req, res, next) => {
  try {
    if (!(await ensureDatabase())) return res.status(204).end();
    const input = z.object({
      type: z.enum(["page_view", "product_view", "add_to_cart", "remove_from_cart", "checkout_start", "checkout_complete", "order_placed"]),
      productId: z.string().optional(),
      variantId: z.string().optional(),
      orderId: z.string().optional(),
      sessionId: z.string().optional(),
      amount: z.number().optional(),
      quantity: z.number().optional(),
      meta: z.record(z.string(), z.unknown()).optional()
    }).parse(req.body);
    await AnalyticEvent.create(input);
    return res.status(204).end();
  } catch {
    return res.status(204).end();
  }
});