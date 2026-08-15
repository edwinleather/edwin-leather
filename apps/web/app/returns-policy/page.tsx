import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = { title: "Returns & Refund Policy" };

const sections = [
  ["01", "Returns window", "You can request a return within 7 days of delivery. Items must be unused, in their original condition, with all tags and packaging intact, unless the product is defective or was damaged in transit."],
  ["02", "How to request", "Start a return from your account under the order in question, or email us at " + siteConfig.supportEmail + " with your order number and reason. We will confirm eligibility and arrange pickup."],
  ["03", "Pickup and condition", "Once approved, our courier will collect the item from the address you provided. Inspect the item before handing it over — a piece returned in damaged, used or incomplete condition may be subject to a restocking charge or refusal."],
  ["04", "Refunds", "Approved refunds are processed back to the original payment method after the returned item is received and inspected. Card and online payments are refunded to the same card/UPI account; Cash on Delivery orders are refunded by bank transfer to the account details you provide."],
  ["05", "Timeline", "Refunds typically appear within 5–7 business days after we receive and inspect the return. Your bank may take a little longer to reflect the amount."],
  ["06", "Exchanges", "If you would like a different size, finish or item, the quickest path is to request a return and place a new order. We cannot guarantee stock for an exchange until the return is received."],
  ["07", "Non-returnable items", "Personalised, made-to-order and final-sale pieces are non-returnable unless defective. Product-specific return eligibility is shown on the product page before you order."],
  ["08", "Contact", "For any return or refund question, reach us at " + siteConfig.supportEmail + " — we respond within one business day."]
];

export default function ReturnsPolicyPage() {
  return (
    <div className="page-shell terms-page">
      <div className="container terms-layout">
        <aside className="terms-aside"><span className="eyebrow">Returns & refunds</span><h1>Returns,<br /><em>handled fairly.</em></h1><p>Our simple policy for returns, exchanges and refunds.</p><small>Effective: 15 August 2026</small></aside>
        <main className="terms-content">
          {sections.map(([number, title, copy]) => <section key={number}><span>{number}</span><div><h2>{title}</h2><p>{copy}</p></div></section>)}
        </main>
      </div>
    </div>
  );
}