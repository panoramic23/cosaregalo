# CosaRegalo — progetto attuale

Sito editoriale italiano per idee regalo, guide shopping e confronti, su **SiteGround Node.js**, dominio primario **https://cosa-regalo.it**. Repository: `panoramic23/cosaregalo`, ramo `main`. Runtime Node >=20, comando `npm start`. La versione del package è `6.1.0`; gli aggiornamenti grafici e editoriali sono successivi alla versione HTML originale. **Le guide storiche V5 e V6 non descrivono l'attuale sito.**

## Struttura attuale
- `index.html`, `guide/`, `tipologie/`, `esplora/`, `occasioni/`, `confronti/`, `trova-regalo/`, `offerte/`, `metodo/`: frontend statico servito da `server.mjs`
- `assets/style.css`: foglio di stile consolidato con sezioni legacy ancora necessarie e CSS editoriale v7. Baloo 2 peso 800 su H1/H2 e peso 600 su H3–H6
- `assets/site.js`: interazioni navigazione, carosello ultime guide e ricerca di prodotti Amazon nelle guide
- `assets/latest-news.json`: registro delle guide effettivamente pubblicate, distinto dal calendario interno
- `api/`, `lib/`, `content/`: API catalogo, SiteStripe, offerte, tracciamenti e dati editoriali
- `admin/`: pannello protetto da `ADMIN_DASHBOARD_TOKEN`, con alcune funzioni che richiedono Redis REST
- `tests/`: regressioni CSS, accessibilità strutturale HTML, SiteStripe e SEO

## Stato Amazon e affiliazione
Le **otto pagine di tipologia** contengono **48 link SiteStripe forniti dal titolare** (40 verso prodotti con ASIN, 8 verso risultati di ricerca Amazon.it), tracking ID `230b7-21`. Sono link inseriti **nell'HTML**; non sono automaticamente collegati al registro API Redis/JSON. Per revocarli o sostituirli si modifica la pagina sorgente e si ridistribuisce. **L'editor SiteStripe dell'admin controlla il catalogo API, non i 48 link HTML statici.** Vedi [SITESTRIPE.md](SITESTRIPE.md).

Le nove guide editoriali contengono consigli collegati a categorie o ricerche Amazon: diventano link di ricerca affiliati quando `AMAZON_PARTNER_TAG` è presente nell'ambiente server; le immagini restano illustrative e non devono essere presentate come fotografie ufficiali dei prodotti.

La Creators API può non essere idonea. **Nessun prezzo, disponibilità, recensione, test o sconto va inventato.** Le super offerte richiedono verifiche prima della pubblicazione.

## Deploy e indicizzazione
Il commit GitHub **non aggiorna** da solo l'applicazione SiteGround: serve il deploy/riavvio del progetto Node. Le variabili da controllare sul provider, senza inserire segreti nel repository, sono:

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

## Migrazione schede Amazon — controllo del 15 novembre 2026

- Le 8 guide con ASIN usano `/api/guide-products?slug=`; le 8 tipologie usano `/api/category-products?slug=`. Entrambi recuperano gli ASIN curati con GetItems, senza sostituirli con SearchItems. Cucina resta editoriale in attesa di ASIN pertinenti verificati.
- Le guide statiche e quelle CMS rimandano alle categorie interne quando mancano dati Amazon validi. I 48 URL SiteStripe originali nelle tipologie restano conservati.
- `content/sitestripe.json` parte in modalità `sitestripe`: non attiva accessi Amazon non confermati. Redis, se configurato, continua a prevalere sul file. Il POST protetto per `mode=api` verifica sia SearchItems con prodotti utilizzabili sia GetItems dell'ASIN diagnostico; non basta HTTP 200.
- Un `ok:true` del diagnostico prova soltanto l'operazione verificata. Non garantisce che tutti i modelli del catalogo siano acquistabili o che ogni risposta includa offerte, foto e varianti. Il pannello distingue credenziali presenti da accesso verificato.
- Le risposte normalizzate richiedono ASIN/link coerenti, marketplace Amazon.it e il tag configurato, conservando il link restituito da Amazon. Solo offerte EUR valide producono prezzi; le immagini devono avere un URL HTTPS Amazon autorizzato.
- Cache dei dati di prodotto di 30 minuti, con cancellazione in memoria e `expiresAt` inviato al browser. Il browser ripristina il fallback alla scadenza e controlla anche il ritorno su una scheda sospesa. Nessun download/cache dei file immagine Amazon. Budget sotto 30: prodotti visibili soltanto con un prezzo verificato entro il limite.
- `npm test`: 30 test superati nel runtime locale. Le risposte Amazon dei test sono fixture, non una verifica delle credenziali reali.
- Diagnostico live non confermato: il controllo esterno ha ricevuto HTTP 202 con captcha SiteGround e il token amministrativo non era disponibile. Modalità Redis, GetItems reale, fotografie/prezzi live e deployment restano da verificare nel progetto Node esistente.
