"use client";

import { useEffect, useRef, useState } from "react";
import { GripVertical, ImagePlus, Loader2, Minus, Plus, Save, Trash2, X } from "lucide-react";
import { ImageHint } from "./ImageHint";
import type { PageBlock, PageContentData, PageKey } from "@/lib/pages";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

const PAGE_LABELS: Record<PageKey, string> = {
  story: "Our Story",
  about: "About Us",
  shipping: "Shipping Policy",
  returns: "Returns & Refund",
  terms: "Terms & Conditions",
  privacy: "Privacy Policy"
};

const BLOCK_TYPES = ["statement", "image-text", "values", "image-band", "cta", "policy-section"] as const;

type BlockType = (typeof BLOCK_TYPES)[number];

function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File): Promise<string | null> {
    setError(null);
    if (!file.type.startsWith("image/")) { setError("Please choose an image file."); return null; }
    if (file.size > 10 * 1024 * 1024) { setError("Image must be under 10MB."); return null; }
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
        body: JSON.stringify({ dataUri, category: "page", filename: file.name, mimeType: file.type, size: file.size })
      });
      const body = await res.json();
      if (!res.ok) { setError(body?.error || "Upload failed"); return null; }
      return body.url as string;
    } catch {
      setError("Upload failed. Is Cloudinary configured?");
      return null;
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return { uploading, error, fileRef, upload };
}

function PageImagePicker({ value, onChange, label, suggested }: { value: string; onChange: (url: string) => void; label: string; suggested: string }) {
  const { uploading, error, fileRef, upload } = useImageUpload();
  return (
    <div className="single-image-picker">
      {value ? (
        <div className="hero-image-preview">
          <img src={value} alt={label} />
          <button type="button" className="icon-button hero-image-clear" onClick={() => onChange("")} aria-label="Remove image"><X size={14} /></button>
        </div>
      ) : (
        <button type="button" className="button button--ghost hero-image-empty" disabled={uploading} onClick={() => fileRef.current?.click()}>
          {uploading ? <Loader2 size={18} className="spin" /> : <ImagePlus size={18} />}
          {uploading ? "Uploading…" : "Upload"}
        </button>
      )}
      {value && <button type="button" className="text-button" onClick={() => fileRef.current?.click()}>{uploading ? <Loader2 size={13} className="spin" /> : "Replace"}</button>}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0]).then((url) => url && onChange(url))} />
      <ImageHint suggested={suggested} url={value} />
      {error && <p className="auth-error">{error}</p>}
    </div>
  );
}

const EMPTY_BLOCK: PageBlock = { type: "statement", heading: "", body: "" };

