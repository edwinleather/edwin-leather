"use client";

import { useState } from "react";
import { Check, Star } from "lucide-react";
import { useAuth } from "@/components/useAuth";

export function FeedbackForm() {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("Product quality");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "/api"}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name || undefined,
          email: email || undefined,
          topic,
          rating: rating || undefined,
          message
        })
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error || "Could not submit feedback. Please try again.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Could not reach the feedback service.");
    } finally {
      setBusy(false);
    }
  }

  if (submitted) {
    return (
      <div className="feedback-success">
        <span className="feedback-success__icon"><Check size={26} /></span>
        <span className="eyebrow">Thank you</span>
        <h2>Your feedback helps us make the next piece better.</h2>
        <p>We have received your response and will use it to improve the experience.</p>
        <button className="button button--ghost" onClick={() => { setSubmitted(false); setRating(0); setName(""); setEmail(""); setMessage(""); }}>Leave another response</button>
      </div>
    );
  }

  return (
    <form className="feedback-form" onSubmit={handleSubmit}>
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
        <label>Name<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>
        <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
        <label className="field-wide">What are you sharing feedback about?
          <select value={topic} onChange={(event) => setTopic(event.target.value)}>
            <option>Product quality</option>
            <option>Website experience</option>
            <option>Delivery</option>
            <option>Customer support</option>
            <option>Packaging</option>
            <option>Other</option>
          </select>
        </label>
        <label className="field-wide">Your feedback<textarea required rows={6} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="What worked well? What could be better?" /></label>
      </div>
      {error && <p className="auth-error">{error}</p>}
      <button className="button button--dark button--full" type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit feedback"}</button>
    </form>
  );
}