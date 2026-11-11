import { motion } from 'framer-motion';

const steps = [
  {
    step: "01",
    title: "Start with a country",
    desc: "Type a country name or choose one below the search bar.",
  },
  {
    step: "02",
    title: "Read the guide",
    desc: "Pick a topic like food, landmarks, or local phrases.",
  },
  {
    step: "03",
    title: "Look around the map",
    desc: "Find major cities and regions, or search for another country.",
  },
];

export function AboutSection() {
  return (
    <>
      {/* ── Story Section ── */}
      <section id="about" className="bg-canvas overflow-hidden scroll-mt-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="h-px bg-surface-alt" />
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
              <div className="h-px w-8 bg-brand" />
              <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-accent">The story</span>
            </div>

            <div className="w-16 h-16 rounded-2xl bg-inverse flex items-center justify-center">
              <span className="text-xl font-black text-accent">PP</span>
            </div>

            <div>
              <h2 className="text-2xl font-black text-ink tracking-tight leading-tight mb-1">Prem Paudel</h2>
              <p className="text-sm text-subtle font-medium leading-relaxed">
                Information Systems Management<br />
                University of Akron
              </p>
            </div>

            {/* How it works — nested in sticky left panel on desktop */}
            <div className="mt-4 flex flex-col gap-6 border-t border-line pt-6">
              <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-accent">How it works</span>
              {steps.map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, x: -12 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                  className="flex gap-4 items-start"
                >
                  <span className="text-2xl font-black text-subtle leading-none shrink-0 w-8">{s.step}</span>
                  <div>
                    <div className="font-bold text-ink text-sm mb-0.5">{s.title}</div>
                    <div className="text-xs text-subtle leading-relaxed">{s.desc}</div>
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
              className="text-2xl sm:text-3xl font-black text-ink leading-snug tracking-tight border-l-4 border-accent pl-6"
            >
              I built Voya for the questions a map can’t answer.
            </motion.div>

            {[
              {
                label: "About me",
                text: "I’m Prem Paudel, an Information Systems Management student at the University of Akron. Voya is a side project where I’ve been learning how to build a website, connect it to a backend, and get it online.",
              },
              {
                label: "Where the idea came from",
                text: "Seeing a place on a map makes me wonder what it’s like to live there. What do people eat at home? Which holidays do they look forward to? I wanted one place to start looking up those answers.",
              },
              {
                label: "What you can do here",
                text: "Search for a country and jump to whatever you want to read about. You can browse for free without an account. If you’re planning a trip, use the guide to make a list of things to check before you book.",
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
                <span className="text-[11px] font-bold tracking-[0.18em] uppercase text-accent">{para.label}</span>
                <p className="text-muted text-base leading-relaxed">{para.text}</p>
              </motion.div>
            ))}

            {/* Signature */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex items-center gap-4 pt-5 border-t border-line"
            >
              <div className="flex flex-col">
                <span className="font-black text-ink text-sm">Prem Paudel</span>
                <span className="text-xs text-subtle">Voya</span>
              </div>
              <div className="flex-1 h-px bg-surface-alt" />
              <div className="flex items-center gap-4">
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  );
}
