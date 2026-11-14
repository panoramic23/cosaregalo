import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {categoryEditorial} from '../lib/category-editorial.mjs';
import {calendar,settings} from '../lib/editorial.mjs';
const source=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');

test('every category model has a unique editorial rationale and associated real ASIN',async()=>{
 const slugs=Object.keys(categoryEditorial);
 assert.equal(slugs.length,8);
 let totalCards=0;
 for(const slug of slugs){
  const html=await source('tipologie/'+slug+'/index.html');
  assert.match(html,/class="bf-type-page"/);
  const productAsins=[...html.matchAll(/PRODOTTO AMAZON · ASIN ([A-Z0-9]{10})/g)].map(m=>m[1]);
  assert.ok(productAsins.length>=1);
  assert.equal((html.match(/Perché lo proponiamo/g)||[]).length,productAsins.length);
  assert.equal((html.match(/class="cr-category-audience"/g)||[]).length,productAsins.length);
  assert.equal((html.match(/class="cr-category-caveat"/g)||[]).length,productAsins.length);
  assert.doesNotMatch(html,/Link affiliato fornito per questo modello\. Verifica variante/);
  for(const asin of productAsins){
   const copy=categoryEditorial[slug][asin];
   assert.ok(copy,slug+' missing editorial copy for '+asin);
   assert.ok(copy.description.length>110);
   assert.ok(copy.audience.length>30);
   assert.ok(copy.caveat.length>35);
  }
  totalCards+=productAsins.length;
 }
 assert.equal(totalCards,40);
});
test('exact category product feed cannot be replaced with SearchItems',async()=>{
 const client=await source('assets/site.js'),server=await source('server.mjs'),api=await source('api/category-products.mjs');
 assert.ok(client.includes("document.querySelector('.bf-type-page')"));
 assert.ok(client.includes('/api/category-products?slug='));
 assert.ok(server.includes("['/api/category-products',categoryProducts]"));
 assert.ok(api.includes('/getItems'));
 assert.ok(!api.includes('/searchItems'));
});
test('editorial cadence and publication statuses are consistent',async()=>{
 assert.equal(settings.editorial_cadence_hours,48);
 assert.equal(settings.ready_for_unattended_publication,false);
 assert.ok(calendar.length>=7);
 for(let i=0;i<calendar.length;i++){
  assert.match(calendar[i].stato,/NON PUBBLICATO/);
  if(i>0){
   const prev=Date.parse(calendar[i-1].data+'T09:00:00Z');
   const next=Date.parse(calendar[i].data+'T09:00:00Z');
   assert.equal((next-prev)/3600000,48);
  }
 }
 const twoWeek=JSON.parse(await source('content/calendario_14_giorni.json'));
 assert.equal(twoWeek.length,7);
});
