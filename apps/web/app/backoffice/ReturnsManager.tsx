"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { formatPrice } from "@/lib/format";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type ReturnRow = {
  _id: string;
  returnNumber: string;
  email: string;
  orderId: string;
  reason: string;
  notes?: string;
  status: string;
  refundAmount?: number;
  adminNote?: string;
  items?: { nameSnapshot?: string; quantity: number }[];
  createdAt?: string;
};

function statusLabel(s: string) {
  return s.replace(/_/g, " ");
}

export function ReturnsManager({ mode = "returns" }: { mode?: "returns" | "refunds" }) {
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refunds, setRefunds] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/returns`, { credentials: "include" });
      const body = await res.json();
      if (!res.ok) return setError(body?.error || "Could not load returns");
      setRows(body.data ?? []);
    } catch {
      setError("Could not load returns");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = query.trim().toLowerCase();
  const modeFiltered = mode === "refunds" ? rows.filter((r) => ["approved", "refund_pending", "refunded"].includes(r.status)) : rows;
  const filtered = modeFiltered.filter(
    (r) => !q || r.returnNumber.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q) || (r.items?.[0]?.nameSnapshot ?? "").toLowerCase().includes(q)
  );

  async function act(record: ReturnRow, action: string) {
    setBusyId(record._id);
    setError(null);
    const payload: Record<string, unknown> = { action };
    if (action === "refunded" || action === "refund_pending") {
      const amount = Number(refunds[record._id]);
      if (action === "refunded" && (!amount || amount <= 0)) {
        setBusyId(null);
        return setError("Enter a refund amount before refunding.");
      }
      if (amount > 0) payload.refundAmount = amount;
    }
    const res = await fetch(`${API}/admin/returns/${record._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const body = await res.json().catch(() => null);
    setBusyId(null);
    if (!res.ok) return setError(body?.error || "Could not update return");
    load();
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Customer support</span><h2>{mode === "refunds" ? "Refunds" : "Returns & refunds"}</h2></div>
        <button className="button button--ghost" onClick={load} disabled={loading}>Refresh</button>
      </div>

      <label className="order-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search return #, email, item or reason" /></label>

      {error && <p className="auth-error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Return</th><th>Order</th><th>Customer</th><th>Item</th><th>Reason</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="muted">Loading returns…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={7} className="muted">No {mode === "refunds" ? "refunds" : "returns"} found.</td></tr>}
            {filtered.map((r) => (
              <tr key={r._id}>
                <td><strong>{r.returnNumber}</strong></td>
                <td>{r.orderId.slice(-8).toUpperCase()}</td>
                <td>{r.email}</td>
                <td>{r.items?.[0]?.nameSnapshot || "-"}</td>
                <td>{r.reason}</td>
                <td><span className={`status ${r.status === "returned" || r.status === "refunded" ? "status--confirmed" : ""}`}>{statusLabel(r.status)}</span></td>
                <td style={{ textAlign: "right" }}>
                  <ReturnActions record={r} busy={busyId === r._id} onAct={act} refund={refunds[r._id] ?? ""} onRefund={(v) => setRefunds((m) => ({ ...m, [r._id]: v }))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReturnActions({ record, busy, onAct, refund, onRefund }: { record: ReturnRow; busy: boolean; onAct: (r: ReturnRow, action: string) => void; refund: string; onRefund: (v: string) => void }) {
  const s = record.status;
  const needsRefund = s === "approved" || s === "refund_pending";
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap", alignItems: "center" }}>
      {s === "requested" && <><button className="text-button" onClick={() => onAct(record, "approve")}>Approve</button><button className="text-button" style={{ color: "var(--danger, #b91c1c)" }} onClick={() => onAct(record, "reject")}>Reject</button></>}
      {s === "approved" && <button className="text-button" onClick={() => onAct(record, "returned")}>Mark returned</button>}
      {needsRefund && (
        <>
          <input type="number" min="0" placeholder="Refund ₹" value={refund} onChange={(e) => onRefund(e.target.value)} style={{ width: 120, height: 36, border: "1px solid var(--line)", borderRadius: 8, padding: "0 10px", fontSize: 13 }} />
          <button className="text-button" disabled={busy} onClick={() => onAct(record, "refund_pending")}>{busy ? <Loader2 size={13} className="spin" /> : null} Refund</button>
          <button className="text-button" style={{ color: "var(--danger, #b91c1c)" }} disabled={busy} onClick={() => onAct(record, "refunded")}>Confirm refund</button>
        </>
      )}
      {s === "returned" && <button className="text-button" onClick={() => onAct(record, "refund_pending")}>Refund</button>}
      {record.refundAmount ? <span className="muted" style={{ fontSize: 11 }}>{formatPrice(record.refundAmount)}</span> : null}
    </div>
  );
}