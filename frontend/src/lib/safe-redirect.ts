/** A "where to go after signing in" value is only used when it is a plain path on this site. */
export function safeNextPath(value: string | null | undefined, fallback = "/dashboard"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  if (value.startsWith("/login") || value.startsWith("/register")) return fallback;
  return value;
}
