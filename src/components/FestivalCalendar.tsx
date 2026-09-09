import { CalendarDays, Star } from 'lucide-react';
import type { CountryData } from '../types';

const kindLabels = { public: 'Holiday · scope varies', observance: 'Observance', optional: 'Optional observance' };
const dateFormatter = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', timeZone: 'UTC' });

export function FestivalCalendar({ festivals }: { festivals: CountryData['festivals'] }) {
  if (!festivals) return null;
  const { highlights, calendar, year, note, sources, attribution } = festivals;
  return (
    <section aria-label="Festivals and holidays" className="md:col-span-2 bg-surface rounded-2xl border border-line shadow-sm p-5 sm:p-6 min-w-0">
      <div className="flex items-center gap-2.5 mb-3">
        <Star size={17} className="text-accent shrink-0" />
        <h3 className="font-bold text-ink">Festivals & Holidays</h3>
      </div>
      <p className="text-muted text-xs leading-relaxed mb-5 max-w-3xl">{note}</p>
      {highlights.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          {highlights.map(event => (
            <div key={event.name} className="rounded-xl bg-brand/5 border border-accent/15 p-3 min-w-0">
              <a href={event.source.url} target="_blank" rel="noopener noreferrer" title={`Source: ${event.source.title}`}
                className="text-sm text-ink font-semibold underline decoration-accent/40 underline-offset-4 hover:text-accent">{event.name}</a>
              <p className="text-xs text-muted leading-relaxed mt-1.5">{event.timing}</p>
            </div>
          ))}
        </div>
      )}
      {calendar.length > 0 && (
        <details open className="group border-t border-line pt-4">
          <summary className="cursor-pointer text-sm text-ink font-semibold py-1">
            <CalendarDays size={15} className="inline-block mr-2 text-accent" />
            {year} calendar · {calendar.length} holidays & observances
          </summary>
          <p className="text-xs text-muted leading-relaxed mt-2">Starting dates are shown below. Regional calendars and extended holiday breaks may differ.</p>
          <ul className="grid sm:grid-cols-2 gap-x-6 mt-3">
            {calendar.map(event => (
              <li key={`${event.name}:${event.kind}`} className="border-b border-line/60 py-3 min-w-0">
                <a href={event.source.url} target="_blank" rel="noopener noreferrer" title={`Source: ${event.source.title}`}
                  className="text-sm text-ink font-medium hover:text-accent underline decoration-line underline-offset-4">{event.name}</a>
                <p className="text-xs text-accent leading-relaxed mt-1">
                  {event.dates.length ? event.dates.map(date => dateFormatter.format(new Date(`${date}T12:00:00Z`))).join(', ') : event.dateNote}
                </p>
                <p className="text-xs text-muted mt-1">{kindLabels[event.kind]}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
      {sources.length > 0 && (
        <details className="mt-4 text-xs text-muted">
          <summary className="cursor-pointer text-accent py-1">Festival & holiday references</summary>
          <ul className="mt-2 space-y-2">
            {sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-ink break-words">{source.title}</a></li>)}
          </ul>
        </details>
      )}
      {attribution && <p className="text-xs text-muted leading-relaxed mt-4">
        Calendar data: <a href={attribution.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">date-holidays contributors</a>
        {' · '}<a href={attribution.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">CC BY-SA 3.0</a>
        {' · '}<a href={attribution.noticesUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Sources & adaptation notes</a>
      </p>}
    </section>
  );
}
