import { motion } from 'framer-motion';

const steps = [
  {
    step: "01",
    title: "Start with a country",
    desc: "Choose somewhere you've always wondered about, or look up a place that's new to you.",
  },
  {
    step: "02",
    title: "Get to know the place",
    desc: "Explore its traditions, famous landmarks, local dishes, language, and everyday customs.",
  },
  {
    step: "03",
    title: "Follow your curiosity",
    desc: "Find a surprising fact, explore the map, or pick another country. It's free to explore, and sign-in is optional.",
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
              I built Voya to explore what gives each country its character.
            </motion.div>

            {[
              {
                label: "Hello.",
                text: "My name is Prem Paudel. I'm an Information Systems Management student at the University of Akron. I created Voya out of a curiosity about places: the landmarks people recognise, the traditions they grow up with, the food they share, and the everyday details you might otherwise miss.",
              },
              {
                label: "What made me curious.",
                text: "A photo or a place on a map can make you want to know more. I wanted a way to follow that curiosity: learn about a local tradition, find out why a landmark is famous, discover a popular dish, or try a few words in another language. Bringing those details together can make an unfamiliar country feel a little more familiar.",
              },
              {
                label: "Why I built Voya.",
                text: "Voya brings culture, famous places, local flavours, useful context, and surprising facts into one place. You can explore somewhere you've always wondered about or discover a country that's new to you. My goal is to make learning about the world feel approachable, visual, and worth coming back to. Exploring is free, and signing in is optional.",
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
                <span className="text-xs text-subtle">Founder · Voya</span>
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
