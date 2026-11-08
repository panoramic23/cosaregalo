# Modalità provvisoria SiteStripe

Il **catalogo API** parte in modalità `sitestripe` con registro vuoto, senza generazione automatica di link. Dall'8 novembre 2026, **le otto tipologie HTML contengono 48 link SiteStripe forniti dal titolare**: 40 a schede prodotto Amazon e 8 a risultati di ricerca. Sono inseriti direttamente nei file HTML, funzionano senza JavaScript e non sono gestiti dal registro API. Le fasce di budget sono orientamenti editoriali e non attestano prezzi attuali. Nessuna immagine Amazon, prezzo, disponibilità o sconto viene ricavato da SiteStripe; le offerte sono disabilitate fuori dalla modalità API.

## Due canali distinti: HTML e API

- **Schede tipologia pubbliche:** i 48 URL SiteStripe attuali sono incorporati in `tipologie/*/index.html` con `data-affiliate-source="sitestripe"`. Non vengono disattivati modificando `content/sitestripe.json` o usando il pannello API. Per correggere o revocare un link, aggiornare il relativo HTML e fare deploy. L'immagine editoriale non è un'immagine Amazon ufficiale.
- **Catalogo API:** `content/sitestripe.json` o Redis alimentano `/api/products` in modalità `sitestripe`. Questo registro può essere ancora vuoto: i risultati API vuoti **non significano** che le 48 schede HTML siano senza link. Il pannello `/admin/` gestisce questo secondo canale, non il primo.

L'obiettivo futuro è centralizzare tutte le schede in una sola origine dati con revoca sicura; la migrazione non è ancora stata effettuata.

## Inserimento e verifica

1. Impostare `AMAZON_PARTNER_TAG` nel pannello ambiente SiteGround con il proprio tracking ID autorizzato. Il software non aggiunge né modifica tag.
2. Accedere ad Amazon.it con l'account Affiliati, aprire la pagina esatta del prodotto e variante, selezionare SiteStripe → Testo → link completo. Per un gruppo aprire la ricerca pertinente e generare il link da quella pagina. Supporto ufficiale: https://programma-affiliazione.amazon.it/help/node/topic/GJMMT7G4C8K4Y3AY
3. Aprire il link generato e controllare destinazione, modello, variante, ASIN e tracking ID. La validazione tecnica non prova l'origine SiteStripe né l'esistenza del prodotto: la conferma manuale del titolare è necessaria.
4. Aggiungere una voce al registro, senza riscrivere l'URL generato. Campi comuni: `type` e `group` presenti in `api/catalog.mjs`, `kind` (`product` oppure `group`), `title` reale e verificato, `url` completo SiteStripe, `source: "sitestripe"`, `verified: true`, `verifiedAt` data ISO UTC della verifica, `evidence` descrizione della verifica (12–500 caratteri, senza segreti). Solo per `product`, aggiungere `asin` di 10 caratteri maiuscoli/numeri corrispondente al percorso del link. Per `group`, omettere ASIN.
5. Usare l'admin → Link SiteStripe e modalità catalogo: il JSON ha struttura `{"mode":"sitestripe","links":[]}`. Inserire le voci nell'array. È un editor JSON, non un generatore di link. Richiede token admin (almeno 24 caratteri), HTTPS e Redis REST configurato tramite `KV_REST_API_URL` e `KV_REST_API_TOKEN`. Salvataggio unico del registro, seguito da rilettura. In alternativa modificare `content/sitestripe.json` su GitHub e ridistribuire il sito. Il registro Redis, se esistente, prevale sul file; un array vuoto in Redis revoca i link **del catalogo API**, non i collegamenti SiteStripe incorporati nell'HTML.
6. Verificare `/api/products?type=<type>&group=<group>` e la corrispondente pagina tipologia: titolo, ASIN e URL originali, nessun prezzo o disponibilità. Non inserire dati fittizi per fare prove pubbliche; i dati sintetici sono confinati ai test.

Sono accettati solo HTTPS, host esatti `amazon.it`/`www.amazon.it`, tag unico identico alla variabile ambiente e parametri noti. Prodotti: percorsi `/dp/ASIN`, `/nome/dp/ASIN`, `/gp/product/ASIN`. Gruppi: `/s?k=...`. Link brevi `amzn.to`, redirect, credenziali nell'URL, frammenti, porte e parametri non supportati sono rifiutati: usare il link completo generato da SiteStripe, senza espansione automatica né richieste a URL inseriti. Se un URL autentico ha un formato non supportato, occorre estendere validazione e test prima di pubblicarlo.

I link scadono dopo 90 giorni e richiedono una nuova verifica manuale. Nel **registro API** si revoca eliminando la voce e si corregge sostituendola integralmente con nuove evidenze; le schede HTML statiche richiedono invece una modifica del repository e un nuovo deploy. Timestamp futuri e duplicati sono rifiutati. Errori o indisponibilità Redis fanno tornare al solo editoriale (nessun recupero di vecchi link dal file). Le evidenze non vengono esposte nel catalogo pubblico.

## Modalità e futura API

`mode` ammette `sitestripe`, `editorial`, `api`. `editorial` spegne i link del **catalogo API**, ma non modifica i 48 link già inclusi nelle tipologie statiche. Prima di passare ad `api`, verificare idoneità, credenziali Creators API e protocollo reale; questi non sono stati provati con credenziali live. Il provider esistente è conservato. In caso di credenziali mancanti, 403 AssociateNotEligible o altro errore remoto, risponde 200 con fallback SiteStripe verificato oppure lista vuota/editoriale e codice diagnostico limitato. Non usa dati di prezzo inventati. Non abilitare API soltanto perché le credenziali sono presenti.

## SiteGround e collaudo

Node >=20, `npm start`, nessuna dipendenza aggiuntiva. L'adapter HTTP `server.mjs` è usato anche nei test: `/health`, catalogo, JSON invalido, admin non autorizzato, file registro non pubblico, pagine statiche e offerte disattivate. `npm test` copre validazione ostile, corrispondenza ASIN/tag, scadenza, salvataggio/revoca Redis simulato e fallback 403 simulato. Non equivale a certificazione dell'idoneità Amazon o a verifica del server remoto.

Dopo il deploy controllare `/health`, catalogo `/api/products` in modalità SiteStripe (può avere `items: []`), pulsanti SiteStripe nelle pagine HTML e admin senza token → 401. Il backend non deve mostrare prezzi o recensioni inventate. Con un link reale verificato provare la destinazione dal sito. Redis reale e scrittura admin in produzione richiedono configurazione del titolare. Nessuna migrazione automatica dei vecchi tag o link editoriali.
