import type { Metadata } from "next";
import { CheckoutClient } from "@/components/CheckoutClient";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return <div className="page-shell checkout-page"><div className="container"><div className="page-intro page-intro--compact"><span className="eyebrow">Secure checkout</span><h1>Finish the order.</h1></div><CheckoutClient /></div></div>;
}
