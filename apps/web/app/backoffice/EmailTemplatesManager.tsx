"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Code, Eye, Loader2, RefreshCw, RotateCcw, Save, TriangleAlert } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type TemplateKey = "order_confirmation" | "payment_received" | "order_packed" | "order_shipped" | "order_delivered" | "order_cancelled" | "feedback_received" | "return_requested";

const TEMPLATE_META: Record<TemplateKey, { label: string; variables: string[] }> = {
  order_confirmation: { label: "Order Confirmation", variables: ["name", "orderNumber", "paymentMethod", "itemsHtml", "invoiceHtml", "subtotal", "shipping", "gst", "discount", "total", "address", "orderUrl"] },
  payment_received: { label: "Payment Received", variables: ["name", "orderNumber", "amount", "paymentMethod", "orderUrl"] },
  order_packed: { label: "Order Packed", variables: ["name", "orderNumber", "orderUrl"] },
  order_shipped: { label: "Order Shipped", variables: ["name", "orderNumber", "courier", "trackingId", "trackingUrl", "orderUrl"] },
  order_delivered: { label: "Order Delivered", variables: ["name", "orderNumber", "orderUrl", "feedbackUrl"] },
  order_cancelled: { label: "Order Cancelled", variables: ["name", "orderNumber", "reason", "orderUrl"] },
  feedback_received: { label: "Feedback Received", variables: ["name", "topic", "message"] },
  return_requested: { label: "Return Requested", variables: ["name", "orderNumber", "orderUrl"] }
};

