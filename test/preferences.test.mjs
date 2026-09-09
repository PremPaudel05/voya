import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { interfaceDefaults } from '../shared/preferences.ts';
import { translate } from '../src/preferences/translations.ts';

const bootstrap=readFileSync(new URL('../public/appearance.js',import.meta.url),'utf8');
function appearance(stored,dark=false,blocked=false){const root={dataset:{},lang:''};runInNewContext(bootstrap,{document:{documentElement:root},localStorage:{getItem(){if(blocked)throw new Error('Blocked');return stored;}},matchMedia:()=>({matches:dark})});return root;}
test('saved appearance applies before hydration and follows the system when requested',()=>{
  assert.equal(appearance('{"theme":"dark"}',false).dataset.theme,'dark');
  assert.equal(appearance('{"theme":"light"}',true).dataset.theme,'light');
  assert.equal(appearance('{"theme":"system","appearanceVersion":1}',true).dataset.theme,'dark');
  assert.equal(appearance('{"theme":"system","appearanceVersion":1}',false).dataset.theme,'light');
  const root=appearance('{"theme":"dark","contrast":"high","reducedMotion":true,"language":"fr"}');
  assert.equal(root.dataset.contrast,'high');assert.equal(root.dataset.motion,'reduced');assert.equal(root.lang,'fr');
});
test('blocked or malformed browser storage leaves a usable default appearance',()=>{
  for(const stored of ['not json','null','{}','{"theme":"invalid","language":"invalid"}']){
    const root=appearance(stored,true);assert.equal(root.dataset.theme,'light');assert.equal(root.lang,'en');
  }
  assert.equal(appearance(null,true,true).dataset.theme,'light');
  assert.deepEqual(interfaceDefaults({theme:'invalid',notifications:{browser:'true'}}),interfaceDefaults());
});
test('new and legacy automatic preferences use light on dark devices before and after hydration',()=>{
  for(const saved of [{}, {theme:'system'}, {theme:'invalid'}, {theme:'light'}, {theme:'dark'}, {theme:'system',appearanceVersion:1}]){
    const normalized=interfaceDefaults(saved);
    const expected=normalized.theme==='system'?'dark':normalized.theme;
    assert.equal(appearance(JSON.stringify(saved),true).dataset.theme,expected);
    assert.equal(appearance(JSON.stringify(normalized),true).dataset.theme,expected);
    assert.deepEqual(interfaceDefaults(normalized),normalized);
  }
  assert.equal(interfaceDefaults().theme,'light');
  assert.equal(interfaceDefaults({theme:'system'}).theme,'light');
  const chosen=interfaceDefaults({...interfaceDefaults(),theme:'system'});
  assert.equal(chosen.theme,'system');
  assert.equal(interfaceDefaults(chosen).theme,'system');
});
test('legacy preferences retain safe notification defaults without inventing browser consent',()=>{
  assert.deepEqual(interfaceDefaults({theme:'dark'}).notifications,{inApp:true,browser:false});
  assert.deepEqual(interfaceDefaults({notifications:{inApp:false,browser:true}}).notifications,{inApp:false,browser:true});
});
test('supported interface languages translate controls and interpolate user-visible values',()=>{
  assert.equal(translate('es','Delete account'),'Eliminar cuenta');
  assert.equal(translate('fr','Save settings'),'Enregistrer les paramètres');
  assert.equal(translate('es','Welcome, {name}.',{name:'Alex'}),'Hola, Alex.');
  assert.equal(translate('fr','Welcome, {name}.',{name:'Alex'}),'Bienvenue, Alex.');
});
