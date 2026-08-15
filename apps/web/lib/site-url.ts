// Returns the validated site URL for metadata/sitemap/robots use.
// Falls back to localhost when NEXT_PUBLIC_SITE_URL is missing or not a
// valid URL, so a misconfigured env var can never crash the build.
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL;
  if (raw) {
    try {
      new URL(raw);
      return raw.replace(/\/+$/, "");
    } catch {
      // invalid URL — fall through to localhost fallback
    }
  }
  return "http://localhost:3000";
}
