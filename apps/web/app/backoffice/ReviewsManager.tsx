"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, Loader2, Save, Star, Trash2, X } from "lucide-react";
import { ImageHint } from "./ImageHint";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type ReviewImage = { url: string; publicId?: string; alt?: string };
type Review = {
  _id: string;
  productId?: string;
  productName?: string;
  authorName: string;
  location?: string;
  rating: number;
  title?: string;
  body: string;
  images: ReviewImage[];
  verifiedPurchase: boolean;
  featured: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
};

const emptyReview = () => ({
  productId: "",
  productName: "",
  authorName: "",
  location: "",
  rating: 5,
  title: "",
  body: "",
  images: [] as ReviewImage[],
  verifiedPurchase: true,
  featured: false,
  status: "approved" as const
});

function StarRow({ value, onChange, size = 15 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <span className="rating-input" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          fill={n <= value ? "currentColor" : "none"}
          onClick={onChange ? () => onChange(n) : undefined}
          style={onChange ? { cursor: "pointer" } : undefined}
          color={n <= value ? "var(--star, #d4a24c)" : "var(--muted)"}
        />
      ))}
    </span>
  );
}

function ReviewForm({ review, products, onSaved, onClose }: { review: Review | null; products: { _id: string; name: string }[]; onSaved: () => void; onClose: () => void }) {
  const [form, setForm] = useState(() =>
    review
      ? { productId: review.productId ?? "", productName: review.productName ?? "", authorName: review.authorName, location: review.location ?? "", rating: review.rating, title: review.title ?? "", body: review.body, verifiedPurchase: review.verifiedPurchase, featured: review.featured, status: review.status }
      : emptyReview()
  );
  const [images, setImages] = useState<ReviewImage[]>(review?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

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
        body: JSON.stringify({ dataUri, category: "review", filename: file.name, mimeType: file.type, size: file.size })
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

  function removeImage(publicId?: string) {
    setImages((list) => list.filter((i) => i.publicId !== publicId));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const body = {
      ...form,
      productId: form.productId || undefined,
      productName: form.productName || products.find((p) => p._id === form.productId)?.name || undefined,
      images
    };
    const res = await fetch(review ? `${API}/admin/reviews/${review._id}` : `${API}/admin/reviews`, {
      method: review ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (!res.ok) return setError(data?.error || "Could not save review");
    onSaved();
  }

  return (
    <form className="checkout-form" onSubmit={submit} style={{ borderTop: "1px solid var(--line)", paddingTop: 18 }}>
      <div className="form-grid">
        <label>Author name
          <input value={form.authorName} onChange={set("authorName")} placeholder="e.g. Aarav Sharma" required />
        </label>
        <label>Location (optional)
          <input value={form.location} onChange={set("location")} placeholder="e.g. New Delhi" />
        </label>
        <label>Product (optional)
          <select value={form.productId} onChange={set("productId")}>
            <option value="">— General review —</option>
            {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </label>
        <label>Rating
          <div className="rating-field"><StarRow value={form.rating} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} size={22} /><span className="muted">{form.rating} / 5</span></div>
        </label>
        <label className="field-wide">Title (optional)
          <input value={form.title} onChange={set("title")} placeholder="Short headline" />
        </label>
        <label className="field-wide">Review
          <textarea value={form.body} onChange={set("body")} rows={3} placeholder="What did they love?" required />
        </label>
      </div>

      <div style={{ marginTop: 12 }}><span className="admin-form__label">Photos</span>
        <div className="img-grid">
          {images.map((img, i) => (
            <div key={img.publicId || i} className="img-thumb">
              <img src={img.url} alt="" />
              <button type="button" onClick={() => removeImage(img.publicId)} className="icon-button img-thumb__remove" aria-label="Remove image"><X size={13} /></button>
            </div>
          ))}
          <button type="button" className="button button--ghost img-add" disabled={uploading} onClick={() => fileRef.current?.click()}>
            {uploading ? <Loader2 size={16} className="spin" /> : <ImagePlus size={16} />}
            {uploading ? "Uploading" : "Add"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && uploadFile(e.target.files[0])} />
        </div>
      </div>
      <ImageHint suggested="800 × 800 px · 1:1 square" url={images[0]?.url} />

      <div className="form-actions" style={{ marginTop: 14 }}>
        <label className="toggle-label"><input type="checkbox" checked={form.verifiedPurchase} onChange={(e) => setForm((f) => ({ ...f, verifiedPurchase: e.target.checked }))} /> Verified purchase</label>
        <label className="toggle-label"><input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} /> Feature on landing</label>
        <label className="toggle-label"><input type="checkbox" checked={form.status === "approved"} onChange={(e) => setForm((f) => ({ ...f, status: e.target.checked ? "approved" : "pending" }))} /> Publish (approved)</label>
      </div>

      {error && <p className="auth-error">{error}</p>}
      <div className="form-actions">
        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="button button--ghost" onClick={onClose}><X size={15} /> Cancel</button>
          <button type="submit" className="button button--dark" disabled={saving || uploading}><Save size={14} /> {review ? "Save changes" : "Add review"}</button>
        </div>
      </div>
    </form>
  );
}

export function ReviewsManager() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<{ _id: string; name: string }[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await fetch(`${API}/admin/reviews`, { credentials: "include" });
      const body = await res.json();
      if (body?.ok) setReviews(body.data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    fetch(`${API}/admin/products`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => setProducts((body?.data ?? []).map((p: { _id: string; name: string }) => ({ _id: p._id, name: p.name }))))
      .catch(() => {});
  }, []);

  async function setStatus(review: Review, status: "approved" | "rejected") {
    const res = await fetch(`${API}/admin/reviews/${review._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status })
    });
    const body = await res.json();
    if (body?.ok) {
      setReviews((list) => list.map((r) => (r._id === review._id ? { ...r, status } : r)));
      setEditing(null);
    }
  }

  async function remove(review: Review) {
    if (!confirm(`Delete this review from ${review.authorName}?`)) return;
    const res = await fetch(`${API}/admin/reviews/${review._id}`, { method: "DELETE", credentials: "include" });
    if (res.ok) setReviews((list) => list.filter((r) => r._id !== review._id));
  }

  const visible = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);
  const statusBadge = (s: Review["status"]) => (s === "approved" ? "status status--confirmed" : s === "rejected" ? "status" : "status status--pending");

  return (
    <div>
      <header className="admin-header">
        <div><span className="eyebrow">Customer love</span><h1>Reviews</h1></div>
        <div className="admin-header__actions">
          <button className="button button--dark" onClick={() => { setEditing(null); setCreating(true); }}><Star size={15} /> Add review</button>
        </div>
      </header>

      <div className="status-filter">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button key={f} className={filter === f ? "active" : ""} onClick={() => setFilter(f)}>{f} ({f === "all" ? reviews.length : reviews.filter((r) => r.status === f).length})</button>
        ))}
      </div>

      {(creating || editing) && (
        <section className="admin-panel">
          <div className="admin-panel__head"><div><span className="eyebrow">{editing ? "Edit review" : "New review"}</span><h2>{editing ? "Update review" : "Add a review manually"}</h2></div></div>
          <ReviewForm key={editing?._id ?? "new"} review={editing} products={products} onSaved={() => { setCreating(false); setEditing(null); load(); }} onClose={() => { setCreating(false); setEditing(null); }} />
        </section>
      )}

      {loading ? <p className="muted">Loading reviews…</p> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Author</th><th>Rating</th><th>Review</th><th>Product</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th></tr></thead>
            <tbody>
              {visible.length === 0 && <tr><td colSpan={6} className="muted">No reviews{filter !== "all" ? ` ${filter}` : ""}.</td></tr>}
              {visible.map((r) => (
                <tr key={r._id}>
                  <td><strong>{r.authorName}</strong>{r.location && <span className="muted" style={{ display: "block", fontSize: 11 }}>{r.location}</span>}</td>
                  <td><StarRow value={r.rating} size={13} /></td>
                  <td style={{ maxWidth: 340 }}><strong>{r.title}</strong>{r.body && <div className="muted" style={{ fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.body}</div>}{r.images.length > 0 && <span className="muted" style={{ fontSize: 11 }}>{r.images.length} photo{r.images.length > 1 ? "s" : ""}</span>}</td>
                  <td className="muted">{r.productName || "General"}</td>
                  <td><span className={statusBadge(r.status)}>{r.status}</span></td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    {r.status !== "approved" && <button className="text-button" onClick={() => setStatus(r, "approved")}>Approve</button>}
                    {r.status !== "rejected" && <button className="text-button" style={{ color: "var(--danger, #b91c1c)" }} onClick={() => setStatus(r, "rejected")}>Reject</button>}
                    <button className="text-button" onClick={() => setEditing(r)}>Edit</button>
                    <button className="text-button" style={{ color: "var(--danger, #b91c1c)" }} onClick={() => remove(r)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}