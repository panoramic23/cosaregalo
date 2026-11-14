import {guideCatalog} from '../lib/guide-catalog.mjs';
import {readConfig} from '../lib/sitestripe.mjs';
import {readArticles} from '../lib/article-cms.mjs';
import {getCreatorsToken, normalizeCreatorItem} from './products.mjs';

const marketplace='www.amazon.it';
const responseCache=new Map();
export default async function guideProducts(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 const slug=String(req.query?.slug||'');
 let curated=Object.hasOwn(guideCatalog,slug)?guideCatalog[slug]:null;
 try{const entry=(await readArticles()).items[slug];if(entry?.status==='published'&&entry.asins?.length)curated=entry.asins.map(asin=>({asin,title:'',note:''}));}catch{}
 if(!curated)return res.status(404).json({error:'UNKNOWN_GUIDE'});
 if((await readConfig()).mode!=='api')return res.status(200).json({source:'editorial',items:[],reason:'API_MODE_DISABLED'});
 const selected=curated;
 const key=slug;
 const cached=responseCache.get(key);
 if(cached&&Date.now()-cached.time<30*60*1000)return res.status(200).json(cached.data);
 try{
  const token=await getCreatorsToken();
  const partnerTag=process.env.AMAZON_PARTNER_TAG;
  if(!partnerTag)return res.status(200).json({source:'editorial',items:[],reason:'API_NOT_CONFIGURED'});
  const version=process.env.AMAZON_CREATORS_VERSION||'3.2';
  const headers={'Authorization':'Bearer '+token+(version.startsWith('2.')?', Version '+version:''),'Content-Type':'application/json','x-marketplace':marketplace};
  const requested=selected.map(s=>s.asin);
  const results=[];
  for(let i=0;i<requested.length;i+=10){
   const response=await fetch('https://creatorsapi.amazon/catalog/v1/getItems',{
    method:'POST',headers,signal:AbortSignal.timeout(15000),
    body:JSON.stringify({marketplace,partnerTag,itemIds:requested.slice(i,i+10),itemIdType:'ASIN',
     resources:['images.primary.large','images.primary.medium','itemInfo.title','offersV2.listings.price','offersV2.listings.availability']})
   });
   if(!response.ok)return res.status(200).json({source:'editorial',items:[],reason:'AMAZON_API_UNAVAILABLE'});
   const json=await response.json();
   for(const item of (json.itemResults?.items||[])){
    const normalized=normalizeCreatorItem(item);
    if(normalized&&requested.includes(normalized.asin))results.push(normalized);
   }
  }
  const map=new Map(results.map(p=>[p.asin,p]));
  const items=selected.flatMap((s,index)=>{
   const product=map.get(s.asin);
   if(!product)return [];
   // A guide about gifts under 30 euros must not display products without confirmed matching prices.
   if(slug==='sotto-30'){
    const money=product.priceAmount;
    if(typeof money!=='number'||money>30)return [];
   }
   return [{...product,position:index+1,editorialNote:s.note}];
  });
  const data={source:'amazon-creators-api',slug,items,checkedAt:new Date().toISOString()};
  responseCache.set(key,{time:Date.now(),data});
  return res.status(200).json(data);
 }catch{return res.status(200).json({source:'editorial',items:[],reason:'AMAZON_UNAVAILABLE'});}
}
