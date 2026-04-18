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
          : 'We could not load travel insights. Please try again later.');
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
    <div className="min-h-screen bg-slate-950 font-sans">

      {/* ── Top Nav ─── */}
      <div className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur border-b border-white/5 px-4 py-2.5 flex items-center gap-4">
        <button onClick={() => navigate('/')}
          className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors text-sm font-medium shrink-0">
          <ArrowLeft size={15} /> Home
        </button>

        {/* Inline search */}
        <form onSubmit={handleSearch} className="flex-1 max-w-sm">
          <div className="flex items-center gap-2 bg-white/8 border border-white/10 focus-within:border-blue-500/50 rounded-xl px-3 py-1.5 transition-colors">
            <Search size={13} className="text-slate-500 shrink-0" />
            <input
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={decoded || 'Search another country…'}
              className="flex-1 bg-transparent text-white text-xs placeholder:text-slate-500 focus:outline-none"
            />
          </div>
        </form>

        <span className="text-blue-400 font-bold text-sm tracking-wide shrink-0">Voya</span>
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
            <motion.div key="error" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="px-4 py-20">
              <div className="max-w-lg mx-auto bg-slate-900 border border-red-500/20 rounded-2xl p-8 text-center">
                <div className="text-5xl mb-4">🌍</div>
                <h2 className="text-xl font-bold text-white mb-2">Couldn't load insights</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-6">{error}</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => navigate('/')}
                    className="px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium">
                    ← Home
                  </button>
                  <button onClick={() => navigate(`/country/${encodeURIComponent(decoded)}`)}
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors text-sm font-medium">
                    Try Again
                  </button>
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
            className="fixed bottom-8 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50">
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>

      <footer className="bg-slate-950 text-slate-500 border-t border-white/5 mt-4">
        <div className="border-b border-white/5 py-3 px-6 text-center">
          <p className="text-xs max-w-2xl mx-auto">
            <span className="text-slate-400 font-medium">Heads up:</span> Voya compiles travel insights from curated data sources — always verify critical details before you travel.
          </p>
        </div>
        <div className="max-w-5xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-blue-400 font-bold">Voya <span className="text-slate-600 font-normal">· Your smart travel guide</span></span>
          <p className="text-xs">© {new Date().getFullYear()} Voya. Built to make travel planning joyful.</p>
        </div>
      </footer>
    </div>
  );
}
