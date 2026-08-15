import { initializeApp, cert, applicationDefault, getApps, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { env, isConfigured } from "../config/env.js";
import { ApiError } from "../middleware/error.js";

let app: App | null = null;

export function firebaseReady() {
  return isConfigured(env.firebaseProjectId) && (isConfigured(env.firebasePrivateKey) || isConfigured(env.googleApplicationCredentials));
}

export function getFirebaseApp(): App {
  if (app) return app;
  if (!firebaseReady()) {
    throw new ApiError(503, "Firebase is not configured. Add FIREBASE_PROJECT_ID and service-account credentials.");
  }
  // FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY are the primary path.
  // If only GOOGLE_APPLICATION_CREDENTIALS is set (a service-account JSON
  // path), fall back to the default credentials lookup so both work.
  const hasKeyMaterial = isConfigured(env.firebaseClientEmail) && isConfigured(env.firebasePrivateKey);
  app = initializeApp({
    credential: hasKeyMaterial
      ? cert({
          projectId: env.firebaseProjectId,
          clientEmail: env.firebaseClientEmail,
          privateKey: env.firebasePrivateKey.replace(/\\n/g, "\n")
        })
      : applicationDefault(),
    projectId: env.firebaseProjectId
  });
  return app;
}

export async function verifyFirebaseToken(idToken: string) {
  try {
    return await getAuth(getFirebaseApp()).verifyIdToken(idToken);
  } catch {
    return null;
  }
}

export function firebaseAppsInitialized() {
  return getApps().length > 0;
}