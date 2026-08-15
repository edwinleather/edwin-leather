import { Router } from "express";
import { z } from "zod";
import { databaseReady } from "../config/db.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../middleware/error.js";
import { createOrder, orderResponse } from "../services/orders.js";

export const ordersRouter = Router();

const orderIntentSchema = z.object({
  email: z.string().email(),
  paymentMethod: z.enum(["razorpay", "cod"]),
  items: z.array(z.object({ productId: z.string().min(1), variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1),
  couponCode: z.string().trim().max(30).optional(),
  shippingAddress: z.object({
    fullName: z.string().min(2),
    line1: z.string().min(4),
    line2: z.string().optional(),
    city: z.string().min(2),
    state: z.string().min(2),
    postalCode: z.string().min(5),
    phone: z.string().min(8)
  })
});

ordersRouter.post("/", async (req, res, next) => {
  try {
    const input = orderIntentSchema.parse(req.body);

    if (!databaseReady()) return next(new ApiError(503, "Order service unavailable. Configure MONGODB_URI."));

    const uniqueIds = [...new Set(input.items.map((item) => item.productId))];
    const found = await Product.countDocuments({ _id: { $in: uniqueIds }, active: true });
    if (found < uniqueIds.length) {
      return next(new ApiError(400, "One or more products in your cart are no longer available."));
    }

    const order = await createOrder(input);
    return res.status(201).json({ ok: true, order: orderResponse(order) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid order input", error.flatten()));
    return next(error);
  }
});