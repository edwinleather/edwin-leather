import mongoose from "mongoose";
import { env } from "./env.js";

let conn: mongoose.Connection | null = null;

export function backofficeDb(): mongoose.Connection {
  if (!conn) {
    conn = mongoose.createConnection(env.mongoUri, {
      dbName: env.backofficeDbName,
      maxPoolSize: 5
    });
  }
  return conn;
}

export function backofficeReady(): boolean {
  return conn?.readyState === 1;
}