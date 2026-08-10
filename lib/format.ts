/**
 * Site-locale-aware formatting helpers.
 *
 * The site supports `en` and `bn`. Numbers and dates must follow the
 * *selected site language* (cookie `language`), never the browser's UI
 * locale — otherwise a Bengali browser renders Bengali digits (০১২…)
 * even when the site is displayed in English.
 */
export function getFormatLocale(language?: string | null): string {
  if (language) {
    const normalized = language.trim().toLowerCase();
    if (normalized === "bn" || normalized.startsWith("bn")) return "bn-BD";
    return "en";
  }
  if (typeof window === "undefined") return "en";
  const cookieLang = document.cookie.match(/(?:^|;\s*)language=([^;]*)/)?.[1];
  return getFormatLocale(cookieLang);
}

export function formatDateTime(
  value?: string | number | Date | null,
  language?: string | null
): string {
  if (value === null || value === undefined) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  try {
    return new Intl.DateTimeFormat(getFormatLocale(language), {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}