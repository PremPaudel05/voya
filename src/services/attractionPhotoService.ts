export interface AttractionImage {
  /** Same-origin proxy; always works, and resizes full-size originals. */
  imageUrl: string;
  /** Wikimedia CDN thumbnail; fastest when present. */
  directUrl?: string;
  directSrcSet?: string;
  sourceUrl: string;
  author: string;
  license: string;
}
export interface AttractionPhoto {
  articleTitle: string;
  /** Set when no landmark photo was verified and this shows the city it is in. */
  approximate?: boolean;
  subject?: string;
  images: AttractionImage[];
}
const cache = new Map<string, AttractionPhoto>();
export async function loadAttractionPhoto(name: string, country: string, signal: AbortSignal, refresh = false, city = ''): Promise<AttractionPhoto> {
  const key = JSON.stringify([country, name]);
  if (!refresh && cache.has(key)) return cache.get(key)!;
  const response = await fetch(`/api/attraction-photo?${new URLSearchParams({ name, country, v: '3', ...(city ? { city } : {}), ...(refresh ? { refresh: '1' } : {}) })}`, { signal, cache: refresh ? 'reload' : 'default' });
  if (response.status === 404) throw new NoPhotoError();
  if (!response.ok) throw new Error('The photo could not be loaded.');
  const photo: AttractionPhoto = await response.json();
  if (!photo.images?.length) throw new NoPhotoError();
  if (cache.size >= 300) cache.delete(cache.keys().next().value!);
  cache.set(key, photo);
  return photo;
}
/** The provider answered, and there is no verified photo to show. Retrying will not help. */
export class NoPhotoError extends Error {
  constructor() { super('No matching photo is available.'); }
}
