import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {storageBackend,configured} from '../lib/store.mjs';
import {mysqlCommand,closeMysql} from '../lib/mysql-store.mjs';

test('storage selection rejects partial MySQL config instead of falling back',()=>{
 const names=['STORAGE_BACKEND','MYSQL_HOST','MYSQL_DATABASE','MYSQL_USER','MYSQL_PASSWORD','KV_REST_API_URL','KV_REST_API_TOKEN'];
 const saved=Object.fromEntries(names.map(k=>[k,process.env[k]]));
 try{
  names.forEach(k=>delete process.env[k]);
  assert.equal(configured(),false);
  process.env.KV_REST_API_URL='https://example.invalid';process.env.KV_REST_API_TOKEN='test';
  assert.equal(storageBackend(),'redis');assert.equal(configured(),true);
  process.env.STORAGE_BACKEND='mysql';assert.equal(configured(),false);
  process.env.MYSQL_HOST='localhost';process.env.MYSQL_DATABASE='test';process.env.MYSQL_USER='test';process.env.MYSQL_PASSWORD='test';
  assert.equal(storageBackend(),'mysql');assert.equal(configured(),true);
  process.env.STORAGE_BACKEND='invalid';assert.equal(configured(),false);
 }finally{for(const k of names){if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}}
});

test('MySQL command validation fails before opening a database connection',async()=>{
 for(const command of [['FLUSHALL','x'],['GET','x','extra'],['SET','x','1','NX'],['SET','x','1','NX','EX',0],['HINCRBY','x','y','bad'],['GET','x'.repeat(256)]]){
  await assert.rejects(mysqlCommand(command),/STORAGE_BAD_COMMAND/);
 }
});

// Run only against a dedicated disposable test database, never the production schema.
test('MySQL persistence, atomic increments, hashes, locks and rollback', {skip:!process.env.TEST_MYSQL_DATABASE},async()=>{
 const previous=process.env.MYSQL_DATABASE;
 process.env.MYSQL_DATABASE=process.env.TEST_MYSQL_DATABASE;
 const root='test:'+randomUUID(),keys=['value','hash','count','lock'].map(k=>root+':'+k);
 const [value,hash,count,lock]=keys;
 try{
  assert.equal(await mysqlCommand(['GET',value]),null);
  assert.equal(await mysqlCommand(['SET',value,JSON.stringify({title:'Caffè 🎁'})]),'OK');
  await closeMysql();
  assert.equal(JSON.parse(await mysqlCommand(['GET',value])).title,'Caffè 🎁');
  await Promise.all(Array.from({length:20},()=>mysqlCommand(['INCR',count])));
  assert.equal(await mysqlCommand(['GET',count]),'20');
  assert.equal(await mysqlCommand(['HSET',hash,"O'Reilly",'foto']),1);
  assert.equal(await mysqlCommand(['HSET',hash,'__proto__','safe']),1);
  assert.equal(await mysqlCommand(['HSET',hash,'Titolo','A']),1);
  assert.equal(await mysqlCommand(['HSET',hash,'titolo','B']),1);
  await Promise.all(Array.from({length:20},()=>mysqlCommand(['HINCRBY',hash,'click',1])));
  const fields=Object.fromEntries(chunks(await mysqlCommand(['HGETALL',hash])));
  assert.equal(fields.click,'20');assert.equal(fields.Titolo,'A');assert.equal(fields.titolo,'B');
  assert.equal(fields.__proto__,'safe');
  assert.equal(await mysqlCommand(['HDEL',hash,"O'Reilly"]),1);
  await assert.rejects(mysqlCommand(['INCR',hash]),/STORAGE_INVALID_INTEGER/);
  assert.equal((await mysqlCommand(['HGETALL',hash])).length,8);
  const acquired=await Promise.all(Array.from({length:5},()=>mysqlCommand(['SET',lock,'1','NX','EX',10])));
  assert.equal(acquired.filter(x=>x==='OK').length,1);
  await mysqlCommand(['DEL',lock]);
  assert.equal(await mysqlCommand(['SET',lock,'2','NX','EX',10]),'OK');
 }finally{
  for(const key of keys)await mysqlCommand(['DEL',key]);
  await closeMysql();
  if(previous===undefined)delete process.env.MYSQL_DATABASE;else process.env.MYSQL_DATABASE=previous;
 }
});
function chunks(values){return Array.from({length:values.length/2},(_,i)=>values.slice(i*2,i*2+2));}
