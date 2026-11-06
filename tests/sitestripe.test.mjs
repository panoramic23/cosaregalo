import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {validateConfig,selection,readConfig} from '../lib/sitestripe.mjs';
import products from '../api/products.mjs';
import admin from '../api/admin.mjs';
process.env.AMAZON_PARTNER_TAG='test-only-21';
process.env.ADMIN_DASHBOARD_TOKEN='test-only-admin-token-123456789';
delete process.env.KV_REST_API_URL;delete process.env.KV_REST_API_TOKEN;
const link=()=>({type:'speaker-bluetooth',group:'portatili',kind:'product',asin:'TESTASIN01',title:'Fixture only — not a product',url:'https://www.amazon.it/dp/TESTASIN01?tag=test-only-21',source:'sitestripe',verified:true,verifiedAt:new Date().toISOString(),evidence:'Fixture for automated tests only'});
const config=(x=link())=>({mode:'sitestripe',links:[x]});
function response(){return {statusCode:200,headers:{},status(c){this.statusCode=c;return this},setHeader(k,v){this.headers[k]=v;return this},json(data){this.data=data;return this}};}
test('valid product and group preserve original URL, never publish prices or evidence',()=>{
 const c=validateConfig(config());assert.equal(c.links[0].url,link().url);
 const result=selection(c,'speaker-bluetooth','portatili');assert.equal(result.items[0].price,null);assert.equal(result.items[0].availability,null);assert.equal(result.items[0].evidence,undefined);
 const g={...link(),kind:'group',asin:null,url:'https://www.amazon.it/s?k=test&tag=test-only-21'};
 assert.equal(selection(validateConfig(config(g)),g.type,g.group).groupLink,g.url);
 assert.equal(selection(c,'cuffie-wireless','anc').items.length,0);
});
test('reject hostile, unverified, wrong-tag and mismatched links',()=>{
 const variants=[{url:'https://amazon.it.evil.test/dp/TESTASIN01?tag=test-only-21'},{url:'https://user@amazon.it/dp/TESTASIN01?tag=test-only-21'},{url:'http://amazon.it/dp/TESTASIN01?tag=test-only-21'},{url:'https://amzn.to/test'},{url:'https://amazon.it/dp/TESTASIN02?tag=test-only-21'},{url:'https://amazon.it/dp/TESTASIN01?tag=other'},{url:'https://amazon.it/dp/TESTASIN01?tag=test-only-21&tag=test-only-21'},{url:'https://amazon.it/dp/TESTASIN01?tag=test-only-21&redirect=https://evil.test'},{verified:false},{source:'manual'},{verifiedAt:'bad'},{verifiedAt:new Date(Date.now()+86400000).toISOString()},{verifiedAt:'2020-01-01'},{evidence:''},{type:'__proto__'},{group:'constructor'},{asin:'invalid'}];
 for(const v of variants)assert.throws(()=>validateConfig(config({...link(),...v})),JSON.stringify(v));
 assert.throws(()=>validateConfig({mode:'invalid',links:[]}));
 assert.throws(()=>validateConfig({mode:'sitestripe',links:[link(),link()]}));
});
test('products default to editorial-safe SiteStripe with no Amazon calls',async()=>{
 const original=globalThis.fetch;globalThis.fetch=()=>{throw Error('Network must not be called')};
 try{const res=response();await products({method:'GET',query:{type:'speaker-bluetooth',group:'portatili'}},res);assert.equal(res.statusCode,200);assert.equal(res.data.source,'sitestripe');assert.deepEqual(res.data.items,[]);assert.equal(res.data.groupLink,null);
 const bad=response();await products({method:'GET',query:{type:'__proto__',group:'constructor'}},bad);assert.equal(bad.statusCode,400);
 const post=response();await products({method:'POST'},post);assert.equal(post.statusCode,405);
 }finally{globalThis.fetch=original}
});
test('admin requires authorization, persistence unavailable is explicit',async()=>{
 const denied=response();await admin({method:'GET',headers:{},query:{mode:'sitestripe'}},denied);assert.equal(denied.statusCode,401);
 const req={method:'POST',headers:{authorization:'Bearer '+process.env.ADMIN_DASHBOARD_TOKEN},query:{mode:'sitestripe'},body:config()};
 const unavailable=response();await admin(req,unavailable);assert.equal(unavailable.statusCode,503);
});
test('Redis round-trip, revoked links, API failure fallback and storage outage fail closed',async()=>{
 const original=globalThis.fetch;let saved=JSON.stringify(config());
 process.env.KV_REST_API_URL='https://storage.invalid';process.env.KV_REST_API_TOKEN='test';
 globalThis.fetch=async(url,options)=>{
  if(url==='https://storage.invalid'){const [command,,value]=JSON.parse(options.body);if(command==='SET')saved=value;return {ok:true,json:async()=>({result:command==='GET'?saved:'OK'})};}
  if(String(url).includes('/auth/'))return {ok:true,json:async()=>({access_token:'fixture',expires_in:3600})};
  return {ok:false,status:403,json:async()=>({type:'AccessDeniedException',reason:'AssociateNotEligible'})};
 };
 try{
  const req={method:'POST',headers:{authorization:'Bearer '+process.env.ADMIN_DASHBOARD_TOKEN},query:{mode:'sitestripe'},body:config()};const res=response();await admin(req,res);assert.equal(res.statusCode,200);assert.equal((await readConfig()).links.length,1);
  const invalid=response();await admin({...req,body:config({...link(),verified:false})},invalid);assert.equal(invalid.statusCode,400);assert.equal((await readConfig()).links.length,1);
  saved=JSON.stringify({...config(),mode:'api'});process.env.AMAZON_CREATORS_CLIENT_ID='fixture';process.env.AMAZON_CREATORS_CLIENT_SECRET='fixture';
  const p=response();await products({method:'GET',query:{type:'speaker-bluetooth',group:'portatili'}},p);assert.equal(p.statusCode,200);assert.equal(p.data.reason,'AssociateNotEligible');assert.equal(p.data.items.length,1);
  saved=JSON.stringify({mode:'sitestripe',links:[]});assert.equal((await readConfig()).links.length,0);
  saved=JSON.stringify(config({...link(),verifiedAt:'2020-01-01'}));assert.equal((await readConfig()).links.length,0);
  globalThis.fetch=async()=>{throw Error('offline')};assert.deepEqual(await readConfig(),{mode:'editorial',links:[]});
 }finally{globalThis.fetch=original;delete process.env.KV_REST_API_URL;delete process.env.KV_REST_API_TOKEN;delete process.env.AMAZON_CREATORS_CLIENT_ID;delete process.env.AMAZON_CREATORS_CLIENT_SECRET;}
});
test('all static HTML and source catalog lack unverified Amazon URLs',async()=>{
 async function walk(dir){for(const x of await readdir(dir,{withFileTypes:true})){if(x.name.startsWith('.'))continue;const path=dir+'/'+x.name;if(x.isDirectory())await walk(path);else if(path.endsWith('.html'))assert.doesNotMatch(await readFile(path,'utf8'),/href="https:\/\/(?:www\.)?amazon\.it\//);}}
 await walk(new URL('..',import.meta.url).pathname);
 assert.doesNotMatch(await readFile(new URL('../content/tipologie.json',import.meta.url),'utf8'),/amazon\.it\//);
});
test('SiteGround Node adapter serves default mode, protected admin and static fallback',async()=>{
 const server=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'31987'},stdio:['ignore','pipe','pipe']});
 try{await Promise.race([once(server.stdout,'data'),once(server,'exit').then(()=>{throw Error('server exited')}),new Promise((_,reject)=>setTimeout(()=>reject(Error('startup timeout')),5000).unref())]);
 const base='http://127.0.0.1:31987';
 assert.equal((await (await fetch(base+'/health')).json()).ok,true);
 const r=await fetch(base+'/api/products?type=speaker-bluetooth&group=portatili');assert.equal(r.status,200);assert.equal((await r.json()).source,'sitestripe');assert.equal(r.headers.get('cache-control'),'no-store');
 assert.equal((await fetch(base+'/api/admin?mode=sitestripe')).status,401);
 assert.equal((await fetch(base+'/api/products',{method:'POST',headers:{'content-type':'application/json'},body:'{'})).status,400);
 assert.equal((await fetch(base+'/content/sitestripe.json')).status,404);
 const html=await (await fetch(base+'/tipologie/speaker-bluetooth/')).text();assert.match(html,/ESEMPIO EDITORIALE/);assert.doesNotMatch(html,/href="https:\/\/www.amazon.it/);
 assert.deepEqual((await (await fetch(base+'/api/deals')).json()).items,[]);
 }finally{if(server.exitCode===null){server.kill();await once(server,'exit');}}
});
