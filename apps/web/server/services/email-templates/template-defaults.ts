export const EMAIL_TEMPLATE_KEYS = [
  "order_confirmation",
  "payment_received",
  "order_packed",
  "order_shipped",
  "order_delivered",
  "order_cancelled",
  "feedback_received",
  "return_requested"
] as const;

export type EmailTemplateKey = (typeof EMAIL_TEMPLATE_KEYS)[number];

export const EMAIL_TEMPLATE_LABELS: Record<EmailTemplateKey, string> = {
  order_confirmation: "Order Confirmation",
  payment_received: "Payment Received",
  order_packed: "Order Packed",
  order_shipped: "Order Shipped",
  order_delivered: "Order Delivered",
  order_cancelled: "Order Cancelled",
  feedback_received: "Feedback Received",
  return_requested: "Return Requested"
};

export const EMAIL_TEMPLATE_VARIABLES: Record<EmailTemplateKey, string[]> = {
  order_confirmation: ["name", "orderNumber", "paymentMethod", "itemsHtml", "invoiceHtml", "subtotal", "shipping", "gst", "discount", "total", "address", "orderUrl", "email"],
  payment_received: ["name", "orderNumber", "amount", "paymentMethod", "orderUrl"],
  order_packed: ["name", "orderNumber", "orderUrl"],
  order_shipped: ["name", "orderNumber", "courier", "trackingId", "trackingUrl", "orderUrl"],
  order_delivered: ["name", "orderNumber", "orderUrl", "feedbackUrl"],
  order_cancelled: ["name", "orderNumber", "reason", "orderUrl"],
  feedback_received: ["name", "topic", "message"],
  return_requested: ["name", "orderNumber", "orderUrl"]
};

