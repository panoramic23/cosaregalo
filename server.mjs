import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import products from './api/products.mjs';
import guideProducts from './api/guide-products.mjs';
import deals from './api/deals.mjs';
import track from './api/track.mjs';
import admin from './api/admin.mjs';
import {readArticles,visibleArticles,renderArticle} from './lib/article-cms.mjs';

const root=dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||3000);
// Bump public asset URLs whenever the Node deployment restarts to avoid mixed HTML/CSS versions.
const assetRevision=Date.now().toString(36);
const handlers=new Map([['/api/products',products],['/api/guide-products',guideProducts],['/api/deals',deals],['/api/track',track],['/api/admin',admin]]);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.csv':'text/csv; charset=utf-8'};
const blocked=new Set(['api','lib','content','node_modules','.git']);

const socialProfiles=[
 ['facebook','Facebook','SOCIAL_FACEBOOK_URL','facebook.com','<path d="M14 21v-8h3l.5-4H14V7c0-1 .3-2 2-2h2V1.5A25 25 0 0 0 15 1c-3 0-5 1.8-5 5v3H7v4h3v8"/>'],
 ['instagram','Instagram','SOCIAL_INSTAGRAM_URL','instagram.com','<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".9" fill="currentColor" stroke="none"/>'],
 ['tiktok','TikTok','SOCIAL_TIKTOK_URL','tiktok.com','<path d="M14 3c.4 3.1 1.8 4.7 5 5v3.2c-2.1-.1-3.7-.8-5-1.9V16a5 5 0 1 1-5-5h1v3.3a2 2 0 1 0 1 1.7V3z"/>'],
 ['pinterest','Pinterest','SOCIAL_PINTEREST_URL','pinterest.com','<circle cx="12" cy="12" r="9"/><path d="M9 20l2-8c-.5-1.6 0-4 2.4-4 3.8 0 2.7 5.5-.3 5.5-.7 0-1.2-.3-1.5-.9M9.3 10a4.8 4.8 0 0 1 4-3"/>']
];
function safeSocialUrl(value,domain){
 try{const u=new URL(value);if(u.protocol!=='https:'||u.username||u.password)return '';
  if(u.hostname!==domain&&!u.hostname.endsWith('.'+domain)&&!(domain==='pinterest.com'&&(u.hostname==='pinterest.it'||u.hostname.endsWith('.pinterest.it'))))return '';
  return u.href;
 }catch{return '';}
}
const escapeAttr=s=>String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
function socialBlock(){
 const links=socialProfiles.map(([id,label,env,domain,svg])=>{
  const url=safeSocialUrl(process.env[env]||({instagram:'https://www.instagram.com/regalocosa/',facebook:'https://www.facebook.com/profile.php?id=61596280358647',pinterest:'https://www.pinterest.com/regalocosa/'}[id]||''),domain);
  const image='<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+svg+'</svg>';
  return url?'<a class="cr-social-link" href="'+escapeAttr(url)+'" aria-label="'+label+'" target="_blank" rel="noopener noreferrer">'+image+'</a>':
   '<span class="cr-social-link is-inactive" role="img" aria-label="'+label+' (profilo da collegare)" title="'+label+' — profilo da collegare">'+image+'</span>';
 }).join('');
 return '<div class="cr-socials" aria-label="Seguici sui social"><span class="cr-social-label">Seguici</span>'+links+'</div>';
}
const adsenseClient='ca-pub-3418117440633690';
// The Google CMP is supplied/certified by Google's AdSense Privacy & Messaging.
// It must be published in the matching AdSense account before enabling this switch.
const googleCmpEnabled=process.env.CMP_PROVIDER==='google'
 && process.env.GOOGLE_CMP_PUBLISHED==='true'
 && /^ca-pub-\d{8,22}$/.test(adsenseClient);

const publicAds={
 cmpProvider:googleCmpEnabled?'google':'custom',
 mode:['adsense','cj'].includes(process.env.ADS_MODE)?process.env.ADS_MODE:'off',
 adsense:{
  client:/^ca-pub-\d{8,22}$/.test(adsenseClient)?process.env.ADSENSE_CLIENT:'',
  slots:Object.fromEntries([
   ['home-top','ADSENSE_SLOT_HOME_TOP'],['home-middle','ADSENSE_SLOT_HOME_MIDDLE'],
   ['article-inline','ADSENSE_SLOT_ARTICLE_INLINE'],['site-bottom','ADSENSE_SLOT_SITE_BOTTOM']
  ].map(([k,v])=>[k,/^\d{8,20}$/.test(process.env[v]||'')?process.env[v]:'']))
 },
 cj:{
  link:/^https:\/\//i.test(process.env.CJ_BANNER_LINK||'')?process.env.CJ_BANNER_LINK:'',
  image:/^https:\/\//i.test(process.env.CJ_BANNER_IMAGE||'')?process.env.CJ_BANNER_IMAGE:'',
  alt:(process.env.CJ_BANNER_ALT||'Banner pubblicitario').slice(0,100)
 }
};
const publicAdsJson=JSON.stringify(publicAds).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026');

