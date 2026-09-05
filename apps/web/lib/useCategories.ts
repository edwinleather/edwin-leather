"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

export type CategoryLink = { name: string; slug: string };

let cachedCategories: CategoryLink[] | null = null;
let inflightCategories: Promise<CategoryLink[]> | null = null;

function fetchCategories(): Promise<CategoryLink[]> {
  if (cachedCategories) return Promise.resolve(cachedCategories);
  if (inflightCategories) return inflightCategories;
  inflightCategories = fetch(`${API}/categories`)
    .then((r) => r.json())
    .then((body) => {
      const cats = Array.isArray(body?.data)
        ? body.data.map((item: { name: string; slug: string }) => ({ name: item.name, slug: item.slug }))
        : [];
      cachedCategories = cats;
      inflightCategories = null;
      return cats;
    })
    .catch(() => {
      inflightCategories = null;
      return [] as CategoryLink[];
    });
  return inflightCategories;
}

export function useCategories(): CategoryLink[] {
  const [categories, setCategories] = useState<CategoryLink[]>(() => cachedCategories ?? []);
  useEffect(() => {
    let active = true;
    fetchCategories().then((cats) => {
      if (active) setCategories(cats);
    });
    return () => {
      active = false;
    };
  }, []);
  return categories;
}

export function useSearchNavigation() {
  const router = useRouter();
  function submitSearch(query: string) {
    const q = query.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }
  return { submitSearch };
}