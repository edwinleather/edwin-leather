import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offers",
  description: "Occasional offers and welcome discount for your first Edwin Leathers piece.",
  alternates: { canonical: "/discount" },
  openGraph: {
    title: "Offers | Edwin Leathers",
    description: "Occasional offers and welcome discount for your first Edwin Leathers piece.",
    type: "website",
    url: "/discount"
  }
};

export default function DiscountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}