import { motion } from 'framer-motion';
import { Map, Utensils, MessageCircle, DollarSign, Calendar, ShieldCheck, Luggage, Sparkles } from 'lucide-react';

const features = [
  { icon: Map,           title: "Geography & Culture",     description: "History, climate, customs, and everything you need before you land.",          num: "01" },
  { icon: Utensils,      title: "Food & Cuisine",          description: "Must-try dishes, street food gems, dining etiquette, and local flavours.",      num: "02" },
  { icon: MessageCircle, title: "Local Phrases",           description: "Essential phrases with pronunciation so you can connect like a local.",          num: "03" },
  { icon: DollarSign,    title: "Travel Costs",            description: "Real budget breakdowns: stay, eat, move, and experience, for every budget.",    num: "04" },
  { icon: Calendar,      title: "Day-by-Day Itinerary",    description: "A personalised trip plan tuned to your duration, style, and budget.",           num: "05" },
  { icon: ShieldCheck,   title: "Safety Advice",           description: "Up-to-date safety tips, health info, emergency contacts, and travel warnings.",  num: "06" },
  { icon: Luggage,       title: "Packing Lists",           description: "Smart packing picks tailored to your destination's climate and culture.",         num: "07" },
  { icon: Sparkles,      title: "Hidden Gems & Facts",     description: "Surprising stories and off-the-beaten-path finds that make trips unforgettable.", num: "08" },
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
            Everything a traveller needs,<br />
            <span style={{
              backgroundImage: 'linear-gradient(135deg, #b07a3a 0%, #d4954a 50%, #c1622c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>in one search.</span>
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
            <p className="text-[#7a6650] text-sm">No account. No cost. Just type and go.</p>
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
