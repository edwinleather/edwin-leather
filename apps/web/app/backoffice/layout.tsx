import type { Metadata } from "next";

// The admin console must never appear in search engines.
export const metadata: Metadata = {
  title: "Admin",
  alternates: { canonical: "/backoffice" },
  robots: { index: false, follow: false, nocache: true }
};

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}