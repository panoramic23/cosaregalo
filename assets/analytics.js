/* CosaRegalo privacy choices: no marketing/analytics trackers before explicit opt-in.
   Preference saved as a necessary localStorage item, not an analytics cookie. */
(function(){
 if(location.protocol==='file:'||window.COSAREGALO_OFFLINE||location.pathname.startsWith('/admin'))return;
 const key='cosaregalo-analytics-consent';
 const old=localStorage.getItem(key);
 const getChoice=()=>localStorage.getItem(key);
 const allowed=()=>getChoice()==='yes';
 const sent=new Set(),observed=new WeakSet();
 function send(type,product){
  if(!allowed())return;
  const payload={type,path:location.pathname,product};
  try{fetch('/api/track',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload),keepalive:true}).catch(()=>{});}catch{}
 }
 function store(value){
  localStorage.setItem(key,value);
  document.querySelector('.cr-cookie-banner')?.remove();
  if(value==='yes')send('page_view');
  window.dispatchEvent(new CustomEvent('cr:consentchange',{detail:{analytics:value==='yes'}}));
 }
 function banner(force=false){
  if(!force&&getChoice()!==null)return;
  if(document.querySelector('.cr-cookie-banner'))return;
  const aside=document.createElement('aside');
  aside.className='cr-cookie-banner';
  aside.setAttribute('aria-label','Preferenze cookie e statistiche');
  aside.setAttribute('role','dialog');
  aside.innerHTML='<button class="cr-cookie-close" type="button" aria-label="Chiudi senza accettare">×</button>'+
   '<h2>La tua privacy conta</h2><p>Utilizziamo soltanto le funzioni tecniche necessarie al sito. Con il tuo consenso possiamo raccogliere statistiche aggregate sulle pagine e sui prodotti consultati, senza creare profili personali. Puoi rifiutare o cambiare scelta in ogni momento. <a href="/privacy-policy/">Privacy policy</a> · <a href="/cookie-policy/">Cookie policy</a>.</p>'+
   '<div class="cr-cookie-settings"><label><input type="checkbox" checked disabled> Tecnici necessari (sempre attivi)</label><label><input type="checkbox" id="crAnalyticsSwitch"> Statistiche facoltative</label></div>'+
   '<div class="cr-cookie-actions"><button type="button" data-choice="no">Rifiuta</button><button type="button" data-choice="selection">Salva preferenze</button><button type="button" data-choice="yes">Accetta statistiche</button></div>';
  const choice=aside.querySelector('#crAnalyticsSwitch');
  choice.checked=force&&allowed();
  aside.querySelector('.cr-cookie-close').onclick=()=>store('no');
  aside.querySelectorAll('[data-choice]').forEach(button=>button.onclick=()=>{
   const value=button.dataset.choice==='selection'?(choice.checked?'yes':'no'):button.dataset.choice;
   store(value);
  });
  document.body.append(aside);
 }
 // Event recording after opt-in only.
 const observer=('IntersectionObserver' in window)?new IntersectionObserver(entries=>{
  for(const entry of entries){if(!entry.isIntersecting)continue;const el=entry.target;
   const title=el.querySelector('h3')?.textContent?.trim();
   if(title&&!sent.has(title)){sent.add(title);send('product_view',title.slice(0,140));}
   observer.unobserve(el);
  }
 },{threshold:.6}):null;
 function scan(){
  if(!observer)return;
  document.querySelectorAll('.amazon-product,.verified-deal').forEach(el=>{
   if(!observed.has(el)){observed.add(el);observer.observe(el);}
  });
 }
 function setup(){
  banner();
  if(allowed())send('page_view');
  scan();
  if(observer&&'MutationObserver' in window)new MutationObserver(scan).observe(document.body,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
   const open=e.target.closest('[data-cookie-settings]');
   if(open){e.preventDefault();banner(true);return;}
   const a=e.target.closest('a[href]');if(!a)return;
   try{
    const host=new URL(a.href).hostname;
    if(host==='amazon.it'||host.endsWith('.amazon.it')){
     const card=a.closest('.amazon-product,.verified-deal,.product-card,.demo-product');
     const title=card?.querySelector('h3')?.textContent?.trim()||'Prodotto Amazon';
     send('amazon_click',title.slice(0,140));
    }
   }catch{}
  });
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);
 else setup();
})();