const SAMPLE_DATA: Record<TemplateKey, Record<string, string>> = {
  order_confirmation: {
    name: "Rahul Sharma",
    orderNumber: "LEA26090001",
    paymentMethod: "Online (Razorpay)",
    itemsHtml: '<table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;"><tr style="border-bottom:2px solid #3c2415;"><td colspan="2" style="padding:8px 0;color:#3c2415;font-weight:bold;font-size:13px;">Item</td><td style="padding:8px 0;color:#3c2415;font-weight:bold;font-size:13px;text-align:right;">Price</td></tr><tr><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;width:60px;"><img src="https://res.cloudinary.com/z7o6zvqo/image/upload/w_100,h_100,c_fill/v1786894146/edwin/assets/uiaqojlrt5zq2d8o8zmo.webp" alt="" width="50" height="50" style="border-radius:4px;object-fit:cover;" /></td><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;padding-left:12px;"><strong>Classic Leather Wallet</strong><br/><span style="color:#8b7355;font-size:12px;">Tan</span><br/><span style="color:#8b7355;font-size:12px;">Qty: 1 × ₹1,499</span></td><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;text-align:right;white-space:nowrap;">₹1,499</td></tr><tr><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;width:60px;"><img src="https://res.cloudinary.com/z7o6zvqo/image/upload/w_100,h_100,c_fill/v1786894275/edwin/assets/jmsky5qf33pm7v9izsel.webp" alt="" width="50" height="50" style="border-radius:4px;object-fit:cover;" /></td><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;padding-left:12px;"><strong>Leather Belt - Tan</strong><br/><span style="color:#8b7355;font-size:12px;">32 inch</span><br/><span style="color:#8b7355;font-size:12px;">Qty: 1 × ₹1,999</span></td><td style="padding:10px 0;border-bottom:1px solid #f0e8dd;color:#3c2415;font-size:14px;text-align:right;white-space:nowrap;">₹1,999</td></tr></table>',
    invoiceHtml: '<div style="margin:32px 0;border:1px solid #e8ddd0;border-radius:6px;overflow:hidden;"><div style="background:#3c2415;padding:16px 20px;"><h3 style="margin:0;color:#d4a843;font-size:16px;letter-spacing:1px;">TAX INVOICE</h3></div><div style="padding:20px;"><table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;"><tr><td style="font-size:12px;color:#8b7355;vertical-align:top;width:50%;"><strong style="color:#3c2415;">Edwin Leathers</strong><br/>EDWIN Leather Store</td><td style="font-size:12px;color:#8b7355;vertical-align:top;width:50%;text-align:right;"><strong style="color:#3c2415;">Invoice #INV-LEA26090001</strong><br/>Date: 05 Sep 2026<br/>Order: #LEA26090001</td></tr></table><div style="margin-bottom:16px;font-size:12px;color:#8b7355;"><strong style="color:#3c2415;">Bill To:</strong><br/>Rahul Sharma<br/>42 MG Road, Bangalore, Karnataka 560001</div><table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr style="background:#f5f0eb;"><th style="padding:8px;font-size:11px;color:#3c2415;text-align:left;border-bottom:2px solid #3c2415;">#</th><th style="padding:8px;font-size:11px;color:#3c2415;text-align:left;border-bottom:2px solid #3c2415;">Item</th><th style="padding:8px;font-size:11px;color:#3c2415;text-align:left;border-bottom:2px solid #3c2415;">HSN</th><th style="padding:8px;font-size:11px;color:#3c2415;text-align:center;border-bottom:2px solid #3c2415;">Qty</th><th style="padding:8px;font-size:11px;color:#3c2415;text-align:right;border-bottom:2px solid #3c2415;">Rate</th><th style="padding:8px;font-size:11px;color:#3c2415;text-align:right;border-bottom:2px solid #3c2415;">Amount</th></tr><tr><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;">1</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;">Classic Leather Wallet</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#8b7355;">4202</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;text-align:center;">1</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;text-align:right;">₹1,499</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;text-align:right;">₹1,499</td></tr><tr><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;">2</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;">Leather Belt - Tan</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#8b7355;">4203</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;text-align:center;">1</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;text-align:right;">₹1,999</td><td style="padding:8px;border-bottom:1px solid #e8ddd0;font-size:13px;color:#3c2415;text-align:right;">₹1,999</td></tr></table><table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;"><tr><td style="padding:4px 0;font-size:13px;color:#8b7355;">Subtotal</td><td style="padding:4px 0;font-size:13px;color:#3c2415;text-align:right;">₹3,498</td></tr><tr><td style="padding:4px 0;font-size:13px;color:#8b7355;">GST (18%)</td><td style="padding:4px 0;font-size:13px;color:#3c2415;text-align:right;">₹630</td></tr><tr><td style="padding:4px 0;font-size:13px;color:#8b7355;">Shipping</td><td style="padding:4px 0;font-size:13px;color:#3c2415;text-align:right;">FREE</td></tr><tr><td style="padding:8px 0;font-size:14px;font-weight:bold;color:#3c2415;border-top:2px solid #3c2415;">Total</td><td style="padding:8px 0;font-size:14px;font-weight:bold;color:#3c2415;text-align:right;border-top:2px solid #3c2415;">₹4,128</td></tr></table></div></div>',
    subtotal: "₹3,498",
    shipping: "FREE",
    gst: "₹630",
    discount: "",
    total: "₹4,128",
    address: "Rahul Sharma, 42 MG Road, Bangalore, Karnataka 560001",
    orderUrl: "#"
  },
  payment_received: { name: "Priya Patel", orderNumber: "LEA26090002", amount: "₹2,999", paymentMethod: "Razorpay", orderUrl: "#" },
  order_packed: { name: "Amit Kumar", orderNumber: "LEA26090003", orderUrl: "#" },
  order_shipped: { name: "Neha Gupta", orderNumber: "LEA26090004", courier: "Delhivery", trackingId: "DLV123456789", trackingUrl: "https://www.delhivery.com/track/package/DLV123456789", orderUrl: "#" },
  order_delivered: { name: "Vikram Singh", orderNumber: "LEA26090005", orderUrl: "#", feedbackUrl: "/feedback" },
  order_cancelled: { name: "Sanjay Mehta", orderNumber: "LEA26090006", reason: "Out of stock", orderUrl: "#" },
  feedback_received: { name: "Anjali Reddy", topic: "Product Quality", message: "The leather wallet I received is absolutely stunning. The craftsmanship is top-notch!" },
  return_requested: { name: "Rohit Verma", orderNumber: "LEA26090007", orderUrl: "#" }
};

