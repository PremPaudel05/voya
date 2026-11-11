import { useEffect, useRef, useState } from 'react';
import type { Map as MapInstance, Marker } from 'maplibre-gl';
import type { CountryData } from '../types';
import 'maplibre-gl/dist/maplibre-gl.css';

const categories = [
  ['cities', '🌍 Cities'], ['bestFoodAreas', '🍽 Best Food Areas'],
  ['nightlifeZones', '🎉 Nightlife Zones'], ['instagrammableSpots', '📸 Photo Spots'],
  ['bestBeaches', '🏖 Beaches'], ['areasToAvoid', '⚠️ Areas to Avoid'],
] as const;
type Category = typeof categories[number][0];

export function MapSection({ mapData }: { mapData: CountryData['mapData'] }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<MapInstance | null>(null);
  const marker = useRef<Marker | null>(null);
  const [ready, setReady] = useState(false);
  const [category, setCategory] = useState<Category>('cities');
  const [selected, setSelected] = useState('');
  const [status, setStatus] = useState('Loading the globe…');
  const [night, setNight] = useState(false);
  const [tilted, setTilted] = useState(true);
  const [resetCount, setResetCount] = useState(0);
  const [query, setQuery] = useState(mapData.countryQuery);
  useEffect(() => {
    let disposed = false;
    import('maplibre-gl').then(lib => {
      if (disposed || !container.current) return;
      try {
        const instance = new lib.Map({ container: container.current, center: [0, 20], zoom: 1.5, minZoom: 0, maxZoom: 18,
          cooperativeGestures: false, rotateSpeed: 0.3, pitchSpeed: -0.2,
          dragPan: { linearity: 0.15, maxSpeed: 500, deceleration: 3500 },
          style: { version: 8, sources: { base: { type: 'raster', tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize: 256, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>' , maxzoom: 19 } }, layers: [{ id: 'base', type: 'raster', source: 'base' }] } });
        map.current = instance;
        // Keep wheel gestures inside the map, with gentler wheel and trackpad zoom.
        instance.scrollZoom.setWheelZoomRate(1 / 900);
        instance.scrollZoom.setZoomRate(1 / 200);
        instance.addControl(new lib.NavigationControl(), 'top-right');
        instance.on('load', () => { instance.setProjection({ type: 'globe' }); setReady(true); });
        instance.on('error', () => setStatus('Some map tiles could not load. You can still open places in Maps.'));
      } catch { setStatus('This device could not open the 3D map. Use the place links below.'); }
    }).catch(() => setStatus('The map could not load. Use the place links below.'));
    return () => { disposed = true; marker.current?.remove(); map.current?.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    // Load satellite tiles only after the visitor first selects Night view.
    if (night && !instance.getSource('city-lights')) {
      instance.addSource('city-lights', {
        type: 'raster', tileSize: 256, maxzoom: 8,
        tiles: ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_CityLights_2012/default/2012-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg'],
        attribution: '<a href="https://science.nasa.gov/earth/earth-observatory/night-lights-2012-the-black-marble-79803/" target="_blank" rel="noreferrer">NASA / NOAA VIIRS city lights (2012)</a>',
      });
      instance.addLayer({ id: 'city-lights', type: 'raster', source: 'city-lights', paint: { 'raster-fade-duration': 300 } });
    }
    if (instance.getLayer('city-lights')) instance.setLayoutProperty('city-lights', 'visibility', night ? 'visible' : 'none');
    // Satellite imagery has regional detail, so avoid stretching it to street zoom.
    instance.setMaxZoom(night ? 8 : 18);
  }, [night, ready]);
  useEffect(() => {
    setCategory('cities'); setSelected(''); setQuery(mapData.countryQuery);
  }, [mapData.countryQuery]);
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    let cancelled = false;
    marker.current?.remove();
    setStatus('Finding this place…');
    const timer = setTimeout(() => controller.abort(), 12000);
    fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5&lang=en`, { signal: controller.signal })
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(async data => {
        const candidates = data.features || [];
        const isCountry = query === mapData.countryQuery;
        const cityQuery = mapData.cities.some(c => c.query === query);
        const feature = (isCountry ? candidates.find((f: { properties?: { type?: string } }) => f.properties?.type === 'country') : cityQuery ? candidates.find((f: { properties?: { type?: string } }) => ['city', 'town'].includes(f.properties?.type || '')) : candidates[0]);
        if (!feature) throw new Error();
        const coordinates = feature.geometry?.coordinates;
        if (!Array.isArray(coordinates) || coordinates.length !== 2 || !coordinates.every(Number.isFinite)) throw new Error();
        const lib = await import('maplibre-gl');
        if (controller.signal.aborted || !map.current) return;
        const point: [number, number] = [coordinates[0], coordinates[1]];
        marker.current = new lib.Marker({ color: '#8f5524' }).setLngLat(point).addTo(map.current);
        map.current.flyTo({ center: point, zoom: Math.min(query === mapData.countryQuery ? 5 : 12, map.current.getMaxZoom()), pitch: tilted ? 50 : 0, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 1400 });
        setStatus(`Map match: ${[feature.properties?.name, feature.properties?.city, feature.properties?.country].filter(Boolean).join(', ')}. Approximate location; check the match before visiting.`);
      }).catch(() => { if (cancelled) return; if (!controller.signal.aborted) setStatus('No map match found. Try the Maps link for this place.'); else if (map.current) setStatus('Location lookup timed out. Try the Maps link.'); })
      .finally(() => clearTimeout(timer));
    return () => { cancelled = true; clearTimeout(timer); controller.abort(); };
  }, [query, ready, mapData.countryQuery, resetCount]);
  const items = category === 'cities' ? mapData.cities.map(c => c.name) : (mapData[category] || []).filter(Boolean);
  const choose = (item: string) => {
    setSelected(item);
    if (category !== 'areasToAvoid') setQuery(category === 'cities' ? mapData.cities.find(c => c.name === item)?.query || `${item}, ${mapData.countryQuery}` : `${item}, ${mapData.countryQuery}`);
  };
  return <section className="bg-surface border border-line rounded-2xl overflow-hidden mb-6">
    <div className="p-5 border-b border-line"><h2 className="text-xl font-bold text-ink">Explore the map</h2><p className="text-sm text-muted mt-1">Choose a topic, then a place. Drag to look around and scroll over the map to zoom. Move your pointer outside the map to scroll the page. On a phone, pinch to zoom.</p></div>
    <div className="flex flex-wrap gap-2 p-4" aria-label="Map topics">{categories.map(([key, label]) => <button key={key} aria-pressed={category === key} onClick={() => { setCategory(key); setSelected(''); }} className={`rounded-full px-4 py-2 text-sm border ${category === key ? 'bg-action text-action-ink border-action' : 'border-line text-ink bg-surface'}`}>{label}</button>)}</div>
    <div className="grid lg:grid-cols-[260px_1fr] gap-4 p-4 pt-0">
      <div className="space-y-2 lg:max-h-[480px] overflow-y-auto">
        {category === 'areasToAvoid' && <p className="text-sm text-muted p-3 bg-surface-alt rounded-xl">These are unverified notes from the guide, not live safety alerts. They are not plotted as danger zones. Check <a className="underline" href="https://www.gov.uk/foreign-travel-advice" target="_blank" rel="noreferrer">current official travel advice</a> and local updates.</p>}
        {!items.length && <p className="text-sm text-muted p-3">No places listed for this topic yet.</p>}
        {items.map((item, i) => <button key={`${item}-${i}`} onClick={() => choose(item)} aria-pressed={selected === item} className={`block w-full text-left rounded-xl border p-3 text-sm ${selected === item ? 'border-action bg-surface-alt text-ink' : 'border-line text-muted'}`}>{item}</button>)}
        {selected && category !== 'areasToAvoid' && <a className="block text-sm text-accent underline p-2" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`} target="_blank" rel="noreferrer">Check this place in Maps ↗</a>}
      </div>
      <div className="min-w-0"><div className="relative rounded-xl overflow-hidden border border-line"><div ref={container} className="map-space h-[360px] sm:h-[480px]" aria-label="Interactive world map" />
      <div className="flex flex-wrap gap-2 p-3 bg-surface border-t border-line"><button className="bg-surface text-ink border border-line rounded-full px-3 py-2 text-xs" aria-pressed={night} onClick={() => setNight(value => !value)}>{night ? '☀ Day view' : '☾ Night view'}</button><button className="bg-surface text-ink border border-line rounded-full px-3 py-2 text-xs" onClick={() => { const next = !tilted; setTilted(next); map.current?.easeTo({ pitch: next ? 50 : 0, duration: 0 }); }} aria-pressed={tilted}>3D tilt</button><button className="bg-surface text-ink border border-line rounded-full px-3 py-2 text-xs" onClick={() => { setTilted(false); map.current?.flyTo({ center: [0, 20], zoom: 0, pitch: 0, bearing: 0, duration: 0 }); }}>World view</button><button className="bg-surface text-ink border border-line rounded-full px-3 py-2 text-xs" onClick={() => { setQuery(mapData.countryQuery); setSelected(''); setResetCount(n => n + 1); }}>Country view</button></div></div>
      <p className="text-xs text-muted mt-2">{night ? 'City lights from NASA satellite imagery (2012), not live. Switch to Day view for street detail.' : ''}</p><p role="status" className="text-xs text-muted mt-2">{status}</p><p className="text-xs text-subtle mt-1">Place suggestions come from the country guide. Location search by Photon / OpenStreetMap.</p></div>
    </div>
  </section>;
}
