<!-- Testo ricevuto dal responsabile del progetto il 17 nov 2026, conservato senza modifiche. Superato dalla versione 1.2 (klin-independent-services.md). -->
# Klin Independent Network (KIN)
## Specifica esplorativa — Versione 1.1

**Stato:** Proposta  
**Progetto:** Klin Browser  
**Tipologia:** Modulo opzionale  
**Obiettivo principale:** Facilitare l'accesso a servizi digitali indipendenti.

---

## 1. Visione e obiettivi

Klin Independent Network (KIN) è un modulo opzionale di Klin che facilita la scoperta e l'utilizzo di servizi digitali indipendenti, comunitari, federati e autogestiti.

L'obiettivo è rendere più accessibile un ecosistema digitale alternativo ai servizi centralizzati, senza creare una nuova piattaforma proprietaria e senza introdurre dipendenze da infrastrutture gestite dal progetto Klin.

KIN non deve sostituire i servizi esistenti, ospitarli o amministrarli. Deve consentire all'utente di individuarli, comprenderne le caratteristiche e raggiungerli direttamente.

### 1.1 Obiettivi specifici

- Facilitare la ricerca di servizi digitali indipendenti.
- Rendere accessibili servizi pubblici, comunitari, federati e self-hosted.
- Consentire la scelta tra diverse istanze dello stesso servizio.
- Fornire informazioni verificabili sui gestori e sulle infrastrutture.
- Organizzare i servizi attraverso categorie, preferiti e profili comunitari.
- Consentire l'importazione di cataloghi esterni.
- Supportare cataloghi locali, pubblici e federati.
- Integrare facoltativamente un assistente AI completamente locale.

### 1.2 Ambito

KIN è una funzionalità aggiuntiva del browser.

Non modifica l'identità principale di Klin, che rimane un browser privacy-first basato su Firefox/Gecko.

Il modulo deve poter essere:
- installato o disinstallato separatamente;
- attivato o disattivato dall'utente;
- utilizzato senza account Klin;
- utilizzato senza AI;
- utilizzato senza cataloghi remoti;
- utilizzato anche con servizi inseriti manualmente.

---

## 2. Principi progettuali

| Principio | Requisito |
|---|---|
| Accessibilità | Ridurre la difficoltà di trovare e utilizzare servizi indipendenti |
| Apertura | Nessuna selezione preventiva dei servizi ammessi |
| Neutralità | Nessun giudizio politico, etico o commerciale sui gestori |
| Verificabilità | Le informazioni devono indicare fonti e stato di verifica |
| Decentralizzazione | Nessun catalogo centrale obbligatorio |
| Local-first | Preferenze e configurazioni conservate localmente |
| Interoperabilità | Preferenza per protocolli e formati aperti |
| Privacy | Nessuna telemetria o profilazione |
| Consenso | Nessuna attività remota automatica non richiesta |
| Modularità | Funzioni indipendenti e disattivabili |

Il modello organizzativo di Autistici/Inventati è un esempio tra molti. Il catalogo deve poter includere organizzazioni, collettivi, associazioni, cooperative, provider indipendenti, comunità e singoli amministratori.

L'appartenenza a una particolare organizzazione non costituisce un requisito di inclusione.

---

## 3. Architettura generale

KIN utilizza i moduli e le funzionalità già disponibili in Klin, evitando di duplicarne le responsabilità.

### 3.1 Componenti

1. **Services Hub:** interfaccia principale per scoprire e accedere ai servizi.
2. **Infrastructure Directory:** archivio e consultazione dei servizi e delle relative istanze.
3. **Catalog Manager:** importazione e gestione dei cataloghi.
4. **Community Profiles:** raccolte organizzate di servizi.
5. **Service Transparency:** visualizzazione delle informazioni tecniche e organizzative.
6. **Local Assistant:** assistente AI locale facoltativo.

Le funzionalità di esportazione, backup e migrazione potranno essere valutate successivamente, senza costituire requisiti del primo rilascio.

### 3.2 Dipendenze

KIN deve riutilizzare, ove disponibili:

- Privacy Engine;
- Security Manager;
- Connections;
- Traffic Controller;
- Data Manager;
- Search Intelligence;
- Automation;
- AI locale tramite Ollama.

KIN non deve introdurre un proprio sistema di gestione delle connessioni, dei permessi o delle credenziali se tali responsabilità sono già coperte dal core di Klin.

---

## 4. Services Hub

Il Services Hub è l'interfaccia principale del modulo.

