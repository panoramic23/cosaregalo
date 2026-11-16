/** Backend selection is explicit; incomplete MySQL configuration never falls back to Redis. */
export function storageBackend(){
 const selected=process.env.STORAGE_BACKEND;
 if(selected)return ['mysql','redis'].includes(selected)?selected:null;
 if(process.env.MYSQL_HOST||process.env.MYSQL_DATABASE||process.env.MYSQL_USER)return 'mysql';
 return process.env.KV_REST_API_URL&&process.env.KV_REST_API_TOKEN?'redis':null;
}
export const configured=()=>storageBackend()==='mysql'
 ?!!(process.env.MYSQL_HOST&&process.env.MYSQL_DATABASE&&process.env.MYSQL_USER&&process.env.MYSQL_PASSWORD)
 :storageBackend()==='redis'&&!!(process.env.KV_REST_API_URL&&process.env.KV_REST_API_TOKEN);
// Compatibility name for existing callers; commands are stored in MySQL when selected.
export async function redis(command){
 if(!configured())throw new Error('STORAGE_NOT_CONFIGURED');
 if(storageBackend()==='mysql')return (await import('./mysql-store.mjs')).mysqlCommand(command);
 const response=await fetch(process.env.KV_REST_API_URL.replace(/\/$/,''),{method:'POST',headers:{Authorization:`Bearer ${process.env.KV_REST_API_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify(command),signal:AbortSignal.timeout(7000)});
 if(!response.ok)throw new Error('STORAGE_HTTP_'+response.status);
 const obj=await response.json();if(obj.error)throw new Error('STORAGE_ERROR');return obj.result;
}
export function authenticated(req){const token=process.env.ADMIN_DASHBOARD_TOKEN;if(!token||token.length<24)return false;const header=req.headers.authorization||'';const supplied=header.startsWith('Bearer ')?header.slice(7):'';if(supplied.length!==token.length)return false;let mismatch=0;for(let i=0;i<token.length;i++)mismatch|=supplied.charCodeAt(i)^token.charCodeAt(i);return mismatch===0;}
export function respond(res,status,data){res.setHeader('Cache-Control','no-store');return res.status(status).json(data)}

