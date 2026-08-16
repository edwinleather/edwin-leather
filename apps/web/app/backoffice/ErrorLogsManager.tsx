"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Loader2, RefreshCw, Search, TriangleAlert } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "/.netlify/functions/api/v1";

type ErrorLog = {
  _id: string;
  timestamp: string;
  environment: string;
  method?: string;
  path?: string;
  status?: number;
  code?: string;
  message?: string;
  stack?: string;
  source?: string;
};

type StatusFilter = "all" | "5xx" | "4xx" | "other";

const FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "5xx", label: "Server errors" },
  { id: "4xx", label: "Client errors" },
  { id: "other", label: "Other" }
];

function statusLabel(status?: number) {
  if (!status) return "n/a";
  return `${status}${status >= 500 ? " error" : status >= 400 ? " client" : ""}`;
}

function statusClass(status?: number) {
  if (!status) return "status--pending";
  if (status >= 500) return "status--cancelled";
  if (status >= 400) return "status--pending";
  return "status--confirmed";
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

export function ErrorLogsManager() {
  const [items, setItems] = useState<ErrorLog[]>([]);
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/admin/error-logs?limit=200`, { credentials: "include" });
      const body = await res.json();
      if (!res.ok) return setError(body?.error || "Could not load error logs");
      setItems(body?.data ?? []);
    } catch {
      setError("Could not load error logs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((item) => {
    const status = item.status ?? 0;
    if (filter === "all") return true;
    if (filter === "5xx") return status >= 500;
    if (filter === "4xx") return status >= 400 && status < 500;
    return status < 400;
  }).filter((item) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (item.message ?? "").toLowerCase().includes(q) || (item.path ?? "").toLowerCase().includes(q) || (item.code ?? "").toLowerCase().includes(q) || (item.source ?? "").toLowerCase().includes(q);
  });

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <div>
          <span className="eyebrow">System health</span>
          <h1>Error logs</h1>
        </div>
        <button className="button button--ghost button--small" onClick={load} disabled={loading}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
        </button>
      </header>

      <div className="admin-tabs">
        {FILTERS.map((f) => (
          <button key={f.id} className={filter === f.id ? "active" : ""} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      <label className="order-search"><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search message, path or code" /></label>

      {error ? (
        <p className="admin-empty"><TriangleAlert size={18} /> {error}</p>
      ) : loading ? (
        <p className="admin-empty"><Loader2 size={18} className="spin" /> Loading error logs…</p>
      ) : filtered.length === 0 ? (
        <p className="admin-empty">No errors here. Keep it that way.</p>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr><th>When</th><th>Status</th><th>Request</th><th>Message</th><th>Source</th></tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <ErrorRow key={item._id} item={item} expanded={expanded === item._id} onToggle={() => setExpanded(expanded === item._id ? null : item._id)} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ErrorRow({ item, expanded, onToggle }: { item: ErrorLog; expanded: boolean; onToggle: () => void }) {
  const method = item.method ?? "";
  const path = item.path ?? "";
  const detail = item.stack || (item.code ? `${item.code}: ${item.message ?? ""}` : null);

  return (
    <>
      <tr onClick={onToggle} className="admin-row--clickable">
        <td className="muted">{formatTime(item.timestamp)}</td>
        <td><span className={`status ${statusClass(item.status)}`}>{statusLabel(item.status)}</span></td>
        <td><strong>{method}</strong> {path}</td>
        <td>{item.message ?? "No message"}</td>
        <td>{item.source ?? "api"} · {item.environment ?? ""}</td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={5} className="admin-row--expanded">
            {item.code && <p><strong>Code:</strong> {item.code}</p>}
            {item.path && <p><strong>Path:</strong> {item.method} {item.path}</p>}
            <p><strong>Message:</strong> {item.message ?? "—"}</p>
            {detail && <pre className="admin-stack">{detail}</pre>}
          </td>
        </tr>
      )}
    </>
  );
}