const BASE_LAYOUT_HEADER = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Edwin Leathers</title></head>
<body style="margin:0;padding:0;background-color:#f5f0eb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f0eb;padding:20px 0;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;max-width:600px;">
<tr><td style="background-color:#3c2415;padding:24px 32px;text-align:center;">
<h1 style="color:#d4a843;margin:0;font-size:24px;letter-spacing:2px;">EDWIN LEATHERS</h1>
<p style="color:#c4a882;margin:4px 0 0;font-size:12px;letter-spacing:1px;">HANDCRAFTED LEATHER GOODS</p>
</td></tr>
<tr><td style="padding:32px;">`;

const BASE_LAYOUT_FOOTER = `</td></tr>
<tr><td style="background-color:#f5f0eb;padding:24px 32px;text-align:center;border-top:1px solid #e8ddd0;">
<p style="color:#8b7355;margin:0 0 8px;font-size:12px;">EDWIN Leather Store</p>
<p style="color:#8b7355;margin:0 0 4px;font-size:12px;">Support: Support.edwinleather@gmail.com</p>
<p style="color:#8b7355;margin:0 0 4px;font-size:12px;">Phone: +91 98978 63824</p>
<p style="color:#a89880;margin:16px 0 0;font-size:11px;">This is a transactional email regarding your order.</p>
</td></tr>
</table></td></tr></table></body></html>`;

function substituteVars(html: string, vars: Record<string, string>): string {
  let result = html;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{{${key}}}`, value);
  }
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_match, varName, content) => {
    return vars[varName] ? content : "";
  });
  return result;
}

