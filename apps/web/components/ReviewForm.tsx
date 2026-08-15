"use client";

import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type PublicReview = { id: string; authorName: string; location?: string; rating: number; title: string; body: string; verifiedPurchase: boolean; createdAt: string };

export function ReviewForm({ product }: { product: { id: string; name: string } }) {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [form, setForm] = useState({ title: "", body: "", authorName: "", location: "" });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch(`${API}/reviews?productId=${encodeURIComponent(product.id)}`)
      .then((r) => r.json())
      .then((body) => setReviews(body?.data?.reviews ?? []))
      .catch(() => {});
  }, [product.id]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    const res = await fetch(`${API}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: product.id, rating, title: form.title.trim(), body: form.body.trim(), authorName: form.authorName.trim(), location: form.location.trim() || undefined })
    });
    const body = await res.json().catch(() => null);
    setSubmitting(false);
    if (res.ok) {
      setMessage({ ok: true, text: "Thanks! Your review is submitted and will appear once we approve it." });
      setForm({ title: "", body: "", authorName: "", location: "" });
    } else {
      setMessage({ ok: false, text: body?.error || "Could not submit your review." });
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
        </div>

        <div className="form-actions" style={{ marginTop: 16 }}>
          <button type="submit" className="button button--dark" disabled={submitting}>{submitting ? <Loader2 size={15} className="spin" /> : null} {submitting ? "Submitting…" : "Submit review"}</button>
        </div>
        {message && <p className={message.ok ? "ok-note" : "auth-error"} style={{ marginTop: 12 }}>{message.text}</p>}
      </form>
    </section>
  );
}