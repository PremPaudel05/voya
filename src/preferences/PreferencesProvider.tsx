import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { X } from 'lucide-react';
import { useAccount } from '../account/AccountContext';
import { interfaceDefaults } from '../../shared/preferences';
import type { InterfacePreferences } from '../../shared/preferences';
import { PreferencesContext } from './PreferencesContext';
import type { Notice } from './PreferencesContext';
import { translate } from './translations';

const KEY = 'voya-preferences';
function localPreferences() {
  try { return interfaceDefaults(JSON.parse(localStorage.getItem(KEY) || '{}')); }
  catch { return interfaceDefaults(); }
}
export function PreferencesProvider({ children }: { children: ReactNode }) {
  const { account } = useAccount();
  const accountSettings = account?.settings;
  const [preferences, setPreferences] = useState(localPreferences);
  const [notice, setNotice] = useState('');
  const [systemDark, setSystemDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches);
  useEffect(() => {
    const query = matchMedia('(prefers-color-scheme: dark)');
    const change = () => setSystemDark(query.matches);
    query.addEventListener('change', change);
    return () => query.removeEventListener('change', change);
  }, []);
  useEffect(() => {
    if (!accountSettings || !Object.hasOwn(accountSettings, 'theme')) return;
    // Do not persist an account identifier or profile in browser preferences.
    queueMicrotask(() => setPreferences(interfaceDefaults(accountSettings)));
  }, [accountSettings]);
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = preferences.theme === 'system' ? systemDark ? 'dark' : 'light' : preferences.theme;
    root.dataset.contrast = preferences.contrast;
    root.dataset.motion = preferences.reducedMotion ? 'reduced' : 'standard';
    root.lang = preferences.language;
    try { localStorage.setItem(KEY, JSON.stringify(preferences)); } catch { /* Private browsing may restrict storage. */ }
  }, [preferences, systemDark]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === KEY) setPreferences(localPreferences()); };
    const reset = () => { setPreferences(interfaceDefaults()); setNotice(''); };
    window.addEventListener('storage', sync);
    window.addEventListener('voya-preferences-reset', reset);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('voya-preferences-reset', reset); };
  }, []);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 6000); return () => clearTimeout(timer); }, [notice]);
  const t = useCallback((key: string, vars?: Record<string, string | number>) => translate(preferences.language, key, vars), [preferences.language]);
  const update = useCallback((value: Partial<InterfacePreferences>) => setPreferences(previous => interfaceDefaults({ ...previous, ...value })), []);
  const notify = useCallback(({ type, country }: Notice) => {
    const text = t(type === 'guide' ? '{country} is ready to explore.' : 'Your plan for {country} is ready.', { country });
    if (preferences.notifications.inApp) setNotice(text);
    if (type === 'plan' && preferences.notifications.browser && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      try { new Notification('Voya', { body: text, tag: 'voya-plan-ready' }); } catch { /* Browser may require an installed app. */ }
    }
  }, [preferences.notifications, t]);
  const value = useMemo(() => ({ preferences, update, t, notify }), [preferences, update, t, notify]);
  return <PreferencesContext.Provider value={value}>
    <MotionConfig reducedMotion={preferences.reducedMotion ? 'always' : 'user'}>{children}</MotionConfig>
    {notice && <div className="voya-toast"><p role="status">{notice}</p><button type="button" aria-label={t('Dismiss notification')} onClick={() => setNotice('')}><X size={18} /></button></div>}
  </PreferencesContext.Provider>;
}
