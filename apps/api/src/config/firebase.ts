import { env, isConfigured } from "../config/env.js";
import { ApiError } from "../middleware/error.js";

let app: import("firebase-admin/app").App | null = null;

export function firebaseReady() {
  return isConfigured(env.firebaseProjectId) && (isConfigured(env.firebasePrivateKey) || isConfigured(env.googleApplicationCredentials));
}

// firebase-admin pulls in jwks-rsa, which does `require("jose")` (an ESM-only
// module). In a CommonJS serverless bundle (Vercel/Netlify) that throws at load
// time, so we load it lazily only when a Firebase token actually needs verifying.
async function getFirebaseApp() {
  if (app) return app;
  if (!firebaseReady()) {
    throw new ApiError(503, "Firebase is not configured. Add FIREBASE_PROJECT_ID and service-account credentials.");
  }
  const { initializeApp, cert } = await import("firebase-admin/app");
  app = initializeApp({
    credential: cert({
      projectId: env.firebaseProjectId,
      clientEmail: env.firebaseClientEmail,
      privateKey: env.firebasePrivateKey.replace(/\\n/g, "\n")
    }),
    projectId: env.firebaseProjectId
  });
  return app;
}

export async function verifyFirebaseToken(idToken: string) {
  try {
    const { getAuth } = await import("firebase-admin/auth");
    const firebaseApp = await getFirebaseApp();
    return await getAuth(firebaseApp).verifyIdToken(idToken);
  } catch {
    return null;
  }
}