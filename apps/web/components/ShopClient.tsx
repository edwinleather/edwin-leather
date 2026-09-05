"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search, SlidersHorizontal, X, Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { ProductGrid } from "./ProductGrid";
import { Tabs } from "./Tabs";

type SortKey = "featured" | "price-low" | "price-high" | "name";

export function ShopClient({
  initialCategory = "All",
  initialQuery = "",
  products = [],
  categories = ["All"]
}: {
  initialCategory?: string;
  initialQuery?: string;
  products?: Product[];
  categories?: string[];
}) {
  const [category, setCategory] = useState(categories.includes(initialCategory) ? initialCategory : "All");
  const [query, setQuery] = useState(initialQuery.trim());
  const [sort, setSort] = useState<SortKey>("featured");

  useEffect(() => {
    setCategory(categories.includes(initialCategory) ? initialCategory : "All");
  }, [initialCategory, categories]);

  useEffect(() => {
    setQuery(initialQuery.trim());
  }, [initialQuery]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    let list = category === "All" ? [...products] : products.filter((product) => product.category === category);
    if (q) {
      list = list.filter(
        (product) =>
          product.name.toLowerCase().includes(q) ||
          (product.subtitle ?? "").toLowerCase().includes(q) ||
          product.category.toLowerCase().includes(q) ||
          product.variants.some((v) => v.sku.toLowerCase().includes(q))
      );
    }
    if (sort === "price-low") list.sort((a, b) => a.price - b.price);
    if (sort === "price-high") list.sort((a, b) => b.price - a.price);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "featured") list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    return list;
  }, [category, query, sort, products]);

  return (
    <>
      <div className="shop-tools">
        <label className="shop-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, category or SKU" aria-label="Search products" />{query && <button type="button" className="icon-button" aria-label="Clear search" onClick={() => setQuery("")}><X size={14} /></button>}</label>
        <div className="category-pills" role="list" aria-label="Product categories">
          <Tabs options={categories} value={category} onChange={setCategory} ariaLabel="Product categories" />
        </div>
        <SortDropdown value={sort} onChange={setSort} />
      </div>
      <div className="shop-count">{query ? `${filtered.length} result${filtered.length === 1 ? "" : "s"} for \u201c${query}\u201d` : `${filtered.length} pieces`}</div>
      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 16px" }}>
          <p className="muted">No products found{query ? ` for "${query}"` : ""} in this category.</p>
          <a href="/shop" className="button button--ghost" style={{ marginTop: 12 }}>Browse all products</a>
        </div>
      ) : (
        <ProductGrid products={filtered} />
      )}
    </>
  );
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "featured", label: "Featured" },
  { key: "price-low", label: "Price: low to high" },
  { key: "price-high", label: "Price: high to low" },
  { key: "name", label: "Name" }
];

function SortDropdown({ value, onChange }: { value: SortKey; onChange: (key: SortKey) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const current = SORT_OPTIONS.find((opt) => opt.key === value) ?? SORT_OPTIONS[0];

  return (
    <div className="sort-select" ref={ref}>
      <button type="button" className="sort-select__button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <SlidersHorizontal size={15} />
        <span className="sort-select__label">Sort</span>
        <span className="sort-select__value">{current.label}</span>
        <ChevronDown size={14} className={`sort-select__chevron${open ? " is-open" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            className="sort-select__menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            {SORT_OPTIONS.map((opt) => (
              <li key={opt.key} role="option" aria-selected={opt.key === value}>
                <button type="button" className={opt.key === value ? "active" : ""} onClick={() => { onChange(opt.key); setOpen(false); }}>
                  <span>{opt.label}</span>
                  {opt.key === value && <Check size={14} />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
