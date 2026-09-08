import { useEffect, useRef, useState } from 'react';
import { loadScript } from '../services/accountService';
import { usePreferences } from '../preferences/PreferencesContext';

export type SecurityCheckStatus = 'checking' | 'interactive' | 'ready' | 'error';
type Appearance = 'always' | 'execute' | 'interaction-only';
type WidgetSize = 'flexible' | 'compact';

declare global {
  interface Window {
    turnstile?: { render: (container: HTMLElement, options: { sitekey: string; action: string; theme: string; size: WidgetSize; language: string; appearance: Appearance; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void; 'before-interactive-callback': () => void; 'after-interactive-callback': () => void; 'timeout-callback': () => void; 'unsupported-callback': () => void }) => string; remove: (id: string) => void };
    google?: { accounts: { id: { initialize: (options: { client_id: string; nonce: string; callback: (response: { credential: string }) => void; auto_select: boolean }) => void; renderButton: (element: HTMLElement, options: { theme: string; size: string; text: string; width: number; shape?: string; locale?: string }) => void } } };
  }
}
export function SecurityCheck({ siteKey, action, onToken, appearance = 'always', size = 'flexible', onStatusChange }: {
  siteKey: string;
  action: string;
  onToken: (token: string) => void;
  appearance?: Appearance;
  size?: WidgetSize;
  onStatusChange?: (status: SecurityCheckStatus) => void;
}) {
  const { preferences, t } = usePreferences();
  const container = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  const statusCallback = useRef(onStatusChange);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<SecurityCheckStatus>('checking');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { callback.current = onToken; }, [onToken]);
  useEffect(() => { statusCallback.current = onStatusChange; }, [onStatusChange]);
  useEffect(() => {
    let active = true;
    let id: string | undefined;
    const report = (next: SecurityCheckStatus, token = '') => {
      if (!active) return;
      callback.current(token);
      setStatus(next);
      statusCallback.current?.(next);
    };
    const fail = () => {
      if (!active) return;
      setError('Verification could not finish. Check your connection and try again.');
      report('error');
    };
    setError('');
    report('checking');
    loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit').then(() => {
      if (!active || !container.current) return;
      if (!window.turnstile) { fail(); return; }
      id = window.turnstile.render(container.current, {
        sitekey: siteKey, action, appearance, size,
        theme: preferences.theme === 'system' ? 'auto' : preferences.theme,
        language: preferences.language,
        callback: token => { if (active) { setError(''); report('ready', token); } },
        'expired-callback': () => report('checking'),
        'error-callback': fail,
        'before-interactive-callback': () => { if (active) { setError(''); report('interactive'); } },
        'after-interactive-callback': () => { if (active) { setStatus('checking'); statusCallback.current?.('checking'); } },
        'timeout-callback': fail,
        'unsupported-callback': fail,
      });
    }).catch(fail);
    return () => { active = false; if (id) window.turnstile?.remove(id); };
  }, [siteKey, action, appearance, size, preferences.theme, preferences.language, attempt]);
  return <div className="security-check" data-state={status}>
    <div ref={container} />
    {error && <div className="account-error" role="alert">
      <p>{t(error)}</p>
      <button type="button" className="account-link" onClick={() => setAttempt(value => value + 1)}>{t('Try again')}</button>
    </div>}
  </div>;
}
