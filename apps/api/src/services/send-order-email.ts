import type { Document } from "mongoose";
import { sendEmail } from "./email.js";
import { renderTemplate } from "./email-templates/render.js";
import { getTemplate } from "./email-templates/template-loader.js";
import { baseLayout, itemsTableWithImages, invoiceSection, type BaseLayoutOptions } from "./email-templates/base-layout.js";
import type { EmailTemplateKey } from "./email-templates/template-defaults.js";
import { Product } from "../models/Product.js";
import { SiteSetting } from "../models/SiteSetting.js";

type OrderLine = {
  productId: { toString(): string };
  variantId: { toString(): string };
  sku: string;
  nameSnapshot: string;
  variantSnapshot?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
};

type OrderDoc = Document & {
  orderNumber: string;
  email: string;
  lines: OrderLine[];
  subtotal: number;
  shippingAmount: number;
  gstAmount: number;
  gstRate: number;
  discountAmount: number;
  total: number;
  currency: string;
  payment: { method: string; status: string };
  shippingAddress?: { fullName?: string; line1?: string; line2?: string; city?: string; state?: string; postalCode?: string; phone?: string };
  shipping?: { courier?: string; trackingId?: string; trackingUrl?: string };
  createdAt?: Date;
  emailsSent?: Map<string, Date>;
};

function formatAddress(addr: OrderDoc["shippingAddress"]): string {
  if (!addr) return "";
  return [addr.fullName, addr.line1, addr.line2, `${addr.city}, ${addr.state} ${addr.postalCode}`].filter(Boolean).join(", ");
}

function orderUrl(orderNumber: string): string {
  const base = process.env.CLIENT_URL || "http://localhost:3000";
  return `${base}/account?order=${orderNumber}`;
}

function isDuplicate(order: OrderDoc, emailType: string): boolean {
  return order.emailsSent?.has(emailType) ?? false;
}

async function markSent(order: OrderDoc, emailType: string) {
  if (!order.emailsSent) order.set("emailsSent", new Map());
  order.emailsSent!.set(emailType, new Date());
  try {
    await order.save();
  } catch {
    // non-critical
  }
}

function formatInr(amount: number): string {
  return `\u20B9${amount.toLocaleString("en-IN")}`;
}

let layoutOptionsCache: { options: BaseLayoutOptions; expires: number } | null = null;
const LAYOUT_CACHE_TTL = 5 * 60 * 1000;

async function getLayoutOptions(): Promise<BaseLayoutOptions> {
  const now = Date.now();
  if (layoutOptionsCache && now < layoutOptionsCache.expires) return layoutOptionsCache.options;

  try {
    const doc = await SiteSetting.findOne({ key: "site" }).lean();
    const inv = (doc as Record<string, unknown>)?.invoice as Record<string, string> | undefined;
    const options: BaseLayoutOptions = {};
    if (inv?.email) options.email = inv.email;
    if (inv?.phone) options.phone = inv.phone;
    const addrParts = [inv?.address, inv?.city, inv?.state, inv?.postalCode].filter(Boolean);
    if (addrParts.length > 0) options.address = addrParts.join(", ");
    layoutOptionsCache = { options, expires: now + LAYOUT_CACHE_TTL };
    return options;
  } catch {
    return {};
  }
}

async function buildItemsHtmlWithImages(lines: OrderLine[]): Promise<string> {
  const productIds = [...new Set(lines.map((l) => String(l.productId)))];
  const products = await Product.find({ _id: { $in: productIds } }).select("name images").lean();
  const imageByProduct = new Map(products.map((p) => [String(p._id), p.images?.[0]?.url]));

  const rows = lines.map((l) => ({
    name: l.nameSnapshot,
    variant: l.variantSnapshot,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
    lineTotal: l.lineTotal,
    imageUrl: imageByProduct.get(String(l.productId))
  }));

  return itemsTableWithImages(rows);
}

