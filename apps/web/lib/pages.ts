import { API_URL } from "./api";

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

export async function getPageContent(key: PageKey): Promise<PageContentData | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(`${API_URL}/site/pages/${key}`, { signal: controller.signal, cache: "no-store" });
    clearTimeout(timeout);
    if (!response.ok) return null;
    const body = await response.json();
    return (body?.data as PageContentData) ?? null;
  } catch {
    return null;
  }
}

// Shared per-page <Metadata> titles + self-referencing canonicals so every
// public page resolves to one canonical URL.
export const PAGE_METADATA: Record<PageKey, { title: string; description?: string; keywords?: string[]; alternates: { canonical: string } }> = {
  story: {
    title: "Our Story — Handcrafted Leather from Agra, India",
    description: "The story behind Edwin Leathers. Handcrafted leather goods made in Agra, India using traditional techniques and full-grain leather.",
    keywords: ["Edwin Leathers story", "leather craftsmen Agra", "handcrafted leather India", "leather goods manufacturer India"],
    alternates: { canonical: "/story" }
  },
  about: {
    title: "About Us — Edwin Leathers | Handcrafted Leather Goods India",
    description: "Meet the thinking, materials and craft behind Edwin Leathers. We make handcrafted leather bags, wallets, belts and accessories in India.",
    keywords: ["about Edwin Leathers", "leather goods India", "handcrafted leather bags", "genuine leather accessories"],
    alternates: { canonical: "/about" }
  },
  shipping: {
    title: "Shipping Policy — Free Delivery Across India | Edwin Leathers",
    description: "Free delivery across India on orders over ₹2,499. Estimated delivery within 3-7 business days. Cash on delivery available.",
    keywords: ["leather goods delivery India", "free shipping leather bags", "Edwin Leathers shipping"],
    alternates: { canonical: "/shipping-policy" }
  },
  returns: {
    title: "Returns & Refund Policy | Edwin Leathers",
    description: "Easy returns within 7 days of delivery. Full refund for unused items. Read our return and refund policy for leather goods.",
    keywords: ["leather goods return policy", "Edwin Leathers refund", "return leather bags India"],
    alternates: { canonical: "/returns-policy" }
  },
  terms: {
    title: "Terms & Conditions | Edwin Leathers",
    description: "Terms and conditions for shopping at Edwin Leathers. Read about our policies for leather goods purchases.",
    keywords: ["Edwin Leathers terms", "leather goods purchase terms"],
    alternates: { canonical: "/terms" }
  },
  privacy: {
    title: "Privacy Policy | Edwin Leathers",
    description: "Your privacy matters. Read how Edwin Leathers collects, uses and protects your personal information.",
    keywords: ["Edwin Leathers privacy", "leather goods store privacy"],
    alternates: { canonical: "/privacy" }
  }
};