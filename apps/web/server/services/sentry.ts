import * as Sentry from "@sentry/node";
import { env, isConfigured } from "../config/env.js";

// Sentry is a cloud-hosted error tracker that is independent of MongoDB, so
// errors are captured to Sentry's dashboard even when the database is down.
let initialized = false;

export function initSentry() {
  if (initialized) return;
  initialized = true;
  if (!isConfigured(env.sentryDsn)) return;
  Sentry.init({
    dsn: env.sentryDsn,
    environment: env.nodeEnv === "production" ? "production" : "development",
    tracesSampleRate: 0.2,
    maxBreadcrumbs: 50
  });
}

export function captureError(error: unknown, context?: Record<string, unknown>) {
  if (!isConfigured(env.sentryDsn)) return;
  initSentry();
  Sentry.captureException(error, context ? { extra: context } : undefined);
}