export const EMAIL_TEMPLATE_DEFAULTS: Record<EmailTemplateKey, string> = {
  order_confirmation: `<div style="text-align:center;margin-bottom:28px;">
  <div style="width:56px;height:56px;background:linear-gradient(135deg, #d4a843, #c4983a);border-radius:50%;margin:0 auto 16px;display:inline-block;line-height:56px;">
    <span style="font-size:24px;color:#fff;">&#10003;</span>
  </div>
  <h2 style="color:#3c2415;margin:0 0 8px;font-size:22px;font-weight:600;">Order Confirmed</h2>
  <p style="color:#8b7355;margin:0;font-size:14px;">Thank you for shopping with us, {{name}}.</p>
</div>

<div style="background:#faf8f5;border:1px solid #f0e8dd;border-radius:10px;padding:20px;margin-bottom:24px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td>
        <p style="margin:0;color:#8b7355;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Order Number</p>
        <p style="margin:4px 0 0;color:#3c2415;font-size:16px;font-weight:600;">#{{orderNumber}}</p>
      </td>
      <td style="text-align:right;">
        <p style="margin:0;color:#8b7355;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Payment</p>
        <p style="margin:4px 0 0;color:#3c2415;font-size:13px;font-weight:500;">{{paymentMethod}}</p>
      </td>
    </tr>
  </table>
</div>

{{itemsHtml}}

{{invoiceHtml}}

<div style="background:#faf8f5;border:1px solid #f0e8dd;border-left:4px solid #d4a843;padding:18px 20px;border-radius:0 10px 10px 0;margin:24px 0;">
  <p style="margin:0 0 8px;color:#8b7355;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Shipping Address</p>
  <p style="margin:0;color:#3c2415;font-size:13px;line-height:1.6;">{{address}}</p>
</div>

<div style="text-align:center;margin:28px 0 0;">
  <a href="{{orderUrl}}" style="display:inline-block;background-color:#3c2415;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.5px;">View Order Details</a>
</div>

<p style="color:#8b7355;font-size:13px;text-align:center;margin:20px 0 0;line-height:1.5;">We'll send you shipping updates at <strong>{{email}}</strong></p>`,

  payment_received: `<div style="text-align:center;margin-bottom:28px;">
  <div style="width:56px;height:56px;background:linear-gradient(135deg, #4caf50, #43a047);border-radius:50%;margin:0 auto 16px;display:inline-block;line-height:56px;">
    <span style="font-size:24px;color:#fff;">&#10003;</span>
  </div>
  <h2 style="color:#3c2415;margin:0 0 8px;font-size:22px;font-weight:600;">Payment Confirmed</h2>
  <p style="color:#8b7355;margin:0;font-size:14px;">Hi {{name}}, your payment has been received.</p>
</div>

<div style="background:#f0f9e8;border:1px solid #d4edc0;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
  <p style="margin:0 0 4px;color:#8b7355;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Amount Paid</p>
  <p style="margin:0;color:#2e7d32;font-size:24px;font-weight:700;">{{amount}}</p>
  <p style="margin:6px 0 0;color:#558b2f;font-size:13px;">via {{paymentMethod}}</p>
</div>

<p style="color:#6b5a48;font-size:14px;text-align:center;line-height:1.6;">Your order <strong style="color:#3c2415;">#{{orderNumber}}</strong> is now being processed and will be packed soon.</p>

<div style="text-align:center;margin:28px 0 0;">
  <a href="{{orderUrl}}" style="display:inline-block;background-color:#3c2415;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.5px;">View Order</a>
</div>`,

  order_packed: `<div style="text-align:center;margin-bottom:28px;">
  <div style="width:56px;height:56px;background:linear-gradient(135deg, #d4a843, #c4983a);border-radius:50%;margin:0 auto 16px;display:inline-block;line-height:56px;">
    <span style="font-size:20px;color:#fff;">&#128230;</span>
  </div>
  <h2 style="color:#3c2415;margin:0 0 8px;font-size:22px;font-weight:600;">Order Packed</h2>
  <p style="color:#8b7355;margin:0;font-size:14px;">Hi {{name}}, great news!</p>
</div>

<div style="background:#faf8f5;border:1px solid #f0e8dd;border-left:4px solid #d4a843;padding:18px 20px;border-radius:0 10px 10px 0;margin:20px 0;">
  <p style="margin:0;color:#3c2415;font-size:14px;font-weight:600;">Order #{{orderNumber}}</p>
  <p style="margin:6px 0 0;color:#6b5a48;font-size:13px;line-height:1.5;">Your items have been carefully packed and are ready for dispatch. We'll notify you once it ships with tracking details.</p>
</div>

<div style="text-align:center;margin:28px 0 0;">
  <a href="{{orderUrl}}" style="display:inline-block;background-color:#3c2415;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.5px;">View Order</a>
</div>`,

  order_shipped: `<div style="text-align:center;margin-bottom:28px;">
  <div style="width:56px;height:56px;background:linear-gradient(135deg, #1976d2, #1565c0);border-radius:50%;margin:0 auto 16px;display:inline-block;line-height:56px;">
    <span style="font-size:20px;color:#fff;">&#128666;</span>
  </div>
  <h2 style="color:#3c2415;margin:0 0 8px;font-size:22px;font-weight:600;">Order Shipped</h2>
  <p style="color:#8b7355;margin:0;font-size:14px;">Hi {{name}}, your order is on its way!</p>
</div>

<div style="background:#e8f4fd;border:1px solid #bbdefb;border-radius:10px;padding:20px;margin-bottom:24px;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td style="padding:6px 0;">
        <p style="margin:0;color:#8b7355;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Order</p>
        <p style="margin:2px 0 0;color:#3c2415;font-size:14px;font-weight:500;">#{{orderNumber}}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:6px 0;">
        <p style="margin:0;color:#8b7355;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Courier</p>
        <p style="margin:2px 0 0;color:#3c2415;font-size:14px;font-weight:500;">{{courier}}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:6px 0;">
        <p style="margin:0;color:#8b7355;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Tracking ID</p>
        <p style="margin:2px 0 0;color:#3c2415;font-size:14px;font-weight:500;">{{trackingId}}</p>
      </td>
    </tr>
    {{#if trackingUrl}}
    <tr>
      <td style="padding:10px 0 4px;">
        <a href="{{trackingUrl}}" style="display:inline-block;background-color:#1976d2;color:#ffffff;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:13px;font-weight:600;">Track Shipment</a>
      </td>
    </tr>
    {{/if}}
  </table>
</div>

<p style="color:#6b5a48;font-size:14px;text-align:center;line-height:1.6;">Estimated delivery within <strong>3-7 business days</strong>.</p>

<div style="text-align:center;margin:28px 0 0;">
  <a href="{{orderUrl}}" style="display:inline-block;background-color:#3c2415;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.5px;">View Order</a>
</div>`,

  order_delivered: `<div style="text-align:center;margin-bottom:28px;">
  <div style="width:56px;height:56px;background:linear-gradient(135deg, #4caf50, #43a047);border-radius:50%;margin:0 auto 16px;display:inline-block;line-height:56px;">
    <span style="font-size:24px;color:#fff;">&#10003;</span>
  </div>
  <h2 style="color:#3c2415;margin:0 0 8px;font-size:22px;font-weight:600;">Order Delivered</h2>
  <p style="color:#8b7355;margin:0;font-size:14px;">Hi {{name}}, your order has been delivered successfully.</p>
</div>

<div style="background:#f0f9e8;border:1px solid #d4edc0;border-radius:10px;padding:20px;margin-bottom:24px;text-align:center;">
  <p style="margin:0;color:#2e7d32;font-size:14px;font-weight:500;">Order #{{orderNumber}} has been delivered</p>
</div>

<p style="color:#6b5a48;font-size:14px;text-align:center;line-height:1.6;margin-bottom:8px;">We hope you love your new leather goods!</p>
<p style="color:#8b7355;font-size:13px;text-align:center;line-height:1.6;">Your feedback helps us serve you better. Would you like to share your experience?</p>

<div style="text-align:center;margin:28px 0 0;">
  <a href="{{orderUrl}}" style="display:inline-block;background-color:#3c2415;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.5px;margin:0 6px;">View Order</a>
  <a href="{{feedbackUrl}}" style="display:inline-block;background-color:#ffffff;color:#3c2415;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.5px;border:2px solid #3c2415;margin:0 6px;">Give Feedback</a>
</div>`,

  order_cancelled: `<div style="text-align:center;margin-bottom:28px;">
  <div style="width:56px;height:56px;background:linear-gradient(135deg, #d32f2f, #c62828);border-radius:50%;margin:0 auto 16px;display:inline-block;line-height:56px;">
    <span style="font-size:24px;color:#fff;">&#10005;</span>
  </div>
  <h2 style="color:#3c2415;margin:0 0 8px;font-size:22px;font-weight:600;">Order Cancelled</h2>
  <p style="color:#8b7355;margin:0;font-size:14px;">Hi {{name}}, your order has been cancelled.</p>
</div>

<div style="background:#fde8e8;border:1px solid #f5c6cb;border-left:4px solid #d32f2f;padding:18px 20px;border-radius:0 10px 10px 0;margin:20px 0;">
  <p style="margin:0 0 4px;color:#c62828;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Cancelled</p>
  <p style="margin:0;color:#3c2415;font-size:14px;font-weight:500;">Order #{{orderNumber}}</p>
  {{#if reason}}<p style="margin:6px 0 0;color:#6b5a48;font-size:13px;line-height:1.5;"><strong>Reason:</strong> {{reason}}</p>{{/if}}
</div>

<p style="color:#6b5a48;font-size:14px;text-align:center;line-height:1.6;">If a payment was made, a refund will be processed within <strong>5-7 business days</strong>.</p>

<div style="text-align:center;margin:28px 0 0;">
  <a href="{{orderUrl}}" style="display:inline-block;background-color:#3c2415;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.5px;">View Order</a>
</div>`,

  feedback_received: `<div style="text-align:center;margin-bottom:28px;">
  <div style="width:56px;height:56px;background:linear-gradient(135deg, #d4a843, #c4983a);border-radius:50%;margin:0 auto 16px;display:inline-block;line-height:56px;">
    <span style="font-size:24px;color:#fff;">&#9829;</span>
  </div>
  <h2 style="color:#3c2415;margin:0 0 8px;font-size:22px;font-weight:600;">Thank You</h2>
  <p style="color:#8b7355;margin:0;font-size:14px;">Hi {{name}}, we've received your feedback.</p>
</div>

<div style="background:#faf8f5;border:1px solid #f0e8dd;border-radius:10px;padding:20px;margin-bottom:24px;">
  {{#if topic}}<p style="margin:0 0 8px;color:#8b7355;font-size:11px;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Topic: {{topic}}</p>{{/if}}
  <p style="margin:0;color:#3c2415;font-size:14px;line-height:1.6;font-style:italic;">"{{message}}"</p>
</div>

<p style="color:#6b5a48;font-size:14px;text-align:center;line-height:1.6;">Our team will review your feedback and get back to you if needed. We appreciate your time!</p>`,

  return_requested: `<div style="text-align:center;margin-bottom:28px;">
  <div style="width:56px;height:56px;background:linear-gradient(135deg, #ff9800, #f57c00);border-radius:50%;margin:0 auto 16px;display:inline-block;line-height:56px;">
    <span style="font-size:20px;color:#fff;">&#8634;</span>
  </div>
  <h2 style="color:#3c2415;margin:0 0 8px;font-size:22px;font-weight:600;">Return Request Received</h2>
  <p style="color:#8b7355;margin:0;font-size:14px;">Hi {{name}}, we've received your return request.</p>
</div>

<div style="background:#fff8e1;border:1px solid #ffe0b2;border-left:4px solid #ff9800;padding:18px 20px;border-radius:0 10px 10px 0;margin:20px 0;">
  <p style="margin:0 0 4px;color:#e65100;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Return in Progress</p>
  <p style="margin:0;color:#3c2415;font-size:14px;font-weight:500;">Order #{{orderNumber}}</p>
  <p style="margin:6px 0 0;color:#6b5a48;font-size:13px;line-height:1.5;">Our team will review your request and guide you through the return process.</p>
</div>

<p style="color:#6b5a48;font-size:14px;text-align:center;line-height:1.6;">You'll receive updates as your return is processed.</p>

<div style="text-align:center;margin:28px 0 0;">
  <a href="{{orderUrl}}" style="display:inline-block;background-color:#3c2415;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:0.5px;">View Order</a>
</div>`
};