Permette di esplorare servizi digitali attraverso categorie, ricerca, filtri e schede informative.

### 4.1 Categorie

Il catalogo non deve privilegiare una particolare categoria.

Categorie iniziali:

- Email e comunicazione;
- Chat e messaggistica;
- Social network;
- Blog e pubblicazione;
- Hosting e siti web;
- Mailing list e forum;
- Videoconferenza;
- Archiviazione e cloud;
- File sharing;
- Collaborazione e documenti;
- Streaming e contenuti multimediali;
- Ricerca e informazione;
- Servizi comunitari;
- Altri servizi digitali.

Le categorie devono essere estendibili.

### 4.2 Funzioni

- Ricerca per nome e descrizione.
- Ricerca per categoria.
- Ricerca per paese o area geografica.
- Ricerca per software e protocollo.
- Filtri per modello di gestione e tipologia di servizio.
- Visualizzazione delle istanze disponibili.
- Apertura diretta del servizio.
- Inserimento manuale di nuovi servizi.
- Gestione dei preferiti.
- Organizzazione dei servizi in raccolte personali.

### 4.3 Apertura dei servizi

Klin deve aprire direttamente il servizio selezionato.

Non deve:
- utilizzare proxy proprietari;
- inoltrare le richieste attraverso server Klin;
- richiedere un account Klin;
- raccogliere credenziali;
- modificare il contenuto delle pagine;
- intermediare le comunicazioni tra utente e servizio.

L'apertura deve rispettare le normali regole di sicurezza, isolamento e gestione dei permessi del browser.

---

## 5. Infrastructure Directory

L'Infrastructure Directory contiene le informazioni sui servizi e sulle rispettive istanze.

Il catalogo è aperto: può includere qualsiasi servizio digitale, purché le informazioni siano identificabili e le fonti siano documentate.

L'inclusione non costituisce una certificazione o un'approvazione da parte di Klin.

### 5.1 Scheda servizio

Campi previsti:

| Campo | Descrizione |
|---|---|
| Nome | Nome del servizio |
| Descrizione | Funzione e caratteristiche |
| Categoria | Categoria di appartenenza |
| URL | Indirizzo del servizio |
| Software | Piattaforma utilizzata |
| Protocollo | Standard e protocolli supportati |
| Gestore | Soggetto responsabile |
| Paese | Paese dichiarato dal gestore |
| Modello | Comunitario, associativo, commerciale, personale, altro |
| Costi | Gratuito, donazione, abbonamento, altro |
| Registrazione | Libera, su invito, riservata, non specificata |
| Policy | Collegamenti alle policy pubblicate |
| Fonti | Origine delle informazioni |
| Aggiornamento | Data dell'ultima verifica |

### 5.2 Scheda infrastruttura

Quando disponibili, possono essere registrate informazioni aggiuntive:

- provider di hosting;
- paese del data center;
- provider DNS;
- CDN utilizzate;
- servizi esterni;
- infrastrutture di backup;
- dipendenze tecnologiche;
- giurisdizioni coinvolte.

Le informazioni devono distinguere tra dati dichiarati dal gestore, dati osservati e dati verificati tecnicamente.

### 5.3 Neutralità del catalogo

KIN non assegna punteggi di indipendenza, affidabilità etica o valore politico.

Può mostrare dati oggettivi, ad esempio:
- hosting presso un provider commerciale;
- gestione da parte di un'associazione;
- software open source;
- supporto a un protocollo federato;
- policy pubblicata;
- presenza di servizi esterni.

Non deve trasformare questi dati in un giudizio sintetico sul gestore.

---

## 6. Catalog Manager

Il Catalog Manager permette di utilizzare più cataloghi senza dipendere da un archivio centrale.

### 6.1 Modalità supportate

**Catalogo locale**
- Servizi inseriti manualmente.
- Cataloghi importati dall'utente.
- Preferiti e raccolte personali.

**Catalogo pubblico**
- Cataloghi pubblicati da progetti e organizzazioni.
- Consultazione su richiesta.
- Importazione selettiva delle informazioni.

**Catalogo comunitario**
- Cataloghi mantenuti da associazioni, collettivi e comunità.
- Possibilità di distribuire profili di servizi.
- Gestione indipendente da Klin.

**Catalogo federato**
- Scambio di informazioni tra cataloghi compatibili.
- Formato aperto e interoperabile.
- Identificazione della provenienza delle informazioni.

### 6.2 Formato dei cataloghi

Si propone un formato JSON versionato.

Campi minimi:

