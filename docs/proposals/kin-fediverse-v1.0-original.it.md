<!-- Testo ricevuto dal responsabile del progetto il 17 nov 2026, conservato senza modifiche. Integrato e corretto nella parte 2 di klin-independent-services.md. -->
# KIN — Fediverse Integration
## Specifica funzionale e tecnica
**Progetto:** Klin Browser  
**Modulo:** KIN — Klin Independent Network  
**Versione:** 1.0  
**Stato:** Proposta progettuale

---

## 1. Obiettivo

Integrare il Fediverso in Klin per facilitare la scoperta, la consultazione e l'utilizzo di servizi digitali federati.

Klin deve consentire agli utenti di:
- scoprire piattaforme e istanze del Fediverso;
- confrontare le caratteristiche delle diverse istanze;
- individuare e raggiungere profili federati;
- riconoscere e gestire collegamenti federati;
- esplorare le relazioni tra istanze e piattaforme;
- conservare localmente preferenze e cataloghi;
- utilizzare progressivamente funzionalità federate più avanzate.

L'integrazione deve rispettare i principi generali di Klin: privacy, decentralizzazione, trasparenza, autonomia dell'utente e assenza di infrastrutture proprietarie obbligatorie.

### 1.1 Principio fondamentale

Klin non deve diventare un social network, un'istanza federata o un intermediario della comunicazione.

Deve rendere più semplice utilizzare i servizi indipendenti e federati già esistenti.

---

## 2. Ambito del progetto

L'integrazione è sviluppata all'interno di KIN (Klin Independent Network), come estensione del sistema Open Services Hub.

Non deve diventare un'applicazione autonoma né introdurre dipendenze obbligatorie da servizi esterni gestiti da Klin.

### 2.1 Servizi supportati

Il catalogo deve essere aperto a qualsiasi servizio federato compatibile con i criteri tecnici documentati.

Categorie iniziali:

| Categoria | Software di riferimento |
|---|---|
| Microblogging e social | Mastodon, Pleroma, Misskey, GoToSocial, Friendica |
| Fotografia | Pixelfed |
| Video | PeerTube |
| Comunità e forum | Lemmy |
| Eventi | Mobilizon |
| Libri e lettura | BookWyrm |
| Musica | Funkwhale |
| Blog e pubblicazione | WriteFreely |
| Altri servizi | Qualsiasi progetto federato compatibile |

L'elenco è esemplificativo e non costituisce una whitelist.

La compatibilità deve essere verificata per singolo software, protocollo e funzionalità.

### 2.2 Protocolli e standard

Il sistema deve prevedere un'architettura estendibile, basata principalmente su:

- ActivityPub: protocollo di federazione;
- ActivityStreams 2.0: modello di rappresentazione delle attività;
- WebFinger: risoluzione delle identità federate;
- NodeInfo: informazioni sulle istanze;
- HTTPS/TLS: comunicazioni sicure;
- OAuth 2.0: eventuale autenticazione presso servizi esterni;
- API specifiche delle piattaforme: integrazioni opzionali.

Non si deve presumere che tutte le piattaforme implementino gli stessi protocolli o espongano le stesse funzionalità.

---

## 3. Architettura modulare

Il Fediverse Integration Layer comprende sei componenti.

### 3.1 Fediverse Discovery

Responsabile della scoperta dei servizi federati.

Funzionalità:
- ricerca per nome, categoria e software;
- ricerca di istanze;
- inserimento manuale di domini e indirizzi;
- importazione di cataloghi esterni;
- ricerca tramite cataloghi locali, pubblici e federati;
- filtri per lingua, Paese, registrazioni e caratteristiche tecniche, quando disponibili.

La ricerca non deve dipendere da un motore centralizzato gestito da Klin.

### 3.2 Instance Explorer

Responsabile della visualizzazione delle informazioni sulle istanze.

Ogni scheda deve poter contenere:

