# Audit tecnico, editoriale e social - CosaRegalo
Data: 14 novembre 2026. Repository: panoramic23/cosaregalo, ramo main.

## Interventi completati nel codice
- Uniformate otto pagine `tipologie/<slug>/` con layout editoriale: foto più grande, nome breve, motivo redazionale, destinatario indicato, vincolo d'acquisto, prezzo e CTA.
- Verificate **40 occorrenze di schede con ASIN esatto** (38 ASIN distinti). Per ognuna sono presenti motivazione, destinatario e avvertenza.
- Corrette **8 schede che fingevano di essere singoli prodotti** ma rimandavano a ricerche Amazon. Ora sono note redazionali esplicitamente riconoscibili come ricerca, con il link affiliato originale conservato.
- Integrazione `/api/category-products` per recuperare soltanto i modelli previsti tramite `GetItems`. Impedita la sostituzione delle selezioni editoriali con i risultati generici `SearchItems`.
- Foto ufficiali, caratteristiche e prezzi visualizzati soltanto se restituiti dall'API; se la risposta non è disponibile rimangono la foto illustrativa chiaramente etichettata, il testo originale e il link SiteStripe verificato.
- Piano editoriale riallineato in `lib/editorial.mjs`, `content/impostazioni_editoriali.json`, `content/calendario_14_giorni.json` e CSV: 18 brief ogni 48 ore dal 15 novembre al 19 dicembre, non dichiarati pubblicati.
- Piano social di 14 giorni in `content/social-calendar-2026-11.json`, leggibile dal pannello redazionale in sola lettura.
- Automazioni esistenti confermate attive: editoriale alle 08:00 e social alle 10:00, fuso Europe/Rome, senza crearne di nuove.

## Debug statico dopo le modifiche
- Le 8 pagine categorie hanno quantità coerenti di sezioni, articoli e div HTML aperti e chiusi: 0 differenze.
- **40/40** schede specifiche possiedono motivazione redazionale. Nessuna ricerca generica rimane presentata come prodotto.
- I principali moduli JS, server Node, API e dati editoriali superano il parsing sintattico.
- Controllo dei link locali nelle 35 pagine HTML eseguito in precedenza: nessun riferimento a file mancante nell'HTML sorgente. Questo controllo non verifica la raggiungibilità HTTP live.
- Aggiunti test `tests/category-editorial.test.mjs` per la struttura delle schede, l'uso degli ASIN esatti e la pianificazione. **Non si attesta l'esecuzione di npm test sul runtime Node/SiteGround**.

## Stato Metricool
- Brand confermato: **Cosa Regalo**, ID **2236117**, timezone **Europe/Rome**, Instagram `regalocosa`, Facebook collegato, Pinterest `regalocosa`.
- Nessuna pubblicazione futura restituita per il periodo 14 novembre - 15 dicembre 2026.
- TikTok ancora collegato come **lakelecco**: esclusa la programmazione finché l'identità CosaRegalo non è confermata.
- La descrizione del brand Metricool riporta ancora **'Migliora la qualità dell’aria'** (residuo del vecchio brand) e l'identità grafica va verificata.
- Le immagini del sito non sono state validate come URL media pubblici accettati da Metricool: **zero post dichiarati programmati**. Il calendario JSON contiene proposte, non pubblicazioni.
- L'automazione social preesistente è stata aggiornata per controllare la programmazione, usare il nuovo calendario e preparare i canali collegati solo dopo verifica di profili e media.

## Blocchi aperti per un collaudo di produzione
1. Il sito web può restituire una verifica di sicurezza SiteGround (HTTP 202 / sgcaptcha) alle richieste esterne: `/health`, API prodotti, immagini, menu live e responsive non sono verificabili in questa sessione.
2. Nessuna chiamata Amazon `GetItems` con credenziali reali è stata confermata: immagini e prezzi non devono essere dichiarati attivi in produzione.
3. Un eventuale valore Redis `cr:sitestripe:v1` prevale sul file di configurazione: verificare che la modalità operativa sia realmente `api`.
4. La guida cucina è tuttora una selezione di idee con ricerche Amazon, non una lista con ASIN esatti convalidati.
5. La corretta distribuzione su SiteGround del nuovo codice richiede un deploy sul progetto Node esistente; il commit GitHub non è pubblicazione live.
6. Controllare e correggere identità/logo/descrizione del brand Metricool, l'account TikTok e la disponibilità di URL media; solo allora la coda può essere pubblicata in sicurezza.
