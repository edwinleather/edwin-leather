import type { Metadata } from "next";
import { connectDatabase, ensureDatabase } from "../server/config/db";
import { Product } from "../server/models/Product";
import { Hero } from "@/components/Hero";
import { BrandMarquee, CategoryRail, ClosingStatement, EditorialSplit, FeaturedSection, NewArrivalsSection } from "@/components/HomeSections";
import { StatsBar } from "@/components/StatsBar";
import { Reviews } from "@/components/Reviews";
import { ProductCard } from "@/components/ProductCard";
import type { Product as StorefrontProduct } from "@/lib/types";

export const metadata: Metadata = {
  title: "Edwin Leathers — Handcrafted Leather Bags, Wallets & Belts in India",
  description: "Shop handcrafted leather bags, wallets, belts & accessories made in India. Full-grain leather, designed to age beautifully. Free delivery on orders over ₹2,499.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Edwin Leathers — Handcrafted Leather Bags, Wallets & Belts in India",
    description: "Shop handcrafted leather bags, wallets, belts & accessories made in India. Full-grain leather, designed to age beautifully. Free delivery on orders over ₹2,499.",
    type: "website",
    url: "/"
  }
};

// Minimal product shape needed by homepage sections — populated directly from
// the database so the homepage always renders even when the HTTP API layer is
// slow to cold-start on Vercel.
type HomepageProduct = StorefrontProduct & { slug: string; name: string; featured: boolean; media?: { url: string }[]; price: number; salePrice?: number };

function mapHomepageProduct(doc: Record<string, unknown>): HomepageProduct {
  const media = ((doc as { media?: { url: string; alt?: string }[] }).media ?? []) as { url: string; alt?: string }[];
  const variants = ((doc as { productVariants?: { price: number; salePrice?: number; active?: boolean }[] }).productVariants ?? []) as { price: number; salePrice?: number; active?: boolean }[];
  const bestPrice = variants.filter((v) => v.active !== false).reduce<number>((best, v) => {
    const p = v.salePrice && v.salePrice > 0 ? v.salePrice : v.price;
    return p < best ? p : best;
  }, Number.POSITIVE_INFINITY);
  const fallbackPrice = Number(doc.price ?? 0);

  return {
    id: String(doc._id ?? ""),
    slug: String(doc.slug ?? ""),
    name: String(doc.name ?? ""),
    subtitle: String(doc.subtitle ?? ""),
    category: String(doc.category ?? ""),
    collection: String(doc.collection ?? ""),
    brand: String(doc.brand ?? ""),
    hsn: String(doc.hsn ?? ""),
    gst: Number(doc.gst ?? 0),
    deliveryBy: String(doc.deliveryBy ?? ""),
    price: bestPrice < Number.POSITIVE_INFINITY ? bestPrice : fallbackPrice,
    compareAtPrice: Number(doc.compareAtPrice ?? 0),
    salePrice: (variants.find((v) => v.active !== false)?.salePrice) ?? undefined,
    promotion: null,
    seoTitle: String(doc.seoTitle ?? ""),
    seoDescription: String(doc.seoDescription ?? ""),
    description: String(doc.description ?? ""),
    details: [],
    media: media.length > 0 ? media : [],
    attributes: [],
    variants: [],
    productVariants: [],
    variantAttributes: [],
    variantDimensions: [],
    featured: Boolean(doc.featured),
    newArrival: false,
    codAvailable: false,
    active: true,
    status: "active" as const
  };
}

export default async function HomePage() {
  let products: HomepageProduct[] = [];

  try {
    if (await ensureDatabase()) {
      const docs = await Product.find({ active: true }).sort({ featured: -1, createdAt: -1 }).limit(50).lean();
      products = docs.map(mapHomepageProduct);
    }
  } catch {
    // If the database is unavailable, render the homepage shell without product
    // sections so the marketing site still loads. Product sections will reappear
    // once the database is reachable.
  }

  const featured = products.filter((p) => p.featured).slice(0, 8);
  const all = products.filter((p) => !p.featured);

  return (
    <>
      <Hero />
      <BrandMarquee />
      {featured.length > 0 && <FeaturedSection products={featured} />}
      <EditorialSplit />
      <StatsBar />
      <CategoryRail />
      <Reviews />
      {all.length > 0 && <NewArrivalsSection products={all.slice(0, 8)} />}
      <ClosingStatement />
    </>
  );
}