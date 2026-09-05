"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Search, X } from "lucide-react";
import { formatPrice } from "@/lib/format";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type Promotion = {
  _id: string;
  name: string;
  type: "percentage" | "fixed";
  value: number;
  target: "product" | "category";
  targetProductId?: string;
  targetCategory?: string;
  startsAt?: string;
  expiresAt?: string;
  priority: number;
  active: boolean;
};

type PromotionForm = {
  name: string;
  type: Promotion["type"];
  value: number;
  target: Promotion["target"];
  targetProductId: string;
  targetCategory: string;
  startsAt: string;
  expiresAt: string;
  priority: number;
  active: boolean;
};

const EMPTY: PromotionForm = { name: "", type: "percentage", value: 0, target: "product", targetProductId: "", targetCategory: "", startsAt: "", expiresAt: "", priority: 0, active: true };

export function PromotionsManager() {
  const [rows, setRows] = useState<Promotion[]>([]);
  const [products, setProducts] = useState<{ _id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([]);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<PromotionForm>({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    fetch(`${API}/admin/promotions`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => setRows(body?.data ?? []))
      .catch(() => setRows([]));
    fetch(`${API}/admin/products`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => setProducts((body?.data ?? []).map((p: { _id: string; name: string }) => ({ _id: p._id, name: p.name }))))
      .catch(() => setProducts([]));
    fetch(`${API}/admin/categories`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => setCategories((body?.data ?? []).map((c: { _id: string; name: string }) => ({ _id: c._id, name: c.name }))))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = query.trim().toLowerCase();
  const filtered = rows.filter((p) => !q || p.name.toLowerCase().includes(q) || (p.targetCategory ?? "").toLowerCase().includes(q));

  function startCreate() {
    setForm({ ...EMPTY });
    setCreating(true);
    setEditing(null);
    setError(null);
  }

  function startEdit(p: Promotion) {
    setForm({
      name: p.name,
      type: p.type,
      value: p.value,
      target: p.target,
      targetProductId: p.targetProductId ?? "",
      targetCategory: p.targetCategory ?? "",
      startsAt: p.startsAt ? p.startsAt.slice(0, 10) : "",
      expiresAt: p.expiresAt ? p.expiresAt.slice(0, 10) : "",
      priority: p.priority ?? 0,
      active: p.active
    });
    setEditing(p);
    setCreating(false);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      type: form.type,
      value: Number(form.value) || 0,
      target: form.target,
      targetProductId: form.target === "product" ? form.targetProductId || undefined : undefined,
      targetCategory: form.target === "category" ? form.targetCategory || undefined : undefined,
      startsAt: form.startsAt ? new Date(form.startsAt + "T00:00:00").toISOString() : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt + "T00:00:00").toISOString() : undefined,
      priority: Number(form.priority) || 0,
      active: form.active
    };
    const res = await fetch(editing ? `${API}/admin/promotions/${editing._id}` : `${API}/admin/promotions`, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const body = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) return setError(body?.error || "Could not save promotion");
    setEditing(null);
    setCreating(false);
    load();
  }

  async function toggle(p: Promotion) {
    const res = await fetch(`${API}/admin/promotions/${p._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ active: !p.active })
    });
    if (res.ok) load();
  }

  async function remove(p: Promotion) {
    if (!confirm(`Delete promotion "${p.name}"?`)) return;
    const res = await fetch(`${API}/admin/promotions/${p._id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  }

  function targetLabel(p: Promotion) {
    if (p.target === "product") return products.find((pr) => pr._id === p.targetProductId)?.name ?? p.targetProductId ?? "-";
    return p.targetCategory ?? "-";
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Discounts</span><h2>Promotions</h2></div>
        <button className="button button--dark" onClick={startCreate}><Plus size={15} /> New promotion</button>
      </div>
      <p className="muted" style={{ fontSize: 13, marginTop: 0, lineHeight: 1.6 }}>Automatic discounts applied to a product or whole category at checkout, before any coupon code.</p>

      <label className="order-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or category" /></label>

      {(creating || editing) && (
        <form className="checkout-form" onSubmit={save} style={{ borderTop: "1px solid var(--line)", paddingTop: 18 }}>
          <div className="form-grid">
            <label>Name <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Summer sale" required /></label>
            <label>Type
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Promotion["type"] })}>
                <option value="percentage">Percentage off</option>
                <option value="fixed">Fixed amount off</option>
              </select>
            </label>
            <label>Value {form.type === "percentage" ? "(%)" : "(₹)"} <input type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} required /></label>
            <label>Applies to
              <select value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value as Promotion["target"] })}>
                <option value="product">A specific product</option>
                <option value="category">A whole category</option>
              </select>
            </label>
            {form.target === "product" ? (
              <label className="field-wide">Product
                <select value={form.targetProductId} onChange={(e) => setForm({ ...form, targetProductId: e.target.value })} required>
                  <option value="" disabled>Select a product</option>
                  {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
              </label>
            ) : (
              <label className="field-wide">Category
                <select value={form.targetCategory} onChange={(e) => setForm({ ...form, targetCategory: e.target.value })} required>
                  <option value="" disabled>Select a category</option>
                  {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
                </select>
              </label>
            )}
            <label>Starts <input type="date" value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} /></label>
            <label>Ends <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></label>
            <label>Priority <input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: Number(e.target.value) })} /></label>
          </div>
          <div className="form-actions">
            <label className="toggle-label"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Active</label>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="button button--ghost" onClick={() => { setEditing(null); setCreating(false); }}><X size={15} /> Cancel</button>
              <button type="submit" className="button button--dark" disabled={busy}><Save size={15} /> {editing ? "Save changes" : "Create"}</button>
            </div>
          </div>
          {error && <p className="auth-error">{error}</p>}
        </form>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Name</th><th>Target</th><th>Type</th><th>Value</th><th>Window</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="muted">No promotions yet.</td></tr>}
            {rows.length > 0 && filtered.length === 0 && <tr><td colSpan={7} className="muted">No promotions match your search.</td></tr>}
            {filtered.map((p) => (
              <tr key={p._id}>
                <td><strong>{p.name}</strong></td>
                <td>{targetLabel(p)}</td>
                <td>{p.type}</td>
                <td>{p.type === "percentage" ? `${p.value}%` : formatPrice(p.value)}</td>
                <td className="muted">{p.startsAt ? new Date(p.startsAt).toLocaleDateString() : "now"}{p.expiresAt ? ` → ${new Date(p.expiresAt).toLocaleDateString()}` : ""}</td>
                <td><span className={`status ${p.active ? "status--confirmed" : ""}`}>{p.active ? "Active" : "Disabled"}</span></td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="text-button" onClick={() => startEdit(p)}>Edit</button>
                  <button className="text-button" onClick={() => toggle(p)}>{p.active ? "Disable" : "Enable"}</button>
                  <button className="text-button" style={{ color: "var(--danger, #b91c1c)" }} onClick={() => remove(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}