"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "./useAuth";
import { useCart } from "./CartProvider";
import { SmoothLink } from "./SmoothLink";
import { ThemeToggle } from "./ThemeToggle";
import { Loader } from "./Loader";
import { siteConfig } from "@/lib/site-config";
import { useDeliveryConfig } from "@/lib/delivery";
import { useSiteSettings } from "@/lib/site-settings";
import { formatPrice } from "@/lib/format";

const nav = [
  ["Shop", "/shop"],
  ["Bags", "/shop?category=Bags"],
  ["Wallets", "/shop?category=Wallets"],
  ["Belts", "/shop?category=Belts"],
  ["Our story", "/story"]
] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);

  useEffect(() => {
    if (!menuOpen) return;
    setMenuLoading(true);
    const t = setTimeout(() => setMenuLoading(false), 420);
    return () => clearTimeout(t);
  }, [menuOpen]);
  const { count, openCart } = useCart();
  const { authed } = useAuth();
  const pathname = usePathname();
  const delivery = useDeliveryConfig();
  const { loaded, settings } = useSiteSettings();
  const announcement = settings?.announcement?.trim() || `Free delivery across India on orders above ${formatPrice(delivery.freeDeliveryThreshold)}`;

  return (
    <>
      <div className="announcement-bar" aria-hidden={!loaded ? true : undefined}>{loaded ? announcement : ""}</div>
      <header className="site-header">
        <div className="site-header__inner container-wide">
          <button className="mobile-menu-button icon-button" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {nav.slice(0, 3).map(([label, href]) => (
              <SmoothLink key={label} href={href} className={pathname.startsWith("/shop") && !href.includes("?category=") && href === "/shop" ? "active" : ""}>{label}</SmoothLink>
            ))}
            <SmoothLink href="/shop?category=Travel">Travel</SmoothLink>
          </nav>

          <SmoothLink href="/" className="brand" ariaLabel="Edwin Leathers home">
            <img className="brand__mark brand__logo" src={siteConfig.brandLogo} alt="" width={34} height={34} />
            <span className="brand__word">EDWIN <i>Leathers</i></span>
          </SmoothLink>

          <div className="header-actions">
            <ThemeToggle />
            <SmoothLink href="/shop" className="header-action desktop-only" ariaLabel="Search products"><Search size={18} /></SmoothLink>
            <SmoothLink href={authed ? "/account" : "/login"} className="header-action desktop-only" ariaLabel={authed ? "Account" : "Log in"}><UserRound size={18} /></SmoothLink>
            <SmoothLink href="/shop" className="button button--cream header-cta desktop-only">Shop now</SmoothLink>
            <button className="header-action cart-button" onClick={openCart} aria-label={`Open cart with ${count} items`}>
              <ShoppingBag size={18} />
              <span className="cart-count">{count}</span>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div className="mobile-menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="mobile-menu__top">
              <div className="brand brand--light"><img className="brand__mark brand__logo" src={siteConfig.brandLogo} alt="" width={34} height={34} /><span className="brand__word">EDWIN <i>Leathers</i></span></div>
              <button className="icon-button icon-button--light" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
            </div>
            <motion.nav
              className="mobile-menu__nav"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            >
              {menuLoading ? (
                <Loader label="Opening menu" size="sm" />
              ) : (
                nav.map(([label, href], index) => (
                  <motion.div key={label} variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}>
                    <SmoothLink href={href} onClick={() => setMenuOpen(false)}><span>0{index + 1}</span>{label}</SmoothLink>
                  </motion.div>
                ))
              )}
            </motion.nav>
            <div className="mobile-menu__footer">
              <SmoothLink href={authed ? "/account" : "/login"} onClick={() => setMenuOpen(false)}>{authed ? "Account" : "Log in"}</SmoothLink>
              <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}