async function buildInvoiceHtml(order: OrderDoc): Promise<string> {
  const productIds = [...new Set(order.lines.map((l) => String(l.productId)))];
  const products = await Product.find({ _id: { $in: productIds } }).select("name hsn brand").lean();
  const productById = new Map(products.map((p) => [String(p._id), p]));

  const settings = await SiteSetting.findOne({ key: "invoice" }).lean();
  const inv = settings?.invoice ?? {};

  const items = order.lines.map((line) => {
    const product = productById.get(String(line.productId));
    return {
      name: line.nameSnapshot,
      hsn: product?.hsn || "",
      qty: line.quantity,
      rate: line.unitPrice,
      amount: line.lineTotal
    };
  });

  const addr = order.shippingAddress;
  const buyerAddress = addr ? [addr.line1, addr.line2, `${addr.city}, ${addr.state} ${addr.postalCode}`].filter(Boolean).join(", ") : "";

  return invoiceSection({
    orderNumber: order.orderNumber,
    date: order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : new Date().toLocaleDateString("en-IN"),
    sellerName: inv.companyName || "Edwin Leathers",
    sellerAddress: [inv.address, inv.city, inv.state, inv.postalCode].filter(Boolean).join(", "),
    sellerGstin: inv.gstin,
    buyerName: addr?.fullName || "Customer",
    buyerAddress,
    items,
    subtotal: order.subtotal,
    gstRate: order.gstRate || 18,
    gstAmount: order.gstAmount,
    shipping: order.shippingAmount,
    total: order.total
  });
}

function buildPlainItemsHtml(lines: OrderLine[]): string {
  const rows = lines
    .map(
      (l) => `<tr><td style="padding:8px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;">${l.nameSnapshot}${l.variantSnapshot ? ` (${l.variantSnapshot})` : ""} <span style="color:#8b7355;">&times; ${l.quantity}</span></td><td style="padding:8px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;text-align:right;">${formatInr(l.lineTotal)}</td></tr>`
    )
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;"><tr style="border-bottom:2px solid #3c2415;"><td style="padding:8px 0;color:#3c2415;font-weight:bold;font-size:13px;">Item</td><td style="padding:8px 0;color:#3c2415;font-weight:bold;font-size:13px;text-align:right;">Price</td></tr>${rows}</table>`;
}

async function buildAndSend(params: {
  key: EmailTemplateKey;
  to: string;
  subject: string;
  orderId?: string;
  vars: Record<string, string | number | undefined>;
  order?: OrderDoc;
  dedupKey: string;
}) {
  if (params.order && isDuplicate(params.order, params.dedupKey)) {
    if (process.env.NODE_ENV !== "production") console.debug(`[email] Skipping duplicate ${params.dedupKey} for #${params.order.orderNumber}`);
    return;
  }

  const raw = await getTemplate(params.key);
  const inner = renderTemplate(raw, params.vars);
  const layoutOpts = await getLayoutOptions();
  const html = baseLayout(inner, layoutOpts);

  const sent = await sendEmail({
    to: params.to,
    subject: params.subject,
    html,
    template: params.key,
    orderId: params.orderId
  });

  if (sent && params.order) await markSent(params.order, params.dedupKey);
}

export async function sendOrderConfirmationEmail(order: OrderDoc) {
  const [itemsHtml, invoiceHtml] = await Promise.all([
    buildItemsHtmlWithImages(order.lines),
    buildInvoiceHtml(order)
  ]);

  await buildAndSend({
    key: "order_confirmation",
    to: order.email,
    subject: `Order #${order.orderNumber} Confirmed | Edwin Leathers`,
    orderId: String(order._id),
    dedupKey: "order_confirmation",
    order,
    vars: {
      name: order.shippingAddress?.fullName || "Customer",
      orderNumber: order.orderNumber,
      paymentMethod: order.payment.method === "cod" ? "Cash on Delivery" : "Online (Razorpay)",
      itemsHtml,
      invoiceHtml,
      subtotal: formatInr(order.subtotal),
      shipping: order.shippingAmount === 0 ? "FREE" : formatInr(order.shippingAmount),
      gst: formatInr(order.gstAmount),
      discount: order.discountAmount > 0 ? `-${formatInr(order.discountAmount)}` : "",
      total: formatInr(order.total),
      address: formatAddress(order.shippingAddress),
      orderUrl: orderUrl(order.orderNumber)
    }
  });
}

