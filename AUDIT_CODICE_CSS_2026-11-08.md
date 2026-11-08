# Audit codice e CSS — 8 novembre 2026

Ambito: repository `panoramic23/cosaregalo`, branch `main`. Audit sui file sorgente; **non costituisce una verifica visiva del sito pubblicato**.

## Errori reali trovati e corretti

1. **Homepage**: `id="typeGrid"` era usato due volte. Il secondo è stato rinominato `otherTypeGrid` per eliminare collisioni di ancore e selettori DOM.
2. **CSS storico**: sono stati eliminati blocchi di navigazione pre-v7 che reimpostavano gap, font, hover, posizione o barra mobile. I valori effettivi di `--muted`, `--cr-nav-height` e del `body` sono stati raccolti nelle dichiarazioni di base. Rimossi anche i residui del breakpoint del menu a 1080px, perché quello attuale è 1200px.
3. **Regressioni obsolete**: `tests/ui-css-regression.test.mjs` pretendeva H3–H6 a peso 500, benché la regola attuale sia 600. Allineato a Baloo 2 SemiBold.
4. **Test Amazon non aggiornati**: `tests/sitestripe.test.mjs` rifiutava qualunque URL Amazon nell'HTML, anche i 48 collegamenti SiteStripe comunicati dal titolare. Sostituito con controlli di tag, host, struttura link, ASIN/ricerche e corrispondenza alle otto tipologie.
5. **Istruzioni obsolete**: `README.md` indicava solo 24 pagine e il vecchio stato del catalogo. `SITESTRIPE.md` non distingueva link HTML e link API. `LEGGIMI_PRIMA.md` conteneva istruzioni V5/Vercel e ora è segnalato come archivio.

## Verifiche statiche svolte

- 34 documenti HTML (sezioni pubbliche, admin e calendario): H1, ID univoci, immagini con `alt`, collegamenti interni con frammenti. Corretto l'unico ID duplicato riscontrato.
- 30 pagine principali/pubbliche: controllo dei link interni verso gli URL previsti dalla struttura corrente; nessun collegamento a pagine mancanti nel catalogo di percorsi analizzato.
- CSS: sintassi di blocchi e parentesi bilanciata; nessuna variabile `var(--...)` senza definizione; una regola globale canonica per `.nav-bar`.
- H1/H2 a 800, H3–H6 a 600, numeri classifiche gialli `#FFD43D` senza ombra, menu bianco sticky e fascia blu non sticky.
- Parse statico V8: `server.mjs`, `assets/site.js` e file dei test senza errori sintattici di base.
- 12 controlli statici finali superati.

## Test automatici inseriti/aggiornati

- `tests/html-integrity.test.mjs`: H1 e title univoci, id univoci, alt immagini, ancore interne, corrispondenza numeri/schede shopping delle guide.
- `tests/seo.test.mjs`: metadata canonical, dati strutturati, robots e sitemap, redirect puliti, esclusione staging, sicurezza admin.
- `tests/ui-css-regression.test.mjs`: pesi tipografici, menu, caching.
- `tests/sitestripe.test.mjs`: coerenza e legittimità strutturale dei 48 collegamenti indicati dal titolare.

**I test sono stati aggiornati e controllati sintatticamente, ma NON eseguiti con `npm test`**: l'ambiente di questa chat non ha accesso alla checkout locale del repository privato né a una sessione Node su SiteGround. L'ultimo commit non esponeva status CI.

## Punti da verificare / debito tecnico

1. Eseguire `npm test` con Node >=20 nella checkout completa e risolvere eventuali failure di runtime.
2. Completare il deploy SiteGround sul dominio `cosa-regalo.it`. Controllare `/health` e, dopo attivazione `SITE_INDEXABLE=true`, la sitemap e i canonical del dominio definitivo. Il dominio non era raggiungibile dal controllo web in questa sessione.
3. I **48 link SiteStripe** nelle pagine statiche delle tipologie non vengono controllati dall'editor `/admin/`/Redis; la revoca richiede modifica HTML e nuovo deploy. In futuro spostarli in un unico registro di dati verificati.
4. Il CSS conserva sezioni storiche per componenti che potrebbero ancora essere usati. Non vanno eliminate in blocco solo perché il selettore compare più volte: breakpoint, varianti pagina e proprietà parziali possono essere necessari. Un refactoring completo richiede screenshot regression desktop/mobile della versione pubblicata.

## Come completare il collaudo

```sh
npm test
npm start
```

Verificare sul sito reale homepage, menu desktop/mobile, guide, tipologie, immagini, dati strutturati, JSON news, cookie banner e un campione di link SiteStripe. Ripetere dopo ogni deploy.
