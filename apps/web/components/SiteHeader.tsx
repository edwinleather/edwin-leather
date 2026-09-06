"use client";

import { useState, useEffect, useMemo } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useAuth } from "./useAuth";
import { useCart, useCartDrawer } from "./CartProvider";
import { SmoothLink } from "./SmoothLink";
import { ThemeToggle } from "./ThemeToggle";
import { Loader } from "./Loader";
import { siteConfig } from "@/lib/site-config";
import { useCategories, useSearchNavigation } from "@/lib/useCategories";
import { GooeyInput } from "./ui/gooey-input";

const baseNav: { label: string; href: string }[] = [
  { label: "Shop", href: "/shop" },
  { label: "Our story", href: "/story" }
];

const extraLinks: { label: string; href: string }[] = [
  { label: "About us", href: "/about" },
  { label: "Contact", href: "/contact" },
  { label: "Offers", href: "/discount" },
  { label: "Shipping policy", href: "/shipping-policy" },
  { label: "Returns & refunds", href: "/returns-policy" },
];

const STORAGE_KEY = "edwin-cat-visits";

function getTopCategories(all: { name: string; slug: string }[], limit = 4) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const counts: Record<string, number> = raw ? JSON.parse(raw) : {};
    const ranked = [...all].sort((a, b) => (counts[b.slug] ?? 0) - (counts[a.slug] ?? 0));
    return ranked.slice(0, limit);
  } catch {
    return all.slice(0, limit);
  }
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuLoading, setMenuLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const allCategories = useCategories();
  const { submitSearch } = useSearchNavigation();

  const categories = useMemo(() => getTopCategories(allCategories, 4), [allCategories]);

  useEffect(() => {
    if (!menuOpen) return;
    setMenuLoading(true);
    const t = setTimeout(() => setMenuLoading(false), 420);
    return () => clearTimeout(t);
  }, [menuOpen]);
  const { count } = useCart();
  const { openCart } = useCartDrawer();
  const { authed } = useAuth();
  const pathname = usePathname();

  // Track category visits for personalized nav ranking.
  useEffect(() => {
    const match = pathname.match(/^\/category\/([^/]+)/);
    if (!match) return;
    const slug = match[1];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const counts: Record<string, number> = raw ? JSON.parse(raw) : {};
      counts[slug] = (counts[slug] ?? 0) + 1;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(counts));
    } catch { /* ignore */ }
  }, [pathname]);

  const desktopNav = [...baseNav, ...categories.map((item) => ({ label: item.name, href: `/category/${item.slug}` }))];

  const categoryActive = (href: string) => href.startsWith("/category/") && pathname === href;

  function submitFromIcon() {
    if (!searchQuery.trim()) return;
    submitSearch(searchQuery);
    setSearchQuery("");
    setSearchOpen(false);
  }

  function submitOnEnter(value: string) {
    if (!value.trim()) return;
    submitSearch(value);
    setSearchQuery("");
    setSearchOpen(false);
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner container-wide">
          <button className="mobile-menu-button icon-button" onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu size={20} />
          </button>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {desktopNav.map(({ label, href }) => (
              <SmoothLink
                key={label}
                href={href}
                className={
                  href === "/shop" && pathname === "/shop"
                    ? "active"
                    : href === "/story" && pathname === "/story"
                      ? "active"
                      : categoryActive(href)
                        ? "active"
                        : ""
                }
              >
                {label}
              </SmoothLink>
            ))}
          </nav>

          <SmoothLink href="/" className="brand" ariaLabel="Edwin Leathers home">
            <img className="brand__mark brand__logo" src={siteConfig.brandLogo} alt="" width={34} height={34} />
            <span className="brand__word">EDWIN <i>Leathers</i></span>
          </SmoothLink>

          <div className="header-actions">
            {!searchOpen && <ThemeToggle />}
            <GooeyInput
              placeholder="Search by name, category or SKU…"
              className="header-search__gooey desktop-only"
              classNames={{ bubble: "hidden" }}
              collapsedWidth={40}
              expandedWidth={searchOpen ? 260 : 40}
              expandedOffset={0}
              defaultValue={searchQuery}
              onValueChange={setSearchQuery}
              onSubmit={submitOnEnter}
              onOpenChange={(open) => {
                if (open) setSearchOpen(true);
                else { setSearchOpen(false); setSearchQuery(""); }
              }}
            />
            {searchOpen && (
              <button type="button" className="header-action desktop-only" aria-label="Submit search" onClick={submitFromIcon}><Search size={18} /></button>
            )}
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
            <motion.form
              className="mobile-menu__search"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={(e) => { e.preventDefault(); submitSearch(searchQuery); setMenuOpen(false); setSearchQuery(""); }}
            >
              <Search size={16} />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search products…" aria-label="Search products" />
            </motion.form>
            <motion.nav
              className="mobile-menu__nav"
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            >
              {menuLoading ? (
                <Loader label="Opening menu" size="sm" />
              ) : (
                [...baseNav, ...allCategories.map((item) => ({ label: item.name, href: `/category/${item.slug}` })), ...extraLinks].map(({ label, href }, index) => (
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
