"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`${API}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: `${String(form.get("firstName") ?? "").trim()} ${String(form.get("lastName") ?? "").trim()}`.trim() || undefined,
          email: String(form.get("email") ?? "").trim() || undefined,
          topic: String(form.get("topic") ?? "Other"),
          message: String(form.get("message") ?? "").trim()
        })
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setError(body?.error || "Could not send your message. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Could not send your message. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="form-success">
        <span className="form-success__icon"><Check size={22} /></span>
        <span className="eyebrow">Message received</span>
        <h2>We have your note.</h2>
        <p>Thanks for reaching out. We usually reply within one business day.</p>
        <button className="underlined-link text-button" onClick={() => setSent(false)}>Send another message</button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>First name<input name="firstName" required placeholder="Aarav" /></label>
        <label>Last name<input name="lastName" required placeholder="Sharma" /></label>
        <label>Email<input name="email" required type="email" placeholder="you@example.com" /></label>
        <label>Phone<input name="phone" inputMode="tel" placeholder="+91 98765 43210" /></label>
        <label className="field-wide">What can we help with?
          <select name="topic" defaultValue="Order & delivery">
            <option>Order & delivery</option>
            <option>Product question</option>
            <option>Returns & exchange</option>
            <option>Leather care</option>
            <option>Wholesale / collaboration</option>
            <option>Other</option>
          </select>
        </label>
        <label className="field-wide">Message<textarea name="message" required rows={6} placeholder="Tell us a little more..." /></label>
      </div>
      {error && <p className="auth-error">{error}</p>}
      <button className="button button--dark" type="submit" disabled={busy}>{busy ? "Sending…" : "Send message"} <ArrowRight size={15} /></button>
    </form>
  );
}