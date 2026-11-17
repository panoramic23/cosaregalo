# CosaRegalo — progetto attuale

Sito editoriale italiano per idee regalo, guide shopping e confronti, su **SiteGround Node.js**, dominio primario **https://cosa-regalo.it**. Repository: `panoramic23/cosaregalo`, ramo `main`. Runtime Node >=20, comando `npm start`. La versione del package è `6.1.0`; gli aggiornamenti grafici e editoriali sono successivi alla versione HTML originale. **Le guide storiche V5 e V6 non descrivono l'attuale sito.**

## Struttura attuale
- `index.html`, `guide/`, `tipologie/`, `esplora/`, `occasioni/`, `confronti/`, `trova-regalo/`, `offerte/`, `metodo/`: frontend statico servito da `server.mjs`
- `assets/style.css`: foglio di stile consolidato con sezioni legacy ancora necessarie e CSS editoriale v7. Baloo 2 peso 800 su H1/H2 e peso 600 su H3–H6
- `assets/site.js`: interazioni navigazione, carosello ultime guide e ricerca di prodotti Amazon nelle guide
- `assets/latest-news.json`: registro delle guide effettivamente pubblicate, distinto dal calendario interno
- `api/`, `lib/`, `content/`: API catalogo, SiteStripe, offerte, tracciamenti e dati editoriali
- `admin/`: pannello protetto da `ADMIN_DASHBOARD_TOKEN`, con persistenza MySQL SiteGround e adapter Redis legacy
- `tests/`: regressioni CSS, accessibilità strutturale HTML, SiteStripe e SEO

## Stato Amazon e affiliazione
Le **otto pagine di tipologia** contengono **48 link SiteStripe forniti dal titolare** (40 verso prodotti con ASIN, 8 verso risultati di ricerca Amazon.it), tracking ID `230b7-21`. Sono link inseriti **nell'HTML**; non sono automaticamente collegati al registro API Redis/JSON. Per revocarli o sostituirli si modifica la pagina sorgente e si ridistribuisce. **L'editor SiteStripe dell'admin controlla il catalogo API, non i 48 link HTML statici.** Vedi [SITESTRIPE.md](SITESTRIPE.md).

Le guide usano selezioni curate via GetItems e fallback editoriale. Le copertine sono illustrative; le foto nelle schede sono fotografie del modello soltanto quando restituite dall’API. Cucina conserva tre esempi con fonte produttore, separati dalla migrazione API.

La Creators API può non essere idonea. **Nessun prezzo, disponibilità, recensione, test o sconto va inventato.** Le super offerte richiedono verifiche prima della pubblicazione.

## Deploy e indicizzazione
Il collegamento GitHub automatico SiteGround risulta attivo dal 16 novembre: un commit può andare live. Verificare sempre il risultato del deployment e il sito; il solo SHA non prova la pubblicazione. Le variabili da controllare sul provider, senza inserire segreti nel repository, sono:

```ini
NODE_ENV=production
SITE_PUBLIC_URL=https://cosa-regalo.it
SITE_INDEXABLE=false
AMAZON_PARTNER_TAG=230b7-21
ADS_MODE=off
```

`SITE_INDEXABLE=false` è intenzionale **solo durante i controlli pre-lancio**. Quando HTTPS, homepage, guide, SiteStripe, privacy e cookie sono verificati sul dominio definitivo, impostare `SITE_INDEXABLE=true` e ridistribuire/riavviare; verificare `/health` (`seoReady:true`), `/robots.txt`, `/sitemap.xml` e i canonical nel sorgente HTML. Le richieste al vecchio dominio di staging restano `noindex`.

Per il checklist e il controllo del dominio: [GO_LIVE_COSAREGALO.md](GO_LIVE_COSAREGALO.md).

Per il test automatico eseguire `npm test` nel progetto Node >=20. I test creati nel repository non equivalgono a un collaudo live su SiteGround.

## Privacy e sicurezza
Le credenziali di Amazon, token di admin e Redis devono rimanere nelle variabili server. Non pubblicarle mai su GitHub. L'interfaccia admin e il calendario editoriale non devono essere indicizzati. Il banner cookie e le opzioni pubblicitarie richiedono verifica funzionale prima di attivare annunci.

## Documenti storici
`LEGGIMI_PRIMA.md` si riferisce a una versione V5 locale con hosting Vercel: **solo archivio, non usare per il deploy attuale**. `DEBUG_CSS_2026-11-07.md` documenta la migrazione e i problemi storici del CSS, non necessariamente lo stato di oggi.

## Migrazione schede Amazon - archivio del controllo del 15 novembre 2026

Lo stato di questa sezione è storico. Per lo stato corrente leggere il controllo del 17 novembre qui sotto.

