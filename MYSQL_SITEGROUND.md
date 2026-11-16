# Database MySQL - CosaRegalo

Il gestionale supporta MySQL tramite mysql2. Articoli, report, offerte, configurazione catalogo e contatori vengono conservati nella tabella `cr_store` (InnoDB). I contenuti HTML e JSON del repository rimangono invariati. La tabella viene creata automaticamente alla prima operazione riuscita; non si ricrea né si svuota ai deployment.

## Configurazione SiteGround

1. Aprire Site Tools del progetto Node CosaRegalo, Sito > MySQL.
2. Creare un database dedicato, un utente e associarlo al solo database CosaRegalo con i permessi per creare tabelle, leggere, inserire, aggiornare e cancellare righe.
3. In Node.js > Opzioni di Deployment, aggiungere le variabili server:

```ini
STORAGE_BACKEND=mysql
MYSQL_HOST=host_indicato_da_siteground
MYSQL_PORT=3306
MYSQL_DATABASE=nome_database
MYSQL_USER=nome_utente
MYSQL_PASSWORD=password_database
```

Usare host e porta forniti per il progetto Node; non presumere che siano localhost. Se il collegamento richiede TLS, aggiungere `MYSQL_SSL=true`: la verifica del certificato rimane attiva. Non aprire MySQL a tutti gli IP; se serve accesso remoto, autorizzare soltanto l'origine dell'app indicata da SiteGround.

Le credenziali vanno nelle variabili del server, mai nei file pubblici o su GitHub. Il token amministratore esistente resta invariato. I nomi KV_REST_API_* non sono necessari con STORAGE_BACKEND=mysql.

4. Distribuire il commit con la nuova dipendenza mysql2 e riavviare l'app.
5. Con le variabili disponibili nel terminale del progetto, eseguire `npm run storage:check`. Lo script crea una chiave temporanea, la rilegge dopo riconnessione e la elimina; non stampa credenziali.
6. Aprire /admin/, creare una bozza di prova, ricaricare il pannello e verificare che rimanga presente; ripetere dopo un riavvio del progetto. Archiviare la bozza al termine.

## Dati esistenti e rollback

In assenza di un archivio Redis configurato, non c'è un database Redis da migrare. Le guide statiche e la configurazione catalogo già nel repository continuano a essere usate come prima. Un database MySQL vuoto non contiene automaticamente vecchi contatori o bozze: se esiste invece un Redis con dati reali, esportarli e migrarli prima di cambiare backend. Non abilitare due backend contemporaneamente per scrivere gli stessi dati.

MySQL ha priorità quando è selezionato esplicitamente. Una configurazione incompleta o un errore di collegamento non causano scritture silenziose su Redis. Per il rollback rimuovere la selezione MySQL solo dopo avere valutato eventuali nuovi salvataggi; la tabella MySQL rimane intatta. Il vecchio adapter Redis è mantenuto per compatibilità.

## Verifiche

`npm test` include selezione del backend e validazione dei comandi. Per il collaudo SQL reale usare un database separato con le stesse variabili MYSQL_* e `TEST_MYSQL_DATABASE=nome_database_test npm test`: verifica riconnessione, incremento concorrente, campi Unicode, distinzione maiuscole/minuscole, lock esclusivo e rollback. Questo test viene saltato se manca TEST_MYSQL_DATABASE. Non usare il database di produzione per i test.
