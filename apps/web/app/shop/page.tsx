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
    title: isSearch ? `Search: ${params.q?.trim()}` : "Shop Leather Bags, Wallets & Belts Online",
    description: "Shop handcrafted leather bags, wallets, belts, travel bags and accessories from Edwin Leathers. Full-grain leather, free delivery across India on orders over ₹2,499.",
    keywords: ["shop leather bags online", "buy leather wallet India", "leather belts for men", "handcrafted leather goods", "leather accessories online India", "Edwin Leathers shop"],
    alternates: { canonical: "/shop" },
    openGraph: {
      title: "Shop Leather Bags, Wallets & Belts | Edwin Leathers",
      description: "Handcrafted leather bags, wallets, belts & accessories. Full-grain leather, designed to age beautifully. Free delivery across India.",
      type: "website"
    },
    robots: isSearch ? { index: false, follow: true } : undefined
  };
}

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const params = await searchParams;
  const [products, categories] = await Promise.all([getCatalog({ category: params.category, q: params.q }), getCategories()]);
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
