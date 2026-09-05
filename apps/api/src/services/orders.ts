import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { ProductVariant } from "../models/ProductVariant.js";
import { SiteSetting } from "../models/SiteSetting.js";
import { Types } from "mongoose";
import { ApiError } from "../middleware/error.js";
import { reserveStock, releaseStock, type StockLine } from "./inventory.js";
import { resolveVariantById } from "./variants.js";
import { recordCouponUsage, validateCoupon } from "./coupons.js";
import { computeDeliveryFee, getDeliveryConfig } from "./delivery.js";
import { computeGst, getTaxConfig } from "./tax.js";
import { getCodConfig } from "./cod.js";
import { getActivePromotions, resolvePromotedPrice } from "./pricing.js";

export type OrderLineInput = { productId: string; variantId: string; quantity: number };

export type CreateOrderInput = {
  email: string;
  paymentMethod: "razorpay" | "cod";
  items: OrderLineInput[];
  shippingAddress: {
    fullName: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
  };
  couponCode?: string;
  customerId?: string;
};

function pushTimeline(order: InstanceType<typeof Order>, type: string, message: string, actorId?: string) {
  order.timeline.push({ type, message, at: new Date(), actorId: actorId as never });
}

async function nextOrderNumber() {
  const setting = await SiteSetting.findOne({ key: "invoice" }).lean();
  const prefix = (setting?.invoice?.orderPrefix || "LEA").trim().toUpperCase();
  const now = Date.now().toString().slice(-6);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    const candidate = `${prefix}${now}${suffix}`;
    const exists = await Order.exists({ orderNumber: candidate });
    if (!exists) return candidate;
  }
  throw new ApiError(500, "Could not allocate an order number");
}

export async function createOrder(input: CreateOrderInput) {
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

  // Cash on Delivery is only allowed when globally enabled AND every product in
  // the cart allows COD. If global COD is off, per-product settings are ignored.
  if (input.paymentMethod === "cod") {
    const codConfig = await getCodConfig();
    if (!codConfig.enabled) throw new ApiError(400, "Cash on Delivery is currently unavailable. Please pay online.");
    const codBlocked = input.items.some((item) => {
      const product = products.find((p) => String(p._id) === item.productId);
      return product ? product.codAvailable === false : true;
    });
    if (codBlocked) throw new ApiError(400, "One or more items in your cart do not support Cash on Delivery. Please pay online.");
  }

  const lines: StockLine[] = [];
  const orderLines = [];
  const lineCategories: string[] = [];
  const removedItems: { variantId: string; name: string; variantLabel?: string; reason: string }[] = [];
  const promotions = await getActivePromotions();

  for (const item of input.items) {
    const product = products.find((p) => String(p._id) === item.productId);
    if (!product) {
      removedItems.push({ variantId: item.variantId, name: "Unknown product", reason: "product_not_found" });
      continue;
    }
    const resolved = resolveVariantById(product, pvByProduct.get(String(product._id)) ?? [], item.variantId);
    if (!resolved) {
      removedItems.push({ variantId: item.variantId, name: product.name, reason: "variant_not_found" });
      continue;
    }
    if (!resolved.active) throw new ApiError(409, `${product.name} - this option is no longer available`);
    // Exclude out-of-stock variants (unless on backorder) instead of failing
    // the whole order, so the remaining items can still be purchased.
    if (resolved.stock <= 0 && !resolved.allowBackorder) {
      removedItems.push({ variantId: resolved.variantId, name: product.name, variantLabel: resolved.label, reason: "out_of_stock" });
      continue;
    }
    // If less is in stock than requested, order only what is available. This
    // avoids failing the whole order on a partial-stock conflict; the client
    // surfaces the adjustment to the shopper.
    const quantity = resolved.allowBackorder
      ? item.quantity
      : Math.min(item.quantity, Math.max(0, resolved.stock));
    if (quantity < item.quantity) {
      removedItems.push({ variantId: resolved.variantId, name: product.name, variantLabel: resolved.label, reason: "quantity_adjusted" });
    }
    lines.push({ productId: String(product._id), variantId: resolved.variantId, sku: resolved.sku, quantity });
    const priced = resolvePromotedPrice(
      resolved.basePrice,
      {
        salePrice: resolved.salePrice,
        compareAtPrice: resolved.compareAtPrice,
        productId: String(product._id),
        category: product.category
      },
      promotions
    );
    const unitPrice = priced.price;
    const originalUnitPrice = resolved.price;
    const lineDiscount = Math.max(0, originalUnitPrice - unitPrice);
    orderLines.push({
      productId: product._id,
      variantId: new Types.ObjectId(resolved.variantId) as never,
      sku: resolved.sku,
      nameSnapshot: product.name,
      variantSnapshot: resolved.label,
      quantity,
      unitPrice,
      originalUnitPrice,
      lineDiscount,
      lineTotal: unitPrice * quantity,
      promotion: priced.promotion ? { name: priced.promotion.name, amount: priced.promotion.amount } : undefined
    });
    lineCategories.push(product.category);
  }

  if (orderLines.length === 0) throw new ApiError(400, "One or more cart items could not be found");

  const subtotal = orderLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const promotionDiscount = orderLines.reduce((sum, line) => sum + (line.lineDiscount ?? 0) * line.quantity, 0);
  const deliveryConfig = await getDeliveryConfig();
  const shippingAmount = computeDeliveryFee(deliveryConfig, subtotal, input.shippingAddress.state);
  const taxConfig = await getTaxConfig();
  const gstAmount = computeGst(taxConfig, subtotal);

  let discountAmount = 0;
  let coupon: { couponId?: string; code?: string; discountType?: string } = {};

  if (input.couponCode) {
    const result = await validateCoupon(
      input.couponCode,
      orderLines.map((line, index) => ({ productId: line.productId, category: lineCategories[index], quantity: line.quantity, unitPrice: line.unitPrice })),
      input.email,
      shippingAmount
    );
    discountAmount = result.discountAmount;
    coupon = { couponId: result.couponId, code: result.code, discountType: result.discountType };
  }

  const total = Math.max(0, subtotal + gstAmount + shippingAmount - discountAmount);

  await reserveStock(lines);

  let order: InstanceType<typeof Order>;
  try {
    order = new Order({
      orderNumber: await nextOrderNumber(),
      customerId: input.customerId,
      email: input.email,
      lines: orderLines,
      subtotal,
      shippingAmount,
      gstAmount,
      gstRate: taxConfig.gstRate,
      discountAmount,
      promotionDiscount,
      coupon: discountAmount > 0 ? coupon : undefined,
      total,
      currency: "INR",
      orderStatus: input.paymentMethod === "cod" ? "order_received" : "pending_payment",
      payment: {
        method: input.paymentMethod,
        status: input.paymentMethod === "cod" ? "cod_pending" : "pending"
      },
      shippingAddress: input.shippingAddress
    });

    pushTimeline(order, input.paymentMethod === "cod" ? "order_received" : "placed", input.paymentMethod === "cod" ? "Order received, payment due on delivery" : "Order placed, payment pending");
    await order.save();
  } catch (err) {
    await releaseStock(lines);
    throw err;
  }

  return { order, removedItems };
}

