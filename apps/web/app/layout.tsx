import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/components/CartProvider";
import { SiteChrome } from "@/components/SiteChrome";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { siteConfig } from "@/lib/site-config";
import { siteUrl } from "@/lib/site-url";

const SITE_URL = siteUrl();
const SITE_TITLE = "Edwin Leathers — Handcrafted Leather Bags, Wallets & Belts in India";

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: "%s | Edwin Leathers"
  },
  description: siteConfig.description,
  metadataBase: new URL(SITE_URL),
  applicationName: siteConfig.name,
  keywords: siteConfig.keywords,
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: SITE_TITLE,
    description: siteConfig.description,
    url: SITE_URL,
    locale: "en_IN",
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: "Edwin Leathers — Handcrafted Leather Goods"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: siteConfig.description,
    images: [`${SITE_URL}/og-image.png`]
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 }
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      "en-in": SITE_URL
    }
  },
  icons: {
    icon: [
      { url: siteConfig.favicon, type: "image/jpeg", sizes: "64x64" }
    ],
    shortcut: { url: siteConfig.favicon, type: "image/jpeg" },
    apple: [{ url: siteConfig.favicon, type: "image/jpeg" }]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Edwin Leathers",
    url: SITE_URL,
    logo: `${SITE_URL}/logo.jpeg`,
    description: siteConfig.description,
    sameAs: [
      siteConfig.instagram,
      siteConfig.mapsUrl
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "EDWIN Leather Store",
      addressLocality: "Agra",
      addressRegion: "UP",
      addressCountry: "IN"
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer service",
      email: "Support.edwinleather@gmail.com",
      telephone: "+91-9897863824"
    }
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Edwin Leathers",
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/shop?q={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };

  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "LeatherGoodsStore",
    name: "EDWIN Leather Store",
    image: `${SITE_URL}/logo.jpeg`,
    url: SITE_URL,
    telephone: "+91-9897863824",
    email: "Support.edwinleather@gmail.com",
    address: {
      "@type": "PostalAddress",
      streetAddress: "EDWIN Leather Store",
      addressLocality: "Agra",
      addressRegion: "Uttar Pradesh",
      postalCode: "282001",
      addressCountry: "IN"
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 27.1767,
      longitude: 78.0081
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "10:00",
        closes: "18:00"
      }
    ],
    priceRange: "₹₹",
    description: siteConfig.description
  };

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }} />
      </head>
      <body>
        <ServiceWorkerRegistration />
        <Analytics />
        <AuthProvider>
          <CartProvider>
            <SiteChrome>{children}</SiteChrome>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
