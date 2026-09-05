import type { MetadataRoute } from "next";
import { getCatalog, getCategoryList } from "@/lib/catalog";
import { siteUrl } from "@/lib/site-url";

const SITE = siteUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, categories] = await Promise.all([getCatalog(), getCategoryList()]);
  const now = new Date();

  const staticPages = [
    { url: SITE, lastModified: now, changeFrequency: "weekly" as const, priority: 1 },
    { url: `${SITE}/shop`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.9 },
    { url: `${SITE}/about`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${SITE}/contact`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${SITE}/privacy`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.1 },
    { url: `${SITE}/terms`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.1 },
    { url: `${SITE}/shipping-policy`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.1 },
    { url: `${SITE}/returns-policy`, lastModified: now, changeFrequency: "yearly" as const, priority: 0.1 }
  ];

  const categoryPages = categories.map((cat) => ({
    url: `${SITE}/category/${cat.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7
  }));

  const productPages = products.map((p) => ({
    url: `${SITE}/product/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}