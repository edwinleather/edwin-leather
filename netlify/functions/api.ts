import serverless from "serverless-http";
import { app } from "../../apps/api/src/app.js";
import { connectDatabase, databaseReady } from "../../apps/api/src/config/db.js";
import { seedDatabase } from "../../apps/api/src/config/seed.js";
import { Product } from "../../apps/api/src/models/Product.js";
import { seedDeliveryConfig } from "../../apps/api/src/services/delivery.js";

const FUNCTION_PREFIX = "/.netlify/functions/api";

const expressHandler = serverless(app, {
  request: (req: { url?: string }) => {
    if (req.url && req.url.startsWith(FUNCTION_PREFIX)) {
      req.url = "/api" + req.url.slice(FUNCTION_PREFIX.length);
    }
  },
});

// Netlify idles/recycles containers: the cached Mongo connection can go stale,
// so we must re-verify readiness and reconnect on every invocation instead of
// trusting a resolved promise. Concurrent cold starts share a single connect.
let connecting: Promise<void> | null = null;

async function seedIfCatalogEmpty(): Promise<void> {
  try {
    if ((await Product.countDocuments()) === 0) await seedDatabase();
    await seedDeliveryConfig();
  } catch (error) {
    console.error("[api] Seeding skipped:", error);
  }
}

async function ensureDatabase(): Promise<void> {
  if (databaseReady()) return; // warm, healthy
  if (!connecting) {
    connecting = (async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await connectDatabase();
          if (databaseReady()) {
            await seedIfCatalogEmpty();
            return;
          }
        } catch (error) {
          console.error(`[api] Database connect attempt ${attempt}/3 failed:`, error);
        }
        if (attempt < 3) await new Promise((r) => setTimeout(r, 800));
      }
      connecting = null;
      console.warn("[api] Database not ready; affected requests will return 503.");
    })();
  }
  await connecting;
}

export const handler = async (event: any, context: unknown) => {
  await ensureDatabase();
  const ip =
    event.requestContext?.identity?.sourceIp ??
    event.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ??
    "0.0.0.0";
  event.requestContext = event.requestContext ?? {};
  event.requestContext.identity = event.requestContext.identity ?? {};
  event.requestContext.identity.sourceIp = ip;
  return expressHandler(event, context);
};