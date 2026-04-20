import { motion } from 'framer-motion';

const steps = [
  {
    step: "01",
    title: "Pick anywhere on Earth",
    desc: "Type a country name — any of the 195 we cover. No filters, no dropdowns, just type.",
  },
  {
    step: "02",
    title: "Your full brief, instantly",
    desc: "Culture, food, costs, phrases, safety, and a day-by-day itinerary appear in seconds. No account needed.",
  },
  {
    step: "03",
    title: "Go. You're ready.",
    desc: "Download your itinerary, brush up on local phrases, and travel knowing you're properly prepared.",
  },
];

export function AboutSection() {
  return (
    <>
      {/* ── Story Section ── */}
      <section id="about" className="bg-[#F7F3EE] overflow-hidden scroll-mt-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-[#e8dfd2]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 py-20 grid grid-cols-1 lg:grid-cols-[1fr_1.5fr] gap-16 items-start">

          {/* Left — identity card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:sticky lg:top-24 flex flex-col gap-5"
          >
            <div className="flex items-center gap-2.5">
              <div className="h-px w-8 bg-[#b07a3a]" />
              <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-[#b07a3a]">The story</span>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-[#1a1208] flex items-center justify-center">
              <span className="text-xl font-black text-[#b07a3a]">PP</span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-[#1a1208] tracking-tight leading-tight mb-1">Prem Paudel</h2>
              <p className="text-sm text-[#9c8470] font-medium leading-relaxed">
                Information Systems Management<br />
                University of Akron
              </p>
            </div>

            {/* How it works — nested in sticky left panel on desktop */}
            <div className="mt-4 flex flex-col gap-6 border-t border-[#e8dfd2] pt-6">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-[#b07a3a]">How it works</span>
              {steps.map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="flex gap-4 items-start"
                >
                  <span className="text-2xl font-black text-[#b07a3a]/25 leading-none shrink-0 w-8">{s.step}</span>
                  <div>
                    <div className="font-bold text-[#1a1208] text-sm mb-0.5">{s.title}</div>
                    <div className="text-xs text-[#9c8470] leading-relaxed">{s.desc}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right — story text */}
          <div className="flex flex-col gap-9">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
              className="text-2xl sm:text-3xl font-black text-[#1a1208] leading-snug tracking-tight border-l-4 border-[#b07a3a] pl-6"
            >
              I built this out of a deep love for travel, cultural exploration, and modern technology.
            </motion.div>

            {[
              {
                label: "Hello, traveller.",
                text: "My name is Prem Paudel. I'm an Information Systems Management student at the University of Akron, and Voya started as a question I kept asking myself: why is it still so hard to plan a trip well, without paying for a subscription?",
              },
              {
                label: "The problem I noticed.",
                text: "Today's AI tools are genuinely powerful — but they fall short for real-world travel planning unless you're on a paid plan. Hit a usage limit mid-itinerary. Generic routes that don't account for budget, culture, or practical costs. No guidance on local etiquette, what to pack, or what phrases actually matter. I felt that gap every time I tried to plan a trip.",
              },
              {
                label: "Why I built Voya.",
                text: "Voya — short for voyage — bridges the gap between technology and authentic travel. Whether you're building a personalised, well-structured travel route or simply exploring the languages and cultures of a country you've always been curious about, Voya gives you the practical insights and context you need to travel with confidence. No account. No subscription. Just type a country and go.",
              },
            ].map((para, i) => (
              <motion.div
                key={para.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="flex flex-col gap-2"
              >
                <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-[#b07a3a]">{para.label}</span>
                <p className="text-[#4a3828] text-base leading-relaxed">{para.text}</p>
              </motion.div>
            ))}

            {/* Signature */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center gap-4 pt-5 border-t border-[#e8dfd2]"
            >
              <div className="flex flex-col">
                <span className="font-black text-[#1a1208] text-sm">Prem Paudel</span>
                <span className="text-xs text-[#9c8470]">Founder · Voya</span>
              </div>
              <div className="flex-1 h-px bg-[#e8dfd2]" />
              <div className="flex items-center gap-4">
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
