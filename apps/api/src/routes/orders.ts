import { Router } from "express";
import { z } from "zod";
import { databaseReady } from "../config/db.js";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/error.js";

export const ordersRouter = Router();

const orderIntentSchema = z.object({
  email: z.string().email(),
  paymentMethod: z.enum(["razorpay", "cod"]),
  items: z.array(z.object({ productId: z.string().min(1), variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1),
  shippingAddress: z.object({
    fullName: z.string().min(2), line1: z.string().min(4), line2: z.string().optional(), city: z.string().min(2), state: z.string().min(2), postalCode: z.string().min(5), phone: z.string().min(8)
  })
});

ordersRouter.post("/", async (req, res, next) => {
  try {
    const input = orderIntentSchema.parse(req.body);

    if (env.demoMode) {
      return res.status(201).json({
        ok: true,
        demo: true,
        order: {
          orderNumber: `EL-DEMO-${Date.now().toString().slice(-6)}`,
          orderStatus: input.paymentMethod === "cod" ? "confirmed" : "pending_payment",
          paymentStatus: input.paymentMethod === "cod" ? "cod_pending" : "pending"
        },
        message: "Demo order intent accepted. No inventory, payment, email, or shipment side effects were performed."
      });
    }

    if (!databaseReady()) return next(new ApiError(503, "Database unavailable"));
    return next(new ApiError(501, "Production order service is intentionally not enabled until inventory reservation and payment orchestration are connected."));
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid order input", error.flatten()));
    return next(error);
  }
});
