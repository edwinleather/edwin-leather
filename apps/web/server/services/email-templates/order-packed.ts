import { baseLayout, ctaButton, infoBox } from "./base-layout.js";

export function orderPacked(params: {
  name: string;
  orderNumber: string;
  orderUrl: string;
}): string {
  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:56px;height:56px;background:linear-gradient(135deg, #d4a843, #c4983a);border-radius:50%;margin:0 auto 16px;display:inline-block;line-height:56px;">
        <span style="font-size:20px;color:#fff;">&#128230;</span>
      </div>
      <h2 style="color:#3c2415;margin:0 0 8px;font-size:22px;font-weight:600;">Order Packed</h2>
      <p style="color:#8b7355;margin:0;font-size:14px;">Hi ${params.name}, great news!</p>
    </div>

    ${infoBox("Order #" + params.orderNumber, "Your items have been carefully packed and are ready for dispatch. We'll notify you once it ships with tracking details.")}

    ${ctaButton(params.orderUrl, "View Order")}
  `;
  return baseLayout(content);
}
