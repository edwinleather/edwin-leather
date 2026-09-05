"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingBag, Store } from "lucide-react";
import { SmoothLink } from "./SmoothLink";
import { useCart } from "./CartProvider";
import { siteConfig } from "@/lib/site-config";
import { ThemeToggle } from "./ThemeToggle";
import { ProfileMenu } from "./ProfileMenu";
import { GooeyInput } from "./ui/gooey-input";
import { useSearchNavigation } from "@/lib/useCategories";

const LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/shop", label: "Shop", icon: Store },
  { href: "/cart", label: "Bag", icon: ShoppingBag, badge: true }
];

const spring = { type: "spring", stiffness: 260, damping: 30 } as const;

const SEARCH_COLLAPSED = 38;
const SEARCH_EXPANDED = 150;
const BUBBLE_W = 40;

export function Notch() {
  const pathname = usePathname();
  const { count } = useCart();
  const { submitSearch } = useSearchNavigation();
  const [expanded, setExpanded] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);

  // Brand width is measured once (offsetWidth is stable); the search slot is a
  // fixed constant so the panel width never depends on the gooey's in-flight
  // animation. When the gooey opens, we just widen the panel to make room and
  // let its spring animation play out on its own.
  const brandRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const [brandW, setBrandW] = useState(0);
  const [rightW, setRightW] = useState(0);

  useLayoutEffect(() => {
    setBrandW(brandRef.current?.offsetWidth ?? 0);
    setRightW(rightRef.current?.offsetWidth ?? 0);
  }, [pathname]);

  // On load / route change: open the notch briefly, then auto-close it.
  useEffect(() => {
    setExpanded(true);
    setSearchOpen(false);
    const t = setTimeout(() => setExpanded(false), 1400);
    return () => clearTimeout(t);
  }, [pathname]);

  const leftW = brandW + (searchOpen ? SEARCH_EXPANDED + BUBBLE_W : SEARCH_COLLAPSED) + 20;

  const handleLeave = () => {
    setExpanded(false);
    setSearchOpen(false);
  };

  const submitSearchAndClose = (value: string) => {
    if (!value.trim()) return;
    submitSearch(value);
    setExpanded(false);
  };

  return (
    <nav
      className={`notch${expanded ? " is-expanded" : ""}`}
      aria-label="Quick navigation"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={handleLeave}
      onFocus={() => setExpanded(true)}
      onBlur={() => setExpanded(false)}
    >
      <motion.div
        className="notch__panel notch__panel--left"
        initial={false}
        animate={{ width: expanded ? leftW : 0, opacity: expanded ? 1 : 0 }}
        transition={spring}
        style={{ overflow: "hidden" }}
      >
        <div className="notch__panel-inner">
          <div ref={brandRef} className="notch__brand">
            <SmoothLink href="/" className="notch__brand-link" ariaLabel="Edwin Leathers home">
              <span className="notch__brand-mark"><img className="brand__logo" src={siteConfig.brandLogo} alt="" /></span>
              <span className="notch__brand-word">EDWIN<span className="notch__brand-sub">Leathers</span></span>
            </SmoothLink>
          </div>
          <GooeyInput
            key={expanded ? "on" : "off"}
            placeholder="Search"
            className="notch__search"
            classNames={{ trigger: "notch__search-trigger", bubbleSurface: "notch__search-bubble" }}
            collapsedWidth={SEARCH_COLLAPSED}
            expandedWidth={SEARCH_EXPANDED}
            expandedOffset={BUBBLE_W}
            onSubmit={submitSearchAndClose}
            onOpenChange={setSearchOpen}
          />
        </div>
      </motion.div>

      <motion.div className="notch__links" initial={false} animate={{ gap: expanded ? 6 : 2 }} transition={spring}>
        {LINKS.map((link) => {
          const Icon = link.icon;
          const active = pathname === link.href;
          return (
            <SmoothLink key={link.href} href={link.href} className={`notch__item${active ? " is-active" : ""}`} ariaLabel={link.label}>
              <Icon size={17} />
              <motion.span initial={false} animate={{ opacity: expanded ? 1 : 0, width: expanded ? "auto" : 0 }} transition={spring} className="notch__item-label">{link.label}</motion.span>
              {"badge" in link && link.badge && count > 0 && <em className="notch__badge">{count}</em>}
            </SmoothLink>
          );
        })}
      </motion.div>

      <motion.div
        className="notch__panel notch__panel--right"
        initial={false}
        animate={{ width: expanded ? rightW : 0, opacity: expanded ? 1 : 0 }}
        transition={spring}
      >
        <div ref={rightRef} className="notch__panel-inner">
          <ThemeToggle className="notch__theme" />
          <div className="notch__profile"><ProfileMenu /></div>
        </div>
      </motion.div>
    </nav>
  );
}