| Campo | Descrizione |
|---|---|
| Nome | Nome dell'istanza |
| Dominio | Indirizzo principale |
| Software | Piattaforma utilizzata |
| Versione | Versione dichiarata o rilevata |
| Gestore | Organizzazione o persona responsabile, se pubblica |
| Paese | Paese dichiarato o verificabile |
| Lingue | Lingue supportate |
| Registrazioni | Aperte, chiuse o limitate |
| Policy | Collegamenti alle regole e condizioni |
| Privacy | Collegamento all'informativa |
| Federazione | Informazioni pubbliche sulle relazioni federative |
| Fonti | Origine delle informazioni |
| Verifica | Data e metodo dell'ultima verifica |

Le informazioni devono essere accompagnate dalla relativa provenienza.

Non devono essere presentate come verificate informazioni che derivano esclusivamente dalle dichiarazioni del gestore.

### 3.3 Fediverse Identity Resolver

Responsabile del riconoscimento e della risoluzione delle identità federate.

Deve supportare:

- identificativi `@utente@dominio`;
- indirizzi WebFinger;
- URL di profili federati;
- collegamenti ActivityPub;
- identificazione del software di destinazione, quando possibile.

Flusso previsto:

1. L'utente inserisce un'identità federata.
2. Klin identifica il dominio.
3. Il resolver esegue una richiesta WebFinger, solo quando necessario e autorizzato.
4. Recupera l'eventuale riferimento al profilo.
5. Verifica la coerenza tra dominio richiesto e risorsa restituita.
6. Presenta il risultato all'utente.
7. L'utente sceglie se aprire il profilo.

Il resolver non deve raccogliere o creare rubriche centralizzate di identità.

### 3.4 Fediverse Link Handler

Responsabile del riconoscimento e della gestione dei collegamenti federati.

Funzionalità:
- riconoscimento di URL di profili;
- riconoscimento di post e contenuti federati;
- identificazione della piattaforma di origine;
- apertura nell'istanza di riferimento;
- eventuale proposta di apertura tramite un'altra istanza;
- gestione dei collegamenti provenienti da applicazioni esterne.

Klin non deve riscrivere automaticamente i collegamenti senza informare l'utente.

La gestione dei link deve preservare il comportamento standard del browser.

### 3.5 Federation Explorer

Componente informativo per esplorare l'ecosistema federato.

Deve consentire di visualizzare:
- istanze conosciute;
- software utilizzati;
- protocolli supportati;
- relazioni di federazione pubblicamente osservabili;
- informazioni sulle politiche di blocco;
- dipendenze tecniche conosciute;
- eventuali concentrazioni infrastrutturali.

Le relazioni devono essere distinte in:
- dichiarate dal gestore;
- pubblicate tramite API o protocolli;
- osservate tecnicamente;
- non verificate.

Non deve essere presentato come una mappa completa della federazione: le relazioni possono cambiare, essere parziali o non pubblicamente osservabili.

### 3.6 Fediverse Profiles

Gestione locale delle preferenze e delle istanze.

L'utente può:
- salvare istanze preferite;
- organizzare istanze per categoria;
- aggiungere note personali;
- salvare profili e collegamenti;
- definire istanze predefinite per categoria;
- esportare e importare le proprie preferenze.

I profili non devono contenere codice eseguibile, script, configurazioni automatiche o autorizzazioni implicite.

---

## 4. Livelli di integrazione

Lo sviluppo deve avvenire progressivamente.

### Livello 1 — Discovery

Funzionalità:
- catalogo Fediverso;
- ricerca di software e istanze;
- schede informative;
- inserimento manuale;
- preferiti;
- apertura diretta dei servizi.

Non richiede account o autenticazione.

### Livello 2 — Contextual Integration

Funzionalità:
- riconoscimento delle identità federate;
- risoluzione WebFinger;
- riconoscimento dei link ActivityPub;
- identificazione delle piattaforme;
- apertura contestuale dei profili;
- Federation Explorer;
- informazioni tecniche sulle istanze.

Le operazioni di rete devono essere attivate dall'utente o da un'azione esplicita prevista nelle impostazioni.

