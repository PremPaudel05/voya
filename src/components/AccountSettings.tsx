import { useEffect, useId, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Bell, Check, Contrast, Globe2, Monitor, Moon, Shield, Sun, Trash2, UserRound } from 'lucide-react';
import { useAccount } from '../account/AccountContext';
import { usePreferences } from '../preferences/PreferencesContext';
import { languageNames } from '../preferences/translations';
import { LANGUAGES, THEMES } from '../../shared/preferences';
import type { Preferences } from '../services/accountService';

export function AccountDialog({ open, title, onClose, busy = false, children }: { open: boolean; title: string; onClose: () => void; busy?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    if (!open && ref.current?.open) ref.current?.close();
  }, [open]);
  return <dialog ref={ref} className="account-dialog" aria-labelledby={id} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }} onClose={onClose}>
    <h2 id={id}>{title}</h2>{children}
  </dialog>;
}
function Toggle({ checked, onChange, title, description, disabled = false }: { checked: boolean; onChange: (checked: boolean) => void; title: string; description: string; disabled?: boolean }) {
  return <label className="settings-toggle"><span><strong>{title}</strong><span className="settings-help">{description}</span></span><input type="checkbox" role="switch" checked={checked} disabled={disabled} onChange={event => onChange(event.target.checked)} /></label>;
}

