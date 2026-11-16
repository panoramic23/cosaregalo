import {randomUUID} from 'node:crypto';
import {configured,storageBackend,redis} from '../lib/store.mjs';
import {closeMysql} from '../lib/mysql-store.mjs';

const key='cr:storage-check:'+randomUUID();
let written=false;
try{
 if(!configured()||storageBackend()!=='mysql')throw Error('MYSQL_NOT_CONFIGURED');
 await redis(['SET',key,'ok']);written=true;
 if(await redis(['GET',key])!=='ok')throw Error('WRITE_READ_FAILED');
 await closeMysql();
 if(await redis(['GET',key])!=='ok')throw Error('PERSISTENCE_FAILED');
 console.log('MySQL: connessione, creazione tabella, scrittura e lettura dopo riconnessione verificate.');
}catch(error){
 console.error('Verifica MySQL fallita:',String(error.code||'STORAGE_CHECK_FAILED'));
 process.exitCode=1;
}finally{
 if(written)await redis(['DEL',key]).catch(()=>{process.exitCode=1;});
 await closeMysql();
}
