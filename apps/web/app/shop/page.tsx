import type { Metadata } from "next";
import { ShopClient } from "@/components/ShopClient";
import { getCatalog, getCategories } from "@/lib/catalog";

// The shop is a single index page: category filtering happens client-side and
// category landing pages live at /category/[slug]. Search-result URLs (?q=)
// are excluded from the index, and every variant of /shop canonicals to the
// clean URL so filter combinations never become duplicate indexed pages.
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }): Promise<Metadata> {
  const params = await searchParams;
  const isSearch = Boolean(params.q?.trim());
  return {
    title: isSearch ? `Search: ${params.q?.trim()}` : "Shop",
    description: "Browse bags, wallets, belts, travel pieces and small leather goods from Edwin Leathers.",
    alternates: { canonical: "/shop" },
    robots: isSearch ? { index: false, follow: true } : undefined
  };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([getCatalog(), getCategories()]);
  return (
    <div className="page-shell shop-page">
      <div className="container">
        <div className="page-intro">
          <span className="eyebrow">The collection</span>
          <h1>Leather goods for<br /><em>daily repetition.</em></h1>
          <p>Useful proportions, tactile materials, and nothing added just to make a photograph busier.</p>
        </div>
        <ShopClient initialCategory={params.category || "All"} initialQuery={params.q || ""} products={products} categories={categories} />
      </div>
    </div>
  );
}
