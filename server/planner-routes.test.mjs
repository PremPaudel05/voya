import test from 'node:test';
import assert from 'node:assert/strict';
import itinerary from '../api/itinerary.mjs';
import chat from '../api/chat.mjs';
test('direct Vercel provider functions are closed for every method', () => {
  for (const handler of [itinerary,chat]) for (const method of ['GET','POST','OPTIONS']) {
    const res={statusCode:0,body:null,setHeader(){},status(n){this.statusCode=n;return this},json(value){this.body=value;return this}};
    handler({method,body:{countryName:'Nepal'}},res);
    assert.equal(res.statusCode,410);assert.equal(res.body.code,'PLANNER_MOVED');
  }
});
test('all Express aliases reject generation without making provider calls', async () => {
  process.env.VERCEL='1';
  const {default:app}=await import('./index.mjs');
  const server=app.listen(0,'127.0.0.1'); await new Promise(resolve=>server.once('listening',resolve));
  const original=globalThis.fetch; let upstream=0;
  globalThis.fetch=async()=>{upstream++;throw new Error('Unexpected AI call')};
  try {
    for(const path of ['/api/plan','/plan','/api/itinerary','/itinerary','/api/chat','/chat']) for(const method of ['GET','POST']) {
      const res=await original(`http://127.0.0.1:${server.address().port}${path}`,{method});
      assert.equal(res.status,410,`${method} ${path}`);
    }
    assert.equal(upstream,0);
  } finally {globalThis.fetch=original;await new Promise(resolve=>server.close(resolve))}
});