export async function sendPaymentReceivedEmail(order: OrderDoc) {
  await buildAndSend({
    key: "payment_received",
    to: order.email,
    subject: `Payment Confirmed | Order #${order.orderNumber} | Edwin Leathers`,
    orderId: String(order._id),
    dedupKey: "payment_received",
    order,
    vars: {
      name: order.shippingAddress?.fullName || "Customer",
      orderNumber: order.orderNumber,
      amount: formatInr(order.total),
      paymentMethod: order.payment.method === "razorpay" ? "Razorpay" : "Cash on Delivery",
      orderUrl: orderUrl(order.orderNumber)
    }
  });
}

export async function sendOrderPackedEmail(order: OrderDoc) {
  await buildAndSend({
    key: "order_packed",
    to: order.email,
    subject: `Order #${order.orderNumber} Packed | Edwin Leathers`,
    orderId: String(order._id),
    dedupKey: "order_packed",
    order,
    vars: {
      name: order.shippingAddress?.fullName || "Customer",
      orderNumber: order.orderNumber,
      orderUrl: orderUrl(order.orderNumber)
    }
  });
}

export async function sendOrderShippedEmail(order: OrderDoc) {
  await buildAndSend({
    key: "order_shipped",
    to: order.email,
    subject: `Order #${order.orderNumber} Shipped | Edwin Leathers`,
    orderId: String(order._id),
    dedupKey: "order_shipped",
    order,
    vars: {
      name: order.shippingAddress?.fullName || "Customer",
      orderNumber: order.orderNumber,
      courier: order.shipping?.courier || "Our Delivery Partner",
      trackingId: order.shipping?.trackingId || "N/A",
      trackingUrl: order.shipping?.trackingUrl,
      orderUrl: orderUrl(order.orderNumber)
    }
  });
}

export async function sendOrderDeliveredEmail(order: OrderDoc) {
  const base = process.env.CLIENT_URL || "http://localhost:3000";
  await buildAndSend({
    key: "order_delivered",
    to: order.email,
    subject: `Order #${order.orderNumber} Delivered | Edwin Leathers`,
    orderId: String(order._id),
    dedupKey: "order_delivered",
    order,
    vars: {
      name: order.shippingAddress?.fullName || "Customer",
      orderNumber: order.orderNumber,
      orderUrl: orderUrl(order.orderNumber),
      feedbackUrl: `${base}/feedback`
    }
  });
}

export async function sendOrderCancelledEmail(order: OrderDoc, reason?: string) {
  await buildAndSend({
    key: "order_cancelled",
    to: order.email,
    subject: `Order #${order.orderNumber} Cancelled | Edwin Leathers`,
    orderId: String(order._id),
    dedupKey: "order_cancelled",
    order,
    vars: {
      name: order.shippingAddress?.fullName || "Customer",
      orderNumber: order.orderNumber,
      reason: reason || "",
      orderUrl: orderUrl(order.orderNumber)
    }
  });
}

export async function sendReturnRequestedEmail(order: OrderDoc) {
  await buildAndSend({
    key: "return_requested",
    to: order.email,
    subject: `Return Requested | Order #${order.orderNumber} | Edwin Leathers`,
    orderId: String(order._id),
    dedupKey: "return_requested",
    order,
    vars: {
      name: order.shippingAddress?.fullName || "Customer",
      orderNumber: order.orderNumber,
      orderUrl: orderUrl(order.orderNumber)
    }
  });
}
