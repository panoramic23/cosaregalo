/* CosaRegalo ad placements: no ad requests before separate marketing consent.
   Public configuration only. Secrets must NEVER be sent to browser. */
(function(){
 const cfg=window.CR_ADS_CONFIG||{};
 if(!cfg.adsense?.client&&!cfg.cj?.image)return;
 const isHome=location.pathname==='/'||location.pathname==='/index.html';
 const placements=[];
 const googleCmp=cfg.cmpProvider==='google'&&cfg.mode==='adsense';
 let tcfResolved=false,googleSlotsInitialized=false;
 function add(position,after,anchor){
  if(!anchor)return;
  placements.push({position,after,anchor});
 }
 function placement(name,el,where='afterend'){
  const slot=document.createElement('aside');
  slot.className='cr-ad-placement';
  slot.setAttribute('aria-label','Pubblicità');
  slot.dataset.adPosition=name;
  slot.hidden=true;
  el.insertAdjacentElement(where,slot);
  return slot;
 }
 function place(){
  const main=document.querySelector('main');if(!main)return;
  if(isHome){
   const hero=document.querySelector('.home-finder')||document.querySelector('.hero');
   const sections=main.querySelectorAll('.home-section');
   if(hero)add('home-top','afterend',hero);
   if(sections[1])add('home-middle','afterend',sections[1]);
  }else{
   const anchor=main.querySelector('.amazon-group, .reading-copy section, .type-page-hero, .page-head, .hero, .page h1');
   if(anchor)add('article-inline','afterend',anchor);
  }
  const footer=document.querySelector('.site-footer');
  if(footer)add('site-bottom','beforebegin',footer);
  placements.forEach(p=>p.el=placement(p.position,p.anchor,p.after));
 }
 function marketingAllowed(){
  if(googleCmp)return tcfResolved; // Actual ad eligibility is decided by Google's certified TCF integration.
  try{return JSON.parse(localStorage.getItem('cosaregalo-consent-v2')||'{}').marketing===true;}catch{return false;}
 }
 function clear(){
  for(const p of placements){p.el?.replaceChildren();if(p.el)p.el.hidden=true;}
 }
 let scriptPending=null;
 function loadGoogle(){
  // Official Google CMP mode loads this exact AdSense tag in <head>.
  if(googleCmp)return Promise.resolve();
  if(scriptPending)return scriptPending;
  const client=String(cfg.adsense?.client||'');
  if(!/^ca-pub-\d{8,22}$/.test(client))return Promise.reject(new Error('Invalid AdSense client ID'));
  scriptPending=new Promise((resolve,reject)=>{
   const s=document.createElement('script');
   s.async=true;s.crossOrigin='anonymous';
   s.src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(client);
   s.onload=resolve;s.onerror=reject;
   document.head.appendChild(s);
  });
  return scriptPending;
 }
 function renderCJ(el){
  const link=cfg.cj?.link,image=cfg.cj?.image;
  if(!link||!image)return false;
  try{const a=new URL(link),img=new URL(image);if(a.protocol!=='https:'||img.protocol!=='https:')return false;}catch{return false;}
  const anchor=document.createElement('a');anchor.href=link;anchor.target='_blank';anchor.rel='sponsored nofollow noopener';
  const pic=document.createElement('img');pic.src=image;pic.alt=cfg.cj.alt||'Messaggio pubblicitario';pic.loading='lazy';pic.referrerPolicy='no-referrer';
  anchor.appendChild(pic);el.appendChild(anchor);return true;
 }
 async function render(){
  if(googleCmp&&googleSlotsInitialized)return;
  clear();if(!marketingAllowed())return;
  const chosen=String(cfg.mode||'off');
  for(const p of placements){
   const useAdsense=chosen==='adsense'&&cfg.adsense?.slots?.[p.position];
   const useCJ=chosen==='cj'&&cfg.cj?.link&&cfg.cj?.image;
   if(!useAdsense&&!useCJ)continue;
   const label=document.createElement('span');label.className='cr-ad-label';label.textContent='Pubblicità';
   p.el.append(label);p.el.hidden=false;
   if(useCJ){renderCJ(p.el);continue;}
   const ins=document.createElement('ins');ins.className='adsbygoogle';ins.style.display='block';
   ins.dataset.adClient=cfg.adsense.client;ins.dataset.adSlot=String(cfg.adsense.slots[p.position]);ins.dataset.adFormat='auto';ins.dataset.fullWidthResponsive='true';
   p.el.append(ins);
  }
  if(chosen==='adsense'&&marketingAllowed()){
   try{await loadGoogle();if(!marketingAllowed()){clear();return;}
    for(const p of placements){if(!p.el.hidden&&p.el.querySelector('ins.adsbygoogle'))(window.adsbygoogle=window.adsbygoogle||[]).push({});}
    if(googleCmp)googleSlotsInitialized=true;
   }catch(e){console.warn('CosaRegalo ad service unavailable');clear();}
  }
 }
 function setup(){
  place();
  if(googleCmp){
   // Wait for IAB TCF CMP readiness. After a decision, Google's AdSense
   // integration interprets the TC string and decides ad eligibility/types.
   window.googlefc=window.googlefc||{};
   window.googlefc.callbackQueue=window.googlefc.callbackQueue||[];
   window.googlefc.callbackQueue.push({'CONSENT_API_READY':()=>{
    if(typeof window.__tcfapi!=='function')return;
    window.__tcfapi('addEventListener',2,(data,success)=>{
     if(!success||!data)return;
     if(data.eventStatus==='tcloaded'||data.eventStatus==='useractioncomplete'){
      tcfResolved=true;render();
     }
    });
   }});
  }else{
   render();
   window.addEventListener('cr:consentchange',render);
  }
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);
 else setup();
})();
