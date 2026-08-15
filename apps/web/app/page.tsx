import { Hero } from "@/components/Hero";
import { BrandMarquee, CategoryRail, ClosingStatement, EditorialSplit, FeaturedSection, NewArrivalsSection } from "@/components/HomeSections";
import { StatsBar } from "@/components/StatsBar";
import { Reviews } from "@/components/Reviews";
import { getCatalog } from "@/lib/catalog";

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