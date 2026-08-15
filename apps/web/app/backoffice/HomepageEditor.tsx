"use client";

import { useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, Minus, Plus, Save, X } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { useDeliveryConfig } from "@/lib/delivery";
import type { HomepageSettings } from "@/lib/site-settings";
import { ImageHint } from "./ImageHint";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type Settings = {
  announcement: string;
  heroBadge: string;
  heroEyebrow: string;
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroSubtitle: string;
  heroImage: string;
  homepage: HomepageSettings;
};

const EMPTY_HOMEPAGE: HomepageSettings = {
  marquee: { items: ["MADE TO AGE", "EDWIN LEATHERS", "SMALL BATCH", "FULL GRAIN"] },
  featured: { eyebrow: "Current selection", title: "Objects for the everyday.", linkLabel: "Shop all" },
  editorial: {
    image: "",
    eyebrow: "Material first",
    title: "The surface should remember you.",
    paragraph: "",
    features: ["Full-grain hides", "Repair-minded construction", "Small-batch finishing"],
    buttonLabel: "How we make it"
  },
  stats: {
    eyebrow: "By the numbers",
    title: "Slow is the point.",
    note: "",
    items: [
      { value: 8, label: "Objects in the collection" },
      { value: 60, label: "Hours of craft per piece" },
      { value: 100, mark: "%", label: "Full-grain leather, always" },
      { value: 4, mark: " days", label: "To reach your door" }
    ]
  },
  categories: {
    eyebrow: "Shop by ritual",
    title: "Where will it go with you?",
    cards: [
      { title: "Bags", copy: "", image: "" },
      { title: "Wallets", copy: "", image: "" },
      { title: "Belts", copy: "", image: "" }
    ]
  },
  newArrivals: { eyebrow: "Recently cut", title: "New to the bench.", note: "From the workshop" },
  closing: { eyebrow: "A slower object", line1: "Not designed for next season.", line2: "Designed for your next decade." }
};

const TABS = ["Hero", "Marquee", "Featured", "Editorial", "Stats", "Categories", "New arrivals", "Closing"] as const;
type Tab = (typeof TABS)[number];

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

function SingleImagePicker({ value, onChange, suggested, label }: { value: string; onChange: (url: string) => void; suggested: string; label: string }) {
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
      {value && (
        <button type="button" className="text-button" onClick={() => fileRef.current?.click()}>{uploading ? <Loader2 size={13} className="spin" /> : "Replace"}</button>
      )}
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && upload(e.target.files[0]).then((url) => url && onChange(url))} />
      <ImageHint suggested={suggested} url={value} />
      {error && <p className="auth-error">{error}</p>}
    </div>
  );
}

function StringList({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="string-list">
      {value.map((item, i) => (
        <div className="string-list__row" key={i}>
          <input value={item} onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} />
          <button type="button" className="text-button" style={{ color: "var(--danger, #b91c1c)" }} onClick={() => onChange(value.filter((_, j) => j !== i))}><Minus size={13} /> Remove</button>
        </div>
      ))}
      <button type="button" className="text-button" onClick={() => onChange([...value, ""])}><Plus size={13} /> Add</button>
    </div>
  );
}

