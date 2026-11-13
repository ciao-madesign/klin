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
- **Free expression.** Klin may label or down-rank a source only through a third-party list the user turned on, with the reason shown. It never silently hides or blocks one, and it is not the author of the lists.

## 4. Lists and flags (P33, P34, P35)
Applies to every list that labels or ranks sources: source quality, the ethics list, entity data.

### 4.1 Klin is not the censor
Klin does not write these lists, review their entries or decide what is true or acceptable. It uses **public lists made by third parties, as published and unchanged**. What a list says is that list's judgement, not Klin's.

### 4.2 What the user sees and controls
- **The user chooses** which lists are on, can add any other public list, and can turn all of them off.
- **Every flag says where it comes from:** the name of the list, who maintains it, its own published criterion and a link. It is collapsed by default and one click away (`STYLE.md`, section 3).
- **A flag labels. It never hides or blocks.** If a result is ranked lower because of a list the user turned on, the user sees that and why.
- **Nothing is on without the user knowing what it is.** Which lists, if any, are on by default is the owner's decision. **[to confirm]**

### 4.3 What Klin checks, and what it does not
Klin offers a catalogue of lists and checks only technical things: the list is public, its licence allows use, the format can be read, a maintainer is named. It does not judge the content. **[to confirm]** Anyone can ask for a list to be added by opening a public issue.
- Klin records the origin, licence, version and date of every list it offers.
- Lists are downloaded only from the maintainers' own published location, and only if the user has turned the update on. Klin does not copy them to a server of its own: it runs none. Any new download is a network connection and needs its own written decision (ADR).

### 4.4 Mistakes and objections
A wrong or unfair entry is the list maintainer's to fix. The flag shows who that is and where to write. Klin does not arbitrate between a list and the people it names. The user can switch the list off at any time.

## 5. What the charter does not do
- It does not promise that any list is complete or that any source is judged correctly: the lists are third-party and Klin does not vouch for them.
- It does not make Klin a censor and it does not decide what is acceptable. It never blocks reading; at most it shows what a list the user chose says.
- It does not claim that open source means safe: security depends on configuration and maintenance.
- It does not cover Greenweb, which is a separate project with its own principles, even though the two share the same ideas about local data and honest numbers.

## 6. Changing the charter
Until a wider governance exists, only the owner approves a change. Every change is public, dated and gives its reason. The public line of section 2 changes only with the owner's explicit decision.

## 7. Open decisions for the owner
1. Approve or edit this draft, and say what goes into public text beyond the line of section 2.
2. Which lists, if any, are on by default (section 4.2).
3. Whether the catalogue of lists is limited to the technical checks of section 4.3, as proposed.
4. Candidate public lists to offer, with their licences: still to survey (legal bans, media-ownership and independence observatories).
