import { baseLayout, ctaButton } from "./base-layout.js";

export function orderShipped(params: {
  name: string;
  orderNumber: string;
  courier: string;
  trackingId: string;
  trackingUrl?: string;
  orderUrl: string;
}): string {
  const trackingLink = params.trackingUrl
    ? `<a href="${params.trackingUrl}" style="color:#3c2415;text-decoration:underline;">Track on ${params.courier}</a>`
    : params.trackingId;

  const content = `
    <h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Your Order is on its Way!</h2>
    <p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi ${params.name}, your order has been shipped.</p>

    <div style="background:#e8f0fe;padding:16px;border-radius:6px;margin-bottom:24px;border-left:4px solid #1976d2;">
      <p style="margin:0;color:#1565c0;font-size:14px;font-weight:bold;">&#128666; Shipped</p>
      <p style="margin:4px 0 0;color:#3c2415;font-size:13px;"><strong>Order:</strong> #${params.orderNumber}</p>
      <p style="margin:4px 0 0;color:#3c2415;font-size:13px;"><strong>Courier:</strong> ${params.courier}</p>
      <p style="margin:4px 0 0;color:#3c2415;font-size:13px;"><strong>Tracking ID:</strong> ${trackingLink}</p>
    </div>

    <p style="color:#8b7355;font-size:14px;">Estimated delivery within 3-7 business days.</p>

    ${ctaButton(params.orderUrl, "View Order")}
  `;
  return baseLayout(content);
}
