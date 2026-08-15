import { createHmac, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import Razorpay from "razorpay";
import { env, isConfigured } from "../config/env.js";
import { databaseReady } from "../config/db.js";
import { ApiError } from "../middleware/error.js";
import { Order } from "../models/Order.js";

export const paymentsRouter = Router();

function razorpay() {
  if (!isConfigured(env.razorpayKeyId) || !isConfigured(env.razorpayKeySecret)) {
    throw new ApiError(503, "Razorpay credentials are not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }
  return new Razorpay({ key_id: env.razorpayKeyId, key_secret: env.razorpayKeySecret });
}

const createOrderSchema = z.object({
  orderId: z.string().min(1),
  receipt: z.string().min(1).max(40)
});

// Server-authoritative amount; creates a real Razorpay order (test mode with test keys).
paymentsRouter.post("/create-order", async (req, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "Order service unavailable. Configure MONGODB_URI."));
    const input = createOrderSchema.parse(req.body);

    const order = await Order.findById(input.orderId);
    if (!order) return next(new ApiError(404, "Order not found"));

    const amount = Math.round(order.total * 100);
    const client = razorpay();
    const rzpOrder = await client.orders.create({
      amount,
      currency: order.currency || "INR",
      receipt: input.receipt,
      notes: { orderId: String(order._id) }
    });

    order.payment.gatewayOrderId = rzpOrder.id;
    order.timeline.push({ type: "pending_payment", message: "Razorpay order created", at: new Date(), actorId: order.customerId });
    await order.save();

    return res.status(201).json({ ok: true, orderId: rzpOrder.id, amount, currency: order.currency || "INR", keyId: env.razorpayKeyId });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid payment order input", error.flatten()));
    return next(error);
  }
});

const verifySchema = z.object({ orderId: z.string().min(1), paymentId: z.string().min(1), signature: z.string().min(1) });

// Client returns here after Razorpay checkout completes; verifies the signature and marks the order paid.
paymentsRouter.post("/verify", async (req, res, next) => {
  try {
    if (!databaseReady()) return next(new ApiError(503, "Order service unavailable. Configure MONGODB_URI."));
    const input = verifySchema.parse(req.body);

    const order = await Order.findOne({ "payment.gatewayOrderId": input.orderId });
    if (!order) return next(new ApiError(404, "Order not found"));

    const client = razorpay();
    const valid = createHmac("sha256", env.razorpayKeySecret).update(`${input.orderId}|${input.paymentId}`).digest("hex") === input.signature;
    if (!valid) return next(new ApiError(400, "Payment verification failed"));

    order.payment.status = "paid";
    order.payment.gatewayPaymentId = input.paymentId;
    if (order.orderStatus === "pending_payment") order.orderStatus = "confirmed";
    order.timeline.push({ type: "confirmed", message: "Payment received", at: new Date(), actorId: order.customerId });
    await order.save();

    return res.json({ ok: true, status: order.orderStatus });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid verification input", error.flatten()));
    return next(error);
  }
});

paymentsRouter.post("/webhook", async (req, res, next) => {
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
    const entity = event?.payload?.payment?.entity;
    const gatewayOrderId = entity?.order_id;

    if (event?.event === "payment.captured" && gatewayOrderId) {
      const order = await Order.findOne({ "payment.gatewayOrderId": gatewayOrderId });
      if (order) {
        order.payment.status = "paid";
        order.payment.gatewayPaymentId = entity.id;
        if (order.orderStatus === "pending_payment") order.orderStatus = "confirmed";
        order.timeline.push({ type: "confirmed", message: "Payment confirmed (webhook)", at: new Date() });
        await order.save();
      }
    }

    if (event?.event === "payment.failed" && gatewayOrderId) {
      const order = await Order.findOne({ "payment.gatewayOrderId": gatewayOrderId });
      if (order) {
        order.payment.status = "failed";
        order.timeline.push({ type: "pending_payment", message: "Payment failed (webhook)", at: new Date() });
        await order.save();
      }
    }

    return res.json({ ok: true, verified: true });
  } catch (error) {
    return next(error);
  }
});