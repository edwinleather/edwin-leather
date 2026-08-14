import { ArrowUpRight } from "lucide-react";
import { siteConfig } from "@/lib/site-config";
import { SmoothLink } from "./SmoothLink";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <div className="brand brand--footer"><span className="brand__mark">E</span><span className="brand__word">EDWIN <i>LEATHERS</i></span></div>
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
          <SmoothLink href="/story">Our story</SmoothLink>
          <a href="mailto:care@edwinleathers.example">Contact</a>
          <a href="#">Care guide</a>
          <a href="#">Shipping & returns</a>
        </div>
        <div>
          <div className="footer-label">Newsletter</div>
          <p className="muted">Occasional notes about new leather, new objects, and the workshop.</p>
          <form className="newsletter-form">
            <input type="email" placeholder="Email address" aria-label="Email address" />
            <button type="button" aria-label="Join newsletter"><ArrowUpRight size={18} /></button>
          </form>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Edwin Leathers</span>
        <div><a href="#">Privacy</a><a href="#">Terms</a></div>
        <span>Made for a long life.</span>
      </div>
    </footer>
  );
}
