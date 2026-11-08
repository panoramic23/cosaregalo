# CosaRegalo — pubblicazione su cosa-regalo.it

Data piano: 8 novembre 2026. Progetto Node.js esistente: `micheleg58.sg-host.com`.
Repository: `panoramic23/cosaregalo`, branch `main`.

## Prima del cambio dominio

- [ ] Verificare che l'ultimo deploy GitHub sia presente e funzionante sul dominio temporaneo.
- [ ] Verificare `/health`, homepage, guide, tipologie, link SiteStripe, sidebar, navigazione mobile, pagina contatti/privacy/cookie.
- [ ] Nel pannello SiteGround verificare se `cosa-regalo.it` è già assegnato a un **sito distinto**. Nelle statistiche GoGeek del 7 novembre risultava un sito `cosa-regalo.it` separato (~41 inode). Prima di liberare il dominio verificare File Manager, email, DNS, SSL e backup. **Non eliminare il sito o i contenuti a scatola chiusa.**
- [ ] Verificare in SiteGround che il progetto Node.js esistente sia quello collegato a GitHub e non un vecchio ZIP. Non creare un secondo progetto: consumerebbe risorse e inode.
- [ ] Salvare uno snapshot/backup dell'attuale progetto e annotare la configurazione delle variabili di ambiente, senza mettere i segreti su GitHub.

## Cambiare dominio senza duplicare il progetto

1. Aprire SiteGround **Area Cliente → Siti web → Progetti Node.js**.
2. Sul progetto Node.js `micheleg58.sg-host.com`, menu **Azioni → Cambia dominio**.
3. Scegliere **Dominio esistente**, digitare `cosa-regalo.it`, confermare.
4. Se appare **Dominio già utilizzato**, fermarsi: il dominio potrebbe appartenere a un sito SiteGround separato o a un alias/parcheggio. Liberarlo solo dopo averne controllato i contenuti, la posta e aver ottenuto la conferma del titolare.
5. Se il dominio è registrato/gestito su SiteGround, verificare che venga associato automaticamente. Se usa DNS esterni, seguire le indicazioni dei nameserver mostrate da SiteGround; **non** inserire IP, record A o CNAME inventati.
6. In **Site Tools → Sicurezza → Gestione SSL**, attendere il certificato per `cosa-regalo.it` e verificare HTTPS ed eventuale redirect HTTP → HTTPS.
7. Verificare `www.cosa-regalo.it`: deve reindirizzare alla versione canonica `https://cosa-regalo.it/` senza contenuti duplicati.

Guida SiteGround: https://it.siteground.com/kb/cambiare-dominio-progetto-node-js

## Variabili ambiente sul progetto Node.js

Impostare/verificare in Site Tools → Node.js → Opzioni di Deployment → Variabili d'ambiente:

```ini
NODE_ENV=production
SITE_PUBLIC_URL=https://cosa-regalo.it
SITE_INDEXABLE=false
AMAZON_PARTNER_TAG=230b7-21
ADS_MODE=off
```

`SITE_INDEXABLE=false` deve rimanere impostato durante il cambio dominio. **Solo dopo il controllo del sito reale** passare a `SITE_INDEXABLE=true` e far applicare la configurazione/nuovo deploy.

Conservare i valori esistenti (se presenti) di `ADMIN_DASHBOARD_TOKEN`, credenziali Amazon e `KV_REST_API_URL`/`KV_REST_API_TOKEN`; non cancellarli né condividerli. La Creators API può rimanere non abilitata: i link SiteStripe già inseriti nelle schede non richiedono prodotti Amazon inventati. `ADS_MODE=off` va mantenuto finché consenso, policy e Ads non sono configurati e verificati.

## Collaudo dopo il cambio

- [ ] `https://cosa-regalo.it/health`: `ok:true`; conferma che la nuova applicazione risponde.
- [ ] Homepage, carosello ultime guide, menu e layout responsive corretti.
- [ ] `/guide/cucina-poco-spazio/`, `/guide/tech/`, `/tipologie/speaker-bluetooth/` funzionanti con sidebar e pulsanti.
- [ ] Clic SiteStripe su un campione di schede: tag `230b7-21`, destinazione corretta, nessun prezzo inventato.
- [ ] `/api/admin` senza token → 401; non visualizzare mai le chiavi di amministrazione.
- [ ] Informativa privacy, cookie banner e preferenze funzionanti.
- [ ] `www` → non-www e HTTP → HTTPS senza loop.
- [ ] Solo quando tutte le verifiche sono superate: `SITE_INDEXABLE=true`, riavviare/aggiornare deployment.
- [ ] `https://cosa-regalo.it/robots.txt`: deve indicare sitemap e non bloccare l'intero sito.
- [ ] `https://cosa-regalo.it/sitemap.xml`: deve essere accessibile e contenere URL sul dominio canonico.
- [ ] Pagine pubbliche con `<link rel="canonical" href="https://cosa-regalo.it/...">`.
- [ ] Registrare proprietà su Google Search Console e inviare la sitemap dopo il lancio.

## Importante

Questa è la procedura di pubblicazione, **non un'attestazione di pubblicazione completata**. Il cambio del dominio e l'eventuale liberazione del sito segnaposto richiedono accesso al pannello SiteGround e autorizzazione dell'utente. Non eliminare database, posta o il vecchio sito senza verifiche.

## Rollback

Se il progetto non risponde dopo il cambio, **non eliminare il progetto esistente**. Verificare prima SSL, DNS, impostazioni del dominio, log Node.js e variabili d'ambiente. Usare la build funzionante precedente conservata in SiteGround, o ripristinare la configurazione del dominio dal pannello.
