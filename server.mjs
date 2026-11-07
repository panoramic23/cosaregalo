import http from 'node:http';
import {readFile, stat} from 'node:fs/promises';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';
import products from './api/products.mjs';
import deals from './api/deals.mjs';
import track from './api/track.mjs';
import admin from './api/admin.mjs';

const root=dirname(fileURLToPath(import.meta.url));
const port=Number(process.env.PORT||3000);
// Bump public asset URLs whenever the Node deployment restarts to avoid mixed HTML/CSS versions.
const assetRevision=Date.now().toString(36);
const handlers=new Map([['/api/products',products],['/api/deals',deals],['/api/track',track],['/api/admin',admin]]);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.csv':'text/csv; charset=utf-8'};
const blocked=new Set(['api','lib','content','node_modules','.git']);

const socialProfiles=[
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
  const url=safeSocialUrl(process.env[env]||'',domain);
  const image='<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+svg+'</svg>';
  return url?'<a class="cr-social-link" href="'+escapeAttr(url)+'" aria-label="'+label+'" target="_blank" rel="noopener noreferrer">'+image+'</a>':
   '<span class="cr-social-link is-inactive" role="img" aria-label="'+label+' (profilo da collegare)" title="'+label+' — profilo da collegare">'+image+'</span>';
 }).join('');
 return '<div class="cr-socials" aria-label="Seguici sui social"><span class="cr-social-label">Seguici</span>'+links+'</div>';
}
// The Google CMP is supplied/certified by Google's AdSense Privacy & Messaging.
// It must be published in the matching AdSense account before enabling this switch.
const googleCmpEnabled=process.env.CMP_PROVIDER==='google'
 && process.env.GOOGLE_CMP_PUBLISHED==='true'
 && /^ca-pub-\d{8,22}$/.test(process.env.ADSENSE_CLIENT||'');

