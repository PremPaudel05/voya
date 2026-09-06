import manifest from './attractionPhotoManifest.json' with { type: 'json' };
import { createHash } from 'node:crypto';
import { photoKey, photoUrl, resolveAttractionPhoto } from './attractionImages.mjs';

const DAY = 86_400_000;
const MAX_BYTES = 4_000_000; // Stay below Vercel's function response limit.
export const photoRevision = image => createHash('sha256').update(image.url).digest('hex').slice(0, 16);
function remember(cache, key, value, limit) {
  if (cache.size >= limit) cache.delete(cache.keys().next().value);
  cache.set(key, value);
}
export function createPhotoService({ fetcher = fetch, resolve = resolveAttractionPhoto, seeds = manifest, now = Date.now } = {}) {
  const metadata = new Map();
  const pending = new Map();
  const images = new Map();
  async function getPhoto(name, country, refresh = false) {
    const key = photoKey(name, country);
    const cached = metadata.get(key);
    if (!refresh && cached && now() - cached.time < DAY) return cached.photo;
    if (!refresh && seeds[key] && !cached) {
      remember(metadata, key, { photo: seeds[key], time: now() }, 1500);
      return seeds[key];
    }
    if (pending.has(key)) return pending.get(key);
    const task = (async () => {
      try {
        const photo = await resolve(name, country, { fetcher });
        if (photo) remember(metadata, key, { photo, time: now() }, 1500);
        return photo || cached?.photo || seeds[key] || null;
      } catch (error) {
        // Retain known matching metadata during a provider outage.
        if (cached?.photo || seeds[key]) return cached?.photo || seeds[key];
        throw error;
      } finally { pending.delete(key); }
    })();
    pending.set(key, task);
    return task;
  }
  async function readImage(url) {
    if (!photoUrl(url)) throw new Error('Unapproved image source');
    const cached = images.get(url);
    if (cached && now() - cached.time < DAY) return cached;
    // Wikimedia can move thumbnails between its upload and thumbnail hosts.
    // Validate every redirect before following it; this is never an open proxy.
    let response;
    let source = url;
    const signal = AbortSignal.timeout(6500);
    for (let hop = 0; hop < 3; hop++) {
      response = await fetcher(source, { redirect: 'manual', signal });
      if (![301, 302, 303, 307, 308].includes(response.status)) break;
      const next = photoUrl(new URL(response.headers.get('location') || '', source).href);
      await response.body?.cancel();
      if (!next) throw new Error('Unapproved image redirect');
      source = next;
    }
    const type = response.headers.get('content-type')?.split(';')[0];
    if (!response.ok || !['image/jpeg', 'image/png', 'image/webp'].includes(type) || Number(response.headers.get('content-length')) > MAX_BYTES) throw new Error('Image temporarily unavailable');
    const reader = response.body.getReader();
    const chunks = []; let length = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > MAX_BYTES) throw new Error('Image exceeds delivery limit');
        chunks.push(value);
      }
    } finally { await reader.cancel().catch(() => {}); }
    const body = Buffer.concat(chunks);
    const valid = type === 'image/jpeg' ? body[0] === 0xff && body[1] === 0xd8 && body[2] === 0xff :
      type === 'image/png' ? body.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) :
        body.subarray(0, 4).toString() === 'RIFF' && body.subarray(8, 12).toString() === 'WEBP';
    if (!valid) throw new Error('Invalid image response');
    const result = { body, type, time: now() };
    remember(images, url, result, 24);
    return result;
  }
  async function getImage(name, country, index = 0, revision = '') {
    let photo = await getPhoto(name, country);
    if (revision && !photo?.images.some(image => photoRevision(image) === revision)) photo = await getPhoto(name, country, true);
    const image = revision ? photo?.images.find(image => photoRevision(image) === revision) : photo?.images[index];
    if (!image) return null;
    let error;
    // Thumbnail failure can recover from the original of the SAME photo.
    for (const url of [...new Set([image.url, image.originalUrl].filter(Boolean))]) {
      try { return await readImage(url); } catch (e) { error = e; }
    }
    throw error || new Error('Image temporarily unavailable');
  }
  return { getPhoto, getImage };
}
export const photoService = createPhotoService();
