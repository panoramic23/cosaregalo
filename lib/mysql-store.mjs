import mysql from 'mysql2/promise';

export const schema=`CREATE TABLE IF NOT EXISTS cr_store (
 storage_key VARBINARY(255) NOT NULL PRIMARY KEY,
 value_json LONGTEXT NOT NULL,
 expires_at BIGINT UNSIGNED NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`;

let pool, ready;
async function database(){
 if(!pool){
  const port=Number(process.env.MYSQL_PORT||3306);
  if(!Number.isInteger(port)||port<1||port>65535)throw Error('STORAGE_INVALID_PORT');
  pool=mysql.createPool({host:process.env.MYSQL_HOST,port,user:process.env.MYSQL_USER,
   password:process.env.MYSQL_PASSWORD,database:process.env.MYSQL_DATABASE,
   charset:'utf8mb4',connectionLimit:5,queueLimit:50,waitForConnections:true,
   connectTimeout:7000,multipleStatements:false,
   ...(process.env.MYSQL_SSL==='true'?{ssl:{rejectUnauthorized:true}}:{})});
 }
 if(!ready)ready=pool.execute(schema).catch(error=>{ready=null;throw error;});
 await ready;return pool;
}

function validate(command){
 if(!Array.isArray(command))throw Error('STORAGE_BAD_COMMAND');
 const [op,key,...args]=command;
 if(!['GET','SET','DEL','INCR','HGETALL','HSET','HDEL','HINCRBY'].includes(op)||typeof key!=='string'||!key||Buffer.byteLength(key)>255)throw Error('STORAGE_BAD_COMMAND');
 const counts={GET:0,DEL:0,INCR:0,HGETALL:0,HSET:2,HDEL:1,HINCRBY:2};
 if(op!=='SET'&&args.length!==counts[op])throw Error('STORAGE_BAD_COMMAND');
 if(op==='SET'&&!(args.length===1||(args.length===4&&args[1]==='NX'&&args[2]==='EX'&&Number.isInteger(Number(args[3]))&&Number(args[3])>0)))throw Error('STORAGE_BAD_COMMAND');
 if(['HSET','HDEL','HINCRBY'].includes(op)&&(typeof args[0]!=='string'||!args[0]))throw Error('STORAGE_BAD_COMMAND');
 if(op==='HINCRBY'&&!Number.isSafeInteger(Number(args[1])))throw Error('STORAGE_BAD_COMMAND');
 return command;
}

// Every mutation locks the key's InnoDB row, including a previously absent key.
// JSON preserves Redis string values and hash fields, including Unicode and case.
export async function mysqlCommand(command){
 const [op,key,...args]=validate(command);
 const db=await database();
 if(op==='GET'||op==='HGETALL'){
  const [rows]=await db.execute('SELECT value_json, expires_at FROM cr_store WHERE storage_key=?',[key]);
  return readValue(op,rows[0]);
 }
 const connection=await db.getConnection();
 try{
  await connection.beginTransaction();
  await connection.execute("INSERT INTO cr_store (storage_key,value_json) VALUES (?, 'null') ON DUPLICATE KEY UPDATE storage_key=storage_key",[key]);
  const [rows]=await connection.execute('SELECT value_json, expires_at FROM cr_store WHERE storage_key=? FOR UPDATE',[key]);
  const row=rows[0];
  const expired=row.expires_at!==null&&Number(row.expires_at)<=Date.now();
  let value=expired?null:JSON.parse(row.value_json);
  let expiry=null,result;
  if(op==='SET'){
   if(args[1]==='NX'&&value!==null){await connection.commit();return null;}
   value=String(args[0]);expiry=args[1]==='NX'?Date.now()+Number(args[3])*1000:null;result='OK';
  }else if(op==='DEL'){
   await connection.execute('DELETE FROM cr_store WHERE storage_key=?',[key]);
   await connection.commit();return value===null?0:1;
  }else if(op==='INCR'){
   result=integer(value===null?'0':value)+1;
   if(!Number.isSafeInteger(result))throw Error('STORAGE_INVALID_INTEGER');
   value=String(result);expiry=expired?null:row.expires_at;
  }else{
   if(value!==null&&(typeof value!=='object'||Array.isArray(value)))throw Error('STORAGE_WRONG_TYPE');
   value=Object.assign(Object.create(null),value||{});
   const field=args[0],exists=Object.hasOwn(value,field);
   if(op==='HSET'){result=exists?0:1;value[field]=String(args[1]);}
   if(op==='HDEL'){result=exists?1:0;delete value[field];}
   if(op==='HINCRBY'){
    result=integer(exists?value[field]:'0')+Number(args[1]);
    if(!Number.isSafeInteger(result))throw Error('STORAGE_INVALID_INTEGER');
    value[field]=String(result);
   }
   expiry=expired?null:row.expires_at;
  }
  if(typeof value==='object'&&value!==null&&Object.keys(value).length===0){
   await connection.execute('DELETE FROM cr_store WHERE storage_key=?',[key]);
  }else{
   await connection.execute('UPDATE cr_store SET value_json=?, expires_at=? WHERE storage_key=?',[JSON.stringify(value),expiry,key]);
  }
  await connection.commit();return result;
 }catch(error){await connection.rollback().catch(()=>{});throw error;}
 finally{connection.release();}
}
function integer(value){
 if(typeof value!=='string'||! /^-?\d+$/.test(value)||!Number.isSafeInteger(Number(value)))throw Error('STORAGE_INVALID_INTEGER');
 return Number(value);
}
function readValue(op,row){
 const value=!row||(row.expires_at!==null&&Number(row.expires_at)<=Date.now())?null:JSON.parse(row.value_json);
 if(op==='GET'){
  if(value!==null&&typeof value!=='string')throw Error('STORAGE_WRONG_TYPE');
  return value;
 }
 if(value!==null&&(typeof value!=='object'||Array.isArray(value)))throw Error('STORAGE_WRONG_TYPE');
 return Object.entries(value||{}).flat();
}
export async function closeMysql(){if(pool)await pool.end();pool=null;ready=null;}
