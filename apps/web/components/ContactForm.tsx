"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";

export function ContactForm() {
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="form-success">
        <span className="form-success__icon"><Check size={22} /></span>
        <span className="eyebrow">Message received</span>
        <h2>We have your note.</h2>
        <p>This is a demo success state. Connect the form to your email or CRM endpoint before launch.</p>
        <button className="underlined-link text-button" onClick={() => setSent(false)}>Send another message</button>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={(event) => { event.preventDefault(); setSent(true); }}>
      <div className="form-grid">
        <label>First name<input required placeholder="Aarav" /></label>
        <label>Last name<input required placeholder="Sharma" /></label>
        <label>Email<input required type="email" placeholder="you@example.com" /></label>
        <label>Phone<input inputMode="tel" placeholder="+91 98765 43210" /></label>
        <label className="field-wide">What can we help with?
          <select defaultValue="Order & delivery">
            <option>Order & delivery</option>
            <option>Product question</option>
            <option>Returns & exchange</option>
            <option>Leather care</option>
            <option>Wholesale / collaboration</option>
            <option>Other</option>
          </select>
        </label>
        <label className="field-wide">Message<textarea required rows={6} placeholder="Tell us a little more..." /></label>
      </div>
      <button className="button button--dark" type="submit">Send message <ArrowRight size={15} /></button>
    </form>
  );
}