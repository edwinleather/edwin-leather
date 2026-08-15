import mongoose from "mongoose";
import { env, isConfigured } from "./env.js";

export async function connectDatabase() {
  if (!isConfigured(env.mongoUri)) {
    console.info("[db] MongoDB not configured; API will use demo-safe fallbacks.");
    lastDbError = "MONGODB_URI is not configured";
    return false;
  }

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    lastDbError = null;
    console.info("[db] Connected to MongoDB Atlas.");
    return true;
  } catch (error) {
    lastDbError = error instanceof Error ? error.message : String(error);
    console.error("[db] Connection failed. Continuing without DB in demo-safe mode.", error);
    return false;
  }
}

export let lastDbError: string | null = null;

export function databaseReady() {
  return mongoose.connection.readyState === 1;
}
