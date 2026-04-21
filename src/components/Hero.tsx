import { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WorldMap } from './ui/map';
import { ShareButton } from './ShareButton';
import { TextEffect } from './ui/text-effect';

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
  { flag: "🇨🇭", fact: "Switzerland has enough nuclear shelters to fit its entire population." },
  { flag: "🇮🇳", fact: "India has a spa just for elephants." },
  { flag: "🇪🇬", fact: "The Great Pyramid was the tallest structure for over 3,800 years." },
];

const topDestinations = [
  { name: "Japan",         code: "jp" },
  { name: "Italy",         code: "it" },
  { name: "France",        code: "fr" },
  { name: "Thailand",      code: "th" },
  { name: "Morocco",       code: "ma" },
  { name: "Iceland",       code: "is" },
  { name: "Peru",          code: "pe" },
  { name: "New Zealand",   code: "nz" },
];

const placeholderCountries = [
  { prefix: "Dreaming of",   country: "Japan" },
  { prefix: "Planning a trip to", country: "Morocco" },
  { prefix: "Curious about", country: "Iceland" },
  { prefix: "Exploring",     country: "Peru" },
  { prefix: "Heading to",    country: "Italy" },
  { prefix: "Wandering",     country: "Portugal" },
  { prefix: "Adventuring in",country: "Kenya" },
  { prefix: "Discovering",   country: "Thailand" },
];

const travelWords = ["wander", "explore", "discover", "roam"];

