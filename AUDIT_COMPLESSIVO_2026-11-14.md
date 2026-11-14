# CosaRegalo - audit sorgenti e interventi del 14 novembre 2026

## Perimetro
Repository `panoramic23/cosaregalo`, ramo `main`. Audit statico del codice disponibile su GitHub, non equivalente a browser test live o collaudo del deployment su SiteGround.

## Verifiche effettuate
- Albero GitHub: 35 pagine HTML `index.html` controllate individualmente per apertura/chiusura di tag di struttura (`div`, `section`, `article`, `nav`, `main`, `aside`, `header`, `footer`). Nessuna discrepanza riscontrata.
- Collegamenti interni locali di tutte le 35 pagine: risoluzione di percorsi relativi e verifica contro i file effettivi presenti nell'albero repository. Nessun riferimento locale mancante riscontrato nell'HTML sorgente. Questo non verifica i link esterni né i percorsi generati a runtime.
- Sintassi: parsing senza errori del codice dei principali moduli client e server, inclusi `server.mjs`, `assets/site.js`, `assets/admin.js`, `api/products.mjs`, `api/guide-products.mjs`, `api/admin.mjs`, `lib/article-cms.mjs`, `lib/guide-catalog.mjs` e gli script ads/analytics/CMP. È una verifica di parsing, non l'esecuzione della suite Node.
- Otto guide con `data-asin` sono allineate al catalogo `lib/guide-catalog.mjs`: 38 schede precise in totale, 38 testi di motivazione editoriale, zero pulsanti di ricerca generica, struttura HTML bilanciata.
- Immagini prodotto ingrandite tramite CSS desktop e mobile; visualizzazione condizionata a URL validi recuperati da Amazon Creators API.
- L'API `GetItems` richiede `itemInfo.features` oltre a titolo, immagini, prezzi e disponibilità; il frontend mostra un breve estratto tecnico solo quando restituito. Non si attribuiscono giudizi o recensioni non verificate ad acquirenti Amazon.
- Titoli sintetici delle schede editoriali conservati anche quando Amazon restituisce un titolo SEO lungo.
- Homepage: l'hero evidenzia la guida più recente del feed delle pubblicazioni effettive, con immagine, categoria, titolo, estratto e link. Gli articoli senza data non prevalgono su quelli con data certa.
- Corretta la selezione del contenitore del catalogo guide pubblico: in `guide/index.html` esiste `.guide-grid`, non `.cr-guide-hub .guide-grid`.
- Pannello redazionale: possibilità di associare a ogni ASIN titolo breve e testo motivazionale, conservando i dati nelle modifiche e archiviazioni.
- Prezzi: normalizzazione numerica e filtraggio della guida sotto i 30 euro soltanto con valore verificato.

## Limiti e problemi ancora aperti
1. `guide/cucina-poco-spazio/index.html` è ancora una guida precedente, con 12 idee generiche e link a ricerche Amazon. Non sono stati inseriti ASIN inventati o non controllati: occorrono modelli esatti e risposte positive da `GetItems` prima della conversione.
2. Le fotografie e i prezzi degli ASIN non sono verificati dal solo sorgente GitHub. Amazon può non restituire un prodotto, un'immagine o una quotazione per alcuni identificatori.
3. `content/sitestripe.json` è configurato in `api`, ma una configurazione Redis esistente può prevalere. Serve controllare la modalità effettivamente letta in produzione.
4. Creators API: occorre eseguire `/admin/` > test GetItems con credenziali reali e verificare sia la risposta che i campi immagine/prezzo; l'HTTP 200 di SearchItems da solo non basta.
5. Non sono stati eseguiti qui `npm test`, browser visuale su desktop/mobile, analisi Lighthouse, test dei moduli con storage Redis reale o deploy SiteGround. Nessun risultato live viene dichiarato.
6. I link esterni e il rendering in browser, incluse immagini ufficiali Amazon e prezzi, richiedono verifica dopo il deployment del progetto esistente.
7. Le recensioni di clienti Amazon non sono incluse tra le risorse richieste da `GetItems`: i contenuti editoriali attuali sono valutazioni indipendenti e non sintesi di recensioni verificate.

## Checklist dopo il deploy SiteGround
- Verificare `/health`, `/guide/`, homepage, menu responsive, pagina guida e card prodotto.
- `/api/guide-products?slug=cuffie`: fonte `amazon-creators-api`, ASIN, foto, testo e prezzo dove forniti; nessun fallback presentato come prodotto verificato.
- Admin protetto: articolo bozza, modifica, pubblicazione, archiviazione, riapertura; stato visibile sul feed e sulla sitemap.
- Test `GetItems` nel pannello, controllo tag affiliato e link.
- Home: riquadro principale aggiornato con ultima guida pubblicata.
- Test responsive, contrasto e overflow; privacy/cookie e indicizzazione `robots.txt`/`sitemap.xml`.
- Eseguire `npm test` e verificare i log Node.js sul provider.
