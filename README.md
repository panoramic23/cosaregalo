# CosaRegalo

Sito editoriale italiano per idee regalo, confronti e super offerte Amazon.

**Sorgente approvato:** CosaRegalo V6, archivio `CosaRegalo_V6_SUPER_OFFERTE_50.zip` (6 novembre 2026).

**Attenzione:** questo repository è in fase di importazione. La presenza del README **non** significa che l'intera V6 sia stata trasferita o sia online. Il pacchetto di rilascio contiene 59 file, con sito statico, 24 pagine HTML, asset e funzioni serverless. L'importazione completa richiede il caricamento degli effettivi contenuti del pacchetto.

## Stack previsto
- HTML, CSS, JavaScript statici
- Vercel per funzioni Node `/api/*.mjs`
- Amazon Creators API (EU, credenziali 3.2, Amazon.it)
- Keepa API per verifica super offerte: sconto >=50%, risparmio >=15€, osservazione <=24 ore, soli prodotti fisici e pertinenti
- Redis REST compatibile Upstash per statistiche e gestionale
- Tracking ID Amazon: `230b7-21`

## Credenziali (soltanto variabili d'ambiente di Vercel)
```env
AMAZON_CREATORS_CLIENT_ID=
AMAZON_CREATORS_CLIENT_SECRET=
AMAZON_CREATORS_VERSION=3.2
AMAZON_PARTNER_TAG=230b7-21
KV_REST_API_URL=
KV_REST_API_TOKEN=
ADMIN_DASHBOARD_TOKEN=
```
Non inserire segreti nel repository. Non esporre il gestionale senza autenticazione robusta.

## Dominio
Dominio previsto: `cosa-regalo.it`. GitHub ospita il codice; Vercel il sito e le API. Aggiungere il dominio al progetto Vercel e configurare i DNS secondo i valori indicati nella dashboard.

## Stato
Nessun deploy autorizzato; non mostrare sconti e prezzi non verificati.
