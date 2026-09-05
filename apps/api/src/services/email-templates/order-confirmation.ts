import { baseLayout, itemsTable, summaryTable, ctaButton } from "./base-layout.js";

export function orderConfirmation(params: {
  name: string;
  orderNumber: string;
  items: { name: string; variant?: string; quantity: number; unitPrice: number; lineTotal: number }[];
  subtotal: number;
  shipping: number;
  gst: number;
  discount: number;
  total: number;
  address: string;
  orderUrl: string;
  paymentMethod: string;
}): string {
  const content = `
    <h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Order Confirmed!</h2>
    <p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi ${params.name}, we've received your order.</p>

    <div style="background:#f5f0eb;padding:16px;border-radius:6px;margin-bottom:24px;">
      <p style="margin:0;color:#3c2415;font-size:14px;"><strong>Order #${params.orderNumber}</strong></p>
      <p style="margin:4px 0 0;color:#8b7355;font-size:13px;">Payment: ${params.paymentMethod === "cod" ? "Cash on Delivery" : "Online (Razorpay)"}</p>
    </div>

    ${itemsTable(params.items)}
    ${summaryTable([
      { label: "Subtotal", value: `\u20B9${params.subtotal.toLocaleString("en-IN")}` },
      { label: "Shipping", value: params.shipping === 0 ? "FREE" : `\u20B9${params.shipping.toLocaleString("en-IN")}` },
      { label: "GST", value: `\u20B9${params.gst.toLocaleString("en-IN")}` },
      ...(params.discount > 0 ? [{ label: "Discount", value: `-\u20B9${params.discount.toLocaleString("en-IN")}` }] : []),
      { label: "Total", value: `\u20B9${params.total.toLocaleString("en-IN")}`, bold: true }
    ])}

    <div style="background:#f5f0eb;padding:16px;border-radius:6px;margin-top:16px;">
      <p style="margin:0 0 4px;color:#3c2415;font-size:13px;font-weight:bold;">Shipping Address</p>
      <p style="margin:0;color:#8b7355;font-size:13px;">${params.address}</p>
    </div>

    ${ctaButton(params.orderUrl, "View Order")}
  `;
  return baseLayout(content);
}
