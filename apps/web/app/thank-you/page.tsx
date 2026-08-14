import type { Metadata } from "next";
import { ArrowRight, Check, Mail, PackageCheck } from "lucide-react";
import { SmoothLink } from "@/components/SmoothLink";

export const metadata: Metadata = { title: "Thank You" };

export default function ThankYouPage() {
  return (
    <div className="page-shell thank-you-page">
      <div className="container thank-you-wrap">
        <div className="thank-you-mark"><Check size={34} /></div>
        <span className="eyebrow">Order received</span>
        <h1>Thank you.<br /><em>We will take it from here.</em></h1>
        <p className="thank-you-lead">Your demo order has been placed successfully. In a live setup, the confirmed order number, payment status and tracking updates will appear here.</p>
        <div className="thank-you-meta">
          <div><span>Order</span><strong>#EL-DEMO-2608</strong></div>
          <div><span>Status</span><strong>Confirmed</strong></div>
          <div><span>Next</span><strong>Preparing order</strong></div>
        </div>
        <div className="thank-you-notes"><span><Mail size={17} /> Confirmation email after live integration</span><span><PackageCheck size={17} /> Tracking appears when the order ships</span></div>
        <div className="thank-you-actions"><SmoothLink href="/account" className="button button--dark">View account <ArrowRight size={15} /></SmoothLink><SmoothLink href="/shop" className="button button--ghost">Continue shopping</SmoothLink></div>
      </div>
    </div>
  );
}