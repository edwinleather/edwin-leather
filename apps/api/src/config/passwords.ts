import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Password hashing using Node's built-in scrypt (no external dependency).
// Stored format: "scrypt:N:r:p:saltBase64:hashBase64" so the work factors can be
// raised in the future without breaking existing hashes.

const KEYLEN = 64;
const DEFAULT_N = 16384;
const DEFAULT_R = 8;
const DEFAULT_P = 1;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEYLEN, {
    N: DEFAULT_N,
    r: DEFAULT_R,
    p: DEFAULT_P
  });
  return `scrypt:${DEFAULT_N}:${DEFAULT_R}:${DEFAULT_P}:${salt.toString("base64")}:${hash.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  try {
    const [scheme, n, r, p, saltB64, hashB64] = stored.split(":");
    if (scheme !== "scrypt") return false;
    const hash = scryptSync(password, Buffer.from(saltB64, "base64"), KEYLEN, {
      N: Number(n),
      r: Number(r),
      p: Number(p)
    });
    const expected = Buffer.from(hashB64, "base64");
    return hash.length === expected.length && timingSafeEqual(hash, expected);
  } catch {
    return false;
  }
}