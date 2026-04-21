import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Download, MapPin, Calendar, Wallet, Heart, Users, ChevronRight, Loader } from 'lucide-react';
import jsPDF from 'jspdf';

interface TripPlannerModalProps {
  countryName: string;
}

const BUDGET_OPTIONS = [
  { id: 'budget',    label: 'Budget',    desc: 'Hostels, street food, public transit', icon: '🎒' },
  { id: 'midrange',  label: 'Mid-range', desc: 'Hotels, restaurants, some splurges',   icon: '🏨' },
  { id: 'luxury',    label: 'Luxury',    desc: 'Top hotels, fine dining, private tours', icon: '✨' },
];

const STYLE_OPTIONS = [
  { id: 'culture',     label: 'Culture & History', icon: '🏛️' },
  { id: 'adventure',   label: 'Adventure',         icon: '🧗' },
  { id: 'food',        label: 'Food & Cuisine',    icon: '🍜' },
  { id: 'relaxation',  label: 'Relaxation',        icon: '🌅' },
  { id: 'nature',      label: 'Nature',            icon: '🌿' },
  { id: 'nightlife',   label: 'Nightlife',         icon: '🎶' },
];

const TRAVELER_OPTIONS = [
  { id: 'solo',    label: 'Solo',   icon: '🧍' },
  { id: 'couple',  label: 'Couple', icon: '👫' },
  { id: 'family',  label: 'Family', icon: '👨‍👩‍👧' },
  { id: 'friends', label: 'Friends',icon: '👯' },
];

interface ItineraryDay {
  day: number;
  title: string;
  morning: string;
  afternoon: string;
  evening: string;
  tip: string;
  estimatedCost: string;
}

interface GeneratedPlan {
  intro: string;
  days: ItineraryDay[];
  packingEssentials: string[];
  budgetSummary: string;
  bestAdvice: string;
}

