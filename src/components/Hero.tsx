import { useState, useEffect, useRef } from 'react';
import { Search, Compass, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe } from './ui/cobe-globe';
import AnimatedShaderBackground from './ui/animated-shader-background';
import { GlobeErrorBoundary } from './ui/globe-fallback';

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
  { name: "France", flag: "🇫🇷" },
  { name: "Spain", flag: "🇪🇸" },
  { name: "United States", flag: "🇺🇸" },
  { name: "China", flag: "🇨🇳" },
  { name: "Italy", flag: "🇮🇹" },
  { name: "Turkey", flag: "🇹🇷" },
  { name: "Mexico", flag: "🇲🇽" },
  { name: "Thailand", flag: "🇹🇭" },
  { name: "Germany", flag: "🇩🇪" },
  { name: "Japan", flag: "🇯🇵" },
];

const placeholderCountries = [
  "France", "Japan", "Italy", "Thailand",
  "Spain", "Mexico", "Turkey", "Germany",
  "Iceland", "Australia",
];

const globeMarkers = [
  { id: "paris",    location: [48.8566,   2.3522] as [number, number], label: "Paris" },
  { id: "tokyo",    location: [35.6762, 139.6503] as [number, number], label: "Tokyo" },
  { id: "nyc",      location: [40.7128,  -74.006] as [number, number], label: "New York" },
  { id: "dubai",    location: [25.2048,  55.2708] as [number, number], label: "Dubai" },
  { id: "sydney",   location: [-33.8688, 151.2093] as [number, number], label: "Sydney" },
  { id: "london",   location: [51.5074,  -0.1278] as [number, number], label: "London" },
  { id: "bangkok",  location: [13.7563, 100.5018] as [number, number], label: "Bangkok" },
  { id: "rio",      location: [-22.9068, -43.1729] as [number, number], label: "Rio" },
];

const globeArcs = [
  { id: "nyc-london", from: [40.7128, -74.006] as [number, number], to: [51.5074, -0.1278] as [number, number] },
  { id: "paris-dubai", from: [48.8566, 2.3522] as [number, number], to: [25.2048, 55.2708] as [number, number] },
  { id: "tokyo-sydney", from: [35.6762, 139.6503] as [number, number], to: [-33.8688, 151.2093] as [number, number] },
  { id: "dubai-bangkok", from: [25.2048, 55.2708] as [number, number], to: [13.7563, 100.5018] as [number, number] },
];