const publicAds={
 cmpProvider:googleCmpEnabled?'google':'custom',
 mode:['adsense','cj'].includes(process.env.ADS_MODE)?process.env.ADS_MODE:'off',
 adsense:{
  client:/^ca-pub-\d{8,22}$/.test(process.env.ADSENSE_CLIENT||'')?process.env.ADSENSE_CLIENT:'',
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

const publicSiteUrl=String(process.env.SITE_PUBLIC_URL||'').trim().replace(/\/$/,'');
const canonicalSite=/^https:\/\/(?:www\.)?cosa-regalo\.it$/i.test(publicSiteUrl)?publicSiteUrl:'';
const indexable=process.env.SITE_INDEXABLE==='true' && !!canonicalSite;
const indexPaths=[
 '/', '/offerte/', '/confronti/', '/tipologie/', '/trova-regalo/', '/occasioni/', '/metodo/',
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
        const navLink=(label,path,symbol)=>'<a'+(active(path.replace(/\/index\.html$/,''))?' class="active"':'')+' href="'+prefix+path+'">'+icon(symbol)+'<span class="nav-label">'+label+'</span></a>';
        const nav=categoriesNav+exploreNav
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
      if(html.includes('class="footer-grid"')&&html.includes(disclosure)){
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
        const client=process.env.ADSENSE_CLIENT;
        const headTags='<script>window.CR_CMP_PROVIDER="google";window.googlefc=window.googlefc||{};window.googlefc.callbackQueue=window.googlefc.callbackQueue||[];</script>'
          +'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client='+encodeURIComponent(client)+'" crossorigin="anonymous"></script>'
          +'<script defer src="/assets/google-cmp.js"></script>';
        html=html.replace('</head>',headTags+'</head>');
      }
      // Search metadata on the verified production domain only, not staging.
      const route='/'+parts.join('/')+(parts.length?'/':'');
      if(indexable&&indexPaths.includes(route)){
        const canonical=canonicalSite+route;
        const pageTitle=(html.match(/<title>([^<]*)<\/title>/i)||[])[1]||'CosaRegalo';
        const metaTag=(html.match(/<meta[^>]*name="description"[^>]*>/i)||[])[0]||'';
        const metaDescription=(metaTag.match(/content="([^"]*)"/)||[])[1]||'Guide e idee regalo CosaRegalo';
        const encode=v=>String(v).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
        const crumbs=[{name:'Home',item:canonicalSite+'/'}];
        let path='';
        for(const part of parts){
          path+='/'+part;
          const name=({'tipologie':'Tipologie','guide':'Guide','offerte':'Super offerte','confronti':'Confronti','occasioni':'Occasioni','trova-regalo':'Trova un regalo','metodo':'Il nostro metodo'})[part]||part.replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());
          crumbs.push({name,item:canonicalSite+path+'/'});
        }
        const graph=[
          {'@type':'WebSite','@id':canonicalSite+'/#website',url:canonicalSite+'/',name:'CosaRegalo',inLanguage:'it-IT'},
          {'@type':'WebPage','@id':canonical+'#webpage',url:canonical,name:pageTitle,description:metaDescription,inLanguage:'it-IT',isPartOf:{'@id':canonicalSite+'/#website'}}
        ];
        if(crumbs.length>1)graph.push({'@type':'BreadcrumbList',itemListElement:crumbs.map((b,i)=>({'@type':'ListItem',position:i+1,name:b.name,item:b.item}))});
        const json=JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c');
        const cards='<link rel="canonical" href="'+encode(canonical)+'"/>'
          +'<meta property="og:type" content="website"/><meta property="og:locale" content="it_IT"/>'
          +'<meta property="og:site_name" content="CosaRegalo"/>'
          +'<meta property="og:title" content="'+encode(pageTitle)+'"/>'
          +'<meta property="og:description" content="'+encode(metaDescription)+'"/>'
          +'<meta property="og:url" content="'+encode(canonical)+'"/>'
          +'<meta name="twitter:card" content="summary"/>'
          +'<script type="application/ld+json">'+json+'</script>';
        html=html.replace('</head>',cards+'</head>');
      }
      // The configuration contains only public publisher IDs / banner URLs; never secrets.
      if(!html.includes('/assets/ads.js')){
        html=html.replace('</body>',
          '<script>window.CR_ADS_CONFIG='+publicAdsJson+';</script><script defer src="/assets/ads.js"></script></body>');
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
    res.setHeader('Cache-Control',parts[0]==='assets' ? (/\.(css|js|json)$/i.test(relative)?'no-cache, must-revalidate':'public, max-age=3600') : (indexable?'no-cache, must-revalidate':'no-store'));
    if(req.method==='HEAD')res.end();else res.end(bytes);
  }catch{return reply(res,404,{error:'NOT_FOUND'});}
}
const server=http.createServer(async(req,res)=>{
  let url;
  try{url=new URL(req.url||'/', 'http://localhost');}catch{return reply(res,400,{error:'INVALID_URL'});}
  const pathname=url.pathname.replace(/\/$/,'')||'/';
  // Staging stays out of search indexes until the official domain is ready.
  if(!indexable||pathname.startsWith('/admin')||pathname.startsWith('/calendario')){
    res.setHeader('X-Robots-Tag','noindex, nofollow');
  }
  if(pathname==='/robots.txt'){
    return serveText(res,indexable
      ?'User-agent: *\nDisallow: /admin/\nDisallow: /api/\nDisallow: /calendario/\nSitemap: '+canonicalSite+'/sitemap.xml\n'
      :'User-agent: *\nDisallow: /\n');
  }
  if(pathname==='/sitemap.xml'){
    if(!indexable)return reply(res,404,{error:'SITEMAP_NOT_PUBLISHED'});
    const locations=indexPaths.map(p=>'  <url><loc>'+canonicalSite+p+'</loc></url>').join('\n');
    return serveText(res,'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+locations+'\n</urlset>\n','application/xml; charset=utf-8');
  }
  if(pathname==='/ads.txt'){
    const id=/^ca-pub-(\d{8,22})$/.exec(process.env.ADSENSE_CLIENT||'');
    if(!indexable||process.env.ADS_MODE!=='adsense'||!id)return reply(res,404,{error:'ADS_TXT_NOT_CONFIGURED'});
    return serveText(res,'google.com, pub-'+id[1]+', DIRECT, f08c47fec0942fa0\n');
  }
  if(pathname==='/health')return reply(res,200,{ok:true,service:'cosaregalo',environment:process.env.NODE_ENV||'development',uiRelease:'css-debug-20261107',assetRevision});
  if(handlers.has(pathname))return api(req,res,pathname,url.searchParams);
  if(pathname.startsWith('/api/'))return reply(res,404,{error:'UNKNOWN_API'});
  return staticFile(req,res,url.pathname);
});
server.listen(port,'0.0.0.0',()=>console.log('CosaRegalo listening on '+port));
