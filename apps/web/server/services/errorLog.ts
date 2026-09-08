import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { env } from "../config/env.js";
import { databaseReady } from "../config/db.js";
import { ErrorLog } from "../models/ErrorLog.js";

// Central error log. Errors are persisted to MongoDB Atlas (the always-on,
// shared store used by both localhost and the deployed Netlify function) and,
// as a best-effort local fallback, appended to a local file. Atlas is the
// source of truth because a plain file cannot be shared across environments
// and Netlify functions have an ephemeral filesystem.
const localLogFile = join(process.cwd(), "logs", "errors.log");

let lastDispatchAt = 0;

// Fires a GitHub repository_dispatch so the "Error report" workflow updates the
// git-file fallback (logs/errors.md) shortly after an error occurs. Throttled
// to ERROR_REPORT_MIN_INTERVAL_MS so a burst of 4xx/validation errors doesn't
// trigger a flood of workflow runs. Fire-and-forget; never breaks a request.
function maybeDispatchReport() {
  const token = env.errorReportToken;
  const repo = env.errorReportRepo;
  if (!token || !repo) return;

  const now = Date.now();
  if (now - lastDispatchAt < env.errorReportMinIntervalMs) return;
  lastDispatchAt = now;

  fetch(`https://api.github.com/repos/${repo}/dispatches`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ event_type: "collect-errors" })
  }).catch(() => {
    // Ignore - the report is only a fallback.
  });
}

export type ErrorLogEntry = {
  method?: string;
  path?: string;
  status?: number;
  code?: string;
  message?: string;
  stack?: string;
  source?: string;
};

function safeErrorInfo(error: unknown) {
  if (error instanceof Error) {
    const anyError = error as unknown as { code?: unknown };
    return {
      code: typeof anyError.code === "string" ? anyError.code : undefined,
      message: error.message || undefined,
      stack: error.stack
    };
  }
  return { code: undefined, message: typeof error === "string" ? error : JSON.stringify(error), stack: undefined };
}

export async function logError(entry: ErrorLogEntry, error?: unknown): Promise<void> {
  const info = error === undefined ? { code: entry.code, message: entry.message, stack: entry.stack } : safeErrorInfo(error);
  const record = {
    timestamp: new Date(),
    environment: env.nodeEnv === "production" ? "production" : "development",
    method: entry.method,
    path: entry.path,
    status: entry.status,
    code: info.code ?? entry.code,
    message: info.message ?? entry.message ?? "Unknown error",
    stack: info.stack ?? entry.stack,
    source: entry.source ?? "api"
  };

  // Best-effort local file (durable on localhost, never throws).
  try {
    mkdirSync(join(process.cwd(), "logs"), { recursive: true });
    appendFileSync(localLogFile, JSON.stringify(record) + "\n");
  } catch {
    // ignore - Atlas is the primary store
  }

  // Always print so Netlify's own function logs capture it too. This works even
  // when MongoDB itself is down, giving a durable, Mongo-independent fallback.
  console.error("[error-log]", JSON.stringify(record));

  // Universal shared store. Fire-and-forget so a failure never breaks a request.
  if (databaseReady()) {
    try {
      await ErrorLog.create(record);
    } catch {
      // ignore - already on the local file / Netlify logs as a fallback
    }
  }

  // Trigger the git-file fallback refresh.
  maybeDispatchReport();
}