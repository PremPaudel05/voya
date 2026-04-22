import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowUp, Search } from 'lucide-react';
import { CountryProfile } from '../components/CountryProfile';
import { LoadingAnimation } from '../components/LoadingAnimation';
import { generateCountryProfile } from '../services/countryService';
import type { CountryData } from '../types';

const SEARCH_TIMEOUT_MS = 15000;

export default function CountryPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();

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

    setIsLoading(true);
    setError(null);
    setCountryData(null);
    window.scrollTo({ top: 0, behavior: 'instant' });

    const timeout = new Promise<CountryData>((_, reject) =>
      setTimeout(() => reject(new Error('Request timed out')), SEARCH_TIMEOUT_MS)
    );

    Promise.race([generateCountryProfile(decoded), timeout])
      .then((data) => {
        if (!data.isValidCountry) {
          setError('Destination not found. Please enter a valid country.');
        } else {
          setCountryData(data);
        }
      })
      .catch((err) => {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        setError(msg.toLowerCase().includes('timed out')
          ? 'The request took too long. Please try again.'
          : 'Could not load travel insights. Please try again later.');
      })
      .finally(() => setIsLoading(false));
  }, [name]);

  const decoded = name ? decodeURIComponent(name) : '';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (q) navigate(`/country/${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-[#F7F3EE] font-sans">

      {/* ── Top Nav ── */}
      <div className="sticky top-0 z-50 bg-[#F7F3EE]/95 backdrop-blur border-b border-[#e8dfd2] px-6 py-3 flex items-center gap-4">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-[#9c8470] hover:text-[#1a1208] transition-colors text-sm font-semibold shrink-0">
          <ArrowLeft size={14} /> Home
        </button>

        <form onSubmit={handleSearch} className="flex-1 max-w-sm">
          <div className="flex items-center gap-2 bg-white border border-[#ddd4c4] focus-within:border-[#b07a3a]/60 rounded-xl px-3 py-2 transition-colors shadow-sm">
            <Search size={13} className="text-[#b07a3a] shrink-0" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={decoded || 'Search another country…'}
              className="flex-1 bg-transparent text-[#1a1208] text-xs placeholder:text-[#b8a898] focus:outline-none font-medium"
            />
          </div>
        </form>

        <span className="text-[#1a1208] font-black text-sm tracking-tight shrink-0">
          Voya <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#b07a3a] bg-[#b07a3a]/10 px-2 py-0.5 rounded-full ml-1">Travel</span>
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
              <div className="max-w-md w-full mx-auto text-center">

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-[#b07a3a]/10 border border-[#b07a3a]/20 flex items-center justify-center mx-auto mb-6">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#b07a3a" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                </div>

                {/* Heading */}
                <h2 className="text-2xl font-black text-[#1a1208] mb-2 tracking-tight">
                  {error.includes('valid country') ? 'Country not found' : 'Something went wrong'}
                </h2>
                <p className="text-[#9c8470] text-sm leading-relaxed mb-8 max-w-xs mx-auto">
                  {error.includes('valid country')
                    ? `"${decoded}" doesn't match any country in our database. Check the spelling or try a different name.`
                    : 'We had trouble loading insights for this destination. It might be a temporary issue.'}
                </p>

                {/* Suggestions if invalid country */}
                {error.includes('valid country') && (
                  <div className="mb-8">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[#b07a3a] mb-3">Try one of these</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {['Japan', 'France', 'Morocco', 'Thailand', 'Brazil', 'Iceland'].map(c => (
                        <button key={c} onClick={() => navigate(`/country/${encodeURIComponent(c)}`)}
                          className="px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#e8dfd2] text-[#6b5740] hover:bg-[#1a1208] hover:text-white hover:border-[#1a1208] transition-all shadow-sm">
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => navigate('/')}
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-white border border-[#e8dfd2] text-[#1a1208] rounded-xl hover:bg-[#F7F3EE] transition-colors text-sm font-semibold shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                    Home
                  </button>
                  {!error.includes('valid country') && (
                    <button onClick={() => navigate(`/country/${encodeURIComponent(decoded)}`)}
                      className="px-5 py-2.5 bg-[#1a1208] text-[#F7F3EE] rounded-xl hover:bg-[#b07a3a] transition-colors text-sm font-semibold">
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
            className="fixed bottom-8 right-8 p-3 bg-[#1a1208] text-[#F7F3EE] rounded-full shadow-lg hover:bg-[#b07a3a] transition-colors z-50">
            <ArrowUp size={18} />
          </motion.button>
        )}
      </AnimatePresence>

      <footer className="bg-[#F7F3EE] border-t border-[#e8dfd2] mt-4">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[#1a1208] font-black text-sm">Voya <span className="text-[#9c8470] font-normal">· Your smart travel guide</span></span>
          <p className="text-xs text-[#9c8470]">© {new Date().getFullYear()} Voya. Built to make travel planning joyful.</p>
        </div>
      </footer>
    </div>
  );
}
