export interface AttractionPhoto {
  articleTitle: string;
  images: { imageUrl: string; sourceUrl: string; author: string; license: string }[];
}
const cache = new Map<string, AttractionPhoto>();
export async function loadAttractionPhoto(name: string, country: string, signal: AbortSignal, refresh = false): Promise<AttractionPhoto> {
  const key = JSON.stringify([country, name]);
  if (!refresh && cache.has(key)) return cache.get(key)!;
  const response = await fetch(`/api/attraction-photo?${new URLSearchParams({ name, country, v: '2', ...(refresh ? { refresh: '1' } : {}) })}`, { signal, cache: refresh ? 'reload' : 'default' });
  if (!response.ok) throw new Error('The photo could not be loaded.');
  const photo: AttractionPhoto = await response.json();
  if (!photo.images?.length) throw new Error('No matching photo is available.');
  if (cache.size >= 300) cache.delete(cache.keys().next().value!);
  cache.set(key, photo);
  return photo;
}
