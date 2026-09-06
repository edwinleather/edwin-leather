"use client";

import { useEffect } from "react";
import Script from "next/script";
import { initAnalytics } from "@/lib/analytics";

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Mounts once per page load and boots the gtag snippet when
// NEXT_PUBLIC_GA_MEASUREMENT_ID is configured. Also fires our custom API
// analytics events (product views, cart adds, etc.).
export function Analytics() {
  useEffect(() => {
    initAnalytics();
  }, []);

  if (!GA_ID || GA_ID.startsWith("G-DEMO")) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}', { page_path: window.location.pathname });`}
      </Script>
    </>
  );
}
