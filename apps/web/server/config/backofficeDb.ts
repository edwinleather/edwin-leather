import mongoose from "mongoose";
import { env } from "./env.js";

let conn: mongoose.Connection | null = null;
let connectPromise: Promise<mongoose.Connection> | null = null;

export function backofficeDb(): mongoose.Connection {
  if (!conn) {
    // Strip the database name from the URI so the dbName option is respected.
    const uriWithoutDb = env.mongoUri.replace(/\/[^/?]+(\?|$)/, "/$1");
    conn = mongoose.createConnection(uriWithoutDb, {
      dbName: env.backofficeDbName,
      maxPoolSize: 5,
      bufferCommands: false
    });
  }
  return conn;
}

export function backofficeReady(): boolean {
  return conn?.readyState === 1;
}

// Await the backoffice connection (including one already in-flight) before
// running a query. Resolves true only when ready.
export async function ensureBackoffice(): Promise<boolean> {
  if (backofficeReady()) return true;
  if (connectPromise) return (await connectPromise).readyState === 1;

  connectPromise = backofficeDb().asPromise();
  try {
    await connectPromise;
    return backofficeReady();
  } catch {
    return false;
  } finally {
    connectPromise = null;
  }
}
