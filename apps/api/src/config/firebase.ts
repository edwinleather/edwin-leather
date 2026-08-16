import crypto from "node:crypto";
import { env } from "../config/env.js";

// Firebase ID tokens are standard RS256 JWTs signed by Google's Secure Token
// service. firebase-admin verifies them via jwks-rsa, which does `require("jose")`
// - an ESM-only module - and crashes any CommonJS serverless bundle (Vercel,
// Netlify) with ERR_REQUIRE_ESM. We verify the token directly with Node's built-in
// crypto + Google's public certs, so it runs on any Node version and any bundler.
const KEYS_URL = "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

let keyCache: { fetched: number; keys: Record<string, string> } | null = null;

function base64urlDecode(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, "base64");
}

async function fetchPublicKeys(): Promise<Record<string, string>> {
  if (keyCache && Date.now() - keyCache.fetched < 60 * 60 * 1000) {
    return keyCache.keys;
  }
  const response = await fetch(KEYS_URL, { headers: { "Cache-Control": "no-cache" } });
  if (!response.ok) throw new Error("Failed to fetch Firebase public keys");
  const keys = (await response.json()) as Record<string, string>;
  keyCache = { fetched: Date.now(), keys };
  return keys;
}

export function firebaseReady() {
  // The project ID is a public identifier (it appears in the ID token's aud
  // claim), so it only needs to be non-empty - not a long "secret".
  return Boolean(env.firebaseProjectId);
}

export type FirebaseClaims = {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  iat?: number;
  exp?: number;
};

// Returns the verified token claims, or null if the token is invalid/expired.
export async function verifyFirebaseToken(idToken: string): Promise<FirebaseClaims | null> {
  if (!firebaseReady()) return null;
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;

    const header = JSON.parse(base64urlDecode(parts[0]).toString()) as { alg?: string; kid?: string };
    if (header.alg !== "RS256" || !header.kid) return null;

    const keys = await fetchPublicKeys();
    const certPem = keys[header.kid];
    if (!certPem) return null;

    const publicKey = crypto.createPublicKey(certPem);
    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(`${parts[0]}.${parts[1]}`);
    if (!verifier.verify(publicKey, parts[2], "base64url")) return null;

    const claims = JSON.parse(base64urlDecode(parts[1]).toString()) as {
      sub?: unknown;
      aud?: unknown;
      iss?: unknown;
      exp?: unknown;
      iat?: unknown;
      email?: unknown;
      email_verified?: unknown;
      name?: unknown;
      picture?: unknown;
    };
    if (typeof claims.sub !== "string") return null;
    if (claims.aud !== env.firebaseProjectId) return null;
    if (claims.iss !== `https://securetoken.google.com/${env.firebaseProjectId}`) return null;
    if (typeof claims.exp !== "number" || claims.exp * 1000 < Date.now()) return null;

    return {
      uid: claims.sub,
      email: typeof claims.email === "string" ? claims.email : undefined,
      email_verified: Boolean(claims.email_verified),
      name: typeof claims.name === "string" ? claims.name : undefined,
      picture: typeof claims.picture === "string" ? claims.picture : undefined,
      iat: typeof claims.iat === "number" ? claims.iat : undefined,
      exp: typeof claims.exp === "number" ? claims.exp : undefined
    };
  } catch {
    return null;
  }
}