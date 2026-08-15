"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import type { Product } from "@/lib/types";
import { ProductGrid } from "./ProductGrid";

type SortKey = "featured" | "price-low" | "price-high" | "name";

export function ShopClient({
  initialCategory = "All",
  products = [],
  categories = ["All"]
}: {
  initialCategory?: string;
  products?: Product[];
  categories?: string[];
}) {
  const [category, setCategory] = useState(categories.includes(initialCategory) ? initialCategory : "All");
  const [sort, setSort] = useState<SortKey>("featured");

  const filtered = useMemo(() => {
    const list = category === "All" ? [...products] : products.filter((product) => product.category === category);
    if (sort === "price-low") list.sort((a, b) => a.price - b.price);
    if (sort === "price-high") list.sort((a, b) => b.price - a.price);
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "featured") list.sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
    return list;
  }, [category, sort]);

  return (
    <>
      <div className="shop-tools">
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
      <div className="shop-count">{filtered.length} pieces</div>
      <ProductGrid products={filtered} />
    </>
  );
}
