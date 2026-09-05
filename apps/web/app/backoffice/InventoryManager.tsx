"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Boxes, History, Loader2, PackageX, Search, Save, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type Row = {
  kind: "variant" | "legacy";
  variantId: string;
  productId: string;
  productName: string;
  slug: string;
  active: boolean;
  sku: string;
  label: string;
  color: string;
  size: string;
  available: number;
  reserved: number;
  damaged: number;
  store: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
};

type Draft = {
  total: string;
  store: string;
  damaged: string;
  threshold: string;
  backorder: boolean;
};

type LogEntry = {
  id: string;
  type: string;
  quantity: number;
  note: string;
  referenceId: string;
  createdAt: string;
};

export function InventoryManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [history, setHistory] = useState<{ row: Row; logs: LogEntry[] } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/inventory`, { credentials: "include" });
      const body = await res.json();
      if (!res.ok) return setError(body?.error || "Could not load inventory");
      const data = (body.data ?? []) as Row[];
      setRows(data);
      const map: Record<string, Draft> = {};
      for (const row of data) {
        const total = row.kind === "legacy"
          ? row.available + row.reserved + (row.store ?? 0) + (row.damaged ?? 0)
          : row.available + row.reserved + (row.damaged ?? 0);
        map[row.variantId] = {
          total: String(total),
          store: String(row.store ?? 0),
          damaged: String(row.damaged ?? 0),
          threshold: String(row.lowStockThreshold ?? 3),
          backorder: Boolean(row.allowBackorder)
        };
      }
      setDrafts(map);
    } catch {
      setError("Could not load inventory");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function setDraft(id: string, patch: Partial<Draft>) {
    setDrafts((d) => ({ ...d, [id]: { ...(d[id] as Draft), ...patch } }));
    setDirty((m) => ({ ...m, [id]: true }));
  }

  async function save(row: Row) {
    const draft = drafts[row.variantId];
    setSaving(row.variantId);
    setError(null);
    const body =
      row.kind === "variant"
        ? {
            kind: "variant",
            inventoryTotal: Math.max(0, Number(draft.total) || 0),
            damaged: Math.max(0, Number(draft.damaged) || 0),
            lowStockThreshold: Math.max(0, Number(draft.threshold) || 0),
            allowBackorder: draft.backorder
          }
        : {
            kind: "legacy",
            inventoryTotal: Math.max(0, Number(draft.total) || 0),
            inventoryStoreAllocated: Math.max(0, Number(draft.store) || 0),
            lowStockThreshold: Math.max(0, Number(draft.threshold) || 0),
            allowBackorder: draft.backorder
          };
    const res = await fetch(`${API}/admin/inventory/${row.productId}/${row.variantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });
    const parsed = await res.json().catch(() => null);
    setSaving(null);
    if (!res.ok) return setError(parsed?.error || "Could not update stock");
    load();
  }

  async function openHistory(row: Row) {
    setHistoryLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/admin/inventory/${row.variantId}/logs`, { credentials: "include" });
      const body = await res.json();
      if (!res.ok) return setError(body?.error || "Could not load history");
      setHistory({ row, logs: (body.data ?? []) as LogEntry[] });
    } catch {
      setError("Could not load history");
    } finally {
      setHistoryLoading(false);
    }
  }

  const q = query.trim().toLowerCase();
  const filtered = rows.filter(
    (r) => !q || r.productName.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q) || r.label.toLowerCase().includes(q)
  );

  const totalUnits = rows.reduce((sum, r) => sum + r.available + r.reserved + r.damaged, 0);
  const lowCount = rows.filter((r) => r.active && r.available <= r.lowStockThreshold).length;
  const outCount = rows.filter((r) => r.active && r.available <= 0 && !r.allowBackorder).length;
  const reservedCount = rows.reduce((sum, r) => sum + r.reserved, 0);

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Stock</span><h2>Inventory</h2></div>
        <button className="button button--ghost" onClick={load} disabled={loading}>{loading ? <Loader2 size={14} className="spin" /> : null} Refresh</button>
      </div>

      <div className="admin-kpis inventory-kpis">
        <div className="kpi"><span><Boxes size={18} /> Total units</span><strong>{totalUnits}</strong></div>
        <div className="kpi"><span><AlertTriangle size={18} /> Low stock</span><strong>{lowCount}</strong></div>
        <div className="kpi"><span><PackageX size={18} /> Out of stock</span><strong>{outCount}</strong></div>
        <div className="kpi"><span><Loader2 size={18} /> Reserved (carts)</span><strong>{reservedCount}</strong></div>
      </div>

      <div className="inventory-note">
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
          <strong>Total stock</strong> is your full physical count. <strong>Damaged</strong> units are set aside and not sellable. <strong>Available</strong> is what your website can sell now (= total − damaged − reserved). <strong>Reserved</strong> is stock locked by carts/pending orders and updates automatically at checkout. Enable <strong>backorder</strong> to keep selling once Available hits zero.
        </p>
      </div>

      <label className="order-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product, SKU or option" /></label>

      {error && <p className="auth-error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table inventory-table">
          <thead><tr><th>Product / SKU</th><th>Total stock</th>{filtered.some((r) => r.kind === "legacy") && <th>Store</th>}<th>Damaged</th><th>Available</th><th>Reserved</th><th>Low at</th><th>Backorder</th><th style={{ textAlign: "right" }}>Status</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={9} className="muted">Loading inventory…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={9} className="muted">No inventory found.</td></tr>}
            {filtered.map((row) => {
              const d = drafts[row.variantId] as Draft;
              const isVariant = row.kind === "variant";
              const available = Math.max(0, (Number(d.total) || 0) - (isVariant ? Number(d.damaged) || 0 : Number(d.store) || 0) - (row.reserved ?? 0));
              const low = available <= (Number(d.threshold) || 0);
              const out = available <= 0 && !d.backorder;
              return (
                <tr key={row.variantId} className={!row.active ? "row-hidden" : ""}>
                  <td>
                    <strong>{row.productName}</strong>
                    <span className="muted" style={{ display: "block", fontSize: 11 }}>
                      {row.label} · {row.sku} {isVariant && <span className="variant-tag">SKU</span>}
                    </span>
                  </td>
                  <td><input type="number" min="0" value={d.total} onChange={(e) => setDraft(row.variantId, { total: e.target.value })} /></td>
                  {filtered.some((r) => r.kind === "legacy") && <td>{isVariant ? <span className="muted">—</span> : <input type="number" min="0" value={d.store} onChange={(e) => setDraft(row.variantId, { store: e.target.value })} />}</td>}
                  <td>{isVariant ? <input type="number" min="0" value={d.damaged} onChange={(e) => setDraft(row.variantId, { damaged: e.target.value })} /> : <span className="muted">—</span>}</td>
                  <td><strong className={out ? "stock-out" : low ? "stock-low" : ""}>{available}</strong></td>
                  <td className="muted">{row.reserved ?? 0}</td>
                  <td><input type="number" min="0" value={d.threshold} onChange={(e) => setDraft(row.variantId, { threshold: e.target.value })} /></td>
                  <td><input type="checkbox" className="toggle-input" checked={d.backorder} onChange={(e) => setDraft(row.variantId, { backorder: e.target.checked })} /></td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <span className={`status ${low ? "status--pending" : "status--confirmed"}`}>{out ? "Out" : low ? "Low" : row.active ? "In stock" : "Hidden"}</span>
                    <button className="text-button" title="History" onClick={() => openHistory(row)}><History size={13} /></button>
                    {dirty[row.variantId] && <button className="text-button" onClick={() => save(row)} disabled={saving === row.variantId}>{saving === row.variantId ? <Loader2 size={13} className="spin" /> : <Save size={13} />} Save</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {history && (
        <div className="modal-backdrop" onClick={() => setHistory(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-card__head">
              <div><span className="eyebrow">Stock movement</span><h3>{history.row.label || history.row.sku}</h3></div>
              <button className="icon-button" onClick={() => setHistory(null)}><X size={16} /></button>
            </div>
            {historyLoading ? (
              <p className="muted" style={{ padding: 12 }}>Loading…</p>
            ) : history.logs.length === 0 ? (
              <p className="muted" style={{ padding: 12 }}>No stock movements recorded yet.</p>
            ) : (
              <div className="admin-table-wrap" style={{ maxHeight: 360, overflowY: "auto" }}>
                <table className="admin-table">
                  <thead><tr><th>Date</th><th>Type</th><th>Qty</th><th>Reference</th><th>Note</th></tr></thead>
                  <tbody>
                    {history.logs.map((log) => (
                      <tr key={log.id}>
                        <td className="muted">{new Date(log.createdAt).toLocaleString()}</td>
                        <td><span className={`status status--${log.type === "adjustment" ? "pending" : "confirmed"}`}>{log.type}</span></td>
                        <td>{log.quantity}</td>
                        <td className="muted">{log.referenceId || "—"}</td>
                        <td className="muted">{log.note || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}