import { useCallback, useEffect, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useAccount } from '../account/AccountContext';
import { usePreferences } from '../preferences/PreferencesContext';
import { accountRequest, loadScript } from '../services/accountService';

export function GoogleSignIn({ token, disabled, onBusy, onTokenUsed }: {
  token: string; disabled: boolean; onBusy: (busy: boolean) => void; onTokenUsed: () => void;
}) {
  const { config, login } = useAccount();
  const { t, preferences } = usePreferences();
  const container = useRef<HTMLDivElement>(null);
  const tokenRef = useRef('');
  const callbacks = useRef({ onBusy, onTokenUsed });
  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { callbacks.current = { onBusy, onTokenUsed }; }, [onBusy, onTokenUsed]);
  const clientId = config?.googleClientId;
  const enabled = config?.providers?.google ?? config?.ready;
  const [readyKey, setReadyKey] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const buttonKey = `${enabled}:${clientId}:${attempt}:${preferences.language}:${preferences.theme}`;

  useEffect(() => {
    if (!enabled || !clientId) return;
    let active = true;
    let observer: ResizeObserver | undefined;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    let renderButton = () => {};

    Promise.all([
      loadScript('https://accounts.google.com/gsi/client'),
      accountRequest<{ nonce: string }>('/auth/challenge', { method: 'POST', signal: AbortSignal.timeout(10000) }),
    ]).then(([, challenge]) => {
      if (!active || !container.current) return;
      if (!window.google) throw new Error(t('Google sign-in could not load. Please try again.'));
      const google = window.google;
      google.accounts.id.initialize({
        client_id: clientId, nonce: challenge.nonce, auto_select: false,
        callback: response => {
          if (!active) return;
          if (!tokenRef.current) { setError(t('Complete the security check before signing in.')); return; }
          setBusy(true);
          callbacks.current.onBusy(true);
          setError('');
          void login(response.credential, tokenRef.current).catch(e => {
            if (!active) return;
            setError(e.message);
            setBusy(false);
            callbacks.current.onBusy(false);
            callbacks.current.onTokenUsed();
            setAttempt(value => value + 1);
          }).finally(() => { if (active) { setBusy(false); callbacks.current.onBusy(false); } });
        },
      });

      let previousStyle = '';
      renderButton = () => {
        if (!active || !container.current) return;
        const width = Math.max(200, Math.min(400, Math.floor(container.current.clientWidth)));
        const dark = preferences.theme === 'dark' || (preferences.theme === 'system' && systemTheme.matches);
        const style = `${width}:${dark}`;
        if (style === previousStyle) return;
        previousStyle = style;
        container.current.replaceChildren();
        google.accounts.id.renderButton(container.current, {
          theme: dark ? 'filled_black' : 'outline', size: 'large', text: 'continue_with',
          shape: 'pill', width, locale: preferences.language,
        });
        setReadyKey(buttonKey);
      };
      renderButton();
      observer = new ResizeObserver(() => renderButton());
      observer.observe(container.current);
      systemTheme.addEventListener('change', renderButton);
    }).catch(e => { if (active) setError(e.message); });

    const expiry = window.setTimeout(() => setAttempt(value => value + 1), 240000);
    return () => {
      clearTimeout(expiry);
      active = false;
      observer?.disconnect();
      systemTheme.removeEventListener('change', renderButton);
    };
  }, [enabled, clientId, login, buttonKey, preferences.language, preferences.theme, t]);

  const retry = useCallback(() => { setError(''); setAttempt(value => value + 1); }, []);
  const waiting = readyKey !== buttonKey;
  return <div className="signin-google">
    <div ref={container} className={`signin-google-button ${waiting || !token || disabled || busy ? 'pointer-events-none opacity-50' : ''}`} inert={waiting || !token || disabled || busy} aria-busy={waiting || busy} />
    {waiting && !error && <p className="signin-status" role="status"><LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" />{t('Loading Google…')}</p>}
    {error && <div className="account-error" role="alert"><p>{error}</p><button type="button" className="account-link" disabled={busy || disabled} onClick={retry}>{t('Try Google again')}</button></div>}
  </div>;
}
