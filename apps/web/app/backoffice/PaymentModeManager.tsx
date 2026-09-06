"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Check, Loader2, Shield, TestTube } from "lucide-react";
import { adminGetPaymentMode, adminSavePaymentMode, type PaymentModeData } from "@/lib/api";

export function PaymentModeManager({ role }: { role: string }) {
  const [data, setData] = useState<PaymentModeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmLive, setConfirmLive] = useState(false);

  const isSuperadmin = role === "superadmin";

  useEffect(() => {
    adminGetPaymentMode().then((d) => {
      if (d) setData(d);
      setLoading(false);
    });
  }, []);

  async function handleSwitch(mode: "test" | "live") {
    if (mode === "live" && !confirmLive) {
      setConfirmLive(true);
      return;
    }
    setSaving(true);
    setMessage(null);
    setConfirmLive(false);
    const result = await adminSavePaymentMode(mode);
    setSaving(false);
    if (result.ok && result.data) {
      setData(result.data);
      setMessage({ ok: true, text: `Switched to ${mode} mode.` });
    } else {
      setMessage({ ok: false, text: result.error || "Could not save payment mode." });
    }
  }

  if (loading) {
    return (
      <section className="admin-panel">
        <div className="admin-panel__head">
          <div><span className="eyebrow">Payments</span><h2>Payment Mode</h2></div>
        </div>
        <p className="muted"><Loader2 size={15} className="spin" /> Loading…</p>
      </section>
    );
  }

  const mode = data?.mode ?? "test";
  const keyPreview = data?.keyPreview ?? "not configured";

  return (
    <section className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Payments</span><h2>Payment Mode</h2></div>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button
          type="button"
          className={`button ${mode === "test" ? "button--dark" : "button--ghost"}`}
          disabled={saving || !isSuperadmin}
          onClick={() => handleSwitch("test")}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
        >
          <TestTube size={16} />
          <div style={{ textAlign: "left" }}>
            <strong>Test Mode</strong>
            <span style={{ display: "block", fontSize: 12, opacity: 0.7 }}>Sandbox payments</span>
          </div>
        </button>
        <button
          type="button"
          className={`button ${mode === "live" ? "button--dark" : "button--ghost"}`}
          disabled={saving || !isSuperadmin}
          onClick={() => handleSwitch("live")}
          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, ...(mode === "live" ? { backgroundColor: "#c0392b", borderColor: "#c0392b" } : {}) }}
        >
          <Shield size={16} />
          <div style={{ textAlign: "left" }}>
            <strong>Live Mode</strong>
            <span style={{ display: "block", fontSize: 12, opacity: 0.7 }}>Real payments</span>
          </div>
        </button>
      </div>

      {mode === "live" && (
        <div style={{ background: "#fdf2f2", border: "1px solid #f5c6cb", borderRadius: 8, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
          <Shield size={18} style={{ color: "#c0392b", flexShrink: 0 }} />
          <div>
            <strong style={{ color: "#c0392b" }}>Live mode active</strong>
            <span style={{ display: "block", fontSize: 13, color: "#721c24" }}>All payments are real. Razorpay will process actual charges.</span>
          </div>
        </div>
      )}

      {confirmLive && (
        <div style={{ background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 8, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <AlertTriangle size={16} style={{ color: "#856404" }} />
            <strong style={{ color: "#856404" }}>Switch to live mode?</strong>
          </div>
          <p style={{ margin: 0, fontSize: 13, color: "#856404", lineHeight: 1.5 }}>
            This will use your real Razorpay keys. Customers will be charged real money.
            Are you sure you want to proceed?
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button className="button button--dark" disabled={saving} onClick={() => handleSwitch("live")} style={{ background: "#c0392b", borderColor: "#c0392b" }}>
              {saving ? <Loader2 size={14} className="spin" /> : <Shield size={14} />} Yes, go live
            </button>
            <button className="button button--ghost" disabled={saving} onClick={() => setConfirmLive(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div style={{ background: "#faf8f5", border: "1px solid #f0e8dd", borderRadius: 8, padding: "12px 16px", marginBottom: 12 }}>
        <p style={{ margin: 0, fontSize: 13, color: "#8b7355" }}>
          <strong>Active key:</strong> {keyPreview}
        </p>
        <p style={{ margin: 0, fontSize: 13, color: "#8b7355", marginTop: 4 }}>
          <strong>Mode:</strong> {mode === "test" ? "Test (sandbox)" : "Live (production)"}
        </p>
      </div>

      {!isSuperadmin && (
        <p className="delivery-config-hint">Only superadmins can switch payment mode.</p>
      )}

      {message && <p className={message.ok ? "delivery-message is-ok" : "delivery-message is-error"}><Check size={14} /> {message.text}</p>}
    </section>
  );
}
