(function(){const $=s=>document.querySelector(s);let token=sessionStorage.getItem('cr-admin-token')||'';const td=(el,txt)=>{const x=document.createElement('td');x.textContent=String(txt);el.append(x)};
async function request(mode='dashboard',body){const r=await fetch('/api/admin'+(mode==='dashboard'?'':'?mode='+encodeURIComponent(mode)),{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,cache:'no-store'});const data=await r.json();if(!r.ok)throw new Error(data.message||data.error||'Accesso non riuscito');return data;}
function renderRows(selector,rows){const out=$(selector);out.textContent='';if(!rows?.length){const tr=document.createElement('tr');td(tr,'Dati non ancora disponibili');td(tr,'—');out.append(tr);return;}rows.forEach(x=>{const tr=document.createElement('tr');td(tr,x.name);td(tr,x.count.toLocaleString('it-IT'));out.append(tr);});}
function renderCalendar(calendar){const out=$('#adminCalendar');out.textContent='';const table=document.createElement('table');const head=document.createElement('thead');const tr=document.createElement('tr');['Data','Ora','Titolo','Formato','Stato'].forEach(x=>{const th=document.createElement('th');th.textContent=x;tr.append(th)});head.append(tr);table.append(head);const body=document.createElement('tbody');calendar.forEach(row=>{const tr=document.createElement('tr');[row.data,row.ora,row.titolo,row.formato,row.stato].forEach(x=>td(tr,x||'—'));body.append(tr)});table.append(body);out.append(table);}
async function load(){const data=await request();$('#loginCard').hidden=true;$('#adminContent').hidden=false;$('#logout').hidden=false;const stats=[['Pagine viste',data.views.reduce((a,b)=>a+b.count,0)],['Click Amazon',data.clicks.reduce((a,b)=>a+b.count,0)],['Creatori API',data.status.amazonCreatorsApi?'Configurata':'Da collegare'],['Statistiche',data.status.analytics==='connected'?'Attive':'Da collegare']];$('#adminStats').textContent='';stats.forEach(([name,value])=>{const card=document.createElement('div');card.className='admin-stat';const strong=document.createElement('strong');strong.textContent=typeof value==='number'?value.toLocaleString('it-IT'):value;const label=document.createElement('span');label.textContent=name;card.append(strong,label);$('#adminStats').append(card)});renderRows('#views',data.views);renderRows('#clicks',data.clicks);renderRows('#productViews',data.productViews);renderCalendar(data.editorial);await loadSiteStripe();await loadEditorial();await loadSocialPlan();$('#amazonReport').textContent=data.affiliate?`Ultimo report (${data.affiliate.period}): ${data.affiliate.clicks} clic · ${data.affiliate.orderedItems} ordinati · ${data.affiliate.earnings.toLocaleString('it-IT',{style:'currency',currency:'EUR'})} di commissioni. Inserito ${new Date(data.affiliate.updatedAt).toLocaleString('it-IT')}.`:'Nessun report Amazon Associates importato.';}
async function loadSocialPlan(){
 const tbody=$('#socialCalendarRows'),status=$('#socialCalendarStatus');
 if(!tbody||!status)return;
 tbody.replaceChildren();
 try{
  const plan=await request('social-plan');
  const items=Array.isArray(plan.items)?plan.items:[];
  for(const item of items){
   const tr=document.createElement('tr');
   const channelNames=['instagram','facebook','pinterest','tiktok'].filter(network=>item[network]?.planned).map(network=>network==='instagram'?'Instagram':network==='facebook'?'Facebook':network==='pinterest'?'Pinterest':'TikTok');
   for(const value of [item.date,item.slug,channelNames.join(', '),item.status==='planned_pending_verified_media_and_live_page'?'Da verificare - non programmato':item.status])td(tr,value);
   tbody.append(tr);
  }
  status.textContent=items.length+' proposte disponibili, nessuna pubblicazione confermata da questo pannello. Controllare il calendario Metricool e la validità dei media prima di programmare.';
 }catch(e){status.textContent='Impossibile caricare il piano social: '+e.message;}
}
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

let editorialData=[],editorialWritable=false,basePublished=[];
function articleMessage(msg,error=false){const x=$('#editorialResult');if(x){x.textContent=msg;x.className='admin-status '+(error?'admin-error':'admin-good');}}
async function loadEditorial(){
 const result=await request('articles');
 editorialData=result.articles||[];editorialWritable=!!result.writable;
 const feed=await fetch('/assets/latest-news.json',{cache:'no-store'}).then(r=>r.ok?r.json():{items:[]}).catch(()=>({items:[]}));
 basePublished=(feed.items||[]).filter(x=>x.status==='published');
 const entries=new Map(basePublished.map(a=>[a.slug,{slug:a.slug,title:a.title,category:a.category,status:'published',legacy:true,updatedAt:a.date||''}]));
 editorialData.forEach(a=>entries.set(a.slug,{...a,legacy:false}));
 const tbody=$('#editorialArticles');tbody.replaceChildren();
 if(!entries.size){const tr=document.createElement('tr');const cell=document.createElement('td');cell.colSpan=5;cell.textContent='Non sono presenti articoli.';tr.append(cell);tbody.append(tr);}
 for(const a of entries.values()){
  const tr=document.createElement('tr');
  for(const value of [a.title,a.category,a.status,a.updatedAt?.slice(0,10)||'—'])td(tr,value||'—');
  const actions=document.createElement('td'),edit=document.createElement('button');
  edit.type='button';edit.textContent='Modifica';edit.onclick=()=>openEditor(a);actions.append(edit);
  if(a.status!=='archived'){
   const archive=document.createElement('button');archive.type='button';archive.textContent='Archivia';
   archive.onclick=()=>archiveArticle(a);actions.append(archive);
  }
  tr.append(actions);tbody.append(tr);
 }
 $('#newArticleButton').disabled=!editorialWritable;
 if(!editorialWritable)articleMessage('Archivio editoriale non scrivibile: configura Redis REST sul server.',true);
}
function formValue(form,name,value){const input=form.elements.namedItem(name);if(input)input.value=String(value??'');}
async function openEditor(article){
 const form=$('#editorialArticleForm');form.hidden=false;
 const a={...article};
 if(a.legacy){
  try{
   const response=await fetch('/guide/'+encodeURIComponent(a.slug)+'/',{cache:'no-store'});
   if(!response.ok)throw Error('Impossibile leggere la pagina');
   const html=await response.text();
   const doc=new DOMParser().parseFromString(html,'text/html');
   const main=doc.querySelector('.bf-story-body,.reading-copy');
   let nodes=[...(main?.querySelectorAll('p.lede,p.bf-story-lede,.reading-copy > p,.bf-story-body > p,.reading-copy > section[id^="criterio-"] h2,.reading-copy > section[id^="criterio-"] p')||[])];
   if(nodes.length<2)nodes=[...(main?.querySelectorAll('p')||[])].filter(n=>!n.closest('.bf-pick,.bf-aside'));
   a.body=nodes.map(n=>n.tagName==='H2'?'## '+n.textContent:n.textContent).join('\n\n');
   a.summary=doc.querySelector('meta[name="description"]')?.content||a.title;
   a.asins=[...doc.querySelectorAll('[data-asin]')].map(x=>x.getAttribute('data-asin')).join(', ');
   a.revision=0;
   if(a.body.length<50)a.body='## Introduzione\n\n'+(doc.querySelector('.lede,.bf-story-lede')?.textContent||a.summary)+'\n\n## Consigli di acquisto\n\nControlla modello, compatibilità e disponibilità prima di scegliere il regalo.';
  }catch(e){articleMessage('Impossibile importare il testo originale: '+e.message,true);return;}
 }
 $('#editorialFormHeading').textContent=(a.slug?'Modifica articolo: '+a.slug:'Nuovo articolo');
 for(const field of ['slug','category','title','summary','body','status','revision'])formValue(form,field,a[field]);
 formValue(form,'asins',Array.isArray(a.asins)?a.asins.join(', '):(a.asins||''));
 const noteLines=Object.entries(a.productNotes||{}).map(([asin,n])=>[asin,n.title,n.note].join(' | ')).join('\n');
 formValue(form,'productNotes',noteLines);
 form.elements.namedItem('slug').readOnly=!!a.slug;
 form.scrollIntoView({block:'start',behavior:'smooth'});
}
async function archiveArticle(a){
 if(!editorialWritable){articleMessage('Archivio Redis non disponibile.',true);return;}
 if(!confirm('Archiviare "'+a.title+'"? La pagina non sarà più accessibile al pubblico.'))return;
 if(a.legacy){await openEditor(a);const form=$('#editorialArticleForm');form.elements.namedItem('status').value='archived';await saveArticleForm(form);return;}
 try{await request('article-save',{...a,asins:Array.isArray(a.asins)?a.asins.join(', '):'',status:'archived'});articleMessage('Articolo archiviato.');await loadEditorial();}
 catch(e){articleMessage('Archiviazione non riuscita: '+e.message,true);}
}
async function saveArticleForm(form){
 if(!editorialWritable){articleMessage('Archivio Redis non disponibile.',true);return;}
 const data=Object.fromEntries(new FormData(form).entries());
 data.revision=Number(data.revision||0);
 try{
  const result=await request('article-save',data);
  articleMessage('Articolo '+(result.article.status==='published'?'pubblicato':'salvato')+' correttamente. URL: /guide/'+result.article.slug+'/');
  form.hidden=true;await loadEditorial();
 }catch(e){articleMessage('Salvataggio non riuscito: '+e.message,true);}
}
$('#newArticleButton').onclick=()=>{const form=$('#editorialArticleForm');form.reset();form.elements.namedItem('slug').readOnly=false;formValue(form,'revision',0);formValue(form,'status','draft');form.hidden=false;$('#editorialFormHeading').textContent='Nuovo articolo';form.scrollIntoView({block:'start',behavior:'smooth'});};
$('#editorialCancelButton').onclick=()=>{$('#editorialArticleForm').hidden=true;};
$('#editorialArticleForm').onsubmit=async e=>{e.preventDefault();await saveArticleForm(e.target);};


const getItemsTestButton=$('#amazonGetItemsTest');
if(getItemsTestButton)getItemsTestButton.onclick=async()=>{
 const output=$('#amazonGetItemsResult');getItemsTestButton.disabled=true;
 output.textContent='Controllo GetItems in corso…';
 try{
  const response=await request('amazon-getitems-test'),test=response.test||{};
  output.textContent=test.ok?
   '✓ GetItems autorizzata · HTTP '+test.status+' · foto ufficiale: '+(test.hasOfficialImage?'disponibile':'non restituita')+' · prezzo: '+(test.hasPrice?'disponibile':'non restituito')+' · disponibilità: '+(test.hasAvailability?'indicata':'non restituita')+'.':
   '✕ GetItems non verificata: '+(test.reason||'Errore')+(test.status?' · HTTP '+test.status:'')+'.';
 }catch(e){output.textContent='Test non eseguito: '+e.message}
 finally{getItemsTestButton.disabled=false;}
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

