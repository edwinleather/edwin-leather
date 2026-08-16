"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductGrid } from "./ProductGrid";

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
  }, [category, query, sort]);

  return (
    <>
      <div className="shop-tools">
        <label className="shop-search"><Search size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, category or SKU" aria-label="Search products" />{query && <button type="button" className="icon-button" aria-label="Clear search" onClick={() => setQuery("")}><X size={14} /></button>}</label>
        <div className="category-pills" role="list" aria-label="Product categories">
          {categories.map((item) => (
            <button key={item} className={item === category ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>
          ))}
        </div>
        <label className="sort-select"><SlidersHorizontal size={15} /><span>Sort</span>
          <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="name">Name</option>
          </select>
        </label>
      </div>
      <div className="shop-count">{query ? `${filtered.length} result${filtered.length === 1 ? "" : "s"} for “${query}”` : `${filtered.length} pieces`}</div>
      <ProductGrid products={filtered} />
    </>
  );
}