export function AccountSettings({ initial, onDeleted, onClearHistory }: { initial: Preferences; onDeleted: () => void; onClearHistory: () => void }) {
  const { account, config, saveSettings, deleteAccount, refreshConfig } = useAccount();
  const { preferences, update, t } = usePreferences();
  const [trip, setTrip] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [email, setEmail] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [permission, setPermission] = useState(() => 'Notification' in window ? Notification.permission : 'unsupported');
  const [permissionBusy, setPermissionBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const backendReady = (config?.settingsVersion ?? 0) >= 2;
  useEffect(() => {
    const refresh = () => setPermission('Notification' in window ? Notification.permission : 'unsupported');
    window.addEventListener('focus', refresh);
    return () => window.removeEventListener('focus', refresh);
  }, []);
  const save = async () => {
    setBusy(true); setMessage(''); setError('');
    try { await saveSettings({ ...trip, ...preferences }); setMessage(t('Settings saved.')); }
    catch (e) { setError(e instanceof Error ? e.message : t('Could not save changes. Please try again.')); }
    finally { setBusy(false); }
  };
  const allowNotifications = async () => {
    setPermissionBusy(true); setError('');
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      update({ notifications: { ...preferences.notifications, browser: result === 'granted' } });
      if (result !== 'granted') setError(t('Permission was not granted. You can keep using in-app notifications.'));
    } catch { setError(t('This browser does not support notifications.')); }
    finally { setPermissionBusy(false); }
  };
  const removeAccount = async () => {
    setBusy(true); setError('');
    try { await deleteAccount(email, confirmation); onDeleted(); }
    catch (e) { setError(e instanceof Error ? e.message : t('Could not save changes. Please try again.')); }
    finally { setBusy(false); }
  };
  return <>
    <form className="account-settings" onSubmit={event => { event.preventDefault(); void save(); }}>
      <div className="settings-intro"><h2>{t('Make Voya yours')}</h2><p>{t('Choose your appearance, language, and notifications.')}</p></div>
      {!backendReady && <p role="status" className="account-banner">{t('Saving settings to your account is temporarily unavailable. Appearance and language still work on this device.')}</p>}
      <section className="settings-card" aria-labelledby="appearance-title">
        <div className="settings-heading"><Sun size={21} /><div><h3 id="appearance-title">{t('Appearance')}</h3><p>{t('Choose a comfortable look for the whole site.')}</p></div></div>
        <fieldset className="theme-options"><legend className="sr-only">{t('Appearance')}</legend>{THEMES.map(theme => {
          const Icon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;
          return <label key={theme} className={`theme-option ${preferences.theme === theme ? 'selected' : ''}`}>
            <input type="radio" name="appearance" value={theme} checked={preferences.theme === theme} onChange={() => update({ theme })} />
            <span className={`theme-sample sample-${theme}`} aria-hidden="true"><span /><span /><span /></span>
            <span className="theme-label"><Icon size={16} />{t(theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark')}{preferences.theme === theme && <Check size={15} />}</span>
          </label>;
        })}</fieldset>
        <div className="settings-line"><div><strong className="flex items-center gap-2"><Contrast size={17} />{t('Contrast')}</strong><p className="settings-help">{t('Stronger text and borders for easier reading.')}</p></div><select aria-label={t('Contrast')} value={preferences.contrast} onChange={event => update({ contrast: event.target.value as 'standard' | 'high' })}><option value="standard">{t('Standard')}</option><option value="high">{t('High')}</option></select></div>
        <Toggle checked={preferences.reducedMotion} onChange={reducedMotion => update({ reducedMotion })} title={t('Reduce motion')} description={t('Keep transitions gentle. Your device’s reduced-motion preference is also respected.')} />
      </section>
      <section className="settings-card" aria-labelledby="language-title">
        <div className="settings-heading"><Globe2 size={21} /><div><h3 id="language-title">{t('Language')}</h3><p>{t('Changes account settings and navigation. Country guides and editorial content are currently in English.')}</p></div></div>
        <label className="settings-field">{t('Interface language')}<select value={preferences.language} onChange={event => update({ language: event.target.value as Preferences['language'] })}>{LANGUAGES.map(language => <option key={language} value={language} lang={language}>{languageNames[language]}</option>)}</select></label>
      </section>
      <section className="settings-card" aria-labelledby="notifications-title">
        <div className="settings-heading"><Bell size={21} /><div><h3 id="notifications-title">{t('Notifications')}</h3><p>{t('Choose the updates you want to see.')}</p></div></div>
        <Toggle checked={preferences.notifications.inApp} onChange={inApp => update({ notifications: { ...preferences.notifications, inApp } })} title={t('In-app notifications')} description={t('Show a notice when a country guide loads or a plan is ready.')} />
        <Toggle checked={preferences.notifications.browser && permission === 'granted'} disabled={permission !== 'granted'} onChange={browser => update({ notifications: { ...preferences.notifications, browser } })} title={t('Browser notifications')} description={t('Get a plan-ready alert when Voya is open in another tab. No email or background reminders.')} />
        {permission === 'default' && <button type="button" disabled={permissionBusy} className="account-button secondary" onClick={() => void allowNotifications()}>{t('Allow notifications on this device')}</button>}
        {permission === 'denied' && <p className="settings-help">{t('Blocked in this browser. You can change permission in your browser’s site settings.')}</p>}
        {permission === 'unsupported' && <p className="settings-help">{t('This browser does not support notifications.')}</p>}
        {permission === 'granted' && preferences.notifications.browser && <button type="button" className="account-link" onClick={() => { try { new Notification('Voya', { body: t('Notifications are ready.'), tag: 'voya-test' }); } catch { setError(t('This browser does not support notifications.')); } }}>{t('Send a test notification')}</button>}
      </section>
      <section className="settings-card" aria-labelledby="privacy-title">
        <div className="settings-heading"><Shield size={21} /><h3 id="privacy-title">{t('Privacy & history')}</h3></div>
        <Toggle checked={trip.saveHistory} onChange={saveHistory => setTrip(previous => ({ ...previous, saveHistory }))} title={t('Save my country searches')} description={t('Keep recent searches for up to 90 days. Turning this off stops future saves; clear existing searches separately.')} />
        <button type="button" className="account-link" onClick={onClearHistory}>{t('Clear history')}</button>
      </section>
      <details className="settings-card trip-defaults"><summary>{t('Trip preferences')}<span>{t('Optional defaults for the trip planner.')}</span></summary>
        <div className="settings-grid"><label className="settings-field">{t('Budget')}<select value={trip.budget} onChange={event => setTrip(previous => ({ ...previous, budget: event.target.value }))}>{[['budget','Budget-friendly'],['midrange','Mid-range'],['luxury','Luxury']].map(([value,label]) => <option key={value} value={value}>{t(label)}</option>)}</select></label>
          <label className="settings-field">{t('Group')}<select value={trip.traveler} onChange={event => setTrip(previous => ({ ...previous, traveler: event.target.value }))}>{['solo','couple','family','friends'].map(value => <option key={value} value={value}>{t(value[0].toUpperCase()+value.slice(1))}</option>)}</select></label>
          <label className="settings-field">{t('Trip length (days)')}<input type="number" min={1} max={7} required value={trip.days} onChange={event => setTrip(previous => ({ ...previous, days: Number(event.target.value) }))} /></label></div>
        <fieldset><legend>{t('Interests')}</legend><div className="interest-options">{['culture','adventure','food','relaxation','nature','nightlife'].map(style => <label key={style}><input type="checkbox" checked={trip.styles.includes(style)} onChange={event => setTrip(previous => ({ ...previous, styles: event.target.checked ? [...previous.styles,style] : previous.styles.filter(value => value !== style) }))} />{t(style[0].toUpperCase()+style.slice(1))}</label>)}</div></fieldset>
      </details>
      <div className="settings-save"><p>{t('Appearance and language apply on this device immediately. Save to sync all settings with your account.')}</p><button className="account-button" disabled={!backendReady || busy || trip.styles.length === 0}>{t(busy ? 'Saving…' : 'Save settings')}</button></div>
      {message && <p role="status" className="account-success">{message}</p>}
      {error && !deleting && <p role="alert" className="account-error">{error}</p>}
    </form>
    <section className="settings-card account-danger" aria-labelledby="account-title"><div className="settings-heading"><UserRound size={21} /><div><h3 id="account-title">{t('Account')}</h3><p>{t('Signed in with Google')} · {account?.user.email}</p></div></div><h4>{t('Delete account')}</h4><p className="settings-help">{t('Permanently delete your Voya profile, preferences, saved searches, and plans. All devices will be signed out.')}</p>{!backendReady && <div className="account-banner" role="status"><p>{t('Account deletion is temporarily unavailable. Your account has not been deleted.')}</p><button type="button" className="account-link" disabled={checking} onClick={async () => { setChecking(true); try { await refreshConfig(); } catch { setError(t('Could not check availability. Please try again.')); } finally { setChecking(false); } }}>{t(checking ? 'Checking…' : 'Check availability')}</button></div>}<button type="button" className="account-button danger" disabled={!backendReady || busy} onClick={() => { setDeleting(true); setEmail(''); setConfirmation(''); setError(''); }}><Trash2 size={16} />{t('Delete account')}</button></section>
    <AccountDialog open={deleting} title={t('Delete your Voya account?')} busy={busy} onClose={() => { if (!busy) setDeleting(false); }}>
      <p>{t('Permanently delete your Voya profile, preferences, saved searches, and plans. All devices will be signed out.')}</p><p className="settings-help">{t('This cannot be undone. Your Google account is unaffected. Minimal usage records without your name, email, or saved content remain until the next daily cleanup to prevent limit resets.')}</p>
      <form onSubmit={event => { event.preventDefault(); void removeAccount(); }}><label className="settings-field">{t('Account email')}<input type="email" required autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} disabled={busy} /></label><label className="settings-field">{t('Type DELETE to confirm')}<input autoComplete="off" spellCheck={false} value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={busy} /></label>
        {error && <p role="alert" className="account-error">{error}</p>}<div className="dialog-actions"><button type="button" className="account-button secondary" autoFocus disabled={busy} onClick={() => setDeleting(false)}>{t('Cancel')}</button><button className="account-button danger" disabled={busy || confirmation !== 'DELETE' || email.trim().toLowerCase() !== account?.user.email.toLowerCase()}>{t(busy ? 'Saving…' : 'Delete my account permanently')}</button></div>
      </form>
    </AccountDialog>
  </>;
}
