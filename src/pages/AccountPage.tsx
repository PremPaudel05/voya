import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bookmark, Compass, Globe2, LogOut, MapPin, Settings2, Shield, Sparkles } from 'lucide-react';
import { useAccount } from '../account/AccountContext';
import { usePreferences } from '../preferences/PreferencesContext';
import { accountRequest, DEFAULT_PREFERENCES, loadScript } from '../services/accountService';
import type { Account, Preferences, TravelPlan } from '../services/accountService';
import { SecurityCheck } from '../components/SecurityCheck';
import { AccountDialog, AccountSettings } from '../components/AccountSettings';

type HistoryEntry = { countryName: string; searchedAt: number };
type SavedPlan = { id: string; countryName: string; createdAt: number; input: Preferences };
type Tab = 'overview' | 'history' | 'plans' | 'settings';

function GoogleSignIn() {
  const { config, login } = useAccount();
  const { t, preferences } = usePreferences();
  const container = useRef<HTMLDivElement>(null);
  const tokenRef = useRef('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => {
    if (!config?.ready) return;
    let active = true;
    Promise.all([loadScript('https://accounts.google.com/gsi/client'), accountRequest<{ nonce: string }>('/auth/challenge', { method: 'POST' })]).then(([, challenge]) => {
      if (!active || !container.current || !window.google) return;
      window.google.accounts.id.initialize({ client_id: config.googleClientId, nonce: challenge.nonce, auto_select: false, callback: response => {
        if (!tokenRef.current) { setError(t('Complete the security check before signing in.')); return; }
        setBusy(true); setError('');
        void login(response.credential, tokenRef.current).catch(e => { if (active) { setError(e.message); setToken(''); setAttempt(a => a + 1); } }).finally(() => { if (active) setBusy(false); });
      } });
      window.google.accounts.id.renderButton(container.current, { theme: 'outline', size: 'large', text: 'continue_with', width: Math.max(200, Math.min(280, container.current.clientWidth)), locale: preferences.language });
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [config, login, attempt, preferences.language, t]);
  if (!config?.ready) return <p role="status" className="account-banner">{t('Sign-in is being prepared. You can still explore every country guide.')}</p>;
  return <div className="space-y-5">
    <SecurityCheck key={attempt} siteKey={config.turnstileSiteKey} action="login" onToken={setToken} />
    <div ref={container} className={!token || busy ? 'pointer-events-none opacity-50' : ''} inert={!token || busy} />
    {busy && <p role="status">{t('Signing you in…')}</p>}
    {error && <p role="alert" className="account-error">{error}</p>}
    <p className="settings-help">{t('Google shares your name and email with Voya, never your password.')}</p>
  </div>;
}

function SignedInAccount({ account, onDeleted }: { account: Account; onDeleted: () => void }) {
  const { error: accountError, refresh, logout } = useAccount();
  const { t, preferences } = usePreferences();
  const [params, setParams] = useSearchParams();
  const requestedTab = params.get('tab');
  const tab: Tab = requestedTab === 'history' || requestedTab === 'plans' || requestedTab === 'settings' ? requestedTab : 'overview';
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [fetching, setFetching] = useState(true);
  const [selected, setSelected] = useState<TravelPlan | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  useEffect(() => {
    let active = true;
    Promise.all([accountRequest<{ history: HistoryEntry[] }>('/history'), accountRequest<{ plans: SavedPlan[] }>('/plans')])
      .then(([h, p]) => { if (active) { setHistory(h.history); setPlans(p.plans); } })
      .catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setFetching(false); });
    return () => { active = false; };
  }, [account.user.email]);
  const date = (value: number) => new Date(value).toLocaleDateString(preferences.language, { month: 'short', day: 'numeric' });
  const selectTab = (next: Tab) => { const updated = new URLSearchParams(params); updated.set('tab',next); setParams(updated); setSelected(null); setMessage(''); setError(''); };
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(''); setMessage(''); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : t('Could not save changes. Please try again.')); } finally { setBusy(false); } };
  return <>
    <div className="account-welcome"><div><p className="account-eyebrow">{t('Your discovery space')}</p><h1>{t('Welcome, {name}.', { name: account.user.name.split(' ')[0] })}</h1><p>{t('Your countries, your preferences.')}</p></div><button disabled={busy} onClick={() => void run(logout)} className="account-link"><LogOut size={16} />{t('Sign out')}</button></div>
    <nav aria-label={t('My account')} className="account-tabs">{([['overview','Overview',Compass],['history','Search history',MapPin],['plans','Saved plans',Bookmark],['settings','Settings',Settings2]] as const).map(([id,label,Icon]) => <button key={id} onClick={() => selectTab(id)} aria-current={tab === id ? 'page' : undefined}><Icon size={17} /><span>{t(label)}</span></button>)}</nav>
    {(error || accountError) && !clearConfirm && <p role="alert" className="account-error">{error || accountError}</p>}
    {message && <p role="status" className="account-success">{message}</p>}
    {tab === 'overview' && <div className="account-overview">
      <section className="discovery-card"><div><Compass size={26} /><h2>{t('Continue exploring')}</h2><p>{t('Country guides are free to explore, whenever curiosity strikes.')}</p><Link to="/" className="account-button">{t('Explore a country')}<ArrowRight size={16} /></Link></div><div className="discovery-orbit" aria-hidden="true"><Globe2 /></div></section>
      <div className="account-two-columns"><section className="settings-card"><div className="settings-heading"><MapPin size={21} /><h2>{t('Your recent discoveries')}</h2></div>{fetching ? <p role="status">{t('Loading your account…')}</p> : history.length ? <div className="recent-list">{history.slice(0,4).map(item => <Link key={item.countryName} to={`/country/${encodeURIComponent(item.countryName)}`}><span>{item.countryName}</span><span>{date(item.searchedAt)}<ArrowRight size={15} /></span></Link>)}</div> : <p className="settings-help">{t('No searches yet. Pick a country to get started.')}</p>}</section>
        <section className="settings-card"><div className="settings-heading"><Settings2 size={21} /><h2>{t('Make Voya yours')}</h2></div><p className="settings-help">{t('Choose your appearance, language, and notifications.')}</p><button className="account-button secondary" onClick={() => selectTab('settings')}>{t('Open settings')}<ArrowRight size={16} /></button></section></div>
      <section className="optional-planning"><div><Sparkles size={20} /><div><h2>{t('Optional trip planning')}</h2><p>{t('{remaining} of {limit} attempts left today', { remaining: account.usage.remaining, limit: account.usage.limit })}</p></div></div><details><summary>{t('How the allowance works')}</summary><p>{t('Create plans of up to 7 days. Wait a minute between attempts. Unfinished attempts also count, and deleting a plan or account does not reset the daily allowance.')}</p><p>{t('Resets {date}', { date: new Date(account.usage.resetsAt).toLocaleString(preferences.language) })}</p><button className="account-link" disabled={busy} onClick={() => void run(refresh)}>{t('Refresh')}</button></details></section>
    </div>}
    {tab === 'history' && <section className="account-section"><div className="section-title"><h2>{t('Search history')}</h2>{history.length > 0 && <button className="account-link" onClick={() => setClearConfirm(true)}>{t('Clear history')}</button>}</div>{!account.settings.saveHistory && <p className="account-banner">{t('Search history is off. New searches will not be saved.')}</p>}{fetching ? <p role="status">{t('Loading your account…')}</p> : history.length ? <div className="country-history">{history.map(item => <Link className="settings-card" key={item.countryName} to={`/country/${encodeURIComponent(item.countryName)}`}><MapPin size={20} /><div><strong>{item.countryName}</strong><span>{date(item.searchedAt)}</span></div><ArrowRight size={17} /></Link>)}</div> : <div className="account-empty"><Compass size={30} /><p>{t('No searches yet. Pick a country to get started.')}</p><Link className="account-button" to="/">{t('Explore a country')}</Link></div>}</section>}
    {tab === 'plans' && <section className="account-section"><h2>{t('Saved plans')}</h2>{selected ? <div className="saved-plan"><button className="account-link" onClick={() => setSelected(null)}><ArrowLeft size={16} />{t('All saved plans')}</button><p>{selected.intro}</p>{selected.days.map(day => <article key={day.day} className="settings-card"><h3>{day.day}. {day.title}</h3>{[['Morning',day.morning],['Afternoon',day.afternoon],['Evening',day.evening],['Tip',day.tip]].map(([label,text]) => <p key={label}><strong>{t(label)}: </strong>{text}</p>)}<p>{day.estimatedCost}</p></article>)}<p>{t('Packing essentials')}: {selected.packingEssentials.join(', ')}</p><p>{selected.budgetSummary}</p><p>{selected.bestAdvice}</p></div> : fetching ? <p role="status">{t('Loading your account…')}</p> : plans.length ? <div className="country-history">{plans.map(plan => <article key={plan.id} className="settings-card"><h3>{plan.countryName}</h3><p className="settings-help">{plan.input.days} {t('days')} · {date(plan.createdAt)}</p><div className="plan-actions"><button disabled={busy} className="account-link" onClick={() => void run(async () => setSelected((await accountRequest<{ plan: TravelPlan }>(`/plans/${plan.id}`)).plan))}>{t('View itinerary')}<ArrowRight size={15} /></button><button disabled={busy} className="account-link" onClick={() => void run(async () => { await accountRequest(`/plans/${plan.id}`, { method: 'DELETE' }); setPlans(previous => previous.filter(item => item.id !== plan.id)); })}>{t('Remove')}</button></div></article>)}</div> : <div className="account-empty"><Bookmark size={30} /><h3>{t('No saved plans yet.')}</h3><p>{t('Plans you create are saved here for 30 days.')}</p></div>}</section>}
    {tab === 'settings' && <AccountSettings initial={{ ...DEFAULT_PREFERENCES, ...account.settings }} onDeleted={onDeleted} onClearHistory={() => setClearConfirm(true)} />}
    <AccountDialog open={clearConfirm} title={t('Clear your saved searches?')} busy={busy} onClose={() => { if (!busy) setClearConfirm(false); }}><p>{t('This removes your saved country searches. You can keep exploring.')}</p>{error && <p role="alert" className="account-error">{error}</p>}<div className="dialog-actions"><button className="account-button secondary" autoFocus disabled={busy} onClick={() => setClearConfirm(false)}>{t('Cancel')}</button><button className="account-button" disabled={busy} onClick={() => void run(async () => { await accountRequest('/history', { method: 'DELETE' }); setHistory([]); setClearConfirm(false); setMessage(t('Search history cleared.')); })}>{t('Clear searches')}</button></div></AccountDialog>
  </>;
}

