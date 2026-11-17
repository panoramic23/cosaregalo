import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const file=await readFile(new URL('../assets/site.js',import.meta.url),'utf8');
const start=file.indexOf(' function validImage(url)',file.indexOf('/* Specific-model guide cards'));
const code=file.slice(start,file.indexOf(" if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hydrateExactGuide)",start));
function setup(payload){
 let image,identity;
 const content={querySelector:q=>q==='.cr-product-variant'?identity:null,prepend:value=>{identity=value}};
 const status={hidden:false,textContent:''},price={textContent:'Prezzo su Amazon'},note={textContent:''},buy={};
 const media={replaceChildren(value){image=value}};
 const card={dataset:{asin:'B0BTJ9WHL9'},hidden:false,querySelector(q){return ({'.bf-pick-content':content,'.cr-asin-media':media,'.cr-asin-price':price,'.cr-asin-buy':buy,'.bf-pick-market-note':note})[q]||null}};
 const root={dataset:{guideSlug:'cuffie'},querySelector:q=>q==='.cr-guide-media-note'?status:null,querySelectorAll:()=>[card],contains:img=>image===img};
 const context=vm.createContext({URL,AbortSignal,Date,document:{querySelector:()=>root,createElement:()=>({events:{},addEventListener(name,callback){this.events[name]=callback}})},fetch:async()=>({ok:true,json:async()=>payload}),scheduleAmazonExpiry:()=>true});
 vm.runInContext(code,context);
 return {run:()=>vm.runInContext('hydrateExactGuide()',context),status,root,price,buy,getImage:()=>image,getIdentity:()=>identity};
}
test('disabled Amazon mode produces a clear fallback rather than an endless loader',async()=>{
 const page=setup({source:'editorial',items:[],reason:'API_MODE_DISABLED'});
 await page.run();
 assert.equal(page.root.dataset.mediaState,'unavailable');
 assert.equal(page.status.hidden,false);
 assert.match(page.status.textContent,/foto dei prodotti non sono disponibili/);
 assert.equal(page.getImage(),undefined);
 assert.equal(page.getIdentity(),undefined);
});
test('a valid product photo is displayed and a failed photo is removed with an honest status',async()=>{
 const payload={source:'amazon-creators-api',expiresAt:new Date(Date.now()+10000).toISOString(),items:[{asin:'B0BTJ9WHL9',title:'Sony WH-CH520 - Beige <modello>',image:'https://m.media-amazon.com/images/I/test.jpg',url:'https://www.amazon.it/dp/B0BTJ9WHL9?tag=230b7-21',price:'25,00 €'}]};
 for(const event of ['load','error']){
  const page=setup(payload);await page.run();
  const img=page.getImage();assert.ok(img);assert.equal(img.src,payload.items[0].image);
  img.events[event]();
  assert.equal(page.root.dataset.mediaState,event==='load'?'ready':'unavailable');
  assert.equal(page.status.hidden,event==='load');
  assert.equal(page.price.textContent,'25,00 €');
  assert.equal(page.buy.href,payload.items[0].url);
  assert.equal(page.getIdentity().textContent,payload.items[0].title);
  assert.equal(page.getIdentity().innerHTML,undefined);
  if(event==='error')assert.equal(page.getImage(),undefined);
 }
});
