// Optional maintainer task, never a build dependency: cache country-checked photos.
// Failed lookups remain eligible for the live resolver; no random image fallback.
import fs from 'node:fs/promises';
import { getAllCountries } from 'country-info-pro';
import { matchingPages, titlesFor, photoKey, photoUrl } from '../server/attractionImages.mjs';
process.env.VERCEL = '1';
const { getAttractionsData } = await import('../server/index.mjs');
const destination = new URL('../server/attractionPhotoManifest.json', import.meta.url);
const entries = [];
const existing = JSON.parse(await fs.readFile(destination, 'utf8'));
for (const country of getAllCountries()) {
  const attractions = getAttractionsData(country.name.common, country.capital?.[0]);
  for (const attraction of attractions) {
    if (process.argv.includes('--missing') && existing[photoKey(attraction.name, country.name.common)]) continue;
    if (attraction.name.startsWith(`${country.name.common} `) && /National Museum|Historic Center|Nature Reserve|Central Market|Cultural Site/.test(attraction.name)) continue;
    entries.push({ name: attraction.name, country: country.name.common, code: country.cca2 });
  }
}
const values = (entity, prop) => (entity?.claims?.[prop] || []).filter(c => c.rank !== 'deprecated').map(c => c.mainsnak?.datavalue?.value).filter(Boolean);
const normalize = value => String(value).normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, '');
const headers = { 'User-Agent': 'Voya/2.0 (https://voyatravel.vercel.app; photo catalogue refresh)' };
async function query(host, params) {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const r = await fetch(`https://${host}/w/api.php?${new URLSearchParams({ ...params, format: 'json' })}`, { headers, signal: AbortSignal.timeout(18000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json(); if (data.error) throw new Error(data.error.code);
      return data;
    } catch (e) { if (attempt) { console.log(`Lookup deferred: ${e.message}`); return {}; } }
  }
}
async function batches(list, work) {
  const unique = [...new Set(list)].filter(Boolean); const chunks = [];
  for (let i = 0; i < unique.length; i += 40) chunks.push(unique.slice(i, i + 40));
  const results = [];
  for (let i = 0; i < chunks.length; i += 2) {
    results.push(...await Promise.all(chunks.slice(i, i + 2).map(work)));
    console.log(`Batch ${Math.min(i + 2, chunks.length)}/${chunks.length}`);
  }
  return results;
}
console.log(`Resolving named attractions: ${entries.length} across ${new Set(entries.map(e => e.code)).size} countries/territories`);
const titles = entries.flatMap(e => titlesFor(e.name, e.country));
const pages = await batches(titles, titles => query('en.wikipedia.org', { action: 'query', titles: titles.join('|'), redirects: '1', prop: 'pageimages|pageprops', piprop: 'name|thumbnail', pithumbsize: '960' }));
const data = { query: { pages: Object.assign({}, ...pages.map(p => p.query?.pages || {})), redirects: pages.flatMap(p => p.query?.redirects || []), normalized: pages.flatMap(p => p.query?.normalized || []) } };
for (const entry of entries) entry.candidates = matchingPages(data, entry.name, entry.country);
const items = Object.assign({}, ...await batches(entries.flatMap(e => e.candidates.map(p => p.pageprops?.wikibase_item)), ids => query('www.wikidata.org', { action: 'wbgetentities', ids: ids.join('|'), props: 'claims' })).then(rows => rows.map(r => r.entities || {})));
const countries = Object.assign({}, ...await batches(Object.values(items).flatMap(item => values(item, 'P17').map(v => v.id)), ids => query('www.wikidata.org', { action: 'wbgetentities', ids: ids.join('|'), props: 'claims' })).then(rows => rows.map(r => r.entities || {})));
const matched = entries.flatMap(entry => {
  const page = entry.candidates.find(page => values(items[page.pageprops?.wikibase_item], 'P17').some(value => values(countries[value.id], 'P297').includes(entry.code)));
  if (!page) return [];
  const item = items[page.pageprops.wikibase_item];
  const files = [...new Map([page.pageimage, ...values(item, 'P18')].filter(file => typeof file === 'string').map(file => [normalize(file), file])).values()].slice(0, 3);
  return [{ ...entry, page, files }];
});
console.log(`Country-verified landmark pages: ${matched.length}`);
const fileRows = await batches(matched.flatMap(e => e.files.map(file => `File:${file}`)), titles => query('commons.wikimedia.org', { action: 'query', titles: titles.join('|'), prop: 'imageinfo', iiprop: 'url|mime|extmetadata', iiurlwidth: '960', iiextmetadatafilter: 'Artist|LicenseShortName' }));
const files = new Map(fileRows.flatMap(r => Object.values(r.query?.pages || {}).map(page => [normalize(page.title), page.imageinfo?.[0]])));
const plain = value => String(value || '').replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').trim().slice(0,350);
const output = JSON.parse(await fs.readFile(destination, 'utf8'));
for (const entry of matched) {
  const images = entry.files.flatMap(file => {
    const info = files.get(normalize(`File:${file}`));
    if (!info || !/^image\/(jpeg|png|webp)$/.test(info.mime)) return [];
    const url = photoUrl(info.thumburl) || photoUrl(info.url); if (!url) return [];
    return [{ url, originalUrl: photoUrl(info.url), sourceUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(`File:${file}`)}`, author: plain(info.extmetadata?.Artist?.value) || 'Wikimedia Commons contributor', license: plain(info.extmetadata?.LicenseShortName?.value) || 'See source for license' }];
  });
  if (images.length) output[photoKey(entry.name,entry.country)] = { name: entry.name, countryCode: entry.code, articleTitle: entry.page.title, entityId: entry.page.pageprops.wikibase_item, articleUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(entry.page.title)}`, images, checkedAt: new Date().toISOString() };
}
await fs.writeFile(destination, JSON.stringify(Object.fromEntries(Object.entries(output).sort()), null, 2) + '\n');
const missing = entries.filter(e => !output[photoKey(e.name,e.country)]).map(({name,country}) => ({name,country}));
await fs.writeFile(new URL('../photo-audit-pending.json',import.meta.url), JSON.stringify(missing,null,2));
console.log(JSON.stringify({cached:Object.keys(output).length,countries:new Set(Object.values(output).map(v=>v.countryCode)).size,liveLookupRequired:missing.length}));
