/* CosaRegalo: UI bridge for the official Google Privacy & Messaging CMP.
 * This file is NOT a CMP and does not issue IAB TCF strings.
 * Google Privacy & Messaging (enabled from AdSense) owns the consent dialog and TC string.
 */
(function(){
  if(window.CR_CMP_PROVIDER!=='google')return;
  function showPreferences(){
    window.googlefc=window.googlefc||{};
    if(typeof window.googlefc.showRevocationMessage==='function'){
      window.googlefc.showRevocationMessage();
      return;
    }
    // The API may not have initialized yet: queue an action safely.
    window.googlefc.callbackQueue=window.googlefc.callbackQueue||[];
    window.googlefc.callbackQueue.push({'CONSENT_API_READY':()=>{
      if(typeof window.googlefc.showRevocationMessage==='function')window.googlefc.showRevocationMessage();
    }});
  }
  function setup(){
    // Footer and legal pages already use the same attribute.
    document.addEventListener('click',(event)=>{
      const link=event.target.closest('[data-cookie-settings]');
      if(!link)return;
      event.preventDefault();
      showPreferences();
    });
    // Disclose the real provider rather than implying a home-grown banner is Google certified.
    document.querySelectorAll('[data-cookie-settings]').forEach(el=>{
      el.setAttribute('aria-label','Riapri le preferenze Google Privacy e messaggi');
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setup);
  else setup();
})();
