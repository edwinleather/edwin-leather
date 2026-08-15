import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Shipping Policy" };

const sections = [
  ["01", "Coverage", "We ship leather goods across India. Orders are delivered to the PIN code you provide at checkout. Delivery to a PO Box or restricted/remote areas may take longer or be declined."],
  ["02", "Charges", `Standard shipping is free across India on orders over ₹${siteConfig.shippingThreshold.toLocaleString("en-IN")}. Below that threshold, a flat delivery fee is calculated at checkout based on your state and order value. Any applicable charges are always shown before you confirm your order.`],
  ["03", "Processing time", "Orders are prepared at the workshop and typically dispatched within 1–2 business days. Made-to-order and personalised pieces may take longer; the estimate is shown on the product before you order."],
  ["04", "Delivery time", "Once dispatched, delivery usually takes 3–7 business days depending on your location. Rural and remote PIN codes can take longer. You will receive tracking details by email as soon as your order ships."],
  ["05", "Tracking", "Every dispatched order receives a tracking number. You can follow it from your account, and we send tracking details to the email you used at checkout."],
  ["06", "Address accuracy", "Please provide a complete and accurate delivery address. We are not responsible for delays caused by an incorrect or incomplete address. If a parcel is returned because the address was wrong, a re-shipment may be charged."],
  ["07", "Damaged or lost in transit", "If your parcel arrives damaged or does not arrive within the expected window, contact us at " + siteConfig.supportEmail + " and we will investigate with the courier and arrange a replacement or refund."]
];

export default function ShippingPolicyPage() {
  return (
    <div className="page-shell terms-page">
      <div className="container terms-layout">
        <aside className="terms-aside"><span className="eyebrow">Shipping policy</span><h1>Made, packed,<br /><em>on its way.</em></h1><p>How your Edwin Leathers order gets from the workshop to your doorstep.</p><small>Effective: 15 August 2026</small></aside>
        <main className="terms-content">
          {sections.map(([number, title, copy]) => <section key={number}><span>{number}</span><div><h2>{title}</h2><p>{copy}</p></div></section>)}
        </main>
      </div>
    </div>
  );
}