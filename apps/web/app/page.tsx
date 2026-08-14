import { Hero } from "@/components/Hero";
import { BrandMarquee, CategoryRail, EditorialSplit, FeaturedSection, NewArrivalsSection } from "@/components/HomeSections";
import { StatsBar } from "@/components/StatsBar";
import { Testimonials } from "@/components/Testimonials";
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
      <Testimonials />
      <NewArrivalsSection products={catalog} />
      <section className="closing-statement">
        <div className="container">
          <span className="eyebrow">A slower object</span>
          <p>Not designed for next season.<br /><em>Designed for your next decade.</em></p>
        </div>
      </section>
    </>
  );
}