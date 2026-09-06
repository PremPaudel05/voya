import { useEffect, useRef, useState } from 'react';
import { loadScript } from '../services/accountService';
import { usePreferences } from '../preferences/PreferencesContext';
declare global {
  interface Window {
    turnstile?: { render: (container: HTMLElement, options: { sitekey: string; action: string; theme: string; size: string; language: string; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void }) => string; remove: (id: string) => void };
    google?: { accounts: { id: { initialize: (options: { client_id: string; nonce: string; callback: (response: { credential: string }) => void; auto_select: boolean }) => void; renderButton: (element: HTMLElement, options: { theme: string; size: string; text: string; width: number; locale?: string }) => void } } };
  }
}
export function SecurityCheck({ siteKey, action, onToken }: { siteKey: string; action: string; onToken: (token: string) => void }) {
  const { preferences } = usePreferences();
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  const [error, setError] = useState('');
  useEffect(() => { callback.current = onToken; }, [onToken]);
  useEffect(() => {
    let active = true; let id: string | undefined;
    loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit').then(() => {
      if (!active || !container.current || !window.turnstile) return;
      callback.current('');
      id = window.turnstile.render(container.current, { sitekey: siteKey, action, theme: preferences.theme === 'system' ? 'auto' : preferences.theme, size: 'flexible', language: preferences.language, callback: token => { setError(''); callback.current(token); }, 'expired-callback': () => callback.current(''), 'error-callback': () => { callback.current(''); setError('Security verification could not load. Refresh this page to try again.'); } });
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; if (id) window.turnstile?.remove(id); };
  }, [siteKey, action, preferences.theme, preferences.language]);
  return <div><div ref={container} />{error && <p role="alert" className="text-xs text-red-700 mt-2">{error}</p>}</div>;
}
