// The DNS services offered in the second step of the first-start flow. DRAFT: the sentences come from
// docs/proposals/dns-resolvers.md and have NOT been checked against the operators' primary documents.
// The step is hidden until KLIN_DNS_READY is true; setting it is the job of whoever completes that check (and the wiring of the choice).
"use strict";
window.KLIN_DNS_READY = false;
window.KLIN_DNS = [
  { id: "quad9", name: "Quad9",
    en: "Swiss non-profit foundation. It says it does not log the sites you look up. No independent examination of that claim was found.",
    it: "Fondazione svizzera senza scopo di lucro. Dichiara di non registrare i siti che cerchi. Non è stato trovato un controllo indipendente su questa promessa." },
  { id: "mullvad", name: "Mullvad DNS",
    en: "Run by a Swedish VPN company. It says it keeps no log; its servers run in memory; an outside firm examined the service, according to Mullvad.",
    it: "Gestito da un'azienda svedese di VPN. Dichiara di non tenere registri; i server lavorano in memoria; secondo Mullvad, una ditta esterna ha controllato il servizio." },
  { id: "cloudflare", name: "Cloudflare 1.1.1.1",
    en: "Large US company. An accounting firm examines its privacy promises every year, but it **does keep sampled logs** for some weeks and anonymises addresses after about a day. Fast and widely used; it also concentrates a great deal of traffic in one company.",
    it: "Grande azienda statunitense. Una società di revisione controlla ogni anno le sue promesse sulla privacy, ma **tiene registri a campione** per alcune settimane e rende anonimi gli indirizzi dopo circa un giorno. Veloce e molto usata; concentra molto traffico in una sola azienda." },
  { id: "current", name: "Keep your current one", nameIt: "Tieni quello di adesso",
    en: "As now: your internet provider or the Wi-Fi network sees which sites you look up, usually in clear text, and often keeps a record. Nothing changes and no new service is involved.",
    it: "Come adesso: il tuo provider internet o la rete Wi-Fi vede quali siti cerchi, di solito in chiaro, e spesso li registra. Non cambia nulla e non entra nessun nuovo servizio." },
];
