// The search engines offered at the first start, in the order the owner decided (14 Nov 2026). Facts only, no opinions.
// Source: general knowledge and the operators' own descriptions; TO CHECK against each operator's policy (docs/proposals/search-engines.md).
// "name" must match the engine's name in config/policies/policies.json (SearchEngines) or the browser's built-in name.
"use strict";
window.KLIN_ENGINES = [
  { name: "Ecosia", preselected: true,
    en: { who: "Ecosia GmbH, Germany", results: "Bing and Google, plus results of its own", money: "Advertising; states that it uses most of its profits to fund tree planting", says: "Collects some data to run the service; states it does not sell it", account: "Not needed" },
    it: { who: "Ecosia GmbH, Germania", results: "Bing e Google, più risultati propri", money: "Pubblicità; dichiara di usare gran parte dei profitti per piantare alberi", says: "Raccoglie alcuni dati per far funzionare il servizio; dichiara di non venderli", account: "Non serve" } },
  { name: "Mojeek",
    en: { who: "Mojeek Ltd, United Kingdom", results: "Its own crawler and index only", money: "Advertising without tracking, and paid access to its data", says: "States it stores no personal data and no search history", account: "Not needed" },
    it: { who: "Mojeek Ltd, Regno Unito", results: "Solo il proprio crawler e indice", money: "Pubblicità senza tracciamento e accesso ai dati a pagamento", says: "Dichiara di non salvare dati personali né cronologia delle ricerche", account: "Non serve" } },
  { name: "DuckDuckGo",
    en: { who: "Duck Duck Go, Inc., United States", results: "Bing, its own crawler and other sources", money: "Advertising (served through Microsoft's advertising network)", says: "States it does not store searches linked to a person", account: "Not needed" },
    it: { who: "Duck Duck Go, Inc., Stati Uniti", results: "Bing, il proprio crawler e altre fonti", money: "Pubblicità (attraverso la rete pubblicitaria di Microsoft)", says: "Dichiara di non salvare ricerche collegate a una persona", account: "Non serve" } },
  { name: "Qwant",
    en: { who: "Qwant, France", results: "Bing and, in growing part, its own index", money: "Advertising", says: "States it does not track or profile users", account: "Not needed" },
    it: { who: "Qwant, Francia", results: "Bing e, in parte crescente, il proprio indice", money: "Pubblicità", says: "Dichiara di non tracciare né profilare gli utenti", account: "Non serve" } },
  { name: "Google",
    en: { who: "Google LLC, United States", results: "Its own index", money: "Advertising", says: "Stores searches; links them to a Google account when signed in; offers settings to limit or delete them", account: "Optional" },
    it: { who: "Google LLC, Stati Uniti", results: "Il proprio indice", money: "Pubblicità", says: "Conserva le ricerche; le collega a un account Google se hai fatto l'accesso; offre impostazioni per limitarle o cancellarle", account: "Facoltativo" } },
  { name: "Brave Search",
    en: { who: "Brave Software, Inc., United States", results: "Its own index, with some partner data", money: "Advertising and an optional paid plan", says: "States it does not track searches", account: "Not needed" },
    it: { who: "Brave Software, Inc., Stati Uniti", results: "Il proprio indice, con alcuni dati di partner", money: "Pubblicità e un piano a pagamento facoltativo", says: "Dichiara di non tracciare le ricerche", account: "Non serve" } }
];
