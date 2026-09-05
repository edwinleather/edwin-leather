import { baseLayout, ctaButton } from "./base-layout.js";

export function orderCancelled(params: {
  name: string;
  orderNumber: string;
  reason?: string;
  orderUrl: string;
}): string {
  const reasonBlock = params.reason
    ? `<p style="color:#8b7355;font-size:13px;margin:4px 0 0;"><strong>Reason:</strong> ${params.reason}</p>`
    : "";

  const content = `
    <h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Order Cancelled</h2>
    <p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi ${params.name}, your order has been cancelled.</p>

    <div style="background:#fde8e8;padding:16px;border-radius:6px;margin-bottom:24px;border-left:4px solid #d32f2f;">
      <p style="margin:0;color:#c62828;font-size:14px;font-weight:bold;">Cancelled</p>
      <p style="margin:4px 0 0;color:#3c2415;font-size:13px;"><strong>Order:</strong> #${params.orderNumber}</p>
      ${reasonBlock}
    </div>

    <p style="color:#8b7355;font-size:14px;">If a payment was made, a refund will be processed within 5-7 business days.</p>

    ${ctaButton(params.orderUrl, "View Order")}
  `;
  return baseLayout(content);
}
