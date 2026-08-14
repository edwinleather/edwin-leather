import { Hero } from "@/components/Hero";
import { BrandMarquee, CategoryRail, EditorialSplit, FeaturedSection, NewArrivalsSection } from "@/components/HomeSections";

export default function HomePage() {
  return (
    <>
      <Hero />
      <BrandMarquee />
      <FeaturedSection />
      <EditorialSplit />
      <CategoryRail />
      <NewArrivalsSection />
      <section className="closing-statement">
        <div className="container">
          <span className="eyebrow">A slower object</span>
          <p>Not designed for next season.<br /><em>Designed for your next decade.</em></p>
        </div>
      </section>
    </>
  );
}