function BlockEditor({ block, onChange, onRemove }: { block: PageBlock; onChange: (b: PageBlock) => void; onRemove: () => void }) {
  const set = (patch: Partial<PageBlock>) => onChange({ ...block, ...patch });
  return (
    <div className="category-card-editor">
      <div className="admin-panel__head">
        <div className="block-drag"><GripVertical size={15} /><span className="eyebrow">{block.type}</span></div>
        <button type="button" className="text-button" style={{ color: "var(--danger, #b91c1c)" }} onClick={onRemove}><Trash2 size={13} /> Remove</button>
      </div>
      <div className="form-grid">
        <label>Type
          <select value={block.type} onChange={(e) => set({ type: e.target.value as BlockType })}>
            {BLOCK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        {block.type !== "values" && <label>Number <input value={block.number ?? ""} onChange={(e) => set({ number: e.target.value })} placeholder="01" /></label>}
        {block.type === "image-text" && (
          <label className="toggle-label" style={{ justifyContent: "flex-start" }}>
            <input type="checkbox" checked={!!block.reverse} onChange={(e) => set({ reverse: e.target.checked })} /> Reverse layout
          </label>
        )}
        {block.type !== "policy-section" && <label className="field-wide">Eyebrow <input value={block.eyebrow ?? ""} onChange={(e) => set({ eyebrow: e.target.value })} /></label>}
        <label className="field-wide">Heading <textarea rows={2} value={block.heading ?? ""} onChange={(e) => set({ heading: e.target.value })} placeholder={block.type === "policy-section" ? "Section title" : "Use a newline to italicise the last line"} /></label>
        {block.type !== "values" && <label className="field-wide">Body <textarea rows={3} value={block.body ?? ""} onChange={(e) => set({ body: e.target.value })} /></label>}
        {["image-text", "image-band"].includes(block.type) && (
          <>
            <label className="field-wide">Image</label>
            <div className="field-wide"><PageImagePicker value={block.image ?? ""} onChange={(image) => set({ image })} label={block.type} suggested={block.type === "image-text" ? "1500 px wide" : "2200 px wide"} /></div>
          </>
        )}
        {["cta", "image-text"].includes(block.type) && (
          <>
            <label>Button label <input value={block.buttonLabel ?? ""} onChange={(e) => set({ buttonLabel: e.target.value })} /></label>
            <label>Button link <input value={block.buttonHref ?? ""} onChange={(e) => set({ buttonHref: e.target.value })} placeholder="/shop" /></label>
          </>
        )}
        {block.type === "values" && (
          <div className="field-wide">
            <label>Value items</label>
            {(block.items ?? []).map((item, i) => (
              <div className="category-card-editor" key={i} style={{ marginTop: 12 }}>
                <label>Title <input value={item.title ?? ""} onChange={(e) => set({ items: (block.items ?? []).map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} /></label>
                <label>Body <textarea rows={2} value={item.body ?? ""} onChange={(e) => set({ items: (block.items ?? []).map((x, j) => (j === i ? { ...x, body: e.target.value } : x)) })} /></label>
                <button type="button" className="text-button" style={{ color: "var(--danger, #b91c1c)" }} onClick={() => set({ items: (block.items ?? []).filter((_, j) => j !== i) })}><Minus size={13} /> Remove</button>
              </div>
            ))}
            <button type="button" className="text-button" onClick={() => set({ items: [...(block.items ?? []), { title: "", body: "" }] })}><Plus size={13} /> Add value</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function PageEditor() {
  const [page, setPage] = useState<PageKey>("story");
  const [content, setContent] = useState<PageContentData | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    fetch(`${API}/admin/pages/${page}`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => { if (!cancelled && body.ok) setContent(body.data as PageContentData); })
      .catch(() => undefined)
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [page]);

  const setHero = (patch: Partial<PageContentData["hero"]>) =>
    setContent((c) => (c ? { ...c, hero: { ...c.hero, ...patch } } : c));

  async function save() {
    if (!content) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch(`${API}/admin/pages/${page}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content })
    });
    const body = await res.json().catch(() => null);
    setSaving(false);
    setMessage(res.ok ? { ok: true, text: "Page saved. Changes are live." } : { ok: false, text: body?.error || "Could not save." });
  }

  if (!loaded) return <p className="muted">Loading page content…</p>;
  if (!content) return <p className="auth-error">Could not load page content.</p>;

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Pages</span><h2>Customize page</h2></div>
        <button className="button button--dark" onClick={save} disabled={saving}>{saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />} {saving ? "Saving…" : "Save changes"}</button>
      </div>

      <div className="admin-note" style={{ marginBottom: 18 }}>
        <p className="muted" style={{ fontSize: 13 }}>Pick a page and edit its text and images. Heading text: put a <strong>newline</strong> in a field to italicise that last line, like the storefront does.</p>
      </div>

      <div className="status-filter" style={{ marginBottom: 20 }}>
        {(Object.keys(PAGE_LABELS) as PageKey[]).map((key) => (
          <button key={key} className={page === key ? "active" : ""} onClick={() => setPage(key)}>{PAGE_LABELS[key]}</button>
        ))}
      </div>

      <div className="editor-section">
        <div className="admin-panel__head"><div><span className="eyebrow">Hero</span><h3 style={{ margin: 0 }}>Page intro</h3></div></div>
        <div className="form-grid">
          <label className="field-wide">Page title <input value={content.title} onChange={(e) => setContent((c) => (c ? { ...c, title: e.target.value } : c))} /></label>
          <label>Eyebrow <input value={content.hero.eyebrow ?? ""} onChange={(e) => setHero({ eyebrow: e.target.value })} /></label>
          <label>Heading <input value={content.hero.heading ?? ""} onChange={(e) => setHero({ heading: e.target.value })} /></label>
          <label className="field-wide">Subheading <textarea rows={3} value={content.hero.subheading ?? ""} onChange={(e) => setHero({ subheading: e.target.value })} /></label>
          <label className="field-wide">Effective date <input value={content.hero.effective ?? ""} onChange={(e) => setHero({ effective: e.target.value })} placeholder="e.g. Effective: 15 August 2026" /></label>
          {(page === "story" || page === "about") && (
            <>
              <label>Button label <input value={content.hero.buttonLabel ?? ""} onChange={(e) => setHero({ buttonLabel: e.target.value })} /></label>
              <label>Button link <input value={content.hero.buttonHref ?? ""} onChange={(e) => setHero({ buttonHref: e.target.value })} placeholder="/shop" /></label>
            </>
          )}
          {(page === "story" || page === "about") && (
            <>
              <label className="field-wide">Hero image</label>
              <div className="field-wide"><PageImagePicker value={content.hero.image ?? ""} onChange={(image) => setHero({ image })} label="Hero" suggested={page === "story" ? "1920 px wide" : "1600 px wide"} /></div>
            </>
          )}
        </div>
      </div>

      <div className="editor-section" style={{ marginTop: 28 }}>
        <div className="admin-panel__head">
          <div><span className="eyebrow">Body</span><h3 style={{ margin: 0 }}>Sections</h3></div>
          <button type="button" className="text-button" onClick={() => setContent((c) => (c ? { ...c, blocks: [...c.blocks, { ...EMPTY_BLOCK }] } : c))}><Plus size={13} /> Add section</button>
        </div>
        <p className="muted" style={{ fontSize: 13 }}>Reorder with the drag handle. Types: statement, image-text, values, image-band, cta, policy-section.</p>
        <div className="block-list">
          {content.blocks.map((block, i) => (
            <div key={i} style={{ marginBottom: 18 }}>
              <BlockEditor
                block={block}
                onChange={(b) => setContent((c) => (c ? { ...c, blocks: c.blocks.map((x, j) => (j === i ? b : x)) } : c))}
                onRemove={() => setContent((c) => (c ? { ...c, blocks: c.blocks.filter((_, j) => j !== i) } : c))}
              />
            </div>
          ))}
        </div>
      </div>

      {message && <p className={message.ok ? "ok-note" : "auth-error"} style={{ marginTop: 20 }}>{message.text}</p>}
    </div>
  );
}