// Script to find direct Wikimedia Commons image URLs for all attractions
// Uses both Wikipedia page images AND Wikimedia Commons search to find the best match

import fs from 'fs';

const DELAY = 300; // ms between requests to be nice to Wikipedia API

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fetch the main image from a Wikipedia page directly by title
async function getWikiPageImage(pageTitle) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(pageTitle)}&prop=pageimages&piprop=thumbnail|original&pithumbsize=800&format=json&origin=*`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    const pages = data?.query?.pages;
    if (pages) {
      const page = Object.values(pages)[0];
      if (page?.thumbnail?.source && !page.thumbnail.source.includes('Flag_of') && !page.thumbnail.source.includes('Coat_of_arms')) {
        return { url: page.thumbnail.source, title: page.title, width: page.thumbnail.width };
      }
    }
  } catch (e) {}
  return null;
}

// Search Wikipedia and get the best matching page image
async function searchWikiImage(searchQuery) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrlimit=5&prop=pageimages&piprop=thumbnail|name&pithumbsize=800&format=json&origin=*`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    const pages = data?.query?.pages;
    if (pages) {
      const sorted = Object.values(pages).sort((a, b) => (a.index || 0) - (b.index || 0));
      const queryLower = searchQuery.toLowerCase();
      const queryWords = queryLower.split(/\s+/);
      
      const validPages = sorted.filter(p => {
        const thumb = p?.thumbnail;
        if (!thumb?.source) return false;
        if (/Flag_of|Coat_of_arms|map|Map_of|logo|Logo|icon/.test(thumb.source)) return false;
        return thumb.width >= 200;
      });

      if (validPages.length > 0) {
        // Score each page
        const scored = validPages.map(page => {
          const titleLower = (page.title || '').toLowerCase();
          let score = 0;
          for (const w of queryWords) {
            if (w.length > 2 && titleLower.includes(w)) score++;
          }
          if (titleLower === queryLower) score += 10;
          if (queryLower.includes(titleLower) && titleLower.length > 5) score += 2;
          if (titleLower.includes(queryLower)) score += 3;
          return { page, score };
        });
        scored.sort((a, b) => b.score - a.score);
        if (scored[0].score >= 2) {
          return { url: scored[0].page.thumbnail.source, title: scored[0].page.title };
        }
        // Fallback to first valid
        return { url: validPages[0].thumbnail.source, title: validPages[0].title };
      }
    }
  } catch (e) {}
  return null;
}

// Search Wikimedia Commons directly for a file image
async function searchCommonsImage(searchQuery) {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(searchQuery)}&gsrnamespace=6&gsrlimit=3&prop=imageinfo&iiprop=url|size&iiurlwidth=800&format=json&origin=*`;
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    const pages = data?.query?.pages;
    if (pages) {
      const sorted = Object.values(pages).sort((a, b) => (a.index || 0) - (b.index || 0));
      for (const page of sorted) {
        const ii = page?.imageinfo?.[0];
        if (ii?.thumburl && ii.width >= 400 && !ii.thumburl.includes('Flag_of') && !ii.thumburl.includes('Coat_of_arms')) {
          return { url: ii.thumburl, title: page.title };
        }
      }
    }
  } catch (e) {}
  return null;
}

async function findBestImage(attractionName, searchQuery) {
  // Strategy 1: Try direct Wikipedia page lookup by attraction name
  let result = await getWikiPageImage(attractionName);
  if (result && result.width >= 300) {
    return { url: result.url, method: 'direct-page', title: result.title };
  }
  await sleep(DELAY);

  // Strategy 2: Search Wikipedia with the search query
  result = await searchWikiImage(searchQuery);
  if (result) {
    return { url: result.url, method: 'wiki-search', title: result.title };
  }
  await sleep(DELAY);

  // Strategy 3: Search Wikimedia Commons
  result = await searchCommonsImage(searchQuery);
  if (result) {
    return { url: result.url, method: 'commons', title: result.title };
  }
  await sleep(DELAY);

  // Strategy 4: Try with just the attraction name on Commons
  result = await searchCommonsImage(attractionName);
  if (result) {
    return { url: result.url, method: 'commons-name', title: result.title };
  }

  return null;
}

// Parse all attractions from the files
async function main() {
  console.log('Finding best images for all attractions...\n');
  
  // Import the data
  const { knownAttractionsData } = await import('./server/countryData.mjs');
  
  const results = {};
  let total = 0;
  let found = 0;
  let failed = 0;

  for (const [country, attractions] of Object.entries(knownAttractionsData)) {
    results[country] = [];
    for (const attr of attractions) {
      total++;
      const query = attr.imageSearchQuery || `${attr.name} ${attr.city}`;
      
      process.stdout.write(`[${total}] ${country}: ${attr.name} ... `);
      
      const img = await findBestImage(attr.name, query);
      
      if (img) {
        found++;
        console.log(`✓ (${img.method}: ${img.title})`);
        results[country].push({
          name: attr.name,
          imageUrl: img.url,
          method: img.method,
          matchTitle: img.title
        });
      } else {
        failed++;
        console.log('✗ NO IMAGE FOUND');
        results[country].push({
          name: attr.name,
          imageUrl: null,
          method: 'none'
        });
      }
      
      await sleep(DELAY);
    }
  }

  console.log(`\n\nResults: ${found}/${total} found, ${failed} failed\n`);
  
  // Write results to JSON
  fs.writeFileSync('image_urls.json', JSON.stringify(results, null, 2));
  console.log('Results written to image_urls.json');
}

main().catch(console.error);