export function TripPlannerModal({ countryName }: TripPlannerModalProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'generating' | 'result'>('form');

  // Form state
  const [days, setDays] = useState(7);
  const [budget, setBudget] = useState('midrange');
  const [styles, setStyles] = useState<Set<string>>(new Set(['culture']));
  const [traveler, setTraveler] = useState('couple');
  const [notes, setNotes] = useState('');

  // Result
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [error, setError] = useState('');

  const toggleStyle = (id: string) => {
    setStyles(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const reset = () => {
    setStep('form');
    setPlan(null);
    setError('');
  };

  const generate = async () => {
    if (styles.size === 0) return;
    setStep('generating');
    setError('');


    const params = new URLSearchParams({
      countryName,
      days: String(days),
      budget,
      styles: [...styles].join(','),
      traveler,
      notes: notes || '',
    });

    try {
      const resp = await fetch(`/api/plan?${params.toString()}`);
      if (!resp.ok) {
        const errJson = await resp.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error ${resp.status}`);
      }
      const parsed: GeneratedPlan = await resp.json();
      if (!parsed.days?.length) throw new Error('Invalid response from AI');
      setPlan(parsed);
      setStep('result');
    } catch (e: any) {
      console.error('Trip planner error:', e);
      setError(e?.message || 'Failed to generate plan. Please try again.');
      setStep('form');
    }
  };

  const downloadPDF = () => {
    if (!plan) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const W = 210;
    const margin = 16;
    const contentW = W - margin * 2;
    let y = 0;

    const hex = (h: string): [number, number, number] => [
      parseInt(h.slice(1, 3), 16),
      parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16),
    ];
    const setColor = (h: string) => doc.setTextColor(...hex(h));
    const setFill = (h: string) => doc.setFillColor(...hex(h));
    const setDraw = (h: string) => doc.setDrawColor(...hex(h));

    const checkPage = (needed = 10) => {
      if (y + needed > 272) { doc.addPage(); y = margin; }
    };


    // ── Cover ─────────────────────────────────────────────────────────────
    setFill('#1a1208');
    doc.rect(0, 0, W, 60, 'F');
    setFill('#b07a3a');
    doc.rect(0, 60, W, 2.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setColor('#b07a3a');
    doc.text('VOYA TRAVEL — PERSONALISED ITINERARY', margin, 18);

    doc.setFontSize(26);
    setColor('#F7F3EE');
    doc.text(`${days}-Day ${countryName} Trip`, margin, 36);

    const budgetLabel = BUDGET_OPTIONS.find(b => b.id === budget)?.label || budget;
    const travelerLabel = TRAVELER_OPTIONS.find(t => t.id === traveler)?.label || traveler;
    const styleLabel = [...styles].join(' · ');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setColor('#c8b89a');
    doc.text(`${travelerLabel}  ·  ${budgetLabel}  ·  ${styleLabel}`, margin, 46);
    doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 54);

    y = 72;

    // ── Intro ─────────────────────────────────────────────────────────────
    setFill('#faf7f3');
    doc.rect(margin, y, contentW, 18, 'F');
    setDraw('#e8dfd2');
    doc.setLineWidth(0.3);
    doc.rect(margin, y, contentW, 18, 'S');
    setFill('#b07a3a');
    doc.rect(margin, y, 3, 18, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    setColor('#4a3828');
    const introLines = doc.splitTextToSize(plan.intro, contentW - 10);
    introLines.forEach((line: string, i: number) => {
      doc.text(line, margin + 7, y + 7 + i * 5);
    });
    y += 26;

    // ── Days ──────────────────────────────────────────────────────────────
    plan.days.forEach((d) => {
      checkPage(50);

      // Day header bar
      setFill('#1a1208');
      doc.rect(margin, y, contentW, 10, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      setColor('#F7F3EE');
      doc.text(`DAY ${d.day}`, margin + 4, y + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      setColor('#b07a3a');
      doc.text(d.title, margin + 22, y + 7);

      // Cost badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      setColor('#c8b89a');
      doc.text(d.estimatedCost, W - margin - doc.getTextWidth(d.estimatedCost) - 1, y + 7);
      y += 13;

      // Time blocks
      const timeBlocks = [
        { label: '🌅 MORNING',   text: d.morning,   bg: '#fffdf9' },
        { label: '☀️ AFTERNOON', text: d.afternoon, bg: '#faf7f2' },
        { label: '🌙 EVENING',   text: d.evening,   bg: '#f5f0e8' },
      ];

      timeBlocks.forEach(block => {
        const lines = doc.splitTextToSize(block.text, contentW - 22);
        const blockH = Math.max(14, lines.length * 5 + 10);
        checkPage(blockH + 4);

        setFill(block.bg);
        doc.rect(margin, y, contentW, blockH, 'F');
        setDraw('#e8dfd2');
        doc.setLineWidth(0.2);
        doc.rect(margin, y, contentW, blockH, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        setColor('#b07a3a');
        doc.text(block.label, margin + 3, y + 6);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        setColor('#3a2a1a');
        lines.forEach((line: string, i: number) => {
          doc.text(line, margin + 3, y + 12 + i * 5);
        });
        y += blockH + 2;
      });

      // Tip
      checkPage(10);
      setFill('#b07a3a');
      doc.rect(margin, y, 2, 9, 'F');
      setFill('#fdf6ec');
      doc.rect(margin + 2, y, contentW - 2, 9, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      setColor('#7a4f1a');
      doc.text('TIP  ', margin + 5, y + 5.8);
      doc.setFont('helvetica', 'normal');
      setColor('#4a3828');
      const tipShort = d.tip.length > 110 ? d.tip.slice(0, 110) + '…' : d.tip;
      doc.text(tipShort, margin + 15, y + 5.8);
      y += 13;
    });

    // ── Packing & Advice ──────────────────────────────────────────────────
    checkPage(40);
    setFill('#1a1208');
    doc.rect(margin, y, contentW, 9, 'F');
    setFill('#b07a3a');
    doc.rect(margin, y, 3, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    setColor('#F7F3EE');
    doc.text('PACKING ESSENTIALS', margin + 6, y + 6.2);
    y += 13;

    const half = Math.ceil(plan.packingEssentials.length / 2);
    plan.packingEssentials.forEach((item, i) => {
      const col = i < half ? 0 : 1;
      const row = i < half ? i : i - half;
      const xOff = col * (contentW / 2);
      const yOff = row * 6;
      if (col === 0) checkPage(7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      setColor('#4a3828');
      doc.text(`✓  ${item}`, margin + xOff + 2, y + yOff);
    });
    y += half * 6 + 8;

    checkPage(20);
    setFill('#fdf6ec');
    doc.rect(margin, y, contentW, 18, 'F');
    setFill('#b07a3a');
    doc.rect(margin, y, 3, 18, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    setColor('#7a4f1a');
    doc.text('BEST ADVICE FOR THIS TRIP', margin + 6, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    setColor('#3a2a1a');
    const adviceLines = doc.splitTextToSize(plan.bestAdvice, contentW - 10);
    adviceLines.forEach((l: string, i: number) => doc.text(l, margin + 6, y + 12 + i * 5));
    y += 22;

    checkPage(12);
    setFill('#f5f0e8');
    doc.rect(margin, y, contentW, 10, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    setColor('#6b5740');
    doc.text(plan.budgetSummary, margin + 4, y + 6.5);
    y += 14;

    // ── Footer ────────────────────────────────────────────────────────────
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      setFill('#1a1208');
      doc.rect(0, 285, W, 12, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      setColor('#9c8470');
      doc.text('Generated by Voya Travel — voyatravel.vercel.app', margin, 292);
      doc.text(`Page ${i} of ${pageCount}`, W - margin - 16, 292);
    }

    doc.save(`${countryName.replace(/\s+/g, '_')}_${days}Day_Itinerary.pdf`);
  };

  return (
    <>
      <button
        onClick={() => { setOpen(true); reset(); }}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1208] hover:bg-[#2d1f0e] text-[#F7F3EE] text-xs font-semibold transition-colors shadow-sm"
      >
        <Sparkles size={13} className="text-[#b07a3a]" />
        Plan My Trip
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-md z-[60]"
              onClick={() => setOpen(false)}
            />

            {/* Modal — always centered */}
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className="w-full max-w-[540px] max-h-[88vh] bg-[#F7F3EE] rounded-2xl shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="bg-[#1a1208] px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#b07a3a]/20 rounded-xl">
                    <Sparkles size={15} className="text-[#b07a3a]" />
                  </div>
                  <div>
                    <h2 className="text-white font-black text-base">Plan My Trip</h2>
                    <p className="text-[#9c8470] text-xs mt-0.5">{countryName} — AI-generated itinerary</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-white transition-colors shrink-0 border border-white/20"
                >
                  <X size={16} strokeWidth={2.5} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto">

                {/* ── FORM ── */}
                {step === 'form' && (
                  <div className="px-6 py-5 space-y-6">

                    {/* Days */}
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-[#9c8470] uppercase tracking-wider mb-3">
                        <Calendar size={12} /> How many days?
                      </label>
                      <div className="flex items-center gap-3">
                        <button onClick={() => setDays(d => Math.max(1, d - 1))}
                          className="w-9 h-9 rounded-full border border-[#e8dfd2] bg-white text-[#1a1208] font-bold text-lg hover:bg-[#1a1208] hover:text-white transition-colors">−</button>
                        <span className="text-2xl font-black text-[#1a1208] w-8 text-center">{days}</span>
                        <button onClick={() => setDays(d => Math.min(21, d + 1))}
                          className="w-9 h-9 rounded-full border border-[#e8dfd2] bg-white text-[#1a1208] font-bold text-lg hover:bg-[#1a1208] hover:text-white transition-colors">+</button>
                        <span className="text-xs text-[#9c8470] ml-1">days (max 21)</span>
                      </div>
                    </div>

                    {/* Budget */}
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-[#9c8470] uppercase tracking-wider mb-3">
                        <Wallet size={12} /> Budget level
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {BUDGET_OPTIONS.map(opt => (
                          <button key={opt.id} onClick={() => setBudget(opt.id)}
                            className={`p-3 rounded-xl border text-left transition-all ${budget === opt.id ? 'bg-[#b07a3a]/10 border-[#b07a3a]/50' : 'bg-white border-[#e8dfd2]'}`}>
                            <div className="text-xl mb-1">{opt.icon}</div>
                            <div className="text-xs font-bold text-[#1a1208]">{opt.label}</div>
                            <div className="text-[9px] text-[#9c8470] leading-tight mt-0.5">{opt.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Travel style */}
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-[#9c8470] uppercase tracking-wider mb-3">
                        <Heart size={12} /> Travel style <span className="text-[#b07a3a]">(pick multiple)</span>
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {STYLE_OPTIONS.map(opt => {
                          const active = styles.has(opt.id);
                          return (
                            <button key={opt.id} onClick={() => toggleStyle(opt.id)}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${active ? 'bg-[#1a1208] text-[#F7F3EE] border-[#1a1208]' : 'bg-white border-[#e8dfd2] text-[#6b5740]'}`}>
                              <span>{opt.icon}</span>{opt.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Traveler type */}
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-[#9c8470] uppercase tracking-wider mb-3">
                        <Users size={12} /> Who's traveling?
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {TRAVELER_OPTIONS.map(opt => (
                          <button key={opt.id} onClick={() => setTraveler(opt.id)}
                            className={`flex flex-col items-center gap-1 py-3 rounded-xl border text-xs font-semibold transition-all ${traveler === opt.id ? 'bg-[#1a1208] text-[#F7F3EE] border-[#1a1208]' : 'bg-white border-[#e8dfd2] text-[#6b5740]'}`}>
                            <span className="text-xl">{opt.icon}</span>{opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="flex items-center gap-2 text-xs font-bold text-[#9c8470] uppercase tracking-wider mb-3">
                        <MapPin size={12} /> Any special requests? <span className="font-normal normal-case">(optional)</span>
                      </label>
                      <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="e.g. We love hiking, avoid crowded tourist spots, interested in local markets..."
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-[#e8dfd2] rounded-xl text-sm text-[#1a1208] placeholder-[#c8b89a] focus:outline-none focus:border-[#b07a3a]/50 resize-none"
                      />
                    </div>

                    {error && <p className="text-red-500 text-xs">{error}</p>}
                  </div>
                )}

                {/* ── GENERATING ── */}
                {step === 'generating' && (
                  <div className="flex flex-col items-center justify-center py-20 px-6 gap-5">
                    <div className="w-16 h-16 rounded-2xl bg-[#b07a3a]/10 flex items-center justify-center">
                      <Loader size={28} className="text-[#b07a3a] animate-spin" />
                    </div>
                    <div className="text-center">
                      <p className="font-black text-[#1a1208] text-lg">Planning your trip…</p>
                      <p className="text-[#9c8470] text-sm mt-1">Gemini is crafting your personalised {days}-day itinerary</p>
                    </div>
                    <div className="flex gap-1.5 mt-2">
                      {[0,1,2].map(i => (
                        <motion.div key={i} className="w-2 h-2 rounded-full bg-[#b07a3a]"
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                      ))}
                    </div>
                  </div>
                )}

                {/* ── RESULT preview ── */}
                {step === 'result' && plan && (
                  <div className="px-6 py-5 space-y-4">
                    {/* Intro */}
                    <div className="bg-[#b07a3a]/8 border border-[#b07a3a]/20 rounded-2xl p-4">
                      <p className="text-sm text-[#4a3828] leading-relaxed italic">{plan.intro}</p>
                    </div>

                    {/* Day cards */}
                    <div className="space-y-3">
                      {plan.days.map(d => (
                        <details key={d.day} className="bg-white border border-[#e8dfd2] rounded-2xl overflow-hidden group">
                          <summary className="flex items-center gap-3 px-4 py-3 cursor-pointer list-none">
                            <div className="w-8 h-8 rounded-xl bg-[#1a1208] text-[#F7F3EE] flex items-center justify-center text-xs font-black shrink-0">
                              {d.day}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-[#1a1208] text-sm truncate">{d.title}</p>
                              <p className="text-[10px] text-[#9c8470]">{d.estimatedCost}</p>
                            </div>
                            <ChevronRight size={14} className="text-[#9c8470] group-open:rotate-90 transition-transform shrink-0" />
                          </summary>
                          <div className="px-4 pb-4 space-y-3 border-t border-[#e8dfd2] pt-3">
                            {[
                              { label: '🌅 Morning',   text: d.morning },
                              { label: '☀️ Afternoon', text: d.afternoon },
                              { label: '🌙 Evening',   text: d.evening },
                            ].map(block => (
                              <div key={block.label}>
                                <p className="text-[10px] font-bold text-[#b07a3a] uppercase tracking-wider mb-1">{block.label}</p>
                                <p className="text-sm text-[#4a3828] leading-relaxed">{block.text}</p>
                              </div>
                            ))}
                            <div className="bg-[#fdf6ec] border border-[#b07a3a]/20 rounded-xl px-3 py-2 flex gap-2">
                              <span className="text-xs font-bold text-[#b07a3a] shrink-0">TIP</span>
                              <span className="text-xs text-[#6b5740]">{d.tip}</span>
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>

                    {/* Best advice */}
                    <div className="bg-[#1a1208] rounded-2xl p-4">
                      <p className="text-[10px] font-bold text-[#b07a3a] uppercase tracking-wider mb-2">Best Advice</p>
                      <p className="text-sm text-[#c8b89a] leading-relaxed">{plan.bestAdvice}</p>
                    </div>

                    {/* Budget summary */}
                    <p className="text-xs text-[#9c8470] italic text-center">{plan.budgetSummary}</p>
                  </div>
                )}
              </div>

              {/* Footer actions */}
              <div className="px-6 py-4 border-t border-[#e8dfd2] flex items-center justify-between shrink-0 bg-[#F7F3EE]">
                {step === 'result' ? (
                  <>
                    <button onClick={reset} className="text-xs font-semibold text-[#9c8470] hover:text-[#1a1208] transition-colors">
                      ← Regenerate
                    </button>
                    <button onClick={downloadPDF}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#b07a3a] hover:bg-[#8f6030] text-white text-sm font-semibold transition-colors shadow-sm">
                      <Download size={14} /> Download PDF
                    </button>
                  </>
                ) : step === 'form' ? (
                  <>
                    <span className="text-xs text-[#9c8470]">{days} days · {[...styles].length} interests</span>
                    <button onClick={generate} disabled={styles.size === 0}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1a1208] hover:bg-[#2d1f0e] text-white text-sm font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      <Sparkles size={14} className="text-[#b07a3a]" /> Generate Plan
                    </button>
                  </>
                ) : null}
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
