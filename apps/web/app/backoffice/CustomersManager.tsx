"use client";

import { useCallback, useEffect, useState } from "react";
import { Search } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type Customer = {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  provider?: string;
  role?: string;
  emailVerifiedAt?: string | null;
  createdAt?: string;
};

function fmtDate(value?: string) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function CustomersManager() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/customers`, { credentials: "include" });
      const body = await res.json();
      if (!res.ok) return setError(body?.error || "Could not load customers");
      setRows(body.data ?? []);
    } catch {
      setError("Could not load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const q = query.trim().toLowerCase();
  const filtered = rows.filter((c) => !q || c.email.toLowerCase().includes(q) || c.firstName?.toLowerCase().includes(q) || c.lastName?.toLowerCase().includes(q) || (c.phone ?? "").includes(q));

  return (
    <div className="admin-panel">
      <div className="admin-panel__head">
        <div><span className="eyebrow">People</span><h2>Customers</h2></div>
        <button className="button button--ghost" onClick={load} disabled={loading}>Refresh</button>
      </div>

      <label className="order-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or phone" /></label>

      {error && <p className="auth-error">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Customer</th><th>Email</th><th>Phone</th><th>Sign-in</th><th>Verified</th><th>Joined</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="muted">Loading customers…</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={6} className="muted">No customers found.</td></tr>}
            {filtered.map((c) => (
              <tr key={c._id}>
                <td><strong>{[c.firstName, c.lastName].filter(Boolean).join(" ") || "-"}</strong></td>
                <td>{c.email}</td>
                <td>{c.phone || "-"}</td>
                <td><span className={`status ${c.provider === "google" ? "status--confirmed" : ""}`}>{c.provider || "local"}</span></td>
                <td>{c.emailVerifiedAt ? "Yes" : "No"}</td>
                <td className="muted">{fmtDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}