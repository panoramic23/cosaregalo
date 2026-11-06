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
const handlers=new Map([['/api/products',products],['/api/deals',deals],['/api/track',track],['/api/admin',admin]]);
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.ico':'image/x-icon','.txt':'text/plain; charset=utf-8','.xml':'application/xml; charset=utf-8','.csv':'text/csv; charset=utf-8'};
const blocked=new Set(['api','lib','content','node_modules','.git']);
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
  res.setHeader('Access-Control-Allow-Origin','same-origin');
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
  // Serve only public document routes and public assets, not operational files.
  if(parts.length&&parts[0]==='assets'){
    if(parts.length<2)return reply(res,404,{error:'NOT_FOUND'});
  }else if(parts.length&&(!parts.every(part=>/^[a-z0-9_-]+(?:\.[a-z0-9]+)?$/i.test(part))||parts.some(part=>part.includes('.')))){
    return reply(res,404,{error:'NOT_FOUND'});
  }
  const relative=parts[0]==='assets'?parts.join('/'):parts.concat('index.html').join('/');
  const file=resolve(root,relative||'index.html');
  if(!file.startsWith(root+sep))return reply(res,403,{error:'FORBIDDEN'});
  try{
    const info=await stat(file);
    if(!info.isFile())return reply(res,404,{error:'NOT_FOUND'});
    const bytes=await readFile(file);
    res.statusCode=200;
    res.setHeader('Content-Type',mime[extname(file).toLowerCase()]||'application/octet-stream');
    res.setHeader('X-Content-Type-Options','nosniff');
    res.setHeader('Cache-Control',parts[0]==='assets'?'public, max-age=3600':'no-cache');
    if(req.method==='HEAD')res.end();else res.end(bytes);
  }catch{return reply(res,404,{error:'NOT_FOUND'});}
}
const server=http.createServer(async(req,res)=>{
  let url;
  try{url=new URL(req.url||'/', 'http://localhost');}catch{return reply(res,400,{error:'INVALID_URL'});}
  const pathname=url.pathname.replace(/\/$/,'')||'/';
  if(pathname==='/health')return reply(res,200,{ok:true,service:'cosaregalo',environment:process.env.NODE_ENV||'development'});
  if(handlers.has(pathname))return api(req,res,pathname,url.searchParams);
  if(pathname.startsWith('/api/'))return reply(res,404,{error:'UNKNOWN_API'});
  return staticFile(req,res,url.pathname);
});
server.listen(port,'0.0.0.0',()=>console.log('CosaRegalo listening on '+port));
