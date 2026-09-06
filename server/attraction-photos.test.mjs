import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAttractionPhoto, photoUrl } from './attractionImages.mjs';
import { createPhotoService, photoRevision } from './photoService.mjs';

const thumb = 'https://thumb.wikimedia.org/wikipedia/commons/thumb/4/43/Sensoji_2023.jpg/960px-Sensoji_2023.jpg';
const original = 'https://upload.wikimedia.org/wikipedia/commons/4/43/Sensoji_2023.jpg';
const statement = value => [{ mainsnak: { datavalue: { value } } }];
function fixture({ title = 'Sensō-ji', iso = 'JP', redirect, disambiguation = false } = {}) {
  const urls = [];
  return { urls, fetcher: async input => {
    const url = new URL(input); urls.push(url);
    let data;
    if (url.hostname === 'en.wikipedia.org') data = { query: { redirects: redirect ? [{ from: redirect, to: title }] : [], pages: { 1: { pageid: 1, title, pageimage: 'Sensoji_2023.jpg', pageprops: { wikibase_item: 'Q1', ...(disambiguation ? { disambiguation: '' } : {}) } } } } };
    else if (url.hostname === 'www.wikidata.org') data = { entities: { Q1: { claims: { P17: statement({ id: 'Q2' }), P18: statement('Sensoji 2023.jpg') } }, Q2: { claims: { P297: statement(iso) } } } };
    else data = { query: { pages: { 2: { title: 'File:Sensoji 2023.jpg', imageinfo: [{ mime: 'image/jpeg', thumburl: thumb, url: original, extmetadata: { Artist: { value: '<a href="x">A Photographer</a>' }, LicenseShortName: { value: 'CC BY-SA 4.0' } } }] } } } };
    return { ok: true, json: async () => data };
  } };
}

test('Sensō-ji uses a canonical title, official thumbnail host, and matching photo credits', async () => {
  const f = fixture(); const result = await resolveAttractionPhoto('Senso-ji Temple', 'Japan', f);
  assert.equal(result.articleTitle, 'Sensō-ji');
  assert.equal(result.images.length, 1);
  assert.equal(result.images[0].url, thumb);
  assert.equal(result.images[0].author, 'A Photographer');
  assert.ok(f.urls[0].searchParams.get('titles').includes('Sensō-ji'));
  assert.ok(!f.urls[0].searchParams.has('gsrsearch'));
});
test('aliases resolve to the named site while wrong-country and disambiguation matches are rejected', async () => {
  assert.equal((await resolveAttractionPhoto('Arashiyama Bamboo Grove', 'Japan', fixture({ title: 'Bamboo Forest (Kyoto)', redirect: 'Arashiyama Bamboo Grove' }))).articleTitle, 'Bamboo Forest (Kyoto)');
  assert.equal(await resolveAttractionPhoto('Senso-ji Temple', 'Japan', fixture({ iso: 'FR' })), null);
  assert.equal(await resolveAttractionPhoto('Senso-ji Temple', 'Japan', fixture({ title: 'Tokyo' })), null);
  assert.equal(await resolveAttractionPhoto('Senso-ji Temple', 'Japan', fixture({ disambiguation: true })), null);
});
test('the shared geographic validation works across regions, including same-name landmarks', async () => {
  for (const [country, iso] of [['Nepal','NP'],['Brazil','BR'],['Egypt','EG'],['New Zealand','NZ'],['Morocco','MA'],['Canada','CA']]) {
    assert.ok(await resolveAttractionPhoto('National Museum', country, fixture({ title: `National Museum (${country})`, iso })));
    assert.equal(await resolveAttractionPhoto('National Museum', country, fixture({ title: `National Museum (${country})`, iso: 'JP' })), null);
  }
});
test('only Wikimedia raster photo URLs are allowed; redirects cannot broaden the source allowlist', () => {
  assert.equal(photoUrl(`${thumb}?utm_source=test`), thumb);
  for (const url of ['http://upload.wikimedia.org/wikipedia/commons/a/photo.jpg','https://upload.wikimedia.org.evil.test/wikipedia/commons/a/photo.jpg','http://127.0.0.1/a.jpg','https://upload.wikimedia.org/wikipedia/commons/a/Flag_of_Japan.svg.png','https://thumb.wikimedia.org/wikipedia/commons/a/Map_of_Japan.jpg']) assert.equal(photoUrl(url), null);
});
const photo = { images: [{ url: thumb, originalUrl: original, author: 'Photographer', license: 'CC0' }] };
const jpeg = () => new Response(Buffer.from([255,216,255,224,0,0,255,217]), { headers: { 'content-type': 'image/jpeg' } });
test('transient metadata failures are retried and successful lookups are deduplicated and cached', async () => {
  let calls = 0;
  const service = createPhotoService({ seeds: {}, resolve: async () => { calls++; if (calls === 1) throw new Error('temporary'); return photo; } });
  await assert.rejects(service.getPhoto('Example', 'Japan'));
  const [a,b] = await Promise.all([service.getPhoto('Example','Japan'),service.getPhoto('Example','Japan')]);
  assert.equal(a,b); assert.equal(calls,2);
  await service.getPhoto('Example','Japan'); assert.equal(calls,2);
});
test('failed thumbnails recover from the same photo original and successful bytes are cached', async () => {
  const requested = [];
  const service = createPhotoService({ seeds: {}, resolve: async () => photo, fetcher: async url => { requested.push(url); return url === thumb ? new Response('Unavailable',{status:503}) : jpeg(); } });
  const result = await service.getImage('Example','Japan');
  assert.equal(result.type,'image/jpeg'); assert.deepEqual(requested,[thumb,original]);
  await service.getImage('Example','Japan'); assert.deepEqual(requested,[thumb,original,thumb]);
});
test('official host migrations are allowed but external redirects and HTML images are rejected', async () => {
  const service = createPhotoService({ seeds: {}, resolve: async () => ({images:[{url:original}]}), fetcher: async url => url === original ? new Response(null,{status:302,headers:{location:thumb}}) : jpeg() });
  assert.equal((await service.getImage('Example','Japan')).type,'image/jpeg');
  let calls = 0;
  const unsafe = createPhotoService({ seeds:{},resolve:async()=>({images:[{url:thumb}]}),fetcher:async()=>{calls++;return new Response(null,{status:302,headers:{location:'http://127.0.0.1/private.jpg'}});} });
  await assert.rejects(unsafe.getImage('Example','Japan')); assert.equal(calls,1);
  const html = createPhotoService({seeds:{},resolve:async()=>photo,fetcher:async()=>new Response('<html>error</html>',{headers:{'content-type':'image/jpeg'}})});
  await assert.rejects(html.getImage('Example','Japan'));
});
test('photo revisions preserve attribution when server instances have different metadata', async () => {
  const newer={images:[{url:original}]}; let calls=0;
  const service=createPhotoService({seeds:{'JP|example':photo},resolve:async()=>{calls++;return newer;},fetcher:async()=>jpeg()});
  assert.equal((await service.getImage('Example','Japan',0,photoRevision(newer.images[0]))).type,'image/jpeg');
  assert.equal(calls,1);
  assert.equal(await service.getImage('Example','Japan',0,'0000000000000000'),null);
});
