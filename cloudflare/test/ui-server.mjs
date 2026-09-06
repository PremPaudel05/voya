// Local-only browser fixture: no production account, secrets, or AI calls.
// Run explicitly with Node 24 alongside the test Vite configuration.
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import { handle, digest } from '../src/index.ts';
const sql = new DatabaseSync(':memory:');
sql.exec('PRAGMA foreign_keys=ON');
for (const file of fs.readdirSync(new URL('../migrations/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort()) sql.exec(fs.readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
const wrap=(query,params=[])=>({bind:(...values)=>wrap(query,values),first:async()=>sql.prepare(query).get(...params)||null,run:async()=>({success:true,meta:sql.prepare(query).run(...params)}),all:async()=>({results:sql.prepare(query).all(...params),success:true})});
const DB={prepare:wrap,batch:async statements=>{sql.exec('BEGIN');try{const results=[];for(const statement of statements)results.push(await statement.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}}};
const now=Math.floor(Date.now()/1000);
sql.prepare('INSERT INTO users(id,name,email,created_at) VALUES(?,?,?,?)').run('demo','Alex Explorer','alex@example.test',now);
sql.prepare('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').run(await digest('a'.repeat(64)),'demo',now+86400);
for(const country of ['Nepal','Japan','Morocco'])sql.prepare('INSERT INTO search_history VALUES(?,?,?)').run('demo',country,now);
const env={DB,ALLOWED_ORIGINS:'http://localhost:5173,http://127.0.0.1:5173',GOOGLE_CLIENT_ID:'',TURNSTILE_SITE_KEY:'',TURNSTILE_SECRET_KEY:'',IP_HASH_SECRET:'local-test-only',AI:{run:async()=>{throw new Error('No AI calls in local browser fixture');}}};
createServer(async(req,res)=>{
  try {
    const buffers=[];for await(const chunk of req)buffers.push(chunk);
    const body=Buffer.concat(buffers);
    const headers=new Headers();for(const [key,value]of Object.entries(req.headers)){if(value)headers.set(key,Array.isArray(value)?value.join(','):value);}
    headers.set('CF-Connecting-IP','127.0.0.1');
    const response=await handle(new Request('http://localhost:8788'+req.url,{method:req.method,headers,...(body.length?{body,duplex:'half'}:{})}),env);
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(await response.text());
  }catch(e){res.writeHead(500);res.end(String(e));}
}).listen(8788,'127.0.0.1',()=>console.log('Local account fixture: http://127.0.0.1:8788'));
