import { useId, useState } from 'react';
import { ArrowRight, CalendarDays, ChevronDown, ExternalLink, Sparkles, Star } from 'lucide-react';
import type { CountryData } from '../types';

type Festivals = NonNullable<CountryData['festivals']>;
type Holiday = Festivals['calendar'][number];
type Month = number | 'all' | 'flexible';
type Source = { title: string; url: string };
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const shortDate = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });
const fullDate = new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
const formatDate = (date: string, format = shortDate) => format.format(new Date(`${date}T12:00:00Z`));
const monthOf = (date: string) => Number(date.slice(5, 7)) - 1;
const eventKey = (event: Holiday, month: Month) => `${month}:${event.kind}:${event.name}`;
const kindLabels = { public: 'Public holiday', observance: 'Observance', optional: 'Optional observance' };
const kindDetails = {
  public: 'Listed as a public holiday in this country’s calendar. Days off can vary by region, workplace and community.',
  observance: 'A cultural, religious or social observance. It does not necessarily mean a public holiday or a day off.',
  optional: 'Observed by some communities or workplaces. It does not imply a nationwide day off.',
};

// Dataset repositories belong in the credits, never behind a celebration card.
function isReadingSource(source: Source) {
  try {
    const url = new URL(source.url);
    return url.protocol === 'https:' && !/(^|\.)(github\.com|githubusercontent\.com|gitlab\.com)$/.test(url.hostname);
  } catch { return false; }
}
function ReadingLink({ source }: { source: Source }) {
  if (!isReadingSource(source)) return null;
  return <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-start gap-1.5 text-xs text-accent underline underline-offset-4 leading-relaxed">
    <span>Read reference: {source.title}</span><ExternalLink size={13} className="shrink-0 mt-0.5" aria-hidden="true" />
    <span className="sr-only"> (opens in a new tab)</span>
  </a>;
}
function HolidayCard({ event, month, expanded, onToggle }: { event: Holiday; month: Month; expanded: boolean; onToggle: () => void }) {
  const id = useId();
  const dates = typeof month === 'number' ? event.dates.filter(date => monthOf(date) === month) : event.dates;
  const firstDate = dates[0];
  return <div className={`self-start min-w-0 rounded-2xl border transition-colors ${expanded ? 'border-accent/60 bg-accent/5' : 'border-line bg-surface hover:border-accent/50'}`}>
    <button type="button" onClick={onToggle} aria-expanded={expanded} aria-controls={id} className="w-full flex items-center gap-3 p-4 text-left rounded-2xl cursor-pointer min-h-24">
      <span aria-hidden="true" className="flex flex-col items-center justify-center shrink-0 w-12 h-14 rounded-xl bg-surface-alt text-accent">
        {firstDate ? <><span className="text-[10px] font-bold uppercase tracking-wider">{months[monthOf(firstDate)].slice(0, 3)}</span><span className="text-xl font-bold leading-tight">{Number(firstDate.slice(8, 10))}</span></> : <CalendarDays size={21} />}
      </span>
      <span className="min-w-0 flex-1"><span className="block text-sm font-semibold leading-snug text-ink">{event.name}</span>
        <span className="block text-xs text-muted mt-1.5">{firstDate ? dates.map(date => formatDate(date)).join(' · ') : 'Date varies'} · {kindLabels[event.kind]}</span></span>
      <ChevronDown size={16} aria-hidden="true" className={`shrink-0 text-accent transition-transform ${expanded ? 'rotate-180' : ''}`} />
    </button>
    <div id={id} hidden={!expanded} className="px-4 pb-4 text-sm">
      <div className="border-t border-line pt-3 space-y-3">
        <p className="font-medium text-ink leading-relaxed">{event.dates.length ? event.dates.map(date => formatDate(date, fullDate)).join(' · ') : event.dateNote || 'Confirm the date with local announcements.'}</p>
        <p className="text-xs text-muted leading-relaxed">{kindDetails[event.kind]}</p>
        {/\(observed\)/i.test(event.name) && <p className="text-xs text-muted leading-relaxed">This is the observed day off, which can differ from the celebration’s original date.</p>}
        {isReadingSource(event.source) ? <ReadingLink source={event.source} /> : <p className="text-xs text-muted">Calendar reference and licensing are available under Sources & context below.</p>}
      </div>
    </div>
  </div>;
}
function FestivalExplorer({ festivals }: { festivals: Festivals }) {
  const { highlights, calendar, year, note, sources, attribution } = festivals;
  const [today] = useState(() => new Date());
  const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const datedEvents = calendar.flatMap(event => event.dates.map(date => ({ event, date }))).sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = datedEvents.find(item => item.date >= todayDate);
  const [month, setMonth] = useState<Month>(() => upcoming ? monthOf(upcoming.date) : datedEvents.length ? monthOf(datedEvents[0].date) : 'flexible');
  const [expanded, setExpanded] = useState<string | null>(null);
  const monthlyEvents = months.map((_, index) => calendar.filter(event => event.dates.some(date => monthOf(date) === index)));
  const flexibleEvents = calendar.filter(event => !event.dates.length);
  const groups = [...months.map((name, index) => ({ month: index as Month, name, events: monthlyEvents[index] })), { month: 'flexible' as Month, name: 'Dates to confirm', events: flexibleEvents }]
    .filter(group => group.events.length && (month === 'all' || group.month === month));
  const selectMonth = (next: Month) => { setMonth(next); setExpanded(null); };
  const readingSources = sources.filter(isReadingSource);
  const dataSources = sources.filter(source => !isReadingSource(source));

  return <section aria-label="Festivals and holidays" className="md:col-span-2 bg-surface rounded-2xl border border-line shadow-sm p-5 sm:p-6 min-w-0">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3"><span className="p-2.5 rounded-xl bg-accent/10 text-accent"><Sparkles size={20} aria-hidden="true" /></span>
        <div><p className="text-[10px] tracking-[.16em] uppercase font-semibold text-accent mb-1">A year of celebrations</p><h3 className="font-bold text-ink text-lg">Festivals & Holidays</h3></div></div>
      <span className="text-xs font-semibold text-muted border border-line rounded-full px-3 py-1.5">{year}</span>
    </div>
    <p className="text-sm text-muted leading-relaxed mt-3">{calendar.length ? 'Pick a month. Tap a celebration to explore its dates and details.' : highlights.length ? 'Discover the celebrations that give the year its character.' : note}</p>
    {calendar.length > 0 && <>
      {upcoming && <button type="button" onClick={() => { const next = monthOf(upcoming.date); setMonth(next); setExpanded(eventKey(upcoming.event, next)); }}
        className="w-full flex items-center gap-3 sm:gap-4 text-left bg-surface-alt border border-accent/20 rounded-2xl p-4 mt-5 cursor-pointer hover:border-accent/60 transition-colors">
        <Star size={20} className="shrink-0 text-accent" aria-hidden="true" />
        <span className="min-w-0 flex-1"><span className="block text-[10px] uppercase tracking-widest font-semibold text-accent mb-1">{upcoming.date === todayDate ? 'On the calendar today' : 'Next on the calendar'}</span>
          <span className="text-sm font-semibold text-ink">{upcoming.event.name}</span><span className="block text-xs text-muted mt-1">{formatDate(upcoming.date)}</span></span>
        <ArrowRight size={18} className="text-accent shrink-0" aria-hidden="true" />
      </button>}
      <div role="group" aria-label="Choose a calendar month" className="grid grid-cols-6 md:grid-cols-12 gap-1.5 mt-5">
        {months.map((name, index) => <button type="button" key={name} aria-label={`${name}, ${monthlyEvents[index].length} events`} aria-pressed={month === index} onClick={() => selectMonth(index)}
          className={`rounded-xl min-h-14 py-2 text-center border cursor-pointer transition-colors ${month === index ? 'bg-action text-action-ink border-action' : 'bg-surface text-muted border-line hover:bg-surface-alt'}`}>
          <span className="block text-xs font-semibold">{name.slice(0, 3)}</span><span className={`mx-auto mt-1 block w-1 h-1 rounded-full ${monthlyEvents[index].length ? 'bg-current' : 'bg-transparent'}`} aria-hidden="true" />
        </button>)}
      </div>
      <div role="group" aria-label="Other calendar views" className="flex flex-wrap gap-2 mt-3">
        {([{ value: 'all', label: `Whole year · ${calendar.length}` }, ...(flexibleEvents.length ? [{ value: 'flexible', label: `Dates vary · ${flexibleEvents.length}` }] : [])] as { value: Month; label: string }[]).map(item =>
          <button type="button" key={item.value} aria-pressed={month === item.value} onClick={() => selectMonth(item.value)} className={`min-h-11 px-3 rounded-full border text-xs font-semibold cursor-pointer transition-colors ${month === item.value ? 'border-accent text-accent bg-accent/10' : 'border-line text-muted hover:bg-surface-alt'}`}>{item.label}</button>)}
      </div>
      <p role="status" className="sr-only">{month === 'all' ? 'Showing the whole year' : month === 'flexible' ? 'Showing celebrations with dates to confirm' : `Showing ${months[month]}`}. {groups.reduce((count, group) => count + group.events.length, 0)} entries.</p>
      <div className="mt-5 space-y-5">
        {groups.map(group => <div key={group.month}>
          <div className="flex items-center gap-3 mb-3"><h4 className="font-semibold text-sm text-ink">{group.name}</h4><span className="h-px bg-line flex-1" /><span className="text-xs text-muted">{group.events.length} {group.events.length === 1 ? 'event' : 'events'}</span></div>
          <div className="grid sm:grid-cols-2 gap-3 items-start">{group.events.map(event => { const key = eventKey(event, group.month); return <HolidayCard key={key} event={event} month={group.month} expanded={expanded === key} onToggle={() => setExpanded(expanded === key ? null : key)} />; })}</div>
        </div>)}
        {!groups.length && <div className="text-center rounded-2xl bg-surface-alt/50 px-5 py-7 text-muted"><CalendarDays size={24} className="mx-auto mb-3 text-accent" aria-hidden="true" />
          <p className="text-sm font-semibold text-ink">No dates listed for {typeof month === 'number' ? months[month] : 'this view'}.</p><p className="text-xs mt-2 leading-relaxed">There may still be local celebrations. Try another month or explore the whole year.</p></div>}
      </div>
    </>}
    {highlights.length > 0 && <div className={calendar.length ? 'border-t border-line mt-6 pt-5' : 'mt-5'}>
      <h4 className="text-sm font-semibold text-ink flex items-center gap-2 mb-1"><Sparkles size={16} className="text-accent" aria-hidden="true" /> Festival spotlights</h4>
      <p className="text-xs text-muted mb-3 leading-relaxed">Local traditions and seasonal celebrations. Tap to discover more.</p>
      <div className="grid sm:grid-cols-2 gap-3 items-start">{highlights.map(event => <details key={event.name} className="group rounded-2xl bg-accent/5 border border-accent/20">
        <summary className="flex items-center justify-between gap-3 p-4 min-h-14 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-semibold text-ink">{event.name}<ChevronDown size={16} className="shrink-0 text-accent group-open:rotate-180 transition-transform" aria-hidden="true" /></summary>
        <div className="px-4 pb-4 space-y-3"><p className="text-sm text-muted leading-relaxed">{event.timing}</p><ReadingLink source={event.source} /></div>
      </details>)}</div>
    </div>}
    <details className="mt-5 border-t border-line pt-3 text-xs text-muted">
      <summary className="cursor-pointer text-accent py-2 font-medium">Sources & context</summary><p className="leading-relaxed mt-2 mb-3">{note}</p>
      {readingSources.length > 0 && <ul className="space-y-3 mb-4">{readingSources.map(source => <li key={source.url}><ReadingLink source={source} /></li>)}</ul>}
      {(dataSources.length > 0 || attribution) && <div className="border-t border-line pt-3 space-y-3"><p className="font-semibold text-ink">Calendar data & licensing</p>
        {dataSources.map(source => <p key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 break-words">Dataset: {source.title} (GitHub)<span className="sr-only"> (opens in a new tab)</span></a></p>)}
        {attribution && <p className="leading-relaxed">Calendar data adapted from date-holidays contributors. <a href={attribution.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Project credits (GitHub)</a>
          {' · '}<a href={attribution.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">CC BY-SA 3.0</a>
          {' · '}<a href={attribution.noticesUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Sources & adaptation notes</a></p>}
      </div>}
    </details>
  </section>;
}
export function FestivalCalendar({ festivals }: { festivals: CountryData['festivals'] }) {
  return festivals ? <FestivalExplorer festivals={festivals} /> : null;
}
