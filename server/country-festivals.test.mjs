import test from 'node:test';
import assert from 'node:assert/strict';
import { getAllCountries } from 'country-info-pro';
import { countryContent } from './content/index.mjs';
import additions from './content/food-expansion.mjs';
import { getCountryFestivals } from './content/festivals.mjs';

const noCalendar = new Set(['AQ', 'BV', 'GS', 'HM', 'TF', 'UM', 'IO']);

test('every inhabited food profile is expanded and each addition has a direct reference', () => {
  for (const [code, content] of Object.entries(countryContent)) {
    if (!content.foods.length) continue;
    assert.ok(additions[code]?.length >= 2, code);
    for (const food of additions[code]) {
      assert.equal(new URL(food.source.url).protocol, 'https:', `${code}: ${food.name}`);
      assert.ok(content.contentSources.food.some(source => source.url === food.source.url));
    }
  }
  for (const name of ['Burgers', 'Pizza', 'Fried chicken', 'Mac and cheese', 'Gumbo', 'Barbecue brisket', 'Clam chowder']) {
    assert.ok(countryContent.US.foods.some(food => food.name === name), name);
  }
  assert.ok(countryContent.FR.foods.some(food => food.name === 'Croissant' && food.source.url.includes('france.fr')));
  assert.ok(countryContent.NP.foods.some(food => food.name === 'Chatamari' && food.source.url.includes('ntb.gov.np')));
});

test('all supported identities receive a sourced calendar or an explicit community-context note', () => {
  for (const country of getAllCountries()) {
    const code = country.cca2;
    const result = getCountryFestivals(code, 2026);
    assert.equal(result.year, 2026);
    assert.ok(result.note.length > 50);
    assert.deepEqual(getCountryFestivals(country.name.common, 2026), result, code);
    if (noCalendar.has(code)) {
      assert.deepEqual(result.calendar, []);
    } else {
      assert.ok(result.calendar.length + result.highlights.length > 0, code);
      assert.ok(result.sources.length, code);
    }
    const seen = new Set();
    for (const event of [...result.highlights, ...result.calendar]) {
      assert.ok(event.name.length > 2, code);
      assert.equal(new URL(event.source.url).protocol, 'https:', code);
      assert.doesNotMatch(event.name, /Local cultural festivals|Religious holidays|National holidays|undefined/);
    }
    for (const event of result.calendar) {
      const key = `${event.name}:${event.kind}`;
      assert.ok(!seen.has(key), `${code}: duplicate calendar row`);
      seen.add(key);
      assert.ok(event.dates.length || event.dateNote, code);
      for (const date of event.dates) assert.match(date, /^2026-\d{2}-\d{2}$/);
    }
  }
  assert.equal(getCountryFestivals('Atlantis'), null);
  assert.equal(getCountryFestivals('__proto__'), null);
});

test('US Christmas and familiar holidays remain visible with correct dates and observed-day labels', () => {
  const calendar = getCountryFestivals('USA', 2026).calendar;
  const date = name => calendar.find(event => event.name === name)?.dates;
  assert.deepEqual(date('Christmas Day'), ['2026-12-25']);
  assert.deepEqual(date('Thanksgiving Day'), ['2026-11-26']);
  assert.deepEqual(date('Independence Day'), ['2026-07-04']);
  assert.deepEqual(date('Independence Day (observed)'), ['2026-07-03']);
  assert.deepEqual(date('Halloween'), ['2026-10-31']);
  assert.ok(calendar.find(event => event.name === 'Christmas Day').source.url.includes('opm.gov'));
  assert.ok(getCountryFestivals('US', 2026).highlights.some(event => event.name === 'Mardi Gras' && /New Orleans/.test(event.timing)));
  assert.deepEqual(getCountryFestivals('US', 2027).calendar.find(event => event.name === 'Thanksgiving Day').dates, ['2027-11-25']);
  assert.deepEqual(getCountryFestivals('US', 2027).calendar.find(event => event.name === 'Christmas Day (observed)').dates, ['2027-12-24']);
});

test('local supplements cover omissions without presenting calculated lunar dates as confirmed', () => {
  const india = getCountryFestivals('India', 2026);
  assert.ok(india.highlights.some(event => event.name === 'Holi'));
  assert.ok(india.highlights.some(event => event.name === 'Diwali / Deepavali'));
  assert.ok(getCountryFestivals('NP', 2026).highlights.some(event => event.name === 'Tihar'));
  const pakistan = getCountryFestivals('PK', 2026).calendar;
  assert.ok(pakistan.some(event => event.name.includes('Christmas') && event.source.url.includes('cabinet.gov.pk')));
  const eid = pakistan.find(event => event.name.includes('Eid al-Fitr'));
  assert.deepEqual(eid.dates, []);
  assert.match(eid.dateNote, /moon sighting/);
  assert.deepEqual(getCountryFestivals('CA', 2026).calendar.find(event => event.name === 'Thanksgiving').dates, ['2026-10-12']);
  assert.equal(getCountryFestivals('JP', 2026).calendar.find(event => event.name === 'Christmas Day').kind, 'observance');
  assert.ok(getCountryFestivals('CN', 2026).calendar.filter(event => event.name === 'Spring Festival').length === 1);
});
