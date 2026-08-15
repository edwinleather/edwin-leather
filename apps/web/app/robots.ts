import type { MetadataRoute } from "next";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Keep internal, authenticated, and transactional routes out of search.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/backoffice",
          "/backoffice/",
          "/admin",
          "/account",
          "/account/",
          "/cart",
          "/checkout",
          "/login",
          "/signup",
          "/thank-you",
          "/api/"
        ]
      }
    ],
    sitemap: `${SITE}/sitemap.xml`
  };
}