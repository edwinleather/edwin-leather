const DEFAULT_LOGO_URL = "https://res.cloudinary.com/gpldwiup/image/upload/w_120,h_120,c_fill/edwin/assets/logo.jpg";

export type BaseLayoutOptions = {
  logoUrl?: string;
  email?: string;
  phone?: string;
  address?: string;
};

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
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;max-width:600px;box-shadow:0 2px 8px rgba(60,36,21,0.08);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3c2415 0%, #5a3a28 100%);padding:24px 32px;text-align:center;">
              <img src="${logoUrl}" alt="Edwin Leathers" width="48" height="48" style="border-radius:50%;margin-bottom:10px;border:2px solid #d4a843;" />
              <h1 style="color:#d4a843;margin:0;font-size:20px;letter-spacing:3px;font-weight:300;">EDWIN LEATHERS</h1>
              <p style="color:#c4a882;margin:4px 0 0;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;">Handcrafted Leather Goods</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:36px 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#faf8f5;padding:24px 32px;text-align:center;border-top:1px solid #e8ddd0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding-bottom:12px;">
                    <img src="${logoUrl}" alt="" width="28" height="28" style="border-radius:50%;opacity:0.6;" />
                  </td>
                </tr>
              </table>
              <p style="color:#6b5a48;margin:0 0 6px;font-size:12px;font-weight:500;">EDWIN Leather Store</p>
              <p style="color:#8b7355;margin:0 0 4px;font-size:11px;">
                <a href="mailto:${email}" style="color:#3c2415;text-decoration:none;">${email}</a>
                <span style="color:#d4a843;margin:0 6px;">|</span>
                ${phone}
              </p>
              <p style="color:#8b7355;margin:0 0 12px;font-size:11px;">${address}</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top:1px solid #e8ddd0;padding-top:12px;">
                    <p style="color:#a89880;margin:0;font-size:10px;">This is a transactional email regarding your order.</p>
                  </td>
                </tr>
              </table>
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
      (r, i) => `
      <tr>
        <td style="padding:12px 0;${i === rows.length - 1 ? '' : 'border-bottom:1px solid #f0e8dd;'}color:#3c2415;font-size:14px;">
          ${r.name}${r.variant ? `<span style="color:#8b7355;font-size:12px;"> — ${r.variant}</span>` : ""}
          <br/><span style="color:#8b7355;font-size:12px;">Qty: ${r.quantity} &times; &#8377;${r.unitPrice.toLocaleString("en-IN")}</span>
        </td>
        <td style="padding:12px 0;${i === rows.length - 1 ? '' : 'border-bottom:1px solid #f0e8dd;'}color:#3c2415;font-size:14px;text-align:right;white-space:nowrap;font-weight:500;">&#8377;${r.lineTotal.toLocaleString("en-IN")}</td>
      </tr>`
    )
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td colspan="2" style="padding:0 0 12px;color:#3c2415;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #3c2415;">Order Items</td>
    </tr>
    ${html}
  </table>`;
}

export function itemsTableWithImages(rows: { name: string; variant?: string; quantity: number; unitPrice: number; lineTotal: number; imageUrl?: string }[]): string {
  const html = rows
    .map(
      (r, i) => `
      <tr>
        <td style="padding:14px 0;${i === rows.length - 1 ? '' : 'border-bottom:1px solid #f0e8dd;'}width:72px;vertical-align:top;">
          ${r.imageUrl ? `<img src="${r.imageUrl}" alt="${r.name}" width="60" height="60" style="border-radius:8px;object-fit:cover;border:1px solid #f0e8dd;" />` : `<div style="width:60px;height:60px;background:#f5f0eb;border-radius:8px;border:1px solid #f0e8dd;"></div>`}
        </td>
        <td style="padding:14px 0 14px 16px;${i === rows.length - 1 ? '' : 'border-bottom:1px solid #f0e8dd;'}color:#3c2415;font-size:14px;vertical-align:top;">
          <strong style="font-weight:600;">${r.name}</strong>
          ${r.variant ? `<br/><span style="color:#8b7355;font-size:12px;margin-top:2px;display:inline-block;">${r.variant}</span>` : ""}
          <br/><span style="color:#8b7355;font-size:12px;">${r.quantity} &times; &#8377;${r.unitPrice.toLocaleString("en-IN")}</span>
        </td>
        <td style="padding:14px 0;${i === rows.length - 1 ? '' : 'border-bottom:1px solid #f0e8dd;'}color:#3c2415;font-size:14px;text-align:right;white-space:nowrap;font-weight:500;vertical-align:top;">&#8377;${r.lineTotal.toLocaleString("en-IN")}</td>
      </tr>`
    )
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td colspan="3" style="padding:0 0 12px;color:#3c2415;font-weight:600;font-size:13px;text-transform:uppercase;letter-spacing:1px;border-bottom:2px solid #3c2415;">Order Items</td>
    </tr>
    ${html}
  </table>`;
}