- identificativo del catalogo;
- nome e descrizione;
- autore o gestore;
- versione;
- data di pubblicazione;
- servizi inclusi;
- fonti delle informazioni;
- licenza dei dati;
- eventuale firma digitale.

La firma digitale consente di verificare l'integrità e la provenienza del catalogo, ma non garantisce la veridicità delle informazioni.

### 6.3 Aggiornamenti

Nessun aggiornamento automatico obbligatorio.

L'utente può:
- aggiornare manualmente un catalogo;
- richiedere una verifica;
- scegliere se conservare la versione precedente;
- disattivare un catalogo;
- rimuovere un catalogo importato.

Gli aggiornamenti devono essere visibili e non devono modificare silenziosamente preferiti o configurazioni personali.

---

## 7. Community Profiles

Un Community Profile è una raccolta di servizi associati a una comunità o organizzazione.

Esempio:

Una comunità può pubblicare un profilo contenente:
- sito web;
- servizio email;
- chat;
- videoconferenza;
- documenti condivisi;
- forum;
- archivio di contenuti.

L'utente può importare il profilo in Klin e visualizzare i servizi organizzati in un unico spazio.

### 7.1 Requisiti

- Formato aperto e documentato.
- Importazione esplicita.
- Visualizzazione della provenienza.
- Possibilità di modificare il profilo localmente.
- Nessuna registrazione automatica.
- Nessuna installazione automatica di estensioni.
- Nessuna concessione automatica di permessi.
- Nessuna esecuzione di codice contenuto nel profilo.

Il profilo descrive servizi e collegamenti. Non deve essere un pacchetto eseguibile.

---

## 8. Service Transparency

Questo componente visualizza informazioni tecniche e organizzative sui servizi.

### 8.1 Informazioni disponibili

- Identità del gestore;
- policy pubblicate;
- software utilizzato;
- protocolli supportati;
- certificato TLS;
- domini di terze parti contattati;
- informazioni DNS;
- hosting dichiarato o identificato;
- dipendenze infrastrutturali;
- data e fonte delle verifiche.

### 8.2 Verifiche tecniche

Le verifiche devono essere eseguite esclusivamente su richiesta dell'utente.

Esempi:
- controllo della raggiungibilità;
- validità del certificato TLS;
- verifica dei record DNS;
- rilevazione dei domini contattati;
- confronto tra informazioni dichiarate e dati tecnici osservabili.

Le verifiche non devono essere presentate come audit di sicurezza completi.

### 8.3 Provenienza dei dati

Ogni informazione deve essere classificabile come:

- dichiarata dal gestore;
- ricavata da una fonte pubblica;
- osservata tecnicamente;
- verificata tramite un controllo specifico;
- non disponibile.

Quando possibile, deve essere indicata la data della verifica.

---

## 9. Local Assistant

KIN può integrare un assistente AI locale tramite il modulo AI di Klin e Ollama.

L'assistente è facoltativo e non deve essere necessario per utilizzare il Services Hub.

### 9.1 Funzioni

- Ricerca in linguaggio naturale.
- Ricerca di servizi per caratteristiche.
- Confronto tra istanze.
- Spiegazione dei protocolli.
- Interpretazione delle informazioni tecniche.
- Individuazione delle dipendenze dichiarate.
- Suggerimenti per servizi alternativi.
- Aiuto nella configurazione e nell'utilizzo dei servizi.
- Preparazione di raccolte personali e Community Profiles.

### 9.2 Vincoli

- Elaborazione esclusivamente locale.
- Nessun invio di dati a servizi AI remoti.
- Nessuna raccolta di conversazioni.
- Nessuna modifica automatica dei cataloghi.
- Nessuna registrazione o iscrizione automatica ai servizi.
- Fonti e dati utilizzati devono essere consultabili.
- L'assistente deve distinguere informazioni verificate, dichiarazioni e ipotesi.

L'AI può suggerire, ma non deve decidere quale servizio utilizzare al posto dell'utente.

---

## 10. Integrazione con Klin

KIN deve essere integrato nel browser attraverso le API e i moduli già previsti.

### 10.1 Privacy Engine

- Applicazione delle regole privacy.
- Gestione delle autorizzazioni per origine.
- Isolamento dei profili.
- Protezione da tracker e contenuti indesiderati.

### 10.2 Security Manager

- Verifica delle connessioni.
- Gestione dei certificati.
- Segnalazione di condizioni tecniche problematiche.
- Protezione delle credenziali.

### 10.3 Connections

- Visualizzazione dei domini contattati.
- Identificazione dei servizi esterni.
- Analisi delle dipendenze osservate.

