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
  order_confirmation: ["name", "orderNumber", "paymentMethod", "itemsHtml", "invoiceHtml", "subtotal", "shipping", "gst", "discount", "total", "address", "orderUrl"],
  payment_received: ["name", "orderNumber", "amount", "paymentMethod", "orderUrl"],
  order_packed: ["name", "orderNumber", "orderUrl"],
  order_shipped: ["name", "orderNumber", "courier", "trackingId", "trackingUrl", "orderUrl"],
  order_delivered: ["name", "orderNumber", "orderUrl", "feedbackUrl"],
  order_cancelled: ["name", "orderNumber", "reason", "orderUrl"],
  feedback_received: ["name", "topic", "message"],
  return_requested: ["name", "orderNumber", "orderUrl"]
};

export const EMAIL_TEMPLATE_DEFAULTS: Record<EmailTemplateKey, string> = {
  order_confirmation: `<h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Order Confirmed!</h2>
<p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi {{name}}, we've received your order.</p>

<div style="background:#f5f0eb;padding:16px;border-radius:6px;margin-bottom:24px;">
  <p style="margin:0;color:#3c2415;font-size:14px;"><strong>Order #{{orderNumber}}</strong></p>
  <p style="margin:4px 0 0;color:#8b7355;font-size:13px;">Payment: {{paymentMethod}}</p>
</div>

{{itemsHtml}}

{{invoiceHtml}}

<div style="background:#f5f0eb;padding:16px;border-radius:6px;margin-top:16px;">
  <p style="margin:0 0 4px;color:#3c2415;font-size:13px;font-weight:bold;">Shipping Address</p>
  <p style="margin:0;color:#8b7355;font-size:13px;">{{address}}</p>
</div>

<div style="text-align:center;margin:24px 0;">
  <a href="{{orderUrl}}" style="display:inline-block;background-color:#3c2415;color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">View Order</a>
</div>`,

  payment_received: `<h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Payment Received</h2>
<p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi {{name}}, your payment has been confirmed.</p>

<div style="background:#f0f7e6;padding:16px;border-radius:6px;margin-bottom:24px;border-left:4px solid #4caf50;">
  <p style="margin:0;color:#2e7d32;font-size:14px;font-weight:bold;">&#10003; Payment Successful</p>
  <p style="margin:4px 0 0;color:#558b2f;font-size:13px;">Amount: {{amount}} via {{paymentMethod}}</p>
</div>

<p style="color:#8b7355;font-size:14px;">Your order <strong>#{{orderNumber}}</strong> is now being processed.</p>

<div style="text-align:center;margin:24px 0;">
  <a href="{{orderUrl}}" style="display:inline-block;background-color:#3c2415;color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">View Order</a>
</div>`,

  order_packed: `<h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Your Order is Packed</h2>
<p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi {{name}}, great news!</p>

<div style="background:#f5f0eb;padding:16px;border-radius:6px;margin-bottom:24px;border-left:4px solid #d4a843;">
  <p style="margin:0;color:#3c2415;font-size:14px;font-weight:bold;">Order #{{orderNumber}}</p>
  <p style="margin:4px 0 0;color:#8b7355;font-size:13px;">Your items have been carefully packed and are ready for dispatch.</p>
</div>

<p style="color:#8b7355;font-size:14px;">We'll send you tracking details once your order ships.</p>

<div style="text-align:center;margin:24px 0;">
  <a href="{{orderUrl}}" style="display:inline-block;background-color:#3c2415;color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">View Order</a>
</div>`,

  order_shipped: `<h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Your Order is on its Way!</h2>
<p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi {{name}}, your order has been shipped.</p>

<div style="background:#e8f0fe;padding:16px;border-radius:6px;margin-bottom:24px;border-left:4px solid #1976d2;">
  <p style="margin:0;color:#1565c0;font-size:14px;font-weight:bold;">&#128666; Shipped</p>
  <p style="margin:4px 0 0;color:#3c2415;font-size:13px;"><strong>Order:</strong> #{{orderNumber}}</p>
  <p style="margin:4px 0 0;color:#3c2415;font-size:13px;"><strong>Courier:</strong> {{courier}}</p>
  <p style="margin:4px 0 0;color:#3c2415;font-size:13px;"><strong>Tracking ID:</strong> {{trackingId}}</p>
  {{#if trackingUrl}}<p style="margin:4px 0 0;font-size:13px;"><a href="{{trackingUrl}}" style="color:#3c2415;text-decoration:underline;">Track on {{courier}}</a></p>{{/if}}
</div>

<p style="color:#8b7355;font-size:14px;">Estimated delivery within 3-7 business days.</p>

<div style="text-align:center;margin:24px 0;">
  <a href="{{orderUrl}}" style="display:inline-block;background-color:#3c2415;color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">View Order</a>
</div>`,

  order_delivered: `<h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Order Delivered!</h2>
<p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi {{name}}, your order has been delivered.</p>

<div style="background:#f0f7e6;padding:16px;border-radius:6px;margin-bottom:24px;border-left:4px solid #4caf50;">
  <p style="margin:0;color:#2e7d32;font-size:14px;font-weight:bold;">&#10003; Delivered</p>
  <p style="margin:4px 0 0;color:#558b2f;font-size:13px;">Order #{{orderNumber}} has been successfully delivered.</p>
</div>

<p style="color:#8b7355;font-size:14px;">We hope you love your new leather goods! If you have any feedback, we'd love to hear from you.</p>

<div style="text-align:center;margin:24px 0;">
  <a href="{{orderUrl}}" style="display:inline-block;background-color:#3c2415;color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;margin:0 8px;">View Order</a>
  <a href="{{feedbackUrl}}" style="display:inline-block;background-color:#d4a843;color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;margin:0 8px;">Give Feedback</a>
</div>`,

  order_cancelled: `<h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Order Cancelled</h2>
<p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi {{name}}, your order has been cancelled.</p>

<div style="background:#fde8e8;padding:16px;border-radius:6px;margin-bottom:24px;border-left:4px solid #d32f2f;">
  <p style="margin:0;color:#c62828;font-size:14px;font-weight:bold;">Cancelled</p>
  <p style="margin:4px 0 0;color:#3c2415;font-size:13px;"><strong>Order:</strong> #{{orderNumber}}</p>
  {{#if reason}}<p style="margin:4px 0 0;color:#8b7355;font-size:13px;"><strong>Reason:</strong> {{reason}}</p>{{/if}}
</div>

<p style="color:#8b7355;font-size:14px;">If a payment was made, a refund will be processed within 5-7 business days.</p>

<div style="text-align:center;margin:24px 0;">
  <a href="{{orderUrl}}" style="display:inline-block;background-color:#3c2415;color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">View Order</a>
</div>`,

  feedback_received: `<h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Thank You for Your Feedback</h2>
<p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi {{name}}, we've received your feedback.</p>

<div style="background:#f5f0eb;padding:16px;border-radius:6px;margin-bottom:24px;">
  <p style="margin:0;color:#3c2415;font-size:14px;font-weight:bold;">Your Message</p>
  {{#if topic}}<p style="margin:4px 0 0;color:#8b7355;font-size:13px;"><strong>Topic:</strong> {{topic}}</p>{{/if}}
  <p style="margin:8px 0 0;color:#8b7355;font-size:13px;">{{message}}</p>
</div>

<p style="color:#8b7355;font-size:14px;">Our team will review your feedback and get back to you if needed.</p>`,

  return_requested: `<h2 style="color:#3c2415;margin:0 0 8px;font-size:20px;">Return Request Received</h2>
<p style="color:#8b7355;margin:0 0 24px;font-size:14px;">Hi {{name}}, we've received your return request.</p>

<div style="background:#fff3e0;padding:16px;border-radius:6px;margin-bottom:24px;border-left:4px solid #f57c00;">
  <p style="margin:0;color:#e65100;font-size:14px;font-weight:bold;">Return in Progress</p>
  <p style="margin:4px 0 0;color:#3c2415;font-size:13px;">Order #{{orderNumber}}</p>
  <p style="margin:4px 0 0;color:#8b7355;font-size:13px;">Our team will review your request and guide you through the return process.</p>
</div>

<p style="color:#8b7355;font-size:14px;">You'll receive updates as your return is processed.</p>

<div style="text-align:center;margin:24px 0;">
  <a href="{{orderUrl}}" style="display:inline-block;background-color:#3c2415;color:#ffffff;padding:12px 32px;border-radius:6px;text-decoration:none;font-size:14px;font-weight:bold;letter-spacing:0.5px;">View Order</a>
</div>`
};

