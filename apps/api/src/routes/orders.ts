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

function demoOrderResponse(input: z.infer<typeof orderIntentSchema>) {
  const subtotal = input.items.reduce((sum, item) => sum + item.quantity * 100, 0);
  const discount = input.couponCode ? Math.round(subtotal * 0.1) : 0;
  const shipping = subtotal >= 2499 || subtotal === 0 ? 0 : 149;
  return {
    id: `demo_${Date.now()}`,
    orderNumber: `EL-DEMO-${Date.now().toString().slice(-6)}`,
    email: input.email,
    lines: input.items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      sku: "SKU-DEMO",
      name: "Demo product",
      variantLabel: "Demo variant",
      quantity: item.quantity,
      unitPrice: 100,
      lineTotal: item.quantity * 100
    })),
    subtotal,
    shippingAmount: shipping,
    discountAmount: discount,
    coupon: input.couponCode ? { code: input.couponCode.toUpperCase(), discountType: "percentage" } : undefined,
    total: Math.max(0, subtotal + shipping - discount),
    currency: "INR",
    orderStatus: input.paymentMethod === "cod" ? "confirmed" : "pending_payment",
    paymentStatus: input.paymentMethod === "cod" ? "cod_pending" : "pending",
    paymentMethod: input.paymentMethod,
    shippingStatus: "not_created",
    timeline: [
      { type: "placed", message: input.paymentMethod === "cod" ? "Order confirmed (demo)" : "Order placed (demo)", at: new Date().toISOString() }
    ]
  };
}

ordersRouter.post("/", async (req, res, next) => {
  try {
    const input = orderIntentSchema.parse(req.body);

    if (!databaseReady()) {
      return res.status(503).json({ ok: true, demo: true, order: demoOrderResponse(input), message: "MongoDB is not configured. Wire MONGODB_URI to persist real orders with inventory reservation." });
    }

    // Incremental migration guard: the storefront may still run on the demo
    // catalog while the DB holds its own products. Treat a missing catalog as
    // a "not live yet" response so the UI can fall back gracefully.
    const uniqueIds = [...new Set(input.items.map((item) => item.productId))];
    const found = await Product.countDocuments({ _id: { $in: uniqueIds }, active: true });
    if (found < uniqueIds.length) {
      return res.status(503).json({ ok: false, demo: true, error: "The live catalog has not been seeded for these products yet", configure: ["MONGODB_URI"] });
    }

    const order = await createOrder(input);
    return res.status(201).json({ ok: true, demo: false, order: orderResponse(order) });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid order input", error.flatten()));
    return next(error);
  }
});