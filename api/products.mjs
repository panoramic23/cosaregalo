/** Amazon Creators API product data (server-side only). SiteGround Node runtime. */
import { catalog } from './catalog.mjs';
import {readConfig,selection} from '../lib/sitestripe.mjs';
import {matchesEditorialProduct} from '../lib/product-identity.mjs';
const MARKET='www.amazon.it';

let cachedToken=null,tokenExpiry=0;
const cache=new Map();
const time=()=>Date.now();
export const AMAZON_CACHE_TTL_MS=30*60*1000;
export function amazonFreshness(now=Date.now()){return {checkedAt:new Date(now).toISOString(),expiresAt:new Date(now+AMAZON_CACHE_TTL_MS).toISOString()};}
export function cacheAmazonResult(store,key,data){
 const entry={time:Date.now(),data};store.set(key,entry);
 setTimeout(()=>{if(store.get(key)===entry)store.delete(key);},AMAZON_CACHE_TTL_MS).unref?.();
}
export async function getCreatorsToken(){
 if(cachedToken && time()<tokenExpiry-60000) return cachedToken;
 const client_id=process.env.AMAZON_CREATORS_CLIENT_ID;
 const client_secret=process.env.AMAZON_CREATORS_CLIENT_SECRET;
 const version=process.env.AMAZON_CREATORS_VERSION || '3.2';
 if(!client_id||!client_secret) throw new Error('API_NOT_CONFIGURED');
 let url,headers,body;
 if(version.startsWith('2.')){
  url='https://creatorsapi.auth.eu-south-2.amazoncognito.com/oauth2/token';
  headers={'content-type':'application/x-www-form-urlencoded'};
  body=new URLSearchParams({grant_type:'client_credentials',client_id,client_secret,scope:'creatorsapi/default'}).toString();
 }else{
  url='https://api.amazon.co.uk/auth/o2/token';
  headers={'content-type':'application/json'};
  body=JSON.stringify({grant_type:'client_credentials',client_id,client_secret,scope:'creatorsapi::default'});
 }
 const response=await fetch(url,{method:'POST',headers,body,signal:AbortSignal.timeout(12000)});
 if(!response.ok) throw new Error('AUTH_FAILED_'+response.status);
 const data=await response.json();
 if(typeof data.access_token!=='string'||!data.access_token.trim())throw new Error('AUTH_RESPONSE_INVALID');
 cachedToken=data.access_token;tokenExpiry=time()+1000*(Number(data.expires_in)||3600);
 return cachedToken;
}
export function normalizeCreatorItem(item){
 if(!item||typeof item!=='object'||!/^[A-Z0-9]{10}$/.test(item.asin))return null;
 const listing=(item.offersV2?.listings||[]).find(l=>l?.isBuyBoxWinner) || item.offersV2?.listings?.[0];
 const money=listing?.price?.money;
 const img=item.images?.primary?.large?.url ||item.images?.primary?.medium?.url || null;
 const link=item.detailPageURL || null; // preserve the exact affiliate URL returned by Amazon
 let u;try{u=new URL(link)}catch{return null;}
 const tag=process.env.AMAZON_PARTNER_TAG;
 const title=item.itemInfo?.title?.displayValue;
 if(!tag||u.protocol!=='https:'||!['amazon.it','www.amazon.it'].includes(u.hostname)||u.username||u.password||u.port||u.hash||u.searchParams.getAll('tag').length!==1||u.searchParams.get('tag')!==tag||!new RegExp('^/(?:[^/]+/)?(?:dp|gp/product)/'+item.asin+'(?:/|$)').test(u.pathname)||typeof title!=='string'||!title.trim())return null;
 let image=null;try{const url=new URL(img);if(url.protocol==='https:'&&!url.username&&!url.password&&!url.port&&/(^|\.)(media-amazon\.com|images-amazon\.com|ssl-images-amazon\.com)$/.test(url.hostname))image=img;}catch{}
 const hasMoney=money?.currency==='EUR'&&typeof money.amount==='number'&&Number.isFinite(money.amount)&&money.amount>0;

 return {asin:item.asin, title:title.trim(),
  image,price:hasMoney&&typeof money.displayAmount==='string'?money.displayAmount:null,priceAmount:hasMoney?money.amount:null,
  availability:typeof listing?.availability?.message==='string'?listing.availability.message:null,
  features:Array.isArray(item.itemInfo?.features?.displayValues)?item.itemInfo.features.displayValues.filter(v=>typeof v==='string'&&v.trim()).slice(0,3).map(v=>v.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim().slice(0,250)):[],
  url:link,observedAt:new Date().toISOString()};
}
// Admin-only diagnostic, invoked by /api/admin?mode=amazon-api-test.
// Never reveal remote response bodies, bearer tokens or credentials.
export async function testCreatorsAccess(){
 const requestedAt=new Date().toISOString();
 if(!process.env.AMAZON_CREATORS_CLIENT_ID||!process.env.AMAZON_CREATORS_CLIENT_SECRET||!process.env.AMAZON_PARTNER_TAG)
  return {ok:false,status:0,reason:'API_NOT_CONFIGURED',requestedAt};
 let token;
 try{token=await getCreatorsToken();}
 catch(err){const e=String(err?.message||'');return {ok:false,status:0,reason:/^AUTH_FAILED_\d+$/.test(e)?'AUTH_FAILED':'AUTH_UNAVAILABLE',requestedAt};}
 const spec=catalog['speaker-bluetooth']?.portatili;
 if(!spec)return {ok:false,status:0,reason:'CATALOG_NOT_CONFIGURED',requestedAt};
 const version=process.env.AMAZON_CREATORS_VERSION||'3.2';
 const payload={marketplace:MARKET,partnerTag:process.env.AMAZON_PARTNER_TAG,
  keywords:spec.keywords,itemCount:1,searchIndex:'All',resources:['itemInfo.title']};
 const reasons=new Set(['AssociateNotEligible','AuthorizationFailed','InvalidAssociate','InvalidPartnerTag','FieldValidationFailed','UnauthorizedException','TokenExpired','InvalidToken','InvalidIssuer','UnsupportedClient','InvalidClient','MissingCredential']);
 try{
  const response=await fetch('https://creatorsapi.amazon/catalog/v1/searchItems',{
   method:'POST',headers:{Authorization:'Bearer '+token+(version.startsWith('2.')?', Version '+version:''),'Content-Type':'application/json','x-marketplace':MARKET},
   body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
  if(response.ok){
   let data;try{data=await response.json()}catch{return {ok:false,status:response.status,reason:'INVALID_API_RESPONSE',tokenObtained:true,searchItemsAuthorized:false,requestedAt};}
   const rows=data.searchResult?.items||data.searchItemsResult?.items;
   const items=Array.isArray(rows)?rows.map(normalizeCreatorItem).filter(Boolean):[];
   return {ok:items.length>0,status:response.status,reason:items.length?'AUTHORIZED':'NO_USABLE_ITEMS',tokenObtained:true,searchItemsAuthorized:items.length>0,itemCount:items.length,requestedAt};
  }
  let error={};try{error=await response.json()}catch{}
  return {ok:false,tokenObtained:true,searchItemsAuthorized:false,status:response.status,reason:reasons.has(error?.reason)?error.reason:'REMOTE_REJECTED',requestedAt};
 }catch{return {ok:false,status:0,reason:'NETWORK_UNAVAILABLE',requestedAt};}
}

/** Protected read-only diagnostic for the exact-ASIN endpoint used by editorial guides. */
export async function testCreatorsGetItems(){
 const checkedAt=new Date().toISOString();
 if(!process.env.AMAZON_PARTNER_TAG||!process.env.AMAZON_CREATORS_CLIENT_ID||!process.env.AMAZON_CREATORS_CLIENT_SECRET)
  return {ok:false,reason:'API_NOT_CONFIGURED',checkedAt};
 try{
  const token=await getCreatorsToken(),version=process.env.AMAZON_CREATORS_VERSION||'3.2';
  const asin='B0BTJ9WHL9';
  const resp=await fetch('https://creatorsapi.amazon/catalog/v1/getItems',{
   method:'POST',signal:AbortSignal.timeout(15000),
   headers:{Authorization:'Bearer '+token+(version.startsWith('2.')?', Version '+version:''),'Content-Type':'application/json','x-marketplace':MARKET},
   body:JSON.stringify({marketplace:MARKET,partnerTag:process.env.AMAZON_PARTNER_TAG,itemIds:[asin],itemIdType:'ASIN',
    resources:['images.primary.large','images.primary.medium','itemInfo.title','itemInfo.features','offersV2.listings.price','offersV2.listings.availability']})
  });
  if(!resp.ok)return {ok:false,status:resp.status,reason:'GET_ITEMS_REJECTED',checkedAt};
  const json=await resp.json();
  const item=(json.itemResults?.items||[]).find(x=>x.asin===asin);
  const normalized=item?normalizeCreatorItem(item):null;
  if(!normalized)return {ok:false,status:200,reason:'ITEM_NOT_AVAILABLE',checkedAt};
  if(!matchesEditorialProduct('Sony WH-CH520',normalized.title))return {ok:false,status:200,reason:'ITEM_MODEL_MISMATCH',checkedAt};
  return {ok:true,status:200,reason:'GET_ITEMS_AUTHORIZED',checkedAt,asin,
   hasOfficialImage:!!normalized.image,hasPrice:!!normalized.price,hasAvailability:!!normalized.availability};
 }catch{return {ok:false,reason:'GET_ITEMS_UNAVAILABLE',checkedAt};}
}

export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 const {type,group}=req.query||{};
 const spec=Object.hasOwn(catalog,String(type))&&Object.hasOwn(catalog[String(type)],String(group))?catalog[String(type)][String(group)]:null;
 if(!spec)return res.status(400).json({error:'UNKNOWN_SELECTION'});
 const PARTNER=process.env.AMAZON_PARTNER_TAG;
 const config=await readConfig();
 res.setHeader('Cache-Control','no-store');
 if(config.mode!=='api')return res.status(200).json(selection(config,type,group));
 if(!PARTNER||!process.env.AMAZON_CREATORS_CLIENT_ID||!process.env.AMAZON_CREATORS_CLIENT_SECRET)
  return res.status(200).json({...selection({...config,mode:'sitestripe'},type,group),fallback:true,reason:'API_NOT_CONFIGURED'});
 const key=String(type)+':'+String(group),prev=cache.get(key);
 if(prev&&time()-prev.time<AMAZON_CACHE_TTL_MS)return res.status(200).setHeader('Cache-Control','no-store').json(prev.data);
 try{
  const token=await getCreatorsToken();
  const version=process.env.AMAZON_CREATORS_VERSION||'3.2';
  const payload={marketplace:MARKET,partnerTag:PARTNER,keywords:spec.keywords,itemCount:spec.count,
   searchIndex:'All',resources:['images.primary.large','images.primary.medium','itemInfo.title','itemInfo.features','offersV2.listings.price','offersV2.listings.availability']};
  if(spec.maxPrice)payload.maxPrice=spec.maxPrice*100;
  const auth='Bearer '+token+(version.startsWith('2.')?', Version '+version:'');
  const response=await fetch('https://creatorsapi.amazon/catalog/v1/searchItems',{
   method:'POST',headers:{'Authorization':auth,'Content-Type':'application/json','x-marketplace':MARKET},
   body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
  if(!response.ok){
   // Amazon returns a machine-readable 'reason' for denied requests.
   // Expose only documented, whitelisted reason codes. Never expose tokens,
   // credentials, request headers, or unfiltered remote error messages.
   let detail={};
   try{detail=await response.json();}catch{}
   const allowedReasons=new Set([
    'AssociateNotEligible','AuthorizationFailed','InvalidAssociate',
    'InvalidPartnerTag','FieldValidationFailed','UnauthorizedException',
    'TokenExpired','InvalidToken','InvalidIssuer','UnsupportedClient',
    'InvalidClient','MissingCredential','Other'
   ]);
   const reason=typeof detail?.reason==='string'&&allowedReasons.has(detail.reason)?detail.reason:'NotProvided';
   const safeType=new Set(['AccessDeniedException','ValidationException','UnauthorizedException','ThrottleException']);
   const amazonType=safeType.has(detail?.type)?detail.type:'NotProvided';
   console.warn('Amazon Creators API rejected request',response.status,amazonType,reason);
   return res.status(200).json({...selection({...config,mode:'sitestripe'},type,group),fallback:true,reason});
  }
  const json=await response.json();
  const items=(json.searchResult?.items ||json.searchItemsResult?.items ||[]).map(normalizeCreatorItem).filter(Boolean);
  const data={source:'amazon-creators-api',type,group,items,...amazonFreshness()};
  cacheAmazonResult(cache,key,data);
  return res.status(200).setHeader('Cache-Control','no-store').json(data);
 }catch(err){
  const status=err.message==='API_NOT_CONFIGURED'?503:502;
  return res.status(200).json({...selection({...config,mode:'sitestripe'},type,group),fallback:true,reason:'AMAZON_UNAVAILABLE'});
 }
}