export const EMAIL_TEMPLATE_SAMPLES: Record<EmailTemplateKey, Record<string, string>> = {
  order_confirmation: {
    name: "Rahul Sharma",
    orderNumber: "LEA26090001",
    paymentMethod: "Online (Razorpay)",
    itemsHtml: `<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;"><tr style="border-bottom:2px solid #3c2415;"><td colspan="2" style="padding:8px 0;color:#3c2415;font-weight:bold;font-size:13px;">Item</td><td style="padding:8px 0;color:#3c2415;font-weight:bold;font-size:13px;text-align:right;">Price</td></tr><tr><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;width:60px;"><img src="https://res.cloudinary.com/z7o6zvqo/image/upload/w_100,h_100,c_fill/v1786894146/edwin/assets/uiaqojlrt5zq2d8o8zmo.webp" alt="" width="50" height="50" style="border-radius:4px;object-fit:cover;" /></td><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;padding-left:12px;"><strong>Classic Leather Wallet</strong><br/><span style="color:#8b7355;font-size:12px;">Tan</span><br/><span style="color:#8b7355;font-size:12px;">Qty: 1 &times; &#8377;1,499</span></td><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;text-align:right;white-space:nowrap;">&#8377;1,499</td></tr><tr><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;width:60px;"><img src="https://res.cloudinary.com/z7o6zvqo/image/upload/w_100,h_100,c_fill/v1786894275/edwin/assets/jmsky5qf33pm7v9izsel.webp" alt="" width="50" height="50" style="border-radius:4px;object-fit:cover;" /></td><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;padding-left:12px;"><strong>Leather Belt - Tan</strong><br/><span style="color:#8b7355;font-size:12px;">32 inch</span><br/><span style="color:#8b7355;font-size:12px;">Qty: 1 &times; &#8377;1,999</span></td><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;text-align:right;white-space:nowrap;">&#8377;1,999</td></tr></table>`,
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
