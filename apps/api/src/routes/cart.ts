import { Router } from "express";
import { z } from "zod";
import { ensureDatabase } from "../config/db.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { Cart } from "../models/Cart.js";
import { Product } from "../models/Product.js";

export const cartRouter = Router();

const cartItemSchema = z.object({
  lineId: z.string().min(1),
  productId: z.string().min(1),
  variantId: z.string().min(1),
  slug: z.string().optional(),
  name: z.string().optional(),
  image: z.string().optional(),
  price: z.number().min(0).optional(),
  variantLabel: z.string().optional(),
  quantity: z.number().int().min(1).max(50)
});

// Re-check live stock for each cart line so items that went out of stock (or are
// on backorder) are flagged. Returns lines with an `isOutOfStock` flag.
async function withAvailability(items: Array<Record<string, unknown>>): Promise<Array<Record<string, unknown>>> {
  const variantIds = items.map((i) => String(i.variantId)).filter(Boolean);
  const products = await Product.find({ "variants._id": { $in: variantIds } })
    .select({ "variants.$": 1, codAvailable: 1 })
    .lean();
  const stockById = new Map<string, { available: number; allowBackorder: boolean; codAvailable: boolean }>();
  for (const p of products) {
    const v = (p as unknown as { variants: { _id: unknown; inventoryAvailable: number; allowBackorder?: boolean }[] }).variants?.[0];
    if (v) stockById.set(String(v._id), { available: v.inventoryAvailable, allowBackorder: Boolean(v.allowBackorder), codAvailable: (p as unknown as { codAvailable?: boolean }).codAvailable !== false });
  }
  return items.map((item) => {
    const stock = stockById.get(String(item.variantId));
    const isOutOfStock = stock ? stock.available <= 0 && !stock.allowBackorder : true;
    return { ...item, isOutOfStock, codAvailable: stock ? stock.codAvailable : true };
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
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    const annotated = await withAvailability(cart.items as Array<Record<string, unknown>>);
    return res.json({ ok: true, items: annotated });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid cart input", error.flatten()));
    return next(error);
  }
});