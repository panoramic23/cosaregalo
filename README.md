# CosaRegalo — versione V6

Sito editoriale per idee regalo e super offerte Amazon. Origine: pacchetto HTML V6 approvato il 6 novembre 2026.

## Cartelle
- `index.html`, pagine in sottocartelle: frontend statico (24 pagine)
- `assets/`: CSS, JS, immagini
- `content/`: piano editoriale e cataloghi
- `admin/`: pannello gestionale, da proteggere prima della pubblicazione
- `api/`, `lib/`: funzioni Node progettate per runtime Vercel; **richiedono un adattamento a un server Node persistente su SiteGround** prima di poterle attivare

## Hosting previsto
SiteGround GoGeek, dominio `cosa-regalo.it`. Il deposito del codice GitHub **non pubblica il sito**. Prima di andare online configurare deploy, Node runtime, HTTPS, accesso admin, Redis e credenziali Amazon.

## Amazon
Creators API (EU) con ID/Secret/Version; partner tag `230b7-21`. Keepa o fonte storica verificabile richiesta per dichiarare sconti >=50%; non pubblicare offerte fittizie. I report Amazon Associates non sono esposti da Creators API.

## Privacy e sicurezza
I segreti vanno nelle variabili di ambiente sul server, non nei file Git. Non pubblicare l'admin senza autenticazione robusta. Vedi `LEGGIMI_PRIMA.md` per limitazioni note.
