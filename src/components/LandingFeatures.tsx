import ExpandingCardsDemo from './ui/demo';
import { motion } from 'framer-motion';
import { Map, Users, Landmark, Utensils, MessageCircle, DollarSign, Calendar, Sparkles } from 'lucide-react';

const features = [
  { icon: Users,         title: "Culture & Everyday Life",   description: "Read about local customs, family life, and what to know as a guest.", num: "01" },
  { icon: Landmark,      title: "Famous Places & Landmarks", description: "See where landmarks are and why people visit them.", num: "02" },
  { icon: Utensils,      title: "Food",      description: "Read about street food and dishes people make at home.", num: "03" },
  { icon: MessageCircle, title: "Language & Local Phrases",   description: "Learn how to say hello, thank someone, or ask for help.", num: "04" },
  { icon: Map,           title: "Geography & Nature",        description: "See where major cities are and what the landscape looks like.", num: "05" },
  { icon: Calendar,      title: "Seasons & Festivals",       description: "Find out what the weather is like by season and when festivals take place.", num: "06" },
  { icon: DollarSign,    title: "Local Costs & Currency",    description: "Check the local currency and estimated prices for meals and lodging.", num: "07" },
  { icon: Sparkles,      title: "Quick Facts",  description: "Read a few short facts about the country.", num: "08" },
];

export function LandingFeatures() {
  return (
    <section id="features" className="bg-canvas scroll-mt-8">

      {/* Divider rule */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px bg-surface-alt" />
      </div>

      {/* Stats row */}
      <div className="max-w-7xl mx-auto px-6 py-14 grid grid-cols-2 sm:grid-cols-4 gap-8">
        {[
          { val: "195+", label: "Countries to explore" },
          { val: "8",    label: "Topics to browse" },
          { val: "No",   label: "Account needed" },
          { val: "Free", label: "For everyone" },
        ].map(s => (
          <div key={s.label} className="flex flex-col">
            <span className="text-4xl font-black text-ink tracking-tight">{s.val}</span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-subtle mt-1">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6">
        <div className="h-px bg-surface-alt" />
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
            <div className="h-px w-8 bg-brand" />
            <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-accent">Country guides</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-ink leading-[1.05] max-w-2xl">
            What’s in<br />
            <span className="discovery-gradient">each guide?</span>
          </h2>
        </motion.div>

        {/* Feature list — editorial rows */}
        <div className="divide-y divide-line">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.04 }}
              className="group flex items-start gap-6 py-6 cursor-default"
            >
              <span className="text-[11px] font-black tracking-widest text-subtle w-6 shrink-0 pt-1">{feat.num}</span>
              <div className="w-9 h-9 rounded-xl bg-inverse flex items-center justify-center shrink-0 group-hover:bg-brand transition-colors duration-300">
                <feat.icon size={16} className="text-[#F7F3EE]" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-ink mb-1 text-base">{feat.title}</h3>
                <p className="text-muted text-sm leading-relaxed">{feat.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <ExpandingCardsDemo />

      {/* CTA strip */}
      <div className="bg-canvas">
        <div className="max-w-7xl mx-auto px-6 py-16 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-2xl font-black text-ink mb-1">Have another country in mind?</h3>
            <p className="text-muted text-sm">You can browse any guide without signing in.</p>
          </div>
          <a
            href="#country-search"
            onClick={e => { e.preventDefault(); document.getElementById('country-search')?.focus(); }}
            className="shrink-0 px-7 py-3.5 rounded-full bg-action text-action-ink font-bold text-sm hover:bg-action-hover transition-colors duration-300 flex items-center gap-2"
          >
            Find a country <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>

    </section>
  );
}
