export type MoneyInput = string | number | null | undefined;

export function parseMoney(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const normalized = trimmed
    .replace(/[\u00A0\u202F\s]/g, "")
    .replace(/[−–—]/g, "-")
    .replace(/[^\d,.-]/g, "");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export type FormatMoneyConfig = {
  symbol?: string;
  position?: "before" | "after";
  currency?: string;
};

export function formatMoney(
  amount: MoneyInput,
  config?: string | FormatMoneyConfig | null
) {
  if (amount === null || amount === undefined) return "";

  const currency = config && typeof config === "string" ? config : config && typeof config === "object" ? config.currency || "BDT" : "BDT";

  const parsed = parseMoney(amount);
  let numeric: number;

  if (parsed !== null) {
    numeric = parsed;
  } else if (typeof amount === "string") {
    const trimmed = amount.trim();
    if (!trimmed) return "";
    return trimmed;
  } else {
    numeric = Number(amount);
  }

  if (!Number.isFinite(numeric)) {
    return String(amount ?? "");
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      currencyDisplay: "narrowSymbol",
    }).format(numeric);
  } catch {
    return `${numeric.toFixed(2)} ${currency}`;
  }
}

export function formatNumber(value: MoneyInput) {
  if (value === null || value === undefined) return "";
  const numeric = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return String(value);
  return new Intl.NumberFormat().format(numeric);
}
