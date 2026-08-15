import type { Metadata } from "next";

export const metadata: Metadata = { title: "Privacy Policy" };

const sections = [
  ["01", "What we collect", "When you create an account, we collect your name, email address, phone number and any delivery addresses you save. When you place an order, we also keep a record of the order, its items and its payment status."],
  ["02", "How we use it", "We use this information to run your account, fulfil orders, arrange delivery, process payments, send order updates, and improve the store. We do not sell your personal data."],
  ["03", "Payments", "Card and online payments are processed by our payment provider (Razorpay). We never see or store your full card details. Payment references are logged for reconciliation and support."],
  ["04", "Cookies and sessions", "We use a session cookie to keep you signed in and to persist your cart. This is required for the store to work; we do not use it for cross-site advertising."],
  ["05", "What we share", "We share the minimum necessary data with service providers who help us operate — such as our payment provider and delivery couriers — and only to the extent needed to deliver the service."],
  ["06", "Your choices", "You can update your profile, addresses and password from your account at any time, and request deletion of your data by contacting us. You can also sign out and clear your saved cart from your browser."],
  ["07", "Data retention", "We keep account and order records for as long as needed to provide our service and to satisfy legal, tax and returns obligations, after which they are removed or anonymised."],
  ["08", "Changes to this policy", "We may update this policy as the store or legal requirements change. The version published on this page applies from its stated effective date."]
];

export default function PrivacyPage() {
  return (
    <div className="page-shell terms-page">
      <div className="container terms-layout">
        <aside className="terms-aside"><span className="eyebrow">Privacy policy</span><h1>Your data,<br /><em>handled with care.</em></h1><p>Demo legal copy for the current storefront. Have final policies reviewed for your real business before launch.</p><small>Effective: 15 August 2026</small></aside>
        <main className="terms-content">
          {sections.map(([number, title, copy]) => <section key={number}><span>{number}</span><div><h2>{title}</h2><p>{copy}</p></div></section>)}
        </main>
      </div>
    </div>
  );
}