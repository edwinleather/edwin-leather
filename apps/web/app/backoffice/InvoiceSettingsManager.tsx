"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type InvoiceSettings = {
  companyName: string;
  gstin: string;
  cin: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  invoicePrefix: string;
  orderPrefix: string;
  note: string;
};

const EMPTY: InvoiceSettings = { companyName: "", gstin: "", cin: "", address: "", city: "", state: "", postalCode: "", phone: "", email: "", website: "", invoicePrefix: "INV-", orderPrefix: "LEA", note: "This is a computer-generated tax invoice and does not require a physical signature." };

export function InvoiceSettingsManager() {
  const [form, setForm] = useState<InvoiceSettings>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch(`${API}/admin/invoice-settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => {
        if (body.ok) setForm({ ...EMPTY, ...(body.data ?? {}) });
      })
      .finally(() => setLoaded(true));
  }, []);

  const set = (key: keyof InvoiceSettings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`${API}/admin/invoice-settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form)
    });
    const body = await res.json().catch(() => null);
    setSaving(false);
    setMessage(res.ok ? { ok: true, text: "Invoice details saved. They appear on every printed invoice." } : { ok: false, text: body?.error || "Could not save." });
  }

  if (!loaded) return <p className="muted">Loading invoice details…</p>;

  return (
    <section className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Seller / company</span><h2>Invoice details</h2></div>
        <button className="button button--dark" onClick={save} disabled={saving}><Save size={15} /> {saving ? "Saving…" : "Save"}</button>
      </div>
      <p className="delivery-config-hint">These appear as the <strong>Ship from</strong> address and footer on every invoice you print. GSTIN, CIN, and HSN codes come from here and your products. The invoice and order prefixes control the numbering on every invoice and order you generate.</p>

      <div className="form-grid">
        <label className="field-wide">Company name <input value={form.companyName} onChange={set("companyName")} placeholder="Edwin Leathers" /></label>
        <label>GSTIN <input value={form.gstin} onChange={set("gstin")} placeholder="e.g. 09ABCDE1234F1Z5" /></label>
        <label>CIN <input value={form.cin} onChange={set("cin")} placeholder="Optional" /></label>
        <label>Invoice number prefix <input value={form.invoicePrefix} onChange={set("invoicePrefix")} placeholder="INV-" /></label>
        <label>Order number prefix <input value={form.orderPrefix} onChange={set("orderPrefix")} placeholder="LEA" /></label>
        <label className="field-wide">Address <textarea rows={2} value={form.address} onChange={set("address")} placeholder="Street / locality" /></label>
        <label>City <input value={form.city} onChange={set("city")} /></label>
        <label>State <input value={form.state} onChange={set("state")} /></label>
        <label>Postal code <input value={form.postalCode} onChange={set("postalCode")} /></label>
        <label>Phone <input value={form.phone} onChange={set("phone")} /></label>
        <label>Email <input value={form.email} onChange={set("email")} /></label>
        <label className="field-wide">Website <input value={form.website} onChange={set("website")} /></label>
        <label className="field-wide">Invoice footer note <textarea rows={2} value={form.note} onChange={set("note")} placeholder="This is a computer-generated tax invoice and does not require a physical signature." /></label>
      </div>
      {message && <p className={message.ok ? "ok-note" : "auth-error"} style={{ marginTop: 16 }}>{message.text}</p>}
    </section>
  );
}