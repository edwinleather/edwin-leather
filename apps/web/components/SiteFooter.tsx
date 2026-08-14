"use client";

import { useState } from "react";
import { ArrowUpRight, Check } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { SmoothLink } from "./SmoothLink";

export function SiteFooter() {
  const [joined, setJoined] = useState(false);

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="brand brand--footer"><span className="brand__mark">E</span><span className="brand__word">EDWIN <i>Leathers</i></span></div>
          <p>{siteConfig.description}</p>
          <a href={siteConfig.instagram} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={14} /></a>
        </div>
        <div>
          <div className="footer-label">Shop</div>
          <SmoothLink href="/shop">All goods</SmoothLink>
          <SmoothLink href="/shop?category=Bags">Bags</SmoothLink>
          <SmoothLink href="/shop?category=Wallets">Wallets</SmoothLink>
          <SmoothLink href="/shop?category=Belts">Belts</SmoothLink>
        </div>
        <div>
          <div className="footer-label">Edwin</div>
          <SmoothLink href="/about">About us</SmoothLink>
          <SmoothLink href="/story">Our story</SmoothLink>
          <SmoothLink href="/discount">Offers</SmoothLink>
          <SmoothLink href="/contact">Contact</SmoothLink>
          <SmoothLink href="/feedback">Feedback</SmoothLink>
        </div>
        <div>
          <div className="footer-label">Newsletter</div>
          <p className="muted">Occasional notes about new leather, new objects, and the workshop.</p>
          {joined ? (
            <p className="newsletter-success">You&rsquo;re on the list. First letters hit your inbox soon. <Check size={14} /></p>
          ) : (
            <form className="newsletter-form" onSubmit={(event) => { event.preventDefault(); setJoined(true); }}>
              <input required type="email" placeholder="Email address" aria-label="Email address" />
              <button type="submit" aria-label="Join newsletter"><ArrowUpRight size={18} /></button>
            </form>
          )}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Edwin Leathers</span>
        <div><SmoothLink href="/terms">Terms</SmoothLink><a href="#">Privacy</a></div>
        <span>Made for a long life.</span>
      </div>
    </footer>
  );
}