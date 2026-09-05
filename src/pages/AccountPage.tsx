import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Bookmark, Clock3, LogOut, MapPin, Settings2, Sparkles } from 'lucide-react';
import { useAccount } from '../account/AccountContext';
import { accountRequest, DEFAULT_PREFERENCES, loadScript } from '../services/accountService';
import type { Preferences, TravelPlan } from '../services/accountService';
import { SecurityCheck } from '../components/SecurityCheck';
type HistoryEntry = { countryName: string; searchedAt: number };
type SavedPlan = { id: string; countryName: string; createdAt: number; input: Preferences };
const field = 'w-full rounded-xl border border-[#e8dfd2] bg-white px-3 py-2.5 text-sm';
const button = 'rounded-full bg-[#1a1208] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-40';

function GoogleSignIn() {
  const { config, login } = useAccount();
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
        if (!tokenRef.current) { setError('Complete the security check before signing in.'); return; }
        setBusy(true); setError('');
        void login(response.credential, tokenRef.current).catch(e => { setError(e.message); setToken(''); setAttempt(a => a + 1); }).finally(() => setBusy(false));
      } });
      window.google.accounts.id.renderButton(container.current, { theme: 'outline', size: 'large', text: 'continue_with', width: 280 });
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [config, login, attempt]);
  if (!config?.ready) return <p role="status" className="rounded-xl bg-[#f5f0e8] p-4 text-sm">Sign-in is being prepared. You can still explore every country guide.</p>;
  return <div className="space-y-5">
    <SecurityCheck key={attempt} siteKey={config.turnstileSiteKey} action="login" onToken={setToken} />
    <div ref={container} className={!token || busy ? 'pointer-events-none opacity-50' : ''} inert={!token || busy} />
    {busy && <p role="status" className="text-sm">Signing you in…</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <p className="text-xs text-[#9c8470]">Your Google name and email identify your Voya account. No password is shared with Voya.</p>
  </div>;
}

