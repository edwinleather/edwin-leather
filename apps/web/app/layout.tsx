import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/components/CartProvider";
import { SiteChrome } from "@/components/SiteChrome";
import { siteConfig } from "@/lib/site-config";
import { siteUrl } from "@/lib/site-url";

const SITE_URL = siteUrl();

export const metadata: Metadata = {
  title: {
    default: "Edwin Leathers — Made to Age",
    template: "%s — Edwin Leathers"
  },
  description: siteConfig.description,
  metadataBase: new URL(SITE_URL),
  applicationName: siteConfig.name,
  keywords: ["leather goods", "leather bags", "leather wallets", "belts", "handcrafted leather", "India", siteConfig.name],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: "Edwin Leathers — Made to Age",
    description: siteConfig.description,
    url: SITE_URL,
    locale: "en_IN"
  },
  twitter: {
    card: "summary",
    title: "Edwin Leathers — Made to Age",
    description: siteConfig.description
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 }
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: siteConfig.brandLogo, type: "image/jpeg" }
    ],
    apple: [{ url: siteConfig.brandLogo, type: "image/jpeg" }]
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("el-theme");if(!t){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","light");}})();`
          }}
        />
        <AuthProvider>
          <CartProvider>
            <SiteChrome>{children}</SiteChrome>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
