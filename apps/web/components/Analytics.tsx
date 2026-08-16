"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/analytics";

// Mounts once per page load and boots the gtag snippet when
// NEXT_PUBLIC_GA_MEASUREMENT_ID is configured. Renders nothing.
export function Analytics() {
  useEffect(() => {
    initAnalytics();
  }, []);
  return null;
}