const publicSiteUrl='https://cosa-regalo.it';
const canonicalSite=/^https:\/\/(?:www\.)?cosa-regalo\.it$/i.test(publicSiteUrl)?publicSiteUrl:'';
// The official public domain is now published; productionRequest still excludes staging hosts.
const indexable=!!canonicalSite;
// Never expose staging/temporary hostnames to crawlers even when production SEO is enabled.
function productionRequest(req){
 const host=String(req.headers.host||'').toLowerCase().replace(/:\d+$/,'');
 return indexable&&(host==='cosa-regalo.it'||host==='www.cosa-regalo.it');
}
const indexPaths=[
 '/', '/offerte/', '/confronti/', '/tipologie/', '/trova-regalo/', '/occasioni/', '/metodo/', '/privacy-policy/', '/cookie-policy/',
 '/guide/', '/guide/natale/', '/guide/benessere/', '/guide/sotto-30/', '/guide/tech/',
 '/guide/lettura/', '/guide/cuffie/', '/guide/cucina-poco-spazio/', '/guide/scrivania-pratica/', '/guide/giochi-creativi-bambini/', '/esplora/ricorrenze/', '/esplora/gusti/',
 '/esplora/sport/', '/esplora/cartoni/', '/esplora/stagioni/', '/tipologie/speaker-bluetooth/',
 '/tipologie/giochi-costruzioni/', '/tipologie/cofanetti-benessere/',
 '/tipologie/kit-trucchi/', '/tipologie/cuffie-wireless/', '/tipologie/e-reader/',
 '/tipologie/accessori-scrivania/', '/tipologie/microfoni-karaoke/'
];
function serveText(res,content,type='text/plain; charset=utf-8'){
 res.statusCode=200;res.setHeader('Content-Type',type);res.setHeader('Cache-Control','public, max-age=300');res.end(content);
}
function reply(res,status,data){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(data));}
async function receiveJSON(req){
  let size=0;const pieces=[];
  for await(const chunk of req){size+=chunk.length;if(size>65536){const e=new Error('BODY_TOO_LARGE');e.status=413;throw e;}pieces.push(chunk);}
  if(!size)return {};
  try{return JSON.parse(Buffer.concat(pieces).toString('utf8'));}catch{const e=new Error('BAD_JSON');e.status=400;throw e;}
}
function adapt(res){
  res.status=function(code){this.statusCode=code;return this;};
  res.json=function(data){reply(this,this.statusCode||200,data);return this;};
  return res;
}
async function api(req,res,pathname,searchParams){
  res.setHeader('X-Content-Type-Options','nosniff');
  req.query=Object.fromEntries(searchParams.entries());
  if(req.method==='POST'){
    if(!String(req.headers['content-type']||'').toLowerCase().startsWith('application/json'))return reply(res,415,{error:'JSON_REQUIRED'});
    try{req.body=await receiveJSON(req);}catch(e){return reply(res,e.status||400,{error:e.message});}
  }
  try{await handlers.get(pathname)(req,adapt(res));if(!res.writableEnded)reply(res,500,{error:'EMPTY_API_RESPONSE'});}
  catch(e){if(!res.writableEnded)reply(res,500,{error:'INTERNAL_ERROR'});console.error('API failure:',pathname,e?.message);}
}
async function staticFile(req,res,pathname){
  const publicIndexable=productionRequest(req);
  if(!['GET','HEAD'].includes(req.method))return reply(res,405,{error:'METHOD_NOT_ALLOWED'});
  if(pathname==='/outlet'||pathname==='/outlet/'){res.writeHead(308,{Location:'/offerte/'});res.end();return;}
  let decoded;
  try{decoded=decodeURIComponent(pathname);}catch{return reply(res,400,{error:'INVALID_PATH'});}
  if(decoded.includes('\\')||decoded.includes('\0')||decoded.split('/').some(part=>part==='..'||part.startsWith('.')))return reply(res,403,{error:'FORBIDDEN'});
  const parts=decoded.split('/').filter(Boolean);
  if(parts.length&&blocked.has(parts[0]))return reply(res,404,{error:'NOT_FOUND'});
  let relative;
  if(parts[0]==='assets'){
    // Public CSS, JavaScript and images: assets are restricted to known extensions.
    if(parts.length<2||parts.some(part=>part.startsWith('.'))||!['.css','.js','.json','.svg','.webp','.png','.jpg','.jpeg','.ico'].includes(extname(parts.at(-1)).toLowerCase()))return reply(res,404,{error:'NOT_FOUND'});
    relative=parts.join('/');
  }else{
    // Both /guide/ and /guide/index.html must resolve to guide/index.html.
    // Explicit file paths other than index.html are never publicly served.
    if(parts.at(-1)==='index.html')parts.pop();
    if(parts.some(part=>!/^[a-z0-9_-]+$/i.test(part)))return reply(res,404,{error:'NOT_FOUND'});
    relative=parts.concat('index.html').join('/');
  }
  const file=resolve(root,relative||'index.html');
  if(!file.startsWith(root+sep))return reply(res,403,{error:'FORBIDDEN'});
  try{
    const info=await stat(file);
    if(!info.isFile())return reply(res,404,{error:'NOT_FOUND'});
    let bytes=await readFile(file);
    // Shared header text is removed from every HTML page at the server level.
    // Keep the informative affiliate notice in the footer and dedicated pages.
    if(extname(file).toLowerCase()==='.html'){
      const prefix=parts.length?'../'.repeat(parts.at(-1)==='index.html'?parts.length-1:parts.length):'';
      let html=bytes.toString('utf8')
       .replace(/<span>Scopri il nostro metodo\s*·\s*<a\s+href="[^"]*">Come funziona<\/a><\/span>/g,'')
       .replace(/<div class="demo-notice">[\s\S]*?<\/div><\/div>/g,'')
       .replace(/<span>© 2026 CosaRegalo · Anteprima HTML, non negozio online\.<\/span>/g,'<span>© 2026 CosaRegalo</span>')
       .replace(/<span>Pubblicazione automatica e prezzi live non ancora attivi\.<\/span>/g,'<span>Powered by <a href="https://www.panoramicweb.it/" target="_blank" rel="noopener noreferrer">Panoramic</a></span>')
       .replace(/GUIDE UTILI, PREZZI DA VERIFICARE/g,'GUIDE, IDEE REGALO E CONFRONTI')
       .replace(/<span class="image-label">ANTEPRIMA<\/span>/g,'<span class="image-label">IMMAGINE ILLUSTRATIVA</span>')
       .replace(/Anteprima dimostrativa\./g,'Guide e confronti di CosaRegalo.')
       .replace(/Le schede della preview e i prezzi sono dimostrativi\. Il progetto definitivo non deve inventare recensioni, test o prezzi\./g,'I prezzi e le offerte vengono mostrati solo quando verificabili; non pubblichiamo recensioni, test o sconti inventati.');
      if(!html.includes('href="'+prefix+'privacy-policy/index.html"') && !html.includes('href="/privacy-policy/"')){
        html=html.replace(/(<div><b>INFORMAZIONI<\/b>)/, '$1<a href="'+prefix+'privacy-policy/index.html">Privacy policy</a><a href="'+prefix+'cookie-policy/index.html">Cookie policy</a><a href="#" data-cookie-settings>Preferenze cookie</a>');
      }
      // Single footer navigation across original pages and new legal pages.
      // The editorial calendar is internal, not a public navigation item.
      html=html.replace(/<a href="[^"]*calendario\/index\.html">Piano editoriale<\/a>/g,'');
      if(html.includes('<footer class="site-footer">')&&!html.includes('>Amministrazione</a>')){
        const adminHref=prefix+'admin/index.html';
        html=html.replace(/(<div><b>INFORMAZIONI<\/b>)/,'$1<a href="'+adminHref+'" rel="nofollow">Amministrazione</a>');
      }
      // A unified, readable navigation on every public page.
      // Keep real hrefs in the HTML for accessibility and search engines.
      if(html.includes('class="nav-menu"')){
        const categories=[
          ['Elettronica','tech'],['Casa e ufficio','casa'],
          ['Giochi','gioco'],['Bellezza e benessere','benessere']
        ];
        const themes=[
          ['Ricorrenze','ricorrenze'],['Gusti e passioni','gusti'],
          ['Sport','sport'],['Cartoni animati','cartoni'],['Stagioni','stagioni']
        ];
        const cur=parts.join('/');
        const active=slug=>cur===slug||cur.startsWith(slug+'/');
        const catLinks=categories.map(([label,id])=>'<a href="'+prefix+'tipologie/index.html?category='+id+'">'+label+'</a>').join('');
        const themeLinks=themes.map(([label,id])=>'<a href="'+prefix+'esplora/'+id+'/index.html">'+label+'</a>').join('');
        const icon=(name)=>{
          const paths={
            grid:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
            home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10z"/>',
            gift:'<rect x="3" y="9" width="18" height="12" rx="2"/><path d="M3 13h18M12 9v12M12 9H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z"/>',
            search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
            book:'<path d="M12 7.5C9.5 5.8 6.4 5.8 3 7v13c3.4-1.2 6.5-1.2 9 .5m0-13c2.5-1.7 5.6-1.7 9-.5v13c-3.4-1.2-6.5-1.2-9 .5m0-13v13"/>',
            compare:'<path d="M4 7h16M4 17h16m-5-5 5-5-5-5M9 12l-5 5 5 5"/>',
            tag:'<path d="m20 13-7 7a2 2 0 0 1-2.8 0L3 12.8V4h8.8L20 12.2a1 1 0 0 1 0 .8Z"/><circle cx="7.8" cy="8" r="1"/>'
          };
          return '<svg class="nav-icon" viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.grid)+'</svg>';
        };
        const drop=(label,id,items,extra,selected,symbol)=>'<div class="nav-categories'+(selected?' nav-current':'')+'"><button class="nav-categories-toggle" type="button" aria-expanded="false" aria-controls="'+id+'" aria-haspopup="true">'+icon(symbol)+'<span class="nav-label">'+label+'</span><span class="nav-chevron" aria-hidden="true">⌄</span></button><div class="nav-category-panel" id="'+id+'"><div class="nav-category-grid">'+items+'</div>'+extra+'</div></div>';
        const categoriesNav=drop('Categorie','crCategoryLinks',catLinks,'<a class="nav-all-categories" href="'+prefix+'tipologie/index.html">Tutte le categorie <span aria-hidden="true">→</span></a>',active('tipologie'),'grid');
        const exploreNav=drop('Idee regalo','crExploreLinks',themeLinks,'',active('esplora')||active('occasioni'),'gift');
        const navLink=(label,path,symbol)=>'<a'+((path==='index.html'?parts.length===0:active(path.replace(/\/index\.html$/,'')))?' class="active"':'')+' href="'+prefix+path+'">'+icon(symbol)+'<span class="nav-label">'+label+'</span></a>';
        const nav=navLink('Home','index.html','home')+categoriesNav+exploreNav
          +navLink('Trova un regalo','trova-regalo/index.html','search')
          +navLink('Guide','guide/index.html','book')
          +navLink('Confronti','confronti/index.html','compare')
          +navLink('Super offerte','offerte/index.html','tag');
        html=html.replace(/<nav class="nav-menu"[^>]*>[\s\S]*?<\/nav>/,
          '<nav class="nav-menu" id="navMenu" aria-label="Navigazione principale">'+nav+'</nav>');
        // The old long slogan crowded and visually competed with useful navigation.
        html=html.replace(/<span class="nav-end">[\s\S]*?<\/span>/,'');
      }
      // Affiliate disclosure belongs with the brand description in footer column one.
      const disclosure='In qualità di Affiliato Amazon, possiamo ricevere una commissione sugli acquisti idonei.';
      if(html.includes('class="footer-grid"')&&html.includes(disclosure)&&!html.includes('class="footer-affiliate-disclosure"')){
        html=html.replace(/<p>\s*In qualità di Affiliato Amazon, possiamo ricevere una commissione sugli acquisti idonei\.\s*<\/p>/g,'');
        html=html.replace(/(<div class="container footer-grid"><div>[\s\S]*?<\/p>)(<\/div>)/,
          '$1<p class="footer-affiliate-disclosure">'+disclosure+'</p>$2');
      }
      if(html.includes('class="announcement"')&&!html.includes('class="cr-socials"')){
        html=html.replace(/(<div class="announcement"><div class="container">)([\s\S]*?)(<\/div><\/div>)/,
          (match,start,inside,end)=>start+inside+socialBlock()+end);
      }
      // Google's certified CMP owns the EU consent dialogue. The AdSense tag
      // loads the published message; ad slots remain separately disabled by default.
      if(googleCmpEnabled&&!html.includes('/assets/google-cmp.js')){
        const client=adsenseClient;
        const headTags='<script>window.CR_CMP_PROVIDER="google";window.googlefc=window.googlefc||{};window.googlefc.callbackQueue=window.googlefc.callbackQueue||[];</script>'
          +'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(client)+'" crossorigin="anonymous"></script>'
          +'<script defer src="/assets/google-cmp.js"></script>';
        html=html.replace('</head>',headTags+'</head>');
      }
      // Publisher-supplied AdSense site tag, once on public production pages.
      if(publicIndexable && parts[0]!=='admin' && !html.includes('pagead2.googlesyndication.com/pagead/js/adsbygoogle.js')){
        html=html.replace('</head>','<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+adsenseClient+'" crossorigin="anonymous"></script></head>');
      }
      // Pinterest base tag: public pages only, once, gated by marketing consent.
      // Enhanced match is omitted: the site has no verified visitor email source.
      if(publicIndexable && parts[0]!=='admin' && !html.includes('CR_PINTEREST_INSTALLED')){
        html=html.replace('</head>','<!-- Pinterest Tag --><script>'+"(function(){\nif(window.CR_PINTEREST_INSTALLED)return;\nwindow.CR_PINTEREST_INSTALLED=true;\nvar started=false,consented=false,pageTracked=false;\nfunction pageVisit(){if(!pageTracked){pageTracked=true;window.pintrk('track','pagevisit');}}\nfunction apply(allowed){\n consented=allowed;\n if(!allowed){if(started&&window.pintrk)window.pintrk('setconsent',false);return;}\n if(started){window.pintrk('setconsent',true);pageVisit();return;}\n started=true;\n !function(e){if(!window.pintrk){window.pintrk=function(){window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var n=window.pintrk;n.queue=[],n.version=\"3.0\";var t=document.createElement(\"script\");t.async=true;t.src=e;var r=document.getElementsByTagName(\"script\")[0];r.parentNode.insertBefore(t,r)}}(\"https://s.pinimg.com/ct/core.js\");\n window.pintrk('load','2614009177229');\n window.pintrk('setconsent',true);\n window.pintrk('page');\n pageVisit();\n}\nfunction custom(p){if(window.CR_CMP_PROVIDER!=='google')apply(!!p&&p.marketing===true);}\ntry{custom(JSON.parse(localStorage.getItem('cosaregalo-consent-v2')||'null'));}catch(e){}\nwindow.addEventListener('cr:consentchange',function(e){custom(e.detail);});\n// A certified CMP may pass a Pinterest-specific consent decision through this bridge.\nwindow.addEventListener('cr:pinterest-consent',function(e){apply(!!e.detail&&e.detail.granted===true);});\ndocument.addEventListener('click',function(event){\n if(!consented||!started||event.defaultPrevented||event.button>0)return;\n var anchor=event.target&&event.target.closest?event.target.closest('a[href]'):null;\n if(!anchor)return;\n try{\n  var url=new URL(anchor.href,location.href);\n  if(url.protocol!=='https:'||!(url.hostname==='amazon.it'||url.hostname.endsWith('.amazon.it')||url.hostname==='amzn.to'))return;\n  // This custom event measures an outbound click, never an order or revenue.\n  window.pintrk('track','amazon_click');\n }catch(e){}\n});\n})();"+'</script><!-- end Pinterest Tag --></head>');
      }
      // Google Tag Manager: installed once for all public pages.
      // Consent Mode v2 defaults to denied; existing cookie preferences update it.
      if(parts[0]!=='admin' && !html.includes('GTM-WDH837GD')){
        const gtmHead='<script>'
          +'window.dataLayer=window.dataLayer||[];'
          +'function gtag(){dataLayer.push(arguments);}'
          +"gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});"
          +"gtag('js',new Date());"
          +'(function(){'
          +'function crConsent(p){if(!p)return;gtag("consent","update",{analytics_storage:p.statistics===true?"granted":"denied",ad_storage:p.marketing===true?"granted":"denied",ad_user_data:p.marketing===true?"granted":"denied",ad_personalization:p.marketing===true?"granted":"denied"});}'
          +'try{crConsent(JSON.parse(localStorage.getItem("cosaregalo-consent-v2")||"null"));}catch(e){}'
          +'window.addEventListener("cr:consentchange",function(e){crConsent(e.detail);});'
          +'})();'
          +'</script>'
          +'<script async src="https://www.googletagmanager.com/gtm.js?id=GTM-WDH837GD"></script>';
        const gtmBody='<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-WDH837GD" height="0" width="0" style="display:none;visibility:hidden" title="Google Tag Manager"></iframe></noscript>';
        html=html.replace('</head>',gtmHead+'</head>').replace(/<body([^>]*)>/i,'<body$1>'+gtmBody);
      }
      // Branded favicon is shared across all HTML routes, including nested guides.
      if(!html.includes('rel="icon"')){
        html=html.replace('</head>','<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg"/></head>');
      }
      // Search metadata on the verified production domain only, not staging.
      const route='/'+parts.join('/')+(parts.length?'/':'');
      if(publicIndexable&&indexPaths.includes(route)){
        const canonical=canonicalSite+route;
        const pageTitle=(html.match(/<title>([^<]*)<\/title>/i)||[])[1]||'CosaRegalo';
        const metaTag=(html.match(/<meta[^>]*name="description"[^>]*>/i)||[])[0]||'';
        const metaDescription=(metaTag.match(/content="([^"]*)"/)||[])[1]||'Guide e idee regalo CosaRegalo';
        const encode=v=>String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
        // Use only real, crawlable ancestor pages in breadcrumb markup.
        const crumbs=[{name:'Home',item:canonicalSite+'/'}];
        let path='';
        for(const part of parts){
          path+='/'+part;
          const crumbRoute=path+'/';
          if(!indexPaths.includes(crumbRoute))continue;
          const name=({
            'tipologie':'Categorie regalo','guide':'Guide agli acquisti','offerte':'Offerte Amazon',
            'confronti':'Confronti prodotti','occasioni':'Idee per occasione',
            'trova-regalo':'Trova un regalo','metodo':'Metodo editoriale',
            'privacy-policy':'Privacy policy','cookie-policy':'Cookie policy',
            'natale':'Regali di Natale','benessere':'Regali benessere',
            'sotto-30':'Regali sotto 30 euro','tech':'Regali tecnologici',
            'lettura':'Regali per chi ama leggere','cuffie':'Cuffie wireless',
            'cucina-poco-spazio':'Idee per chi ama cucinare',
            'scrivania-pratica':'Accessori da scrivania',
            'giochi-creativi-bambini':'Giochi creativi per bambini'
          })[part]||part.replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());
          crumbs.push({name,item:canonicalSite+crumbRoute});
        }
        const isArticle=/^\/guide\/[^/]+\/$/.test(route);
        const isCollection=route==='/guide/'||route==='/tipologie/'||
          /^\/tipologie\/[^/]+\/$/.test(route)||route==='/offerte/'||
          route==='/confronti/';
        // Public imagery from this site only; never claim an editorial image is an Amazon product photo.
        const foundImage=(html.match(/(?:bf-story-hero|article-hero|type-page-cover|hero-right)[\s\S]{0,4000}?<img\b[^>]*src="([^"]+)"/i)||[])[1]||'';
        let imageUrl=canonicalSite+'/assets/cover.webp';
        try{
          const candidate=new URL(foundImage,canonical);
          if(candidate.origin===canonicalSite&&/^\/assets\/[a-z0-9-]+\.(webp|png|jpg|jpeg)$/i.test(candidate.pathname))imageUrl=candidate.href;
        }catch{}
        const organizationId=canonicalSite+'/#organization',websiteId=canonicalSite+'/#website';
        const graph=[
          {'@type':'Organization','@id':organizationId,name:'CosaRegalo',url:canonicalSite+'/',
            logo:{'@type':'ImageObject',url:canonicalSite+'/assets/logo.webp'}},
          {'@type':'WebSite','@id':websiteId,url:canonicalSite+'/',name:'CosaRegalo',
            inLanguage:'it-IT',publisher:{'@id':organizationId}},
          {'@type':isCollection?'CollectionPage':'WebPage','@id':canonical+'#webpage',
            url:canonical,name:pageTitle,description:metaDescription,inLanguage:'it-IT',
            isPartOf:{'@id':websiteId},primaryImageOfPage:{'@type':'ImageObject',url:imageUrl}}
        ];
        if(crumbs.length>1){
          const crumbId=canonical+'#breadcrumb';
          graph.push({'@type':'BreadcrumbList','@id':crumbId,
            itemListElement:crumbs.map((b,i)=>({'@type':'ListItem',position:i+1,name:b.name,item:b.item}))});
          graph[2].breadcrumb={'@id':crumbId};
        }
        if(isArticle){
          const article={
            '@type':'BlogPosting','@id':canonical+'#article',headline:pageTitle,
            description:metaDescription,inLanguage:'it-IT',image:imageUrl,
            mainEntityOfPage:{'@id':canonical+'#webpage'},
            author:{'@type':'Organization',name:'Redazione CosaRegalo',url:canonicalSite+'/metodo/'},
            publisher:{'@id':organizationId},isAccessibleForFree:true
          };
          // Only publish dates supported by the original editorial feed; never invent dates.
          const dates={
            '/guide/cucina-poco-spazio/':'2026-11-07',
            '/guide/scrivania-pratica/':'2026-11-07',
            '/guide/giochi-creativi-bambini/':'2026-11-07'
          };
          if(dates[route])article.datePublished=dates[route];
          graph.push(article);
          graph[2].mainEntity={'@id':canonical+'#article'};
        }
        const json=JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c');
        const cards='<link rel="canonical" href="'+encode(canonical)+'"/>'
          +'<meta property="og:type" content="'+(isArticle?'article':'website')+'"/>'
          +'<meta property="og:locale" content="it_IT"/>'
          +'<meta property="og:site_name" content="CosaRegalo"/>'
          +'<meta property="og:title" content="'+encode(pageTitle)+'"/>'
          +'<meta property="og:description" content="'+encode(metaDescription)+'"/>'
          +'<meta property="og:url" content="'+encode(canonical)+'"/>'
          +'<meta property="og:image" content="'+encode(imageUrl)+'"/>'
          +'<meta name="twitter:card" content="summary_large_image"/>'
          +'<meta name="twitter:title" content="'+encode(pageTitle)+'"/>'
          +'<meta name="twitter:description" content="'+encode(metaDescription)+'"/>'
          +'<meta name="twitter:image" content="'+encode(imageUrl)+'"/>'
          +'<script type="application/ld+json">'+json+'</script>';
        html=html.replace('</head>',cards+'</head>');
      }
      // The configuration contains only public publisher IDs / banner URLs; never secrets.
      if(!html.includes('/assets/ads.js')){
        html=html.replace('</body>',
          '<script>window.CR_ADS_CONFIG='+publicAdsJson+';</script><script defer src="/assets/ads.js"></script></body>');
      }
      // Public Amazon Associates tracking tag (never an API credential).
      // Used only to turn article category searches into tagged Special Links.
      const associateTag=String(process.env.AMAZON_PARTNER_TAG||'').trim();
      if(/^[a-zA-Z0-9-]{5,60}$/.test(associateTag)){
        html=html.replace('</head>','<meta name="cr-amazon-tag" content="'+associateTag+'"/></head>');
      }
      // Link internally to the same clean trailing-slash URLs listed in the sitemap.
      // Keep external links, mailto, anchors and query strings untouched.
      html=html.replace(/href="([^"]*?)index\.html(\?[^"]*)?"/gi,(whole,before,query='')=>{
        if(/^(https?:|\/\/|mailto:|tel:|#)/i.test(before))return whole;
        if(!/^(?:\/|(?:\.\.\/|\.\/)*[a-z0-9/_-]*)$/i.test(before))return whole;
        return 'href="'+(before||'./')+query+'"';
      });
      if(html.includes('assets/style.css')&&!html.includes('rel="preconnect"')){
        html=html.replace('</head>','<link rel="preconnect" href="https://fonts.googleapis.com"/>'
          +'<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/></head>');
      }
      // HTML is revalidated; its CSS/JS references must point to the same deployment.
      // This prevents old cached styles from rendering newly generated menu markup.
      html=html.replace(/(\b(?:href|src)=")([^"]*?assets\/(?:style\.css|site\.js|admin\.js|analytics\.js|deals\.js|ads\.js|google-cmp\.js))"/g,
        (_match,attr,path)=>attr+path+'?v='+assetRevision+'"');
      bytes=Buffer.from(html,'utf8');
    }
    res.statusCode=200;
    res.setHeader('Content-Type',mime[extname(file).toLowerCase()]||'application/octet-stream');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control',parts[0]==='assets' ? (/\.(css|js|json)$/i.test(relative)?'no-cache, must-revalidate':'public, max-age=3600') : (publicIndexable?'no-cache, must-revalidate':'no-store'));
    if(req.method==='HEAD')res.end();else res.end(bytes);
  }catch{return reply(res,404,{error:'NOT_FOUND'});}
}
async function editorialState(){try{return (await readArticles()).items}catch{return {}}}
async function handleEditorial(req,res,pathname){
 if(!['GET','HEAD'].includes(req.method))return false;
 const slug=/^\/guide\/([a-z0-9-]+)\/?$/.exec(pathname)?.[1];
 if(slug){
  const articles=await editorialState(),article=articles[slug];
  if(article){
   if(article.status!=='published'){res.statusCode=404;res.end('Articolo non disponibile');return true;}
   const html=await renderArticle(article);
   res.statusCode=200;res.setHeader('Content-Type','text/html; charset=utf-8');
   res.setHeader('Cache-Control','no-store');if(req.method==='HEAD')res.end();else res.end(html);
   return true;
  }
 }
 if(pathname==='/assets/latest-news.json'){
  const state=await editorialState();
  if(!Object.keys(state).length)return false;
  const base=JSON.parse(await readFile(resolve(root,'assets/latest-news.json'),'utf8'));
  const bySlug=new Map(base.items.map(x=>[x.slug,x]));
  for(const a of Object.values(state)){
   if(a.status!=='published'){bySlug.delete(a.slug);continue;}
   bySlug.set(a.slug,{title:a.title,slug:a.slug,path:'guide/'+a.slug+'/index.html',category:a.category,summary:a.summary,image:'assets/cover.webp',date:a.publishedAt?.slice(0,10),status:'published'});
  }
  const result={version:base.version||1,items:[...bySlug.values()].sort((a,b)=>String(b.date||'').localeCompare(String(a.date||'')))};
  res.statusCode=200;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');if(req.method==='HEAD')res.end();else res.end(JSON.stringify(result));return true;
 }
 return false;
}
const server=http.createServer(async(req,res)=>{
  let url;
  try{url=new URL(req.url||'/', 'http://localhost');}catch{return reply(res,400,{error:'INVALID_URL'});}
  const pathname=url.pathname.replace(/\/$/,'')||'/';
  const host=String(req.headers.host||'').toLowerCase().replace(/:\d+$/,'');
  const publicIndexable=productionRequest(req);
  // Consolidate the preferred non-www domain only when the production canonical is configured.
  if(canonicalSite==='https://cosa-regalo.it'&&host==='www.cosa-regalo.it'&&['GET','HEAD'].includes(req.method)){
    res.writeHead(308,{Location:'https://cosa-regalo.it'+url.pathname+url.search});res.end();return;
  }
  // /index.html and /guide/index.html must resolve to one clean URL, on all hosts.
  if(['GET','HEAD'].includes(req.method)&&/\/index\.html$/i.test(url.pathname)){
    res.writeHead(308,{Location:(url.pathname.slice(0,-10)||'/')+url.search});res.end();return;
  }
  // Staging stays out of search indexes until the official domain is ready.
  if(!publicIndexable||pathname.startsWith('/admin')||pathname.startsWith('/calendario')||pathname.startsWith('/api/')||pathname==='/health'){
    res.setHeader('X-Robots-Tag','noindex, nofollow');
  }
  if(pathname==='/robots.txt'){
    return serveText(res,publicIndexable
      ?'User-agent: *\nDisallow: /admin/\nDisallow: /api/\nDisallow: /calendario/\nSitemap: '+canonicalSite+'/sitemap.xml\n'
      :'User-agent: *\nDisallow: /\n');
  }
  if(pathname==='/sitemap.xml'){
    if(!publicIndexable)return reply(res,404,{error:'SITEMAP_NOT_PUBLISHED'});
    const changes=await editorialState();
    const paths=new Set(indexPaths);
    for(const a of Object.values(changes)){const path='/guide/'+a.slug+'/';if(a.status==='published')paths.add(path);else paths.delete(path);}
    const locations=[...paths].map(p=>'  <url><loc>'+canonicalSite+p+'</loc></url>').join('\n');
    return serveText(res,'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+locations+'\n</urlset>\n','application/xml; charset=utf-8');
  }
  if(pathname==='/ads.txt'){
    const id=/^ca-pub-(\d{8,22})$/.exec(adsenseClient);
    if(!publicIndexable||process.env.ADS_MODE!=='adsense'||!id)return reply(res,404,{error:'ADS_TXT_NOT_CONFIGURED'});
    return serveText(res,'google.com, pub-'+id[1]+', DIRECT, f08c47fec0942fa0\n');
  }
  if(pathname==='/health')return reply(res,200,{ok:true,service:'cosaregalo',environment:process.env.NODE_ENV||'development',uiRelease:'css-debug-20261107',seoRelease:'seo-20261108',seoReady:publicIndexable,publicUrl:canonicalSite||null,assetRevision});
  if(handlers.has(pathname))return api(req,res,pathname,url.searchParams);
  if(await handleEditorial(req,res,url.pathname))return;
  if(pathname.startsWith('/api/'))return reply(res,404,{error:'UNKNOWN_API'});
  return staticFile(req,res,url.pathname);
});
server.listen(port,'0.0.0.0',()=>console.log('CosaRegalo listening on '+port));
