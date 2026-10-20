import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useAccount } from '../account/AccountContext';
import { accountRequest } from '../services/accountService';
import type { Account } from '../services/accountService';

type Result = Account & { token: string; recoveryCode?: string };
export function PasswordSignIn({ creating, token, busy, onBusy, onTokenUsed, onRecoveryChange }: { creating: boolean; token: string; busy: boolean; onBusy: (value: boolean) => void; onTokenUsed: () => void; onRecoveryChange: (value: boolean) => void }) {
  const { acceptLogin } = useAccount();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [visible, setVisible] = useState(false);
  const [recover, setRecover] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [pending, setPending] = useState<Result | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const newPassword = creating || recover;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy || !token) return;
    if (newPassword && password !== confirm) { setError('Your passwords don’t match. Please check both fields.'); return; }
    onBusy(true); setError('');
    try {
      const result = await accountRequest<Result>(`/auth/password/${creating ? 'signup' : recover ? 'recover' : 'login'}`, { method: 'POST', body: JSON.stringify({ name: name.trim(), email: email.trim(), password, recoveryCode, turnstileToken: token }), signal: AbortSignal.timeout(30000) });
      setPassword(''); setConfirm(''); setRecoveryCode('');
      if (result.recoveryCode) { setPending(result); setSaved(false); onRecoveryChange(true); }
      else acceptLogin(result);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not finish. Please try again.'); }
    finally { onBusy(false); onTokenUsed(); }
  };
  if (pending) return <section className="signin-email recovery-panel" aria-labelledby="recovery-title">
    <h3 id="recovery-title">Save your recovery code</h3>
    <p>Your account is ready. Keep this code in your password manager or somewhere private. You’ll need it if you forget your password; email resets aren’t available yet.</p>
    <code className="recovery-code">{pending.recoveryCode}</code>
    <button type="button" className="account-button secondary" onClick={() => { void navigator.clipboard.writeText(pending.recoveryCode!).then(() => setCopied(true)).catch(() => setError('Select and copy the code above.')); }}>{copied ? 'Copied' : 'Copy recovery code'}</button>
    <label className="recovery-saved"><input type="checkbox" checked={saved} onChange={e => setSaved(e.target.checked)} />I’ve saved my recovery code</label>
    <button className="account-button auth-black" disabled={!saved} onClick={() => { const { recoveryCode: _code, ...login } = pending; void _code; setPending(null); onRecoveryChange(false); acceptLogin(login); }}>Continue to my account</button>
    {error && <p role="alert" className="account-error">{error}</p>}
  </section>;
  return <form className="signin-email" onSubmit={submit}>
    {creating && <><label htmlFor="register-name">Your name</label><input id="register-name" name="name" autoComplete="name" maxLength={100} value={name} onChange={e => setName(e.target.value)} required disabled={busy} /></>}
    <label htmlFor="password-email">Email address</label><input id="password-email" name="email" type="email" autoComplete="username" maxLength={254} value={email} onChange={e => setEmail(e.target.value)} required disabled={busy} />
    {recover && !creating && <><label htmlFor="recovery-code">Recovery code</label><input id="recovery-code" name="recoveryCode" autoComplete="off" spellCheck={false} maxLength={100} value={recoveryCode} onChange={e => setRecoveryCode(e.target.value)} required disabled={busy} /></>}
    <label htmlFor="account-password">{recover ? 'New password' : 'Password'}</label>
    <div className="password-input"><input id="account-password" name="password" type={visible ? 'text' : 'password'} autoComplete={newPassword ? 'new-password' : 'current-password'} minLength={newPassword ? 15 : 1} maxLength={128} aria-describedby={newPassword ? 'password-hint' : undefined} value={password} onChange={e => setPassword(e.target.value)} required disabled={busy} /><button type="button" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(v => !v)}>{visible ? <EyeOff size={18} /> : <Eye size={18} />}</button></div>
    {newPassword && <><p id="password-hint" className="signin-email-hint">Use at least 15 characters. A few unrelated words make a strong password.</p><label htmlFor="confirm-password">Confirm password</label><input id="confirm-password" name="confirmPassword" type={visible ? 'text' : 'password'} autoComplete="new-password" minLength={15} maxLength={128} value={confirm} onChange={e => setConfirm(e.target.value)} required disabled={busy} /></>}
    <button className="account-button auth-black" disabled={busy || !token}>{busy ? 'Please wait…' : creating ? 'Create my account' : recover ? 'Reset password' : 'Sign in'}</button>
    {!creating && <button type="button" className="account-link" disabled={busy} onClick={() => { setRecover(v => !v); setError(''); }}>{recover ? 'Back to password sign-in' : 'Forgot password? Use your recovery code'}</button>}
    {creating && <p className="signin-email-hint">You’ll receive a private recovery code after signing up. No Google or Microsoft account needed.</p>}
    {error && <p role="alert" className="account-error">{error}</p>}
  </form>;
}
