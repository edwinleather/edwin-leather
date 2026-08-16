"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, Mail, PackageCheck, CircleCheck } from "lucide-react";
import { SmoothLink } from "@/components/SmoothLink";
import { Loader } from "@/components/Loader";
import { getOrder, type OrderResponse } from "@/lib/api";
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

  useEffect(() => {
    if (!orderId) return;
    getOrder(orderId).then((result) => {
      if (result) setOrder(result);
      else { console.error("[thank-you] failed to load order", orderId); setError(true); }
    });
  }, [orderId]);

  return (
    <div className="page-shell thank-you-page">
      <div className="container thank-you-wrap">
        <div className="thank-you-mark"><Check size={34} /></div>
        <span className="eyebrow">Order received</span>
        <h1>Thank you.<br /><em>We will take it from here.</em></h1>
        <p className="thank-you-lead">
          {order ? `Order #${order.orderNumber} is ${order.orderStatus === "confirmed" ? "confirmed" : "awaiting payment"}.` : (error ? "We could not load your order, but it may still be processing." : "Loading your order details…")}
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