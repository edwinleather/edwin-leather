import { createHmac, timingSafeEqual } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import Razorpay from "razorpay";
import { env, isConfigured, isRazorpayConfigured } from "../config/env.js";
import { ensureDatabase } from "../config/db.js";
import { ApiError } from "../middleware/error.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { Order } from "../models/Order.js";
import { commitStock } from "../services/inventory.js";
import { sendOrderConfirmationEmail, sendPaymentReceivedEmail } from "../services/send-order-email.js";
import { getPaymentKeys } from "../services/payment-config.js";

export const paymentsRouter = Router();

async function razorpay() {
  const keys = await getPaymentKeys();
  if (!isRazorpayConfigured(keys.keyId) || !isRazorpayConfigured(keys.keySecret)) {
    throw new ApiError(503, "Razorpay credentials are not configured. Add RAZORPAY_TEST_KEY_ID/SECRET and RAZORPAY_LIVE_KEY_ID/SECRET.");
  }
  return { client: new Razorpay({ key_id: keys.keyId, key_secret: keys.keySecret }), keys };
}

// Public status check so the frontend can degrade gracefully when Razorpay
// credentials are missing (e.g. in local dev or a fresh deploy).
paymentsRouter.get("/status", async (_req, res) => {
  const keys = await getPaymentKeys();
  const configured = isRazorpayConfigured(keys.keyId) && isRazorpayConfigured(keys.keySecret);
  return res.json({ ok: true, onlinePaymentsAvailable: configured, mode: keys.mode });
});

// Return current payment mode for the frontend (no keys exposed).
paymentsRouter.get("/mode", async (_req, res) => {
  const keys = await getPaymentKeys();
  return res.json({ ok: true, mode: keys.mode });
});

const createOrderSchema = z.object({
  orderId: z.string().min(1),
  receipt: z.string().min(1).max(40)
});

// Server-authoritative amount; creates a real Razorpay order (test mode with test keys).
paymentsRouter.post("/create-order", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Order service unavailable. Configure MONGODB_URI."));
    const input = createOrderSchema.parse(req.body);

    const order = await Order.findOne({ _id: input.orderId, customerId: req.auth!.sub });
    if (!order) return next(new ApiError(404, "Order not found"));

    // For COD orders, charge only the deposit amount (e.g. 10%); full amount for online
    const isCod = order.payment.method === "cod";
    const chargeAmount = isCod && order.codDeposit?.depositAmount
      ? order.codDeposit.depositAmount
      : order.total;
    const amount = Math.round(chargeAmount * 100);

    const { client, keys } = await razorpay();
    const rzpOrder = await client.orders.create({
      amount,
      currency: order.currency || "INR",
      receipt: input.receipt,
      notes: { orderId: String(order._id), paymentType: isCod ? "cod_deposit" : "full" }
    });

    order.payment.gatewayOrderId = rzpOrder.id;
    order.timeline.push({ type: "pending_payment", message: "Razorpay order created", at: new Date(), actorId: order.customerId });
    await order.save();

    return res.status(201).json({ ok: true, orderId: rzpOrder.id, amount, currency: order.currency || "INR", keyId: keys.keyId, mode: keys.mode });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid payment order input", error.flatten()));
    return next(error);
  }
});

const verifySchema = z.object({ orderId: z.string().min(1), paymentId: z.string().min(1), signature: z.string().min(1) });

// Client returns here after Razorpay checkout completes; verifies the signature and marks the order paid.
paymentsRouter.post("/verify", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    if (!(await ensureDatabase())) return next(new ApiError(503, "Order service unavailable. Configure MONGODB_URI."));
    const input = verifySchema.parse(req.body);

    const order = await Order.findOne({ "payment.gatewayOrderId": input.orderId, customerId: req.auth!.sub });
    if (!order) return next(new ApiError(404, "Order not found"));

    const { keys } = await razorpay();
    const calculated = createHmac("sha256", keys.keySecret).update(`${input.orderId}|${input.paymentId}`).digest("hex");
    const supplied = Buffer.from(input.signature, "utf8");
    const expected = Buffer.from(calculated, "utf8");
    const valid = supplied.length === expected.length && timingSafeEqual(supplied, expected);
    if (!valid) return next(new ApiError(400, "Payment verification failed"));

    order.payment.status = "paid";
    order.payment.gatewayPaymentId = input.paymentId;
    if (order.orderStatus === "pending_payment") order.orderStatus = "order_received";
    // For COD orders with deposit, the deposit has been paid; balance is due on delivery
    const isCod = order.payment.method === "cod";
    if (isCod) {
      order.payment.status = "cod_pending";
      order.timeline.push({ type: "order_received", message: "COD deposit paid - order received, balance due on delivery", at: new Date(), actorId: order.customerId });
    } else {
      order.timeline.push({ type: "order_received", message: "Payment received - order received", at: new Date(), actorId: order.customerId });
    }
    await order.save();
    // Send order confirmation + payment received emails after payment is verified
    sendOrderConfirmationEmail(order).catch(() => {});
    sendPaymentReceivedEmail(order).catch(() => {});

    return res.json({ ok: true, status: order.orderStatus });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid verification input", error.flatten()));
    return next(error);
  }
});

paymentsRouter.post("/webhook", async (req, res, next) => {
  try {
    const { keys } = await razorpay();
    if (!isConfigured(keys.webhookSecret)) return next(new ApiError(503, "RAZORPAY_WEBHOOK_SECRET is not configured"));
    if (!Buffer.isBuffer(req.body)) return next(new ApiError(400, "Webhook body must be raw bytes"));
    const signature = req.header("x-razorpay-signature");
    if (!signature) return next(new ApiError(400, "Missing Razorpay signature"));

    const expected = createHmac("sha256", keys.webhookSecret).update(req.body).digest("hex");
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
        if (order.orderStatus === "pending_payment") order.orderStatus = "order_received";
        // For COD orders with deposit, the deposit has been paid; balance is due on delivery
        const isCod = order.payment.method === "cod";
        if (isCod) {
          order.payment.status = "cod_pending";
          order.timeline.push({ type: "order_received", message: "COD deposit confirmed - order received, balance due on delivery", at: new Date() });
        } else {
          order.timeline.push({ type: "order_received", message: "Payment confirmed - order received", at: new Date() });
        }
        await order.save();
        // Send order confirmation + payment received emails after payment is confirmed
        sendOrderConfirmationEmail(order).catch(() => {});
        sendPaymentReceivedEmail(order).catch(() => {});
        await commitStock(
          order.lines.map((line: { productId: { toString(): string }; variantId: { toString(): string }; sku: string; quantity: number }) => ({
            productId: String(line.productId),
            variantId: String(line.variantId),
            sku: line.sku,
            quantity: line.quantity
          }))
        );
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