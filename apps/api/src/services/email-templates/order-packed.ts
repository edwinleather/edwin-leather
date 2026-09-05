import { baseLayout, ctaButton } from "./base-layout.js";

export function orderPacked(params: {
  name: string;
  orderNumber: string;
  orderUrl: string;
}): string {
  const content = `
    <h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Your Order is Packed</h2>
    <p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi ${params.name}, great news!</p>

    <div style="background:#f5f0eb;padding:16px;border-radius:6px;margin-bottom:24px;border-left:4px solid #d4a843;">
      <p style="margin:0;color:#3c2415;font-size:14px;font-weight:bold;">Order #${params.orderNumber}</p>
      <p style="margin:4px 0 0;color:#8b7355;font-size:13px;">Your items have been carefully packed and are ready for dispatch.</p>
    </div>

    <p style="color:#8b7355;font-size:14px;">We'll send you tracking details once your order ships.</p>

    ${ctaButton(params.orderUrl, "View Order")}
  `;
  return baseLayout(content);
}
