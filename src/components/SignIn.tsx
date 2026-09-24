import { useCallback, useEffect, useRef, useState } from 'react';
import { Github, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { useAccount } from '../account/AccountContext';
import { usePreferences } from '../preferences/PreferencesContext';
import { accountRequest, loadScript } from '../services/accountService';
import type { Account } from '../services/accountService';
import { GoogleSignIn } from './GoogleSignIn';
import { SecurityCheck } from './SecurityCheck';
import type { SecurityCheckStatus } from './SecurityCheck';

type LoginResult = Account & { token: string };
const GITHUB_FLOW = 'voya-github-login';
const message = (error: unknown) => error instanceof Error ? error.message : 'Sign-in could not finish. Please try again.';

export function SignIn() {
  const { config, acceptLogin, refreshConfig } = useAccount();
  const { t } = usePreferences();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [challenge, setChallenge] = useState('');
  const [token, setToken] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [securityStatus, setSecurityStatus] = useState<SecurityCheckStatus>('checking');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const exchange = useRef<Promise<LoginResult> | null>(null);
  const [oauthReturn] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return { code: params.get('code'), state: params.get('state'), error: params.get('error') };
  });
  const resetSecurity = useCallback(() => { setToken(''); setSecurityStatus('checking'); setAttempt(value => value + 1); }, []);
  const providers = config?.providers ?? { google: Boolean(config?.ready && config.googleClientId), email: false, github: false };

  // Begin independent downloads before /config finishes; only on the sign-in page.
  useEffect(() => {
    void loadScript('https://accounts.google.com/gsi/client').catch(() => {});
    void loadScript('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit').catch(() => {});
  }, []);

  useEffect(() => {
    if (!oauthReturn.code && !oauthReturn.error) return;
    let active = true;
    if (!exchange.current) {
      exchange.current = (async () => {
        const url = new URL(window.location.href);
        for (const key of ['code', 'state', 'error', 'error_description', 'error_uri']) url.searchParams.delete(key);
        window.history.replaceState(window.history.state, '', url.pathname + url.search + url.hash);
        const saved = sessionStorage.getItem(GITHUB_FLOW);
        sessionStorage.removeItem(GITHUB_FLOW);
        if (oauthReturn.error) throw new Error('GitHub sign-in was canceled. You can try again or choose another option.');
        if (!saved) throw new Error('Start GitHub sign-in again from this browser.');
        const flow = JSON.parse(saved) as { state: string; verifier: string; started: number };
        if (flow.state !== oauthReturn.state || Date.now() - flow.started > 600000) throw new Error('GitHub sign-in expired. Please start again.');
        return accountRequest<LoginResult>('/auth/github/exchange', { method: 'POST', body: JSON.stringify({ code: oauthReturn.code, state: flow.state, verifier: flow.verifier }), signal: AbortSignal.timeout(35000) });
      })();
    }
    setBusy(true);
    void exchange.current.then(result => { if (active) acceptLogin(result); }).catch(e => { if (active) setError(message(e)); }).finally(() => { if (active) setBusy(false); });
    return () => { active = false; };
  }, [oauthReturn, acceptLogin]);

  const sendCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !token) return;
    setBusy(true); setError('');
    try {
      const result = await accountRequest<{ challengeId: string }>('/auth/email/start', { method: 'POST', body: JSON.stringify({ email: email.trim(), turnstileToken: token }), signal: AbortSignal.timeout(20000) });
      setChallenge(result.challengeId); setCode(''); setSent(true);
    } catch (e) { setError(message(e)); }
    finally { setBusy(false); resetSecurity(); }
  };
  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !/^\d{8}$/.test(code)) return;
    setBusy(true); setError('');
    try { acceptLogin(await accountRequest<LoginResult>('/auth/email/verify', { method: 'POST', body: JSON.stringify({ challengeId: challenge, code }), signal: AbortSignal.timeout(15000) })); }
    catch (e) { setError(message(e)); }
    finally { setBusy(false); }
  };
  const github = async () => {
    if (busy || !token) return;
    setBusy(true); setError('');
    try {
      const verifier = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
      const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
      const challenge = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const result = await accountRequest<{ url: string; state: string }>('/auth/github/start', { method: 'POST', body: JSON.stringify({ challenge, turnstileToken: token }), signal: AbortSignal.timeout(15000) });
      sessionStorage.setItem(GITHUB_FLOW, JSON.stringify({ verifier, state: result.state, started: Date.now() }));
      window.location.assign(result.url);
    } catch (e) { setError(message(e)); setBusy(false); resetSecurity(); }
  };

  if (!config?.ready) return <div className="signin-form"><p role="status" className="account-banner">{t(config ? 'Sign-in is being prepared. You can still explore every country guide.' : 'Loading sign-in options…')}</p>{error && <p className="account-error" role="alert">{t(error)}</p>}<button type="button" className="account-link" onClick={() => void refreshConfig().catch(e => setError(message(e)))}>{t('Try again')}</button></div>;
  return <div className="signin-form">
    <p className="signin-account-note">{t('Sign in or create a free account.')}</p>
    {providers.email && (sent ? <form className="signin-email" onSubmit={verifyCode}>
      <p role="status">{t('We sent an 8-digit code to')} <strong>{email.trim()}</strong>. {t('Check your inbox or spam folder. It expires in 10 minutes.')}</p>
      <label htmlFor="signin-code">{t('Sign-in code')}</label>
      <input id="signin-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength={8} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} required autoFocus disabled={busy} />
      <button className="account-button" disabled={busy || code.length !== 8}>{t('Verify and sign in')}</button>
      <button type="button" className="account-link" disabled={busy} onClick={() => { setSent(false); setChallenge(''); setCode(''); setError(''); }}>{t('Change email or request a new code')}</button>
    </form> : <form className="signin-email" onSubmit={sendCode}>
      <label htmlFor="signin-email">{t('Email address')}</label>
      <input id="signin-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} required disabled={busy} />
      <button className="account-button" disabled={busy || !token || !email.trim()}><Mail size={16} aria-hidden="true" />{t('Continue with email')}</button>
      <p className="signin-email-hint">{t('We’ll email you a sign-in code. No password to remember.')}</p>
    </form>)}
    {providers.email && (providers.google || providers.github) && <div className="signin-divider"><span>{t('or')}</span></div>}
    <div className="signin-providers">
      {providers.google && <GoogleSignIn token={token} disabled={busy} onBusy={setBusy} onTokenUsed={resetSecurity} />}
      {providers.github && <button type="button" className="account-button secondary" disabled={busy || !token} onClick={() => void github()}><Github size={18} aria-hidden="true" />{t('Continue with GitHub')}</button>}
    </div>
    <SecurityCheck key={attempt} siteKey={config.turnstileSiteKey} action="login" appearance="interaction-only" onToken={setToken} onStatusChange={setSecurityStatus} />
    <div className="signin-status" role="status">
      {busy ? <><LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />{t('Finishing sign-in…')}</> : !token && securityStatus !== 'error' ? <>
        {securityStatus !== 'interactive' && <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
        {t(securityStatus === 'interactive' ? 'Complete the security check before signing in.' : 'Preparing secure sign-in…')}
      </> : null}
    </div>
    {error && <p role="alert" className="account-error">{t(error)}</p>}
    {(providers.email || providers.github) && <p className="signin-existing-note">{t('Already have an account? Use your original sign-in method to find your saved countries and settings.')}</p>}
    <div className="signin-privacy"><LockKeyhole size={15} aria-hidden="true" /><p>{t('Your password stays with your provider. Exploring Voya is free, with or without an account.')}</p></div>
  </div>;
}
