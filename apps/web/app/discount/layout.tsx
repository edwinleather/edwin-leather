import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offers",
  description: "Occasional offers and welcome discount for your first Edwin Leathers piece.",
  alternates: { canonical: "/discount" }
};

export default function DiscountLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}