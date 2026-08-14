"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";

export function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="feedback-success">
        <span className="feedback-success__icon"><Check size={26} /></span>
        <span className="eyebrow">Thank you</span>
        <h2>Your feedback helps us make the next piece better.</h2>
        <p>Demo submission complete. Connect this form to your review or support system before launch.</p>
        <button className="button button--ghost" onClick={() => { setSubmitted(false); setRating(0); }}>Leave another response</button>
      </div>
    );
  }

  return (
    <form className="feedback-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}>
      <div>
        <span className="eyebrow">Your experience</span>
        <h2>How did Edwin feel?</h2>
        <div className="rating-row" aria-label="Rating out of five">
          {[1, 2, 3, 4, 5].map((value) => (
            <button type="button" key={value} className={value <= rating ? "active" : ""} onClick={() => setRating(value)} aria-label={`${value} star${value > 1 ? "s" : ""}`}><Star size={24} fill={value <= rating ? "currentColor" : "none"} /></button>
          ))}
        </div>
        <p className="muted tiny">{rating ? `${rating} of 5 selected` : "Choose a rating"}</p>
      </div>

      <div className="form-grid">
        <label>Name<input required placeholder="Your name" /></label>
        <label>Email<input required type="email" placeholder="you@example.com" /></label>
        <label className="field-wide">What are you sharing feedback about?
          <select defaultValue="Product quality">
            <option>Product quality</option>
            <option>Website experience</option>
            <option>Delivery</option>
            <option>Customer support</option>
            <option>Packaging</option>
            <option>Other</option>
          </select>
        </label>
        <label className="field-wide">Your feedback<textarea required rows={6} placeholder="What worked well? What could be better?" /></label>
      </div>
      <button className="button button--dark button--full" type="submit" disabled={!rating}>Submit feedback</button>
    </form>
  );
}