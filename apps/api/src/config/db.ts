import mongoose from "mongoose";
import { env, isConfigured } from "./env.js";

export async function connectDatabase() {
  if (!isConfigured(env.mongoUri)) {
    console.info("[db] MongoDB not configured; API will use demo-safe fallbacks.");
    return false;
  }

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.info("[db] Connected to MongoDB Atlas.");
    return true;
  } catch (error) {
    console.error("[db] Connection failed. Continuing without DB in demo-safe mode.", error);
    return false;
  }
}

export function databaseReady() {
  return mongoose.connection.readyState === 1;
}
