import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

const root=fileURLToPath(new URL('..',import.meta.url));
async function pages(dir){
 const out=[];
 for(const entry of await readdir(dir,{withFileTypes:true})){
  if(entry.name.startsWith('.')||entry.name==='node_modules')continue;
  const file=dir+'/'+entry.name;
  if(entry.isDirectory())out.push(...await pages(file));
  else if(entry.name==='index.html'||file.endsWith('.html'))out.push(file);
 }
 return out;
}
test('every HTML page has unique IDs, one H1, one title and image alternative text',async()=>{
 const files=await pages(root);
 assert.ok(files.length>=30,'Expected current CosaRegalo site pages');
 for(const file of files){
  const html=await readFile(file,'utf8');
  const relative=file.slice(root.length);
  const titles=[...html.matchAll(/<title>[^<]+<\/title>/gi)];
  assert.equal(titles.length,1,'Expected exactly one title: '+relative);
  const h1=[...html.matchAll(/<h1(?:\s[^>]*)?>/gi)];
  assert.equal(h1.length,1,'Expected exactly one H1: '+relative);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
  assert.equal(ids.length,new Set(ids).size,'Duplicate id attribute: '+relative);
  for(const [,img] of html.matchAll(/(<img\b[^>]*>)/gi)){
   assert.match(img,/\balt="[^"]*"/,'Image missing alternative text: '+relative);
  }
  for(const [,id] of html.matchAll(/href="#([^"]+)"/g)){
   if(id)assert.ok(ids.includes(id),'Internal anchor not found in '+relative+': #'+id);
  }
 }
});
test('guide recommendations keep a matching shopping card for every numbered idea',async()=>{
 const slugs=['natale','benessere','sotto-30','tech','lettura','cuffie',
  'cucina-poco-spazio','scrivania-pratica','giochi-creativi-bambini'];
 for(const slug of slugs){
  const html=await readFile(root+'/guide/'+slug+'/index.html','utf8');
  const picks=[...html.matchAll(/<section class="bf-pick(?: bf-guide-pick)?" id="idea-(\d+)">/g)];
  const cards=[...html.matchAll(/class="bf-pick-shop" data-idea="(\d+)"/g)];
  assert.equal(picks.length,cards.length,'Shopping cards missing in '+slug);
  assert.deepEqual(picks.map(m=>m[1]),cards.map(m=>m[1]),'Card order mismatched in '+slug);
 }
});
