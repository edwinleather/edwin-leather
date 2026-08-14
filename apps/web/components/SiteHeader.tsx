"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "./useAuth";
import { useCart } from "./CartProvider";
import { SmoothLink } from "./SmoothLink";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "./useAuth";
import { siteConfig } from "@/lib/site-config";

const nav = [
  ["Shop", "/shop"],
  ["Bags", "/shop?category=Bags"],
  ["Wallets", "/shop?category=Wallets"],
  ["Belts", "/shop?category=Belts"],
  ["Our story", "/story"]
] as const;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { count, openCart } = useCart();
<<<<<<< Updated upstream
  const { user } = useAuth();
=======
  const { authed } = useAuth();
>>>>>>> Stashed changes
  const pathname = usePathname();
  const accountHref = user ? "/account" : "/login";

  return (
    <>
      <div className="announcement-bar">{siteConfig.announcement}</div>
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
            <span className="brand__mark">E</span>
            <span className="brand__word">EDWIN <i>Leathers</i></span>
          </SmoothLink>

          <div className="header-actions">
            <ThemeToggle />
            <SmoothLink href="/shop" className="header-action desktop-only" ariaLabel="Search products"><Search size={18} /></SmoothLink>
<<<<<<< Updated upstream
            <SmoothLink href={accountHref} className="header-action desktop-only" ariaLabel="Account"><UserRound size={18} /></SmoothLink>
=======
            <SmoothLink href={authed ? "/account" : "/login"} className="header-action desktop-only" ariaLabel={authed ? "Account" : "Log in"}><UserRound size={18} /></SmoothLink>
>>>>>>> Stashed changes
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
              <div className="brand brand--light"><span className="brand__mark">E</span><span className="brand__word">EDWIN <i>Leathers</i></span></div>
              <button className="icon-button icon-button--light" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20} /></button>
            </div>
            <motion.nav
              className="mobile-menu__nav"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            >
              {nav.map(([label, href], index) => (
                <motion.div key={label} variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}>
                  <SmoothLink href={href} onClick={() => setMenuOpen(false)}><span>0{index + 1}</span>{label}</SmoothLink>
                </motion.div>
              ))}
            </motion.nav>
            <div className="mobile-menu__footer">
<<<<<<< Updated upstream
              <SmoothLink href={accountHref} onClick={() => setMenuOpen(false)}>Account</SmoothLink>
=======
              <SmoothLink href={authed ? "/account" : "/login"} onClick={() => setMenuOpen(false)}>{authed ? "Account" : "Log in"}</SmoothLink>
>>>>>>> Stashed changes
              <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}