### Livello 3 — Native Fediverse Client

Sviluppo futuro, facoltativo e disattivabile.

Possibili funzionalità:
- consultazione di timeline;
- pubblicazione di contenuti;
- risposte e interazioni;
- gestione di notifiche;
- ricerca social;
- gestione di più identità;
- interazione con servizi federati differenti.

Il client deve essere modulare e basato sulle API e sui protocolli effettivamente disponibili.

Non deve essere considerato una funzionalità della prima versione.

---

## 5. Autenticazione e gestione delle identità

Klin non deve creare un'identità federata propria.

Gli account rimangono associati alle rispettive istanze.

### 5.1 Principi

- Nessun account Klin.
- Nessun database centralizzato di identità.
- Nessuna raccolta di password.
- Nessuna sincronizzazione automatica degli account.
- Nessuna condivisione delle credenziali tra istanze.
- Autorizzazioni OAuth specifiche per ogni servizio.
- Token conservati localmente e protetti.
- Permessi minimi necessari.

### 5.2 Autenticazione futura

Per il Livello 3:
- utilizzare OAuth quando supportato;
- richiedere autorizzazioni granulari;
- mostrare i permessi richiesti prima dell'autorizzazione;
- permettere la revoca delle autorizzazioni;
- isolare le credenziali per dominio e servizio;
- non trasferire token tra istanze.

---

## 6. Cataloghi e distribuzione delle informazioni

Il sistema deve riutilizzare il modello cataloghi già previsto da KIN.

Sono previste tre modalità.

### 6.1 Catalogo locale

- Creato e gestito dall'utente.
- Nessuna dipendenza esterna.
- Inserimento manuale.
- Importazione ed esportazione.

### 6.2 Catalogo pubblico/comunitario

- Distribuito da comunità e organizzazioni indipendenti.
- Consultabile tramite URL scelti dall'utente.
- Non gestito necessariamente da Klin.
- Aggiornato esclusivamente su richiesta.

### 6.3 Catalogo federato

- Cataloghi distribuiti da più soggetti.
- Possibilità di importare cataloghi da altre comunità.
- Nessun catalogo centrale obbligatorio.
- Possibilità di combinare più fonti.

### 6.4 Formato tecnico

Formato JSON versionato.

Campi minimi:

- identificativo;
- nome;
- versione del catalogo;
- autore o gestore;
- data di pubblicazione;
- licenza;
- elenco dei servizi;
- categorie;
- domini;
- software;
- protocolli;
- fonti;
- data delle informazioni.

Le firme digitali possono essere utilizzate per verificare integrità e provenienza.

Una firma valida non dimostra la correttezza delle informazioni pubblicate.

---

## 7. Privacy e sicurezza

La sicurezza deve essere integrata nell'architettura, non aggiunta successivamente.

### 7.1 Comunicazioni

- HTTPS obbligatorio per le richieste verso servizi esterni.
- Nessuna trasmissione non necessaria di dati.
- Nessun proxy Klin.
- Nessun server di intermediazione Klin.
- Nessuna telemetria obbligatoria.
- Nessun polling automatico.
- Nessuna connessione periodica non richiesta.

### 7.2 Isolamento

Ogni istanza deve essere considerata un'origine indipendente.

Non devono essere condivisi automaticamente:
- cookie;
- token;
- credenziali;
- dati di sessione;
- autorizzazioni;
- informazioni personali.

### 7.3 Protezione dalle istanze malevole

Il sistema deve considerare potenzialmente non affidabili le informazioni provenienti dai cataloghi e dalle istanze.

Prevedere:
- validazione degli URL;
- protezione contro SSRF;
- blocco degli schemi non ammessi;
- verifica dei redirect;
- protezione contro risposte eccessivamente grandi;
- limiti di richieste;
- sanitizzazione dei contenuti;
- prevenzione di attacchi XSS;
- controllo dei certificati TLS.

Le richieste di verifica tecnica devono essere limitate a operazioni informative e non devono trasformarsi in scansioni indiscriminate delle reti.

