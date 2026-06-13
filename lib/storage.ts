export function safeGetItem(key: string): string | null {
  try { return localStorage.getItem(key); } catch { if (process.env.NODE_ENV === 'development') console.warn('Storage access denied'); return null; }
}
export function safeSetItem(key: string, value: string): boolean {
  try { localStorage.setItem(key, value); return true; } catch { if (process.env.NODE_ENV === 'development') console.warn('Storage access denied'); return false; }
}
export function safeRemoveItem(key: string): void {
  try { localStorage.removeItem(key); } catch { if (process.env.NODE_ENV === 'development') console.warn('Storage access denied'); }
}

export function safeSessionGetItem(key: string): string | null {
  try { return sessionStorage.getItem(key); } catch { if (process.env.NODE_ENV === 'development') console.warn('Storage access denied'); return null; }
}
export function safeSessionSetItem(key: string, value: string): boolean {
  try { sessionStorage.setItem(key, value); return true; } catch { if (process.env.NODE_ENV === 'development') console.warn('Storage access denied'); return false; }
}
export function safeSessionRemoveItem(key: string): void {
  try { sessionStorage.removeItem(key); } catch { if (process.env.NODE_ENV === 'development') console.warn('Storage access denied'); }
}
