# Google Privacy & Messaging — CMP certificata per CosaRegalo

**Stato tecnico:** codice di integrazione predisposto su GitHub.  
**Stato della certificazione:** la certificazione appartiene alla CMP **Google Privacy & Messaging**, non al codice CosaRegalo.  
**Stato di attivazione:** DISATTIVATA fino a pubblicazione del messaggio in AdSense e impostazione delle variabili d'ambiente.

## Perché Google Privacy & Messaging

Per i publisher AdSense che mostrano annunci personalizzati a utenti SEE, Regno Unito e Svizzera, Google richiede una CMP certificata e integrata con IAB TCF. La soluzione nativa di Google **Privacy & Messaging** è certificata. La versione corrente dei messaggi per regolamenti europei supporta IAB TCF v2.4.

Riferimenti ufficiali:
- https://support.google.com/adsense/answer/13554116?hl=it
- https://support.google.com/adsense/answer/10960768?hl=it
- https://developers.google.com/funding-choices/fc-api-docs?hl=it

## Configurazione necessaria nell'account AdSense

1. Accedere a https://www.google.com/adsense/ .
2. Inserire e verificare **cosa-regalo.it** nell'account AdSense corretto.
3. Aprire **Privacy e messaggi → Regolamenti europei → Crea messaggio**.
4. Selezionare **cosa-regalo.it**, la Privacy policy del dominio, la lingua italiana e, se desiderato, il logo.
5. Rendere disponibili le opzioni **Consenti / Non consentire / Gestisci opzioni**, e configurare fornitori e finalità nel messaggio.
6. Verificare che il messaggio sia **pubblicato**.
7. Per i primi test, **disattivare gli annunci automatici** di AdSense. Le unità pubblicitarie manuali restano controllate da `ADS_MODE`.
8. Se si utilizzano altri Google tag (GA4 o Google Ads), configurare **Consent Mode** nell'interfaccia di Privacy e messaggi, verificando le scelte di tracciamento.
9. Verificare che l'account AdSense usato nel tag coincida con quello che ha pubblicato il messaggio.

La Google CMP potrebbe non comparire sul dominio temporaneo `sg-host.com` perché la pubblicazione del messaggio è associata ai siti selezionati nell'account. Collaudare sul dominio definitivo o su un dominio esplicitamente registrato e supportato nell'account.

## Configurazione Node.js su SiteGround

Impostare nel progetto **variabili d'ambiente server-side**:

```env
ADSENSE_CLIENT=ca-pub-IL_TUO_ID_REALE
CMP_PROVIDER=google
GOOGLE_CMP_PUBLISHED=true
ADS_MODE=off
```

`ADSENSE_CLIENT` è l'identificativo pubblico dell'account AdSense. Sostituire il segnaposto con il codice reale. Non attivare la Google CMP prima che il messaggio sia pubblicato in AdSense.

Con i tre requisiti attivi (provider `google`, messaggio pubblicato, client AdSense valido), CosaRegalo:
- Carica nell'HTML il tag AdSense ufficiale, che può avviare la CMP certificata pubblicata nell'account.
- **Non mostra il precedente banner personalizzato**: un unico gestore del consenso.
- Il link **Preferenze cookie** riapre il messaggio tramite l'API ufficiale `googlefc.showRevocationMessage()`.
- Sospende i contatori statistici proprietari `/api/track` fino a integrazione del consenso per uso proprio nella CMP. In questo modo evita di attribuire arbitrariamente un consenso all'analisi.
- Mantiene disattivati gli spazi banner finché `ADS_MODE=off`. Il tag AdSense necessario al messaggio è comunque caricato (per questo si raccomanda di tenere gli annunci automatici OFF).

Dopo il collaudo della CMP e le verifiche privacy, per attivare annunci in posizioni manuali:

```env
ADS_MODE=adsense
ADSENSE_SLOT_HOME_TOP=ID_UNITA_REALE
ADSENSE_SLOT_HOME_MIDDLE=ID_UNITA_REALE
ADSENSE_SLOT_ARTICLE_INLINE=ID_UNITA_REALE
ADSENSE_SLOT_SITE_BOTTOM=ID_UNITA_REALE
```

Gli slot sono facoltativi. Non sono disponibili annunci se il sito o l'account non risultano approvati. Il codice attende il segnale di disponibilità IAB TCF prima di inizializzare le unità e lascia a Google la decisione su quali annunci sono consentiti.

## Test indispensabili

- Aprire il sito in una nuova sessione, **da una località nel SEE**, senza precedenti consensi: deve comparire **solo il messaggio di Google**, non il banner CosaRegalo.
- Verificare che «Non consentire» e «Gestisci opzioni» siano operative e che il consenso produca una stringa TCF gestita da Google.
- Nel footer scegliere «Preferenze cookie»: deve riaprire il messaggio Google.
- Controllare in DevTools che non parta il tracciamento proprietario `/api/track` nella modalità Google CMP.
- Inizialmente lasciare `ADS_MODE=off`; verificare che non siano create le unità banner manuali.
- Solo dopo i test e l'approvazione AdSense attivare le unità e verificare il comportamento di consenso/rifiuto.
- Il blocco di eventuali altri script di terze parti non integrati nel codice (tag aggiunti manualmente, widget esterni, immagini affiliate) richiede verifica specifica.

## Note legali importanti

La certificazione Google **non garantisce automaticamente la conformità al GDPR**. Occorrono i dati del titolare, una cookie policy adeguata, l'elenco dei fornitori reali e l'esame delle modalità di conservazione e trasferimento dati.

Il precedente sistema personalizzato rimane disponibile solo in modalità `CMP_PROVIDER=custom`, quando la CMP Google non è attivata, ma **non è una CMP certificata** e non deve essere usato per pubblicare annunci personalizzati AdSense nel SEE, UK o Svizzera.

**Non affermare mai che la CMP di CosaRegalo sia certificata autonomamente da Google.** CosaRegalo integra una soluzione CMP di Google già certificata, una volta pubblicata nel relativo account.
