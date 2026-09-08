import { PageContent } from "../models/PageContent.js";

export const PAGE_KEYS = ["story", "about", "shipping", "returns", "terms", "privacy"] as const;
export type PageKey = (typeof PAGE_KEYS)[number];

export type PageBlock = {
  type: string;
  number?: string;
  eyebrow?: string;
  heading?: string;
  body?: string;
  image?: string;
  reverse?: boolean;
  buttonLabel?: string;
  buttonHref?: string;
  items?: { title?: string; body?: string; image?: string }[];
};

export type PageContentData = {
  title: string;
  hero: {
    eyebrow?: string;
    heading?: string;
    subheading?: string;
    image?: string;
    effective?: string;
    buttonLabel?: string;
    buttonHref?: string;
  };
  blocks: PageBlock[];
};

const STORY: PageContentData = {
  title: "Our Story",
  hero: {
    eyebrow: "The Edwin idea",
    heading: "Use leaves a mark.\nWe think it should.",
    image: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/zmg9kyvttwckavil1ae0.webp"
  },
  blocks: [
    {
      type: "statement",
      number: "01",
      heading: "Leather is interesting because it refuses to stay new.",
      body: "It darkens where your hand reaches for it. It softens at the fold. It records rain, travel, long days, and the thousands of tiny interactions that make an object yours. Edwin Leathers is built around that change, not against it."
    },
    {
      type: "image-text",
      number: "02",
      eyebrow: "Material",
      heading: "Start with the hide, not the trend.",
      body: "We favor full-grain leather with enough natural character to age visibly. The goal is not perfect uniformity. The goal is depth, durability, and a surface that changes with you.",
      image: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/ypwmql3odt7k9pwpazc4.webp"
    },
    {
      type: "image-text",
      number: "03",
      eyebrow: "Construction",
      heading: "Good objects are quiet about the work inside them.",
      body: "Reinforced stress points, sensible pocket geometry, solid hardware, and edges that are finished instead of hidden. The best details disappear into use.",
      image: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/c5swo1cs60nv34bk7ppq.webp",
      reverse: true
    },
    {
      type: "cta",
      eyebrow: "Carry the idea",
      heading: "Choose the piece you will stop noticing-and start depending on.",
      buttonLabel: "Explore the collection",
      buttonHref: "/shop"
    }
  ]
};

const ABOUT: PageContentData = {
  title: "About Us",
  hero: {
    eyebrow: "About Edwin",
    heading: "We make useful things\nworth keeping.",
    subheading: "Edwin Leathers is a small-batch leather label built around one idea: everyday objects become more personal when the material is allowed to age with you.",
    buttonLabel: "View the collection",
    buttonHref: "/shop",
    image: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/c5swo1cs60nv34bk7ppq.webp"
  },
  blocks: [
    {
      type: "statement",
      eyebrow: "Our point of view",
      heading: "Less decoration. Better material. Details that make sense after the hundredth use."
    },
    {
      type: "values",
      items: [
        { title: "Made by touch", body: "Proportion, edge finish, hardware and stitching are judged by how the object feels in the hand, not just how it photographs." },
        { title: "Material with memory", body: "We prefer leather that develops depth, patina and small traces of use instead of staying artificially uniform." },
        { title: "Cut with restraint", body: "We remove what the object does not need and put the effort into construction, reinforcement and repair-minded choices." }
      ]
    },
    {
      type: "image-band",
      eyebrow: "The longer view",
      heading: "New is a moment.\nGood is a habit.",
      image: "https://res.cloudinary.com/gpldwiup/image/upload/edwin/assets/hvt6qhohydohffwjtbm7.webp"
    }
  ]
};

const policySections = (rows: [string, string, string][]): PageBlock[] =>
  rows.map(([number, heading, body]) => ({ type: "policy-section", number, heading, body }));

const SHIPPING: PageContentData = {
  title: "Shipping Policy",
  hero: {
    eyebrow: "Shipping policy",
    heading: "Made, packed,\non its way.",
    subheading: "How your Edwin Leathers order gets from the workshop to your doorstep.",
    effective: "Effective: 15 August 2026"
  },
  blocks: policySections([
    ["01", "Coverage", "We ship leather goods across India. Orders are delivered to the PIN code you provide at checkout. Delivery to a PO Box or restricted/remote areas may take longer or be declined."],
    ["02", "Charges", "Standard shipping is free across India on orders over ₹2,499. Below that threshold, a flat delivery fee is calculated at checkout based on your state and order value. Any applicable charges are always shown before you confirm your order."],
    ["03", "Processing time", "Orders are prepared at the workshop and typically dispatched within 1-2 business days. Made-to-order and personalised pieces may take longer; the estimate is shown on the product before you order."],
    ["04", "Delivery time", "Once dispatched, delivery usually takes 3-7 business days depending on your location. Rural and remote PIN codes can take longer. You will receive tracking details by email as soon as your order ships."],
    ["05", "Tracking", "Every dispatched order receives a tracking number. You can follow it from your account, and we send tracking details to the email you used at checkout."],
    ["06", "Address accuracy", "Please provide a complete and accurate delivery address. We are not responsible for delays caused by an incorrect or incomplete address. If a parcel is returned because the address was wrong, a re-shipment may be charged."],
    ["07", "Damaged or lost in transit", "If your parcel arrives damaged or does not arrive within the expected window, contact us and we will investigate with the courier and arrange a replacement or refund."]
  ])
};