export default function AccountPage() {
  const { account, loading, error: accountError, refresh, logout } = useAccount();
  const [params] = useSearchParams();
  const [tab, setTab] = useState('overview');
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [plans, setPlans] = useState<SavedPlan[]>([]);
  const [selected, setSelected] = useState<TravelPlan | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const returnTo = params.get('returnTo');
  const safeReturn = returnTo?.startsWith('/country/') && !returnTo.includes('\\') ? returnTo : '/';
  useEffect(() => { if (account) setPreferences(account.settings); }, [account]);
  useEffect(() => {
    if (!account) return;
    let active = true;
    setError('');
    Promise.all([accountRequest<{ history: HistoryEntry[] }>('/history'), accountRequest<{ plans: SavedPlan[] }>('/plans')]).then(([h, p]) => { if (active) { setHistory(h.history); setPlans(p.plans); } }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [account]);
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(''); setMessage(''); try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'Could not save changes.'); } finally { setBusy(false); } };
  return <div className="min-h-screen bg-[#F7F3EE] text-[#1a1208]">
    <header className="border-b border-[#e8dfd2] px-5 py-4"><div className="mx-auto flex max-w-5xl items-center justify-between"><Link to={safeReturn} className="flex items-center gap-2 text-sm text-[#6b5740]"><ArrowLeft size={16} />Back to exploring</Link><Link to="/" className="text-xl font-black">Voya <span className="text-[#b07a3a]">Travel</span></Link></div></header>
    <main className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      {loading ? <p role="status">Loading your account…</p> : !account ? <div className="grid gap-10 md:grid-cols-2 md:items-center">
        <div><span className="text-xs font-bold uppercase tracking-[0.2em] text-[#b07a3a]">Your next chapter</span><h1 className="mt-4 text-4xl font-black leading-tight">A home for your<br />travel ideas.</h1><p className="mt-5 max-w-sm text-[#6b5740] leading-relaxed">Sign in or create your free account with Google. Keep your discoveries together and pick up where you left off.</p><div className="mt-8 space-y-4 text-sm">{[[MapPin, 'Revisit your recent country searches'], [Bookmark, 'Keep your personalised trip plans'], [Settings2, 'Save your travel preferences'], [Sparkles, 'Track your 3 daily plan attempts']].map(([Icon, text]) => { const I = Icon as typeof MapPin; return <p key={String(text)} className="flex items-center gap-3"><I size={18} className="text-[#b07a3a]" />{String(text)}</p>; })}</div></div>
        <section className="rounded-3xl border border-[#e8dfd2] bg-white p-7 sm:p-9 shadow-sm"><h2 className="text-2xl font-black">Welcome to Voya</h2><p className="mt-2 mb-7 text-sm text-[#9c8470]">New here? Your first sign-in creates your account.</p><GoogleSignIn />{accountError && <p role="alert" className="mt-4 text-sm text-red-700">{accountError}</p>}<p className="mt-6 text-xs text-[#9c8470] leading-relaxed">Search history is saved for up to 90 days and plans for 30 days. You can turn history off or clear it in Settings.</p></section>
      </div> : <>
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase font-bold tracking-[0.2em] text-[#b07a3a]">Your travel space</p><h1 className="mt-3 text-3xl sm:text-4xl font-black">Welcome, {account.user.name.split(' ')[0]}.</h1><p className="mt-2 text-sm text-[#9c8470]">{account.user.email}</p></div><button disabled={busy} onClick={() => void run(logout)} className="flex items-center gap-2 text-sm text-[#6b5740]"><LogOut size={15} />Sign out</button></div>
        <nav aria-label="Account sections" className="mt-8 flex gap-1 overflow-x-auto border-b border-[#e8dfd2]">{[['overview','Usage'],['history','Search history'],['plans','Saved plans'],['settings','Settings']].map(([id,label]) => <button key={id} onClick={() => { setTab(id); setSelected(null); setMessage(''); setError(''); }} aria-current={tab === id ? 'page' : undefined} className={`whitespace-nowrap px-4 py-3 text-sm font-semibold border-b-2 ${tab === id ? 'border-[#b07a3a] text-[#1a1208]' : 'border-transparent text-[#9c8470]'}`}>{label}</button>)}</nav>
        {(error || accountError) && <p role="alert" className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error || accountError}</p>}
        {message && <p role="status" className="mt-5 text-sm text-green-800">{message}</p>}
        {tab === 'overview' && <div className="mt-7 grid gap-5 md:grid-cols-2"><section className="rounded-3xl bg-[#1a1208] p-7 text-[#F7F3EE]"><Sparkles className="text-[#b07a3a]" /><h2 className="mt-5 text-lg font-bold">Your daily planning allowance</h2><p className="mt-4 text-5xl font-black">{account.usage.remaining}<span className="ml-2 text-base font-normal text-[#c8b89a]">of {account.usage.limit} remaining</span></p><div className="mt-5 h-2 rounded-full bg-white/15"><div className="h-full rounded-full bg-[#b07a3a]" style={{ width: `${account.usage.remaining / account.usage.limit * 100}%` }} /></div><p className="mt-4 text-xs text-[#c8b89a]">Resets {new Date(account.usage.resetsAt).toLocaleString()} (midnight UTC).</p><button onClick={() => void refresh()} className="mt-5 text-xs underline">Refresh usage</button></section><section className="rounded-3xl border border-[#e8dfd2] bg-white p-7"><Clock3 size={22} className="text-[#b07a3a]" /><h2 className="mt-5 text-lg font-bold">Make every plan count</h2><ul className="mt-4 space-y-3 text-sm text-[#6b5740]"><li>New plans include 1–7 days. Wait 60 seconds between attempts.</li><li>Matching saved results from the last 7 days are reused without another AI call.</li><li>Attempts count even when the AI cannot finish. Deleting a plan does not reset usage.</li><li>Shared network and sitewide limits keep planning free. There is no paid upgrade.</li></ul></section></div>}
        {tab === 'history' && <section className="mt-7"><div className="mb-5 flex items-center justify-between"><h2 className="text-xl font-bold">Recent discoveries</h2>{history.length > 0 && <button onClick={() => setClearConfirm(true)} className="text-sm text-[#9c8470]">Clear history</button>}</div>{clearConfirm && <div className="mb-4 rounded-xl bg-white p-4 text-sm">Clear all saved country searches? <button disabled={busy} className="ml-3 text-red-700 underline" onClick={() => void run(async () => { await accountRequest('/history', { method: 'DELETE' }); setHistory([]); setClearConfirm(false); })}>Clear searches</button><button className="ml-3 underline" onClick={() => setClearConfirm(false)}>Cancel</button></div>}{history.length ? <div className="grid gap-3 sm:grid-cols-2">{history.map(item => <Link key={item.countryName} to={`/country/${encodeURIComponent(item.countryName)}`} className="flex items-center justify-between rounded-2xl border border-[#e8dfd2] bg-white p-5 hover:border-[#b07a3a]"><span className="font-bold">{item.countryName}</span><span className="text-xs text-[#9c8470]">{new Date(item.searchedAt).toLocaleDateString()} →</span></Link>)}</div> : <p className="rounded-2xl bg-white p-6 text-sm text-[#9c8470]">Your country discoveries will appear here. <Link to="/" className="text-[#b07a3a] underline">Explore a country</Link></p>}</section>}
        {tab === 'plans' && <section className="mt-7"><h2 className="mb-5 text-xl font-bold">Saved plans</h2>{selected ? <div className="space-y-4"><button className="text-sm underline" onClick={() => setSelected(null)}>← All saved plans</button><p className="rounded-2xl bg-white p-5">{selected.intro}</p>{selected.days.map(day => <article key={day.day} className="rounded-2xl border border-[#e8dfd2] bg-white p-5"><h3 className="font-bold">Day {day.day}: {day.title}</h3>{[['Morning',day.morning],['Afternoon',day.afternoon],['Evening',day.evening],['Tip',day.tip]].map(([label,text]) => <p key={label} className="mt-3 text-sm leading-relaxed"><strong className="text-[#b07a3a]">{label}: </strong>{text}</p>)}<p className="mt-3 text-xs text-[#9c8470]">{day.estimatedCost}</p></article>)}<p className="text-sm">Pack: {selected.packingEssentials.join(', ')}</p><p className="text-sm">{selected.budgetSummary}</p><p className="text-sm">{selected.bestAdvice}</p></div> : plans.length ? <div className="grid gap-4 sm:grid-cols-2">{plans.map(plan => <article key={plan.id} className="rounded-2xl border border-[#e8dfd2] bg-white p-5"><h3 className="text-lg font-bold">{plan.countryName}</h3><p className="mt-1 text-xs text-[#9c8470]">{plan.input.days} days · {plan.input.budget} · {new Date(plan.createdAt).toLocaleDateString()}</p><div className="mt-5 flex items-center justify-between"><button disabled={busy} className="text-sm font-semibold text-[#b07a3a]" onClick={() => void run(async () => setSelected((await accountRequest<{ plan: TravelPlan }>(`/plans/${plan.id}`)).plan))}>View itinerary →</button><button disabled={busy} className="text-xs text-[#9c8470]" onClick={() => void run(async () => { await accountRequest(`/plans/${plan.id}`, { method: 'DELETE' }); setPlans(p => p.filter(x => x.id !== plan.id)); })}>Remove</button></div></article>)}</div> : <p className="rounded-2xl bg-white p-6 text-sm text-[#9c8470]">Your next itinerary will be saved here automatically for 30 days.</p>}</section>}
        {tab === 'settings' && <form className="mt-7 max-w-2xl rounded-3xl border border-[#e8dfd2] bg-white p-6 sm:p-8 space-y-5" onSubmit={e => { e.preventDefault(); void run(async () => { await accountRequest('/settings', { method: 'PUT', body: JSON.stringify(preferences) }); await refresh(); setMessage('Travel preferences saved. They will be used for your next plan.'); }); }}><h2 className="text-xl font-bold">Travel preferences</h2><div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Default budget<select className={`${field} mt-2`} value={preferences.budget} onChange={e => setPreferences(p => ({ ...p, budget: e.target.value }))}><option value="budget">Budget</option><option value="midrange">Mid-range</option><option value="luxury">Luxury</option></select></label><label className="text-sm">Travel group<select className={`${field} mt-2`} value={preferences.traveler} onChange={e => setPreferences(p => ({ ...p, traveler: e.target.value }))}>{['solo','couple','family','friends'].map(t => <option key={t} value={t}>{t}</option>)}</select></label><label className="text-sm">Default trip length<input type="number" min={1} max={7} className={`${field} mt-2`} value={preferences.days} onChange={e => setPreferences(p => ({ ...p, days: Number(e.target.value) }))} /></label></div><fieldset><legend className="mb-3 text-sm">Travel interests</legend><div className="flex flex-wrap gap-2">{['culture','adventure','food','relaxation','nature','nightlife'].map(style => <label key={style} className="rounded-full border border-[#e8dfd2] px-3 py-2 text-xs"><input type="checkbox" className="mr-2 accent-[#b07a3a]" checked={preferences.styles.includes(style)} onChange={e => setPreferences(p => ({ ...p, styles: e.target.checked ? [...p.styles,style] : p.styles.filter(s => s !== style) }))} />{style}</label>)}</div></fieldset><label className="flex gap-3 text-sm"><input type="checkbox" className="accent-[#b07a3a]" checked={preferences.saveHistory} onChange={e => setPreferences(p => ({ ...p, saveHistory: e.target.checked }))} /><span>Save my country search history<span className="mt-1 block text-xs text-[#9c8470]">Turning this off stops future saves. Clear existing searches in Search history.</span></span></label><p className="text-xs text-[#9c8470]">The free daily allowance is fixed at 3 attempts per account. Your settings cannot increase or reset it.</p><button disabled={busy || preferences.styles.length === 0} className={button}>Save preferences</button></form>}
      </>}
    </main>
  </div>;
}
