"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import { ArrowRight, Check, Mail, PackageCheck, CircleCheck } from "lucide-react";
import { SmoothLink } from "@/components/SmoothLink";
import { Loader } from "@/components/Loader";
import { getOrder, type OrderResponse } from "@/lib/api";
import { trackPurchase, type AnalyticsItem } from "@/lib/analytics";
import { formatPrice } from "@/lib/format";

export default function ThankYouPage() {
  return (
    <Suspense fallback={<ThankYouLoading />}>
      <ThankYouInner />
    </Suspense>
  );
}

function ThankYouLoading() {
  return <div className="page-shell"><div className="container thank-you-wrap"><Loader label="Loading your order" /></div></div>;
}

function ThankYouInner() {
  const params = useSearchParams();
  const orderId = params.get("order");
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [error, setError] = useState(false);
  const firedRef = useRef(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (orderId && !firedRef.current) {
      firedRef.current = true;
      const reduced = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (!reduced) {
        const defaults = { zIndex: 1200, disableForReducedMotion: true, startVelocity: 34, spread: 62, ticks: 220, gravity: 0.9, scalar: 0.9 };
        confetti({ ...defaults, particleCount: 110, origin: { x: 0.5, y: 0.62 } });
        window.setTimeout(() => confetti({ ...defaults, particleCount: 55, angle: 60, origin: { x: 0, y: 0.7 } }), 160);
        window.setTimeout(() => confetti({ ...defaults, particleCount: 55, angle: 120, origin: { x: 1, y: 0.7 } }), 260);
      }
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    getOrder(orderId).then((result) => {
      if (result) {
        setOrder(result);
        // Fallback purchase beacon - the same sessionStorage key used in
        // CheckoutClient ensures this fires at most once per order.
        const key = `el-purchase-${result.id}`;
        let alreadyRecorded = false;
        try {
          alreadyRecorded = Boolean(sessionStorage.getItem(key));
          sessionStorage.setItem(key, "1");
        } catch {
          // storage unavailable - fire anyway
        }
        if (!alreadyRecorded) {
          trackPurchase({
            transaction_id: result.orderNumber,
            value: result.total,
            tax: result.gstAmount,
            shipping: result.shippingAmount,
            currency: result.currency || "INR",
            items: result.lines.map((line): AnalyticsItem => ({
              item_id: line.productId,
              item_name: line.name,
              price: line.unitPrice,
              quantity: line.quantity,
              item_variant: line.variantLabel
            }))
          });
        }
      } else { console.error("[thank-you] failed to load order", orderId); setError(true); }
    });
  }, [orderId]);

  return (
    <div className="page-shell thank-you-page">
      <div className="container thank-you-wrap">
        <div className="thank-you-mark"><Check size={34} /></div>
        <span className="eyebrow">Order received</span>
        <h1>Thank you.<br /><em>We will take it from here.</em></h1>
        <p className="thank-you-lead">
          {order
            ? order.paymentMethod === "cod"
              ? `Order #${order.orderNumber} is confirmed. Payment of ${formatPrice(order.total)} is due on delivery.`
              : `Order #${order.orderNumber} is ${order.orderStatus === "confirmed" ? "confirmed" : "awaiting payment"}.`
            : (error ? "We could not load your order, but it may still be processing." : "Loading your order details…")}
        </p>
        {order && (
          <>
            <div className="thank-you-meta">
              <div><span>Order</span><strong>#{order.orderNumber}</strong></div>
              <div><span>Status</span><strong>{order.orderStatus.replace("_", " ")}</strong></div>
              <div><span>Total</span><strong>{formatPrice(order.total)}</strong></div>
            </div>
            <div className="thank-you-notes">
              <span><Mail size={17} /> A confirmation email is on its way</span>
              <span><PackageCheck size={17} /> Tracking appears when the order ships</span>
            </div>
            {order.timeline && order.timeline.length > 0 && (
              <ul className="order-timeline order-timeline--centered">
                {order.timeline.map((entry, index) => (
                  <li key={index}><CircleCheck size={15} /><span>{entry.message || entry.type.replace("_", " ")}<time>{entry.at ? new Date(entry.at).toLocaleString() : ""}</time></span></li>
                ))}
              </ul>
            )}
          </>
        )}
        <div className="thank-you-actions">
          <SmoothLink href="/account" className="button button--dark">View account <ArrowRight size={15} /></SmoothLink>
          <SmoothLink href="/shop" className="button button--ghost">Continue shopping</SmoothLink>
        </div>
      </div>
    </div>
  );
}