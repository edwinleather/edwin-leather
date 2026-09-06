const DEFAULT_LOGO_URL = "https://res.cloudinary.com/gpldwiup/image/upload/w_120,h_120,c_fill/edwin/assets/logo.jpg";

export type BaseLayoutOptions = {
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
};

const layoutCache: { options: BaseLayoutOptions | null; html: string } = { options: null, html: "" };

export function baseLayout(content: string, options?: BaseLayoutOptions): string {
  const logoUrl = options?.logoUrl || DEFAULT_LOGO_URL;
  const email = options?.email || "Support.edwinleather@gmail.com";
  const phone = options?.phone || "+91 98978 63824";
  const address = options?.address || "E1/183, near Aroma cuisine landmark zonal park, Taj Nagri Phase 2, Tajganj, Agra, UP 282001";
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Edwin Leathers</title>
</head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
          <!-- Header -->
          <tr>
            <td style="background-color:#3c2415;padding:16px 32px;text-align:center;">
              <img src="${logoUrl}" alt="Edwin Leathers" width="40" height="40" style="border-radius:50%;margin-bottom:8px;" />
              <h1 style="color:#d4a843;margin:0;font-size:18px;letter-spacing:2px;">EDWIN LEATHERS</h1>
              <p style="color:#c4a882;margin:2px 0 0;font-size:10px;letter-spacing:1px;">HANDCRAFTED LEATHER GOODS</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f5f0eb;padding:16px 32px;text-align:center;border-top:1px solid #e8ddd0;">
              <p style="color:#8b7355;margin:0 0 4px;font-size:11px;">EDWIN Leather Store · <a href="mailto:${email}" style="color:#3c2415;">${email}</a> · ${phone}</p>
              <p style="color:#8b7355;margin:0 0 8px;font-size:11px;">${address}</p>
              <p style="color:#a89880;margin:0;font-size:10px;">This is a transactional email regarding your order. Reply "unsubscribe" to opt out.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function itemsTable(rows: { name: string; variant?: string; quantity: number; unitPrice: number; lineTotal: number }[]): string {
  const html = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;">
          ${r.name}${r.variant ? ` (${r.variant})` : ""}
          <span style="color:#8b7355;">&times; ${r.quantity}</span>
        </td>
        <td style="padding:8px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;text-align:right;">&#8377;${r.lineTotal.toLocaleString("en-IN")}</td>
      </tr>`
    )
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <tr style="border-bottom:2px solid #3c2415;">
      <td style="padding:8px 0;color:#3c2415;font-weight:bold;font-size:13px;">Item</td>
      <td style="padding:8px 0;color:#3c2415;font-weight:bold;font-size:13px;text-align:right;">Price</td>
    </tr>
    ${html}
  </table>`;
}

export function itemsTableWithImages(rows: { name: string; variant?: string; quantity: number; unitPrice: number; lineTotal: number; imageUrl?: string }[]): string {
  const html = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f0e8dd;width:60px;">
          ${r.imageUrl ? `<img src="${r.imageUrl}" alt="${r.name}" width="50" height="50" style="border-radius:4px;object-fit:cover;" />` : `<div style="width:50px;height:50px;background:#f5f0eb;border-radius:4px;"></div>`}
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;padding-left:12px;">
          <strong>${r.name}</strong>${r.variant ? `<br/><span style="color:#8b7355;font-size:12px;">${r.variant}</span>` : ""}
          <br/><span style="color:#8b7355;font-size:12px;">Qty: ${r.quantity} &times; &#8377;${r.unitPrice.toLocaleString("en-IN")}</span>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;text-align:right;white-space:nowrap;">&#8377;${r.lineTotal.toLocaleString("en-IN")}</td>
      </tr>`
    )
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;">
    <tr style="border-bottom:2px solid #3c2415;">
      <td colspan="2" style="padding:8px 0;color:#3c2415;font-weight:bold;font-size:13px;">Item</td>
      <td style="padding:8px 0;color:#3c2415;font-weight:bold;font-size:13px;text-align:right;">Price</td>
    </tr>
    ${html}
  </table>`;
}

export function summaryTable(rows: { label: string; value: string; bold?: boolean }[]): string {
  const html = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:4px 0;color:${r.bold ? "#3c2415" : "#8b7355"};font-size:14px;font-weight:${r.bold ? "bold" : "normal"};">${r.label}</td>
        <td style="padding:4px 0;color:${r.bold ? "#3c2415" : "#8b7355"};font-size:14px;font-weight:${r.bold ? "bold" : "normal"};text-align:right;">${r.value}</td>
      </tr>`
    )
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:1px solid #e8ddd0;padding-top:8px;">
    ${html}
  </table>`;
}

export function invoiceSection(params: {
  orderNumber: string;
  date: string;
  sellerName: string;
  sellerAddress: string;
  sellerGstin?: string;
  buyerName: string;
  buyerAddress: string;
  items: { name: string; hsn?: string; qty: number; rate: number; amount: number }[];
  subtotal: number;
  gstRate: number;
  gstAmount: number;
  shipping: number;
  total: number;
}): string {
  const itemRows = params.items
    .map(
      (item, i) => `<tr>
        <td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;">${i + 1}</td>
        <td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;">${item.name}</td>
        <td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#8b7355;">${item.hsn || "-"}</td>
        <td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;text-align:center;">${item.qty}</td>
        <td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;text-align:right;">&#8377;${item.rate.toLocaleString("en-IN")}</td>
        <td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;text-align:right;">&#8377;${item.amount.toLocaleString("en-IN")}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="margin:32px 0;border:1px solid #e8ddd0;border-radius:6px;overflow:hidden;">
    <div style="background:#3c2415;padding:16px 20px;">
      <h3 style="margin:0;color:#d4a843;font-size:16px;letter-spacing:1px;">TAX INVOICE</h3>
    </div>
    <div style="padding:20px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
        <tr>
          <td style="font-size:12px;color:#8b7355;vertical-align:top;width:50%;">
            <strong style="color:#3c2415;">${params.sellerName}</strong><br/>
            ${params.sellerAddress}${params.sellerGstin ? `<br/>GSTIN: ${params.sellerGstin}` : ""}
          </td>
          <td style="font-size:12px;color:#8b7355;vertical-align:top;width:50%;text-align:right;">
            <strong style="color:#3c2415;">Invoice #INV-${params.orderNumber}</strong><br/>
            Date: ${params.date}<br/>
            Order: #${params.orderNumber}
          </td>
        </tr>
      </table>
      <div style="margin-bottom:16px;font-size:12px;color:#8b7355;">
        <strong style="color:#3c2415;">Bill To:</strong><br/>
        ${params.buyerName}<br/>${params.buyerAddress}
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr style="background:#f5f0eb;">
          <th style="padding:8px;font-size:11px;color:#3c2415;text-align:left;border-bottom:2px solid #3c2415;">#</th>
          <th style="padding:8px;font-size:11px;color:#3c2415;text-align:left;border-bottom:2px solid #3c2415;">Item</th>
          <th style="padding:8px;font-size:11px;color:#3c2415;text-align:left;border-bottom:2px solid #3c2415;">HSN</th>
          <th style="padding:8px;font-size:11px;color:#3c2415;text-align:center;border-bottom:2px solid #3c2415;">Qty</th>
          <th style="padding:8px;font-size:11px;color:#3c2415;text-align:right;border-bottom:2px solid #3c2415;">Rate</th>
          <th style="padding:8px;font-size:11px;color:#3c2415;text-align:right;border-bottom:2px solid #3c2415;">Amount</th>
        </tr>
        ${itemRows}
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
        <tr><td style="padding:4px 0;font-size:13px;color:#8b7355;">Subtotal</td><td style="padding:4px 0;font-size:13px;color:#3c2415;text-align:right;">&#8377;${params.subtotal.toLocaleString("en-IN")}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#8b7355;">GST (${params.gstRate}%)</td><td style="padding:4px 0;font-size:13px;color:#3c2415;text-align:right;">&#8377;${params.gstAmount.toLocaleString("en-IN")}</td></tr>
        <tr><td style="padding:4px 0;font-size:13px;color:#8b7355;">Shipping</td><td style="padding:4px 0;font-size:13px;color:#3c2415;text-align:right;">${params.shipping === 0 ? "FREE" : `&#8377;${params.shipping.toLocaleString("en-IN")}`}</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;font-weight:bold;color:#3c2415;border-top:2px solid #3c2415;">Total</td><td style="padding:8px 0;font-size:14px;font-weight:bold;color:#3c2415;text-align:right;border-top:2px solid #3c2415;">&#8377;${params.total.toLocaleString("en-IN")}</td></tr>
      </table>
    </div>
  </div>`;
}

export function ctaButton(url: string, text: string): string {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;background-color:#3c2415;color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">${text}</a>
  </div>`;
}
