import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";
import { Parallax } from "@/components/Parallax";
import { Reveal } from "@/components/Reveal";
import { SmoothLink } from "@/components/SmoothLink";
import { SmartImage } from "@/components/SmartImage";

export const metadata: Metadata = { title: "Our Story" };

export default function StoryPage() {
  return (
    <div className="story-page">
      <section className="story-hero">
        <Parallax className="story-hero__media" speed={85}>
          <SmartImage src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1920&q=82" alt="Craft detail" priority sizes="100vw" />
        </Parallax>
        <div className="story-hero__veil" />
        <div className="container story-hero__copy"><span className="eyebrow">The Edwin idea</span><h1>Use leaves a mark.<br /><em>We think it should.</em></h1></div>
      </section>
      <section className="story-manifesto container"><Reveal><span className="story-number">01</span><h2>Leather is interesting because it refuses to stay new.</h2></Reveal><Reveal delay={0.08}><p>It darkens where your hand reaches for it. It softens at the fold. It records rain, travel, long days, and the thousands of tiny interactions that make an object yours. Edwin Leathers is built around that change, not against it.</p></Reveal></section>
      <section className="story-grid container-wide"><div className="story-grid__image"><Parallax className="parallax-fill" speed={55}><SmartImage src="https://images.unsplash.com/photo-1485811661309-ab85183a729c?auto=format&fit=crop&w=1500&q=82" alt="Leather material detail" sizes="(max-width: 800px) 100vw, 52vw" /></Parallax></div><div className="story-grid__copy"><span className="story-number">02</span><span className="eyebrow">Material</span><h2>Start with the hide, not the trend.</h2><p>We favor full-grain leather with enough natural character to age visibly. The goal is not perfect uniformity. The goal is depth, durability, and a surface that changes with you.</p></div></section>
      <section className="story-grid story-grid--reverse container-wide"><div className="story-grid__image"><Parallax className="parallax-fill" speed={55}><SmartImage src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1500&q=82" alt="Handcraft workspace" sizes="(max-width: 800px) 100vw, 52vw" /></Parallax></div><div className="story-grid__copy"><span className="story-number">03</span><span className="eyebrow">Construction</span><h2>Good objects are quiet about the work inside them.</h2><p>Reinforced stress points, sensible pocket geometry, solid hardware, and edges that are finished instead of hidden. The best details disappear into use.</p></div></section>
      <section className="story-cta"><div className="container"><span className="eyebrow">Carry the idea</span><h2>Choose the piece you will stop noticing—and start depending on.</h2><SmoothLink href="/shop" className="button button--cream">Explore the collection <ArrowUpRight size={16} /></SmoothLink></div></section>
    </div>
  );
}
