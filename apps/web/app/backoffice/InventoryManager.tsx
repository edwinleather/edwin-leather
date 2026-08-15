"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Boxes, Loader2, PackageX, Search, Save } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type Variant = {
  _id: string;
  label: string;
  sku: string;
  color: string;
  size?: string;
  inventoryTotal: number;
  inventoryStoreAllocated: number;
  inventoryAvailable: number;
  inventoryReserved: number;
  lowStockThreshold: number;
  allowBackorder: boolean;
  active: boolean;
};

type Row = {
  productId: string;
  productName: string;
  slug: string;
  active: boolean;
  variant: Variant;
};

type Draft = {
  total: string;
  store: string;
  threshold: string;
  backorder: boolean;
};

export function InventoryManager() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [drafts, setDrafts] = useState<Record<string, Draft>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);

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
        map[row.variant._id] = {
          total: String(row.variant.inventoryTotal ?? 0),
          store: String(row.variant.inventoryStoreAllocated ?? 0),
          threshold: String(row.variant.lowStockThreshold ?? 3),
          backorder: Boolean(row.variant.allowBackorder)
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
    const draft = drafts[row.variant._id];
    setSaving(row.variant._id);
    setError(null);
    const res = await fetch(`${API}/admin/inventory/${row.productId}/${row.variant._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        inventoryTotal: Math.max(0, Number(draft.total) || 0),
        inventoryStoreAllocated: Math.max(0, Number(draft.store) || 0),
        lowStockThreshold: Math.max(0, Number(draft.threshold) || 0),
        allowBackorder: draft.backorder
      })
    });
    const body = await res.json().catch(() => null);
    setSaving(null);
    if (!res.ok) return setError(body?.error || "Could not update stock");
    load();
  }

  const q = query.trim().toLowerCase();
  const filtered = rows.filter((r) => !q || r.productName.toLowerCase().includes(q) || r.variant.sku.toLowerCase().includes(q) || r.variant.label.toLowerCase().includes(q));

  const totalUnits = rows.reduce((sum, r) => sum + (r.variant.inventoryTotal ?? 0), 0);
  const lowCount = rows.filter((r) => r.variant.active && r.variant.inventoryAvailable <= (r.variant.lowStockThreshold ?? 0)).length;
  const outCount = rows.filter((r) => r.variant.active && r.variant.inventoryAvailable <= 0 && !r.variant.allowBackorder).length;
  const reservedCount = rows.reduce((sum, r) => sum + (r.variant.inventoryReserved ?? 0), 0);

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
          <strong>Total stock</strong> is your full physical count. <strong>Store allocation</strong> is set aside for your physical store and is not sellable online. <strong>Available</strong> is what your website can sell now (= total − store − reserved). <strong>Reserved</strong> is stock locked by carts/pending orders and updates automatically at checkout. Enable <strong>backorder</strong> to keep selling once Available hits zero.
        </p>
      </div>

      <label className="order-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search product, SKU or option" /></label>

      {error && <p className="auth-error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table inventory-table">
          <thead><tr><th>Product / SKU</th><th>Total stock</th><th>Store</th><th>Available</th><th>Reserved</th><th>Low at</th><th>Backorder</th><th style={{ textAlign: "right" }}>Status</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={8} className="muted">Loading inventory…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={8} className="muted">No inventory found.</td></tr>}
            {filtered.map((row) => {
              const v = row.variant;
              const d = drafts[v._id] as Draft;
              const available = Math.max(0, (Number(d.total) || 0) - (Number(d.store) || 0) - (v.inventoryReserved ?? 0));
              const low = available <= (Number(d.threshold) || 0);
              const out = available <= 0 && !d.backorder;
              return (
                <tr key={v._id} className={!v.active ? "row-hidden" : ""}>
                  <td><strong>{row.productName}</strong><span className="muted" style={{ display: "block", fontSize: 11 }}>{v.label} · {v.sku}</span></td>
                  <td><input type="number" min="0" value={d.total} onChange={(e) => setDraft(v._id, { total: e.target.value })} /></td>
                  <td><input type="number" min="0" value={d.store} onChange={(e) => setDraft(v._id, { store: e.target.value })} /></td>
                  <td><strong className={out ? "stock-out" : low ? "stock-low" : ""}>{available}</strong></td>
                  <td className="muted">{v.inventoryReserved ?? 0}</td>
                  <td><input type="number" min="0" value={d.threshold} onChange={(e) => setDraft(v._id, { threshold: e.target.value })} /></td>
                  <td><input type="checkbox" className="toggle-input" checked={d.backorder} onChange={(e) => setDraft(v._id, { backorder: e.target.checked })} /></td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <span className={`status ${low ? "status--pending" : "status--confirmed"}`}>{out ? "Out" : low ? "Low" : v.active ? "In stock" : "Hidden"}</span>
                    {dirty[v._id] && <button className="text-button" onClick={() => save(row)} disabled={saving === v._id}>{saving === v._id ? <Loader2 size={13} className="spin" /> : <Save size={13} />} Save</button>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}