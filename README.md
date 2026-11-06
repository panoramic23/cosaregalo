# CosaRegalo — versione V6

Sito editoriale per idee regalo e super offerte Amazon. Origine: pacchetto HTML V6 approvato il 6 novembre 2026.

## Cartelle
- `index.html`, pagine in sottocartelle: frontend statico (24 pagine)
- `assets/`: CSS, JS, immagini
- `content/`: piano editoriale e cataloghi
- `admin/`: pannello gestionale, da proteggere prima della pubblicazione
- `api/`, `lib/`: handler Node esposti dall’adapter HTTP `server.mjs` su SiteGround

## Hosting previsto
SiteGround GoGeek, dominio `cosa-regalo.it`. Il deposito del codice GitHub **non pubblica il sito**. Prima di andare online configurare deploy, Node runtime, HTTPS, accesso admin, Redis e credenziali Amazon.

## Modalità provvisoria SiteStripe

Catalogo predefinito senza chiamate Amazon e senza link non verificati. Configurazione da admin con Redis oppure da `content/sitestripe.json`; istruzioni, verifica manuale e ritorno alla futura API in [SITESTRIPE.md](SITESTRIPE.md). Eseguire `npm test` per il collaudo automatico.

## Amazon
Creators API (EU) con ID/Secret/Version; partner tag `230b7-21`. Keepa o fonte storica verificabile richiesta per dichiarare sconti >=50%; non pubblicare offerte fittizie. I report Amazon Associates non sono esposti da Creators API.

## Privacy e sicurezza
I segreti vanno nelle variabili di ambiente sul server, non nei file Git. Non pubblicare l'admin senza autenticazione robusta. Vedi `LEGGIMI_PRIMA.md` per limitazioni note.

## Deploy su SiteGround GoGeek

Il sito usa il runtime Node.js nativo e **non richiede Vercel**. Il server HTTP `server.mjs` espone i documenti HTML e le API `/api/products`, `/api/deals`, `/api/track`, `/api/admin`.

1. In Area Cliente SiteGround, aprire **Siti Web → Progetti Node.js → Nuovo progetto**.
2. Collegare il repository privato `panoramic23/cosaregalo`, branch `main`.
3. Impostare il comando di avvio `npm start` se il wizard lo richiede. Nessun comando build necessario; versione Node >=20.
4. Provare il dominio temporaneo e `/health` (risponde `ok:true`). Non collegare il dominio principale prima del collaudo.
5. Inserire le variabili in `.env.example` **nel pannello dell'ambiente SiteGround**, mai nel repository. `PORT` è gestita dal provider quando assegnata.

### Limitazioni prima del lancio
- API prodotti richiede credenziali Amazon Creators API valide e una prova reale del protocollo: non ancora verificata con Amazon.
- Statistiche, deals e salvataggio report richiedono un endpoint Redis REST compatibile; **la disponibilità di MySQL/PostgreSQL SiteGround non sostituisce automaticamente questo adapter**.
- La dashboard usa un token server-side: configurare un token casuale robusto, accesso HTTPS e ulteriori protezioni prima della produzione.
- Nessuna offerta viene pubblicata senza verifica di prezzo, evidenza storica e soglia minima −50%.
- Test end-to-end di deploy e API non ancora eseguiti sul runtime SiteGround.

