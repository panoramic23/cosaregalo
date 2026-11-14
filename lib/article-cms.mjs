import {configured,redis} from './store.mjs';
import {readFile} from 'node:fs/promises';
const KEY='cr:editorial:articles:v1';
const slugPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const escapeHtml=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
const allowed=['draft','published','archived'];
export function checkArticle(input,prior=null){
 if(!input||typeof input!=='object')throw Error('INVALID_ARTICLE');
 const slug=String(input.slug||prior?.slug||'').trim().toLowerCase();
 if(!slugPattern.test(slug)||slug.length>70)throw Error('INVALID_SLUG');
 if(prior&&slug!==prior.slug)throw Error('SLUG_IMMUTABLE');
 const title=String(input.title||'').trim(),summary=String(input.summary||'').trim(),body=String(input.body||'').trim(),category=String(input.category||'Guide regalo').trim();
 const status=String(input.status||'draft'),asins=String(input.asins||'').toUpperCase().split(/[\s,;]+/).filter(Boolean);
 if(title.length<8||title.length>155||summary.length<20||summary.length>350||body.length<50||body.length>25000||category.length<2||category.length>70||!allowed.includes(status)||asins.length>18||asins.some(s=>!/^[A-Z0-9]{10}$/.test(s)))throw Error('INVALID_ARTICLE_FIELDS');
 const now=new Date().toISOString();
 return {slug,title,summary,body,category,status,asins:[...new Set(asins)],createdAt:prior?.createdAt||now,updatedAt:now,publishedAt:status==='published'?(prior?.publishedAt||now):prior?.publishedAt||null,revision:(prior?.revision||0)+1};
}
export async function readArticles(){
 if(!configured())return {items:{},writable:false};
 const raw=await redis(['GET',KEY]);
 const items=raw?JSON.parse(raw):{};
 if(!items||typeof items!=='object'||Array.isArray(items))throw Error('EDITORIAL_STORE_INVALID');
 return {items,writable:true};
}
export async function saveArticle(input){
 if(!configured())throw Error('STORAGE_NOT_CONFIGURED');
 // Redis CAS lock prevents simultaneous admin writes dropping changes.
 const lock='cr:editorial:lock';
 const acquired=await redis(['SET',lock,'1','NX','EX','10']);
 if(acquired!=='OK')throw Error('EDITORIAL_BUSY_RETRY');
 try{
  const {items}=await readArticles();
  const slug=String(input?.slug||'').toLowerCase();
  const prior=items[slug]||null;
  if(Number(input?.revision||0)!==(prior?.revision||0))throw Error('EDITORIAL_CONFLICT_REFRESH');
  const updated=checkArticle(input,prior);
  items[slug]=updated;
  await redis(['SET',KEY,JSON.stringify(items)]);
  return updated;
 }finally{await redis(['DEL',lock]).catch(()=>{});}
}
export function visibleArticles(items){return Object.values(items).filter(a=>a.status==='published').sort((a,b)=>String(b.publishedAt).localeCompare(String(a.publishedAt)));}
export function renderBody(body){
 return String(body).split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean).map(p=>{
  if(p.startsWith('## '))return '<h2>'+escapeHtml(p.slice(3))+'</h2>';
  if(p.startsWith('### '))return '<h3>'+escapeHtml(p.slice(4))+'</h3>';
  return '<p>'+escapeHtml(p).replace(/\n/g,'<br>')+'</p>';
 }).join('');
}
export async function renderArticle(article){
 const layout=await readFile(new URL('../guide/scrivania-pratica/index.html',import.meta.url),'utf8');
 const mainStart=layout.indexOf('<main id="main">'),mainEnd=layout.indexOf('</main>',mainStart);
 if(mainStart<0||mainEnd<0)throw Error('ARTICLE_TEMPLATE_INVALID');
 const escape=escapeHtml;
 const picks=article.asins.length?'<section class="cr-exact-products bf-picks" data-guide-slug="'+escape(article.slug)+'"><h2>Prodotti Amazon selezionati</h2>'+article.asins.map((asin,i)=>'<section class="bf-pick cr-specific-pick" data-asin="'+asin+'"><span class="bf-pick-index">'+String(i+1).padStart(2,'0')+'</span><div class="bf-pick-content"><h3>Prodotto Amazon '+asin+'</h3><p>Il nome, la fotografia e il prezzo sono recuperati tramite Amazon API quando disponibili.</p></div><div class="bf-pick-shop"><div class="bf-pick-media cr-asin-media"><span>Foto Amazon in aggiornamento</span></div><div class="bf-pick-retail"><strong class="cr-asin-price">Prezzo su Amazon</strong><a class="bf-shop-cta cr-asin-buy" rel="sponsored nofollow noopener noreferrer" target="_blank" href="https://www.amazon.it/dp/'+asin+'?tag=230b7-21">Vedi su Amazon</a><small class="bf-pick-market-note">Prezzo sul negozio</small></div></div></section>').join('')+'</section>':'';
 const main='<main id="main"><div class="container page article-page bf-article-page"><div class="crumb"><a href="/guide/">Guide</a> / '+escape(article.category)+'</div><div class="bf-story-hero"><div class="bf-story-hero-copy"><span class="eyebrow">'+escape(article.category)+'</span><h1>'+escape(article.title)+'</h1><p>'+escape(article.summary)+'</p><div class="article-meta">REDAZIONE COSAREGALO · '+escape(article.publishedAt?.slice(0,10)||'BOZZA')+'</div></div><img src="/assets/cover.webp" alt="Immagine editoriale illustrativa"></div><div class="bf-story-layout"><article class="bf-story-body">'+renderBody(article.body)+picks+'<p class="bf-affiliate-note">In qualità di Affiliato Amazon, possiamo ricevere una commissione sugli acquisti idonei.</p></article></div></div></main>';
 let html=layout.slice(0,mainStart)+main+layout.slice(mainEnd+7);
 html=html.replace(/<title>[\s\S]*?<\/title>/,'<title>'+escape(article.title)+' | CosaRegalo</title>');
 html=html.replace(/<meta[^>]+name="description"[^>]*>/,'<meta name="description" content="'+escape(article.summary)+'">');
 html=html.replace(/<html[^>]*>/,'<html lang="it" data-base="../../">');
 html=html.replace(/<\/head>/,'<meta property="article:published_time" content="'+escape(article.publishedAt||'')+'"><link rel="canonical" href="https://cosa-regalo.it/guide/'+escape(article.slug)+'/"></head>');
 return html;
}
