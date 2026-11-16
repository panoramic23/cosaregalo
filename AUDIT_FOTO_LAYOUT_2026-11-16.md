# Foto prodotto e presentazione editoriale - 16 novembre 2026

## Causa verificata online

La risposta reale di `/api/guide-products?slug=cuffie`, letta nel browser, è `source: editorial`, `items: []`, `reason: API_MODE_DISABLED`. La pagina contiene cinque schede e cinque contenitori foto vuoti, senza fotografie prodotto nel DOM. Non è un problema di fotografie nascoste dal solo CSS: nessun dato immagine è arrivato dal servizio. Il file di default `content/sitestripe.json` è in modalità SiteStripe; lo stato Redis di produzione richiede l'accesso amministratore.

Il pannello `/admin/` mostra l'accesso tramite token e non una sessione autenticata. Nessun token disponibile è stato letto, esposto o inventato. Non è stata forzata l'attivazione Amazon senza diagnostico reale. Lo stato di autorizzazione GetItems non è confermato e le fotografie ufficiali non sono state ripristinate in questa modifica.

## Intervento grafico

- `lib/guide-presentation.mjs` è l'unica trasformazione di presentazione per pagine statiche storiche e CMS, applicata dal server a tutte le guide di dettaglio e direttamente dal renderer CMS. È idempotente.
- Le nove guide statiche sono già trasformate nel repository, anche prima di eseguire JavaScript. Il nuovo stylesheet editoriale viene caricato per ultimo.
- Ogni idea segue lo stesso ordine: numero e titolo forte, fotografia ampia quando realmente presente, descrizione senza etichette ripetitive, pulsante e nota essenziale. Non vengono inventati o sostituiti ASIN, URL affiliati, immagini o prezzi.
- Apertura a tutta larghezza, titoli grandi, corpo leggibile, foto senza cornici da card, separatori semplici e sidebar secondaria. Nessuna griglia rigida a quattro colonne.
- Rimossi dalla presentazione i dettagli tecnici ASIN e il titolo marketplace duplicato. Conservati titolo editoriale, testo, ancore e CTA.

## Gestione foto

- Un unico messaggio spiega la temporanea assenza di foto; niente grandi riquadri vuoti ripetuti.
- Stati espliciti: caricamento, disponibili, parziali, non disponibili. La modalità disabilitata, gli errori HTTP, il timeout e il fallimento di un'immagine escono dal caricamento e mostrano il fallback.
- Una fotografia che non si carica viene rimossa. Le foto corrette non vengono scartate per il solo fallimento di un'altra.
- Alla scadenza dei dati Amazon si ripristina lo stato editoriale, non un messaggio di caricamento infinito. Restano attivi controllo identità modello, ASIN/link/tag, budget EUR e scadenza.

## Verifiche

39 test superati. I nuovi test verificano trasformazione reale di markup storico con contenuto successivo, ordine foto/testo/CTA, conservazione di link/ASIN/ancore, idempotenza su tutte le nove guide, ereditarietà del CMS, API disabilitata e caricamento/fallimento di una fotografia con dati fixture.

Le fixture non attestano accesso Amazon reale. Per ripristinare le fotografie Amazon occorre autenticarsi nel pannello esistente, controllare credenziali e stato catalogo, eseguire i diagnostici SearchItems/GetItems già presenti e attivare l'API solo con dati validi. Il layout può essere aggiornato indipendentemente; il caricamento delle fotografie Amazon non va dichiarato risolto fino alla verifica reale.

## Esempi concreti negli articoli di categoria

Applicata la nuova preferenza: almeno due o tre modelli concreti con foto, nome e descrizione anche nelle guide generali. La guida cucina ora comprende Chop2Pot Plus, Nest Measure e Nest 9 Plus, ricercati sulle pagine ufficiali Joseph Joseph EU. Foto remote del produttore, con credito e fonte visibile, senza immagini Amazon scaricate o generate. I pulsanti sono ricerche per modello su Amazon.it e lo dichiarano: nessun ASIN, prezzo o disponibilità inventati. La ricerca diretta su Amazon.it non è stata verificabile in questa sessione e non è presentata come conferma di stock.

Fonti: https://eu.josephjoseph.com/products/chop2pot-plus-folding-chopping-board-black ; https://eu.josephjoseph.com/products/nest-measure-measuring-cups-multicolour ; https://eu.josephjoseph.com/products/nest-9-plus-bowl-set-multicolour .

I modelli e le fotografie sono registrati in lib/editorial-examples.mjs; anche una versione CMS della cucina eredita gli esempi. Impostazioni e istruzioni editoriali specificano la regola per i prossimi articoli. Totale aggiornato: 41 test superati, inclusi esempi e fotografie del produttore, ricerche specifiche e conservazione degli esempi sotto override CMS.