export const EMAIL_TEMPLATE_SAMPLES: Record<EmailTemplateKey, Record<string, string>> = {
  order_confirmation: {
    name: "Rahul Sharma",
    orderNumber: "LEA26090001",
    paymentMethod: "Online (Razorpay)",
    email: "rahul@example.com",
    itemsHtml: `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;"><tr style="border-bottom:2px solid #3c2415;"><td colspan="2" style="padding:8px 0;color:#3c2415;font-weight:bold;font-size:13px;">Item</td><td style="padding:8px 0;color:#3c2415;font-weight:bold;font-size:13px;text-align:right;">Price</td></tr><tr><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;width:60px;"><img src="https://res.cloudinary.com/gpldwiup/image/upload/w_100,h_100,c_fill/edwin/assets/uiaqojlrt5zq2d8o8zmo.webp" alt="" width="50" height="50" style="border-radius:4px;object-fit:cover;" /></td><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;padding-left:12px;"><strong>Classic Leather Wallet</strong><br/><span style="color:#8b7355;font-size:12px;">Tan</span><br/><span style="color:#8b7355;font-size:12px;">Qty: 1 &times; &#8377;1,499</span></td><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;text-align:right;white-space:nowrap;">&#8377;1,499</td></tr><tr><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;width:60px;"><img src="https://res.cloudinary.com/gpldwiup/image/upload/w_100,h_100,c_fill/edwin/assets/jmsky5qf33pm7v9izsel.webp" alt="" width="50" height="50" style="border-radius:4px;object-fit:cover;" /></td><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;padding-left:12px;"><strong>Leather Belt - Tan</strong><br/><span style="color:#8b7355;font-size:12px;">32 inch</span><br/><span style="color:#8b7355;font-size:12px;">Qty: 1 &times; &#8377;1,999</span></td><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;text-align:right;white-space:nowrap;">&#8377;1,999</td></tr></table>`,
    invoiceHtml: `<div style="margin:32px 0;border:1px solid #e8ddd0;border-radius:6px;overflow:hidden;"><div style="background:#3c2415;padding:16px 20px;"><h3 style="margin:0;color:#d4a843;font-size:16px;letter-spacing:1px;">TAX INVOICE</h3></div><div style="padding:20px;"><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td style="font-size:12px;color:#8b7355;vertical-align:top;width:50%;"><strong style="color:#3c2415;">Edwin Leathers</strong><br/>EDWIN Leather Store</td><td style="font-size:12px;color:#8b7355;vertical-align:top;width:50%;text-align:right;"><strong style="color:#3c2415;">Invoice #INV-LEA26090001</strong><br/>Date: 05 Sep 2026<br/>Order: #LEA26090001</td></tr></table><div style="margin-bottom:16px;font-size:12px;color:#8b7355;"><strong style="color:#3c2415;">Bill To:</strong><br/>Rahul Sharma<br/>42 MG Road, Bangalore, Karnataka 560001</div><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr style="background:#f5f0eb;"><th style="padding:8px;font-size:11px;color:#3c2415;text-align:left;border-bottom:2px solid #3c2415;">#</th><th style="padding:8px;font-size:11px;color:#3c2415;text-align:left;border-bottom:2px solid #3c2415;">Item</th><th style="padding:8px;font-size:11px;color:#3c2415;text-align:left;border-bottom:2px solid #3c2415;">HSN</th><th style="padding:8px;font-size:11px;color:#3c2415;text-align:center;border-bottom:2px solid #3c2415;">Qty</th><th style="padding:8px;font-size:11px;color:#3c2415;text-align:right;border-bottom:2px solid #3c2415;">Rate</th><th style="padding:8px;font-size:11px;color:#3c2415;text-align:right;border-bottom:2px solid #3c2415;">Amount</th></tr><tr><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;">1</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;">Classic Leather Wallet</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#8b7355;">4202</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;text-align:center;">1</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;text-align:right;">&#8377;1,499</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;text-align:right;">&#8377;1,499</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;">2</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;">Leather Belt - Tan</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#8b7355;">4203</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;text-align:center;">1</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;text-align:right;">&#8377;1,999</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;text-align:right;">&#8377;1,999</td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;"><tr><td style="padding:4px 0;font-size:13px;color:#8b7355;">Subtotal</td><td style="padding:4px 0;font-size:13px;color:#3c2415;text-align:right;">&#8377;3,498</td></tr><tr><td style="padding:4px 0;font-size:13px;color:#8b7355;">GST (18%)</td><td style="padding:4px 0;font-size:13px;color:#3c2415;text-align:right;">&#8377;630</td></tr><tr><td style="padding:4px 0;font-size:13px;color:#8b7355;">Shipping</td><td style="padding:4px 0;font-size:13px;color:#3c2415;text-align:right;">FREE</td></tr><tr><td style="padding:8px 0;font-size:14px;font-weight:bold;color:#3c2415;border-top:2px solid #3c2415;">Total</td><td style="padding:8px 0;font-size:14px;font-weight:bold;color:#3c2415;text-align:right;border-top:2px solid #3c2415;">&#8377;4,128</td></tr></table></div></div>`,
    subtotal: "&#8377;3,498",
    shipping: "FREE",
    gst: "&#8377;630",
    discount: "",
    total: "&#8377;4,128",
    address: "Rahul Sharma, 42 MG Road, Bangalore, Karnataka 560001",
    orderUrl: "#"
  },
  payment_received: {
    name: "Priya Patel",
    orderNumber: "LEA26090002",
    amount: "&#8377;2,999",
    paymentMethod: "Razorpay",
    orderUrl: "#"
  },
  order_packed: {
    name: "Amit Kumar",
    orderNumber: "LEA26090003",
    orderUrl: "#"
  },
  order_shipped: {
    name: "Neha Gupta",
    orderNumber: "LEA26090004",
    courier: "Delhivery",
    trackingId: "DLV123456789",
    trackingUrl: "https://www.delhivery.com/track/package/DLV123456789",
    orderUrl: "#"
  },
  order_delivered: {
    name: "Vikram Singh",
    orderNumber: "LEA26090005",
    orderUrl: "#",
    feedbackUrl: "/feedback"
  },
  order_cancelled: {
    name: "Sanjay Mehta",
    orderNumber: "LEA26090006",
    reason: "Out of stock",
    orderUrl: "#"
  },
  feedback_received: {
    name: "Anjali Reddy",
    topic: "Product Quality",
    message: "The leather wallet I received is absolutely stunning. The craftsmanship is top-notch!"
  },
  return_requested: {
    name: "Rohit Verma",
    orderNumber: "LEA26090007",
    orderUrl: "#"
  }
};
