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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

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
export const PAGE_METADATA: Record<PageKey, { title: string; description?: string; alternates: { canonical: string } }> = {
  story: { title: "Our Story", alternates: { canonical: "/story" } },
  about: { title: "About Us", description: "Meet the thinking, materials and craft behind Edwin Leathers.", alternates: { canonical: "/about" } },
  shipping: { title: "Shipping Policy", alternates: { canonical: "/shipping-policy" } },
  returns: { title: "Returns & Refund Policy", alternates: { canonical: "/returns-policy" } },
  terms: { title: "Terms & Conditions", alternates: { canonical: "/terms" } },
  privacy: { title: "Privacy Policy", alternates: { canonical: "/privacy" } }
};