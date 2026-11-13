# Klin charter

Status: **draft for the owner's approval** (proposal P36). It is built only from what the owner has already stated in `PRINCIPLES.md` and `STYLE.md`. Parts marked **[to confirm]** are proposals, not decisions. Nothing here goes into the specification or into public text until the owner approves it.

## 1. What Klin is for
Klin is a free browser for people who want to be free and independent. It makes tracking harder, tells you what is happening, and lets you leave out the companies, countries and sources you do not want. It never decides for you in secret.

## 2. The values
Public line, exact wording (decided 13 Nov 2026, closed by the owner):

> Freedom, independence, equality, brotherhood and ecology.
> Libertà, indipendenza, uguaglianza, fratellanza ed ecologia.

It appears on the welcome page and in this charter, nowhere else. Everyday screens talk about functions, not ideals (`STYLE.md`, section 3).

### Founding principles, as stated by the owner
These nine are the working principles behind the line. They are recorded as stated; their audit is in `PRINCIPLES.md`.
1. Privacy first, anonymity by default where possible.
2. Freedom from the algorithm.
3. Freedom of choice: route traffic, exclude countries, services and companies.
4. Find your own fingerprints and erase them.
5. Aliases between the digital world and identity.
6. Immunity from influence.
7. Penalise sources tied to unacceptable spheres (for example neo-fascist organisations).
8. An ethical approach, with low ecological impact.
9. Promote freedom, fraternity, independence, equality, rejection of regimes, antifascism and freedom of expression.

Whether anything beyond the line of section 2 appears in public text is the owner's decision. **[to confirm]**

## 3. Rules the product keeps
These are already in force in the project; the charter makes them binding.
- **Honesty.** Every feature says what it does not do. Klin never promises anonymity it cannot deliver: it makes you harder to follow, it does not make you anonymous.
- **No account, no cloud, no telemetry, no advertising, no subscription.** Anything that talks to the network needs a written decision (ADR).
- **Local first.** Your data stays on your device. Klin runs no relay and no server of its own.
- **The user decides.** Klin states, the user chooses. Defaults are explained and can be changed. The default level is Standard.
- **Order of priority.** Privacy first, then low impact, then security. When they conflict, privacy wins and the cost (energy, speed) is declared.
- **Open source.** Code and documentation are public, with licences checked before any component is included.
- **Free expression.** Klin may label and down-rank a source, with a reason the user can read. It never silently hides or blocks one.

## 4. Lists and flags (P33, P34, P35)
Applies to every list that labels or ranks sources: source quality, the ethics list, entity data.

### 4.1 What an entry must have
- **What it is:** the site, company or organisation, named exactly.
- **The criterion** it meets, taken from a published criterion, not from opinion.
- **The source** of each fact, with a date, so anyone can check it.
- **Where it came from:** the public list it was adapted from, and that list's licence.
- **Who proposed it, who reviewed it, and when.**

### 4.2 What an entry may not be
- A judgement that cannot be checked. Entries are limited to documented, verifiable facts. A wrong label can be defamation, so unverifiable claims stay out.
- About a private person. **[to confirm]**: entries cover organisations, companies and sites, not individuals.
- A silent block. A flagged source is labelled and, if ranked lower, the user sees that and why.

### 4.3 Who maintains the lists **[to confirm]**
Proposal: the maintainers named in the repository review changes in public, in the open issue tracker. A new entry or a removal needs **two reviewers** who did not propose it. Until a wider group exists, the owner is the final reviewer. The names of reviewers are public.

### 4.4 How an entry is challenged **[to confirm]**
- Anyone can challenge an entry by opening a public issue that names the entry. No account on any Klin service is needed, because there is none.
- The challenge is answered in public, with the criterion and the source, **within 30 days**.
- If the criterion or the source cannot be shown, the entry is removed. A removed entry is recorded in the change log with the reason.
- An entry is rechecked **every 12 months**, or sooner if challenged.

### 4.5 What the user can always do
- See the flag, its criterion and its source, collapsed by default and one click away (`STYLE.md`, section 3).
- Switch a list off, or edit it locally.
- Export the lists. Every change is versioned and public.

## 5. What the charter does not do
- It does not promise that every list is complete or that every source is judged correctly.
- It does not make Klin a censor. It never blocks reading, it labels.
- It does not claim that open source means safe: security depends on configuration and maintenance.
- It does not cover Greenweb, which is a separate project with its own principles, even though the two share the same ideas about local data and honest numbers.

## 6. Changing the charter
Until a wider governance exists, only the owner approves a change. Every change is public, dated and gives its reason. The public line of section 2 changes only with the owner's explicit decision.

## 7. Open decisions for the owner
1. Approve or edit this draft, and say what goes into public text beyond the line of section 2.
2. Reviewers and the final say on lists (section 4.3).
3. Time limits for answering challenges and rechecking entries (section 4.4): 30 days and 12 months are proposals.
4. Whether entries about individuals are allowed (section 4.2): the draft says no.
5. Candidate public lists to start from, with their licences: still to survey (legal bans, media-ownership and independence observatories).
