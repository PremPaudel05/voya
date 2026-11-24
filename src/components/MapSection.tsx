import { useEffect, useMemo, useRef, useState } from 'react';
import type { Map as MapInstance, Marker, Popup } from 'maplibre-gl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CountryData } from '../types';
import type { AttractionPhoto } from '../services/attractionPhotoService';
import 'maplibre-gl/dist/maplibre-gl.css';

const categories = [
  ['sights', '⭐ Top sights'], ['cities', '🌍 Cities'], ['bestFoodAreas', '🍽 Food'],
  ['nightlifeZones', '🎉 Nightlife'], ['instagrammableSpots', '📸 Photo spots'],
  ['bestBeaches', '🏖 Beaches'], ['areasToAvoid', '⚠️ Areas to avoid'],
] as const;
type Category = typeof categories[number][0];
type Lib = typeof import('maplibre-gl');
type Kind = 'any' | 'city' | 'country';
interface Query { q: string; kind: Kind; approximate?: boolean }
interface Place { label: string; detail?: string; queries: Query[]; photo?: AttractionPhoto }
interface Point { lng: number; lat: number; match: string; approximate?: boolean; extent?: [number, number, number, number] }
interface Props { mapData: CountryData['mapData']; countryCode: string; attractions?: CountryData['attractions'] }

// ── Place lookup ────────────────────────────────────────────────────────────
// Photon (OpenStreetMap) results are kept only when they fall inside this
// country, and every answer is remembered for the session, so revisiting a
// topic is instant and never hits the network twice.
const STORE = 'voya-geocode-v1';
const geoCache = new Map<string, Point | null>();
try { for (const [key, value] of JSON.parse(sessionStorage.getItem(STORE) || '[]')) geoCache.set(key, value); } catch { /* storage unavailable */ }
let persistTimer: ReturnType<typeof setTimeout> | undefined;
const persist = () => {
  clearTimeout(persistTimer);
  persistTimer = setTimeout(() => { try { sessionStorage.setItem(STORE, JSON.stringify([...geoCache].slice(-500))); } catch { /* full */ } }, 400);
};
const CITY_TYPES = ['city', 'town', 'village', 'locality', 'district', 'county', 'state'];
interface PhotonFeature { geometry?: { coordinates?: number[] }; properties?: { type?: string; countrycode?: string; name?: string; city?: string; state?: string; extent?: [number, number, number, number] } }

async function geocode({ q, kind, approximate }: Query, code: string, signal: AbortSignal): Promise<Point | null> {
  const key = `${code}|${kind}|${q}`;
  if (geoCache.has(key)) return geoCache.get(key)!;
  const url = `https://photon.komoot.io/api/?${new URLSearchParams({ q, limit: '8', lang: 'en' })}`;
  let response = await fetch(url, { signal }).catch(() => null);
  // The public service briefly refuses bursts; one unhurried retry recovers.
  if (!response?.ok) {
    await new Promise(resolve => setTimeout(resolve, 1200));
    if (signal.aborted) throw new Error('Place lookup cancelled');
    response = await fetch(url, { signal });
  }
  if (!response.ok) throw new Error('Place lookup failed');
  const features: PhotonFeature[] = (await response.json()).features || [];
  const local = features.filter(f => !code || String(f.properties?.countrycode || '').toUpperCase() === code);
  const pick = kind === 'country' ? local.find(f => f.properties?.type === 'country')
    : kind === 'city' ? local.find(f => CITY_TYPES.includes(f.properties?.type || '')) || local[0] : local[0];
  const c = pick?.geometry?.coordinates;
  const point = Array.isArray(c) && c.length === 2 && c.every(Number.isFinite)
    ? { lng: c[0], lat: c[1], approximate, extent: pick?.properties?.extent, match: [pick?.properties?.name, pick?.properties?.city || pick?.properties?.state].filter(Boolean).join(', ') }
    : null;
  geoCache.set(key, point); persist();
  return point;
}
async function locate(place: Place, code: string, signal: AbortSignal) {
  for (const query of place.queries) {
    const point = await geocode(query, code, signal);
    if (point) return point;
  }
  return null;
}

