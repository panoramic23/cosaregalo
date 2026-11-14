
// CosaRegalo product-type navigation and filters. Works in local HTML and offline preview.
(function(){
const TYPE_DATA=[{"slug": "speaker-bluetooth", "title": "Speaker Bluetooth", "desc": "Le casse portatili sono un regalo versatile per casa, viaggi e tempo libero. Confronta autonomia, dimensioni e resistenza all’acqua prima di scegliere.", "budget": "25–150 €", "models": ["JBL Go 4", "JBL Flip 7", "soundcore Boom 2"], "tips": ["Dove verrà usato: casa, viaggio o esterno", "Autonomia e praticità della ricarica", "Protezione contro acqua e polvere"]}, {"slug": "microfoni-karaoke", "title": "Microfoni karaoke", "desc": "Un microfono karaoke è perfetto per feste e serate in famiglia. Prima di acquistarlo valuta se ha un altoparlante integrato e come si collega a telefono o TV.", "budget": "20–120 €", "models": ["Xiaomi Karaoke Microphone", "BONAOK Wireless Karaoke Microphone", "JBL Wireless Microphone Set"], "tips": ["Altoparlante integrato o collegamento esterno", "Compatibilità con smartphone, TV e app", "Effetti voce, eco e controllo volume"]}, {"slug": "kit-trucchi", "title": "Trucchi e set make-up", "desc": "Trousse, palette e piccoli kit sono regali apprezzati da chi ama il make-up. Scegli colori versatili e controlla ingredienti e preferenze personali.", "budget": "15–90 €", "models": ["Deborah Milano Make Up Jewel Box", "Maybelline New York Lash Sensational Sky High", "Pupa Vamp! Mascara"], "tips": ["Tonalità adatte ai gusti della persona", "Ingredienti INCI e possibili sensibilità", "Confezione, provenienza e scadenza"]}, {"slug": "giochi-costruzioni", "title": "Giochi di costruzioni", "desc": "Costruzioni, mattoncini e percorsi creativi aiutano a trasformare un regalo in un’attività. Valuta età consigliata, livello di difficoltà e spazio disponibile.", "budget": "15–120 €", "models": ["LEGO Classic 10696", "LEGO Classic 11035", "LEGO DUPLO Classic 10913"], "tips": ["Età e avvertenze di sicurezza", "Costruzione libera oppure sfida guidata", "Complessità, numero di pezzi e spazio"]}, {"slug": "cuffie-wireless", "title": "Cuffie wireless", "desc": "Over-ear e on-ear possono essere un buon regalo tech, ma comfort e utilizzo contano più dei numeri. Valuta peso, autonomia e cancellazione del rumore.", "budget": "25–250 €", "models": ["Sony WH-1000XM5", "JBL Tune 520BT", "soundcore Q20i"], "tips": ["Over-ear o on-ear in base alla persona", "Comfort e peso nei lunghi ascolti", "ANC e qualità microfono, se necessarie"]}, {"slug": "e-reader", "title": "E-reader e lettori digitali", "desc": "Schermi e-ink, autonomia e librerie digitali: l’e-reader è un regalo utile se si conoscono le abitudini di lettura e l’ecosistema preferito.", "budget": "90–250 €", "models": ["Amazon Kindle", "Kindle Paperwhite", "Kobo Clara BW"], "tips": ["Ecosistema e libreria già utilizzata", "Dimensioni e definizione del display", "Compatibilità dei formati"]}, {"slug": "cofanetti-benessere", "title": "Cofanetti benessere", "desc": "Set per il corpo e piccoli accessori da relax sono regali facili da personalizzare. Conta più la pertinenza dei prodotti che il numero di flaconi.", "budget": "15–80 €", "models": ["L’Occitane Crema Mani Karité", "NIVEA Soft", "La Roche-Posay Lipikar Baume AP+M"], "tips": ["Preferenze su profumazioni e texture", "Composizione e INCI", "Quantità effettiva per ciascun prodotto"]}, {"slug": "accessori-scrivania", "title": "Accessori per la scrivania", "desc": "Un accessorio ben scelto può migliorare la postazione di studio o lavoro. Pensa a spazio, ergonomia e compatibilità invece di comprare un gadget casuale.", "budget": "15–150 €", "models": ["Logitech Pebble Mouse 2 M350s", "Logitech MX Keys Mini", "BenQ ScreenBar Halo"], "tips": ["Esigenza concreta e spazio disponibile", "Compatibilità con PC e dispositivi", "Materiali, ingombro e comodità d’uso"]}];
const selectOne=(s,r=document)=>r.querySelector(s), selectAll=(s,r=document)=>Array.from(r.querySelectorAll(s));

// Editorial suitability facets: these are guides, not individual product age certifications.
const FACETS={
 'speaker-bluetooth':{age:['teen','adult','senior'],festival:['natale','compleanno','festa-papa'],occasion:['tempo-libero','festa','viaggio']},
 'microfoni-karaoke':{age:['kid','teen','adult'],festival:['natale','compleanno'],occasion:['festa','tempo-libero']},
 'kit-trucchi':{age:['teen','adult'],festival:['natale','compleanno','festa-mamma'],occasion:['benessere','tempo-libero']},
 'giochi-costruzioni':{age:['child','kid','teen','adult'],festival:['natale','compleanno'],occasion:['creativita','tempo-libero']},
 'cuffie-wireless':{age:['teen','adult','senior'],festival:['natale','compleanno','laurea','festa-papa'],occasion:['viaggio','studio','tempo-libero']},
 'e-reader':{age:['teen','adult','senior'],festival:['natale','compleanno','laurea'],occasion:['lettura','viaggio','tempo-libero']},
 'cofanetti-benessere':{age:['teen','adult','senior'],festival:['natale','compleanno','festa-mamma','anniversario'],occasion:['benessere','ringraziamento']},
 'accessori-scrivania':{age:['teen','adult','senior'],festival:['natale','compleanno','laurea','festa-papa'],occasion:['studio','lavoro','ringraziamento']}
};

function start(){
 const menu=selectOne('#menuToggle'), nav=selectOne('#navMenu');
 if(menu&&nav&&!menu.dataset.bound){
  menu.dataset.bound='1';
  menu.addEventListener('click',()=>{
   const open=nav.classList.toggle('open');
   menu.setAttribute('aria-expanded',String(open));
   if(!open)selectAll('.nav-categories').forEach(box=>{
    box.classList.remove('is-open');
    box.querySelector('.nav-categories-toggle')?.setAttribute('aria-expanded','false');
   });
  });
 }
 // Only the white menu is sticky; the dark logo/search header scrolls with the page.
 // No header-height measurements or scroll listeners are needed.
 // Accessible category submenu; works on click, keyboard, and touch.
 const categoryBoxes=selectAll('.nav-categories');
 function closeCategoryBox(box){
  box.classList.remove('is-open');
  box.querySelector('.nav-categories-toggle')?.setAttribute('aria-expanded','false');
 }
 categoryBoxes.forEach(box=>{
  const button=box.querySelector('.nav-categories-toggle');
  if(!button)return;
  button.addEventListener('click',()=>{
   const open=!box.classList.contains('is-open');
   categoryBoxes.forEach(closeCategoryBox);
   box.classList.toggle('is-open',open);
   button.setAttribute('aria-expanded',String(open));
  });
  box.querySelectorAll('.nav-category-panel a').forEach(link=>link.addEventListener('click',()=>closeCategoryBox(box)));
 });
 document.addEventListener('click',event=>{
  categoryBoxes.forEach(box=>{if(!box.contains(event.target))closeCategoryBox(box);});
 });
 document.addEventListener('keydown',event=>{
  if(event.key!=='Escape')return;
  categoryBoxes.forEach(box=>{
   if(!box.classList.contains('is-open'))return;
   closeCategoryBox(box);box.querySelector('.nav-categories-toggle')?.focus();
  });
 });
 // Latest published articles: progressively enhanced scroll-snap carousel.
 const latestTrack=selectOne('#latestNewsTrack');
 if(latestTrack){
  const prev=selectOne('#latestNewsPrev'),next=selectOne('#latestNewsNext');
  function updateNewsArrows(){
   const right=Math.max(0,latestTrack.scrollWidth-latestTrack.clientWidth);
   if(prev)prev.disabled=latestTrack.scrollLeft<=2;
   if(next)next.disabled=latestTrack.scrollLeft>=right-2;
  }
  function moveNews(direction){
   const card=latestTrack.querySelector('.home-news-card');
   const gap=Number.parseFloat(getComputedStyle(latestTrack).columnGap)||16;
   const distance=card?card.getBoundingClientRect().width+gap:latestTrack.clientWidth*.8;
   const reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
   latestTrack.scrollBy({left:direction*distance,behavior:reduced?'auto':'smooth'});
  }
  if(prev)prev.addEventListener('click',()=>moveNews(-1));
  if(next)next.addEventListener('click',()=>moveNews(1));
  latestTrack.addEventListener('scroll',updateNewsArrows,{passive:true});
  latestTrack.addEventListener('keydown',event=>{
   if(event.key!=='ArrowRight'&&event.key!=='ArrowLeft')return;
   event.preventDefault();moveNews(event.key==='ArrowRight'?1:-1);
  });
  window.addEventListener('resize',updateNewsArrows);
  function makeNewsCard(item){
   const article=document.createElement('article');article.className='home-news-card';
   const link=document.createElement('a');link.className='home-news-card-link';link.href=item.path;
   const media=document.createElement('div');media.className='home-news-card-image';
   const img=document.createElement('img');img.loading='lazy';img.alt='Immagine illustrativa della guida '+item.category;img.src=item.image;media.append(img);
   const body=document.createElement('div');body.className='home-news-card-body';
   const category=document.createElement('span');category.className='eyebrow';category.textContent=item.category;
   const title=document.createElement('h3');title.textContent=item.title;
   const desc=document.createElement('p');desc.textContent=item.summary;
   const action=document.createElement('span');action.className='home-news-card-action';action.textContent='Leggi la guida →';
   body.append(category,title,desc,action);link.append(media,body);article.append(link);return article;
  }
  if(location.protocol!=='file:'){
   fetch(latestTrack.dataset.feed||'assets/latest-news.json',{cache:'no-store'})
    .then(resp=>{if(!resp.ok)throw Error('news feed unavailable');return resp.json();})
    .then(feed=>{
     if(!Array.isArray(feed.items))return;
     const goodPath=/^guide\/[a-z0-9-]+\/index\.html$/;
     const goodImage=/^assets\/[a-z0-9-]+\.(?:webp|png|svg)$/;
     const articles=feed.items.filter(x=>x&&x.status==='published'
      &&goodPath.test(x.path)&&goodImage.test(x.image)
      &&typeof x.title==='string'&&typeof x.summary==='string'&&typeof x.category==='string');
     if(!articles.length)return;
     articles.sort((a,b)=>(b.date||'').localeCompare(a.date||''));
     latestTrack.replaceChildren(...articles.slice(0,12).map(makeNewsCard));
     latestTrack.scrollLeft=0;updateNewsArrows();
    }).catch(()=>{}); // Static card links remain visible if the feed cannot load.
  }
  updateNewsArrows();
 }
 const qs=new URLSearchParams((window.COSAREGALO_OFFLINE&&location.hash.includes('?'))?location.hash.split('?')[1]:location.search);
 const keyword=selectOne('#typeQuery'),cat=selectOne('#typeCategory'),budget=selectOne('#typeBudget'),age=selectOne('#typeAge'),festival=selectOne('#typeFestival'),occasion=selectOne('#typeOccasion');
 if(keyword){keyword.value=qs.get('q')||'';if(cat&&qs.get('category'))cat.value=qs.get('category');if(budget&&qs.get('budget'))budget.value=qs.get('budget');if(age&&qs.get('age'))age.value=qs.get('age');if(festival&&qs.get('festival'))festival.value=qs.get('festival');if(occasion&&qs.get('occasion'))occasion.value=qs.get('occasion');}
 function filterTypes(){
  const query=(keyword?.value||'').trim().toLowerCase(),ct=cat?.value||'all',b=Number(budget?.value||999999),ag=age?.value||'all',fest=festival?.value||'all',occ=occasion?.value||'all';
  let num=0;
  selectAll('.type-card').forEach(node=>{
   const facets=FACETS[node.dataset.type]||{age:[],festival:[],occasion:[]};
   const ok=(!query||(node.dataset.search||'').includes(query))&&(ct==='all'||node.dataset.category===ct)&&Number(node.dataset.min)<=b&&(ag==='all'||facets.age.includes(ag))&&(fest==='all'||facets.festival.includes(fest))&&(occ==='all'||facets.occasion.includes(occ));
   node.hidden=!ok;if(ok)num++;
  });
  if(selectOne('#typeEmpty'))selectOne('#typeEmpty').hidden=num>0;
  const counter=selectOne('#typeResultsCount');if(counter)counter.textContent=num+' tipologie disponibili';
 }
 [keyword,cat,budget,age,festival,occasion].forEach(n=>n&&n.addEventListener(n===keyword?'input':'change',filterTypes));
 const reset=selectOne('#filterReset');
 if(reset)reset.addEventListener('click',()=>{
  if(keyword)keyword.value='';
  if(cat)cat.value='all';
  if(budget)budget.value='999999';
  if(age)age.value='all';
  if(festival)festival.value='all';
  if(occasion)occasion.value='all';
  if(window.history?.replaceState)window.history.replaceState(null,'',location.pathname);
  filterTypes();
  keyword?.focus();
 });
 filterTypes();
 const ca=selectOne('#compareTypeA'),cb=selectOne('#compareTypeB'),pane=selectOne('#comparePanes');
 if(ca&&cb&&pane){ca.value='speaker-bluetooth';cb.value='microfoni-karaoke';
 function draw(){const base=window.COSAREGALO_OFFLINE?'#/':(document.documentElement.getAttribute('data-base')||'');
 pane.innerHTML=[ca.value,cb.value].map(id=>{const t=TYPE_DATA.find(x=>x.slug===id);if(!t)return '';return `<article class="compare-pane"><h3>${t.title}</h3><p>${t.desc}</p><dl><div><dt>Fascia di ricerca indicativa</dt><dd>${t.budget}</dd></div><div><dt>Modelli</dt><dd>${t.models.join(', ')}</dd></div><div><dt>Cosa valutare</dt><dd>${t.tips.join(' · ')}</dd></div></dl><a href="${base}tipologie/${id}/${window.COSAREGALO_OFFLINE?"":"index.html"}">Guida completa ↗</a></article>`;}).join('')}
 ca.addEventListener('change',draw);cb.addEventListener('change',draw);draw();}
 // The favourites counter in legacy header is informational until account sync is connected.
 const badge=selectOne('#favsBadge');if(badge)badge.textContent='0';
}
window.initCosaRegalo=start;
window.initCosaRegalo=start;
window.initCosaRegalo=start;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();

/* Amazon Creators API catalog enrichment. No credentials in browser. */
(function(){
 function e(tag,cl,txt){const x=document.createElement(tag);if(cl)x.className=cl;if(txt!==undefined)x.textContent=txt;return x}
 function validUrl(url,kind){try{const u=new URL(url);if(u.protocol!=='https:'||u.username||u.password||u.port)return false;if(kind==='link')return /(^|\.)amazon\.it$/.test(u.hostname);return /(^|\.)(media-amazon\.com|images-amazon\.com|ssl-images-amazon\.com)$/.test(u.hostname)}catch{return false}}
 function paint(root,items,checkedAt){const list=e('div','amazon-list');
  items.forEach(p=>{if(!validUrl(p.url,'link'))return;
   const card=e('article','amazon-product'), frame=e('div','amazon-product-image');
   if(validUrl(p.image,'image')){const img=e('img');img.src=p.image;img.loading='lazy';img.alt=p.title;frame.append(img)}else frame.append(e('span','product-origin','Immagine non disponibile'));
   const info=e('div','amazon-product-desc');info.append(e('span','product-origin',(p.source==='sitestripe'?'LINK SITESTRIPE · ASIN ':'PRODOTTO AMAZON · ASIN ')+p.asin));info.append(e('h3','',p.title));
   const buy=e('div','amazon-product-buy');buy.append(e('strong','amazon-price'+(p.price?'':' not-live'),p.price||'Prezzo su Amazon'));
   const time=e('span','amazon-timestamp',p.price?'Prezzo rilevato '+new Date(checkedAt).toLocaleString('it-IT'):'Prezzo consultabile su Amazon');buy.append(time);
   const a=e('a','amazon-btn','Acquista su Amazon ↗');a.href=p.url;a.target='_blank';a.rel='sponsored nofollow noopener';buy.append(a);
   card.append(frame,info,buy);list.append(card);
  });if(list.children.length){root.replaceChildren(list);return true}return false;
 }
 async function hydrate(){if(location.protocol==='file:'||window.COSAREGALO_OFFLINE)return;
  await Promise.all(Array.from(document.querySelectorAll('.amazon-group')).map(async sec=>{
   const root=sec.querySelector('.amazon-products'),status=sec.querySelector('.amazon-api-note');if(!root)return;
   if(!root.dataset.editorial)root.dataset.editorial=root.innerHTML;
   root.innerHTML=root.dataset.editorial;
   try{const url='/api/products?type='+encodeURIComponent(sec.dataset.slug)+'&group='+encodeURIComponent(sec.dataset.group);
    const resp=await fetch(url,{headers:{Accept:'application/json'}});
    if(!resp.ok)return;
    const data=await resp.json();sec.querySelector('[data-sitestripe-group]')?.remove();if(data.groupLink&&validUrl(data.groupLink,'link')){const a=e('a','amazon-btn','Esplora la selezione su Amazon ↗');a.dataset.sitestripeGroup='1';a.href=data.groupLink;a.target='_blank';a.rel='sponsored nofollow noopener';sec.append(a);}if(Array.isArray(data.items)&&paint(root,data.items,data.checkedAt)){
     if(status)status.textContent=data.source==='sitestripe'?'Link affiliati SiteStripe verificati manualmente. Prezzo e disponibilità da consultare su Amazon.':'Prezzi e immagini provengono da Amazon; verifica l’offerta al momento dell’acquisto.';
    }else if(status)status.textContent=root.querySelector('a[data-affiliate-source="sitestripe"]')?'Link SiteStripe inseriti dal gestore. Prezzi e disponibilità da verificare su Amazon.':'Selezione editoriale: nessun link prodotto verificato. Fasce di budget indicative, non prezzi o disponibilità attuali.';
   }catch{/* Present clear editorial fallback; never fabricate price. */}
  }));
 }
 document.addEventListener('DOMContentLoaded',hydrate);
 window.addEventListener('hashchange',()=>setTimeout(hydrate,0));
})();



/* Original shopping guide links: Amazon product/category search, no invented prices or ASINs.
   The Associates tag is a public tracking identifier injected by the Node server. */
(function(){
 function initGuideShopping(){
  const tag=document.querySelector('meta[name="cr-amazon-tag"]')?.getAttribute('content')||'';
  if(!/^[a-zA-Z0-9-]{5,60}$/.test(tag))return;
  document.querySelectorAll('.bf-shop-cta[data-amazon-search]').forEach(link=>{
   try{
    const query=decodeURIComponent(link.dataset.amazonSearch||'');
    if(!query||query.length>125)return;
    const url=new URL('https://www.amazon.it/s');
    url.searchParams.set('k',query);
    url.searchParams.set('tag',tag);
    link.href=url.toString();
    link.target='_blank';
    link.rel='sponsored nofollow noopener';
    link.textContent='Cerca prodotti su Amazon ↗';
    link.setAttribute('aria-label','Cerca '+query+' su Amazon tramite link affiliato');
    const note=link.closest('.bf-pick-retail')?.querySelector('.bf-pick-market-note');
    if(note)note.textContent='Link affiliato · risultati di ricerca Amazon. Prezzi e disponibilità sul negozio.';
   }catch{/* Keep the local editorial fallback link. */}
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initGuideShopping);
 else initGuideShopping();
})();


/* Keep the existing social links in the sticky navigation on phones only. */
(function(){
 function setupMobileSocials(){
  const socials=document.querySelector('.announcement .cr-socials');
  const bar=document.querySelector('.nav-inner');
  if(!socials||!bar)return;
  const marker=document.createComment('social links desktop position');
  socials.before(marker);
  const mobile=window.matchMedia('(max-width:760px)');
  function place(){
   if(mobile.matches){bar.append(socials);socials.classList.add('cr-mobile-socials');}
   else{marker.after(socials);socials.classList.remove('cr-mobile-socials');}
  }
  mobile.addEventListener('change',place);
  place();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setupMobileSocials);
 else setupMobileSocials();
})();


/* Specific-model guide cards - official product photos and current prices via GetItems. */
(function(){
 function validImage(url){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&/(^|\.)(media-amazon\.com|images-amazon\.com|ssl-images-amazon\.com)$/.test(u.hostname)}catch{return false}}
 function validAmazon(url){try{const u=new URL(url);return u.protocol==='https:'&&u.hostname==='www.amazon.it'&&u.searchParams.has('tag')}catch{return false}}
 async function hydrateExactGuide(){
  const root=document.querySelector('.cr-exact-products[data-guide-slug]');
  if(!root||root.dataset.hydrated==='1')return;
  const slug=root.dataset.guideSlug;
  try{
   const resp=await fetch('/api/guide-products?slug='+encodeURIComponent(slug),{headers:{Accept:'application/json'},cache:'no-store'});
   if(!resp.ok)return;
   const data=await resp.json();
   if(data.source!=='amazon-creators-api'||!Array.isArray(data.items))return;
   const byAsin=new Map(data.items.map(p=>[p.asin,p]));
   root.querySelectorAll('.cr-specific-pick[data-asin]').forEach(card=>{
    const p=byAsin.get(card.dataset.asin),media=card.querySelector('.cr-asin-media'),price=card.querySelector('.cr-asin-price'),buy=card.querySelector('.cr-asin-buy'),note=card.querySelector('.bf-pick-market-note');
    if(!p){if(slug==='sotto-30')card.hidden=true;return;}
    if(validImage(p.image)&&media){
     const img=document.createElement('img');img.loading='lazy';img.decoding='async';img.alt='Foto ufficiale Amazon: '+p.title;img.src=p.image;media.replaceChildren(img);
    }
    const heading=card.querySelector('.bf-pick-content h2,.bf-pick-content h3');
    if(heading&&heading.textContent.startsWith('Prodotto Amazon '))heading.textContent=p.title;
    if(price)price.textContent=p.price||'Prezzo su Amazon';
    if(buy&&validAmazon(p.url))buy.href=p.url;
    if(note)note.textContent=p.price?'Prezzo rilevato '+new Date(data.checkedAt).toLocaleString('it-IT')+'. Verifica sul negozio.':'Prezzo e disponibilità da verificare su Amazon.';
    if(p.availability){let availability=card.querySelector('.cr-asin-availability');if(!availability){availability=document.createElement('small');availability.className='cr-asin-availability';note?.before(availability)}availability.textContent=p.availability;}
   });
   root.dataset.hydrated='1';
  }catch{/* Existing exact product links remain available; never invent API prices or photos. */}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hydrateExactGuide);
 else hydrateExactGuide();
})();
