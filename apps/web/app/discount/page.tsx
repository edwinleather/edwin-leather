import type { Metadata } from "next";
import { ArrowUpRight, Gift, PackageCheck, Sparkles } from "lucide-react";
import { SmoothLink } from "@/components/SmoothLink";

export const metadata: Metadata = { title: "Offers", description: "Current Edwin Leathers offers and collection benefits." };

export default function DiscountPage() {
  return (
    <div className="page-shell offer-page">
      <div className="container">
        <div className="offer-hero">
          <div><span className="eyebrow">A small welcome</span><h1>10% off your<br /><em>first Edwin piece.</em></h1><p>Use the demo code below at checkout. This page is ready for your live campaign rules, dates and coupon integration.</p><div className="coupon-chip"><span>WELCOME10</span><small>Demo code</small></div><SmoothLink href="/shop" className="button button--cream">Shop the collection <ArrowUpRight size={16} /></SmoothLink></div>
          <div className="offer-stamp"><Sparkles size={30} /><strong>10%</strong><span>First order</span></div>
        </div>

        <div className="offer-benefits">
          <article><Gift size={20} /><span className="eyebrow">Welcome offer</span><h2>One simple code.</h2><p>Apply the offer to eligible full-price pieces on a first purchase once your live coupon rules are connected.</p></article>
          <article><PackageCheck size={20} /><span className="eyebrow">Shipping</span><h2>Complimentary over ₹2,499.</h2><p>The existing shipping threshold remains part of the checkout flow and can sit alongside a promotional code.</p></article>
          <article><Sparkles size={20} /><span className="eyebrow">Small runs</span><h2>No endless sale rail.</h2><p>Keep promotions occasional so the site still feels like a considered leather label rather than a discount marketplace.</p></article>
        </div>
      </div>
    </div>
  );
}