### 10.4 Search Intelligence

- Ricerca nei cataloghi selezionati.
- Ricerca di servizi alternativi.
- Possibilità di filtrare i risultati per caratteristiche documentate.

### 10.5 Data Manager

- Archiviazione locale dei cataloghi.
- Gestione delle raccolte.
- Esportazione e importazione delle configurazioni.

### 10.6 AI

- Accesso all'assistente locale.
- Analisi delle informazioni disponibili.
- Ricerca e confronto dei servizi.

---

## 11. Privacy e sicurezza

Requisiti obbligatori:

- Nessun account Klin.
- Nessun server proprietario obbligatorio.
- Nessuna telemetria.
- Nessun tracciamento delle ricerche.
- Nessun polling automatico.
- Nessuna sincronizzazione automatica.
- Nessuna comunicazione remota senza un'azione dell'utente.
- Nessun proxy obbligatorio.
- Nessuna raccolta di credenziali.
- Nessuna esecuzione di codice proveniente dai cataloghi.

I dati personali e le preferenze devono rimanere locali.

I cataloghi e i profili importati devono essere trattati come contenuti non attendibili fino alla loro validazione strutturale.

---

## 12. Funzionalità escluse dalla prima versione

Non fanno parte del primo rilascio:

- hosting di servizi;
- gestione di server;
- installazione automatizzata di infrastrutture self-hosted;
- gestione degli account dei servizi esterni;
- client nativi per chat, email o social network;
- sistema di pagamento;
- sistema di donazioni integrato;
- certificazione dei gestori;
- classificazione etica o politica;
- sistema centralizzato di reputazione;
- migrazione automatizzata dei dati;
- backup automatico degli account esterni.

Queste funzioni potranno essere valutate in futuro, senza modificare la natura di KIN.

---

## 13. Roadmap

### Fase 1 — Services Hub

Obiettivo: rendere possibile la scoperta e l'accesso ai servizi.

- Interfaccia Services Hub.
- Categorie.
- Ricerca locale.
- Inserimento manuale.
- Catalogo locale.
- Schede dei servizi.
- Preferiti.
- Apertura diretta dei servizi.

### Fase 2 — Catalog Manager

Obiettivo: rendere possibile l'utilizzo di cataloghi indipendenti.

- Importazione JSON.
- Formato catalogo documentato.
- Gestione di più cataloghi.
- Provenienza delle informazioni.
- Aggiornamento manuale.
- Community Profiles.

### Fase 3 — Service Transparency

Obiettivo: migliorare la comprensione dei servizi.

- Schede infrastrutturali.
- Fonti e date.
- Verifiche tecniche su richiesta.
- Analisi delle connessioni.
- Informazioni sulle dipendenze.

### Fase 4 — Federazione e AI locale

Obiettivo: ampliare l'interoperabilità e semplificare la ricerca.

- Formato federabile.
- Cataloghi distribuiti.
- Verifica delle firme.
- Local Assistant.
- Ricerca in linguaggio naturale.
- Confronto tra servizi.

### Fase futura — Self-hosting e autonomia

Da valutare dopo il consolidamento del browser.

- Guide al self-hosting.
- Configurazioni assistite.
- Supporto all'installazione di servizi.
- Strumenti di portabilità.
- Backup e migrazione.

---

## 14. Criteri di accettazione

La prima versione di KIN può essere considerata funzionante quando:

1. L'utente può accedere al modulo senza creare un account.
2. Può consultare il catalogo locale.
3. Può inserire manualmente un servizio.
4. Può cercare per categoria e nome.
5. Può visualizzare una scheda informativa.
6. Può aprire direttamente un servizio.
7. Può salvare servizi nei preferiti.
8. Può importare un catalogo conforme al formato documentato.
9. Può disattivare il modulo senza compromettere il browser.
10. Il funzionamento non richiede server Klin né comunicazioni remote automatiche.

---

## 15. Identità del progetto

Klin rimane un browser privacy-first.

Klin Independent Network è un modulo che rende più semplice accedere a un ecosistema digitale aperto e diversificato.

Il progetto non deve diventare:
- un provider;
- un'autorità di certificazione;
- un social network;
- un catalogo centralizzato;
- un intermediario tra utenti e gestori.

Il suo ruolo è facilitare la scelta e l'accesso, offrendo strumenti di trasparenza e controllo.

**Principio conclusivo: Klin non deve costruire un Internet alternativo. Deve rendere più facile utilizzare quello indipendente che già esiste.**
