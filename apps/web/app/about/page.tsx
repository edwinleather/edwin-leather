import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, Hand, Leaf, Scissors } from "lucide-react";
import { SmoothLink } from "@/components/SmoothLink";
import { Reveal } from "@/components/Reveal";

export const metadata: Metadata = { title: "About Us", description: "Meet the thinking, materials and craft behind Edwin Leathers." };

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero container-wide">
        <div className="about-hero__copy"><span className="eyebrow">About Edwin</span><h1>We make useful things<br /><em>worth keeping.</em></h1><p>Edwin Leathers is a small-batch leather label built around one idea: everyday objects become more personal when the material is allowed to age with you.</p><SmoothLink href="/shop" className="button button--dark">View the collection <ArrowUpRight size={16} /></SmoothLink></div>
        <div className="about-hero__media"><Image src="https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=1600&q=88" alt="Leather craft workshop" fill priority sizes="(max-width: 860px) 100vw, 52vw" /></div>
      </section>

      <section className="about-statement container"><Reveal><span className="eyebrow">Our point of view</span><h2>Less decoration. Better material. Details that make sense after the hundredth use.</h2></Reveal></section>

      <section className="about-values container">
        <article><Hand size={22} /><span>01</span><h3>Made by touch</h3><p>Proportion, edge finish, hardware and stitching are judged by how the object feels in the hand, not just how it photographs.</p></article>
        <article><Leaf size={22} /><span>02</span><h3>Material with memory</h3><p>We prefer leather that develops depth, patina and small traces of use instead of staying artificially uniform.</p></article>
        <article><Scissors size={22} /><span>03</span><h3>Cut with restraint</h3><p>We remove what the object does not need and put the effort into construction, reinforcement and repair-minded choices.</p></article>
      </section>

      <section className="about-image-band"><Image src="https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?auto=format&fit=crop&w=2200&q=88" alt="Close detail of leather work" fill sizes="100vw" /><div className="about-image-band__veil" /><div className="container"><span className="eyebrow">The longer view</span><p>New is a moment.<br /><em>Good is a habit.</em></p></div></section>
    </div>
  );
}