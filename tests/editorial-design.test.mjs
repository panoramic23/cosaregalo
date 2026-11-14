import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {guideCatalog} from '../lib/guide-catalog.mjs';

const file=async path=>readFile(new URL('../'+path,import.meta.url),'utf8');
test('each curated Amazon product has a real editorial reason and concise name',async()=>{
 let total=0;
 for(const [slug,items] of Object.entries(guideCatalog)){
  const html=await file('guide/'+slug+'/index.html');
  for(const item of items){
   assert.match(item.asin,/^[A-Z0-9]{10}$/);
   assert.ok(item.title.length<=115);
   assert.ok(item.editorial.length>=140);
   assert.ok(item.editorial.includes('.')&&item.editorial.length>item.note.length);
   assert.ok(html.includes('data-asin="'+item.asin+'"'),slug+':'+item.asin);
  }
  assert.equal((html.match(/class="cr-editorial-rationale"/g)||[]).length,items.length,slug);
  assert.equal((html.match(/data-amazon-search=/g)||[]).length,0,slug+' has generic search CTA');
  total+=items.length;
 }
 assert.equal(total,38);
});
test('photos are enlarged, headings have consistent line height, and home hero uses live publication feed',async()=>{
 const css=await file('assets/style.css'),js=await file('assets/site.js'),home=await file('index.html');
 assert.match(css,/minmax\(220px,290px\)/);
 assert.match(css,/\.cr-exact-products \.bf-pick-media\{height:280px/);
 assert.match(css,/h1,h2,h3,h4,h5,h6\{line-height:1\.22/);
 assert.ok(home.includes('id="latestHeroGuide"'));
 assert.ok(!home.includes('LA GUIDA IN EVIDENZA / AUDIO'));
 assert.ok(js.includes('updateLatestHero'));
 assert.ok(js.includes('cr-amazon-description'));
});
test('official item features are requested, without inventing review summaries',async()=>{
 const api=await file('api/guide-products.mjs');
 const normalizer=await file('api/products.mjs');
 assert.ok(api.includes('itemInfo.features'));
 assert.ok(normalizer.includes('itemInfo?.features?.displayValues'));
 assert.ok(normalizer.includes('features:'));
 assert.ok(api.includes('editorialText'));
});
