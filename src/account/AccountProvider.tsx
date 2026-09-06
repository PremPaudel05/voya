import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { AccountContext } from './AccountContext';
import { accountRequest, sessionToken, storeSession } from '../services/accountService';
import type { Account, AccountConfig, Preferences } from '../services/accountService';

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [config, setConfig] = useState<AccountConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    if (!sessionToken()) { setAccount(null); return; }
    try { setAccount(await accountRequest<Account>('/me')); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load your account.'); if (!sessionToken()) setAccount(null); }
  }, []);
  useEffect(() => {
    let active = true;
    accountRequest<AccountConfig>('/config').then(value => { if (active) setConfig(value); }).catch(e => { if (active) setError(e.message); });
    if (sessionToken()) {
      accountRequest<Account>('/me').then(value => { if (active) setAccount(value); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    } else {
      queueMicrotask(() => { if (active) setLoading(false); });
    }
    const sync = (event: StorageEvent) => { if (event.key === 'voya-session' || event.key === null) void refresh(); };
    const expire = () => setAccount(null);
    window.addEventListener('storage', sync); window.addEventListener('voya-session-expired', expire);
    return () => { active = false; window.removeEventListener('storage', sync); window.removeEventListener('voya-session-expired', expire); };
  }, [refresh]);
  const login = useCallback(async (credential: string, turnstileToken: string) => {
    const result = await accountRequest<Account & { token: string }>('/auth/google', { method: 'POST', body: JSON.stringify({ credential, turnstileToken }) });
    storeSession(result.token); setAccount(result); setError('');
  }, []);
  const logout = useCallback(async () => {
    await accountRequest('/auth/logout', { method: 'POST' });
    storeSession(null); setAccount(null);
  }, []);
  const saveSettings = useCallback(async (settings: Preferences) => {
    const saved = await accountRequest<{ settings: Preferences }>('/settings', { method: 'PUT', body: JSON.stringify(settings) });
    setAccount(previous => previous ? { ...previous, settings: saved.settings } : null);
  }, []);
  const deleteAccount = useCallback(async (email: string, confirmation: string) => {
    await accountRequest('/account', { method: 'DELETE', body: JSON.stringify({ email, confirmation }) });
    storeSession(null);
    try { localStorage.removeItem('voya-preferences'); } catch { /* Storage can be unavailable. */ }
    setAccount(null); setError('');
    window.dispatchEvent(new Event('voya-preferences-reset'));
  }, []);
  const recordSearch = useCallback(async (countryName: string) => {
    if (!sessionToken()) return;
    await accountRequest('/history', { method: 'POST', body: JSON.stringify({ countryName }) });
  }, []);
  return <AccountContext.Provider value={{ account, config, loading, error, refresh, login, logout, saveSettings, deleteAccount, recordSearch }}>{children}</AccountContext.Provider>;
}
