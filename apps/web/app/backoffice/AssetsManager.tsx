"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, ImagePlus, Loader2, Pencil, Trash2, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

const CATEGORIES = ["all", "asset", "page", "product", "review"] as const;
const CATEGORY_LABELS: Record<string, string> = { all: "All", asset: "Assets", page: "Page", product: "Products", review: "Reviews" };

type Asset = { _id: string; category: string; url: string; publicId?: string; alt?: string; referenceLabel?: string; referenceId?: string; referenceType?: string; mimeType?: string; size?: number; createdAt?: string };

export function AssetsManager() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [uploading, setUploading] = useState(false);
  const [uploadCategory, setUploadCategory] = useState<string>("asset");
  const [name, setName] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [rename, setRename] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(() => {
    fetch(`${API}/admin/assets?category=${category}`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => setAssets(body?.data ?? []))
      .catch(() => setAssets([]));
  }, [category]);

  useEffect(() => {
    load();
  }, [load]);

  async function upload(file: File) {
    setError(null);
    setMessage(null);
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
          category: uploadCategory,
          referenceLabel: name.trim() || file.name,
          alt: name.trim() || undefined,
          filename: file.name,
          mimeType: file.type,
          size: file.size
        })
      });
      const body = await res.json();
      if (!res.ok) return setError(body?.error || "Upload failed");
      setName("");
      setMessage("Asset uploaded.");
      load();
    } catch {
      setError("Upload failed. Is Cloudinary configured?");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(asset: Asset) {
    if (!confirm(`Delete asset "${asset.referenceLabel || asset.alt || asset._id}"? This removes it from Cloudinary.`)) return;
    const res = await fetch(`${API}/admin/assets/${asset._id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) { setMessage("Asset deleted."); load(); }
  }

  async function saveRename(asset: Asset) {
    const res = await fetch(`${API}/admin/assets/${asset._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ referenceLabel: rename.trim(), alt: rename.trim() })
    });
    if (res.ok) { setEditing(null); setMessage("Name updated."); load(); }
  }

  async function copyUrl(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(url);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Cloudinary</span><h2>Assets</h2></div>
        <button className="button button--dark" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <Loader2 size={15} className="spin" /> : <ImagePlus size={15} />} {uploading ? "Uploading…" : "Upload image"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      </div>

      <div className="admin-note" style={{ marginBottom: 18 }}>
        <p className="muted" style={{ fontSize: 13 }}>Every image you upload anywhere — products, reviews, homepage, or here — is catalogued by category. Upload here to add a standalone asset, rename it, copy its URL, or drop it (removes it from Cloudinary).</p>
      </div>

      <div className="assets-upload">
        <label className="toggle-label">
          Category
          <select value={uploadCategory} onChange={(e) => setUploadCategory(e.target.value)}>
            {CATEGORIES.filter((c) => c !== "all").map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </label>
        <label className="toggle-label" style={{ flex: 1 }}>
          Name <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. brand-logo" style={{ minWidth: 200 }} />
        </label>
      </div>

      <div className="status-filter" style={{ marginBottom: 18 }}>
        {CATEGORIES.map((c) => <button key={c} className={category === c ? "active" : ""} onClick={() => setCategory(c)}>{CATEGORY_LABELS[c]}</button>)}
      </div>

      {message && <p className="ok-note" style={{ marginBottom: 16 }}>{message}</p>}
      {error && <p className="auth-error" style={{ marginBottom: 16 }}>{error}</p>}

      {assets.length === 0 ? (
        <p className="muted">No assets in this category yet.</p>
      ) : (
        <div className="assets-grid">
          {assets.map((asset) => (
            <div className="asset-card" key={asset._id}>
              <div className="asset-card__thumb"><img src={asset.url} alt={asset.alt || asset.referenceLabel || "asset"} /></div>
              <div className="asset-card__body">
                <div className="asset-card__top">
                  <span className={`status status--confirmed asset-cat`}>{CATEGORY_LABELS[asset.category] || asset.category}</span>
                </div>
                {editing === asset._id ? (
                  <input value={rename} onChange={(e) => setRename(e.target.value)} autoFocus onKeyDown={(e) => { if (e.key === "Enter") saveRename(asset); if (e.key === "Escape") setEditing(null); }} />
                ) : (
                  <strong className="asset-card__name">{asset.referenceLabel || asset.alt || asset.publicId || "Untitled"}</strong>
                )}
                <span className="asset-card__meta">{asset.publicId ? asset.publicId : "External URL"}</span>
                <div className="asset-card__actions">
                  <button className="icon-button" title="Copy URL" onClick={() => copyUrl(asset.url)}>{copied === asset.url ? <Check size={14} /> : <Copy size={14} />}</button>
                  {editing === asset._id ? (
                    <button className="icon-button" title="Save" onClick={() => saveRename(asset)}><Check size={14} /></button>
                  ) : (
                    <button className="icon-button" title="Rename" onClick={() => { setEditing(asset._id); setRename(asset.referenceLabel || asset.alt || ""); }}><Pencil size={14} /></button>
                  )}
                  <button className="icon-button" title="Delete" onClick={() => remove(asset)} style={{ color: "var(--danger, #b91c1c)" }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}