### 7.4 Gestione dei contenuti

I contenuti federati sono dati non attendibili.

Klin deve:
- non eseguire codice proveniente da post o profili;
- isolare i contenuti esterni;
- evitare caricamenti automatici di risorse di terze parti quando non necessari;
- applicare le protezioni standard del browser;
- non modificare o pubblicare contenuti senza autorizzazione.

---

## 8. Integrazione con i moduli esistenti di Klin

Il Fediverse Integration Layer deve riutilizzare i moduli già previsti dall'architettura.

| Modulo Klin | Integrazione |
|---|---|
| KIN / Open Services Hub | Catalogo e accesso ai servizi |
| Privacy Engine | Protezione delle comunicazioni |
| Security Manager | Validazione e gestione dei rischi |
| Connections | Analisi delle connessioni verso istanze |
| Traffic Controller | Regole di traffico e routing disponibili |
| Search Intelligence | Ricerca di servizi e profili |
| Data Manager | Conservazione locale dei dati |
| AI Module | Ricerca e spiegazione facoltativa |
| Extension Manager | Eventuali integrazioni aggiuntive |

Non devono essere introdotti moduli duplicati quando una funzionalità è già disponibile nel core di Klin.

---

## 9. AI locale

L'AI locale, tramite Ollama o altro runtime supportato da Klin, può assistere l'utente.

Funzionalità previste:
- ricerca di istanze per esigenze specifiche;
- confronto tra piattaforme;
- spiegazione delle differenze tra protocolli;
- interpretazione delle informazioni tecniche;
- sintesi delle policy pubblicate;
- individuazione di informazioni mancanti;
- suggerimenti di servizi alternativi.

L'AI deve distinguere chiaramente dati verificati, dichiarazioni e inferenze.

Non deve:
- assegnare punteggi politici o reputazionali;
- classificare automaticamente un'istanza come sicura;
- effettuare registrazioni;
- autorizzare applicazioni;
- pubblicare contenuti;
- modificare impostazioni senza consenso.

Nessun contenuto deve essere inviato a servizi AI remoti.

---

## 10. Interfaccia utente

Il Fediverse Hub deve essere accessibile dalla sezione KIN.

Sezioni principali:

1. Discover — scoperta di servizi e istanze.
2. Instances — catalogo e schede delle istanze.
3. Profiles — profili federati salvati.
4. Federation — esplorazione delle relazioni.
5. Collections — cataloghi e raccolte personali.
6. Settings — preferenze e autorizzazioni.

### 10.1 Scheda di un'istanza

Deve mostrare:
- nome e dominio;
- software;
- categoria;
- descrizione;
- gestore;
- informazioni sulle registrazioni;
- policy e privacy;
- fonti;
- data delle ultime verifiche;
- pulsante per aprire il servizio;
- possibilità di aggiungere ai preferiti.

Le informazioni mancanti devono essere indicate come non disponibili, senza deduzioni automatiche.

### 10.2 Scheda di un profilo

Deve mostrare:
- nome visualizzato;
- identificativo federato;
- dominio;
- URL del profilo originale;
- piattaforma riconosciuta;
- informazioni pubbliche disponibili.

Il profilo deve poter essere aperto direttamente sul servizio originale.

---

## 11. Requisiti non funzionali

| Requisito | Specifica |
|---|---|
| Modularità | Modulo indipendente e disattivabile |
| Privacy | Nessuna telemetria obbligatoria |
| Local-first | Preferenze e cataloghi locali |
| Autonomia | Nessuna infrastruttura Klin obbligatoria |
| Compatibilità | Estendibile a nuove implementazioni |
| Prestazioni | Nessuna attività periodica non richiesta |
| Portabilità | Esportazione e importazione dei dati |
| Accessibilità | Compatibilità con le linee guida di accessibilità del browser |
| Manutenibilità | Componenti separati e documentati |
| Sicurezza | Principio del minimo privilegio |

---

## 12. Roadmap

