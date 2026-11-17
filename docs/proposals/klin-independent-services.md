# Proposal – Klin Independent Services (KIS), P42

Status: **accepted by the owner on 17 Nov 2026**, with the corrections below and five decisions. First release (hub + catalogue import) can be built now. Nothing is built yet.
Received 17 Nov 2026 as "Klin Independent Network (KIN) v1.1" (original kept in [`kin-v1.1-original.it.md`](kin-v1.1-original.it.md)); renamed and corrected here as version 1.2.

## What it is, in three lines
An optional module of Klin that helps a person find and open independent, community, federated and self-hosted digital services, from catalogues the person chooses. A directory, not a network and not a provider. Klin runs no server for it.

## Owner decisions (17 Nov 2026)
1. **Name:** Klin Independent Services (KIS). "Network" was dropped because it suggests an infrastructure run by Klin.
2. **Included and on:** KIS ships inside Klin and is on from the first start (toolbar button), and can be turned off or removed with one click. By itself it makes no connection.
3. **First release = hub plus catalogue import** (phases 1 and 2 of the roadmap below, built in two steps, delivered together), because Klin ships no services and an empty list is useless.
4. **Where to find catalogues:** a short list of addresses of public catalogues in the build, each with who maintains it, its licence and a link; one click imports. Nothing active by default; Klin copies no data to a server. Same rule as the third-party lists (`third-party-lists.md`). **Licences of every candidate are still to be checked** before it is offered (candidates to look at, not yet verified: the CHATONS collective directory, Fediverse server lists, Matrix and XMPP server lists).
4b. **Old data:** a card says "checked more than 12 months ago" after 12 months; the number can be changed. It is only a neutral label.
5. **Opening a service:** in a new tab, so the list stays open and instances can be compared.

## Corrections accepted (from the review of v1.1)
1. **Neutrality and the founding principles:** KIS itself makes no judgement. Flags from third-party lists (P34, P35, `CHARTER.md` section 4) appear on a card **only if the user turned that list on**, labelled with the list, its maintainer and its criterion, collapsed, and never hide or block a service. KIS has no list of its own.
2. **"Independent" is not a label.** Anyone can be listed. The hub offers objective filters instead: management model (community, association, personal, commercial), open-source software, federated protocol, self-hosted.
3. **Neutral order:** alphabetical, the user's favourites first. No ranking, no "popular", no paid placement.
4. **Imported catalogues and profiles are untrusted:** only `http` and `https` links; text only (no HTML or Markdown, no remote images or icons, which would track); limits on size and number of entries (1 MB per catalogue, the same limit decided for lists on 14 Nov 2026); structure checked before anything is saved; the real domain always shown and checked with the lookalike warning (P14); a preview of all domains before import. **A profile can never change browser settings** (search engine, home page, proxy, DNS, protocol handlers, permissions, extensions).
5. **No content of its own** (see decision 4).
6. **Technical checks are limited to what a browser can do.** Locally: TLS certificate, third-party domains contacted, IP addresses. Needing an outside service or database, said on screen when used: hosting provider and data-centre country (approximate, like every country rule in `PRINCIPLES.md`) and DNS records other than addresses. Only on request.
7. **Roadmap and acceptance criteria agree:** the first release includes import (decision 3).
8. Smaller: a fixed line on the hub ("Being listed is not an endorsement. A service may have changed, disappeared or be malicious."); signed catalogues need a trust rule (keys chosen by the user, no central authority) written as an ADR **before phase 4**; the catalogue import reuses the list-import ways of `third-party-lists.md` (address, file, shared set) and Community Profiles reuse the shared-set idea (P20) instead of new systems; the assistant is the AI module of phase 3; the "Traffic Controller" in the text means routing rules (P32, ADR 0006).

## Where it fits
- Needs only what exists: local storage (ADR 0003), the lookalike warning, the connections data, the shared style and Italian/English messages (`STYLE.md`).
- Scheduled as an extension like the others (`extensions/independent-services`). Principles served: freedom of choice (3), independence (9), find and leave centralised services.
- Honesty rule: the hub has a visible "what this does not do" (it does not certify, vouch for or host anything; every link goes to a third party who sees your IP address).

## ADRs to write
- Catalogue format and trust rule for signatures (before phase 4).
- Licence check and the list of catalogue addresses (before the first release offers any).

---

# Specifica — Klin Independent Services (KIS) — Versione 1.2

