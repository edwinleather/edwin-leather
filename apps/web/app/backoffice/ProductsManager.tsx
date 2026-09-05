"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Crop, Plus, Search, Trash2, X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { type Attribute, type CategoryAttributeRef } from "@/lib/field-defs";
import { AttributeFields } from "@/components/attributes/AttributeFields";
import { ImageResizer } from "./ImageResizer";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";
const TARGET_W = 1200;
const TARGET_H = 1500;

type ImageAsset = { url: string; publicId: string; alt?: string; local?: boolean; dataUri?: string };
type Variant = { _id?: string; label: string; sku: string; color: string; size?: string; priceOverride?: number | null; salePrice?: number | null; inventoryTotal: number; inventoryStoreAllocated: number; lowStockThreshold: number; allowBackorder: boolean; active: boolean };
type Product = {
  _id: string;
  slug: string;
  name: string;
  subtitle?: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  category: string;
  collection?: string;
  brand?: string;
  hsn?: string;
  gst?: number;
  deliveryBy?: string;
  price: number;
  compareAtPrice?: number;
  salePrice?: number;
  images: ImageAsset[];
  variants: Variant[];
  featured: boolean;
  codAvailable: boolean;
  active: boolean;
  status?: "draft" | "active" | "inactive";
  attributes?: ProductAttribute[];
  variantDimensions?: { attributeId: string | Attribute; values: string[] }[];
  productVariants?: { _id: string; sku: string; price: number; salePrice?: number; stock: number; active: boolean; allowBackorder?: boolean; attributes: { attributeId: string | Attribute; value: string }[]; images?: ImageAsset[] }[];
};

type Category = { _id: string; name: string; attributes?: CategoryAttributeRef[] };

type ProductAttribute = { attributeId?: string | Attribute; key?: string; label?: string; value: string | string[] };

type VariantDim = { attributeId: string; key: string; name: string; values: string[] };
type VariantRow = { attributes: { attributeId: string; value: string }[]; sku: string; price: number; salePrice?: number; stock: number; active: boolean; allowBackorder: boolean; images: { url: string; publicId?: string; alt?: string }[] };

function comboKey(attrs: { attributeId: string; value: string }[]): string {
  return attrs
    .slice()
    .sort((a, b) => a.attributeId.localeCompare(b.attributeId))
    .map((a) => `${a.attributeId}__${a.value}`)
    .join("|");
}

