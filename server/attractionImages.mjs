import { resolveCountryCode } from './countryIdentity.mjs';

const WIKI = 'https://en.wikipedia.org/w/api.php';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const DATA = 'https://www.wikidata.org/w/api.php';
const headers = { 'User-Agent': 'Voya/2.0 (country insights; https://voyatravel.vercel.app)' };
const entities = new Map();
const canonicalTitles = {
  'JP|sensoji': 'Sensō-ji', 'JP|sensojitemple': 'Sensō-ji',
  'JP|fushimiinarishrine': 'Fushimi Inari-taisha',
  'JP|arashiyamabamboogrove': 'Bamboo Forest (Kyoto)',
  'BR|christtheredeemer': 'Christ the Redeemer (statue)',
  'BR|pelourinhohistoriccenter': 'Historic Center of Salvador',
  'MX|tulumruins': 'Tulum (Maya site)',
  'IN|jaipurcitypalace': 'City Palace, Jaipur', 'IN|varanasighats': 'Ghats in Varanasi',
  'KR|nseoultower': 'N Seoul Tower', 'CN|lirivercruise': 'Li River',
  'GB|bigbenhousesofparliament': 'Palace of Westminster',
  'ES|plazadeespana': 'Plaza de España, Seville', 'TR|bluemosque': 'Blue Mosque, Istanbul',
  'GR|acropolis': 'Acropolis of Athens', 'AR|buenosaireslaboca': 'La Boca',
  'PT|dourovalley': 'Douro DOC', 'PT|ribeiradistrict': 'Ribeira (Porto)',
  'ID|ubudriceterraces': 'Tegallalang', 'MY|georgetownheritage': 'George Town, Penang',
  'SA|edgeoftheworld': 'Edge of the World (Saudi Arabia)', 'MA|saharadesertergchebbi': 'Erg Chebbi',
  'CO|cartagenaoldtown': 'Cartagena, Colombia', 'PH|elnido': 'El Nido, Palawan',
  'NZ|queenstown': 'Queenstown, New Zealand', 'NL|keukenhofgardens': 'Keukenhof',
  'NL|kinderdijkwindmills': 'Windmills at Kinderdijk', 'AT|ststephenscathedral': "St. Stephen's Cathedral, Vienna",
  'AT|salzburgoldtown': 'Historic Centre of the City of Salzburg', 'SE|icehotel': 'Icehotel (Jukkasjärvi)',
  'DK|thelittlemermaid': 'The Little Mermaid (statue)', 'CZ|kutnahorabonechurch': 'Sedlec Ossuary',
  'HU|szechenyithermalbath': 'Széchenyi thermal bath', 'HR|dubrovnikoldtown': 'Old Town of Dubrovnik',
  'IL|masadafortress': 'Masada', 'IL|bahaigardens': 'Terraces (Baháʼí)',
  'JO|jerashruins': 'Jerash', 'LK|ellaninearchbridge': 'Nine Arch Bridge',
  'KH|royalpalace': 'Royal Palace of Cambodia', 'CU|varaderobeach': 'Varadero',
  'BB|bridgetownhistoriccore': 'Historic Bridgetown and its Garrison',
  'GD|underwatersculpturepark': 'Molinere Underwater Sculpture Park',
  'IR|isfahanpersianbazaar': 'Bazaar of Isfahan', 'IR|persepolisruins': 'Persepolis',
  'LC|pitonsunescosite': 'Pitons (Saint Lucia)', 'LC|diamondfallsbotanicalgarden': 'Diamond Botanical Gardens',
  'LY|tadrartacacusdesert': 'Acacus Mountains', 'LY|ghadamesoldtown': 'Ghadames',
  'TV|vaitupuisland': 'Vaitupu', 'TV|nanumeaatoll': 'Nanumea',
};
const normalize = value => String(value).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const baseTitle = title => String(title).replace(/\s*\([^)]*\)\s*$/, '');
const values = (entity, property) => (entity?.claims?.[property] || []).filter(c => c.rank !== 'deprecated').map(c => c.mainsnak?.datavalue?.value).filter(Boolean);
export const photoKey = (name, country) => `${resolveCountryCode(country)}|${normalize(name)}`;

export function photoUrl(value) {
  try {
    const url = new URL(value);
    const file = decodeURIComponent(url.pathname.split('/').at(-1));
    if (url.protocol !== 'https:' || url.username || url.password || url.port || !['upload.wikimedia.org', 'thumb.wikimedia.org'].includes(url.hostname) || !url.pathname.startsWith('/wikipedia/commons/') ||
      !/\.(jpe?g|png|webp)$/i.test(file) || /\.svg|(?:^|[\s_\-])(flag|logo|map|seal|badge|icon|emblem|coat.of.arms)(?:[\s_.\-]|$)/i.test(file)) return null;
    url.search = ''; // Tracking parameters are unnecessary for image delivery.
    return url.href;
  } catch { return null; }
}

export function titlesFor(name, country) {
  return [...new Set([canonicalTitles[photoKey(name, country)], name,
    baseTitle(name), name.replace(/\s+(Temple|Shrine)$/i, ''), `${name} (${country})`].filter(Boolean))];
}
export function matchingPages(data, name, country) {
  const titles = titlesFor(name, country);
  // Follow explicit Wikipedia aliases; never take the first search result.
  const allowed = new Set(titles.map(normalize));
  for (let i = 0; i < 4; i++) for (const row of [...data?.query?.normalized || [], ...data?.query?.redirects || []]) {
    if (allowed.has(normalize(row.from))) allowed.add(normalize(row.to));
  }
  return Object.values(data?.query?.pages || {}).filter(page => page.pageid > 0 &&
    !Object.hasOwn(page.pageprops || {}, 'disambiguation') &&
    (allowed.has(normalize(page.title)) || titles.some(title => normalize(baseTitle(page.title)) === normalize(baseTitle(title))) ||
      (page.redirects || []).some(alias => allowed.has(normalize(alias.title)))));
}

