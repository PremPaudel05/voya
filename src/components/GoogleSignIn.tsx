import { useCallback, useEffect, useRef, useState } from 'react';
import { LoaderCircle, LockKeyhole } from 'lucide-react';
import { useAccount } from '../account/AccountContext';
import { usePreferences } from '../preferences/PreferencesContext';
import { accountRequest, loadScript } from '../services/accountService';
import { SecurityCheck } from './SecurityCheck';
import type { SecurityCheckStatus } from './SecurityCheck';

export function GoogleSignIn() {
  const { config, login } = useAccount();
  const { t, preferences } = usePreferences();
  const container = useRef<HTMLDivElement>(null);
  const tokenRef = useRef('');
  const [token, setToken] = useState('');
  const [securityStatus, setSecurityStatus] = useState<SecurityCheckStatus>('checking');
  const [buttonReady, setButtonReady] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const updateToken = useCallback((value: string) => {
    tokenRef.current = value;
    setToken(value);
  }, []);

  useEffect(() => {
    if (!config?.ready) return;
    let active = true;
    let observer: ResizeObserver | undefined;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
    let renderButton = () => {};
    setButtonReady(false);

    Promise.all([
      loadScript('https://accounts.google.com/gsi/client'),
      accountRequest<{ nonce: string }>('/auth/challenge', { method: 'POST' }),
    ]).then(([, challenge]) => {
      if (!active || !container.current) return;
      if (!window.google) throw new Error(t('Google sign-in could not load. Please try again.'));
      const google = window.google;
      google.accounts.id.initialize({
        client_id: config.googleClientId, nonce: challenge.nonce, auto_select: false,
        callback: response => {
          if (!active) return;
          if (!tokenRef.current) { setError(t('Complete the security check before signing in.')); return; }
          setBusy(true);
          setError('');
          void login(response.credential, tokenRef.current).catch(e => {
            if (!active) return;
            setError(e.message);
            setBusy(false);
            updateToken('');
            setAttempt(value => value + 1);
          }).finally(() => { if (active) setBusy(false); });
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
        setButtonReady(true);
      };
      renderButton();
      observer = new ResizeObserver(() => renderButton());
      observer.observe(container.current);
      systemTheme.addEventListener('change', renderButton);
    }).catch(e => { if (active) setError(e.message); });

    return () => {
      active = false;
      observer?.disconnect();
      systemTheme.removeEventListener('change', renderButton);
    };
  }, [config, login, attempt, preferences.language, preferences.theme, t, updateToken]);

  if (!config?.ready) return <p role="status" className="account-banner">{t('Sign-in is being prepared. You can still explore every country guide.')}</p>;
  const waiting = !token || !buttonReady;
  const retry = () => { setError(''); updateToken(''); setAttempt(value => value + 1); };

  return <div className="signin-form">
    <p className="signin-account-note">{t('Your first Google sign-in creates a free account.')}</p>
    <SecurityCheck key={attempt} siteKey={config.turnstileSiteKey} action="login" appearance="interaction-only" onToken={updateToken} onStatusChange={setSecurityStatus} />
    <div ref={container} className={`signin-google-button ${waiting || busy ? 'pointer-events-none opacity-50' : ''}`} inert={waiting || busy} aria-busy={waiting || busy} />
    <div className="signin-status" role="status">
      {busy ? <><LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />{t('Signing you in…')}</> : !error && securityStatus !== 'error' && waiting ? <>
        {securityStatus !== 'interactive' && <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
        {t(securityStatus === 'interactive' ? 'Complete the security check before signing in.' : 'Preparing sign-in…')}
      </> : null}
    </div>
    {error && <div className="account-error" role="alert"><p>{error}</p><button type="button" className="account-link" disabled={busy} onClick={retry}>{t('Try again')}</button></div>}
    <div className="signin-privacy"><LockKeyhole size={15} aria-hidden="true" /><p>{t('Google shares your name and email with Voya, never your password.')}</p></div>
  </div>;
}
