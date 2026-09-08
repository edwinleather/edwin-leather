import { Router } from "express";
import { z } from "zod";
import { ensureDatabase } from "../config/db.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";
import { ProductVariant } from "../models/ProductVariant.js";
import { Types } from "mongoose";

export const cartRouter = Router();

const cartItemSchema = z.object({
  lineId: z.string().min(1),
  productId: z.string().min(1),
  variantId: z.string().min(1),
  slug: z.string().optional(),
  name: z.string().optional(),
  image: z.string().optional(),
  price: z.number().min(0).optional(),
  priceSnapshot: z.number().min(0).optional(),
  variantLabel: z.string().optional(),
  variantSnapshot: z.string().optional(),
  quantity: z.number().int().min(1).max(50)
});

const stockCheckSchema = z.array(cartItemSchema).min(1).max(50);

// Public: re-check live stock for a list of cart lines (guest or logged-in).
// Returns the max purchasable quantity and whether the line is out of stock.
cartRouter.post("/stock-check", async (req, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Cart service unavailable"));
    const items = stockCheckSchema.parse(req.body);
    const annotated = await withAvailability(items as Array<Record<string, unknown>>);
    return res.json({
      ok: true,
      items: annotated.map((item) => {
        const { isOutOfStock, codAvailable, ...rest } = item as Record<string, unknown>;
        return { ...rest, isOutOfStock, codAvailable };
      })
    });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid cart input", error.flatten()));
    return next(error);
  }
});

// Re-check live stock for each cart line so items that went out of stock (or are
// on backorder) are flagged. Returns lines with an `isOutOfStock` flag and the
// max purchasable quantity. Uses aggregation so EVERY matching variant is
// resolved (the positional `variants.$` projection only ever returns the first).
async function withAvailability(items: Array<Record<string, unknown>>): Promise<Array<Record<string, unknown>>> {
  const variantIds = items.map((i) => String(i.variantId)).filter(Boolean);
  const objectIds = variantIds.map((id) => Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : id);

  // ProductVariant-backed items (new variant system) - stock lives on the
  // ProductVariant document.
  const productVariants = await ProductVariant.find({ _id: { $in: objectIds } })
    .populate("attributes.attributeId")
    .lean();
  const pvStockById = new Map<string, { available: number; allowBackorder: boolean; codAvailable: boolean }>();
  for (const pv of productVariants) {
    pvStockById.set(String(pv._id), {
      available: pv.stock ?? 0,
      allowBackorder: Boolean(pv.allowBackorder),
      codAvailable: true
    });
  }

  // Legacy embedded variants - stock lives on the Product document.
  const rows = await Product.aggregate([
    { $match: { "variants._id": { $in: objectIds } } },
    { $unwind: "$variants" },
    { $match: { "variants._id": { $in: objectIds } } },
    {
      $project: {
        _id: 1,
        codAvailable: 1,
        variantId: "$variants._id",
        inventoryAvailable: "$variants.inventoryAvailable",
        allowBackorder: "$variants.allowBackorder"
      }
    }
  ]);
  const stockById = new Map<string, { available: number; allowBackorder: boolean; codAvailable: boolean }>();
  for (const row of rows as unknown as { variantId: unknown; inventoryAvailable?: number; allowBackorder?: boolean; codAvailable?: boolean }[]) {
    stockById.set(String(row.variantId), {
      available: row.inventoryAvailable ?? 0,
      allowBackorder: Boolean(row.allowBackorder),
      codAvailable: (row as { codAvailable?: boolean }).codAvailable !== false
    });
  }

  return items.map((item) => {
    const id = String(item.variantId);
    const stock = pvStockById.get(id) ?? stockById.get(id);
    const isOutOfStock = stock ? stock.available <= 0 && !stock.allowBackorder : true;
    return { ...item, isOutOfStock, maxQuantity: stock ? stock.available : 0, codAvailable: stock ? stock.codAvailable : true };
  });
}

cartRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Cart service unavailable"));
    const cart = await Cart.findOne({ user: req.auth!.sub }).lean();
    const items = cart?.items ?? [];
    const annotated = await withAvailability(items as Array<Record<string, unknown>>);
    return res.json({ ok: true, items: annotated });
  } catch (error) {
    return next(error);
  }
});

cartRouter.put("/", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Cart service unavailable"));
    const input = z.object({ items: z.array(cartItemSchema).default([]) }).parse(req.body);
    const cart = await Cart.findOneAndUpdate(
      { user: req.auth!.sub },
      { $set: { items: input.items } },
      { returnDocument: "after", upsert: true, setDefaultsOnInsert: true }
    );
    const annotated = await withAvailability(cart.items as Array<Record<string, unknown>>);
    return res.json({ ok: true, items: annotated });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid cart input", error.flatten()));
    return next(error);
  }
});