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
    const factTimer = setInterval(() => {
      setFactIndex(i => (i + 1) % FACTS.length);
    }, 3500);
    return () => clearInterval(factTimer);
  }, []);

  useEffect(() => {
    const stepTimer = setInterval(() => {
      setStepIndex(i => Math.min(i + 1, STEPS.length - 1));
    }, 1200);
    return () => clearInterval(stepTimer);
  }, []);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(p => {
        if (p >= 92) return p;
        return p + Math.random() * 6;
      });
    }, 400);
    return () => clearInterval(progressTimer);
  }, []);

  const fact = FACTS[factIndex];

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center w-full max-w-lg mx-auto gap-10">

      {/* Animated globe ring */}
      <div className="relative flex items-center justify-center">
        {/* Outer rotating ring */}
        <motion.div
          className="absolute w-28 h-28 rounded-full"
          style={{ border: '2px dashed rgba(176,122,58,0.3)' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        />
        {/* Middle ring */}
        <motion.div
          className="absolute w-20 h-20 rounded-full"
          style={{ border: '1.5px solid rgba(176,122,58,0.15)' }}
          animate={{ rotate: -360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
        />
        {/* Center icon */}
        <motion.div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl relative z-10"
          style={{ background: 'linear-gradient(135deg, #1a1208 0%, #2d1f0e 100%)', boxShadow: '0 8px 32px rgba(176,122,58,0.25)' }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          🌍
        </motion.div>

        {/* Orbiting dot */}
        <motion.div
          className="absolute w-3 h-3 rounded-full"
          style={{ background: '#b07a3a', top: '50%', left: '50%', marginTop: -6, marginLeft: -6, transformOrigin: '6px 56px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        />
      </div>

      {/* Title + step */}
      <div>
        <h2 className="text-2xl font-black text-[#1a1208] mb-2 tracking-tight">
          Gathering travel intelligence
        </h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={stepIndex}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.3 }}
            className="text-sm font-medium text-[#9c8470]"
          >
            {STEPS[stepIndex]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs">
        <div className="h-1.5 bg-[#e8dfd2] rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #b07a3a, #d4a05a)' }}
            animate={{ width: `${Math.min(progress, 92)}%` }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Fun fact card */}
      <div className="w-full max-w-sm">
        <p className="text-[10px] font-black text-[#b07a3a] uppercase tracking-widest mb-3">Did you know?</p>
        <AnimatePresence mode="wait">
          <motion.div
            key={factIndex}
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="rounded-2xl p-5 text-left relative overflow-hidden"
            style={{ background: '#fff', border: '1.5px solid #e8dfd2', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
          >
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: '#b07a3a' }} />
            <div className="pl-3">
              <span className="text-2xl mb-2 block">{fact.emoji}</span>
              <p className="text-sm text-[#4a3828] leading-relaxed">{fact.fact}</p>
            </div>
          </motion.div>
        </AnimatePresence>
        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-4">
          {FACTS.map((_, i) => (
            <div key={i} className="rounded-full transition-all duration-300"
              style={{
                width: i === factIndex ? 16 : 5,
                height: 5,
                background: i === factIndex ? '#b07a3a' : '#e8dfd2',
              }} />
          ))}
        </div>
      </div>

    </div>
  );
}
