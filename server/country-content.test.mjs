import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllCountries } from 'country-info-pro';
import { getCountryContent, countryContent, contentVersion } from './content/index.mjs';

const nonresidentCodes = new Set(['AQ', 'BV', 'GS', 'HM', 'TF', 'UM']);
const genericCopy = /Local Specialty|Folk Stew|Grilled Dish|Sweet Treat|Local festivals and celebrations|Traditional ceremonies|Diverse religious and spiritual practices|Popular traditional dish\.|Authentic local taste/i;

test('every supported country and territory has named food and specific cultural content', () => {
  const countries = getAllCountries();
  assert.equal(countries.length, 250);
  assert.deepEqual(Object.keys(countryContent).sort(), countries.map(c => c.cca2).sort());
  for (const country of countries) {
    const data = getCountryContent(country.cca2);
    const code = country.cca2;
    assert.ok(data, code);
    assert.equal(data.contentVersion, contentVersion);
    assert.doesNotMatch(JSON.stringify(data), genericCopy, code);
    assert.doesNotMatch(JSON.stringify(data), /\uFFFD|undefined/, code);
    if (nonresidentCodes.has(code)) {
      assert.deepEqual(data.foods, [], code);
      assert.ok(data.foodsNote.length > 50, code);
      assert.ok(data.culture.note, code);
    } else {
      assert.ok(data.foods.length >= 5, `${code}: at least five actual foods`);
      assert.ok(data.culture.traditions.length >= 2, `${code}: specific traditions`);
    }
    assert.equal(new Set(data.foods.map(f => f.name.toLowerCase())).size, data.foods.length, `${code}: duplicate dish`);
    for (const food of data.foods) {
      assert.ok(food.name.length > 1 && food.description.length > 10 && food.famousFor.length > 5, code);
    }
    for (const key of ['socialNorms', 'etiquetteTips']) {
      assert.ok(data.culture[key].length, `${code}: ${key}`);
      assert.ok(data.culture[key].every(item => typeof item === 'string' && item.length > 15), code);
    }
    assert.ok(data.culture.religionOverview.length > 20, code);
    for (const section of ['food', 'culture']) {
      assert.ok(data.contentSources[section].length, `${code}: ${section} references`);
      for (const source of data.contentSources[section]) {
        assert.equal(new URL(source.url).protocol, 'https:', code);
        assert.ok(source.title.length > 1, code);
        assert.ok(!source.url.includes('Special:Search'), code);
      }
    }
  }
});

test('country aliases and official names select the same content without mixing nearby countries', () => {
  for (const c of getAllCountries()) {
    assert.equal(getCountryContent(c.name.common), countryContent[c.cca2], c.name.common);
    assert.equal(getCountryContent(c.name.official), countryContent[c.cca2], c.name.official);
  }
  for (const [name, code] of [['  pAkIsTaN  ', 'PK'], ['Türkiye', 'TR'], ['Turkey', 'TR'], ['South Korea', 'KR'], ['North Korea', 'KP'], ['Côte d’Ivoire', 'CI'], ['USA', 'US'], ['DR Congo', 'CD'], ['Republic of the Congo', 'CG']]) {
    assert.equal(getCountryContent(name), countryContent[code], name);
  }
  for (const name of ['', 'Atlantis', 'Pakistan food', 'Pakstan', '__proto__', 'constructor']) {
    assert.equal(getCountryContent(name), null, name);
  }
  assert.notDeepEqual(countryContent.DM.foods, countryContent.DO.foods);
  assert.notDeepEqual(countryContent.CD.culture, countryContent.CG.culture);
  assert.ok(countryContent.FM.contentSources.culture.some(s => s.url.includes('Federated_States')));
  assert.ok(countryContent.IO.contentSources.food.every(s => !s.url.includes('Indian_cuisine')));
  assert.ok(countryContent.DM.contentSources.food.every(s => !s.url.includes('Dominican_cuisine')));
});

test('Pakistan has real dishes, regional traditions, and contextual etiquette', () => {
  const data = getCountryContent('Pakistan');
  for (const name of ['Sindhi biryani', 'Nihari', 'Chapli kebab', 'Chicken karahi', 'Haleem', 'Kheer', 'Gulab jamun']) assert.ok(data.foods.some(food => food.name === name), name);
  assert.match(data.foods.find(f => f.name === 'Chapli kebab').famousFor, /Peshawar/);
  assert.match(data.culture.traditions.join(' '), /Qawwali.*Ajrak.*Suri Jagek/);
  assert.match(data.culture.socialNorms.join(' '), /Assalamu alaikum/);
  assert.match(data.culture.etiquetteTips.join(' '), /right hand/);
});

test('country API returns bundled food and culture when every external service is offline', async () => {
  process.env.VERCEL = '1';
  const { default: app } = await import('./index.mjs');
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const realFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Simulated upstream outage'); };
  try {
    for (const [name, code] of [['United States','US'], ['Pakistan','PK'], ['South Korea','KR'], ['Côte d’Ivoire','CI'], ['Niue','NU'], ['Antarctica','AQ']]) {
      const response = await realFetch(`http://127.0.0.1:${server.address().port}/api/country?name=${encodeURIComponent(name)}`);
      assert.equal(response.status, 200, name);
      const data = await response.json();
      assert.deepEqual(data.foods, countryContent[code].foods, name);
      assert.deepEqual(data.culture, countryContent[code].culture, name);
      assert.deepEqual(data.contentSources, countryContent[code].contentSources, name);
      assert.equal(data.foodsNote, countryContent[code].foodsNote, name);
      assert.equal(data.overview.countryCode, code, name);
      assert.ok(data.festivals && data.festivals.year === new Date().getUTCFullYear());
      assert.doesNotMatch(data.bestTimeToVisit.majorFestivals.join(' '), /Local cultural festivals|National holidays/);
      if (code === 'US') assert.ok(data.festivals.calendar.some(event => event.name === 'Christmas Day'));
      if (code === 'AQ') assert.deepEqual(data.festivals.calendar, []);
    }
  } finally {
    globalThis.fetch = realFetch;
    await new Promise(resolve => server.close(resolve));
  }
});
