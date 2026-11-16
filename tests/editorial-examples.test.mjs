import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {editorialExamples,renderEditorialExamples} from '../lib/editorial-examples.mjs';
import {enforceGuidePresentation} from '../lib/guide-presentation.mjs';
import {renderArticle} from '../lib/article-cms.mjs';
test('category guide examples contain specific model names, real manufacturer photos, short original descriptions and model searches',()=>{
 const examples=editorialExamples['cucina-poco-spazio'];assert.equal(examples.length,3);
 for(const p of examples){assert.ok(p.title.length>12);assert.ok(p.description.length>100);assert.match(p.image,/^https:\/\/eu\.josephjoseph\.com\/cdn\/shop\//);assert.match(p.source,/^https:\/\/eu\.josephjoseph\.com\/products\//);assert.ok(p.query.includes('Joseph Joseph'));}
 const out=renderEditorialExamples('cucina-poco-spazio');assert.equal((out.match(/<img /g)||[]).length,3);assert.equal((out.match(/data-amazon-model="true"/g)||[]).length,3);assert.doesNotMatch(out,/data-asin=|\d+,\d{2}\s*€|Foto ufficiale Amazon/);
});
test('concrete examples survive both static presentation and a CMS override without duplication',async()=>{
 const source=await readFile(new URL('../guide/cucina-poco-spazio/index.html',import.meta.url),'utf8');
 const transformed=enforceGuidePresentation(source,'cucina-poco-spazio');assert.equal((transformed.match(/id="esempi-concreti"/g)||[]).length,1);
 const dynamic=await renderArticle({slug:'cucina-poco-spazio',title:'Regali per cucine piccole',summary:'Piccoli strumenti da cucina per chi ha poco spazio.',category:'Cucina',body:'## Prima di scegliere\n\nControlla lo spazio disponibile nei mobili e nei cassetti.',asins:[],publishedAt:'2026-11-16T08:00:00Z'});
 assert.equal((dynamic.match(/id="esempi-concreti"/g)||[]).length,1);
 assert.equal((dynamic.match(/class="cr-example"/g)||[]).length,3);
});
