"use client";

import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { SmoothLink } from "./SmoothLink";
import { useCategories } from "@/lib/useCategories";

export function SiteFooter() {
  const categories = useCategories();
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="brand brand--footer"><img className="brand__mark brand__logo" src={siteConfig.brandLogo} alt="" width={34} height={34} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} /><span className="brand__word">EDWIN <i>Leathers</i></span></div>
          <p>{siteConfig.description}</p>
          <a href={siteConfig.instagram} target="_blank" rel="noreferrer">Instagram <ArrowUpRight size={14} /></a>
        </div>
        <div>
          <div className="footer-label">Shop</div>
          <SmoothLink href="/shop">All goods</SmoothLink>
          {categories.map((item) => (
            <SmoothLink key={item.slug} href={`/category/${item.slug}`}>{item.name}</SmoothLink>
          ))}
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
          <div className="footer-label">Help</div>
          <SmoothLink href="/shipping-policy">Shipping policy</SmoothLink>
          <SmoothLink href="/returns-policy">Returns &amp; refunds</SmoothLink>
          <SmoothLink href="/terms">Terms &amp; conditions</SmoothLink>
          <SmoothLink href="/privacy">Privacy policy</SmoothLink>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Edwin Leathers</span>
        <div><SmoothLink href="/terms">Terms</SmoothLink><SmoothLink href="/privacy">Privacy</SmoothLink></div>
        <span>Made for a long life.</span>
      </div>
      <div className="container footer-business">
        <span>{siteConfig.storeName} · {siteConfig.phone} · {siteConfig.supportEmail}</span>
        <span>© {new Date().getFullYear()} Edwin Leathers. All rights reserved.</span>
      </div>
    </footer>
  );
}