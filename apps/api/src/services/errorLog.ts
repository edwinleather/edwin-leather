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
    // ignore — Atlas is the primary store
  }

  // Universal shared store. Fire-and-forget so a failure never breaks a request.
  if (databaseReady()) {
    try {
      await ErrorLog.create(record);
    } catch {
      // ignore — already on the local file as a fallback
    }
  }
}