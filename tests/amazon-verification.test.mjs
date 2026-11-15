import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {normalizeCreatorItem,testCreatorsAccess,testCreatorsGetItems,amazonFreshness} from '../api/products.mjs';
import admin from '../api/admin.mjs';
import guideProducts from '../api/guide-products.mjs';
process.env.AMAZON_PARTNER_TAG='230b7-21';
process.env.AMAZON_CREATORS_CLIENT_ID='fixture';
process.env.AMAZON_CREATORS_CLIENT_SECRET='fixture';
const asin='B0BTJ9WHL9';
const item=()=>({asin,detailPageURL:'https://www.amazon.it/dp/'+asin+'?tag=230b7-21',itemInfo:{title:{displayValue:'Sony WH-CH520 fixture model'}},images:{primary:{large:{url:'https://m.media-amazon.com/images/I/fixture.jpg'}}},offersV2:{listings:[{price:{money:{amount:25,currency:'EUR',displayAmount:'25,00 €'}},availability:{message:'Fixture only'}}]}});
const response=()=>({statusCode:200,headers:{},status(c){this.statusCode=c;return this},setHeader(k,v){this.headers[k]=v;return this},json(data){this.data=data;return this}});

test('normalizer binds ASIN, Italian destination and unchanged partner tag; only valid EUR offers and approved images',()=>{
 const p=normalizeCreatorItem(item());assert.equal(p.priceAmount,25);assert.equal(p.url,item().detailPageURL);
 for(const url of ['https://www.amazon.it/dp/B00NVDP3ZU?tag=230b7-21','https://www.amazon.it/dp/'+asin+'?tag=other','https://www.amazon.it/dp/'+asin+'?tag=230b7-21&tag=230b7-21','https://www.amazon.it.evil.test/dp/'+asin+'?tag=230b7-21'])assert.equal(normalizeCreatorItem({...item(),detailPageURL:url}),null);
 assert.equal(normalizeCreatorItem({...item(),itemInfo:{title:{}}}),null);
 const foreign=item();foreign.offersV2.listings[0].price.money.currency='USD';assert.equal(normalizeCreatorItem(foreign).price,null);
 const image=item();image.images.primary.large.url='https://evil.test/a.jpg';assert.equal(normalizeCreatorItem(image).image,null);
});

test('diagnostics reject HTTP 200 without usable Amazon data, distinguish token and exact items',async()=>{
 const saved=globalThis.fetch;
 try{
  globalThis.fetch=async url=>String(url).includes('/auth/')?{ok:true,json:async()=>({access_token:'fixture',expires_in:3600})}:{ok:true,status:200,json:async()=>({source:'sitestripe',items:[item()]})};
  const fallback=await testCreatorsAccess();assert.equal(fallback.ok,false);assert.equal(fallback.tokenObtained,true);assert.equal(fallback.searchItemsAuthorized,false);
  globalThis.fetch=async()=>({ok:true,status:200,json:async()=>({searchResult:{items:[item()]}})});
  assert.equal((await testCreatorsAccess()).ok,true);
  assert.equal((await testCreatorsGetItems()).ok,false);
  globalThis.fetch=async()=>({ok:true,status:200,json:async()=>({itemResults:{items:[item()]}})});
  const exact=await testCreatorsGetItems();assert.equal(exact.ok,true);assert.equal(exact.hasOfficialImage,true);assert.equal(exact.hasPrice,true);
 }finally{globalThis.fetch=saved;}
});

test('enabling Redis API mode requires verified SearchItems AND GetItems, and denial leaves storage unchanged',async()=>{
 const saved=globalThis.fetch;let writes=0,allowExact=false;
 process.env.KV_REST_API_URL='https://redis.invalid';process.env.KV_REST_API_TOKEN='fixture';process.env.ADMIN_DASHBOARD_TOKEN='fixture-admin-token-123456789';
 globalThis.fetch=async(url,opt)=>{
  if(url==='https://redis.invalid'){if(JSON.parse(opt.body)[0]==='SET')writes++;return {ok:true,json:async()=>({result:'OK'})};}
  return {ok:true,status:200,json:async()=>String(url).includes('/searchItems')?{searchResult:{items:[item()]}}:allowExact?{itemResults:{items:[item()]}}:{}};
 };
 const req={method:'POST',headers:{authorization:'Bearer '+process.env.ADMIN_DASHBOARD_TOKEN},query:{mode:'sitestripe'},body:{mode:'api',links:[]}};
 try{
  let res=response();await admin(req,res);assert.equal(res.statusCode,409);assert.equal(writes,0);
  allowExact=true;res=response();await admin(req,res);assert.equal(res.statusCode,200);assert.equal(writes,1);
 }finally{globalThis.fetch=saved;delete process.env.KV_REST_API_URL;delete process.env.KV_REST_API_TOKEN;delete process.env.ADMIN_DASHBOARD_TOKEN;}
});

test('exact guide API rejects unrelated products and enforces EUR budget with expiring results',async()=>{
 const saved=globalThis.fetch;
 process.env.KV_REST_API_URL='https://redis.invalid';process.env.KV_REST_API_TOKEN='fixture';
 globalThis.fetch=async(url,opt)=>{
  if(url==='https://redis.invalid')return {ok:true,json:async()=>({result:JSON.parse(opt.body)[1]==='cr:sitestripe:v1'?JSON.stringify({mode:'api',links:[]}):null})};
  const unrelated={...item(),asin:'B000000000',detailPageURL:'https://www.amazon.it/dp/B000000000?tag=230b7-21'};
  return {ok:true,status:200,json:async()=>({itemResults:{items:[item(),unrelated]}})};
 };
 try{const res=response();await guideProducts({method:'GET',query:{slug:'sotto-30'}},res);assert.equal(res.data.items.length,1);assert.equal(res.data.items[0].asin,asin);assert.equal(Date.parse(res.data.expiresAt)-Date.parse(res.data.checkedAt),1800000);assert.equal(res.headers['Cache-Control'],'no-store');}
 finally{globalThis.fetch=saved;delete process.env.KV_REST_API_URL;delete process.env.KV_REST_API_TOKEN;}
});

test('browser removes API-derived display data on expiry and tab resume; rejects old payloads',async()=>{
 const code=(await readFile(new URL('../assets/site.js',import.meta.url),'utf8')).split('/* Expire Amazon-derived display data')[1].split('\n\n')[0];
 let now=1000,timer;const listeners={};
 const ctx=vm.createContext({WeakMap,Date:class extends Date{static now(){return now}},Number,setTimeout:fn=>{timer=fn;return 1},clearTimeout(){},document:{addEventListener:(k,f)=>listeners[k]=f,removeEventListener:k=>delete listeners[k]},window:{addEventListener:(k,f)=>listeners[k]=f,removeEventListener:k=>delete listeners[k]}});
 vm.runInContext('/* Expire Amazon-derived display data'+code,ctx);
 const root={innerHTML:'editorial fallback',removeAttribute(){}};
 ctx.root=root;ctx.expiry=new Date(now+1800000).toISOString();
 assert.equal(vm.runInContext('scheduleAmazonExpiry(root,expiry)',ctx),true);
 root.innerHTML='official image and price';now+=1800001;listeners.visibilitychange();assert.equal(root.innerHTML,'editorial fallback');
 assert.equal(vm.runInContext('scheduleAmazonExpiry(root,expiry)',ctx),false);
 assert.equal(Date.parse(amazonFreshness(0).expiresAt),1800000);
});

