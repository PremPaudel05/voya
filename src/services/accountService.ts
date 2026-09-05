export const ACCOUNT_API = import.meta.env.VITE_ACCOUNT_API_URL || 'https://voya-account-api.voya-prempaudel05.workers.dev';
export interface Preferences { budget: string; traveler: string; days: number; styles: string[]; saveHistory: boolean }
export interface Usage { limit: number; used: number; remaining: number; resetsAt: number; cooldownUntil: number }
export interface Account { user: { name: string; email: string }; settings: Preferences; usage: Usage }
export interface AccountConfig { ready: boolean; googleClientId: string; turnstileSiteKey: string }
export interface PlanDay { day: number; title: string; morning: string; afternoon: string; evening: string; tip: string; estimatedCost: string }
export interface TravelPlan { intro: string; days: PlanDay[]; packingEssentials: string[]; budgetSummary: string; bestAdvice: string }
export const DEFAULT_PREFERENCES: Preferences = { budget: 'midrange', traveler: 'couple', days: 7, styles: ['culture'], saveHistory: true };
const TOKEN_KEY = 'voya-session';
export function sessionToken() { try { return localStorage.getItem(TOKEN_KEY); } catch { return null; } }
export function storeSession(token: string | null) { if (token) localStorage.setItem(TOKEN_KEY, token); else localStorage.removeItem(TOKEN_KEY); }
export class AccountError extends Error {
  status: number;
  retryAfter: number;
  constructor(message: string, status: number, retryAfter = 0) { super(message); this.status = status; this.retryAfter = retryAfter; }
}
export async function accountRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!ACCOUNT_API) throw new AccountError('Accounts and trip planning are being set up. Please check back shortly.', 503);
  const headers = new Headers(options.headers);
  const token = sessionToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (options.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(`${ACCOUNT_API}${path}`, { ...options, headers, credentials: 'omit', signal: options.signal || AbortSignal.timeout(90000) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) { storeSession(null); window.dispatchEvent(new Event('voya-session-expired')); }
    throw new AccountError(data.error || 'The account service is temporarily unavailable.', response.status, Number(response.headers.get('Retry-After')) || 0);
  }
  return data as T;
}
const scripts = new Map<string, Promise<void>>();
export function loadScript(src: string): Promise<void> {
  const previous = scripts.get(src); if (previous) return previous;
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script'); script.src = src; script.async = true; script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => { scripts.delete(src); script.remove(); reject(new Error('Sign-in or security verification could not load. Please check your connection and try again.')); };
    document.head.appendChild(script);
  });
  scripts.set(src, promise); return promise;
}
