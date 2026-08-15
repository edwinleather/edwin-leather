import { env } from "../config/env.js";

export function inr(amount: number): string {
  return `₹${Number(amount || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

type Order = {
  orderNumber: string;
  email: string;
  subtotal: number;
  shippingAmount: number;
  discountAmount: number;
  total: number;
  currency: string;
  orderStatus: string;
  lines: { nameSnapshot: string; variantSnapshot?: string; quantity: number; unitPrice: number }[];
  shippingAddress?: { fullName?: string; line1?: string; line2?: string; city?: string; state?: string; postalCode?: string; phone?: string };
  shipping?: { trackingId?: string; courier?: string; trackingUrl?: string; deliveryPartnerName?: string };
  timeline?: { type: string; message?: string }[];
};

export async function sendEmail(input: { to: string; subject: string; html: string; text: string }): Promise<boolean> {
  if (!env.emailApiKey) {
    console.info(`[email] No EMAIL_API_KEY configured. Would email "${input.subject}" to ${input.to}`);
    return false;
  }
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.emailApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: env.emailFrom, to: [input.to], subject: input.subject, text: input.text, html: input.html })
    });
    if (!response.ok) {
      console.warn(`[email] Send failed (${response.status}) for "${input.subject}" to ${input.to}`);
      return false;
    }
    return true;
  } catch (error) {
    console.warn(`[email] Send error for "${input.subject}" to ${input.to}`, error);
    return false;
  }
}

function layout(title: string, body: string): string {
  return `
  <div style="font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f4f1ec;padding:24px;color:#2b241e">
    <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
      <div style="background:#2b241e;color:#f6f1e9;padding:24px 28px">
        <div style="font-size:20px;font-weight:800;letter-spacing:.02em">EDWIN <span style="font-family:Georgia,serif;font-style:italic;font-weight:500">Leathers</span></div>
        <div style="margin-top:4px;font-size:12px;letter-spacing:.2em;color:#cfc4b8">${title.toUpperCase()}</div>
      </div>
      <div style="padding:28px">${body}</div>
      <div style="padding:18px 28px;border-top:1px solid #ece5dc;color:#8a7f73;font-size:11px">
        Edwin Leathers · Made for a long life.<br>Questions? Reply to this email and we'll get back to you.
      </div>
    </div>
  </div>`;
}

function orderRows(order: Order): string {
  return order.lines
    .map(
      (line) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0eae1;font-size:13px">
          ${line.nameSnapshot}${line.variantSnapshot ? `<span style="color:#8a7f73"> · ${line.variantSnapshot}</span>` : ""}
          <div style="color:#8a7f73;font-size:11px">Qty ${line.quantity} × ${inr(line.unitPrice)}</div>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f0eae1;font-size:13px;text-align:right;white-space:nowrap">${inr(line.quantity * line.unitPrice)}</td>
      </tr>`
    )
    .join("");
}

function totalsHtml(order: Order): string {
  return `
  <table style="width:100%;font-size:13px;margin-top:12px">
    <tr><td style="padding:5px 0;color:#8a7f73">Subtotal</td><td style="text-align:right">${inr(order.subtotal)}</td></tr>
    <tr><td style="padding:5px 0;color:#8a7f73">Shipping</td><td style="text-align:right">${order.shippingAmount ? inr(order.shippingAmount) : "Free"}</td></tr>
    ${order.discountAmount > 0 ? `<tr><td style="padding:5px 0;color:#8a7f73">Discount</td><td style="text-align:right">− ${inr(order.discountAmount)}</td></tr>` : ""}
    <tr><td style="padding:9px 0;border-top:1px solid #ece5dc;font-weight:700">Total</td><td style="text-align:right;font-weight:700">${inr(order.total)}</td></tr>
  </table>`;
}