- Le 8 guide con ASIN usano `/api/guide-products?slug=`; le 8 tipologie usano `/api/category-products?slug=`. Entrambi recuperano gli ASIN curati con GetItems, senza sostituirli con SearchItems. Cucina resta editoriale in attesa di ASIN pertinenti verificati.
- Le guide statiche e quelle CMS rimandano alle categorie interne quando mancano dati Amazon validi. I 48 URL SiteStripe originali nelle tipologie restano conservati.
- `content/sitestripe.json` parte in modalità `sitestripe`: non attiva accessi Amazon non confermati. Redis, se configurato, continua a prevalere sul file. Il POST protetto per `mode=api` verifica sia SearchItems con prodotti utilizzabili sia GetItems dell'ASIN diagnostico; non basta HTTP 200.
- Un `ok:true` del diagnostico prova soltanto l'operazione verificata. Non garantisce che tutti i modelli del catalogo siano acquistabili o che ogni risposta includa offerte, foto e varianti. Il pannello distingue credenziali presenti da accesso verificato.
- Le risposte normalizzate richiedono ASIN/link coerenti, marketplace Amazon.it e il tag configurato, conservando il link restituito da Amazon. Solo offerte EUR valide producono prezzi; le immagini devono avere un URL HTTPS Amazon autorizzato.
- Cache dei dati di prodotto di 30 minuti, con cancellazione in memoria e `expiresAt` inviato al browser. Il browser ripristina il fallback alla scadenza e controlla anche il ritorno su una scheda sospesa. Nessun download/cache dei file immagine Amazon. Budget sotto 30: prodotti visibili soltanto con un prezzo verificato entro il limite.
- `npm test`: 30 test superati nel runtime locale. Le risposte Amazon dei test sono fixture, non una verifica delle credenziali reali.
- Diagnostico live non confermato: il controllo esterno ha ricevuto HTTP 202 con captcha SiteGround e il token amministrativo non era disponibile. Modalità Redis, GetItems reale, fotografie/prezzi live e deployment restano da verificare nel progetto Node esistente.

## Stato verificato il 17 novembre 2026

- Persistenza corrente: MySQL SiteGround, `STORAGE_BACKEND=mysql`; variabili `MYSQL_*` esclusivamente sul server. Nessun Upstash da creare. Il modulo `lib/store.mjs` seleziona MySQL e non ripiega su Redis in caso di configurazione incompleta. I nomi legacy `redis()` indicano l'adapter di comandi, non il database effettivo.
- Il feed live contiene dieci guide: nove statiche e la guida CMS `regali-smart-working-poco-spazio`, pubblicata il 16 novembre. Il CMS MySQL integra `/assets/latest-news.json`, indice guide e sitemap. Il JSON statico da solo non rappresenta le pubblicazioni CMS; conservare il backup in `content/cms-backups/` senza creare duplicati. Nessuna data inventata per le guide storiche prive di data.
- Nove endpoint di guida hanno restituito `source=amazon-creators-api` con ASIN curati, foto, prezzi EUR e disponibilità. È evidenza operativa GetItems e modalità API effettiva nel percorso pubblico, non una verifica autonoma del diagnostico SearchItems o del rinnovo OAuth.
- Il pannello `/admin/` richiede il token e non è autenticato nell'ambiente di controllo. I diagnostici protetti `amazon-api-test` e `amazon-getitems-test`, la provenienza esatta della configurazione persistita e le metriche restano da leggere con accesso autorizzato. Non interpretare `catalogMode=sitestripe` come accesso Amazon.
- Cucina conserva tre esempi Joseph Joseph con foto del produttore e ricerche per modello; nessuna migrazione a nuovi ASIN attestata. Alcuni ASIN nelle altre guide non vengono restituiti: conservare i fallback senza dedurre che siano esauriti.
- I 48 URL SiteStripe originali restano invariati. Cache API di 30 minuti; foto, dati e collegamenti arricchiti tornano al fallback alla scadenza. Nessun salvataggio di immagini Amazon nel repository.
- La guida cuffie mostra cinque foto caricate e disclosure affiliata. La guida CMS mostra tre foto caricate e CTA con `sponsored nofollow noopener noreferrer`. Numeri gialli `#FFD43D`, etichette ripetute assenti; controllo desktop senza overflow. Non è un nuovo collaudo a tutte le larghezze mobili.
- Il dettaglio esatto del modello restituito dall'API viene mostrato anche come testo nella scheda, senza etichette tecniche: rende visibili colore, formato e variante quando presenti nel titolo Amazon. Rimane separato dalla descrizione redazionale e scade insieme agli altri dati API.
- `npm test`: 44 passati, 1 test SQL reale saltato perché manca un database di test. Le fixture non attestano un collegamento MySQL di produzione.
