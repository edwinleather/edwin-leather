import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { CartProvider } from "@/components/CartProvider";
import { SiteChrome } from "@/components/SiteChrome";
import { siteConfig } from "@/lib/site-config";
import { fraunces, manrope } from "@/lib/fonts";

export const metadata: Metadata = {
  title: {
    default: "Edwin Leathers — Made to Age",
    template: "%s — Edwin Leathers"
  },
  description: siteConfig.description,
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  applicationName: siteConfig.name,
  keywords: ["leather goods", "leather bags", "leather wallets", "belts", "handcrafted leather", "India", siteConfig.name],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    title: "Edwin Leathers — Made to Age",
    description: siteConfig.description,
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
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
      <body className={`${manrope.variable} ${fraunces.variable}`}>
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