**Stato:** Accettata dal responsabile del progetto (17 nov 2026), con le correzioni elencate sopra  
**Progetto:** Klin Browser  
**Tipologia:** Modulo incluso, acceso di default, disattivabile e rimovibile  
**Obiettivo principale:** Facilitare l'accesso a servizi digitali indipendenti.

---

## 1. Visione e obiettivi

Klin Independent Services (KIS) è un modulo di Klin che facilita la scoperta e l'utilizzo di servizi digitali indipendenti, comunitari, federati e autogestiti.

L'obiettivo è rendere più accessibile un ecosistema digitale alternativo ai servizi centralizzati, senza creare una nuova piattaforma e senza dipendere da infrastrutture gestite dal progetto Klin. KIS è un elenco, non una rete e non un fornitore.

KIS non sostituisce i servizi esistenti, non li ospita e non li amministra. Consente all'utente di individuarli, comprenderne le caratteristiche e raggiungerli direttamente.

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

KIS è una funzionalità aggiuntiva del browser. Non modifica l'identità di Klin, che rimane un browser privacy-first basato su Firefox/Gecko.

Il modulo è **incluso in Klin e acceso dal primo avvio** (pulsante nella barra degli strumenti). Deve poter essere:
- spento o rimosso dall'utente con un clic, senza compromettere il browser;
- utilizzato senza account Klin;
- utilizzato senza AI;
- utilizzato senza cataloghi remoti;
- utilizzato anche con servizi inseriti manualmente.

Da solo non fa nessuna connessione.

---

## 2. Principi progettuali

| Principio | Requisito |
|---|---|
| Accessibilità | Ridurre la difficoltà di trovare e utilizzare servizi indipendenti |
| Apertura | Nessuna selezione preventiva dei servizi ammessi; Klin non include servizi propri |
| Neutralità | KIS non esprime giudizi politici, etici o commerciali sui gestori |
| Ordine neutro | Ordine alfabetico, preferiti dell'utente in cima; nessuna classifica, nessun "più popolari", nessuna posizione a pagamento |
| Verificabilità | Le informazioni indicano fonti e stato di verifica |
| Decentralizzazione | Nessun catalogo centrale obbligatorio |
| Local-first | Preferenze e configurazioni conservate localmente |
| Interoperabilità | Preferenza per protocolli e formati aperti |
| Privacy | Nessuna telemetria o profilazione |
| Consenso | Nessuna attività remota automatica non richiesta |
| Modularità | Funzioni indipendenti e disattivabili |

Il modello organizzativo di Autistici/Inventati è un esempio tra molti. Il catalogo può includere organizzazioni, collettivi, associazioni, cooperative, provider indipendenti, comunità e singoli amministratori. L'appartenenza a una particolare organizzazione non è un requisito di inclusione.

---

## 3. Architettura generale

KIS utilizza i moduli e le funzionalità già disponibili in Klin, senza duplicarne le responsabilità.

### 3.1 Componenti

1. **Services Hub:** interfaccia principale per scoprire e accedere ai servizi.
2. **Infrastructure Directory:** archivio e consultazione dei servizi e delle relative istanze.
3. **Catalog Manager:** importazione e gestione dei cataloghi.
4. **Community Profiles:** raccolte organizzate di servizi.
5. **Service Transparency:** visualizzazione delle informazioni tecniche e organizzative.
6. **Local Assistant:** assistente AI locale facoltativo.

Esportazione, backup e migrazione potranno essere valutati dopo il primo rilascio.

### 3.2 Dipendenze

KIS riutilizza, dove disponibili: Privacy Engine, Security Manager, Connections, regole di instradamento (P32, ADR 0006), Data Manager, Search Intelligence, Automation, AI locale tramite Ollama.

Il primo rilascio dipende solo da ciò che esiste già: archiviazione locale (ADR 0003), avviso sui siti che imitano (P14), dati della pagina Connessioni, stile condiviso e messaggi in italiano e inglese.

KIS non introduce un proprio sistema di gestione delle connessioni, dei permessi o delle credenziali.

---

## 4. Services Hub

Interfaccia principale del modulo: categorie, ricerca, filtri e schede informative.

### 4.1 Categorie

Il catalogo non privilegia nessuna categoria. Categorie iniziali:

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

Le categorie sono estendibili.

### 4.2 Funzioni

