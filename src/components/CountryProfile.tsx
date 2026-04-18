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
  { id: 'overview',    label: 'Overview',    icon: Globe },
  { id: 'geography',   label: 'Geography',   icon: Mountain },
  { id: 'culture',     label: 'Culture',     icon: Users },
  { id: 'food',        label: 'Food',        icon: Utensils },
  { id: 'attractions', label: 'Attractions', icon: Camera },
  { id: 'map',         label: 'Map',         icon: Map },
  { id: 'phrases',     label: 'Phrases',     icon: MessageCircle },
  { id: 'budget',      label: 'Budget',      icon: CreditCard },
];

export function CountryProfile({ data }: CountryProfileProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [usdAmount, setUsdAmount] = useState<number | string>(100);
  const [factIdx, setFactIdx] = useState(0);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!data.funFacts?.length) return;
    const t = setInterval(() => setFactIdx(i => (i + 1) % data.funFacts.length), 4500);
    return () => clearInterval(t);
  }, [data.funFacts]);

  const scrollToTab = (id: string) => {
    setActiveTab(id);
    const el = sectionRefs.current[id];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 110;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    TABS.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveTab(id); },
        { rootMargin: '-25% 0px -65% 0px' }
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
    <div className="min-h-screen bg-[#f8f7f4] font-sans">

      {/* ── Hero Banner ───────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Subtle noise texture overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />

        <div className="relative max-w-5xl mx-auto px-6 py-16 flex flex-col md:flex-row items-center gap-10">
          {/* Big flag */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 180, damping: 16 }}
            className="shrink-0"
          >
            <div className="w-36 h-36 md:w-44 md:h-44 rounded-3xl flex items-center justify-center text-8xl md:text-9xl shadow-2xl bg-white/10 backdrop-blur border border-white/15 select-none">
              {data.overview.flagEmoji}
            </div>
          </motion.div>

          <div className="flex-1 text-center md:text-left">
            <motion.p
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-blue-400 text-sm font-semibold uppercase tracking-widest mb-2"
            >
              Travel Guide
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="text-5xl md:text-6xl font-black tracking-tight text-white mb-4 leading-none"
            >
              {data.mapData.countryQuery}
            </motion.h1>

            {/* Quick-stat pills */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="flex flex-wrap gap-2 justify-center md:justify-start mb-5"
            >
              {[
                { Icon: Map,   label: data.overview.capital,      color: 'bg-blue-500/20 text-blue-200 border-blue-400/25' },
                { Icon: Users, label: data.overview.population,   color: 'bg-emerald-500/20 text-emerald-200 border-emerald-400/25' },
                { Icon: Coins, label: data.overview.currencyCode, color: 'bg-amber-500/20 text-amber-200 border-amber-400/25' },
                { Icon: Clock, label: data.overview.timeZone,     color: 'bg-violet-500/20 text-violet-200 border-violet-400/25' },
              ].map(({ Icon, label, color }) => (
                <span key={label} className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${color}`}>
                  <Icon size={11} /> {label}
                </span>
              ))}
            </motion.div>

            {/* Fun-fact ticker */}
            {data.funFacts?.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.24 }}
                className="inline-flex items-start gap-2.5 bg-white/8 border border-white/12 rounded-2xl px-4 py-3 max-w-lg"
              >
                <Sparkles size={13} className="text-yellow-400 mt-0.5 shrink-0" />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={factIdx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-slate-300 leading-snug"
                  >
                    {data.funFacts[factIdx]}
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky Tab Bar ─────────────────────────────────────── */}
      <div className="sticky top-[49px] z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex gap-0.5 overflow-x-auto scrollbar-none py-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => scrollToTab(id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                ${activeTab === id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-16">

        {/* OVERVIEW */}
        <Section id="overview" refs={sectionRefs} title="Overview" icon={<Globe size={17} />}>
          <div className="grid md:grid-cols-2 gap-5">

            {/* Currency Converter */}
            {data.overview.exchangeRateToUSD > 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 bg-blue-50 rounded-xl"><ArrowRightLeft size={16} className="text-blue-600" /></div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Currency Converter</h3>
                    <p className="text-xs text-slate-500">1 USD = <span className="font-semibold text-blue-600">{data.overview.exchangeRateToUSD.toFixed(2)} {data.overview.currencyCode}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex-1">
                    <span className="px-3 text-slate-400 font-bold text-sm border-r border-slate-200 py-3">$</span>
                    <input type="number" value={usdAmount} onChange={e => setUsdAmount(e.target.value)} min="0"
                      className="flex-1 px-3 py-3 bg-transparent text-slate-900 font-semibold focus:outline-none text-sm" />
                  </div>
                  <ChevronRight size={16} className="text-slate-300 shrink-0" />
                  <div className="bg-blue-50 border border-blue-100 px-4 py-3 rounded-xl flex-1 text-sm">
                    <span className="font-bold text-blue-700">{converted}</span>
                    <span className="text-blue-400 ml-1 font-medium">{data.overview.currencyCode}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Best time to visit */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 bg-emerald-50 rounded-xl"><Calendar size={16} className="text-emerald-600" /></div>
                <h3 className="font-bold text-slate-900 text-sm">Best Time to Visit</h3>
              </div>
              <div className="space-y-3">
                <InfoRow icon="☀️" label="Best Months" value={data.bestTimeToVisit.bestMonths} />
                <InfoRow icon="🌧️" label="Rainy Season" value={data.bestTimeToVisit.rainySeason} />
                <InfoRow icon="💰" label="Budget Season" value={data.bestTimeToVisit.cheapestSeason} />
              </div>
            </div>

            {/* Festivals */}
            {data.bestTimeToVisit.majorFestivals?.length > 0 && (
              <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <Star size={16} className="text-amber-500" />
                  <h3 className="font-bold text-slate-900 text-sm">Major Festivals & Events</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.bestTimeToVisit.majorFestivals.map((f, i) => (
                    <span key={i} className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-semibold">
                      🎉 {f}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* GEOGRAPHY */}
        <Section id="geography" refs={sectionRefs} title="Geography & Climate" icon={<Mountain size={17} />}>
          <div className="grid md:grid-cols-2 gap-5">
            <Card>
              <CardLabel icon={<Thermometer size={14} className="text-sky-500" />} label="Climate" />
              <p className="text-slate-700 text-sm leading-relaxed">{data.geography.climate}</p>
            </Card>
            <Card>
              <CardLabel icon={<Mountain size={14} className="text-emerald-600" />} label="Landscape" />
              <p className="text-slate-700 text-sm leading-relaxed">{data.geography.landscape}</p>
            </Card>
            <Card>
              <CardLabel icon={<span className="text-base">🏙️</span>} label="Major Cities" />
              <div className="space-y-2">
                {data.geography.majorCities.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-700 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" /> {c}
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardLabel icon={<span className="text-base">⛰️</span>} label="Natural Landmarks" />
              <div className="space-y-2">
                {data.geography.naturalLandmarks.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-700 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" /> {l}
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </Section>

        {/* CULTURE */}
        <Section id="culture" refs={sectionRefs} title="Culture & Etiquette" icon={<Users size={17} />}>
          <div className="grid md:grid-cols-3 gap-5">
            <Card>
              <CardLabel icon={<span className="text-base">🎭</span>} label="Traditions" />
              <ul className="space-y-3">
                {data.culture.traditions.map((t, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                    <span className="text-blue-500 font-bold mt-0.5 shrink-0">✓</span> {t}
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <CardLabel icon={<span className="text-base">🤝</span>} label="Social Norms" />
              <ul className="space-y-3">
                {data.culture.socialNorms.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-700 text-sm">
                    <span className="text-violet-400 mt-0.5 shrink-0 font-bold">•</span> {n}
                  </li>
                ))}
              </ul>
            </Card>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                <CardLabel icon={<span className="text-base">📍</span>} label="Tourist Tips" />
                <ol className="space-y-3">
                  {data.culture.etiquetteTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-slate-700 text-sm">
                      <span className="bg-slate-900 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                      {tip}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <CardLabel icon={<span className="text-base">🙏</span>} label="Religion" />
                <p className="text-amber-900 text-sm leading-relaxed">{data.culture.religionOverview}</p>
              </div>
            </div>
          </div>
        </Section>

        {/* FOOD */}
        <Section id="food" refs={sectionRefs} title="Popular Foods" icon={<Utensils size={17} />}>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.foods.map((food, i) => (
              <motion.div key={i} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md hover:border-orange-200 transition-all cursor-default">
                <div className="text-3xl mb-3">
                  {['🍜','🥘','🍛','🥗','🍲','🫕','🥩','🍱','🌮','🥙'][i % 10]}
                </div>
                <h3 className="font-bold text-slate-900 mb-1.5 text-sm">{food.name}</h3>
                <p className="text-slate-500 text-xs leading-relaxed mb-3">{food.description}</p>
                <span className="inline-block text-orange-600 text-xs font-semibold bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">
                  ✨ {food.famousFor}
                </span>
              </motion.div>
            ))}
          </div>
        </Section>

        {/* ATTRACTIONS */}
        <Section id="attractions" refs={sectionRefs} title="Top Attractions" icon={<Camera size={17} />}>
          {data.attractions?.length > 0 ? (
            <div className="grid md:grid-cols-2 gap-5">
              {data.attractions.map((a, i) => (
                <motion.div key={i} whileHover={{ y: -3 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <AttractionCard attraction={a} countryName={data.mapData.countryQuery} />
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 italic text-sm">No attraction data available.</p>
          )}
        </Section>

        {/* MAP */}
        <Section id="map" refs={sectionRefs} title="Interactive Map" icon={<Map size={17} />}>
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <MapSection mapData={data.mapData} bestTimeToVisit={data.bestTimeToVisit} />
          </div>
        </Section>

        {/* PHRASES */}
        <Section id="phrases" refs={sectionRefs} title="Essential Travel Phrases" icon={<MessageCircle size={17} />}>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {data.phrases?.length > 0
              ? <PhraseTable phrases={data.phrases} languageCode={data.languageCode} />
              : <p className="text-slate-400 italic text-sm p-6">No phrase data available.</p>}
          </div>
        </Section>

        {/* BUDGET */}
        <Section id="budget" refs={sectionRefs} title="Average Travel Budget" icon={<CreditCard size={17} />}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Mid-range Hotel', price: data.prices.hotel,      icon: '🏨', bg: 'bg-blue-50',   border: 'border-blue-100',   label_c: 'text-blue-700' },
              { label: 'Restaurant Meal', price: data.prices.meal,       icon: '🍽️', bg: 'bg-orange-50', border: 'border-orange-100', label_c: 'text-orange-700' },
              { label: 'Street Food',     price: data.prices.streetFood, icon: '🌮', bg: 'bg-red-50',    border: 'border-red-100',    label_c: 'text-red-700' },
              { label: 'Coffee',          price: data.prices.coffee,     icon: '☕', bg: 'bg-amber-50',  border: 'border-amber-100',  label_c: 'text-amber-700' },
              { label: 'Public Transit',  price: data.prices.transport,  icon: '🚌', bg: 'bg-emerald-50',border: 'border-emerald-100',label_c: 'text-emerald-700' },
              { label: 'Taxi / km',       price: data.prices.taxi,       icon: '🚕', bg: 'bg-yellow-50', border: 'border-yellow-100', label_c: 'text-yellow-700' },
            ].map(({ label, price, icon, bg, border, label_c }) => (
              <motion.div key={label} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}
                className={`${bg} ${border} border rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all`}>
                <div className="text-3xl shrink-0">{icon}</div>
                <div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${label_c}`}>{label}</div>
                  <div className="font-extrabold text-slate-900 text-base">{price}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────── */

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
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-slate-900 rounded-xl text-white">{icon}</div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">{title}</h2>
        <div className="flex-1 h-px bg-slate-200" />
      </div>
      {children}
    </motion.div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      {children}
    </div>
  );
}

function CardLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-base mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-slate-800 text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
