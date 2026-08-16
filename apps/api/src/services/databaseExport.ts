import mongoose from "mongoose";
import { EJSON } from "bson";
import { env } from "../config/env.js";
import { backofficeDb, ensureBackoffice } from "../config/backofficeDb.js";
import { ensureDatabase } from "../config/db.js";
import { ApiError } from "../middleware/error.js";

type DbHandle = { name: string; db: () => mongoose.mongo.Db | null };

function mainDbName(): string {
  try {
    const db = mongoose.connection.db;
    return db?.databaseName ?? "edwin";
  } catch {
    return "edwin";
  }
}

function handles(): DbHandle[] {
  return [
    { name: mainDbName(), db: () => mongoose.connection.db ?? null },
    { name: env.backofficeDbName, db: () => (backofficeReadySafe() ? backofficeDb().db ?? null : null) }
  ];
}

function backofficeReadySafe(): boolean {
  try {
    return backofficeDb().readyState === 1;
  } catch {
    return false;
  }
}

// Dump every collection in the main + backoffice databases as a nested structure
// of BSON Extended JSON documents. EJSON keeps every field's exact type ($oid for
// ObjectIds, $date for dates, etc.) so a restore reproduces the data faithfully.
export async function exportAllDatabases(): Promise<{
  format: string;
  version: number;
  exportedAt: string;
  databases: Record<string, Record<string, unknown[]>>;
}> {
  await Promise.all([ensureDatabase(), ensureBackoffice()]);

  const databases: Record<string, Record<string, unknown[]>> = {};

  for (const handle of handles()) {
    const db = handle.db();
    if (!db) continue;
    const collections = await db.listCollections({}, { nameOnly: true }).toArray();
    const store: Record<string, unknown[]> = {};
    for (const { name } of collections) {
      if (name.startsWith("system.")) continue;
      const docs = await db.collection(name).find({}).toArray();
      store[name] = EJSON.serialize(docs) as unknown as unknown[];
    }
    databases[handle.name] = store;
  }

  return {
    format: "edwin-database-dump",
    version: 1,
    exportedAt: new Date().toISOString(),
    databases
  };
}

// Restore a previously exported dump into the databases the API is currently
// connected to. Each collection is cleared and re-populated from the dump so the
// result is identical to the source (no stale or orphaned documents remain).
export async function importAllDatabases(payload: {
  format: string;
  version: number;
  databases: Record<string, Record<string, unknown[]>>;
}): Promise<{ databases: string[]; collections: number; documents: number }> {
  if (payload?.format !== "edwin-database-dump") {
    throw new ApiError(400, "Not a valid Edwin database export file.");
  }

  await Promise.all([ensureDatabase(), ensureBackoffice()]);

  let collections = 0;
  let documents = 0;
  const restored: string[] = [];

  for (const handle of handles()) {
    const db = handle.db();
    const source = payload.databases?.[handle.name];
    if (!db || !source) continue;

    for (const [name, rawDocs] of Object.entries(source)) {
      if (name.startsWith("system.")) continue;
      const col = db.collection(name);
      // Deserialize EJSON back into native BSON types (ObjectId, Date, etc.).
      const docs = EJSON.deserialize(rawDocs) as Document[];
      // Clear any existing data in the target so the dump fully overwrites it.
      await col.deleteMany({});
      if (docs.length > 0) {
        await col.insertMany(docs, { ordered: false });
      }
      collections += 1;
      documents += docs.length;
    }
    restored.push(handle.name);
  }

  return { databases: restored, collections, documents };
}