- Ricerca per nome e descrizione, per categoria, per paese o area geografica, per software e protocollo.
- Filtri oggettivi: modello di gestione (comunitario, associativo, personale, commerciale), software open source, protocollo federato, auto-gestito. "Indipendente" non è un'etichetta né un filtro: chi decide cosa lo sia è l'utente, scegliendo i filtri.
- Ordine predefinito alfabetico, con i preferiti dell'utente in cima.
- Visualizzazione delle istanze disponibili.
- Apertura diretta del servizio.
- Inserimento manuale di nuovi servizi.
- Gestione dei preferiti e raccolte personali.
- Riga fissa sempre visibile: "Essere nell'elenco non è un'approvazione. Il servizio può essere cambiato, sparito o malevolo."
- Riga "cosa KIS non fa": non certifica, non garantisce, non ospita; ogni collegamento porta a un terzo che vede il tuo indirizzo IP.

### 4.3 Apertura dei servizi

Klin apre il servizio selezionato **in una nuova scheda**, direttamente (in futuro anche in uno spazio di lavoro scelto, quando esisteranno).

Non deve:
- utilizzare proxy proprietari;
- inoltrare le richieste attraverso server Klin;
- richiedere un account Klin;
- raccogliere credenziali;
- modificare il contenuto delle pagine;
- intermediare le comunicazioni tra utente e servizio.

L'apertura rispetta le normali regole di sicurezza, isolamento e permessi del browser.

---

## 5. Infrastructure Directory

Contiene le informazioni sui servizi e sulle rispettive istanze. Il catalogo è aperto: può includere qualsiasi servizio digitale, purché le informazioni siano identificabili e le fonti documentate. L'inclusione non è una certificazione né un'approvazione di Klin.

### 5.1 Scheda servizio

| Campo | Descrizione |
|---|---|
| Nome | Nome del servizio |
| Descrizione | Funzione e caratteristiche |
| Categoria | Categoria di appartenenza |
| URL | Indirizzo del servizio (solo http o https) |
| Software | Piattaforma utilizzata |
| Protocollo | Standard e protocolli supportati |
| Gestore | Soggetto responsabile |
| Paese | Paese dichiarato dal gestore |
| Modello | Comunitario, associativo, commerciale, personale, altro |
| Costi | Gratuito, donazione, abbonamento, altro |
| Registrazione | Libera, su invito, riservata, non specificata |
| Policy | Collegamenti alle policy pubblicate |
| Fonti | Origine delle informazioni |
| Aggiornamento | Data dell'ultima verifica; dopo 12 mesi (modificabile) la scheda dice "controllato più di 12 mesi fa" |

### 5.2 Scheda infrastruttura

Quando disponibili: provider di hosting, paese del data center (approssimato), provider DNS, CDN utilizzate, servizi esterni, infrastrutture di backup, dipendenze tecnologiche, giurisdizioni coinvolte.

Le informazioni distinguono tra dati dichiarati dal gestore, dati osservati e dati verificati tecnicamente.

### 5.3 Neutralità del catalogo

