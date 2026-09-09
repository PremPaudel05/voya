import { ChevronDown, ExternalLink, Sparkles } from 'lucide-react';
import type { CountryData } from '../types';

type Festivals = NonNullable<CountryData['festivals']>;
type Holiday = Festivals['calendar'][number];
type Source = { title: string; url: string };
type Spotlight = { name: string; timings: string[]; holidays: Holiday[]; sources: Source[] };

const fullDate = new Intl.DateTimeFormat('en', {
  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC',
});
const formatDate = (date: string) => fullDate.format(new Date(`${date}T12:00:00Z`));
const kindLabels = { public: 'Public holiday', observance: 'Observance', optional: 'Optional observance' };
const kindDetails = {
  public: 'Days off can vary by region, workplace and community.',
  observance: 'A cultural, religious or social observance. It does not necessarily mean a public holiday or a day off.',
  optional: 'Observed by some communities or workplaces. It does not imply a nationwide day off.',
};

// Combine only matching names, preserving every date, cultural note and source.
// Both data sources use the same spotlight layout, including countries with no dated calendar.
function getSpotlights({ highlights, calendar }: Festivals): Spotlight[] {
  const cards = new Map<string, Spotlight>();
  const cardFor = (name: string) => {
    const key = name.normalize('NFKC').toLowerCase().replace(/[’']/g, '').replace(/\s+/g, ' ').trim();
    if (!cards.has(key)) cards.set(key, { name, timings: [], holidays: [], sources: [] });
    return cards.get(key)!;
  };
  for (const event of highlights) {
    const card = cardFor(event.name);
    if (!card.timings.includes(event.timing)) card.timings.push(event.timing);
    card.sources.push(event.source);
  }
  for (const event of calendar) {
    const card = cardFor(event.name);
    card.holidays.push(event);
    card.sources.push(event.source);
  }
  return [...cards.values()].map(card => ({
    ...card,
    sources: card.sources.filter((source, index, all) => all.findIndex(other => other.url === source.url) === index),
  }));
}

// Dataset repositories belong in the credits, never behind a celebration card.
function isReadingSource(source: Source) {
  try {
    const url = new URL(source.url);
    return url.protocol === 'https:' && !/(^|\.)(github\.com|githubusercontent\.com|gitlab\.com)$/.test(url.hostname);
  } catch { return false; }
}

function ReadingLink({ source }: { source: Source }) {
  if (!isReadingSource(source)) return null;
  return <a href={source.url} target="_blank" rel="noopener noreferrer"
    className="inline-flex items-start gap-1.5 text-xs text-accent underline underline-offset-4 leading-relaxed">
    <span>Read reference: {source.title}</span>
    <ExternalLink size={13} className="shrink-0 mt-0.5" aria-hidden="true" />
    <span className="sr-only"> (opens in a new tab)</span>
  </a>;
}

function FestivalSpotlight({ event }: { event: Spotlight }) {
  return <details className="group min-w-0 rounded-2xl bg-accent/5 border border-accent/20">
    <summary className="flex items-center justify-between gap-3 p-4 min-h-14 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-sm font-semibold text-ink">
      {event.name}
      <ChevronDown size={16} className="shrink-0 text-accent group-open:rotate-180 transition-transform" aria-hidden="true" />
    </summary>
    <div className="px-4 pb-4 space-y-3">
      {event.timings.map(timing => <p key={timing} className="text-sm text-muted leading-relaxed">{timing}</p>)}
      {event.holidays.map(holiday => <div key={`${holiday.name}:${holiday.kind}`} className="space-y-2">
        <p className="text-sm text-ink leading-relaxed">{holiday.dates.length
          ? holiday.dates.map(formatDate).join(' · ')
          : holiday.dateNote || 'Confirm the date with local announcements.'}</p>
        <p className="text-xs font-semibold text-accent">{kindLabels[holiday.kind]}</p>
        <p className="text-xs text-muted leading-relaxed">{kindDetails[holiday.kind]}</p>
        {/\(observed\)/i.test(holiday.name) && <p className="text-xs text-muted leading-relaxed">
          This is the observed day off, which can differ from the celebration’s original date.
        </p>}
      </div>)}
      {event.sources.filter(isReadingSource).map(source => <div key={source.url}><ReadingLink source={source} /></div>)}
    </div>
  </details>;
}

export function FestivalCalendar({ festivals }: { festivals: CountryData['festivals'] }) {
  if (!festivals) return null;
  const { year, note, sources, attribution } = festivals;
  const spotlights = getSpotlights(festivals);
  const readingSources = sources.filter(isReadingSource);
  const dataSources = sources.filter(source => !isReadingSource(source));

  return <section aria-label="Festivals and holidays" className="md:col-span-2 bg-surface rounded-2xl border border-line shadow-sm p-5 sm:p-6 min-w-0">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="p-2.5 rounded-xl bg-accent/10 text-accent"><Sparkles size={20} aria-hidden="true" /></span>
        <div>
          <p className="text-[10px] tracking-[.16em] uppercase font-semibold text-accent mb-1">A year of celebrations</p>
          <h3 className="font-bold text-ink text-lg">Festivals & Holidays</h3>
        </div>
      </div>
      <span className="text-xs font-semibold text-muted border border-line rounded-full px-3 py-1.5">{year}</span>
    </div>
    <p className="text-sm text-muted leading-relaxed mt-3">{spotlights.length
      ? 'Discover the celebrations that give the year its character.' : note}</p>

    {spotlights.length > 0 && <div className="mt-5">
      <h4 className="text-sm font-semibold text-ink flex items-center gap-2 mb-1">
        <Sparkles size={16} className="text-accent" aria-hidden="true" /> Festival spotlights
      </h4>
      <p className="text-xs text-muted mb-3 leading-relaxed">Local traditions and seasonal celebrations. Tap to discover more.</p>
      <div className="grid sm:grid-cols-2 gap-3 items-start">
        {spotlights.map(event => <FestivalSpotlight key={event.name} event={event} />)}
      </div>
    </div>}

    <details className="mt-5 border-t border-line pt-3 text-xs text-muted">
      <summary className="cursor-pointer text-accent py-2 font-medium">Sources & context</summary>
      <p className="leading-relaxed mt-2 mb-3">{note}</p>
      {readingSources.length > 0 && <ul className="space-y-3 mb-4">
        {readingSources.map(source => <li key={source.url}><ReadingLink source={source} /></li>)}
      </ul>}
      {(dataSources.length > 0 || attribution) && <div className="border-t border-line pt-3 space-y-3">
        <p className="font-semibold text-ink">Calendar data & licensing</p>
        {dataSources.map(source => <p key={source.url}>
          <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4 break-words">
            Dataset: {source.title} (GitHub)<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>)}
        {attribution && <p className="leading-relaxed">
          Calendar data adapted from date-holidays contributors. <a href={attribution.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Project credits (GitHub)</a>
          {' · '}<a href={attribution.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">CC BY-SA 3.0</a>
          {' · '}<a href={attribution.noticesUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Sources & adaptation notes</a>
        </p>}
      </div>}
    </details>
  </section>;
}
