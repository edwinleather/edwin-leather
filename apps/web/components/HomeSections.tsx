"use client";

import { useMemo } from "react";
import { ArrowUpRight, CircleCheck, Sparkles } from "lucide-react";
import type { Product } from "@/lib/types";
import { useSiteSettings } from "@/lib/site-settings";
import { slugify } from "@/lib/slugs";
import { useCategories } from "@/lib/useCategories";
import { Parallax } from "./Parallax";
import { ProductCard } from "./ProductCard";
import { ProductGrid } from "./ProductGrid";
import { Reveal } from "./Reveal";
import { SmartImage } from "./SmartImage";
import { SmoothLink } from "./SmoothLink";
import { HoverBorderGradient } from "./ui/hover-border-gradient";
import { HoverEffect } from "./ui/card-hover-effect";

export function FeaturedSection({ products }: { products: Product[] }) {
  const { settings } = useSiteSettings();
  const f = settings?.homepage?.featured;
  return (
    <section className="section container" id="featured">
      <div className="section-heading">
        <Reveal><div><span className="eyebrow">{f?.eyebrow || "Current selection"}</span><h2>{f?.title || "Objects for the everyday."}</h2></div></Reveal>
        <Reveal delay={0.08}><SmoothLink href="/shop" className="underlined-link">{f?.linkLabel || "Shop all"} <ArrowUpRight size={14} /></SmoothLink></Reveal>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}

const DEFAULT_EDITORIAL = {
  image: "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894065/edwin/assets/hvt6qhohydohffwjtbm7.webp",
  eyebrow: "Material first",
  title: "The surface should remember you.",
  paragraph:
    "We choose leather for how it will look after years of use - not for how flawless it looks under studio lights on day one. Grain, small marks, and tonal variation are part of the material, not defects to hide.",
  features: ["Full-grain hides", "Repair-minded construction", "Small-batch finishing"],
  buttonLabel: "How we make it"
};

export function EditorialSplit() {
  const { settings } = useSiteSettings();
  const e = settings?.homepage?.editorial ?? DEFAULT_EDITORIAL;
  return (
    <section className="editorial-split">
      <div className="editorial-split__media">
        <Parallax className="parallax-fill" speed={70}>
          <SmartImage
            src={e.image}
            alt="Leather craft detail"
            sizes="(max-width: 800px) 100vw, 58vw"
          />
        </Parallax>
      </div>
      <div className="editorial-split__copy">
        <Reveal>
          <span className="eyebrow">{e.eyebrow}</span>
          <h2>{e.title}</h2>
          <p>{e.paragraph}</p>
          <div className="feature-list">
            {(e.features?.length ? e.features : DEFAULT_EDITORIAL.features).map((feature) => <span key={feature}><CircleCheck size={16} /> {feature}</span>)}
          </div>
          <HoverBorderGradient as="span" className="inline-flex items-center gap-2 font-sans text-sm font-semibold" containerClassName="editorial-cta">
            <SmoothLink href="/story">{e.buttonLabel || "How we make it"} <ArrowUpRight size={16} /></SmoothLink>
          </HoverBorderGradient>
        </Reveal>
      </div>
    </section>
  );
}

const DEFAULT_CATEGORIES = {
  eyebrow: "Shop by ritual",
  title: "Where will it go with you?",
  cards: [
    { title: "Bags", copy: "Carry a little better.", image: "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894146/edwin/assets/uiaqojlrt5zq2d8o8zmo.webp" },
    { title: "Wallets", copy: "Small, useful, personal.", image: "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894275/edwin/assets/jmsky5qf33pm7v9izsel.webp" },
    { title: "Belts", copy: "One piece. No shortcuts.", image: "https://res.cloudinary.com/z7o6zvqo/image/upload/v1786894758/edwin/assets/eqapt0yuxl1vs0sqw9j1.webp" }
  ]
};

export function CategoryRail() {
  const { settings } = useSiteSettings();
  const c = settings?.homepage?.categories ?? DEFAULT_CATEGORIES;
  const cards = c.cards?.length ? c.cards : DEFAULT_CATEGORIES.cards;
  const categories = useCategories();
  const slugByTitle = useMemo(() => new Map(categories.map((item) => [item.name, item.slug])), [categories]);

  return (
    <section className="category-section section">
      <div className="container section-heading"><Reveal><div><span className="eyebrow">{c.eyebrow}</span><h2>{c.title}</h2></div></Reveal></div>
      <div className="container-wide">
        <HoverEffect
          items={cards.map((card) => ({
            title: card.title,
            description: card.copy,
            image: card.image,
            link: `/category/${slugByTitle.get(card.title) ?? slugify(card.title)}`
          }))}
        />
      </div>
    </section>
  );
}

export function NewArrivalsSection({ products }: { products: Product[] }) {
  const { settings } = useSiteSettings();
  const n = settings?.homepage?.newArrivals;
  const newArrivals = [...products].sort((a, b) => Number(Boolean(b.newArrival)) - Number(Boolean(a.newArrival)));
  return (
    <section className="section section--sand">
      <div className="container">
        <div className="section-heading">
          <Reveal><div><span className="eyebrow">{n?.eyebrow || "Recently cut"}</span><h2>{n?.title || "New to the bench."}</h2></div></Reveal>
          <Reveal delay={0.08}><span className="section-note"><Sparkles size={15} /> {n?.note || "From the workshop"}</span></Reveal>
        </div>
        <div className="new-arrivals-grid">
          {newArrivals.slice(0, 3).map((product, index) => <ProductCard key={product.id} product={product} priority={index === 0} />)}
        </div>
      </div>
    </section>
  );
}

export function ClosingStatement() {
  const { settings } = useSiteSettings();
  const c = settings?.homepage?.closing;
  return (
    <section className="closing-statement">
      <div className="container">
        <span className="eyebrow">{c?.eyebrow || "A slower object"}</span>
        <p>{c?.line1 || "Not designed for next season."}<br /><em>{c?.line2 || "Designed for your next decade."}</em></p>
      </div>
    </section>
  );
}

export function BrandMarquee() {
  const { settings } = useSiteSettings();
  const items = settings?.homepage?.marquee?.items?.length ? settings.homepage.marquee.items : ["MADE TO AGE", "EDWIN LEATHERS", "SMALL BATCH", "FULL GRAIN"];
  return (
    <div className="brand-marquee" aria-hidden="true">
      <div className="brand-marquee__track">
        {[0, 1].map((set) => (
          <div className="brand-marquee__set" key={set}>
            {Array.from({ length: 4 }).flatMap((_, block) =>
              items.flatMap((word) => [
                <span key={`${block}-${word}-${set}`}>{word}</span>,
                <i key={`${block}-${word}-sep-${set}`}>✦</i>
              ])
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
