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
  const [flagError, setFlagError] = useState(false);
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

  // Build flag image URL from flag emoji (convert emoji to country code)
  const getFlagImageUrl = (flagEmoji: string) => {
    try {
      const codePoints = [...flagEmoji].map(c => c.codePointAt(0)! - 0x1F1E6 + 65);
      const code = codePoints.map(n => String.fromCharCode(n)).join('').toLowerCase();
      return `https://flagcdn.com/w160/${code}.png`;
    } catch {
      return null;
    }
  };

  const flagUrl = getFlagImageUrl(data.overview.flagEmoji);

  return (
    <div className="min-h-screen bg-[#F7F3EE] font-sans">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden bg-[#1a1208]">
        {/* Grain texture */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
        {/* Amber glow */}
        <div className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(176,122,58,0.18) 0%, transparent 70%)' }} />

        <div className="relative max-w-5xl mx-auto px-6 py-14 flex flex-col md:flex-row items-center gap-10">

          {/* Flag */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18 }}
            className="shrink-0"
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/10 bg-white/5 flex items-center justify-center select-none">
              {flagUrl && !flagError ? (
                <img
                  src={flagUrl}
                  alt={`${data.mapData.countryQuery} flag`}
                  className="w-full h-full object-cover"
                  onError={() => setFlagError(true)}
                />
              ) : (
                <span
                  className="text-7xl md:text-8xl"
                  style={{ fontFamily: '"Twemoji Mozilla","Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif' }}
                >{data.overview.flagEmoji}</span>
              )}
            </div>
          </motion.div>

          <div className="flex-1 text-center md:text-left">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 justify-center md:justify-start mb-3"
            >
              <div className="h-px w-6 bg-[#b07a3a]" />
              <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#b07a3a]">Travel Guide</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="text-5xl md:text-6xl font-black tracking-tight text-[#F7F3EE] mb-5 leading-none"
            >
              {data.mapData.countryQuery}
            </motion.h1>

            {/* Quick-stat pills */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="flex flex-wrap gap-2 justify-center md:justify-start mb-6"
            >
              {[
                { Icon: Map,   label: data.overview.capital,      color: 'bg-white/8 text-[#c8b89a] border-white/10' },
                { Icon: Users, label: data.overview.population,   color: 'bg-white/8 text-[#c8b89a] border-white/10' },
                { Icon: Coins, label: data.overview.currencyCode, color: 'bg-[#b07a3a]/20 text-[#d4954a] border-[#b07a3a]/25' },
                { Icon: Clock, label: data.overview.timeZone,     color: 'bg-white/8 text-[#c8b89a] border-white/10' },
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
                className="inline-flex items-start gap-2.5 bg-white/6 border border-white/10 rounded-2xl px-4 py-3 max-w-lg"
              >
                <Sparkles size={13} className="text-[#b07a3a] mt-0.5 shrink-0" />
                <AnimatePresence mode="wait">
                  <motion.p
                    key={factIdx}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-[#c8b89a] leading-snug"
                  >
                    {data.funFacts[factIdx]}
                  </motion.p>
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky Tab Bar ── */}
      <div className="sticky top-[49px] z-40 bg-[#F7F3EE]/95 backdrop-blur border-b border-[#e8dfd2] shadow-sm">
        <div className="max-w-5xl mx-auto px-4 flex gap-0.5 overflow-x-auto scrollbar-none py-2">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => scrollToTab(id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                ${activeTab === id
                  ? 'bg-[#1a1208] text-[#F7F3EE] shadow-sm'
                  : 'text-[#7a6650] hover:text-[#1a1208] hover:bg-[#eee7dc]'}`}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-16">

        {/* OVERVIEW */}
        <Section id="overview" refs={sectionRefs} title="Overview" icon={<Globe size={17} />}>
          <div className="grid md:grid-cols-2 gap-5">

            {/* Currency Converter */}
            {data.overview.exchangeRateToUSD > 0 && (
              <div className="bg-white rounded-2xl border border-[#e8dfd2] shadow-sm p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="p-2 bg-[#b07a3a]/10 rounded-xl"><ArrowRightLeft size={16} className="text-[#b07a3a]" /></div>
                  <div>
                    <h3 className="font-bold text-[#1a1208] text-sm">Currency Converter</h3>
                    <p className="text-xs text-[#9c8470]">1 USD = <span className="font-semibold text-[#b07a3a]">{data.overview.exchangeRateToUSD.toFixed(2)} {data.overview.currencyCode}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center bg-[#F7F3EE] border border-[#ddd4c4] rounded-xl overflow-hidden flex-1">
                    <span className="px-3 text-[#9c8470] font-bold text-sm border-r border-[#ddd4c4] py-3">$</span>
                    <input type="number" value={usdAmount} onChange={e => setUsdAmount(e.target.value)} min="0"
                      className="flex-1 px-3 py-3 bg-transparent text-[#1a1208] font-semibold focus:outline-none text-sm" />
                  </div>
                  <ChevronRight size={16} className="text-[#c8b89a] shrink-0" />
                  <div className="bg-[#b07a3a]/10 border border-[#b07a3a]/20 px-4 py-3 rounded-xl flex-1 text-sm">
                    <span className="font-bold text-[#b07a3a]">{converted}</span>
                    <span className="text-[#b07a3a]/70 ml-1 font-medium">{data.overview.currencyCode}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Best time to visit */}
            <div className="bg-white rounded-2xl border border-[#e8dfd2] shadow-sm p-6">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 bg-emerald-50 rounded-xl"><Calendar size={16} className="text-emerald-600" /></div>
                <h3 className="font-bold text-[#1a1208] text-sm">Best Time to Visit</h3>
              </div>
              <div className="space-y-3">
                <InfoRow icon="☀️" label="Best Months" value={data.bestTimeToVisit.bestMonths} />
                <InfoRow icon="🌧️" label="Rainy Season" value={data.bestTimeToVisit.rainySeason} />
                <InfoRow icon="💰" label="Budget Season" value={data.bestTimeToVisit.cheapestSeason} />
              </div>
            </div>

            {/* Festivals */}
            {data.bestTimeToVisit.majorFestivals?.length > 0 && (
              <div className="md:col-span-2 bg-white rounded-2xl border border-[#e8dfd2] shadow-sm p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <Star size={16} className="text-[#b07a3a]" />
                  <h3 className="font-bold text-[#1a1208] text-sm">Major Festivals & Events</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {data.bestTimeToVisit.majorFestivals.map((f, i) => (
                    <span key={i} className="px-3 py-1.5 bg-[#b07a3a]/10 border border-[#b07a3a]/20 text-[#7a4f1a] rounded-full text-xs font-semibold">
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
              <p className="text-[#4a3828] text-sm leading-relaxed">{data.geography.climate}</p>
            </Card>
            <Card>
              <CardLabel icon={<Mountain size={14} className="text-emerald-600" />} label="Landscape" />
              <p className="text-[#4a3828] text-sm leading-relaxed">{data.geography.landscape}</p>
            </Card>
            <Card>
              <CardLabel icon={<span className="text-base">🏙️</span>} label="Major Cities" />
              <div className="space-y-2">
                {data.geography.majorCities.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-[#4a3828] text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#b07a3a] shrink-0" /> {c}
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <CardLabel icon={<span className="text-base">⛰️</span>} label="Natural Landmarks" />
              <div className="space-y-2">
                {data.geography.naturalLandmarks.map((l, i) => (
                  <div key={i} className="flex items-center gap-2 text-[#4a3828] text-sm">
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
                  <li key={i} className="flex items-start gap-2 text-[#4a3828] text-sm">
                    <span className="text-[#b07a3a] font-bold mt-0.5 shrink-0">✓</span> {t}
                  </li>
                ))}
              </ul>
            </Card>
            <Card>
              <CardLabel icon={<span className="text-base">🤝</span>} label="Social Norms" />
              <ul className="space-y-3">
                {data.culture.socialNorms.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-[#4a3828] text-sm">
                    <span className="text-[#9c8470] mt-0.5 shrink-0 font-bold">•</span> {n}
                  </li>
                ))}
              </ul>
            </Card>
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-[#e8dfd2] shadow-sm p-5">
                <CardLabel icon={<span className="text-base">📍</span>} label="Tourist Tips" />
                <ol className="space-y-3">
                  {data.culture.etiquetteTips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 text-[#4a3828] text-sm">
                      <span className="bg-[#1a1208] text-[#F7F3EE] rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>
                      {tip}
                    </li>
                  ))}
                </ol>
              </div>
              <div className="bg-[#b07a3a]/8 border border-[#b07a3a]/20 rounded-2xl p-5">
                <CardLabel icon={<span className="text-base">🙏</span>} label="Religion" />
                <p className="text-[#4a3828] text-sm leading-relaxed">{data.culture.religionOverview}</p>
              </div>
            </div>
          </div>
        </Section>

        {/* FOOD */}
        <Section id="food" refs={sectionRefs} title="Popular Foods" icon={<Utensils size={17} />}>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {data.foods.map((food, i) => (
              <motion.div key={i} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}
                className="bg-white rounded-2xl border border-[#e8dfd2] shadow-sm p-5 hover:shadow-md hover:border-[#b07a3a]/30 transition-all cursor-default">
                <div className="text-3xl mb-3">
                  {['🍜','🥘','🍛','🥗','🍲','🫕','🥩','🍱','🌮','🥙'][i % 10]}
                </div>
                <h3 className="font-bold text-[#1a1208] mb-1.5 text-sm">{food.name}</h3>
                <p className="text-[#7a6650] text-xs leading-relaxed mb-3">{food.description}</p>
                <span className="inline-block text-[#7a4f1a] text-xs font-semibold bg-[#b07a3a]/10 border border-[#b07a3a]/20 px-2.5 py-1 rounded-full">
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
            <p className="text-[#9c8470] italic text-sm">No attraction data available.</p>
          )}
        </Section>

        {/* MAP */}
        <Section id="map" refs={sectionRefs} title="Interactive Map" icon={<Map size={17} />}>
          <div className="rounded-2xl overflow-hidden border border-[#e8dfd2] shadow-sm">
            <MapSection mapData={data.mapData} bestTimeToVisit={data.bestTimeToVisit} />
          </div>
        </Section>

        {/* PHRASES */}
        <Section id="phrases" refs={sectionRefs} title="Essential Travel Phrases" icon={<MessageCircle size={17} />}>
          <div className="bg-white rounded-2xl border border-[#e8dfd2] shadow-sm overflow-hidden">
            {data.phrases?.length > 0
              ? <PhraseTable phrases={data.phrases} languageCode={data.languageCode} />
              : <p className="text-[#9c8470] italic text-sm p-6">No phrase data available.</p>}
          </div>
        </Section>

        {/* BUDGET */}
        <Section id="budget" refs={sectionRefs} title="Average Travel Budget" icon={<CreditCard size={17} />}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Mid-range Hotel', price: data.prices.hotel,      icon: '🏨' },
              { label: 'Restaurant Meal', price: data.prices.meal,       icon: '🍽️' },
              { label: 'Street Food',     price: data.prices.streetFood, icon: '🌮' },
              { label: 'Coffee',          price: data.prices.coffee,     icon: '☕' },
              { label: 'Public Transit',  price: data.prices.transport,  icon: '🚌' },
              { label: 'Taxi / km',       price: data.prices.taxi,       icon: '🚕' },
            ].map(({ label, price, icon }) => (
              <motion.div key={label} whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}
                className="bg-white border border-[#e8dfd2] rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md hover:border-[#b07a3a]/30 transition-all">
                <div className="text-3xl shrink-0">{icon}</div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider mb-0.5 text-[#9c8470]">{label}</div>
                  <div className="font-extrabold text-[#1a1208] text-base">{price}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </Section>

      </div>
    </div>
  );
}

/* ── Helpers ── */

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
        <div className="p-2 bg-[#1a1208] rounded-xl text-[#F7F3EE]">{icon}</div>
        <h2 className="text-xl font-black text-[#1a1208] tracking-tight">{title}</h2>
        <div className="flex-1 h-px bg-[#e8dfd2]" />
      </div>
      {children}
    </motion.div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-[#e8dfd2] shadow-sm p-5">
      {children}
    </div>
  );
}

function CardLabel({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <span className="text-xs font-bold text-[#9c8470] uppercase tracking-wider">{label}</span>
    </div>
  );
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="text-base mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] font-bold text-[#9c8470] uppercase tracking-wider">{label}</p>
        <p className="text-[#1a1208] text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}