export default function AccountPage() {
  const { account, loading, error } = useAccount();
  const { t } = usePreferences();
  const [params] = useSearchParams();
  const [deleted, setDeleted] = useState(false);
  const returnTo = params.get('returnTo');
  const safeReturn = returnTo?.startsWith('/country/') && !returnTo.includes('\\') ? returnTo : '/';
  return <div className="account-page">
    <header className="account-header"><div><Link to={safeReturn}><ArrowLeft size={16} />{t('Back to exploring')}</Link><Link to="/" className="account-brand">Voya<span>World</span></Link></div></header>
    <main className="account-main">{loading ? <p role="status">{t('Loading your account…')}</p> : account ? <SignedInAccount key={account.user.email} account={account} onDeleted={() => setDeleted(true)} /> : <>
      {deleted && <p role="status" className="account-success">{t('Your Voya account has been deleted.')}</p>}
      <div className="account-signin"><div><p className="account-eyebrow">{t('Your discovery space')}</p><h1>{t('A home for your discoveries.')}</h1><p>{t('Sign in with Google to revisit countries and make Voya feel like yours. Exploring is always free and sign-in is optional.')}</p><ul>{[[MapPin,'Revisit your recent country searches'],[Settings2,'Personalise appearance and language'],[Shield,'Manage your privacy and notifications']].map(([Icon,label]) => { const I = Icon as typeof MapPin; return <li key={String(label)}><I size={18} />{t(String(label))}</li>; })}</ul></div><section className="settings-card"><h2>{t('Welcome to Voya')}</h2><p>{t('Your first Google sign-in creates a free account.')}</p><GoogleSignIn />{error && <p role="alert" className="account-error">{error}</p>}</section></div>
    </>}</main>
  </div>;
}
