(function(){const $=s=>document.querySelector(s);let token=sessionStorage.getItem('cr-admin-token')||'';const td=(el,txt)=>{const x=document.createElement('td');x.textContent=String(txt);el.append(x)};
async function request(mode='dashboard',body){const r=await fetch('/api/admin'+(mode==='dashboard'?'':'?mode='+encodeURIComponent(mode)),{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store'});const data=await r.json();if(!r.ok)throw new Error(data.message||data.error||'Accesso non riuscito');return data;}
function renderRows(selector,rows){const out=$(selector);out.textContent='';if(!rows?.length){const tr=document.createElement('tr');td(tr,'Dati non ancora disponibili');td(tr,'—');out.append(tr);return;}rows.forEach(x=>{const tr=document.createElement('tr');td(tr,x.name);td(tr,x.count.toLocaleString('it-IT'));out.append(tr);});}
function renderCalendar(calendar){const out=$('#adminCalendar');out.textContent='';const table=document.createElement('table');const head=document.createElement('thead');const tr=document.createElement('tr');['Data','Ora','Titolo','Formato','Stato'].forEach(x=>{const th=document.createElement('th');th.textContent=x;tr.append(th)});head.append(tr);table.append(head);const body=document.createElement('tbody');calendar.forEach(row=>{const tr=document.createElement('tr');[row.data,row.ora,row.titolo,row.formato,row.stato].forEach(x=>td(tr,x||'—'));body.append(tr)});table.append(body);out.append(table);}
async function load(){const data=await request();$('#loginCard').hidden=true;$('#adminContent').hidden=false;$('#logout').hidden=false;const stats=[['Pagine viste',data.views.reduce((a,b)=>a+b.count,0)],['Click Amazon',data.clicks.reduce((a,b)=>a+b.count,0)],['Creatori API',data.status.amazonCreatorsApi?'Configurata':'Da collegare'],['Statistiche',data.status.analytics==='connected'?'Attive':'Da collegare']];$('#adminStats').textContent='';stats.forEach(([name,value])=>{const card=document.createElement('div');card.className='admin-stat';const strong=document.createElement('strong');strong.textContent=typeof value==='number'?value.toLocaleString('it-IT'):value;const label=document.createElement('span');label.textContent=name;card.append(strong,label);$('#adminStats').append(card)});renderRows('#views',data.views);renderRows('#clicks',data.clicks);renderRows('#productViews',data.productViews);renderCalendar(data.editorial);await loadSiteStripe();$('#amazonReport').textContent=data.affiliate?`Ultimo report (${data.affiliate.period}): ${data.affiliate.clicks} clic · ${data.affiliate.orderedItems} ordinati · ${data.affiliate.earnings.toLocaleString('it-IT',{style:'currency',currency:'EUR'})} di commissioni. Inserito ${new Date(data.affiliate.updatedAt).toLocaleString('it-IT')}.`:'Nessun report Amazon Associates importato.';}
async function loadSiteStripe(){
 let panel=$('#sitestripePanel');
 if(!panel){panel=document.createElement('section');panel.id='sitestripePanel';panel.className='admin-card';
 const h=document.createElement('h2');h.textContent='Link SiteStripe e modalità catalogo';
 const note=document.createElement('p');note.textContent='Incolla la configurazione JSON seguendo SITESTRIPE.md. Conferma solo link generati con SiteStripe e controllati sul prodotto o sulla ricerca corretti. Nessun prezzo o disponibilità viene importato.';
 const editor=document.createElement('textarea');editor.id='sitestripeConfig';editor.rows=18;editor.style.width='100%';editor.setAttribute('aria-label','Configurazione SiteStripe JSON');
 const button=document.createElement('button');button.textContent='Salva configurazione verificata';button.type='button';
 const result=document.createElement('p');result.id='sitestripeResult';result.setAttribute('role','status');
 button.onclick=async()=>{try{const config=JSON.parse(editor.value);await request('sitestripe',config);await loadSiteStripe();result.textContent='Configurazione salvata e riletta.';}catch(e){result.textContent='Non salvata: '+e.message;}};
 panel.append(h,note,editor,button,result);$('#adminContent').prepend(panel);}
 const data=await request('sitestripe');$('#sitestripeConfig').value=JSON.stringify(data.config,null,2);panel.querySelector('button').disabled=!data.writable;
 if(!data.writable)$('#sitestripeResult').textContent='Salvataggio admin richiede Redis REST. In alternativa aggiorna content/sitestripe.json nel repository.';
}
const apiTestButton=$('#amazonApiTest');
if(apiTestButton)apiTestButton.onclick=async()=>{
 const output=$('#amazonApiTestResult');
 apiTestButton.disabled=true;output.textContent='Verifica Amazon in corso…';
 try{
  const data=await request('amazon-api-test');
  const test=data.test||{};
  const labels={
   AUTHORIZED:'Accesso autorizzato: Amazon ha accettato la ricerca prodotti.',
   AssociateNotEligible:'Account ancora non idoneo alla Creators API.',
   API_NOT_CONFIGURED:'Credenziali o Partner Tag non configurati.',
   AUTH_FAILED:'Autenticazione Amazon rifiutata.',
   AUTH_UNAVAILABLE:'Autenticazione Amazon temporaneamente non disponibile.',
   NETWORK_UNAVAILABLE:'Connessione ad Amazon non disponibile.',
   InvalidPartnerTag:'Partner Tag non valido.',
   AuthorizationFailed:'Autorizzazione Amazon negata.'
  };
  output.textContent=(test.ok?'✓ ':'✕ ')+(labels[test.reason]||('Risposta Amazon: '+(test.reason||'sconosciuta')))+' · HTTP '+(test.status||'n/d')+' · modalità catalogo: '+(data.catalogMode||'sconosciuta')+'.';
 }catch(err){output.textContent='Test non riuscito: '+err.message}
 finally{apiTestButton.disabled=false}
};
$('#loginForm').onsubmit=async e=>{e.preventDefault();token=$('#secret').value;try{await load();sessionStorage.setItem('cr-admin-token',token);$('#secret').value='';$('#loginMessage').textContent='';}catch(err){$('#loginMessage').textContent=err.message;token='';}};
$('#logout').onclick=()=>{sessionStorage.removeItem('cr-admin-token');token='';$('#loginCard').hidden=false;$('#adminContent').hidden=true;$('#logout').hidden=true;};
$('#reportForm').onsubmit=async e=>{e.preventDefault();const form=new FormData(e.target);const data=Object.fromEntries(form.entries());try{await request('amazon-report',data);await load();alert('Riepilogo Amazon salvato');}catch(err){alert(err.message)}};
$('#dealForm').onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(e.target).entries());try{await request('deal',data);$('#adminResult').textContent='Offerta inserita. Il sistema la mostrerà solo finché il controllo risulta recente.';e.target.reset()}catch(err){$('#adminResult').textContent='Offerta non pubblicata: '+err.message}};
if(location.protocol==='file:'){
 $('#loginCard').hidden=true;$('#adminContent').hidden=false;$('#logout').hidden=true;
 $('#adminStats').innerHTML='<div class="admin-stat"><strong>Offline</strong><span>Stato del sito</span></div><div class="admin-stat"><strong>Non disponibili</strong><span>Visite e statistiche</span></div><div class="admin-stat"><strong>Da collegare</strong><span>Amazon Creators API</span></div><div class="admin-stat"><strong>Da importare</strong><span>Amazon Affiliati</span></div>';
 renderRows('#views',[]);renderRows('#clicks',[]);renderRows('#productViews',[]);renderCalendar(window.CR_EDITORIAL_PREVIEW||[]);
 $('#amazonReport').textContent='Anteprima offline: nessun report Associates importato.';
 $('#reportForm').hidden=true;$('#dealForm').hidden=true;
 const note=document.createElement('p');note.textContent='Funzioni di scrittura disattivate nella versione offline; saranno abilitate sul server dopo la configurazione della fase 2.';
 note.className='admin-note';$('#adminResult').append(note);
}else if(token)load().catch(()=>sessionStorage.removeItem('cr-admin-token'));
})();

