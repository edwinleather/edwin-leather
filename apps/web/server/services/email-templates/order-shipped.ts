import { baseLayout, ctaButton } from "./base-layout.js";

export function orderShipped(params: {
  name: string;
  orderNumber: string;
  courier: string;
  trackingId: string;
  trackingUrl?: string;
  orderUrl: string;
}): string {
  const trackButton = params.trackingUrl
    ? `<a href="${params.trackingUrl}" style="display:inline-block;background-color:#1976d2;color:#ffffff;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;margin-top:12px;">Track Shipment</a>`
    : "";

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="width:56px;height:56px;background:linear-gradient(135deg, #1976d2, #1565c0);border-radius:50%;margin:0 auto 16px;display:inline-block;line-height:56px;">
        <span style="font-size:20px;color:#fff;">&#128666;</span>
      </div>
      <h2 style="color:#3c2415;margin:0 0 8px;font-size:22px;font-weight:600;">Order Shipped</h2>
      <p style="color:#8b7355;margin:0;font-size:14px;">Hi ${params.name}, your order is on its way!</p>
    </div>

    <div style="background:#e8f4fd;border:1px solid #bbdefb;border-radius:10px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:6px 0;">
            <p style="margin:0;color:#8b7355;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Order</p>
            <p style="margin:2px 0 0;color:#3c2415;font-size:14px;font-weight:500;">#${params.orderNumber}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;">
            <p style="margin:0;color:#8b7355;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Courier</p>
            <p style="margin:2px 0 0;color:#3c2415;font-size:14px;font-weight:500;">${params.courier}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0;">
            <p style="margin:0;color:#8b7355;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Tracking ID</p>
            <p style="margin:2px 0 0;color:#3c2415;font-size:14px;font-weight:500;">${params.trackingId}</p>
          </td>
        </tr>
        ${trackButton ? `<tr><td style="padding:10px 0 4px;">${trackButton}</td></tr>` : ""}
      </table>
    </div>

    <p style="color:#6b5a48;font-size:14px;text-align:center;line-height:1.6;">Estimated delivery within <strong>3-7 business days</strong>.</p>

    ${ctaButton(params.orderUrl, "View Order")}
  `;
  return baseLayout(content);
}
