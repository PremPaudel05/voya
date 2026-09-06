import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowUp, Search } from 'lucide-react';
import { CountryProfile } from '../components/CountryProfile';
import { LoadingAnimation } from '../components/LoadingAnimation';
import { generateCountryProfile } from '../services/countryService';
import type { CountryData } from '../types';
import { AccountLink } from '../components/AccountLink';
import { useAccount } from '../account/AccountContext';
import { usePreferences } from '../preferences/PreferencesContext';

const SEARCH_TIMEOUT_MS = 25000;

export default function CountryPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const { recordSearch } = useAccount();
  const { notify, t } = usePreferences();
  const notifyRef = useRef(notify);
  useEffect(() => { notifyRef.current = notify; }, [notify]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countryData, setCountryData] = useState<CountryData | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 500);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!name) return;
    const decoded = decodeURIComponent(name);
    let active = true;

    setIsLoading(true);
    setError(null);
    setCountryData(null);
    window.scrollTo({ top: 0, behavior: 'instant' });

    const timeout = new Promise<CountryData>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), SEARCH_TIMEOUT_MS)
    );

    Promise.race([generateCountryProfile(decoded), timeout])
      .then((data) => {
        if (!active) return;
        if (!data.isValidCountry) {
          setError('Destination not found. Please enter a valid country.');
        } else {
          setCountryData(data);
          notifyRef.current({ type: 'guide', country: data.overview.countryName });
          void recordSearch(data.overview.countryName).catch(() => { /* History failure must not hide a country guide. */ });
        }
      })
      .catch((err) => {
        if (!active) return;
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg.toLowerCase().includes('timed out')
          ? 'The request took too long. Please try again.'
          : 'Could not load travel insights. Please try again later.');
      })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [name, recordSearch]);

  const decoded = name ? decodeURIComponent(name) : '';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) navigate(`/country/${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-canvas font-sans">

      {/* ── Top Nav ── */}
      <div className="sticky top-0 z-50 bg-canvas/95 backdrop-blur border-b border-line px-6 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-subtle hover:text-ink transition-colors text-sm font-semibold shrink-0">
          <ArrowLeft size={14} /> {t('Explore')}
        </button>

        <form onSubmit={handleSearch} className="flex-1 min-w-0 max-w-sm">
          <div className="flex items-center gap-2 bg-surface border border-line focus-within:border-accent/60 rounded-xl px-3 py-2 transition-colors shadow-sm">
            <Search size={13} className="text-accent shrink-0" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={decoded || 'Search another country…'}
              className="flex-1 min-w-0 bg-transparent text-ink text-xs placeholder:text-[#b8a898] focus:outline-none font-medium"
            />
          </div>
        </form>

        <AccountLink />
        <span className="hidden sm:inline text-ink font-black text-sm tracking-tight shrink-0">
          Voya <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-accent bg-brand/10 px-2 py-0.5 rounded-full ml-1">Travel</span>
        </span>
      </div>

      <main>
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[80vh]">
              <LoadingAnimation />
            </motion.div>
          )}

          {error && !isLoading && (
            <motion.div key="error" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="px-4 py-16 min-h-[70vh] flex items-center justify-center">
              <div role="alert" className="max-w-md w-full mx-auto text-center">

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-accent/20 flex items-center justify-center mx-auto mb-6">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b07a3a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>

                {/* Heading */}
                <h2 className="text-2xl font-black text-ink mb-2 tracking-tight">
                  {error.includes('valid country') ? 'Country not found' : 'Something went wrong'}
                </h2>
                <p className="text-subtle text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                  {error.includes('valid country')
                    ? `"${decoded}" doesn't match any country in our database. Check the spelling or try a different name.`
                    : 'We had trouble loading insights for this destination. It might be a temporary issue.'}
                </p>

                {/* Suggestions if invalid country */}
                {error.includes('valid country') && (
                  <div className="mb-8">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-accent mb-3">Try one of these</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['Japan', 'France', 'Morocco', 'Thailand', 'Brazil', 'Iceland'].map(c => (
                        <button key={c} onClick={() => navigate(`/country/${encodeURIComponent(c)}`)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-surface border border-line text-muted hover:bg-inverse hover:text-white hover:border-[#1a1208] transition-all shadow-sm">
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => navigate('/')}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-surface border border-line text-ink rounded-xl hover:bg-canvas transition-colors text-sm font-semibold shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                    Home
                  </button>
                  {!error.includes('valid country') && (
                    <button onClick={() => navigate(`/country/${encodeURIComponent(decoded)}`)}
                      className="px-5 py-2.5 bg-inverse text-[#F7F3EE] rounded-xl hover:bg-brand transition-colors text-sm font-semibold">
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {countryData && !isLoading && (
            <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <CountryProfile data={countryData} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 p-3 bg-inverse text-[#F7F3EE] rounded-full shadow-lg hover:bg-brand transition-colors z-50">
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      <footer className="bg-canvas border-t border-line mt-4">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-ink font-black text-sm">Voya <span className="text-subtle font-normal">· Your smart travel guide</span></span>
          <p className="text-xs text-subtle">© {new Date().getFullYear()} Voya. Built to make travel planning joyful.</p>
        </div>
      </footer>
    </div>
  );
}