KIS non assegna punteggi di indipendenza, affidabilità etica o valore politico. Mostra dati oggettivi (hosting presso un provider commerciale, gestione da un'associazione, software open source, protocollo federato, policy pubblicata, servizi esterni) e non li trasforma in un giudizio sul gestore.

### 5.4 Marcatori da liste di terzi

KIS non ha liste proprie. Se l'utente ha attivato liste pubbliche di terzi (P34, P35, `CHARTER.md` sezione 4), un servizio può mostrare un marcatore: piccolo, chiuso di default, apribile con un clic, con il nome della lista, chi la cura, il suo criterio e dove contestare. Un marcatore etichetta: non nasconde e non blocca mai un servizio. Senza liste attive non compare nessun marcatore.

---

## 6. Catalog Manager

Permette di usare più cataloghi senza archivio centrale.

### 6.1 Modalità supportate

**Catalogo locale:** servizi inseriti a mano, cataloghi importati, preferiti e raccolte.

**Catalogo pubblico:** cataloghi pubblicati da progetti e organizzazioni, consultati su richiesta, importati selettivamente. Klin mostra una **breve lista di indirizzi di cataloghi pubblici** (chi lo cura, licenza, link), nulla attivo di default e nessun dato copiato su server Klin; le licenze si verificano prima di offrire ciascun catalogo.

**Catalogo comunitario:** cataloghi di associazioni, collettivi e comunità, gestione indipendente da Klin.

**Catalogo federato:** scambio tra cataloghi compatibili, formato aperto, provenienza identificata (fase 4).

Modi di importare (gli stessi delle liste di terzi, `third-party-lists.md`): incollando un indirizzo (solo HTTPS, scarica solo dopo conferma), aprendo un file, scegliendo dalla lista di indirizzi, ricevendo un set condiviso.

### 6.2 Formato dei cataloghi

JSON versionato. Campi minimi: identificativo, nome e descrizione, autore o gestore, versione, data di pubblicazione, servizi inclusi, fonti, licenza dei dati, eventuale firma digitale.

La firma consente di verificare integrità e provenienza, non la veridicità. Regola di fiducia (da scrivere in un ADR prima della fase 4): le chiavi le sceglie l'utente, nessuna autorità centrale; la schermata distingue "non firmato", "firmato con chiave sconosciuta" e "firmato con chiave di cui ti fidi".

### 6.3 Aggiornamenti

Nessun aggiornamento automatico. L'utente può aggiornare a mano, chiedere una verifica, conservare la versione precedente, disattivare o rimuovere un catalogo. Gli aggiornamenti sono visibili e non modificano in silenzio preferiti o configurazioni.

### 6.4 Sicurezza dei contenuti importati

Cataloghi e profili sono **contenuti non attendibili** fino alla validazione:
- solo collegamenti `http` e `https` (mai `javascript:`, `data:`, `file:`, `about:`);
- solo testo: nessun HTML o Markdown, nessuna immagine o icona remota;
- limiti: 1 MB per catalogo, numero massimo di voci definito nel formato;
- struttura controllata prima di salvare qualsiasi cosa; un file non valido viene rifiutato per intero;
- il dominio vero è sempre mostrato e controllato con l'avviso sui siti che imitano (P14);
- anteprima di tutti i domini prima dell'importazione.

---

## 7. Community Profiles

Raccolta di servizi associati a una comunità o organizzazione (sito web, email, chat, videoconferenza, documenti condivisi, forum, archivio). L'utente la importa e vede i servizi in un unico spazio.

### 7.1 Requisiti

- Formato aperto e documentato; importazione esplicita con anteprima dei domini.
- Visualizzazione della provenienza; modificabile in locale.
- Nessuna registrazione, nessuna installazione di estensioni, nessuna concessione di permessi, nessuna esecuzione di codice.
- **Un profilo non può cambiare impostazioni del browser:** motore di ricerca, pagina iniziale, proxy, DNS, gestori di protocolli, permessi, estensioni.

Il profilo descrive servizi e collegamenti: non è un pacchetto eseguibile.

---

## 8. Service Transparency

### 8.1 Informazioni disponibili

Identità del gestore, policy, software, protocolli, data e fonte delle verifiche e:

| Informazione | Come si ottiene |
|---|---|
| Certificato TLS | In locale, dalla connessione che l'utente apre |
| Domini di terze parti contattati | In locale, osservando la pagina aperta (come il registro dei tentativi di raccolta) |
| Indirizzi IP del servizio | In locale |
| Hosting e paese del data center | Richiede un database o un servizio esterno; **approssimato**; detto a schermo quando usato |
| Record DNS oltre agli indirizzi | Richiede una richiesta DNS a un servizio esterno scelto dall'utente; detto a schermo |

### 8.2 Verifiche tecniche

Solo su richiesta dell'utente: raggiungibilità, validità del certificato, domini contattati, confronto tra dichiarato e osservabile. Non sono audit di sicurezza completi. Ogni verifica contatta il servizio (e, se serve, un servizio esterno) con l'indirizzo IP dell'utente, e lo dice.

### 8.3 Provenienza dei dati

Ogni informazione è: dichiarata dal gestore, ricavata da una fonte pubblica, osservata tecnicamente, verificata con un controllo specifico, oppure non disponibile; con la data quando c'è.

---

## 9. Local Assistant

Assistente AI locale facoltativo, tramite il modulo AI di Klin e Ollama (fase 3 del progetto). Non è necessario per usare KIS.

Funzioni: ricerca in linguaggio naturale, ricerca per caratteristiche, confronto tra istanze, spiegazione dei protocolli, interpretazione delle informazioni tecniche, dipendenze dichiarate, alternative, aiuto alla configurazione, preparazione di raccolte e profili.

Vincoli: solo elaborazione locale; nessun invio a servizi AI remoti; nessuna raccolta di conversazioni; nessuna modifica automatica dei cataloghi; nessuna registrazione ai servizi; fonti consultabili; distingue verificato, dichiarato e ipotesi. L'AI suggerisce, non decide al posto dell'utente.

---

## 10. Integrazione con Klin

- **Privacy Engine:** regole privacy, permessi per origine, isolamento dei profili, protezione da tracker.
- **Security Manager:** connessioni, certificati, condizioni tecniche problematiche, credenziali.
- **Connections:** domini contattati, servizi esterni, dipendenze osservate.
- **Search Intelligence:** ricerca nei cataloghi scelti, alternative, filtri per caratteristiche documentate.
- **Data Manager:** archiviazione locale (ADR 0003), raccolte, esportazione e importazione.
- **AI:** assistente locale, analisi, confronto.

---

## 11. Privacy e sicurezza

Requisiti obbligatori: nessun account Klin; nessun server proprietario; nessuna telemetria; nessun tracciamento delle ricerche; nessun polling o sincronizzazione automatica; nessuna comunicazione remota senza un'azione dell'utente; nessun proxy obbligatorio; nessuna raccolta di credenziali; nessuna esecuzione di codice dai cataloghi; nessuna icona o immagine scaricata da siti terzi.

I dati personali e le preferenze restano locali. Cataloghi e profili importati sono non attendibili fino alla validazione (6.4).

---

## 12. Funzionalità escluse dalla prima versione

Hosting e gestione di server; installazione automatizzata di infrastrutture self-hosted; gestione degli account dei servizi; client nativi per chat, email o social network; pagamenti e donazioni integrati; certificazione dei gestori; classificazione etica o politica (i marcatori di liste di terzi del punto 5.4 sono un'altra cosa: scelti dall'utente, di terzi); reputazione centralizzata; migrazione e backup automatici degli account esterni.

---

## 13. Roadmap

**Prima versione = Fasi 1 e 2**, costruite in due passi e consegnate insieme.

**Fase 1 — Services Hub:** interfaccia, categorie, ricerca locale, inserimento manuale, catalogo locale, schede, preferiti, apertura in nuova scheda, ordine neutro, righe fisse.

**Fase 2 — Catalog Manager:** importazione JSON da indirizzo, file o lista di indirizzi, formato documentato, più cataloghi, provenienza, aggiornamento manuale, Community Profiles, validazione e anteprima (6.4).

**Fase 3 — Service Transparency:** schede infrastrutturali, fonti e date, verifiche su richiesta, analisi delle connessioni, dipendenze.

**Fase 4 — Federazione e AI locale:** formato federabile, cataloghi distribuiti, verifica delle firme (dopo l'ADR sulla fiducia), Local Assistant, confronto tra servizi.

**Fase futura — Self-hosting e autonomia:** guide, configurazioni assistite, portabilità, backup e migrazione.

---

## 14. Criteri di accettazione della prima versione

1. L'utente accede al modulo senza creare un account; il pulsante c'è dal primo avvio.
2. Può consultare il catalogo locale.
3. Può inserire a mano un servizio.
4. Può cercare per categoria e nome.
5. Può vedere una scheda informativa, con le righe fisse e "dato vecchio" dopo 12 mesi.
6. Può aprire un servizio in una nuova scheda.
7. Può salvare servizi nei preferiti; l'ordine predefinito è alfabetico con i preferiti in cima.
8. Può importare un catalogo conforme al formato documentato da indirizzo, file o lista di indirizzi; un file non valido, con collegamenti non ammessi o oltre 1 MB viene rifiutato per intero; vede l'anteprima dei domini.
9. Un profilo non cambia nessuna impostazione del browser.
10. Può spegnere o rimuovere il modulo senza compromettere il browser.
11. Il funzionamento non richiede server Klin né comunicazioni remote automatiche: all'avvio non parte nessuna connessione.

---

## 15. Identità del progetto

Klin rimane un browser privacy-first. Klin Independent Services è un modulo che rende più semplice accedere a un ecosistema digitale aperto e diversificato.

Il progetto non deve diventare un provider, un'autorità di certificazione, un social network, un catalogo centralizzato o un intermediario tra utenti e gestori. Il suo ruolo è facilitare la scelta e l'accesso, offrendo strumenti di trasparenza e controllo.

**Principio conclusivo: Klin non deve costruire un Internet alternativo. Deve rendere più facile utilizzare quello indipendente che già esiste.**
