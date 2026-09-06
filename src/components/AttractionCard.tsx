import { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { loadAttractionPhoto } from '../services/attractionPhotoService';
import type { AttractionPhoto } from '../services/attractionPhotoService';

interface AttractionCardProps {
  attraction: { name: string; city: string; famousFor: string; interestingFact: string; imageSearchQuery?: string; imageUrl?: string };
  countryName: string;
}

function LandmarkPhoto({ name, country }: { name: string; country: string }) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [photo, setPhoto] = useState<AttractionPhoto | null>(null);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const automaticRetries = useRef(0);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { queueMicrotask(() => setVisible(true)); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '250px' });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    let retry: ReturnType<typeof setTimeout>;
    loadAttractionPhoto(name, country, controller.signal, attempt > 0).then(result => {
      if (controller.signal.aborted) return;
      setPhoto(result); setIndex(0); setLoaded(false); setFailed(false);
    }).catch(() => {
      if (controller.signal.aborted) return;
      if (automaticRetries.current < 2) {
        automaticRetries.current++;
        retry = setTimeout(() => setAttempt(value => value + 1), automaticRetries.current * 1200);
      } else setFailed(true);
    });
    return () => { controller.abort(); clearTimeout(retry); };
  }, [name, country, visible, attempt]);
  const reload = () => { setFailed(false); setLoaded(false); setPhoto(null); automaticRetries.current = 0; setAttempt(value => value + 1); };
  const nextPhoto = () => {
    setLoaded(false);
    if (photo && index + 1 < photo.images.length) setIndex(value => value + 1);
    else if (automaticRetries.current < 2) { automaticRetries.current++; setPhoto(null); setAttempt(value => value + 1); }
    else setFailed(true);
  };
  const image = photo?.images[index];
  return <div ref={container} className="flex h-full flex-col">
    <div className="relative flex-1 min-h-52 overflow-hidden">
      {!loaded && !failed && <div className="absolute inset-0 flex items-center justify-center text-subtle" role="status" aria-label={`Loading photo of ${name}`}><Camera size={26} className="animate-pulse" /></div>}
      {image && !failed && <img key={`${attempt}-${index}`} src={image.imageUrl} alt={name} decoding="async" referrerPolicy="no-referrer" className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`} onLoad={() => setLoaded(true)} onError={nextPhoto} />}
      {failed && <div className="flex h-full min-h-52 flex-col items-center justify-center gap-3 p-5 text-center text-sm text-muted"><Camera size={24} aria-hidden="true" /><p>Photo couldn’t load.</p><button type="button" onClick={reload} className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink"><RefreshCw size={13} />Retry photo<span className="sr-only"> of {name}</span></button></div>}
    </div>
    {loaded && image && <details className="bg-surface-alt px-3 py-2 text-[10px] leading-relaxed text-muted"><summary className="cursor-pointer">Photo credits</summary><a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block break-words underline">{image.author} · {image.license}</a></details>}
  </div>;
}
export function AttractionCard({ attraction, countryName }: AttractionCardProps) {
  return <div className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-all hover:border-accent/30 hover:shadow-md sm:flex-row">
    <div className="relative min-h-52 w-full shrink-0 bg-surface-alt sm:w-2/5">
      <LandmarkPhoto key={`${countryName}|${attraction.name}`} name={attraction.name} country={countryName} />
      <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">{attraction.city}</div>
    </div>
    <div className="flex flex-1 flex-col justify-center p-5">
      <h3 className="mb-2 text-lg font-bold leading-snug text-ink">{attraction.name}</h3>
      <p className="mb-4 text-sm leading-relaxed text-muted">{attraction.famousFor}</p>
      {attraction.interestingFact && <div className="mt-auto border-t border-line pt-3"><p className="text-xs italic leading-relaxed text-subtle"><span className="font-semibold not-italic text-accent">Fact: </span>{attraction.interestingFact}</p></div>}
    </div>
  </div>;
}
