import { Router } from "express";
import { z } from "zod";
import { databaseReady } from "../config/db.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { Cart } from "../models/Cart.js";

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

cartRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "Cart service unavailable"));
    const cart = await Cart.findOne({ user: req.auth!.sub }).lean();
    return res.json({ ok: true, items: cart?.items ?? [] });
  } catch (error) {
    return next(error);
  }
});

cartRouter.put("/", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "Cart service unavailable"));
    const input = z.object({ items: z.array(cartItemSchema).default([]) }).parse(req.body);
    const cart = await Cart.findOneAndUpdate(
      { user: req.auth!.sub },
      { $set: { items: input.items } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.json({ ok: true, items: cart.items });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid cart input", error.flatten()));
    return next(error);
  }
});