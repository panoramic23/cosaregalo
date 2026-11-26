import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir,stat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {matchesEditorialProduct} from '../lib/product-identity.mjs';
const root=fileURLToPath(new URL('..',import.meta.url));
test('all eleven guides use one layout, real indices and no demonstration copy or repeated product imagery',async()=>{
 const dirs=(await readdir(resolve(root,'guide'),{withFileTypes:true})).filter(x=>x.isDirectory());
 assert.equal(dirs.length,11);
 for(const {name} of dirs){
  const html=await readFile(resolve(root,'guide',name,'index.html'),'utf8');
  assert.ok(html.includes('bf-story-layout'),name);
  assert.ok(html.includes('bf-story-hero'),name);
  assert.doesNotMatch(html,/proposte sottostanti sono dimostrative|Guide in fase di progettazione|dieci piccoli cambiamenti|class="reading-layout"/i,name);
  for(const [,block] of html.matchAll(/(<div class="bf-pick-shop"[\s\S]*?<\/section>)/g))assert.doesNotMatch(block,/<img[^>]+assets\/(cover|tech|beauty|reader|building|budget)\.webp/);
  const nav=html.match(/<nav class="bf-aside-nav"[^>]*>([\s\S]*?)<\/nav>/)?.[1];
  assert.ok(nav,name+' index absent');
  for(const [,id] of html.matchAll(/<section[^>]+id="(idea-\d+)"/g))assert.ok(nav.includes('#'+id+'"'),name+' missing '+id);
 }
});
test('publication feed and HTML agree on guide titles and all local references resolve',async()=>{
 const feed=JSON.parse(await readFile(resolve(root,'assets/latest-news.json'),'utf8'));
 assert.equal(feed.items.length,11);
 for(const a of feed.items){
  const path=resolve(root,a.path),html=await readFile(path,'utf8');
  assert.equal(html.match(/<h1[^>]*>([^<]+)<\/h1>/)?.[1],a.title,a.slug);
  assert.ok((await stat(resolve(root,a.image))).isFile());
  for(const [,url] of html.matchAll(/(?:href|src)="([^"]+)"/g)){
   if(/^(?:[a-z]+:|\/\/|#)/i.test(url))continue;
   const rel=url.split(/[?#]/)[0];if(!rel)continue;
   const target=rel.startsWith('/')?resolve(root,'.'+rel):resolve(dirname(path),rel);
   await stat(target).catch(()=>assert.fail(a.slug+' missing '+url));
  }
 }
});
test('budget recommendations stay hidden until a verified price arrives',async()=>{
 const html=await readFile(resolve(root,'guide/sotto-30/index.html'),'utf8');
 assert.equal((html.match(/hidden data-asin=/g)||[]).length,5);
 assert.ok(html.includes('cr-budget-status'));
});
test('Amazon title must match the editorial model, even if the ASIN is unchanged',()=>{
 assert.ok(matchesEditorialProduct('Sony WH-CH520 - cuffie Bluetooth','Sony WH CH520 cuffie Bluetooth nere'));
 assert.equal(matchesEditorialProduct('Sony WH-CH520 - cuffie Bluetooth','Sony WH-CH720N wireless'),false);
 assert.equal(matchesEditorialProduct('LEGO Classic 10696 - scatola mattoncini','LEGO Classic 11035'),false);
 assert.equal(matchesEditorialProduct('JBL Go 4 - speaker Bluetooth','JBL Flip 7 speaker'),false);
});
