import { baseLayout, ctaButton, successBox } from "./base-layout.js";

export function orderDelivered(params: {
  name: string;
  orderNumber: string;
  orderUrl: string;
}): string {
  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:56px;height:56px;background:linear-gradient(135deg, #4caf50, #43a047);border-radius:50%;margin:0 auto 16px;display:inline-block;line-height:56px;">
        <span style="font-size:24px;color:#fff;">&#10003;</span>
      </div>
      <h2 style="color:#3c2415;margin:0 0 8px;font-size:22px;font-weight:600;">Order Delivered</h2>
      <p style="color:#8b7355;margin:0;font-size:14px;">Hi ${params.name}, your order has been delivered successfully.</p>
    </div>

    ${successBox("Delivered", "Order #" + params.orderNumber + " has been delivered.")}

    <p style="color:#6b5a48;font-size:14px;text-align:center;line-height:1.6;margin-bottom:8px;">We hope you love your new leather goods!</p>
    <p style="color:#8b7355;font-size:13px;text-align:center;line-height:1.6;">Your feedback helps us serve you better. Would you like to share your experience?</p>

    ${ctaButton(params.orderUrl, "View Order")}
  `;
  return baseLayout(content);
}