export function EmailTemplatesManager() {
  const [templates, setTemplates] = useState<Record<TemplateKey, string> | null>(null);
  const [active, setActive] = useState<TemplateKey>("order_confirmation");
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [view, setView] = useState<"code" | "preview">("code");
  const [dirty, setDirty] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/admin/email-templates`, { credentials: "include" });
      const body = await res.json();
      if (!res.ok) return setError(body?.error || "Could not load templates");
      setTemplates(body.data);
      setEditValue(body.data[active] || "");
      setDirty(false);
    } catch {
      setError("Could not load templates");
    } finally {
      setLoading(false);
    }
  }, [active]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (templates) {
      setEditValue(templates[active] || "");
      setDirty(false);
    }
  }, [active, templates]);

  const previewHtml = useMemo(() => {
    const vars = SAMPLE_DATA[active] || {};
    const inner = substituteVars(editValue, vars);
    return BASE_LAYOUT_HEADER + inner + BASE_LAYOUT_FOOTER;
  }, [editValue, active]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API}/admin/email-templates`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [active]: editValue })
      });
      const body = await res.json();
      if (!res.ok) return setError(body?.error || "Could not save template");
      setSuccess("Template saved");
      setDirty(false);
      setTemplates((prev) => prev ? { ...prev, [active]: editValue } : prev);
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Could not save template");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm("Reset this template to the default? Your changes will be lost.")) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`${API}/admin/email-templates/reset`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: active })
      });
      const body = await res.json();
      if (!res.ok) return setError(body?.error || "Could not reset template");
      await load();
      setSuccess("Template reset to default");
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError("Could not reset template");
    } finally {
      setSaving(false);
    }
  };

  const meta = TEMPLATE_META[active];

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div>
          <span className="eyebrow">Communication</span>
          <h1>Email Templates</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="button button--ghost button--small" onClick={load} disabled={loading}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </header>

      {error && <p className="admin-empty" style={{ color: "#d32f2f" }}><TriangleAlert size={14} /> {error}</p>}
      {success && <p className="admin-empty" style={{ color: "#2e7d32" }}>✓ {success}</p>}

      <div style={{ display: "flex", gap: 16, minHeight: 500 }}>
        {/* Template list sidebar */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {(Object.keys(TEMPLATE_META) as TemplateKey[]).map((key) => (
              <button
                key={key}
                onClick={() => { if (dirty && !confirm("Unsaved changes will be lost. Continue?")) return; setActive(key); }}
                style={{
                  textAlign: "left",
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: active === key ? 600 : 400,
                  backgroundColor: active === key ? "#3c2415" : "transparent",
                  color: active === key ? "#fff" : "#3c2415",
                  transition: "all 0.15s"
                }}
              >
                {TEMPLATE_META[key].label}
                {dirty && active === key && <span style={{ marginLeft: 4, fontSize: 10 }}>●</span>}
              </button>
            ))}
          </div>

          {/* Variable reference */}
          <div style={{ marginTop: 16, padding: 12, background: "#f5f0eb", borderRadius: 6 }}>
            <p style={{ margin: "0 0 8px", fontSize: 12, fontWeight: 600, color: "#3c2415" }}>Variables</p>
            {meta.variables.map((v) => (
              <code key={v} style={{ display: "block", fontSize: 11, color: "#8b7355", marginBottom: 2, cursor: "pointer" }}
                onClick={() => {
                  setEditValue((prev) => prev + `{{${v}}}`);
                  setDirty(true);
                }}
                title={`Click to insert {{${v}}}`}
              >
                {`{{${v}}}`}
              </code>
            ))}
            <p style={{ margin: "8px 0 0", fontSize: 10, color: "#a89880" }}>Click to insert into template</p>
          </div>
        </div>

        {/* Editor + Preview */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Toolbar */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <div className="admin-tabs" style={{ marginBottom: 0 }}>
              <button className={view === "code" ? "active" : ""} onClick={() => setView("code")}><Code size={14} /> Code</button>
              <button className={view === "preview" ? "active" : ""} onClick={() => setView("preview")}><Eye size={14} /> Preview</button>
            </div>
            <div style={{ flex: 1 }} />
            <button className="button button--ghost button--small" onClick={handleReset} disabled={saving || loading}>
              <RotateCcw size={14} /> Reset
            </button>
            <button className="button button--primary button--small" onClick={handleSave} disabled={saving || loading || !dirty}>
              {saving ? <Loader2 size={14} className="spin" /> : <Save size={14} />} Save
            </button>
          </div>

          {/* Content area */}
          {loading ? (
            <p className="admin-empty"><Loader2 size={18} className="spin" /> Loading templates…</p>
          ) : view === "code" ? (
            <textarea
              value={editValue}
              onChange={(e) => { setEditValue(e.target.value); setDirty(true); }}
              spellCheck={false}
              style={{
                flex: 1,
                width: "100%",
                minHeight: 400,
                fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace",
                fontSize: 13,
                lineHeight: 1.6,
                padding: 16,
                border: "1px solid #e8ddd0",
                borderRadius: 6,
                backgroundColor: "#faf8f5",
                color: "#3c2415",
                resize: "vertical",
                outline: "none",
                tabSize: 2
              }}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const target = e.target as HTMLTextAreaElement;
                  const start = target.selectionStart;
                  const end = target.selectionEnd;
                  const newValue = editValue.substring(0, start) + "  " + editValue.substring(end);
                  setEditValue(newValue);
                  setDirty(true);
                  setTimeout(() => { target.selectionStart = target.selectionEnd = start + 2; }, 0);
                }
              }}
            />
          ) : (
            <div
              style={{
                flex: 1,
                minHeight: 400,
                border: "1px solid #e8ddd0",
                borderRadius: 6,
                backgroundColor: "#fff",
                overflow: "auto"
              }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
