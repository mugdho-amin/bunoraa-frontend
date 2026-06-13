import { cookies } from "next/headers";

export async function getServerLocaleHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const headers: Record<string, string> = {};

  const language = cookieStore.get("language")?.value;
  const currency = cookieStore.get("currency")?.value;
  const timezone = cookieStore.get("timezone")?.value;
  const country = cookieStore.get("country")?.value;

  if (language) {
    headers["Accept-Language"] = language;
    headers["X-User-Language"] = language;
  }
  if (currency) headers["X-User-Currency"] = currency;
  if (timezone) headers["X-User-Timezone"] = timezone;
  if (country) headers["X-User-Country"] = country;

  return headers;
}

export async function getServerLang(): Promise<string> {
  try {
    const cookieStore = await cookies();
    return cookieStore.get("language")?.value || "en";
  } catch {
    return "en";
  }
}