export function orderResponse(order: InstanceType<typeof Order>) {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    email: order.email,
    lines: order.lines.map((line: { productId: { toString(): string }; variantId: { toString(): string }; sku: string; nameSnapshot: string; variantSnapshot?: string; quantity: number; unitPrice: number; originalUnitPrice?: number; lineDiscount?: number; promotion?: { name?: string; amount?: number } | null; lineTotal: number }) => ({
      productId: String(line.productId),
      variantId: String(line.variantId),
      sku: line.sku,
      name: line.nameSnapshot,
      variantLabel: line.variantSnapshot,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      originalUnitPrice: line.originalUnitPrice ?? line.unitPrice,
      lineDiscount: line.lineDiscount ?? 0,
      promotion: line.promotion ?? null,
      lineTotal: line.lineTotal
    })),
    subtotal: order.subtotal,
    shippingAmount: order.shippingAmount,
    gstAmount: order.gstAmount,
    discountAmount: order.discountAmount,
    promotionDiscount: order.promotionDiscount ?? 0,
    coupon: order.coupon,
    total: order.total,
    currency: order.currency,
    orderStatus: order.orderStatus,
    paymentStatus: order.payment.status,
    paymentMethod: order.payment.method,
    shippingStatus: order.shipping.status,
    tracking: order.shipping.trackingId
      ? {
          awb: order.shipping.awb,
          trackingId: order.shipping.trackingId,
          courier: order.shipping.deliveryPartnerName || order.shipping.courier,
          deliveryPartnerName: order.shipping.deliveryPartnerName,
          trackingUrl: order.shipping.trackingUrl
        }
      : undefined,
    timeline: order.timeline.map((entry: { type: string; message?: string; at: Date }) => ({ type: entry.type, message: entry.message, at: entry.at })),
    createdAt: order.createdAt
  };
}