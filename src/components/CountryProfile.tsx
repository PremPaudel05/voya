import { useState } from 'react';
import { motion } from 'framer-motion';
import type { CountryData } from "../types";
import { ExpandableCard } from './ExpandableCard';
import { MapSection } from './MapSection';
import { PhraseTable } from './PhraseTable';
import { AttractionCard } from './AttractionCard';
import {
  Map,
  Users,
  Utensils,
  Camera,
  MessageCircle,
  CreditCard,
  ArrowRightLeft,
  DollarSign,
  Calendar,
  MapPin,
} from 'lucide-react';
interface CountryProfileProps {
  data: CountryData;
}

export function CountryProfile({ data }: CountryProfileProps) {
  const [usdAmount, setUsdAmount] = useState<number | string>(100);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-b from-slate-50 to-white"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header with gradient background */}
      <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400 text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="text-8xl mb-6 inline-block"
          >
            {data.overview.flagEmoji}
          </motion.div>
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            {data.mapData.countryQuery}
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            Your complete travel guide to discover culture, attractions, and essential local insights.
          </p>
        </div>
      </motion.div>

      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Quick Info Cards */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow border border-slate-100">
            <div className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
              <MapPin size={16} className="text-blue-600" />
              Capital
            </div>
            <div className="text-2xl font-bold text-slate-900">{data.overview.capital}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow border border-slate-100">
            <div className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
              <Users size={16} className="text-emerald-600" />
              Population
            </div>
            <div className="text-2xl font-bold text-slate-900">{data.overview.population}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow border border-slate-100">
            <div className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
              <DollarSign size={16} className="text-amber-600" />
              Currency
            </div>
            <div className="text-xl font-bold text-slate-900">{data.overview.currencyCode}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-xl transition-shadow border border-slate-100">
            <div className="text-slate-500 text-sm font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
              <Calendar size={16} className="text-purple-600" />
              Timezone
            </div>
            <div className="text-lg font-bold text-slate-900 truncate">{data.overview.timeZone}</div>
          </div>
        </motion.div>

        {/* Currency Converter */}
        {data.overview.exchangeRateToUSD && data.overview.currencyCode && (
          <motion.div variants={itemVariants} className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-3xl p-6 border border-blue-200 shadow-md mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-600 p-2 rounded-full">
                <ArrowRightLeft size={20} className="text-white" />
              </div>
              <h3 className="text-xl font-bold text-blue-900">Quick Currency Converter</h3>
            </div>
            <p className="text-sm text-blue-700 mb-4">
              1 USD = <span className="font-semibold">{data.overview.exchangeRateToUSD.toFixed(2)}</span> {data.overview.currencyCode}
            </p>
            <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
              <div className="flex items-center bg-white rounded-xl overflow-hidden flex-1 min-w-[120px]">
                <span className="px-4 text-slate-600 font-semibold">$</span>
                <input 
                  type="number" 
                  value={usdAmount}
                  onChange={(e) => setUsdAmount(e.target.value)}
                  className="flex-1 px-3 py-3 focus:outline-none font-semibold text-slate-800"
                  min="0"
                />
              </div>
              <div className="text-slate-600 font-bold">=</div>
              <div className="bg-white px-5 py-3 rounded-xl font-bold text-slate-800 flex-1 min-w-[150px]">
                {Number(usdAmount) ? (Number(usdAmount) * data.overview.exchangeRateToUSD).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0'} <span className="text-blue-600">{data.overview.currencyCode}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* 2. Geography */}
        <motion.div variants={itemVariants}>
          <ExpandableCard title="Geography & Climate" icon={<Map />}>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-bold text-lg text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-blue-600">🌡️</span> Climate
                </h3>
                <p className="text-slate-600 leading-relaxed mb-6 bg-blue-50 p-4 rounded-lg">{data.geography.climate}</p>
                
                <h3 className="font-bold text-lg text-slate-800 mb-3 flex items-center gap-2">
                  <span className="text-green-600">🏔️</span> Landscape
                </h3>
                <p className="text-slate-600 leading-relaxed bg-green-50 p-4 rounded-lg">{data.geography.landscape}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
                  <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">🏙️ Major Cities</h3>
                  <ul className="space-y-2">
                    {(data.geography.majorCities.length ? data.geography.majorCities : ['Major city information is not available yet']).map((city, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-700 text-sm">
                        <div className="w-2 h-2 rounded-full bg-blue-600" />
                        {city}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 border border-emerald-200">
                  <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">⛰️ Landmarks</h3>
                  <ul className="space-y-2">
                    {(data.geography.naturalLandmarks.length ? data.geography.naturalLandmarks : ['Landmark information is not available yet']).map((landmark, i) => (
                      <li key={i} className="flex items-center gap-2 text-slate-700 text-sm">
                        <div className="w-2 h-2 rounded-full bg-emerald-600" />
                        {landmark}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </ExpandableCard>
        </motion.div>

        {/* 3. Culture & Etiquette */}
        <motion.div variants={itemVariants}>
          <ExpandableCard title="Culture & Etiquette" icon={<Users />}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div>
                  <h3 className="font-bold text-lg text-slate-800 mb-4 flex items-center gap-2">
                    🎭 Traditions & Social Norms
                  </h3>
                  {data.culture?.traditions?.length > 0 ? (
                    <ul className="space-y-3">
                      {data.culture.traditions.map((tradition, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="mt-1 text-blue-600 font-bold text-lg">✓</div>
                          <span className="text-slate-700 leading-relaxed">{tradition}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 italic">Tradition data is not available for this country yet.</p>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide text-slate-600">Social Norms</h3>
                  {data.culture?.socialNorms?.length > 0 ? (
                    <ul className="space-y-2">
                      {data.culture.socialNorms.map((norm, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                          <span className="text-blue-500 font-bold mt-0.5">•</span>
                          <span>{norm}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 italic text-sm">Social norm data is not available for this country yet.</p>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-2xl border border-blue-200 shadow-sm">
                  <h3 className="font-bold text-lg text-blue-900 mb-4 flex items-center gap-2">
                    <span className="text-xl">📍</span>
                    Etiquette Tips for Tourists
                  </h3>
                  {data.culture?.etiquetteTips?.length > 0 ? (
                    <ul className="space-y-3">
                      {data.culture.etiquetteTips.map((tip, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold flex-none">
                            {i + 1}
                          </div>
                          <span className="text-slate-700 pt-0.5 text-sm leading-relaxed">{tip}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-500 italic text-sm">Etiquette tip data is not available for this country yet.</p>
                  )}
                </div>

                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                  <h3 className="font-bold text-yellow-900 mb-2 flex items-center gap-2 text-sm uppercase tracking-wide">🙏 Religion</h3>
                  <p className="text-yellow-800 text-sm leading-relaxed">{data.culture?.religionOverview || 'Religion data is not available for this country yet.'}</p>
                </div>
              </div>
            </div>
          </ExpandableCard>
        </motion.div>

        {/* 4. Popular Foods */}
        <motion.div variants={itemVariants}>
          <ExpandableCard title="Popular Foods" icon={<Utensils />}>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(
                data.foods && data.foods.length > 0
                  ? data.foods
                  : [{ name: `${data.mapData.countryQuery} Local Specialty`, description: 'Popular traditional dish.', famousFor: 'Traditional flavors and heritage' }]
              ).map((food, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-all"
                >
                  <h3 className="font-bold text-base text-slate-900 mb-3">{food.name}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-4">{food.description}</p>
                  <div className="text-blue-600 text-sm font-semibold">✨ {food.famousFor}</div>
                </motion.div>
              ))}
            </div>
          </ExpandableCard>
        </motion.div>

        {/* 5. Top Tourist Attractions */}
        <motion.div variants={itemVariants}>
          <ExpandableCard title="Top Tourist Attractions" icon={<Camera />}>
            {data.attractions?.length > 0 ? (
              <div className="grid md:grid-cols-2 gap-6">
                {data.attractions.map((attraction, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.02 }}>
                    <AttractionCard attraction={attraction} countryName={data.mapData.countryQuery} />
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 italic">Attraction data is not available for this country yet.</p>
            )}
          </ExpandableCard>
        </motion.div>

        {/* 6. Map Integration */}
        <motion.div variants={itemVariants}>
          <MapSection mapData={data.mapData} bestTimeToVisit={data.bestTimeToVisit} />
        </motion.div>

        {/* 7. Essential Travel Phrases */}
        <motion.div variants={itemVariants}>
          <ExpandableCard title="Essential Travel Phrases" icon={<MessageCircle />}>
            {data.phrases?.length > 0 ? (
              <PhraseTable phrases={data.phrases} languageCode={data.languageCode} />
            ) : (
              <p className="text-slate-500 italic">Phrase data is not available for this country yet.</p>
            )}
          </ExpandableCard>
        </motion.div>

        {/* 8. Average Travel Prices */}
        <motion.div variants={itemVariants}>
          <ExpandableCard title="Average Travel Prices (USD)" icon={<CreditCard />}>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <PriceItem label="Mid-range Hotel" price={data.prices.hotel} icon="🏨" color="from-blue-50 to-blue-100 border-blue-200" />
              <PriceItem label="Restaurant Meal" price={data.prices.meal} icon="🍽️" color="from-orange-50 to-orange-100 border-orange-200" />
              <PriceItem label="Street Food" price={data.prices.streetFood} icon="🌮" color="from-red-50 to-red-100 border-red-200" />
              <PriceItem label="Coffee" price={data.prices.coffee} icon="☕" color="from-amber-50 to-amber-100 border-amber-200" />
              <PriceItem label="Public Transport" price={data.prices.transport} icon="🚌" color="from-green-50 to-green-100 border-green-200" />
              <PriceItem label="Taxi (per km)" price={data.prices.taxi} icon="🚕" color="from-yellow-50 to-yellow-100 border-yellow-200" />
            </div>
          </ExpandableCard>
        </motion.div>
      </div>
    </motion.div>
  );
}

function PriceItem({ label, price, icon, color }: { label: string, price: string, icon: string, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className={`bg-gradient-to-br ${color} rounded-2xl p-4 border flex items-center gap-4 shadow-sm hover:shadow-md transition-all`}
    >
      <div className="text-3xl">{icon}</div>
      <div className="flex-1">
        <div className="text-xs text-slate-600 font-bold uppercase tracking-wider mb-1">{label}</div>
        <div className="font-bold text-slate-800 text-lg">{price}</div>
      </div>
    </motion.div>
  );
}