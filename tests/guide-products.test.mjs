import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {guideCatalog} from '../lib/guide-catalog.mjs';

test('guide catalog has valid exact identifiers and editorial notes',()=>{
 const names=Object.keys(guideCatalog);
 assert.equal(names.length,8);
 for(const [slug,items] of Object.entries(guideCatalog)){
  assert.ok(items.length>=2,slug);
  const seen=new Set();
  for(const item of items){
   assert.match(item.asin,/^[A-Z0-9]{10}$/);
   assert.ok(!seen.has(item.asin),slug+' repeated ASIN');
   seen.add(item.asin);
   assert.ok(item.title.length>10);
   assert.ok(item.note.length>20);
   assert.ok(item.editorial.length>140,slug+' '+item.asin+' lacks a meaningful editorial explanation');
  }
 }
});
test('all curated guides feature exact picks and not generic Amazon searches',async()=>{
 for(const [slug,items] of Object.entries(guideCatalog)){
  const html=await readFile(new URL('../guide/'+slug+'/index.html',import.meta.url),'utf8');
  assert.match(html,/class="bf-picks cr-exact-products"/);
  assert.equal((html.match(/data-asin="/g)||[]).length,items.length,slug);
  assert.doesNotMatch(html,/data-amazon-search=/,slug);
  assert.equal((html.match(/class="cr-editorial-rationale"/g)||[]).length,items.length,slug+' missing product commentary');
  assert.equal((html.match(/Perché lo proponiamo:/g)||[]).length,items.length,slug+' missing editorial label');
  for(const {asin} of items)assert.ok(html.includes('data-asin="'+asin+'"'),slug+' '+asin);
 }
});
