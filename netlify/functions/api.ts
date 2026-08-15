import serverless from "serverless-http";
import { app } from "../../apps/api/src/app.js";
import { connectDatabase, databaseReady } from "../../apps/api/src/config/db.js";
import { seedDatabase } from "../../apps/api/src/config/seed.js";

const FUNCTION_PREFIX = "/.netlify/functions/api";

const expressHandler = serverless(app, {
  request: (req: { url?: string }) => {
    if (req.url && req.url.startsWith(FUNCTION_PREFIX)) {
      req.url = "/api" + req.url.slice(FUNCTION_PREFIX.length);
    }
  },
});

let connected: Promise<void> | null = null;

async function bootstrap(): Promise<void> {
  const ok = await connectDatabase();
  if (ok && databaseReady()) await seedDatabase();
}

function ensureDatabase(): Promise<void> {
  if (!connected) {
    connected = (async () => {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await bootstrap();
          if (databaseReady()) return;
        } catch (error) {
          console.error(`[api] Database bootstrap attempt ${attempt}/3 failed:`, error);
        }
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1500));
      }
      connected = null;
      console.warn("[api] Database not ready after 3 attempts; serving demo mode.");
    })();
  }
  return connected;
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