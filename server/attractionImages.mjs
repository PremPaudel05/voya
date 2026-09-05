const normalize = value => String(value).normalize('NFD').replace(/\p{M}/gu, '')
  .toLowerCase().replace(/\([^)]*\)/g, '').replace(/\b(temple|shrine)\b/g, '')
  .replace(/[^a-z0-9]/g, '');

export function selectAttractionImage(pages, name) {
  const aliases = { fushimiinari: 'fushimiinaritaisha', arashiyamabamboogrove: 'bambooforest' };
  const target = aliases[normalize(name)] || normalize(name);
  if (!target) return null;
  const match = pages.find(page => normalize(page.title) === target &&
    !Object.hasOwn(page.pageprops || {}, 'disambiguation') && page.thumbnail?.source &&
    /^https:\/\/upload\.wikimedia\.org\//.test(page.thumbnail.source) &&
    !/logo|badge|seal|emblem|flag|icon|coat.of.arms|\.svg/i.test(page.thumbnail.source));
  return match?.thumbnail.source || null;
}

export async function findAttractionImage(name, country, fetcher = fetch) {
  const params = new URLSearchParams({ action: 'query', generator: 'search',
    gsrsearch: `"${name}" ${country}`, gsrlimit: '5', prop: 'pageimages|pageprops',
    piprop: 'thumbnail', pithumbsize: '800', format: 'json' });
  const response = await fetcher(`https://en.wikipedia.org/w/api.php?${params}`, {
    signal: AbortSignal.timeout(6000), headers: { 'User-Agent': 'VoyaTravel/1.0 (travel guide)' },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return selectAttractionImage(Object.values(data?.query?.pages || {}), name);
}
