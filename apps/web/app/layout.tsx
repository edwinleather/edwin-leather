import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/components/CartProvider";
import { SiteChrome } from "@/components/SiteChrome";
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
    locale: "en_IN"
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: siteConfig.description
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 }
  },
  alternates: {
    canonical: SITE_URL
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
    sameAs: [],
    address: {
      "@type": "PostalAddress",
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

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
      </head>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("el-theme");if(!t){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`
          }}
        />
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
