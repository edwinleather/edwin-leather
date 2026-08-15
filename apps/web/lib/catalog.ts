import type { Product } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type ApiImage = { url: string; alt?: string };
type ApiVariant = { _id: string; label: string; sku: string; color: string; size?: string; inventoryAvailable: number };
type ApiProduct = {
  _id: string;
  slug: string;
  name: string;
  subtitle?: string;
  description: string;
  category: string;
  collection?: string;
  price: number;
  compareAtPrice?: number;
  images?: ApiImage[];
  variants?: ApiVariant[];
  featured?: boolean;
};

function mapProduct(api: ApiProduct): Product {
  return {
    id: String(api._id),
    slug: api.slug,
    name: api.name,
    subtitle: api.subtitle ?? "",
    category: api.category,
    collection: api.collection ?? "",
    price: api.price,
    compareAtPrice: api.compareAtPrice,
    description: api.description,
    details: [],
    images: (api.images ?? []).map((image) => image.url),
    variants: (api.variants ?? []).map((variant) => ({
      id: String(variant._id),
      label: variant.label,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      inventory: variant.inventoryAvailable
    })),
    featured: api.featured
  };
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const response = await fetch(`${API_URL}${path}`, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeout);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getCatalog(): Promise<Product[]> {
  const body = await fetchJson<{ data?: ApiProduct[] }>("/products");
  if (!body?.data?.length) return [];
  return body.data.map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const body = await fetchJson<{ data?: ApiProduct }>(`/products/${slug}`);
  return body?.data?._id ? mapProduct(body.data) : null;
}

export async function getCategories(): Promise<string[]> {
  const body = await fetchJson<{ data?: { name: string }[] }>("/categories");
  return body?.data?.length ? ["All", ...body.data.map((item) => item.name)] : ["All"];
}