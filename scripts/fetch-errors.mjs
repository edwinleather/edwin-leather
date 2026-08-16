#!/usr/bin/env node
// Collects recent errors into a markdown report (logs/errors.md).
// - Runtime errors: read from MongoDB Atlas "ErrorLog" collection.
// - Deploy/build logs: read from the Vercel API.
// Triggered on-demand (repository_dispatch / workflow_dispatch) by the API
// whenever an error is logged, or manually.

import { MongoClient } from "mongodb";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const reportPath = process.env.REPORT_PATH || join(__dirname, "..", "logs", "errors.md");
const LIMIT = 100;

function now() {
  return new Date().toISOString();
}

function esc(s) {
  return String(s ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ").trim();
}

async function collectRuntime() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return { ok: false, error: "MONGODB_URI not set; skipping runtime errors." };
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  try {
    await client.connect();
    const db = client.db();
    const col = db.collection("errorlogs");
    const rows = await col.find({}).sort({ timestamp: -1 }).limit(LIMIT).toArray();
    return { ok: true, rows };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    await client.close();
  }
}

async function collectVercel() {
  const token = process.env.VERCEL_TOKEN;
  if (!token) return { ok: false, error: "VERCEL_TOKEN not set; skipping deploy logs." };
  const projectId = process.env.VERCEL_PROJECT_ID || process.env.VERCEL_PROJECT_NAME;
  if (!projectId) return { ok: false, error: "VERCEL_PROJECT_ID/VERCEL_PROJECT_NAME not set; skipping deploy logs." };

  const headers = { Authorization: `Bearer ${token}` };
  try {
    const params = new URLSearchParams({ limit: "10", projectId });
    const res = await fetch(`https://api.vercel.com/v6/deployments?${params}`, { headers });
    if (!res.ok) throw new Error(`Vercel API ${res.status}: ${await res.text()}`);
    const body = await res.json();
    const deployments = body?.deployments ?? [];
    return { ok: true, deployments: deployments.map((d) => ({
        url: d.url,
        state: d.readyState ?? d.status ?? "unknown",
        createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : undefined,
        commit: d.meta?.githubCommitRef ?? d.meta?.githubCommitSha?.slice(0, 7),
        message: d.meta?.githubCommitMessage
      })) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

function renderRuntime(runtime) {
  const lines = [];
  lines.push("## Runtime errors (MongoDB)");
  if (!runtime.ok) {
    lines.push(`\n> ${esc(runtime.error)}`);
    return lines.join("\n");
  }
  if (!runtime.rows.length) {
    lines.push("\nNo runtime errors recorded.");
    return lines.join("\n");
  }
  lines.push("");
  lines.push("| When | Status | Method | Path | Message | Source |");
  lines.push("| --- | --- | --- | --- | --- | --- |");
  for (const r of runtime.rows) {
    lines.push(`| ${esc(r.timestamp ? new Date(r.timestamp).toISOString() : "")} | ${r.status ?? ""} | ${esc(r.method)} | ${esc(r.path)} | ${esc(r.message)} | ${esc(r.source)} |`);
  }
  lines.push("");
  lines.push("<details><summary>Stack traces</summary>\n");
  for (const r of runtime.rows) {
    if (r.stack) {
      lines.push(`**${esc(r.path || r.message)}**`);
      lines.push("```");
      lines.push(r.stack);
      lines.push("```");
      lines.push("");
    }
  }
  lines.push("</details>");
  return lines.join("\n");
}

function renderVercel(vercel) {
  const lines = [];
  lines.push("## Deploy / build logs (Vercel)");
  if (!vercel.ok) {
    lines.push(`\n> ${esc(vercel.error)}`);
    return lines.join("\n");
  }
  if (!vercel.deployments.length) {
    lines.push("\nNo deployments found.");
    return lines.join("\n");
  }
  lines.push("");
  lines.push("| When | State | URL | Commit |");
  lines.push("| --- | --- | --- | --- |");
  for (const d of vercel.deployments) {
    lines.push(`| ${esc(d.createdAt)} | ${esc(d.state)} | ${esc(d.url)} | ${esc(d.message ?? d.commit)} |`);
  }
  return lines.join("\n");
}

async function main() {
  const [runtime, vercel] = await Promise.all([collectRuntime(), collectVercel()]);

  const content = [
    `# Error report`,
    ``,
    `_Generated ${now()}_`,
    ``,
    `> Fallback view of recent errors, written to this repo when the API logs an error`,
    `> or when run manually. For live viewing use the superadmin panel (Error Logs).`,
    ``,
    renderRuntime(runtime),
    ``,
    renderVercel(vercel),
    ``
  ].join("\n");

  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(reportPath, content, "utf8");
  console.log(`Wrote ${reportPath}`);
  if (!runtime.ok) console.warn(runtime.error);
  if (!vercel.ok) console.warn(vercel.error);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
