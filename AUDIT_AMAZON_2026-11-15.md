# Verifica Amazon e guide — 15 novembre 2026

Base esaminata: `378bbdc41defc8df7045421b8fe0766f2938765e`, ramo main di panoramic23/cosaregalo.

## Risultati confermati nel codice

- L'esecuzione iniziale di npm test aveva 24 successi e 1 fallimento: nuovi URL Amazon diretti nelle guide non compresi nei 48 SiteStripe approvati. Dopo la correzione è emerso un secondo problema nello stesso test: alle 8 ricerche editoriali delle tipologie mancava il marcatore SiteStripe. Ripristinato il marcatore senza modificare alcun URL.
- Otto guide, 38 occorrenze di schede candidate: scrivania-pratica (6), giochi-creativi-bambini (3), cuffie (5), tech (5), lettura (2), benessere (6), sotto-30 (5), natale (6). I candidati non equivalgono a modelli verificati o acquistabili.
- In mancanza di una risposta GetItems valida, nessun nuovo collegamento diretto prodotto viene fabbricato dal CMS o dall'HTML statico: CTA alle categorie interne, messaggio esplicito sulla mancata verifica, niente fotografie o prezzi inventati. Le risposte API valide associano ASIN, link italiano e tag; vengono mostrate anche le denominazioni restituite da Amazon.
- Cucina-poco-spazio resta la nona guida editoriale, con 12 idee e collegamenti a categorie/ricerche già esistenti; nessun ASIN aggiunto senza verifica. Resta il lavoro prioritario non completato della migrazione.
- Il diagnostico SearchItems non considera più sufficiente HTTP 200: distingue token ottenuto e prodotti utilizzabili. Rifiuta body vuoti, fallback SiteStripe, link errati e ASIN non coerenti. GetItems è verificato separatamente.
- L'attivazione via amministrazione di mode=api richiede esito positivo sia della ricerca reale sia del diagnostico esatto GetItems. Un diniego lascia invariato lo storage. Il file di default torna a sitestripe, evitando l'attivazione automatica non verificata. Non modificata alcuna configurazione Redis di produzione.
- I prezzi sono accettati solo come importi EUR positivi, finiti e presenti nella risposta. Gli URL foto devono appartenere ai domini immagini Amazon previsti. Nessuna recensione copiata. Prezzo/disponibilità sono accompagnati da data e rinvio alle condizioni effettive del negozio.
- Scadenza comune 30 minuti: cache server cancellata, risposte no-store ed expiresAt. Il browser ripristina il contenuto editoriale alla scadenza, al ritorno nella scheda o nel ripristino della pagina. Le risposte scadute non arricchiscono la pagina. La chiave cache guide include la selezione ASIN, così una modifica CMS non riusa la vecchia selezione.
- Guida sotto-30: schede senza prezzo entro il budget nascoste anche via CSS, senza promesse di prezzo. Titolo allineato nell'indice. Mantenuti numeri giallo #FFD43D, layout orizzontale e regole responsive; aggiunta soltanto la gestione del testo modello lungo e dell'attributo hidden.
- Conservati tag 230b7-21 e i 48 URL SiteStripe (40 prodotto, 8 ricerca) delle tipologie. Nessun rimpiazzo con SearchItems.

## Verifiche eseguite e loro limiti

- `npm test`: **30 test, 30 superati** nel runtime Node locale. Include normalizzazione ostile, HTTP 200 senza dati validi, doppia verifica prima dell'attivazione Redis, selezione ASIN esatta, budget EUR e ripristino alla scadenza della pagina con DOM simulato. Test preesistenti SiteStripe, CMS, HTML, SEO, CSS e adapter Node superati.
- Parsing sintattico di site.js e dei moduli modificati superato. Controllo dei collegamenti locali e degli URL SiteStripe documentato nel controllo finale.
- Tentato collaudo Playwright a 320/390/768/1280 px, ma Chromium non è partito: primo eseguibile atteso assente, poi l'eseguibile di sistema ha terminato con socket() Operation not permitted. Nessuno screenshot o collaudo mobile visuale completato; non si attribuisce questa verifica ai test DOM simulati.
- Richiesta al diagnostico protetto `/api/admin?mode=amazon-api-test`: HTTP 202 text/html con sgcaptcha, non una risposta diagnostica Amazon. Token amministrativo non disponibile nel runtime; nessuna credenziale o token inserito nel repository o stampato. Non confermati autorizzazione Amazon reale, token OAuth reale, SearchItems/GetItems reali, modalità Redis effettiva o accessibilità delle immagini ufficiali.
- Nessuna chiamata reale di attivazione mode=api, nessun deploy/riavvio e nessuna pubblicazione live attestata. Accesso utilizzabile al deployment Node SiteGround non disponibile in questa esecuzione. Il commit richiede la distribuzione con la procedura esistente.

## Continuità editoriale

Letti README, feed, indice guide, server, prodotti/API, SiteStripe, cataloghi, calendario e registri 13/14 novembre. Il feed conserva come ultime date editoriali il 7 novembre. CMS Redis non leggibile: non si può escludere una pubblicazione concorrente nello storage live. La bozza organizer resta nel registro del 13 novembre, senza duplicati o finta data di pubblicazione. Non pubblicati nuovi articoli prima delle verifiche prodotto; nessuna data nel feed modificata dal commit tecnico.

## Riferimenti primari consultati

Ricerca del 15 novembre 2026; nessun numero di commenti o popolarità inventato:
- https://affiliate-program.amazon.com/creatorsapi/docs/en-us/api-reference/operations/search-items
- https://programma-affiliazione.amazon.it/creatorsapi/docs/en-us/api-reference/operations/get-items
- https://affiliate-program.amazon.com/creatorsapi/docs/en-us/concepts/best-programming-practices
- https://affiliate-program.amazon.com/help/operating/policies

Non sono stati scaricati file immagine Amazon o utilizzati prezzi di esempio come dati editoriali reali.
