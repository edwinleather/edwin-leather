import { baseLayout, ctaButton } from "./base-layout.js";

export function returnRequested(params: {
  name: string;
  orderNumber: string;
  orderUrl: string;
}): string {
  const content = `
    <h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Return Request Received</h2>
    <p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi ${params.name}, we've received your return request.</p>

    <div style="background:#fff3e0;padding:16px;border-radius:6px;margin-bottom:24px;border-left:4px solid #f57c00;">
      <p style="margin:0;color:#e65100;font-size:14px;font-weight:bold;">Return in Progress</p>
      <p style="margin:4px 0 0;color:#3c2415;font-size:13px;">Order #${params.orderNumber}</p>
      <p style="margin:4px 0 0;color:#8b7355;font-size:13px;">Our team will review your request and guide you through the return process.</p>
    </div>

    <p style="color:#8b7355;font-size:14px;">You'll receive updates as your return is processed.</p>

    ${ctaButton(params.orderUrl, "View Order")}
  `;
  return baseLayout(content);
}
