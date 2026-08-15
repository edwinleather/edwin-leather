import type { Metadata } from "next";
import { ArrowDownRight, ArrowUpRight, Boxes, IndianRupee, PackageCheck, ShoppingBag, UsersRound } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { ProductsManager } from "./ProductsManager";

export const metadata: Metadata = { title: "Backoffice" };

const orders = [
  ["#EL-10482", "Aarav Sharma", "Heritage Tote", 6490, "Shipped"],
  ["#EL-10481", "Meera Iyer", "Foundry Belt", 2290, "Processing"],
  ["#EL-10480", "Kabir Singh", "Merchant Sling", 3890, "Confirmed"],
  ["#EL-10479", "Naina Rao", "Archive Wallet", 1990, "Delivered"]
] as const;

export default function BackofficePage() {
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand brand--light"><span className="brand__mark">E</span><span className="brand__word">EDWIN <i>ADMIN</i></span></div>
        <nav><button className="active">Overview</button><button>Products</button><button>Categories</button><button>Orders</button><button>Customers</button><button>Coupons</button><button>Returns</button><button>Refunds</button><button>Shipping</button><button>Homepage</button><button>Admins</button></nav>
        <div className="admin-demo-chip">Demo data only</div>
      </aside>
      <main className="admin-main">
        <header className="admin-header"><div><span className="eyebrow">Thursday / overview</span><h1>Workshop dashboard</h1></div><button className="button button--dark">Add product <ArrowUpRight size={15} /></button></header>
        <div className="admin-kpis">
          <div className="kpi"><span><IndianRupee size={18} /> Revenue</span><strong>{formatPrice(184320)}</strong><small className="positive">+12.8% <ArrowUpRight size={12} /></small></div>
          <div className="kpi"><span><ShoppingBag size={18} /> Orders</span><strong>47</strong><small className="positive">+8.2% <ArrowUpRight size={12} /></small></div>
          <div className="kpi"><span><UsersRound size={18} /> Customers</span><strong>38</strong><small className="positive">+5.4% <ArrowUpRight size={12} /></small></div>
          <div className="kpi"><span><Boxes size={18} /> Low stock SKUs</span><strong>6</strong><small className="negative">+2 <ArrowDownRight size={12} /></small></div>
        </div>
        <section className="admin-panel">
          <div className="admin-panel__head"><div><span className="eyebrow">Operations</span><h2>Recent orders</h2></div><button className="text-button">View all orders</button></div>
          <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Order</th><th>Customer</th><th>Item</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders.map(([id, customer, item, total, status]) => <tr key={id}><td><strong>{id}</strong></td><td>{customer}</td><td>{item}</td><td>{formatPrice(total)}</td><td><span className={`status status--${status.toLowerCase()}`}>{status}</span></td></tr>)}</tbody></table></div>
        </section>
        <ProductsManager />
        <div className="admin-bottom-grid">
          <section className="admin-panel"><div className="admin-panel__head"><div><span className="eyebrow">Inventory</span><h2>Needs attention</h2></div></div><div className="inventory-list"><div><PackageCheck size={17} /><span>Weekender No. 01 / Saddle</span><strong>3 left</strong></div><div><PackageCheck size={17} /><span>Foundry Belt / Cognac / 34</span><strong>3 left</strong></div><div><PackageCheck size={17} /><span>Heritage Tote / Black</span><strong>4 left</strong></div></div></section>
          <section className="admin-panel admin-note"><span className="eyebrow">Build note</span><h2>This is a UI foundation, not an unsecured admin panel.</h2><p>Before production, protect this route using backend-verified roles and secure session cookies. Never trust a frontend-only `isAdmin` flag.</p></section>
        </div>
      </main>
    </div>
  );
}
