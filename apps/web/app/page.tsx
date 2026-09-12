import type { Metadata } from "next";
import { Hero } from "@/components/Hero";
import { BrandMarquee, CategoryRail, ClosingStatement, EditorialSplit, FeaturedSection, NewArrivalsSection } from "@/components/HomeSections";
import { StatsBar } from "@/components/StatsBar";
import { Reviews } from "@/components/Reviews";
import { getCatalog } from "@/lib/catalog";

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

export default async function HomePage() {
  const catalog = await getCatalog();

  return (
    <>
      <Hero />
      <BrandMarquee />
      <FeaturedSection products={catalog.filter((product) => product.featured)} />
      <EditorialSplit />
      <StatsBar />
      <CategoryRail />
      <Reviews />
      <NewArrivalsSection products={catalog} />
      <ClosingStatement />
    </>
  );
}