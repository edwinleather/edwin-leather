"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { adminGetTax, adminSaveTax, type TaxConfig } from "@/lib/api";
import { DEFAULT_TAX_CONFIG } from "@/lib/tax";

export function TaxSettingsManager() {
  const [rate, setRate] = useState(String(DEFAULT_TAX_CONFIG.gstRate));
  const [freeAbove, setFreeAbove] = useState(String(DEFAULT_TAX_CONFIG.gstFreeAbove));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    adminGetTax().then((data) => {
      if (data) {
        setRate(String(data.gstRate));
        setFreeAbove(String(data.gstFreeAbove));
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await adminSaveTax({
      gstRate: Math.max(0, Math.min(100, Math.round(Number(rate) || 0))),
      gstFreeAbove: Math.max(0, Math.round(Number(freeAbove) || 0))
    });
    setSaving(false);
    setMessage(result.ok ? { ok: true, text: "GST settings saved." } : { ok: false, text: result.error || "Could not save GST settings." });
  }

  const parsedRate = Math.round(Number(rate) || 0);
  const parsedFree = Math.round(Number(freeAbove) || 0);

  return (
    <section className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Pricing</span><h2>GST (tax)</h2></div>
        <button className="button button--dark" onClick={handleSave} disabled={saving || loading}>
          {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />} {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <div className="delivery-config-grid">
        <label>GST rate (%)
          <input type="number" min={0} max={100} value={rate} onChange={(e) => setRate(e.target.value)} />
        </label>
        <label>GST free above (₹) — 0 = always charge GST
          <input type="number" min={0} value={freeAbove} onChange={(e) => setFreeAbove(e.target.value)} />
        </label>
      </div>
      <p className="delivery-config-hint">
        {parsedRate > 0
          ? `GST of ${parsedRate}% is added to every order${parsedFree > 0 ? `, unless the subtotal is ₹${parsedFree} or more (then no GST applies)` : " (no free-above threshold set)"}.`
          : "Set a GST rate above to charge tax on orders."}
      </p>

      {message && <p className={message.ok ? "delivery-message is-ok" : "delivery-message is-error"}><Check size={14} /> {message.text}</p>}
    </section>
  );
}