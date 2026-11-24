import { useEffect, useRef, useState } from 'react';
import { Camera, MapPin, RefreshCw } from 'lucide-react';
import { loadAttractionPhoto, NoPhotoError } from '../services/attractionPhotoService';
import type { AttractionPhoto } from '../services/attractionPhotoService';

interface AttractionCardProps {
  attraction: { name: string; city: string; famousFor: string; interestingFact: string; imageSearchQuery?: string; imageUrl?: string; photo?: AttractionPhoto; cityGuessed?: boolean };
  countryName: string;
  /** Cards near the top of the list load their photos first. */
  eager?: boolean;
}

// The photo column is ~40% of a two-column card on desktop and full width on phones.
const SIZES = '(min-width: 1024px) 200px, (min-width: 640px) 40vw, 100vw';

type Status = 'loading' | 'shown' | 'none' | 'error';

function LandmarkPhoto({ name, city, country, initial, eager }: { name: string; city: string; country: string; initial?: AttractionPhoto; eager?: boolean }) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(Boolean(initial));
  const [photo, setPhoto] = useState<AttractionPhoto | null>(initial || null);
  const [index, setIndex] = useState(0);
  // Each image tries the Wikimedia CDN first, then the same-origin proxy.
  const [viaProxy, setViaProxy] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<Status>('loading');
  const refreshed = useRef(false);

  // Photos not shipped with the guide are looked up once the card nears the screen.
  useEffect(() => {
    if (visible) return;
    if (!('IntersectionObserver' in window)) { queueMicrotask(() => setVisible(true)); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setVisible(true); observer.disconnect(); }
    }, { rootMargin: '400px' });
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || (photo && attempt === 0)) return;
    const controller = new AbortController();
    loadAttractionPhoto(name, country, controller.signal, attempt > 0, city).then(result => {
      if (controller.signal.aborted) return;
      setPhoto(result); setIndex(0); setViaProxy(false); setStatus('loading');
    }).catch(error => {
      if (!controller.signal.aborted) setStatus(error instanceof NoPhotoError ? 'none' : 'error');
    });
    return () => controller.abort();
    // `photo` is intentionally read only to skip the lookup for shipped photos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, city, country, visible, attempt]);

  const image = photo?.images[index];
  const failImage = () => {
    if (image?.directUrl && !viaProxy) { setViaProxy(true); return; }
    if (photo && index + 1 < photo.images.length) { setIndex(value => value + 1); setViaProxy(false); return; }
    // Every known image failed: ask the server for fresh metadata once.
    if (!refreshed.current) { refreshed.current = true; setPhoto(null); setAttempt(value => value + 1); return; }
    setStatus('error');
  };
  const retry = () => { refreshed.current = false; setPhoto(null); setStatus('loading'); setAttempt(value => value + 1); };
  const direct = image?.directUrl && !viaProxy;

  return <div ref={container} className="flex h-full flex-col">
    <div className="relative flex-1 min-h-52 overflow-hidden">
      {status === 'loading' && <div className="photo-shimmer absolute inset-0" role="status" aria-label={`Loading photo of ${name}`} />}
      {image && status !== 'none' && status !== 'error' && <img
        key={`${attempt}-${index}-${direct ? 'cdn' : 'proxy'}`}
        src={direct ? image.directUrl : image.imageUrl}
        srcSet={direct ? image.directSrcSet : undefined}
        sizes={direct ? SIZES : undefined}
        alt={photo?.approximate ? `${photo.subject}, the area around ${name}` : name}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding="async"
        referrerPolicy="no-referrer"
        className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-500 group-hover:scale-[1.03] ${status === 'shown' ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setStatus('shown')}
        onError={failImage} />}
      {status === 'shown' && photo?.approximate && <span className="pointer-events-none absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur-sm" title={`No verified photo of ${name} yet. This shows ${photo.subject}.`}><MapPin size={10} aria-hidden="true" />Photo of {photo.subject}</span>}
      {(status === 'none' || status === 'error') && <div className="flex h-full min-h-52 flex-col items-center justify-center gap-2 bg-gradient-to-br from-surface-alt to-canvas p-5 text-center text-sm text-muted">
        <MapPin size={22} className="text-accent" aria-hidden="true" />
        <p className="font-semibold text-ink">{city || country}</p>
        {status === 'none'
          ? <a className="text-xs underline" href={`https://commons.wikimedia.org/w/index.php?${new URLSearchParams({ search: `${name} ${country}`, title: 'Special:MediaSearch', type: 'image' })}`} target="_blank" rel="noopener noreferrer">Find photos of {name} ↗</a>
          : <button type="button" onClick={retry} className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink"><RefreshCw size={12} />Retry photo<span className="sr-only"> of {name}</span></button>}
      </div>}
    </div>
    {status === 'shown' && image && <details className="bg-surface-alt px-3 py-2 text-[10px] leading-relaxed text-muted"><summary className="cursor-pointer inline-flex items-center gap-1"><Camera size={10} aria-hidden="true" />Photo credits</summary><a href={image.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 block break-words underline">{image.author} · {image.license}</a></details>}
  </div>;
}
export function AttractionCard({ attraction, countryName, eager }: AttractionCardProps) {
  return <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-all hover:border-accent/30 hover:shadow-md sm:flex-row">
    <div className="relative min-h-52 w-full shrink-0 bg-surface-alt sm:w-2/5">
      <LandmarkPhoto key={`${countryName}|${attraction.name}`} name={attraction.name} city={attraction.cityGuessed ? '' : attraction.city} country={countryName} initial={attraction.photo} eager={eager} />
      {/* Guessed cities are often wrong, so only researched ones are labelled. */}
      {attraction.city && !attraction.cityGuessed && <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">{attraction.city}</div>}
    </div>
    <div className="flex flex-1 flex-col justify-center p-5">
      <h3 className="mb-2 text-lg font-bold leading-snug text-ink">{attraction.name}</h3>
      <p className="mb-4 text-sm leading-relaxed text-muted">{attraction.famousFor}</p>
      {attraction.interestingFact && <div className="mt-auto border-t border-line pt-3"><p className="text-xs italic leading-relaxed text-subtle"><span className="font-semibold not-italic text-accent">Fact: </span>{attraction.interestingFact}</p></div>}
    </div>
  </div>;
}
