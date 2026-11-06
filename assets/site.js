
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
 if(menu&&nav&&!menu.dataset.bound){menu.dataset.bound='1';menu.addEventListener('click',()=>{let open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});}
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
    }else if(status)status.textContent='Selezione editoriale: nessun link prodotto verificato. Fasce di budget indicative, non prezzi o disponibilità attuali.';
   }catch{/* Present clear editorial fallback; never fabricate price. */}
  }));
 }
 document.addEventListener('DOMContentLoaded',hydrate);
 window.addEventListener('hashchange',()=>setTimeout(hydrate,0));
})();

