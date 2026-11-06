export const MIN_DISCOUNT_PERCENT = 50;
export const GIFT_CATEGORIES = Object.freeze(['giochi','casa','benessere','sport','cucina','lettura','tech-fisico','hobby','moda-accessori','viaggio']);
const intangible = /(?:\b(?:ebook|e-book|kindle unlimited|audible|abbonament[oi]|subscription|licenz[ae]|software|app digitale|videogiochi? digital[ei]|download|gift\s?card|buon[oi] regalo|codic[ei] digital[ei]|cloud|streaming|voucher|ricaric[ah]|credito digitale|corso online|bigliett[oi] digital[ei])\b)/i;
export function isEligibleGift(d){
 const cat=String(d.category||'').trim().toLowerCase();
 const title=String(d.title||'').trim();
 return d.productType==='physical' && GIFT_CATEGORIES.includes(cat) && title.length>=5 && !intangible.test(title);
}
export function passesDeal(d){
 const price=Number(d.price),ref=Number(d.referencePrice),checked=Date.parse(d.checkedAt);
 return isEligibleGift(d)&&price>0&&ref>price&&Number.isFinite(checked)&&checked<=Date.now()&&Date.now()-checked<=86400000&&((ref-price)/ref)>=0.5&&ref-price>=15&&/^https:\/\/(www\.)?amazon\.it\//i.test(String(d.url||''))&&String(d.evidence||'').trim().length>=12;
}
