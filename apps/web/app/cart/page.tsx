import type { Metadata } from "next";
import { CartPageClient } from "@/components/CartPageClient";

export const metadata: Metadata = { title: "Shopping Bag" };

export default function CartPage() {
  return <div className="page-shell"><div className="container"><div className="page-intro page-intro--compact"><span className="eyebrow">Your edit</span><h1>Shopping bag.</h1></div><CartPageClient /></div></div>;
}
