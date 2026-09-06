import { motion } from 'framer-motion';
import { Map, Users, Landmark, Utensils, MessageCircle, DollarSign, Calendar, Sparkles } from 'lucide-react';

const features = [
  { icon: Users,         title: "Culture & Everyday Life",   description: "Traditions, social customs, and etiquette that offer a window into local life.", num: "01" },
  { icon: Landmark,      title: "Famous Places & Landmarks", description: "Recognisable sights, historic places, and what makes them worth knowing about.", num: "02" },
  { icon: Utensils,      title: "Food & Local Flavours",      description: "Popular dishes, local specialities, and the ingredients that make them distinctive.", num: "03" },
  { icon: MessageCircle, title: "Language & Local Phrases",   description: "Common expressions and pronunciation guides to help you try a few words.", num: "04" },
  { icon: Map,           title: "Geography & Nature",        description: "Landscapes, climates, major cities, and natural landmarks that shape a country.", num: "05" },
  { icon: Calendar,      title: "Seasons & Festivals",       description: "Seasonal changes and major celebrations that give each time of year its character.", num: "06" },
  { icon: DollarSign,    title: "Local Costs & Currency",    description: "Currency information and typical prices for food, coffee, transport, and stays.", num: "07" },
  { icon: Sparkles,      title: "Surprising Country Facts",  description: "Interesting details to spark a new question or give you something to share.", num: "08" },
];

export function LandingFeatures() {
  return (
    <section id="features" className="bg-[#F7F3EE] scroll-mt-8">

      {/* Divider rule */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px bg-[#e8dfd2]" />
      </div>

      {/* Stats row */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 sm:grid-cols-4 gap-8">
        {[
          { val: "195+", label: "Countries covered" },
          { val: "8",    label: "Insight categories" },
          { val: "0s",   label: "Signup required" },
          { val: "Free", label: "Always & forever" },
        ].map(s => (
          <div key={s.label} className="flex flex-col">
            <span className="text-4xl font-black text-[#1a1208] tracking-tight">{s.val}</span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#9c8470] mt-1">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px bg-[#e8dfd2]" />
      </div>

      {/* Features */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-14"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-px w-8 bg-[#b07a3a]" />
            <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#b07a3a]">What you get</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-[#1a1208] leading-[1.05] max-w-2xl">
            Get to know a country,<br />
            <span style={{
              backgroundImage: 'linear-gradient(135deg, #b07a3a 0%, #d4954a 50%, #c1622c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>one detail at a time.</span>
          </h2>
        </motion.div>

        {/* Feature list — editorial rows */}
        <div className="divide-y divide-[#e8dfd2]">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.04 }}
              className="group flex items-start gap-6 py-6 cursor-default"
            >
              <span className="text-[11px] font-black tracking-widest text-[#c8b89a] w-6 shrink-0 pt-1">{feat.num}</span>
              <div className="w-9 h-9 rounded-xl bg-[#1a1208] flex items-center justify-center shrink-0 group-hover:bg-[#b07a3a] transition-colors duration-300">
                <feat.icon size={16} className="text-[#F7F3EE]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-[#1a1208] mb-1 text-base">{feat.title}</h3>
                <p className="text-[#7a6650] text-sm leading-relaxed">{feat.description}</p>
              </div>
              <div className="hidden sm:flex items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[#b07a3a] text-xs font-semibold gap-1 pt-1 shrink-0">
                Try it <span>→</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* CTA strip */}
      <div className="bg-[#F7F3EE]">
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-[#1a1208] mb-1">Ready to explore?</h3>
            <p className="text-[#7a6650] text-sm">Free to explore. Sign-in is optional.</p>
          </div>
          <a
            href="#top"
            onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="shrink-0 px-7 py-3.5 rounded-full bg-[#1a1208] text-[#F7F3EE] font-bold text-sm hover:bg-[#b07a3a] transition-colors duration-300 flex items-center gap-2"
          >
            Start exploring <span>→</span>
          </a>
        </div>
      </div>

    </section>
  );
}
