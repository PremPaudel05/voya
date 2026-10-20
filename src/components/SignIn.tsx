import { useCallback, useEffect, useRef, useState } from 'react';
import { Github, LoaderCircle, LockKeyhole, Mail } from 'lucide-react';
import { useAccount } from '../account/AccountContext';
import { usePreferences } from '../preferences/PreferencesContext';
import { accountRequest, loadScript } from '../services/accountService';
import type { Account } from '../services/accountService';
import { PasswordSignIn } from './PasswordSignIn';
import { GoogleSignIn } from './GoogleSignIn';
import { SecurityCheck } from './SecurityCheck';
import type { SecurityCheckStatus } from './SecurityCheck';

type LoginResult = Account & { token: string };
const OAUTH_FLOW = 'voya-provider-login';
type OAuthProvider = 'github' | 'microsoft';
const message = (error: unknown) => error instanceof Error ? error.message : 'Sign-in could not finish. Please try again.';

export function SignIn() {
  const { config, acceptLogin, refreshConfig } = useAccount();
  const { t } = usePreferences();
  const [creating, setCreating] = useState(false);
  const [savingRecovery, setSavingRecovery] = useState(false);
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
  const providers = config?.providers ?? { google: Boolean(config?.ready && config.googleClientId), email: false, github: false, microsoft: false, password: false };

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
        const saved = sessionStorage.getItem(OAUTH_FLOW);
        // Complete GitHub redirects started just before this frontend update, too.
        const legacy = !saved ? sessionStorage.getItem('voya-github-login') : null;
        sessionStorage.removeItem(OAUTH_FLOW);
        sessionStorage.removeItem('voya-github-login');
        if (oauthReturn.error) throw new Error('Sign-in was canceled or could not finish. You can try again or choose another option.');
        if (!saved && !legacy) throw new Error('Start sign-in again from this browser.');
        const flow = JSON.parse(saved || legacy!) as { provider?: OAuthProvider; state: string; verifier: string; started: number };
        const provider = legacy ? 'github' : flow.provider;
        if ((provider !== 'github' && provider !== 'microsoft') || flow.state !== oauthReturn.state || !Number.isFinite(flow.started) || Date.now() - flow.started > 600000 || flow.started > Date.now()) throw new Error('Sign-in expired. Please start again.');
        return accountRequest<LoginResult>(`/auth/${provider}/exchange`, { method: 'POST', body: JSON.stringify({ code: oauthReturn.code, state: flow.state, verifier: flow.verifier }), signal: AbortSignal.timeout(35000) });
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
  const startProvider = async (provider: OAuthProvider) => {
    if (busy || !token) return;
    setBusy(true); setError('');
    try {
      const verifier = Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
      const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier)));
      const challenge = btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const result = await accountRequest<{ url: string; state: string }>(`/auth/${provider}/start`, { method: 'POST', body: JSON.stringify({ challenge, turnstileToken: token }), signal: AbortSignal.timeout(15000) });
      sessionStorage.setItem(OAUTH_FLOW, JSON.stringify({ provider, verifier, state: result.state, started: Date.now() }));
      window.location.assign(result.url);
    } catch (e) { setError(message(e)); setBusy(false); resetSecurity(); }
  };

  if (!config?.ready) return <div className="signin-form"><p role="status" className="account-banner">{t(config ? 'Sign-in is being prepared. You can still explore every country guide.' : 'Loading sign-in options…')}</p>{error && <p className="account-error" role="alert">{t(error)}</p>}<button type="button" className="account-link" onClick={() => void refreshConfig().catch(e => setError(message(e)))}>{t('Try again')}</button></div>;
  return <div className="signin-form">
    <div className="signin-mode" role="group" aria-label={t('Account access')}>
      <button type="button" aria-pressed={!creating} disabled={busy || savingRecovery} onClick={() => { setCreating(false); setError(''); }}>{t('Sign in')}</button>
      <button type="button" aria-pressed={creating} disabled={busy || savingRecovery} onClick={() => { setCreating(true); setError(''); }}>{t('Sign up')}</button>
    </div>
    <p className="signin-account-note">{t(creating ? 'Fill in your details to create your free account.' : 'Welcome back. Choose how you’d like to sign in.')}</p>
    {providers.password && <PasswordSignIn key={creating ? 'signup' : 'login'} creating={creating} token={token} busy={busy} onBusy={setBusy} onTokenUsed={resetSecurity} onRecoveryChange={setSavingRecovery} />}
    {providers.password && <div className="signin-divider"><span>{t('or continue with')}</span></div>}
    {providers.email && (sent ? <form className="signin-email" onSubmit={verifyCode}>
      <p role="status">{t('We sent an 8-digit code to')} <strong>{email.trim()}</strong>. {t('Check your inbox or spam folder. It expires in 10 minutes.')}</p>
      <label htmlFor="signin-code">{t('Sign-in code')}</label>
      <input id="signin-code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" maxLength={8} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} required autoFocus disabled={busy || savingRecovery} />
      <button className="account-button" disabled={busy || savingRecovery || code.length !== 8}>{t(creating ? 'Verify and continue' : 'Verify and sign in')}</button>
      <button type="button" className="account-link" disabled={busy || savingRecovery} onClick={() => { setSent(false); setChallenge(''); setCode(''); setError(''); }}>{t('Change email or request a new code')}</button>
    </form> : <form className="signin-email" onSubmit={sendCode}>
      <label htmlFor="signin-email">{t('Email address')}</label>
      <input id="signin-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} required disabled={busy || savingRecovery} />
      <button className="account-button" disabled={busy || savingRecovery || !token || !email.trim()}><Mail size={16} aria-hidden="true" />{t('Continue with email')}</button>
      <p className="signin-email-hint">{t('We’ll email you a sign-in code. No password to remember.')}</p>
    </form>)}
    {providers.email && (providers.google || providers.github || providers.microsoft) && <div className="signin-divider"><span>{t('or')}</span></div>}
    <div className="signin-providers">
      {providers.google && <GoogleSignIn token={token} disabled={busy || savingRecovery} onBusy={setBusy} onTokenUsed={resetSecurity} />}
      <button type="button" className="account-button secondary" disabled={!providers.microsoft || busy || savingRecovery || !token} aria-describedby={!providers.microsoft ? 'microsoft-availability' : undefined} onClick={() => void startProvider('microsoft')}>
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><path fill="#f25022" d="M0 0h9v9H0z" /><path fill="#7fba00" d="M11 0h9v9h-9z" /><path fill="#00a4ef" d="M0 11h9v9H0z" /><path fill="#ffb900" d="M11 11h9v9h-9z" /></svg>
        {t('Continue with Microsoft')}
      </button>
      {!providers.microsoft && <p id="microsoft-availability" className="signin-provider-note">{t('Microsoft sign-in isn’t available yet. Please choose another option.')}</p>}
      {providers.github && <button type="button" className="account-button secondary" disabled={busy || savingRecovery || !token} onClick={() => void startProvider('github')}><Github size={18} aria-hidden="true" />{t('Continue with GitHub')}</button>}
    </div>
    <SecurityCheck key={attempt} siteKey={config.turnstileSiteKey} action="login" appearance="interaction-only" onToken={setToken} onStatusChange={setSecurityStatus} />
    <div className="signin-status" role="status">
      {busy ? <><LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />{t('Finishing sign-in…')}</> : !token && securityStatus !== 'error' ? <>
        {securityStatus !== 'interactive' && <LoaderCircle size={14} className="animate-spin motion-reduce:animate-none" aria-hidden="true" />}
        {t(securityStatus === 'interactive' ? 'Complete the security check before signing in.' : 'Preparing secure sign-in…')}
      </> : null}
    </div>
    {error && <p role="alert" className="account-error">{t(error)}</p>}
    {!creating && (providers.email || providers.github || providers.microsoft) && <p className="signin-existing-note">{t('Use your original sign-in method to find your saved countries and settings.')}</p>}
    <p className="signin-switch-note">{t(creating ? 'Already have an account?' : 'New to Voya?')} <button type="button" className="account-link" disabled={busy || savingRecovery} onClick={() => setCreating(value => !value)}>{t(creating ? 'Sign in' : 'Create an account')}</button></p>
    <div className="signin-privacy"><LockKeyhole size={15} aria-hidden="true" /><p>{t('Passwords are securely hashed. Exploring Voya is free, with or without an account.')}</p></div>
  </div>;
}
