export type SearchParams = Record<string, string | string[] | undefined>;
export type RequestParamValue = string | number | boolean | Array<string | number | boolean> | undefined;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function buildFilterScopeParams(searchParams: SearchParams): Record<string, string> {
  const params: Record<string, string> = {};
  for (const key of ["q", "in_stock", "on_sale", "min_rating", "new_arrivals"]) {
    const val = firstValue(searchParams[key]);
    if (val) params[key] = val;
  }
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key.startsWith("attr_")) {
      const val = firstValue(value);
      if (val) params[key] = val;
    }
  });
  return params;
}

export function buildProductRequestParams(searchParams: SearchParams): Record<string, RequestParamValue> {
  const params: Record<string, RequestParamValue> = {};
  Object.entries(searchParams).forEach(([key, value]) => {
    if (key === "view" || key === "cols" || key === "page") return;
    if (value === undefined) return;
    if (Array.isArray(value)) {
      const filtered = value.filter((item) => item.trim() !== "");
      if (filtered.length) params[key] = filtered;
      return;
    }
    if (value !== "") params[key] = value;
  });
  return params;
}

export function searchParamsToRecord(sp: URLSearchParams): SearchParams {
  const result: SearchParams = {};
  sp.forEach((value, key) => {
    if (result[key] === undefined) {
      result[key] = value;
    } else {
      const existing = result[key]!;
      result[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    }
  });
  return result;
}
