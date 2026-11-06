# Social e pubblicità: configurazione su SiteGround GoGeek

Questa versione NON carica AdSense o CJ automaticamente: `ADS_MODE=off` resta la configurazione predefinita. L'header mostra le icone social in posizione discreta, non cliccabili finché non si impostano gli URL.

## Social in fascia alta
Aggiungi nelle variabili d'ambiente del progetto Node.js in SiteGround gli indirizzi ufficiali:

```env
SOCIAL_INSTAGRAM_URL=https://www.instagram.com/NOME_PROFILO/
SOCIAL_TIKTOK_URL=https://www.tiktok.com/@NOME_PROFILO
SOCIAL_PINTEREST_URL=https://www.pinterest.com/NOME_PROFILO/
```

Sono link esemplificativi: sostituisci NOME_PROFILO con il profilo reale. I link vengono validati lato server per i tre domini social e aperti in una nuova scheda. Salvare e riavviare il progetto Node.js per applicare le nuove variabili.

## Modalità pubblicitaria
Solo una rete è attiva per volta: `ADS_MODE=off`, `ADS_MODE=adsense` oppure `ADS_MODE=cj`.

Spazi predisposti:

| Spazio | Posizione |
| --- | --- |
| home-top | Dopo il blocco trova-regalo in homepage |
| home-middle | Dopo la seconda sezione editoriale in homepage |
| article-inline | Nel corpo delle pagine interne, dopo la prima sezione utile |
| site-bottom | Prima del footer su tutte le pagine |

Gli spazi rimangono **completamente invisibili** se il sistema pubblicitario è disattivato o non configurato.

### Google AdSense
Configura solo identificativi pubblici ricevuti da AdSense, non password o chiavi segrete.

```env
ADS_MODE=adsense
ADSENSE_CLIENT=ca-pub-1234567890123456
ADSENSE_SLOT_HOME_TOP=1234567890
ADSENSE_SLOT_HOME_MIDDLE=2345678901
ADSENSE_SLOT_ARTICLE_INLINE=3456789012
ADSENSE_SLOT_SITE_BOTTOM=4567890123
```

I numeri sono **esempi**. Ogni slot deve essere creato e approvato nel proprio account. Il codice Google viene caricato dal browser solo dopo il consenso separato alla pubblicità.

**IMPORTANTE (UE/SEE):** Prima di attivare AdSense per visitatori dello Spazio economico europeo, del Regno Unito o della Svizzera, integrare una CMP certificata da Google, compatibile con le sue esigenze di raccolta del consenso (incluso IAB TCF, quando richiesto). Il banner custom attuale è una base tecnica e **non equivale a una CMP Google certificata**. Per questa ragione lasciare `ADS_MODE=off` fino al collaudo della soluzione CMP e delle policy aggiornate.

### CJ (Commission Junction)
Carica un creativo HTML/image approvato dalla campagna CJ e ricava i suoi veri URL (landing/tracking e immagine).

```env
ADS_MODE=cj
CJ_BANNER_LINK=https://LINK-DI-TRACCIAMENTO-FORNITO-DA-CJ
CJ_BANNER_IMAGE=https://URL-IMMAGINE-FORNITA-DA-CJ
CJ_BANNER_ALT=Offerta pubblicitaria
```

Gli URL sono **segnaposto**, non link validi. Entrambi devono iniziare con HTTPS. Il sistema usa la stessa creatività in tutti gli spazi; prima di attivarla verificare le dimensioni, le regole del programma e l'informativa privacy. Anche le immagini di CJ vengono caricate solo dopo l'autorizzazione alla pubblicità.

## Privacy e test

La preferenza di consenso è salvata in localStorage come `cosaregalo-consent-v2`, con due valori indipendenti: `statistics` e `marketing`. Le vecchie preferenze solo statistiche vengono trasferite **senza** accettazione implicita della pubblicità. Le opzioni facoltative sono inizialmente disabilitate.

In fase di test:
1. Con `ADS_MODE=off`, verifica che i banner non compaiano.
2. Con il consenso pubblicitario negato, verifica che il browser non richieda risorse da Google AdSense o da CJ.
3. Con una modalità pubblicitaria configurata e consenso accettato, verifica le risorse richieste e gli spazi.
4. Revoca il consenso dal footer. La revoca nasconde gli annunci e impedisce ulteriori inserimenti effettuati dal codice; **non cancella** gli eventuali cookie già impostati da terzi.
5. Non mettere online le pubblicità prima di completare gli obblighi di informativa, l'eventuale CMP certificata e le condizioni dei programmi pubblicitari.

Non utilizzare codici di incorporamento arbitrari nel pannello: vengono accettati soltanto gli URL e gli ID documentati. Le variabili devono essere impostate in SiteGround e non direttamente nei file GitHub.
