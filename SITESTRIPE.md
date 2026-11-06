# Modalità provvisoria SiteStripe

Il catalogo parte in `sitestripe`, con registro vuoto: nessun link è stato inventato o verificato al posto del titolare. Gli esempi editoriali esistenti restano leggibili anche senza JavaScript, senza pulsanti Amazon. Le fasce di budget sono orientamenti editoriali e non attestano prezzi attuali. Nessuna immagine Amazon, prezzo, disponibilità o sconto viene ricavato da SiteStripe; le offerte sono disabilitate fuori dalla modalità API.

## Inserimento e verifica

1. Impostare `AMAZON_PARTNER_TAG` nel pannello ambiente SiteGround con il proprio tracking ID autorizzato. Il software non aggiunge né modifica tag.
2. Accedere ad Amazon.it con l'account Affiliati, aprire la pagina esatta del prodotto e variante, selezionare SiteStripe → Testo → link completo. Per un gruppo aprire la ricerca pertinente e generare il link da quella pagina. Supporto ufficiale: https://programma-affiliazione.amazon.it/help/node/topic/GJMMT7G4C8K4Y3AY
3. Aprire il link generato e controllare destinazione, modello, variante, ASIN e tracking ID. La validazione tecnica non prova l'origine SiteStripe né l'esistenza del prodotto: la conferma manuale del titolare è necessaria.
4. Aggiungere una voce al registro, senza riscrivere l'URL generato. Campi comuni: `type` e `group` presenti in `api/catalog.mjs`, `kind` (`product` oppure `group`), `title` reale e verificato, `url` completo SiteStripe, `source: "sitestripe"`, `verified: true`, `verifiedAt` data ISO UTC della verifica, `evidence` descrizione della verifica (12–500 caratteri, senza segreti). Solo per `product`, aggiungere `asin` di 10 caratteri maiuscoli/numeri corrispondente al percorso del link. Per `group`, omettere ASIN.
5. Usare l'admin → Link SiteStripe e modalità catalogo: il JSON ha struttura `{"mode":"sitestripe","links":[]}`. Inserire le voci nell'array. È un editor JSON, non un generatore di link. Richiede token admin (almeno 24 caratteri), HTTPS e Redis REST configurato tramite `KV_REST_API_URL` e `KV_REST_API_TOKEN`. Salvataggio unico del registro, seguito da rilettura. In alternativa modificare `content/sitestripe.json` su GitHub e ridistribuire il sito. Il registro Redis, se esistente, prevale sul file; un array vuoto in Redis revoca tutti i link.
6. Verificare `/api/products?type=<type>&group=<group>` e la corrispondente pagina tipologia: titolo, ASIN e URL originali, nessun prezzo o disponibilità. Non inserire dati fittizi per fare prove pubbliche; i dati sintetici sono confinati ai test.

Sono accettati solo HTTPS, host esatti `amazon.it`/`www.amazon.it`, tag unico identico alla variabile ambiente e parametri noti. Prodotti: percorsi `/dp/ASIN`, `/nome/dp/ASIN`, `/gp/product/ASIN`. Gruppi: `/s?k=...`. Link brevi `amzn.to`, redirect, credenziali nell'URL, frammenti, porte e parametri non supportati sono rifiutati: usare il link completo generato da SiteStripe, senza espansione automatica né richieste a URL inseriti. Se un URL autentico ha un formato non supportato, occorre estendere validazione e test prima di pubblicarlo.

I link scadono dopo 90 giorni e richiedono una nuova verifica manuale. Per revocare eliminare la voce; per correggere sostituirla integralmente con nuove evidenze. Timestamp futuri e duplicati sono rifiutati. Errori o indisponibilità Redis fanno tornare al solo editoriale (nessun recupero di vecchi link dal file). Le evidenze non vengono esposte nel catalogo pubblico.

## Modalità e futura API

`mode` ammette `sitestripe`, `editorial`, `api`. `editorial` spegne tutti i link del catalogo. Prima di passare ad `api`, verificare idoneità, credenziali Creators API e protocollo reale; questi non sono stati provati con credenziali live. Il provider esistente è conservato. In caso di credenziali mancanti, 403 AssociateNotEligible o altro errore remoto, risponde 200 con fallback SiteStripe verificato oppure lista vuota/editoriale e codice diagnostico limitato. Non usa dati di prezzo inventati. Non abilitare API soltanto perché le credenziali sono presenti.

## SiteGround e collaudo

Node >=20, `npm start`, nessuna dipendenza aggiuntiva. L'adapter HTTP `server.mjs` è usato anche nei test: `/health`, catalogo, JSON invalido, admin non autorizzato, file registro non pubblico, pagine statiche e offerte disattivate. `npm test` copre validazione ostile, corrispondenza ASIN/tag, scadenza, salvataggio/revoca Redis simulato e fallback 403 simulato. Non equivale a certificazione dell'idoneità Amazon o a verifica del server remoto.

Dopo il deploy controllare `/health`, risposta 200 con `source: sitestripe` e `items: []` prima dell'inserimento; assenza di vecchi pulsanti di ricerca; admin senza token → 401. Con un link reale verificato provare la destinazione dal sito. Redis reale e scrittura admin in produzione richiedono configurazione del titolare. Nessuna migrazione automatica dei vecchi tag o link editoriali.
