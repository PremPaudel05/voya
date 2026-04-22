import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FACTS = [
  { emoji: '🗺️', fact: 'There are 195 countries in the world, each with a unique culture, language, and history.' },
  { emoji: '✈️', fact: 'The average commercial flight travels at around 900 km/h — fast enough to cross Europe in under 2 hours.' },
  { emoji: '🌊', fact: 'The Pacific Ocean is so vast that all of Earth\'s continents could fit inside it with room to spare.' },
  { emoji: '🏔️', fact: 'Mount Everest grows about 4mm taller every year as the Indian tectonic plate pushes into Asia.' },
  { emoji: '🌍', fact: 'More than half the world\'s population has never made a phone call, yet travel connects us all.' },
  { emoji: '🛂', fact: 'The world\'s most powerful passport (Japan) gives visa-free access to 193 destinations.' },
  { emoji: '🌐', fact: 'Antarctica is the only continent with no permanent human residents and no countries.' },
  { emoji: '🏝️', fact: 'Indonesia is the world\'s largest archipelago with over 17,000 islands.' },
  { emoji: '🚂', fact: 'The Trans-Siberian Railway is the longest railway in the world at 9,289 km across Russia.' },
  { emoji: '🌮', fact: 'Food is the world\'s most universal language — every culture has its own version of a dumpling.' },
  { emoji: '💱', fact: 'There are 180 currencies in the world, but only a handful are accepted in multiple countries.' },
  { emoji: '🦁', fact: 'Africa is the only continent that spans all four hemispheres of the globe.' },
];

const STEPS = [
  'Gathering destination data…',
  'Loading culture highlights…',
  'Finding top attractions…',
  'Preparing travel tips…',
  'Almost ready…',
];

export function LoadingAnimation() {
  const [factIndex, setFactIndex] = useState(() => Math.floor(Math.random() * FACTS.length));
  const [stepIndex, setStepIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setFactIndex(i => (i + 1) % FACTS.length), 3500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setStepIndex(i => Math.min(i + 1, STEPS.length - 1)), 1200);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setProgress(p => p >= 92 ? p : p + Math.random() * 6), 400);
    return () => clearInterval(t);
  }, []);

  const fact = FACTS[factIndex];

  return (
    <div className="w-full max-w-md mx-auto px-6 py-10 flex flex-col items-center gap-8 text-center">

      {/* Globe + title row */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex items-center justify-center">
          <motion.div
            className="text-5xl select-none"
            animate={{ scale: [1, 1.08, 1], rotate: [0, 8, -8, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}>
            🌍
          </motion.div>
          {/* Soft glow ring */}
          <div className="absolute w-20 h-20 rounded-full -z-10"
            style={{ background: 'radial-gradient(circle, rgba(176,122,58,0.12) 0%, transparent 70%)' }} />
        </div>

        <div>
          <h2 className="text-xl font-black text-[#1a1208] tracking-tight">Gathering travel intelligence</h2>
          <AnimatePresence mode="wait">
            <motion.p key={stepIndex}
              initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.25 }}
              className="text-xs font-medium text-[#9c8470] mt-1">
              {STEPS[stepIndex]}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="w-48 h-1 bg-[#e8dfd2] rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #b07a3a, #d4a05a)' }}
            animate={{ width: `${Math.min(progress, 92)}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }} />
        </div>
      </div>

      {/* Fun fact card — fixed height to prevent layout shift */}
      <div className="w-full">
        <p className="text-[10px] font-black text-[#b07a3a] uppercase tracking-widest mb-3">Did you know?</p>
        <div className="relative" style={{ height: 110 }}>
          <AnimatePresence mode="wait">
            <motion.div key={factIndex}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute inset-0 rounded-2xl p-4 text-left flex gap-3 items-start"
              style={{ background: '#fff', border: '1.5px solid #e8dfd2', boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
              <div className="w-1 self-stretch rounded-full shrink-0" style={{ background: '#b07a3a' }} />
              <div>
                <span className="text-xl block mb-1">{fact.emoji}</span>
                <p className="text-xs text-[#4a3828] leading-relaxed">{fact.fact}</p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-3">
          {FACTS.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{ width: i === factIndex ? 14 : 4, height: 4, background: i === factIndex ? '#b07a3a' : '#e8dfd2' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
