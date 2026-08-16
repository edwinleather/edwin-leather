"use client";

import { useEffect, useState } from "react";
import { Loader2, Printer, X } from "lucide-react";
import { formatPrice } from "@/lib/format";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type InvoiceLine = {
  name: string;
  variantLabel?: string;
  sku: string;
  brand?: string;
  hsn?: string;
  gstRate: number;
  quantity: number;
  unitPrice: number;
  taxable: number;
  gstAmount: number;
  lineTotal: number;
};

type InvoiceData = {
  invoiceNumber: string;
  invoiceDate: string;
  invoiceNote?: string;
  seller: { companyName: string; gstin: string; cin: string; address: string; city: string; state: string; postalCode: string; phone: string; email: string; website: string };
  order: {
    orderNumber: string;
    createdAt: string;
    orderStatus: string;
    paymentMethod: string;
    paymentStatus: string;
    subtotal: number;
    shippingAmount: number;
    discountAmount: number;
    total: number;
    gstTotal: number;
    tracking?: { awb?: string; trackingId?: string; courier?: string; trackingUrl?: string };
  };
  customer: { name: string; phone: string; email: string; address: string; city: string; state: string; postalCode: string; country: string };
  lines: InvoiceLine[];
};

function fmtDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export function OrderInvoice({ orderId, orderNumber, onClose }: { orderId: string; orderNumber: string; onClose: () => void }) {
  const [data, setData] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API}/admin/orders/${orderId}/invoice`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => {
        if (body.ok) setData(body.data);
        else setError(body?.error || "Could not load invoice");
      })
      .catch(() => setError("Could not load invoice"));
  }, [orderId]);

  return (
    <div className="invoice-overlay" role="dialog" aria-modal="true">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .invoice-overlay, .invoice-overlay * { visibility: visible; }
          .invoice-overlay { position: static !important; overflow: visible !important; padding: 0 !important; background: #fff !important; }
          .invoice-sheet { box-shadow: none !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; border-radius: 0 !important; }
          .invoice-toolbar { display: none !important; }
          .invoice-close { display: none !important; }
        }
      `}</style>

      <div className="invoice-toolbar">
        <button className="button button--dark" onClick={() => window.print()}><Printer size={15} /> Print / Save as PDF</button>
        <button className="icon-button invoice-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
      </div>

      <div className="invoice-sheet">
        {error ? (
          <p className="auth-error">{error}</p>
        ) : !data ? (
          <p className="muted" style={{ padding: 40, textAlign: "center" }}><Loader2 className="spin" size={18} /> Loading invoice…</p>
        ) : (
          <>
            <header className="invoice-header">
              <div>
                <span className="invoice-brand">{data.seller.companyName}</span>
                <span className="invoice-doc-type">TAX INVOICE</span>
              </div>
              <div className="invoice-number">
                <strong>{data.invoiceNumber}</strong>
                <span>Date: {fmtDate(data.invoiceDate)}</span>
              </div>
            </header>

            {data.seller.gstin && (
              <div className="invoice-gst"><strong>GSTIN:</strong> {data.seller.gstin}{data.seller.cin ? <> &nbsp;·&nbsp; <strong>CIN:</strong> {data.seller.cin}</> : ""}</div>
            )}

            <div className="invoice-parties">
              <div className="invoice-party">
                <span className="invoice-party__label">Ship from</span>
                <strong>{data.seller.companyName}</strong>
                <p>{data.seller.address}</p>
                {(data.seller.city || data.seller.state) && <p>{[data.seller.city, data.seller.state, data.seller.postalCode].filter(Boolean).join(", ")}</p>}
                {data.seller.phone && <p>Phone: {data.seller.phone}</p>}
                {data.seller.email && <p>{data.seller.email}</p>}
              </div>
              <div className="invoice-party">
                <span className="invoice-party__label">Bill to / Ship to</span>
                <strong>{data.customer.name}</strong>
                <p>{data.customer.address}</p>
                {(data.customer.city || data.customer.state) && <p>{[data.customer.city, data.customer.state, data.customer.postalCode, data.customer.country].filter(Boolean).join(", ")}</p>}
                {data.customer.phone && <p>Phone: {data.customer.phone}</p>}
                {data.customer.email && <p>{data.customer.email}</p>}
              </div>
            </div>

            <div className="invoice-order-meta">
              <span><strong>Order ID:</strong> {data.order.orderNumber}</span>
              <span><strong>Order date:</strong> {fmtDate(data.order.createdAt)}</span>
              <span><strong>Payment:</strong> {data.order.paymentMethod.toUpperCase()}{data.order.paymentStatus !== "paid" ? ` (${data.order.paymentStatus.replace(/_/g, " ")})` : ""}</span>
              <span><strong>Status:</strong> {data.order.orderStatus.replace(/_/g, " ")}</span>
            </div>

            <table className="invoice-table">
              <thead>
                <tr><th>#</th><th>Item</th><th>HSN</th><th>GST</th><th>Qty</th><th>Unit price</th><th>Taxable</th><th>GST amt</th><th>Amount</th></tr>
              </thead>
              <tbody>
                {data.lines.map((line, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td>
                      <strong>{line.name}</strong>
                      {line.variantLabel && <span className="invoice-line-sub">{line.variantLabel}</span>}
                      {line.sku && <span className="invoice-line-sub">SKU: {line.sku}</span>}
                    </td>
                    <td>{line.hsn || "-"}</td>
                    <td>{line.gstRate}%</td>
                    <td>{line.quantity}</td>
                    <td>{formatPrice(line.unitPrice)}</td>
                    <td>{formatPrice(line.taxable)}</td>
                    <td>{formatPrice(line.gstAmount)}</td>
                    <td>{formatPrice(line.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="invoice-totals">
              <div className="invoice-totals__rows">
                <div><span>Subtotal</span><strong>{formatPrice(data.order.subtotal)}</strong></div>
                {data.order.discountAmount > 0 && <div><span>Discount</span><strong>− {formatPrice(data.order.discountAmount)}</strong></div>}
                <div><span>Shipping</span><strong>{formatPrice(data.order.shippingAmount)}</strong></div>
                <div><span>GST</span><strong>{formatPrice(data.order.gstTotal)}</strong></div>
                <div className="invoice-grand"><span>Grand total</span><strong>{formatPrice(data.order.total)}</strong></div>
              </div>
            </div>

            {data.order.tracking && (
              <div className="invoice-shipment">
                <span className="invoice-party__label">Shipment / Tracking</span>
                <div className="invoice-shipment__grid">
                  <span><strong>Courier:</strong> {data.order.tracking.courier || "-"}</span>
                  <span><strong>Tracking ID:</strong> {data.order.tracking.trackingId || "-"}</span>
                  {data.order.tracking.awb && <span><strong>AWB:</strong> {data.order.tracking.awb}</span>}
                  {data.order.tracking.trackingUrl && <span><strong>Track:</strong> {data.order.tracking.trackingUrl}</span>}
                </div>
              </div>
            )}

            <footer className="invoice-footer">
              <p>{data.invoiceNote || "This is a computer-generated tax invoice and does not require a physical signature."}</p>
              <p>{[data.seller.website, data.seller.email, data.seller.phone].filter(Boolean).join(" · ")}</p>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}