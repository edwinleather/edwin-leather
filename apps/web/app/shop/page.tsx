import type { Metadata } from "next";
import { ShopClient } from "@/components/ShopClient";
import { getCatalog, getCategories } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse bags, wallets, belts, travel pieces and small leather goods from Edwin Leathers."
};

export default async function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
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
        <ShopClient initialCategory={params.category || "All"} products={products} categories={categories} />
      </div>
    </div>
  );
}
