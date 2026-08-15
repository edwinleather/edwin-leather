"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

const FEATURE_LABELS: Record<string, string> = {
  overview: "Overview",
  products: "Products",
  inventory: "Inventory",
  categories: "Categories",
  orders: "Orders",
  customers: "Customers",
  coupons: "Coupons",
  returns: "Returns & refunds",
  refunds: "Refunds",
  shipping: "Shipping",
  homepage: "Homepage editor",
  reviews: "Reviews",
  media: "Media / Cloudinary",
  admins: "Admin users",
  roles: "Roles & permissions"
};

const ROLES = ["employee", "admin"] as const;

type RolesData = { features: string[]; roles: Record<string, string[]> };

export function RolesManager() {
  const [data, setData] = useState<RolesData | null>(null);
  const [draft, setDraft] = useState<Record<string, string[]> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API}/admin/roles`, { credentials: "include" })
      .then((r) => r.json())
      .then((body) => {
        if (body.ok) {
          setData(body.data);
          setDraft(JSON.parse(JSON.stringify(body.data.roles)));
        } else setError(body?.error || "Could not load roles");
      })
      .catch(() => setError("Could not load roles"));
  }, []);

  async function save(role: string) {
    setError(null);
    const res = await fetch(`${API}/admin/roles/${role}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ features: draft?.[role] ?? [] })
    });
    const body = await res.json();
    if (!res.ok) return setError(body?.error || "Save failed");
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  }

  function toggle(role: string, feature: string) {
    setDraft((d) => {
      if (!d) return d;
      const list = d[role];
      const next = list.includes(feature) ? list.filter((f) => f !== feature) : [...list, feature];
      return { ...d, [role]: next };
    });
  }

  if (!data || !draft) return <div className="admin-panel">Loading roles…</div>;

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">Permissions</span><h2>Role access</h2></div>
        <span className="muted" style={{ fontSize: 13 }}>Tick the backoffice features each role can use. Superadmin always has full access.</span>
      </div>

      {error && <p className="auth-error">{error}</p>}
      {saved && <p className="ok-note">Saved</p>}

      {ROLES.map((role) => (
        <div key={role} style={{ borderTop: "1px solid var(--line)", padding: "20px 0" }}>
          <div className="admin-panel__head">
            <div><span className="eyebrow">Role</span><h3 style={{ margin: 0, textTransform: "capitalize" }}>{role}</h3></div>
            <button className="button button--dark" onClick={() => save(role)}><Save size={14} /> Save {role}</button>
          </div>
          <div className="feature-grid">
            {data.features.map((f) => (
              <label key={f} className={`feature-chip ${draft[role].includes(f) ? "feature-chip--on" : ""}`}>
                <input type="checkbox" checked={draft[role].includes(f)} onChange={() => toggle(role, f)} />
                {FEATURE_LABELS[f] || f}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}