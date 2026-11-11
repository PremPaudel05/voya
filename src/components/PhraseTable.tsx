import { useState, useEffect } from 'react';
import { Volume2, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PhraseTableProps {
  phrases: { english: string; local: string; phonetic: string }[];
  languageCode?: string;
}

export function PhraseTable({ phrases, languageCode }: PhraseTableProps) {
  const [topic, setTopic] = useState('Start here');
  const [showAll, setShowAll] = useState(false);
  const [audioMessage, setAudioMessage] = useState('');
  useEffect(() => () => { window.speechSynthesis?.cancel(); }, []);
  const groups: Record<string, RegExp> = { 'Start here': /hello|thank|excuse|how much|where|help/i, 'Food & shopping': /food|eat|water|vegetarian|allerg|bill|much|price|pay|menu/i, 'Getting around': /where|station|bus|train|taxi|airport|direction|hotel|toilet/i, 'Getting help': /help|doctor|hospital|police|lost|understand|english/i };
  const filtered = phrases.filter(p => groups[topic].test(p.english));
  const visible = showAll ? phrases : filtered.slice(0, 6);
  const [playing, setPlaying] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const playAudio = (text: string, idx: number) => {
    if (!('speechSynthesis' in window)) { setAudioMessage('Audio is not available in this browser.'); return; }
    setAudioMessage('');
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
      else { setPlaying(null); setAudioMessage('Your device has no voice for this language. Use the pronunciation guide below.'); return; }
    }
    utterance.onend = () => setPlaying(null);
    utterance.onerror = () => setPlaying(null);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">Start with a few useful phrases. Choose a situation to narrow the list.</p>
      <div className="flex flex-wrap gap-2">{Object.keys(groups).map(name => <button key={name} aria-pressed={!showAll && topic === name} onClick={() => { setTopic(name); setShowAll(false); setExpanded(null); }} className={`px-3 py-2 rounded-full border text-sm ${!showAll && topic === name ? 'bg-action text-action-ink border-action' : 'text-ink border-line'}`}>{name}</button>)}</div>
      {!visible.length && <p className="text-sm text-muted">No phrases for this situation in this guide yet.</p>}
      <p role="status" className="text-sm text-muted">{audioMessage}</p>
      {visible.map((phrase, idx) => {
        const isPlaying = playing === idx;
        const isExpanded = expanded === idx;
        return (
          <motion.div key={idx}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.25 }}
            className="rounded-2xl overflow-hidden transition-all"
            style={{
              background: 'var(--surface)',
              border: isExpanded ? '1.5px solid rgba(176,122,58,0.35)' : '1.5px solid #e8dfd2',
              boxShadow: isExpanded ? '0 4px 16px rgba(176,122,58,0.08)' : '0 1px 4px rgba(0,0,0,0.03)',
            }}>
            {/* Main row */}
            <div
              className="grid grid-cols-[1fr_44px] sm:grid-cols-[1fr_1fr_1fr_44px] gap-3 items-center px-4 py-3.5 cursor-pointer"
              role="button" tabIndex={0} aria-expanded={isExpanded}
              onKeyDown={e => { if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); setExpanded(isExpanded ? null : idx); } }}
              onClick={() => setExpanded(isExpanded ? null : idx)}>
              <span className="text-sm font-semibold text-ink">{phrase.english}</span>
              <span className="text-sm font-bold text-accent col-start-1 sm:col-start-auto">{phrase.local}</span>
              <span className="text-sm italic text-subtle col-start-1 sm:col-start-auto">{phrase.phonetic}</span>
              <button
                onClick={e => { e.stopPropagation(); playAudio(phrase.local, idx); }}
                className="col-start-2 row-start-1 sm:col-start-auto sm:row-start-auto w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0"
                style={{
                  background: isPlaying ? '#b07a3a' : '#F7F3EE',
                  color: isPlaying ? '#fff' : '#b07a3a',
                }}
                aria-label={`Listen to ${phrase.english}`} title="Listen">
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
                    <ChevronRight size={12} className="text-accent mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-accent mb-1">How to say it</p>
                      <p className="text-xs text-muted leading-relaxed">
                        Say <span className="font-bold text-ink">"{phrase.local}"</span> — pronounced <span className="italic">"{phrase.phonetic}"</span>. Tap the speaker to hear it aloud.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      <button className="text-sm text-accent underline py-2" onClick={() => { setShowAll(!showAll); setExpanded(null); }}>{showAll ? 'Show fewer phrases' : `Browse all ${phrases.length} phrases`}</button>
      {/* Footer tip */}
      <div className="flex items-center gap-2 pt-2 px-1">
        <Volume2 size={12} className="text-accent shrink-0" />
        <p className="text-[11px] text-subtle">Tap any row to expand · Tap <span className="text-accent font-semibold">listen</span> to hear the local pronunciation</p>
      </div>
    </div>
  );
}
