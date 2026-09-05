"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Save, Search, X } from "lucide-react";
import { ImageHint } from "./ImageHint";
import { ATTRIBUTE_TYPE_LABELS, type Attribute, type CategoryAttributeRef, type FieldType, type FieldSection } from "@/lib/field-defs";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type Category = {
  _id?: string;
  name: string;
  slug: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  imageUrl: string;
  displayOrder: number;
  active: boolean;
  attributes: CategoryAttributeRef[];
};

const EMPTY: Category = { name: "", slug: "", description: "", seoTitle: undefined, seoDescription: undefined, imageUrl: "", displayOrder: 0, active: true, attributes: [] };
const DEFAULT_REF = { required: false, customerVisible: true, sellerVisible: true, filterable: false, searchable: true, variant: false, displaySection: "specifications" as FieldSection, displayOrder: 0 };

function attrId(ref: CategoryAttributeRef): string {
  return typeof ref.attributeId === "string" ? ref.attributeId : ref.attributeId._id;
}
function attrDef(ref: CategoryAttributeRef): Attribute | null {
  return typeof ref.attributeId === "object" ? ref.attributeId : null;
}
function attrName(ref: CategoryAttributeRef): string {
  return attrDef(ref)?.name ?? (ref.attributeId as string);
}

function catSlugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function CategoriesManager() {
  const [rows, setRows] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Category>({ ...EMPTY });
  const [slugAuto, setSlugAuto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");

  // Attribute pool search / create
  const [searchTerm, setSearchTerm] = useState("");
  const [pool, setPool] = useState<Attribute[]>([]);
  const [poolLoading, setPoolLoading] = useState(false);
  const [poolOpen, setPoolOpen] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<FieldType>("text");
  // Inline per-attribute options (comma-separated) for select/multi types.
  const [optionsEdits, setOptionsEdits] = useState<Record<string, string>>({});

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
  const filtered = rows.filter((c) => !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));

  function startCreate() {
    setForm({ ...EMPTY, attributes: [] });
    setOptionsEdits({});
    setEditing(null);
    setCreating(true);
    setSlugAuto(true);
    setError(null);
  }

  function startEdit(category: Category) {
    const attrs = category.attributes ?? [];
    const optionMap: Record<string, string> = {};
    for (const ref of attrs) {
      const def = attrDef(ref);
      if (def && (def.type === "select" || def.type === "multi")) optionMap[attrId(ref)] = (def.options ?? []).join(", ");
    }
    setOptionsEdits(optionMap);
    setForm({ name: category.name, slug: category.slug, description: category.description ?? "", seoTitle: category.seoTitle, seoDescription: category.seoDescription, imageUrl: category.imageUrl ?? "", displayOrder: category.displayOrder, active: category.active, attributes: attrs });
    setEditing(category);
    setCreating(false);
    setSlugAuto(false);
    setError(null);
  }

  function setRef(index: number, patch: Partial<CategoryAttributeRef>) {
    setForm((f) => ({ ...f, attributes: f.attributes.map((a, i) => (i === index ? { ...a, ...patch } : a)) }));
  }

  function removeRef(index: number) {
    setForm((f) => ({ ...f, attributes: f.attributes.filter((_, i) => i !== index) }));
  }

  async function searchPool(q: string) {
    if (!q.trim()) { setPool([]); setPoolOpen(false); return; }
    setPoolLoading(true);
    setPoolOpen(true);
    const res = await fetch(`${API}/admin/attributes?q=${encodeURIComponent(q)}`, { credentials: "include" });
    const body = await res.json().catch(() => null);
    setPool(body?.data ?? []);
    setPoolLoading(false);
  }

  function onSearchChange(value: string) {
    setSearchTerm(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => searchPool(value), 250);
  }

  function attach(attr: Attribute) {
    setForm((f) => {
      if (f.attributes.some((a) => attrId(a) === attr._id)) return f;
      return { ...f, attributes: [...f.attributes, { ...DEFAULT_REF, attributeId: attr, displayOrder: f.attributes.length }] };
    });
    setPool((p) => p.filter((a) => a._id !== attr._id));
  }

  async function createAndAttach() {
    const name = newName.trim();
    if (!name) return setError("Enter a name for the new attribute.");
    setError(null);
    const res = await fetch(`${API}/admin/attributes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, type: newType })
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) return setError(body?.error || "Could not create attribute");
    attach(body.data);
    setNewName("");
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    // Persist inline option edits for attached attributes.
    for (const ref of form.attributes) {
      const def = attrDef(ref);
      if (!def || !(def.type === "select" || def.type === "multi")) continue;
      const id = attrId(ref);
      const edited = optionsEdits[id];
      if (edited === undefined) continue;
      const current = (def.options ?? []).join(", ");
      if (edited === current) continue;
      await fetch(`${API}/admin/attributes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ options: edited.split(",").map((s) => s.trim()).filter(Boolean) })
      }).catch(() => {});
    }

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      description: form.description.trim() || undefined,
      seoTitle: form.seoTitle?.trim() || undefined,
      seoDescription: form.seoDescription?.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      displayOrder: Number(form.displayOrder) || 0,
      active: form.active,
      attributes: form.attributes.map((a) => ({
        attributeId: attrId(a),
        required: a.required,
        customerVisible: a.customerVisible,
        sellerVisible: a.sellerVisible,
        filterable: a.filterable,
        searchable: a.searchable,
        variant: a.variant,
        displaySection: a.displaySection,
        displayOrder: a.displayOrder
      }))
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
    if (!confirm(`Delete category "${category.name}"? Products assigned to this category will keep their category name but the category page will no longer exist.`)) return;
    const res = await fetch(`${API}/admin/categories/${category._id}`, { method: "DELETE", credentials: "include" });
    const body = await res.json().catch(() => null);
    if (res.ok) {
      if (body?.affectedProducts > 0) {
        setError(null);
        alert(`${body.affectedProducts} product(s) still reference "${category.name}". Their category field was not changed.`);
      }
      load();
    } else {
      setError(body?.error || "Could not delete category");
    }
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
            <label>Name <input value={form.name} onChange={(e) => {
              const name = e.target.value;
              setForm((f) => ({ ...f, name, ...(slugAuto ? { slug: catSlugify(name) } : {}) }));
            }} required /></label>
            <label>Slug <input value={form.slug} onChange={(e) => { setSlugAuto(false); setForm((f) => ({ ...f, slug: e.target.value })); }} placeholder="footwear" required /></label>
            <label className="field-wide">Description <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional" /></label>
            <label className="field-wide">SEO title <input value={form.seoTitle ?? ""} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} placeholder="Override for search engines (optional, max 70 chars)" maxLength={70} /></label>
            <label className="field-wide">SEO description <input value={form.seoDescription ?? ""} onChange={(e) => setForm({ ...form, seoDescription: e.target.value })} placeholder="Override for search engines (optional, max 160 chars)" maxLength={160} /></label>
            <label>Display order <input type="number" min="0" value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: Number(e.target.value) })} /></label>
            <label className="field-wide">Image URL <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="Optional" /></label>
            <div className="field-wide"><ImageHint suggested="1000 × 1500 px · 2:3 portrait" url={form.imageUrl} /></div>
          </div>

          <div style={{ marginTop: 14 }}>
            <div className="admin-panel__head"><div><span className="eyebrow">Attributes</span><h3 style={{ margin: 0 }}>Attributes for this category</h3></div></div>
            <p className="muted" style={{ margin: "4px 0 12px", fontSize: 12 }}>Attach reusable attributes from the shared pool. Search for an existing attribute and attach it, or create a new one — the pool is shared so "Color" is reused across categories.</p>

            {form.attributes.length === 0 && <p className="muted" style={{ margin: "4px 0 12px", fontSize: 12 }}>No attributes attached yet.</p>}

            {form.attributes.map((ref, index) => {
              const def = attrDef(ref);
              const editingOptions = def && (def.type === "select" || def.type === "multi");
              return (
                <div key={attrId(ref)} className="variant-editor" style={{ marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                      <strong>{attrName(ref)}</strong>
                      {def && <span className="muted" style={{ fontSize: 11 }}>{def.type}{def.key ? ` · ${def.key}` : ""}</span>}
                    </div>
                    <button type="button" className="text-button" style={{ color: "var(--danger, #b91c1c)" }} onClick={() => removeRef(index)}><X size={13} /> Remove</button>
                  </div>
                  <div className="variant-editor__grid">
                    {editingOptions && (
                      <label className="field-wide">Options (comma separated) <input value={optionsEdits[attrId(ref)] ?? ""} onChange={(e) => setOptionsEdits((o) => ({ ...o, [attrId(ref)]: e.target.value }))} /></label>
                    )}
                    <label>Display order <input type="number" min="0" value={ref.displayOrder} onChange={(e) => setRef(index, { displayOrder: Number(e.target.value) })} /></label>
                    <label>Section
                      <select value={ref.displaySection} onChange={(e) => setRef(index, { displaySection: e.target.value as FieldSection })}>
                        <option value="specifications">Specifications</option>
                        <option value="listing">Listing details</option>
                      </select>
                    </label>
                  </div>
                  <div className="variant-editor__foot">
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <label className="toggle-label"><input type="checkbox" checked={ref.required} onChange={(e) => setRef(index, { required: e.target.checked })} /> Required</label>
                      <label className="toggle-label"><input type="checkbox" checked={ref.customerVisible} onChange={(e) => setRef(index, { customerVisible: e.target.checked })} /> Customer-visible</label>
                      <label className="toggle-label"><input type="checkbox" checked={ref.sellerVisible} onChange={(e) => setRef(index, { sellerVisible: e.target.checked })} /> Seller-visible</label>
                      <label className="toggle-label"><input type="checkbox" checked={ref.filterable} onChange={(e) => setRef(index, { filterable: e.target.checked })} /> Filterable</label>
                      <label className="toggle-label"><input type="checkbox" checked={ref.searchable} onChange={(e) => setRef(index, { searchable: e.target.checked })} /> Searchable</label>
                      <label className="toggle-label"><input type="checkbox" checked={ref.variant} onChange={(e) => setRef(index, { variant: e.target.checked })} /> Variant</label>
                    </div>
                  </div>
                </div>
              );
            })}

            <div style={{ position: "relative", marginTop: 14 }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => { if (searchTerm.trim()) setPoolOpen(true); }}
                  onBlur={() => setTimeout(() => setPoolOpen(false), 200)}
                  placeholder="Search attributes to attach (e.g. Color, Size)"
                  style={{ flex: 1 }}
                />
              </div>
              {poolOpen && (
                <div className="attr-pool-dropdown">
                  {poolLoading && <div className="attr-pool-dropdown__empty">Searching…</div>}
                  {!poolLoading && pool.length === 0 && <div className="attr-pool-dropdown__empty">No attributes found</div>}
                  {!poolLoading && pool.map((attr) => {
                    const attached = form.attributes.some((a) => attrId(a) === attr._id);
                    return (
                      <div key={attr._id} className="attr-pool-dropdown__row">
                        <div className="attr-pool-dropdown__info">
                          <span className="attr-pool-dropdown__name">{attr.name}</span>
                          <span className="attr-pool-dropdown__type">{attr.type}</span>
                        </div>
                        <button type="button" className="button button--ghost" disabled={attached} onClick={() => { attach(attr); setSearchTerm(""); setPoolOpen(false); }}>
                          {attached ? "Attached" : "+ Attach"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="field-builder" style={{ flexWrap: "wrap", gap: 8 }}>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Or create a new attribute (e.g. Sole Type)" />
              <select value={newType} onChange={(e) => setNewType(e.target.value as FieldType)}>
                {ATTRIBUTE_TYPE_LABELS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <button type="button" className="button button--ghost" onClick={createAndAttach}><Plus size={14} /> Create & attach</button>
            </div>
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
          <thead><tr><th>Name</th><th>Slug</th><th>Attributes</th><th>Description</th><th>Order</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={7} className="muted">No categories yet.</td></tr>}
            {rows.length > 0 && filtered.length === 0 && <tr><td colSpan={7} className="muted">No categories match your search.</td></tr>}
            {filtered.map((c) => (
              <tr key={c._id}>
                <td><strong>{c.name}</strong></td>
                <td className="muted">/{c.slug}</td>
                <td className="muted">{(c.attributes ?? []).length} attribute{(c.attributes ?? []).length === 1 ? "" : "s"}</td>
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