export function HomepageEditor() {
  const delivery = useDeliveryConfig();
  const [form, setForm] = useState<Settings | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<Tab>("Hero");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch(`${API}/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => {
        if (body.ok) {
          const d = body.data ?? {};
          const hp = d.homepage ?? {};
          setForm({
            announcement: d.announcement ?? "",
            heroBadge: d.heroBadge ?? "",
            heroEyebrow: d.heroEyebrow ?? "",
            heroTitleLine1: d.heroTitleLine1 ?? "",
            heroTitleLine2: d.heroTitleLine2 ?? "",
            heroSubtitle: d.heroSubtitle ?? "",
            heroImage: d.heroImage ?? "",
            homepage: {
              marquee: hp.marquee ?? EMPTY_HOMEPAGE.marquee,
              featured: hp.featured ?? EMPTY_HOMEPAGE.featured,
              editorial: { ...EMPTY_HOMEPAGE.editorial, ...(hp.editorial ?? {}) },
              stats: { ...EMPTY_HOMEPAGE.stats, ...(hp.stats ?? {}) },
              categories: { ...EMPTY_HOMEPAGE.categories, ...(hp.categories ?? {}) },
              newArrivals: hp.newArrivals ?? EMPTY_HOMEPAGE.newArrivals,
              closing: hp.closing ?? EMPTY_HOMEPAGE.closing
            }
          });
        }
      })
      .finally(() => setLoaded(true));
  }, []);

  function setHero(key: "heroBadge" | "heroEyebrow" | "heroTitleLine1" | "heroTitleLine2" | "heroSubtitle" | "heroImage" | "announcement") {
    return (value: string) => setForm((f) => (f ? { ...f, [key]: value } : f));
  }
  function setHp<T extends keyof HomepageSettings>(key: T) {
    return (patch: Partial<HomepageSettings[T]>) => setForm((f) => (f ? { ...f, homepage: { ...f.homepage, [key]: { ...(f.homepage[key] as object), ...patch } as HomepageSettings[T] } } : f));
  }

  async function save() {
    if (!form) return;
    setSaving(true);
    setMessage(null);
    const res = await fetch(`${API}/admin/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form)
    });
    const body = await res.json().catch(() => null);
    setSaving(false);
    setMessage(res.ok ? { ok: true, text: "Homepage saved. Changes are live." } : { ok: false, text: body?.error || "Could not save." });
  }

  if (!loaded) return <p className="muted">Loading homepage…</p>;
  if (!form) return <p className="auth-error">Could not load settings.</p>;

  const hp = form.homepage;

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Storefront</span><h2>Homepage editor</h2></div>
        <button className="button button--dark" onClick={save} disabled={saving}>{saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />} {saving ? "Saving…" : "Save changes"}</button>
      </div>

      <div className="admin-note" style={{ marginBottom: 18 }}>
        <p className="muted" style={{ fontSize: 13 }}>Edit any section's content and images below — the storefront keeps the same look. Free delivery applies above <strong>{formatPrice(delivery.freeDeliveryThreshold)}</strong> (set under <em>Delivery</em>).</p>
      </div>

      <div className="status-filter" style={{ marginBottom: 20 }}>
        {TABS.map((t) => <button key={t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === "Hero" && (
        <div className="form-grid">
          <label className="field-wide">Announcement bar <input value={form.announcement} onChange={(e) => setHero("announcement")(e.target.value)} placeholder="Leave blank to auto-show the free-delivery message" /></label>
          <label className="field-wide">Hero image</label>
          <div className="field-wide"><SingleImagePicker value={form.heroImage} onChange={setHero("heroImage")} suggested="1920 × 1280 px · 3:2 wide" label="Hero" /></div>
          <label>Hero badge <input value={form.heroBadge} onChange={(e) => setHero("heroBadge")(e.target.value)} /></label>
          <label>Hero eyebrow <input value={form.heroEyebrow} onChange={(e) => setHero("heroEyebrow")(e.target.value)} /></label>
          <label>Title — line 1 <input value={form.heroTitleLine1} onChange={(e) => setHero("heroTitleLine1")(e.target.value)} /></label>
          <label>Title — line 2 <input value={form.heroTitleLine2} onChange={(e) => setHero("heroTitleLine2")(e.target.value)} /></label>
          <label className="field-wide">Hero subtitle <textarea rows={3} value={form.heroSubtitle} onChange={(e) => setHero("heroSubtitle")(e.target.value)} /></label>
        </div>
      )}

      {tab === "Marquee" && (
        <div className="editor-section">
          <p className="muted" style={{ fontSize: 13 }}>The words that rotate across the top strip. They loop continuously in this order.</p>
          <label>Marquee words</label>
          <StringList value={hp.marquee.items} onChange={(items) => setHp("marquee")({ items })} />
        </div>
      )}

      {tab === "Featured" && (
        <div className="editor-section form-grid">
          <p className="field-wide muted" style={{ fontSize: 13 }}>"Current selection" — products shown are the ones marked <strong>Featured</strong> in the Products section. Edit the heading text here.</p>
          <label>Eyebrow <input value={hp.featured.eyebrow} onChange={(e) => setHp("featured")({ eyebrow: e.target.value })} /></label>
          <label>Title <input value={hp.featured.title} onChange={(e) => setHp("featured")({ title: e.target.value })} /></label>
          <label className="field-wide">Link label <input value={hp.featured.linkLabel} onChange={(e) => setHp("featured")({ linkLabel: e.target.value })} /></label>
        </div>
      )}

      {tab === "Editorial" && (
        <div className="form-grid">
          <label className="field-wide">Image</label>
          <div className="field-wide"><SingleImagePicker value={hp.editorial.image} onChange={(image) => setHp("editorial")({ image })} suggested="1600 × 1000 px · 3:2" label="Editorial" /></div>
          <label>Eyebrow <input value={hp.editorial.eyebrow} onChange={(e) => setHp("editorial")({ eyebrow: e.target.value })} /></label>
          <label>Title <input value={hp.editorial.title} onChange={(e) => setHp("editorial")({ title: e.target.value })} /></label>
          <label className="field-wide">Paragraph <textarea rows={4} value={hp.editorial.paragraph} onChange={(e) => setHp("editorial")({ paragraph: e.target.value })} /></label>
          <label className="field-wide">Feature points</label>
          <div className="field-wide"><StringList value={hp.editorial.features} onChange={(features) => setHp("editorial")({ features })} /></div>
          <label className="field-wide">Button label <input value={hp.editorial.buttonLabel} onChange={(e) => setHp("editorial")({ buttonLabel: e.target.value })} /></label>
        </div>
      )}

      {tab === "Stats" && (
        <div className="form-grid">
          <label>Eyebrow <input value={hp.stats.eyebrow} onChange={(e) => setHp("stats")({ eyebrow: e.target.value })} /></label>
          <label>Title <input value={hp.stats.title} onChange={(e) => setHp("stats")({ title: e.target.value })} /></label>
          <label className="field-wide">Note <textarea rows={2} value={hp.stats.note} onChange={(e) => setHp("stats")({ note: e.target.value })} /></label>
          <div className="field-wide">
            <label>Stat items</label>
            {hp.stats.items.map((item, i) => (
              <div className="stats-row" key={i}>
                <input type="number" value={item.value} onChange={(e) => setHp("stats")({ items: hp.stats.items.map((x, j) => (j === i ? { ...x, value: Number(e.target.value) } : x)) })} placeholder="Value" />
                <input value={item.mark ?? ""} onChange={(e) => setHp("stats")({ items: hp.stats.items.map((x, j) => (j === i ? { ...x, mark: e.target.value } : x)) })} placeholder="Mark (%)" style={{ width: 80 }} />
                <input className="stats-row__label" value={item.label} onChange={(e) => setHp("stats")({ items: hp.stats.items.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })} placeholder="Label" />
                <button type="button" className="text-button" style={{ color: "var(--danger, #b91c1c)" }} onClick={() => setHp("stats")({ items: hp.stats.items.filter((_, j) => j !== i) })}><Minus size={13} /></button>
              </div>
            ))}
            <button type="button" className="text-button" onClick={() => setHp("stats")({ items: [...hp.stats.items, { value: 0, mark: "", label: "" }] })}><Plus size={13} /> Add stat</button>
          </div>
        </div>
      )}

      {tab === "Categories" && (
        <div className="form-grid">
          <label>Eyebrow <input value={hp.categories.eyebrow} onChange={(e) => setHp("categories")({ eyebrow: e.target.value })} /></label>
          <label>Title <input value={hp.categories.title} onChange={(e) => setHp("categories")({ title: e.target.value })} /></label>
          {hp.categories.cards.map((card, i) => (
            <div className="field-wide category-card-editor" key={i}>
              <div className="admin-panel__head"><div><span className="eyebrow">Card {i + 1}</span><h3 style={{ margin: 0 }}>{card.title || "Category"}</h3></div></div>
              <div className="form-grid">
                <label>Title <input value={card.title} onChange={(e) => setHp("categories")({ cards: hp.categories.cards.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} /></label>
                <label>Image</label>
                <div><SingleImagePicker value={card.image} onChange={(image) => setHp("categories")({ cards: hp.categories.cards.map((x, j) => (j === i ? { ...x, image } : x)) })} suggested="1000 × 1500 px · 2:3" label={`Category ${i + 1}`} /></div>
                <label className="field-wide">Copy <textarea rows={2} value={card.copy} onChange={(e) => setHp("categories")({ cards: hp.categories.cards.map((x, j) => (j === i ? { ...x, copy: e.target.value } : x)) })} /></label>
              </div>
              <button type="button" className="text-button" style={{ color: "var(--danger, #b91c1c)" }} onClick={() => setHp("categories")({ cards: hp.categories.cards.filter((_, j) => j !== i) })}><Minus size={13} /> Remove card</button>
            </div>
          ))}
          <button type="button" className="text-button field-wide" onClick={() => setHp("categories")({ cards: [...hp.categories.cards, { title: "", copy: "", image: "" }] })}><Plus size={13} /> Add category card</button>
        </div>
      )}

      {tab === "New arrivals" && (
        <div className="editor-section form-grid">
          <p className="field-wide muted" style={{ fontSize: 13 }}>Products shown here are marked as <strong>New arrival</strong> in the Products section. Edit the heading text below.</p>
          <label>Eyebrow <input value={hp.newArrivals.eyebrow} onChange={(e) => setHp("newArrivals")({ eyebrow: e.target.value })} /></label>
          <label>Title <input value={hp.newArrivals.title} onChange={(e) => setHp("newArrivals")({ title: e.target.value })} /></label>
          <label className="field-wide">Note <input value={hp.newArrivals.note} onChange={(e) => setHp("newArrivals")({ note: e.target.value })} /></label>
        </div>
      )}

      {tab === "Closing" && (
        <div className="editor-section form-grid">
          <label>Eyebrow <input value={hp.closing.eyebrow} onChange={(e) => setHp("closing")({ eyebrow: e.target.value })} /></label>
          <label className="field-wide">Line 1 <input value={hp.closing.line1} onChange={(e) => setHp("closing")({ line1: e.target.value })} /></label>
          <label className="field-wide">Line 2 <input value={hp.closing.line2} onChange={(e) => setHp("closing")({ line2: e.target.value })} /></label>
        </div>
      )}

      {message && <p className={message.ok ? "ok-note" : "auth-error"} style={{ marginTop: 20 }}>{message.text}</p>}
    </div>
  );
}