export function summaryTable(rows: { label: string; value: string; bold?: boolean }[]): string {
  const html = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:${r.bold ? '10px 0' : '5px 0'};color:${r.bold ? '#3c2415' : '#6b5a48'};font-size:${r.bold ? '15px' : '13px'};font-weight:${r.bold ? '700' : '400'};${r.bold ? 'border-top:2px solid #3c2415;padding-top:12px;' : ''}">${r.label}</td>
        <td style="padding:${r.bold ? '10px 0' : '5px 0'};color:${r.bold ? '#3c2415' : '#6b5a48'};font-size:${r.bold ? '15px' : '13px'};font-weight:${r.bold ? '700' : '400'};text-align:right;${r.bold ? 'border-top:2px solid #3c2415;padding-top:12px;' : ''}">${r.value}</td>
      </tr>`
    )
    .join("");

  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    ${html}
  </table>`;
}

export function infoBox(title: string, content: string, accent?: string): string {
  const borderColor = accent || '#d4a843';
  return `<div style="background:#faf8f5;border:1px solid #f0e8dd;border-left:4px solid ${borderColor};padding:18px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
    <p style="margin:0 0 6px;color:#3c2415;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${title}</p>
    <div style="color:#6b5a48;font-size:13px;line-height:1.6;">${content}</div>
  </div>`;
}

export function successBox(title: string, content: string): string {
  return `<div style="background:#f0f9e8;border:1px solid #d4edc0;border-left:4px solid #4caf50;padding:18px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
    <p style="margin:0 0 6px;color:#2e7d32;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">&#10003; ${title}</p>
    <div style="color:#558b2f;font-size:13px;line-height:1.6;">${content}</div>
  </div>`;
}

export function warningBox(title: string, content: string): string {
  return `<div style="background:#fff8e1;border:1px solid #ffe0b2;border-left:4px solid #ff9800;padding:18px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
    <p style="margin:0 0 6px;color:#e65100;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${title}</p>
    <div style="color:#bf360c;font-size:13px;line-height:1.6;">${content}</div>
  </div>`;
}

export function errorBox(title: string, content: string): string {
  return `<div style="background:#fde8e8;border:1px solid #f5c6cb;border-left:4px solid #d32f2f;padding:18px 20px;border-radius:0 8px 8px 0;margin:20px 0;">
    <p style="margin:0 0 6px;color:#c62828;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">${title}</p>
    <div style="color:#b71c1c;font-size:13px;line-height:1.6;">${content}</div>
  </div>`;
}

