/** Format move-in / available-from date for cards and detail pages. */
export function formatAvailableFrom(date: Date, locale = "en-ET"): string {
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