// Kept as a small pure matcher for callers/tests; geographic validation is below.
export function selectAttractionImage(pages, name) {
  const target = normalize(name.replace(/\s+(Temple|Shrine)$/i, ''));
  const page = pages.find(page => normalize(baseTitle(page.title)) === target &&
    !Object.hasOwn(page.pageprops || {}, 'disambiguation') && photoUrl(page.thumbnail?.source));
  return page ? photoUrl(page.thumbnail.source) : null;
}

export async function resolveAttractionPhoto(name, country, { fetcher = fetch, timeout = 18_000 } = {}) {
  const code = resolveCountryCode(country);
  if (!code || !name || name.length > 200) return null;
  const deadline = Date.now() + timeout;
  async function json(endpoint, params) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new Error('Photo lookup timed out');
    const response = await fetcher(`${endpoint}?${new URLSearchParams({ ...params, format: 'json' })}`, {
      headers, signal: AbortSignal.timeout(Math.min(6500, remaining)),
    });
    if (!response.ok) throw new Error(`Photo provider returned ${response.status}`);
    const data = await response.json();
    if (data.error) throw new Error('Photo provider could not complete the lookup');
    return data;
  }
  async function getEntities(ids) {
    const unique = [...new Set(ids)].filter(id => /^Q\d+$/.test(id));
    const cacheable = fetcher === fetch;
    const missing = unique.filter(id => !cacheable || !entities.has(id));
    let loaded = {};
    if (missing.length) {
      loaded = (await json(DATA, { action: 'wbgetentities', ids: missing.join('|'), props: 'claims' })).entities || {};
      if (cacheable) for (const [id, entity] of Object.entries(loaded)) {
        if (entities.size >= 2000) entities.delete(entities.keys().next().value);
        entities.set(id, entity);
      }
    }
    return Object.fromEntries(unique.map(id => [id, loaded[id] || entities.get(id)]));
  }
  async function inCountry(entity) {
    let current = [entity];
    // Administrative parents cover sites whose country is recorded on their city.
    for (let depth = 0; depth < 3; depth++) {
      const countryIds = current.flatMap(item => values(item, 'P17').map(v => v.id));
      if (countryIds.length) {
        const countries = await getEntities(countryIds);
        if (Object.values(countries).some(item => values(item, 'P297').includes(code))) return true;
      }
      const parents = current.flatMap(item => values(item, 'P131').map(v => v.id)).slice(0, 8);
      if (!parents.length) return false;
      current = Object.values(await getEntities(parents));
      if (current.some(item => values(item, 'P297').includes(code))) return true;
    }
    return false;
  }
  const props = { action: 'query', prop: 'pageimages|pageprops|redirects', piprop: 'thumbnail|original|name',
    pithumbsize: '800', rdlimit: '20', redirects: '1' };
  let data = await json(WIKI, { ...props, titles: titlesFor(name, country).join('|') });
  let candidates = matchingPages(data, name, country);
  let searched = false;
  if (!candidates.length) {
    data = await json(WIKI, { ...props, generator: 'search', gsrsearch: `${name} ${country}`, gsrlimit: '6' });
    candidates = matchingPages(data, name, country);
    searched = true;
  }
  let items = await getEntities(candidates.map(page => page.pageprops?.wikibase_item));
  for (let index = 0; index < candidates.length || !searched; index++) {
    if (index >= candidates.length) {
      searched = true;
      data = await json(WIKI, { ...props, generator: 'search', gsrsearch: `${name} ${country}`, gsrlimit: '6' });
      const more = matchingPages(data, name, country).filter(page => !candidates.some(previous => previous.pageid === page.pageid));
      candidates.push(...more);
      items = { ...items, ...await getEntities(more.map(page => page.pageprops?.wikibase_item)) };
      if (index >= candidates.length) break;
    }
    const page = candidates[index];
    const entityId = page.pageprops?.wikibase_item;
    const entity = items[entityId];
    if (!entity || !await inCountry(entity)) continue;
    const files = [...new Map([page.pageimage, ...values(entity, 'P18')].filter(file => typeof file === 'string').map(file => [normalize(file), file])).values()].slice(0, 3);
    if (!files.length) continue;
    const info = await json(COMMONS, { action: 'query', titles: files.map(file => `File:${file}`).join('|'),
      prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: '960',
      iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl|AttributionRequired' });
    const images = files.flatMap(file => {
      const row = Object.values(info?.query?.pages || {}).find(p => normalize(p.title) === normalize(`File:${file}`));
      const image = row?.imageinfo?.[0];
      if (!image || !/^image\/(jpeg|png|webp)$/.test(image.mime)) return [];
      const url = photoUrl(image.thumburl) || photoUrl(image.url);
      if (!url) return [];
      // Render metadata as text in React, never as provider HTML.
      const plain = value => String(value || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim().slice(0, 350);
      return [{ url, originalUrl: photoUrl(image.url), sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(`File:${file}`)}`,
        author: plain(image.extmetadata?.Artist?.value) || 'Wikimedia Commons contributor',
        license: plain(image.extmetadata?.LicenseShortName?.value) || 'See source for license' }];
    });
    if (images.length) return { name, countryCode: code, articleTitle: page.title, entityId,
      articleUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`, images, checkedAt: new Date().toISOString() };
  }
  return null;
}

export async function findAttractionImage(name, country, fetcher = fetch) {
  return (await resolveAttractionPhoto(name, country, { fetcher }))?.images[0]?.url || null;
}