### Fase 1 — Fediverse Discovery
**Obiettivo:** rendere accessibile il Fediverso.

- Catalogo locale.
- Categorie e ricerca.
- Schede dei servizi.
- Inserimento manuale.
- Preferiti.
- Apertura diretta delle istanze.
- Importazione di cataloghi JSON.

### Fase 2 — Identity & Link Resolution
**Obiettivo:** riconoscere e gestire i collegamenti federati.

- WebFinger.
- Identità federate.
- Riconoscimento dei profili.
- Riconoscimento dei link.
- Fediverse Link Handler.

### Fase 3 — Federation Explorer
**Obiettivo:** migliorare la comprensione dell'ecosistema.

- NodeInfo.
- Informazioni tecniche.
- Relazioni federative osservabili.
- Policy e fonti.
- Verifiche su richiesta.

### Fase 4 — Local Intelligence
**Obiettivo:** integrare la ricerca assistita.

- AI locale.
- Ricerca semantica.
- Confronto tra istanze.
- Spiegazione dei protocolli.
- Suggerimenti contestuali.

### Fase 5 — Native Fediverse Client
**Obiettivo:** valutare un'esperienza federata integrata.

- API specifiche.
- OAuth.
- Timeline.
- Pubblicazione.
- Interazioni.
- Gestione di più identità.

La Fase 5 richiede una specifica autonoma e una valutazione della manutenzione necessaria per supportare piattaforme differenti.

---

## 13. Criteri di accettazione MVP

La prima versione è considerata completa quando:

- [ ] L'utente può aprire Fediverse Hub.
- [ ] Può consultare un catalogo locale.
- [ ] Può cercare servizi per categoria e nome.
- [ ] Può inserire manualmente un'istanza.
- [ ] Può visualizzare la scheda di un servizio.
- [ ] Può aprire direttamente l'istanza.
- [ ] Può salvare e rimuovere preferiti.
- [ ] Può importare ed esportare cataloghi.
- [ ] Può disattivare completamente il modulo.
- [ ] Non è necessario creare un account Klin.
- [ ] Non vengono introdotte connessioni automatiche non richieste.
- [ ] Non viene introdotto un server centrale Klin.
- [ ] Non vengono raccolti dati di navigazione o credenziali social.

---

## 14. Esclusioni dalla prima versione

Non rientrano nell'MVP:

- client social unificato;
- pubblicazione di post;
- gestione delle timeline;
- notifiche federate;
- gestione centralizzata degli account;
- hosting di istanze;
- proxy o relay;
- sincronizzazione automatica;
- catalogo centrale obbligatorio;
- sistemi di rating o certificazione;
- moderazione centralizzata;
- scansioni automatiche delle istanze.

Queste funzionalità potranno essere valutate separatamente.

---

## 15. Principi di sviluppo

L'implementazione deve rispettare le seguenti regole:

1. Riutilizzare l'architettura e i moduli già presenti in Klin.
2. Evitare duplicazioni di funzionalità.
3. Non introdurre dipendenze cloud proprietarie.
4. Separare le operazioni locali dalle richieste verso servizi esterni.
5. Documentare ogni comunicazione di rete.
6. Rendere esplicite le autorizzazioni richieste.
7. Utilizzare standard aperti quando disponibili.
8. Prevedere compatibilità progressiva con implementazioni differenti.
9. Mantenere il modulo disattivabile senza compromettere il browser.
10. Non trasformare Klin in un soggetto che controlla o gestisce il Fediverso.

## 16. Visione finale

Il Fediverso deve essere una parte integrante dell'ecosistema di servizi indipendenti accessibili attraverso Klin.

L'utente deve poter scegliere liberamente:
- quale piattaforma utilizzare;
- quale istanza preferire;
- quale identità utilizzare;
- quali informazioni condividere;
- quali connessioni autorizzare;
- quali servizi mantenere nel proprio ambiente locale.

**Klin non deve centralizzare il Fediverso. Deve rendere più semplice esplorarlo, comprenderlo e utilizzarlo, preservandone la natura distribuita.**
