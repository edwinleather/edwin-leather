"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { ImageHint } from "./ImageHint";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type ImageAsset = { url: string; publicId: string; alt?: string };
type Variant = { _id?: string; label: string; sku: string; color: string; size?: string; priceOverride?: number | null; inventoryTotal: number; inventoryStoreAllocated: number; lowStockThreshold: number; allowBackorder: boolean; active: boolean };
type Product = {
  _id: string;
  slug: string;
  name: string;
  subtitle?: string;
  description: string;
  category: string;
  collection?: string;
  brand?: string;
  hsn?: string;
  gst?: number;
  deliveryBy?: string;
  price: number;
  compareAtPrice?: number;
  images: ImageAsset[];
  variants: Variant[];
  featured: boolean;
  active: boolean;
};

type Category = { _id: string; name: string };

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const load = useCallback(() => {
    fetch(`${API}/admin/products`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => setProducts(body?.data ?? []))
      .catch(() => setProducts([]));
    fetch(`${API}/admin/categories`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => setCategories(body?.data ?? []))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Catalog</span><h2>Products</h2></div>
        <button className="button button--dark" onClick={() => setEditing("new")}>Add product <ArrowUpRight size={15} /></button>
      </div>

      {editing && (
        <ProductForm
          product={editing === "new" ? null : editing}
          categories={categories}
          onSaved={() => { setEditing(null); load(); }}
          onClose={() => setEditing(null)}
        />
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Variants</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
          <tbody>
            {products.length === 0 && <tr><td colSpan={7} className="muted">No products yet.</td></tr>}
            {products.map((p) => (
              <tr key={p._id}>
                <td>{p.images?.[0] ? <img src={p.images[0].url} alt="" width={44} height={52} style={{ objectFit: "cover", borderRadius: 8 }} /> : <span className="muted">—</span>}</td>
                <td><strong>{p.name}</strong>{p.featured && <span className="featured-tag">Featured</span>}</td>
                <td>{p.category}</td>
                <td>{formatPrice(p.price)}{p.compareAtPrice ? <span className="muted" style={{ display: "block", fontSize: 11 }}>was {formatPrice(p.compareAtPrice)}</span> : null}</td>
                <td>{p.variants.length}</td>
                <td><span className={`status ${p.active ? "status--confirmed" : ""}`}>{p.active ? "Active" : "Hidden"}</span></td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="text-button" onClick={() => setEditing(p)}>Edit</button>
                  <button className="text-button" style={{ color: "var(--danger, #b91c1c)" }} onClick={() => removeProduct(p)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  async function removeProduct(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const res = await fetch(`${API}/admin/products/${p._id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) load();
  }
}

function emptyProduct(): Omit<Product, "_id" | "images" | "variants"> {
  return { slug: "", name: "", subtitle: "", description: "", category: "", collection: "", brand: "", hsn: "", gst: undefined, deliveryBy: "", price: 0, featured: false, active: true };
}

function ProductForm({ product, categories, onSaved, onClose }: { product: Product | null; categories: Category[]; onSaved: () => void; onClose: () => void }) {
  const [form, setForm] = useState<Omit<Product, "_id" | "images" | "variants">>(() =>
    product ? { slug: product.slug, name: product.name, subtitle: product.subtitle ?? "", description: product.description, category: product.category, collection: product.collection ?? "", brand: product.brand ?? "", hsn: product.hsn ?? "", gst: product.gst, deliveryBy: product.deliveryBy ?? "", price: product.price, compareAtPrice: product.compareAtPrice, featured: product.featured, active: product.active } : { ...emptyProduct(), compareAtPrice: undefined }
  );
  const [images, setImages] = useState<ImageAsset[]>(product?.images ?? []);
  const [variants, setVariants] = useState<Variant[]>(product?.variants ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  function setVariant(index: number, patch: Partial<Variant>) {
    setVariants((list) => list.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    setVariants((list) => [...list, { label: "", sku: "", color: "", size: "", priceOverride: undefined, inventoryTotal: 0, inventoryStoreAllocated: 0, lowStockThreshold: 3, allowBackorder: false, active: true }]);
  }

  function removeVariant(index: number) {
    setVariants((list) => list.filter((_, i) => i !== index));
  }

  async function uploadFile(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Please choose an image file.");
    if (file.size > 10 * 1024 * 1024) return setError("Image must be under 10MB.");
    setUploading(true);
    try {
      const dataUri = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error("Could not read file"));
        reader.readAsDataURL(file);
      });
      const res = await fetch(`${API}/admin/media/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          dataUri,
          category: "product",
          referenceId: product?._id,
          referenceLabel: product?.name ?? form.name,
          filename: file.name,
          mimeType: file.type,
          size: file.size
        })
      });
      const body = await res.json();
      if (!res.ok) return setError(body?.error || "Upload failed");
      setImages((list) => [...list, { url: body.url, publicId: body.publicId }]);
    } catch {
      setError("Upload failed. Is Cloudinary configured?");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeImage(publicId: string) {
    await fetch(`${API}/admin/media/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ publicId })
    }).catch(() => {});
    setImages((list) => list.filter((i) => i.publicId !== publicId));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const validVariants = variants.filter((v) => v.label.trim() && v.sku.trim() && v.color.trim());
    if (variants.length > 0 && validVariants.length !== variants.length) {
      return setError("Every variant needs a label, SKU and colour.");
    }
    setSaving(true);
    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      subtitle: form.subtitle?.trim() || undefined,
      description: form.description.trim(),
      category: form.category,
      collection: form.collection?.trim() || undefined,
      brand: form.brand?.trim() || undefined,
      hsn: form.hsn?.trim() || undefined,
      gst: form.gst !== undefined && form.gst !== null ? Number(form.gst) : undefined,
      deliveryBy: form.deliveryBy?.trim() || undefined,
      price: Number(form.price) || 0,
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      images,
      variants: validVariants.map((v) => ({
        label: v.label.trim(),
        sku: v.sku.trim(),
        color: v.color.trim(),
        size: v.size?.trim() || undefined,
        priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
        inventoryTotal: Math.max(0, Number(v.inventoryTotal) || 0),
        inventoryStoreAllocated: Math.max(0, Number(v.inventoryStoreAllocated) || 0),
        lowStockThreshold: Math.max(0, Number(v.lowStockThreshold) || 0),
        allowBackorder: v.allowBackorder,
        active: v.active
      })),
      featured: form.featured,
      active: form.active
    };
    try {
      const res = await fetch(product ? `${API}/admin/products/${product._id}` : `${API}/admin/products`, {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const body = await res.json();
      if (!res.ok) return setError(body?.error || "Could not save product");
      onSaved();
    } catch {
      setError("Could not save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="checkout-form" onSubmit={submit} style={{ borderTop: "1px solid var(--line)", paddingTop: 22, marginTop: 4, marginBottom: 26 }}>
      <div className="form-grid">
        <label className="field-wide">Name <input value={form.name} onChange={set("name")} required /></label>
        <label>Slug <input value={form.slug} onChange={set("slug")} placeholder="weekender-no-01" required /></label>
        <label>Category
          <select value={form.category} onChange={set("category")} required>
            <option value="" disabled>Select a category</option>
            {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select>
        </label>
        <label>Price (₹) <input type="number" min="0" value={form.price} onChange={set("price")} required /></label>
        <label>Compare-at price (₹) <input type="number" min="0" value={form.compareAtPrice ?? ""} onChange={set("compareAtPrice")} placeholder="Optional" /></label>
        <label className="field-wide">Subtitle <input value={form.subtitle ?? ""} onChange={set("subtitle")} placeholder="Short selling line (optional)" /></label>
        <label className="field-wide">Description <textarea rows={3} value={form.description} onChange={set("description")} required /></label>
        <label className="field-wide">Brand <input value={form.brand ?? ""} onChange={set("brand")} placeholder="e.g. Edwin Leathers (optional)" /></label>
        <label>HSN code <input value={form.hsn ?? ""} onChange={set("hsn")} placeholder="e.g. 4202 (optional)" /></label>
        <label>GST rate (%) <input type="number" min="0" max="100" value={form.gst ?? ""} onChange={set("gst")} placeholder="e.g. 18" /></label>
        <label className="field-wide">Delivery estimate <input value={form.deliveryBy ?? ""} onChange={set("deliveryBy")} placeholder="e.g. Arrives by Thu, 14 Aug (optional)" /></label>
      </div>

      <div>
        <span className="eyebrow" style={{ marginBottom: 12 }}>Images</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {images.map((img) => (
            <div key={img.publicId} style={{ position: "relative", width: 84, height: 96 }}>
              <img src={img.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 8 }} />
              <button type="button" onClick={() => removeImage(img.publicId)} style={{ position: "absolute", top: 4, right: 4 }} className="icon-button" aria-label="Remove image"><X size={14} /></button>
            </div>
          ))}
          <button type="button" className="button button--ghost" disabled={uploading} onClick={() => fileRef.current?.click()} style={{ width: 84, height: 96, flexDirection: "column", gap: 6 }}>
            {uploading ? <Loader2 size={18} className="spin" /> : <ImagePlus size={18} />}
            {uploading ? "Uploading" : "Add"}
          </button>
        </div>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
      </div>
      <ImageHint suggested="1200 × 1600 px · 3:4 portrait" url={images[0]?.url} />

      <div style={{ marginTop: 8 }}>
        <div className="admin-panel__head">
          <div><span className="eyebrow">Stock</span><h3 style={{ margin: 0 }}>Variants</h3></div>
          <button type="button" className="button button--ghost" onClick={addVariant}><Plus size={14} /> Add variant</button>
        </div>
        {variants.length === 0 && <p className="muted" style={{ margin: "4px 0 12px" }}>No variants yet — add size/colour options and stock.</p>}
        {variants.map((v, i) => (
          <div key={i} className="variant-editor">
            <div className="variant-editor__grid">
              <label>Label <input value={v.label} onChange={(e) => setVariant(i, { label: e.target.value })} placeholder="Black / 32" required /></label>
              <label>SKU <input value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value })} placeholder="BLK-32" required /></label>
              <label>Colour <input value={v.color} onChange={(e) => setVariant(i, { color: e.target.value })} placeholder="Black" required /></label>
              <label>Size <input value={v.size ?? ""} onChange={(e) => setVariant(i, { size: e.target.value })} placeholder="32" /></label>
              <label>Price override <input type="number" min="0" value={v.priceOverride ?? ""} onChange={(e) => setVariant(i, { priceOverride: e.target.value ? Number(e.target.value) : undefined })} placeholder="Optional" /></label>
              <label>Total stock <input type="number" min="0" value={v.inventoryTotal} onChange={(e) => setVariant(i, { inventoryTotal: Number(e.target.value) })} /></label>
              <label>Store allocation <input type="number" min="0" value={v.inventoryStoreAllocated} onChange={(e) => setVariant(i, { inventoryStoreAllocated: Number(e.target.value) })} placeholder="For your store" /></label>
              <label>Low-stock at <input type="number" min="0" value={v.lowStockThreshold} onChange={(e) => setVariant(i, { lowStockThreshold: Number(e.target.value) })} /></label>
            </div>
            <div className="variant-editor__foot">
              <div style={{ display: "flex", gap: 16 }}>
                <label className="toggle-label"><input type="checkbox" checked={v.allowBackorder} onChange={(e) => setVariant(i, { allowBackorder: e.target.checked })} /> Allow backorder</label>
                <label className="toggle-label"><input type="checkbox" checked={v.active} onChange={(e) => setVariant(i, { active: e.target.checked })} /> Active</label>
              </div>
              <button type="button" className="text-button" style={{ color: "var(--danger, #b91c1c)" }} onClick={() => removeVariant(i)}><Trash2 size={13} /> Remove</button>
            </div>
          </div>
        ))}
      </div>

      <div className="form-actions">
        <div style={{ display: "flex", gap: 16 }}>
          <label className="toggle-label"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} /> Featured</label>
          <label className="toggle-label"><input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} /> Active</label>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="button button--ghost" onClick={onClose}><X size={15} /> Cancel</button>
          <button type="submit" className="button button--dark" disabled={saving || uploading}>{saving ? "Saving…" : product ? "Save changes" : "Create product"}</button>
        </div>
      </div>
      {error && <p className="auth-error">{error}</p>}
    </form>
  );
}