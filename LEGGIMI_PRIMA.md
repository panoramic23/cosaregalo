<!-- DOCUMENTAZIONE STORICA: conservata come archivio delle prime versioni, non per il deploy attuale. -->

> **ARCHIVIO V5 — NON USARE PER DEPLOY O CONFIGURAZIONE ATTUALE.** CosaRegalo ora è un progetto Node.js su SiteGround, dominio `cosa-regalo.it`. Per istruzioni aggiornate usa [README.md](README.md), [SITESTRIPE.md](SITESTRIPE.md) e [GO_LIVE_COSAREGALO.md](GO_LIVE_COSAREGALO.md).

---

# CosaRegalo — Versione 5 (anteprima, NON pubblicata)

Questa è la revisione del **progetto HTML originale fornito il 6 novembre 2026**, senza importazioni da Base44.

## Modifiche
- Nuovo slogan: **«Il regalo giusto. Senza andare a caso.»**
- Guida in evidenza: immagine a tutta superficie e testo sovrapposto con sfumatura per leggibilità.
- Ogni link commerciale Amazon diventa **«Acquista su Amazon ↗»** e usa `rel="sponsored nofollow noopener"`.
- Unificate Offerte e Outlet in **Super offerte** (`/offerte/`): nessuno sconto inventato; Outlet rimanda alla sezione unica.
- Aggiunta **area gestionale `/admin/`**, con piano editoriale, stato integrazioni, pagine viste, prodotti più cliccati, report Amazon Associates e offerte manuali verificate.
- Statistiche anonime aggregate e attivate soltanto dopo consenso esplicito; nessun identificatore personale archiviato dall'app.

## Anteprima locale
Aprire `index.html` nel browser, poi le altre pagine tramite il menu. Per il gestionale aprire `admin/index.html`: in locale mostra il piano editoriale reale e lo stato delle integrazioni, ma non esegue scritture o statistiche.

## Fase 2 — deploy e integrazioni (NON ancora effettuati)
Hosting raccomandato: Vercel con funzioni Node `/api/*.mjs`.

Variabili d'ambiente SERVER-SIDE da configurare (non includere mai valori segreti nel repository):

```
AMAZON_CREATORS_CLIENT_ID=
AMAZON_CREATORS_CLIENT_SECRET=
AMAZON_CREATORS_VERSION=3.2
AMAZON_PARTNER_TAG=230b7-21
KV_REST_API_URL=
KV_REST_API_TOKEN=
ADMIN_DASHBOARD_TOKEN=  # almeno 24 caratteri casuali e non pubblici
```

La gestione utilizza un archivio Redis REST compatibile con Upstash (`KV_*`). Nessuna statistica o report è simulata in assenza del collegamento. Il token admin viene usato per autorizzare l'accesso ai dati, non deve essere inserito nel codice e resta solo nella sessione del browser. Usare HTTPS; per produzione è preferibile sostituire il token con login e sessioni server-side, MFA e ruoli.

### Super offerte / Amazon Hack
L'area `/offerte/` legge `/api/deals`. Al momento, senza collegamento ai prezzi verificati, **non pubblica alcuna offerta**. L'amministratore può aggiungere manualmente prodotti soltanto con fonte dello storico prezzi, rilevazione recente (24 ore), risparmio minimo di 15 € e prezzo almeno 50% più basso del riferimento. Non è ancora implementato un feed automatico Keepa/Amazon: previsto per la fase 2. È necessario validare la fonte prima dell'inserimento.

### Report affiliati
I report di guadagni e ordini Amazon Associates **non sono forniti da Creators API**: la dashboard prevede un inserimento manuale del riepilogo ufficiale, con periodo e data dell'importazione. Integrare export CSV/servizio autorizzato nella fase 2.

### Piano editoriale e pubblicazione automatica
La dashboard mostra gli attuali brief in `content/calendario_14_giorni.json`. Il generatore AI, le revisioni editoriali e la pianificazione di pubblicazione automatica non sono ancora collegati. Nessun contenuto viene pubblicato automaticamente nella fase 1.

### Privacy
I visitatori devono acconsentire alle statistiche aggregate. È richiesta revisione definitiva di informativa privacy/cookie/consenso e della disclosure affiliati prima della messa online.

**Stato:** ZIP pronto da revisionare. Nessun deploy, nessun push GitHub, credenziali Amazon/analytics non configurate.

## Aggiornamenti V6
- Claim in home: «Il regalo giusto, al giusto prezzo.»
- Super offerte: sconto minimo effettivo del 50% rispetto allo storico validato, risparmio minimo 15 €, dati entro 24 ore; controlli anche lato API.
- Offerte ammesse: esclusivamente beni fisici delle categorie regalo selezionate. Esclusi software, servizi, gift card, download, abbonamenti e contenuti digitali. I prodotti elettronici **fisici** restano ammessi quando coerenti con il sito.
- Rimosso riferimento al programma affiliati dalla fascia superiore dell’header, mantenendo le disclosure in pagina e nel footer.
- Le API Amazon e la verifica storica prezzi non sono ancora connesse: non vengono inventate offerte.
