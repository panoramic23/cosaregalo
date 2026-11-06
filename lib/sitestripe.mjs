import {readFile} from 'node:fs/promises';
import {catalog} from '../api/catalog.mjs';
import {configured,redis} from './store.mjs';
export const storageKey='cr:sitestripe:v1';
export function validateConfig(data,now=Date.now()){
 if(!data||!['sitestripe','api','editorial'].includes(data.mode)||!Array.isArray(data.links)||data.links.length>200)throw new Error('INVALID_CONFIG');
 const tag=process.env.AMAZON_PARTNER_TAG||'';
 const ids=new Set();
 const links=data.links.map(x=>{
  if(!x||!Object.hasOwn(catalog,x.type)||!Object.hasOwn(catalog[x.type],x.group))throw new Error('UNKNOWN_SELECTION');
  if(!['product','group'].includes(x.kind)||typeof x.title!=='string'||!x.title.trim()||x.title.length>160)throw new Error('INVALID_LINK');
  const asin=x.kind==='product'?String(x.asin||''):null;
  if(asin&&!/^[A-Z0-9]{10}$/.test(asin)||x.kind==='product'&&!asin)throw new Error('INVALID_ASIN');
  let u;try{u=new URL(x.url)}catch{throw new Error('INVALID_URL')}
  if(u.protocol!=='https:'||!['amazon.it','www.amazon.it'].includes(u.hostname)||u.username||u.password||u.port||u.hash||x.url.length>2048)throw new Error('INVALID_URL');
  if(!tag||u.searchParams.getAll('tag').length!==1||u.searchParams.get('tag')!==tag)throw new Error('PARTNER_TAG_MISMATCH');
  if(x.kind==='product'&&!new RegExp('^/(?:[^/]+/)?(?:dp|gp/product)/'+asin+'(?:/|$)').test(u.pathname))throw new Error('ASIN_URL_MISMATCH');
  if(x.kind==='group'&&(u.pathname!=='/s'||!u.searchParams.get('k')))throw new Error('GROUP_SEARCH_REQUIRED');
  const allowed=new Set(['tag','linkCode','linkId','camp','creative','creativeASIN','ref_','th','psc',...(x.kind==='group'?['k']:[])]);
  for(const key of u.searchParams.keys())if(!allowed.has(key))throw new Error('UNSUPPORTED_URL_PARAMETER');
  const verified=Date.parse(x.verifiedAt);
  if(x.verified!==true||x.source!=='sitestripe'||!Number.isFinite(verified)||verified>now||now-verified>90*86400000||typeof x.evidence!=='string'||x.evidence.trim().length<12||x.evidence.length>500)throw new Error('VERIFICATION_REQUIRED');
  const id=[x.type,x.group,x.kind,asin||''].join(':');if(ids.has(id))throw new Error('DUPLICATE_LINK');ids.add(id);
  return {type:x.type,group:x.group,kind:x.kind,asin,title:x.title.trim(),url:x.url,source:'sitestripe',verified:true,verifiedAt:new Date(verified).toISOString(),evidence:x.evidence.trim()};
 });return {mode:data.mode,links};
}
export async function readConfig(){
 try{
  const raw=configured()?await redis(['GET',storageKey]):null;
  const data=raw?JSON.parse(raw):JSON.parse(await readFile(new URL('../content/sitestripe.json',import.meta.url),'utf8'));
  // Validate individually: one expired link cannot hide other verified links.
  const mode=validateConfig({mode:data.mode,links:[]}).mode;
  const links=[];for(const link of data.links||[]){try{links.push(...validateConfig({mode,links:[link]}).links)}catch{}}
  return {mode,links};
 }catch{return {mode:'editorial',links:[]};}
}
export function selection(config,type,group){
 const links=config.links.filter(x=>x.type===type&&x.group===group);
 return {source:config.mode==='editorial'?'editorial':'sitestripe',mode:config.mode,type,group,items:config.mode==='editorial'?[]:links.filter(x=>x.kind==='product').map(({asin,title,url,verifiedAt})=>({asin,title,url,verifiedAt,source:'sitestripe',image:null,price:null,availability:null})),groupLink:config.mode==='editorial'?null:links.find(x=>x.kind==='group')?.url||null};
}
