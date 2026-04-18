import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CountryData } from '../types';
import { MapSection } from './MapSection';
import { PhraseTable } from './PhraseTable';
import { AttractionCard } from './AttractionCard';
import {
  Map, Users, Utensils, Camera, MessageCircle, CreditCard,
  ArrowRightLeft, Calendar, Thermometer, Mountain, Globe,
  ChevronRight, Star, Sparkles, Clock, Coins,
} from 'lucide-react';

interface CountryProfileProps { data: CountryData }

const TABS = [
  { id: 'overview',     label: 'Overview',     icon: Globe },
  { id: 'geography',    label: 'Geography',    icon: Mountain },
  { id: 'culture',      label: 'Culture',      icon: Users },
  { id: 'food',         label: 'Food',         icon: Utensils },
  { id: 'attractions',  label: 'Attractions',  icon: Camera },
  { id: 'map',          label: 'Map',          icon: Map },
  { id: 'phrases',      label: 'Phrases',      icon: MessageCircle },
  { id: 'budget',       label: 'Budget',       icon: CreditCard },
];

export function CountryProfile({ data }: CountryProfileProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [usdAmount, setUsdAmount] = useState<number | string>(100);
  const [factIdx, setFactIdx] = useState(0);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Cycle fun facts
  useEffect(() => {
    if (!data.funFacts?.length) return;
    const t = setInterval(() => setFactIdx(i => (i + 1) % data.funFacts.length), 4000);
    return () => clearInterval(t);
  }, [data.funFacts]);

  const scrollToTab = (id: string) => {
    setActiveTab(id);
    const el = sectionRefs.current[id];
    if (el) {
      const offset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  // Intersection observer to highlight active tab while scrolling
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    TABS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveTab(id); },
        { rootMargin: '-30% 0px -60% 0px' }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  const converted = Number(usdAmount)
    ? (Number(usdAmount) * data.overview.exchangeRateToUSD).toLocaleString(undefined, { maximumFractionDigits: 2 })
    : '0';

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">

      {/* ── Hero Banner ─────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border-b border-white/5">
        {/* subtle grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

        <div className="relative max-w-5xl mx-auto px-6 py-14 flex flex-col md:flex-row items-center gap-8">
          {/* Flag + name */}
          <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200 }}
            className="text-[100px] leading-none select-none drop-shadow-2xl">
            {data.overview.flagEmoji}
          </motion.div>
          <div className="flex-1 text-center md:text-left">
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
              {data.mapData.countryQuery}
            </motion.h1>

            {/* Quick stats row */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-3 justify-center md:justify-start mt-3 mb-5">
              {[
                { icon: Map,         label: data.overview.capital,     color: 'bg-blue-500/15 text-blue-300 border-blue-500/20' },
                { icon: Users,       label: data.overview.population,  color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' },
                { icon: Coins,       label: data.overview.currencyCode, color: 'bg-amber-500/15 text-amber-300 border-amber-500/20' },
                { icon: Clock,       label: data.overview.timeZone,    color: 'bg-purple-500/15 text-purple-300 border-purple-500/20' },
              ].map(({ icon: Icon, label, color }) => (
                <span key={label} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${color}`}>
                  <Icon size={12} /> {label}
                </span>
              ))}
            </motion.div>

            {/* Fun fact ticker */}
            {data.funFacts?.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                className="flex items-start gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3 max-w-lg">
                <Sparkles size={14} className="text-yellow-400 mt-0.5 shrink-0" />
                <AnimatePresence mode="wait">
                  <motion.p key={factIdx} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.35 }} className="text-sm text-slate-300 leading-snug">
                    {data.funFacts[factIdx]}
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky Tab Bar ──────────────────────────────── */}
      <div ref={tabBarRef} className="sticky top-[49px] z-40 bg-slate-950/90 backdrop-blur border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 flex gap-1 overflow-x-auto scrollbar-none py-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => scrollToTab(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                ${activeTab === id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-14">

        {/* OVERVIEW */}
        <Section id="overview" refs={sectionRefs} title="Overview" icon={<Globe size={18} />}>
          <div className="grid md:grid-cols-2 gap-6">

            {/* Currency Converter */}
            {data.overview.exchangeRateToUSD && (
              <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg"><ArrowRightLeft size={16} className="text-blue-400" /></div>
                  <h3 className="font-bold text-white">Currency Converter</h3>
                </div>
                <p className="text-xs text-slate-400 mb-4">1 USD = <span className="text-blue-300 font-semibold">{data.overview.exchangeRateToUSD.toFixed(2)} {data.overview.currencyCode}</span></p>
                <div className="flex items-center gap-3">
                  <div className="flex items-center bg-white/10 rounded-xl overflow-hidden flex-1">
                    <span className="px-3 text-slate-400 font-semibold text-sm">$</span>
                    <input type="number" value={usdAmount} onChange={e => setUsdAmount(e.target.value)} min="0"
                      className="flex-1 px-2 py-3 bg-transparent text-white font-semibold focus:outline-none text-sm" />
                  </div>
                  <ChevronRight size={16} className="text-slate-500 shrink-0" />
                  <div className="bg-white/10 px-4 py-3 rounded-xl font-bold text-blue-300 flex-1 text-sm">
                    {converted} <span className="text-slate-400 font-normal">{data.overview.currencyCode}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Best time to visit */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-emerald-500/20 rounded-lg"><Calendar size={16} className="text-emerald-400" /></div>
                <h3 className="font-bold text-white">Best Time to Visit</h3>
              </div>
              <div className="space-y-3">
                <InfoRow icon="☀️" label="Best Months" value={data.bestTimeToVisit.bestMonths} />
                <InfoRow icon="🌧️" label="Rainy Season" value={data.bestTimeToVisit.rainySeason} />
                <InfoRow icon="💰" label="Budget Season" value={data.bestTimeToVisit.cheapestSeason} />
              </div>
            </div>

            {/* Major festivals */}
            {data.bestTimeToVisit.majorFestivals?.length > 0 && (
              <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star size={16} className="text-yellow-400" />
                  <h3 className="font-bold text-white">Major Festivals & Events</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.bestTimeToVisit.majorFestivals.map((f, i) => (
                    <span key={i} className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 rounded-full text-xs font-medium">
                      🎉 {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* GEOGRAPHY */}
        <Section id="geography" refs={sectionRefs} title="Geography & Climate" icon={<Mountain size={18} />}>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Thermometer size={15} className="text-blue-400" />
                <h3 className="font-semibold text-white text-sm uppercase tracking-wide">Climate</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{data.geography.climate}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Mountain size={15} className="text-emerald-400" />
                <h3 className="font-semibold text-white text-sm uppercase tracking-wide">Landscape</h3>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{data.geography.landscape}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold text-white text-sm uppercase tracking-wide mb-3">🏙️ Major Cities</h3>
              <div className="space-y-2">
                {data.geography.majorCities.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" /> {c}
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold text-white text-sm uppercase tracking-wide mb-3">⛰️ Natural Landmarks</h3>
              <div className="space-y-2">
                {data.geography.naturalLandmarks.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-300 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" /> {l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* CULTURE */}
        <Section id="culture" refs={sectionRefs} title="Culture & Etiquette" icon={<Users size={18} />}>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold text-white text-sm uppercase tracking-wide mb-4">🎭 Traditions</h3>
              <ul className="space-y-3">
                {data.culture.traditions.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                    <span className="text-blue-400 font-bold mt-0.5 shrink-0">✓</span> {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-semibold text-white text-sm uppercase tracking-wide mb-4">🤝 Social Norms</h3>
              <ul className="space-y-3">
                {data.culture.socialNorms.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                    <span className="text-purple-400 mt-0.5 shrink-0">•</span> {n}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-4">
              <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6">
                <h3 className="font-semibold text-white text-sm uppercase tracking-wide mb-4">📍 Tourist Tips</h3>
                <ol className="space-y-3">
                  {data.culture.etiquetteTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0">{i + 1}</span>
                      {tip}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                <h3 className="font-semibold text-amber-300 text-xs uppercase tracking-wide mb-2">🙏 Religion</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{data.culture.religionOverview}</p>
              </div>
            </div>
          </div>
        </Section>

        {/* FOOD */}
        <Section id="food" refs={sectionRefs} title="Popular Foods" icon={<Utensils size={18} />}>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.foods.map((food, i) => (
              <motion.div key={i} whileHover={{ y: -4, scale: 1.02 }} transition={{ type: 'spring', stiffness: 300 }}
                className="bg-white/5 border border-white/10 hover:border-orange-500/30 rounded-2xl p-5 transition-colors group cursor-default">
                <div className="text-2xl mb-3">
                  {['🍜','🥘','🍛','🥗','🍲','🫕','🥩','🍱','🌮','🥙'][i % 10]}
                </div>
                <h3 className="font-bold text-white mb-2 text-sm">{food.name}</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-3">{food.description}</p>
                <span className="text-orange-400 text-xs font-semibold">✨ {food.famousFor}</span>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ATTRACTIONS */}
        <Section id="attractions" refs={sectionRefs} title="Top Attractions" icon={<Camera size={18} />}>
          {data.attractions?.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {data.attractions.map((a, i) => (
                <motion.div key={i} whileHover={{ scale: 1.02 }}>
                  <AttractionCard attraction={a} countryName={data.mapData.countryQuery} />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 italic text-sm">No attraction data available.</p>
          )}
        </Section>

        {/* MAP */}
        <Section id="map" refs={sectionRefs} title="Interactive Map" icon={<Map size={18} />}>
          <MapSection mapData={data.mapData} bestTimeToVisit={data.bestTimeToVisit} />
        </Section>

        {/* PHRASES */}
        <Section id="phrases" refs={sectionRefs} title="Essential Travel Phrases" icon={<MessageCircle size={18} />}>
          {data.phrases?.length > 0
            ? <PhraseTable phrases={data.phrases} languageCode={data.languageCode} />
            : <p className="text-slate-500 italic text-sm">No phrase data available.</p>}
        </Section>

        {/* BUDGET */}
        <Section id="budget" refs={sectionRefs} title="Average Travel Budget (USD)" icon={<CreditCard size={18} />}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Mid-range Hotel', price: data.prices.hotel,      icon: '🏨', accent: 'blue' },
              { label: 'Restaurant Meal', price: data.prices.meal,       icon: '🍽️', accent: 'orange' },
              { label: 'Street Food',     price: data.prices.streetFood, icon: '🌮', accent: 'red' },
              { label: 'Coffee',          price: data.prices.coffee,     icon: '☕', accent: 'amber' },
              { label: 'Public Transit',  price: data.prices.transport,  icon: '🚌', accent: 'green' },
              { label: 'Taxi / km',       price: data.prices.taxi,       icon: '🚕', accent: 'yellow' },
            ].map(({ label, price, icon, accent }) => (
              <motion.div key={label} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:border-white/20 transition-colors">
                <div className="text-3xl shrink-0">{icon}</div>
                <div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-1 text-${accent}-400`}>{label}</div>
                  <div className="font-bold text-white">{price}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────────── */

function Section({ id, refs, title, icon, children }: {
  id: string;
  refs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      ref={el => { refs.current[id] = el; }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-600/20 rounded-lg text-blue-400">{icon}</div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="flex-1 h-px bg-white/5" />
      </div>
      {children}
    </motion.div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-base shrink-0">{icon}</span>
      <div>
        <span className="text-slate-500 text-xs font-semibold uppercase tracking-wide">{label}</span>
        <p className="text-slate-300 text-sm">{value}</p>
      </div>
    </div>
  );
}
