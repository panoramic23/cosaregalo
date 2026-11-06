/** Amazon Creators API product data (server-side only). Vercel Node function. */
import { catalog } from './catalog.mjs';
const MARKET='www.amazon.it';
const PARTNER=process.env.AMAZON_PARTNER_TAG || '230b7-21';
let cachedToken=null,tokenExpiry=0;
const cache=new Map();
const time=()=>Date.now();
async function getToken(){
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
 if(!data.access_token)throw new Error('AUTH_RESPONSE_INVALID');
 cachedToken=data.access_token;tokenExpiry=time()+1000*(Number(data.expires_in)||3600);
 return cachedToken;
}
function normalize(item){
 const listing=(item.offersV2?.listings||[]).find(l=>l?.isBuyBoxWinner) || item.offersV2?.listings?.[0];
 const money=listing?.price?.money;
 const img=item.images?.primary?.large?.url ||item.images?.primary?.medium?.url || null;
 const link=item.detailPageURL || null; // use original affiliate link as provided by API
 if(!item.asin || !link || !/^https:\/\/(www\.)?amazon\.it\//i.test(link))return null;
 return {asin:item.asin, title:item.itemInfo?.title?.displayValue ||'Prodotto Amazon',
  image:img,price:money?.displayAmount||null,
  availability:listing?.availability?.message ||null,
  url:link,observedAt:new Date().toISOString()};
}
export default async function handler(req,res){
 if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 const {type,group}=req.query||{};
 const spec=catalog?.[String(type)]?.[String(group)];
 if(!spec)return res.status(400).json({error:'UNKNOWN_SELECTION'});
 if(!process.env.AMAZON_CREATORS_CLIENT_ID||!process.env.AMAZON_CREATORS_CLIENT_SECRET)
  return res.status(503).json({error:'API_NOT_CONFIGURED',message:'Collegare le credenziali Amazon Creators API al server.'});
 const key=String(type)+':'+String(group),prev=cache.get(key);
 if(prev&&time()-prev.time<30*60*1000)return res.status(200).setHeader('Cache-Control','public, s-maxage=1800').json(prev.data);
 try{
  const token=await getToken();
  const version=process.env.AMAZON_CREATORS_VERSION||'3.2';
  const payload={marketplace:MARKET,partnerTag:PARTNER,keywords:spec.keywords,itemCount:spec.count,
   searchIndex:'All',resources:['images.primary.large','images.primary.medium','itemInfo.title','offersV2.listings.price','offersV2.listings.availability']};
  if(spec.maxPrice)payload.maxPrice=spec.maxPrice*100;
  const auth='Bearer '+token+(version.startsWith('2.')?', Version '+version:'');
  const response=await fetch('https://creatorsapi.amazon/catalog/v1/searchItems',{
   method:'POST',headers:{'Authorization':auth,'Content-Type':'application/json','x-marketplace':MARKET},
   body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});
  if(!response.ok){res.status(502).json({error:'AMAZON_API_ERROR',status:response.status});return;}
  const json=await response.json();
  const items=(json.searchResult?.items ||json.searchItemsResult?.items ||[]).map(normalize).filter(Boolean);
  const data={source:'amazon-creators-api',type,group,items,checkedAt:new Date().toISOString()};
  cache.set(key,{time:time(),data});
  return res.status(200).setHeader('Cache-Control','public, s-maxage=1800').json(data);
 }catch(err){
  const status=err.message==='API_NOT_CONFIGURED'?503:502;
  return res.status(status).json({error:'AMAZON_UNAVAILABLE',message:'Dati Amazon temporaneamente non disponibili.'});
 }
}
