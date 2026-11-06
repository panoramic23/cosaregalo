/* Privacy preferences — separate optional aggregate statistics and external ads.
   No ad script is loaded by CosaRegalo until an explicit marketing opt-in. */
(function(){
 if(location.protocol==='file:'||window.COSAREGALO_OFFLINE||location.pathname.startsWith('/admin'))return;
 const key='cosaregalo-consent-v2',legacy='cosaregalo-analytics-consent';
 function read(){
  try{const v=JSON.parse(localStorage.getItem(key)||'null');
   if(v&&typeof v.statistics==='boolean'&&typeof v.marketing==='boolean')return v;
  }catch{}
  const old=localStorage.getItem(legacy);
  if(old==='yes'||old==='no'){
   const v={statistics:old==='yes',marketing:false,version:2,savedAt:new Date().toISOString()};
   localStorage.setItem(key,JSON.stringify(v));return v;
  }
  return null;
 }
 const allowed=()=>read()?.statistics===true;
 const sent=new Set(),observed=new WeakSet();
 function send(type,product){
  if(!allowed())return;
  const payload={type,path:location.pathname,product};
  try{fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});}catch{}
 }
 function store(statistics,marketing){
  const preferences={statistics:!!statistics,marketing:!!marketing,version:2,savedAt:new Date().toISOString()};
  localStorage.setItem(key,JSON.stringify(preferences));
  localStorage.removeItem(legacy);
  document.querySelector('.cr-cookie-banner')?.remove();
  window.dispatchEvent(new CustomEvent('cr:consentchange',{detail:preferences}));
  if(statistics)send('page_view');
 }
 function banner(force=false){
  if(!force&&read())return;
  if(document.querySelector('.cr-cookie-banner'))return;
  const saved=read();
  const aside=document.createElement('aside');
  aside.className='cr-cookie-banner';aside.setAttribute('aria-label','Preferenze cookie e pubblicità');aside.setAttribute('role','dialog');
  aside.innerHTML='<button class="cr-cookie-close" type="button" aria-label="Chiudi rifiutando le opzioni facoltative">×</button>'+
   '<h2>La tua privacy conta</h2><p>Usiamo funzioni tecniche necessarie. Con il tuo consenso attiviamo statistiche aggregate e, separatamente, eventuali banner pubblicitari di partner esterni (Google AdSense o CJ) che possono utilizzare cookie e tecnologie di tracciamento. Puoi scegliere e modificare le preferenze quando vuoi. <a href="/privacy-policy/">Privacy policy</a> · <a href="/cookie-policy/">Cookie policy</a>.</p>'+
   '<div class="cr-cookie-settings"><label><input type="checkbox" checked disabled> Tecnici necessari</label><label><input type="checkbox" id="crAnalyticsSwitch"> Statistiche facoltative</label><label><input type="checkbox" id="crMarketingSwitch"> Pubblicità e contenuti sponsorizzati di terze parti</label></div>'+
   '<div class="cr-cookie-actions"><button type="button" data-choice="no">Rifiuta facoltativi</button><button type="button" data-choice="selection">Salva preferenze</button><button type="button" data-choice="yes">Accetta tutti</button></div>';
  const statistics=aside.querySelector('#crAnalyticsSwitch'),marketing=aside.querySelector('#crMarketingSwitch');
  statistics.checked=!!saved?.statistics;marketing.checked=!!saved?.marketing;
  aside.querySelector('.cr-cookie-close').onclick=()=>store(false,false);
  aside.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{
   if(b.dataset.choice==='no')store(false,false);
   else if(b.dataset.choice==='yes')store(true,true);
   else store(statistics.checked,marketing.checked);
  });
  document.body.append(aside);
 }
 const observer=('IntersectionObserver' in window)?new IntersectionObserver(entries=>{
  for(const entry of entries){if(!entry.isIntersecting)continue;const el=entry.target;const name=el.querySelector('h3')?.textContent?.trim();
   if(name&&!sent.has(name)){sent.add(name);send('product_view',name.slice(0,140));}observer.unobserve(el);}
 },{threshold:.6}):null;
 function scan(){
  // Do not mark products as already viewed while tracking consent is absent.
  if(!observer||!allowed())return;
  document.querySelectorAll('.amazon-product,.verified-deal').forEach(el=>{if(!observed.has(el)){observed.add(el);observer.observe(el);}});
 }
 function setup(){
  banner();if(allowed())send('page_view');scan();
  window.addEventListener('cr:consentchange',()=>{if(allowed())scan();});
  if(observer&&'MutationObserver' in window)new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
   const open=e.target.closest('[data-cookie-settings]');if(open){e.preventDefault();banner(true);return;}
   const a=e.target.closest('a[href]');if(!a)return;
   try{const host=new URL(a.href).hostname;
    if(host==='amazon.it'||host.endsWith('.amazon.it')){
     const card=a.closest('.amazon-product,.verified-deal,.product-card,.demo-product');
     send('amazon_click',(card?.querySelector('h3')?.textContent?.trim()||'Prodotto Amazon').slice(0,140));
    }
   }catch{}
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);else setup();
})();
