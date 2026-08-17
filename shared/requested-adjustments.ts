export function normalizeRequestedAdjustmentsUrl(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (!Array.isArray(value)) return "";
  for (const item of value) {
    if (typeof item !== "string") continue;
    const url = item.trim();
    if (url) return url;
  }
  return "";
}
