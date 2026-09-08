import { baseLayout, ctaButton, warningBox } from "./base-layout.js";

export function returnRequested(params: {
  name: string;
  orderNumber: string;
  orderUrl: string;
}): string {
  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:56px;height:56px;background:linear-gradient(135deg, #ff9800, #f57c00);border-radius:50%;margin:0 auto 16px;display:inline-block;line-height:56px;">
        <span style="font-size:20px;color:#fff;">&#8634;</span>
      </div>
      <h2 style="color:#3c2415;margin:0 0 8px;font-size:22px;font-weight:600;">Return Request Received</h2>
      <p style="color:#8b7355;margin:0;font-size:14px;">Hi ${params.name}, we've received your return request.</p>
    </div>

    ${warningBox("Return in Progress", "Order #" + params.orderNumber + " — Our team will review your request and guide you through the return process.")}

    <p style="color:#6b5a48;font-size:14px;text-align:center;line-height:1.6;">You'll receive updates as your return is processed.</p>

    ${ctaButton(params.orderUrl, "View Order")}
  `;
  return baseLayout(content);
}
