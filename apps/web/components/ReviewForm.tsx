"use client";

import { useEffect, useState } from "react";
import { ImagePlus, Loader2, Star, X } from "lucide-react";
import { logAndGeneric } from "@/lib/errors";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type PublicReview = { id: string; authorName: string; location?: string; rating: number; title: string; body: string; images?: { url: string }[]; verifiedPurchase: boolean; createdAt: string };
type ReviewImage = { url: string; publicId: string };

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function ReviewForm({ product }: { product: { id: string; name: string } }) {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [form, setForm] = useState({ title: "", body: "", authorName: "", location: "" });
  const [pending, setPending] = useState<{ dataUri: string; name: string }[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch(`${API}/reviews?productId=${encodeURIComponent(product.id)}`)
      .then((r) => r.json())
      .then((body) => setReviews(body?.data?.reviews ?? []))
      .catch(() => {});
  }, [product.id]);

  const MAX_IMAGES = 4;
  const MAX_SIZE = 2 * 1024 * 1024;

  async function addFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const tooLarge = files.find((f) => f.size > MAX_SIZE);
    if (tooLarge) {
      setMessage({ ok: false, text: `"${tooLarge.name}" is larger than 2MB. Please choose smaller photos.` });
      e.target.value = "";
      return;
    }
    const room = MAX_IMAGES - pending.length;
    const picked = files.slice(0, room);
    const items = await Promise.all(picked.map(async (f) => ({ dataUri: await fileToDataUri(f), name: f.name })));
    setPending((p) => [...p, ...items]);
    setMessage(null);
    e.target.value = "";
  }

  function removePending(index: number) {
    setPending((p) => p.filter((_, i) => i !== index));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const images: ReviewImage[] = [];
    for (const item of pending) {
      try {
        const res = await fetch(`${API}/reviews/media/upload`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ dataUri: item.dataUri })
        });
        const body = await res.json().catch(() => null);
        if (!res.ok || !body?.url) throw new Error(body?.error || "Upload failed");
        images.push({ url: body.url, publicId: body.publicId });
      } catch (cause) {
        setSubmitting(false);
        setMessage({ ok: false, text: logAndGeneric(cause, "review:upload") });
        return;
      }
    }

    const res = await fetch(`${API}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, rating, title: form.title.trim(), body: form.body.trim(), authorName: form.authorName.trim(), location: form.location.trim() || undefined, images })
    }).catch((cause) => { setSubmitting(false); setMessage({ ok: false, text: logAndGeneric(cause, "review:submit") }); return null; });
    if (!res) return;
    const body = await res.json().catch(() => null);
    setSubmitting(false);
    if (res.ok) {
      setMessage({ ok: true, text: "Thanks! Your review is submitted and will appear once we approve it." });
      setForm({ title: "", body: "", authorName: "", location: "" });
      setPending([]);
      setRating(5);
    } else {
      setMessage({ ok: false, text: body?.error ? logAndGeneric(body.error, "review:submit") : "Could not submit your review." });
    }
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <section className="reviews-section container">
      <div className="section-heading"><div><span className="eyebrow">Reviews</span><h2>What people think.</h2></div></div>

      {reviews.length > 0 && (
        <div className="reviews-grid">
          {reviews.map((review) => (
            <article className="review-card" key={review.id}>
              <div className="review-card__stars">{Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />)}</div>
              <h3>{review.title}</h3>
              <p>{review.body}</p>
              {review.images && review.images.length > 0 && (
                <div className="review-card__images">{review.images.map((img, i) => <img key={i} src={img.url} alt="" loading="lazy" />)}</div>
              )}
              <span className="review-card__author">{review.authorName}{review.verifiedPurchase && <em> · Verified purchase</em>}{review.location ? ` · ${review.location}` : ""}</span>
            </article>
          ))}
        </div>
      )}

      <form className="review-form" onSubmit={submit}>
        <div className="admin-panel__head"><div><span className="eyebrow">Your take</span><h3 style={{ margin: 0 }}>Write a review of {product.name}</h3></div></div>

        <div className="form-grid">
          <label className="field-wide">Rating
            <div className="review-rating">
              {Array.from({ length: 5 }).map((_, i) => (
                <button type="button" key={i} onMouseEnter={() => setHover(i + 1)} onMouseLeave={() => setHover(0)} onClick={() => setRating(i + 1)} aria-label={`${i + 1} star`}>
                  <Star size={24} fill={i < (hover || rating) ? "currentColor" : "none"} />
                </button>
              ))}
              <span className="muted">{rating} / 5</span>
            </div>
          </label>
          <label>Your name <input value={form.authorName} onChange={set("authorName")} required /></label>
          <label>Location <input value={form.location} onChange={set("location")} placeholder="City, optional" /></label>
          <label className="field-wide">Title <input value={form.title} onChange={set("title")} placeholder="A short headline" required /></label>
          <label className="field-wide">Review <textarea rows={4} value={form.body} onChange={set("body")} placeholder="How has it held up?" required /></label>
          <div className="field-wide">
            <label className="review-photos">Add photos {pending.length}/{MAX_IMAGES}
              <div className="review-photos__row">
                {pending.map((item, i) => (
                  <div className="review-photo" key={i}>
                    <img src={item.dataUri} alt="" />
                    <button type="button" onClick={() => removePending(i)} aria-label="Remove photo"><X size={14} /></button>
                  </div>
                ))}
                {pending.length < MAX_IMAGES && (
                  <label className="review-photos__add">
                    <ImagePlus size={20} />
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple onChange={addFiles} />
                  </label>
                )}
              </div>
              <small className="muted">Up to 4 photos, max 2MB each. You must be signed in with a verified email to upload.</small>
            </label>
          </div>
        </div>

        <div className="form-actions" style={{ marginTop: 16 }}>
          <button type="submit" className="button button--dark" disabled={submitting}>{submitting ? <><span className="btn-spinner" aria-hidden="true" /> Submitting…</> : "Submit review"}</button>
        </div>
        {message && <p className={message.ok ? "ok-note" : "auth-error"} style={{ marginTop: 12 }}>{message.text}</p>}
      </form>
    </section>
  );
}
