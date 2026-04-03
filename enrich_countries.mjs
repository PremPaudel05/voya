// Automated enrichment script for all countries
// Fetches attractions, foods, images, and more from Wikipedia/Wikidata/Open Food Facts
import { getNames } from 'country-list';
import fs from 'fs';
import fetch from 'node-fetch';

const countries = getNames();
const results = {};

async function fetchWikipediaSummary(title) {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return await res.json();
}

async function fetchAttractions(country) {
  // Try to get a list of top attractions from Wikipedia
  const search = `${country} tourist attractions`;
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(search)}&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.query?.search) return [];
  return data.query.search.slice(0, 5).map(item => item.title);
}

async function fetchFoods(country) {
  // Try to get a list of national dishes from Wikipedia
  const search = `${country} cuisine`;
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(search)}&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.query?.search) return [];
  return data.query.search.slice(0, 5).map(item => item.title);
}

async function fetchImage(title) {
  // Get image from Wikipedia summary
  const summary = await fetchWikipediaSummary(title);
  return summary?.thumbnail?.source || null;
}

async function enrichCountry(country) {
  const summary = await fetchWikipediaSummary(country);
  const attractions = await fetchAttractions(country);
  const foods = await fetchFoods(country);
  const attractionData = await Promise.all(attractions.map(async (a) => ({
    name: a,
    image: await fetchImage(a)
  })));
  const foodData = await Promise.all(foods.map(async (f) => ({
    name: f,
    image: await fetchImage(f)
  })));
  return {
    summary: summary?.extract || '',
    image: summary?.thumbnail?.source || null,
    attractions: attractionData,
    foods: foodData
  };
}

(async () => {
  for (const country of countries) {
    console.log('Enriching', country);
    results[country] = await enrichCountry(country);
  }
  fs.writeFileSync('autoCountryData.json', JSON.stringify(results, null, 2));
  console.log('Done! Data saved to autoCountryData.json');
})();
