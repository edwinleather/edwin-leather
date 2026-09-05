"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, RefreshCw, Search, TriangleAlert } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type EmailLogEntry = {
  _id: string;
  to: string;
  template: string;
  orderId?: string;
  subject: string;
  status: string;
  errorMessage?: string;
  createdAt: string;
};

type StatusFilter = "all" | "sent" | "failed" | "skipped";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "sent", label: "Sent" },
  { id: "failed", label: "Failed" },
  { id: "skipped", label: "Skipped" }
];

const STATUS_MAP: Record<string, string> = {
  sent: "sent",
  failed: "cancelled",
  skipped_quota: "pending",
  skipped_rate: "pending",
  skipped_circuit: "pending",
  skipped_dedup: "confirmed"
};

function statusClass(status: string): string {
  return `status status--${STATUS_MAP[status] ?? "pending"}`;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function templateLabel(t: string): string {
  return t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function EmailLogsManager() {
  const [items, setItems] = useState<EmailLogEntry[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/admin/email-logs?limit=200`, { credentials: "include" });
      const body = await res.json();
      if (!res.ok) return setError(body?.error || "Could not load email logs");
      setItems(body?.data ?? []);
    } catch {
      setError("Could not load email logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items
    .filter((item) => {
      if (filter === "all") return true;
      if (filter === "sent") return item.status === "sent";
      if (filter === "failed") return item.status === "failed";
      return item.status.startsWith("skipped");
    })
    .filter((item) => {
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return (
        item.to.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.template.toLowerCase().includes(q) ||
        (item.orderId ?? "").toLowerCase().includes(q)
      );
    });

  const sentCount = items.filter((i) => i.status === "sent").length;
  const failedCount = items.filter((i) => i.status === "failed").length;
  const skippedCount = items.filter((i) => i.status.startsWith("skipped")).length;

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div>
          <span className="eyebrow">Communication</span>
          <h1>Email logs</h1>
        </div>
        <button className="button button--ghost button--small" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
        </button>
      </header>

      <div className="admin-kpis" style={{ marginBottom: 20 }}>
        <div className="kpi"><span><Mail size={18} /> Sent</span><strong>{sentCount}</strong></div>
        <div className="kpi"><span><TriangleAlert size={18} /> Failed</span><strong>{failedCount}</strong></div>
        <div className="kpi"><span>Skipped</span><strong>{skippedCount}</strong></div>
      </div>

      <div className="admin-tabs">
        {FILTERS.map((f) => (
          <button key={f.id} className={filter === f.id ? "active" : ""} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <label className="order-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search email, template or order ID" /></label>

      {error ? (
        <p className="admin-empty"><TriangleAlert size={18} /> {error}</p>
      ) : loading ? (
        <p className="admin-empty"><Loader2 size={18} className="spin" /> Loading email logs…</p>
      ) : filtered.length === 0 ? (
        <p className="admin-empty">No email logs yet. Emails will appear here once Gmail is configured.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>When</th><th>Status</th><th>To</th><th>Template</th><th>Subject</th><th>Error</th></tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr key={item._id}>
                  <td className="muted">{formatTime(item.createdAt)}</td>
                  <td><span className={statusClass(item.status)}>{item.status}</span></td>
                  <td>{item.to}</td>
                  <td>{templateLabel(item.template)}</td>
                  <td>{item.subject}</td>
                  <td className="muted">{item.errorMessage ? item.errorMessage.slice(0, 60) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
