import {readConfig,validateConfig,storageKey} from '../lib/sitestripe.mjs';
import {testCreatorsAccess} from './products.mjs';
import {passesDeal, GIFT_CATEGORIES} from '../lib/deals-policy.mjs';
import {calendar,settings} from '../lib/editorial.mjs';
import {readArticles,saveArticle} from '../lib/article-cms.mjs';
import {redis,configured,authenticated,respond} from '../lib/store.mjs';
function rows(a){const x=[];for(let i=0;i<(a||[]).length;i+=2)x.push({name:a[i],count:Number(a[i+1])||0});return x.sort((a,b)=>b.count-a.count).slice(0,20)}
export default async function handler(req,res){if(!authenticated(req))return respond(res,401,{error:'UNAUTHORIZED'});if(!['GET','POST'].includes(req.method))return respond(res,405,{error:'METHOD_NOT_ALLOWED'});
const mode=String(req.query?.mode||'dashboard');
try{
 if(req.method==='GET'){
  if(mode==='amazon-api-test')return respond(res,200,{test:await testCreatorsAccess(),catalogMode:(await readConfig()).mode});
  if(mode==='sitestripe')return respond(res,200,{config:await readConfig(),writable:configured()});
  if(mode==='articles') {const data=await readArticles();return respond(res,200,{articles:Object.values(data.items).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt))),writable:data.writable});}
  let views=[],clicks=[],productViews=[],affiliate=null;
  if(configured()){const [v,c,pv,a]=await Promise.all([redis(['HGETALL','cr:views']),redis(['HGETALL','cr:clicks']),redis(['HGETALL','cr:product-views']),redis(['GET','cr:amazon-report'])]);views=rows(v);clicks=rows(c);productViews=rows(pv);if(a){try{affiliate=JSON.parse(a)}catch{}}}
  return respond(res,200,{status:{site:'static-export',analytics:configured()?'connected':'not-configured',amazonCreatorsApi:!!(process.env.AMAZON_CREATORS_CLIENT_ID&&process.env.AMAZON_CREATORS_CLIENT_SECRET),affiliateReport:affiliate?'imported':'not-imported',offerEngine:configured()?'manual-verified':'not-configured'},editorial:calendar,editorialSettings:settings,views,clicks,productViews,affiliate});
 }
 if(!configured())return respond(res,503,{error:'STORAGE_NOT_CONFIGURED'});
 if(mode==='article-save') {try {const article=await saveArticle(req.body);return respond(res,200,{ok:true,article});}catch(e){const code=e.message==='EDITORIAL_CONFLICT_REFRESH'?409:e.message==='EDITORIAL_BUSY_RETRY'?423:400;return respond(res,code,{error:e.message});}}

 if(mode==='sitestripe'){
  let config;try{config=validateConfig(req.body)}catch(e){return respond(res,400,{error:e.message});}
  await redis(['SET',storageKey,JSON.stringify(config)]);
  return respond(res,200,{ok:true,config});
 }
 if(mode==='amazon-report'){
  const data=req.body||{};const obj={period:String(data.period||'').slice(0,100),clicks:Number(data.clicks)||0,orderedItems:Number(data.orderedItems)||0,shippedItems:Number(data.shippedItems)||0,earnings:Number(data.earnings)||0,currency:'EUR',source:'Amazon Associates — inserimento manuale',updatedAt:new Date().toISOString()};
  if([obj.clicks,obj.orderedItems,obj.shippedItems,obj.earnings].some(v=>!Number.isFinite(v)||v<0))return respond(res,400,{error:'INVALID_REPORT'});
  await redis(['SET','cr:amazon-report',JSON.stringify(obj)]);return respond(res,200,{ok:true,affiliate:obj});
 }
 if(mode==='deal'){
  if((await readConfig()).mode!=='api')return respond(res,409,{error:'DEALS_DISABLED_IN_SITESTRIPE_MODE'});
  const data=req.body||{};
  const title=String(data.title||'').trim().slice(0,130),url=String(data.url||''),image=String(data.image||'').trim(),price=Number(data.price),referencePrice=Number(data.referencePrice),checkedAt=String(data.checkedAt||new Date().toISOString());
  const category=String(data.category||'').trim().toLowerCase(),productType='physical';
  const discountPercent=Math.round((1-price/referencePrice)*100);
  if(!title||!/^https:\/\/(www\.)?amazon\.it\//i.test(url)||!(price>0&&referencePrice>price)||discountPercent<50||referencePrice-price<15||!Number.isFinite(Date.parse(checkedAt))||Math.abs(Date.now()-Date.parse(checkedAt))>86400000)return respond(res,400,{error:'DEAL_FAILED_VALIDATION',message:'Sconto reale minimo del 50%, risparmio minimo 15 €, rilevazione entro 24 ore e storico verificato.'});
  const evidence=String(data.evidence||'').trim().slice(0,300);if(evidence.length<12)return respond(res,400,{error:'EVIDENCE_REQUIRED'});
  const deal={title,url,image,price,referencePrice,checkedAt,discountPercent,evidence,category,productType};if(!passesDeal(deal))return respond(res,400,{error:'PRODUCT_NOT_ELIGIBLE',message:'Ammessi solo prodotti fisici e pertinenti alle idee regalo, nelle categorie selezionate; esclusi software, download, gift card, abbonamenti e contenuti digitali.'});await redis(['HSET','cr:deals',title.toLowerCase(),JSON.stringify(deal)]);return respond(res,200,{ok:true,deal});
 }
 if(mode==='remove-deal'){const title=String(req.body?.title||'').toLowerCase();if(!title)return respond(res,400,{error:'TITLE_REQUIRED'});await redis(['HDEL','cr:deals',title]);return respond(res,200,{ok:true});}
 return respond(res,400,{error:'UNKNOWN_MODE'});
}catch(e){return respond(res,503,{error:'ADMIN_BACKEND_UNAVAILABLE',detail:String(e.message).slice(0,120)});}}

