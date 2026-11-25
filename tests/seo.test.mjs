import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import http from 'node:http';

const PORT=31996;
const request=(path,host='cosa-regalo.it')=>new Promise((resolve,reject)=>{
 const req=http.get({hostname:'127.0.0.1',port:PORT,path,headers:{Host:host},timeout:5000},res=>{
  const chunks=[];res.on('data',c=>chunks.push(c));res.on('end',()=>resolve({
   status:res.statusCode,headers:res.headers,body:Buffer.concat(chunks).toString('utf8')
  }));
 });req.on('error',reject);req.on('timeout',()=>req.destroy(new Error('timeout')));
});

test('Production SEO metadata, clean URLs and staging exclusion',async()=>{
 const articleData={
  slug:'regali-cms',title:'Idee regalo dal pannello',summary:'Una guida pubblicata con idee per chi ama viaggiare.',
  body:'Un testo editoriale che aiuta a scegliere un regalo per la prossima partenza.',
  category:'Viaggi',status:'published',asins:[],publishedAt:'2026-11-20T09:00:00Z',updatedAt:'2026-11-24T10:00:00Z'
 };
 const storage=http.createServer(async(req,res)=>{
  for await(const _chunk of req){}
  res.end(JSON.stringify({result:JSON.stringify({[articleData.slug]:articleData})}));
 });
 storage.listen(0,'127.0.0.1');
 await once(storage,'listening');
 const server=spawn(process.execPath,['server.mjs'],{
  cwd:new URL('..',import.meta.url),
  env:{...process.env,PORT:String(PORT),SITE_INDEXABLE:'true',
   SITE_PUBLIC_URL:'https://cosa-regalo.it',NODE_ENV:'test',STORAGE_BACKEND:'redis',
   KV_REST_API_URL:'http://127.0.0.1:'+storage.address().port,KV_REST_API_TOKEN:'fixture'},
  stdio:['ignore','pipe','pipe']
 });
 try{
  await Promise.race([
   once(server.stdout,'data'),
   once(server,'exit').then(()=>{throw Error('SEO test server exited')}),
   new Promise((_,reject)=>setTimeout(()=>reject(Error('startup timeout')),9000).unref())
  ]);
  const home=await request('/');
  assert.equal(home.status,200);
  assert.doesNotMatch(home.headers['x-robots-tag']||'',/noindex/);
  assert.match(home.body,/rel="canonical" href="https:\/\/cosa-regalo\.it\/"/);
  assert.match(home.body,/property="og:image" content="https:\/\/cosa-regalo\.it\/assets\//);
  assert.match(home.body,/<meta name="twitter:card" content="summary_large_image"/);
  assert.match(home.body,/"@type":"Organization"/);
  assert.match(home.body,/"@type":"WebSite"/);
  assert.equal((home.body.match(/class="footer-affiliate-disclosure"/g)||[]).length,1);
  assert.doesNotMatch(home.body,/href="guide\/index\.html"/);

  const article=await request('/guide/cucina-poco-spazio/');
  assert.equal(article.status,200);
  assert.match(article.body,/rel="canonical" href="https:\/\/cosa-regalo\.it\/guide\/cucina-poco-spazio\/"/);
  assert.match(article.body,/"@type":"BlogPosting"/);
  assert.match(article.body,/"datePublished":"2026-11-07"/);
  assert.match(article.body,/"@type":"BreadcrumbList"/);
  const dynamic=await request('/guide/regali-cms/');
  assert.equal(dynamic.status,200);
  assert.match(dynamic.body,/rel="canonical" href="https:\/\/cosa-regalo\.it\/guide\/regali-cms\/"/);
  assert.match(dynamic.body,/"dateModified":"2026-11-24T10:00:00Z"/);
  assert.match((await request('/guide/')).body,/data-server-rendered>[\s\S]*href="\/guide\/regali-cms\/"/);
  assert.equal((await request('/guide/regali-cms')).headers.location,'/guide/regali-cms/');
  assert.equal((await request('/guide/cuffie?utm_source=test')).headers.location,'/guide/cuffie/?utm_source=test');
  assert.match((await request('/trova-regalo/?q=cuffie')).headers['x-robots-tag'],/noindex, follow/);
  const category=await request('/tipologie/speaker-bluetooth/');
  assert.match(category.body,/"@type":"CollectionPage"/);

  const tmp=await request('/','micheleg58.sg-host.com');
  assert.match(tmp.headers['x-robots-tag']||'',/noindex/);
  assert.doesNotMatch(tmp.body,/rel="canonical"/);
  assert.match((await request('/robots.txt','micheleg58.sg-host.com')).body,/Disallow: \//);
  assert.equal((await request('/sitemap.xml','micheleg58.sg-host.com')).status,404);

  const sitemap=await request('/sitemap.xml');
  assert.equal(sitemap.status,200);
  assert.match(sitemap.body,/https:\/\/cosa-regalo\.it\/guide\/scrivania-pratica\//);
  assert.doesNotMatch(sitemap.body,/\/admin\//);
  assert.match(sitemap.body,/regali-cms\/<\/loc><lastmod>2026-11-24<\/lastmod>/);
  assert.match((await request('/robots.txt')).body,/Sitemap: https:\/\/cosa-regalo\.it\/sitemap\.xml/);
  assert.equal((await request('/index.html')).headers.location,'/');
  assert.equal((await request('/guide/tech/index.html')).headers.location,'/guide/tech/');
  assert.equal((await request('/','www.cosa-regalo.it')).headers.location,'https://cosa-regalo.it/');
  assert.equal((await request('/api/admin')).status,401);
  const health=JSON.parse((await request('/health')).body);
  assert.equal(health.seoReady,true);
  assert.equal(health.seoRelease,'seo-20261125');
 }finally{
  if(server.exitCode===null){server.kill();await once(server,'exit');}
  await new Promise(resolve=>storage.close(resolve));
 }
});
