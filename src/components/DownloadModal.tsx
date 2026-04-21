import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, FileText, Check } from 'lucide-react';
import jsPDF from 'jspdf';
import type { CountryData } from '../types';

interface DownloadModalProps {
  data: CountryData;
  countryName: string;
}

const SECTIONS = [
  { id: 'overview',     label: 'Overview',           desc: 'Capital, currency, timezone, population' },
  { id: 'bestTime',     label: 'Best Time to Visit', desc: 'Best months, seasons & major festivals' },
  { id: 'attractions',  label: 'Top Attractions',    desc: 'Famous landmarks & must-see places' },
  { id: 'phrases',      label: 'Essential Phrases',  desc: 'Local language phrases with pronunciation' },
  { id: 'budget',       label: 'Budget & Prices',    desc: 'Hotels, meals, transport costs' },
  { id: 'culture',      label: 'Culture & Etiquette', desc: 'Traditions, norms & tips' },
  { id: 'food',         label: 'Popular Foods',      desc: 'Must-try dishes & local cuisine' },
  { id: 'geography',    label: 'Geography & Climate', desc: 'Landscape, climate & major cities' },
];

export function DownloadModal({ data, countryName }: DownloadModalProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set(SECTIONS.map(s => s.id)));
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(SECTIONS.map(s => s.id)));
  const clearAll = () => setSelected(new Set());

  const generatePDF = async () => {
    setGenerating(true);
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const W = 210;
      const margin = 16;
      const contentW = W - margin * 2;
      let y = 0;

      // ── Helpers ──────────────────────────────────────────────────────────
      const checkPage = (needed = 10) => {
        if (y + needed > 272) { doc.addPage(); y = margin; }
      };

      const hex = (h: string) => {
        const r = parseInt(h.slice(1, 3), 16);
        const g = parseInt(h.slice(3, 5), 16);
        const b = parseInt(h.slice(5, 7), 16);
        return [r, g, b] as [number, number, number];
      };

      const setColor = (h: string) => doc.setTextColor(...hex(h));
      const setFill = (h: string) => doc.setFillColor(...hex(h));
      const setDraw = (h: string) => doc.setDrawColor(...hex(h));

      // ── Cover / Header ────────────────────────────────────────────────────
      setFill('#1a1208');
      doc.rect(0, 0, W, 52, 'F');

      // Amber accent bar
      setFill('#b07a3a');
      doc.rect(0, 52, W, 2, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      setColor('#b07a3a');
      doc.text('VOYA TRAVEL GUIDE', margin, 20);

      doc.setFontSize(28);
      setColor('#F7F3EE');
      doc.text(countryName.toUpperCase(), margin, 36);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setColor('#c8b89a');
      doc.text(`Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, margin, 47);

      y = 64;

      // ── Section renderer ─────────────────────────────────────────────────
      const sectionHeader = (title: string) => {
        checkPage(16);
        setFill('#F7F3EE');
        doc.rect(margin, y, contentW, 9, 'F');
        setFill('#b07a3a');
        doc.rect(margin, y, 3, 9, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        setColor('#1a1208');
        doc.text(title.toUpperCase(), margin + 6, y + 6.2);
        y += 13;
      };

      const bodyText = (text: string, indent = 0, color = '#4a3828') => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        setColor(color);
        const lines = doc.splitTextToSize(text, contentW - indent);
        lines.forEach((line: string) => {
          checkPage(5);
          doc.text(line, margin + indent, y);
          y += 4.8;
        });
      };

      const bulletRow = (label: string, value: string) => {
        checkPage(6);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        setColor('#b07a3a');
        doc.text('•', margin + 1, y);
        setColor('#1a1208');
        doc.text(label + ':', margin + 5, y);
        doc.setFont('helvetica', 'normal');
        setColor('#4a3828');
        const val = doc.splitTextToSize(value, contentW - 35);
        doc.text(val[0] || '', margin + 35, y);
        y += 5.2;
        if (val.length > 1) {
          val.slice(1).forEach((l: string) => {
            checkPage(5);
            doc.text(l, margin + 35, y);
            y += 4.8;
          });
        }
      };

      const divider = () => {
        checkPage(6);
        setDraw('#e8dfd2');
        doc.setLineWidth(0.3);
        doc.line(margin, y, margin + contentW, y);
        y += 5;
      };

      // ── Sections ─────────────────────────────────────────────────────────

      if (selected.has('overview')) {
        sectionHeader('Overview');
        bulletRow('Capital', data.overview.capital);
        bulletRow('Population', data.overview.population);
        bulletRow('Currency', `${data.overview.currency} (${data.overview.currencyCode})`);
        bulletRow('Timezone', data.overview.timeZone);
        bulletRow('Exchange Rate', `1 USD = ${data.overview.exchangeRateToUSD.toFixed(2)} ${data.overview.currencyCode}`);
        if (data.funFacts?.length) {
          y += 2;
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(8);
          setColor('#9c8470');
          doc.text(`Fun fact: ${data.funFacts[0]}`, margin + 2, y);
          y += 6;
        }
        divider();
      }

      if (selected.has('bestTime')) {
        sectionHeader('Best Time to Visit');
        bulletRow('Best Months', data.bestTimeToVisit.bestMonths);
        bulletRow('Rainy Season', data.bestTimeToVisit.rainySeason);
        bulletRow('Budget Season', data.bestTimeToVisit.cheapestSeason);
        if (data.bestTimeToVisit.majorFestivals?.length) {
          checkPage(6);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          setColor('#1a1208');
          doc.text('Major Festivals:', margin + 5, y);
          y += 5;
          data.bestTimeToVisit.majorFestivals.forEach(f => {
            checkPage(5);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            setColor('#4a3828');
            doc.text(`  🎉 ${f}`, margin + 6, y);
            y += 4.8;
          });
        }
        divider();
      }

      if (selected.has('attractions')) {
        sectionHeader('Top Attractions');
        data.attractions?.slice(0, 5).forEach((a, i) => {
          checkPage(18);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          setColor('#1a1208');
          doc.text(`${i + 1}. ${a.name}`, margin + 2, y);
          y += 5;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          setColor('#b07a3a');
          doc.text(a.city.toUpperCase(), margin + 6, y);
          y += 4.5;
          bodyText(a.famousFor, 4);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          setColor('#9c8470');
          const factLines = doc.splitTextToSize(`Fact: ${a.interestingFact}`, contentW - 6);
          factLines.forEach((l: string) => { checkPage(4); doc.text(l, margin + 4, y); y += 4.2; });
          y += 2;
        });
        divider();
      }

      if (selected.has('phrases')) {
        sectionHeader('Essential Travel Phrases');
        // Table header
        setFill('#1a1208');
        doc.rect(margin, y, contentW, 7, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        setColor('#F7F3EE');
        doc.text('ENGLISH', margin + 2, y + 4.8);
        doc.text('LOCAL', margin + 52, y + 4.8);
        doc.text('PRONUNCIATION', margin + 102, y + 4.8);
        y += 8;

        data.phrases?.forEach((p, i) => {
          checkPage(7);
          if (i % 2 === 0) {
            setFill('#faf8f5');
            doc.rect(margin, y - 1, contentW, 6.5, 'F');
          }
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          setColor('#1a1208');
          doc.text(p.english || '', margin + 2, y + 4);
          setColor('#b07a3a');
          doc.text((p.local || '').substring(0, 30), margin + 52, y + 4);
          setColor('#6b5740');
          doc.setFont('helvetica', 'italic');
          doc.text((p.phonetic || '').substring(0, 35), margin + 102, y + 4);
          y += 6.5;
        });
        divider();
      }

      if (selected.has('budget')) {
        sectionHeader('Budget & Prices');
        const prices = [
          ['Mid-range Hotel', data.prices.hotel],
          ['Restaurant Meal', data.prices.meal],
          ['Street Food', data.prices.streetFood],
          ['Coffee', data.prices.coffee],
          ['Public Transit', data.prices.transport],
          ['Taxi / km', data.prices.taxi],
        ];
        prices.forEach(([label, price]) => bulletRow(label, price));
        divider();
      }

      if (selected.has('culture')) {
        sectionHeader('Culture & Etiquette');
        if (data.culture.religionOverview) {
          bodyText(data.culture.religionOverview, 2);
          y += 2;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        setColor('#1a1208');
        doc.text('Etiquette Tips:', margin + 2, y);
        y += 5;
        data.culture.etiquetteTips?.slice(0, 5).forEach((tip, i) => {
          checkPage(6);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          setColor('#4a3828');
          const lines = doc.splitTextToSize(`${i + 1}. ${tip}`, contentW - 6);
          lines.forEach((l: string) => { checkPage(5); doc.text(l, margin + 4, y); y += 4.8; });
        });
        divider();
      }

      if (selected.has('food')) {
        sectionHeader('Popular Foods');
        data.foods?.slice(0, 5).forEach((f, i) => {
          checkPage(14);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          setColor('#1a1208');
          doc.text(`${i + 1}. ${f.name}`, margin + 2, y);
          y += 5;
          bodyText(f.description, 4);
          doc.setFont('helvetica', 'italic');
          doc.setFontSize(7.5);
          setColor('#b07a3a');
          doc.text(`Famous for: ${f.famousFor}`, margin + 4, y);
          y += 6;
        });
        divider();
      }

      if (selected.has('geography')) {
        sectionHeader('Geography & Climate');
        bulletRow('Climate', data.geography.climate);
        bulletRow('Landscape', data.geography.landscape);
        if (data.geography.majorCities?.length) {
          bulletRow('Major Cities', data.geography.majorCities.join(', '));
        }
        if (data.geography.naturalLandmarks?.length) {
          bulletRow('Natural Landmarks', data.geography.naturalLandmarks.join(', '));
        }
        divider();
      }

      // ── Footer on last page ───────────────────────────────────────────────
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

      doc.save(`${countryName.replace(/\s+/g, '_')}_Travel_Guide.pdf`);
      setDone(true);
      setTimeout(() => { setDone(false); setOpen(false); }, 1800);
    } catch (e) {
      console.error('PDF generation failed', e);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#b07a3a] hover:bg-[#8f6030] text-white text-xs font-semibold transition-colors shadow-sm"
      >
        <Download size={13} />
        Save Guide
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed inset-x-4 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[480px] z-50 bg-[#F7F3EE] rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="bg-[#1a1208] px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#b07a3a]/20 rounded-xl">
                    <FileText size={16} className="text-[#b07a3a]" />
                  </div>
                  <div>
                    <h2 className="text-white font-black text-base">Download Travel Guide</h2>
                    <p className="text-[#9c8470] text-xs mt-0.5">{countryName} — choose what to include</p>
                  </div>
                </div>
                <button onClick={() => setOpen(false)} className="text-[#9c8470] hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              {/* Section checkboxes */}
              <div className="px-6 pt-4 pb-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#9c8470] uppercase tracking-wider">Select sections</span>
                  <div className="flex gap-3 text-xs font-semibold">
                    <button onClick={selectAll} className="text-[#b07a3a] hover:underline">All</button>
                    <button onClick={clearAll} className="text-[#9c8470] hover:underline">None</button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SECTIONS.map(s => {
                    const checked = selected.has(s.id);
                    return (
                      <button
                        key={s.id}
                        onClick={() => toggle(s.id)}
                        className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all ${
                          checked
                            ? 'bg-[#b07a3a]/10 border-[#b07a3a]/40'
                            : 'bg-white border-[#e8dfd2] opacity-60'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded shrink-0 mt-0.5 flex items-center justify-center border transition-colors ${
                          checked ? 'bg-[#b07a3a] border-[#b07a3a]' : 'border-[#c8b89a] bg-white'
                        }`}>
                          {checked && <Check size={10} className="text-white" strokeWidth={3} />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-[#1a1208]">{s.label}</div>
                          <div className="text-[10px] text-[#9c8470] leading-tight mt-0.5">{s.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-[#e8dfd2] flex items-center justify-between">
                <span className="text-xs text-[#9c8470]">
                  {selected.size} of {SECTIONS.length} sections
                </span>
                <button
                  onClick={generatePDF}
                  disabled={generating || selected.size === 0 || done}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1a1208] hover:bg-[#2d1f0e] text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {done ? (
                    <><Check size={14} className="text-green-400" /> Saved!</>
                  ) : generating ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating…</>
                  ) : (
                    <><Download size={14} /> Download PDF</>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
