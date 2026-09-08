import { baseLayout, itemsTable, summaryTable, ctaButton, infoBox } from "./base-layout.js";

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
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:56px;height:56px;background:linear-gradient(135deg, #d4a843, #c4983a);border-radius:50%;margin:0 auto 16px;display:inline-block;line-height:56px;">
        <span style="font-size:24px;color:#fff;">&#10003;</span>
      </div>
      <h2 style="color:#3c2415;margin:0 0 8px;font-size:22px;font-weight:600;">Order Confirmed</h2>
      <p style="color:#8b7355;margin:0;font-size:14px;">Thank you for shopping with us, ${params.name}.</p>
    </div>

    <div style="background:#faf8f5;border:1px solid #f0e8dd;border-radius:10px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td>
            <p style="margin:0;color:#8b7355;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Order Number</p>
            <p style="margin:4px 0 0;color:#3c2415;font-size:16px;font-weight:600;">#${params.orderNumber}</p>
          </td>
          <td style="text-align:right;">
            <p style="margin:0;color:#8b7355;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Payment</p>
            <p style="margin:4px 0 0;color:#3c2415;font-size:13px;font-weight:500;">${params.paymentMethod === "cod" ? "Cash on Delivery" : "Online (Razorpay)"}</p>
          </td>
        </tr>
      </table>
    </div>

    ${itemsTable(params.items)}
    ${summaryTable([
      { label: "Subtotal", value: `\u20B9${params.subtotal.toLocaleString("en-IN")}` },
      { label: "Shipping", value: params.shipping === 0 ? "FREE" : `\u20B9${params.shipping.toLocaleString("en-IN")}` },
      { label: "GST", value: `\u20B9${params.gst.toLocaleString("en-IN")}` },
      ...(params.discount > 0 ? [{ label: "Discount", value: `-\u20B9${params.discount.toLocaleString("en-IN")}` }] : []),
      { label: "Total", value: `\u20B9${params.total.toLocaleString("en-IN")}`, bold: true }
    ])}

    ${infoBox("Shipping Address", params.address)}

    ${ctaButton(params.orderUrl, "View Order Details")}
  `;
  return baseLayout(content);
}
