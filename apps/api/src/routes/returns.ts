import { Router } from "express";
import { z } from "zod";
import { databaseReady } from "../config/db.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { ApiError } from "../middleware/error.js";
import { Order } from "../models/Order.js";
import { Return } from "../models/Return.js";

export const returnsRouter = Router();

const returnRequestSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(8),
  notes: z.string().optional(),
  items: z
    .array(z.object({ productId: z.string().min(1), variantId: z.string().min(1), quantity: z.number().int().min(1) }))
    .optional()
});

const ELIGIBLE_STATUSES = ["processing", "packed", "shipped", "delivered"];

async function nextReturnNumber() {
  const now = Date.now().toString().slice(-6);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const suffix = Math.floor(100 + Math.random() * 900).toString();
    const candidate = `RET${now}${suffix}`;
    const exists = await Return.exists({ returnNumber: candidate });
    if (!exists) return candidate;
  }
  throw new ApiError(500, "Could not allocate a return number");
}

function requireDb() {
  if (!databaseReady()) throw new ApiError(503, "Database unavailable");
}

returnsRouter.post("/", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    requireDb();
    const input = returnRequestSchema.parse(req.body);

    const order = await Order.findById(input.orderId);
    if (!order) return next(new ApiError(404, "Order not found"));
    if (!req.auth!.sub || String(order.customerId) !== req.auth!.sub) return next(new ApiError(403, "You can only request returns for your own orders"));
    if (!ELIGIBLE_STATUSES.includes(order.orderStatus)) return next(new ApiError(400, `Returns can only be requested for orders in ${ELIGIBLE_STATUSES.join(", ")} status`));

    const items = input.items ?? order.lines.map((line: { productId: { toString(): string }; variantId: { toString(): string }; quantity: number }) => ({
      productId: String(line.productId),
      variantId: String(line.variantId),
      quantity: line.quantity
    }));

    const returnItems = [];
    for (const item of items) {
      const line = order.lines.find((candidate: { productId: { toString(): string }; variantId: { toString(): string }; quantity: number; nameSnapshot: string; unitPrice: number }) =>
        String(candidate.productId) === item.productId && String(candidate.variantId) === item.variantId
      );
      if (!line) return next(new ApiError(400, `Item ${item.productId}/${item.variantId} is not part of this order`));
      if (item.quantity > line.quantity) return next(new ApiError(400, `Cannot return more than ordered for ${line.nameSnapshot}`));
      returnItems.push({
        productId: line.productId,
        variantId: line.variantId,
        sku: line.sku,
        nameSnapshot: line.nameSnapshot,
        quantity: item.quantity
      });
    }

    const refundEstimate = returnItems.reduce((sum, item) => sum + item.quantity * order.lines.find((l: { variantId: { toString(): string }; unitPrice: number }) => String(l.variantId) === String(item.variantId))!.unitPrice, 0);

    const record = new Return({
      returnNumber: await nextReturnNumber(),
      orderId: order._id,
      customerId: req.auth!.sub,
      email: order.email,
      items: returnItems,
      reason: input.reason,
      notes: input.notes,
      status: "requested",
      refundAmount: Math.min(refundEstimate, order.total)
    });
    record.timeline.push({ type: "requested", message: "Return requested by customer", at: new Date() });
    await record.save();

    if (order.orderStatus !== "return_requested") {
      order.orderStatus = "return_requested";
      order.timeline.push({ type: "return_requested", message: `Return ${record.returnNumber} requested`, at: new Date() });
      await order.save();
    }

    return res.status(201).json({ ok: true, data: { returnNumber: record.returnNumber, status: record.status, refundAmount: record.refundAmount } });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid return request", error.flatten()));
    return next(error);
  }
});

returnsRouter.get("/", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    requireDb();
    const records = await Return.find({ customerId: req.auth!.sub }).sort({ createdAt: -1 });
    return res.json({
      ok: true,
      data: records.map((record) => ({
        returnNumber: record.returnNumber,
        orderId: String(record.orderId),
        status: record.status,
        reason: record.reason,
        refundAmount: record.refundAmount,
        items: record.items.map((item: { sku?: string; nameSnapshot?: string; quantity: number }) => ({ sku: item.sku, name: item.nameSnapshot, quantity: item.quantity })),
        createdAt: record.createdAt
      }))
    });
  } catch (error) {
    return next(error);
  }
});