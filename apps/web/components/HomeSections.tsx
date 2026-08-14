import { ArrowUpRight, CircleCheck, Sparkles } from "lucide-react";
import { featuredProducts, newArrivals } from "@/lib/demo-data";
import { ProductCard } from "./ProductCard";
import { ProductGrid } from "./ProductGrid";
import { Reveal } from "./Reveal";
import { SmartImage } from "./SmartImage";
import { SmoothLink } from "./SmoothLink";

export function FeaturedSection() {
  return (
    <section className="section container" id="featured">
      <div className="section-heading">
        <Reveal><div><span className="eyebrow">Current selection</span><h2>Objects for the everyday.</h2></div></Reveal>
        <Reveal delay={0.08}><SmoothLink href="/shop" className="underlined-link">Shop all <ArrowUpRight size={14} /></SmoothLink></Reveal>
      </div>
      <ProductGrid products={featuredProducts} />
    </section>
  );
}

export function EditorialSplit() {
  return (
    <section className="editorial-split">
      <div className="editorial-split__media">
        <SmartImage
          src="https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=1600&q=82"
          alt="Leather craft detail"
          sizes="(max-width: 800px) 100vw, 58vw"
        />
      </div>
      <div className="editorial-split__copy">
        <Reveal>
          <span className="eyebrow">Material first</span>
          <h2>The surface should remember you.</h2>
          <p>
            We choose leather for how it will look after years of use—not for how flawless it looks under studio lights on day one. Grain, small marks, and tonal variation are part of the material, not defects to hide.
          </p>
          <div className="feature-list">
            <span><CircleCheck size={16} /> Full-grain hides</span>
            <span><CircleCheck size={16} /> Repair-minded construction</span>
            <span><CircleCheck size={16} /> Small-batch finishing</span>
          </div>
          <SmoothLink href="/story" className="button button--dark">How we make it <ArrowUpRight size={16} /></SmoothLink>
        </Reveal>
      </div>
    </section>
  );
}

export function CategoryRail() {
  const cards = [
    ["Bags", "Carry a little better.", "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1100&q=88"],
    ["Wallets", "Small, useful, personal.", "https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=1100&q=88"],
    ["Belts", "One piece. No shortcuts.", "https://images.unsplash.com/photo-1624222247344-550fb60583dc?auto=format&fit=crop&w=1100&q=88"]
  ];

  return (
    <section className="category-section section">
      <div className="container section-heading"><Reveal><div><span className="eyebrow">Shop by ritual</span><h2>Where will it go with you?</h2></div></Reveal></div>
      <div className="category-rail container-wide">
        {cards.map(([title, copy, image], index) => (
          <Reveal key={title} delay={index * 0.07}>
            <SmoothLink href={`/shop?category=${title}`} className="category-card">
              <SmartImage src={image} alt={title} sizes="(max-width: 720px) 85vw, 32vw" />
              <div className="category-card__shade" />
              <div className="category-card__content"><span>0{index + 1}</span><div><h3>{title}</h3><p>{copy}</p></div><ArrowUpRight size={18} /></div>
            </SmoothLink>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

export function NewArrivalsSection() {
  return (
    <section className="section section--sand">
      <div className="container">
        <div className="section-heading">
          <Reveal><div><span className="eyebrow">Recently cut</span><h2>New to the bench.</h2></div></Reveal>
          <Reveal delay={0.08}><span className="section-note"><Sparkles size={15} /> Demo collection</span></Reveal>
        </div>
        <div className="new-arrivals-grid">
          {newArrivals.slice(0, 3).map((product, index) => <ProductCard key={product.id} product={product} priority={index === 0} />)}
        </div>
      </div>
    </section>
  );
}

export function BrandMarquee() {
  return (
    <div className="brand-marquee" aria-hidden="true">
      <div className="brand-marquee__track">
        {[0, 1].map((set) => (
          <div className="brand-marquee__set" key={set}>
            <span>FULL GRAIN</span><i>✦</i><span>MADE TO AGE</span><i>✦</i><span>EDWIN LEATHERS</span><i>✦</i><span>SMALL BATCH</span><i>✦</i>
          </div>
        ))}
      </div>
    </div>
  );
}
