import { Router } from "express";
import { z } from "zod";
import { ensureDatabase } from "../config/db.js";
import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { ProductVariant } from "../models/ProductVariant.js";
import { User } from "../models/User.js";
import { ApiError } from "../middleware/error.js";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth.js";
import { createOrder, orderResponse } from "../services/orders.js";
import { resolveVariantById } from "../services/variants.js";
import { validateCoupon } from "../services/coupons.js";
import { computeDeliveryFee, getDeliveryConfig } from "../services/delivery.js";
import { sendOrderConfirmationEmail } from "../services/send-order-email.js";

export const ordersRouter = Router();

const orderIntentSchema = z.object({
  email: z.string().email(),
  paymentMethod: z.enum(["razorpay", "cod"]),
  items: z.array(z.object({ productId: z.string().min(1), variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1).max(50),
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
  items: z.array(z.object({ productId: z.string().min(1), variantId: z.string().min(1), quantity: z.number().int().min(1).max(20) })).min(1).max(50)
});

ordersRouter.post("/", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = orderIntentSchema.parse(req.body);

    if (!(await ensureDatabase())) return next(new ApiError(503, "Order service unavailable. Configure MONGODB_URI."));

    const customer = await User.findById(req.auth!.sub).select("emailVerifiedAt role").lean();
    if (!customer?.emailVerifiedAt && customer?.role === "customer") {
      return next(new ApiError(403, "Please verify your email before placing an order.", { code: "EMAIL_NOT_VERIFIED" }));
    }

    // Limit COD: max 3 pending COD orders per customer
    if (input.paymentMethod === "cod") {
      const pendingCodCount = await Order.countDocuments({
        customerId: req.auth!.sub,
        "payment.method": "cod",
        "payment.status": "cod_pending",
        orderStatus: { $in: ["order_received"] }
      });
      if (pendingCodCount >= 3) {
        return next(new ApiError(400, "You have too many pending Cash on Delivery orders. Please complete or cancel existing COD orders before placing a new one.", { code: "COD_LIMIT_REACHED" }));
      }
    }

    const uniqueIds = [...new Set(input.items.map((item) => item.productId))];
    const found = await Product.countDocuments({ _id: { $in: uniqueIds }, active: true });
    if (found < uniqueIds.length) {
      return next(new ApiError(400, "One or more products in your cart are no longer available."));
    }

    const { order, removedItems } = await createOrder({ ...input, customerId: String(req.auth!.sub) });

    // Send confirmation email immediately for COD; for online payments,
    // the email is sent after payment is verified (in payments/verify or webhook).
    if (input.paymentMethod === "cod") {
      sendOrderConfirmationEmail(order).catch(() => {});
    }

    return res.status(201).json({ ok: true, order: orderResponse(order), removedItems });
  } catch (error) {
    if (error instanceof z.ZodError) return next(new ApiError(400, "Invalid order input", error.flatten()));
    return next(error);
  }
});

// Let checkout validate a coupon against the real cart before the order is placed.
ordersRouter.post("/validate-coupon", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const input = couponValidateSchema.parse(req.body);
    if (!(await ensureDatabase())) return next(new ApiError(503, "Order service unavailable. Configure MONGODB_URI."));

    const itemsById = new Map(input.items.map((item) => [item.variantId, item]));
    const products = await Product.find({ _id: { $in: input.items.map((item) => item.productId) }, active: true }).lean();
    const productVariants = await ProductVariant.find({ productId: { $in: input.items.map((item) => item.productId) } })
      .populate("attributes.attributeId")
      .lean();
    const pvByProduct = new Map<string, typeof productVariants>();
    for (const pv of productVariants) {
      const pid = String(pv.productId);
      const list = pvByProduct.get(pid) ?? [];
      list.push(pv);
      pvByProduct.set(pid, list);
    }

    const orderLines: { productId: string; category: string; quantity: number; unitPrice: number }[] = [];
    for (const product of products) {
      for (const item of input.items) {
        if (String(item.productId) !== String(product._id)) continue;
        const resolved = resolveVariantById(product, pvByProduct.get(String(product._id)) ?? [], item.variantId);
        if (!resolved) continue;
        orderLines.push({
          productId: String(product._id),
          category: product.category,
          quantity: item.quantity,
          unitPrice: resolved.price
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