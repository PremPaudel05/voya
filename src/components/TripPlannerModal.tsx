import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Download, MapPin, Calendar, Wallet, Heart, Users, ChevronDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';

interface TripPlannerModalProps {
  countryName: string;
}

const BUDGET_OPTIONS = [
  { id: 'budget',   label: 'Budget',    desc: 'Hostels & street food', icon: '🎒' },
  { id: 'midrange', label: 'Mid-range', desc: 'Hotels & restaurants',  icon: '🏨' },
  { id: 'luxury',   label: 'Luxury',    desc: 'Fine dining & suites',  icon: '✨' },
];

const STYLE_OPTIONS = [
  { id: 'culture',    label: 'Culture & History', icon: '🏛️' },
  { id: 'adventure',  label: 'Adventure',         icon: '🧗' },
  { id: 'food',       label: 'Food & Cuisine',    icon: '🍜' },
  { id: 'relaxation', label: 'Relaxation',        icon: '🌅' },
  { id: 'nature',     label: 'Nature',            icon: '🌿' },
  { id: 'nightlife',  label: 'Nightlife',         icon: '🎶' },
];

const TRAVELER_OPTIONS = [
  { id: 'solo',    label: 'Solo',    icon: '🧍' },
  { id: 'couple',  label: 'Couple',  icon: '👫' },
  { id: 'family',  label: 'Family',  icon: '👨‍👩‍👧' },
  { id: 'friends', label: 'Friends', icon: '👯' },
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
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      const scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const scrollY = document.body.style.top;
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      if (scrollY) window.scrollTo(0, parseInt(scrollY || '0') * -1);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [open]);

  const [days, setDays] = useState(7);
  const [budget, setBudget] = useState('midrange');
  const [styles, setStyles] = useState<Set<string>>(new Set(['culture']));
  const [traveler, setTraveler] = useState('couple');
  const [notes, setNotes] = useState('');
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
    setExpandedDay(null);
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
        if (resp.status === 429) throw new Error('You\'ve reached the limit of 5 itineraries per hour. Please try again later.');
        throw new Error(errJson.error || `Server error ${resp.status}`);
      }
      const parsed: GeneratedPlan = await resp.json();
      if (!parsed.days?.length) throw new Error('Invalid response from AI');
      setPlan(parsed);
      setStep('result');
    } catch (e: any) {
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
    const setFill  = (h: string) => doc.setFillColor(...hex(h));
    const setDraw  = (h: string) => doc.setDrawColor(...hex(h));
    const checkPage = (needed = 10) => {
      if (y + needed > 272) { doc.addPage(); y = margin; }
    };

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
    const budgetLabel   = BUDGET_OPTIONS.find(b => b.id === budget)?.label || budget;
    const travelerLabel = TRAVELER_OPTIONS.find(t => t.id === traveler)?.label || traveler;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    setColor('#c8b89a');
    doc.text(`${travelerLabel}  ·  ${budgetLabel}  ·  ${[...styles].join(' · ')}`, margin, 46);
    doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 54);
    y = 72;

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
    introLines.forEach((line: string, i: number) => doc.text(line, margin + 7, y + 7 + i * 5));
    y += 26;

    plan.days.forEach(d => {
      checkPage(50);
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
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      setColor('#c8b89a');
      doc.text(d.estimatedCost, W - margin - doc.getTextWidth(d.estimatedCost) - 1, y + 7);
      y += 13;

      [
        { label: '🌅 MORNING',   text: d.morning,   bg: '#fffdf9' },
        { label: '☀️ AFTERNOON', text: d.afternoon, bg: '#faf7f2' },
        { label: '🌙 EVENING',   text: d.evening,   bg: '#f5f0e8' },
      ].forEach(block => {
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
        lines.forEach((line: string, i: number) => doc.text(line, margin + 3, y + 12 + i * 5));
        y += blockH + 2;
      });

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
      doc.text(d.tip.length > 110 ? d.tip.slice(0, 110) + '…' : d.tip, margin + 15, y + 5.8);
      y += 13;
    });

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
      if (col === 0) checkPage(7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      setColor('#4a3828');
      doc.text(`✓  ${item}`, margin + col * (contentW / 2) + 2, y + row * 6);
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
    doc.splitTextToSize(plan.bestAdvice, contentW - 10).forEach((l: string, i: number) => doc.text(l, margin + 6, y + 12 + i * 5));
    y += 22;

    checkPage(12);
    setFill('#f5f0e8');
    doc.rect(margin, y, contentW, 10, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    setColor('#6b5740');
    doc.text(plan.budgetSummary, margin + 4, y + 6.5);

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
              className="fixed inset-0 bg-black/70 backdrop-blur-lg z-[60]"
              onClick={() => setOpen(false)}
            />

            {/* Modal */}
            <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                className="w-full max-w-[560px] max-h-[90vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
                style={{ background: '#F7F3EE' }}
              >
                {/* Top accent bar */}
                <div className="h-1 w-full shrink-0" style={{ background: 'linear-gradient(90deg, #b07a3a 0%, #d4a05a 50%, #b07a3a 100%)' }} />

                {/* Header */}
                <div className="shrink-0 px-6 py-4 flex items-center justify-between"
                  style={{ background: 'linear-gradient(135deg, #1a1208 0%, #2d1f0e 100%)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(176,122,58,0.2)', border: '1px solid rgba(176,122,58,0.3)' }}>
                      <Sparkles size={16} className="text-[#b07a3a]" />
                    </div>
                    <div>
                      <h2 className="text-white font-black text-base tracking-tight">Plan My Trip</h2>
                      <p className="text-[#9c8470] text-xs mt-0.5">{countryName} — AI-generated itinerary</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all shrink-0"
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Progress indicator (form only) */}
                {step === 'form' && (
                  <div className="shrink-0 px-6 pt-4 pb-0 flex items-center gap-2">
                    {['Style', 'Group', 'Days', 'Details'].map((label, i) => (
                      <div key={label} className="flex items-center gap-2 flex-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center"
                            style={{ background: '#1a1208', color: '#b07a3a' }}>{i + 1}</div>
                          <span className="text-[9px] font-semibold text-[#9c8470] uppercase tracking-wide hidden sm:block">{label}</span>
                        </div>
                        {i < 3 && <div className="flex-1 h-px bg-[#e8dfd2]" />}
                      </div>
                    ))}
                  </div>
                )}

                {/* Body */}
                <div className="flex-1 overflow-y-auto">

                  {/* ── FORM ── */}
                  {step === 'form' && (
                    <div className="px-6 py-5 space-y-6">

                      {/* Travel style */}
                      <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-[#9c8470] uppercase tracking-widest mb-3">
                          <Heart size={11} className="text-[#b07a3a]" /> Travel Style
                          <span className="text-[#b07a3a] font-semibold normal-case tracking-normal">· pick multiple</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          {STYLE_OPTIONS.map(opt => {
                            const active = styles.has(opt.id);
                            return (
                              <button key={opt.id} onClick={() => toggleStyle(opt.id)}
                                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150"
                                style={{
                                  background: active ? '#1a1208' : '#fff',
                                  color: active ? '#F7F3EE' : '#6b5740',
                                  border: active ? '1.5px solid #b07a3a' : '1.5px solid #e8dfd2',
                                  boxShadow: active ? '0 2px 8px rgba(176,122,58,0.2)' : 'none',
                                }}>
                                <span className="text-base leading-none">{opt.icon}</span>
                                <span className="leading-tight">{opt.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Who's traveling */}
                      <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-[#9c8470] uppercase tracking-widest mb-3">
                          <Users size={11} className="text-[#b07a3a]" /> Who's Traveling?
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {TRAVELER_OPTIONS.map(opt => (
                            <button key={opt.id} onClick={() => setTraveler(opt.id)}
                              className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-semibold transition-all duration-150"
                              style={{
                                background: traveler === opt.id ? '#1a1208' : '#fff',
                                color: traveler === opt.id ? '#F7F3EE' : '#6b5740',
                                border: traveler === opt.id ? '1.5px solid #b07a3a' : '1.5px solid #e8dfd2',
                                boxShadow: traveler === opt.id ? '0 2px 8px rgba(176,122,58,0.2)' : 'none',
                              }}>
                              <span className="text-xl leading-none">{opt.icon}</span>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Days + Budget side by side */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Days */}
                        <div>
                          <label className="flex items-center gap-2 text-[10px] font-black text-[#9c8470] uppercase tracking-widest mb-3">
                            <Calendar size={11} className="text-[#b07a3a]" /> Duration
                          </label>
                          <div className="flex items-center gap-2 bg-white border border-[#e8dfd2] rounded-xl px-3 py-2.5">
                            <button onClick={() => setDays(d => Math.max(1, d - 1))}
                              className="w-7 h-7 rounded-lg bg-[#f5f0e8] hover:bg-[#1a1208] hover:text-white text-[#1a1208] font-bold text-base transition-all flex items-center justify-center">−</button>
                            <span className="text-xl font-black text-[#1a1208] flex-1 text-center">{days}</span>
                            <button onClick={() => setDays(d => Math.min(21, d + 1))}
                              className="w-7 h-7 rounded-lg bg-[#f5f0e8] hover:bg-[#1a1208] hover:text-white text-[#1a1208] font-bold text-base transition-all flex items-center justify-center">+</button>
                          </div>
                          <p className="text-[9px] text-[#9c8470] text-center mt-1.5">days (max 21)</p>
                        </div>

                        {/* Budget */}
                        <div>
                          <label className="flex items-center gap-2 text-[10px] font-black text-[#9c8470] uppercase tracking-widest mb-3">
                            <Wallet size={11} className="text-[#b07a3a]" /> Budget
                          </label>
                          <div className="flex flex-col gap-1.5">
                            {BUDGET_OPTIONS.map(opt => (
                              <button key={opt.id} onClick={() => setBudget(opt.id)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150"
                                style={{
                                  background: budget === opt.id ? '#1a1208' : '#fff',
                                  color: budget === opt.id ? '#F7F3EE' : '#6b5740',
                                  border: budget === opt.id ? '1.5px solid #b07a3a' : '1.5px solid #e8dfd2',
                                }}>
                                <span>{opt.icon}</span>
                                <span>{opt.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-[#9c8470] uppercase tracking-widest mb-3">
                          <MapPin size={11} className="text-[#b07a3a]" /> Special Requests
                          <span className="font-normal normal-case tracking-normal text-[#c8b89a]">· optional</span>
                        </label>
                        <textarea
                          value={notes}
                          onChange={e => setNotes(e.target.value)}
                          placeholder="e.g. We love hiking, avoid crowded tourist spots, interested in local markets..."
                          rows={3}
                          className="w-full px-4 py-3 bg-white border border-[#e8dfd2] rounded-xl text-sm text-[#1a1208] placeholder-[#c8b89a] focus:outline-none focus:border-[#b07a3a]/60 resize-none transition-colors"
                        />
                      </div>

                      {error && (
                        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                          <p className="text-red-600 text-xs font-medium">{error}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── GENERATING ── */}
                  {step === 'generating' && (
                    <div className="flex flex-col items-center justify-center py-20 px-6 gap-6">
                      <div className="relative">
                        <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                          style={{ background: 'rgba(176,122,58,0.1)', border: '1px solid rgba(176,122,58,0.2)' }}>
                          <Loader2 size={32} className="text-[#b07a3a] animate-spin" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[#b07a3a] flex items-center justify-center">
                          <Sparkles size={10} className="text-white" />
                        </div>
                      </div>
                      <div className="text-center">
                        <p className="font-black text-[#1a1208] text-lg">Crafting your itinerary…</p>
                        <p className="text-[#9c8470] text-sm mt-1.5">Building a personalised {days}-day plan for {countryName}</p>
                      </div>
                      <div className="flex gap-2 mt-1">
                        {[0, 1, 2, 3].map(i => (
                          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-[#b07a3a]"
                            animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                            transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── RESULT ── */}
                  {step === 'result' && plan && (
                    <div className="px-6 py-5 space-y-4">
                      {/* Intro */}
                      <div className="rounded-2xl p-4 relative overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, rgba(176,122,58,0.08) 0%, rgba(176,122,58,0.03) 100%)', border: '1px solid rgba(176,122,58,0.2)' }}>
                        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl" style={{ background: '#b07a3a' }} />
                        <p className="text-sm text-[#4a3828] leading-relaxed italic pl-2">{plan.intro}</p>
                      </div>

                      {/* Day cards */}
                      <div className="space-y-2">
                        {plan.days.map(d => {
                          const isOpen = expandedDay === d.day;
                          return (
                            <div key={d.day} className="rounded-2xl overflow-hidden transition-all duration-200"
                              style={{ background: '#fff', border: isOpen ? '1.5px solid rgba(176,122,58,0.4)' : '1.5px solid #e8dfd2', boxShadow: isOpen ? '0 4px 16px rgba(176,122,58,0.1)' : 'none' }}>
                              <button
                                onClick={() => setExpandedDay(isOpen ? null : d.day)}
                                className="w-full flex items-center gap-3 px-4 py-3 text-left">
                                <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shrink-0 transition-all"
                                  style={{ background: isOpen ? '#b07a3a' : '#1a1208', color: '#F7F3EE' }}>
                                  {d.day}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-[#1a1208] text-sm truncate">{d.title}</p>
                                  <p className="text-[10px] text-[#9c8470] mt-0.5">{d.estimatedCost}</p>
                                </div>
                                <ChevronDown size={15} className="text-[#9c8470] shrink-0 transition-transform duration-200"
                                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                              </button>

                              <AnimatePresence initial={false}>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                                    className="overflow-hidden">
                                    <div className="px-4 pb-4 pt-3 space-y-3" style={{ borderTop: '1px solid #e8dfd2' }}>
                                      {[
                                        { label: '🌅 Morning',   text: d.morning,   bg: '#fffdf9' },
                                        { label: '☀️ Afternoon', text: d.afternoon, bg: '#faf7f2' },
                                        { label: '🌙 Evening',   text: d.evening,   bg: '#f5f0e8' },
                                      ].map(block => (
                                        <div key={block.label} className="rounded-xl p-3" style={{ background: block.bg }}>
                                          <p className="text-[10px] font-black text-[#b07a3a] uppercase tracking-wider mb-1.5">{block.label}</p>
                                          <p className="text-sm text-[#4a3828] leading-relaxed">{block.text}</p>
                                        </div>
                                      ))}
                                      <div className="flex gap-2.5 rounded-xl px-3 py-2.5" style={{ background: '#fdf6ec', border: '1px solid rgba(176,122,58,0.2)' }}>
                                        <span className="text-[10px] font-black text-[#b07a3a] shrink-0 mt-0.5">TIP</span>
                                        <span className="text-xs text-[#6b5740] leading-relaxed">{d.tip}</span>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>

                      {/* Best advice */}
                      <div className="rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, #1a1208 0%, #2d1f0e 100%)' }}>
                        <p className="text-[10px] font-black text-[#b07a3a] uppercase tracking-widest mb-2">Best Advice</p>
                        <p className="text-sm text-[#c8b89a] leading-relaxed">{plan.bestAdvice}</p>
                      </div>

                      {/* Packing */}
                      <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1.5px solid #e8dfd2' }}>
                        <p className="text-[10px] font-black text-[#9c8470] uppercase tracking-widest mb-3">Packing Essentials</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {plan.packingEssentials.map(item => (
                            <div key={item} className="flex items-center gap-2 text-xs text-[#4a3828]">
                              <span className="w-4 h-4 rounded-full bg-[#b07a3a]/10 text-[#b07a3a] flex items-center justify-center text-[8px] font-black shrink-0">✓</span>
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Budget summary */}
                      <p className="text-xs text-[#9c8470] italic text-center pb-1">{plan.budgetSummary}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="shrink-0 px-6 py-4 flex items-center justify-between" style={{ borderTop: '1px solid #e8dfd2', background: '#F7F3EE' }}>
                  {step === 'result' ? (
                    <>
                      <button onClick={reset}
                        className="text-xs font-semibold text-[#9c8470] hover:text-[#1a1208] transition-colors flex items-center gap-1">
                        ← Regenerate
                      </button>
                      <button onClick={downloadPDF}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold transition-all shadow-sm hover:shadow-md"
                        style={{ background: '#b07a3a' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#8f6030')}
                        onMouseLeave={e => (e.currentTarget.style.background = '#b07a3a')}>
                        <Download size={14} /> Download PDF
                      </button>
                    </>
                  ) : step === 'form' ? (
                    <>
                      <span className="text-xs text-[#9c8470]">{days} days · {[...styles].length} interest{styles.size !== 1 ? 's' : ''}</span>
                      <button onClick={generate} disabled={styles.size === 0}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        style={{ background: '#1a1208' }}
                        onMouseEnter={e => { if (styles.size > 0) e.currentTarget.style.background = '#2d1f0e'; }}
                        onMouseLeave={e => (e.currentTarget.style.background = '#1a1208')}>
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
