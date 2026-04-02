import React, { useState, useEffect } from 'react';
import { Search, MapPin, Compass, Globe2, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HeroProps {
  onSearch: (country: string) => void;
  isLoading: boolean;
}

const funFacts = [
  { flag: "🇯🇵", fact: "Japan consists of over 6,800 islands." },
  { flag: "🇨🇦", fact: "Canada has more lakes than the rest of the world combined." },
  { flag: "🇦🇺", fact: "Australia is wider than the moon." },
  { flag: "🇧🇷", fact: "Brazil has the greatest biodiversity of any country on Earth." },
  { flag: "🇮🇸", fact: "Iceland is growing by about 5 centimeters per year." },
  { flag: "🇲🇬", fact: "Over 90% of Madagascar's wildlife is found nowhere else on Earth." },
  { flag: "🇳🇿", fact: "New Zealand has a hill with an 85-letter name." },
  { flag: "🇨🇭", fact: "Switzerland has enough nuclear fallout shelters to fit its entire population." },
  { flag: "🇮🇳", fact: "India has a spa just for elephants." },
  { flag: "🇪🇬", fact: "The Great Pyramid of Giza was the tallest man-made structure for over 3,800 years." }
];

export function Hero({ onSearch, isLoading }: HeroProps) {
  const [query, setQuery] = useState('');
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      setFactIndex(Math.floor(Math.random() * funFacts.length));
      interval = setInterval(() => {
        setFactIndex((prev) => (prev + 1) % funFacts.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="relative overflow-hidden bg-slate-900 text-white py-24 sm:py-32">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <img 
          src="https://picsum.photos/seed/travelbg/1920/1080?blur=2" 
          alt="Travel background" 
          className="w-full h-full object-cover opacity-20"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 to-slate-900"></div>
      </div>

      <div className="relative max-w-4xl mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex justify-center mb-8">
            <div className="bg-blue-500/20 p-5 rounded-3xl backdrop-blur-sm border border-blue-400/30 rotate-45">
              <motion.div
                animate={{ rotate: [-45, 315] }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              >
                <Globe2 className="w-16 h-16 text-blue-400" />
              </motion.div>
            </div>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 leading-tight">
            Discover the World with <br />
            <span className="text-blue-400">Voya</span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Your complete travel assistant: Discover countries, explore attractions, unlock local etiquette, and plan your entire trip in one place.
          </p>
        </motion.div>

        <motion.form 
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl mx-auto relative"
        >
          <div className="relative flex items-center">
            <div className="absolute left-4 text-slate-400">
              <Search size={24} />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter any country name..."
              className="w-full pl-12 pr-40 py-5 rounded-full bg-white text-slate-900 text-lg shadow-xl focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-2 top-2 bottom-2 px-6 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Explore
                  <Compass size={18} />
                </>
              )}
            </button>
          </div>
        </motion.form>

        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -20, height: 0 }}
              className="max-w-2xl mx-auto mt-6 overflow-hidden"
            >
              <div className="bg-blue-900/40 backdrop-blur-md border border-blue-500/30 rounded-2xl p-4 flex items-start gap-4 text-left shadow-lg">
                <div className="bg-blue-500/20 p-2 rounded-full shrink-0">
                  <Lightbulb className="w-6 h-6 text-blue-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-blue-300 font-medium text-sm uppercase tracking-wider mb-1">
                    Did you know?
                  </h4>
                  <div className="relative h-12 sm:h-8">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={factIndex}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0"
                      >
                        <p className="text-slate-200 text-sm sm:text-base truncate whitespace-normal line-clamp-2">
                          <span className="mr-2 text-xl">{funFacts[factIndex].flag}</span>
                          {funFacts[factIndex].fact}
                        </p>
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}