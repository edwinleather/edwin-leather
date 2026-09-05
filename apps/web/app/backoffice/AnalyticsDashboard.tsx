"use client";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type Dashboard = {
  period: number;
  revenue: number;
  orders: number;
  avgOrderValue: number;
  productViews: number;
  checkouts: number;
  conversionRate: number;
  topProducts: { _id: string; name?: string; slug?: string; revenue: number; orders: number; qty: number }[];
  lowStock: { low: number; outOfStock: number; thresholdItems: { variantId: string; available: number; lowStockThreshold: number }[] };
};

function formatPrice(n: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export function AnalyticsDashboard() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetch(`${API}/admin/analytics/dashboard?days=${days}`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => setData(body?.data ?? null))
      .catch(() => {});
  }, [days]);

  if (!data) return <div className="admin-panel"><div className="muted">Loading analytics...</div></div>;

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Insights</span><h2>Analytics</h2></div>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>12 months</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div className="stat-card"><span className="stat-label">Revenue</span><span className="stat-value">{formatPrice(data.revenue)}</span></div>
        <div className="stat-card"><span className="stat-label">Orders</span><span className="stat-value">{data.orders}</span></div>
        <div className="stat-card"><span className="stat-label">Avg Order</span><span className="stat-value">{formatPrice(data.avgOrderValue)}</span></div>
        <div className="stat-card"><span className="stat-label">Product Views</span><span className="stat-value">{data.productViews.toLocaleString()}</span></div>
        <div className="stat-card"><span className="stat-label">Checkouts</span><span className="stat-value">{data.checkouts}</span></div>
        <div className="stat-card"><span className="stat-label">Conversion</span><span className="stat-value">{data.conversionRate.toFixed(1)}%</span></div>
      </div>

      {data.topProducts.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <span className="eyebrow" style={{ marginBottom: 8 }}>Top Products</span>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Product</th><th>Revenue</th><th>Orders</th><th>Qty</th></tr></thead>
              <tbody>
                {data.topProducts.map((p) => (
                  <tr key={p._id}>
                    <td>{p.name ?? "Unknown"}</td>
                    <td>{formatPrice(p.revenue)}</td>
                    <td>{p.orders}</td>
                    <td>{p.qty}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.lowStock && (data.lowStock.low > 0 || data.lowStock.outOfStock > 0) && (
        <div>
          <span className="eyebrow" style={{ marginBottom: 8 }}>Stock Alerts</span>
          <p style={{ margin: 0, fontSize: 13 }}>
            {data.lowStock.low} low-stock SKUs, {data.lowStock.outOfStock} out of stock.
          </p>
        </div>
      )}
    </div>
  );
}
