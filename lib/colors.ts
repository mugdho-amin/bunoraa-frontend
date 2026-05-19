export const COLOR_NAME_TO_HEX: Record<string, string> = {
  black: "#111827",
  white: "#ffffff",
  red: "#ef4444",
  green: "#16a34a",
  blue: "#2563eb",
  yellow: "#facc15",
  orange: "#f97316",
  purple: "#a855f7",
  pink: "#ec4899",
  gray: "#6b7280",
  grey: "#6b7280",
  brown: "#8b5a2b",
  beige: "#d4b48c",
  teal: "#0d9488",
  navy: "#1e3a8a",
  maroon: "#7f1d1d",
  magenta: "#db2777",
  olive: "#4d7c0f",
  gold: "#d97706",
  silver: "#94a3b8",
};

export function getColorSwatch(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) return trimmed;
  return COLOR_NAME_TO_HEX[trimmed.toLowerCase()] || null;
}