export function Hero({ onSearch, isLoading }: HeroProps) {
  const [query, setQuery] = useState('');
  const [factIndex, setFactIndex] = useState(0);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      setFactIndex(Math.floor(Math.random() * funFacts.length));
      interval = setInterval(() => setFactIndex(p => (p + 1) % funFacts.length), 3500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    const t = setInterval(() => setPlaceholderIndex(i => (i + 1) % placeholderCountries.length), 3800);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setWordIndex(i => (i + 1) % travelWords.length), 3200);
    return () => clearInterval(t);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) onSearch(query.trim());
  };

  return (
    <div className="relative bg-[#F7F3EE] text-[#1a1208] min-h-screen flex flex-col overflow-hidden">

      {/* Subtle grain texture overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px',
        }}
      />

      {/* Warm ink accent — top left */}
      <div className="absolute -top-32 -left-32 w-[520px] h-[520px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(214,165,95,0.18) 0%, transparent 70%)' }} />
      {/* Rust accent — bottom right */}
      <div className="absolute -bottom-24 -right-24 w-[440px] h-[440px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(185,90,60,0.12) 0%, transparent 70%)' }} />

      {/* Top nav strip */}
      <div className="sticky top-0 z-50 bg-[#F7F3EE]/95 backdrop-blur border-b border-[#e8dfd2] w-full">
      <div className="w-full max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-black tracking-tight text-[#1a1208]">Voya</span>
          <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-[#b07a3a] bg-[#b07a3a]/10 px-2 py-0.5 rounded-full">Travel</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-5 text-sm font-medium text-[#6b5740]">
          <button onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#1a1208] transition-colors text-xs sm:text-sm">About</button>
          <ShareButton countryName="Voya" />
          <button
            onClick={() => {
              inputRef.current?.focus();
              inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
            className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#1a1208] text-[#F7F3EE] text-xs font-semibold hover:bg-[#2d1f0e] transition-colors whitespace-nowrap"
          >
            <span className="hidden sm:inline">Start exploring →</span>
            <span className="sm:hidden">Explore →</span>
          </button>
        </div>
      </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-16 items-center">

          {/* Left column */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col"
          >
            {/* Eyebrow */}
            <div className="flex items-center gap-2.5 mb-7">
              <div className="h-px w-8 bg-[#b07a3a]" />
              <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#b07a3a]">
                Instant travel intelligence
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-black leading-[1.0] tracking-[-0.03em] mb-6"
              style={{ fontSize: 'clamp(3rem, 6vw, 5.2rem)' }}>
              The world is<br />
              yours to{' '}
              <span className="relative inline-block">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={wordIndex}
                    initial={{ opacity: 0, y: 16, rotateX: -20 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: -16, rotateX: 20 }}
                    transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 whitespace-nowrap"
                    style={{
                      backgroundImage: 'linear-gradient(135deg, #b07a3a 0%, #d4954a 40%, #c1622c 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    {travelWords[wordIndex]}
                  </motion.span>
                </AnimatePresence>
                {/* spacer to hold width */}
                <span className="invisible">{travelWords.reduce((a, b) => a.length > b.length ? a : b)}</span>
              </span>
            </h1>

            <p className="text-[#6b5740] text-lg leading-relaxed mb-9 max-w-[480px]">
              Type any country. Get instant, curated insights: culture, food, phrases, costs, and a day-by-day itinerary built just for you.
            </p>

            {/* Search */}
            <form onSubmit={handleSubmit} className="w-full max-w-lg mb-5">
              <div className="flex items-center gap-0 bg-white border border-[#ddd4c4] rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.07)] overflow-hidden transition-shadow focus-within:shadow-[0_4px_32px_rgba(176,122,58,0.18)] focus-within:border-[#b07a3a]/50">
                <div className="flex items-center gap-3 flex-1 px-4 h-[54px]">
                  <Search size={16} className="text-[#b07a3a] shrink-0" />
                  <div className="relative flex-1 h-full flex items-center overflow-hidden">
                    {!query && (
                      <div className="absolute inset-0 flex items-center pointer-events-none overflow-hidden">
                        <AnimatePresence mode="wait">
                          <div key={placeholderIndex} className="flex items-baseline gap-1">
                            <TextEffect
                              per="char"
                              preset="blur"
                              className="text-[#c9b89a] text-sm whitespace-nowrap"
                            >
                              {placeholderCountries[placeholderIndex].prefix}
                            </TextEffect>
                            <TextEffect
                              per="char"
                              preset="blur"
                              delay={placeholderCountries[placeholderIndex].prefix.length * 0.03}
                              className="text-[#b07a3a]/80 text-sm font-semibold whitespace-nowrap"
                            >
                              {placeholderCountries[placeholderIndex].country + '?'}
                            </TextEffect>
                          </div>
                        </AnimatePresence>
                      </div>
                    )}
                    <input
                      ref={inputRef}
                      type="text"
                      value={query}
                      onChange={e => setQuery(e.target.value)}
                      className="relative z-10 w-full h-full bg-transparent text-[#1a1208] text-sm font-medium focus:outline-none"
                      disabled={isLoading}
                      autoComplete="off"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="shrink-0 h-[54px] px-6 bg-[#1a1208] hover:bg-[#2d1f0e] text-[#F7F3EE] font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <><span>Explore</span><ArrowRight size={14} /></>
                  }
                </button>
              </div>
            </form>

            {/* Destination pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {topDestinations.map(dest => (
                <button
                  key={dest.name}
                  onClick={() => { setQuery(dest.name); onSearch(dest.name); }}
                  disabled={isLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-[#e8dfd2] text-[#6b5740] hover:bg-[#1a1208] hover:text-[#F7F3EE] hover:border-[#1a1208] transition-all duration-200 shadow-sm disabled:opacity-40"
                >
                  <img src={`https://flagcdn.com/w20/${dest.code}.png`} alt={dest.name} className="w-4 h-3 object-cover rounded-sm shrink-0" />
                  {dest.name}
                </button>
              ))}
            </div>

            {/* Social proof strip */}
            <div className="flex items-center gap-5 border-t border-[#e8dfd2] pt-6">
              <div className="text-center">
                <div className="text-2xl font-black text-[#1a1208]">195+</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9c8470]">Countries</div>
              </div>
              <div className="w-px h-8 bg-[#e8dfd2]" />
              <div className="text-center">
                <div className="text-2xl font-black text-[#1a1208]">8</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9c8470]">Insight types</div>
              </div>
              <div className="w-px h-8 bg-[#e8dfd2]" />
              <div className="text-center">
                <div className="text-2xl font-black text-[#1a1208]">Free</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-[#9c8470]">Always</div>
              </div>
            </div>

            {/* Loading fact */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 10, height: 0 }}
                  className="mt-5 overflow-hidden"
                >
                  <div className="bg-[#b07a3a]/10 border border-[#b07a3a]/25 rounded-2xl p-4 flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-[#b07a3a] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#b07a3a] mb-1">Did you know?</div>
                      <div className="relative h-10">
                        <AnimatePresence mode="wait">
                          <motion.p key={factIndex}
                            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 text-[#6b5740] text-sm line-clamp-2"
                          >
                            <span className="mr-1.5" style={{ fontFamily: '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji","Twemoji Mozilla",sans-serif' }}>{funFacts[factIndex].flag}</span>
                            {funFacts[factIndex].fact}
                          </motion.p>
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right column — map (blended, no card) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block relative"
          >
            {/* Subtle top label */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#b07a3a] animate-pulse" />
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#b07a3a]">Live routes</span>
            </div>
            <WorldMap
              lineColor="#b07a3a"
              showLabels={true}
              dots={[
                { start: { lat: 48.85, lng: 2.35,   label: "Paris" },      end: { lat: 35.68,  lng: 139.69, label: "Tokyo" } },
                { start: { lat: 40.71, lng: -74.01, label: "New York" },   end: { lat: 51.51,  lng: -0.13,  label: "London" } },
                { start: { lat: 1.35,  lng: 103.82, label: "Singapore" },  end: { lat: -33.87, lng: 151.21, label: "Sydney" } },
                { start: { lat: 25.20, lng: 55.27,  label: "Dubai" },      end: { lat: -1.29,  lng: 36.82,  label: "Nairobi" } },
                { start: { lat: 19.43, lng: -99.13, label: "Mexico City"}, end: { lat: -23.55, lng: -46.63, label: "São Paulo" } },
                { start: { lat: 55.75, lng: 37.62,  label: "Moscow" },     end: { lat: 28.61,  lng: 77.21,  label: "New Delhi" } },
              ]}
            />
          </motion.div>

        </div>
      </div>

      {/* Section transition */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #F7F3EE)' }} />
    </div>
  );
}
