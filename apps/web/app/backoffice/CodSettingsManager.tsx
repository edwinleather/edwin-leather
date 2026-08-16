"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { adminGetCod, adminSaveCod } from "@/lib/api";

export function CodSettingsManager() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    adminGetCod().then((data) => {
      if (data) setEnabled(Boolean(data.enabled));
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const result = await adminSaveCod({ enabled });
    setSaving(false);
    setMessage(result.ok ? { ok: true, text: "COD settings saved." } : { ok: false, text: result.error || "Could not save COD settings." });
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Payments</span><h2>Cash on Delivery</h2></div>
        <button className="button button--dark" onClick={handleSave} disabled={saving || loading}>
          {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />} {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <label className="toggle-row">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <div>
          <strong>Accept Cash on Delivery</strong>
          <span>When enabled, customers can pay on delivery. This overrides the per-product COD setting - if this is off, no product can be ordered with COD.</span>
        </div>
      </label>

      <p className="delivery-config-hint">
        {enabled
          ? 'COD is enabled globally. Individual products can still opt out with their own "COD available" setting in the product editor.'
          : "COD is disabled for the whole store. The per-product COD setting is ignored until this is turned back on."}
      </p>

      {message && <p className={message.ok ? "delivery-message is-ok" : "delivery-message is-error"}><Check size={14} /> {message.text}</p>}
    </section>
  );
}