function buildPlaces(mapData: Props['mapData'], attractions: Props['attractions'] = []): Record<Category, Place[]> {
  const unique = (queries: Query[]) => queries.filter((query, i) => query.q && queries.findIndex(other => other.q === query.q && other.kind === query.kind) === i);
  const topic = (items: string[] = []) => items.filter(Boolean).map(item => ({ label: item, queries: unique([{ q: item, kind: 'any' }, { q: item.split(/[,(]/)[0].trim(), kind: 'any' }]) }));
  return {
    // Researched cities can stand in for a sight that cannot be found; guessed ones cannot.
    sights: attractions.map(a => ({ label: a.name, detail: a.cityGuessed ? undefined : a.city, photo: a.photo,
      queries: unique(a.cityGuessed ? [{ q: a.name, kind: 'any' }] : [{ q: a.name, kind: 'any' }, { q: a.city, kind: 'city', approximate: true }]) })),
    cities: mapData.cities.map(c => ({ label: c.name, queries: [{ q: c.name, kind: 'city' as const }] })),
    bestFoodAreas: topic(mapData.bestFoodAreas), nightlifeZones: topic(mapData.nightlifeZones),
    instagrammableSpots: topic(mapData.instagrammableSpots), bestBeaches: topic(mapData.bestBeaches),
    areasToAvoid: (mapData.areasToAvoid || []).filter(Boolean).map(label => ({ label, queries: [] })),
  };
}

const mapsLink = (place: Place, country: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([place.label, place.detail, country].filter(Boolean).join(', '))}`;
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Popups are built from DOM nodes and text, never from HTML strings.
function popupContent(place: Place, point: Point, country: string) {
  const root = document.createElement('div');
  const image = place.photo?.images[0];
  if (image) {
    const img = document.createElement('img');
    img.src = image.directUrl || image.imageUrl;
    img.alt = place.label; img.referrerPolicy = 'no-referrer'; img.decoding = 'async';
    img.className = 'block h-28 w-full object-cover bg-surface-alt';
    img.onerror = () => { if (img.src !== new URL(image.imageUrl, location.href).href) img.src = image.imageUrl; else img.remove(); };
    root.append(img);
  }
  const body = document.createElement('div');
  body.className = 'p-3';
  const title = document.createElement('p');
  title.className = 'text-sm font-bold leading-snug text-ink';
  title.textContent = place.label;
  body.append(title);
  const note = document.createElement('p');
  note.className = 'mt-0.5 text-xs text-muted';
  note.textContent = point.approximate ? `Pin shows ${place.detail || 'the nearby town'}; the exact spot wasn’t found.` : place.detail || point.match;
  if (note.textContent) body.append(note);
  const link = document.createElement('a');
  link.className = 'mt-2 inline-block text-xs font-semibold text-accent underline';
  link.href = mapsLink(place, country); link.target = '_blank'; link.rel = 'noopener noreferrer';
  link.textContent = 'Open in Google Maps ↗';
  body.append(link);
  root.append(body);
  return root;
}

async function limited<T>(items: T[], limit: number, work: (item: T, index: number) => Promise<void>) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const index = next++; await work(items[index], index); }
  }));
}

export function MapSection({ mapData, countryCode, attractions }: Props) {
  const code = countryCode.toUpperCase();
  const country = mapData.countryQuery;
  const section = useRef<HTMLElement>(null);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const lib = useRef<Lib | null>(null);
  const markers = useRef<(Marker | undefined)[]>([]);
  const popup = useRef<Popup | null>(null);
  const pointsRef = useRef<(Point | null | undefined)[]>([]);
  const countryPoint = useRef<Point | null>(null);
  const pendingPick = useRef<number | null>(null);

  const places = useMemo(() => buildPlaces(mapData, attractions), [mapData, attractions]);
  const topics = categories.filter(([key]) => places[key].length);
  const [category, setCategory] = useState<Category>(() => places.sights.length ? 'sights' : 'cities');
  const [near, setNear] = useState(false);
  const [ready, setReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [points, setPoints] = useState<(Point | null | undefined)[]>([]);
  const [active, setActive] = useState(-1);
  const [hot, setHot] = useState(-1);
  const [touring, setTouring] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [night, setNight] = useState(false);
  const [tilted, setTilted] = useState(true);
  const [status, setStatus] = useState('');
  const list = places[category];
  const plotted = category !== 'areasToAvoid';
  const found = points.flatMap((point, i) => point ? [i] : []);

  // The map library (~1 MB) and its tiles load only when the section is close.
  useEffect(() => {
    if (!('IntersectionObserver' in window)) { queueMicrotask(() => setNear(true)); return; }
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setNear(true); observer.disconnect(); }
    }, { rootMargin: '600px' });
    if (section.current) observer.observe(section.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!near) return;
    let disposed = false;
    import('maplibre-gl').then(maplibre => {
      if (disposed || !container.current) return;
      lib.current = maplibre;
      try {
        const instance = new maplibre.Map({ container: container.current, center: [0, 20], zoom: 1.2, minZoom: 0, maxZoom: 18,
          attributionControl: { compact: true, customAttribution: 'Places: Photon / OpenStreetMap' },
          cooperativeGestures: false, rotateSpeed: 0.3, pitchSpeed: -0.2, fadeDuration: 150,
          dragPan: { linearity: 0.15, maxSpeed: 500, deceleration: 3500 },
          style: { version: 8, sources: { base: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>', maxzoom: 19 } }, layers: [{ id: 'base', type: 'raster', source: 'base' }] } });
        map.current = instance;
        instance.scrollZoom.setWheelZoomRate(1 / 900);
        instance.scrollZoom.setZoomRate(1 / 200);
        instance.addControl(new maplibre.NavigationControl(), 'top-right');
        // Any hands-on move hands control back to the visitor.
        const takeOver = () => { setTouring(false); setSpinning(false); };
        instance.on('dragstart', takeOver);
        instance.on('wheel', takeOver);
        instance.on('touchstart', takeOver);
        instance.on('load', () => {
          instance.setProjection({ type: 'globe' });
          instance.addSource('buildings', { type: 'vector', url: 'https://tiles.openfreemap.org/planet' });
          instance.addLayer({
            id: '3d-buildings', type: 'fill-extrusion', source: 'buildings', 'source-layer': 'building', minzoom: 13,
            filter: ['!=', ['get', 'hide_3d'], true],
            paint: {
              'fill-extrusion-color': '#c7b39a',
              'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 14, ['coalesce', ['get', 'render_height'], 3]],
              'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 13, 0, 14, ['coalesce', ['get', 'render_min_height'], 0]],
              'fill-extrusion-opacity': 0.9,
            },
          });
          setReady(true);
        });
        instance.on('error', () => setStatus('Some map tiles could not load. The place links still work.'));
      } catch { setMapError('This device could not open the 3D map. Use the place links instead.'); }
    }).catch(() => setMapError('The map could not load. Use the place links instead.'));
    return () => { disposed = true; markers.current.forEach(m => m?.remove()); popup.current?.remove(); map.current?.remove(); map.current = null; };
  }, [near]);

  // Night view: NASA city lights over a dimmed street map.
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    if (night && !instance.getSource('city-lights')) {
      instance.addSource('city-lights', {
        type: 'raster', tileSize: 256, maxzoom: 8,
        tiles: ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png'],
        attribution: '<a href="https://blackmarble.gsfc.nasa.gov/" target="_blank" rel="noreferrer">NASA / NOAA Black Marble (2016)</a>',
      });
      instance.addLayer({
        id: 'city-lights', type: 'raster', source: 'city-lights', maxzoom: 11,
        paint: { 'raster-fade-duration': 300, 'raster-opacity': ['interpolate', ['linear'], ['zoom'], 8, 1, 10, 0] },
      }, '3d-buildings');
    }
    if (instance.getLayer('city-lights')) instance.setLayoutProperty('city-lights', 'visibility', night ? 'visible' : 'none');
    instance.setPaintProperty('base', 'raster-brightness-max', night ? 0.6 : 1);
    instance.setPaintProperty('base', 'raster-saturation', night ? -0.6 : 0);
    instance.setPaintProperty('3d-buildings', 'fill-extrusion-color', night ? '#c3a36b' : '#c7b39a');
  }, [night, ready]);

  // Tilt into 3D automatically once zoomed in to street level.
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    const adjustTilt = () => {
      const pitch = tilted && instance.getZoom() >= 13 ? 55 : 0;
      if (Math.abs(instance.getPitch() - pitch) > 1) instance.easeTo({ pitch, duration: reducedMotion() ? 0 : 500 });
    };
    instance.setLayoutProperty('3d-buildings', 'visibility', tilted ? 'visible' : 'none');
    instance.on('zoomend', adjustTilt);
    adjustTilt();
    return () => { instance.off('zoomend', adjustTilt); };
  }, [ready, tilted]);

  // A slowly turning globe in world view, until the visitor takes over.
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance || !spinning || reducedMotion()) return;
    const spin = () => { const center = instance.getCenter(); instance.easeTo({ center: [center.lng - 30, center.lat], duration: 6000, easing: t => t }); };
    instance.on('moveend', spin);
    spin();
    return () => { instance.off('moveend', spin); instance.stop(); };
  }, [ready, spinning]);

  // Remember where the country itself is, for "Country view" and fallbacks.
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    geocode({ q: country, kind: 'country' }, code, controller.signal).then(point => { countryPoint.current = point; }).catch(() => {});
    return () => controller.abort();
  }, [ready, country, code]);

  const flyToCountry = () => {
    const instance = map.current; const point = countryPoint.current;
    if (!instance || !point) return false;
    const e = point.extent;
    // Extents that cross the antimeridian (e.g. Fiji) fall back to the centre point.
    if (e && e[0] < e[2]) instance.fitBounds([[e[0], e[3]], [e[2], e[1]]], { padding: 40, pitch: 0, bearing: 0, maxZoom: 7, duration: reducedMotion() ? 0 : 2200 });
    else instance.flyTo({ center: [point.lng, point.lat], zoom: 5, pitch: 0, bearing: 0, duration: reducedMotion() ? 0 : 2200 });
    return true;
  };
  const fitPlaces = (all: (Point | null | undefined)[]) => {
    const instance = map.current; const maplibre = lib.current;
    const hits = all.filter((p): p is Point => Boolean(p));
    if (!instance || !maplibre) return;
    if (!hits.length) { flyToCountry(); return; }
    if (hits.length === 1) { instance.flyTo({ center: [hits[0].lng, hits[0].lat], zoom: 10, pitch: 0, duration: reducedMotion() ? 0 : 2200 }); return; }
    const bounds = new maplibre.LngLatBounds();
    hits.forEach(p => bounds.extend([p.lng, p.lat]));
    instance.fitBounds(bounds, { padding: { top: 70, bottom: 50, left: 50, right: 70 }, maxZoom: 12, pitch: 0, bearing: 0, duration: reducedMotion() ? 0 : 2200 });
  };

  const select = (index: number) => {
    const instance = map.current; const maplibre = lib.current;
    const point = pointsRef.current[index]; const place = list[index];
    setActive(index);
    setSpinning(false);
    popup.current?.remove();
    if (!instance || !maplibre || !point || !place) return;
    const zoom = category === 'cities' || point.approximate ? 11.5 : 15.5;
    instance.flyTo({ center: [point.lng, point.lat], zoom, pitch: tilted && zoom >= 13 ? 50 : 0, bearing: zoom >= 13 ? -15 : 0, curve: 1.5, speed: 1.1, essential: true,
      // MapLibre treats a present-but-undefined duration as NaN, so only set it when needed.
      ...(reducedMotion() ? { duration: 0 } : {}) });
    popup.current = new maplibre.Popup({ offset: 28, className: 'voya-popup', maxWidth: '260px', focusAfterOpen: false })
      .setLngLat([point.lng, point.lat]).setDOMContent(popupContent(place, point, country)).addTo(instance);
  };
  const selectRef = useRef(select);
  useEffect(() => { selectRef.current = select; });

  // Drop a numbered pin for every place in the topic, then frame them all.
  useEffect(() => {
    if (!ready || !map.current || !lib.current) return;
    const instance = map.current; const maplibre = lib.current;
    const controller = new AbortController();
    markers.current.forEach(m => m?.remove()); markers.current = [];
    popup.current?.remove();
    setActive(-1); setTouring(false);
    const current = places[category];
    pointsRef.current = current.map(() => undefined);
    setPoints([...pointsRef.current]);
    if (category === 'areasToAvoid' || !current.length) { setStatus(''); flyToCountry(); return; }
    let done = 0; let failures = 0;
    setStatus(`Finding ${current.length} places…`);
    limited(current, 2, async (place, index) => {
      let point: Point | null = null;
      try { point = await locate(place, code, controller.signal); } catch { failures++; }
      if (controller.signal.aborted) return;
      pointsRef.current[index] = point;
      setPoints([...pointsRef.current]);
      setStatus(`Finding places… ${++done}/${current.length}`);
      if (!point) return;
      // MapLibre positions the outer element with its own transform, so the
      // styled, rotated pin lives inside it.
      const element = document.createElement('div');
      const pin = document.createElement('button');
      pin.type = 'button';
      pin.className = 'voya-pin';
      pin.style.setProperty('--delay', `${Math.min(index, 10) * 70}ms`);
      pin.setAttribute('aria-label', `${index + 1}. ${place.label}`);
      const number = document.createElement('span'); number.textContent = String(index + 1); pin.append(number);
      pin.addEventListener('click', event => { event.stopPropagation(); setTouring(false); selectRef.current(index); });
      pin.addEventListener('mouseenter', () => setHot(index));
      pin.addEventListener('mouseleave', () => setHot(-1));
      element.append(pin);
      markers.current[index] = new maplibre.Marker({ element, anchor: 'bottom', offset: [0, -4] }).setLngLat([point.lng, point.lat]).addTo(instance);
    }).then(() => {
      if (controller.signal.aborted) return;
      const hits = pointsRef.current.filter(Boolean).length;
      setStatus(failures === current.length ? 'Couldn’t reach the place finder. Try again in a moment.'
        : hits === current.length ? 'Tap a pin or a place to fly there.' : `${hits} of ${current.length} places found on the map.`);
      const pick = pendingPick.current; pendingPick.current = null;
      if (pick !== null && hits) {
        const target = pointsRef.current[pick] ? pick : pointsRef.current.findIndex(Boolean);
        selectRef.current(target);
      } else fitPlaces(pointsRef.current);
    });
    return () => controller.abort();
    // flyToCountry/fitPlaces read only refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, category, places, code]);

  useEffect(() => {
    markers.current.forEach((marker, i) => {
      const pin = marker?.getElement().firstElementChild;
      pin?.classList.toggle('is-active', i === active);
      pin?.classList.toggle('is-hot', i === hot && i !== active);
      // Keep the chosen pin above its neighbours.
      if (marker) marker.getElement().style.zIndex = i === active ? '3' : i === hot ? '2' : '';
    });
  }, [active, hot, points]);

  const step = (direction: 1 | -1) => {
    if (!found.length) return;
    const position = found.indexOf(active);
    const next = position < 0 ? (direction > 0 ? found[0] : found[found.length - 1]) : found[(position + direction + found.length) % found.length];
    select(next);
  };
  const stepRef = useRef(step);
  useEffect(() => { stepRef.current = step; });

  // Guided tour: hop from place to place until stopped.
  useEffect(() => {
    if (!touring) return;
    const timer = setTimeout(() => stepRef.current(1), active < 0 ? 0 : 5200);
    return () => clearTimeout(timer);
  }, [touring, active]);

  const surprise = () => {
    const options = topics.filter(([key]) => key !== 'areasToAvoid').map(([key]) => key);
    if (!options.length) return;
    const topic = options[Math.floor(Math.random() * options.length)];
    const index = Math.floor(Math.random() * places[topic].length);
    setTouring(false);
    if (topic === category && pointsRef.current.some(p => p !== undefined)) {
      select(pointsRef.current[index] ? index : found[Math.floor(Math.random() * found.length)] ?? -1);
    } else { pendingPick.current = index; setCategory(topic); }
  };
  const worldView = () => {
    const instance = map.current; if (!instance) return;
    setTouring(false); setActive(-1); popup.current?.remove();
    instance.flyTo({ center: [instance.getCenter().lng, 15], zoom: 1.2, pitch: 0, bearing: 0, duration: reducedMotion() ? 0 : 1800 });
    instance.once('moveend', () => setSpinning(true));
  };
  const countryView = () => { setTouring(false); setSpinning(false); setActive(-1); popup.current?.remove(); if (!flyToCountry()) fitPlaces(pointsRef.current); };
  const chooseTopic = (key: Category) => { if (key !== category) { pendingPick.current = null; setSpinning(false); setCategory(key); } };

  const chip = 'rounded-full border border-line bg-surface px-3 py-2 text-xs font-semibold text-ink transition-colors hover:border-accent/50 disabled:opacity-40 disabled:hover:border-line';
  const busy = plotted && points.some(p => p === undefined) && ready;

  return <section ref={section} className="bg-surface border border-line rounded-2xl overflow-hidden mb-6">
    <div className="p-5 border-b border-line"><h2 className="text-xl font-bold text-ink">Explore the map</h2><p className="text-sm text-muted mt-1">Pick a topic to drop pins, then tap a place to fly there. Hit <b>Tour</b> to hop between them, or <b>Surprise me</b> for a random pick.</p></div>
    <div className="flex flex-wrap gap-2 p-4" role="group" aria-label="Map topics">{topics.map(([key, label]) => <button key={key} type="button" aria-pressed={category === key} onClick={() => chooseTopic(key)} className={`rounded-full px-4 py-2 text-sm border transition-colors ${category === key ? 'bg-action text-action-ink border-action' : 'border-line text-ink bg-surface hover:border-accent/50'}`}>{label}<span className="ml-1.5 text-xs opacity-70">{places[key].length}</span></button>)}</div>
    <div className="grid lg:grid-cols-[260px_1fr] gap-4 p-4 pt-0">
      <div className="space-y-2 max-h-64 lg:max-h-[520px] overflow-y-auto order-2 lg:order-1">
        {category === 'areasToAvoid' && <p className="text-sm text-muted p-3 bg-surface-alt rounded-xl">These are unverified notes from the guide, not live safety alerts, so they are not plotted as danger zones. Check <a className="underline" href="https://www.gov.uk/foreign-travel-advice" target="_blank" rel="noreferrer">current official travel advice</a> and local updates.</p>}
        {!list.length && <p className="text-sm text-muted p-3">No places listed for this topic yet.</p>}
        {list.map((place, i) => {
          const point = points[i];
          const missing = plotted && point === null;
          return <div key={`${place.label}-${i}`} className={`rounded-xl border transition-colors ${active === i ? 'border-action bg-surface-alt' : hot === i ? 'border-accent/50' : 'border-line'}`}>
            <button type="button" disabled={!plotted} onClick={() => { setTouring(false); select(i); }} onMouseEnter={() => setHot(i)} onMouseLeave={() => setHot(-1)} aria-pressed={active === i}
              className="flex w-full items-center gap-3 p-3 text-left text-sm disabled:cursor-default">
              {plotted && <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${missing ? 'bg-surface-alt text-subtle' : active === i ? 'bg-inverse text-white' : 'bg-[#8f5524] text-white'}`} aria-hidden="true">{point === undefined && ready ? '·' : i + 1}</span>}
              <span className="min-w-0 flex-1"><span className={`block truncate ${active === i ? 'text-ink font-semibold' : 'text-ink'}`}>{place.label}</span>
                {(place.detail || missing || point?.approximate) && <span className="block truncate text-xs text-subtle">{missing ? 'Not on this map' : point?.approximate ? `Near ${place.detail}` : place.detail}</span>}</span>
            </button>
            {plotted && (active === i || missing) && <a className="block px-3 pb-2 -mt-1 text-xs text-accent underline" href={mapsLink(place, country)} target="_blank" rel="noreferrer">Open in Google Maps ↗</a>}
          </div>;
        })}
      </div>
      <div className="min-w-0 order-1 lg:order-2"><div className="relative rounded-xl overflow-hidden border border-line">
        <div ref={container} className="map-space h-[360px] sm:h-[480px]" aria-label={`Interactive map of ${country}`} />
        {(!ready || mapError) && <div className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-semibold text-white/85"><span className="rounded-full bg-black/40 px-4 py-2 backdrop-blur-sm">{mapError || (near ? 'Loading the globe…' : 'Map loads as you scroll')}</span></div>}
        {ready && status && <div className="pointer-events-none absolute left-3 top-3 max-w-[70%] rounded-full bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm" role="status">{busy && <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-amber-300 align-middle" />}{status}</div>}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-surface border-t border-line">
          {plotted && <>
            <button type="button" className={chip} disabled={!found.length} onClick={() => { setTouring(false); step(-1); }} aria-label="Previous place"><ChevronLeft size={14} /></button>
            <button type="button" className={chip} disabled={!found.length} onClick={() => { setTouring(false); step(1); }} aria-label="Next place"><ChevronRight size={14} /></button>
            <button type="button" className={`${chip} ${touring ? '!bg-action !text-action-ink !border-action' : ''}`} disabled={found.length < 2} aria-pressed={touring} onClick={() => { setSpinning(false); setTouring(value => !value); }}>{touring ? '⏸ Stop tour' : '✈ Tour'}</button>
          </>}
          <button type="button" className={chip} disabled={!ready} onClick={surprise}>🎲 Surprise me</button>
          <span className="mx-1 hidden h-5 w-px bg-line sm:inline-block" aria-hidden="true" />
          <button type="button" className={chip} disabled={!ready} aria-pressed={night} onClick={() => setNight(value => !value)}>{night ? '☀ Day' : '☾ Night'}</button>
          <button type="button" className={chip} disabled={!ready} aria-pressed={tilted} onClick={() => { const next = !tilted; setTilted(next); map.current?.easeTo({ pitch: next && (map.current?.getZoom() ?? 0) >= 13 ? 50 : 0, duration: 400 }); }}>🏙 3D</button>
          <button type="button" className={chip} disabled={!ready} onClick={worldView}>🌐 World</button>
          <button type="button" className={chip} disabled={!ready} onClick={countryView}>📍 {country}</button>
        </div>
      </div></div>
    </div>
  </section>;
}
