# CosaRegalo

Repository per il sito **CosaRegalo**. Hosting previsto: **SiteGround GoGeek** e dominio **cosa-regalo.it**.

## Stato dell'importazione

⚠️ **Il codice della V6 non è ancora nel repository.** È stato predisposto un pacchetto completo pronto per il push: `CosaRegalo_V6_PRONTO_GITHUB.zip` nella conversazione ChatGPT. Contiene 24 pagine HTML, asset, pannello admin e funzioni API.

L'interfaccia di GitHub collegata a questa conversazione consente operazioni sui file di testo, ma non permette di trasferire direttamente gli asset binari dello ZIP dalla sessione locale. Il pacchetto include `PUSH_COSAREGALO_GITHUB.command`, script per macOS che, dopo autenticazione GitHub locale, effettua il push di tutti i file sul ramo `main`.

## Hosting

Il frontend è HTML/CSS/JS statico; le funzioni serverless `/api/*.mjs` presenti nel pacchetto seguono l'API delle funzioni Vercel e **richiedono adattamento** al runtime Node.js SiteGround prima del deploy completo. Nessun deploy o dominio è stato configurato.

## Integrazioni future

- Amazon Creators API, tracking ID `230b7-21` (chiavi solo lato server)
- Fonte storica affidabile, per pubblicare super offerte reali con sconti verificati >=50%
- Database/Redis REST per statistiche e gestionale
- Autenticazione e protezione admin, conformità privacy, automazione editoriale

Non salvare credenziali nel repository. Non presentare prezzi o ribassi non verificati.
