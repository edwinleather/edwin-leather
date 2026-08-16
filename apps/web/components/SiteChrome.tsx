"use client";

import { usePathname } from "next/navigation";
import { CartDrawer } from "./CartDrawer";
import { RouteLoader } from "./RouteLoader";
import { ScrollProgress } from "./ScrollProgress";
import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";

export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/backoffice");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <RouteLoader />
      <ScrollProgress />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
      <CartDrawer />
    </>
  );
}
