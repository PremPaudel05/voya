import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import './dashain-greeting.css';

const dismissalKey = 'voya-dashain-2026-dismissed';
// This seasonal message runs through Nov 1 in the developer's local timezone.
const endsAt = Date.parse('2026-11-02T00:00:00-05:00');
export function DashainGreeting() {
  const [open, setOpen] = useState(false);
  const dismiss = () => {
    setOpen(false);
    try { localStorage.setItem(dismissalKey, 'yes'); } catch { /* Dismiss still works without storage. */ }
  };
  useEffect(() => {
    if (Date.now() >= endsAt) return;
    try { if (localStorage.getItem(dismissalKey)) return; } catch { /* Storage is optional. */ }
    const show = window.setTimeout(() => { if (Date.now() < endsAt) setOpen(true); }, 1800);
    const expire = window.setTimeout(() => setOpen(false), endsAt - Date.now());
    return () => { clearTimeout(show); clearTimeout(expire); };
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') dismiss(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  if (!open) return null;
  return <aside className="dashain-greeting" aria-labelledby="dashain-title">
    <button className="dashain-close" onClick={dismiss} aria-label="Dismiss Dashain greeting"><X size={20} /></button>
    <img src="/celebrations/dashain-kites.webp" width="720" height="428" alt="Dashain illustration with colorful kites and a child flying them" />
    <div className="dashain-copy">
      <span className="dashain-kicker">A little wish from home</span>
      <h2 id="dashain-title">Happy Dashain! <span lang="ne">शुभ दशैं</span></h2>
      <p>To those abroad and those at home—wishing you good health, happiness, and time with the people you love. Whether you’re sharing tika and jamara in person or sending blessings across the miles, may this Dashain bring you a little closer to home.</p>
      <p className="dashain-signature">With warm wishes,<br /><strong>Prem</strong> · Voya’s Nepali developer</p>
    </div>
  </aside>;
}
