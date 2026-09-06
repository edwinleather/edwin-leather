import { baseLayout, ctaButton, errorBox } from "./base-layout.js";

export function orderCancelled(params: {
  name: string;
  orderNumber: string;
  reason?: string;
  orderUrl: string;
}): string {
  const reasonContent = params.reason
    ? `Order #${params.orderNumber} has been cancelled.<br/><strong>Reason:</strong> ${params.reason}`
    : `Order #${params.orderNumber} has been cancelled.`;

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:56px;height:56px;background:linear-gradient(135deg, #d32f2f, #c62828);border-radius:50%;margin:0 auto 16px;display:inline-block;line-height:56px;">
        <span style="font-size:24px;color:#fff;">&#10005;</span>
      </div>
      <h2 style="color:#3c2415;margin:0 0 8px;font-size:22px;font-weight:600;">Order Cancelled</h2>
      <p style="color:#8b7355;margin:0;font-size:14px;">Hi ${params.name}, your order has been cancelled.</p>
    </div>

    ${errorBox("Cancelled", reasonContent)}

    <p style="color:#6b5a48;font-size:14px;text-align:center;line-height:1.6;">If a payment was made, a refund will be processed within <strong>5-7 business days</strong>.</p>

    ${ctaButton(params.orderUrl, "View Order")}
  `;
  return baseLayout(content);
}
