"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, IndianRupee, ShoppingBag, UsersRound } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { ProductsManager } from "./ProductsManager";
import { CategoriesManager } from "./CategoriesManager";
import { InventoryManager } from "./InventoryManager";
import { OrdersManager } from "./OrdersManager";
import { CustomersManager } from "./CustomersManager";
import { CouponsManager } from "./CouponsManager";
import { PromotionsManager } from "./PromotionsManager";
import { ReturnsManager } from "./ReturnsManager";
import { DeliveryManager } from "./DeliveryManager";
import { HomepageEditor } from "./HomepageEditor";
import { PageEditor } from "./PageEditor";
import { ReviewsManager } from "./ReviewsManager";
import { AdminsManager } from "./AdminsManager";
import { RolesManager } from "./RolesManager";
import { AssetsManager } from "./AssetsManager";
import { FeedbackManager } from "./FeedbackManager";
import { ErrorLogsManager } from "./ErrorLogsManager";
import { EmailLogsManager } from "./EmailLogsManager";
import { EmailTemplatesManager } from "./EmailTemplatesManager";
import { EmailSettingsManager } from "./EmailSettingsManager";
import { DatabaseManager } from "./DatabaseManager";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { siteConfig } from "@/lib/site-config";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type SectionId =
  | "overview" | "products" | "categories" | "inventory" | "orders" | "customers"
  | "coupons" | "promotions" | "returns" | "delivery" | "reviews" | "feedback" | "admins" | "roles" | "assets" | "error-logs" | "email-logs" | "email-templates" | "email-settings" | "pages" | "database" | "analytics";

const NAV: { id: SectionId; label: string; feature: string }[] = [
  { id: "overview", label: "Overview", feature: "overview" },
  { id: "products", label: "Products", feature: "products" },
  { id: "categories", label: "Categories", feature: "categories" },
  { id: "inventory", label: "Inventory", feature: "inventory" },
  { id: "orders", label: "Orders", feature: "orders" },
  { id: "customers", label: "Customers", feature: "customers" },
  { id: "coupons", label: "Coupons", feature: "coupons" },
  { id: "promotions", label: "Promotions", feature: "coupons" },
  { id: "returns", label: "Returns & refunds", feature: "returns" },
  { id: "delivery", label: "Delivery", feature: "shipping" },
  { id: "pages", label: "Customize page", feature: "pages" },
  { id: "reviews", label: "Reviews", feature: "reviews" },
  { id: "feedback", label: "Feedback", feature: "returns" },
  { id: "admins", label: "Admins", feature: "admins" },
  { id: "roles", label: "Roles", feature: "roles" },
  { id: "assets", label: "Assets", feature: "media" },
  { id: "error-logs", label: "Error Logs", feature: "error-logs" },
  { id: "email-logs", label: "Email Logs", feature: "error-logs" },
  { id: "email-templates", label: "Email Templates", feature: "error-logs" },
  { id: "email-settings", label: "Email Notifications", feature: "error-logs" },
  { id: "database", label: "Database", feature: "superadmin" },
  { id: "analytics", label: "Analytics", feature: "products" }
];

type Stats = {
  stats: { revenue: number; orders: number; customers: number; lowStockSkus: number };
  recentOrders: { id: string; orderNumber: string; customer: string; item: string; total: number; orderStatus: string }[];
};

