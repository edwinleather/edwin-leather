import type { NextFunction, Request, Response } from "express";
import { logError } from "../services/errorLog.js";
import { captureError } from "../services/sentry.js";

export class ApiError extends Error {
  statusCode: number;
  details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFound(req: Request, _res: Response, next: NextFunction) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(error: unknown, req: Request, res: Response, _next: NextFunction) {
  const status = error instanceof ApiError ? error.statusCode : 500;
  const details = error instanceof ApiError ? error.details : undefined;

  logError(
    {
      method: req.method,
      path: req.originalUrl,
      status,
      source: "api"
    },
    error
  );

  captureError(error, { method: req.method, path: req.originalUrl, status });

  if (error instanceof ApiError) {
    return res.status(status).json({ ok: false, error: error.message, details });
  }

  console.error("[api:error]", error);
  return res.status(500).json({ ok: false, error: "Internal server error" });
}