function addressHtml(order: Order): string {
  const a = order.shippingAddress;
  if (!a) return "";
  return `
  <div style="margin-top:18px;border:1px solid #ece5dc;border-radius:8px;padding:14px;font-size:12px;color:#4a4138">
    <div style="font-weight:700;margin-bottom:6px">Deliver to</div>
    ${a.fullName ? `${a.fullName}<br>` : ""}${a.line1 ?? ""}${a.line2 ? `, ${a.line2}` : ""}<br>${a.city ?? ""}, ${a.state ?? ""} ${a.postalCode ?? ""}${a.phone ? `<br>${a.phone}` : ""}
  </div>`;
}

function trackingHtml(order: Order): string {
  const t = order.shipping;
  if (!t?.trackingId) return "";
  const courier = t.deliveryPartnerName || t.courier;
  const link = t.trackingUrl ? `<a href="${t.trackingUrl}" style="color:#2b241e;font-weight:600">Track your shipment →</a>` : "";
  return `
  <div style="margin-top:18px;border:1px solid #ece5dc;border-radius:8px;padding:14px;font-size:12px;color:#4a4138">
    <div style="font-weight:700;margin-bottom:6px">Tracking</div>
    AWB ${t.trackingId}${courier ? ` · ${courier}` : ""}${link ? `<br>${link}` : ""}
  </div>`;
}

function orderEmail(order: Order, headline: string, note: string, showTracking: boolean): string {
  return layout(
    `Order ${order.orderNumber}`,
    `
    <div style="font-size:17px;font-weight:700;margin:0 0 6px">${headline}</div>
    <div style="font-size:13px;color:#6b5f53;margin-bottom:16px">${note}</div>
    <table style="width:100%;border-collapse:collapse">${orderRows(order)}</table>
    ${totalsHtml(order)}
    ${addressHtml(order)}
    ${showTracking ? trackingHtml(order) : ""}
    <div style="margin-top:22px;font-size:12px;color:#8a7f73">Order number: <strong style="color:#2b241e">${order.orderNumber}</strong></div>
    `
  );
}

export type OrderEmailKind = "placed" | "paid" | "shipped" | "refunded" | "cancelled";

export async function sendOrderEmail(order: Order, kind: OrderEmailKind): Promise<boolean> {
  const configs: Record<OrderEmailKind, { subject: string; headline: string; note: string; tracking: boolean }> = {
    placed: {
      subject: `Order ${order.orderNumber} received — Edwin Leathers`,
      headline: "Your order is in.",
      note: `Thanks for ordering with Edwin Leathers. ${order.orderStatus === "order_received" ? "We've reserved your pieces and will begin preparing them." : "Once payment is confirmed, we'll start preparing your order."}`,
      tracking: false
    },
    paid: {
      subject: `Payment received for ${order.orderNumber} — Edwin Leathers`,
      headline: "Payment received.",
      note: "Your payment went through. We've confirmed your order and are preparing it now.",
      tracking: false
    },
    shipped: {
      subject: `Your Edwin Leathers order ${order.orderNumber} has shipped`,
      headline: "On its way.",
      note: "Your order has been shipped. Your tracking details are below.",
      tracking: true
    },
    refunded: {
      subject: `Refund for order ${order.orderNumber} — Edwin Leathers`,
      headline: "Refund initiated.",
      note: "We've initiated your refund. It may take a few business days to reflect in your account.",
      tracking: false
    },
    cancelled: {
      subject: `Order ${order.orderNumber} cancelled — Edwin Leathers`,
      headline: "Order cancelled.",
      note: "Your order has been cancelled as requested. Any eligible refund will be processed shortly.",
      tracking: false
    }
  };
  const config = configs[kind];
  return sendEmail({
    to: order.email,
    subject: config.subject,
    text: `${config.headline}\n${config.note}\n\nOrder ${order.orderNumber}\nTotal ${inr(order.total)}`,
    html: orderEmail(order, config.headline, config.note, config.tracking)
  });
}