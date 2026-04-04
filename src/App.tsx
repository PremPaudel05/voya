import { useState, useEffect } from 'react';
import { Hero } from './components/Hero';
import { CountryProfile } from './components/CountryProfile';
import { LoadingAnimation } from './components/LoadingAnimation';
import { generateCountryProfile } from './services/countryService';
import type { CountryData } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';


const SEARCH_TIMEOUT_MS = 15000;

export default function App() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countryData, setCountryData] = useState<CountryData | null>(null);
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 500);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = async (country: string) => {
    const trimmedCountry = country.trim();
    if (!trimmedCountry) {
      setError('Please enter a country name.');
      setCountryData(null);
      return;
    }
    setIsLoading(true);
    setError(null);
    setCountryData(null);
    setLastSearchQuery(trimmedCountry);
    try {
      const timeoutPromise = new Promise<CountryData>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Request timed out'));
        }, SEARCH_TIMEOUT_MS);
      });
      const data = await Promise.race([
        generateCountryProfile(trimmedCountry),
        timeoutPromise,
      ]);
      if (!data.isValidCountry) {
        setError('Destination not found. Please enter a valid country.');
      } else {
        setCountryData(data);
        setTimeout(() => {
          window.scrollTo({ top: window.innerHeight * 0.6, behavior: 'smooth' });
        }, 100);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred';
      if (message.toLowerCase().includes('timed out')) {
        setError('The request took too long. Please try again in a moment.');
      } else {
        setError('We could not load travel insights right now. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Hero onSearch={handleSearch} isLoading={isLoading} />

      <main className="relative min-h-[50vh]">
        <AnimatePresence mode="wait">
          {isLoading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 bg-slate-50/80 backdrop-blur-sm flex items-start justify-center pt-20"
            >
              <LoadingAnimation />
            </motion.div>
          )}

          {error && !isLoading && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto mt-20 p-6 bg-amber-50 border border-amber-200 rounded-2xl text-center shadow-sm"
            >
              <div className="text-4xl mb-4">🌍</div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                Travel insights are temporarily unavailable
              </h2>
              <p className="text-slate-600 leading-7">{error}</p>
              {lastSearchQuery && (
                <button
                  onClick={() => handleSearch(lastSearchQuery)}
                  className="mt-4 px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium cursor-pointer"
                >
                  Try Again
                </button>
              )}
            </motion.div>
          )}

          {countryData && !isLoading && (
            <motion.div
              key="profile"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <CountryProfile data={countryData} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
            aria-label="Scroll to top"
          >
            <ArrowUp size={24} />
          </motion.button>
        )}
      </AnimatePresence>

      <footer className="bg-slate-900 text-slate-400 py-8 text-center border-t border-slate-800 mt-auto">

      </footer>

    </div>
  );
}