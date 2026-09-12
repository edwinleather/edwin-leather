import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

const SITE = siteUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/backoffice", "/api", "/cart", "/checkout", "/account", "/login", "/signup", "/verify-email", "/reset-password"]
      }
    ],
    sitemap: `${SITE}/sitemap.xml`
  };
}