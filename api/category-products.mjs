import {categoryEditorial} from '../lib/category-editorial.mjs';
import {readConfig} from '../lib/sitestripe.mjs';
import {getCreatorsToken,normalizeCreatorItem,amazonFreshness,AMAZON_CACHE_TTL_MS,cacheAmazonResult} from './products.mjs';

const market='www.amazon.it';
const cache=new Map();
export default async function categoryProducts(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).json({error:'METHOD_NOT_ALLOWED'});
 const slug=String(req.query?.slug||'');
 const selected=Object.hasOwn(categoryEditorial,slug)?categoryEditorial[slug]:null;
 if(!selected)return res.status(404).json({error:'CATEGORY_NOT_FOUND'});
 if((await readConfig()).mode!=='api')return res.status(200).json({source:'editorial',items:[],reason:'API_MODE_DISABLED'});
 const partnerTag=process.env.AMAZON_PARTNER_TAG;
 if(!partnerTag||!process.env.AMAZON_CREATORS_CLIENT_ID||!process.env.AMAZON_CREATORS_CLIENT_SECRET)
  return res.status(200).json({source:'editorial',items:[],reason:'API_NOT_CONFIGURED'});
 const previous=cache.get(slug);
 if(previous&&Date.now()-previous.time<AMAZON_CACHE_TTL_MS)return res.status(200).json(previous.data);
 try{
  const token=await getCreatorsToken();
  const version=process.env.AMAZON_CREATORS_VERSION||'3.2';
  const asinList=Object.keys(selected),results=[];
  const headers={Authorization:'Bearer '+token+(version.startsWith('2.')?', Version '+version:''),'Content-Type':'application/json','x-marketplace':market};
  for(let i=0;i<asinList.length;i+=10){
   const response=await fetch('https://creatorsapi.amazon/catalog/v1/getItems',{
    method:'POST',headers,signal:AbortSignal.timeout(15000),
    body:JSON.stringify({marketplace:market,partnerTag,itemIds:asinList.slice(i,i+10),itemIdType:'ASIN',
     resources:['images.primary.large','images.primary.medium','itemInfo.title','itemInfo.features',
      'offersV2.listings.price','offersV2.listings.availability']})
   });
   if(!response.ok)return res.status(200).json({source:'editorial',items:[],reason:'GET_ITEMS_UNAVAILABLE'});
   const body=await response.json();
   for(const item of body.itemResults?.items||[]){
    const product=normalizeCreatorItem(item);
    if(product&&Object.hasOwn(selected,product.asin))results.push({...product,shortTitle:selected[product.asin].title});
   }
  }
  const map=new Map(results.map(product=>[product.asin,product]));
  const items=asinList.filter(asin=>map.has(asin)).map(asin=>map.get(asin));
  if(!items.length)return res.status(200).json({source:'editorial',items:[],reason:'NO_USABLE_ITEMS'});
  const data={source:'amazon-creators-api',slug,items,...amazonFreshness()};
  cacheAmazonResult(cache,slug,data);
  return res.status(200).json(data);
 }catch{return res.status(200).json({source:'editorial',items:[],reason:'AMAZON_UNAVAILABLE'});}
}