export default function BackofficePage() {
  const router = useRouter();
  const [gate, setGate] = useState<{ status: "loading" } | { status: "denied" } | { status: "ok"; role: string; features: string[] }>({ status: "loading" });
  const [active, setActive] = useState<SectionId>("overview");
  const [pagesTab, setPagesTab] = useState<"pages" | "homepage">("pages");
  const [returnsTab, setReturnsTab] = useState<"returns" | "refunds">("returns");
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API}/admin/me`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => {
        if (cancelled) return;
        if (body?.ok) {
          setGate({ status: "ok", role: body.data.role, features: body.data.features ?? [] });
        } else {
          setGate({ status: "denied" });
          router.replace("/");
        }
      })
      .catch(() => {
        if (cancelled) return;
        setGate({ status: "denied" });
        router.replace("/");
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    if (gate.status === "ok") {
      fetch(`${API}/admin/stats`, { credentials: "include" })
        .then((r) => r.json())
        .then((body) => setStats(body?.data ?? null))
        .catch(() => setStats(null));
    }
  }, [gate]);

  if (gate.status === "loading" || gate.status === "denied") {
    return <div className="admin-gate" aria-hidden="true" />;
  }

  const can = (feature: string) => gate.features.length === 0 || gate.features.includes(feature);
  const isSuperadmin = gate.role === "superadmin";
  const canPages = can("pages");
  const canHomepage = can("homepage");
  const nav = NAV.filter((item) => {
    if (item.id === "overview") return true;
    if (item.id === "pages") return canPages || canHomepage;
    if (item.id === "database") return isSuperadmin;
    return can(item.feature);
  });

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand brand--light"><img className="brand__mark brand__logo" src={siteConfig.brandLogo} alt="" width={30} height={30} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} /><span className="brand__word">EDWIN <i>ADMIN</i></span></div>
        <nav>
          {nav.map((item) => (
            <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => setActive(item.id)}>{item.label}</button>
          ))}
        </nav>
        <div className="admin-role-chip">{gate.role}</div>
      </aside>

      <main className="admin-main">
        {active === "overview" && (
          <>
            <header className="admin-header"><div><span className="eyebrow">Live dashboard</span><h1>Workshop overview</h1></div></header>
            <div className="admin-kpis">
              <div className="kpi"><span><IndianRupee size={18} /> Revenue</span><strong>{formatPrice(stats?.stats.revenue ?? 0)}</strong><small>{stats?.stats.orders ?? 0} orders total</small></div>
              <div className="kpi"><span><ShoppingBag size={18} /> Orders</span><strong>{stats?.stats.orders ?? 0}</strong></div>
              <div className="kpi"><span><UsersRound size={18} /> Customers</span><strong>{stats?.stats.customers ?? 0}</strong></div>
              <div className="kpi"><span><Boxes size={18} /> Low stock SKUs</span><strong>{stats?.stats.lowStockSkus ?? 0}</strong></div>
            </div>
            <section className="admin-panel">
              <div className="admin-panel__head"><div><span className="eyebrow">Operations</span><h2>Recent orders</h2></div></div>
              <div className="admin-table-wrap">
                <table className="admin-table">
                  <thead><tr><th>Order</th><th>Customer</th><th>Item</th><th>Total</th><th>Status</th></tr></thead>
                  <tbody>
                    {!stats || stats.recentOrders.length === 0 ? <tr><td colSpan={5} className="muted">No orders yet.</td></tr> : stats.recentOrders.map((order) => (
                      <tr key={order.id}><td><strong>{order.orderNumber}</strong></td><td>{order.customer}</td><td>{order.item}</td><td>{formatPrice(order.total)}</td><td><span className={`status status--${order.orderStatus}`}>{order.orderStatus.replace(/_/g, " ")}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {active === "products" && <ProductsManager />}
        {active === "categories" && <CategoriesManager />}
        {active === "inventory" && <InventoryManager />}
        {active === "orders" && <OrdersManager />}
        {active === "customers" && <CustomersManager />}
        {active === "coupons" && <CouponsManager />}
        {active === "promotions" && <PromotionsManager />}
        {active === "returns" && (
          <>
            <header className="admin-header"><div><span className="eyebrow">Customer support</span><h1>Returns &amp; refunds</h1></div></header>
            <div className="status-filter" style={{ marginBottom: 20 }}>
              <button className={returnsTab === "returns" ? "active" : ""} onClick={() => setReturnsTab("returns")}>Returns</button>
              <button className={returnsTab === "refunds" ? "active" : ""} onClick={() => setReturnsTab("refunds")}>Refunds</button>
            </div>
            <ReturnsManager mode={returnsTab} />
          </>
        )}
        {active === "delivery" && <DeliveryManager />}
        {active === "pages" && (
          <>
            <header className="admin-header"><div><span className="eyebrow">Storefront</span><h1>Customize page</h1></div></header>
            <div className="status-filter" style={{ marginBottom: 20 }}>
              <button className={pagesTab === "pages" ? "active" : ""} onClick={() => setPagesTab("pages")}>Pages</button>
              <button className={pagesTab === "homepage" ? "active" : ""} onClick={() => setPagesTab("homepage")}>Homepage</button>
            </div>
            {pagesTab === "pages" ? <PageEditor /> : <HomepageEditor />}
          </>
        )}
        {active === "reviews" && <ReviewsManager />}
        {active === "feedback" && <FeedbackManager />}
        {active === "admins" && <AdminsManager />}
        {active === "roles" && <RolesManager />}
        {active === "assets" && <AssetsManager />}
        {active === "error-logs" && <ErrorLogsManager />}
        {active === "email-logs" && <EmailLogsManager />}
        {active === "email-templates" && <EmailTemplatesManager />}
        {active === "email-settings" && (
          <>
            <header className="admin-header"><div><span className="eyebrow">Email notifications</span><h1>CC recipients &amp; settings</h1></div></header>
            <EmailSettingsManager />
          </>
        )}
        {active === "database" && (
          <>
            <header className="admin-header"><div><span className="eyebrow">Superadmin</span><h1>Database backup &amp; restore</h1></div></header>
            <DatabaseManager />
          </>
        )}
        {active === "analytics" && <AnalyticsDashboard />}
      </main>
    </div>
  );
}