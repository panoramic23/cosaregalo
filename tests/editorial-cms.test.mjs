import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {checkArticle,escapeHtml,renderBody} from '../lib/article-cms.mjs';

const sample={slug:'idee-regalo-viaggio',title:'Accessori da viaggio per un regalo utile',summary:'Prodotti e consigli concreti per chi viaggia spesso e cerca accessori davvero pratici.',body:'## Per chi viaggia\n\nUna buona scelta richiede attenzione allo spazio e al bagaglio.\n\nControlla le dimensioni.',category:'Viaggio',status:'draft',asins:'B0BTJ9WHL9'};
test('editorial article validation enforces statuses and revisions',()=>{
 const one=checkArticle(sample);
 assert.equal(one.revision,1);assert.equal(one.status,'draft');assert.equal(one.publishedAt,null);
 const published=checkArticle({...sample,status:'published'},one);
 assert.equal(published.revision,2);assert.ok(published.publishedAt);
 const archived=checkArticle({...sample,status:'archived'},published);
 assert.equal(archived.revision,3);assert.equal(archived.status,'archived');assert.equal(archived.publishedAt,published.publishedAt);
 assert.throws(()=>checkArticle({...sample,slug:'../bad'}));
 assert.throws(()=>checkArticle({...sample,asins:'NOTANASIN'}));
 assert.throws(()=>checkArticle({...sample,status:'deleted'}));
});
test('editorial HTML escapes user input',()=>{
 assert.equal(escapeHtml('<script>alert("x")</script>'),'&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
 assert.ok(renderBody('## Titolo\n\n<script>bad</script>').includes('&lt;script&gt;bad&lt;/script&gt;'));
 assert.ok(!renderBody('<img src=x onerror=alert(1)>').includes('<img'));
});
test('navigation uses aligned chevrons and editor keeps article actions',async()=>{
 const css=await readFile(new URL('../assets/style.css',import.meta.url),'utf8');
 const html=await readFile(new URL('../admin/index.html',import.meta.url),'utf8');
 const js=await readFile(new URL('../assets/admin.js',import.meta.url),'utf8');
 assert.match(css,/\.nav-chevron::before/);
 for(const label of ['newArticleButton','editorialArticleForm','editorialArticles','editorialCancelButton'])assert.ok(html.includes(label));
 for(const mode of ['article-save','articles','amazon-getitems-test'])assert.ok(js.includes(mode));
});
