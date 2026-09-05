import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveCountry, resolveCountryCode } from './countryIdentity.mjs';
import { selectAttractionImage, findAttractionImage } from './attractionImages.mjs';

test('country names accept case, whitespace, and explicit aliases only', () => {
  for (const [name, code] of [['Japan', 'JP'], [' nePAL ', 'NP'], ['USA', 'US'], ['United Kingdom', 'GB'], ['South Korea', 'KR'], ['Turkey', 'TR'], ['Côte d’Ivoire', 'CI']]) {
    assert.equal(resolveCountryCode(name), code, name);
  }
  for (const name of ['Jaopan', 'Japn', 'Nepa', 'Atlantis', 'Japan vacation', '', '<Japan>']) {
    assert.equal(resolveCountryCode(name), null, name);
  }
});

test('valid countries have all core profile data without an API request', () => {
  const france = resolveCountry('France');
  assert.equal(france?.cca2, 'FR');
  assert.deepEqual(france?.capital, ['Paris']);
  assert.ok(Number(france?.population) > 0);
  assert.equal(france?.currencies?.EUR?.name, 'Euro');
  assert.ok(france?.timezones?.length);
  assert.match(france?.flags?.svg || '', /^https:/);
});

test('attraction images reject unrelated city photos and prefer exact landmarks', () => {
  const page = (title, file) => ({ title, thumbnail: { source: `https://upload.wikimedia.org/wikipedia/commons/${file}.jpg` } });
  const city = page('Tokyo', 'skyline');
  const temple = page('Sensō-ji', 'temple');
  assert.equal(selectAttractionImage([city, temple], 'Senso-ji Temple'), temple.thumbnail.source);
  assert.equal(selectAttractionImage([city], 'Senso-ji Temple'), null);
  assert.equal(selectAttractionImage([{ ...temple, pageprops: { disambiguation: '' } }], 'Senso-ji Temple'), null);
  assert.equal(selectAttractionImage([page('Sensō-ji', 'flag')], 'Senso-ji Temple'), null);
});

test('image lookup returns no random fallback when provider has no match', async () => {
  assert.equal(await findAttractionImage('Senso-ji Temple', 'Japan', async () => ({ ok: true, json: async () => ({ query: { pages: {} } }) })), null);
});

test('country endpoint rejects misspellings before any upstream request', async () => {
  process.env.VERCEL = '1';
  const { default: app } = await import('./index.mjs');
  const server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  const realFetch = globalThis.fetch;
  let upstreamCalls = 0;
  globalThis.fetch = async () => { upstreamCalls++; throw new Error('Unexpected upstream call'); };
  try {
    const response = await realFetch(`http://127.0.0.1:${server.address().port}/api/country?name=Jaopan`);
    assert.equal(response.status, 404);
    assert.equal((await response.json()).isValidCountry, false);
    assert.equal(upstreamCalls, 0);
  } finally {
    globalThis.fetch = realFetch;
    await new Promise(resolve => server.close(resolve));
  }
});
