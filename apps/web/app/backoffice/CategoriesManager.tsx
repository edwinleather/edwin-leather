"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Save, Search, X } from "lucide-react";
import { ImageHint } from "./ImageHint";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type Category = {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  active: boolean;
};

const EMPTY = { name: "", slug: "", description: "", imageUrl: "", displayOrder: 0, active: true };

export function CategoriesManager() {
  const [rows, setRows] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  const load = useCallback(() => {
    fetch(`${API}/admin/categories`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => setRows(body?.data ?? []))
      .catch(() => setRows([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = query.trim().toLowerCase();
  const filtered = rows.filter((c) => !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || (c.description ?? "").toLowerCase().includes(q));

  function startCreate() {
    setForm({ ...EMPTY });
    setCreating(true);
    setEditing(null);
    setError(null);
  }

  function startEdit(category: Category) {
    setForm({ name: category.name, slug: category.slug, description: category.description ?? "", imageUrl: category.imageUrl ?? "", displayOrder: category.displayOrder, active: category.active });
    setEditing(category);
    setCreating(false);
    setError(null);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      displayOrder: Number(form.displayOrder) || 0,
      active: form.active
    };
    const url = editing ? `${API}/admin/categories/${editing._id}` : `${API}/admin/categories`;
    const res = await fetch(url, {
      method: editing ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });
    const body = await res.json().catch(() => null);
    setBusy(false);
    if (!res.ok) return setError(body?.error || "Could not save category");
    setEditing(null);
    setCreating(false);
    load();
  }

  async function remove(category: Category) {
    if (!confirm(`Delete category "${category.name}"?`)) return;
    const res = await fetch(`${API}/admin/categories/${category._id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
    else setError(((await res.json().catch(() => null))?.error) || "Could not delete category");
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Catalog</span><h2>Categories</h2></div>
        <button className="button button--dark" onClick={startCreate}><Plus size={15} /> New category</button>
      </div>

      <label className="order-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, slug or description" /></label>

      {(creating || editing) && (
        <form className="checkout-form" onSubmit={save} style={{ borderTop: "1px solid var(--line)", paddingTop: 18 }}>
          <div className="form-grid">
            <label>Name <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Slug <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="wallets" required /></label>
            <label className="field-wide">Description <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" /></label>
            <label>Display order <input type="number" min="0" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} /></label>
            <label className="field-wide">Image URL <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="Optional" /></label>
            <div className="field-wide"><ImageHint suggested="1000 × 1500 px · 2:3 portrait" url={form.imageUrl} /></div>
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
          <thead><tr><th>Name</th><th>Slug</th><th>Description</th><th>Order</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="muted">No categories yet.</td></tr>}
            {rows.length > 0 && filtered.length === 0 && <tr><td colSpan={6} className="muted">No categories match your search.</td></tr>}
            {filtered.map((c) => (
              <tr key={c._id}>
                <td><strong>{c.name}</strong></td>
                <td className="muted">/{c.slug}</td>
                <td>{c.description ? c.description.slice(0, 40) : "-"}</td>
                <td>{c.displayOrder}</td>
                <td><span className={`status ${c.active ? "status--confirmed" : ""}`}>{c.active ? "Active" : "Hidden"}</span></td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="text-button" onClick={() => startEdit(c)}>Edit</button>
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