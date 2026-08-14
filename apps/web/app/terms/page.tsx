import type { Metadata } from "next";

export const metadata: Metadata = { title: "Terms & Conditions" };

const sections = [
  ["01", "Using this website", "By using this website, you agree to use it lawfully and not interfere with its operation, security or other customers. Product information, availability and site content may be updated from time to time."],
  ["02", "Products and natural variation", "Leather is a natural material. Grain, tone, small marks and patina will vary between pieces. These variations are part of the character of full-grain leather and are not necessarily defects."],
  ["03", "Orders and payment", "An order is treated as accepted only after payment or Cash on Delivery eligibility is confirmed and an order confirmation is issued. Prices, taxes, discounts and shipping charges shown at checkout apply to that order."],
  ["04", "Shipping and delivery", "Delivery estimates are indicative and may be affected by courier delays, remote locations, weather or public holidays. Customers are responsible for providing a complete and accurate delivery address."],
  ["05", "Returns and exchanges", "Eligible returns or exchanges must follow the policy shown on the website at the time of purchase. Items should be unused, in original condition and returned with packaging unless the product is defective."],
  ["06", "Intellectual property", "The Edwin Leathers name, visual identity, product photography, copy and original site content may not be reproduced for commercial use without written permission."],
  ["07", "Privacy and account information", "Account and checkout information should be handled according to the published privacy policy and applicable law. Customers are responsible for keeping their login details confidential."],
  ["08", "Changes to these terms", "These terms may be updated as the store, policies or legal requirements change. The version published on this page is the version that applies from its stated effective date."],
];

export default function TermsPage() {
  return (
    <div className="page-shell terms-page">
      <div className="container terms-layout">
        <aside className="terms-aside"><span className="eyebrow">Terms & conditions</span><h1>Plain rules for a<br /><em>considered shop.</em></h1><p>Demo legal copy for the current storefront. Have final policies reviewed for your real business, payment setup and jurisdiction before launch.</p><small>Effective: 15 August 2026</small></aside>
        <main className="terms-content">
          {sections.map(([number, title, copy]) => <section key={number}><span>{number}</span><div><h2>{title}</h2><p>{copy}</p></div></section>)}
        </main>
      </div>
    </div>
  );
}