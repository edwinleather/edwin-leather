// Converts a human-readable name into the URL slug convention used by the
// Category model (lowercase, spaces/hyphens collapsed to a single dash).
// Used to build category URLs when only a display name is available (e.g.
// homepage settings cards), while /category/[slug] pages always resolve
// against the real slug stored in the database.
export function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
