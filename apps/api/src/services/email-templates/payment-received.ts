import { baseLayout, ctaButton } from "./base-layout.js";

export function paymentReceived(params: {
  name: string;
  orderNumber: string;
  amount: number;
  paymentMethod: string;
  orderUrl: string;
}): string {
  const content = `
    <h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Payment Received</h2>
    <p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi ${params.name}, your payment has been confirmed.</p>

    <div style="background:#f0f7e6;padding:16px;border-radius:6px;margin-bottom:24px;border-left:4px solid #4caf50;">
      <p style="margin:0;color:#2e7d32;font-size:14px;font-weight:bold;">&#10003; Payment Successful</p>
      <p style="margin:4px 0 0;color:#558b2f;font-size:13px;">Amount: \u20B9${params.amount.toLocaleString("en-IN")} via ${params.paymentMethod === "razorpay" ? "Razorpay" : "Cash on Delivery"}</p>
    </div>

    <p style="color:#8b7355;font-size:14px;">Your order <strong>#${params.orderNumber}</strong> is now being processed.</p>

    ${ctaButton(params.orderUrl, "View Order")}
  `;
  return baseLayout(content);
}