export function sectionDivider(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="border-top:1px solid #e8ddd0;"></td></tr>
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
        <td style="padding:10px 8px;${i === params.items.length - 1 ? '' : 'border-bottom:1px solid #f0e8dd;'}font-size:13px;color:#6b5a48;">${i + 1}</td>
        <td style="padding:10px 8px;${i === params.items.length - 1 ? '' : 'border-bottom:1px solid #f0e8dd;'}font-size:13px;color:#3c2415;font-weight:500;">${item.name}</td>
        <td style="padding:10px 8px;${i === params.items.length - 1 ? '' : 'border-bottom:1px solid #f0e8dd;'}font-size:13px;color:#8b7355;">${item.hsn || "-"}</td>
        <td style="padding:10px 8px;${i === params.items.length - 1 ? '' : 'border-bottom:1px solid #f0e8dd;'}font-size:13px;color:#3c2415;text-align:center;">${item.qty}</td>
        <td style="padding:10px 8px;${i === params.items.length - 1 ? '' : 'border-bottom:1px solid #f0e8dd;'}font-size:13px;color:#6b5a48;text-align:right;">&#8377;${item.rate.toLocaleString("en-IN")}</td>
        <td style="padding:10px 8px;${i === params.items.length - 1 ? '' : 'border-bottom:1px solid #f0e8dd;'}font-size:13px;color:#3c2415;text-align:right;font-weight:500;">&#8377;${item.amount.toLocaleString("en-IN")}</td>
      </tr>`
    )
    .join("");

  return `
  <div style="margin:28px 0;border:1px solid #e8ddd0;border-radius:10px;overflow:hidden;">
    <div style="background:linear-gradient(135deg, #3c2415 0%, #5a3a28 100%);padding:18px 24px;">
      <h3 style="margin:0;color:#d4a843;font-size:14px;letter-spacing:2px;text-transform:uppercase;font-weight:400;">Tax Invoice</h3>
    </div>
    <div style="padding:24px;background:#faf8f5;">
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr>
          <td style="font-size:12px;color:#6b5a48;vertical-align:top;width:50%;line-height:1.6;">
            <strong style="color:#3c2415;font-size:13px;">${params.sellerName}</strong><br/>
            ${params.sellerAddress}${params.sellerGstin ? `<br/><span style="color:#8b7355;">GSTIN: ${params.sellerGstin}</span>` : ""}
          </td>
          <td style="font-size:12px;color:#6b5a48;vertical-align:top;width:50%;text-align:right;line-height:1.6;">
            <strong style="color:#3c2415;font-size:13px;">Invoice #INV-${params.orderNumber}</strong><br/>
            Date: ${params.date}<br/>
            Order: #${params.orderNumber}
          </td>
        </tr>
      </table>
      <div style="margin-bottom:20px;padding:12px 16px;background:#ffffff;border-radius:6px;border:1px solid #f0e8dd;">
        <p style="margin:0 0 4px;color:#8b7355;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:600;">Bill To</p>
        <p style="margin:0;color:#3c2415;font-size:13px;font-weight:500;">${params.buyerName}</p>
        <p style="margin:2px 0 0;color:#6b5a48;font-size:12px;">${params.buyerAddress}</p>
      </div>
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <th style="padding:10px 8px;font-size:11px;color:#8b7355;text-align:left;border-bottom:2px solid #3c2415;text-transform:uppercase;letter-spacing:0.5px;">#</th>
          <th style="padding:10px 8px;font-size:11px;color:#8b7355;text-align:left;border-bottom:2px solid #3c2415;text-transform:uppercase;letter-spacing:0.5px;">Item</th>
          <th style="padding:10px 8px;font-size:11px;color:#8b7355;text-align:left;border-bottom:2px solid #3c2415;text-transform:uppercase;letter-spacing:0.5px;">HSN</th>
          <th style="padding:10px 8px;font-size:11px;color:#8b7355;text-align:center;border-bottom:2px solid #3c2415;text-transform:uppercase;letter-spacing:0.5px;">Qty</th>
          <th style="padding:10px 8px;font-size:11px;color:#8b7355;text-align:right;border-bottom:2px solid #3c2415;text-transform:uppercase;letter-spacing:0.5px;">Rate</th>
          <th style="padding:10px 8px;font-size:11px;color:#8b7355;text-align:right;border-bottom:2px solid #3c2415;text-transform:uppercase;letter-spacing:0.5px;">Amount</th>
        </tr>
        ${itemRows}
      </table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
        <tr><td style="padding:6px 0;font-size:13px;color:#6b5a48;">Subtotal</td><td style="padding:6px 0;font-size:13px;color:#3c2415;text-align:right;">&#8377;${params.subtotal.toLocaleString("en-IN")}</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;color:#6b5a48;">GST (${params.gstRate}%)</td><td style="padding:6px 0;font-size:13px;color:#3c2415;text-align:right;">&#8377;${params.gstAmount.toLocaleString("en-IN")}</td></tr>
        <tr><td style="padding:6px 0;font-size:13px;color:#6b5a48;">Shipping</td><td style="padding:6px 0;font-size:13px;color:${params.shipping === 0 ? '#4caf50' : '#3c2415'};text-align:right;font-weight:${params.shipping === 0 ? '500' : '400'};">${params.shipping === 0 ? "FREE" : `&#8377;${params.shipping.toLocaleString("en-IN")}`}</td></tr>
        <tr><td style="padding:12px 0 6px;font-size:15px;font-weight:700;color:#3c2415;border-top:2px solid #3c2415;">Total</td><td style="padding:12px 0 6px;font-size:15px;font-weight:700;color:#3c2415;text-align:right;border-top:2px solid #3c2415;">&#8377;${params.total.toLocaleString("en-IN")}</td></tr>
      </table>
    </div>
  </div>`;
}

export function ctaButton(url: string, text: string, style?: "primary" | "secondary"): string {
  const isSecondary = style === "secondary";
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${url}" style="display:inline-block;background-color:${isSecondary ? '#ffffff' : '#3c2415'};color:${isSecondary ? '#3c2415' : '#ffffff'};padding:14px 36px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.5px;border:2px solid #3c2415;">${text}</a>
  </div>`;
}
