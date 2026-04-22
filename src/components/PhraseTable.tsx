import { useState } from 'react';
import { Volume2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhraseTableProps {
  phrases: { english: string; local: string; phonetic: string }[];
  languageCode?: string;
}

export function PhraseTable({ phrases, languageCode }: PhraseTableProps) {
  const [playing, setPlaying] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const playAudio = (text: string, idx: number) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    setPlaying(idx);
    const cleanText = text.replace(/\s*\(.*?\)\s*$/, '').trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 0.8;
    if (languageCode) {
      utterance.lang = languageCode;
      const voices = window.speechSynthesis.getVoices();
      const match = voices.find(v => v.lang === languageCode)
        || voices.find(v => v.lang.startsWith(languageCode.split('-')[0]))
        || voices.find(v => v.lang.split('-')[0] === languageCode.split('-')[0]);
      if (match) utterance.voice = match;
    }
    utterance.onend = () => setPlaying(null);
    utterance.onerror = () => setPlaying(null);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="grid grid-cols-[1fr_1fr_1fr_44px] gap-3 px-4 pb-2">
        {['English', 'Local', 'Pronunciation', ''].map(h => (
          <span key={h} className="text-[10px] font-black uppercase tracking-widest text-[#9c8470]">{h}</span>
        ))}
      </div>

      {phrases.map((phrase, idx) => {
        const isPlaying = playing === idx;
        const isExpanded = expanded === idx;
        return (
          <motion.div key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.25 }}
            className="rounded-2xl overflow-hidden transition-all"
            style={{
              background: '#fff',
              border: isExpanded ? '1.5px solid rgba(176,122,58,0.35)' : '1.5px solid #e8dfd2',
              boxShadow: isExpanded ? '0 4px 16px rgba(176,122,58,0.08)' : '0 1px 4px rgba(0,0,0,0.03)',
            }}>
            {/* Main row */}
            <div
              className="grid grid-cols-[1fr_1fr_1fr_44px] gap-3 items-center px-4 py-3.5 cursor-pointer"
              onClick={() => setExpanded(isExpanded ? null : idx)}>
              <span className="text-sm font-semibold text-[#1a1208]">{phrase.english}</span>
              <span className="text-sm font-bold text-[#b07a3a]">{phrase.local}</span>
              <span className="text-sm italic text-[#9c8470]">{phrase.phonetic}</span>
              <button
                onClick={e => { e.stopPropagation(); playAudio(phrase.local, idx); }}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0"
                style={{
                  background: isPlaying ? '#b07a3a' : '#F7F3EE',
                  color: isPlaying ? '#fff' : '#b07a3a',
                }}
                title="Listen">
                <motion.div
                  animate={isPlaying ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                  transition={{ repeat: isPlaying ? Infinity : 0, duration: 0.6 }}>
                  <Volume2 size={15} />
                </motion.div>
              </button>
            </div>

            {/* Expanded tip row */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}>
                  <div className="px-4 pb-3.5 pt-1 flex items-start gap-2.5" style={{ borderTop: '1px dashed #e8dfd2' }}>
                    <ChevronRight size={12} className="text-[#b07a3a] mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#b07a3a] mb-1">How to say it</p>
                      <p className="text-xs text-[#6b5740] leading-relaxed">
                        Say <span className="font-bold text-[#1a1208]">"{phrase.local}"</span> — pronounced <span className="italic">"{phrase.phonetic}"</span>. Tap the speaker to hear it aloud.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* Footer tip */}
      <div className="flex items-center gap-2 pt-2 px-1">
        <Volume2 size={12} className="text-[#b07a3a] shrink-0" />
        <p className="text-[11px] text-[#9c8470]">Tap any row to expand · Tap <span className="text-[#b07a3a] font-semibold">listen</span> to hear the local pronunciation</p>
      </div>
    </div>
  );
}
