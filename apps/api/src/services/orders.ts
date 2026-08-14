import { Order } from "../models/Order.js";
import { Product } from "../models/Product.js";
import { ApiError } from "../middleware/error.js";
import { reserveStock, type StockLine } from "./inventory.js";
import { recordCouponUsage, validateCoupon } from "./coupons.js";

export const FREE_SHIPPING_THRESHOLD = 2499;
export const STANDARD_SHIPPING = 149;

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
  const now = Date.now().toString().slice(-6);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const suffix = Math.floor(100 + Math.random() * 900).toString();
    const candidate = `LEA${now}${suffix}`;
    const exists = await Order.exists({ orderNumber: candidate });
    if (!exists) return candidate;
  }
  throw new ApiError(500, "Could not allocate an order number");
}

export async function createOrder(input: CreateOrderInput) {
  const itemsById = new Map(input.items.map((item) => [item.variantId, item]));
  const products = await Product.find({ _id: { $in: input.items.map((item) => item.productId) }, active: true }).lean();

  const lines: StockLine[] = [];
  const orderLines = [];
  const lineCategories: string[] = [];

  for (const product of products) {
    for (const variant of product.variants ?? []) {
      const requested = itemsById.get(String(variant._id));
      if (!requested) continue;
      if (!variant.active) throw new ApiError(409, `${product.name} — this option is no longer available`);
      lines.push({ productId: String(product._id), variantId: String(variant._id), sku: variant.sku, quantity: requested.quantity });
      const unitPrice = variant.priceOverride ?? product.price;
      orderLines.push({
        productId: product._id,
        variantId: variant._id,
        sku: variant.sku,
        nameSnapshot: product.name,
        variantSnapshot: variant.label,
        quantity: requested.quantity,
        unitPrice,
        lineTotal: unitPrice * requested.quantity
      });
      lineCategories.push(product.category);
    }
  }

  if (orderLines.length === 0) throw new ApiError(400, "One or more cart items could not be found");

  const subtotal = orderLines.reduce((sum, line) => sum + line.lineTotal, 0);
  const shippingAmount = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : STANDARD_SHIPPING;

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

  const total = Math.max(0, subtotal + shippingAmount - discountAmount);

  await reserveStock(lines);

  const order = new Order({
    orderNumber: await nextOrderNumber(),
    customerId: input.customerId,
    email: input.email,
    lines: orderLines,
    subtotal,
    shippingAmount,
    discountAmount,
    coupon: discountAmount > 0 ? coupon : undefined,
    total,
    currency: "INR",
    orderStatus: input.paymentMethod === "cod" ? "confirmed" : "pending_payment",
    payment: {
      method: input.paymentMethod,
      status: input.paymentMethod === "cod" ? "cod_pending" : "pending"
    },
    shippingAddress: input.shippingAddress
  });

  pushTimeline(order, input.paymentMethod === "cod" ? "confirmed" : "placed", input.paymentMethod === "cod" ? "Order confirmed, payment due on delivery" : "Order placed, payment pending");
  await order.save();

  if (coupon.couponId) await recordCouponUsage(coupon.couponId);

  return order;
}

export function orderResponse(order: InstanceType<typeof Order>) {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    email: order.email,
    lines: order.lines.map((line: { productId: { toString(): string }; variantId: { toString(): string }; sku: string; nameSnapshot: string; variantSnapshot?: string; quantity: number; unitPrice: number; lineTotal: number }) => ({
      productId: String(line.productId),
      variantId: String(line.variantId),
      sku: line.sku,
      name: line.nameSnapshot,
      variantLabel: line.variantSnapshot,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.lineTotal
    })),
    subtotal: order.subtotal,
    shippingAmount: order.shippingAmount,
    discountAmount: order.discountAmount,
    coupon: order.coupon,
    total: order.total,
    currency: order.currency,
    orderStatus: order.orderStatus,
    paymentStatus: order.payment.status,
    paymentMethod: order.payment.method,
    shippingStatus: order.shipping.status,
    tracking: order.shipping.awb
      ? { awb: order.shipping.awb, courier: order.shipping.courier, trackingUrl: order.shipping.trackingUrl }
      : undefined,
    timeline: order.timeline.map((entry: { type: string; message?: string; at: Date }) => ({ type: entry.type, message: entry.message, at: entry.at })),
    createdAt: order.createdAt
  };
}