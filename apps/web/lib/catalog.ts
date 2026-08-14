import type { Product } from "./types";
import { products as demoProducts, categories as demoCategories } from "./demo-data";

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
  const demo = demoProducts.find((item) => item.slug === api.slug);
  return {
    id: String(api._id),
    slug: api.slug,
    name: api.name,
    subtitle: api.subtitle ?? demo?.subtitle ?? "",
    category: api.category,
    collection: api.collection ?? demo?.collection ?? "",
    price: api.price,
    compareAtPrice: api.compareAtPrice ?? demo?.compareAtPrice,
    badge: demo?.badge,
    description: api.description,
    details: demo?.details ?? [],
    images: api.images?.length ? api.images.map((image) => image.url) : (demo?.images ?? []),
    variants: api.variants?.length
      ? api.variants.map((variant) => ({ id: String(variant._id), label: variant.label, sku: variant.sku, color: variant.color, size: variant.size, inventory: variant.inventoryAvailable }))
      : (demo?.variants ?? []),
    featured: api.featured ?? demo?.featured,
    newArrival: demo?.newArrival
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
  if (body?.data?.length && Boolean((body.data[0] as ApiProduct)._id)) return body.data.map(mapProduct);
  return demoProducts;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const body = await fetchJson<{ data?: ApiProduct }>(`/products/${slug}`);
  if (body?.data?._id) return mapProduct(body.data);
  return demoProducts.find((item) => item.slug === slug) ?? null;
}

export async function getCategories(): Promise<string[]> {
  const body = await fetchJson<{ data?: { name: string }[] }>("/categories");
  if (body?.data?.length) return ["All", ...body.data.map((item) => item.name)];
  return demoCategories;
}