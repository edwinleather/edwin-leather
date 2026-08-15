import { Router } from "express";
import { z } from "zod";
import { databaseReady } from "../config/db.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../middleware/error.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { createOrder, orderResponse } from "../services/orders.js";
import { validateCoupon } from "../services/coupons.js";
import { computeDeliveryFee, getDeliveryConfig } from "../services/delivery.js";

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

const couponValidateSchema = z.object({
  code: z.string().trim().min(1).max(30),
  state: z.string().optional(),
  items: z.array(z.object({ productId: z.string().min(1), variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1)
});

ordersRouter.post("/", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = orderIntentSchema.parse(req.body);

    if (!databaseReady()) return next(new ApiError(503, "Order service unavailable. Configure MONGODB_URI."));

    const uniqueIds = [...new Set(input.items.map((item) => item.productId))];
    const found = await Product.countDocuments({ _id: { $in: uniqueIds }, active: true });
    if (found < uniqueIds.length) {
      return next(new ApiError(400, "One or more products in your cart are no longer available."));
    }

    const order = await createOrder({ ...input, customerId: String(req.auth!.sub) });
    return res.status(201).json({ ok: true, order: orderResponse(order) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid order input", error.flatten()));
    return next(error);
  }
});

// Let checkout validate a coupon against the real cart before the order is placed.
ordersRouter.post("/validate-coupon", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = couponValidateSchema.parse(req.body);
    if (!databaseReady()) return next(new ApiError(503, "Order service unavailable. Configure MONGODB_URI."));

    const itemsById = new Map(input.items.map((item) => [item.variantId, item]));
    const products = await Product.find({ _id: { $in: input.items.map((item) => item.productId) }, active: true }).lean();

    const orderLines: { productId: string; category: string; quantity: number; unitPrice: number }[] = [];
    for (const product of products) {
      for (const variant of product.variants ?? []) {
        const requested = itemsById.get(String(variant._id));
        if (!requested) continue;
        orderLines.push({
          productId: String(product._id),
          category: product.category,
          quantity: requested.quantity,
          unitPrice: variant.priceOverride ?? product.price
        });
      }
    }
    if (orderLines.length === 0) return next(new ApiError(400, "Cart items could not be resolved"));

    const subtotal = orderLines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const deliveryConfig = await getDeliveryConfig();
    const shippingAmount = computeDeliveryFee(deliveryConfig, subtotal, input.state);

    const result = await validateCoupon(input.code.toUpperCase(), orderLines, req.auth?.email, shippingAmount);
    return res.json({
      ok: true,
      data: {
        valid: result.discountAmount > 0,
        amount: result.discountAmount,
        freeShipping: result.discountType === "free_shipping",
        note: result.discountAmount > 0 ? `${result.code} applied` : "Coupon not applicable to this cart",
        discountType: result.discountType
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid coupon input", error.flatten()));
    return next(error);
  }
});