"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, ImagePlus, Loader2, X } from "lucide-react";
import { formatPrice } from "@/lib/format";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type ImageAsset = { url: string; publicId: string; alt?: string };
type Product = {
  _id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  images: ImageAsset[];
  active: boolean;
};

type Gate = { status: "loading" } | { status: "denied" } | { status: "ok"; user: { role: string } };

export function ProductsManager() {
  const [gate, setGate] = useState<Gate>({ status: "loading" });
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch(`${API}/account/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => {
        if (body?.ok && (body.user?.role === "admin" || body.user?.role === "superadmin")) {
          setGate({ status: "ok", user: body.user });
        } else {
          setGate({ status: "denied" });
        }
      })
      .catch(() => setGate({ status: "denied" }));
  }, []);

  const load = useCallback(() => {
    fetch(`${API}/admin/products`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => setProducts(body?.data ?? []))
      .catch(() => setProducts([]));
  }, []);

  useEffect(() => {
    if (gate.status === "ok") load();
  }, [gate.status, load]);

  if (gate.status === "loading") return <div className="admin-panel">Checking admin access…</div>;
  if (gate.status === "denied")
    return (
      <section className="admin-panel admin-note">
        <span className="eyebrow">Access</span>
        <h2>Admin sign-in required</h2>
        <p>Log in with an admin account to manage products and upload imagery via Cloudinary.</p>
        <a className="button button--cream" href="/login?returnTo=/backoffice">Sign in</a>
      </section>
    );

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Catalog</span><h2>Products</h2></div>
        <button className="button button--dark" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Close" : <>Add product <ArrowUpRight size={15} /></>}
        </button>
      </div>
      {showForm && <ProductForm onSaved={() => { setShowForm(false); load(); }} />}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Image</th><th>Name</th><th>Category</th><th>Price</th><th>Status</th></tr></thead>
          <tbody>
            {products.length === 0 && <tr><td colSpan={5} className="muted">No products yet.</td></tr>}
            {products.map((p) => (
              <tr key={p._id}>
                <td>{p.images?.[0] ? <img src={p.images[0].url} alt="" width={44} height={52} style={{ objectFit: "cover", borderRadius: 8 }} /> : <span className="muted">—</span>}</td>
                <td><strong>{p.name}</strong></td>
                <td>{p.category}</td>
                <td>{formatPrice(p.price)}</td>
                <td><span className={`status ${p.active ? "status--confirmed" : ""}`}>{p.active ? "Active" : "Hidden"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductForm({ onSaved }: { onSaved: () => void }) {
  const [form, setForm] = useState({ name: "", slug: "", category: "", price: "", description: "" });
  const [images, setImages] = useState<ImageAsset[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
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
        body: JSON.stringify({ dataUri })
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
    setSaving(true);
    try {
      const res = await fetch(`${API}/admin/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          slug: form.slug.trim(),
          name: form.name.trim(),
          category: form.category.trim(),
          price: Number(form.price),
          description: form.description.trim(),
          images,
          active: true,
          variants: []
        })
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
    <form className="checkout-form" onSubmit={submit} style={{ borderTop: "1px solid var(--line)", paddingTop: 22, marginTop: 4 }}>
      <div className="form-grid">
        <label className="field-wide">Name <input value={form.name} onChange={set("name")} required /></label>
        <label>Slug <input value={form.slug} onChange={set("slug")} placeholder="weekender-no-01" required /></label>
        <label>Category <input value={form.category} onChange={set("category")} required /></label>
        <label>Price (₹) <input type="number" min="0" value={form.price} onChange={set("price")} required /></label>
      </div>
      <label>Description <textarea rows={3} value={form.description} onChange={set("description")} required /></label>

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

      {error && <p className="auth-error">{error}</p>}
      <button type="submit" className="button button--dark" disabled={saving || uploading} style={{ alignSelf: "flex-start" }}>
        {saving ? "Saving…" : "Save product"}
      </button>
    </form>
  );
}