import type { Product, ProductVariantItem } from "./types";
import { API_URL } from "./api";

type MediaItem = { url: string; alt?: string; publicId?: string; position?: number };

export type CategoryInfo = {
  name: string;
  slug: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  imageUrl?: string;
  attributes?: {
    attributeId?: { key: string; name: string } | string;
    required?: boolean;
    customerVisible?: boolean;
  }[];
};

type ApiProductVariant = {
  _id: string;
  sku: string;
  price: number;
  salePrice?: number;
  promotionPrice?: number;
  stock: number;
  active: boolean;
  allowBackorder?: boolean;
  attributes: { attributeId: { key: string; name: string } | string; value: string | string[] }[];
};

type ApiVariantDimension = {
  attributeId: { _id: string; key: string; name: string } | string;
  values: string[];
};

type ApiProduct = {
  _id: string;
  slug: string;
  name: string;
  subtitle?: string;
  description: string;
  category: string;
  collection?: string;
  brand?: string;
  hsn?: string;
  gst?: number;
  deliveryBy?: string;
  price: number;
  compareAtPrice?: number;
  salePrice?: number;
  promotion?: { name: string; amount: number; price: number } | null;
  seoTitle?: string;
  seoDescription?: string;
  media?: MediaItem[];
  productVariants?: ApiProductVariant[];
  variantDimensions?: ApiVariantDimension[];
  featured?: boolean;
  attributes?: {
    attributeId?: { _id: string; name: string; key: string; type?: string; options?: string[] } | string;
    key?: string;
    label?: string;
    value: string | string[];
  }[];
};

function mapProduct(api: ApiProduct): Product {
  const media: MediaItem[] = (api.media ?? []).map((m) => ({
    url: m.url,
    alt: m.alt,
    publicId: m.publicId,
    position: m.position
  }));

  const productVariants: ProductVariantItem[] = (api.productVariants ?? []).map((variant) => ({
    id: String(variant._id),
    sku: variant.sku,
    price: variant.price,
    salePrice: variant.salePrice,
    stock: variant.stock,
    active: variant.active,
    allowBackorder: variant.allowBackorder,
    attributes: variant.attributes.map((a) => {
      const def = typeof a.attributeId === "object" && a.attributeId ? a.attributeId : null;
      return { key: def?.key ?? "", name: def?.name ?? "", value: a.value };
    })
  }));

  const variantDimensions = (api.variantDimensions ?? []).map((d) => {
    const attrId = typeof d.attributeId === "object" && d.attributeId ? d.attributeId : null;
    return {
      attributeId: typeof d.attributeId === "object" && d.attributeId ? String(d.attributeId._id) : String(d.attributeId),
      name: attrId ? attrId.name : "",
      key: attrId ? attrId.key : "",
      options: Array.from(new Set((d.values ?? []).filter(Boolean))),
      values: d.values ?? []
    };
  });

  const attributes = (api.attributes ?? []).map((a) => {
    const def = typeof a.attributeId === "object" && a.attributeId ? a.attributeId : null;
    return {
      key: def?.key ?? a.key ?? "",
      label: def?.name ?? a.label ?? "",
      value: a.value
    };
  });

  return {
    id: String(api._id),
    slug: api.slug,
    name: api.name,
    subtitle: api.subtitle ?? "",
    category: api.category,
    collection: api.collection ?? "",
    brand: api.brand,
    hsn: api.hsn,
    gst: api.gst,
    deliveryBy: api.deliveryBy,
    price: api.price,
    compareAtPrice: api.compareAtPrice,
    salePrice: api.salePrice,
    promotion: api.promotion ?? null,
    seoTitle: api.seoTitle,
    seoDescription: api.seoDescription,
    description: api.description,
    details: [],
    media,
    attributes,
    variants: [],
    productVariants,
    variantAttributes: variantDimensions.map((d) => ({
      attributeId: d.attributeId,
      name: d.name,
      options: d.options
    })),
    variantDimensions,
    featured: api.featured,
    newArrival: false,
    codAvailable: false,
    active: true,
    status: "active"
  };
}

let catalogCache: { data: Product[]; ts: number; key: string } | null = null;
const CATALOG_CACHE_TTL = 60_000;

function buildCatalogPath(filters: Record<string, unknown> = {}): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", String(filters.q));
  if (filters.priceMin != null) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax != null) params.set("priceMax", String(filters.priceMax));
  for (const [key, value] of Object.entries(filters.attributes ?? {})) {
    const v = Array.isArray(value) ? value.join(",") : value;
    params.set("filter[" + key + "]", String(v));
  }
  const qs = params.toString();
  return qs ? "/products?" + qs : "/products";
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(API_URL + path, { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getCatalog(filters: Record<string, unknown> = {}): Promise<Product[]> {
  const key = buildCatalogPath(filters);
  if (catalogCache && catalogCache.key === key && Date.now() - catalogCache.ts < CATALOG_CACHE_TTL) {
    return catalogCache.data;
  }
  const body = await fetchJson<{ data?: ApiProduct[] }>(key);
  if (!body?.data?.length) return [];
  const data = body.data.map(mapProduct);
  catalogCache = { data, ts: Date.now(), key };
  return data;
}

let productCache: { data: Product; ts: number } | null = null;

export async function productBySlug(slug: string): Promise<Product | null> {
  if (productCache && productCache.data.slug === slug && Date.now() - productCache.ts < CATALOG_CACHE_TTL) {
    return productCache.data;
  }
  const body = await fetchJson<{ data?: ApiProduct }>("/products/" + encodeURIComponent(slug));
  const product = body?.data?._id ? mapProduct(body.data) : null;
  if (product) productCache = { data: product, ts: Date.now() };
  return product;
}

export async function getCategories(): Promise<string[]> {
  const body = await fetchJson<{ data?: { name: string }[] }>("/categories");
  return body?.data?.length ? ["All", ...body.data.map((item) => item.name)] : ["All"];
}

let categoryListCache: { data: CategoryInfo[]; ts: number } | null = null;
const CATEGORY_CACHE_TTL = 60_000;

export async function getCategoryList(): Promise<CategoryInfo[]> {
  if (categoryListCache && Date.now() - categoryListCache.ts < CATEGORY_CACHE_TTL) {
    return categoryListCache.data;
  }
  const body = await fetchJson<{ data?: CategoryInfo[] }>("/categories");
  const data = body?.data?.length ? body.data : [];
  if (data.length) categoryListCache = { data, ts: Date.now() };
  return data;
}

export async function getCategoryBySlug(slug: string): Promise<CategoryInfo | null> {
  const list = await getCategoryList();
  return list.find((item) => item.slug === slug) ?? null;
}

export async function getCategoryByName(name: string): Promise<CategoryInfo | null> {
  const list = await getCategoryList();
  return list.find((item) => item.name === name) ?? null;
}
