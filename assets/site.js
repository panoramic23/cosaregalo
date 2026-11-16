/* Expire Amazon-derived display data even when a tab stays open or resumes. */
const amazonContentSnapshots=new WeakMap();
function scheduleAmazonExpiry(root,expiresAt){
 const expiry=Date.parse(expiresAt),remaining=expiry-Date.now();
 if(!Number.isFinite(remaining)||remaining<=0||remaining>30*60*1000+5000)return false;
 const old=amazonContentSnapshots.get(root);if(old)old();
 const fallback=root.innerHTML;
 let timer;
 const cleanup=()=>{clearTimeout(timer);document.removeEventListener('visibilitychange',check);window.removeEventListener('pageshow',check);amazonContentSnapshots.delete(root);};
 const expire=()=>{root.innerHTML=fallback;root.removeAttribute('data-hydrated');cleanup();};
 const check=()=>{if(Date.now()>=expiry)expire();};
 timer=setTimeout(expire,remaining);
 document.addEventListener('visibilitychange',check);window.addEventListener('pageshow',check);
 amazonContentSnapshots.set(root,()=>{root.innerHTML=fallback;cleanup();});
 return true;
}


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
   const time=e('span','amazon-timestamp',p.price?'Prezzo rilevato '+new Date(checkedAt).toLocaleString('it-IT')+'. Prezzo e disponibilità al momento dell’acquisto su Amazon prevalgono.':'Prezzo consultabile su Amazon');buy.append(time);
   const a=e('a','amazon-btn','Acquista su Amazon ↗');a.href=p.url;a.target='_blank';a.rel='sponsored nofollow noopener';buy.append(a);
   card.append(frame,info,buy);list.append(card);
  });if(list.children.length){root.replaceChildren(list);return true}return false;
 }
 async function hydrate(){if(location.protocol==='file:'||window.COSAREGALO_OFFLINE||document.querySelector('.bf-type-page'))return;
  await Promise.all(Array.from(document.querySelectorAll('.amazon-group')).map(async sec=>{
   const root=sec.querySelector('.amazon-products'),status=sec.querySelector('.amazon-api-note');if(!root)return;
   if(!root.dataset.editorial)root.dataset.editorial=root.innerHTML;
   root.innerHTML=root.dataset.editorial;
   try{const url='/api/products?type='+encodeURIComponent(sec.dataset.slug)+'&group='+encodeURIComponent(sec.dataset.group);
    const resp=await fetch(url,{headers:{Accept:'application/json'}});
    if(!resp.ok)return;
    const data=await resp.json();if(data.source==='amazon-creators-api'&&!scheduleAmazonExpiry(sec,data.expiresAt))return;sec.querySelector('[data-sitestripe-group]')?.remove();if(data.groupLink&&validUrl(data.groupLink,'link')){const a=e('a','amazon-btn','Esplora la selezione su Amazon ↗');a.dataset.sitestripeGroup='1';a.href=data.groupLink;a.target='_blank';a.rel='sponsored nofollow noopener';sec.append(a);}if(Array.isArray(data.items)&&paint(root,data.items,data.checkedAt)){
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
    link.textContent=link.hasAttribute('data-amazon-model')?'Cerca questo modello su Amazon ↗':'Cerca prodotti su Amazon ↗';
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
 function validAmazon(url){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['amazon.it','www.amazon.it'].includes(u.hostname)&&u.searchParams.getAll('tag').length===1&&u.searchParams.get('tag')==='230b7-21'}catch{return false}}
 function setGuideMediaStatus(root,state){
  root.dataset.mediaState=state;
  const note=root.querySelector('.cr-guide-media-note');if(!note)return;
  note.hidden=state==='ready';
  note.textContent=state==='loading'?'Stiamo caricando le foto dei prodotti.':state==='partial'?'Alcune foto non sono disponibili al momento.':'Le foto dei prodotti non sono disponibili al momento. Puoi comunque leggere le idee e i consigli qui sotto.';
 }
 async function hydrateExactGuide(){
  const root=document.querySelector('.cr-exact-products[data-guide-slug]');
  if(!root||root.dataset.hydrated==='1')return;
  const slug=root.dataset.guideSlug;
  setGuideMediaStatus(root,'loading');
  try{
   const resp=await fetch('/api/guide-products?slug='+encodeURIComponent(slug),{headers:{Accept:'application/json'},cache:'no-store',signal:AbortSignal.timeout(20000)});
   if(!resp.ok){setGuideMediaStatus(root,'unavailable');return;}
   const data=await resp.json();
   if(data.source!=='amazon-creators-api'||!Array.isArray(data.items)){setGuideMediaStatus(root,'unavailable');return;}
   // Expiry restores the honest editorial state, not an endless loading message.
   setGuideMediaStatus(root,'unavailable');
   if(!scheduleAmazonExpiry(root,data.expiresAt))return;
   const byAsin=new Map(data.items.map(p=>[p.asin,p]));
   const cards=[...root.querySelectorAll('.cr-specific-pick[data-asin]')];
   let loaded=0,pending=0;
   const update=()=>{
    const visible=cards.filter(card=>!card.hidden).length;
    setGuideMediaStatus(root,pending?'loading':loaded===visible&&visible>0?'ready':loaded?'partial':'unavailable');
   };
   cards.forEach(card=>{
    const p=byAsin.get(card.dataset.asin),media=card.querySelector('.cr-asin-media'),price=card.querySelector('.cr-asin-price'),buy=card.querySelector('.cr-asin-buy'),note=card.querySelector('.bf-pick-market-note');
    if(!p){if(slug==='sotto-30')card.hidden=true;return;}
    card.hidden=false;
    if(validImage(p.image)&&media){
     pending++;
     const img=document.createElement('img');img.loading='eager';img.decoding='async';img.alt='Foto del prodotto: '+p.title;
     img.addEventListener('load',()=>{if(root.contains(img)){pending--;loaded++;update();}},{once:true});
     img.addEventListener('error',()=>{if(root.contains(img)){pending--;media.replaceChildren();update();}},{once:true});
     media.replaceChildren(img);img.src=p.image;
    }
    const heading=card.querySelector('.cr-pick-heading h2,.cr-pick-heading h3,.bf-pick-content h2,.bf-pick-content h3');
    if(heading&&heading.textContent.startsWith('Prodotto Amazon ')){
     const concise=String(p.title||'').split(/[,|]/)[0].trim().slice(0,78);if(concise)heading.textContent=concise;
    }
    const content=card.querySelector('.bf-pick-content');
    const features=Array.isArray(p.features)?p.features.filter(x=>typeof x==='string'&&x.trim()):[];
    if(content&&features.length){
     let desc=content.querySelector('.cr-amazon-description');
     if(!desc){desc=document.createElement('p');desc.className='cr-amazon-description';content.querySelector('.bf-pick-check')?.before(desc);if(!desc.isConnected)content.append(desc);}
     const feature=features[0].replace(/\s+/g,' ').trim();
     desc.textContent=feature.length>160?feature.slice(0,157).replace(/\s+\S*$/,'')+'…':feature;
    }
    if(price)price.textContent=p.price||'';
    if(buy&&validAmazon(p.url)){buy.href=p.url;buy.textContent='Vedi su Amazon';buy.rel='sponsored nofollow noopener noreferrer';}
    if(note)note.textContent=p.price?'Prezzo rilevato '+new Date(data.checkedAt).toLocaleString('it-IT')+'. Controlla il prezzo finale su Amazon.':'Controlla variante, prezzo e disponibilità su Amazon.';
    if(p.availability){let availability=card.querySelector('.cr-asin-availability');if(!availability){availability=document.createElement('small');availability.className='cr-asin-availability';note?.before(availability)}availability.textContent=p.availability;}
   });
   const budgetNote=root.querySelector('.cr-budget-status');if(budgetNote&&data.items.length)budgetNote.hidden=true;
   root.dataset.hydrated='1';update();
  }catch{setGuideMediaStatus(root,'unavailable');}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hydrateExactGuide);
 else hydrateExactGuide();
})();

/* Keep the public guide hub aligned with editorial CMS publications. */
(function(){
 async function refreshGuideHub(){
  if(!/^\/guide\/?$/.test(location.pathname)||location.protocol==='file:')return;
  const hub=document.querySelector('.guide-grid');if(!hub)return;
  try{
   const resp=await fetch('/assets/latest-news.json',{cache:'no-store'});if(!resp.ok)return;
   const data=await resp.json();if(!Array.isArray(data.items))return;
   const safePath=/^guide\/[a-z0-9-]+\/index\.html$/;
   const safeImage=/^assets\/[a-z0-9-]+\.(webp|jpg|png)$/;
   const cards=[];
   data.items.filter(x=>x.status==='published'&&safePath.test(x.path)&&safeImage.test(x.image)).forEach(a=>{
    const article=document.createElement('article');article.className='guide-card';
    const media=document.createElement('a');media.className='guide-img';media.href='/'+a.path;
    const image=document.createElement('img');image.loading='lazy';image.alt='Immagine editoriale per '+a.title;image.src='/'+a.image;media.append(image);
    const copy=document.createElement('div');copy.className='guide-copy';
    const category=document.createElement('span');category.className='eyebrow';category.textContent=a.category;
    const title=document.createElement('h3'),link=document.createElement('a');link.href='/'+a.path;link.textContent=a.title;title.append(link);
    const summary=document.createElement('p');summary.textContent=a.summary;
    const action=document.createElement('a');action.href='/'+a.path;action.className='text-arrow';action.textContent='Leggi la guida →';
    copy.append(category,title,summary,action);article.append(media,copy);cards.push(article);
   });
   // The feed is the publishing truth; legacy guides not in it remain accessible via other links.
   if(cards.length)hub.replaceChildren(...cards);
  }catch{}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refreshGuideHub);else refreshGuideHub();
})();

/* Homepage hero follows the actual publication feed, never a fixed product category. */
(function(){
 async function updateLatestHero(){
  const hero=document.getElementById('latestHeroGuide');if(!hero||location.protocol==='file:')return;
  try{
   const response=await fetch(hero.dataset.feed||'/assets/latest-news.json',{cache:'no-store'});
   if(!response.ok)return;
   const data=await response.json(),items=Array.isArray(data.items)?data.items:[];
   const validPath=/^guide\/[a-z0-9-]+\/index\.html$/;
   const validImage=/^assets\/[a-z0-9-]+\.(webp|svg|png|jpg|jpeg)$/;
   const candidates=items.filter(x=>x&&x.status==='published'&&validPath.test(x.path)&&validImage.test(x.image)
    &&typeof x.title==='string'&&typeof x.summary==='string'&&typeof x.category==='string');
   if(!candidates.length)return;
   // Undated legacy entries do not outrank guides with a verified publication date.
   const newest=candidates.map((item,index)=>({item,index}))
    .sort((a,b)=>String(b.item.date||'').localeCompare(String(a.item.date||'')||0)||(a.index-b.index))[0].item;
   const link=hero.querySelector('.hero-product'),image=hero.querySelector('.hero-image img');
   if(!link||!image)return;
   link.href='/'+newest.path;image.src='/'+newest.image;image.alt='Immagine editoriale: '+newest.title;
   const name=hero.querySelector('.hero-product-text h2'),summary=hero.querySelector('.hero-product-text p'),category=hero.querySelector('.hero-product-text .micro');
   if(name)name.textContent=newest.title;
   if(summary)summary.textContent=newest.summary;
   if(category)category.textContent=newest.category.toUpperCase();
  }catch{/* Keep the newest verified guide from the static feed as fallback. */}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',updateLatestHero);
 else updateLatestHero();
})();

/* Curated type-page product cards. Never replace an editorial selection with keyword SearchItems. */
(function(){
 function validMedia(url){try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password&&/(^|\.)(media-amazon\.com|images-amazon\.com|ssl-images-amazon\.com)$/.test(u.hostname)}catch{return false}}
 function validAffiliate(url){try{const u=new URL(url);return u.protocol==='https:'&&['amazon.it','www.amazon.it'].includes(u.hostname)&&u.searchParams.get('tag')==='230b7-21'}catch{return false}}
 async function hydrateCuratedCategories(){
  const sections=[...document.querySelectorAll('.bf-type-page .amazon-group[data-slug]')];
  if(!sections.length||location.protocol==='file:'||window.COSAREGALO_OFFLINE)return;
  const slug=sections[0].dataset.slug;
  if(!slug||sections.some(s=>s.dataset.slug!==slug))return;
  const cards=[...document.querySelectorAll('.bf-type-page .amazon-product')];
  try{
   const response=await fetch('/api/category-products?slug='+encodeURIComponent(slug),{cache:'no-store',headers:{Accept:'application/json'}});
   if(!response.ok)return;
   const data=await response.json();
   if(data.source!=='amazon-creators-api'||!Array.isArray(data.items)||!Number.isFinite(Date.parse(data.expiresAt))||Date.parse(data.expiresAt)<=Date.now())return;
   if(!sections.every(section=>scheduleAmazonExpiry(section,data.expiresAt)))return;
   const products=new Map(data.items.map(p=>[p.asin,p]));
   cards.forEach(card=>{
    const found=(card.querySelector('.product-origin')?.textContent||'').match(/ASIN\s+([A-Z0-9]{10})/);
    if(!found)return;
    const p=products.get(found[1]);
    if(!p)return;
    const frame=card.querySelector('.amazon-product-image');
    if(frame&&validMedia(p.image)){
      const img=document.createElement('img');img.src=p.image;img.loading='lazy';
      img.decoding='async';img.alt='Foto ufficiale Amazon del prodotto '+(p.shortTitle||p.title);
      frame.replaceChildren(img);
    }
    const desc=card.querySelector('.amazon-product-desc');
    const specs=Array.isArray(p.features)?p.features.filter(x=>typeof x==='string'&&x.trim()):[];
    if(desc&&specs.length&&!desc.querySelector('.cr-amazon-spec')){
      const technical=document.createElement('p');technical.className='cr-amazon-spec';
      const summary=specs[0].trim().replace(/\s+/g,' ');
      technical.textContent=(summary.length>170?summary.slice(0,166).replace(/\s+\S*$/,'')+'…':summary);
      desc.append(technical);
    }
    const buy=card.querySelector('.amazon-product-buy');
    const price=buy?.querySelector('.amazon-price');
    if(price&&p.price){price.textContent=p.price;price.classList.remove('not-live')}
    const stamp=buy?.querySelector('.amazon-timestamp');
    if(stamp&&p.price)stamp.textContent='Prezzo rilevato '+new Date(data.checkedAt).toLocaleString('it-IT')+'. Prezzo e disponibilità al momento dell’acquisto su Amazon prevalgono.';
    const link=buy?.querySelector('.amazon-btn');
    if(link&&validAffiliate(p.url)){link.href=p.url;link.rel='sponsored nofollow noopener noreferrer';}
   });
   sections.forEach(s=>{
    const note=s.querySelector('.amazon-api-note');
    if(note)note.textContent='Selezione editoriale CosaRegalo; fotografie e prezzi ufficiali soltanto quando disponibili tramite Amazon. Prezzi e disponibilità possono cambiare.';
   });
  }catch{/* Preserve the original editorial text and verified SiteStripe links. */}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',hydrateCuratedCategories);else hydrateCuratedCategories();
})();


/* Keep CTA arrows aligned with the text, including wrapped mobile labels. */
(function alignShoppingArrows(){
 function align(){document.querySelectorAll('.amazon-btn,.bf-shop-cta').forEach(link=>{
  if(link.children.length)return;
  const match=link.textContent.trim().match(/^([\\s\\S]*?)\\s*([↗→])$/);
  if(!match)return;
  const label=document.createElement('span');label.className='cr-cta-label';label.textContent=match[1];
  const arrow=document.createElement('span');arrow.className='cr-cta-arrow';arrow.textContent=match[2];arrow.setAttribute('aria-hidden','true');
  link.replaceChildren(label,arrow);
 });}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',align);else align();
})();
