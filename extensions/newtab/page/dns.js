// The DNS services offered in the second step of the first-start flow. Sentences checked against the operators' own
// pages on 23 Nov 2026 (docs/proposals/dns-resolvers.md). Mullvad's public DNS was discontinued on 2 Nov 2026, so it is gone.
// The step stays hidden until KLIN_DNS_READY is true: the owner still has to decide the list (Mullvad is gone) and the choice is not yet wired to DoH.
"use strict";
window.KLIN_DNS_READY = false;
window.KLIN_DNS = [
  { id: "quad9", name: "Quad9",
    en: "Swiss foundation. Its policy says it does not collect or record the network addresses of its users. It counts how often each site is looked up, without linking it to anyone. We found no independent examination of these promises.",
    it: "Fondazione svizzera. La sua politica dice che non raccoglie né registra gli indirizzi di rete di chi la usa. Conta quante volte viene cercato ogni sito, senza collegarlo a nessuno. Non abbiamo trovato un controllo indipendente su queste promesse." },
  { id: "cloudflare", name: "Cloudflare 1.1.1.1",
    en: "Large US company. Its policy says it does not sell your data or use it for advertising, and that it deletes the **limited logs of lookups within 25 hours** and does not store your full network address (only a tiny random sample of network packets, at most 0.05%, is kept for troubleshooting). A large accounting firm examined these promises and published a report. It also concentrates a great deal of traffic in one company.",
    it: "Grande azienda statunitense. La sua politica dice che non vende i tuoi dati né li usa per la pubblicità, che cancella i **registri limitati delle ricerche entro 25 ore** e che non conserva il tuo indirizzo di rete completo (solo un piccolissimo campione casuale di pacchetti, al massimo lo 0,05%, resta per risolvere problemi). Una grande società di revisione ha controllato queste promesse e ha pubblicato un rapporto. Concentra anche molto traffico in una sola azienda." },
  { id: "current", name: "Keep your current one", nameIt: "Tieni quello di adesso",
    en: "As now: your internet provider or the Wi-Fi network sees which sites you look up, usually in clear text, and often keeps a record. Nothing changes and no new service is involved.",
    it: "Come adesso: il tuo provider internet o la rete Wi-Fi vede quali siti cerchi, di solito in chiaro, e spesso li registra. Non cambia nulla e non entra nessun nuovo servizio." },
];
