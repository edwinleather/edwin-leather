"use client";

import { useEffect } from "react";
import { siteConfig } from "@/lib/site-config";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled global error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, -apple-system, sans-serif", background: "#f7f4ee", color: "#2b241e" }}>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", maxWidth: 720, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: ".2em", textTransform: "uppercase", color: "#8a6a3b" }}>Something went wrong</div>
          <h1 style={{ fontSize: "clamp(40px, 8vw, 72px)", lineHeight: 1, margin: "18px 0 12px" }}>We hit a snag.</h1>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "#5c534a", maxWidth: 480 }}>
            Something went wrong on our end. Please try again in a moment, or reach out to us directly at{" "}
            <a href={`tel:${siteConfig.phone.replace(/\s/g, "")}`} style={{ color: "#2b241e", fontWeight: 700 }}>
              {siteConfig.phone}
            </a>
            .
          </p>
          <button onClick={reset} style={{ marginTop: 26, padding: "14px 26px", borderRadius: 999, border: "1px solid #2b241e", background: "#2b241e", color: "#f7f4ee", fontSize: 12, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}