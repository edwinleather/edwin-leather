"use client";

import { usePathname } from "next/navigation";
import { CartDrawer } from "./CartDrawer";
// import { Notch } from "./Notch";
import { OfferBanner } from "./OfferBanner";
import { RouteLoader } from "./RouteLoader";
import { ScrollProgress } from "./ScrollProgress";
import { ScrollToTop } from "./ScrollToTop";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { WhatsAppWidget } from "./WhatsAppWidget";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/backoffice");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <RouteLoader />
      <ScrollToTop />
      <ScrollProgress />
      <OfferBanner />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <CartDrawer />
      {/* <Notch /> */}
      <WhatsAppWidget />
    </>
  );
}