const RETURNS: PageContentData = {
  title: "Returns & Refund Policy",
  hero: {
    eyebrow: "Returns & refunds",
    heading: "Returns,\nhandled fairly.",
    subheading: "Our simple policy for returns, exchanges and refunds.",
    effective: "Effective: 15 August 2026"
  },
  blocks: policySections([
    ["01", "Returns window", "You can request a return within 7 days of delivery. Items must be unused, in their original condition, with all tags and packaging intact, unless the product is defective or was damaged in transit."],
    ["02", "How to request", "Start a return from your account under the order in question, or email us with your order number and reason. We will confirm eligibility and arrange pickup."],
    ["03", "Pickup and condition", "Once approved, our courier will collect the item from the address you provided. Inspect the item before handing it over - a piece returned in damaged, used or incomplete condition may be subject to a restocking charge or refusal."],
    ["04", "Refunds", "Approved refunds are processed back to the original payment method after the returned item is received and inspected. Card and online payments are refunded to the same card/UPI account; Cash on Delivery orders are refunded by bank transfer to the account details you provide."],
    ["05", "Timeline", "Refunds typically appear within 5-7 business days after we receive and inspect the return. Your bank may take a little longer to reflect the amount."],
    ["06", "Exchanges", "If you would like a different size, finish or item, the quickest path is to request a return and place a new order. We cannot guarantee stock for an exchange until the return is received."],
    ["07", "Non-returnable items", "Personalised, made-to-order and final-sale pieces are non-returnable unless defective. Product-specific return eligibility is shown on the product page before you order."],
    ["08", "Contact", "For any return or refund question, reach us - we respond within one business day."]
  ])
};

const TERMS: PageContentData = {
  title: "Terms & Conditions",
  hero: {
    eyebrow: "Terms & conditions",
    heading: "Plain rules for a\nconsidered shop.",
    subheading: "The terms that govern the use of this website and the goods and services we offer.",
    effective: "Effective: 15 August 2026"
  },
  blocks: policySections([
    ["01", "Using this website", "By using this website, you agree to use it lawfully and not interfere with its operation, security or other customers. Product information, availability and site content may be updated from time to time."],
    ["02", "Products and natural variation", "Leather is a natural material. Grain, tone, small marks and patina will vary between pieces. These variations are part of the character of full-grain leather and are not necessarily defects."],
    ["03", "Orders and payment", "An order is treated as accepted only after payment or Cash on Delivery eligibility is confirmed and an order confirmation is issued. Prices, taxes, discounts and shipping charges shown at checkout apply to that order."],
    ["04", "Shipping and delivery", "Delivery estimates are indicative and may be affected by courier delays, remote locations, weather or public holidays. Customers are responsible for providing a complete and accurate delivery address."],
    ["05", "Returns and exchanges", "Eligible returns or exchanges must follow the policy shown on the website at the time of purchase. Items should be unused, in original condition and returned with packaging unless the product is defective."],
    ["06", "Intellectual property", "The Edwin Leathers name, visual identity, product photography, copy and original site content may not be reproduced for commercial use without written permission."],
    ["07", "Privacy and account information", "Account and checkout information should be handled according to the published privacy policy and applicable law. Customers are responsible for keeping their login details confidential."],
    ["08", "Changes to these terms", "These terms may be updated as the store, policies or legal requirements change. The version published on this page is the version that applies from its stated effective date."]
  ])
};

const PRIVACY: PageContentData = {
  title: "Privacy Policy",
  hero: {
    eyebrow: "Privacy policy",
    heading: "Your data,\nhandled with care.",
    subheading: "How we collect, use and protect your information.",
    effective: "Effective: 15 August 2026"
  },
  blocks: policySections([
    ["01", "What we collect", "When you create an account, we collect your name, email address, phone number and any delivery addresses you save. When you place an order, we also keep a record of the order, its items and its payment status."],
    ["02", "How we use it", "We use this information to run your account, fulfil orders, arrange delivery, process payments, send order updates, and improve the store. We do not sell your personal data."],
    ["03", "Payments", "Card and online payments are processed by our payment provider (Razorpay). We never see or store your full card details. Payment references are logged for reconciliation and support."],
    ["04", "Cookies and sessions", "We use a session cookie to keep you signed in and to persist your cart. This is required for the store to work; we do not use it for cross-site advertising."],
    ["05", "What we share", "We share the minimum necessary data with service providers who help us operate - such as our payment provider and delivery couriers - and only to the extent needed to deliver the service."],
    ["06", "Your choices", "You can update your profile, addresses and password from your account at any time, and request deletion of your data by contacting us. You can also sign out and clear your saved cart from your browser."],
    ["07", "Data retention", "We keep account and order records for as long as needed to provide our service and to satisfy legal, tax and returns obligations, after which they are removed or anonymised."],
    ["08", "Changes to this policy", "We may update this policy as the store or legal requirements change. The version published on this page applies from its stated effective date."]
  ])
};

const DEFAULTS: Record<PageKey, PageContentData> = {
  story: STORY,
  about: ABOUT,
  shipping: SHIPPING,
  returns: RETURNS,
  terms: TERMS,
  privacy: PRIVACY
};

export function defaultPageContent(key: PageKey): PageContentData {
  return structuredClone(DEFAULTS[key] ?? STORY);
}

export async function getPageContent(key: string): Promise<PageContentData> {
  const doc = await PageContent.findOne({ key }).lean();
  if (!doc?.content) return defaultPageContent(key as PageKey);
  const stored = doc.content as Partial<PageContentData>;
  const defaults = defaultPageContent(key as PageKey);
  return {
    title: stored.title || defaults.title,
    hero: { ...defaults.hero, ...(stored.hero ?? {}) },
    blocks: stored.blocks?.length ? stored.blocks : defaults.blocks
  };
}