"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

export type CategoryLink = { name: string; slug: string };

export function useCategories(): CategoryLink[] {
  const [categories, setCategories] = useState<CategoryLink[]>([]);
  useEffect(() => {
    let active = true;
    fetch(`${API}/categories`)
      .then((r) => r.json())
      .then((body) => {
        if (active && Array.isArray(body?.data)) {
          setCategories(
            body.data.map((item: { name: string; slug: string }) => ({ name: item.name, slug: item.slug }))
          );
        }
      })
      .catch(() => undefined);
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