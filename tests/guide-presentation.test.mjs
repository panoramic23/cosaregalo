import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {enforceGuidePresentation} from '../lib/guide-presentation.mjs';
import {renderArticle} from '../lib/article-cms.mjs';
const fixture='<!DOCTYPE html><html><head><title>Guida</title></head><body><main><div class="reading-layout"><article class="reading-copy"><section class="bf-picks cr-exact-products" data-guide-slug="fixture"><section class="bf-pick" id="idea-1" data-asin="B0BTJ9WHL9"><span class="bf-pick-index">01</span><div class="bf-pick-content"><h2>Cuffie per chi viaggia</h2><p><strong>Perché lo proponiamo:</strong>Una descrizione da conservare.</p></div><div class="bf-pick-shop"><div class="bf-pick-media cr-asin-media"><img src="https://m.media-amazon.com/images/I/fixture.jpg" alt="Cuffie"></div><div class="bf-pick-retail"><a href="https://www.amazon.it/dp/B0BTJ9WHL9?tag=230b7-21">Vedi su Amazon</a></div></div></section><section id="consigli"><h2>Prima di scegliere</h2><p>Testo dopo il prodotto.</p></section></section></article></div></main></body></html>';
test('historical guide is forced into headline/photo/CTA/description order without dropping later content',()=>{
 const out=enforceGuidePresentation(fixture);
 assert.match(out,/<body class="cr-magazine">/);
 assert.match(out,/assets\/guide-editorial\.css/);
 assert.match(out,/class="bf-story-layout"/);
 assert.equal((out.match(/cr-guide-media-note/g)||[]).length,1);
 assert.ok(out.indexOf('Cuffie per chi viaggia')<out.indexOf('<img'));
 assert.ok(out.indexOf('<img')<out.indexOf('Una descrizione da conservare.'));
 assert.ok(out.indexOf('Vedi su Amazon')<out.indexOf('Una descrizione da conservare.'));
 assert.ok(out.includes('Testo dopo il prodotto.'));
 assert.ok(out.includes('id="idea-1"'));
 assert.ok(out.includes('data-asin="B0BTJ9WHL9"'));
 assert.ok(out.includes('https://www.amazon.it/dp/B0BTJ9WHL9?tag=230b7-21'));
 assert.doesNotMatch(out,/Perché lo proponiamo/);
 assert.equal(enforceGuidePresentation(out),out);
});
test('CMS publications inherit the same presentation and safe media fallback as old guides',async()=>{
 const html=await renderArticle({slug:'nuova-guida',title:'Idee regalo per chi viaggia',summary:'Un regalo utile comincia dalle abitudini di chi lo riceve.',category:'Viaggi',body:'## Prima di partire\n\nUna descrizione originale per orientarsi nella scelta.',asins:['B0BTJ9WHL9'],productNotes:{B0BTJ9WHL9:{title:'Sony WH-CH520',note:'Un accessorio da valutare conoscendo le abitudini di chi lo riceve.'}},publishedAt:'2026-11-16T08:00:00Z'});
 assert.match(html,/class="cr-magazine"/);
 assert.match(html,/cr-magazine-pick/);
 assert.match(html,/cr-guide-media-note/);
 assert.ok(html.indexOf('Esplora le categorie')<html.indexOf('Una descrizione originale'));
 assert.ok(html.includes('data-asin="B0BTJ9WHL9"'));
 assert.doesNotMatch(html,/Perché lo proponiamo/);
});
test('static guides already use the forced presentation before any browser script runs',async()=>{
 for(const slug of ['cucina-poco-spazio','cuffie','natale','benessere','lettura','sotto-30','tech','scrivania-pratica','giochi-creativi-bambini']){
  const html=await readFile(new URL('../guide/'+slug+'/index.html',import.meta.url),'utf8');
  assert.match(html,/cr-magazine-pick/,slug);
  assert.match(html,/assets\/guide-editorial\.css/,slug);
  const rendered=enforceGuidePresentation(html,slug);
  assert.equal(enforceGuidePresentation(rendered,slug),rendered,slug+' is not idempotent');
 }
});
