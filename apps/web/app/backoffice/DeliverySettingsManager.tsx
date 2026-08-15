"use client";

import { useEffect, useState } from "react";
import { Check, Loader2, Save } from "lucide-react";
import { adminGetDelivery, adminSaveDelivery, type DeliveryConfig } from "@/lib/api";
import { INDIAN_STATES, DEFAULT_DELIVERY_CONFIG } from "@/lib/delivery";

export function DeliverySettingsManager() {
  const [config, setConfig] = useState<DeliveryConfig>(DEFAULT_DELIVERY_CONFIG);
  const [fees, setFees] = useState<Record<string, number>>({});
  const [threshold, setThreshold] = useState(String(DEFAULT_DELIVERY_CONFIG.freeDeliveryThreshold));
  const [defaultFee, setDefaultFee] = useState(String(DEFAULT_DELIVERY_CONFIG.defaultFee));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    adminGetDelivery().then((data) => {
      if (data) {
        setConfig(data);
        setThreshold(String(data.freeDeliveryThreshold));
        setDefaultFee(String(data.defaultFee));
        const map: Record<string, number> = {};
        for (const entry of data.stateFees) map[entry.state] = entry.fee;
        setFees(map);
      }
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    const stateFees = INDIAN_STATES.map((state) => ({ state, fee: Math.max(0, Math.round(Number(fees[state]) || 0)) }));
    const result = await adminSaveDelivery({
      defaultFee: Math.max(0, Math.round(Number(defaultFee) || 0)),
      freeDeliveryThreshold: Math.max(0, Math.round(Number(threshold) || 0)),
      stateFees
    });
    setSaving(false);
    setMessage(result.ok ? { ok: true, text: "Delivery settings saved." } : { ok: false, text: result.error || "Could not save delivery settings." });
  }

  return (
    <section className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Operations</span><h2>Delivery fee</h2></div>
        <button className="button button--dark" onClick={handleSave} disabled={saving || loading}>
          {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />} {saving ? "Saving…" : "Save changes"}
        </button>
      </div>

      <div className="delivery-config-grid">
        <label>Default delivery fee (all states)
          <input type="number" min={0} value={defaultFee} onChange={(e) => setDefaultFee(e.target.value)} />
        </label>
        <label>Free delivery threshold (₹)
          <input type="number" min={0} value={threshold} onChange={(e) => setThreshold(e.target.value)} />
        </label>
      </div>
      <p className="delivery-config-hint">Orders equal to or above {threshold || "—"} receive free delivery. Below it, the per-state fee below applies (default {defaultFee || "—"} where a state is not listed).</p>

      <div className="admin-table-wrap delivery-table-wrap">
        <table className="admin-table">
          <thead><tr><th>State</th><th>Delivery fee (₹)</th></tr></thead>
          <tbody>
            {INDIAN_STATES.map((state) => (
              <tr key={state}>
                <td>{state}</td>
                <td className="delivery-fee-cell">
                  <input type="number" min={0} value={fees[state] ?? ""} placeholder="—" onChange={(e) => setFees((current) => ({ ...current, [state]: Number(e.target.value) }))} />
                  {config.stateFees.some((entry) => entry.state === state) && <small>custom</small>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {message && <p className={message.ok ? "delivery-message is-ok" : "delivery-message is-error"}><Check size={14} /> {message.text}</p>}
    </section>
  );
}