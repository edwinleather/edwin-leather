import crypto from "node:crypto";
import { env } from "./env.js";

// Google Identity Services issues standard RS256 ID tokens (JWTs). We verify
// them directly with Node's built-in crypto against Google's public JWKS, so
// no Google SDK or client secret is required — only the OAuth client ID.
const JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs";

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
  const response = await fetch(JWKS_URL, { headers: { "Cache-Control": "no-cache" } });
  if (!response.ok) throw new Error("Failed to fetch Google public keys");
  const jwks = (await response.json()) as { keys: { kid: string; kty: string; n: string; e: string }[] };
  const keys: Record<string, string> = {};
  for (const jwk of jwks.keys) {
    if (jwk.kty !== "RSA" || !jwk.kid || !jwk.n || !jwk.e) continue;
    const publicKey = crypto.createPublicKey({
      key: {
        kty: "RSA",
        n: base64urlDecode(jwk.n).toString("base64"),
        e: base64urlDecode(jwk.e).toString("base64")
      },
      format: "jwk"
    });
    keys[jwk.kid] = publicKey.export({ type: "spki", format: "pem" }).toString();
  }
  keyCache = { fetched: Date.now(), keys };
  return keys;
}

export function googleReady() {
  // The client ID is a public identifier (it appears in the ID token's aud
  // claim), so it only needs to be non-empty.
  return Boolean(env.googleClientId);
}

export type GoogleClaims = {
  sub: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
};

// Returns the verified token claims, or null if the token is invalid/expired.
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleClaims | null> {
  if (!googleReady()) return null;
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;

    const header = JSON.parse(base64urlDecode(parts[0]).toString()) as { alg?: string; kid?: string };
    if (header.alg !== "RS256" || !header.kid) return null;

    const keys = await fetchPublicKeys();
    const publicKeyPem = keys[header.kid];
    if (!publicKeyPem) return null;

    const verifier = crypto.createVerify("RSA-SHA256");
    verifier.update(`${parts[0]}.${parts[1]}`);
    if (!verifier.verify(publicKeyPem, parts[2], "base64url")) return null;

    const claims = JSON.parse(base64urlDecode(parts[1]).toString()) as {
      sub?: unknown;
      aud?: unknown;
      iss?: unknown;
      exp?: unknown;
      email?: unknown;
      email_verified?: unknown;
      name?: unknown;
      given_name?: unknown;
      family_name?: unknown;
      picture?: unknown;
    };
    if (typeof claims.sub !== "string") return null;
    if (claims.aud !== env.googleClientId) return null;
    const iss = typeof claims.iss === "string" ? claims.iss : "";
    if (iss !== "accounts.google.com" && iss !== "https://accounts.google.com") return null;
    if (typeof claims.exp !== "number" || claims.exp * 1000 < Date.now()) return null;

    return {
      sub: claims.sub,
      email: typeof claims.email === "string" ? claims.email : undefined,
      email_verified: Boolean(claims.email_verified),
      name: typeof claims.name === "string" ? claims.name : undefined,
      given_name: typeof claims.given_name === "string" ? claims.given_name : undefined,
      family_name: typeof claims.family_name === "string" ? claims.family_name : undefined,
      picture: typeof claims.picture === "string" ? claims.picture : undefined
    };
  } catch {
    return null;
  }
}