"use client";

import { useEffect, useState } from "react";
import { Star, BadgeCheck } from "lucide-react";
import { Reveal } from "./Reveal";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type ReviewImage = { url: string; publicId?: string; alt?: string };
type Review = {
  id: string;
  productName?: string;
  authorName: string;
  location?: string;
  rating: number;
  title?: string;
  body: string;
  images: ReviewImage[];
  verifiedPurchase: boolean;
  featured: boolean;
  createdAt: string;
};

type Summary = {
  average: number;
  total: number;
  distribution: { rating: number; count: number }[];
  reviews: Review[];
};

function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="reviews__stars" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={n <= Math.round(value) ? "currentColor" : "none"} color="var(--star, #d4a24c)" />
      ))}
    </span>
  );
}

function formatDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

export function Reviews() {
  const [data, setData] = useState<Summary | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`${API}/reviews`, { cache: "no-store" })
      .then((r) => r.json())
      .then((body) => {
        if (body?.ok) setData(body.data);
        else setError(true);
      })
      .catch(() => setError(true));
  }, []);

  const total = data?.total ?? 0;
  const average = data?.average ?? 0;
  const reviews = data?.reviews ?? [];
  const maxCount = Math.max(1, ...(data?.distribution ?? []).map((d) => d.count));

  return (
    <section className="section reviews">
      <div className="container">
        <Reveal>
          <div className="section-heading">
            <div><span className="eyebrow">Word of mouth</span><h2>Carried daily, loved longer.</h2></div>
          </div>
        </Reveal>

        {error ? (
          <p className="muted">Reviews are on the way — check back soon.</p>
        ) : (
          <Reveal delay={0.08}>
            <div className="reviews__overview">
              <div className="reviews__score">
                <strong className="reviews__score-num">{total ? average.toFixed(1) : "—"}</strong>
                <Stars value={average} size={18} />
                <span className="reviews__count">{total ? `${total} review${total === 1 ? "" : "s"}` : "No reviews yet"}</span>
              </div>

              <div className="reviews__meter">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = data?.distribution.find((d) => d.rating === star)?.count ?? 0;
                  const pct = total ? Math.round((count / total) * 100) : 0;
                  return (
                    <div className="reviews__meter-row" key={star}>
                      <span className="reviews__meter-label">{star} <Star size={11} fill="currentColor" color="currentColor" /></span>
                      <div className="reviews__meter-track"><div className="reviews__meter-fill" style={{ width: `${total ? (count / maxCount) * 100 : 0}%` }} /></div>
                      <span className="reviews__meter-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
        )}

        {!error && reviews.length > 0 && (
          <div className="reviews__list">
            {reviews.map((review) => (
              <article className="review" key={review.id}>
                <div className="review__top">
                  <div>
                    <div className="review__author">{review.authorName}{review.verifiedPurchase && <BadgeCheck size={14} className="review__verified" aria-label="Verified purchase" />}</div>
                    {review.location && <div className="review__meta">{review.location}</div>}
                  </div>
                  <div className="review__side">
                    <Stars value={review.rating} />
                    {review.productName && <div className="review__product">{review.productName}</div>}
                  </div>
                </div>
                {review.title && <h3 className="review__title">{review.title}</h3>}
                <p className="review__body">{review.body}</p>
                {review.images.length > 0 && (
                  <div className="review__photos">
                    {review.images.map((img, i) => <img key={i} src={img.url} alt={img.alt || review.title || "Review photo"} loading="lazy" />)}
                  </div>
                )}
                <span className="review__date">{formatDate(review.createdAt)}</span>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}