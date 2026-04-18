import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowUp } from 'lucide-react';
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
        if (msg.toLowerCase().includes('timed out')) {
          setError('The request took too long. Please try again in a moment.');
        } else {
          setError('We could not load travel insights right now. Please try again later.');
        }
      })
      .finally(() => setIsLoading(false));
  }, [name]);

  const decoded = name ? decodeURIComponent(name) : '';

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-900">

      {/* Top nav bar */}
      <div className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur border-b border-white/5 px-6 py-3 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back to search
        </button>
        <span className="text-white font-semibold text-sm tracking-wide">
          <span className="text-blue-400">Voya</span>
        </span>
      </div>

      <main>
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center min-h-[80vh] bg-slate-950"
            >
              <LoadingAnimation />
            </motion.div>
          )}

          {error && !isLoading && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-950 px-4 py-20"
            >
              <div className="max-w-3xl mx-auto p-6 bg-slate-900 border border-amber-500/30 rounded-2xl text-center shadow-sm">
                <div className="text-4xl mb-4">🌍</div>
                <h2 className="text-xl font-semibold text-white mb-2">
                  Travel insights are temporarily unavailable
                </h2>
                <p className="text-slate-400 leading-7">{error}</p>
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => navigate('/')}
                    className="px-6 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors font-medium"
                  >
                    ← Back to search
                  </button>
                  <button
                    onClick={() => navigate(`/country/${encodeURIComponent(decoded)}`)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {countryData && !isLoading && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <CountryProfile data={countryData} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Scroll to top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="fixed bottom-8 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
            aria-label="Scroll to top"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <footer className="bg-slate-950 text-slate-500 border-t border-white/5 mt-12">
        <div className="border-b border-white/5 py-3 px-6 text-center">
          <p className="text-xs text-slate-500 max-w-2xl mx-auto">
            <span className="text-slate-400 font-medium">Heads up:</span> Voya uses AI to generate travel insights. Information may occasionally be inaccurate or outdated — always verify critical details before travel.
          </p>
        </div>
        <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold text-white">
            <span className="text-blue-400">Voya</span>
            <span className="text-slate-600">·</span>
            <span className="text-sm font-normal text-slate-500">Your AI travel companion</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} Voya. Built to make travel planning joyful.</p>
        </div>
      </footer>
    </div>
  );
}
