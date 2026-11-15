// An ASIN alone cannot prove that an editorial name describes the returned model.
const normalize=value=>String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'');
export function matchesEditorialProduct(expected,actual){
 if(!expected||!actual)return false;
 const model=expected.split(/\s+-\s+/)[0];
 const ignored=new Set(['per','con','una','uno','set','kit','casa','della','delle','digitale','regolabile','portatile']);
 const tokens=model.toLowerCase().split(/[^a-z0-9-]+/).filter(t=>(t.length>=2||/\d/.test(t))&&!ignored.has(t));
 const title=normalize(actual);
 return tokens.length>0&&tokens.every(token=>title.includes(normalize(token)));
}