function generateCombos(dims: VariantDim[]): { attributeId: string; value: string }[][] {
  const buckets = dims.filter((d) => d.values.length > 0).map((d) => d.values.map((value) => ({ attributeId: d.attributeId, value })));
  if (buckets.length === 0) return [];
  const results: { attributeId: string; value: string }[][] = [];
  const walk = (index: number, acc: { attributeId: string; value: string }[]) => {
    if (index === buckets.length) {
      results.push([...acc]);
      return;
    }
    for (const option of buckets[index]) {
      acc.push(option);
      walk(index + 1, acc);
      acc.pop();
    }
  };
  walk(0, []);
  return results;
}

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Product | "new" | null>(null);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

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

  const q = query.trim().toLowerCase();
  const filtered = products.filter(
    (p) => !q || p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || p.category.toLowerCase().includes(q) || (p.brand ?? "").toLowerCase().includes(q) || p.variants.some((v) => v.sku.toLowerCase().includes(q))
  );

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((p) => p._id)));
    }
  }

  async function bulkStatus(status: "draft" | "active" | "inactive") {
    if (selected.size === 0) return;
    if (!confirm(`Set ${selected.size} product(s) to ${status}?`)) return;
    setBulkBusy(true);
    const res = await fetch(`${API}/admin/products/bulk/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ids: [...selected], status })
    });
    setBulkBusy(false);
    if (res.ok) { setSelected(new Set()); load(); }
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} product(s)? This cannot be undone.`)) return;
    setBulkBusy(true);
    for (const id of selected) {
      await fetch(`${API}/admin/products/${id}`, { method: "DELETE", credentials: "include" });
    }
    setBulkBusy(false);
    setSelected(new Set());
    load();
  }

  async function duplicateProduct(p: Product) {
    const res = await fetch(`${API}/admin/products/${p._id}/duplicate`, { method: "POST", credentials: "include" });
    if (res.ok) load();
  }

  const allSelected = filtered.length > 0 && selected.size === filtered.length;

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Catalog</span><h2>Products</h2></div>
        <button className="button button--dark" onClick={() => setEditing("new")}>Add product <ArrowUpRight size={15} /></button>
      </div>

      <label className="order-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, SKU, category or brand" /></label>

      {editing && (
        <ProductForm
          product={editing === "new" ? null : editing}
          categories={categories}
          onSaved={() => { setEditing(null); load(); }}
          onClose={() => setEditing(null)}
        />
      )}

      <div className="admin-table-wrap">
        {selected.size > 0 && (
          <div className="bulk-actions" style={{ marginBottom: 12, display: "flex", gap: 8, alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 13 }}>{selected.size} selected</span>
            <button className="button button--ghost" onClick={() => bulkStatus("active")} disabled={bulkBusy}>Set active</button>
            <button className="button button--ghost" onClick={() => bulkStatus("draft")} disabled={bulkBusy}>Set draft</button>
            <button className="button button--ghost" onClick={() => bulkStatus("inactive")} disabled={bulkBusy}>Set inactive</button>
            <button className="button button--ghost" style={{ color: "var(--danger, #b91c1c)" }} onClick={bulkDelete} disabled={bulkBusy}>Delete</button>
          </div>
        )}
        <table className="admin-table">
          <thead><tr><th><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} /></th><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Variants</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
          <tbody>
            {products.length === 0 && <tr><td colSpan={8} className="muted">No products yet.</td></tr>}
            {products.length > 0 && filtered.length === 0 && <tr><td colSpan={8} className="muted">No products match your search.</td></tr>}
            {filtered.map((p) => (
              <tr key={p._id} className={selected.has(p._id) ? "row-selected" : ""}>
                <td><input type="checkbox" checked={selected.has(p._id)} onChange={() => toggleSelect(p._id)} /></td>
                <td>{p.images?.[0] ? <img src={p.images[0].url} alt="" width={44} height={52} style={{ objectFit: "cover", borderRadius: 8 }} /> : <span className="muted">-</span>}</td>
                <td><strong>{p.name}</strong>{p.featured && <span className="featured-tag">Featured</span>}</td>
                <td>{p.category}</td>
                <td>{formatPrice(p.price)}{p.compareAtPrice ? <span className="muted" style={{ display: "block", fontSize: 11 }}>was {formatPrice(p.compareAtPrice)}</span> : null}</td>
                <td>{p.variants.length + (p.productVariants?.length ?? 0)}</td>
                <td><span className={`status ${p.status === "active" ? "status--confirmed" : p.status === "draft" ? "status--pending" : ""}`}>{p.status ?? (p.active ? "active" : "inactive")}</span></td>
                <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                  <button className="text-button" onClick={() => setEditing(p)}>Edit</button>
                  <button className="text-button" onClick={() => duplicateProduct(p)}>Duplicate</button>
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
  return { slug: "", name: "", subtitle: "", description: "", seoTitle: undefined, seoDescription: undefined, category: "", collection: "", brand: "", hsn: "", gst: undefined, deliveryBy: "", price: 0, compareAtPrice: undefined, salePrice: undefined, featured: false, codAvailable: true, active: true, status: "active" as const };
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function ProductForm({ product, categories, onSaved, onClose }: { product: Product | null; categories: Category[]; onSaved: () => void; onClose: () => void }) {
  const DRAFT_KEY = product ? `edwin-product-draft-${product._id}` : "edwin-product-draft-new";

  const [form, setForm] = useState<Omit<Product, "_id" | "images" | "variants">>(() => {
    const defaults = product ? { slug: product.slug, name: product.name, subtitle: product.subtitle ?? "", description: product.description, seoTitle: product.seoTitle, seoDescription: product.seoDescription, category: product.category, collection: product.collection ?? "", brand: product.brand ?? "", hsn: product.hsn ?? "", gst: product.gst, deliveryBy: product.deliveryBy ?? "", price: product.price, compareAtPrice: product.compareAtPrice, salePrice: product.salePrice, featured: product.featured, codAvailable: product.codAvailable, active: product.active, status: product.status ?? (product.active ? "active" : "inactive") } : { ...emptyProduct(), compareAtPrice: undefined };
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) return JSON.parse(saved).form ?? defaults;
    } catch {}
    return defaults;
  });
  const [slugAuto, setSlugAuto] = useState(() => {
    try { const saved = localStorage.getItem(DRAFT_KEY); if (saved) { const v = JSON.parse(saved).slugAuto; if (v !== undefined) return v; } } catch {}
    return !product;
  });
  const [images, setImages] = useState<ImageAsset[]>(() => {
    try { const saved = localStorage.getItem(DRAFT_KEY); if (saved) { const v = JSON.parse(saved).images; if (v) return v; } } catch {}
    return (product?.images ?? []).map((img) => ({ ...img, local: false }));
  });
  const [variants, setVariants] = useState<Variant[]>(() => {
    try { const saved = localStorage.getItem(DRAFT_KEY); if (saved) { const v = JSON.parse(saved).variants; if (v) return v; } } catch {}
    return product?.variants ?? [];
  });
  const [variantDims, setVariantDims] = useState<VariantDim[]>(() => {
    try { const saved = localStorage.getItem(DRAFT_KEY); if (saved) { const v = JSON.parse(saved).variantDims; if (v) return v; } } catch {}
    return (product?.variantDimensions ?? []).map((d) => {
      const def = typeof d.attributeId === "object" && d.attributeId ? d.attributeId : null;
      return { attributeId: typeof d.attributeId === "object" ? d.attributeId._id : String(d.attributeId), key: def?.key ?? "", name: def?.name ?? "", values: d.values ?? [] };
    });
  });
  const [variantRows, setVariantRows] = useState<VariantRow[]>(() => {
    try { const saved = localStorage.getItem(DRAFT_KEY); if (saved) { const v = JSON.parse(saved).variantRows; if (v) return v; } } catch {}
    return (product?.productVariants ?? []).map((v) => ({
      attributes: v.attributes.map((a) => ({ attributeId: typeof a.attributeId === "object" ? a.attributeId._id : String(a.attributeId), value: String(a.value) })),
      sku: v.sku, price: v.price, salePrice: v.salePrice, stock: v.stock, active: v.active, allowBackorder: Boolean(v.allowBackorder), images: v.images ?? []
    }));
  });
  const [attrValues, setAttrValues] = useState<Record<string, string | string[]>>(() => {
    try { const saved = localStorage.getItem(DRAFT_KEY); if (saved) { const v = JSON.parse(saved).attrValues; if (v) return v; } } catch {}
    const init: Record<string, string | string[]> = {};
    for (const a of product?.attributes ?? []) {
      const def = typeof a.attributeId === "object" && a.attributeId ? a.attributeId : null;
      const key = def?.key ?? a.key;
      if (key) init[key] = a.value;
    }
    return init;
  });
  // Tracks the attributeId/label backing each populated value, so values that came
  // from an existing product keep their reference when the category schema changes.
  const [attrMeta, setAttrMeta] = useState<Record<string, { attributeId?: string; label?: string }>>(() => {
    const meta: Record<string, { attributeId?: string; label?: string }> = {};
    for (const a of product?.attributes ?? []) {
      const def = typeof a.attributeId === "object" && a.attributeId ? a.attributeId : null;
      const key = def?.key ?? a.key;
      if (!key) continue;
      meta[key] = {
        attributeId: typeof a.attributeId === "object" ? a.attributeId._id : typeof a.attributeId === "string" ? a.attributeId : undefined,
        label: def?.name ?? a.label
      };
    }
    return meta;
  });
  const [categoryAttrs, setCategoryAttrs] = useState<CategoryAttributeRef[]>(() => {
    const cat = categories.find((c) => c.name === (product?.category ?? ""));
    return cat?.attributes ?? [];
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attrErrors, setAttrErrors] = useState<Record<string, string>>({});
  const [editingImage, setEditingImage] = useState<{ dataUri: string; name: string; editIndex?: number } | null>(null);
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  // Load the selected category's attached attributes so the form is generated
  // from the category schema rather than hardcoded.
  useEffect(() => {
    const cat = categories.find((c) => c.name === form.category);
    setCategoryAttrs(cat?.attributes ?? []);
    setAttrErrors({});
  }, [form.category, categories]);

  // Persist draft to localStorage so work is never lost on refresh/close.
  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ form, slugAuto, images, variants, variantDims, variantRows, attrValues }));
    } catch {}
  }, [form, slugAuto, images, variants, variantDims, variantRows, attrValues, DRAFT_KEY]);

  function setAttr(key: string, value: string | string[]) {
    setAttrValues((v) => ({ ...v, [key]: value }));
  }

  function setVariant(index: number, patch: Partial<Variant>) {
    setVariants((list) => list.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function addVariant() {
    setVariants((list) => [...list, { label: "", sku: "", color: "", size: "", priceOverride: undefined, inventoryTotal: 0, inventoryStoreAllocated: 0, lowStockThreshold: 3, allowBackorder: false, active: true }]);
  }

  function removeVariant(index: number) {
    setVariants((list) => list.filter((_, i) => i !== index));
  }

  const combos = useMemo(() => generateCombos(variantDims), [variantDims]);

  // Reconcile the editable variant rows with the generated combinations,
  // preserving any SKU/price/stock already entered for an unchanged combo.
  useEffect(() => {
    setVariantRows((rows) => {
      const existing = new Map(rows.map((r) => [comboKey(r.attributes), r]));
      return combos.map((combo, i) => {
        const prev = existing.get(comboKey(combo));
        return prev ?? {
          attributes: combo,
          sku: `${(product?.slug || form.slug || "SKU").toUpperCase()}-${i + 1}`,
          price: Number(form.price) || 0,
          stock: 0,
          active: true,
          allowBackorder: false,
          images: []
        };
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combos]);

  function variantAttributeRefs() {
    return categoryAttrs.filter((ref) => typeof ref.attributeId === "object" && ref.attributeId && ref.variant);
  }

  function dimId(ref: CategoryAttributeRef): string {
    return typeof ref.attributeId === "object" ? ref.attributeId._id : String(ref.attributeId);
  }

  function toggleDim(ref: CategoryAttributeRef, checked: boolean) {
    const id = dimId(ref);
    if (checked) {
      const def = typeof ref.attributeId === "object" ? ref.attributeId : null;
      setVariantDims((list) => (list.some((d) => d.attributeId === id) ? list : [...list, { attributeId: id, key: def?.key ?? "", name: def?.name ?? "", values: def?.options ?? [] }]));
    } else {
      setVariantDims((list) => list.filter((d) => d.attributeId !== id));
    }
  }

  function setDimValues(id: string, raw: string) {
    setVariantDims((list) => list.map((d) => (d.attributeId === id ? { ...d, values: raw.split(",").map((s) => s.trim()).filter(Boolean) } : d)));
  }

  function setVariantRow(index: number, patch: Partial<VariantRow>) {
    setVariantRows((list) => list.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function readAsDataUri(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Could not read file"));
      reader.readAsDataURL(file);
    });
  }

  async function handlePickedFiles(files: File[]) {
    setError(null);
    for (const file of files) {
      if (!file.type.startsWith("image/")) { setError("Please choose image files only."); continue; }
      if (file.size > 10 * 1024 * 1024) { setError("Each image must be under 10MB."); continue; }
      const dataUri = await readAsDataUri(file);
      setEditingImage({ dataUri, name: file.name });
    }
  }

  function addCroppedImage(dataUri: string, name: string, editIndex?: number) {
    if (editIndex !== undefined) {
      setImages((list) => list.map((img, i) => i === editIndex ? { ...img, url: dataUri, dataUri, local: true, publicId: "" } : img));
    } else {
      setImages((list) => [...list, { url: dataUri, publicId: "", local: true, dataUri }]);
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
    // Warn if variant dimensions are configured but no SKU combinations were generated.
    if (variantDims.length > 0 && variantRows.length === 0) {
      return setError("Variant attributes are selected but no SKU combinations were generated. Enter values for each attribute dimension, or remove the variant attributes.");
    }
    setSaving(true);

    // Upload any local (newly added) images first.
    const finalImages: ImageAsset[] = [];
    for (const img of images) {
      if (!img.local || !img.dataUri) { finalImages.push(img); continue; }
      setUploading(true);
      try {
        const res = await fetch(`${API}/admin/media/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            dataUri: img.dataUri,
            category: "product",
            referenceId: product?._id,
            referenceLabel: product?.name ?? form.name,
            filename: "image.jpg",
            mimeType: "image/jpeg",
            size: img.dataUri.length
          })
        });
        const body = await res.json();
        if (!res.ok) { setError(body?.error || "Image upload failed"); setSaving(false); setUploading(false); return; }
        finalImages.push({ url: body.url, publicId: body.publicId });
      } catch {
        setError("Image upload failed. Is Cloudinary configured?");
        setSaving(false);
        setUploading(false);
        return;
      }
    }
    setUploading(false);

    const payload = {
      slug: form.slug.trim(),
      name: form.name.trim(),
      subtitle: form.subtitle?.trim() || undefined,
      description: form.description.trim(),
      seoTitle: form.seoTitle?.trim() || undefined,
      seoDescription: form.seoDescription?.trim() || undefined,
      category: form.category,
      collection: form.collection?.trim() || undefined,
      brand: form.brand?.trim() || undefined,
      hsn: form.hsn?.trim() || undefined,
      gst: form.gst !== undefined && form.gst !== null ? Number(form.gst) : undefined,
      deliveryBy: form.deliveryBy?.trim() || undefined,
      price: Number(form.price) || 0,
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
      images: finalImages,
      attributes: Object.entries(attrValues)
        .filter(([, v]) => (Array.isArray(v) ? v.length > 0 : v !== undefined && String(v).trim() !== ""))
        .map(([key, value]) => {
          const ref = categoryAttrs.find((r) => typeof r.attributeId === "object" && r.attributeId.key === key);
          if (ref && typeof ref.attributeId === "object") return { attributeId: ref.attributeId._id, value };
          const meta = attrMeta[key];
          if (meta?.attributeId) return { attributeId: meta.attributeId, value };
          return { key, label: meta?.label ?? key, value };
        }),
      variants: validVariants.map((v) => ({
        label: v.label.trim(),
        sku: v.sku.trim(),
        color: v.color.trim(),
        size: v.size?.trim() || undefined,
        priceOverride: v.priceOverride ? Number(v.priceOverride) : undefined,
        salePrice: v.salePrice ? Number(v.salePrice) : undefined,
        inventoryTotal: Math.max(0, Number(v.inventoryTotal) || 0),
        inventoryStoreAllocated: Math.max(0, Number(v.inventoryStoreAllocated) || 0),
        lowStockThreshold: Math.max(0, Number(v.lowStockThreshold) || 0),
        allowBackorder: v.allowBackorder,
        active: v.active
      })),
      featured: form.featured,
      codAvailable: form.codAvailable,
      active: form.status !== "inactive",
      status: form.status ?? "active",
      variantDimensions: variantDims.map((d) => ({ attributeId: d.attributeId, values: d.values.filter((v) => v.trim() !== "") })),
      productVariants: variantRows.map((r) => ({
        attributes: r.attributes,
        sku: r.sku.trim(),
        price: Number(r.price) || 0,
        salePrice: r.salePrice ? Number(r.salePrice) : undefined,
        stock: Math.max(0, Number(r.stock) || 0),
        active: r.active,
        allowBackorder: r.allowBackorder,
        images: r.images
      }))
    };
    try {
      const res = await fetch(product ? `${API}/admin/products/${product._id}` : `${API}/admin/products`, {
        method: product ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload)
      });
      const body = await res.json();
      if (!res.ok) {
        // Parse attribute validation errors from the details array.
        const details = body?.details;
        if (Array.isArray(details) && details.length > 0 && details[0]?.key) {
          const mapped: Record<string, string> = {};
          for (const err of details) {
            if (err.key && err.message) mapped[err.key] = err.message;
          }
          setAttrErrors(mapped);
          setError(`Attribute validation failed — see highlighted fields below.`);
        } else {
          setAttrErrors({});
          setError(body?.error || "Could not save product");
        }
        return;
      }
      setAttrErrors({});
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      onSaved();
    } catch {
      setError("Could not save product");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
    <form className="checkout-form" onSubmit={submit} style={{ borderTop: "1px solid var(--line)", paddingTop: 22, marginTop: 4, marginBottom: 26 }}>
      <div className="form-grid">
        <label className="field-wide">Name <input value={form.name} onChange={(e) => {
          const name = e.target.value;
          setForm((f) => ({ ...f, name, ...(slugAuto ? { slug: slugify(name) } : {}) }));
        }} required /></label>
        <label>Slug <input value={form.slug} onChange={(e) => { setSlugAuto(false); setForm((f) => ({ ...f, slug: e.target.value })); }} placeholder="weekender-no-01" required /></label>
        <label>Category
          <select value={form.category} onChange={set("category")} required>
            <option value="" disabled>Select a category</option>
            {categories.map((c) => <option key={c._id} value={c.name}>{c.name}</option>)}
          </select>
        </label>
        <label>Price (₹) <input type="number" min="0" value={form.price} onChange={set("price")} required /></label>
        <label>Sale price (₹) <input type="number" min="0" value={form.salePrice ?? ""} onChange={set("salePrice")} placeholder="Optional" /></label>
        <label>Compare-at price (₹) <input type="number" min="0" value={form.compareAtPrice ?? ""} onChange={set("compareAtPrice")} placeholder="Optional" /></label>
        <label className="field-wide">Subtitle <input value={form.subtitle ?? ""} onChange={set("subtitle")} placeholder="Short selling line (optional)" /></label>
        <label className="field-wide">Description <textarea rows={3} value={form.description} onChange={set("description")} required /></label>
        <label className="field-wide">SEO title <input value={form.seoTitle ?? ""} onChange={set("seoTitle")} placeholder="Override for search engines (optional, max 70 chars)" maxLength={70} /></label>
        <label className="field-wide">SEO description <input value={form.seoDescription ?? ""} onChange={set("seoDescription")} placeholder="Override for search engines (optional, max 160 chars)" maxLength={160} /></label>
        <label className="field-wide">Brand <input value={form.brand ?? ""} onChange={set("brand")} placeholder="e.g. Edwin Leathers (optional)" /></label>
        <label>HSN code <input value={form.hsn ?? ""} onChange={set("hsn")} placeholder="e.g. 4202 (optional)" /></label>
        <label>GST rate (%) <input type="number" min="0" max="100" value={form.gst ?? ""} onChange={set("gst")} placeholder="e.g. 18" /></label>
        <label className="field-wide">Delivery estimate <input value={form.deliveryBy ?? ""} onChange={set("deliveryBy")} placeholder="e.g. Arrives by Thu, 14 Aug (optional)" /></label>
        <label>Status
          <select value={form.status ?? "active"} onChange={(e) => setForm({ ...form, status: e.target.value as "draft" | "active" | "inactive" })}>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
        </label>
      </div>

      <div>
        <span className="eyebrow" style={{ marginBottom: 12 }}>Images</span>
        <p className="muted" style={{ margin: "0 0 12px", fontSize: 12 }}>First image is the main product image. Click to reorder. Recommended {TARGET_W} × {TARGET_H} px (4:5).</p>
        <div className="admin-img-grid">
          {images.map((img, i) => (
            <div key={img.publicId} className={`admin-img-card${i === 0 ? " admin-img-card--main" : ""}`}>
              <img src={img.url} alt={`Image ${i + 1}`} draggable={false} />
              <div className="admin-img-card__overlay">
                {i > 0 && <button type="button" onClick={() => { const next = [...images]; [next[i - 1], next[i]] = [next[i], next[i - 1]]; setImages(next); }} title="Move left">←</button>}
                {i < images.length - 1 && <button type="button" onClick={() => { const next = [...images]; [next[i], next[i + 1]] = [next[i + 1], next[i]]; setImages(next); }} title="Move right">→</button>}
                <button type="button" onClick={async () => { const dataUri = await readAsDataUri(new File([await (await fetch(img.url)).blob()], `image-${i}.jpg`, { type: "image/jpeg" })); setEditingImage({ dataUri, name: `image-${i}.jpg`, editIndex: i }); }} title="Crop"><Crop size={14} /></button>
                <button type="button" onClick={() => removeImage(img.publicId)} title="Remove" className="admin-img-card__delete">✕</button>
              </div>
              {i === 0 && <span className="admin-img-card__badge">Main</span>}
            </div>
          ))}

          {uploading ? (
            <div className="admin-img-card admin-img-card--add">
              <span className="admin-img-card__spinner" />
            </div>
          ) : (
            <label className="admin-img-card admin-img-card--add">
              <input type="file" accept="image/*" multiple hidden onChange={(e) => { if (e.target.files) handlePickedFiles(Array.from(e.target.files)); e.target.value = ""; }} />
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              <span>Add image</span>
            </label>
          )}
        </div>
        {error && <p className="auth-error" style={{ marginTop: 8 }}>{error}</p>}
      </div>

      <div style={{ marginTop: 8 }}>
        <div className="admin-panel__head">
          <div><span className="eyebrow">Stock</span><h3 style={{ margin: 0 }}>Variants</h3></div>
          <button type="button" className="button button--ghost" onClick={addVariant}><Plus size={14} /> Add variant</button>
        </div>
        {variants.length === 0 && <p className="muted" style={{ margin: "4px 0 12px" }}>No variants yet - add size/colour options and stock.</p>}
        {variants.map((v, i) => (
          <div key={i} className="variant-editor">
            <div className="variant-editor__grid">
              <label>Label <input value={v.label} onChange={(e) => setVariant(i, { label: e.target.value })} placeholder="Black / 32" required /></label>
              <label>SKU <input value={v.sku} onChange={(e) => setVariant(i, { sku: e.target.value })} placeholder="BLK-32" required /></label>
              <label>Colour <input value={v.color} onChange={(e) => setVariant(i, { color: e.target.value })} placeholder="Black" required /></label>
              <label>Size <input value={v.size ?? ""} onChange={(e) => setVariant(i, { size: e.target.value })} placeholder="32" /></label>
              <label>Price override <input type="number" min="0" value={v.priceOverride ?? ""} onChange={(e) => setVariant(i, { priceOverride: e.target.value ? Number(e.target.value) : undefined })} placeholder="Optional" /></label>
              <label>Sale price <input type="number" min="0" value={v.salePrice ?? ""} onChange={(e) => setVariant(i, { salePrice: e.target.value ? Number(e.target.value) : undefined })} placeholder="Optional" /></label>
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

      <div style={{ marginTop: 8 }}>
        <div className="admin-panel__head">
          <div><span className="eyebrow">Category attributes</span><h3 style={{ margin: 0 }}>Generated from the category</h3></div>
        </div>
        {categoryAttrs.length === 0 && <p className="muted" style={{ margin: "4px 0 12px" }}>No attributes defined for this category yet.</p>}
        <AttributeFields refs={categoryAttrs} values={attrValues} onChange={setAttr} errors={attrErrors} />
      </div>

      <div style={{ marginTop: 20 }}>
        <div className="admin-panel__head">
          <div><span className="eyebrow">Variant attributes</span><h3 style={{ margin: 0 }}>Attributes that create SKUs</h3></div>
        </div>
        <p className="muted" style={{ margin: "4px 0 12px", fontSize: 12 }}>Pick the attributes marked as "Variant" in this category. Each combination of their values becomes a purchasable SKU with its own price and stock.</p>

        {variantAttributeRefs().length === 0 && (
          <p className="muted" style={{ margin: "4px 0 12px", fontSize: 12 }}>This category has no variant attributes. Mark an attribute as "Variant" in Categories to enable SKU generation.</p>
        )}

        <div className="field-checklist" style={{ margin: "8px 0" }}>
          {variantAttributeRefs().map((ref) => {
            const id = dimId(ref);
            const enabled = variantDims.some((d) => d.attributeId === id);
            const def = typeof ref.attributeId === "object" ? ref.attributeId : null;
            return (
              <div key={id} className="field-checklist__row field-checklist__row--on">
                <label className="toggle-label" style={{ flex: 1 }}>
                  <input type="checkbox" checked={enabled} onChange={(e) => toggleDim(ref, e.target.checked)} />
                  <span>{def?.name ?? id} <small>({def?.key ?? ""})</small></span>
                </label>
                {enabled && (
                  <input
                    value={variantDims.find((d) => d.attributeId === id)?.values.join(", ") ?? ""}
                    onChange={(e) => setDimValues(id, e.target.value)}
                    placeholder="Values, comma separated (e.g. Black, White)"
                    style={{ minWidth: 260 }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {variantDims.length > 0 && (
          <div className="admin-table-wrap" style={{ marginTop: 12 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  {variantDims.map((d) => <th key={d.attributeId}>{d.name}</th>)}
                  <th>SKU</th><th>Price (₹)</th><th>Sale (₹)</th><th>Stock</th><th>Active</th><th>Backorder</th>
                </tr>
              </thead>
              <tbody>
                {variantRows.length === 0 && <tr><td colSpan={variantDims.length + 5} className="muted">Enter values for each attribute to generate SKU combinations.</td></tr>}
                {variantRows.map((row, i) => (
                  <tr key={i}>
                    {variantDims.map((d) => {
                      const v = row.attributes.find((a) => a.attributeId === d.attributeId);
                      return <td key={d.attributeId}><strong>{v?.value ?? ""}</strong></td>;
                    })}
                    <td><input value={row.sku} onChange={(e) => setVariantRow(i, { sku: e.target.value })} placeholder="SKU" /></td>
                    <td><input type="number" min="0" value={row.price} onChange={(e) => setVariantRow(i, { price: Number(e.target.value) })} /></td>
                    <td><input type="number" min="0" value={row.salePrice ?? ""} onChange={(e) => setVariantRow(i, { salePrice: e.target.value ? Number(e.target.value) : undefined })} placeholder="—" /></td>
                    <td><input type="number" min="0" value={row.stock} onChange={(e) => setVariantRow(i, { stock: Number(e.target.value) })} /></td>
                    <td><input type="checkbox" checked={row.active} onChange={(e) => setVariantRow(i, { active: e.target.checked })} /></td>
                    <td><input type="checkbox" checked={row.allowBackorder} onChange={(e) => setVariantRow(i, { allowBackorder: e.target.checked })} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="form-actions">
        <div style={{ display: "flex", gap: 16 }}>
          <label className="toggle-label"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} /> Featured</label>
          <label className="toggle-label"><input type="checkbox" checked={form.codAvailable} onChange={(e) => setForm((f) => ({ ...f, codAvailable: e.target.checked }))} /> COD available</label>
          <label className="toggle-label"><input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} /> Active</label>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="button button--ghost" onClick={onClose}><X size={15} /> Cancel</button>
          <button type="button" className="button button--ghost" style={{ color: "var(--danger, #b91c1c)" }} onClick={() => { try { localStorage.removeItem(DRAFT_KEY); } catch {} setForm({ ...emptyProduct(), compareAtPrice: undefined }); setSlugAuto(true); setImages([]); setVariants([]); setVariantDims([]); setVariantRows([]); setAttrValues({}); }}>Discard draft</button>
          <button type="submit" className="button button--dark" disabled={saving || uploading}>{saving ? "Saving…" : product ? "Save changes" : "Create product"}</button>
        </div>
      </div>
      {error && <p className="auth-error">{error}</p>}
    </form>
    {editingImage && (
      <ImageResizer
        src={editingImage.dataUri}
        targetW={TARGET_W}
        targetH={TARGET_H}
        onCancel={() => setEditingImage(null)}
        onConfirm={(dataUri) => {
          addCroppedImage(dataUri, editingImage.name, editingImage.editIndex);
          setEditingImage(null);
        }}
      />
    )}
  </>
  );
}