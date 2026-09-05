import { connectDatabase, databaseReady } from "../src/config/db.js";
import { seedDatabase } from "../src/config/seed.js";

let dbConnected = false;

async function ensureDb() {
  if (dbConnected && databaseReady()) return;
  dbConnected = await connectDatabase();
  if (dbConnected) await seedDatabase();
}

let appRef: any = null;

export default async function handler(req: any, res: any) {
  await ensureDb();
  if (!appRef) {
    const mod = await import("../src/app.js");
    appRef = mod.app;
  }
  return appRef(req, res);
}
