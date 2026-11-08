import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';

const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');

test('CSS: only white navigation sticks; old menu offset is removed',async()=>{
 const css=await read('assets/style.css');
 assert.match(css,/\.announcement,\.top-header\{\s*position:relative!important/);
 assert.match(css,/\.nav-bar\{\s*position:sticky!important;\s*top:0!important/);
 assert.doesNotMatch(css,/top:\s*177px/);
 assert.match(css,/\.nav-menu\.open\{display:flex!important\}/);
});

test('CSS: Baloo 2 ExtraBold is H1-H2 only, H3-H6 are semibold',async()=>{
 const css=await read('assets/style.css');
 assert.match(css,/--title:'Baloo 2'/);
 assert.match(css,/h1,h2\{font-weight:800\}/);
 assert.match(css,/h3,h4,h5,h6\{font-family:var\(--title\);font-weight:600!important/);
 assert.match(css,/h3,h4,h5,h6\{[^}]*-webkit-text-stroke:0!important/);
 assert.doesNotMatch(css,/\.nav-categories-toggle span\{font-size:19px/);
});

test('CSS: first-level menu labels are uniform on desktop and mobile',async()=>{
 const css=await read('assets/style.css');
 assert.match(css,/\.nav-menu>a,\s*\.nav-menu>\.nav-categories>\.nav-categories-toggle\{[\s\S]*?font-size:14px!important;[\s\S]*?font-weight:700!important/);
 assert.match(css,/\.nav-menu \.nav-label\{[\s\S]*?font-size:14px!important;[\s\S]*?font-weight:700!important/);
 assert.match(css,/\.nav-menu \.nav-label\{font-size:15px!important\}/);
});

test('Node: versioned assets, no stale CSS/JS cache, current release tag',async()=>{
 const server=spawn(process.execPath,['server.mjs'],{
  cwd:new URL('..',import.meta.url),
  env:{...process.env,PORT:'31998',SITE_INDEXABLE:'false',SITE_PUBLIC_URL:'https://cosa-regalo.it'},stdio:['ignore','pipe','pipe']
 });
 try{
  await Promise.race([
   once(server.stdout,'data'),
   once(server,'exit').then(()=>{throw Error('server exited')}),
   new Promise((_,reject)=>setTimeout(()=>reject(Error('startup timeout')),7000).unref())
  ]);
  const base='http://127.0.0.1:31998';
  const health=await (await fetch(base+'/health')).json();
  assert.equal(health.uiRelease,'css-debug-20261107');
  assert.ok(health.assetRevision);
  const r=await fetch(base+'/');
  assert.match(r.headers.get('cache-control')||'',/no-store|no-cache/);
  const html=await r.text();
  assert.match(html,/assets\/style\.css\?v=[a-z0-9]+/);
  assert.match(html,/assets\/site\.js\?v=[a-z0-9]+/);
  assert.match(html,/aria-label="Navigazione principale"/);
  const css=await fetch(base+'/assets/style.css?v='+health.assetRevision);
  assert.match(css.headers.get('cache-control')||'',/no-cache/);
  assert.match(await css.text(),/h3,h4,h5,h6/);
  const js=await fetch(base+'/assets/site.js?v='+health.assetRevision);
  assert.match(js.headers.get('cache-control')||'',/no-cache/);
  assert.match((await (await fetch(base+'/guide/tech/')).text()),/assets\/style\.css\?v=[a-z0-9]+/);
 }finally{
  if(server.exitCode===null){server.kill();await once(server,'exit');}
 }
});
