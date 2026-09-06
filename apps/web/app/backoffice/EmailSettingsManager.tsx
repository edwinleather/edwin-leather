"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Plus, Save, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type EmailConfig = {
  ccEmails: string[];
  ccTypes: string[];
};

const EMAIL_TYPE_LABELS: Record<string, string> = {
  order_confirmation: "Order Confirmation (received by customer)",
  payment_received: "Payment Received",
  order_packed: "Order Packed",
  order_shipped: "Order Shipped",
  order_delivered: "Order Delivered",
  order_cancelled: "Order Cancelled",
  return_requested: "Return Requested",
  feedback_received: "Feedback Received"
};

const DEFAULT_CC_TYPES = [
  "order_confirmation",
  "payment_received",
  "order_packed",
  "order_shipped",
  "order_delivered",
  "order_cancelled",
  "return_requested"
];

export function EmailSettingsManager() {
  const [ccEmails, setCcEmails] = useState<string[]>(["shuzaurrehman786@gmail.com"]);
  const [ccTypes, setCcTypes] = useState<string[]>(DEFAULT_CC_TYPES);
  const [emailInput, setEmailInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/admin/email-config`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => {
        if (body?.ok && body.data) {
          const data = body.data as EmailConfig;
          setCcEmails(data.ccEmails.length ? data.ccEmails : ["shuzaurrehman786@gmail.com"]);
          setCcTypes(data.ccTypes.length ? data.ccTypes : DEFAULT_CC_TYPES);
        }
      })
      .catch(() => setError("Could not load email notification settings."))
      .finally(() => setLoading(false));
  }, []);

  function addEmail() {
    const value = emailInput.trim().toLowerCase();
    if (!value) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError("Enter a valid email address.");
      return;
    }
    if (ccEmails.includes(value)) {
      setError("That email is already in the list.");
      return;
    }
    setCcEmails((current) => [...current, value]);
    setEmailInput("");
    setError(null);
  }

  function removeEmail(email: string) {
    setCcEmails((current) => current.filter((item) => item !== email));
  }

  function toggleType(type: string) {
    setCcTypes((current) => (current.includes(type) ? current.filter((item) => item !== type) : [...current, type]));
  }
async function handleSave() {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch(`${API}/admin/email-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ccEmails, ccTypes })
      });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        setError(body?.error || "Could not save email notification settings.");
        return;
      }
      setMessage({ ok: true, text: "Email notification settings saved." });
    } catch {
      setError("Could not reach the admin service.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="muted">Loading email notification settings…</p>;

  return (
    <section className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Email notifications</span><h2>CC recipients for order emails</h2></div>
        <button className="button button--dark" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />} {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <p className="delivery-config-hint">
        When a customer email goes out (order received, payment received, packing, shipping, delivery, cancellation or return), the addresses below receive a CC copy so your team can track every order.
      </p>

      {error && <p className="auth-error">{error}</p>}

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#3c2415", marginBottom: 8 }}>CC email addresses</div>
        <div className="email-config-cc-list">
          {ccEmails.length === 0 && <p className="muted">No CC addresses. Everyone below will be skipped — only the customer email is sent.</p>}
          {ccEmails.map((email) => (
            <span key={email} className="email-config-chip">
              {email}
              <button type="button" onClick={() => removeEmail(email)} aria-label={`Remove ${email}`}><X size={12} /></button>
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10, maxWidth: 420 }}>
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addEmail(); } }}
            placeholder="add@email.com"
            style={{ flex: 1, padding: "10px 12px", border: "1px solid #e8ddd0", borderRadius: 6, fontSize: 14, background: "#fff" }}
          />
          <button type="button" className="button button--ghost button--small" onClick={addEmail}><Plus size={14} /> Add</button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#3c2415", marginBottom: 8 }}>Which emails are CC&rsquo;d</div>
        <div className="email-config-type-grid">
          {Object.entries(EMAIL_TYPE_LABELS).map(([type, label]) => (
            <label key={type} className="toggle-row" style={{ padding: "10px 0" }}>
              <input type="checkbox" checked={ccTypes.includes(type)} onChange={() => toggleType(type)} />
              <div><strong>{label}</strong></div>
            </label>
          ))}
        </div>
      </div>

      {message && <p className={message.ok ? "delivery-message is-ok" : "delivery-message is-error"}><Check size={14} /> {message.text}</p>}
    </section>
  );
}