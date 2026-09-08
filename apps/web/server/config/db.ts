import mongoose from "mongoose";
import { env, isConfigured } from "./env.js";

export let lastDbError: string | null = null;

let connectPromise: Promise<boolean> | null = null;

export async function connectDatabase(): Promise<boolean> {
  if (!isConfigured(env.mongoUri)) {
    console.info("[db] MongoDB not configured; API will use demo-safe fallbacks.");
    lastDbError = "MONGODB_URI is not configured";
    return false;
  }

  if (mongoose.connection.readyState === 1) return true;
  if (connectPromise) return connectPromise;

  connectPromise = mongoose
    .connect(env.mongoUri, {
      serverSelectionTimeoutMS: 8000,
      maxPoolSize: 10,
      bufferCommands: false
    })
    .then(() => {
      lastDbError = null;
      console.info("[db] Connected to MongoDB Atlas.");
      return true;
    })
    .catch((error) => {
      lastDbError = error instanceof Error ? error.message : String(error);
      console.error("[db] Connection failed. Continuing without DB in demo-safe mode.", error);
      return false;
    })
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
}

export function databaseReady(): boolean {
  return mongoose.connection.readyState === 1;
}

// Await the connection (including one already in-flight from a cold-start
// handler) before running a query. Resolves true only when ready.
export function ensureDatabase(): Promise<boolean> {
  if (mongoose.connection.readyState === 1) return Promise.resolve(true);
  return connectDatabase();
}
