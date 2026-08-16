"use client";

import { useEffect } from "react";
import { SmoothLink } from "@/components/SmoothLink";
import { siteConfig } from "@/lib/site-config";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <div className="not-found container">
      <span className="eyebrow">Something went wrong</span>
      <h1>We hit a snag.</h1>
      <p>
        Something went wrong on our end. Please try again in a moment, or reach out to us directly at{" "}
        <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`} className="underlined-link">
          {siteConfig.phone}
        </a>
        .
      </p>
      <div className="error-actions">
        <button className="button button--dark" onClick={reset}>Try again</button>
        <SmoothLink href="/" className="button button--ghost">Back to home</SmoothLink>
      </div>
    </div>
  );
}