import type { MetadataRoute } from "next";
import { getCatalog } from "@/lib/catalog";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Public, indexable routes only. Never list /backoffice or authenticated routes.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "/",
    "/about",
    "/story",
    "/shop",
    "/contact",
    "/discount",
    "/feedback",
    "/terms",
    "/privacy",
    "/shipping-policy",
    "/returns-policy"
  ];

  let productRoutes: string[] = [];
  try {
    const catalog = await getCatalog();
    productRoutes = catalog.map((product) => `/product/${product.slug}`);
  } catch {
    productRoutes = [];
  }

  return [...staticRoutes, ...productRoutes].map((route) => ({
    url: `${SITE}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : route.startsWith("/product/") ? 0.8 : 0.6
  }));
}