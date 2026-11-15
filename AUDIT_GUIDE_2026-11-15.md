# Revisione guide e debug del 15 novembre 2026

Ambito: repository panoramic23/cosaregalo, main, hosting Node esistente. Base44 escluso.

## Problemi confermati nel browser online

- Cucina: stessa immagine di regali/elettronica nell'apertura e in tutti i 12 accessori; schede di ricerca diverse dalle altre guide.
- Scrivania: titolo con 6 prodotti ma sottotitolo ancora con dieci idee; nessuna fotografia ufficiale nelle schede osservate.
- Cuffie: apertura con scena di tablet/accessori e immagini di suggerimenti non pertinenti.
- Sei guide conservavano sezioni dimostrative, biografia provvisoria e griglia di prodotti generici dopo la selezione specifica.
- Feed, titoli delle pagine e schede non allineati. Natale raggiungibile ma assente dal feed dell'indice Guide.
- CSS desktop: quattro colonne con minimi incompatibili con la larghezza del corpo affiancato alla sidebar.

## Correzioni

- Tutte le nove guide usano la stessa struttura hero, corpo e indice; indici con i nomi reali dei prodotti e ancore esistenti.
- Sottotitoli e descrizioni pertinenti alla selezione; rimossi testi dimostrativi e blocchi generici duplicati; note specifiche per prodotto.
- Due nuove copertine illustrative per cucina e cuffie, create con ImageGen, ottimizzate WebP 1200x800. Non sono fotografie di modelli commerciali. Prompt: scena di cucina compatta con utensili/contenitori; scena con cuffie anonime su scrivania. Originali conservati separatamente dal repository.
- Nessuna fotografia generica nelle schede cucina. La guida rimane una selezione di tipologie, con ricerche affiliate dichiarate: non sono stati inventati ASIN né spacciati risultati di ricerca per modelli verificati.
- Placeholder fotografici vuoti nascosti; fotografie Amazon solo da dati ufficiali e rimosse se il caricamento fallisce.
- Layout a colonne flessibili senza minimi cumulativi eccessivi; CTA e foto separate dal testo, indici e spazi adattati ai breakpoint.
- Guide sotto 30 euro: schede inizialmente nascoste e rese visibili soltanto con prezzo verificato entro il budget. Messaggio editoriale quando non ci sono dati confermati.
- Controllo aggiuntivo nome/modello nella risposta GetItems, oltre ad ASIN/link/tag già convalidati. Una mancata corrispondenza omette l'arricchimento: non certifica disponibilità o correttezza di una variante.
- Feed, home e indice riallineati; Natale incluso. Le guide CMS note ereditano la copertina coerente con lo slug.

## Verifiche

- 34 test automatici superati, inclusi quattro nuovi controlli su layout/indici, feed/riferimenti, budget e identità modello.
- Sintassi verificata per server, tutti gli script frontend e tutti i moduli api/lib.
- 35 pagine HTML: riferimenti locali risolti, immagini esistenti, ancore e IDs controllati.
- 45 richieste al server locale: pagine, feed, health, robots, sitemap, API, risorse riservate e URL inesistente. Redirect 308 per confronti/outlet previsti; admin API 401; sorgenti riservati e URL assente 404. Cucina non ha endpoint di prodotti specifici (404 previsto).
- I test Amazon usano fixture: non dimostrano autorizzazione live, stock o funzionamento dei prezzi reali.

## Limiti e rilascio

Le modifiche richiedono deploy e riavvio del progetto Node esistente. Non è disponibile in questa sessione un accesso al deployment. Non è stato eseguito un deploy né un collaudo grafico della versione corretta online. Le osservazioni browser riguardano la produzione precedente alle correzioni (desktop e mobile 390px).

Da completare dopo il deploy: controlli visivi desktop/320/390/768px su tutte le guide; verifica effettiva GetItems e immagini/prezzi; verifica eventuali articoli Redis che sovrascrivono le pagine statiche. Nessun contenuto privato Redis è stato letto senza credenziali disponibili.