export function Hero({ onSearch, isLoading }: HeroProps) {
  const [query, setQuery] = useState('');
  const [factIndex, setFactIndex] = useState(0);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const globePhiRef = useRef(0);
  const globeThetaRef = useRef(0.18);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isLoading) {
      setFactIndex(Math.floor(Math.random() * funFacts.length));
      interval = setInterval(() => {
        setFactIndex((prev) => (prev + 1) % funFacts.length);
      }, 3500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  useEffect(() => {
    const cycle = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % placeholderCountries.length);
    }, 2500);
    return () => clearInterval(cycle);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="relative overflow-hidden bg-slate-950 text-white min-h-screen flex flex-col">
      {/* Aurora shader background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <AnimatedShaderBackground />
        {/* Dark overlay so text stays crisp */}
        <div className="absolute inset-0 bg-slate-900/60" />
      </div>

      {/* Main hero content */}
      <div className="relative flex-1 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Left: Text + Search */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="flex flex-col items-start"
          >
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-400/20 rounded-full px-4 py-1.5 mb-6 text-sm text-blue-300 font-medium">
              <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
              Your AI-powered travel companion
            </div>

            <h1 className="text-5xl sm:text-6xl xl:text-7xl font-bold tracking-tight mb-5 leading-[1.05]">
              Discover the<br />
              World with{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">
                Voya
              </span>
            </h1>

            <p className="text-lg text-slate-400 mb-8 max-w-lg leading-relaxed">
              Explore any country instantly — geography, culture, food, attractions, local phrases, travel costs, and a personalized day-by-day itinerary.
            </p>

            {/* Search bar — frosted glass */}
            <form onSubmit={handleSubmit} className="w-full max-w-xl">
              <div className="flex items-center gap-3 bg-white/10 hover:bg-white/[0.13] focus-within:bg-white/[0.13] backdrop-blur-md border border-white/15 focus-within:border-white/30 rounded-2xl px-4 h-14 transition-all duration-200">
                <Search size={18} className="text-white/40 shrink-0" />
                <div className="relative flex-1 h-full flex items-center overflow-hidden">
                  {!query && (
                    <div className="absolute inset-0 flex items-center pointer-events-none overflow-hidden">
                      <span className="text-white/40 text-base whitespace-nowrap mr-1">Try</span>
                      <div className="relative flex-1 h-full flex items-center overflow-hidden">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={placeholderIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="absolute text-white/40 text-base whitespace-nowrap"
                          >
                            {placeholderCountries[placeholderIndex]}...
                          </motion.span>
                        </AnimatePresence>
                      </div>
                    </div>
                  )}
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="relative z-10 w-full h-full bg-transparent text-white text-base focus:outline-none caret-blue-400"
                    disabled={isLoading}
                    autoComplete="off"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !query.trim()}
                  className="shrink-0 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap text-sm"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Explore <Compass size={14} /></>
                  )}
                </button>
              </div>
            </form>

            {/* Top traveled destinations */}
            <div className="mt-5 flex flex-wrap gap-2">
              {topDestinations.map((dest) => (
                <button
                  key={dest.name}
                  onClick={() => { setQuery(dest.name); onSearch(dest.name); }}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  <span>{dest.flag}</span>
                  {dest.name}
                </button>
              ))}
            </div>

            {/* Loading fact pill */}
            <AnimatePresence>
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: 10, height: 0 }}
                  className="w-full max-w-xl mt-5 overflow-hidden"
                >
                  <div className="bg-blue-900/30 backdrop-blur border border-blue-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <div className="bg-blue-500/20 p-1.5 rounded-full shrink-0 mt-0.5">
                      <Lightbulb className="w-4 h-4 text-blue-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-blue-300 font-medium text-xs uppercase tracking-wider mb-1">Did you know?</h4>
                      <div className="relative h-10">
                        <AnimatePresence mode="wait">
                          <motion.p
                            key={factIndex}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                            transition={{ duration: 0.3 }}
                            className="absolute inset-0 text-slate-300 text-sm line-clamp-2"
                          >
                            <span className="mr-1.5">{funFacts[factIndex].flag}</span>
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

          {/* Right: Globe */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="flex justify-center lg:justify-end relative"
          >
            {/* Glow ring behind globe */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-[80%] aspect-square rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(59,130,246,0.18) 0%, rgba(99,102,241,0.10) 40%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />
            </div>
            <GlobeErrorBoundary>
              <div className="relative w-full max-w-[500px] lg:max-w-[600px]">
                <Globe
                  className="w-full drop-shadow-2xl"
                  dark={1}
                  mapBrightness={6}
                  baseColor={[0.05, 0.09, 0.22]}
                  glowColor={[0.15, 0.35, 0.85]}
                  markerColor={[0.4, 0.65, 1.0]}
                  arcColor={[0.3, 0.6, 1.0]}
                  speed={0.003}
                  theta={0.2}
                  diffuse={1.5}
                  markerSize={0.03}
                  arcWidth={0.8}
                  arcHeight={0.3}
                  markers={globeMarkers}
                  arcs={globeArcs}
                  phiRef={globePhiRef}
                  thetaRef={globeThetaRef}
                />
              </div>
            </GlobeErrorBoundary>
          </motion.div>

        </div>
      </div>

      {/* Fade-out to next section — no hard edge */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, #020617)' }}
      />
    </div>
  );
}
