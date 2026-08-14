import { createHmac, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { env, isConfigured } from "../config/env.js";
import { ApiError } from "../middleware/error.js";

export const paymentsRouter = Router();

const createOrderSchema = z.object({ amount: z.number().int().positive(), currency: z.string().default("INR"), receipt: z.string().min(1).max(40) });

paymentsRouter.post("/create-order", (req, res, next) => {
  try {
    const input = createOrderSchema.parse(req.body);
    if (!isConfigured(env.razorpayKeyId) || !isConfigured(env.razorpayKeySecret)) {
      return res.status(503).json({ ok: false, demo: true, error: "Razorpay credentials are not configured", requested: input, configure: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"] });
    }
    return next(new ApiError(501, "Wire the Razorpay Orders API here after adding live/test credentials. Keep amount calculation authoritative on the server."));
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid payment order input", error.flatten()));
    return next(error);
  }
});

paymentsRouter.post("/webhook", (req, res, next) => {
  try {
    if (!isConfigured(env.razorpayWebhookSecret)) return next(new ApiError(503, "RAZORPAY_WEBHOOK_SECRET is not configured"));
    if (!Buffer.isBuffer(req.body)) return next(new ApiError(400, "Webhook body must be raw bytes"));
    const signature = req.header("x-razorpay-signature");
    if (!signature) return next(new ApiError(400, "Missing Razorpay signature"));

    const expected = createHmac("sha256", env.razorpayWebhookSecret).update(req.body).digest("hex");
    const supplied = Buffer.from(signature, "utf8");
    const calculated = Buffer.from(expected, "utf8");
    if (supplied.length !== calculated.length || !timingSafeEqual(supplied, calculated)) return next(new ApiError(401, "Invalid Razorpay webhook signature"));

    const event = JSON.parse(req.body.toString("utf8"));
    console.info("[razorpay:webhook] verified event", event?.event ?? "unknown");
    // TODO: idempotently persist gateway identifiers, payment state, and order timeline.
    return res.json({ ok: true, verified: true });
  } catch (error) {
    return next(error);
  }
});
