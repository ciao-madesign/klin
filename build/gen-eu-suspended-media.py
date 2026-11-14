#!/usr/bin/env python3
"""Make data/lists/eu-suspended-media.json: the outlets whose broadcasting is suspended in the EU (Annex XV of
Council Regulation (EU) No 833/2014, introduced by Regulation 2022/350 and amended since), with their web domains.

    gen-eu-suspended-media.py [--celex 02014R0833-YYYYMMDD] [--from-file CONSOLIDATED.xhtml]

Source: the consolidated text of Regulation 833/2014 from the Publications Office of the EU (Cellar, the official
machine-readable service; EUR-Lex itself refuses scripts). With no --celex it uses the latest consolidated version. Build time only; Klin
makes no connection for this at run time. Klin follows the annex as published: it adds or removes no outlet.
The annex lists outlets, not web addresses: the domains come from build/data/eu-suspended-media-domains.json,
which is marked UNVERIFIED. The script lists outlets that have no domain entry and exits with an error if there are any
unless --allow-unmapped is given. It stores the sha256 of the annex text, so a later change in the annex is visible.
"""
import datetime, hashlib, html, json, pathlib, re, sys, urllib.parse, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[1]
MAP = ROOT / "build/data/eu-suspended-media-domains.json"
OUT = ROOT / "data/lists/eu-suspended-media.json"
CELLAR = "https://publications.europa.eu"
UA = {"User-Agent": "klin-build"}

class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k): return None

def latest_celex():
    q = ('PREFIX cdm: <http://publications.europa.eu/ontology/cdm#> SELECT ?c WHERE { ?w cdm:resource_legal_id_celex ?c . '
         'FILTER(STRSTARTS(STR(?c),"02014R0833")) } ORDER BY DESC(?c) LIMIT 1')
    req = urllib.request.Request(CELLAR + "/webapi/rdf/sparql?" + urllib.parse.urlencode({"query": q}),
                                 headers={**UA, "Accept": "application/sparql-results+json"})
    return json.load(urllib.request.urlopen(req, timeout=60))["results"]["bindings"][0]["c"]["value"]

def fetch_text(celex):
    """The Cellar answers a CELEX address with a redirect (to http://: turned into https://) to the document."""
    hdr = {**UA, "Accept": "application/xhtml+xml", "Accept-Language": "eng"}
    opener = urllib.request.build_opener(NoRedirect)
    try:
        opener.open(urllib.request.Request(CELLAR + "/resource/celex/" + celex, headers=hdr), timeout=60)
        raise RuntimeError("expected a redirect for " + celex)
    except urllib.error.HTTPError as e:
        if e.code not in (301, 302, 303): raise
        url = e.headers["Location"].replace("http://", "https://", 1)
    return urllib.request.urlopen(urllib.request.Request(url, headers=hdr), timeout=300).read().decode("utf-8"), url

def parse_annex(xhtml):
    """Outlets of Annex XV in order, each with the regulation that inserted it (None for the first group)."""
    start = re.search(r'<p class="title-annex-1"[^>]*>\s*ANNEX XV\s*</p>', xhtml)
    if not start: raise RuntimeError("Annex XV not found")
    nxt = re.search(r'<p class="title-annex-1"', xhtml[start.end():])
    body = xhtml[start.end(): start.end() + nxt.start()] if nxt else xhtml[start.end():]
    outlets, marker = [], None
    for m in re.finditer(r'<div class="list">(.*?)</div>|<p class="modref">.*?title="(\d+R\d+)[^"]*".*?</p>', body, re.S):
        if m.group(1) is not None:
            name = html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", m.group(1)))).strip()
            if name: outlets.append({"name": name, "inserted_by": marker})
        else:
            marker = m.group(2)
    return outlets, body

def main(argv):
    celex = argv[argv.index("--celex") + 1] if "--celex" in argv else None
    if "--from-file" in argv:
        xhtml, url = pathlib.Path(argv[argv.index("--from-file") + 1]).read_text(encoding="utf-8"), "file"
        celex = celex or "from-file"
    else:
        celex = celex or latest_celex()
        xhtml, url = fetch_text(celex)
    outlets, body = parse_annex(xhtml)
    domains = {k: v for k, v in json.loads(MAP.read_text()).items() if not k.startswith("_")}
    for o in outlets:
        o["domains"] = domains.get(o["name"], [])
    unmapped = [o["name"] for o in outlets if not o["domains"]]
    print("%d outlets in Annex XV of %s" % (len(outlets), celex))
    if unmapped:
        print("NO DOMAIN ENTRY for: " + "; ".join(unmapped))
    result = {
        "source": "Council Regulation (EU) No 833/2014, Annex XV (Article 2f), consolidated text",
        "celex": celex, "document": url,
        "annex_sha256": hashlib.sha256(re.sub(r"\s+", " ", body).encode()).hexdigest(),
        "generated": datetime.date.today().isoformat(),
        "domains_status": "UNVERIFIED: see build/data/eu-suspended-media-domains.json",
        "outlets": outlets,
        "domains": sorted({d for o in outlets for d in o["domains"]}),
    }
    if "--stdout" in argv:
        print(json.dumps(result, indent=2, ensure_ascii=False))
    else:
        OUT.parent.mkdir(parents=True, exist_ok=True)
        OUT.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
        print("wrote", OUT)
    if unmapped and "--allow-unmapped" not in argv:
        sys.exit(1)

if __name__ == "__main__":
    main(sys.argv)
