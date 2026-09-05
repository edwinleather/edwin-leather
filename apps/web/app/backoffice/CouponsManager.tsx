"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Search, X } from "lucide-react";
import { formatPrice } from "@/lib/format";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type Coupon = {
  _id: string;
  code: string;
  discountType: "percentage" | "fixed" | "free_shipping";
  value: number;
  minimumOrder?: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usagePerCustomer?: number;
  usedCount?: number;
  expiresAt?: string;
  active: boolean;
  applicableCategories?: string[];
};

const TYPES = [
  ["percentage", "Percentage off"],
  ["fixed", "Fixed amount"],
  ["free_shipping", "Free delivery"]
] as const;

const EMPTY: CouponForm = { code: "", discountType: "percentage", value: 0, minimumOrder: 0, maximumDiscount: undefined, usageLimit: undefined, usagePerCustomer: undefined, expiresAt: "", active: true, applicableCategories: [] };

type CouponForm = {
  code: string;
  discountType: Coupon["discountType"];
  value: number;
  minimumOrder: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usagePerCustomer?: number;
  expiresAt: string;
  active: boolean;
  applicableCategories: string[];
};

function typeLabel(t: string) {
  if (t === "percentage") return "% off";
  if (t === "fixed") return "₹ off";
  return "free delivery";
}

export function CouponsManager() {
  const [rows, setRows] = useState<Coupon[]>([]);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<CouponForm>({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [categories, setCategories] = useState<{ name: string }[]>([]);

  const load = useCallback(() => {
    fetch(`${API}/admin/coupons`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => setRows(body?.data ?? []))
      .catch(() => setRows([]));
  }, []);

  useEffect(() => {
    load();
    fetch(`${API}/admin/categories`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => setCategories(body?.data ?? []))
      .catch(() => setCategories([]));
  }, [load]);

  const q = query.trim().toLowerCase();
  const filtered = rows.filter((c) => !q || c.code.toLowerCase().includes(q) || c.discountType.replace(/_/g, " ").includes(q));

  function startCreate() {
    setForm({ ...EMPTY });
    setCreating(true);
    setEditing(null);
    setError(null);
  }

  function startEdit(c: Coupon) {
    setForm({
      code: c.code,
      discountType: c.discountType,
      value: c.value,
      minimumOrder: c.minimumOrder ?? 0,
      maximumDiscount: c.maximumDiscount,
      usageLimit: c.usageLimit,
      usagePerCustomer: c.usagePerCustomer,
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 10) : "",
      active: c.active,
      applicableCategories: c.applicableCategories ?? []
    });
    setEditing(c);
    setCreating(false);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      code: form.code.toUpperCase().trim(),
      discountType: form.discountType,
      value: Number(form.value) || 0,
      minimumOrder: Number(form.minimumOrder) || 0,
      maximumDiscount: form.maximumDiscount ? Number(form.maximumDiscount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      usagePerCustomer: form.usagePerCustomer ? Number(form.usagePerCustomer) : undefined,
      expiresAt: form.expiresAt ? new Date(form.expiresAt + "T00:00:00").toISOString() : undefined,
      active: form.active,
      applicableCategories: form.applicableCategories
    };
    const res = await fetch(editing ? `${API}/admin/coupons/${editing._id}` : `${API}/admin/coupons`, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const body = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) return setError(body?.error || "Could not save coupon");
    setEditing(null);
    setCreating(false);
    load();
  }

  async function toggle(c: Coupon) {
    const res = await fetch(`${API}/admin/coupons/${c._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ active: !c.active })
    });
    if (res.ok) load();
  }

  async function remove(c: Coupon) {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    const res = await fetch(`${API}/admin/coupons/${c._id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Promotions</span><h2>Coupons</h2></div>
        <button className="button button--dark" onClick={startCreate}><Plus size={15} /> New coupon</button>
      </div>

      <label className="order-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search code or type" /></label>

      {(creating || editing) && (
        <form className="checkout-form" onSubmit={save} style={{ borderTop: "1px solid var(--line)", paddingTop: 18 }}>
          <div className="form-grid">
            <label>Code <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SUMMER20" required /></label>
            <label>Type
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as Coupon["discountType"] })}>
                {TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <label>Value {form.discountType === "percentage" ? "(%)" : "(₹)"} <input type="number" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} required /></label>
            <label>Minimum order (₹) <input type="number" min="0" value={form.minimumOrder} onChange={(e) => setForm({ ...form, minimumOrder: Number(e.target.value) })} /></label>
            <label>Maximum discount (₹) <input type="number" min="0" value={form.maximumDiscount ?? ""} onChange={(e) => setForm({ ...form, maximumDiscount: e.target.value ? Number(e.target.value) : undefined })} /></label>
            <label>Usage limit <input type="number" min="1" value={form.usageLimit ?? ""} onChange={(e) => setForm({ ...form, usageLimit: e.target.value ? Number(e.target.value) : undefined })} /></label>
            <label>Per customer <input type="number" min="1" value={form.usagePerCustomer ?? ""} onChange={(e) => setForm({ ...form, usagePerCustomer: e.target.value ? Number(e.target.value) : undefined })} /></label>
            <label>Expires <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></label>
          </div>
          {categories.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <span className="muted" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>Restrict to categories (leave empty for all)</span>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {categories.map((cat) => {
                  const checked = form.applicableCategories.includes(cat.name);
                  return (
                    <label key={cat.name} className="toggle-label" style={{ fontSize: 13, gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? form.applicableCategories.filter((c) => c !== cat.name)
                            : [...form.applicableCategories, cat.name];
                          setForm({ ...form, applicableCategories: next });
                        }}
                      />
                      {cat.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
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
          <thead><tr><th>Code</th><th>Type</th><th>Value</th><th>Min order</th><th>Used</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="muted">No coupons yet.</td></tr>}
            {rows.length > 0 && filtered.length === 0 && <tr><td colSpan={7} className="muted">No coupons match your search.</td></tr>}
            {filtered.map((c) => (
              <tr key={c._id}>
                <td><strong>{c.code}</strong></td>
                <td>{c.discountType.replace(/_/g, " ")}</td>
                <td>{c.discountType === "percentage" ? `${c.value}%` : formatPrice(c.value)}</td>
                <td>{c.minimumOrder ? formatPrice(c.minimumOrder) : "-"}</td>
                <td>{c.usedCount ?? 0}{c.usageLimit ? ` / ${c.usageLimit}` : ""}</td>
                <td><span className={`status ${c.active ? "status--confirmed" : ""}`}>{c.active ? "Active" : "Disabled"}</span></td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="text-button" onClick={() => startEdit(c)}>Edit</button>
                  <button className="text-button" onClick={() => toggle(c)}>{c.active ? "Disable" : "Enable"}</button>
                  <button className="text-button" style={{ color: "var(--danger, #b91c1c)" }} onClick={() => remove(c)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}