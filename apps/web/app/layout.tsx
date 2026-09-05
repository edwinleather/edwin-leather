import type { Metadata } from "next";
import "./globals.css";
import { Analytics } from "@/components/Analytics";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/components/CartProvider";
import { SiteChrome } from "@/components/SiteChrome";
import { siteConfig } from "@/lib/site-config";
import { siteUrl } from "@/lib/site-url";

const SITE_URL = siteUrl();
const SITE_TITLE = "Edwin Leathers - Leather Bags, Wallets & Belts in India";

export const metadata: Metadata = {
  title: {
    default: SITE_TITLE,
    template: "%s - Edwin Leathers"
  },
  description: siteConfig.description,
  metadataBase: new URL(SITE_URL),
  applicationName: siteConfig.name,
  keywords: ["leather goods", "leather bags", "ladies leather bags", "leather handbags", "leather wallets", "leather belts", "men's formal shoes", "leather shoes", "leather boots", "handcrafted leather", "India", siteConfig.name],
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
    card: "summary",
    title: SITE_TITLE,
    description: siteConfig.description
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 }
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
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
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
