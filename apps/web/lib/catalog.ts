import type { Product } from "./types";
import { API_URL } from "./api";

type ApiImage = { url: string; alt?: string };

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
type ApiVariant = { _id: string; label: string; sku: string; color: string; size?: string; inventoryAvailable: number; allowBackorder?: boolean; priceOverride?: number; salePrice?: number };
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
type ApiVariantDimension = { attributeId: { _id: string; key: string; name: string } | string; values: string[] };
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
  articleNumber?: string[];
  styleCode?: string;
  brandColor?: string;
  brandSize?: string;
  ukIndiaSize?: string;
  euroSize?: string;
  womenSandalType?: string;
  color?: string[];
  typeForFlats?: string;
  typeForHeels?: string;
  occasion?: string[];
  outerMaterial?: string[];
  heelHeight?: string;
  idealFor?: string;
  ornamentationType?: string;
  insoleMaterial?: string[];
  packOf?: string;
  closure?: string[];
  heelPattern?: string;
  soleMaterial?: string[];
  innerMaterial?: string[];
  upperPattern?: string;
  careInstructions?: string[];
  removableInsole?: string;
  searchKeywords?: string[];
  keyFeatures?: string[];
  videoUrl?: string;
  eanUpc?: string[];
  cushioningLevel?: string;
  otherDetails?: string;
  includedInBox?: string[];
  returnReplacement?: string;
  cashDelivery?: string;
  customerSupport?: string;
  price: number;
  compareAtPrice?: number;
  salePrice?: number;
  promotion?: { name: string; amount: number; price: number } | null;
  seoTitle?: string;
  seoDescription?: string;
  images?: ApiImage[];
  variants?: ApiVariant[];
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
    articleNumber: api.articleNumber ?? [],
    styleCode: api.styleCode,
    brandColor: api.brandColor,
    brandSize: api.brandSize,
    ukIndiaSize: api.ukIndiaSize,
    euroSize: api.euroSize,
    womenSandalType: api.womenSandalType,
    color: api.color ?? [],
    typeForFlats: api.typeForFlats,
    typeForHeels: api.typeForHeels,
    occasion: api.occasion ?? [],
    outerMaterial: api.outerMaterial ?? [],
    heelHeight: api.heelHeight,
    idealFor: api.idealFor,
    ornamentationType: api.ornamentationType,
    insoleMaterial: api.insoleMaterial ?? [],
    packOf: api.packOf,
    closure: api.closure ?? [],
    heelPattern: api.heelPattern,
    soleMaterial: api.soleMaterial ?? [],
    innerMaterial: api.innerMaterial ?? [],
    upperPattern: api.upperPattern,
    careInstructions: api.careInstructions ?? [],
    removableInsole: api.removableInsole,
    searchKeywords: api.searchKeywords ?? [],
    keyFeatures: api.keyFeatures ?? [],
    videoUrl: api.videoUrl,
    eanUpc: api.eanUpc ?? [],
    cushioningLevel: api.cushioningLevel,
    otherDetails: api.otherDetails,
    includedInBox: api.includedInBox ?? [],
    returnReplacement: api.returnReplacement,
    cashDelivery: api.cashDelivery,
    customerSupport: api.customerSupport,
    price: api.price,
    compareAtPrice: api.compareAtPrice,
    salePrice: api.salePrice,
    promotion: api.promotion ?? null,
    description: api.description,
    seoTitle: api.seoTitle,
    seoDescription: api.seoDescription,
    details: [],
    images: (api.images ?? []).map((image) => image.url),
    imageAlts: (api.images ?? []).map((image) => image.alt ?? ""),
    attributes: (api.attributes ?? [])
      .map((a) => {
        const def = typeof a.attributeId === "object" && a.attributeId ? a.attributeId : null;
        return {
          key: def?.key ?? (a.key ?? ""),
          label: def?.name ?? (a.label ?? (a.key ?? "")),
          value: a.value ?? ""
        };
      })
      .filter((a) => a.key),
    variants: (() => {
      // ProductVariant is the source of truth; legacy variants are fallback only.
      const pv = (api.productVariants ?? []).map((variant) => ({
        id: String(variant._id),
        label: variant.attributes.map((a) => String(a.value)).join(" / "),
        sku: variant.sku,
        color: String(variant.attributes[0]?.value ?? ""),
        size: variant.attributes[1] ? String(variant.attributes[1].value) : undefined,
        inventory: variant.stock,
        allowBackorder: undefined,
        price: variant.price,
        salePrice: variant.salePrice,
        promotionPrice: variant.promotionPrice
      }));
      if (pv.length > 0) return pv;
      // Fallback to legacy embedded variants for old products.
      const legacy = api.variants ?? [];
      return legacy.map((variant) => ({
        id: String(variant._id),
        label: variant.label,
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        inventory: variant.inventoryAvailable,
        allowBackorder: variant.allowBackorder,
        price: variant.priceOverride ?? api.price,
        salePrice: variant.salePrice ?? api.salePrice
      }));
    })(),
    productVariants: (api.productVariants ?? []).map((variant) => ({
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
    })),
    variantAttributes: (api.variantDimensions ?? []).map((dimension) => {
      const def = typeof dimension.attributeId === "object" && dimension.attributeId ? dimension.attributeId : null;
      return {
        attributeId: String(def?._id ?? dimension.attributeId),
        name: def?.name ?? "",
        options: dimension.values ?? []
      };
    }),
    featured: api.featured
  };
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(`${API_URL}${path}`, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeout);
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch (err) {
    console.error("Catalog fetch error:", err);
    return null;
  }
}

export type CatalogFilters = {
  category?: string;
  q?: string;
  priceMin?: number;
  priceMax?: number;
  attributes?: Record<string, string | string[]>;
};

function buildCatalogPath(filters?: CatalogFilters): string {
  if (!filters) return "/products";
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.q) params.set("q", filters.q);
  if (filters.priceMin != null) params.set("priceMin", String(filters.priceMin));
  if (filters.priceMax != null) params.set("priceMax", String(filters.priceMax));
  for (const [key, value] of Object.entries(filters.attributes ?? {})) {
    const v = Array.isArray(value) ? value.join(",") : value;
    params.set(`filter[${key}]`, v);
  }
  const qs = params.toString();
  return qs ? `/products?${qs}` : "/products";
}

export async function getCatalog(filters?: CatalogFilters): Promise<Product[]> {
  const body = await fetchJson<{ data?: ApiProduct[] }>(buildCatalogPath(filters));
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

export async function getCategoryList(): Promise<CategoryInfo[]> {
  const body = await fetchJson<{ data?: CategoryInfo[] }>("/categories");
  return body?.data?.length ? body.data : [];
}

export async function getCategoryBySlug(slug: string): Promise<CategoryInfo | null> {
  const list = await getCategoryList();
  return list.find((item) => item.slug === slug) ?? null;
}

export async function getCategoryByName(name: string): Promise<CategoryInfo | null> {
  const list = await getCategoryList();
  return list.find((item) => item.name === name) ?? null;
}